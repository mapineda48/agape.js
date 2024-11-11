import axio$ from "axios";
import _ from "lodash";
import toForm from "../form/browser";
import { ApiKey, ApiKeyHeader } from "./config";
import { onErrorRPC } from "./error/browser";

// Backend Server Configuration
// Determines the base URL depending on the environment (production or development)
const baseURL = "/";

const axios = axio$.create({
  baseURL,
  headers: {
    [ApiKeyHeader]: ApiKey,
  },
  withCredentials: true,
});

export default function makeRcp(pathname) {
  return (...args) =>
    axios.post(pathname, toForm(args)).then(onSuccess).catch(onErrorRPC);
}

function onSuccess({ data: [payload, dates] }) {
  dates.forEach(([path, date]) => _.set(payload, path, new Date(date)));

  return payload;
}
