import type {
  CartDetail,
  DeliveryMethod,
  OrderDetail,
  OrderSummary,
  PaymentMethod,
  TimelineEvent,
} from "@/types";
import { DELIVERY_METHODS, deliveryFeeFor } from "@/services/cart";
import { placedOrdersService } from "@/services/placed-orders";
import { formatAED } from "@/lib/utils";

/**
 * CHECKOUT SERVICE (API-backed)
 * -----------------------------
 * placeOrder() POSTs to /api/v1/checkout/orders with an idempotency key.
 * The server validates stock, reserves inventory, computes authoritative
 * totals and creates the order; the client then builds the confirmation
 * detail (for the success page) from the returned summary + cart state.
 */

export interface CheckoutContact {
  fullName: string;
  email: string;
  phone: string;
}

export interface CheckoutAddress {
  emirate: string;
  city: string;
  street: string;
  note?: string;
}

export interface CheckoutPayload {
  contact: CheckoutContact;
  address: CheckoutAddress;
  deliveryMethod: DeliveryMethod;
  paymentMethod: PaymentMethod;
  /** UAE law: nicotine products are 18+ — must be declared at checkout. */
  declaredAge18Plus: boolean;
}

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  "cash-on-delivery": "Cash on delivery",
  "card-on-delivery": "Card on delivery (machine brought to you)",
  "saved-card": "Saved card (online payments)",
};

function shortStamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-AE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Dubai",
    }).format(date);
  } catch {
    return iso.slice(0, 16);
  }
}

function buildTimeline(placedAt: string, express: boolean): TimelineEvent[] {
  const stamp = shortStamp(placedAt);
  return [
    { id: "t1", label: "Order placed", at: stamp, completed: true },
    {
      id: "t2",
      label: "Age & payment verification",
      at: "At the door",
      completed: false,
      note: "Emirates ID checked by the courier on delivery.",
    },
    { id: "t3", label: "Packed", at: "Pending", completed: false },
    { id: "t4", label: "Handed to courier", at: "Pending", completed: false },
    {
      id: "t5",
      label: express ? "Delivered — next day" : "Delivered — ID checked at door",
      at: "Pending",
      completed: false,
    },
  ];
}

interface PlaceOrderResponse {
  data?: OrderSummary;
  error?: { code: string; message: string };
}

export const checkoutService = {
  /**
   * Places the current cart as an order via the backend. Resolves to the
   * created OrderSummary; throws with a user-safe message on failure.
   */
  async placeOrder(
    payload: CheckoutPayload,
    cart: CartDetail
  ): Promise<OrderSummary> {
    const purchasable = cart.lines.filter((line) => !line.blocked);
    if (purchasable.length === 0) {
      throw new Error("Your bag is empty — add a product from the shop first.");
    }

    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `key-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const response = await fetch("/api/v1/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        contact: payload.contact,
        address: {
          emirate: payload.address.emirate,
          city: payload.address.city,
          street: payload.address.street,
          note: payload.address.note,
        },
        deliveryMethod: payload.deliveryMethod,
        paymentMethod: payload.paymentMethod,
        declaredAge18Plus: payload.declaredAge18Plus,
        idempotencyKey,
      }),
    });

    const body = (await response.json().catch(() => ({}))) as PlaceOrderResponse;
    if (!response.ok || !body.data) {
      throw new Error(
        body.error?.message ?? "The order could not be placed. Please try again."
      );
    }

    const summary = body.data;
    const placedAt = summary.placedAt;
    const express = payload.deliveryMethod === "express";

    const subtotal = purchasable.reduce((sumLine, line) => sumLine + line.lineTotal, 0);
    const deliveryFee = deliveryFeeFor(subtotal, payload.deliveryMethod);
    const total = subtotal + deliveryFee;

    const addressEcho = [payload.address.city, payload.address.emirate].filter(Boolean).join(", ");
    const detail: OrderDetail = {
      reference: summary.reference,
      placedAt,
      status: summary.status,
      timeline: buildTimeline(placedAt, express),
      items: purchasable.map((line) => ({
        name: line.product.name,
        brand: line.product.brand,
        quantity: line.qty,
        variantLabel: line.variant?.label,
        lineTotalLabel: formatAED(line.lineTotal),
        image: line.product.images[0],
      })),
      statusHistory: [
        { status: "placed", at: shortStamp(placedAt) },
        { status: "processing", at: shortStamp(placedAt), note: "Awaiting courier dispatch" },
      ],
      supportHref: "/contact",
      documents: [{ id: `${summary.reference}-receipt`, title: "Delivery receipt", type: "pdf" }],
      deliveryLabel: `Courier to ${addressEcho} — ID verification on delivery`,
      paymentLabel: PAYMENT_LABELS[payload.paymentMethod],
      totalLabel: formatAED(total),
    };

    placedOrdersService.add(summary, detail);
    return summary;
  },

  /** Keep the delivery label helper available for display surfaces. */
  fulfilmentLabel(method: DeliveryMethod): string {
    return `${DELIVERY_METHODS[method].label} · ${DELIVERY_METHODS[method].eta}`;
  },
};
