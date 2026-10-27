// Mantiene la fila consultada fuera de la zona cubierta por la barra fija.
function createRowVisibility(bar) {
    const gap = 8, managed = new Map();
    let enabled = false, row = null, frame = null;

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
        // Una primera pasada mueve el contenedor exterior; la segunda corrige
        // los límites interiores ya visibles. Se conserva el scroll horizontal.
        for (let pass = 0; pass < 2; pass++) for (const port of ports) {
            const box = port.getBoundingClientRect();
            const portTop = port === root ? top : Math.max(top, box.top + port.clientTop + gap);
            const portBottom = port === root ? bottom : Math.min(bottom, box.top + port.clientTop + port.clientHeight - gap);
            const safeTop = portTop + (port === ports[0] ? stickyHeight : 0);
            if (portBottom <= safeTop) continue;
            const target = row.getBoundingClientRect();
            const delta = target.top < safeTop ? target.top - safeTop : target.bottom > portBottom ? target.bottom - portBottom : 0;
            if (Math.abs(delta) > .5) port.scrollTo({ top: port.scrollTop + delta, left: port.scrollLeft, behavior: 'instant' });
        }
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
    return { reveal(target) { row = target; schedule(); }, setEnabled, clear };
}
