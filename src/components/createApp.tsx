import { Button, Group, Input, Modal, TextInput } from "@mantine/core";
import {
  DateInput,
  DatePicker,
  DatePickerInput,
  DateTimePicker,
  TimeInput,
} from "@mantine/dates";
import { useForm } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import AuthContext from "../context/auth-context";
import { useContext } from "react";

async function formSubmit(formData: any, token: string) {
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

  const isoFrom = fromDate.toISOString();
  const isoTo = toDate.toISOString();

  fetch("http://localhost:8080/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",

      Authorization: "Bearer " + token,
    },
    body: JSON.stringify({
      query: `
      mutation{
        createAppointment(appointmentInput:{comments:"${formData.comments}",fromDate:"${isoFrom}", toDate: "${isoTo}" } ){
            comments
            createdBy{
                email
            }
        }
    }
      `,
    }),
  })
    .then((res) => res.json())
    .then((res) => console.log(res));
}
export default function CreateApp() {
  const auth = useContext(AuthContext);
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
    <div>
      <Modal
        opened={opened}
        onClose={close}
        title="Create Appointment"
        className="font-sans"
      >
        <form
          onSubmit={form.onSubmit((values) => formSubmit(values, auth.token))}
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
          <TimeInput mx="auto" label="To" {...form.getInputProps("toDate")} />
          <TextInput
            label="Comments"
            placeholder="i.e. Fever"
            required
            {...form.getInputProps("comments")}
          />
          <Group align="end">
            <Button type="submit" onClick={close}>
              Submit{" "}
            </Button>
          </Group>
        </form>
      </Modal>
      <Button onClick={open} className="">
        Create
      </Button>
    </div>
  );
}
