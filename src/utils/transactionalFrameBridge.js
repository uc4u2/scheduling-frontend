export const TRANSACTIONAL_MEASURE_MESSAGE = "schedulaa:transactional-measure";
export const TRANSACTIONAL_READY_MESSAGE = "schedulaa:transactional-ready";
export const TRANSACTIONAL_RESIZE_MESSAGE = "schedulaa:transactional-resize";

export function measureTransactionalContent(node) {
  if (!node) return 0;
  return Math.ceil(Math.max(Number(node.scrollHeight) || 0, Number(node.getBoundingClientRect?.().height) || 0));
}

export function publishTransactionalMeasurement(targetWindow, node) {
  const height = measureTransactionalContent(node);
  if (!targetWindow?.postMessage || !height) return 0;
  targetWindow.postMessage({ type: TRANSACTIONAL_READY_MESSAGE }, "*");
  targetWindow.postMessage({ type: TRANSACTIONAL_RESIZE_MESSAGE, height: height + 2 }, "*");
  return height + 2;
}
