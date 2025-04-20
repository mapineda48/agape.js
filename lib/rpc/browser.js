import axio$ from "axios";
import toForm from "@agape/form-data";

// Backend Server Configuration
// Determines the base URL depending on the environment (production or development)
const baseURL =
  process.env.NODE_ENV === "development" ? "http://localhost:3000/" : "/";

const axios = axio$.create({
  baseURL,
  withCredentials: true,
});

export default function makeRcp(pathname) {
  return (...args) =>
    axios
      .post(pathname, toForm(args), { timeout: 1000 })
      .then(({ data }) => data);
}
