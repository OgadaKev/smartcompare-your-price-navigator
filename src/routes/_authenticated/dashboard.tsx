import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bell, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import {
  listAlerts,
  listWishlist,
  removeAlert,
  removeFromWishlist,
} from "@/lib/account.functions";
import { formatMoney } from "@/lib/vendors";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Your wishlist & price alerts — SmartCompare" },
      {
        name: "description",
        content:
          "Everything you saved and every price alert you set, with the latest prices from each store.",
      },
      { property: "og:title", content: "Your wishlist & price alerts — SmartCompare" },
      {
        property: "og:description",
        content: "Track saved products and target prices in one dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const queryClient = useQueryClient();
  const fetchWishlist = useServerFn(listWishlist);
  const fetchAlerts = useServerFn(listAlerts);
  const dropItem = useServerFn(removeFromWishlist);
  const dropAlert = useServerFn(removeAlert);

  const wishlist = useQuery({ queryKey: ["wishlist"], queryFn: () => fetchWishlist({}) });
  const alerts = useQuery({ queryKey: ["alerts"], queryFn: () => fetchAlerts({}) });

  const removeItemMutation = useMutation({
    mutationFn: (id: string) => dropItem({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast.success("Removed from wishlist");
    },
  });

  const removeAlertMutation = useMutation({
    mutationFn: (id: string) => dropAlert({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      toast.success("Alert removed");
    },
  });

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-5 pb-16">
        <SiteHeader />

        <h1 className="font-display text-2xl font-extrabold text-foreground">Your dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved products and the prices you're waiting for.
        </p>

        <section className="mt-6">
          <h2 className="font-display text-lg font-bold text-foreground">Wishlist</h2>
          {wishlist.isPending ? (
            <div className="mt-3 h-24 animate-pulse rounded-3xl bg-muted" />
          ) : wishlist.data?.length ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {wishlist.data.map((item) => (
                <article key={item.id} className="rounded-3xl bg-card p-4 ring-1 ring-border">
                  <div className="flex items-center justify-between">
                    <span className="font-display text-sm font-bold text-foreground">
                      {item.vendor}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItemMutation.mutate(item.id)}
                      aria-label={`Remove ${item.title}`}
                      className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-foreground">
                    {item.title}
                  </p>
                  <p className="mt-1 font-display text-lg font-extrabold text-foreground">
                    {formatMoney(Number(item.price), item.currency)}
                  </p>
                  {item.product_url && (
                    <a
                      href={item.product_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-3 block rounded-xl bg-primary py-2 text-center text-sm font-bold text-primary-foreground"
                    >
                      Buy now
                    </a>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nothing saved yet.{" "}
              <Link to="/" className="font-semibold text-brand-deep">
                Search for a product
              </Link>{" "}
              and tap the heart.
            </p>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-bold text-foreground">Price alerts</h2>
          {alerts.isPending ? (
            <div className="mt-3 h-20 animate-pulse rounded-3xl bg-muted" />
          ) : alerts.data?.length ? (
            <ul className="mt-3 space-y-3">
              {alerts.data.map((alert) => (
                <li
                  key={alert.id}
                  className="flex flex-wrap items-center gap-3 rounded-3xl bg-card p-4 ring-1 ring-border"
                >
                  <Bell className="size-4 text-accent" aria-hidden />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Target {formatMoney(Number(alert.target_price), alert.currency)}
                      {alert.last_seen_price
                        ? ` · last seen ${formatMoney(Number(alert.last_seen_price), alert.currency)}`
                        : ""}
                    </p>
                  </div>
                  {alert.triggered_at && (
                    <span className="rounded-full bg-sun/30 px-3 py-1 text-xs font-bold text-sun-foreground">
                      Target hit
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAlertMutation.mutate(alert.id)}
                    aria-label={`Remove alert for ${alert.title}`}
                    className="grid size-8 place-items-center rounded-lg bg-background text-muted-foreground ring-1 ring-border"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No alerts yet. Set a target price from any search results page.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
