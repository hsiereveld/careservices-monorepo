/**
 * Utility functions for price calculations throughout the application
 */

/**
 * Calculate detailed price breakdown based on cost price, VAT rate, and commission percentage
 */
export function calculateDetailedPrices(
  costPrice: number,
  unusedParam: number = 0, // Kept for backward compatibility
  vatRate: number = 21,
  adminPercentage: number = 15,
  effectiveCommissionRate?: number // New parameter for the effective commission rate
) {
  // Use the effective commission rate if provided, otherwise use the adminPercentage
  const commissionRate = effectiveCommissionRate !== undefined ? effectiveCommissionRate : adminPercentage;
  
  // Calculate admin fee (commission)
  const adminFee = costPrice * (commissionRate / 100);
  
  // Calculate net price (price without VAT)
  const netPrice = costPrice + adminFee;
  
  // Calculate VAT amount
  const vatAmount = netPrice * (vatRate / 100);
  
  // Calculate selling price (price with VAT)
  const sellingPrice = netPrice + vatAmount;
  
  // Calculate profit (which is the admin fee)
  const profit = adminFee;
  
  // Calculate margin percentage based on cost price
  const marginPercentage = costPrice > 0 ? (profit / costPrice) * 100 : 0;
  
  return {
    sellingPrice,
    netPrice,
    vatAmount,
    adminFee,
    costPrice,
    profit,
    marginPercentage,
    adminPercentageValue: commissionRate, // Use the effective rate here
    vatRateValue: vatRate
  };
}

/**
 * Calculate margin percentage based on profit and cost price
 */
function calculateMarginPercentage(profit: number, costPrice: number): number {
  if (!costPrice || costPrice <= 0) return 0;
  return (profit / costPrice) * 100;
}

/**
 * Calculate simple margin percentage based on cost price and admin percentage
 */
export function calculateSimpleMarginPercentage(
  costPrice: number,
  unusedParam: number = 0, // Kept for backward compatibility
  vatRate: number = 21,
  adminPercentage: number = 15,
  effectiveCommissionRate?: number // New parameter for the effective commission rate
): number {
  const { marginPercentage } = calculateDetailedPrices(
    costPrice, 
    0, 
    vatRate, 
    adminPercentage, 
    effectiveCommissionRate
  );
  return marginPercentage;
}