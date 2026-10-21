"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { APPLY_VIEW_EVENT, type Codec } from "@/lib/urlState";

/**
 * useState that mirrors itself into the URL (as ?key=value) so a filtered page can be bookmarked or shared.
 * It starts from the URL, never triggers a server round-trip (history.replaceState), and listens for saved views
 * being applied. `codec` must be a stable reference (module-level constant).
 */
export function useUrlState<T>(key: string, codec: Codec<T>): [T, (next: T | ((previous: T) => T)) => void] {
  const searchParams = useSearchParams();
  const [value, setValueState] = useState<T>(() => codec.parse(searchParams.get(key)));
  const skip = useRef(true);

  useEffect(() => {
    if (skip.current) { skip.current = false; return; }
    const timer = setTimeout(() => {
      const url = new URL(window.location.href);
      const serialized = codec.serialize(value);
      if (serialized === null) url.searchParams.delete(key);
      else url.searchParams.set(key, serialized);
      window.history.replaceState(window.history.state, "", url);
    }, 200);
    return () => clearTimeout(timer);
  }, [value, key, codec]);

  useEffect(() => {
    const onApply = (event: Event) => {
      const params = new URLSearchParams((event as CustomEvent<string>).detail);
      setValueState(codec.parse(params.get(key)));
    };
    window.addEventListener(APPLY_VIEW_EVENT, onApply);
    return () => window.removeEventListener(APPLY_VIEW_EVENT, onApply);
  }, [key, codec]);

  const setValue = useCallback((next: T | ((previous: T) => T)) => setValueState(next), []);
  return [value, setValue];
}
