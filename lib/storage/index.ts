import { ReadStream } from "fs";
import { PassThrough } from "stream";
import { BlobServiceClient, ContainerClient } from "@azure/storage-blob";

export class BlobStorage {
    private static hostname: string;
    private static publicContainer: string;
    private static containerClient: ContainerClient;

    static async connect(connectionString: string, containerName: string) {
        const serviceClient = BlobServiceClient.fromConnectionString(connectionString);

        this.containerClient = serviceClient.getContainerClient(containerName);

        await this.containerClient.createIfNotExists({
            access: "container",
        });

        this.publicContainer = containerName;

        const [, hostname] = connectionString.match(/BlobEndpoint=(https?:\/\/[^;]+)/) ?? [];
        this.hostname = hostname;

        return hostname;
    }

    static async uploadPublic(
        stream: ContentFile,
        filename: string,
        mimeType: string = "application/octet-stream"
    ): Promise<string> {
        const blockBlobClient = this.containerClient.getBlockBlobClient(filename);

        await blockBlobClient.uploadStream(stream as any, undefined, undefined, {
            blobHTTPHeaders: { blobContentType: mimeType },
        });
        const url = blockBlobClient.url;
        return url;
    }

    static async uploadFile(file: File, filename: string): Promise<string> {
        const buffer = await file.arrayBuffer();
        const blockBlobClient = this.containerClient.getBlockBlobClient(filename);
        await blockBlobClient.uploadData(Buffer.from(buffer), {
            blobHTTPHeaders: { blobContentType: file.type },
        });
        const url = blockBlobClient.url;
        return url;
    }
}

/**
 * Define un tipo para los diferentes formatos de archivos que se pueden subir.
 */
export type ContentFile = ReadStream | PassThrough | Buffer;