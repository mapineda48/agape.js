import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import ms from "ms";

/**
 * Opciones de configuración para la clase Jwt
 */
export interface JwtOptions {
  /** Secreto para firmar/verificar tokens (mínimo 32 caracteres recomendado) */
  secret: string;
  /** Tiempo de expiración del token (ej: "24h", "7d", "1h") */
  expiresIn?: string;
  /** Identificador del emisor del token */
  issuer?: string;
  /** Audiencia esperada del token */
  audience?: string;
}

/**
 * Payload personalizado para el JWT
 */
export interface TokenPayload extends JWTPayload {
  [key: string]: unknown;
}

/**
 * Algoritmo de firma utilizado
 * HS256 es el algoritmo HMAC más común para secretos simétricos
 */
const ALGORITHM = "HS256" as const;

/**
 * Clase para manejar la creación y verificación de JWT usando la librería jose
 *
 * Mejoras de seguridad implementadas:
 * - Uso de algoritmo explícito (HS256)
 * - Validación de issuer y audience
 * - Secreto codificado como Uint8Array (requerido por jose)
 * - Tipado fuerte para payloads
 * - Claims estándar (iat, exp, iss, aud)
 */
export default class Jwt {
  /** Tiempo máximo de vida del token en milisegundos */
  public readonly maxAge: number;

  /** Secreto codificado como Uint8Array */
  private readonly secret: Uint8Array;

  /** Tiempo de expiración en formato legible (ej: "24h") */
  private readonly expiresIn: string;

  /** Issuer del token */
  private readonly issuer: string;

  /** Audience del token */
  private readonly audience: string;

  constructor(options: string | JwtOptions) {
    // Compatibilidad hacia atrás: si se pasa un string, es el secreto
    const config: JwtOptions =
      typeof options === "string" ? { secret: options } : options;

    // Validación del secreto
    if (!config.secret || config.secret.length < 32) {
      console.warn(
        "[JWT Security Warning] El secreto debería tener al menos 32 caracteres para mayor seguridad",
      );
    }

    this.expiresIn = config.expiresIn ?? "24h";
    this.maxAge = ms(this.expiresIn as ms.StringValue);
    this.issuer = config.issuer ?? "agape:api";
    this.audience = config.audience ?? "agape:client";

    // jose requiere el secreto como Uint8Array
    this.secret = new TextEncoder().encode(config.secret);
  }

  /**
   * Genera un token JWT firmado con el payload proporcionado
   *
   * @param payload - Datos a incluir en el token
   * @returns Token JWT firmado
   */
  public async generateToken<T extends Record<string, unknown>>(
    payload: T,
  ): Promise<string> {
    const token = await new SignJWT({ ...payload })
      .setProtectedHeader({ alg: ALGORITHM })
      .setIssuedAt()
      .setIssuer(this.issuer)
      .setAudience(this.audience)
      .setExpirationTime(this.expiresIn)
      .sign(this.secret);

    return token;
  }

  /**
   * Verifica y decodifica un token JWT
   *
   * @param token - Token JWT a verificar
   * @returns Payload del token si es válido
   * @throws Error si el token es inválido, expirado o no pasa las validaciones
   */
  public async verifyToken<T extends TokenPayload = TokenPayload>(
    token: string,
  ): Promise<T> {
    const { payload } = await jwtVerify(token, this.secret, {
      algorithms: [ALGORITHM],
      issuer: this.issuer,
      audience: this.audience,
    });

    return payload as T;
  }

  /**
   * Decodifica un token sin verificar su firma (útil para debugging)
   * ⚠️ NO usar en producción para validación de seguridad
   *
   * @param token - Token JWT a decodificar
   * @returns Payload decodificado sin verificar
   */
  public static decodeWithoutVerify(token: string): TokenPayload | null {
    try {
      const parts = token.split(".");
      if (parts.length !== 3) return null;

      const payload = JSON.parse(
        Buffer.from(parts[1], "base64url").toString("utf-8"),
      );

      return payload;
    } catch {
      return null;
    }
  }
}
