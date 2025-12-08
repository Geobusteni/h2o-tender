export interface DonationTier {
  productId: string;
  title: string;
  description: string;
  price: string;
}

export const DONATION_PRODUCT_IDS = {
  ios: [
    'com.h2otender.tip.small',
    'com.h2otender.tip.medium',
    'com.h2otender.tip.large',
  ],
  android: [
    'tip_small',
    'tip_medium',
    'tip_large',
  ],
};
