// src/hooks/useHistory.js
import { useCallback, useState } from "react";

export default function useHistory(initial, { maxDepth = 100 } = {}) {
  const [past, setPast] = useState([]);
  const [present, setPresent] = useState(initial);
  const [future, setFuture] = useState([]);

  const set = useCallback((next) => {
    setPast((p) => {
      const newPast = [...p, present];
      return newPast.length > maxDepth ? newPast.slice(newPast.length - maxDepth) : newPast;
    });
    setPresent((cur) => (typeof next === "function" ? next(cur) : next));
    setFuture([]);
  }, [present, maxDepth]);

  const replace = useCallback((next) => {
    setPresent((cur) => (typeof next === "function" ? next(cur) : next));
  }, []);

  const reset = useCallback((val) => {
    setPast([]);
    setPresent(val);
    setFuture([]);
  }, []);

  const undo = useCallback(() => {
    setPast((p) => {
      if (!p.length) return p;
      const prev = p[p.length - 1];
      setFuture((f) => [present, ...f]);
      setPresent(prev);
      return p.slice(0, -1);
    });
  }, [present]);

  const redo = useCallback(() => {
    setFuture((f) => {
      if (!f.length) return f;
      const [next, ...rest] = f;
      setPast((p) => [...p, present]);
      setPresent(next);
      return rest;
    });
  }, [present]);

  return {
    value: present,
    set,
    replace,
    reset,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
  };
}
