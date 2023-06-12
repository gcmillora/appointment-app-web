import React from "react";

export default React.createContext({
  token: "",
  userId: "",
  login: (token: string, userId: string, tokenExpiration: number) => {},
  logout: () => {},
});
