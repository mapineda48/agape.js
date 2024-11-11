import { AzureBlobStorage } from "./AzureBlobStorage";
import { IStorage, ContentFile } from "./IStorage";
import { S3Storage } from "./S3Storage";

export default class Storage {
  private static storage: IStorage;

  public static async uploadPublic(
    stream: ContentFile,
    filename: string,
    mimeType?: string
  ) {
    return this.GetClient().uploadPublic(stream, filename);
  }

  public static async uploadFile(file: File, filename: string) {
    return this.GetClient().uploadFile(file, filename);
  }

  protected static GetClient() {
    if (!Storage.storage) {
      throw Error("storage is not init");
    }

    return Storage.storage;
  }

  public static async Init(connectionString: string) {
    this.storage = connectionString.startsWith("DefaultEndpointsProtocol")
      ? new AzureBlobStorage(connectionString)
      : new S3Storage(connectionString);

    return this.storage.sync();
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}
}
