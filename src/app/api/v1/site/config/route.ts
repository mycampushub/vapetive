import { withApi, ok } from "@/server/api/guard";
import { getDeliveryConfig, getFeatureFlags } from "@/server/repos/settings";
import { DELIVERY_METHOD_LABELS } from "@/server/repos/cart";
import { STRIPE_SECRET_KEY } from "@/server/env";

/** Public storefront configuration (replaces client-side fee constants). */
export const GET = withApi({}, async () => {
  const [delivery, flags] = await Promise.all([getDeliveryConfig(), getFeatureFlags()]);
  return ok({
    delivery: {
      freeThreshold: delivery.freeThresholdFils / 100,
      methods: {
        standard: {
          ...DELIVERY_METHOD_LABELS.standard,
          fee: delivery.standardFeeFils / 100,
        },
        express: {
          ...DELIVERY_METHOD_LABELS.express,
          fee: delivery.expressFeeFils / 100,
        },
      },
    },
    payments: {
      cashOnDelivery: true,
      cardOnDelivery: true,
      cardOnline: Boolean(STRIPE_SECRET_KEY),
    },
    features: flags,
  });
});
