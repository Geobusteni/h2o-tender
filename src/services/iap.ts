import { Platform } from 'react-native';
import * as IAP from 'expo-iap';
import { DONATION_PRODUCT_IDS, DonationTier } from '../models/iap';

/**
 * Initialize the IAP connection
 */
export async function initializeIAP(): Promise<void> {
  try {
    await IAP.connectAsync();
  } catch (error) {
    console.error('Failed to initialize IAP:', error);
    throw new Error('Could not connect to the app store');
  }
}

/**
 * Fetch available donation products from the store
 */
export async function getProducts(): Promise<DonationTier[]> {
  try {
    const productIds =
      Platform.OS === 'ios'
        ? DONATION_PRODUCT_IDS.ios
        : DONATION_PRODUCT_IDS.android;

    const { results } = await IAP.getProductsAsync(productIds);

    if (!results || results.length === 0) {
      throw new Error('No products available');
    }

    // Map store products to our DonationTier format
    const tiers: DonationTier[] = results.map((product) => ({
      productId: product.productId,
      title: product.title,
      description: product.description || '',
      price: product.priceString,
    }));

    return tiers;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    throw new Error('Could not load donation options');
  }
}

/**
 * Purchase a donation product
 */
export async function purchaseDonation(productId: string): Promise<void> {
  try {
    await IAP.purchaseItemAsync(productId);
    // Purchase successful - the transaction will be handled by listeners
  } catch (error: unknown) {
    console.error('Purchase failed:', error);

    // Handle user cancellation gracefully
    if (error && typeof error === 'object' && 'code' in error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'E_USER_CANCELLED') {
        throw new Error('Purchase cancelled');
      }
    }

    throw new Error('Purchase failed. Please try again.');
  }
}

/**
 * Finish a transaction (acknowledge purchase)
 */
export async function finishTransaction(
  purchase: IAP.IAPItemDetails,
  isConsumable: boolean = true
): Promise<void> {
  try {
    await IAP.finishTransactionAsync(purchase, isConsumable);
  } catch (error) {
    console.error('Failed to finish transaction:', error);
  }
}

/**
 * Cleanup IAP listeners and disconnect
 */
export async function cleanup(): Promise<void> {
  try {
    await IAP.disconnectAsync();
  } catch (error) {
    console.error('Failed to cleanup IAP:', error);
  }
}

/**
 * Get purchase history (for restoring purchases if needed)
 */
export async function getPurchaseHistory(): Promise<IAP.IAPItemDetails[]> {
  try {
    const { results } = await IAP.getPurchaseHistoryAsync();
    return results || [];
  } catch (error) {
    console.error('Failed to get purchase history:', error);
    return [];
  }
}
