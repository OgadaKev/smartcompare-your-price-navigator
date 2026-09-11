export type VendorId =
  | "jumia"
  | "kilimall"
  | "jiji"
  | "amazon"
  | "naivas"
  | "quickmart"
  | "carrefour";

export interface Vendor {
  id: VendorId;
  name: string;
  initial: string;
  /** store reliability rating out of 5 */
  rating: number;
  deliveryDays: number;
  /** builds the vendor's own search page URL */
  searchUrl: (query: string) => string;
}

export const VENDORS: Vendor[] = [
  {
    id: "jumia",
    name: "Jumia",
    initial: "J",
    rating: 4.6,
    deliveryDays: 2,
    searchUrl: (q) => `https://www.jumia.co.ke/catalog/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "kilimall",
    name: "Kilimall",
    initial: "K",
    rating: 4.4,
    deliveryDays: 3,
    searchUrl: (q) => `https://www.kilimall.co.ke/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "jiji",
    name: "Jiji",
    initial: "Ji",
    rating: 4.1,
    deliveryDays: 1,
    searchUrl: (q) => `https://jiji.co.ke/search?query=${encodeURIComponent(q)}`,
  },
  {
    id: "amazon",
    name: "Amazon",
    initial: "A",
    rating: 4.7,
    deliveryDays: 9,
    searchUrl: (q) => `https://www.amazon.com/s?k=${encodeURIComponent(q)}`,
  },
  {
    id: "naivas",
    name: "Naivas",
    initial: "N",
    rating: 4.3,
    deliveryDays: 2,
    searchUrl: (q) => `https://naivas.online/catalogsearch/result/?q=${encodeURIComponent(q)}`,
  },
  {
    id: "quickmart",
    name: "Quickmart",
    initial: "Q",
    rating: 4.2,
    deliveryDays: 2,
    searchUrl: (q) => `https://www.quickmart.co.ke/search?q=${encodeURIComponent(q)}`,
  },
  {
    id: "carrefour",
    name: "Carrefour",
    initial: "C",
    rating: 4.5,
    deliveryDays: 3,
    searchUrl: (q) => `https://www.carrefour.ke/mafken/en/v4/search?keyword=${encodeURIComponent(q)}`,
  },
];

export const CATEGORIES = ["All", "Electronics", "Groceries", "Fashion", "Household"] as const;
export type Category = (typeof CATEGORIES)[number];

export const REGIONS = [
  "Nairobi · Kenya",
  "Mombasa · Kenya",
  "Kisumu · Kenya",
  "Nakuru · Kenya",
  "Kampala · Uganda",
  "Dar es Salaam · Tanzania",
] as const;

export interface Offer {
  key: string;
  vendorId: VendorId;
  vendorName: string;
  title: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  imageUrl: string | null;
  productUrl: string;
  inStock: boolean;
  rating: number;
  deliveryDays: number;
  /** true when the price came from a live vendor page */
  live: boolean;
}

export interface PricePoint {
  day: string;
  price: number;
}

export interface SearchPayload {
  query: string;
  category: string;
  region: string;
  offers: Offer[];
  history: PricePoint[];
  fetchedAt: string;
}

export interface SearchResponse extends SearchPayload {
  cached: boolean;
}

export function formatMoney(value: number, currency = "KES") {
  return `${currency} ${Math.round(value).toLocaleString("en-KE")}`;
}

export function discountPercent(offer: Offer) {
  if (!offer.oldPrice || offer.oldPrice <= offer.price) return null;
  return Math.round(((offer.oldPrice - offer.price) / offer.oldPrice) * 100);
}

/** Deterministic 32-bit hash so mock fallback prices stay stable per query. */
export function hashString(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

const CATEGORY_BASE: Record<string, number> = {
  Electronics: 24000,
  Groceries: 850,
  Fashion: 3200,
  Household: 6400,
  All: 7800,
};

export function basePriceFor(query: string, category: string) {
  const seed = hashString(query.toLowerCase().trim());
  const base = CATEGORY_BASE[category] ?? CATEGORY_BASE["All"]!;
  return Math.round(base * (0.6 + ((seed % 1000) / 1000) * 1.6));
}

/**
 * Realistic fallback offers used while live vendor pages load, or when a
 * vendor page cannot be read.
 */
export function buildFallbackOffer(
  vendor: Vendor,
  query: string,
  category: string,
  basePrice: number,
): Offer {
  const seed = hashString(`${vendor.id}:${query.toLowerCase()}`);
  const spread = 0.86 + ((seed % 40) / 100);
  const price = Math.round((basePrice * spread) / 10) * 10;
  const hasDiscount = seed % 3 !== 0;
  return {
    key: `${vendor.id}:${query.toLowerCase().trim()}`,
    vendorId: vendor.id,
    vendorName: vendor.name,
    title: `${query} — ${category === "All" ? "top match" : category.toLowerCase()} at ${vendor.name}`,
    price,
    oldPrice: hasDiscount ? Math.round((price * (1.12 + (seed % 25) / 100)) / 10) * 10 : null,
    currency: "KES",
    imageUrl: null,
    productUrl: vendor.searchUrl(query),
    inStock: seed % 11 !== 0,
    rating: vendor.rating,
    deliveryDays: vendor.deliveryDays,
    live: false,
  };
}

/** 30 days of plausible price movement around the cheapest live price. */
export function buildHistory(query: string, lowest: number): PricePoint[] {
  const seed = hashString(`history:${query.toLowerCase()}`);
  const points: PricePoint[] = [];
  const today = new Date();
  for (let i = 29; i >= 0; i -= 1) {
    const day = new Date(today.getTime() - i * 86400000);
    const wave = Math.sin((i + (seed % 17)) / 3.4) * 0.05;
    const drift = (i / 29) * 0.12;
    points.push({
      day: day.toISOString().slice(0, 10),
      price: Math.round((lowest * (1 + wave + drift)) / 10) * 10,
    });
  }
  return points;
}

export type BadgeKind = "best" | "lowest" | "fastest" | "value" | null;

export function badgeFor(offer: Offer, offers: Offer[]): BadgeKind {
  const inStock = offers.filter((o) => o.inStock);
  const pool = inStock.length ? inStock : offers;
  const lowest = pool.reduce((a, b) => (a.price <= b.price ? a : b));
  const fastest = pool.reduce((a, b) => (a.deliveryDays <= b.deliveryDays ? a : b));
  if (offer.key === lowest.key) return "lowest";
  if (offer.key === fastest.key) return "fastest";
  if (offer.rating >= 4.5) return "value";
  return null;
}

/** Best overall deal = lowest price weighted by store rating and stock. */
export function bestOverall(offers: Offer[]): Offer | null {
  if (!offers.length) return null;
  return offers
    .map((offer) => ({
      offer,
      score:
        offer.price *
        (offer.inStock ? 1 : 1.25) *
        (1 + (5 - offer.rating) * 0.05) *
        (1 + offer.deliveryDays * 0.012),
    }))
    .sort((a, b) => a.score - b.score)[0]!.offer;
}
