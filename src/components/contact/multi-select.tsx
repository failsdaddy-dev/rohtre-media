"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

// "Interested in" on the Contact form: a dropdown where several options can
// be ticked. Same look as the site's Select in its inline mode (the careers
// form): the same trigger box, chevron, list panel, row hover and red tick;
// the list opens right under the box on every device. WAI-ARIA listbox with
// aria-multiselectable: arrows move, Enter or Space ticks, Escape closes;
// focus stays on the trigger.

export function MultiSelect({
  value,
  onChange,
  options,
  placeholder = "Choose…",
  "aria-label": ariaLabel,
  invalid,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
  "aria-label": string;
  invalid?: boolean;
}) {
  const id = useId();
  const listId = `${id}-list`;
  const optId = (i: number) => `${id}-opt-${i}`;
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const toggle = (o: string) => onChange(value.includes(o) ? value.filter((v) => v !== o) : [...value, o]);

  // Close on a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !popup.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", away);
    return () => document.removeEventListener("pointerdown", away);
  }, [open]);

  // Keep the active row visible inside the list (the list scrolls, never the page).
  useEffect(() => {
    if (!open) return;
    const list = popup.current;
    const row = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !row) return;
    if (row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if (row.offsetTop + row.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = row.offsetTop + row.offsetHeight - list.clientHeight;
  }, [active, open]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) return setOpen(true);
      setActive((a) => (e.key === "ArrowDown" ? Math.min(last, a + 1) : Math.max(0, a - 1)));
    } else if (e.key === "Home" || e.key === "End") {
      if (!open) return;
      e.preventDefault();
      setActive(e.key === "Home" ? 0 : last);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) return setOpen(true);
      if (options[active]) toggle(options[active]);
    } else if (e.key === "Escape" && open) {
      e.preventDefault();
      setOpen(false);
    } else if (e.key === "Tab") setOpen(false);
  };

  const summary =
    value.length === 0 ? placeholder : value.length <= 2 ? value.join(", ") : `${value[0]} + ${value.length - 1} more`;

  return (
    <span className="relative block w-full">
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open ? optId(active) : undefined}
        aria-label={ariaLabel}
        aria-invalid={invalid || undefined}
        onClick={() => setOpen(!open)}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!popup.current?.contains(e.relatedTarget as Node)) setOpen(false);
        }}
        className="rm-field rm-select flex min-h-12 w-full items-center gap-2.5 px-3.5 text-left text-[15px] outline-none aria-[invalid=true]:border-danger"
      >
        <span className={`min-w-0 flex-1 truncate ${value.length ? "" : "text-fg-2"}`}>{summary}</span>
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`pointer-events-none shrink-0 text-fg-2 transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          ref={popup}
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label={ariaLabel}
          onPointerDown={(e) => e.preventDefault()}
          className="rm-select-pop absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-elev p-1.5 text-fg shadow-[0_22px_50px_-18px_rgba(0,0,0,0.38)]"
        >
          {options.map((o, i) => {
            const selected = value.includes(o);
            return (
              <div
                key={o}
                id={optId(i)}
                role="option"
                aria-selected={selected}
                data-index={i}
                data-active={i === active || undefined}
                onPointerMove={() => i !== active && setActive(i)}
                onClick={(e) => {
                  e.preventDefault();
                  setActive(i);
                  toggle(o);
                }}
                className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] data-[active]:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)] ${
                  selected ? "font-semibold" : ""
                }`}
              >
                <span className="min-w-0 flex-1">{o}</span>
                <svg
                  aria-hidden="true"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`shrink-0 text-brand ${selected ? "" : "invisible"}`}
                >
                  <path d="m5 12 5 5 9-10" />
                </svg>
              </div>
            );
          })}
        </div>
      )}
    </span>
  );
}
