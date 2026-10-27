// Feedback visual únicamente: no modifica valores ni emite eventos de formulario.
function createFillFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      #root input.rlur-filled { font-weight: 700; }
    `;
    document.head.append(style);
    const marked = new Set(), timers = new WeakMap(), animations = new WeakMap();
    function remove(input) {
        if (!marked.has(input)) return;
        clearTimeout(timers.get(input)); timers.delete(input);
        animations.get(input)?.cancel(); animations.delete(input);
        input.classList.remove('rlur-filled', 'rlur-fill-flash'); marked.delete(input);
    }
    function clear() { for (const input of marked) remove(input); }
    function highlight(inputs) {
        for (const input of marked) if (!input.isConnected) remove(input);
        for (const input of inputs) remove(input);
        // Reiniciar el verde sin leer geometría ni forzar el diseño de la tabla.
        // La última clave usa el estilo del tema como valor subyacente.
        const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches, duration = reduced ? 1000 : 2000;
        const green = { backgroundColor: '#d1fae5', color: '#065f46' };
        const frames = reduced ? [green, green] : [{ ...green, offset: 0 }, { ...green, offset: .5, easing: 'ease-out' }, { offset: 1 }];
        for (const input of inputs) {
            input.classList.add('rlur-filled', 'rlur-fill-flash'); marked.add(input);
            const animation = input.animate(frames, { duration }); animations.set(input, animation);
            timers.set(input, setTimeout(() => {
                animation.cancel(); animations.delete(input);
                input.classList.remove('rlur-fill-flash'); timers.delete(input);
            }, duration));
        }
    }
    document.addEventListener('input', event => {
        if (!event.target.matches?.('#root table input')) return;
        for (const input of event.target.closest('tr')?.querySelectorAll('input') || []) remove(input);
    }, true);
    return { highlight, clear };
}
