import os from "os";
import fs from "fs-extra";
import _ from "lodash";
import formidable, { Fields, Files } from "formidable";
import { Request } from "express";
import { ArgsKey } from "./integration";

const uploadDir = os.tmpdir();

export default async function parseFormData(req: Request) {
  const form = formidable({ uploadDir });

  const payload = await new Promise<[Fields, Files]>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve([fields, files]);
    });
  });

  return parseArgs(payload);
}

export function parseArgs([fields, files]: [Fields, Files]): unknown[] {
  const [json, datesJson] = fields[ArgsKey] ?? [];

  if (!json) {
    throw new Error("unknown form data");
  }

  // Primitive types
  const args: unknown[] = JSON.parse(json);

  // Date type
  const dates: [string, string] = JSON.parse(datesJson);

  dates.forEach(([path, date]) => _.set(args, path, new Date(date)));

  // File Type
  Object.entries(files).map(([key, file]) => _.set(args, key, toFileWeb(file)));

  return args;
}

// server interface to simulate api browser  file from formidable file
export function toFileWeb([input]: formidable.File[] = []) {
  const file: unknown = {
    name: input.originalFilename || "",
    size: input.size,
    type: input.mimetype || "",

    arrayBuffer: function arrayBuffer() {
      return fs
        .readFile(input.filepath)
        .then((res) =>
          res.buffer.slice(res.byteOffset, res.byteOffset + res.byteLength)
        );
    },

    slice: notImplementedError,

    stream: function stream() {
      return fs.createReadStream(input.filepath);
    },

    text: notImplementedError,
  };

  return file as File;
}

function notImplementedError(): void {
  throw new Error("not implemented error Date method on server");
}

/**
 * Recursively finds and returns entries of a specific instance type from the provided object.
 * It constructs the keys in a way that reflects the structure of the object,
 * suitable for FormData or other purposes.
 * @param payload The object from which to extract instances.
 * @param instanceType The constructor function of the type to extract (e.g., File, Date).
 * @param baseKey The base key from which to start the path construction, default is an empty string.
 * @returns An array of tuples, each containing the path to the instance in the object and the instance itself.
 */
export function extractInstances<T>(
  payload: any,
  instanceType: new (...args: any[]) => T,
  baseKey?: string
): Array<[string, T]>;
export function extractInstances(
  payload: any,
  instanceType: any,
  baseKey: any
) {
  const instances = _.transform(
    payload,
    (result, value, key: any) => {
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
    [] as any[]
  );

  // Removes entries from the source object, based on the keys found in the instances list.
  // This is used to prepare the non-instance part of the object for JSON serialization.
  instances.forEach(([path]: [any]) => _.unset(payload, path));

  return instances as any;
}
