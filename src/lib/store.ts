"use client";

import { useSyncExternalStore } from "react";
import { PALETTE } from "./palette";

export type State = {
  color: string;
  colorName: string;
  sound: boolean;
  entered: boolean;
  chaos: boolean;
};

const initial: State = {
  color: PALETTE[0].hex,
  colorName: PALETTE[0].name,
  sound: false,
  entered: false,
  chaos: false,
};

let state: State = initial;
const listeners = new Set<() => void>();

export const store = {
  get: () => state,
  set(patch: Partial<State>) {
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    store.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}
