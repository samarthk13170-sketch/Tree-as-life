// Dataset ingestion layer.
//
// In production you would load the Kaggle CSV/JSON exports here (see README).
// The records below are shaped to match the real Kaggle schemas so the
// mapping code is identical whether the data is sampled or real:
//
//   Spotify Streaming History  -> { ts, master_metadata_track_name,
//                                    master_metadata_album_artist_name,
//                                    ms_played }
//   Daily Household Transactions -> { Date, Category, Subcategory, Amount, Mode }
//
// A small seeded PRNG keeps the generated sample deterministic so the tree
// looks identical on every render (important for SSR hydration).

import type { Leaf, LeafType } from "./types"

function mulberry32(seed: number) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(20240921)
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
const between = (min: number, max: number) => min + rand() * (max - min)

function isoDate(year: number, month: number, day: number, hour: number) {
  const d = new Date(Date.UTC(year, month, day, hour, Math.floor(rand() * 60)))
  return d.toISOString()
}

// ---------- Raw Spotify streaming-history records (Kaggle schema) ----------

interface SpotifyRecord {
  ts: string
  master_metadata_track_name: string
  master_metadata_album_artist_name: string
  ms_played: number
}

const nightTracks = [
  ["Midnight City", "M83"],
  ["Nightcall", "Kavinsky"],
  ["Redbone", "Childish Gambino"],
  ["Motion Picture Soundtrack", "Radiohead"],
  ["Weird Fishes", "Radiohead"],
  ["Slow Dancing in the Dark", "Joji"],
  ["Nights", "Frank Ocean"],
  ["Space Song", "Beach House"],
]

const roadTracks = [
  ["Mr. Blue Sky", "ELO"],
  ["Africa", "Toto"],
  ["Life Is a Highway", "Tom Cochrane"],
  ["Take It Easy", "Eagles"],
  ["Ho Hey", "The Lumineers"],
  ["On the Road Again", "Willie Nelson"],
  ["Dog Days Are Over", "Florence + The Machine"],
  ["Feel It Still", "Portugal. The Man"],
]

function makeSpotify(tracks: string[][], count: number, hourRange: [number, number]): SpotifyRecord[] {
  const out: SpotifyRecord[] = []
  for (let i = 0; i < count; i++) {
    const [track, artist] = pick(tracks)
    out.push({
      ts: isoDate(2024, Math.floor(between(0, 11)), Math.floor(between(1, 28)), Math.floor(between(hourRange[0], hourRange[1]))),
      master_metadata_track_name: track,
      master_metadata_album_artist_name: artist,
      ms_played: Math.floor(between(90, 260)) * 1000,
    })
  }
  return out
}

// ---------- Raw household-transaction records (Kaggle schema) ----------

interface TransactionRecord {
  Date: string
  Category: string
  Subcategory: string
  Amount: number
  Mode: string
}

function makeTransactions(
  category: string,
  items: [string, number, number][],
  count: number,
): TransactionRecord[] {
  const out: TransactionRecord[] = []
  for (let i = 0; i < count; i++) {
    const [sub, min, max] = pick(items)
    out.push({
      Date: isoDate(2024, Math.floor(between(0, 11)), Math.floor(between(1, 28)), Math.floor(between(8, 22))),
      Category: category,
      Subcategory: sub,
      Amount: Math.round(between(min, max)),
      Mode: pick(["UPI", "Card", "Cash"]),
    })
  }
  return out
}

// ---------- Normalizers: raw record -> Leaf { type, label, timestamp, value } ----------

let seq = 0
const nextId = (p: string) => `${p}-${(seq++).toString(36)}`

function spotifyToLeaf(r: SpotifyRecord): Leaf {
  return {
    id: nextId("song"),
    type: "music",
    label: r.master_metadata_track_name,
    detail: r.master_metadata_album_artist_name,
    timestamp: r.ts,
    value: Math.round(r.ms_played / 1000 / 60),
    unit: "min",
  }
}

function transactionToLeaf(r: TransactionRecord, type: LeafType = "purchase"): Leaf {
  return {
    id: nextId("txn"),
    type,
    label: r.Subcategory,
    detail: `${r.Category} · ${r.Mode}`,
    timestamp: r.Date,
    value: r.Amount,
    unit: "₹",
  }
}

// ---------- Public API: grouped, normalized leaves per life chapter ----------

export interface RawChapter {
  id: string
  title: string
  subtitle: string
  story: string
  category: LeafType
  color: string
  leaves: Leaf[]
}

export function loadChapters(): RawChapter[] {
  return [
    {
      id: "late-night",
      title: "Late Night Listening",
      subtitle: "The soundtrack of your quiet hours",
      story:
        "After midnight the world goes quiet and the headphones come on. This chapter is stitched together from the songs you returned to when everyone else was asleep — dreamy, cinematic, a little melancholy. The longer a leaf, the longer you stayed with that track.",
      category: "music",
      color: "oklch(0.72 0.15 285)",
      leaves: makeSpotify(nightTracks, 22, [0, 4]).map(spotifyToLeaf),
    },
    {
      id: "road-trip",
      title: "Road Trip Anthems",
      subtitle: "Windows down, volume up",
      story:
        "Every long drive needs a chorus you can shout. These are the daytime, high-energy tracks that piled up on your open-road playlists. Cluster density here maps to the summer months when the car never really cooled down.",
      category: "music",
      color: "oklch(0.78 0.15 155)",
      leaves: makeSpotify(roadTracks, 20, [9, 18]).map(spotifyToLeaf),
    },
    {
      id: "everyday-essentials",
      title: "Everyday Essentials",
      subtitle: "The quiet cost of keeping life running",
      story:
        "Groceries, utilities, the unglamorous receipts that keep a home humming. Individually forgettable, together they trace the steady rhythm of an ordinary, well-lived year. Bigger leaves are the monthly restocks.",
      category: "purchase",
      color: "oklch(0.75 0.13 75)",
      leaves: makeTransactions("Household", [
        ["Groceries", 400, 2400],
        ["Electricity", 800, 1800],
        ["Water", 200, 600],
        ["Internet", 700, 1200],
        ["Cleaning", 150, 700],
      ], 24).map((r) => transactionToLeaf(r, "purchase")),
    },
    {
      id: "coffee-cravings",
      title: "Coffee & Cravings",
      subtitle: "Small indulgences, big joy",
      story:
        "The flat whites, the late-night snack runs, the treat-yourself desserts. This branch glows brightest on weekends — proof that the little pleasures added up to something worth remembering.",
      category: "purchase",
      color: "oklch(0.72 0.16 45)",
      leaves: makeTransactions("Food & Dining", [
        ["Coffee", 120, 450],
        ["Restaurant", 350, 1600],
        ["Desserts", 90, 500],
        ["Snacks", 40, 300],
        ["Takeout", 200, 900],
      ], 20).map((r) => transactionToLeaf(r, "purchase")),
    },
    {
      id: "wanderlust",
      title: "Wanderlust",
      subtitle: "The year you kept moving",
      story:
        "Flights, fuel, a few hotel nights that turned into stories. The travel receipts are sparse but heavy — each leaf here is a trip that reshaped the months around it.",
      category: "travel",
      color: "oklch(0.74 0.14 200)",
      leaves: makeTransactions("Travel", [
        ["Flights", 4500, 18000],
        ["Hotels", 2200, 9000],
        ["Fuel", 1500, 4000],
        ["Cab", 250, 1400],
        ["Sightseeing", 300, 2500],
      ], 12).map((r) => transactionToLeaf(r, "travel")),
    },
    {
      id: "self-investment",
      title: "Self Investment",
      subtitle: "Betting on your future self",
      story:
        "Courses, books, the subscriptions you actually used. This chapter is small but deliberate — the receipts you'll be glad you kept when you look back on who you were becoming.",
      category: "note",
      color: "oklch(0.7 0.15 330)",
      leaves: makeTransactions("Growth", [
        ["Online Course", 500, 6000],
        ["Books", 200, 1500],
        ["Gym", 800, 2500],
        ["Software", 300, 2000],
        ["Workshop", 1000, 5000],
      ], 14).map((r) => transactionToLeaf(r, "note")),
    },
  ]
}
