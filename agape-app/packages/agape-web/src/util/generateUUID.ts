export default function generateUUID() {
  // Concatenar piezas para formar un UUID
  return (
    hex4() +
    hex4() +
    "-" +
    hex4() +
    "-" +
    "4" +
    hex4().substr(0, 3) +
    "-" +
    (Math.random() > 0.5 ? "8" : "a") +
    hex4().substr(0, 3) +
    "-" +
    hex4() +
    hex4() +
    hex4()
  );
}

// Función para generar un número hexadecimal aleatorio de 4 dígitos
function hex4() {
  return Math.floor((1 + Math.random()) * 0x10000)
    .toString(16)
    .substring(1);
}
