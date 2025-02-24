import axio$ from "axios";
import _ from "lodash";
import toForm from "../../form/browser";
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

// Función que procesa los datos en fragmentos en el hilo principal
function processDataAsync(payload, dates, startIndex = 0, chunkSize = 100) {
  return new Promise((resolve, reject) => {
    // Procesar un fragmento de datos
    try {
      for (let i = startIndex; i < Math.min(startIndex + chunkSize, dates.length); i++) {
        const [path, date] = dates[i];
        _.set(payload, path, new Date(date));
      }
    } catch (error) {
      reject(error);
    }

    // Si aún quedan datos, procesar el siguiente fragmento
    if (startIndex + chunkSize < dates.length) {
      setTimeout(() => {
        // Llamada recursiva a processDataAsync y encadenamiento de la promesa
        processDataAsync(payload, dates, startIndex + chunkSize, chunkSize)
          .then(resolve)
          .catch(reject);
      }, 0);
    } else {
      // Cuando se termine el procesamiento, resolver la promesa
      resolve(payload);
    }
  });
}


// // Iniciar el procesamiento en fragmentos
// processData(payload, dates, 0, 100, (result) => {
//   console.log("Datos procesados en el hilo principal:", result);
// });