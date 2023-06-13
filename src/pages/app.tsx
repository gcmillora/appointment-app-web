import { useContext, useEffect, useLayoutEffect, useState } from "react";
import AuthContext from "../context/auth-context";
import React from "react";
import { closeModal, openModal } from "@mantine/modals";
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
import {
  DatePicker,
  DatePickerInput,
  DatesRangeValue,
  TimeInput,
} from "@mantine/dates";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import moment from "moment";
import dayjs from "dayjs";
import { modals } from "@mantine/modals";
const PAGE_SIZE = 15;

export default function AppPage() {
  const [page, setPage] = useState(1);
  const [birthdaySearchRange, setBirthdaySearchRange] =
    useState<DatesRangeValue>();
  const auth = useContext(AuthContext);
  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [records, setRecords] = React.useState<any[]>([]);

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(appointments.slice(from, to));
    setBirthdaySearchRange(undefined);
  }, [page]);

  useEffect(() => {
    setRecords(
      appointments.filter((appointment) => {
        console.log(birthdaySearchRange);

        if (
          birthdaySearchRange &&
          birthdaySearchRange[0] &&
          birthdaySearchRange[1] &&
          (dayjs(birthdaySearchRange[0]).isAfter(
            new Date(parseInt(appointment.fromDate)),
            "day"
          ) ||
            dayjs(birthdaySearchRange[1]).isBefore(
              new Date(parseInt(appointment.fromDate)),
              "day"
            ))
        ) {
          console.log("not in range");
          return false;
        }
        return true;
      })
    );
  }, [birthdaySearchRange]);

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
            patient
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
        setRecords(data);
      });
  }

  function isOverlapping(app: any) {
    for (const appointment of appointments) {
      const fromDate = new Date(parseInt(appointment.fromDate));
      const toDate = new Date(parseInt(appointment.toDate));

      if (app.fromDate < toDate && app.toDate > fromDate) {
        return true;
      }
    }
    return false;
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

    const dates = {
      fromDate: fromDate,
      toDate: toDate,
    };

    if (!isOverlapping(dates)) {
      fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          query: `
        mutation{
          createAppointment(appointmentInput:{patient: "${formData.patient}",comments:"${formData.comments}",fromDate:"${fromDate}", toDate: "${toDate}" } ){
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
          setAppointments(
            updatedAppointments.sort((a, b) => {
              const dateA = new Date(parseInt(a.fromDate)).getTime();
              const dateB = new Date(parseInt(b.fromDate)).getTime();
              return dateA - dateB;
            })
          );
          setRecords(updatedAppointments);
          return {
            appointments: updatedAppointments,
          };
        })
        .catch((err) => {
          console.log(err);
        });
    } else console.log("Overlapping schedule");
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

  const editForm = useForm({
    initialValues: {
      editpatient: "",
      editselectedDate: new Date(),
      editfromDate: "",
      edittoDate: "",
      editcomments: "",
    },
    validate: {
      edittoDate: (value, values) => {
        return value < values.editfromDate ? "Error too small" : null;
      },
    },
  });

  function editSubmit(formData: any, token: string) {
    console.log(formData);
    let fromDate = new Date(formData.editselectedDate);
    let time = formData.editfromDate.split(":");
    let fromHrs = time[0];
    let fromMins = time[1];
    fromDate.setHours(fromHrs, fromMins);

    let toDate = new Date(formData.editselectedDate);
    let toTime = formData.edittoDate.split(":");
    let toHrs = toTime[0];
    let toMins = toTime[1];
    toDate.setHours(toHrs, toMins);

    const dates = {
      fromDate: fromDate,
      toDate: toDate,
    };

    if (!isOverlapping(dates)) {
      fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          query: `
        mutation{
          updateAppointment(appointmentInput:{patient: "${formData.editpatient}",comments:"${formData.editcomments}",fromDate:"${fromDate}", toDate: "${toDate}" } ){
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
            _id: data.updateAppointment._id,
            comments: data.updateAppointment.comments,
            fromDate: data.updateAppointment.fromDate,
            toDate: data.updateAppointment.toDate,
          };
          updatedAppointments.push(obj);
          setAppointments(
            updatedAppointments.sort((a, b) => {
              const dateA = new Date(parseInt(a.fromDate)).getTime();
              const dateB = new Date(parseInt(b.fromDate)).getTime();
              return dateA - dateB;
            })
          );
          setRecords(updatedAppointments);
          return {
            appointments: updatedAppointments,
          };
        })
        .catch((err) => {
          console.log(err);
        });
    } else console.log("Overlapping schedule");
  }

  const editApp = (appointment: any) => {
    console.log("sd");
    modals.open({
      modalId: "update",
      title: "Update Appointment",

      children: (
        <div className="">
          <TextInput label="ID" value={appointment._id} disabled />

          <TextInput
            label=" Name"
            placeholder="Juan Dela Cruz"
            required
            {...editForm.getInputProps("editpatient")}
          />
          <DatePickerInput
            minDate={new Date()}
            valueFormat="DD MMM YYYY"
            label="Appointment Date"
            placeholder="Pick date and time"
            maw={400}
            mx="auto"
            excludeDate={(date) => date.getDay() === 0}
            required
            {...editForm.getInputProps("editselectedDate")}
          />
          <TimeInput
            mx="auto"
            label="From"
            required
            {...editForm.getInputProps("editfromDate")}
          />
          <TimeInput
            mx="auto"
            label="To"
            {...editForm.getInputProps("edittoDate")}
          />
          <TextInput
            label="Comments"
            placeholder="i.e. Fever"
            required
            {...editForm.getInputProps("editcomments")}
          />
          <Group align="end" className="mt-8">
            <Button type="submit">Submit </Button>
          </Group>
        </div>
      ),
    });
  };

  function deleteApp(appointment: any) {
    console.log(appointment);
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        Authorization: "Bearer " + auth.token,
      },
      body: JSON.stringify({
        query: `
        mutation{
          deleteAppointment(appointmentId:"${appointment._id}"){
            _id
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
        //remove from array with id
        const index = updatedAppointments.findIndex(
          (appointment) => appointment._id === data.deleteAppointment._id
        );
        updatedAppointments.splice(index, 1);

        setAppointments(
          updatedAppointments.sort((a, b) => {
            const dateA = new Date(parseInt(a.fromDate)).getTime();
            const dateB = new Date(parseInt(b.fromDate)).getTime();
            return dateA - dateB;
          })
        );
        setRecords(updatedAppointments);
        return {
          appointments: updatedAppointments,
        };
      })
      .catch((err) => {
        console.log(err);
      });
  }

  return (
    <div className="flex-col justify-items-center mt-12 gap-2">
      <div className="flex flex-row justify-center">
        <div className="flex flex-row justify-between w-3/4">
          <div className="flex flex-row gap-2">
            <DatePickerInput
              type="range"
              value={birthdaySearchRange}
              onChange={setBirthdaySearchRange}
              placeholder="Filter date"
              maw={400}
            />
            <Button
              disabled={!birthdaySearchRange}
              color="red"
              onClick={() => {
                setBirthdaySearchRange(undefined);
                close();
              }}
            >
              Reset
            </Button>
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
            records={records}
            totalRecords={appointments.length}
            recordsPerPage={PAGE_SIZE}
            page={page}
            onPageChange={(p) => setPage(p)}
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
                        onClick={() => editApp(appointment)}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        color="red"
                        onClick={() => deleteApp(appointment)}
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
