import { Film, Music, Plane, ShoppingBag, StickyNote, type LucideIcon } from "lucide-react"
import type { LeafType } from "./types"

export interface CategoryMeta {
  label: string
  color: string
  icon: LucideIcon
}

export const CATEGORY_META: Record<LeafType, CategoryMeta> = {
  music: { label: "Music", color: "oklch(0.72 0.15 285)", icon: Music },
  movie: { label: "Movies", color: "oklch(0.7 0.15 20)", icon: Film },
  purchase: { label: "Purchases", color: "oklch(0.75 0.13 75)", icon: ShoppingBag },
  travel: { label: "Travel", color: "oklch(0.74 0.14 200)", icon: Plane },
  note: { label: "Growth", color: "oklch(0.7 0.15 330)", icon: StickyNote },
}

export const CATEGORY_ORDER: LeafType[] = ["music", "purchase", "travel", "note", "movie"]
