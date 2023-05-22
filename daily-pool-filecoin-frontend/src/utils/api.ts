import axios from "axios";

export const APIServer = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});
