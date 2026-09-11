import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Search } from "lucide-react";

import { CATEGORIES, REGIONS } from "@/lib/vendors";
import { suggestQueries } from "@/lib/search.functions";

interface Props {
  initialQuery?: string;
  category: string;
  region: string;
  onCategoryChange?: (value: string) => void;
  onRegionChange?: (value: string) => void;
  showRegion?: boolean;
}

export function SearchBar({
  initialQuery = "",
  category,
  region,
  onCategoryChange,
  onRegionChange,
  showRegion = true,
}: Props) {
  const [term, setTerm] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const suggest = useServerFn(suggestQueries);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const results = await suggest({ data: { term } });
      if (active) setSuggestions(results);
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, suggest]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(value: string) {
    const q = value.trim();
    if (!q) return;
    setOpen(false);
    navigate({ to: "/search", search: { q, category, region } });
  }

  return (
    <div>
      <div ref={boxRef} className="relative">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            go(term);
          }}
          className="flex items-center gap-2 rounded-2xl bg-background p-2 ring-1 ring-border"
        >
          <span className="grid size-9 place-items-center text-muted-foreground">
            <Search className="size-4" aria-hidden />
          </span>
          <input
            value={term}
            onChange={(event) => {
              setTerm(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search a product, e.g. “wireless earbuds”"
            aria-label="Search for a product"
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            className="rounded-xl bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
          >
            Search
          </button>
        </form>

        {open && suggestions.length > 0 && (
          <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl bg-card p-1 shadow-lg ring-1 ring-border">
            {suggestions.map((item) => (
              <li key={item}>
                <button
                  type="button"
                  onMouseDown={() => go(item)}
                  className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground hover:bg-muted"
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {CATEGORIES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onCategoryChange?.(item)}
            className={
              item === category
                ? "rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-brand-deep"
                : "rounded-full bg-card px-3 py-1 text-xs font-semibold text-muted-foreground ring-1 ring-border"
            }
          >
            {item}
          </button>
        ))}
      </div>

      {showRegion && (
        <label className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          Region
          <select
            value={region}
            onChange={(event) => onRegionChange?.(event.target.value)}
            className="rounded-full bg-card px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-border"
          >
            {REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
