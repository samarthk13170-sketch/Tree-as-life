"use client"

import type React from "react"
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react"
import type { PositionedLeaf, TreeLayout } from "@/lib/types"

interface Transform {
  x: number
  y: number
  k: number
}

export interface TreeCanvasHandle {
  zoomBy: (factor: number) => void
  reset: () => void
}

interface TreeCanvasProps {
  ref?: React.Ref<TreeCanvasHandle>
  layout: TreeLayout
  selectedBranchId: string | null
  onSelectBranch: (id: string | null) => void
  hoveredLeaf: PositionedLeaf | null
  onHoverLeaf: (leaf: PositionedLeaf | null) => void
  /** ids of leaves matching the active search/filter; null = no active query */
  matchedLeafIds: Set<string> | null
}

const MIN_K = 0.4
const MAX_K = 6

export function TreeCanvas({
  ref,
  layout,
  selectedBranchId,
  onSelectBranch,
  hoveredLeaf,
  onHoverLeaf,
  matchedLeafIds,
}: TreeCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, k: 1 })
  const pan = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const { minX, minY, maxX, maxY } = layout.bounds
  const vbW = maxX - minX
  const vbH = maxY - minY

  // Convert a pointer event to a point in the SVG's viewBox coordinate space.
  const toSvgPoint = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    const px = (clientX - rect.left) / rect.width
    const py = (clientY - rect.top) / rect.height
    return { x: minX + px * vbW, y: minY + py * vbH }
  }, [minX, minY, vbW, vbH])

  const applyZoom = useCallback(
    (factor: number, center: { x: number; y: number }) => {
      setTransform((t) => {
        const k = Math.min(MAX_K, Math.max(MIN_K, t.k * factor))
        const realFactor = k / t.k
        return {
          k,
          x: center.x - realFactor * (center.x - t.x),
          y: center.y - realFactor * (center.y - t.y),
        }
      })
    },
    [],
  )

  useImperativeHandle(ref, () => ({
    zoomBy: (factor: number) => applyZoom(factor, { x: minX + vbW / 2, y: minY + vbH / 2 }),
    reset: () => setTransform({ x: 0, y: 0, k: 1 }),
  }), [applyZoom, minX, minY, vbW, vbH])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const center = toSvgPoint(e.clientX, e.clientY)
      applyZoom(e.deltaY < 0 ? 1.12 : 1 / 1.12, center)
    },
    [applyZoom, toSvgPoint],
  )

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only start panning on background drags (not on interactive nodes).
    if ((e.target as Element).closest("[data-node]")) return
    ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
    pan.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y }
    setIsPanning(true)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pan.current) return
    const svg = svgRef.current
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    const dx = ((e.clientX - pan.current.startX) / rect.width) * vbW
    const dy = ((e.clientY - pan.current.startY) / rect.height) * vbH
    setTransform((t) => ({ ...t, x: pan.current!.origX + dx, y: pan.current!.origY + dy }))
  }

  const endPan = () => {
    pan.current = null
    setIsPanning(false)
  }

  // Keyboard pan/zoom when the canvas is focused.
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const step = 40
    if (e.key === "ArrowUp") setTransform((t) => ({ ...t, y: t.y + step }))
    else if (e.key === "ArrowDown") setTransform((t) => ({ ...t, y: t.y - step }))
    else if (e.key === "ArrowLeft") setTransform((t) => ({ ...t, x: t.x + step }))
    else if (e.key === "ArrowRight") setTransform((t) => ({ ...t, x: t.x - step }))
    else if (e.key === "+" || e.key === "=") applyZoom(1.2, { x: minX + vbW / 2, y: minY + vbH / 2 })
    else if (e.key === "-" || e.key === "_") applyZoom(1 / 1.2, { x: minX + vbW / 2, y: minY + vbH / 2 })
    else if (e.key === "0") setTransform({ x: 0, y: 0, k: 1 })
    else return
    e.preventDefault()
  }

  // Prevent the page from scrolling while wheel-zooming over the canvas.
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const stop = (e: WheelEvent) => e.preventDefault()
    svg.addEventListener("wheel", stop, { passive: false })
    return () => svg.removeEventListener("wheel", stop)
  }, [])

  const hasQuery = matchedLeafIds !== null

  return (
    <svg
      ref={svgRef}
      viewBox={`${minX} ${minY} ${vbW} ${vbH}`}
      className="h-full w-full touch-none select-none"
      style={{ cursor: isPanning ? "grabbing" : "grab" }}
      role="application"
      aria-label="Interactive tree of life. Use arrow keys to pan, plus and minus to zoom, zero to reset. Tab to focus a branch and press Enter to open its story."
      tabIndex={0}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endPan}
      onPointerLeave={endPan}
      onKeyDown={handleKeyDown}
      onClick={(e) => {
        if (!(e.target as Element).closest("[data-node]")) onSelectBranch(null)
      }}
    >
      <defs>
        <radialGradient id="ground-glow" cx="50%" cy="100%" r="80%">
          <stop offset="0%" stopColor="oklch(0.75 0.13 150 / 0.35)" />
          <stop offset="100%" stopColor="oklch(0.75 0.13 150 / 0)" />
        </radialGradient>
        <linearGradient id="trunk-grad" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="oklch(0.42 0.06 60)" />
          <stop offset="100%" stopColor="oklch(0.55 0.07 90)" />
        </linearGradient>
      </defs>

      <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.k})`}>
        {/* soft ground glow under the trunk */}
        <ellipse cx={layout.trunkX} cy={layout.trunkBaseY} rx={260} ry={70} fill="url(#ground-glow)" />

        {/* trunk */}
        <path
          d={`M ${layout.trunkX - 34} ${layout.trunkBaseY}
             C ${layout.trunkX - 22} ${layout.trunkBaseY - 120}, ${layout.trunkX - 16} ${layout.trunkTopY + 60}, ${layout.trunkX - 10} ${layout.trunkTopY}
             L ${layout.trunkX + 10} ${layout.trunkTopY}
             C ${layout.trunkX + 16} ${layout.trunkTopY + 60}, ${layout.trunkX + 22} ${layout.trunkBaseY - 120}, ${layout.trunkX + 34} ${layout.trunkBaseY} Z`}
          fill="url(#trunk-grad)"
        />

        {/* branches (drawn first so leaves sit on top) */}
        {layout.branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id
          const dim = selectedBranchId !== null && !isSelected
          return (
            <path
              key={`branch-${branch.id}`}
              d={branch.path}
              fill="none"
              stroke={isSelected ? branch.color : "oklch(0.5 0.06 80)"}
              strokeWidth={branch.width}
              strokeLinecap="round"
              className="tree-branch"
              style={{
                opacity: dim ? 0.25 : 1,
                filter: isSelected ? `drop-shadow(0 0 12px ${branch.color})` : "none",
                transition: "opacity 300ms ease, stroke 300ms ease, filter 300ms ease",
              }}
            />
          )
        })}

        {/* branch label + interactive hit target at each tip */}
        {layout.branches.map((branch) => {
          const isSelected = selectedBranchId === branch.id
          const dim = selectedBranchId !== null && !isSelected
          return (
            <g
              key={`tip-${branch.id}`}
              data-node
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              aria-label={`${branch.title}: ${branch.subtitle}. ${branch.leaves.length} events.`}
              className="cursor-pointer outline-none"
              style={{ opacity: dim ? 0.3 : 1, transition: "opacity 300ms ease" }}
              onClick={() => onSelectBranch(isSelected ? null : branch.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  onSelectBranch(isSelected ? null : branch.id)
                }
              }}
            >
              {/* invisible larger hit area */}
              <circle cx={branch.tipX} cy={branch.tipY} r={34} fill="transparent" />
              <foreignObject
                x={branch.labelX - 90}
                y={branch.labelY - 58}
                width={180}
                height={48}
                style={{ pointerEvents: "none", overflow: "visible" }}
              >
                <div
                  className="mx-auto w-max max-w-[180px] rounded-full px-3 py-1 text-center text-[11px] font-medium leading-tight backdrop-blur-sm"
                  style={{
                    background: isSelected ? branch.color : "oklch(0.22 0.02 260 / 0.7)",
                    color: isSelected ? "oklch(0.15 0.02 260)" : "oklch(0.92 0.01 260)",
                    border: `1px solid ${branch.color}`,
                    boxShadow: isSelected ? `0 0 16px ${branch.color}` : "none",
                  }}
                >
                  {branch.title}
                </div>
              </foreignObject>
            </g>
          )
        })}

        {/* leaves */}
        {layout.branches.map((branch) => {
          const branchSelected = selectedBranchId === branch.id
          const branchDim = selectedBranchId !== null && !branchSelected
          return branch.positionedLeaves.map((leaf) => {
            const matched = !hasQuery || matchedLeafIds!.has(leaf.id)
            const faded = branchDim || (hasQuery && !matched)
            const highlighted = hasQuery && matched
            const isHovered = hoveredLeaf?.id === leaf.id
            return (
              <g
                key={leaf.id}
                data-node
                role="button"
                tabIndex={-1}
                aria-label={`${leaf.label}${leaf.detail ? `, ${leaf.detail}` : ""}. ${leaf.value}${leaf.unit ?? ""} on ${new Date(leaf.timestamp).toLocaleDateString()}.`}
                className="tree-leaf cursor-pointer"
                style={{ opacity: faded ? 0.12 : 1, transition: "opacity 300ms ease" }}
                onMouseEnter={() => onHoverLeaf(leaf)}
                onMouseLeave={() => onHoverLeaf(null)}
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectBranch(branch.id)
                }}
              >
                <circle
                  cx={leaf.x}
                  cy={leaf.y}
                  r={leaf.r + (isHovered || highlighted ? 4 : 0)}
                  fill={branch.color}
                  stroke={highlighted ? "oklch(0.98 0.05 100)" : "oklch(1 0 0 / 0.35)"}
                  strokeWidth={highlighted ? 2 : 1}
                  style={{
                    filter: isHovered || highlighted ? `drop-shadow(0 0 10px ${branch.color})` : "none",
                    transition: "r 200ms ease, filter 200ms ease",
                  }}
                  className={isHovered ? "leaf-shimmer" : undefined}
                />
              </g>
            )
          })
        })}
      </g>
    </svg>
  )
}
