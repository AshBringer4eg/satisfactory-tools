import "@testing-library/jest-dom";

Object.defineProperty(globalThis, "__APP_VERSION__", {
  value: "test",
  configurable: true,
});

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

if (!("IntersectionObserver" in globalThis)) {
  class IntersectionObserverMock implements IntersectionObserver {
    readonly root = null;
    readonly rootMargin = "";
    readonly thresholds: readonly number[] = [];

    disconnect() {}
    observe(_target: Element) {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
    unobserve(_target: Element) {}
  }

  Object.defineProperty(globalThis, "IntersectionObserver", {
    configurable: true,
    value: IntersectionObserverMock,
  });
}

if (!("ResizeObserver" in globalThis)) {
  class ResizeObserverMock implements ResizeObserver {
    disconnect() {}
    observe(_target: Element) {}
    unobserve(_target: Element) {}
  }

  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: ResizeObserverMock,
  });
}
