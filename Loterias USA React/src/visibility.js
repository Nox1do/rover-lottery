// Mantiene la fila consultada fuera de la zona cubierta por la barra fija.
function createRowVisibility(bar) {
    const gap = 8, managed = new Map();
    let enabled = false, row = null, frame = null, viewportTop = window.visualViewport?.offsetTop || 0;

    function scrollPorts() {
        const ports = [], root = document.scrollingElement;
        for (let node = row?.parentElement; node && node !== document.body && node !== root; node = node.parentElement) {
            if (/(auto|scroll|overlay)/.test(getComputedStyle(node).overflowY)) ports.push(node);
        }
        if (root) ports.push(root);
        return ports;
    }

    function restore(port, saved) {
        for (const [name, value] of Object.entries(saved.properties)) {
            // No deshacer una modificación posterior hecha por la página.
            if (port.style.getPropertyValue(name) !== value.applied) continue;
            if (value.original) port.style.setProperty(name, value.original, value.priority);
            else port.style.removeProperty(name);
        }
        managed.delete(port);
    }

    function reserve(ports, height) {
        for (const [port, saved] of managed) if (!ports.includes(port)) restore(port, saved);
        for (const port of ports) {
            if (!managed.has(port)) {
                const css = getComputedStyle(port), properties = {};
                for (const name of ['padding-bottom', 'scroll-padding-bottom']) {
                    const base = css.getPropertyValue(name);
                    properties[name] = { original: port.style.getPropertyValue(name), priority: port.style.getPropertyPriority(name),
                        base: base === 'auto' ? '0px' : base, applied: '' };
                }
                managed.set(port, { properties });
            }
            for (const [name, value] of Object.entries(managed.get(port).properties)) {
                const next = `calc(${value.base} + ${height}px)`;
                if (value.applied === next) continue;
                port.style.setProperty(name, next, 'important'); value.applied = port.style.getPropertyValue(name);
            }
        }
    }

    function update() {
        if (!enabled || !row?.isConnected || !row.getClientRects().length) {
            for (const [port, saved] of managed) restore(port, saved);
            return;
        }
        const viewport = window.visualViewport;
        // offsetHeight no incluye la animación de apertura de la barra.
        const bottom = window.innerHeight - (parseFloat(bar.style.bottom) || 0) - bar.offsetHeight - gap;
        const top = (viewport?.offsetTop || 0) + gap;
        const ports = scrollPorts(), root = document.scrollingElement;
        reserve(ports, window.innerHeight - bottom);
        const header = row.closest('table')?.tHead;
        const stickyHeight = header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0;
        const target = row.getBoundingClientRect();
        // Medir todo antes de desplazar: cada scroll puede invalidar el diseño
        // de cientos de filas. Los contenedores exteriores no se mueven al
        // desplazar sus hijos; basta ajustar virtualmente la posición de la fila.
        const measurements = ports.map(port => {
            const box = port.getBoundingClientRect();
            return { port, start: box.top + port.clientTop, height: port.clientHeight,
                y: port.scrollTop, x: port.scrollLeft, max: Math.max(0, port.scrollHeight - port.clientHeight) };
        });
        let rowTop = target.top, rowBottom = target.bottom;
        const moves = [];
        for (const { port, start, height, y, x, max } of measurements) {
            let safeTop = port === root ? top : Math.max(top, start + gap);
            let safeBottom = port === root ? bottom : Math.min(bottom, start + height - gap);
            const head = port === ports[0] ? stickyHeight : 0;
            if (safeBottom <= safeTop + head && port !== root) {
                // Preparar también una tabla cuyo contenedor está fuera de la
                // pantalla; después el scroll exterior la coloca en su sitio.
                safeTop = start + gap; safeBottom = start + height - gap;
            }
            safeTop += head;
            if (safeBottom <= safeTop) continue;
            const delta = rowTop < safeTop ? rowTop - safeTop : rowBottom > safeBottom ? rowBottom - safeBottom : 0;
            const next = Math.max(0, Math.min(max, y + delta)), shift = next - y;
            if (Math.abs(shift) <= .5) continue;
            moves.push({ port, top: next, left: x }); rowTop -= shift; rowBottom -= shift;
        }
        for (const { port, ...position } of moves) port.scrollTo({ ...position, behavior: 'instant' });
    }

    function schedule() {
        if (frame !== null) return;
        frame = requestAnimationFrame(() => { frame = null; update(); });
    }
    function clear() {
        if (frame !== null) cancelAnimationFrame(frame);
        frame = null; row = null;
        for (const [port, saved] of managed) restore(port, saved);
    }
    function setEnabled(value) {
        enabled = value;
        if (enabled) schedule();
        else {
            if (frame !== null) cancelAnimationFrame(frame);
            frame = null;
            for (const [port, saved] of managed) restore(port, saved);
        }
    }
    new ResizeObserver(schedule).observe(bar);
    // Cambiar el alto de la ventana mueve la barra aunque su propio tamaño no
    // cambie; ResizeObserver no avisa de ese movimiento (p. ej. teclado móvil).
    window.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    window.visualViewport?.addEventListener('scroll', () => {
        const top = window.visualViewport.offsetTop;
        // No seguir el scroll manual normal de la página, solo el movimiento
        // del viewport visual respecto al de diseño (zoom/teclado).
        if (top === viewportTop) return;
        viewportTop = top; schedule();
    });
    return { reveal(target) { row = target; schedule(); }, setEnabled, clear };
}
