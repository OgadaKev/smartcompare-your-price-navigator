import { Heart, Star, TrendingDown, Truck } from "lucide-react";

import { badgeFor, discountPercent, formatMoney, type Offer } from "@/lib/vendors";

const BADGE_LABEL: Record<string, string> = {
  lowest: "Lowest Price",
  fastest: "Fastest Delivery",
  value: "Best Value",
};

export function OfferCard({
  offer,
  offers,
  onSave,
  saving,
}: {
  offer: Offer;
  offers: Offer[];
  onSave: (offer: Offer) => void;
  saving?: boolean;
}) {
  const badge = badgeFor(offer, offers);
  const discount = discountPercent(offer);

  return (
    <article className="flex flex-col rounded-3xl bg-card p-4 ring-1 ring-border">
      <div className="flex items-center justify-between">
        <span className="font-display text-sm font-bold text-foreground">{offer.vendorName}</span>
        {badge && (
          <span
            className={
              badge === "fastest"
                ? "rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-bold text-accent"
                : badge === "lowest"
                  ? "rounded-full bg-sun/30 px-2 py-0.5 text-[10px] font-bold text-sun-foreground"
                  : "rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-brand-deep"
            }
          >
            {BADGE_LABEL[badge]}
          </span>
        )}
      </div>

      <div className="mt-3 grid aspect-square place-items-center overflow-hidden rounded-2xl bg-background ring-1 ring-border">
        {offer.imageUrl ? (
          <img
            src={offer.imageUrl}
            alt={offer.title}
            loading="lazy"
            className="size-full object-contain"
          />
        ) : (
          <span className="px-3 text-center text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground">
            {offer.vendorName} preview
          </span>
        )}
      </div>

      <p className="mt-3 line-clamp-2 text-sm font-semibold text-foreground">{offer.title}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
        <Star className="size-3" aria-hidden /> {offer.rating.toFixed(1)} ·{" "}
        {offer.inStock ? "In stock" : "Out of stock"}
      </p>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-xl font-extrabold text-foreground">
          {formatMoney(offer.price, offer.currency)}
        </span>
        {offer.oldPrice && (
          <span className="text-xs text-muted-foreground line-through">
            {formatMoney(offer.oldPrice, offer.currency)}
          </span>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] font-semibold text-muted-foreground">
        {discount && (
          <span className="flex items-center gap-1 text-brand-deep">
            <TrendingDown className="size-3" aria-hidden /> {discount}% off
          </span>
        )}
        <span className="flex items-center gap-1">
          <Truck className="size-3" aria-hidden /> {offer.deliveryDays}d delivery
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <a
          href={offer.productUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="flex-1 rounded-xl bg-primary py-2 text-center text-sm font-bold text-primary-foreground"
        >
          Buy now
        </a>
        <button
          type="button"
          onClick={() => onSave(offer)}
          disabled={saving}
          aria-label={`Save ${offer.title} to wishlist`}
          className="grid size-9 place-items-center rounded-xl bg-background text-foreground/60 ring-1 ring-border"
        >
          <Heart className="size-4" aria-hidden />
        </button>
      </div>
    </article>
  );
}

export function OfferCardSkeleton() {
  return (
    <div className="flex flex-col rounded-3xl bg-card p-4 ring-1 ring-border">
      <div className="h-4 w-20 animate-pulse rounded bg-muted" />
      <div className="mt-3 aspect-square animate-pulse rounded-2xl bg-muted" />
      <div className="mt-3 h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-6 w-28 animate-pulse rounded bg-muted" />
      <div className="mt-3 h-9 w-full animate-pulse rounded-xl bg-muted" />
    </div>
  );
}
