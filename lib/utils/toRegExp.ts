export function toRegExp(str: string) {
    // Escapa caracteres especiales para usar en RegExp
    const pattern = str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return new RegExp(`\\b${pattern}\\b`, "g")
}