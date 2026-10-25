// Feedback visual únicamente: no modifica valores ni emite eventos de formulario.
function createFillFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      #root input.rlur-filled { font-weight: 700; }
      #root input.rlur-fill-flash { animation: rlur-filled-flash 2s ease-out; }
      @keyframes rlur-filled-flash {
        0%, 50% { background-color: #d1fae5; color: #065f46; }
      }
      @media (prefers-reduced-motion: reduce) {
        #root input.rlur-fill-flash { animation-duration: 1s; animation-timing-function: steps(1, end); }
      }
    `;
    document.head.append(style);
    const marked = new Set(), timers = new WeakMap();
    function remove(input) {
        clearTimeout(timers.get(input)); timers.delete(input);
        input.classList.remove('rlur-filled', 'rlur-fill-flash'); marked.delete(input);
    }
    function clear() { for (const input of marked) remove(input); }
    function highlight(inputs) {
        for (const input of marked) if (!input.isConnected) remove(input);
        for (const input of inputs) {
            remove(input);
            // Reiniciar el pulso incluso si se vuelve a consultar la misma fila.
            void input.offsetWidth;
            input.classList.add('rlur-filled', 'rlur-fill-flash'); marked.add(input);
            const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1000 : 2000;
            timers.set(input, setTimeout(() => { input.classList.remove('rlur-fill-flash'); timers.delete(input); }, duration));
        }
    }
    document.addEventListener('input', event => {
        if (!event.target.matches?.('#root table input')) return;
        for (const input of event.target.closest('tr')?.querySelectorAll('input') || []) remove(input);
    }, true);
    return { highlight, clear };
}
