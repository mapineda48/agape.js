import { listItems, getItemById, type ListItemsResult, type IItemRecord } from "#svc/catalogs/item";

/**
 * Retrieves the list of public products available in the store.
 * Filters only enabled items.
 */
export async function getPublicProducts(
    search?: string
): Promise<ListItemsResult> {
    return listItems({
        isEnabled: true,
        fullName: search,
        // By default showing products (goods) and services if they are in the catalog.
        // Use pageIndex/pageSize as defaults from the service if needed,
        // or we can expose params here. For this demo, fetching default page is fine.
        pageSize: 50, // Fetch enough items for the landing page
    });
}

/**
 * Retrieves a single product by its ID.
 * Returns undefined if the product is not found or is disabled.
 */
export async function getPublicProductById(
    id: number
): Promise<IItemRecord | undefined> {
    const product = await getItemById(id);

    // Only return if product exists and is enabled
    if (product && product.isEnabled) {
        return product;
    }

    return undefined;
}
