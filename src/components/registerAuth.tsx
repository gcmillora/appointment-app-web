import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { RegisterForm } from "./types";
import { notifications } from "@mantine/notifications";
import { useNavigate } from "react-router-dom";

export function RegisterAuth() {
  const navigate = useNavigate();

  async function formSubmit(formData: RegisterForm) {
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          mutation {
            createUser(userInput: {email: "${formData.email}", password: "${formData.password}"}) {
              _id
              email 
          }
         }
        `,
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data.createUser._id) {
          notifications.show({
            title: "Registration sucessful.",
            message: "Proceed to log-in with your account details.",
            color: "teal",
          });
          navigate("/auth");
        } else {
          notifications.show({
            title: "Registration failed.",
            message: "Please try again.",
            color: "red",
          });
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  const form = useForm({
    initialValues: {
      email: "",
      password: "",
      passwordConfirmation: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 6 ? null : "Too short"),
      passwordConfirmation: (value, values) => {
        return value === values.password ? null : "Passwords do not match";
      },
    },
  });

  return (
    <Container size={420} my={40}>
      <Title align="center">Sign-up</Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Do you already have an account?{" "}
        <Anchor size="sm" href="/auth">
          Sign-in now
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit((values) => formSubmit(values))}>
          <TextInput
            label="Email"
            placeholder="you@mantine.dev"
            required
            {...form.getInputProps("email")}
          />
          <PasswordInput
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("password")}
          />
          <PasswordInput
            label="Password confirmation"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps("passwordConfirmation")}
          />

          <Button fullWidth mt="xl" variant="default" type="submit">
            Sign up
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
