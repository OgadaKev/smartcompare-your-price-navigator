import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BellPlus, Star } from "lucide-react";
import { toast } from "sonner";

import { OfferCard, OfferCardSkeleton } from "@/components/OfferCard";
import { PriceTrend } from "@/components/PriceTrend";
import { SearchBar } from "@/components/SearchBar";
import { SiteHeader } from "@/components/SiteHeader";
import { useSession } from "@/hooks/useSession";
import { createAlert, saveToWishlist } from "@/lib/account.functions";
import { searchOffers } from "@/lib/search.functions";
import { bestOverall, discountPercent, formatMoney, type Offer } from "@/lib/vendors";

type SearchParams = { q: string; category: string; region: string };

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    category: typeof search["category"] === "string" ? search["category"] : "All",
    region: typeof search["region"] === "string" ? search["region"] : "Nairobi · Kenya",
  }),
  head: () => ({
    meta: [
      { title: "Price comparison results — SmartCompare" },
      {
        name: "description",
        content:
          "Side-by-side live prices, discounts and delivery times from seven stores, with a 30-day price trend for the item you searched.",
      },
      { property: "og:title", content: "Price comparison results — SmartCompare" },
      {
        property: "og:description",
        content: "Compare live prices across Kenyan and global stores in one view.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q, category, region } = Route.useSearch();
  const navigate = useNavigate();
  const { user } = useSession();
  const run = useServerFn(searchOffers);
  const save = useServerFn(saveToWishlist);
  const makeAlert = useServerFn(createAlert);
  const [target, setTarget] = useState("");

  const { data, isPending, isError } = useQuery({
    queryKey: ["search", q, category, region],
    queryFn: () => run({ data: { query: q, category, region } }),
    enabled: q.trim().length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const saveMutation = useMutation({
    mutationFn: (offer: Offer) =>
      save({
        data: {
          offerKey: offer.key,
          query: q,
          title: offer.title,
          vendor: offer.vendorName,
          price: offer.price,
          currency: offer.currency,
          imageUrl: offer.imageUrl,
          productUrl: offer.productUrl,
        },
      }),
    onSuccess: () => toast.success("Saved to your wishlist"),
    onError: () => toast.error("Could not save that item"),
  });

  const alertMutation = useMutation({
    mutationFn: (price: number) =>
      makeAlert({
        data: {
          query: q,
          title: best?.title ?? q,
          vendor: best?.vendorName ?? null,
          imageUrl: best?.imageUrl ?? null,
          targetPrice: price,
          lastSeenPrice: best?.price ?? null,
        },
      }),
    onSuccess: () => {
      setTarget("");
      toast.success("We'll watch that price for you");
    },
    onError: () => toast.error("Could not create that alert"),
  });

  const offers = data?.offers ?? [];
  const best = bestOverall(offers);
  const bestDiscount = best ? discountPercent(best) : null;

  function onSave(offer: Offer) {
    if (!user) {
      toast.info("Sign in to save items");
      navigate({ to: "/auth" });
      return;
    }
    saveMutation.mutate(offer);
  }

  function onAlert() {
    if (!user) {
      toast.info("Sign in to set a price alert");
      navigate({ to: "/auth" });
      return;
    }
    const price = Number(target);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error("Enter a target price");
      return;
    }
    alertMutation.mutate(price);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 pb-16">
        <SiteHeader region={region} />

        <div className="rounded-3xl bg-card p-4 ring-1 ring-border sm:p-5">
          <SearchBar
            initialQuery={q}
            category={category}
            region={region}
            onCategoryChange={(value) =>
              navigate({ to: "/search", search: { q, category: value, region } })
            }
            onRegionChange={(value) =>
              navigate({ to: "/search", search: { q, category, region: value } })
            }
          />
        </div>

        {!q.trim() && (
          <p className="mt-8 text-sm text-muted-foreground">
            Search for a product above to compare stores.
          </p>
        )}

        {isError && (
          <p className="mt-8 text-sm text-destructive">
            We couldn't load prices just now. Try searching again.
          </p>
        )}

        {q.trim() && isPending && (
          <div className="mt-8">
            <div className="h-24 animate-pulse rounded-3xl bg-muted" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <OfferCardSkeleton key={index} />
              ))}
            </div>
          </div>
        )}

        {data && (
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h1 className="font-display text-2xl font-extrabold text-foreground">
                {offers.length} stores matched · {data.query}
              </h1>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                {data.cached ? "From cache" : "Updated just now"}
              </span>
            </div>

            {best && (
              <div className="mt-5 flex flex-col gap-4 rounded-3xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-center">
                <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary-foreground/15">
                  {best.imageUrl ? (
                    <img
                      src={best.imageUrl}
                      alt={best.title}
                      className="size-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Star className="size-6 opacity-70" aria-hidden />
                  )}
                </div>
                <div className="flex-1">
                  <span className="rounded-full bg-sun px-2.5 py-0.5 text-[11px] font-bold text-sun-foreground">
                    ★ Best Overall Deal
                  </span>
                  <div className="mt-1 font-display text-lg font-bold">
                    {best.title} — {best.vendorName}
                  </div>
                  <div className="text-sm opacity-85">
                    {formatMoney(best.price, best.currency)}
                    {best.oldPrice ? ` (was ${formatMoney(best.oldPrice, best.currency)})` : ""}
                    {bestDiscount ? ` · ${bestDiscount}% off` : ""} · delivery in{" "}
                    {best.deliveryDays} days
                  </div>
                </div>
                <a
                  href={best.productUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="rounded-full bg-card px-5 py-2.5 text-center text-sm font-bold text-primary"
                >
                  Buy now
                </a>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {offers.map((offer) => (
                <OfferCard
                  key={offer.key}
                  offer={offer}
                  offers={offers}
                  onSave={onSave}
                  saving={saveMutation.isPending}
                />
              ))}
            </div>

            <div className="mt-8 grid gap-4 lg:grid-cols-[2fr_1fr]">
              <PriceTrend history={data.history} title={data.query} />

              <div className="rounded-3xl bg-card p-6 ring-1 ring-border">
                <h2 className="font-display text-lg font-bold text-foreground">
                  Notify me on a price drop
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tell us your target price and we'll flag it on your dashboard when a store hits
                  it.
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    inputMode="numeric"
                    placeholder="e.g. 2400"
                    aria-label="Target price in KES"
                    className="min-w-0 flex-1 rounded-xl bg-background px-3 py-2 text-sm text-foreground ring-1 ring-border outline-none"
                  />
                  <button
                    type="button"
                    onClick={onAlert}
                    disabled={alertMutation.isPending}
                    className="flex items-center gap-1.5 rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60"
                  >
                    <BellPlus className="size-4" aria-hidden /> Notify me
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
