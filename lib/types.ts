// Core domain types for the Tree of Life Stories.
//
// Datasets are normalized into a single "Leaf" shape as required:
//   { type, label, timestamp, value }
// plus a few optional fields we use for narrative + rendering.

export type LeafType = "music" | "movie" | "purchase" | "note" | "travel"

export interface Leaf {
  id: string
  /** kind of event, drives icon + color accents */
  type: LeafType
  /** short human-readable label, e.g. a song or merchant name */
  label: string
  /** ISO timestamp of when the event happened */
  timestamp: string
  /** numeric magnitude: minutes played, amount spent, rating, etc. */
  value: number
  /** unit for `value`, purely for display (min, ₹, ★, ...) */
  unit?: string
  /** optional secondary detail (artist, category, location) */
  detail?: string
}

export interface Branch {
  id: string
  /** chapter title, e.g. "Late Night Listening" */
  title: string
  /** one-line summary shown in the tree + sidebar header */
  subtitle: string
  /** longer generated narrative for the sidebar */
  story: string
  /** dominant category used for grouping */
  category: LeafType
  /** accent color (oklch) used for branch glow + leaves */
  color: string
  leaves: Leaf[]
}

export interface Tree {
  /** overall life label shown at the trunk */
  title: string
  branches: Branch[]
}

// Layout types produced by the positioning pass. Coordinates live in an
// abstract "tree space" that the SVG then pans/zooms over.

export interface PositionedLeaf extends Leaf {
  x: number
  y: number
  /** rendered radius, scaled from `value` */
  r: number
}

export interface PositionedBranch extends Branch {
  /** cubic bezier control path from trunk anchor to branch tip */
  path: string
  /** branch tip, where the leaf cluster hangs */
  tipX: number
  tipY: number
  /** label anchor near the tip */
  labelX: number
  labelY: number
  /** stroke width at the base, tapers toward tip */
  width: number
  positionedLeaves: PositionedLeaf[]
}

export interface TreeLayout {
  title: string
  trunkX: number
  trunkTopY: number
  trunkBaseY: number
  branches: PositionedBranch[]
  /** bounding box of everything, used to fit-to-view */
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}
