// ==UserScript==
// @name         Virtual Lotteries v2 Auto
// @namespace    noeg
// @version      3.1.7
// @description  Virtual Lotteries v3: AUTO configurable por lotería, cinco fuentes, EXTRA manual y verificación segura en Rover.
// @author       noeg
// @homepageURL  https://github.com/Nox1do/rover-lottery
// @source       https://github.com/Nox1do/rover-lottery/blob/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/virtual%20lottery/virtual-lottery%20v2%20auto.user.js
// @match        https://www.roversport.lol/adm/es/lottery.php
// @match        https://www.roversport.net/adm/es/lottery.php
// @match        https://www.lotterypost.com/results/qc/extra/past*
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_xmlhttpRequest
// @connect      www.nationjl.com
// @connect      rapidlottery.app
// @connect      api.lotocentral.net
// @connect      qplay777.net
// @connect      www.thequeenlottery.com
// @run-at       document-idle
// ==/UserScript==

(() => {
    'use strict';

    const SCRIPT_VERSION = '3.1.7';
    console.log(`[Virtual Lotteries] v${SCRIPT_VERSION} cargado · configuración AUTO por lotería`);

    const NATIONJL_URL = 'https://www.nationjl.com/main/live';
    const RAPID_URL = 'https://rapidlottery.app/api/res.php';
    const PREMIER_URL = 'https://api.lotocentral.net/api/v1/homepage/historical_results';
    const QPLAY_URL = 'https://qplay777.net/';
    const QUEEN_URL = 'https://www.thequeenlottery.com/main/live';

    const EXTRA_URL = 'https://www.lotterypost.com/results/qc/extra/past';
    const EXTRA_ESPERA_MS = 120000;
    const cancelacionesExtra = new Set();
    if (location.hostname === 'www.lotterypost.com') {
        atenderExtraEnPestana();
        return;
    }
    let revisionFecha = 0;
    const solicitudes = new WeakMap();
    // Conserva en esta sesión los resultados que el script ya mostró en Rover.
    // Rover reemplaza la tabla al pulsar Search; después de ese reemplazo los
    // resultados se vuelven a aplicar únicamente si la fila sigue vacía o coincide.
    const resultadosVisibles = new Map();

    const LOTERIAS = {
        'EXTRA': { fuente: 'extra', hora: 'Diario' },
        'WIN-10-00PM': { fuente: 'nationjl', hora: '10:00 PM' },
        'WIN-7-30PM':  { fuente: 'nationjl', hora: '07:30 PM' },
        'WIN-5-30PM':  { fuente: 'nationjl', hora: '05:30 PM' },
        'WIN-1-00PM':  { fuente: 'nationjl', hora: '01:00 PM' },
        'WIN-11-00AM': { fuente: 'nationjl', hora: '11:00 AM' },
        'WIN-9-30AM':  { fuente: 'nationjl', hora: '09:30 AM' },
        'RPL-11AM': { fuente: 'rapid', hora: '11:00 AM', hora24: '11:00' },
        'RPL-1PM':  { fuente: 'rapid', hora: '01:00 PM', hora24: '13:00' },
        'RPL-3PM':  { fuente: 'rapid', hora: '03:00 PM', hora24: '15:00' },
        'RPL-5PM':  { fuente: 'rapid', hora: '05:00 PM', hora24: '17:00' },
        'RPL-7PM':  { fuente: 'rapid', hora: '07:00 PM', hora24: '19:00' },
        'RPL-9PM':  { fuente: 'rapid', hora: '09:00 PM', hora24: '21:00' },

        // PremierLotto
        'PREMIER12PM': { fuente: 'premier', hora: '12:00 PM', premierKey: '12PM' },
        'PREMIER03PM': { fuente: 'premier', hora: '03:00 PM', premierKey: '3PM' },
        'PREMIER07PM': { fuente: 'premier', hora: '07:00 PM', premierKey: '7PM' },
        'PREMIER08PM': { fuente: 'premier', hora: '08:00 PM', premierKey: '8PM' },

        // QPlay Brazil
        'BRAZIL12PM': { fuente: 'qplay', hora: '12:00 PM' },
        'BRAZIL03PM': { fuente: 'qplay', hora: '03:00 PM' },
        'BRAZIL07PM': { fuente: 'qplay', hora: '07:00 PM' },
        'BRAZIL08PM': { fuente: 'qplay', hora: '08:00 PM' },

        // The Queen Lottery
        'QLT-MORNING': { fuente: 'queen', hora: 'Morning', queenKey: 'QL MORNING' },
        'QLT-MIDDAY': { fuente: 'queen', hora: 'Midday', queenKey: 'QL MIDDAY' },
        'QLT-AFTN': { fuente: 'queen', hora: 'Afternoon', queenKey: 'QL AFTERNOON' },
        'QLT-EVENING': { fuente: 'queen', hora: 'Evening', queenKey: 'QL EVENING' },
        'QLT-NIGHT': { fuente: 'queen', hora: 'Night', queenKey: 'QL NIGHT' }
    };

    const ICON_SEARCH = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>`;
    const ICON_CHECK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m5 12 4 4L19 6"></path></svg>`;
    const ICON_X = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12"></path><path d="M18 6 6 18"></path></svg>`;
    const ICON_GEAR = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M9.405 1.05c-.413-1.4-2.397-1.4-2.81 0l-.1.34a1.464 1.464 0 0 1-2.105.872l-.31-.17c-1.283-.698-2.686.705-1.987 1.987l.169.311c.446.82.023 1.841-.872 2.105l-.34.1c-1.4.413-1.4 2.397 0 2.81l.34.1a1.464 1.464 0 0 1 .872 2.105l-.17.31c-.698 1.283.705 2.686 1.987 1.987l.311-.169a1.464 1.464 0 0 1 2.105.872l.1.34c.413 1.4 2.397 1.4 2.81 0l.1-.34a1.464 1.464 0 0 1 2.105-.872l.31.17c1.283.698 2.686-.705 1.987-1.987l-.169-.311a1.464 1.464 0 0 1 .872-2.105l.34-.1c1.4-.413 1.4-2.397 0-2.81l-.34-.1a1.464 1.464 0 0 1-.872-2.105l.17-.31c.698-1.283-.705-2.686-1.987-1.987l-.311.169a1.464 1.464 0 0 1-2.105-.872zM8 10.93a2.929 2.929 0 1 1 0-5.86 2.929 2.929 0 0 1 0 5.858z"/></svg>`;
    const style = document.createElement('style');
    style.textContent = `
        .rs-source-fetch-btn {
            position: static;
            margin-left: 6px;
            padding: 2px 5px;
            min-width: 24px;
            height: 20px;
            border: 0;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
            vertical-align: middle;
            background: #2563eb;
            color: white;
            font-size: 10px;
            line-height: 1;
            white-space: nowrap;
            cursor: pointer;
            transition: background-color .15s ease, transform .15s ease;
        }
        .rs-source-fetch-btn:hover { background: #1d4ed8; }
        .rs-source-fetch-btn:active { transform: scale(.95); }
        .rs-source-fetch-btn svg { width: 13px; height: 13px; flex: 0 0 auto; }
        .rs-source-fetch-btn.rs-searching { background: #64748b; cursor: wait; }
        .rs-source-fetch-btn.rs-success { background: #16a34a; }
        .rs-source-fetch-btn.rs-error { background: #dc2626; }
        .rs-auto-date-row {
            display: flex;
            align-items: center;
            gap: 6px;
            width: 100%;
        }
        .rs-auto-date-row #fecha {
            flex: 1 1 auto;
            min-width: 0;
            width: auto !important;
        }
        .rs-auto-settings-btn {
            flex: 0 0 30px;
            width: 30px;
            height: 30px;
            padding: 0;
            border: 0 !important;
            border-radius: 3px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            background: transparent !important;
            box-shadow: none !important;
            color: #6b7280;
            cursor: pointer;
            transition: color .15s ease, transform .15s ease;
        }
        .rs-auto-settings-btn:hover {
            background: transparent !important;
            color: #4b5563;
        }
        .rs-auto-settings-btn:active {
            transform: scale(.94);
        }
        .rs-auto-settings-btn.rs-active {
            background: transparent !important;
            border: 0 !important;
            color: #6b7280;
        }
        .rs-auto-settings-btn.rs-active:hover {
            background: transparent !important;
            color: #4b5563;
        }
        .rs-auto-settings-btn svg {
            width: 21px;
            height: 21px;
            display: block;
            pointer-events: none;
        }
        .rs-auto-modal-open { overflow: hidden !important; }
        .rs-auto-modal-backdrop {
            position: fixed;
            inset: 0;
            z-index: 20000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 18px;
            background: rgba(15, 23, 42, .58);
        }
        .rs-auto-modal-backdrop[hidden] { display: none !important; }
        .rs-auto-modal {
            width: min(760px, 96vw);
            max-height: 88vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            border-radius: 10px;
            background: #fff;
            color: #1e293b;
            box-shadow: 0 24px 70px rgba(0,0,0,.28);
        }
        .rs-auto-modal-header,
        .rs-auto-modal-footer {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 14px 16px;
            border-color: #e2e8f0;
            border-style: solid;
        }
        .rs-auto-modal-header {
            justify-content: space-between;
            border-width: 0 0 1px;
        }
        .rs-auto-modal-footer {
            justify-content: flex-end;
            border-width: 1px 0 0;
        }
        .rs-auto-modal-title {
            margin: 0;
            font-size: 17px;
            font-weight: 700;
        }
        .rs-auto-modal-close {
            width: 32px;
            height: 32px;
            border: 0;
            border-radius: 4px;
            background: transparent;
            color: #64748b;
            font-size: 22px;
            line-height: 1;
            cursor: pointer;
        }
        .rs-auto-modal-close:hover { background: #f1f5f9; color: #0f172a; }
        .rs-auto-modal-body {
            overflow: auto;
            padding: 16px;
        }
        .rs-auto-global-card {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
            padding: 12px 14px;
            margin-bottom: 12px;
            border: 1px solid #dbe4ee;
            border-radius: 8px;
            background: #f8fafc;
        }
        .rs-auto-global-card strong { display: block; font-size: 14px; }
        .rs-auto-global-card small { display: block; margin-top: 2px; color: #64748b; }
        .rs-auto-toggle {
            width: 18px;
            height: 18px;
            accent-color: #15803d;
            cursor: pointer;
        }
        .rs-auto-settings-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 12px;
        }
        .rs-auto-field label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            font-weight: 700;
            color: #475569;
        }
        .rs-auto-field select {
            width: 100%;
            height: 34px;
            padding: 4px 8px;
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #fff;
            color: #1e293b;
            font-size: 13px;
        }
        .rs-auto-note {
            margin: 0 0 14px;
            padding: 9px 11px;
            border-left: 3px solid #d97706;
            border-radius: 4px;
            background: #fff7ed;
            color: #7c2d12;
            font-size: 12px;
            line-height: 1.45;
        }
        .rs-auto-toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 10px;
        }
        .rs-auto-toolbar-title {
            font-size: 13px;
            font-weight: 700;
        }
        .rs-auto-toolbar-actions {
            display: flex;
            gap: 6px;
        }
        .rs-auto-small-btn,
        .rs-auto-footer-btn {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background: #fff;
            color: #334155;
            cursor: pointer;
        }
        .rs-auto-small-btn { padding: 4px 8px; font-size: 11px; }
        .rs-auto-footer-btn { padding: 7px 13px; font-size: 12px; font-weight: 600; }
        .rs-auto-footer-btn.rs-primary {
            border-color: #15803d;
            background: #15803d;
            color: #fff;
        }
        .rs-auto-source-group {
            display: block !important;
            position: static !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            margin: 0 0 8px !important;
            padding: 0 !important;
            overflow: hidden;
            border: 1px solid #dbe4ee;
            border-radius: 8px;
            background: #fff;
            box-sizing: border-box !important;
        }
        .rs-auto-accordion-header {
            display: flex;
            align-items: center;
            gap: 8px;
            min-height: 42px;
            padding: 0 10px;
            background: #f8fafc;
        }
        .rs-auto-accordion-toggle {
            flex: 1 1 auto;
            min-width: 0;
            height: 40px;
            padding: 0;
            border: 0;
            display: flex;
            align-items: center;
            gap: 8px;
            background: transparent;
            color: #334155;
            text-align: left;
            cursor: pointer;
        }
        .rs-auto-source-title {
            overflow: hidden;
            font-size: 12px;
            font-weight: 800;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .rs-auto-source-count {
            flex: 0 0 auto;
            color: #64748b;
            font-size: 10px;
            font-weight: 600;
        }
        .rs-auto-accordion-chevron {
            flex: 0 0 auto;
            margin-left: auto;
            font-size: 15px;
            line-height: 1;
            transition: transform .15s ease;
        }
        .rs-auto-accordion-toggle[aria-expanded="true"] .rs-auto-accordion-chevron {
            transform: rotate(180deg);
        }
        .rs-auto-group-all-label {
            flex: 0 0 auto;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            color: #475569;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            user-select: none;
        }
        .rs-auto-group-all {
            width: 14px;
            height: 14px;
            margin: 0;
            accent-color: #15803d;
            cursor: pointer;
        }
        .rs-auto-accordion-panel {
            padding: 8px 10px 10px;
            border-top: 1px solid #e2e8f0;
        }
        .rs-auto-accordion-panel[hidden] {
            display: none !important;
            height: 0 !important;
            min-height: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            overflow: hidden !important;
        }
        .rs-auto-lottery-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 6px;
        }
        .rs-auto-lottery-item {
            display: flex;
            align-items: center;
            gap: 8px;
            min-width: 0;
            padding: 7px 8px;
            border-radius: 5px;
            background: #f8fafc;
            cursor: pointer;
        }
        .rs-auto-lottery-item:hover { background: #f1f5f9; }
        .rs-auto-lottery-item input {
            flex: 0 0 auto;
            accent-color: #15803d;
        }
        .rs-auto-lottery-text {
            min-width: 0;
            line-height: 1.2;
        }
        .rs-auto-lottery-code {
            display: block;
            overflow: hidden;
            color: #1e293b;
            font-size: 12px;
            font-weight: 700;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        .rs-auto-lottery-time {
            display: block;
            margin-top: 2px;
            color: #64748b;
            font-size: 11px;
        }
        @media (max-width: 640px) {
            .rs-auto-settings-grid,
            .rs-auto-lottery-grid { grid-template-columns: 1fr; }
        }
        input.rs-source-filled {
            background-color: rgba(34, 197, 94, .18) !important;
            box-shadow: inset 0 0 0 1px rgba(34, 197, 94, .28) !important;
            transition: background-color .25s ease, box-shadow .25s ease;
        }
    `;
    document.head.appendChild(style);

    function buscarInputLoteria(codigo) {
        return [...document.querySelectorAll('input[loteria]')].find(input =>
            String(input.getAttribute('loteria') || '').trim() === codigo
        ) || null;
    }

    function esPaginaRoverValida() {
        if (!document.querySelector('#fecha')) return false;
        return Object.keys(LOTERIAS).some(codigo => buscarInputLoteria(codigo));
    }

    function obtenerFechaRover() {
        const input = document.querySelector('#fecha');
        if (!input) return '';
        const fecha = String(input.value || '').trim();
        return /^\d{2}\/\d{2}\/\d{4}$/.test(fecha) ? fecha : '';
    }

    function fechaHoyRD() {
        return new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santo_Domingo',
            month: '2-digit', day: '2-digit', year: 'numeric'
        }).format(new Date());
    }

    function requestText(url, headers = { 'Cache-Control': 'no-cache' }) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers,
                timeout: 15000,
                onload(response) {
                    if (response.status >= 200 && response.status < 300) resolve(response.responseText);
                    else reject(new Error(`HTTP ${response.status} en ${url}`));
                },
                onerror() { reject(new Error(`Error de red consultando ${url}`)); },
                ontimeout() { reject(new Error(`Timeout consultando ${url}`)); }
            });
        });
    }

    function nationValorImagen(img) {
        if (!img) return '';
        const src = img.getAttribute('src') || '';
        const match = src.match(/\/normal\/([^/?#]+)\.png/i);
        return match ? match[1] : '';
    }

    function nationQuiniela(td) {
        return nationValorImagen(td?.querySelector('img'));
    }

    function nationPick(td) {
        if (!td) return '';
        return [...td.querySelectorAll('img')]
            .map(img => {
                const valor = nationValorImagen(img);
                if (!valor) return '';
                const numero = Number.parseInt(valor, 10);
                return Number.isFinite(numero) ? String(numero) : '';
            })
            .filter(v => v !== '')
            .join('');
    }

    function parseNationJL(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tabla = doc.querySelector('.results-pw table');
        if (!tabla) throw new Error('NationJL: no se encontró LAST 7 DAYS RESULTS');

        const resultados = [];
        let fechaActual = '';

        for (const tr of tabla.querySelectorAll('tr')) {
            const fecha = tr.querySelector('th[colspan] span');
            if (fecha) {
                const texto = fecha.textContent.trim();
                if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) fechaActual = texto;
                continue;
            }

            const td = [...tr.querySelectorAll('td')];
            if (td.length < 8) continue;

            const sorteo = td[0].textContent.replace(/\s+/g, ' ').trim();
            if (!/^\d{1,2}:\d{2}\s*(AM|PM)$/i.test(sorteo)) continue;

            resultados.push({
                fecha: fechaActual,
                hora: sorteo,
                primera: nationQuiniela(td[1]),
                segunda: nationQuiniela(td[2]),
                tercera: nationQuiniela(td[3]),
                pick3: nationPick(td[6]),
                pick4: nationPick(td[7])
            });
        }

        return resultados;
    }

    async function buscarNationJL(config, fecha) {
        const html = await requestText(NATIONJL_URL);
        const resultados = parseNationJL(html);
        return resultados.find(r =>
            r.fecha === fecha && r.hora.toUpperCase() === config.hora.toUpperCase()
        ) || null;
    }

    const RAPID_MESES = {
        january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };

    function rapidLimpiarPick(valor) {
        return String(valor || '').replace(/,/g, '').trim();
    }

    function rapidParseFechaHora(datetime) {
        const texto = String(datetime || '').trim();
        const m = texto.match(/^[A-Za-z]+,\s+([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}:\d{2})\s+(AM|PM)$/i);
        if (!m) return null;

        const mes = RAPID_MESES[m[1].toLowerCase()];
        if (!mes) return null;

        const dia = String(m[2]).padStart(2, '0');
        const anio = m[3];
        const [h, min] = m[4].split(':');
        const hora12 = `${String(h).padStart(2, '0')}:${min} ${m[5].toUpperCase()}`;

        return { fecha: `${mes}/${dia}/${anio}`, hora: hora12 };
    }

    function parseRapid(data) {
        const history = Array.isArray(data?.history) ? data.history : [];
        const resultados = [];

        for (const r of history) {
            const fechaHora = rapidParseFechaHora(r.datetime);
            if (!fechaHora) continue;

            resultados.push({
                fecha: fechaHora.fecha,
                hora: fechaHora.hora,
                drawNumber: String(r.draw_number || ''),
                primera: String(r.first ?? ''),
                segunda: String(r.second ?? ''),
                tercera: String(r.third ?? ''),
                pick3: rapidLimpiarPick(r.pick3),
                pick4: rapidLimpiarPick(r.pick4)
            });
        }

        return resultados;
    }

    function rapidSorteoCompletadoHoy(data, config) {
        const draws = Array.isArray(data?.draws) ? data.draws : [];
        const draw = draws.find(d => String(d.time || '') === config.hora24);
        if (!draw) return null;
        return Number(draw.completed) === 1;
    }

    async function buscarRapid(config, fecha) {
        const text = await requestText(RAPID_URL);
        let data;
        try { data = JSON.parse(text); }
        catch { throw new Error('Rapid Lottery: respuesta JSON inválida'); }

        if (fecha === fechaHoyRD()) {
            const completed = rapidSorteoCompletadoHoy(data, config);
            if (completed === false) return { pendiente: true };
        }

        const resultados = parseRapid(data);
        return resultados.find(r =>
            r.fecha === fecha && r.hora.toUpperCase() === config.hora.toUpperCase()
        ) || null;
    }

    // ============================================================
    // PREMIER LOTTO
    // ============================================================

    function premierFechaUs(date) {
        const m = String(date || '').match(
            /^(\d{4})-(\d{2})-(\d{2})$/
        );

        return m
            ? `${m[2]}/${m[3]}/${m[1]}`
            : '';
    }

    function parsePremier(data) {
        const results = Array.isArray(data?.results)
            ? data.results
            : [];

        return results
            .map(r => ({
                fecha: premierFechaUs(r.date),
                horaKey: String(
                    r?.sortition?.abbreviation || ''
                ).toUpperCase(),
                primera: String(r.first ?? ''),
                segunda: String(r.second ?? ''),
                tercera: String(r.third ?? ''),
                pick3: String(r.cashThree ?? ''),
                pick4: String(r.pickFour ?? '')
            }))
            .filter(r =>
                r.fecha &&
                r.horaKey
            );
    }

    function requestPremier() {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: PREMIER_URL,
                headers: {
                    'Accept': 'application/json',
                    'Origin': 'https://premierlotto.tv',
                    'Referer': 'https://premierlotto.tv/',
                    'Cache-Control': 'no-cache'
                },
                timeout: 15000,
                onload(response) {
                    if (response.status >= 200 && response.status < 300) {
                        resolve(response.responseText ?? response.response ?? '');
                    } else {
                        reject(new Error(`Premier HTTP ${response.status}`));
                    }
                },
                onerror() {
                    reject(new Error('Premier: error de red'));
                },
                ontimeout() {
                    reject(new Error('Premier: timeout'));
                }
            });
        });
    }

    async function buscarPremier(config, fecha) {
        const text = await requestPremier();

        let data;

        try {
            data = JSON.parse(text);
        } catch {
            throw new Error(
                'PremierLotto: respuesta JSON inválida'
            );
        }

        const key = String(
            config.premierKey || ''
        ).toUpperCase();

        return parsePremier(data).find(r =>
            r.fecha === fecha &&
            r.horaKey === key
        ) || null;
    }


    // ============================================================
    // QPLAY BRAZIL
    // ============================================================

    function qplayParseFechaHora(texto) {
        const m = String(texto || '').trim().match(
            /^(\d{2}\/\d{2}\/\d{4})\s*-\s*(\d{1,2}):(\d{2})(am|pm)$/i
        );

        if (!m) return null;

        return {
            fecha: m[1],
            hora: `${String(m[2]).padStart(2, '0')}:${m[3]} ${m[4].toUpperCase()}`
        };
    }

    function qplayResultadoDesdeImagenes(srcs) {
        const principal = [];
        const pick3 = [];
        const pick4 = [];
        let modo = 'principal';

        for (const srcRaw of srcs || []) {
            const src = String(srcRaw || '').toLowerCase();

            if (/\/img\/pick3\.png(?:[?#]|$)/.test(src)) {
                modo = 'pick3';
                continue;
            }

            if (/\/img\/pick4\.png(?:[?#]|$)/.test(src)) {
                modo = 'pick4';
                continue;
            }

            const m = src.match(
                /\/img\/balls\/([0-9])\.png(?:[?#]|$)/
            );

            if (!m) continue;

            if (modo === 'principal') principal.push(m[1]);
            else if (modo === 'pick3') pick3.push(m[1]);
            else if (modo === 'pick4') pick4.push(m[1]);
        }

        if (
            principal.length < 6 ||
            pick3.length < 3 ||
            pick4.length < 4
        ) {
            return null;
        }

        return {
            primera: principal.slice(0, 2).join(''),
            segunda: principal.slice(2, 4).join(''),
            tercera: principal.slice(4, 6).join(''),
            pick3: pick3.slice(0, 3).join(''),
            pick4: pick4.slice(0, 4).join('')
        };
    }

    function parseQPlay(html) {
        const doc = new DOMParser().parseFromString(
            html,
            'text/html'
        );

        const elementos = [
            ...doc.querySelectorAll('*')
        ];

        const resultados = [];

        for (let i = 0; i < elementos.length; i++) {
            const el = elementos[i];

            if (!/^H[1-6]$/.test(el.tagName)) {
                continue;
            }

            const fechaHora = qplayParseFechaHora(
                el.textContent
            );

            if (!fechaHora) {
                continue;
            }

            const srcs = [];

            for (let j = i + 1; j < elementos.length; j++) {
                const siguiente = elementos[j];

                if (
                    /^H[1-6]$/.test(siguiente.tagName) &&
                    qplayParseFechaHora(siguiente.textContent)
                ) {
                    break;
                }

                if (siguiente.tagName === 'IMG') {
                    srcs.push(
                        siguiente.getAttribute('src') || ''
                    );
                }
            }

            const valores = qplayResultadoDesdeImagenes(
                srcs
            );

            if (!valores) {
                continue;
            }

            resultados.push({
                fecha: fechaHora.fecha,
                hora: fechaHora.hora,
                ...valores
            });
        }

        return resultados;
    }

    async function buscarQPlay(config, fecha) {
        const html = await requestText(QPLAY_URL);
        const resultados = parseQPlay(html);

        return resultados.find(r =>
            r.fecha === fecha &&
            r.hora.toUpperCase() === config.hora.toUpperCase()
        ) || null;
    }


    // ============================================================
    // MOTOR AUTOMÁTICO — cinco fuentes; EXTRA continúa manual
    // ============================================================
    const AUTO_CAMPOS = ['primera', 'segunda', 'tercera', 'pick3', 'pick4'];
    const AUTO_VERIFY_MS = [700, 1200, 2500, 5000, 8000];
    const AUTO_CONFLICT_RECHECK_MS = 20000;
    const AUTO_EMISOR_KEY = 'vl:auto:emisor'; // solo migración desde <= 3.0.x
    const AUTO_MODO_KEY = 'vl:auto:modo'; // solo migración desde <= 3.0.x
    const AUTO_SETTINGS_KEY = 'vl:auto:settings:v1';
    const AUTO_INTERVALOS_MS = [60000, 300000, 600000];
    const AUTO_MAX_BUSQUEDAS = [0, 3, 5, 10, 15];
    const AUTO_PREFIJO = 'vl:auto:v3:';
    const autoEnCurso = new Set();
    const autoCache = new Map();
    const autoRoverCache = new Map();
    let autoDia = '';
    let autoSchedulerTimer = null;

    function autoMinuto(hora) {
        const m = String(hora).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!m) return null;
        return (Number(m[1]) % 12 + (m[3].toUpperCase() === 'PM' ? 12 : 0)) * 60 + Number(m[2]);
    }

    // La hora de Queen es la que muestra la fila de Rover, no el nombre del turno.
    const AUTO_QUEEN_HORAS = {
        'QLT-MORNING': '10:25 AM', 'QLT-MIDDAY': '12:40 PM',
        'QLT-AFTN': '05:25 PM', 'QLT-EVENING': '07:25 PM',
        'QLT-NIGHT': '09:25 PM'
    };
    const autoConfig = Object.fromEntries(Object.entries(LOTERIAS)
        .filter(([codigo]) => codigo !== 'EXTRA')
        .map(([codigo, config]) => [codigo, {
            ...config, minuto: autoMinuto(AUTO_QUEEN_HORAS[codigo] || config.hora)
        }]));

    const AUTO_GRUPOS = [
        { fuente: 'nationjl', titulo: 'Pick and Win' },
        { fuente: 'rapid', titulo: 'Rapid' },
        { fuente: 'premier', titulo: 'Premier' },
        { fuente: 'qplay', titulo: 'Brazil' },
        { fuente: 'queen', titulo: 'Queen' }
    ];

    function autoModoLegacy() {
        const modo = GM_getValue(AUTO_MODO_KEY, null);
        if (['OBSERVAR', 'RAPID', 'TODOS'].includes(modo)) return modo;
        return GM_getValue(AUTO_EMISOR_KEY, false) ? 'TODOS' : 'OBSERVAR';
    }

    function autoConfiguracionPredeterminada() {
        const modo = autoModoLegacy();
        const lotteries = Object.fromEntries(Object.keys(autoConfig).map(codigo => [
            codigo,
            { enabled: modo === 'TODOS' || (modo === 'RAPID' && autoConfig[codigo].fuente === 'rapid') }
        ]));
        return {
            enabled: modo !== 'OBSERVAR',
            intervalMs: 60000,
            maxRetries: 0,
            lotteries
        };
    }

    function autoNormalizarConfiguracion(raw) {
        const base = autoConfiguracionPredeterminada();
        if (!raw || typeof raw !== 'object') return base;

        const intervalMs = AUTO_INTERVALOS_MS.includes(Number(raw.intervalMs))
            ? Number(raw.intervalMs) : base.intervalMs;
        const maxRetries = AUTO_MAX_BUSQUEDAS.includes(Number(raw.maxRetries))
            ? Number(raw.maxRetries) : base.maxRetries;
        const lotteries = Object.fromEntries(Object.keys(autoConfig).map(codigo => {
            const value = raw.lotteries?.[codigo]?.enabled;
            return [codigo, { enabled: typeof value === 'boolean' ? value : base.lotteries[codigo].enabled }];
        }));

        return {
            enabled: typeof raw.enabled === 'boolean' ? raw.enabled : base.enabled,
            intervalMs,
            maxRetries,
            lotteries
        };
    }

    function autoConfiguracion() {
        const guardada = GM_getValue(AUTO_SETTINGS_KEY, null);
        if (guardada) return autoNormalizarConfiguracion(guardada);

        const migrada = autoConfiguracionPredeterminada();
        GM_setValue(AUTO_SETTINGS_KEY, migrada);
        return migrada;
    }

    function autoGuardarConfiguracion(config) {
        const normalizada = autoNormalizarConfiguracion(config);
        GM_setValue(AUTO_SETTINGS_KEY, normalizada);
        return normalizada;
    }

    function autoPuedeEmitir(codigo) {
        const config = autoConfiguracion();
        return !!config.enabled && !!autoConfig[codigo] &&
            config.lotteries[codigo]?.enabled === true;
    }

    function autoIntentosAgotados(estado, config = autoConfiguracion()) {
        const max = Number(config.maxRetries || 0);
        return max > 0 && Number(estado?.searchAttempts || 0) >= max;
    }

    function autoTextoIntento(intentos, max) {
        return Number(max) > 0 ? `${intentos}/${max}` : `${intentos}/∞`;
    }

    function autoAhoraRD() {
        const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Santo_Domingo', year: 'numeric', month: '2-digit',
            day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
        }).formatToParts(new Date()).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
        return {
            fechaUs: `${parts.month}/${parts.day}/${parts.year}`,
            fechaIso: `${parts.year}-${parts.month}-${parts.day}`,
            minutoDia: Number(parts.hour) * 60 + Number(parts.minute)
        };
    }

    function autoKey(reloj, codigo) { return `${AUTO_PREFIJO}${reloj.fechaIso}:${codigo}`; }
    function autoEstado(reloj, codigo) {
        const actual = GM_getValue(autoKey(reloj, codigo), null);
        if (actual) return actual;
        if (autoConfig[codigo]?.fuente === 'qplay') {
            const anterior = GM_getValue(`vl:auto:brazil:${reloj.fechaIso}:${codigo}`, null);
            if (anterior) {
                GM_setValue(autoKey(reloj, codigo), anterior);
                return anterior;
            }
        }
        return {
            estado: 'WAITING_TIME', resultado: null, searchAttempts: 0
        };
    }
    function autoMotivoVisible(estado) {
        const motivo = String(estado?.motivo ?? '').trim();
        if (motivo) return motivo;
        if (estado?.estado === 'DONE') return 'Procesado y verificado en Rover.';
        return '';
    }

    function autoGuardar(reloj, codigo, patch) {
        const anterior = autoEstado(reloj, codigo);
        const next = { ...anterior, ...patch,
            fecha: reloj.fechaUs, codigo, fuente: autoConfig[codigo].fuente, updatedAt: Date.now() };
        GM_setValue(autoKey(reloj, codigo), next);
        if (next.estado !== anterior.estado &&
            ['WAITING_RESULT', 'RESULT_READY', 'DONE', 'CONFLICT', 'DUPLICATE',
                'PROCESS_UNCERTAIN', 'ERROR'].includes(next.estado)) {
            console.table([{ Loteria: codigo, Fecha: reloj.fechaUs,
                Fuente: nombreFuente(next.fuente), Estado: next.estado, Motivo: autoMotivoVisible(next) }]);
        }
        return next;
    }
    function autoDebeSoloVerificar(estado) {
        return ['PROCESSING', 'VERIFYING', 'PROCESS_UNCERTAIN'].includes(estado);
    }
    function autoNormalizar(v) {
        const value = String(v ?? '').trim();
        return value === '---' ? '' : value;
    }
    function autoResultadoValido(r) {
        return !!r && /^\d{2}$/.test(r.primera) && /^\d{2}$/.test(r.segunda) &&
            /^\d{2}$/.test(r.tercera) && /^\d{3}$/.test(r.pick3) &&
            /^\d{4}$/.test(r.pick4);
    }
    function autoConflicto(valores, resultado) {
        return AUTO_CAMPOS.some(c => autoNormalizar(valores[c]) !== '' &&
            autoNormalizar(valores[c]) !== resultado[c]);
    }
    function autoIguales(valores, resultado) {
        return AUTO_CAMPOS.every(c => autoNormalizar(valores[c]) === resultado[c]);
    }
    function autoEsperar(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    function autoUnico(resultados, coincide) {
        const matches = resultados.filter(coincide);
        return matches.length === 1 ? matches[0] : null;
    }

    // Una solicitud por fuente durante diez segundos; el parseo y el emparejamiento son independientes.
    async function autoFuente(codigo, fecha) {
        const config = autoConfig[codigo];
        const fuente = config.fuente;
        const now = Date.now();
        let cached = autoCache.get(fuente);
        if (!cached || now - cached.ts >= 10000) {
            const promise = (async () => {
                if (fuente === 'nationjl') return parseNationJL(await requestText(NATIONJL_URL));
                if (fuente === 'rapid') return JSON.parse(await requestText(RAPID_URL));
                if (fuente === 'premier') return parsePremier(JSON.parse(await requestPremier()));
                if (fuente === 'qplay') return parseQPlay(await requestText(QPLAY_URL));
                if (fuente === 'queen') return parseQueen(await requestText(QUEEN_URL));
                throw new Error(`Fuente desconocida: ${fuente}`);
            })();
            cached = { ts: now, promise };
            autoCache.set(fuente, cached);
            promise.catch(() => { if (autoCache.get(fuente) === cached) autoCache.delete(fuente); });
        }
        const data = await cached.promise;
        if (fuente === 'rapid') {
            // Si la API aún declara el sorteo pendiente, no usar un histórico coincidente.
            if (rapidSorteoCompletadoHoy(data, config) === false) return null;
            return autoUnico(parseRapid(data), r => r.fecha === fecha &&
                autoMinuto(r.hora) === autoMinuto(config.hora));
        }
        if (fuente === 'premier') return autoUnico(data, r => r.fecha === fecha &&
            r.horaKey === config.premierKey.toUpperCase());
        if (fuente === 'queen') return autoUnico(data, r => r.fecha === fecha &&
            r.queenKey === config.queenKey.toUpperCase());
        return autoUnico(data, r => r.fecha === fecha &&
            autoMinuto(r.hora) === autoMinuto(config.hora));
    }

    async function autoPost(path, parametros) {
        const response = await fetch(path, {
            method: 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest' },
            body: new URLSearchParams(parametros).toString()
        });
        const html = await response.text();
        if (!response.ok) throw new Error(`Rover HTTP ${response.status} en ${path}`);
        return html;
    }
    function autoFila(root, codigo) {
        return [...root.querySelectorAll('input[name="primera"][loteria]')]
            .find(el => el.getAttribute('loteria')?.trim() === codigo)?.closest('tr') || null;
    }
    function autoValores(tr) {
        return Object.fromEntries(AUTO_CAMPOS.map(c => [c,
            tr?.querySelector(`input[name="${c}"]`)?.value ?? '']));
    }
    function autoDuplicados(doc, codigo, resultado) {
        return [...doc.querySelectorAll('#tableResult tbody tr.res_tr')].filter(tr => {
            const otro = tr.querySelector('input[name="primera"][loteria]')?.getAttribute('loteria')?.trim();
            if (!otro || otro === codigo) return false;
            const v = autoValores(tr);
            return ['primera', 'segunda', 'tercera'].every(c => autoNormalizar(v[c]) === resultado[c]);
        }).map(tr => tr.querySelector('input[name="primera"][loteria]').getAttribute('loteria'));
    }
    async function autoConsultar(reloj, codigo, resultado = null, fresh = false) {
        let cache = autoRoverCache.get(reloj.fechaIso);
        if (fresh || !cache || Date.now() - cache.ts > 10000) {
            const promise = autoPost('__inc/verResultados2.php', { loteria: '', fecha: reloj.fechaUs })
                .then(html => new DOMParser().parseFromString(html, 'text/html'));
            cache = { ts: Date.now(), promise };
            if (!fresh) autoRoverCache.set(reloj.fechaIso, cache);
            promise.catch(() => {
                if (autoRoverCache.get(reloj.fechaIso) === cache) autoRoverCache.delete(reloj.fechaIso);
            });
        }
        const doc = await cache.promise;
        const tr = autoFila(doc, codigo);
        if (!tr) {
            // verResultados2.php incorpora filas según avanza el horario.
            // Si el snapshot normal estaba cacheado antes de que apareciera este sorteo,
            // descartarlo y hacer exactamente una lectura fresca antes de rendirse.
            if (!fresh) {
                if (autoRoverCache.get(reloj.fechaIso) === cache) {
                    autoRoverCache.delete(reloj.fechaIso);
                }
                return autoConsultar(reloj, codigo, resultado, true);
            }
            return { encontrada: false };
        }
        return {
            encontrada: true,
            codigoServidor: tr.querySelector('input[name="primera"][loteria]').getAttribute('loteria'),
            procesada: !!tr.querySelector('.status-circle.status-ok'),
            valores: autoValores(tr),
            duplicados: resultado ? autoDuplicados(doc, codigo, resultado) : []
        };
    }
    function autoVisible(reloj, codigo) {
        if (obtenerFechaRover() !== reloj.fechaUs) return null;
        const tr = autoFila(document, codigo);
        return tr ? { tr, valores: autoValores(tr) } : null;
    }
    function autoReflejar(reloj, codigo, resultado) {
        guardarResultadoVisible(reloj.fechaUs, codigo, resultado, AUTO_CAMPOS);
        const visible = autoVisible(reloj, codigo);
        if (!visible || autoConflicto(visible.valores, resultado)) return false;
        const inputs = AUTO_CAMPOS.map(c => visible.tr.querySelector(`input[name="${c}"]`));
        if (inputs.some(i => !i)) return false;
        AUTO_CAMPOS.forEach((c, n) => escribirInput(inputs[n], resultado[c]));
        resaltarInputs(inputs);
        return true;
    }
    async function autoVerificar(reloj, codigo, resultado, demoras = AUTO_VERIFY_MS) {
        for (const ms of demoras) {
            if (ms) await autoEsperar(ms);
            const snap = await autoConsultar(reloj, codigo, null, true);
            if (!snap.encontrada) continue;
            if (snap.procesada && autoIguales(snap.valores, resultado)) return { estado: 'DONE' };
            if (snap.procesada || autoConflicto(snap.valores, resultado)) {
                return { estado: 'CONFLICT', rover: snap.valores };
            }
        }
        return { estado: 'PROCESS_UNCERTAIN' };
    }
    async function autoRecuperar(reloj, codigo, estado) {
        if (!autoResultadoValido(estado.resultado)) {
            autoGuardar(reloj, codigo, { estado: 'PROCESS_UNCERTAIN',
                motivo: 'Envío previo sin resultado válido; revisión manual.' });
            return;
        }
        if (Date.now() - Number(estado.lastVerifyAt || 0) < 120000) return;
        const verificado = await autoVerificar(reloj, codigo, estado.resultado, [0]);
        autoGuardar(reloj, codigo, { ...verificado, lastVerifyAt: Date.now(),
            motivo: verificado.estado === 'PROCESS_UNCERTAIN'
                ? 'Envío anterior no confirmado; no se repetirá automáticamente.'
                : verificado.estado === 'DONE'
                    ? 'Procesado y verificado en Rover.'
                    : '' });
        if (verificado.estado === 'DONE') autoReflejar(reloj, codigo, estado.resultado);
    }

    function autoResolverConflicto(resultadoGuardado, resultadoFuente, snap) {
        if (!autoResultadoValido(resultadoFuente)) {
            return { estado: 'CONFLICT', resultado: resultadoGuardado,
                motivo: 'La fuente actual no devolvió un resultado válido.' };
        }
        if (!snap?.encontrada) {
            return { estado: 'CONFLICT', resultado: resultadoFuente,
                motivo: 'Conflicto pendiente: fila no encontrada en Rover.' };
        }
        if (snap.procesada && autoIguales(snap.valores, resultadoFuente)) {
            const cambioFuente = autoResultadoValido(resultadoGuardado) &&
                !autoIguales(resultadoGuardado, resultadoFuente);
            return { estado: 'DONE', resultado: resultadoFuente,
                motivo: cambioFuente
                    ? 'Fuente actualizada y Rover confirmado.'
                    : 'Corrección manual confirmada en Rover.' };
        }
        return { estado: 'CONFLICT', resultado: resultadoFuente,
            motivo: 'Rover todavía no coincide con el resultado actual de la fuente.' };
    }

    async function autoRevalidarConflicto(reloj, codigo, estado) {
        if (Date.now() - Number(estado.lastConflictCheckAt || 0) < AUTO_CONFLICT_RECHECK_MS) return;

        let resultadoFuente;
        try {
            resultadoFuente = await autoFuente(codigo, reloj.fechaUs);
        } catch (error) {
            autoGuardar(reloj, codigo, { estado: 'CONFLICT', lastConflictCheckAt: Date.now(),
                motivo: `No se pudo revalidar la fuente: ${error.message}` });
            return;
        }

        const snap = await autoConsultar(reloj, codigo, null, true);
        const decision = autoResolverConflicto(estado.resultado, resultadoFuente, snap);
        autoGuardar(reloj, codigo, { ...decision, lastConflictCheckAt: Date.now() });
        if (decision.estado === 'DONE') autoReflejar(reloj, codigo, decision.resultado);
    }
    async function autoProcesar(reloj, codigo, resultado) {
        // Si AUTO se desactiva mientras una consulta de fuente está en vuelo,
        // conservar el resultado listo pero no tocar Rover ni la fila visible.
        if (!autoPuedeEmitir(codigo)) {
            autoGuardar(reloj, codigo, {
                estado: 'RESULT_READY',
                resultado,
                lastCheckAt: Date.now(),
                motivo: 'AUTO desactivado antes del envío.'
            });
            return;
        }

        const visible = autoVisible(reloj, codigo);
        if (visible && autoConflicto(visible.valores, resultado)) {
            autoGuardar(reloj, codigo, { estado: 'CONFLICT', resultado, motivo: 'Fila visible distinta.' });
            return;
        }
        const snap = await autoConsultar(reloj, codigo, resultado);
        if (!snap.encontrada) throw new Error('Fila no encontrada en Rover');
        if (snap.procesada) {
            const estado = autoIguales(snap.valores, resultado) ? 'DONE' : 'CONFLICT';
            autoGuardar(reloj, codigo, { estado, resultado, motivo: 'Fila ya procesada.' });
            if (estado === 'DONE') autoReflejar(reloj, codigo, resultado);
            return;
        }
        if (autoConflicto(snap.valores, resultado) ||
            (autoVisible(reloj, codigo) && autoConflicto(autoVisible(reloj, codigo).valores, resultado))) {
            autoGuardar(reloj, codigo, { estado: 'CONFLICT', resultado, motivo: 'Rover contiene otros valores.' });
            return;
        }
        if (snap.duplicados.length) {
            autoGuardar(reloj, codigo, { estado: 'DUPLICATE', resultado,
                motivo: `Duplicado con ${snap.duplicados.join(', ')}` });
            return;
        }
        autoReflejar(reloj, codigo, resultado);
        if (!navigator.locks?.request) {
            autoGuardar(reloj, codigo, { estado: 'RESULT_READY', resultado,
                lastCheckAt: Date.now(),
                motivo: 'Este navegador no ofrece Web Locks para coordinar pestañas.' });
            return;
        }
        await navigator.locks.request('vl-auto-rover-post', async () => {
            // Otra pestaña pudo enviar antes de que obtuviéramos el bloqueo.
            const compartido = autoEstado(reloj, codigo);
            if (autoDebeSoloVerificar(compartido.estado)) {
                await autoRecuperar(reloj, codigo, compartido);
                return;
            }
            if (['DONE', 'CONFLICT', 'DUPLICATE'].includes(compartido.estado)) return;
            if (autoResultadoValido(compartido.resultado) &&
                !autoIguales(compartido.resultado, resultado)) {
                autoGuardar(reloj, codigo, { estado: 'CONFLICT', resultado,
                    motivo: 'La fuente cambió respecto al resultado guardado.' });
                return;
            }
            // Otra pestaña pudo procesar mientras esperábamos el bloqueo.
            const previo = await autoConsultar(reloj, codigo, resultado, true);
            if (!previo.encontrada) throw new Error('Fila desapareció antes del envío');
            if (previo.procesada || autoConflicto(previo.valores, resultado) || previo.duplicados.length) {
                autoGuardar(reloj, codigo, { estado: previo.procesada && autoIguales(previo.valores, resultado)
                    ? 'DONE' : previo.duplicados.length ? 'DUPLICATE' : 'CONFLICT',
                    resultado, motivo: 'Rover cambió antes del envío.' });
                return;
            }
            if (!autoPuedeEmitir(codigo)) return;
            if (autoAhoraRD().fechaIso !== reloj.fechaIso) return;
            // Persistir antes del POST: ante cierre/timeout, recuperar leyendo Rover.
            autoGuardar(reloj, codigo, { estado: 'PROCESSING', resultado, processSentAt: Date.now() });
            let errorPost = '';
            try {
                await autoPost('__inc/procesarResultados.php', {
                    fecha: reloj.fechaIso, loteria: previo.codigoServidor,
                    ...Object.fromEntries(AUTO_CAMPOS.map(c => [c, resultado[c]]))
                });
            } catch (error) { errorPost = error.message; }
            autoGuardar(reloj, codigo, { estado: 'VERIFYING', resultado, motivo: errorPost });
            try {
                const verificado = await autoVerificar(reloj, codigo, resultado);
                autoGuardar(reloj, codigo, { ...verificado,
                    lastVerifyAt: Date.now(), motivo: verificado.estado === 'PROCESS_UNCERTAIN'
                        ? 'POST no confirmado; no se repetirá automáticamente.'
                        : verificado.estado === 'DONE'
                            ? 'Procesado y verificado en Rover.'
                            : '' });
                if (verificado.estado === 'DONE') autoReflejar(reloj, codigo, resultado);
            } catch (error) {
                autoGuardar(reloj, codigo, { estado: 'PROCESS_UNCERTAIN', resultado,
                    lastVerifyAt: Date.now(), motivo: error.message });
            }
        });
    }
    async function autoEvaluar(reloj, codigo) {
        if (autoEnCurso.has(codigo)) return;

        const transcurridos = reloj.minutoDia - autoConfig[codigo].minuto;
        if (transcurridos < 1) return;

        autoEnCurso.add(codigo);
        try {
            let estado = autoEstado(reloj, codigo);

            if (['DONE', 'DUPLICATE'].includes(estado.estado)) return;

            // Si hubo un POST previo, terminar su verificación aunque el usuario
            // haya desactivado AUTO mientras estaba en curso.
            if (autoDebeSoloVerificar(estado.estado)) {
                await autoRecuperar(reloj, codigo, estado);
                return;
            }

            if (!autoPuedeEmitir(codigo)) return;

            if (estado.estado === 'CONFLICT') {
                await autoRevalidarConflicto(reloj, codigo, estado);
                return;
            }

            const config = autoConfiguracion();
            let resultado = estado.resultado;

            if (!autoResultadoValido(resultado)) {
                if (autoIntentosAgotados(estado, config)) {
                    const max = Number(config.maxRetries || 0);
                    const intentos = Number(estado.searchAttempts || 0);
                    autoGuardar(reloj, codigo, {
                        estado: 'WAITING_RESULT',
                        resultado: null,
                        motivo: `Límite de búsquedas alcanzado (${autoTextoIntento(intentos, max)}).`
                    });
                    return;
                }

                const searchAttempts = Number(estado.searchAttempts || 0) + 1;
                autoGuardar(reloj, codigo, {
                    estado: 'SEARCHING',
                    searchAttempts,
                    lastSearchAt: Date.now(),
                    motivo: ''
                });

                resultado = await autoFuente(codigo, reloj.fechaUs);

                if (!autoResultadoValido(resultado)) {
                    autoGuardar(reloj, codigo, {
                        estado: 'WAITING_RESULT',
                        resultado: null,
                        searchAttempts,
                        motivo: `Fuente pendiente o resultado incompleto. Intento ${autoTextoIntento(
                            searchAttempts, config.maxRetries
                        )}.`
                    });
                    return;
                }

                autoGuardar(reloj, codigo, {
                    estado: 'RESULT_READY',
                    resultado,
                    searchAttempts,
                    foundAt: Date.now(),
                    motivo: 'Resultado encontrado; validando Rover.'
                });
            }

            await autoProcesar(reloj, codigo, resultado);
        } catch (error) {
            const estado = autoEstado(reloj, codigo);
            if (autoDebeSoloVerificar(estado.estado)) {
                autoGuardar(reloj, codigo, {
                    estado: 'PROCESS_UNCERTAIN',
                    resultado: estado.resultado,
                    lastVerifyAt: Date.now(),
                    motivo: error.message
                });
            } else {
                autoGuardar(reloj, codigo, {
                    estado: 'ERROR',
                    motivo: error.message
                });
            }
            console.error('[AUTO LOTERÍAS]', codigo, error);
        } finally {
            autoEnCurso.delete(codigo);
        }
    }

    function autoTick() {
        if (!document.querySelector('#fecha')) return;

        const reloj = autoAhoraRD();
        const config = autoConfiguracion();

        if (autoDia !== reloj.fechaIso) {
            autoDia = reloj.fechaIso;
            autoCache.clear();
            autoRoverCache.clear();
        }

        for (const codigo of Object.keys(autoConfig)) {
            const estado = autoEstado(reloj, codigo);
            const recuperar = autoDebeSoloVerificar(estado.estado);
            const habilitada = config.enabled && config.lotteries[codigo]?.enabled === true;
            if (!recuperar && !habilitada) continue;

            autoEvaluar(reloj, codigo)
                .catch(error => console.error('[AUTO LOTERÍAS]', codigo, error));
        }
    }

    function autoResumen(reloj) {
        const config = autoConfiguracion();
        const activos = Object.entries(autoConfig)
            .filter(([codigo, item]) =>
                config.enabled &&
                config.lotteries[codigo]?.enabled === true &&
                reloj.minutoDia >= item.minuto
            )
            .map(([codigo, item]) => {
                const estado = autoEstado(reloj, codigo);
                return {
                    Loteria: codigo,
                    Fecha: reloj.fechaUs,
                    Fuente: nombreFuente(item.fuente),
                    Estado: estado.estado,
                    Motivo: autoMotivoVisible(estado)
                };
            });

        if (activos.length) console.table(activos);
    }

    function autoDetenerScheduler() {
        if (autoSchedulerTimer !== null) {
            clearTimeout(autoSchedulerTimer);
            autoSchedulerTimer = null;
        }
    }

    function autoProgramarSiguiente(delay = null) {
        autoDetenerScheduler();
        const config = autoConfiguracion();
        const espera = delay === null ? config.intervalMs : delay;

        autoSchedulerTimer = setTimeout(() => {
            autoSchedulerTimer = null;
            autoTick();
            autoProgramarSiguiente();
        }, espera);
    }

    function autoReiniciarScheduler(inmediato = true) {
        autoDetenerScheduler();
        if (inmediato) autoTick();
        autoProgramarSiguiente();
    }

    function iniciarAutoLoterias() {
        const config = autoConfiguracion();
        const habilitadas = Object.keys(autoConfig)
            .filter(codigo => config.lotteries[codigo]?.enabled === true).length;

        console.log(
            '[AUTO LOTERÍAS]',
            config.enabled ? 'ACTIVO' : 'OFF',
            '· habilitadas:', habilitadas,
            '· intervalo:', `${config.intervalMs / 1000}s`,
            '· máximo:', config.maxRetries || 'sin límite'
        );

        autoResumen(autoAhoraRD());
        autoReiniciarScheduler(true);
    }

    function autoIntervaloTexto(ms) {
        const minutos = Number(ms) / 60000;
        return minutos === 1 ? '1 minuto' : `${minutos} minutos`;
    }

    function autoMaxTexto(value) {
        return Number(value) === 0 ? 'Sin límite' : `${value} búsquedas`;
    }

    function actualizarBotonAuto() {
        const btn = document.querySelector('.rs-auto-settings-btn');
        if (!btn) return;

        const config = autoConfiguracion();
        const activas = Object.keys(autoConfig)
            .filter(codigo => config.lotteries[codigo]?.enabled === true).length;

        btn.classList.toggle('rs-active', config.enabled);
        btn.title = config.enabled
            ? `AUTO activo: ${activas} loterías · cada ${autoIntervaloTexto(config.intervalMs)}`
            : 'Configuración AUTO · actualmente desactivado';
        btn.setAttribute('aria-label', btn.title);
    }

    function asegurarModalAuto() {
        let backdrop = document.querySelector('.rs-auto-modal-backdrop');
        if (backdrop) return backdrop;
        if (!document.body) return null;

        backdrop = document.createElement('div');
        backdrop.className = 'rs-auto-modal-backdrop';
        backdrop.hidden = true;
        backdrop.innerHTML = `
            <section class="rs-auto-modal" role="dialog" aria-modal="true" aria-labelledby="rs-auto-modal-title">
                <div class="rs-auto-modal-header">
                    <h3 class="rs-auto-modal-title" id="rs-auto-modal-title">Configuración AUTO</h3>
                    <button type="button" class="rs-auto-modal-close" aria-label="Cerrar">&times;</button>
                </div>
                <div class="rs-auto-modal-body">
                    <div class="rs-auto-global-card">
                        <div>
                            <strong>Automatización global</strong>
                            <small>Activa únicamente las loterías seleccionadas debajo.</small>
                        </div>
                        <input type="checkbox" class="rs-auto-global-enabled rs-auto-toggle" aria-label="Activar automatización global">
                    </div>
                    <div class="rs-auto-settings-grid">
                        <div class="rs-auto-field">
                            <label>Buscar resultado cada</label>
                            <select class="rs-auto-interval"></select>
                        </div>
                        <div class="rs-auto-field">
                            <label>Máximo de búsquedas por sorteo</label>
                            <select class="rs-auto-max-retries"></select>
                        </div>
                    </div>
                    <p class="rs-auto-note">
                        Esta configuración se guarda en esta PC/navegador. Evita activar la misma lotería
                        como emisora automática en más de una PC al mismo tiempo. EXTRA continúa manual.
                    </p>
                    <div class="rs-auto-toolbar">
                        <span class="rs-auto-toolbar-title">Loterías automáticas</span>
                        <div class="rs-auto-toolbar-actions">
                            <button type="button" class="rs-auto-small-btn rs-auto-select-all">Todas</button>
                            <button type="button" class="rs-auto-small-btn rs-auto-select-none">Ninguna</button>
                        </div>
                    </div>
                    <div class="rs-auto-lottery-groups"></div>
                </div>
                <div class="rs-auto-modal-footer">
                    <button type="button" class="rs-auto-footer-btn rs-auto-cancel">Cancelar</button>
                    <button type="button" class="rs-auto-footer-btn rs-primary rs-auto-save">Guardar</button>
                </div>
            </section>
        `;

        const intervalSelect = backdrop.querySelector('.rs-auto-interval');
        for (const ms of AUTO_INTERVALOS_MS) {
            const option = document.createElement('option');
            option.value = String(ms);
            option.textContent = autoIntervaloTexto(ms);
            intervalSelect.appendChild(option);
        }

        const maxSelect = backdrop.querySelector('.rs-auto-max-retries');
        for (const max of AUTO_MAX_BUSQUEDAS) {
            const option = document.createElement('option');
            option.value = String(max);
            option.textContent = autoMaxTexto(max);
            maxSelect.appendChild(option);
        }

        const groupsRoot = backdrop.querySelector('.rs-auto-lottery-groups');
        for (const grupo of AUTO_GRUPOS) {
            const items = Object.entries(autoConfig)
                .filter(([, item]) => item.fuente === grupo.fuente);

            const group = document.createElement('div');
            group.className = 'rs-auto-source-group';
            group.dataset.fuente = grupo.fuente;

            const header = document.createElement('div');
            header.className = 'rs-auto-accordion-header';

            const toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'rs-auto-accordion-toggle';
            toggle.setAttribute('aria-expanded', 'false');

            const title = document.createElement('span');
            title.className = 'rs-auto-source-title';
            title.textContent = grupo.titulo;

            const count = document.createElement('span');
            count.className = 'rs-auto-source-count';
            count.textContent = `0/${items.length}`;

            const chevron = document.createElement('span');
            chevron.className = 'rs-auto-accordion-chevron';
            chevron.textContent = '⌄';
            chevron.setAttribute('aria-hidden', 'true');

            toggle.appendChild(title);
            toggle.appendChild(count);
            toggle.appendChild(chevron);

            const selectAllLabel = document.createElement('label');
            selectAllLabel.className = 'rs-auto-group-all-label';

            const selectAll = document.createElement('input');
            selectAll.type = 'checkbox';
            selectAll.className = 'rs-auto-group-all';
            selectAll.dataset.fuente = grupo.fuente;

            const selectAllText = document.createElement('span');
            selectAllText.textContent = 'Todas';

            selectAllLabel.appendChild(selectAll);
            selectAllLabel.appendChild(selectAllText);

            const panel = document.createElement('div');
            panel.className = 'rs-auto-accordion-panel';
            panel.hidden = true;

            const grid = document.createElement('div');
            grid.className = 'rs-auto-lottery-grid';

            for (const [codigo, item] of items) {
                const label = document.createElement('label');
                label.className = 'rs-auto-lottery-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.className = 'rs-auto-lottery-check';
                checkbox.dataset.codigo = codigo;
                checkbox.dataset.fuente = grupo.fuente;

                const text = document.createElement('span');
                text.className = 'rs-auto-lottery-text';

                const code = document.createElement('span');
                code.className = 'rs-auto-lottery-code';
                code.textContent = codigo;

                const time = document.createElement('span');
                time.className = 'rs-auto-lottery-time';
                time.textContent = AUTO_QUEEN_HORAS[codigo] || item.hora;

                text.appendChild(code);
                text.appendChild(time);
                label.appendChild(checkbox);
                label.appendChild(text);
                grid.appendChild(label);
            }

            panel.appendChild(grid);
            header.appendChild(toggle);
            header.appendChild(selectAllLabel);
            group.appendChild(header);
            group.appendChild(panel);
            groupsRoot.appendChild(group);
        }

        function actualizarGrupo(group) {
            if (!group) return;
            const checks = [...group.querySelectorAll('.rs-auto-lottery-check')];
            const seleccionadas = checks.filter(input => input.checked).length;
            const selectAll = group.querySelector('.rs-auto-group-all');
            const count = group.querySelector('.rs-auto-source-count');

            if (selectAll) {
                selectAll.checked = checks.length > 0 && seleccionadas === checks.length;
                selectAll.indeterminate = seleccionadas > 0 && seleccionadas < checks.length;
            }
            if (count) count.textContent = `${seleccionadas}/${checks.length}`;
        }

        function actualizarTodosLosGrupos() {
            backdrop.querySelectorAll('.rs-auto-source-group').forEach(actualizarGrupo);
        }

        function cerrarAcordeones(excepto = null) {
            backdrop.querySelectorAll('.rs-auto-source-group').forEach(group => {
                if (group === excepto) return;
                group.querySelector('.rs-auto-accordion-panel').hidden = true;
                group.querySelector('.rs-auto-accordion-toggle')
                    .setAttribute('aria-expanded', 'false');
            });
        }

        backdrop.querySelectorAll('.rs-auto-source-group').forEach(group => {
            const toggle = group.querySelector('.rs-auto-accordion-toggle');
            const panel = group.querySelector('.rs-auto-accordion-panel');
            const selectAll = group.querySelector('.rs-auto-group-all');

            toggle.addEventListener('click', () => {
                const abrir = panel.hidden;
                cerrarAcordeones(abrir ? group : null);
                panel.hidden = !abrir;
                toggle.setAttribute('aria-expanded', abrir ? 'true' : 'false');
            });

            selectAll.addEventListener('change', () => {
                group.querySelectorAll('.rs-auto-lottery-check')
                    .forEach(input => { input.checked = selectAll.checked; });
                actualizarGrupo(group);
            });

            group.querySelectorAll('.rs-auto-lottery-check').forEach(input => {
                input.addEventListener('change', () => actualizarGrupo(group));
            });
        });

        const cerrar = () => cerrarModalAuto();
        backdrop.querySelector('.rs-auto-modal-close').addEventListener('click', cerrar);
        backdrop.querySelector('.rs-auto-cancel').addEventListener('click', cerrar);
        backdrop.addEventListener('click', event => {
            if (event.target === backdrop) cerrar();
        });
        backdrop.querySelector('.rs-auto-select-all').addEventListener('click', () => {
            backdrop.querySelectorAll('.rs-auto-lottery-check').forEach(input => { input.checked = true; });
            actualizarTodosLosGrupos();
        });
        backdrop.querySelector('.rs-auto-select-none').addEventListener('click', () => {
            backdrop.querySelectorAll('.rs-auto-lottery-check').forEach(input => { input.checked = false; });
            actualizarTodosLosGrupos();
        });
        backdrop.querySelector('.rs-auto-save').addEventListener('click', () => {
            const lotteries = Object.fromEntries(Object.keys(autoConfig).map(codigo => {
                const input = backdrop.querySelector(`.rs-auto-lottery-check[data-codigo="${codigo}"]`);
                return [codigo, { enabled: !!input?.checked }];
            }));

            const guardada = autoGuardarConfiguracion({
                enabled: backdrop.querySelector('.rs-auto-global-enabled').checked,
                intervalMs: Number(backdrop.querySelector('.rs-auto-interval').value),
                maxRetries: Number(backdrop.querySelector('.rs-auto-max-retries').value),
                lotteries
            });

            cerrarModalAuto();
            actualizarBotonAuto();
            autoReiniciarScheduler(true);

            console.log('[AUTO LOTERÍAS] Configuración guardada:', {
                enabled: guardada.enabled,
                intervalMs: guardada.intervalMs,
                maxRetries: guardada.maxRetries,
                habilitadas: Object.values(guardada.lotteries).filter(x => x.enabled).length
            });
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !backdrop.hidden) cerrarModalAuto();
        });

        actualizarTodosLosGrupos();
        document.body.appendChild(backdrop);
        return backdrop;
    }

    function abrirModalAuto() {
        const backdrop = asegurarModalAuto();
        if (!backdrop) return;

        const config = autoConfiguracion();
        backdrop.querySelector('.rs-auto-global-enabled').checked = config.enabled;
        backdrop.querySelector('.rs-auto-interval').value = String(config.intervalMs);
        backdrop.querySelector('.rs-auto-max-retries').value = String(config.maxRetries);

        for (const codigo of Object.keys(autoConfig)) {
            const input = backdrop.querySelector(`.rs-auto-lottery-check[data-codigo="${codigo}"]`);
            if (input) input.checked = config.lotteries[codigo]?.enabled === true;
        }

        backdrop.querySelectorAll('.rs-auto-source-group').forEach(group => {
            group.querySelector('.rs-auto-accordion-panel').hidden = true;
            group.querySelector('.rs-auto-accordion-toggle')
                .setAttribute('aria-expanded', 'false');

            const checks = [...group.querySelectorAll('.rs-auto-lottery-check')];
            const seleccionadas = checks.filter(input => input.checked).length;
            const selectAll = group.querySelector('.rs-auto-group-all');
            const count = group.querySelector('.rs-auto-source-count');

            if (selectAll) {
                selectAll.checked = checks.length > 0 && seleccionadas === checks.length;
                selectAll.indeterminate = seleccionadas > 0 && seleccionadas < checks.length;
            }
            if (count) count.textContent = `${seleccionadas}/${checks.length}`;
        });

        backdrop.hidden = false;
        document.body.classList.add('rs-auto-modal-open');
        backdrop.querySelector('.rs-auto-modal-close')?.focus();
    }

    function cerrarModalAuto() {
        const backdrop = document.querySelector('.rs-auto-modal-backdrop');
        if (!backdrop) return;
        backdrop.hidden = true;
        document.body?.classList.remove('rs-auto-modal-open');
    }

    function instalarControlAuto() {
        const fecha = document.querySelector('#fecha');
        if (!fecha) return;

        let row = fecha.closest('.rs-auto-date-row');
        if (!row) {
            const parent = fecha.parentElement;
            if (!parent) return;

            row = document.createElement('div');
            row.className = 'rs-auto-date-row';
            parent.insertBefore(row, fecha);
            row.appendChild(fecha);
        }

        let btn = row.querySelector('.rs-auto-settings-btn');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rs-auto-settings-btn';
            btn.innerHTML = ICON_GEAR;
            btn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                abrirModalAuto();
            });
            row.appendChild(btn);
        }

        actualizarBotonAuto();
    }


    // ============================================================
    // THE QUEEN LOTTERY
    // ============================================================

    const QUEEN_MESES = {
        january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
        july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
    };

    function queenFechaUs(texto) {
        const m = String(texto || '').trim().match(
            /^(?:[A-Za-z]+,\s*)?([A-Za-z]+)\s+(\d{1,2}),\s+(\d{4})$/i
        );

        if (!m) return '';

        const mes = QUEEN_MESES[m[1].toLowerCase()];
        if (!mes) return '';

        return `${mes}/${String(m[2]).padStart(2, '0')}/${m[3]}`;
    }

    function queenValorImagen(img) {
        if (!img) return '';

        const src = img.getAttribute('src') || '';
        const m = src.match(/\/normal\/([0-9]{2})\.png(?:[?#]|$)/i);

        return m ? m[1] : '';
    }

    function queenPremio(td) {
        return queenValorImagen(td?.querySelector('img'));
    }

    function queenPick(td) {
        if (!td) return '';

        return [...td.querySelectorAll('img')]
            .map(img => {
                const valor = queenValorImagen(img);
                if (!valor) return '';

                const numero = Number.parseInt(valor, 10);
                return Number.isFinite(numero) ? String(numero) : '';
            })
            .filter(v => v !== '')
            .join('');
    }

    function parseQueen(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const resultados = [];

        for (const grupo of doc.querySelectorAll('#results .date-group')) {
            const fecha = queenFechaUs(
                grupo.querySelector('.date-bar h4')?.textContent || ''
            );

            if (!fecha) continue;

            for (const tr of grupo.querySelectorAll('.desktop-table .results-table tbody tr')) {
                const td = [...tr.querySelectorAll('td')];
                if (td.length < 6) continue;

                const queenKey = td[0].textContent.replace(/\s+/g, ' ').trim().toUpperCase();
                if (!/^QL (MORNING|MIDDAY|AFTERNOON|EVENING|NIGHT)$/.test(queenKey)) continue;

                const resultado = {
                    fecha,
                    queenKey,
                    primera: queenPremio(td[1]),
                    segunda: queenPremio(td[2]),
                    tercera: queenPremio(td[3]),
                    pick3: queenPick(td[4]),
                    pick4: queenPick(td[5])
                };

                if (
                    !/^\d{2}$/.test(resultado.primera) ||
                    !/^\d{2}$/.test(resultado.segunda) ||
                    !/^\d{2}$/.test(resultado.tercera) ||
                    !/^\d{3}$/.test(resultado.pick3) ||
                    !/^\d{4}$/.test(resultado.pick4)
                ) {
                    continue;
                }

                resultados.push(resultado);
            }
        }

        return resultados;
    }

    async function buscarQueen(config, fecha) {
        const html = await requestText(QUEEN_URL);
        const key = String(config.queenKey || '').toUpperCase();

        return parseQueen(html).find(r =>
            r.fecha === fecha &&
            r.queenKey === key
        ) || null;
    }

    // EXTRA QUÉBEC — Lottery Post. Fecha literal del sorteo, sin convertir a UTC.
    function parseExtra(html, fechaISO) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        if (/just a moment|attention required/i.test(doc.querySelector('title')?.textContent || '') ||
            doc.querySelector('#challenge-running, #challenge-form, script[src*="/cdn-cgi/challenge-platform/"]')) {
            throw new Error('Lottery Post: verificación Cloudflare; no se obtuvieron resultados');
        }
        const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
        if (canonical) {
            const url = new URL(canonical, EXTRA_URL);
            if (url.hostname !== 'www.lotterypost.com' || !/^\/results\/qc\/extra(?:\/|$)/.test(url.pathname)) {
                throw new Error('Lottery Post: la respuesta no corresponde a Québec Extra');
            }
        }
        const sorteos = [...doc.querySelectorAll('.resultsdrawing')];
        if (!sorteos.length) throw new Error('Lottery Post: respuesta sin tabla de resultados');
        const coincidencias = sorteos.filter(sorteo => {
            const fecha = sorteo.querySelector('time[datetime]')?.getAttribute('datetime') || '';
            return fecha.startsWith(`${fechaISO}T`);
        });
        if (!coincidencias.length) return null;
        if (coincidencias.length !== 1) throw new Error('Lottery Post: más de un sorteo para la misma fecha');
        const digitos = [...coincidencias[0].querySelectorAll('.resultsnums > li')]
            .map(el => el.textContent.trim());
        if (digitos.length !== 7 || !digitos.every(d => /^\d$/.test(d))) return null;

        const numero = digitos.join('');
        return {
            fecha: `${fechaISO.slice(5, 7)}/${fechaISO.slice(8, 10)}/${fechaISO.slice(0, 4)}`,
            numero,
            primera: numero.slice(5, 7),
            segunda: numero.slice(1, 3),
            tercera: numero.slice(3, 5)
        };
    }

    // Comunicación privada del mismo userscript entre Rover y la pestaña abierta.
    // No intenta resolver ni saltar verificaciones del sitio.
    function consultarExtraEnPestana(fechaISO) {
        return new Promise((resolve, reject) => {
            const id = crypto.randomUUID();
            const requestKey = `vl-extra-request:${id}`;
            const responseKey = `vl-extra-response:${id}`;
            let finalizado = false, listener, timer, tab;
            const terminar = (error, resultado, cerrar = false) => {
                if (finalizado) return;
                finalizado = true;
                clearTimeout(timer);
                if (listener !== undefined) GM_removeValueChangeListener(listener);
                GM_deleteValue(requestKey);
                GM_deleteValue(responseKey);
                cancelacionesExtra.delete(cancelar);
                if (cerrar && tab) tab.close();
                if (error) reject(error);
                else resolve(resultado);
            };
            const cancelar = () => terminar(new Error('Extra: consulta cancelada por cambio de fecha'), null, true);
            cancelacionesExtra.add(cancelar);
            try {
                listener = GM_addValueChangeListener(responseKey, (_key, _old, respuesta) => {
                    if (!respuesta || respuesta.id !== id || respuesta.fechaISO !== fechaISO) return;
                    if (respuesta.error) {
                        terminar(new Error(respuesta.error));
                        return;
                    }
                    if (respuesta.numero === null) {
                        terminar(null, null, true);
                        return;
                    }
                    if (typeof respuesta.numero !== 'string' || !/^\d{7}$/.test(respuesta.numero)) {
                        terminar(new Error('Extra: resultado inválido recibido de la pestaña'));
                        return;
                    }
                    const numero = respuesta.numero;
                    terminar(null, {
                        fecha: `${fechaISO.slice(5, 7)}/${fechaISO.slice(8, 10)}/${fechaISO.slice(0, 4)}`,
                        numero,
                        primera: numero.slice(5, 7),
                        segunda: numero.slice(1, 3),
                        tercera: numero.slice(3, 5)
                    }, true);
                });
                GM_setValue(requestKey, { id, fechaISO, creada: Date.now() });
                timer = setTimeout(() => terminar(new Error(
                    'Extra: tiempo de espera de 2 minutos agotado. Revisa la pestaña de Lottery Post y que este mismo script esté habilitado allí.'
                )), EXTRA_ESPERA_MS);
                const [anio, mes] = fechaISO.split('-');
                const hash = new URLSearchParams({ vlExtra: id });
                tab = GM_openInTab(`${EXTRA_URL}/${anio}/${Number(mes)}#${hash}`, {
                    active: false, insert: true, setParent: true
                });
                if (!tab) throw new Error('Extra: no se pudo abrir la pestaña de Lottery Post');
                tab.onclose = () => terminar(new Error('Extra: se cerró la pestaña antes de recibir el resultado'));
            } catch (error) {
                terminar(error);
            }
        });
    }

    function atenderExtraEnPestana() {
        const id = new URLSearchParams(location.hash.slice(1)).get('vlExtra');
        if (!id || !/^[a-f0-9-]{36}$/i.test(id)) return;
        const requestKey = `vl-extra-request:${id}`;
        const solicitud = GM_getValue(requestKey, null);
        if (!solicitud || solicitud.id !== id || !/^\d{4}-\d{2}-\d{2}$/.test(solicitud.fechaISO) ||
            !Number.isFinite(solicitud.creada) || Date.now() - solicitud.creada > EXTRA_ESPERA_MS) return;
        const [anio, mes] = solicitud.fechaISO.split('-');
        const ruta = location.pathname.replace(/\/$/, '');
        // Lottery Post redirige el mes actual a /past; la fecha se valida en parseExtra.
        if (ruta !== '/results/qc/extra/past' && ruta !== `/results/qc/extra/past/${anio}/${Number(mes)}`) {
            console.warn('[Extra] Ruta inesperada en la pestaña:', ruta);
            GM_setValue(`vl-extra-response:${id}`, {
                id, fechaISO: solicitud.fechaISO,
                error: 'Extra: Lottery Post abrió una ruta distinta del historial solicitado'
            });
            return;
        }

        let finalizado = false, observer, timer;
        const detener = () => {
            finalizado = true;
            observer?.disconnect();
            clearTimeout(timer);
        };
        const leer = () => {
            if (finalizado) return;
            const vigente = GM_getValue(requestKey, null);
            if (!vigente || vigente.id !== id || Date.now() - solicitud.creada > EXTRA_ESPERA_MS) {
                detener();
                return;
            }
            // Si hay una verificación, el usuario la completa normalmente en el navegador.
            // Solo se lee cuando aparecen los resultados; no hay reintentos HTTP.
            if (!document.querySelector('.resultsdrawing')) return;
            let respuesta;
            try {
                const resultado = parseExtra(document.documentElement.outerHTML, solicitud.fechaISO);
                respuesta = { id, fechaISO: solicitud.fechaISO, numero: resultado?.numero ?? null };
            } catch (error) {
                respuesta = { id, fechaISO: solicitud.fechaISO, error: error.message };
            }
            detener();
            GM_setValue(`vl-extra-response:${id}`, respuesta);
        };
        observer = new MutationObserver(leer);
        observer.observe(document.documentElement, { childList: true, subtree: true });
        timer = setTimeout(detener, Math.max(0, EXTRA_ESPERA_MS - (Date.now() - solicitud.creada)));
        leer();
    }

    async function buscarExtra(config, fecha) {
        const [mes, dia, anio] = fecha.split('/');
        const fechaISO = `${anio}-${mes}-${dia}`;
        const date = new Date(`${fechaISO}T00:00:00Z`);
        if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== fechaISO) {
            throw new Error('Extra: fecha inválida');
        }
        return consultarExtraEnPestana(fechaISO);
    }

    function nombreFuente(fuente) {
        if (fuente === 'extra') return 'Lottery Post — Québec Extra';
        if (fuente === 'nationjl') return 'NationJL';
        if (fuente === 'rapid') return 'Rapid Lottery';
        if (fuente === 'premier') return 'PremierLotto';
        if (fuente === 'qplay') return 'QPlay Brazil';
        if (fuente === 'queen') return 'The Queen Lottery';
        return fuente;
    }


    function claveResultadoVisible(fecha, codigo) {
        return `${fecha}|${codigo}`;
    }

    function guardarResultadoVisible(fecha, codigo, resultado, campos = null) {
        if (!fecha || !codigo || !resultado) return;
        const lista = campos || (LOTERIAS[codigo]?.fuente === 'extra'
            ? ['primera', 'segunda', 'tercera']
            : ['primera', 'segunda', 'tercera', 'pick3', 'pick4']);
        if (!lista.every(campo => typeof resultado[campo] === 'string' && resultado[campo] !== '')) return;
        resultadosVisibles.set(claveResultadoVisible(fecha, codigo), {
            campos: [...lista],
            resultado: Object.fromEntries(lista.map(campo => [campo, resultado[campo]]))
        });
    }

    function restaurarResultadosVisibles() {
        const fecha = obtenerFechaRover();
        if (!fecha) return 0;

        // Los estados AUTO sobreviven a un reload. Los incorporamos al cache de UI
        // para que un Search posterior tampoco borre un resultado ya encontrado.
        const reloj = autoAhoraRD();
        if (fecha === reloj.fechaUs) {
            for (const codigo of Object.keys(autoConfig)) {
                const estado = autoEstado(reloj, codigo);
                if (!['RESULT_READY', 'PROCESSING', 'VERIFYING', 'DONE', 'PROCESS_UNCERTAIN'].includes(estado.estado)) continue;
                if (!autoResultadoValido(estado.resultado)) continue;
                guardarResultadoVisible(fecha, codigo, estado.resultado, AUTO_CAMPOS);
            }
        }

        let restaurados = 0;
        for (const codigo of Object.keys(LOTERIAS)) {
            const guardado = resultadosVisibles.get(claveResultadoVisible(fecha, codigo));
            if (!guardado) continue;

            const inputBase = buscarInputLoteria(codigo);
            const tr = inputBase?.closest('tr');
            if (!tr) continue;

            const actuales = Object.fromEntries(guardado.campos.map(campo => [
                campo, String(tr.querySelector(`input[name="${campo}"]`)?.value ?? '').trim()
            ]));
            const conflicto = guardado.campos.some(campo => {
                const actual = actuales[campo] === '---' ? '' : actuales[campo];
                return actual !== '' && actual !== guardado.resultado[campo];
            });
            if (conflicto) continue;

            const inputs = guardado.campos.map(campo => tr.querySelector(`input[name="${campo}"]`));
            if (inputs.some(input => !input)) continue;

            let cambio = false;
            guardado.campos.forEach((campo, i) => {
                const actual = String(inputs[i].value ?? '').trim();
                if (actual === '' || actual === '---') {
                    escribirInput(inputs[i], guardado.resultado[campo]);
                    cambio = true;
                }
            });
            if (cambio) {
                resaltarInputs(inputs);
                restaurados++;
            }

            const btn = tr.querySelector(`.rs-source-fetch-btn[data-codigo="${codigo}"]`);
            if (btn) botonExito(btn);
        }
        return restaurados;
    }

    function escribirInput(input, valor) {
        if (!input) return;
        input.value = String(valor);
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
    }

    function resaltarInputs(inputs) {
        for (const input of inputs) input.classList.add('rs-source-filled');
        setTimeout(() => {
            for (const input of inputs) input.classList.remove('rs-source-filled');
        }, 2000);
    }

    function botonNormal(btn) {
        btn.disabled = false;
        btn.className = 'rs-source-fetch-btn';
        btn.innerHTML = ICON_SEARCH;
        btn.title = 'Buscar resultado';
    }

    function botonBuscando(btn) {
        btn.disabled = true;
        btn.className = 'rs-source-fetch-btn rs-searching';
        btn.innerHTML = `${ICON_SEARCH}<span>Buscando...</span>`;
        btn.title = btn.dataset.codigo === 'EXTRA'
            ? 'Esperando la pestaña de Lottery Post. Completa allí cualquier verificación.'
            : 'Buscando resultado...';
    }

    function botonExito(btn) {
        btn.disabled = false;
        btn.className = 'rs-source-fetch-btn rs-success';
        btn.innerHTML = ICON_CHECK;
        btn.title = 'Resultado encontrado';
    }

    function botonNoDisponible(btn, texto = 'Resultado no disponible') {
        btn.disabled = true;
        btn.className = 'rs-source-fetch-btn rs-error';
        btn.innerHTML = `${ICON_X}<span>${texto}</span>`;
        btn.title = texto;
        setTimeout(() => botonNormal(btn), 2000);
    }

    function botonError(btn, mensaje = 'Error consultando la fuente') {
        btn.disabled = true;
        btn.className = 'rs-source-fetch-btn rs-error';
        btn.innerHTML = `${ICON_X}<span>Error</span>`;
        btn.title = mensaje;
        setTimeout(() => botonNormal(btn), 2000);
    }

    async function buscarResultado(codigo, tr, btn) {
        const fecha = obtenerFechaRover();
        if (!fecha) {
            console.warn('[Fuentes] Fecha de Rover no válida.');
            botonError(btn);
            return;
        }

        const config = LOTERIAS[codigo];
        if (!config) return;

        const revision = revisionFecha;
        const solicitud = Symbol();
        solicitudes.set(btn, solicitud);
        const vigente = () => solicitudes.get(btn) === solicitud &&
            revision === revisionFecha && fecha === obtenerFechaRover() && tr.isConnected;

        botonBuscando(btn);
        console.log(`[Fuentes] Buscando ${codigo} | ${fecha} | ${config.hora} | ${config.fuente}`);

        try {
            let resultado;

            if (config.fuente === 'nationjl') resultado = await buscarNationJL(config, fecha);
            else if (config.fuente === 'rapid') resultado = await buscarRapid(config, fecha);
            else if (config.fuente === 'premier') resultado = await buscarPremier(config, fecha);
            else if (config.fuente === 'qplay') resultado = await buscarQPlay(config, fecha);
            else if (config.fuente === 'queen') resultado = await buscarQueen(config, fecha);
            else if (config.fuente === 'extra') resultado = await buscarExtra(config, fecha);
            else throw new Error(`Fuente desconocida: ${config.fuente}`);

            if (!vigente()) return;

            if (resultado?.pendiente) {
                console.warn(`[Rapid] Sorteo todavía no completado | ${codigo} | ${fecha}`);
                botonNoDisponible(btn);
                return;
            }

            if (!resultado) {
                console.warn(`[Fuentes] Resultado no disponible | ${codigo} | ${fecha}`);
                botonNoDisponible(btn);
                return;
            }

            const campos = config.fuente === 'extra'
                ? ['primera', 'segunda', 'tercera']
                : ['primera', 'segunda', 'tercera', 'pick3', 'pick4'];
            if (!campos.every(campo => typeof resultado[campo] === 'string' && resultado[campo] !== '')) {
                console.warn('[Fuentes] Resultado incompleto:', resultado);
                botonNoDisponible(btn);
                return;
            }

            const inputs = campos.map(campo => tr.querySelector(`input[name="${campo}"]`));
            if (inputs.some(input => !input)) {
                throw new Error('No se encontraron todos los inputs necesarios de Rover');
            }
            guardarResultadoVisible(fecha, codigo, resultado, campos);
            campos.forEach((campo, i) => escribirInput(inputs[i], resultado[campo]));
            resaltarInputs(inputs);

            botonExito(btn);

            console.table([{
                Fuente: nombreFuente(config.fuente),
                Fecha: fecha,
                Loteria: codigo,
                Hora: config.hora,
                Primera: resultado.primera,
                Segunda: resultado.segunda,
                Tercera: resultado.tercera,
                Pick3: resultado.pick3,
                Pick4: resultado.pick4
            }]);

        } catch (error) {
            if (!vigente()) return;
            console.error('[Fuentes] Error:', error);
            botonError(btn, error.message);
        }
    }

    function instalarBotones() {
        if (!esPaginaRoverValida()) return;

        let agregados = 0;

        for (const [codigo] of Object.entries(LOTERIAS)) {
            const input = buscarInputLoteria(codigo);
            if (!input) continue;

            const tr = input.closest('tr');
            if (!tr) continue;

            if (tr.querySelector(`.rs-source-fetch-btn[data-codigo="${codigo}"]`)) continue;

            const abrev = tr.querySelector('.loteria-abrev');
            if (!abrev) continue;

            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'rs-source-fetch-btn';
            btn.dataset.codigo = codigo;
            btn.innerHTML = ICON_SEARCH;
            btn.title = `Buscar en ${nombreFuente(
                LOTERIAS[codigo].fuente
            )}`;

            btn.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                if (btn.disabled) return;
                buscarResultado(codigo, tr, btn);
            });

            abrev.insertAdjacentElement('afterend', btn);
            agregados++;
        }

        if (agregados) console.log(`[Fuentes] ✅ Botones instalados: ${agregados}`);
    }

    function instalarListenerFecha() {
        const fecha = document.querySelector('#fecha');
        if (!fecha) return;
        if (fecha.dataset.rsSourcesListenerInstalled) return;

        fecha.dataset.rsSourcesListenerInstalled = '1';

        const resetear = () => {
            revisionFecha++;
            for (const cancelar of [...cancelacionesExtra]) cancelar();
            document.querySelectorAll('.rs-source-fetch-btn').forEach(botonNormal);
            console.log(`[Fuentes] 📅 Fecha cambiada: ${fecha.value}`);
        };

        fecha.addEventListener('change', resetear);
        fecha.addEventListener('input', resetear);
    }

    function iniciar() {
        // Los controles superiores pueden existir antes que las filas.
        // Instalarlos primero hace el ciclo robusto a cualquier orden de carga.
        instalarListenerFecha();
        instalarControlAuto();
        if (!esPaginaRoverValida()) return;
        instalarBotones();
        restaurarResultadosVisibles();
    }

    // UI reactiva sin debounce:
    // 1) observamos únicamente #resultadosLoteria para filas nuevas;
    // 2) ignoramos mutaciones internas de botones/SVG porque no son ni contienen tr.res_tr;
    // 3) un observer externo solo reengancha si Rover reemplaza el contenedor o #fecha.
    // El motor AUTO permanece completamente independiente de estas mutaciones.
    let resultadosObserver = null;
    let resultadosObservado = null;

    function nodoContieneFilaResultado(node) {
        if (!node || node.nodeType !== 1) return false;
        return !!(
            node.matches?.('tr.res_tr') ||
            node.querySelector?.('tr.res_tr')
        );
    }

    function mutacionesContienenFilasResultado(mutations) {
        return mutations.some(mutation =>
            [...mutation.addedNodes].some(nodoContieneFilaResultado)
        );
    }

    function procesarCambiosResultados(mutations) {
        if (!mutacionesContienenFilasResultado(mutations)) return;

        // MutationObserver entrega este lote antes del siguiente render.
        // iniciar() es idempotente y no ejecuta el motor AUTO.
        iniciar();
    }

    function observarResultadosLoteria() {
        const contenedor = document.querySelector('#resultadosLoteria');
        if (!contenedor || contenedor === resultadosObservado) return false;

        resultadosObserver?.disconnect();
        resultadosObservado = contenedor;
        resultadosObserver = new MutationObserver(procesarCambiosResultados);
        resultadosObserver.observe(contenedor, {
            childList: true,
            subtree: true
        });

        return true;
    }

    function nodoContieneShellRover(node) {
        if (!node || node.nodeType !== 1) return false;
        return !!(
            node.matches?.('#resultadosLoteria, #fecha') ||
            node.querySelector?.('#resultadosLoteria, #fecha')
        );
    }

    function procesarCambiosShell(mutations) {
        const cambioShell = mutations.some(mutation =>
            [...mutation.addedNodes].some(nodoContieneShellRover)
        );
        if (!cambioShell) return;

        // Si Rover reemplaza el shell, enganchar primero el nuevo contenedor
        // y después sincronizar controles/filas ya presentes.
        observarResultadosLoteria();
        iniciar();
    }

    iniciarAutoLoterias();
    observarResultadosLoteria();
    iniciar();

    const shellObserver = new MutationObserver(procesarCambiosShell);
    shellObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();