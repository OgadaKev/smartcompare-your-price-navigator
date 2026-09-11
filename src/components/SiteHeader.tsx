import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, LogOut, MapPin } from "lucide-react";

import { useSession } from "@/hooks/useSession";
import { supabase } from "@/integrations/supabase/client";

export function SiteHeader({ region }: { region?: string }) {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <nav className="flex items-center justify-between gap-3 py-5">
      <Link to="/" className="flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-xl bg-primary font-display text-lg text-primary-foreground">
          S
        </span>
        <span className="font-display text-xl font-extrabold text-foreground">SmartCompare</span>
      </Link>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden items-center gap-1.5 rounded-full bg-card py-1 pl-3 pr-3 ring-1 ring-border sm:flex">
          <MapPin className="size-3.5 text-muted-foreground" aria-hidden />
          <span className="text-xs font-semibold text-muted-foreground">
            {region ?? "Nairobi · Kenya"}
          </span>
        </div>
        {user ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold text-foreground/70 ring-1 ring-border"
            >
              <Heart className="size-3.5" aria-hidden /> Wishlist
            </Link>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
            >
              <LogOut className="size-3.5" aria-hidden /> Sign out
            </button>
          </>
        ) : (
          <Link
            to="/auth"
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
