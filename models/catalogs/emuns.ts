import { schema } from "../agape";

export const itemTypeEnum = schema.enum("catalogs_item_type", [
  "good", // bien físico
  "service", // servicio
]);
