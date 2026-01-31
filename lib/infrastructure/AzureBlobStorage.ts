import path from "node:path";
import { ReadStream } from "fs";
import Stream, { PassThrough } from "stream";
import {
  BlobServiceClient,
  type BlockBlobClient,
  ContainerClient,
} from "@azure/storage-blob";

export default class AzureBlobStorage {
  private static hostCdn: string;
  private static containerClient: ContainerClient;

  static async connect(
    connectionString: string,
    containerName: string,
    hostCdn: string,
  ) {
    this.hostCdn = hostCdn;

    const serviceClient =
      BlobServiceClient.fromConnectionString(connectionString);

    this.containerClient = serviceClient.getContainerClient(containerName);

    await this.containerClient.createIfNotExists({
      access: "container",
    });

    const [, hostname] =
      connectionString.match(/BlobEndpoint=(https?:\/\/[^;]+)/) ?? [];

    return hostCdn ? hostCdn : hostname;
  }

  static async uploadFile(dir: string, file: File): Promise<string> {
    const stream: Stream.Readable = file.stream() as any;

    const blockBlobClient = this.containerClient.getBlockBlobClient(
      path.posix.join(dir, file.name),
    );

    await blockBlobClient.uploadStream(stream, undefined, undefined, {
      blobHTTPHeaders: {
        blobContentType: file.type,
        blobCacheControl: "public, max-age=31536000", // 1 año en segundos
      },
    });

    const url = AzureBlobStorage.parsePublicUrl(blockBlobClient);

    return url;
  }

  private static parsePublicUrl(blockBlobClient: BlockBlobClient) {
    if (!this.hostCdn) {
      return blockBlobClient.url;
    }

    return blockBlobClient.url.replace(/^https?:\/\/[^/]+/, this.hostCdn);
  }
}

/**
 * Define un tipo para los diferentes formatos de archivos que se pueden subir.
 */
export type ContentFile = ReadStream | PassThrough | Buffer;
