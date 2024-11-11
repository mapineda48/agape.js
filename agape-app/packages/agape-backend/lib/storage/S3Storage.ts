import { Client } from "minio";
import { IStorage, ContentFile } from "./IStorage"; // Asegúrate de tener la interfaz IStorage en tu proyecto
import policy from "./policyPublic.json";

export class S3Storage implements IStorage {
  private minioClient: Client;
  private readonly bucketRegion = "us-east-1";
  private readonly bucket = "agape";
  private readonly publicPath = "public/";
  private readonly expiry = 24 * 60 * 60; // Expiración para URLs presignadas
  private readonly octetStream = "application/octet-stream";

  constructor(uri: string) {
    const { hostname, username, password, port, protocol } = new URL(uri);

    this.minioClient = new Client({
      endPoint: decodeURIComponent(hostname),
      accessKey: decodeURIComponent(username),
      secretKey: decodeURIComponent(password),
      port: port ? parseInt(port) : undefined,
      useSSL: protocol === "https:",
    });
  }

  public async sync() {
    const existsBucket = await this.minioClient.bucketExists(this.bucket);

    if (!existsBucket) {
      try {
        await this.minioClient.makeBucket(this.bucket, this.bucketRegion);
        await this.minioClient.setBucketPolicy(
          this.bucket,
          JSON.stringify(policy)
        );
      } catch (error) {
        console.log(error);
      }
    }

    return "";
  }

  public async uploadPublic(
    stream: ContentFile,
    filename: string,
    mimeType: string = this.octetStream
  ): Promise<string> {
    const objectName = this.publicPath + filename;

    // await this.minioClient.putObject(this.bucket, objectName, stream, {
    //   "Content-Type": mimeType,
    // });

    const url = await this.minioClient.presignedGetObject(
      this.bucket,
      objectName,
      this.expiry
    );
    return url;
  }

  public async uploadFile(file: File, filename: string): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const objectName = this.publicPath + filename;

    // await this.minioClient.putObject(this.bucket, objectName, buffer, {
    //   "Content-Type": file.type,
    // });

    const url = await this.minioClient.presignedGetObject(
      this.bucket,
      objectName,
      this.expiry
    );
    return url;
  }
}
