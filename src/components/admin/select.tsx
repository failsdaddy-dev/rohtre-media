"use client";

import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

// The admin's one dropdown (replaces every native <select> in the admin).
// Same props and value semantics as a controlled <select>: value, onChange
// (gets the new value string), options, disabled, name, id, aria-label,
// required, invalid. With `name` it also renders a hidden input, so form
// posts (FormData) get the value exactly like a native select.
//
// Keyboard and ARIA follow the WAI-ARIA Authoring Practices "Select-Only
// Combobox" pattern (w3.org/WAI/ARIA/apg/patterns/combobox/examples/
// combobox-select-only/, checked 2026-10-22): the trigger has
// role=combobox, aria-expanded, aria-controls and aria-activedescendant;
// DOM focus stays on it while the popup (role=listbox, role=option +
// aria-selected) shows the "visual focus".
//   closed: Down / Alt+Down / Enter / Space open; Up and Home open on the
//           first option, End on the last; a typed character opens on the
//           first match
//   open:   Up/Down, Home/End, PageUp/PageDown (10), type-ahead (a string
//           typed quickly; a repeated character cycles), Enter / Space /
//           Alt+Up choose and close, Tab chooses and moves on, Escape closes
// The popup is portalled to <body> (never clipped by a parent), fixed under
// the trigger or flipped above it when there is no room, at least as wide
// as the trigger, at most min(320px, 50svh) tall, above the sticky header
// and save bar; it follows scrolling and resizing and closes on an outside
// click. Coarse pointers (phones, tablets) get a native <select> with the
// same look, so they keep the system picker. `inline` instead opens the list
// right under the box in the page flow, on every device (used in modals).

export type SelectOption = {
  value: string;
  label: string;
  /** A short note after the label (e.g. "1920×1080"). */
  hint?: string;
  /** One line under the label. */
  description?: string;
  /** Options with the same group are listed under that heading (keep them together). */
  group?: string;
  /** A small icon or preview before the label. */
  icon?: ReactNode;
  /** Shown instead of the label and hint in the closed box (a narrow box, e.g. "+91"). */
  short?: string;
  /** Stays visible at the bottom of the list while it scrolls (e.g. an "add new" row). */
  sticky?: boolean;
  disabled?: boolean;
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  name?: string;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  required?: boolean;
  invalid?: boolean;
  /** md = full width; sm = as wide as its content (table rows, inline). Both at least 48 px tall. */
  size?: "md" | "sm";
  className?: string;
  /** Shown when the value matches no option. */
  placeholder?: string;
  /**
   * The list opens right under the box, inside the page flow (not portalled,
   * not fixed), and touch screens get the same list instead of the system
   * picker. For dropdowns inside a modal or a scrolling panel (the careers form).
   */
  inline?: boolean;
  /** Width of the inline list (default: the same as the box). */
  popupClassName?: string;
};

const POPUP_MAX_PX = 320;
const GAP = 6;
const MARGIN = 8;
const TYPE_AHEAD_MS = 500;

/** Where the popup goes: under the trigger, or above it when there's more room there. */
export function placePopup(
  trigger: { top: number; bottom: number; left: number; width: number },
  viewport: { width: number; height: number },
  contentHeight: number,
) {
  const cap = Math.min(POPUP_MAX_PX, viewport.height * 0.5);
  const want = Math.min(contentHeight, cap);
  const below = viewport.height - trigger.bottom - GAP - MARGIN;
  const above = trigger.top - GAP - MARGIN;
  const up = below < want && above > below;
  const maxHeight = Math.max(0, Math.min(cap, up ? above : below));
  const width = Math.min(trigger.width, viewport.width - 2 * MARGIN);
  const left = Math.max(MARGIN, Math.min(trigger.left, viewport.width - width - MARGIN));
  return up
    ? { up, maxHeight, left, minWidth: width, bottom: viewport.height - trigger.top + GAP }
    : { up, maxHeight, left, minWidth: width, top: trigger.bottom + GAP };
}

/** The option index after a navigation key, skipping disabled options (null = not a navigation key). */
export function moveActive(options: SelectOption[], from: number, key: string): number | null {
  const ok = (i: number) => i >= 0 && i < options.length && !options[i].disabled;
  const first = options.findIndex((o) => !o.disabled);
  const last = options.findLastIndex((o) => !o.disabled);
  const step = (start: number, dir: 1 | -1, count: number) => {
    let at = start;
    for (let i = start + dir, moved = 0; i >= 0 && i < options.length && moved < count; i += dir) {
      if (ok(i)) {
        at = i;
        moved++;
      }
    }
    return ok(at) ? at : dir === 1 ? first : last;
  };
  switch (key) {
    case "ArrowDown":
      return from < 0 ? first : step(from, 1, 1);
    case "ArrowUp":
      return from < 0 ? first : step(from, -1, 1);
    case "PageDown":
      return step(Math.max(from, first), 1, 10);
    case "PageUp":
      return step(Math.max(from, first), -1, 10);
    case "Home":
      return first;
    case "End":
      return last;
    default:
      return null;
  }
}

/**
 * Type-ahead: the first option whose label starts with the typed string,
 * searching after the current one; a single repeated character cycles
 * through the options starting with it.
 */
export function typeAhead(options: SelectOption[], from: number, typed: string): number {
  const text = typed.toLowerCase();
  const same = text.length > 1 && [...text].every((c) => c === text[0]);
  const needle = same ? text[0] : text;
  const n = options.length;
  const start = needle.length === 1 ? from + 1 : Math.max(from, 0);
  for (let k = 0; k < n; k++) {
    const i = (((start + k) % n) + n) % n;
    if (!options[i].disabled && options[i].label.toLowerCase().startsWith(needle)) return i;
  }
  return from;
}

const coarseQuery = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(pointer: coarse)")
    : null;
function subscribeCoarse(cb: () => void) {
  const q = coarseQuery();
  q?.addEventListener("change", cb);
  return () => q?.removeEventListener("change", cb);
}
/** True on phones and tablets (no fine pointer); false on the server and in the first render. */
function useCoarsePointer() {
  return useSyncExternalStore(
    subscribeCoarse,
    () => coarseQuery()?.matches ?? false,
    () => false,
  );
}

function Chevron({ open }: { open: boolean }) {
  return (
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
  );
}

const trigger = (size: "md" | "sm") =>
  `rm-field rm-select flex min-h-12 items-center gap-2.5 px-3.5 text-left outline-none disabled:cursor-not-allowed disabled:opacity-55 aria-[invalid=true]:border-danger ${
    size === "md" ? "w-full text-[15px]" : "w-auto min-w-36 max-w-full text-sm"
  }`;

export function Select({
  value,
  onChange,
  options,
  disabled,
  name,
  id,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
  required,
  invalid,
  size = "md",
  className = "",
  placeholder = "Choose…",
  inline = false,
  popupClassName = "inset-x-0",
}: SelectProps) {
  const coarse = useCoarsePointer();
  const auto = useId();
  const listId = `${id ?? auto}-list`;
  const optId = (i: number) => `${id ?? auto}-opt-${i}`;
  const button = useRef<HTMLButtonElement>(null);
  const popup = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: "", at: 0 });
  /** Scroll the list to the active option only after a keyboard move or on opening, never while the mouse scrolls it. */
  const follow = useRef(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [place, setPlace] = useState<ReturnType<typeof placePopup> | null>(null);
  /** Where the popup is portalled: the open <dialog> around the trigger (top layer), else <body>. */
  const [host, setHost] = useState<Element | null>(null);
  const index = options.findIndex((o) => o.value === value);
  const current = options[index];

  const show = (at: number) => {
    follow.current = true;
    if (!inline) setHost(document.body);
    setActive(at);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    setPlace(null);
  };
  const choose = (i: number) => {
    const o = options[i];
    if (o && !o.disabled && o.value !== value) onChange(o.value);
    close();
  };

  // Position: on open, then on every scroll (any scroller) and resize.
  useLayoutEffect(() => {
    if (!open || inline) return;
    const update = () => {
      const r = button.current?.getBoundingClientRect();
      if (!r) return;
      const h = popup.current?.scrollHeight ?? POPUP_MAX_PX;
      setPlace(placePopup(r, { width: window.innerWidth, height: window.innerHeight }, h));
    };
    // Scrolling the list itself must not re-place it (that re-render made the list jump back).
    const onScroll = (e: Event) => {
      if (popup.current?.contains(e.target as Node)) return;
      update();
    };
    update();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", update);
    };
  }, [open, inline]);

  // Close on a click anywhere else.
  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!button.current?.contains(t) && !popup.current?.contains(t)) close();
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0 || !follow.current) return;
    const list = popup.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !el) return;
    // Scroll only the list itself: scrollIntoView would also scroll every
    // scrolling ancestor (e.g. the dialog the popup sits in), shifting the page.
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight;
    if (place || inline) follow.current = false; // placed and scrolled once; the mouse/wheel is free now
  }, [open, active, place, inline]);

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    const printable = k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey;
    const typing = printable && (k !== " " || Date.now() - typed.current.at < TYPE_AHEAD_MS);
    if (typing) {
      e.preventDefault();
      const now = Date.now();
      typed.current = { text: now - typed.current.at < TYPE_AHEAD_MS ? typed.current.text + k : k, at: now };
      show(typeAhead(options, open ? active : index, typed.current.text)); // follows the match
      return;
    }
    if (!open) {
      if (["ArrowDown", "Enter", " "].includes(k)) {
        e.preventDefault();
        show(index >= 0 ? index : (moveActive(options, -1, "Home") ?? -1));
      } else if (k === "ArrowUp" || k === "Home") {
        e.preventDefault();
        show(moveActive(options, -1, "Home") ?? -1);
      } else if (k === "End") {
        e.preventDefault();
        show(moveActive(options, -1, "End") ?? -1);
      }
      return;
    }
    if (k === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (k === "Enter" || k === " " || (k === "ArrowUp" && e.altKey)) {
      e.preventDefault();
      choose(active);
    } else if (k === "Tab") {
      choose(active); // no preventDefault: focus moves on
    } else {
      const next = moveActive(options, active, k);
      if (next !== null) {
        e.preventDefault();
        follow.current = true;
        setActive(next);
      }
    }
  };

  const label = (o: SelectOption | undefined) => (
    <>
      {o?.icon && (
        <span aria-hidden="true" className="grid size-7 shrink-0 place-items-center">
          {o.icon}
        </span>
      )}
      <span className={`min-w-0 flex-1 truncate ${o ? "" : "text-fg-2"}`}>
        {o ? (o.short ?? o.label) : placeholder}
        {o?.hint && !o.short && <span className="ml-2 text-xs text-fg-2">{o.hint}</span>}
      </span>
    </>
  );

  if (coarse && !inline) {
    // Touch: the system picker, in the same styled box.
    return (
      <span className={`relative flex ${size === "md" ? "w-full" : "w-auto"} ${className}`}>
        <select
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-invalid={invalid || undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${trigger(size)} cursor-pointer appearance-none bg-transparent pr-10`}
        >
          {index < 0 && <option value={value}>{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.hint ? `${o.label} (${o.hint})` : o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3.5 grid place-items-center">
          <Chevron open={false} />
        </span>
      </span>
    );
  }

  let lastGroup: string | undefined;
  const rows: ReactNode[] = [];
  options.forEach((o, i) => {
    if (o.group && o.group !== lastGroup) {
      rows.push(
        <div
          key={`g-${o.group}`}
          role="presentation"
          className="px-3 pb-1 pt-3 text-[11px] font-bold uppercase tracking-[0.14em] text-fg-2 first:pt-1"
        >
          {o.group}
        </div>,
      );
    }
    lastGroup = o.group;
    const selected = i === index;
    rows.push(
      <div
        key={o.value}
        id={optId(i)}
        role="option"
        aria-selected={selected}
        aria-disabled={o.disabled || undefined}
        data-index={i}
        data-active={i === active || undefined}
        onPointerMove={() => !o.disabled && i !== active && setActive(i)}
        onClick={(e) => {
          // Inside a <label>, a click would also "click" the trigger again and reopen the list.
          e.preventDefault();
          choose(i);
        }}
        className={`flex min-h-11 items-center gap-3 rounded-[10px] px-3 py-2 text-[15px] ${
          o.disabled
            ? "cursor-not-allowed opacity-50"
            : o.sticky
              ? "cursor-pointer data-[active]:bg-[color-mix(in_srgb,var(--brand)_10%,var(--bg-elev))]"
              : "cursor-pointer data-[active]:bg-[color-mix(in_srgb,var(--brand)_10%,transparent)]"
        } ${selected ? "font-semibold" : ""} ${o.sticky ? "sticky bottom-0 bg-bg-elev font-semibold" : ""}`}
      >
        {o.icon && (
          <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center">
            {o.icon}
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block">
            {o.label}
            {o.hint && <span className="ml-2 text-xs font-normal text-fg-2">{o.hint}</span>}
          </span>
          {o.description && <span className="block text-xs font-normal text-fg-2">{o.description}</span>}
        </span>
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
      </div>,
    );
  });

  if (inline) {
    return (
      <span className={`relative block ${size === "md" ? "w-full" : "w-auto"}`}>
        <button
          ref={button}
          type="button"
          id={id}
          role="combobox"
          aria-controls={listId}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-required={required || undefined}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          onClick={() => (open ? close() : show(index >= 0 ? index : (moveActive(options, -1, "Home") ?? -1)))}
          onKeyDown={onKeyDown}
          onBlur={(e) => {
            if (!popup.current?.contains(e.relatedTarget as Node)) close();
          }}
          className={`${trigger(size)} ${className}`}
        >
          {label(current)}
          <Chevron open={open} />
        </button>
        {name && <input type="hidden" name={name} value={value} />}
        {open && (
          <div
            ref={popup}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : (ariaLabelledby ?? id)}
            onPointerDown={(e) => e.preventDefault()}
            data-lenis-prevent=""
            className={`rm-select-pop absolute ${popupClassName} top-[calc(100%+6px)] z-30 max-h-64 overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-elev p-1.5 text-fg shadow-[0_22px_50px_-18px_rgba(0,0,0,0.38)]`}
          >
            {rows}
          </div>
        )}
      </span>
    );
  }

  return (
    <>
      <button
        ref={button}
        type="button"
        id={id}
        role="combobox"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-activedescendant={open && active >= 0 ? optId(active) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-required={required || undefined}
        aria-invalid={invalid || undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show(index >= 0 ? index : (moveActive(options, -1, "Home") ?? -1)))}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!popup.current?.contains(e.relatedTarget as Node)) close();
        }}
        className={`${trigger(size)} ${className}`}
      >
        {label(current)}
        <Chevron open={open} />
      </button>
      {name && <input type="hidden" name={name} value={value} />}
      {open &&
        host &&
        createPortal(
          <div
            ref={popup}
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            aria-labelledby={ariaLabel ? undefined : (ariaLabelledby ?? id)}
            // Clicking an option keeps focus on the trigger (the pattern's "DOM focus stays").
            onPointerDown={(e) => e.preventDefault()}
            style={{
              position: "fixed",
              left: place?.left ?? -9999,
              top: place && "top" in place ? place.top : undefined,
              bottom: place && "bottom" in place ? place.bottom : undefined,
              minWidth: place?.minWidth,
              maxWidth: "calc(100vw - 16px)",
              maxHeight: place?.maxHeight ?? POPUP_MAX_PX,
              visibility: place ? "visible" : "hidden",
            }}
            data-up={place?.up || undefined}
            data-lenis-prevent=""
            className="rm-select-pop z-[1000] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-bg-elev p-1.5 text-fg shadow-[0_22px_50px_-18px_rgba(0,0,0,0.38)]"
          >
            {rows}
          </div>,
          host,
        )}
    </>
  );
}
