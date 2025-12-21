export default class Config {
  static schemaName: string = "";
  static multitenant: boolean = false;

  static setSchemaName(schemaName: string, multitenant: boolean = false) {
    if (this.schemaName) {
      throw new Error("Schema name already set");
    }

    this.schemaName = schemaName;
    this.multitenant = multitenant;
  }
}
