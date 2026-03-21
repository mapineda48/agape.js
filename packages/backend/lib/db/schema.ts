import { pgSchema } from "drizzle-orm/pg-core";

export default class Schema {
  static schemaName: string = "";

  static setSchemaName(schemaName: string) {
    if (this.schemaName) {
      throw new Error("Schema name already set");
    }

    this.schemaName = schemaName;
  }

  static get tenantSchema() {
    if (!this.schemaName) {
      throw new Error("Schema name not set");
    }

    return pgSchema<string>(this.schemaName);
  }
}
