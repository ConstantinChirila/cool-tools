/**
 * A persisted client preference as a `useSyncExternalStore` source: one
 * localStorage key, read lazily on first use, written through on `set`, and
 * kept in step with other tabs via the `storage` event. Every storage access
 * is guarded, because private windows and embedded frames can throw.
 */
export interface StorageStore<T> {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  set: (next: T) => void;
}

export function createStorageStore<T>({
  key,
  fallback,
  parse,
  serialize,
}: {
  key: string;
  /** Used on the server, when storage is unreadable, and when the key is empty. */
  fallback: T;
  parse: (raw: string) => T;
  serialize: (value: T) => string;
}): StorageStore<T> {
  let current: T | null = null;
  const listeners = new Set<() => void>();

  function read(): T {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : parse(raw);
    } catch {
      return fallback;
    }
  }

  function emit() {
    listeners.forEach((l) => l());
  }

  return {
    getSnapshot() {
      if (current === null) current = read();
      return current;
    },
    getServerSnapshot: () => fallback,
    subscribe(listener) {
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          current = read();
          emit();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    set(next) {
      current = next;
      try {
        localStorage.setItem(key, serialize(next));
      } catch {
        // Storage blocked or full: the value still applies for this page load.
      }
      emit();
    },
  };
}
