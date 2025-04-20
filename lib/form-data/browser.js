import _ from "lodash";

const ArgsKey = "";

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

/**
 * Recursively encuentra y devuelve entradas de un tipo de instancia específico.
 * Devuelve el path como un array de segmentos en lugar de un string.
 *
 * @param {Object|Array} payload    - Objeto o arreglo a procesar.
 * @param {Function}     instanceType - Constructor del tipo de instancia a buscar.
 * @param {Array}        basePath   - Array de segmentos que representa la ruta actual.
 * @returns {Array<[Array<string|number>, any]>}
 *          Lista de pares [pathArray, instancia].
 */
export function extractInstances(payload, instanceType, basePath = []) {
  const instances = _.transform(
    payload,
    (result, value, key) => {
      // Para arrays, 'key' es un índice (string), lo convertimos a número
      const segment = Array.isArray(payload) ? Number(key) : key;
      const currentPath = basePath.concat(segment);

      if (_.isPlainObject(value) || Array.isArray(value)) {
        // Recurse pasando el nuevo basePath
        result.push(...extractInstances(value, instanceType, currentPath));
        return;
      }

      if (value instanceof instanceType) {
        // Agrega [pathArray, instancia] al resultado
        result.push([currentPath, value]);
      }
    },
    []
  );

  // Elimina del objeto original todas las rutas encontradas
  instances.forEach(([pathArray]) => {
    _.unset(payload, pathArray);
  });

  return instances.map(([path, payload]) => [JSON.stringify(path), payload]);
}
