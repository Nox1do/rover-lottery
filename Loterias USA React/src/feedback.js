// Feedback visual únicamente: no modifica valores ni emite eventos de formulario.
function createFillFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      #root input.rlur-filled { font-weight: 700; transition-property: box-shadow !important; }
      #root input.rlur-fill-flash { background-color: #d1fae5 !important; color: #065f46 !important; transition: none !important; }
    `;
    document.head.append(style);
    const marked = new Set(), timers = new WeakMap();
    function remove(input) {
        if (!marked.has(input)) return;
        clearTimeout(timers.get(input)); timers.delete(input);
        input.classList.remove('rlur-filled', 'rlur-fill-flash'); marked.delete(input);
    }
    function clear() { for (const input of marked) remove(input); }
    function highlight(inputs) {
        for (const input of marked) if (!input.isConnected) remove(input);
        for (const input of inputs) remove(input);
        // Verde fijo: aplicar y retirar una vez, sin repintar colores por frame.
        // No se leen medidas ni se sobrescriben estilos del tema.
        for (const input of inputs) {
            input.classList.add('rlur-filled', 'rlur-fill-flash'); marked.add(input);
            timers.set(input, setTimeout(() => {
                input.classList.remove('rlur-fill-flash'); timers.delete(input);
            }, 1000));
        }
    }
    document.addEventListener('input', event => {
        if (!event.target.matches?.('#root table input')) return;
        for (const input of event.target.closest('tr')?.querySelectorAll('input') || []) remove(input);
    }, true);
    return { highlight, clear };
}
