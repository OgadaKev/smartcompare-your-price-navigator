import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  VENDORS,
  basePriceFor,
  buildFallbackOffer,
  buildHistory,
  type Offer,
  type SearchPayload,
  type SearchResponse,
  type Vendor,
} from "./vendors";
import type { Database } from "@/integrations/supabase/types";

const inputSchema = z.object({
  query: z.string().min(1).max(120),
  category: z.string().default("All"),
  region: z.string().default("Nairobi · Kenya"),
});

function cacheKey(query: string, category: string, region: string) {
  return `${query.toLowerCase().trim()}|${category}|${region}`;
}

function publicClient() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

interface ExtractedProduct {
  title?: string;
  price?: number | string;
  old_price?: number | string;
  image_url?: string;
  product_url?: string;
  in_stock?: boolean;
  currency?: string;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(cleaned) && cleaned > 0) return cleaned;
  }
  return null;
}

async function scrapeVendor(vendor: Vendor, query: string): Promise<Offer | null> {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const connectionKey = process.env["FIRECRAWL_API_KEY"];
  if (!lovableKey || !connectionKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 22000);
  try {
    const response = await fetch("https://connector-gateway.lovable.dev/firecrawl/v2/scrape", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
      },
      body: JSON.stringify({
        url: vendor.searchUrl(query),
        onlyMainContent: true,
        formats: [
          {
            type: "json",
            prompt: `Return the single most relevant product on this search results page for "${query}". Use the listed selling price as a plain number in the page's currency, the absolute product image URL and the absolute product page URL.`,
            schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                price: { type: "number" },
                old_price: { type: "number" },
                currency: { type: "string" },
                image_url: { type: "string" },
                product_url: { type: "string" },
                in_stock: { type: "boolean" },
              },
              required: ["title", "price"],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`Firecrawl scrape failed for ${vendor.id} [${response.status}]: ${body}`);
      return null;
    }

    const result = (await response.json()) as {
      json?: ExtractedProduct;
      data?: { json?: ExtractedProduct };
    };
    const extracted = result.json ?? result.data?.json;
    const price = toNumber(extracted?.price);
    if (!extracted?.title || !price) return null;

    const currency = vendor.id === "amazon" ? "USD" : "KES";
    return {
      key: `${vendor.id}:${query.toLowerCase().trim()}`,
      vendorId: vendor.id,
      vendorName: vendor.name,
      title: extracted.title.slice(0, 160),
      price: currency === "USD" ? Math.round(price * 129) : price,
      oldPrice: (() => {
        const old = toNumber(extracted.old_price);
        if (!old || old <= price) return null;
        return currency === "USD" ? Math.round(old * 129) : old;
      })(),
      currency: "KES",
      imageUrl: extracted.image_url?.startsWith("http") ? extracted.image_url : null,
      productUrl: extracted.product_url?.startsWith("http")
        ? extracted.product_url
        : vendor.searchUrl(query),
      inStock: extracted.in_stock !== false,
      rating: vendor.rating,
      deliveryDays: vendor.deliveryDays,
      live: true,
    };
  } catch (error) {
    console.error(`Firecrawl scrape error for ${vendor.id}:`, error);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export const searchOffers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<SearchResponse> => {
    const query = data.query.trim();
    const key = cacheKey(query, data.category, data.region);

    const supabase = publicClient();
    const { data: cached } = await supabase
      .from("search_cache")
      .select("payload")
      .eq("cache_key", key)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    if (cached?.payload) {
      return { ...(cached.payload as unknown as SearchPayload), cached: true };
    }

    const base = basePriceFor(query, data.category);
    const settled = await Promise.allSettled(VENDORS.map((v) => scrapeVendor(v, query)));

    const offers: Offer[] = VENDORS.map((vendor, index) => {
      const outcome = settled[index];
      const live = outcome && outcome.status === "fulfilled" ? outcome.value : null;
      return live ?? buildFallbackOffer(vendor, query, data.category, base);
    });

    const lowest = offers.reduce((a, b) => (a.price <= b.price ? a : b)).price;
    const payload: SearchPayload = {
      query,
      category: data.category,
      region: data.region,
      offers,
      history: buildHistory(query, lowest),
      fetchedAt: new Date().toISOString(),
    };

    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("search_cache").upsert({
        cache_key: key,
        query,
        category: data.category,
        region: data.region,
        payload: payload as unknown as never,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error("Failed to cache search results:", error);
    }

    return { ...payload, cached: false };
  });

export const suggestQueries = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ term: z.string().max(80) }).parse(data))
  .handler(async ({ data }) => {
    const term = data.term.trim().toLowerCase();
    const catalogue = [
      "wireless earbuds",
      "samsung galaxy a35 5g",
      "iphone 15 128gb",
      "hp laptop 15s",
      "smart tv 43 inch",
      "cooking oil 5 litres",
      "unga wa ngano 2kg",
      "basmati rice 5kg",
      "gas cylinder 13kg refill",
      "microwave oven",
      "blender 2 in 1",
      "office chair",
      "nike air force 1",
      "school shoes black",
      "washing machine 7kg",
      "solar lamp",
      "milk 500ml",
      "sugar 2kg",
    ];
    if (!term) return catalogue.slice(0, 6);
    return catalogue.filter((item) => item.includes(term)).slice(0, 6);
  });
