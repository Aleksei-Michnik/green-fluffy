import '@testing-library/jest-dom';

// jsdom 29 does not expose the Web Storage API under Node 26, leaving
// `localStorage` / `sessionStorage` undefined (they work under Node 22).
// Provide a minimal in-memory shim so storage-backed component tests behave
// consistently across Node versions. Remove once jsdom ships Node 26-compatible
// Web Storage (tracked for the eventual happy-dom/jsdom upgrade).
class MemoryStorage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

for (const prop of ['localStorage', 'sessionStorage'] as const) {
  if (typeof (globalThis as Record<string, unknown>)[prop] === 'undefined') {
    Object.defineProperty(globalThis, prop, {
      value: new MemoryStorage() as unknown as Storage,
      writable: true,
      configurable: true,
    });
  }
}

// jsdom 29 ships <dialog> without showModal()/show()/close() (checked
// 2026-09-25). The kit's Dialog relies on them; mirror the open attribute
// and the `close` event so behaviour can be asserted.
if (typeof HTMLDialogElement !== 'undefined') {
  const proto = HTMLDialogElement.prototype;
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.show = function show(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
    proto.close = function close(this: HTMLDialogElement, returnValue?: string) {
      if (returnValue !== undefined) this.returnValue = returnValue;
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  }
}
