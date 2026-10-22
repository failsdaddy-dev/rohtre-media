// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moveActive, placePopup, Select, typeAhead, type SelectOption } from "../src/components/admin/select";

// The admin dropdown (src/components/admin/select.tsx), driven like a user
// would: real DOM (jsdom), keyboard events on the combobox, clicks.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const OPTIONS: SelectOption[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
  { value: "xl", label: "Extra large" },
  { value: "pear", label: "Pear" },
  { value: "plum", label: "Plum" },
  { value: "peach", label: "Peach", disabled: true },
];

let host: HTMLDivElement;
let root: Root;
const onChange = vi.fn();

function Harness({ initial = "medium", name }: { initial?: string; name?: string }) {
  const [v, setV] = useState(initial);
  return (
    <form id="f">
      <label>
        Frame size
        <Select
          id="size"
          name={name}
          value={v}
          options={OPTIONS}
          onChange={(x) => {
            onChange(x);
            setV(x);
          }}
        />
      </label>
      <button type="button" id="after">
        after
      </button>
    </form>
  );
}

const mount = (ui: React.ReactNode) => act(() => root.render(ui));
const combo = () => document.querySelector<HTMLButtonElement>('[role="combobox"]')!;
const list = () => document.querySelector<HTMLElement>('[role="listbox"]');
const key = (k: string, extra: KeyboardEventInit = {}) =>
  act(() => {
    combo().dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...extra }));
  });
const activeLabel = () => document.getElementById(combo().getAttribute("aria-activedescendant") ?? "")?.textContent;

beforeEach(() => {
  onChange.mockClear();
  host = document.createElement("div");
  document.body.appendChild(host);
  root = createRoot(host);
  window.matchMedia = undefined as never; // a fine pointer (desktop) unless a test says otherwise
});
afterEach(() => {
  act(() => root.unmount());
  host.remove();
  document.body.innerHTML = "";
});

describe("admin Select (WAI-ARIA select-only combobox)", () => {
  it("is a labelled combobox; opening shows a listbox of options with the selected one marked", async () => {
    await mount(<Harness />);
    const c = combo();
    expect(c.getAttribute("aria-expanded")).toBe("false");
    expect(c.textContent).toContain("Medium");
    act(() => c.click());
    expect(c.getAttribute("aria-expanded")).toBe("true");
    expect(c.getAttribute("aria-controls")).toBe(list()!.id);
    const opts = [...list()!.querySelectorAll('[role="option"]')];
    expect(opts).toHaveLength(OPTIONS.length);
    expect(opts[1].getAttribute("aria-selected")).toBe("true");
    expect(activeLabel()).toBe("Medium");
  });

  it("keyboard: Down opens on the current value, arrows/Home/End/PageUp/PageDown move, Enter chooses", async () => {
    await mount(<Harness />);
    act(() => combo().focus());
    key("ArrowDown");
    expect(list()).not.toBeNull();
    expect(activeLabel()).toBe("Medium");
    key("ArrowDown");
    expect(activeLabel()).toBe("Large");
    key("End");
    expect(activeLabel()).toBe("Plum"); // the last option is disabled: skipped
    key("Home");
    expect(activeLabel()).toBe("Small");
    key("PageDown");
    expect(activeLabel()).toBe("Plum");
    key("PageUp");
    expect(activeLabel()).toBe("Small");
    key("ArrowDown");
    key("ArrowDown");
    key("Enter");
    expect(onChange).toHaveBeenCalledWith("large");
    expect(list()).toBeNull();
    expect(document.activeElement).toBe(combo()); // focus stays on the trigger
    expect(combo().textContent).toContain("Large");
  });

  it("closed: Up and Home open on the first option, End on the last, Space and Enter open", async () => {
    await mount(<Harness />);
    act(() => combo().focus());
    key("ArrowUp");
    expect(activeLabel()).toBe("Small");
    key("Escape");
    key("End");
    expect(activeLabel()).toBe("Plum");
    key("Escape");
    key(" ");
    expect(list()).not.toBeNull();
  });

  it("type-ahead: a typed string jumps to the match; a repeated letter cycles", async () => {
    await mount(<Harness />);
    act(() => combo().focus());
    key("e");
    expect(list()).not.toBeNull(); // typing opens the list
    expect(activeLabel()).toBe("Extra large");
    await new Promise((r) => setTimeout(r, 600));
    key("p");
    expect(activeLabel()).toBe("Pear");
    key("p");
    expect(activeLabel()).toBe("Plum"); // "pp" cycles among P…, skipping the disabled Peach
    await new Promise((r) => setTimeout(r, 600));
    key("p");
    key("l");
    expect(activeLabel()).toBe("Plum");
  });

  it("Escape closes without changing the value and keeps focus on the trigger", async () => {
    await mount(<Harness />);
    act(() => combo().focus());
    key("ArrowDown");
    key("ArrowDown");
    key("Escape");
    expect(list()).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(combo());
    expect(combo().getAttribute("aria-expanded")).toBe("false");
  });

  it("Tab chooses the highlighted option and closes (focus moves on as normal)", async () => {
    await mount(<Harness />);
    act(() => combo().focus());
    key("ArrowDown");
    key("ArrowDown");
    key("Tab");
    expect(onChange).toHaveBeenCalledWith("large");
    expect(list()).toBeNull();
  });

  it("a click on an option chooses it; a click outside closes", async () => {
    await mount(<Harness />);
    act(() => combo().click());
    act(() => (list()!.querySelectorAll('[role="option"]')[3] as HTMLElement).click());
    expect(onChange).toHaveBeenLastCalledWith("xl");
    act(() => combo().click());
    expect(list()).not.toBeNull();
    // jsdom has no PointerEvent; the listener only needs the event type.
    act(() => {
      document.getElementById("after")!.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
    });
    expect(list()).toBeNull();
  });

  it("the popup lives on <body> above the sticky header (z-30) and save bar (z-20), never inside a clipping parent", async () => {
    await mount(
      <div style={{ overflow: "hidden", height: 40 }} className="sticky z-20">
        <Harness />
      </div>,
    );
    act(() => combo().click());
    expect(list()!.parentElement).toBe(document.body);
    expect(list()!.className).toContain("z-[1000]");
    expect(list()!.style.position).toBe("fixed");
  });

  it("flips above the trigger when there's no room below", async () => {
    await mount(<Harness />);
    Object.defineProperty(window, "innerHeight", { value: 800, configurable: true });
    // jsdom does no layout: give the list a real content height.
    const tall = vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(300);
    combo().getBoundingClientRect = () =>
      ({ top: 720, bottom: 768, left: 100, right: 400, width: 300, height: 48, x: 100, y: 720 }) as DOMRect;
    act(() => combo().click());
    expect(list()!.dataset.up).toBe("true");
    expect(list()!.style.bottom).toBe(`${800 - 720 + 6}px`);
    expect(list()!.style.minWidth).toBe("300px");
    tall.mockRestore();
  });

  it("posts its value through a hidden input (FormData), like a native select", async () => {
    await mount(<Harness name="size" />);
    const form = document.getElementById("f") as HTMLFormElement;
    expect(new FormData(form).get("size")).toBe("medium");
    act(() => combo().click());
    act(() => (list()!.querySelectorAll('[role="option"]')[0] as HTMLElement).click());
    expect(new FormData(form).get("size")).toBe("small");
  });

  it("touch (coarse pointer): a native select in the same box, same value and onChange", async () => {
    window.matchMedia = ((q: string) => ({
      matches: q === "(pointer: coarse)",
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as never;
    await mount(<Harness name="size" />);
    const native = document.querySelector("select")!;
    expect(native).not.toBeNull();
    expect(combo()).toBeNull();
    expect(native.className).toContain("rm-field");
    act(() => {
      native.value = "xl";
      native.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("xl");
    expect(new FormData(document.getElementById("f") as HTMLFormElement).get("size")).toBe("xl");
  });

  it("disabled: can't open; invalid is announced", async () => {
    await mount(<Select value="small" options={OPTIONS} onChange={onChange} disabled invalid aria-label="Size" />);
    expect(combo().disabled).toBe(true);
    expect(combo().getAttribute("aria-invalid")).toBe("true");
  });
});

describe("Select helpers", () => {
  it("placePopup: under the trigger when there's room; capped at min(320px, 50% of the height)", () => {
    const p = placePopup({ top: 100, bottom: 148, left: 20, width: 260 }, { width: 1366, height: 657 }, 900);
    expect(p).toMatchObject({ up: false, top: 154, left: 20, minWidth: 260, maxHeight: 320 });
    const short = placePopup({ top: 100, bottom: 148, left: 20, width: 260 }, { width: 1366, height: 500 }, 900);
    expect(short.maxHeight).toBe(250);
  });

  it("placePopup: stays inside the screen sideways", () => {
    const p = placePopup({ top: 100, bottom: 148, left: 300, width: 200 }, { width: 390, height: 844 }, 200);
    expect(p.left + p.minWidth).toBeLessThanOrEqual(390 - 8);
  });

  it("moveActive and typeAhead skip disabled options", () => {
    expect(moveActive(OPTIONS, 5, "ArrowDown")).toBe(5);
    expect(moveActive(OPTIONS, 0, "ArrowUp")).toBe(0);
    expect(moveActive(OPTIONS, 0, "x")).toBeNull();
    expect(typeAhead(OPTIONS, 4, "pe")).toBe(4);
    expect(typeAhead(OPTIONS, 5, "p")).toBe(4); // wraps round, Peach is disabled
  });
});
