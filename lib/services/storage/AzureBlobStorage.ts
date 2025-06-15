import path from "node:path";
import { ReadStream } from "fs";
import Stream, { PassThrough } from "stream";
import { BlobServiceClient, type BlockBlobClient, ContainerClient } from "@azure/storage-blob";

export default class AzureBlobStorage {
    private static production: boolean;
    private static containerClient: ContainerClient;

    static async connect(connectionString: string, containerName: string, production: boolean) {
        this.production = production;

        const serviceClient = BlobServiceClient.fromConnectionString(connectionString);

        this.containerClient = serviceClient.getContainerClient(containerName);

        await this.containerClient.createIfNotExists({
            access: "container",
        });

        const [, hostname] = connectionString.match(/BlobEndpoint=(https?:\/\/[^;]+)/) ?? [];

        return hostname;
    }

    static async uploadFile(dir: string, file: File): Promise<string> {
        const stream: Stream.Readable = file.stream() as any; // Lo hago de esta manera para simular la API del navegador y que sea amigable con el tipado... pendiente de como mejorarlo

        const blockBlobClient = this.containerClient.getBlockBlobClient(path.posix.join(dir, file.name));

        await blockBlobClient.uploadStream(stream, undefined, undefined, {
            blobHTTPHeaders: { blobContentType: file.type },
        })

        const url = AzureBlobStorage.parsePublicUrl(blockBlobClient);

        return url;
    }

    private static parsePublicUrl(blockBlobClient: BlockBlobClient) {
        if (this.production || !blockBlobClient.url.startsWith("http://azurite:10000")) {
            return blockBlobClient.url;
        }

        // Para facilitar el despliegue en entornos de test con azurite
        return blockBlobClient.url.replace(/^https?:\/\/[^/]+/, 'http://127.0.0.1:10000')
    }
}

/**
 * Define un tipo para los diferentes formatos de archivos que se pueden subir.
 */
export type ContentFile = ReadStream | PassThrough | Buffer;