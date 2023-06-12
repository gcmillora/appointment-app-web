import { useContext, useEffect, useLayoutEffect } from "react";
import AuthContext from "../context/auth-context";
import React from "react";
import {
  ActionIcon,
  Button,
  Group,
  Modal,
  Text,
  TextInput,
} from "@mantine/core";
import { DataTable } from "mantine-datatable";
import { IconEdit, IconTrash } from "@tabler/icons-react";
import CreateApp from "../components/createApp";
import { DatePickerInput, TimeInput } from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import moment from "moment";
export default function AppPage() {
  const auth = useContext(AuthContext);
  const [appointments, setAppointments] = React.useState<any[]>([]);
  useLayoutEffect(() => {
    fetchAppointments();
  }, []);

  function fetchAppointments() {
    console.log(auth.token);
    console.log(auth.userId);
    fetch(" http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
        query{
          appointments(id:"${auth.userId}"){
            _id
            comments
            fromDate
            toDate
            createdBy{
                email
            }
          }
      }
            `,
      }),
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Failed to fetch!");
        }
        return res.json();
      })
      .then((res) => {
        const data = res.data.appointments;
        setAppointments(data);
      });
  }

  function formSubmit(formData: any, token: string) {
    console.log(formData);
    let fromDate = new Date(formData.selectedDate);
    let time = formData.fromDate.split(":");
    let fromHrs = time[0];
    let fromMins = time[1];
    fromDate.setHours(fromHrs, fromMins);

    let toDate = new Date(formData.selectedDate);
    let toTime = formData.toDate.split(":");
    let toHrs = toTime[0];
    let toMins = toTime[1];
    toDate.setHours(toHrs, toMins);

    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        query: `
        mutation{
          createAppointment(appointmentInput:{comments:"${formData.comments}",fromDate:"${fromDate}", toDate: "${toDate}" } ){
            _id  
            comments
            fromDate
            toDate
              createdBy{
                  email
  
              }
          }
      }
        `,
      }),
    })
      .then((res) => {
        if (res.status !== 200 && res.status !== 201) {
          throw new Error("Failed!");
        }
        return res.json();
      })
      .then((res) => {
        const data = res.data;
        const updatedAppointments: any[] = [...appointments];
        const obj = {
          _id: data.createAppointment._id,
          comments: data.createAppointment.comments,
          fromDate: data.createAppointment.fromDate,
          toDate: data.createAppointment.toDate,
        };
        updatedAppointments.push(obj);
        setAppointments(updatedAppointments);
        return { appointments: updatedAppointments };
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const [opened, { open, close }] = useDisclosure(false);
  const form = useForm({
    initialValues: {
      patient: "",
      selectedDate: new Date(),
      fromDate: "",
      toDate: "",
      comments: "",
    },
    validate: {
      toDate: (value, values) => {
        return value < values.fromDate ? "Error too small" : null;
      },
    },
  });

  return (
    <div className="flex-col justify-items-center mt-12 gap-2">
      <div className="flex flex-row justify-center">
        <div className="flex flex-row justify-between w-3/4">
          <div>
            <Text>Filter Range</Text>
          </div>
          <div>
            <div>
              <Modal
                opened={opened}
                onClose={close}
                title="Create Appointment"
                className="font-sans"
              >
                <form
                  onSubmit={form.onSubmit((values) =>
                    formSubmit(values, auth.token)
                  )}
                >
                  <TextInput
                    label="Patient Name"
                    placeholder="Juan Dela Cruz"
                    required
                    {...form.getInputProps("patient")}
                  />
                  <DatePickerInput
                    dropdownType="modal"
                    minDate={new Date()}
                    valueFormat="DD MMM YYYY"
                    label="Appointment Date"
                    placeholder="Pick date and time"
                    maw={400}
                    mx="auto"
                    excludeDate={(date) => date.getDay() === 0}
                    required
                    {...form.getInputProps("selectedDate")}
                  />
                  <TimeInput
                    mx="auto"
                    label="From"
                    required
                    {...form.getInputProps("fromDate")}
                  />
                  <TimeInput
                    mx="auto"
                    label="To"
                    {...form.getInputProps("toDate")}
                  />
                  <TextInput
                    label="Comments"
                    placeholder="i.e. Fever"
                    required
                    {...form.getInputProps("comments")}
                  />
                  <Group align="end">
                    <Button type="submit">Submit </Button>
                  </Group>
                </form>
              </Modal>
              <Button onClick={open} className="">
                Create
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row justify-center mt-2">
        <div className="w-3/4">
          <DataTable
            withBorder
            withColumnBorders
            borderRadius="sm"
            striped
            highlightOnHover
            records={appointments}
            columns={[
              {
                accessor: "patient",
                title: "Patient",
                textAlignment: "center",
                width: "240px",
              },
              {
                accessor: "comments",
              },
              {
                accessor: "fromDate",
                title: "From",
                render: ({ fromDate }) => {
                  var date = new Date(parseInt(fromDate));
                  const from = moment(date).format(
                    "dddd, MMMM Do YYYY hh:mm A"
                  );
                  return from;
                },
              },
              {
                accessor: "toDate",
                title: "To",
                render: ({ toDate }) => {
                  var date = new Date(parseInt(toDate));
                  const from = moment(date).format(
                    "dddd, MMMM Do YYYY hh:mm A"
                  );
                  return from;
                },
              },
              {
                accessor: "actions",
                title: <Text mr="xs">Actions</Text>,
                textAlignment: "center",
                width: "100px",
                render: (appointment) => {
                  return (
                    <Group spacing={4} position="center" noWrap>
                      <ActionIcon
                        color="blue"
                        onClick={() => console.log("edit")}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => console.log("delete")}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  );
                },
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
