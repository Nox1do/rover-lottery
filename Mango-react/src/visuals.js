export function createVisuals(central) {
  const timers = new Map(),
    tracked = new Set();
  function remove(input) {
    clearTimeout(timers.get(input));
    timers.delete(input);
    tracked.delete(input);
    input.removeAttribute("data-mango-react-visual");
  }
  function clear(code, state) {
    const row = central.find(code);
    if (!row) return;
    for (const input of Object.values(row.inputs)) {
      if (!state || input.dataset.mangoReactVisual === state) {
        remove(input);
      }
    }
  }
  function paint(code, names, state, duration = 0) {
    const row = central.find(code);
    if (!row) return;
    for (const name of names) {
      const input = row.inputs[name];
      if (!input) continue;
      if (state === "blue" && input.dataset.mangoReactVisual === "green")
        continue;
      clearTimeout(timers.get(input));
      tracked.add(input);
      input.setAttribute("data-mango-react-visual", state);
      if (duration)
        timers.set(
          input,
          setTimeout(() => {
            input.removeAttribute("data-mango-react-visual");
            tracked.delete(input);
            timers.delete(input);
          }, duration),
        );
    }
  }
  // Filtering may replace inputs. Restore only authorized waiting indicators;
  // green is tied to the original fill and must keep its existing deadline.
  function syncBlue(plans) {
    const waiting = new Set();
    for (const { code, names } of plans) {
      const row = central.find(code);
      if (!row) continue;
      for (const name of names)
        if (row.inputs[name]) waiting.add(row.inputs[name]);
    }
    for (const input of tracked)
      if (
        input.isConnected === false ||
        (input.dataset.mangoReactVisual === "blue" && !waiting.has(input))
      )
        remove(input);
    for (const input of waiting) {
      if (["blue", "green"].includes(input.dataset.mangoReactVisual)) continue;
      tracked.add(input);
      input.setAttribute("data-mango-react-visual", "blue");
    }
  }
  function clearAll() {
    for (const input of tracked) remove(input);
  }
  return { paint, clear, clearAll, syncBlue };
}
export function installStyle(doc) {
  if (doc.getElementById("mango-react-style")) return;
  const style = doc.createElement("style");
  style.id = "mango-react-style";
  style.textContent =
    'input[data-mango-react-visual="blue"]{background-color:#dbeafe!important;border-color:#3b82f6!important;color:#172554!important}input[data-mango-react-visual="green"]{background-color:#d4edda!important;border-color:#28a745!important;color:#14532d!important}';
  (doc.head || doc.documentElement).append(style);
}
