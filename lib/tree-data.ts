// Builds the renderable tree layout from the normalized chapters.
//
// Everything is computed in an abstract "tree space" (y-up feels natural, but
// we keep SVG's y-down convention: smaller y = higher up the tree). The SVG
// component pans/zooms over these absolute coordinates.

import { loadChapters } from "./datasets"
import type { PositionedBranch, PositionedLeaf, Tree, TreeLayout } from "./types"

const TRUNK_X = 0
const TRUNK_BASE_Y = 0
const TRUNK_TOP_Y = -240

export function buildTree(): Tree {
  return { title: "Your Life", branches: loadChapters() }
}

// Deterministic pseudo-jitter so leaf clusters look organic but stable.
function jitter(seed: number) {
  const x = Math.sin(seed * 127.1) * 43758.5453
  return x - Math.floor(x)
}

export function layoutTree(tree: Tree): TreeLayout {
  const n = tree.branches.length
  const spread = 150 // total angular spread in degrees
  const start = -spread / 2

  let minX = -60
  let maxX = 60
  let minY = TRUNK_TOP_Y
  const maxY = TRUNK_BASE_Y + 40

  const branches: PositionedBranch[] = tree.branches.map((branch, i) => {
    // Fan the branches out across the arc, alternating length for balance.
    const t = n === 1 ? 0.5 : i / (n - 1)
    const angleDeg = start + spread * t
    const angle = (angleDeg * Math.PI) / 180
    const length = 300 + (i % 2 === 0 ? 60 : 0) + branch.leaves.length * 3

    const dirX = Math.sin(angle)
    const dirY = -Math.cos(angle)

    const tipX = TRUNK_X + dirX * length
    const tipY = TRUNK_TOP_Y + dirY * length

    // Curved bezier: bow the branch outward for a natural sweep.
    const midX = TRUNK_X + dirX * length * 0.45 + (angleDeg < 0 ? -40 : 40)
    const midY = TRUNK_TOP_Y + dirY * length * 0.55
    const c1x = TRUNK_X + dirX * length * 0.15
    const c1y = TRUNK_TOP_Y + dirY * length * 0.2
    const path = `M ${TRUNK_X} ${TRUNK_TOP_Y} C ${c1x} ${c1y}, ${midX} ${midY}, ${tipX} ${tipY}`

    const width = 26 - i * 1.2

    // Scale leaf radius from value, normalized within the branch.
    const values = branch.leaves.map((l) => l.value)
    const maxV = Math.max(...values, 1)
    const minV = Math.min(...values, 0)

    const positionedLeaves: PositionedLeaf[] = branch.leaves.map((leaf, j) => {
      // Arrange leaves in a loose sunflower cluster around the tip.
      const golden = 2.399963
      const idx = j + 1
      const clusterR = 26 + Math.sqrt(idx) * 26
      const a = idx * golden + jitter(i * 100 + j) * 1.2
      const jx = jitter(i * 31 + j * 7) * 24 - 12
      const jy = jitter(i * 17 + j * 13) * 24 - 12
      const x = tipX + Math.cos(a) * clusterR + jx
      const y = tipY + Math.sin(a) * clusterR + jy

      const norm = maxV === minV ? 0.5 : (leaf.value - minV) / (maxV - minV)
      const r = 7 + norm * 11

      minX = Math.min(minX, x - r)
      maxX = Math.max(maxX, x + r)
      minY = Math.min(minY, y - r)

      return { ...leaf, x, y, r }
    })

    return {
      ...branch,
      path,
      tipX,
      tipY,
      labelX: tipX + (angleDeg < 0 ? -8 : 8),
      labelY: tipY - 8,
      width,
      positionedLeaves,
    }
  })

  const pad = 80
  return {
    title: tree.title,
    trunkX: TRUNK_X,
    trunkTopY: TRUNK_TOP_Y,
    trunkBaseY: TRUNK_BASE_Y,
    branches,
    bounds: {
      minX: minX - pad,
      minY: minY - pad,
      maxX: maxX + pad,
      maxY: maxY + pad,
    },
  }
}
