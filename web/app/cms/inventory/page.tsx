import { Fragment, useEffect } from "react";
import getProducts, {
  type GetProductsParams,
  type GetProduct,
  type GetProductsResult,
} from "@agape/cms/inventory/getProducts";
import { getProduct } from "@agape/cms/inventory/product";
import { useSharedState } from "@/components/util/event-emitter";
import useProductModal from "./product";
import { useNotificacion } from "@/components/ui/notification";
import { debounce } from "lodash";
import { Pagination } from "./Pagination";

const PAGE_SIZE = 10; // Define a constant for page size

export async function onInit() {
  return getProducts({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
    includeTotalCount: true,
  });
}

export default function Inventory(props: GetProductsResult) {
  const notify = useNotificacion();
  const show = useProductModal();

  const [{ filters, totalCount, products, fetch }, setState] =
    useSharedState<IState>(() => {
      return {
        filters: {},
        fetch: false,
        products: props.products,
        totalCount: props.totalCount || 0,
      };
    });

  const debouncedSearch = debounce((value: string) => {
    setState({
      products,
      totalCount,
      fetch: true,
      filters: {
        fullName: value,
        pageIndex: 0,
        includeTotalCount: true,
      },
    });
  }, 300);

  useEffect(() => {
    if (!fetch) {
      return;
    }

    getProducts(filters)
      .then((response) => {
        setState({
          fetch: false,
          filters: {
            ...filters,
            includeTotalCount: false, // Reset includeTotalCount to false after fetching
          },
          products: response.products,
          totalCount: response.totalCount ?? totalCount,
        });
      })
      .catch((error) => {
        notify({
          payload: error,
        });
      });
  }, [fetch, filters, notify, setState, totalCount]);

  return (
    <Fragment>
      <div
        className="relative flex size-full min-h-screen flex-col bg-gray-50"
        style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}
      >
        <div className="layout-container flex h-full grow flex-col sticky top-0">
          <div className="sm:px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col max-w-[960px] flex-1">
              <div className="flex flex-wrap justify-between gap-3 p-4">
                <p className="text-[#101518] tracking-light text-[32px] font-bold leading-tight min-w-72">
                  Products
                </p>
                <button
                  className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 bg-[#eaedf1] text-[#101518] text-sm font-medium leading-normal"
                  onClick={() => show({})}
                >
                  <span className="truncate">Add Product</span>
                </button>
              </div>
              <div className="px-4 py-3">
                <label className="flex flex-col min-w-40 h-12 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-xl h-full">
                    <div
                      className="text-[#5c748a] flex border-none bg-[#eaedf1] items-center justify-center pl-4 rounded-l-xl border-r-0"
                      data-icon="MagnifyingGlass"
                      data-size="24px"
                      data-weight="regular"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24px"
                        height="24px"
                        fill="currentColor"
                        viewBox="0 0 256 256"
                      >
                        <path d="M229.66,218.34l-50.07-50.06a88.11,88.11,0,1,0-11.31,11.31l50.06,50.07a8,8,0,0,0,11.32-11.32ZM40,112a72,72,0,1,1,72,72A72.08,72.08,0,0,1,40,112Z" />
                      </svg>
                    </div>
                    <input
                      placeholder="Search products"
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-xl text-[#101518] focus:outline-0 focus:ring-0 border-none bg-[#eaedf1] focus:border-none h-full placeholder:text-[#5c748a] px-4 rounded-l-none border-l-0 pl-2 text-base font-normal leading-normal"
                      defaultValue=""
                      onChange={(e) => debouncedSearch(e.target.value)}
                    />
                  </div>
                </label>
              </div>
              <div className="px-4 py-3 @container">
                <div className="flex overflow-x-auto rounded-xl border border-[#d4dce2] bg-gray-50">
                  <table className="flex-1">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">
                          Product
                        </th>
                        <th className="px-4 py-3 text-left text-[#101518] w-60 text-sm font-medium leading-normal">
                          Status
                        </th>
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">
                          Inventory
                        </th>
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">
                          Price
                        </th>
                        <th className="px-4 py-3 text-left text-[#101518] w-[400px] text-sm font-medium leading-normal">
                          Category
                        </th>
                        <th className="px-4 py-3 text-left text-[#101518] w-60 text-sm font-medium leading-normal">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="border-t border-t-[#d4dce2]"
                        >
                          <td className="h-[72px] px-4 py-2 w-[400px] text-[#101518] text-sm font-normal leading-normal">
                            {product.fullName}
                          </td>
                          <td className="h-[72px] px-4 py-2 w-60 text-sm font-normal leading-normal">
                            <button
                              disabled
                              className={`flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-xl h-8 px-4 text-sm font-medium leading-normal w-full transition-colors duration-200 ${
                                product.isActive
                                  ? "bg-green-500 text-white"
                                  : "bg-[#eaedf1] text-[#101518]"
                              }`}
                            >
                              <span className="truncate">
                                {product.isActive ? "Active" : "Inactive"}
                              </span>
                            </button>
                          </td>
                          <td className="h-[72px] px-4 py-2 w-[400px] text-[#5c748a] text-sm font-normal leading-normal">
                            {product.inventory}
                          </td>
                          <td className="h-[72px] px-4 py-2 w-[400px] text-[#5c748a] text-sm font-normal leading-normal">
                            {product.price}
                          </td>
                          <td className="h-[72px] px-4 py-2 w-[400px] text-[#5c748a] text-sm font-normal leading-normal">
                            {product.category}
                          </td>
                          <td
                            className="h-[72px] px-4 py-2 w-60 text-[#5c748a] text-sm font-bold leading-normal tracking-[0.015em] cursor-pointer"
                            onClick={() => {
                              getProduct(product.id)
                                .then((record) => {
                                  show({ product: record });
                                })
                                .catch((error) => notify({ payload: error }));
                            }}
                          >
                            Edit
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <Pagination
                totalItems={totalCount}
                pageIndex={filters?.pageIndex ?? 0}
                onChange={(pageIndex) => {
                  if (fetch) {
                    return;
                  }

                  setState({
                    products,
                    totalCount,
                    fetch: true,
                    filters: {
                      ...filters,
                      pageIndex: pageIndex,
                    },
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

/**
 * Types
 */
interface IState {
  fetch: boolean;
  filters: GetProductsParams;
  products: GetProduct[];
  totalCount: number;
}
