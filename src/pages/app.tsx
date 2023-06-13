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
import { notifications } from "@mantine/notifications";
const PAGE_SIZE = 15;

export default function AppPage() {
  const [page, setPage] = useState(1);
  const [appRange, setAppRange] = useState<DatesRangeValue>();
  const auth = useContext(AuthContext);

  //redirect if not logged in
  if (!auth.token) {
    window.location.href = "/auth";
  }

  const [appointments, setAppointments] = React.useState<any[]>([]);
  const [records, setRecords] = React.useState<any[]>([]);
  const [selectedId, setSelectedId] = React.useState<string>("");

  useEffect(() => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE;
    setRecords(appointments.slice(from, to));
    setAppRange(undefined);
  }, [page]);

  useEffect(() => {
    setRecords(
      appointments.filter((appointment) => {
        if (
          appRange &&
          appRange[0] &&
          appRange[1] &&
          (dayjs(appRange[0]).isAfter(
            new Date(parseInt(appointment.fromDate)),
            "day"
          ) ||
            dayjs(appRange[1]).isBefore(
              new Date(parseInt(appointment.fromDate)),
              "day"
            ))
        ) {
          return false;
        }
        return true;
      })
    );
  }, [appRange]);

  useLayoutEffect(() => {
    fetchAppointments();
  }, []);

  function fetchAppointments() {
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

  function isOverlapping(app: any, isEdit: boolean = false) {
    if (isEdit) {
      const updatedAppointments = appointments.filter(
        (appointment) => appointment._id !== selectedId
      );
      for (const appointment of updatedAppointments) {
        const fromDate = new Date(parseInt(appointment.fromDate));
        const toDate = new Date(parseInt(appointment.toDate));

        if (app.fromDate < toDate && app.toDate > fromDate) {
          return true;
        }
      }
      return false;
    }

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
            patient: data.createAppointment.patient,
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
          //notify success
          notifications.show({
            title: "Appointment created.",
            message: "You have successfully booked an appointment.",
            color: "teal",
          });
          form.setValues({
            patient: "",
            selectedDate: new Date(),
            fromDate: "",
            toDate: "",
            comments: "",
          });

          return {
            appointments: updatedAppointments,
          };
        })
        .catch((err) => {
          notifications.show({
            title: "Appointment failed.",
            message: "Please try again.",
            color: "red",
          });
        });
    } else {
      notifications.show({
        title: "Schedule conflict.",
        message: "Overlapping schedule from other booked appointments.",
        color: "red",
      });
    }
  }

  const [opened, createHandlers] = useDisclosure(false);
  const [editOpened, editHandlers] = useDisclosure(false);

  const form = useForm({
    initialValues: {
      patient: "",
      selectedDate: new Date(),
      fromDate: "",
      toDate: "",
      comments: "",
    },
    //time should only be from 9AM TO 5PM
    validate: {
      toDate: (value, values) => {
        //time should only be from 9AM TO 5PM
        if (value < values.fromDate) return "Time should be after from time";
        const time = value.split(":");
        const hrs = parseInt(time[0]);
        const mins = parseInt(time[1]);
        if (hrs < 9 || hrs > 17) return "Allowed time is from 9AM to 5PM";
        return null;
      },
      fromDate: (value, values) => {
        //time should only be from 9AM TO 5PM
        const time = value.split(":");
        const hrs = parseInt(time[0]);
        const mins = parseInt(time[1]);
        if (hrs < 9 || hrs > 17) return "Allowed time is from 9AM to 5PM";
        return null;
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
        if (value < values.editfromDate)
          return "Time should be after from time";
        const time = value.split(":");
        const hrs = parseInt(time[0]);
        const mins = parseInt(time[1]);
        if (hrs < 9 || hrs > 17) return "Allowed time is from 9AM to 5PM";
        return null;
      },
      editfromDate: (value, values) => {
        const time = value.split(":");
        const hrs = parseInt(time[0]);
        const mins = parseInt(time[1]);
        if (hrs < 9 || hrs > 17) return "Allowed time is from 9AM to 5PM";
        return null;
      },
    },
  });

  function editSubmit(formData: any, token: string, id: string) {
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

    if (!isOverlapping(dates, true)) {
      fetch("http://localhost:8080/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",

          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({
          query: `
        mutation{
          updateAppointment(id: "${id}", updateAppointment:{patient:"${formData.editpatient}", comments:"${formData.editcomments}", fromDate:"${fromDate}", toDate: "${toDate}"} ){
            _id  
            patient
            comments
            fromDate
            toDate
              createdBy{
                  _id
  
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
            patient: data.updateAppointment.patient,
            _id: data.updateAppointment._id,
            comments: data.updateAppointment.comments,
            fromDate: data.updateAppointment.fromDate,
            toDate: data.updateAppointment.toDate,
          };
          const index = updatedAppointments.findIndex(
            (curr_appointment) =>
              curr_appointment._id === data.updateAppointment._id
          );

          updatedAppointments[index] = obj;

          setAppointments(
            updatedAppointments.sort((a, b) => {
              const dateA = new Date(parseInt(a.fromDate)).getTime();
              const dateB = new Date(parseInt(b.fromDate)).getTime();
              return dateA - dateB;
            })
          );
          setRecords(updatedAppointments);
          notifications.show({
            title: "Appointment updated.",
            message: "You have successfully updated an appointment.",
            color: "teal",
          });

          return {
            appointments: updatedAppointments,
          };
        })
        .catch((err) => {
          console.log(err);
          notifications.show({
            title: "Appointment update failed.",
            message: "Please try again.",
            color: "red",
          });
        });
    } else {
      notifications.show({
        title: "Schedule conflict.",
        message: "Overlapping schedule from other booked appointments.",
        color: "red",
      });
    }
  }

  function editApp(appointment: any) {
    editForm.setValues({
      editpatient: appointment.patient,
      editselectedDate: new Date(parseInt(appointment.fromDate)),
      editfromDate: moment(new Date(parseInt(appointment.fromDate))).format(
        "HH:mm"
      ),
      edittoDate: moment(new Date(parseInt(appointment.toDate))).format(
        "HH:mm"
      ),
      editcomments: appointment.comments,
    });
    setSelectedId(appointment._id);
    editHandlers.open();
  }

  function deleteApp(appointment: any) {
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
          (curr_appointment) =>
            curr_appointment._id === data.deleteAppointment._id
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
        notifications.show({
          title: "Appointment deleted.",
          message: "You have successfully deleted an appointment.",
          color: "teal",
        });

        return {
          appointments: updatedAppointments,
        };
      })
      .catch((err) => {
        console.log(err);
        notifications.show({
          title: "Appointment deletion failed.",
          message: "Please try again.",
          color: "red",
        });
      });
  }

  return (
    <div className="flex-col justify-items-center mt-12 gap-2">
      <div className="flex flex-row justify-center">
        <div className="flex flex-row justify-between w-3/4">
          <div className="flex flex-row gap-2">
            <DatePickerInput
              type="range"
              value={appRange}
              onChange={setAppRange}
              placeholder="Filter date"
              maw={400}
            />
            <Button
              disabled={!appRange}
              color="red"
              onClick={() => {
                setAppRange(undefined);
              }}
            >
              Reset
            </Button>
          </div>
          <div>
            <div>
              <Modal
                opened={opened}
                onClose={createHandlers.close}
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
                  <Group position="right" className="mt-2">
                    <Button type="submit">Submit </Button>
                  </Group>
                </form>
              </Modal>
              <Button onClick={createHandlers.open} className="">
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
            minHeight={180}
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
          <Modal
            opened={editOpened}
            onClose={editHandlers.close}
            title="Edit Appointment"
          >
            <form
              onSubmit={editForm.onSubmit((values) =>
                editSubmit(values, auth.token, selectedId)
              )}
            >
              <TextInput
                label="Patient Name"
                placeholder="Juan Dela Cruz"
                required
                {...editForm.getInputProps("editpatient")}
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
              <Group position="right" className="mt-2">
                <Button type="submit">Submit </Button>
              </Group>
            </form>
          </Modal>
        </div>
      </div>
    </div>
  );
}
