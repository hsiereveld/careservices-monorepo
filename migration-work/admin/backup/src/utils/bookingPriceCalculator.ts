import { PriceUnitType } from '../lib/supabase';
import { calculateDetailedPrices } from './priceCalculations';

/**
 * Calculate the estimated price for a booking based on the price unit, base price, and duration
 */
export function calculateEstimatedPrice(
  basePrice: number,
  priceUnit: PriceUnitType,
  bookingStartDate?: string,
  bookingStartTime?: string,
  bookingEndDate?: string,
  bookingEndTime?: string,
  durationHours?: number,
  durationDays?: number
): number {
  // If we already have a calculated duration, use it
  if (durationHours !== undefined) {
    return calculatePriceFromDuration(basePrice, priceUnit, durationHours, durationDays);
  }

  // If we don't have start and end dates/times, return the base price for per_service
  // or assume 1 hour/day for other units
  if (!bookingStartDate || !bookingStartTime) {
    return calculatePriceFromDuration(basePrice, priceUnit, 1, 1);
  }

  // If we have start date/time but no end date/time, assume 1 hour/day duration
  if (!bookingEndDate || !bookingEndTime) {
    return calculatePriceFromDuration(basePrice, priceUnit, 1, 1);
  }

  // Calculate duration between start and end date/time
  const startDateTime = new Date(`${bookingStartDate}T${bookingStartTime}`);
  const endDateTime = new Date(`${bookingEndDate}T${bookingEndTime}`);

  // Calculate duration in milliseconds
  const durationMs = endDateTime.getTime() - startDateTime.getTime();
  
  // Convert to hours and days
  const calculatedHours = durationMs / (1000 * 60 * 60);
  const calculatedDays = durationMs / (1000 * 60 * 60 * 24);

  return calculatePriceFromDuration(basePrice, priceUnit, calculatedHours, calculatedDays);
}

/**
 * Calculate price based on duration and price unit
 */
function calculatePriceFromDuration(
  basePrice: number,
  priceUnit: PriceUnitType,
  hours: number,
  days?: number
): number {
  let totalCostPrice = 0;
  
  switch (priceUnit) {
    case 'per_hour':
      totalCostPrice = basePrice * hours;
      break;
    case 'per_day':
      totalCostPrice = basePrice * (days || Math.ceil(hours / 24));
      break;
    case 'per_week':
      totalCostPrice = basePrice * (Math.ceil((days || Math.ceil(hours / 24)) / 7));
      break;
    case 'per_month':
      totalCostPrice = basePrice * (Math.ceil((days || Math.ceil(hours / 24)) / 30));
      break;
    case 'per_km':
      // For per_km, we need a distance value which we don't have here
      // So we'll just return the base price
      totalCostPrice = basePrice;
      break;
    case 'per_item':
      // For per_item, we need a quantity which we don't have here
      // So we'll just return the base price
      totalCostPrice = basePrice;
      break;
    case 'per_service':
    default:
      // For per_service, the price is fixed regardless of duration
      totalCostPrice = basePrice;
      break;
  }
  
  // Calculate the selling price (including commission and VAT)
  const { sellingPrice } = calculateDetailedPrices(totalCostPrice, 0, 21, 15);
  
  return sellingPrice;
}

/**
 * Get a formatted label for the price unit
 */
export function getPriceUnitLabel(priceUnit: PriceUnitType): string {
  switch (priceUnit) {
    case 'per_hour': return 'per uur';
    case 'per_day': return 'per dag';
    case 'per_service': return 'per service';
    case 'per_km': return 'per km';
    case 'per_item': return 'per stuk';
    case 'per_month': return 'per maand';
    case 'per_week': return 'per week';
    default: return 'per uur';
  }
}