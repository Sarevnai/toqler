// Stripe price IDs mapped to plan slugs and billing cycles
export const STRIPE_PRICES: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: "price_1T1u96JTl42IWyghCzoccWrR",
    yearly: "price_1T1u9wJTl42IWyghtgUfnz7p",
  },
  business: {
    monthly: "price_1T1uAYJTl42IWyghYDpgWZ95",
    yearly: "price_1T1uAnJTl42IWygh6u0RqqPi",
  },
};

export function getStripePriceId(planSlug: string, billingCycle: "monthly" | "yearly"): string | null {
  return STRIPE_PRICES[planSlug]?.[billingCycle] || null;
}
