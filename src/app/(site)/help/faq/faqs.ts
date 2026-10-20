/**
 * VAPETIVE — Help centre FAQ dataset (typed, inline copy).
 * Rendered by /help/faq with search + category filtering.
 */

export const FAQ_CATEGORIES = ["Devices", "Liquids", "Safety", "Orders", "Account", "Privacy"] as const;

export type FaqCategory = (typeof FAQ_CATEGORIES)[number];

export interface FaqEntry {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

export const FAQS: FaqEntry[] = [
  /* ------------------------------ Devices ------------------------------ */
  {
    id: "brands-stocked",
    category: "Devices",
    question: "Which vape brands does VAPETIVE stock?",
    answer:
      "The most requested brands in the UAE: Al Fakher Vape, Elf Bar, Lost Mary, Geek Bar, Vozol Vape, Tugboat Vape, HQD Vape, Fummo Vape, Yuoto Vape, VGOD Stig, Maskking Vape and Silvaper Vape. The range covers disposable vapes, pod systems, bottled e-liquids, advanced kits and genuine coils — every listing shows its puff count, e-liquid capacity and nicotine strength, and is authenticity-checked before it goes on the wall.",
  },
  {
    id: "device-setup",
    category: "Devices",
    question: "How do I set up a new device for the first time?",
    answer:
      "Sealed disposables like the Elf Bar BC5000 are draw-activated — unbox and inhale. For pod systems and refillable kits, charge the battery fully over USB-C, seat the pod or coil, and wait five minutes after filling so the mesh coil saturates before the first draw. Button models power on and off with five quick presses. Full steps for your model are on its product page under Specifications.",
  },
  {
    id: "devices-rechargeable",
    category: "Devices",
    question: "Are the devices rechargeable?",
    answer:
      "Most larger disposables and every pod system we list are USB-C rechargeable — the Battery line in each product's Specifications tells you the capacity and charge type. Compact sealed sticks such as the VGOD Stig Original are built to outlast their e-liquid and are then disposed of at a battery collection point.",
  },
  {
    id: "coils-pods",
    category: "Devices",
    question: "Which coils and pods fit my device?",
    answer:
      "Pods and coils are brand- and model-specific, so always match the platform: ELFA Pro pods for the Elf Bar ELFA Pro, Q2 heads for the Geek Bar Wenax, 4-in-1 pods for the Lost Mary kit. Each listing in our Coils & Accessories collection states the platform it fits; if in doubt, WhatsApp us the model printed on your device and we will point you to the right pack.",
  },
  {
    id: "travel-device",
    category: "Devices",
    question: "Can I travel with my device?",
    answer:
      "Airline rules vary by carrier and destination, so always check your airline's policy before flying. As a general baseline: carry devices and liquids in cabin baggage, never in the hold; keep spare batteries away from metal objects; and confirm that vapor products are legal where you are going. Use is prohibited on board at all times.",
  },
  {
    id: "verify-authenticity",
    category: "Devices",
    question: "How does VAPETIVE verify authenticity?",
    answer:
      "We source through vetted official distribution channels, and every brand we stock ships with its own security feature — a scratch panel or QR code on the packaging. Our Dubai team checks stock against those marks before listing it. If you want to double-check a product you bought from us, WhatsApp us the code on the panel and we will verify it against our records.",
  },
  /* ------------------------------ Liquids ------------------------------ */
  {
    id: "store-liquids",
    category: "Liquids",
    question: "How should I store e-liquids?",
    answer:
      "Upright, tightly closed, out of direct sunlight and below 25 °C — and always out of reach of children and pets. Stored this way, bottled e-liquids are best enjoyed within twelve months of the date printed on the bottle.",
  },
  {
    id: "nicotine-strengths",
    category: "Liquids",
    question: "What nicotine strengths are available?",
    answer:
      "UAE rules cap e-liquids at 20 mg/ml. Disposables and pre-filled pods on VAPETIVE come filled with 20 mg/ml nicotine salt, bottled salts such as Al Fakher Salt 30 ml and Silvaper Salt 30 ml are offered at 10 and 20 mg/ml, and freebase lines like VGOD Cubano 60 ml run 0–6 mg/ml for refillable kits. Strengths are printed on every label and listed on each product page.",
  },
  {
    id: "salt-vs-freebase",
    category: "Liquids",
    question: "What is the difference between salt nicotine and freebase?",
    answer:
      "Nicotine salt is smoother at higher strengths and pairs with low-power pod systems for a tight mouth-to-lung draw — that is what ships in most disposables and pre-filled pods, usually as a 50/50 VG/PG blend. Freebase nicotine has a sharper throat hit and is used at lower strengths in bigger, cloudier vapor; VGOD Cubano 60 ml at 70/30 is the classic example. The Nicotine strength line in each listing tells you which is which.",
  },
  /* ------------------------------- Safety ------------------------------ */
  {
    id: "legal-age",
    category: "Safety",
    question: "What is the legal age to purchase nicotine products?",
    answer:
      "Eighteen. It is illegal to sell nicotine products to anyone under 18 in the United Arab Emirates, and age verification is applied at purchase and again at delivery.",
  },
  {
    id: "liquid-skin-contact",
    category: "Safety",
    question: "What should I do if liquid touches my skin?",
    answer:
      "Rinse the area with cool running water for several minutes and wash with soap. If liquid reaches your eyes, rinse continuously for fifteen minutes and seek medical advice. Keep the bottle for reference and report the incident to the support desk.",
  },
  {
    id: "dispose-device",
    category: "Safety",
    question: "How do I dispose of a used device or battery?",
    answer:
      "Never in household waste. Take depleted devices and cells to a battery collection point — most supermarkets and electronics retailers in the UAE provide them — and place empty liquid bottles in general recycling where local rules allow.",
  },
  /* ------------------------------- Orders ------------------------------ */
  {
    id: "how-ordering-works",
    category: "Orders",
    question: "How do I order from VAPETIVE?",
    answer:
      "Two ways. Add products to your bag and check out on the site with your delivery details, or send your list straight to our WhatsApp and a member of the Dubai team will confirm stock, total and delivery with you. Either route ends with the same courier handover — age-checked at your door.",
  },
  {
    id: "change-order",
    category: "Orders",
    question: "Can I change or cancel my order?",
    answer:
      "Orders can be changed or cancelled until they reach the packed stage; after that, refuse the delivery at the door or contact support to arrange a return.",
  },
  {
    id: "delivery-time",
    category: "Orders",
    question: "How long does delivery take?",
    answer:
      "Standard delivery completes within two to four business days anywhere in the UAE, and express next-day delivery is available where coverage allows. A valid Emirates ID check is completed at the door, as required for nicotine products.",
  },
  {
    id: "delivery-fees",
    category: "Orders",
    question: "What does delivery cost?",
    answer:
      "Standard delivery is free on orders of AED 200 or more and AED 25 below that, across all seven Emirates. Express next-day delivery — where available — is AED 35. The cart and checkout show the exact fee for your order before you confirm.",
  },
  {
    id: "payment-methods",
    category: "Orders",
    question: "What payment methods do you accept?",
    answer:
      "Cash on delivery and card on delivery — you pay the courier at the door, in cash or on the courier's machine. No online card charge happens today.",
  },
  {
    id: "returns-faulty",
    category: "Orders",
    question: "What if a device arrives faulty?",
    answer:
      "Contact support within seven days with your order reference and a photo or short video of the fault. We replace verified faulty devices or refund the order — the details are set out in our Terms of Sale. For hygiene reasons, opened e-liquids and pods can only be returned when the fault is confirmed.",
  },
  /* ------------------------------- Account ----------------------------- */
  {
    id: "reset-password",
    category: "Account",
    question: "How do I reset my password?",
    answer:
      "Choose Forgot password on the sign-in screen, enter your email and follow the secure link we send. Reset links expire for security — request a fresh one if yours has timed out.",
  },
  {
    id: "delete-saved-items",
    category: "Account",
    question: "How do I remove a saved product?",
    answer:
      "Open Saved in your account and deselect the bookmark on the product's card. Saved items sync to your account when you're signed in.",
  },
  /* ------------------------------- Privacy ----------------------------- */
  {
    id: "data-request",
    category: "Privacy",
    question: "How do I request a copy of my data?",
    answer:
      "Submit a request from the privacy page of your account or write to the privacy office. Under UAE Federal Decree-Law No. 45 of 2021 (PDPL) you can request access, rectification, deletion and portability of your personal data.",
  },
  {
    id: "cookies-tracking",
    category: "Privacy",
    question: "Do you use tracking cookies?",
    answer:
      "This release sets no marketing cookies. Strictly necessary cookies keep your session intact, and future analytics cookies will be consent-gated — the Cookie Notice describes the full picture.",
  },
];
