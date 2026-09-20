"use client"

import { useState } from "react"
import { Plus, Sprout, X } from "lucide-react"
import { CATEGORY_META, CATEGORY_ORDER } from "@/lib/categories"
import { AUTO_TARGET, NEW_BRANCH_TARGET, type NewEventInput } from "@/lib/tree-data"
import type { LeafType, Tree } from "@/lib/types"

const UNIT_HINT: Record<LeafType, string> = {
  music: "minutes played",
  movie: "rating (★)",
  purchase: "amount (₹)",
  travel: "amount (₹)",
  note: "amount (₹)",
}

// A datetime-local string for "now" in the browser's local timezone.
function localNow() {
  const d = new Date()
  const off = d.getTimezoneOffset()
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16)
}

interface AddEventFormProps {
  tree: Tree
  onAddEvent: (input: NewEventInput) => void
  onClose: () => void
}

export function AddEventForm({ tree, onAddEvent, onClose }: AddEventFormProps) {
  const [type, setType] = useState<LeafType>("music")
  const [label, setLabel] = useState("")
  const [value, setValue] = useState("")
  const [when, setWhen] = useState<string>(() => localNow())
  const [target, setTarget] = useState<string>(AUTO_TARGET)
  const [newBranchTitle, setNewBranchTitle] = useState("")

  const canSubmit = label.trim().length > 0 && value.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    const iso = when ? new Date(when).toISOString() : new Date().toISOString()
    onAddEvent({
      type,
      label,
      value: Number.parseFloat(value),
      timestamp: iso,
      target,
      newBranchTitle: target === NEW_BRANCH_TARGET ? newBranchTitle : undefined,
    })
    // Reset the label/value for quick successive entries; keep type + target.
    setLabel("")
    setValue("")
    setWhen(localNow())
    if (target === NEW_BRANCH_TARGET) setNewBranchTitle("")
  }

  const fieldClass =
    "w-full rounded-lg border border-border bg-background/60 px-3 py-2 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40"

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur"
      aria-label="Add a new event to the tree"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sprout className="size-4 text-primary" aria-hidden="true" />
        <h2 className="text-sm font-semibold">Add a moment</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close add moment form"
          className="ml-auto rounded-full p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Type */}
      <fieldset className="mb-3">
        <legend className="mb-1.5 text-xs font-medium text-muted-foreground">Type</legend>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_ORDER.map((t) => {
            const meta = CATEGORY_META[t]
            const Icon = meta.icon
            const active = type === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                aria-pressed={active}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition"
                style={{
                  borderColor: active ? meta.color : "var(--border)",
                  background: active ? meta.color : "transparent",
                  color: active ? "oklch(0.16 0.02 260)" : "var(--muted-foreground)",
                }}
              >
                <Icon className="size-3.5" aria-hidden="true" />
                {meta.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      {/* Label */}
      <div className="mb-3">
        <label htmlFor="event-label" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Label
        </label>
        <input
          id="event-label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Space Song, Morning coffee, Flight to Tokyo"
          className={fieldClass}
          required
        />
      </div>

      {/* Value + timestamp */}
      <div className="mb-3 flex gap-2">
        <div className="flex-1">
          <label htmlFor="event-value" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            Value <span className="text-muted-foreground/70">· {UNIT_HINT[type]}</span>
          </label>
          <input
            id="event-value"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="0"
            className={fieldClass}
            required
          />
        </div>
        <div className="flex-1">
          <label htmlFor="event-when" className="mb-1.5 block text-xs font-medium text-muted-foreground">
            When
          </label>
          <input
            id="event-when"
            type="datetime-local"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
            className={fieldClass}
          />
        </div>
      </div>

      {/* Target branch */}
      <div className="mb-3">
        <label htmlFor="event-target" className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Attach to
        </label>
        <select
          id="event-target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className={fieldClass}
        >
          <option value={AUTO_TARGET}>Auto — match a story by type</option>
          {tree.branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
          <option value={NEW_BRANCH_TARGET}>+ Start a new branch…</option>
        </select>
      </div>

      {target === NEW_BRANCH_TARGET && (
        <div className="mb-3">
          <label
            htmlFor="event-branch-title"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            New branch title <span className="text-muted-foreground/70">· optional</span>
          </label>
          <input
            id="event-branch-title"
            value={newBranchTitle}
            onChange={(e) => setNewBranchTitle(e.target.value)}
            placeholder="e.g. Rainy Day Reads"
            className={fieldClass}
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="size-4" aria-hidden="true" />
        Grow this leaf
      </button>
    </form>
  )
}
