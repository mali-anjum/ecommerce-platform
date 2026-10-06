import { reducer } from "../use-toast";

type State = Parameters<typeof reducer>[0];
const toast = (id: string, open = true) => ({ id, title: id, open }) as State["toasts"][number];

describe("toast reducer", () => {
  it("adds newest first and enforces the 1-toast limit", () => {
    const state = reducer({ toasts: [toast("a")] }, { type: "ADD_TOAST", toast: toast("b") });
    expect(state.toasts.map((t) => t.id)).toEqual(["b"]);
  });

  it("updates only the matching toast", () => {
    const state = reducer({ toasts: [toast("a")] }, { type: "UPDATE_TOAST", toast: { id: "a", title: "changed" } });
    expect(state.toasts[0]).toMatchObject({ id: "a", title: "changed", open: true });
    expect(reducer(state, { type: "UPDATE_TOAST", toast: { id: "zzz", title: "x" } })).toEqual(state);
  });

  it("dismisses one or all toasts by closing them", () => {
    jest.useFakeTimers();
    const one = reducer({ toasts: [toast("a")] }, { type: "DISMISS_TOAST", toastId: "a" });
    expect(one.toasts[0].open).toBe(false);
    const all = reducer({ toasts: [toast("b")] }, { type: "DISMISS_TOAST" });
    expect(all.toasts.every((t) => t.open === false)).toBe(true);
    jest.useRealTimers();
  });

  it("removes one or all toasts", () => {
    expect(reducer({ toasts: [toast("a")] }, { type: "REMOVE_TOAST", toastId: "a" }).toasts).toEqual([]);
    expect(reducer({ toasts: [toast("a")] }, { type: "REMOVE_TOAST" }).toasts).toEqual([]);
  });
});
