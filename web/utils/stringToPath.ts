// Definimos que una "llave" de ruta puede ser string o number
type PathKey = string | number;

/**
 * Convierte un string de ruta (ej: "a[0].b") a un array de claves (ej: ["a", 0, "b"])
 */
export default function stringToPath(
  path: string | number | PathKey[] | null | undefined
): PathKey[] {
  // 1. Si ya es un array, TypeScript necesita confirmación, lo devolvemos tal cual.
  if (Array.isArray(path)) {
    return path;
  }

  if (typeof path === "number") {
    return [path];
  }

  // 2. Si es nulo, indefinido o string vacío, devolvemos array vacío.
  if (!path) {
    return [];
  }

  // 3. Ejecutamos la lógica del Regex
  // TS sabe que 'path' aquí es string por los guards anteriores
  const segments = path.match(/[^.[\]"']+/g) || [];

  return segments.map((segment: string): PathKey => {
    // Verificamos si es puramente numérico para castearlo
    return /^\d+$/.test(segment) ? Number(segment) : segment;
  });
}
