/**
 * DTOs para el módulo de seguridad y autenticación.
 * Estos tipos definen el contrato entre frontend y backend para
 * operaciones de login, logout y verificación de sesión.
 */

/**
 * Credenciales para iniciar sesión.
 */
export interface LoginRequest {
  /** Nombre de usuario */
  username: string;
  /** Contraseña en texto plano */
  password: string;
}

/**
 * Información de la sesión del usuario autenticado.
 */
export interface IUserSession {
  /** ID del usuario */
  id: number;
  /** Nombre completo del usuario */
  fullName: string;
  /** URL del avatar del usuario (puede ser null) */
  avatarUrl: string | null;
}

/**
 * Respuesta del endpoint de logout.
 */
export interface LogoutResponse {
  /** Indica si el logout fue exitoso */
  success: boolean;
}
