import _ from "lodash";
import { ArgsKey } from "./integration";

// Converts JavaScript arguments to FormData for HTTP submission.
// This allows complex objects, including files, to be sent to the server.
export default function toFormData(args) {
  // Create a deep copy of the source to avoid mutating the original object
  const payload = _.cloneDeep(args);

  // Extract dates entries from the arguments
  const dates = extractInstances(payload, Date);

  // Extract file entries from the arguments
  const files = extractInstances(payload, File);

  // Create a new FormData object
  const formData = new FormData();

  // Append the JSON part to the FormData object
  formData.append(ArgsKey, JSON.stringify(payload));

  // Append the Dates to the FormData object
  formData.append(ArgsKey, JSON.stringify(dates));

  // Append each file to the FormData object
  files.forEach(([name, file]) => formData.append(name, file));

  return formData;
}

// Recursively finds and returns entries of a specific instance type from the provided object.
// It constructs the keys in a way that reflects the structure of the object,
// suitable for FormData.
export function extractInstances(payload, instanceType, baseKey = "") {
  const instances = _.transform(
    payload,
    (result, value, key) => {
      // For arrays, the key will be the index, so we construct the path appropriately
      // using dot notation for objects or square brackets for array indices.
      let currentKey = Array.isArray(payload)
        ? `${baseKey}[${key}]`
        : baseKey
        ? `${baseKey}.${key}`
        : key;

      // If the value is an plain object or array, recursively process it
      if (_.isPlainObject(value) || Array.isArray(value)) {
        result.push(...extractInstances(value, instanceType, currentKey));
        return;
      }

      // If the value is an instance of the specified type, add it to the result list
      if (value instanceof instanceType) {
        result.push([currentKey, value]);
      }
    },
    []
  );

  // Removes entries from the source object, based on the keys found in the instances list.
  // This is used to prepare the non-instance part of the object for JSON serialization.
  instances.forEach(([path]) => _.unset(payload, path));

  return instances;
}
