"use client"

import { Search, X } from "lucide-react"
import type { LeafType } from "@/lib/types"
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories"

interface FilterBarProps {
  query: string
  onQueryChange: (q: string) => void
  activeCategories: Set<LeafType>
  onToggleCategory: (c: LeafType) => void
  matchCount: number | null
}

export function FilterBar({
  query,
  onQueryChange,
  activeCategories,
  onToggleCategory,
  matchCount,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search songs, receipts, places..."
          aria-label="Search events across the tree"
          className="w-full rounded-full border border-border bg-card/60 py-2 pl-9 pr-9 text-sm outline-none ring-emerald-400/40 backdrop-blur transition focus:ring-2"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORY_ORDER.map((cat) => {
          const meta = CATEGORY_META[cat]
          const Icon = meta.icon
          const active = activeCategories.has(cat)
          return (
            <button
              key={cat}
              type="button"
              onClick={() => onToggleCategory(cat)}
              aria-pressed={active}
              className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition"
              style={{
                borderColor: meta.color,
                background: active ? meta.color : "transparent",
                color: active ? "oklch(0.16 0.02 260)" : "var(--foreground)",
              }}
            >
              <Icon className="size-3.5" aria-hidden="true" />
              {meta.label}
            </button>
          )
        })}
      </div>

      {matchCount !== null && (
        <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
          {matchCount} matching {matchCount === 1 ? "event" : "events"} glowing on the tree
        </p>
      )}
    </div>
  )
}
