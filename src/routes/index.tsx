import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";

import heroImage from "@/assets/hero-compare.jpg";
import { SearchBar } from "@/components/SearchBar";
import { SiteHeader } from "@/components/SiteHeader";
import { VENDORS, formatMoney } from "@/lib/vendors";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SmartCompare — Compare prices across Kenyan stores" },
      {
        name: "description",
        content:
          "Search any product and compare live prices, photos and 30-day price trends across Jumia, Kilimall, Jiji, Amazon, Naivas, Quickmart and Carrefour.",
      },
      { property: "og:title", content: "SmartCompare — Compare prices across Kenyan stores" },
      {
        property: "og:description",
        content:
          "Live prices, real product photos and 30-day price trends from seven stores, in one search.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [category, setCategory] = useState("All");
  const [region, setRegion] = useState("Nairobi · Kenya");

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5">
        <SiteHeader region={region} />

        <section className="grid items-center gap-8 pb-12 md:grid-cols-2">
          <div className="rounded-4xl bg-card p-6 ring-1 ring-border sm:p-8">
            <h1 className="font-display text-3xl leading-tight font-extrabold text-foreground sm:text-4xl">
              Compare the same item, <span className="text-primary">across every store</span> —
              instantly.
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Live prices, real photos &amp; 30-day trends from Jumia, Kilimall, Jiji, Amazon,
              Naivas, Quickmart &amp; Carrefour.
            </p>

            <div className="mt-5">
              <SearchBar
                category={category}
                region={region}
                onCategoryChange={setCategory}
                onRegionChange={setRegion}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-sun" /> {VENDORS.length} stores live
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-primary" /> Prices refresh every 30 min
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 -rotate-2 rounded-4xl bg-sun/30" />
            <div className="relative rounded-4xl bg-card p-4 ring-1 ring-border">
              <img
                src={heroImage}
                alt="Illustration of a shopping cart with coins and a price tag"
                width={1024}
                height={1024}
                className="aspect-[4/3] w-full rounded-3xl object-cover"
              />
              <div className="absolute -left-3 top-8 rounded-2xl bg-card px-3 py-2 shadow-sm ring-1 ring-border">
                <div className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Lowest price
                </div>
                <div className="font-display text-lg font-extrabold text-primary">
                  {formatMoney(2450)}
                </div>
              </div>
              <div className="absolute -right-2 bottom-10 rounded-2xl bg-accent px-3 py-2 text-accent-foreground shadow-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wide opacity-80">
                  You save
                </div>
                <div className="font-display text-lg font-extrabold">{formatMoney(1100)}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <h2 className="font-display text-2xl font-extrabold text-foreground">
            Every store, one search
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            {VENDORS.map((vendor) => (
              <div
                key={vendor.id}
                className="flex items-center gap-2 rounded-2xl bg-card p-3 ring-1 ring-border"
              >
                <span className="grid size-8 place-items-center rounded-xl bg-primary/10 font-display text-sm font-bold text-brand-deep">
                  {vendor.initial}
                </span>
                <span className="text-xs font-semibold text-foreground">{vendor.name}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              ["Best Overall Deal", "We weigh price, store rating, stock and delivery speed."],
              ["Real photos & live prices", "Pulled from each vendor's own search page."],
              ["Price drop alerts", "Set a target price and track it from your dashboard."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-3xl bg-card p-5 ring-1 ring-border">
                <Sparkles className="size-5 text-accent" aria-hidden />
                <h3 className="mt-3 font-display text-lg font-bold text-foreground">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
