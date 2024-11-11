import { ReadStream } from "fs";
import { PassThrough } from "stream";

/**
 * Define un tipo para los diferentes formatos de archivos que se pueden subir.
 */
export type ContentFile = ReadStream | PassThrough | Buffer;

/**
 * Interfaz genérica para el manejo de almacenamiento de archivos.
 */
export interface IStorage {
  sync(): Promise<string>;

  /**
   * Sube un archivo de forma pública y retorna la URL donde el archivo está accesible.
   *
   * @param stream El contenido del archivo como un stream o buffer.
   * @param filename El nombre bajo el cual el archivo será guardado.
   * @param mimeType El tipo MIME del archivo, por defecto 'application/octet-stream'.
   * @returns Una promesa que resuelve con la URL del archivo.
   */
  uploadPublic(
    stream: ContentFile,
    filename: string,
    mimeType?: string
  ): Promise<string>;

  /**
   * Sube un archivo y retorna la URL donde el archivo está accesible de forma privada.
   *
   * @param file El archivo a subir.
   * @param filename El nombre bajo el cual el archivo será guardado.
   * @returns Una promesa que resuelve con la URL del archivo.
   */
  uploadFile(file: File, filename: string): Promise<string>;
}