let state = {
  status: "ok",
  message: "",
  at: Date.now(),
};

const listeners = new Set();

export const getNetworkStatus = () => state;

export const setNetworkStatus = (next = {}) => {
  state = {
    ...state,
    ...next,
    at: Date.now(),
  };
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch {
      // no-op
    }
  });
};

export const subscribeNetworkStatus = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
