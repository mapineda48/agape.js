/**
 * Stubs mínimos para tipos de Node.js usados en archivos compartidos.
 * Esto permite que el frontend compile sin @types/node.
 */

declare global {
  // Para archivos de test que usan global
  var global: typeof globalThis;

  // Buffer stub para archivos que lo usan
  interface Buffer extends Uint8Array {
    toString(encoding?: string): string;
  }

  var Buffer: {
    from(data: string | ArrayBuffer | Uint8Array, encoding?: string): Buffer;
    alloc(size: number): Buffer;
    isBuffer(obj: unknown): obj is Buffer;
  };
}

export {};
