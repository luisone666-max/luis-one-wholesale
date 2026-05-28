import { getSiteUrl, siteName } from "@/lib/seo";

export type SeoGuide = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  keywords: string[];
  sections: {
    heading: string;
    body: string[];
  }[];
  ctaTitle: string;
  ctaText: string;
};

export const seoGuides: SeoGuide[] = [
  {
    slug: "philippines-wholesale-supply-for-resellers",
    eyebrow: "Wholesale Guide",
    title: "Wholesale Supply in the Philippines for Resellers and Shops",
    description:
      "Learn how Luis One Supply Hub helps Philippine resellers and shop owners browse public wholesale prices, build order lists, and choose J&T Express COD, store pickup, or Lalamove.",
    keywords: ["Philippines wholesale supply", "reseller wholesale Philippines", "shop owner wholesale ordering"],
    sections: [
      {
        heading: "Built for practical wholesale buying",
        body: [
          "Luis One Supply Hub is designed for resellers, shop owners, online sellers, and walk-in wholesale buyers who need a simple way to check prices before ordering.",
          "Product prices are public, so customers can compare items, review MOQ, and prepare an order list without waiting for a manual quotation first.",
        ],
      },
      {
        heading: "How ordering works",
        body: [
          "Customers browse products, select quantities, and submit a wholesale order list online. Our team then confirms availability, deposit requirements, pickup options, or delivery arrangement manually.",
          "There is no online payment on the website. This keeps the process flexible for bulk orders, special requests, J&T Express COD, store pickup, and Lalamove arrangements.",
        ],
      },
      {
        heading: "Categories in one supply hub",
        body: [
          "The catalog can include motorcycle parts, helmets, riding accessories, automotive supplies, electronics, and other fast-moving wholesale items.",
          "This helps buyers source multiple categories in one place instead of sending separate messages for every product.",
        ],
      },
    ],
    ctaTitle: "Start browsing wholesale products",
    ctaText: "Check public prices, MOQ, and stock status before sending your order list.",
  },
  {
    slug: "motorcycle-parts-wholesale-philippines",
    eyebrow: "Motorcycle Parts",
    title: "Motorcycle Parts Wholesale in the Philippines",
    description:
      "Browse wholesale motorcycle parts for resellers and shops, including scooter accessories, brackets, keysets, seats, levers, and other fast-moving replacement items.",
    keywords: ["motorcycle parts wholesale Philippines", "scooter parts reseller", "Honda Click parts wholesale"],
    sections: [
      {
        heading: "Fast-moving parts for resellers",
        body: [
          "Motorcycle parts are a strong wholesale category because many riders need replacement items, accessories, and practical upgrades for daily use.",
          "Luis One Supply Hub supports public price browsing for items such as seats, ignition keysets, topbox brackets, levers, cleaners, coolant, and related scooter products.",
        ],
      },
      {
        heading: "Model and fitment information matters",
        body: [
          "Many motorcycle products depend on model compatibility. Product pages can show model, fitment, variants, image references, MOQ, and wholesale price tiers.",
          "When a customer is unsure, the Messenger inquiry button helps them send product details quickly so our team can confirm the correct item.",
        ],
      },
      {
        heading: "Wholesale price tiers",
        body: [
          "Bulk pricing helps resellers plan margin before ordering. Price tiers can show lower unit prices for larger quantities, while product pages keep the current applied price clear.",
          "Orders are still confirmed manually so stock, lead time, and delivery method can be checked before payment or pickup.",
        ],
      },
    ],
    ctaTitle: "Browse motorcycle parts",
    ctaText: "See public wholesale prices and send an order list for manual confirmation.",
  },
  {
    slug: "how-to-place-wholesale-orders-online",
    eyebrow: "Ordering Process",
    title: "How to Place Wholesale Orders Online",
    description:
      "A simple guide for customers who want to browse products, register, add items to the order list, choose receiving method, and submit a wholesale order for manual confirmation.",
    keywords: ["how to place wholesale order", "online wholesale order list", "manual order confirmation"],
    sections: [
      {
        heading: "Step 1: Browse products and prices",
        body: [
          "Customers can browse product listings and product detail pages without logging in. Public wholesale prices, MOQ, stock status, and product images are visible first.",
          "This makes it easier to compare products before creating an account or contacting the team.",
        ],
      },
      {
        heading: "Step 2: Register or login before ordering",
        body: [
          "Registration is required only when placing an order. The account keeps customer name, phone, location, business type, and order history organized.",
          "After login, customers can add products to their order list, update quantities, and proceed to checkout.",
        ],
      },
      {
        heading: "Step 3: Submit for manual confirmation",
        body: [
          "At checkout, customers provide receiver information, receiving method, complete address when required, shipping fee payment choice, and order notes.",
          "The submitted order is not an automatic paid shipment. Our team reviews product availability, deposit requirements, and delivery or pickup arrangement manually.",
        ],
      },
    ],
    ctaTitle: "Create your wholesale account",
    ctaText: "Register to place wholesale orders and track submitted order lists.",
  },
  {
    slug: "freight-collect-lalamove-courier-pickup",
    eyebrow: "Delivery Options",
    title: "J&T Express COD, Lalamove, and Store Pickup for Wholesale Orders",
    description:
      "Understand how Luis One Supply Hub orders work with J&T Express COD, Lalamove delivery, and store pickup.",
    keywords: ["J&T Express COD Philippines wholesale", "Lalamove wholesale delivery", "store pickup wholesale order"],
    sections: [
      {
        heading: "Shipping is arranged manually",
        body: [
          "Wholesale orders often need manual handling because quantity, box size, courier, pickup schedule, and customer location can affect the final arrangement.",
          "Luis One Supply Hub lets customers choose J&T Express COD, store pickup, or Lalamove at checkout so the receiving method is clear before our team confirms the order.",
        ],
      },
      {
        heading: "Available receiving methods",
        body: [
          "Customers can choose J&T Express COD, store pickup, or Lalamove. Lalamove is not automatically booked by the website.",
          "For Lalamove, Luis One can manually book a rider after confirmation, or the customer can book and pay their own rider.",
        ],
      },
      {
        heading: "Why there is no automatic shipping fee",
        body: [
          "Automatic shipping can be inaccurate for wholesale orders because items may be bulky, mixed by category, or shipped through different couriers.",
          "Manual confirmation lets our team choose the practical arrangement and explain the final shipping plan before the order moves forward.",
        ],
      },
    ],
    ctaTitle: "Submit an order list",
    ctaText: "Choose your receiving method during checkout and our team will confirm the arrangement.",
  },
];

export function getSeoGuide(slug: string) {
  return seoGuides.find((guide) => guide.slug === slug) ?? null;
}

export function seoGuideUrl(slug: string) {
  return `${getSiteUrl()}/wholesale-guides/${slug}`;
}

export function seoGuideJsonLd(guide: SeoGuide) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    url: seoGuideUrl(guide.slug),
    publisher: {
      "@type": "Organization",
      name: siteName,
      logo: {
        "@type": "ImageObject",
        url: `${getSiteUrl()}/brand/luis-one-logo.jpg`,
      },
    },
    mainEntityOfPage: seoGuideUrl(guide.slug),
    keywords: guide.keywords.join(", "),
  };
}
