// src/utils/resizeObserverErrorGuard.js
// Prevent benign ResizeObserver warnings from triggering CRA's runtime overlay
if (typeof window !== "undefined") {
  const suppressedListeners = new Set();
  const blockedListenerNames = new Set(["handleError", "handleUnhandledRejection"]);
  const originalAddEventListener = window.addEventListener.bind(window);

  window.addEventListener = function patchedAddEventListener(type, listener, options) {
    const name = listener && listener.name;
    if (
      (type === "error" || type === "unhandledrejection") &&
      typeof listener === "function" &&
      blockedListenerNames.has(name)
    ) {
      suppressedListeners.add({ type, listener });
      return;
    }
    return originalAddEventListener(type, listener, options);
  };

  const shouldSuppressMessage = (message) =>
    typeof message === "string" &&
    (message.includes("ResizeObserver loop completed") ||
      message.includes("ResizeObserver loop limit exceeded"));

  const normalizeArg = (arg) => {
    if (!arg) return undefined;
    if (typeof arg === "string") return arg;
    if (arg instanceof Error && typeof arg.message === "string") return arg.message;
    if (typeof arg.message === "string") return arg.message;
    return undefined;
  };

  const suppressIfNeeded = (message) => shouldSuppressMessage(message);

  const handleEvent = (event) => {
    if (!event) return;
    const reason = event.reason;
    const message = event.message || normalizeArg(reason);

    if (suppressIfNeeded(message)) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      return false;
    }
    return undefined;
  };

  originalAddEventListener("error", handleEvent, true);
  originalAddEventListener("unhandledrejection", handleEvent, true);

  const originalOnError = window.onerror;
  window.onerror = function (...args) {
    const message = normalizeArg(args[0]) || normalizeArg(args[4]);
    if (suppressIfNeeded(message)) {
      return true;
    }
    if (typeof originalOnError === "function") {
      return originalOnError.apply(this, args);
    }
    return false;
  };

  const originalOnUnhandledRejection = window.onunhandledrejection;
  window.onunhandledrejection = function (event) {
    const message = normalizeArg(event?.reason);
    if (suppressIfNeeded(message)) {
      event?.preventDefault?.();
      return true;
    }
    if (typeof originalOnUnhandledRejection === "function") {
      return originalOnUnhandledRejection.call(this, event);
    }
    return false;
  };

  const originalConsoleError = window.console?.error?.bind(window.console) ?? (() => {});
  window.console.error = (...args) => {
    if (args.some((arg) => suppressIfNeeded(normalizeArg(arg)))) {
      return;
    }
    originalConsoleError(...args);
  };

  const cleanupSuppressed = () => {
    suppressedListeners.forEach(({ type, listener }) => {
      window.removeEventListener?.(type, listener);
    });
    suppressedListeners.clear();
  };

  originalAddEventListener("load", cleanupSuppressed);
  setTimeout(cleanupSuppressed, 0);
}
