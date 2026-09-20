import { TreeExplorer } from "@/components/tree/tree-explorer"

export default function Page() {
  return (
    <div className="dark min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-7xl flex-col gap-5 px-4 py-6 md:px-6">
        <header className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span
              className="inline-block size-2.5 rounded-full"
              style={{ background: "oklch(0.78 0.15 155)", boxShadow: "0 0 12px oklch(0.78 0.15 155)" }}
              aria-hidden="true"
            />
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Tree of Life Stories
            </p>
          </div>
          <h1 className="text-balance text-2xl font-semibold md:text-3xl">
            Your life, growing as a living tree
          </h1>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            Streaming history and everyday receipts become leaves. Related moments gather into
            branches — the chapters of your year. Explore, search, and read the stories hidden in
            your digital trail.
          </p>
        </header>

        <main className="min-h-0 flex-1">
          <TreeExplorer />
        </main>
      </div>
    </div>
  )
}
