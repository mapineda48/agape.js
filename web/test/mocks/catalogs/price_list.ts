import { vi } from "vitest";

export type {
  IPriceList,
  IListPriceListsParams,
  IPriceListWithUsage,
} from "@utils/dto/catalogs/price_list";

export const listPriceLists = vi.fn();
export const getPriceListById = vi.fn();
export const getDefaultPriceList = vi.fn();
