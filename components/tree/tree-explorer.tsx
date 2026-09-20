"use client"

import { useMemo, useRef, useState } from "react"
import { Maximize, Minus, Plus, TreePine } from "lucide-react"
import { buildTree, layoutTree } from "@/lib/tree-data"
import type { LeafType, PositionedLeaf } from "@/lib/types"
import { TreeCanvas, type TreeCanvasHandle } from "./tree-canvas"
import { StorySidebar } from "./story-sidebar"
import { FilterBar } from "./filter-bar"

export function TreeExplorer() {
  const layout = useMemo(() => layoutTree(buildTree()), [])

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null)
  const [hoveredLeaf, setHoveredLeaf] = useState<PositionedLeaf | null>(null)
  const [query, setQuery] = useState("")
  const [activeCategories, setActiveCategories] = useState<Set<LeafType>>(new Set())
  const canvasRef = useRef<TreeCanvasHandle>(null)

  const selectedBranch = useMemo(
    () => layout.branches.find((b) => b.id === selectedBranchId) ?? null,
    [layout, selectedBranchId],
  )

  const hasQuery = query.trim().length > 0 || activeCategories.size > 0

  const matchedLeafIds = useMemo(() => {
    if (!hasQuery) return null
    const q = query.trim().toLowerCase()
    const ids = new Set<string>()
    for (const branch of layout.branches) {
      for (const leaf of branch.positionedLeaves) {
        const catOk = activeCategories.size === 0 || activeCategories.has(leaf.type)
        const textOk =
          q.length === 0 ||
          leaf.label.toLowerCase().includes(q) ||
          (leaf.detail?.toLowerCase().includes(q) ?? false) ||
          branch.title.toLowerCase().includes(q)
        if (catOk && textOk) ids.add(leaf.id)
      }
    }
    return ids
  }, [layout, query, activeCategories, hasQuery])

  const toggleCategory = (c: LeafType) => {
    setActiveCategories((prev) => {
      const next = new Set(prev)
      if (next.has(c)) next.delete(c)
      else next.add(c)
      return next
    })
  }

  return (
    <div className="grid h-full grid-rows-[auto_1fr] gap-4 lg:grid-cols-[1fr_360px] lg:grid-rows-1">
      {/* Canvas + overlay controls */}
      <div className="relative order-2 min-h-[420px] overflow-hidden rounded-2xl border border-border bg-[radial-gradient(ellipse_at_bottom,_oklch(0.24_0.03_260),_oklch(0.16_0.02_260))] lg:order-1">
        <TreeCanvas
          ref={canvasRef}
          layout={layout}
          selectedBranchId={selectedBranchId}
          onSelectBranch={setSelectedBranchId}
          hoveredLeaf={hoveredLeaf}
          onHoverLeaf={setHoveredLeaf}
          matchedLeafIds={matchedLeafIds}
        />

        {/* Hover tooltip */}
        {hoveredLeaf && (
          <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-full border border-border bg-card/90 px-4 py-1.5 text-center text-xs shadow-lg backdrop-blur">
            <span className="font-medium">{hoveredLeaf.label}</span>
            {hoveredLeaf.detail && <span className="text-muted-foreground"> · {hoveredLeaf.detail}</span>}
            <span className="text-muted-foreground">
              {" · "}
              {hoveredLeaf.unit === "₹" ? "₹" : ""}
              {hoveredLeaf.value.toLocaleString()}
              {hoveredLeaf.unit && hoveredLeaf.unit !== "₹" ? ` ${hoveredLeaf.unit}` : ""}
            </span>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
          <ControlButton label="Zoom in" onClick={() => canvasRef.current?.zoomBy(1.3)}>
            <Plus className="size-4" />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={() => canvasRef.current?.zoomBy(1 / 1.3)}>
            <Minus className="size-4" />
          </ControlButton>
          <ControlButton label="Reset view" onClick={() => canvasRef.current?.reset()}>
            <Maximize className="size-4" />
          </ControlButton>
        </div>

        <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 text-xs text-muted-foreground">
          <TreePine className="size-3.5" aria-hidden="true" />
          <span>Scroll to zoom · drag to pan</span>
        </div>
      </div>

      {/* Sidebar */}
      <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:h-full lg:overflow-hidden">
        <FilterBar
          query={query}
          onQueryChange={setQuery}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          matchCount={matchedLeafIds ? matchedLeafIds.size : null}
        />
        <div className="min-h-0 flex-1 rounded-2xl border border-border bg-card/40 p-4 backdrop-blur">
          <StorySidebar
            layout={layout}
            selectedBranch={selectedBranch}
            onSelectBranch={setSelectedBranchId}
            matchedLeafIds={matchedLeafIds}
          />
        </div>
      </aside>
    </div>
  )
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg border border-border bg-card/80 text-foreground shadow-sm backdrop-blur transition hover:bg-card"
    >
      {children}
    </button>
  )
}
