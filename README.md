# Tree of Life Stories — "Your Life, In Receipts"

Represent your digital-life activities as a living tree:

- **Trunk** — your overall life.
- **Branches** — chapters/stories (Late Night Listening, Wanderlust, ...).
- **Leaves** — individual receipts/events (a song play, a coffee, a flight).

Each leaf is normalized to a single shape: `{ type, label, timestamp, value }`.

## Features

- Interactive SVG tree with **zoom** (scroll / buttons / `+` `-`) and **pan** (drag / arrow keys).
- **Click a branch** to highlight its leaves and open its narrative in the sidebar.
- **Search** across every event and **filter** by category (music, purchases, travel, growth, movies).
- **Hover a leaf** to shimmer it and preview the moment; selected branches glow.
- Responsive layout (Tailwind), reduced-motion support, ARIA labels, and full keyboard navigation.
- Deterministic layout (seeded) so the tree is stable across renders / SSR hydration.

## Getting started

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000.

## Kaggle dataset integration

The app ships with a **seeded sample** shaped to match the real Kaggle schemas, so
swapping in real data requires no changes to the visualization code.

Datasets this project targets:

- Spotify Streaming History (`spotify_history.csv`)
- Daily Household Transactions
- Augmented India Transact Multi-Facet 2024 (CSV / JSON / XML)
- Spotify Data Dictionary (`spotify_data_dictionary.csv`)

### Where the mapping lives

- `lib/datasets.ts` — ingests raw records and normalizes them into `Leaf` objects.
  The record interfaces (`SpotifyRecord`, `TransactionRecord`) already match the
  Kaggle column names (`ts`, `master_metadata_track_name`, `ms_played`, `Date`,
  `Category`, `Amount`, ...).
- `lib/tree-data.ts` — groups leaves into branches and computes the tree layout.

### Using the real Kaggle exports

1. Download the datasets:
   ```bash
   # requires a Kaggle API token at ~/.kaggle/kaggle.json
   kaggle datasets download -d <owner>/<spotify-streaming-history> -p data/ --unzip
   kaggle datasets download -d <owner>/<daily-household-transactions> -p data/ --unzip
   ```
2. Parse the CSV/JSON into the existing `SpotifyRecord` / `TransactionRecord`
   arrays inside `lib/datasets.ts` (use a parser such as `papaparse`), replacing
   the `make*` sample generators.
3. Keep the `spotifyToLeaf` / `transactionToLeaf` normalizers — they already emit
   the `{ type, label, timestamp, value }` shape the tree renders.

Because the sample already conforms to the Kaggle schema, only the record source
changes; branch grouping, layout, and rendering stay the same.

## Deployment

Deploy on Vercel:

```bash
vercel
```

Or push to a Git repo connected to a Vercel project. No environment variables or
backend are required for the sample data; add them only if you wire up live
Kaggle fetching.

## Tech

Next.js (App Router) · React 19 · Tailwind CSS v4 · TypeScript · SVG visualization.
