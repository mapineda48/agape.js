export default class Config {
  static schemaName: string = "";

  static setSchemaName(schemaName: string) {
    if (this.schemaName) {
      throw new Error("Schema name already set");
    }

    this.schemaName = schemaName;
  }
}
