import { ReadStream } from "fs";
import { PassThrough } from "stream";
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