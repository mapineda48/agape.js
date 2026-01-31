import bcrypt from "bcrypt";

const SALT_ROUNDS = 12; // entre 10 y 14 está bien para la mayoría de casos

/**
 * Hashea una contraseña en texto plano.
 */
export async function hashPassword(password: string): Promise<string> {
  // Genera un salt y calcula el hash
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifica que una contraseña en texto plano coincida con el hash guardado.
 */
export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}
