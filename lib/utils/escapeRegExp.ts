export default function escapeRegExp(str: string) {
    // Escapa caracteres especiales para usar en RegExp
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }