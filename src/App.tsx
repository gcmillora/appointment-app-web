import React from "react";
import logo from "./logo.svg";
import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import AuthPage from "./pages/auth";
import RegisterPage from "./pages/register";
import AuthContext from "./context/auth-context";
import { Switch } from "@mantine/core";
import AppPage from "./pages/app";
import NavBar from "./components/navbar";

function App() {
  const [token, setToken] = React.useState<string>("");
  const [userId, setUserId] = React.useState<string>("");

  const login = (token: string, userId: string, tokenExpiration: number) => {
    setToken(token);
    setUserId(userId);
  };

  const logout = () => {
    setToken("");
    setUserId("");
  };
  return (
    <BrowserRouter>
      <React.Fragment>
        <AuthContext.Provider
          value={{ token: token, userId: userId, login, logout }}
        >
          {token && <NavBar />}

          <Routes>
            {!token && <Route path="/" element={<AuthPage />} />}
            {token && <Route path="/app" element={<AppPage />} />}
            {!token && <Route path="/auth" element={<AuthPage />} />}
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </AuthContext.Provider>
      </React.Fragment>
    </BrowserRouter>
  );
}

export default App;
