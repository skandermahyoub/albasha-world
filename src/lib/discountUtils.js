/**
 * Applies expired-discount prices locally for storefront display.
 * The storefront never writes Product records. Checkout repeats the same rule
 * server-side, so an expired promotion can never be charged accidentally.
 */
export async function revertExpiredDiscounts(products) {
  if (!products?.length) return products || [];
  const now = new Date();
  return products.map(product => {
    const expired = product.discount_end_date && product.old_price && new Date(product.discount_end_date) < now;
    if (!expired) return product;
    return {
      ...product,
      price: Number(product.old_price) || Number(product.price) || 0,
      old_price: null,
      discount_end_date: null,
    };
  });
}
