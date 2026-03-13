import { useMemo, useSyncExternalStore } from "react";

function createMediaQueryStore(query) {
  if (typeof window === "undefined" || !window.matchMedia) {
    return {
      subscribe: () => () => {},
      getSnapshot: () => false,
    };
  }

  const mediaQueryList = window.matchMedia(query);
  return {
    subscribe: (notify) => {
      const listener = () => notify();
      if (mediaQueryList.addEventListener) {
        mediaQueryList.addEventListener("change", listener);
      } else {
        mediaQueryList.addListener(listener);
      }
      return () => {
        if (mediaQueryList.removeEventListener) {
          mediaQueryList.removeEventListener("change", listener);
        } else {
          mediaQueryList.removeListener(listener);
        }
      };
    },
    getSnapshot: () => mediaQueryList.matches,
  };
}

export default function useMediaQuery(query) {
  const store = useMemo(() => createMediaQueryStore(query), [query]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, () => false);
}
