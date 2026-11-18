// Tiny toast bus: any module can call toast(); the <Toasts> component renders them.
const listeners = new Set();
let nextId = 0;

export function toast(message, icon = 'check') {
  const t = { id: ++nextId, message, icon };
  listeners.forEach((cb) => cb(t));
}

export function onToast(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
