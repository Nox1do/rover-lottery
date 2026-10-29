export function createVisuals(central) {
  const timers = new Map(),
    tracked = new Set(),
    greens = new Map(),
    owners = new WeakMap();
  let scope = null;
  const key = (code, name) => JSON.stringify([code, name]);
  function remove(input) {
    clearTimeout(timers.get(input));
    timers.delete(input);
    tracked.delete(input);
    owners.delete(input);
    input.removeAttribute("data-mango-react-visual");
  }
  function dropGreen(id, receipt) {
    clearTimeout(receipt.timer);
    greens.delete(id);
    if (receipt.node && owners.get(receipt.node) === receipt)
      remove(receipt.node);
  }
  function mountGreen(id, receipt, row) {
    const input = row?.inputs[receipt.name];
    if (receipt.node !== input) {
      if (receipt.node && owners.get(receipt.node) === receipt)
        remove(receipt.node);
      receipt.node = null;
    }
    if (Date.now() >= receipt.until) {
      dropGreen(id, receipt);
      return;
    }
    if (!row || !input || input.isConnected === false) return;
    if (
      row.processed !== false ||
      central.isDirty?.(receipt.code) ||
      input.value !== receipt.value
    ) {
      dropGreen(id, receipt);
      return;
    }
    receipt.node = input;
    owners.set(input, receipt);
    tracked.add(input);
    if (input.dataset.mangoReactVisual !== "green")
      input.setAttribute("data-mango-react-visual", "green");
  }
  function clear(code, state) {
    if (!state || state === "green")
      for (const [id, receipt] of greens)
        if (receipt.code === code) dropGreen(id, receipt);
    const row = central.find(code);
    if (!row) return;
    for (const input of Object.values(row.inputs))
      if (!state || input.dataset.mangoReactVisual === state) remove(input);
  }
  function paint(code, names, state, duration = 0) {
    const row = central.find(code);
    if (!row) return;
    for (const name of names) {
      const input = row.inputs[name];
      if (!input) continue;
      if (state === "blue" && input.dataset.mangoReactVisual === "green")
        continue;
      if (state === "green") {
        const id = key(code, name),
          old = greens.get(id);
        if (old) dropGreen(id, old);
        const receipt = {
          code,
          name,
          value: input.value,
          until: duration ? Date.now() + duration : Infinity,
          node: null,
          timer: null,
        };
        greens.set(id, receipt);
        if (duration)
          receipt.timer = setTimeout(() => {
            if (greens.get(id) === receipt) dropGreen(id, receipt);
          }, duration);
        mountGreen(id, receipt, row);
      } else {
        clearTimeout(timers.get(input));
        tracked.add(input);
        input.setAttribute("data-mango-react-visual", state);
        if (duration)
          timers.set(
            input,
            setTimeout(() => remove(input), duration),
          );
      }
    }
  }
  // A replacement input may inherit the remaining green time, never a new deadline.
  // Only unchanged pending values in this still-verified visual context qualify.
  function syncBlue(plans) {
    for (const input of tracked) if (input.isConnected === false) remove(input);
    for (const [id, receipt] of greens)
      mountGreen(id, receipt, central.find(receipt.code));
    const waiting = new Set();
    for (const { code, names } of plans) {
      const row = central.find(code);
      if (!row) continue;
      for (const name of names)
        if (row.inputs[name]) waiting.add(row.inputs[name]);
    }
    for (const input of tracked)
      if (input.dataset.mangoReactVisual === "blue" && !waiting.has(input))
        remove(input);
    for (const input of waiting) {
      if (["blue", "green"].includes(input.dataset.mangoReactVisual)) continue;
      tracked.add(input);
      input.setAttribute("data-mango-react-visual", "blue");
    }
  }
  function clearAll() {
    for (const [id, receipt] of greens) dropGreen(id, receipt);
    for (const input of tracked) remove(input);
  }
  function setContext(context) {
    const next = context
      ? JSON.stringify([
          context.epoch,
          context.date,
          context.server,
          context.serverId ?? "",
        ])
      : null;
    if (next !== scope) {
      clearAll();
      scope = next;
    }
  }
  return { paint, clear, clearAll, syncBlue, setContext };
}
export function installStyle(doc) {
  if (doc.getElementById("mango-react-style")) return;
  const style = doc.createElement("style");
  style.id = "mango-react-style";
  style.textContent =
    'input[data-mango-react-visual="blue"]{background-color:#dbeafe!important;border-color:#3b82f6!important;color:#172554!important}input[data-mango-react-visual="green"]{background-color:#d4edda!important;border-color:#28a745!important;color:#14532d!important}';
  (doc.head || doc.documentElement).append(style);
}
