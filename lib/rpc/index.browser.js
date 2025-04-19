import axio$ from "axios";

// Backend Server Configuration
// Determines the base URL depending on the environment (production or development)
const baseURL = process.env.NODE_ENV === "development" ? "http://localhost:3000/" : "/";

const axios = axio$.create({
  baseURL,
  withCredentials: true,
});

export default function makeRcp(pathname) {
  return (...args) => axios.post(pathname, args).then(({ data }) => data);
}
