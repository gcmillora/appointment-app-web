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
import AuthContext from "../context/auth-context";
import { useContext } from "react";
import { useForm } from "@mantine/form";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";

export function LogInAuth() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) => (value.length >= 6 ? null : "Too short"),
    },
  });

  async function formSubmit(formData: any) {
    console.log(formData);
    fetch("http://localhost:8080/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
                query {
                    login(email: "${formData.email}", password: "${formData.password}") {
                        userId
                        token
                        tokenExpiration
                    }
                }
                `,
      }),
    })
      .then((res) => {
        if (res.status !== 200) {
          throw new Error("Log-in failed!");
        }
        return res.json();
      })
      .then((res) => {
        if (res.data.login.token) {
          notifications.show({
            title: "Login sucessful.",
            message: "Welcome back to .",
          });
          auth.login(res.data.login.token, res.data.login.userId, 1);
          navigate("/app");
        }
      });
  }

  return (
    <Container size={420} my={40}>
      <Title align="center">Log-in</Title>
      <Text color="dimmed" size="sm" align="center" mt={5}>
        Do not have an account yet?{" "}
        <Anchor size="sm" href="/register">
          Create account
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={form.onSubmit(formSubmit)}>
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

          <Button fullWidth mt="xl" type="submit">
            Sign in
          </Button>
        </form>
      </Paper>
    </Container>
  );
}
