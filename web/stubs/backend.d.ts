/**
 * Stubs para tipos del backend que no existen en el runtime del navegador.
 * Estos stubs permiten que TypeScript valide el código del frontend
 * sin necesidad de tener acceso a las dependencias de Node.js del backend.
 */

// Re-exportamos tipos genéricos para silenciar errores del compilador
// cuando el frontend importa archivos que tienen dependencias de Node.js

export type Buffer = Uint8Array;
export type NodeBuffer = Uint8Array;

// Para cualquier export que no esté definido explícitamente
declare const _default: any;
export default _default;

export declare function encode(value: unknown): Uint8Array;
export declare function decode<T = unknown>(buffer: Buffer | Uint8Array): T;
