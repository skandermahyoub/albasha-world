/**
 * Centralized Financial Metrics Module
 *
 * Single source of truth for ALL financial calculations across the app.
 * Every admin page MUST import from this module — no inline financial formulas.
 *
 * Truth Sources:
 * ─────────────
 * Order status      → Order.status
 * Order value        → Order.total
 * Revenue (preferred)→ SystemTransaction: order_profit + order_return
 * Revenue (fallback) → Order: delivered total − returned total
 * Inventory movement → InventoryMovement
 * Sales count        → Product.sales_count
 * Expenses           → Expense
 *
 * Indicator Definitions:
 * ────────────────────
 * Active Orders Value  = sum of non-cancelled, non-returned orders (NOT revenue)
 * Gross Sales          = sum(order_profit) — all-or-nothing: falls back to order status if incomplete
 * Refunds              = abs(sum(order_return)) — all-or-nothing
 * Net Revenue          = sum(order_profit + order_return) — all-or-nothing
 * Estimated Profit     = Net Revenue − Expenses  (COGS not available → "estimated")
 */

// ═══════════════════════════════════════════════════════════════
// STATUS CONSTANTS
// ═══════════════════════════════════════════════════════════════

/** Statuses that count as active orders (not final) */
export const ACTIVE_STATUSES = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

/** Statuses that count as fulfilled sales (reached delivery, includes returned) */
export const FULFILLED_STATUSES = ['delivered', 'returned'];

// ═══════════════════════════════════════════════════════════════
// TRANSACTION COMPLETENESS VALIDATION
// ═══════════════════════════════════════════════════════════════

/**
 * Validate whether SystemTransaction records are complete for the given orders.
 * All-or-nothing: if ANY delivered/returned order lacks a corresponding transaction,
 * we fall back to order-based calculations to avoid producing misleading partial numbers.
 */
export function validateTransactionCompleteness(orders = [], transactions = []) {
  const fulfilledOrders = orders.filter(o => o.status === 'delivered' || o.status === 'returned');
  const returnedOrders = orders.filter(o => o.status === 'returned');
  const profitTxns = transactions.filter(t => t.type === 'order_profit');
  const returnTxns = transactions.filter(t => t.type === 'order_return');

  return {
    isComplete: fulfilledOrders.length === profitTxns.length && returnedOrders.length === returnTxns.length,
    expectedProfitTxns: fulfilledOrders.length,
    actualProfitTxns: profitTxns.length,
    expectedReturnTxns: returnedOrders.length,
    actualReturnTxns: returnTxns.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// ORDER-LEVEL HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Get the financial category of an order.
 * @param {Object} order
 * @returns {'active'|'fulfilled'|'returned'|'cancelled'|'unknown'}
 */
export function getOrderFinancialStatus(order) {
  if (!order) return 'unknown';
  if (order.status === 'cancelled') return 'cancelled';
  if (order.status === 'returned') return 'returned';
  if (order.status === 'delivered') return 'fulfilled';
  return 'active';
}

/**
 * Extract delivery date from order status_history.
 * @returns {string|null} ISO date string
 */
export function getOrderDeliveryDate(order) {
  if (!order?.status_history) return null;
  const entry = order.status_history.find(h => h.status === 'delivered');
  return entry?.date || null;
}

/**
 * Extract return date from order status_history.
 * @returns {string|null} ISO date string
 */
export function getOrderReturnDate(order) {
  if (!order?.status_history) return null;
  const entry = order.status_history.find(h => h.status === 'returned');
  return entry?.date || null;
}

// ═══════════════════════════════════════════════════════════════
// REVENUE CALCULATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate total value of active orders (non-cancelled, non-returned).
 * These are NOT revenue — they represent pending/potential sales value.
 */
export function calculateActiveOrdersValue(orders = []) {
  return orders
    .filter(o => o.status !== 'cancelled' && o.status !== 'returned')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}

/**
 * Calculate gross sales = sum of all order_profit transactions (preferred).
 * Fallback: sum of delivered + returned orders' total (they all reached delivery).
 * This represents total fulfilled sales BEFORE returns.
 */
export function calculateGrossSales(orders = [], transactions = []) {
  if (transactions && transactions.length > 0) {
    const validation = validateTransactionCompleteness(orders, transactions);
    if (validation.isComplete) {
      return transactions
        .filter(t => t.type === 'order_profit')
        .reduce((sum, t) => sum + (t.amount || 0), 0);
    }
  }
  // Fallback: sum of delivered + returned orders' total
  return orders
    .filter(o => o.status === 'delivered' || o.status === 'returned')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}

/**
 * Calculate refund value from SystemTransaction records (order_return type).
 */
export function calculateRefundsFromTransactions(transactions = []) {
  return transactions
    .filter(t => t.type === 'order_return')
    .reduce((sum, t) => sum + Math.abs(t.amount || 0), 0);
}

/**
 * Calculate refund value from orders (fallback).
 */
export function calculateRefundsFromOrders(orders = []) {
  return orders
    .filter(o => o.status === 'returned')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}

/**
 * Calculate net revenue from SystemTransaction records (preferred source).
 * Net revenue = sum(order_profit) + sum(order_return).
 * Note: order_return amounts are negative, so addition gives net.
 */
export function calculateNetRevenueFromTransactions(transactions = []) {
  return transactions
    .filter(t => t.type === 'order_profit' || t.type === 'order_return')
    .reduce((sum, t) => sum + (t.amount || 0), 0);
}

/**
 * Calculate net revenue from orders (fallback when transactions unavailable).
 * Net revenue = gross sales − returns.
 * Note: When no transactions exist, returned orders' original delivery value
 * is unknown, so we approximate as sum of delivered orders only.
 */
export function calculateNetRevenueFromOrders(orders = []) {
  return orders
    .filter(o => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total || 0), 0);
}

/**
 * Calculate net revenue — uses transactions if available, falls back to orders.
 * This is the single entry point all pages should use.
 */
export function calculateNetRevenue(orders = [], transactions = []) {
  if (transactions && transactions.length > 0) {
    const validation = validateTransactionCompleteness(orders, transactions);
    if (validation.isComplete) {
      return calculateNetRevenueFromTransactions(transactions);
    }
  }
  // Fallback: delivered orders only (returned orders' original value unknown)
  return calculateNetRevenueFromOrders(orders);
}

/**
 * Calculate refunds — uses transactions if available, falls back to orders.
 */
export function calculateRefunds(orders = [], transactions = []) {
  if (transactions && transactions.length > 0) {
    const validation = validateTransactionCompleteness(orders, transactions);
    if (validation.isComplete) {
      return calculateRefundsFromTransactions(transactions);
    }
  }
  // Fallback: sum of returned orders' total
  return calculateRefundsFromOrders(orders);
}

/**
 * Get the financial date for a transaction (prefers explicit date, falls back to created_date).
 */
export function getTransactionDate(t) {
  if (!t) return null;
  return t.date || t.created_date;
}

/**
 * Calculate per-store revenue distribution.
 * Uses SystemTransaction records (order_profit positive, order_return negative) when complete.
 * Falls back to order-based calculation otherwise.
 * Distributes transaction amount across stores proportionally by order items' value.
 *
 * @param {Array} orders - All orders
 * @param {Array} transactions - SystemTransaction records
 * @param {Object} productStoreMap - Map of product_id → store_key
 * @returns {Object} { [storeKey]: { revenue: number, orders: number } }
 */
export function calculateStoreRevenue(orders = [], transactions = [], productStoreMap = {}) {
  const result = {};
  const validation = validateTransactionCompleteness(orders, transactions);
  const useTransactions = transactions && transactions.length > 0 && validation.isComplete;

  if (useTransactions) {
    const orderByNumber = {};
    orders.forEach(o => { if (o.order_number) orderByNumber[o.order_number] = o; });

    transactions.forEach(t => {
      if (t.type !== 'order_profit' && t.type !== 'order_return') return;
      const order = orderByNumber[t.order_number];
      if (!order || !order.items) return;

      // Calculate store distribution from order items
      const storeValues = {};
      let totalItemsValue = 0;
      (order.items || []).forEach(item => {
        const sk = productStoreMap[item.product_id];
        if (!sk) return;
        const itemValue = (item.price || 0) * (item.quantity || 1);
        storeValues[sk] = (storeValues[sk] || 0) + itemValue;
        totalItemsValue += itemValue;
      });
      if (totalItemsValue === 0) return;

      // Distribute transaction amount proportionally
      Object.entries(storeValues).forEach(([sk, value]) => {
        const proportion = value / totalItemsValue;
        const allocatedAmount = (t.amount || 0) * proportion;
        if (!result[sk]) result[sk] = { revenue: 0, orders: 0 };
        result[sk].revenue += allocatedAmount;
        if (t.type === 'order_profit') result[sk].orders++;
      });
    });
  } else {
    // Fallback: use order status
    orders.forEach(order => {
      if (order.status !== 'delivered' && order.status !== 'returned') return;
      const storeValues = {};
      let totalItemsValue = 0;
      (order.items || []).forEach(item => {
        const sk = productStoreMap[item.product_id];
        if (!sk) return;
        const itemValue = (item.price || 0) * (item.quantity || 1);
        storeValues[sk] = (storeValues[sk] || 0) + itemValue;
        totalItemsValue += itemValue;
      });
      if (totalItemsValue === 0) return;

      const multiplier = order.status === 'returned' ? -1 : 1;
      Object.entries(storeValues).forEach(([sk, value]) => {
        const proportion = value / totalItemsValue;
        const allocatedAmount = (order.total || 0) * proportion * multiplier;
        if (!result[sk]) result[sk] = { revenue: 0, orders: 0 };
        result[sk].revenue += allocatedAmount;
        result[sk].orders++;
      });
    });
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// ORDER COUNTS
// ═══════════════════════════════════════════════════════════════

/**
 * Count orders by status.
 * @returns {Object} { all, pending, confirmed, preparing, shipped, delivered, cancelled, returned }
 */
export function calculateOrderCounts(orders = []) {
  return {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    confirmed: orders.filter(o => o.status === 'confirmed').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    returned: orders.filter(o => o.status === 'returned').length,
  };
}

/**
 * Calculate average order value = net revenue / delivered orders count.
 */
export function calculateAverageOrderValue(orders = [], transactions = []) {
  const deliveredCount = orders.filter(o => o.status === 'delivered').length;
  if (deliveredCount === 0) return 0;
  return calculateNetRevenue(orders, transactions) / deliveredCount;
}

// ═══════════════════════════════════════════════════════════════
// EXPENSES & PROFIT
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate total expenses.
 */
export function calculateTotalExpenses(expenses = []) {
  return expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
}

/**
 * Calculate estimated profit = net revenue − expenses.
 *
 * NOTE: This is "estimated" because cost of goods (COGS) is NOT stored
 * in order items or products. The Product schema has no `cost` field,
 * and order items do not store historical cost.
 * True gross/net profit requires historical cost data.
 */
export function calculateEstimatedProfit(netRevenue, expenses = 0) {
  return netRevenue - expenses;
}

// ═══════════════════════════════════════════════════════════════
// PRODUCT HELPERS
// ═══════════════════════════════════════════════════════════════

/**
 * Count active products (status === 'active').
 */
export function countActiveProducts(products = []) {
  return products.filter(p => p.status === 'active').length;
}

// ═══════════════════════════════════════════════════════════════
// COMPREHENSIVE METRICS OBJECT
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate all financial metrics at once.
 * Pass this result to all dashboard components for consistency.
 *
 * @param {Array} orders - All orders
 * @param {Array} transactions - SystemTransaction records
 * @param {Array} expenses - Expense records
 * @param {Array} products - Product records
 * @returns {Object} All financial metrics
 */
export function calculateAllMetrics(orders = [], transactions = [], expenses = [], products = []) {
  const grossSales = calculateGrossSales(orders, transactions);
  const refunds = calculateRefunds(orders, transactions);
  const netRevenue = calculateNetRevenue(orders, transactions);
  const totalExpenses = calculateTotalExpenses(expenses);
  const transactionValidation = validateTransactionCompleteness(orders, transactions);

  return {
    // Revenue indicators
    activeOrdersValue: calculateActiveOrdersValue(orders),
    grossSales,
    refunds,
    netRevenue,

    // Order counts
    orderCounts: calculateOrderCounts(orders),
    averageOrderValue: calculateAverageOrderValue(orders, transactions),

    // Expenses & Profit
    totalExpenses,
    estimatedProfit: calculateEstimatedProfit(netRevenue, totalExpenses),
    // NOTE: COGS not available — grossProfit and netProfit cannot be calculated.
    // Product cost field does not exist in schema; order items do not store historical cost.

    // Products
    activeProducts: countActiveProducts(products),
    totalProducts: products.length,

    // Data completeness
    dataComplete: transactionValidation.isComplete,
    transactionValidation,
  };
}

// ═══════════════════════════════════════════════════════════════
// TIME-BASED FILTERING
// ═══════════════════════════════════════════════════════════════

/**
 * Get the financial date for an order.
 * Uses delivery date for delivered/returned orders, created_date otherwise.
 * @returns {string|null} ISO date string
 */
export function getOrderFinancialDate(order) {
  if (!order) return null;
  if (order.status === 'delivered' || order.status === 'returned') {
    return getOrderDeliveryDate(order) || order.created_date;
  }
  return order.created_date;
}

/**
 * Filter orders by a date range based on their financial date.
 */
export function filterOrdersByDateRange(orders = [], startDate, endDate) {
  return orders.filter(o => {
    const date = getOrderFinancialDate(o);
    if (!date) return false;
    const d = new Date(date);
    return d >= startDate && d <= endDate;
  });
}

/**
 * Filter transactions by a date range.
 */
export function filterTransactionsByDateRange(transactions = [], startDate, endDate) {
  return transactions.filter(t => {
    const date = t.date || t.created_date;
    if (!date) return false;
    const d = new Date(date);
    return d >= startDate && d <= endDate;
  });
}

/**
 * Filter expenses by a date range.
 */
export function filterExpensesByDateRange(expenses = [], startDate, endDate) {
  return expenses.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d >= startDate && d <= endDate;
  });
}