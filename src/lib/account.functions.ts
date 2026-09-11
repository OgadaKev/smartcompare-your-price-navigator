import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const wishlistInput = z.object({
  offerKey: z.string().min(1),
  query: z.string().min(1),
  title: z.string().min(1),
  vendor: z.string().min(1),
  price: z.number().positive(),
  currency: z.string().default("KES"),
  imageUrl: z.string().nullable().optional(),
  productUrl: z.string().nullable().optional(),
});

export const listWishlist = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("wishlist_items")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const saveToWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => wishlistInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("wishlist_items").upsert(
      {
        user_id: context.userId,
        offer_key: data.offerKey,
        query: data.query,
        title: data.title,
        vendor: data.vendor,
        price: data.price,
        currency: data.currency,
        image_url: data.imageUrl ?? null,
        product_url: data.productUrl ?? null,
      },
      { onConflict: "user_id,offer_key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeFromWishlist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("wishlist_items").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const alertInput = z.object({
  query: z.string().min(1),
  title: z.string().min(1),
  vendor: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  targetPrice: z.number().positive(),
  lastSeenPrice: z.number().positive().nullable().optional(),
});

export const listAlerts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("price_alerts")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => alertInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("price_alerts").insert({
      user_id: context.userId,
      query: data.query,
      title: data.title,
      vendor: data.vendor ?? null,
      image_url: data.imageUrl ?? null,
      target_price: data.targetPrice,
      last_seen_price: data.lastSeenPrice ?? null,
      triggered_at:
        data.lastSeenPrice != null && data.lastSeenPrice <= data.targetPrice
          ? new Date().toISOString()
          : null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const removeAlert = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("price_alerts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
