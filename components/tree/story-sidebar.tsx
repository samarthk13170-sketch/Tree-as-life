"use client"

import { Sparkles, X } from "lucide-react"
import { CATEGORY_META } from "@/lib/categories"
import type { PositionedBranch, TreeLayout } from "@/lib/types"

interface StorySidebarProps {
  layout: TreeLayout
  selectedBranch: PositionedBranch | null
  onSelectBranch: (id: string | null) => void
  matchedLeafIds: Set<string> | null
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

export function StorySidebar({ layout, selectedBranch, onSelectBranch, matchedLeafIds }: StorySidebarProps) {
  if (!selectedBranch) {
    const totalLeaves = layout.branches.reduce((n, b) => n + b.leaves.length, 0)
    return (
      <div className="flex h-full flex-col gap-5">
        <div>
          <h2 className="text-balance text-lg font-semibold">Your life, in receipts</h2>
          <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
            Every leaf is a moment from your digital life — a song at 2am, a coffee, a flight.
            They grow into {layout.branches.length} branches, each a chapter waiting to be read.
            Tap a branch to uncover its story.
          </p>
        </div>

        <ul className="flex flex-col gap-2" aria-label="Chapters">
          {layout.branches.map((b) => {
            const Icon = CATEGORY_META[b.category].icon
            return (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => onSelectBranch(b.id)}
                  className="group flex w-full items-center gap-3 rounded-xl border border-border bg-card/50 p-3 text-left transition hover:border-transparent hover:bg-card"
                  style={{ boxShadow: "none" }}
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${b.color}`, color: "oklch(0.16 0.02 260)" }}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{b.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {b.leaves.length} events
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <p className="mt-auto text-xs text-muted-foreground">
          {totalLeaves} moments across {layout.branches.length} chapters
        </p>
      </div>
    )
  }

  const branch = selectedBranch
  const meta = CATEGORY_META[branch.category]
  const Icon = meta.icon
  const total = branch.leaves.reduce((n, l) => n + l.value, 0)
  const unit = branch.leaves[0]?.unit ?? ""
  const sorted = [...branch.positionedLeaves].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex items-start gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: branch.color, color: "oklch(0.16 0.02 260)", boxShadow: `0 0 20px ${branch.color}` }}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-balance text-lg font-semibold leading-tight">{branch.title}</h2>
          <p className="text-xs text-muted-foreground">{branch.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => onSelectBranch(null)}
          aria-label="Close story"
          className="rounded-full p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 rounded-xl border border-border bg-card/50 p-3">
          <p className="text-xs text-muted-foreground">Events</p>
          <p className="text-lg font-semibold">{branch.leaves.length}</p>
        </div>
        <div className="flex-1 rounded-xl border border-border bg-card/50 p-3">
          <p className="text-xs text-muted-foreground">Total</p>
          <p className="text-lg font-semibold">
            {unit === "₹" ? "₹" : ""}
            {total.toLocaleString()}
            {unit && unit !== "₹" ? ` ${unit}` : ""}
          </p>
        </div>
      </div>

      <div className="rounded-xl border p-3" style={{ borderColor: `${branch.color}` }}>
        <p className="flex items-center gap-1.5 text-xs font-medium" style={{ color: branch.color }}>
          <Sparkles className="size-3.5" aria-hidden="true" /> The story
        </p>
        <p className="mt-1.5 text-pretty text-sm leading-relaxed text-foreground/90">{branch.story}</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Leaves ({branch.leaves.length})
        </p>
        <ul className="flex flex-col gap-1.5 overflow-y-auto pr-1" aria-label={`Events in ${branch.title}`}>
          {sorted.map((leaf) => {
            const highlighted = matchedLeafIds?.has(leaf.id)
            return (
              <li
                key={leaf.id}
                className="flex items-center gap-3 rounded-lg border border-transparent px-2 py-1.5 text-sm transition"
                style={
                  highlighted
                    ? { borderColor: branch.color, background: `color-mix(in oklch, ${branch.color} 12%, transparent)` }
                    : undefined
                }
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ background: branch.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate">{leaf.label}</span>
                  {leaf.detail && (
                    <span className="block truncate text-xs text-muted-foreground">{leaf.detail}</span>
                  )}
                </span>
                <span className="shrink-0 text-right text-xs text-muted-foreground">
                  <span className="block tabular-nums text-foreground/80">
                    {leaf.unit === "₹" ? "₹" : ""}
                    {leaf.value.toLocaleString()}
                    {leaf.unit && leaf.unit !== "₹" ? ` ${leaf.unit}` : ""}
                  </span>
                  <span className="block">{formatDate(leaf.timestamp)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
