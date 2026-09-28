// ==UserScript==
// @name         Virtual Lotteries v2 Auto
// @namespace    noeg
// @version      2.0.1
// @description  Virtual Lotteries v2: modo manual + Brazil/QPlay automático, con observador de tabla optimizado y procesamiento/verificación en segundo plano.
// @author       noeg
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
    // AUTO BRAZIL — QPLAY -> ROVER (BACKGROUND)
    // ============================================================

    const AUTO_BRAZIL_ENABLED = true;
    const AUTO_BRAZIL_CODIGOS = {
        'BRAZIL12PM': { minuto: 12 * 60 },
        'BRAZIL03PM': { minuto: 15 * 60 },
        'BRAZIL07PM': { minuto: 19 * 60 },
        'BRAZIL08PM': { minuto: 20 * 60 }
    };
    const AUTO_BRAZIL_REINTENTOS_MIN = [1, 3, 5, 8, 12, 20, 30, 45, 60, 90, 120];
    const AUTO_BRAZIL_TICK_MS = 20000;
    const AUTO_BRAZIL_VERIFY_DELAYS_MS = [700, 1200, 2500, 5000, 8000];
    const AUTO_BRAZIL_CAMPOS = ['primera', 'segunda', 'tercera', 'pick3', 'pick4'];
    const autoBrazilEnCurso = new Set();
    let autoBrazilQPlayCache = { ts: 0, promise: null };

    function autoBrazilAhoraRD() {
        const parts = Object.fromEntries(
            new Intl.DateTimeFormat('en-US', {
                timeZone: 'America/Santo_Domingo',
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit',
                hourCycle: 'h23'
            }).formatToParts(new Date())
                .filter(p => p.type !== 'literal')
                .map(p => [p.type, p.value])
        );
        return {
            fechaUs: `${parts.month}/${parts.day}/${parts.year}`,
            fechaIso: `${parts.year}-${parts.month}-${parts.day}`,
            minutoDia: Number(parts.hour) * 60 + Number(parts.minute),
            segundo: Number(parts.second)
        };
    }

    function autoBrazilStateKey(fechaIso, codigo) {
        return `vl:auto:brazil:${fechaIso}:${codigo}`;
    }

    function autoBrazilLeerEstado(fechaIso, codigo) {
        return GM_getValue(autoBrazilStateKey(fechaIso, codigo), null) || {
            codigo,
            fechaIso,
            estado: 'WAITING_TIME',
            resultado: null,
            nextAttemptMin: 1,
            updatedAt: 0
        };
    }

    function autoBrazilGuardarEstado(fechaIso, codigo, patch) {
        const actual = autoBrazilLeerEstado(fechaIso, codigo);
        const siguiente = {
            ...actual,
            ...patch,
            codigo,
            fechaIso,
            updatedAt: Date.now()
        };
        GM_setValue(autoBrazilStateKey(fechaIso, codigo), siguiente);
        return siguiente;
    }

    function autoBrazilNormalizarCampo(valor) {
        const v = String(valor ?? '').trim().toUpperCase();
        return v === '---' ? '' : v;
    }

    function autoBrazilHayConflicto(valores, resultado) {
        return AUTO_BRAZIL_CAMPOS.some(campo => {
            const actual = autoBrazilNormalizarCampo(valores?.[campo]);
            const esperado = autoBrazilNormalizarCampo(resultado?.[campo]);
            return actual !== '' && actual !== esperado;
        });
    }

    function autoBrazilCoincideCompleto(valores, resultado) {
        return AUTO_BRAZIL_CAMPOS.every(campo =>
            autoBrazilNormalizarCampo(valores?.[campo]) ===
            autoBrazilNormalizarCampo(resultado?.[campo])
        );
    }

    function autoBrazilResultadoValido(resultado) {
        return !!resultado &&
            /^\d{2}$/.test(resultado.primera) &&
            /^\d{2}$/.test(resultado.segunda) &&
            /^\d{2}$/.test(resultado.tercera) &&
            /^\d{3}$/.test(resultado.pick3) &&
            /^\d{4}$/.test(resultado.pick4);
    }

    function autoBrazilSiguienteMinuto(transcurridos) {
        const siguiente = AUTO_BRAZIL_REINTENTOS_MIN.find(m => m > transcurridos);
        return siguiente ?? (transcurridos + 30);
    }

    function autoBrazilEsperar(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async function autoBrazilPost(path, parametros) {
        const response = await fetch(path, {
            method: 'POST',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: new URLSearchParams(parametros).toString()
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`Rover HTTP ${response.status} en ${path}`);
        return text;
    }

    function autoBrazilValoresFila(tr) {
        const valores = {};
        for (const campo of AUTO_BRAZIL_CAMPOS) {
            valores[campo] = tr?.querySelector(`input[name="${campo}"]`)?.value ?? '';
        }
        return valores;
    }

    function autoBrazilFilaPorCodigo(root, codigo) {
        const inputs = [...root.querySelectorAll('input[loteria]')];
        const primera = inputs.find(input =>
            input.name === 'primera' &&
            String(input.getAttribute('loteria') || '').trim() === codigo
        );
        return primera?.closest('tr') || null;
    }

    function autoBrazilDuplicados(doc, codigo, resultado) {
        const duplicados = [];
        for (const tr of doc.querySelectorAll('#tableResult tbody tr.res_tr')) {
            const input = tr.querySelector('input[name="primera"][loteria]');
            if (!input) continue;
            const otroCodigo = String(input.getAttribute('loteria') || '').trim();
            if (!otroCodigo || otroCodigo === codigo) continue;
            const valores = autoBrazilValoresFila(tr);
            if (
                autoBrazilNormalizarCampo(valores.primera) === resultado.primera &&
                autoBrazilNormalizarCampo(valores.segunda) === resultado.segunda &&
                autoBrazilNormalizarCampo(valores.tercera) === resultado.tercera
            ) {
                duplicados.push({
                    codigo: otroCodigo,
                    nombre: tr.querySelector('.loteria-nombre')?.textContent?.trim() || otroCodigo
                });
            }
        }
        return duplicados;
    }

    async function autoBrazilConsultarRover(fechaUs, codigo, resultado = null) {
        const html = await autoBrazilPost('__inc/verResultados2.php', {
            loteria: '',
            fecha: fechaUs
        });
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tr = autoBrazilFilaPorCodigo(doc, codigo);
        if (!tr) return { encontrada: false, html, doc };
        const inputCodigo = tr.querySelector('input[loteria]');
        const snapshot = {
            encontrada: true,
            codigoServidor: inputCodigo?.getAttribute('loteria') || codigo,
            procesada: !!tr.querySelector('.status-circle.status-ok'),
            valores: autoBrazilValoresFila(tr),
            duplicados: resultado ? autoBrazilDuplicados(doc, codigo, resultado) : [],
            html,
            doc
        };
        return snapshot;
    }

    function autoBrazilSnapshotVisible(fechaUs, codigo) {
        if (obtenerFechaRover() !== fechaUs) return null;
        const tr = autoBrazilFilaPorCodigo(document, codigo);
        if (!tr) return null;
        return {
            tr,
            procesada: !!tr.querySelector('.status-circle.status-ok'),
            valores: autoBrazilValoresFila(tr)
        };
    }

    function autoBrazilReflejarVisible(fechaUs, codigo, resultado) {
        const visible = autoBrazilSnapshotVisible(fechaUs, codigo);
        if (!visible || autoBrazilHayConflicto(visible.valores, resultado)) return false;
        const inputs = [];
        for (const campo of AUTO_BRAZIL_CAMPOS) {
            const input = visible.tr.querySelector(`input[name="${campo}"]`);
            if (!input) return false;
            const actual = autoBrazilNormalizarCampo(input.value);
            if (actual === '' || actual === resultado[campo]) escribirInput(input, resultado[campo]);
            inputs.push(input);
        }
        resaltarInputs(inputs);
        return true;
    }

    async function autoBrazilResultadosQPlay() {
        const ahora = Date.now();
        if (autoBrazilQPlayCache.promise && ahora - autoBrazilQPlayCache.ts < 10000) {
            return autoBrazilQPlayCache.promise;
        }
        const promise = requestText(QPLAY_URL).then(parseQPlay);
        autoBrazilQPlayCache = { ts: ahora, promise };
        try {
            return await promise;
        } finally {
            setTimeout(() => {
                if (autoBrazilQPlayCache.promise === promise) {
                    autoBrazilQPlayCache = { ts: 0, promise: null };
                }
            }, 10000);
        }
    }

    async function autoBrazilBuscarFuente(codigo, fechaUs) {
        const config = LOTERIAS[codigo];
        const resultados = await autoBrazilResultadosQPlay();
        return resultados.find(r =>
            r.fecha === fechaUs &&
            r.hora.toUpperCase() === config.hora.toUpperCase()
        ) || null;
    }

    async function autoBrazilEnviarProceso(fechaIso, codigoServidor, resultado) {
        return autoBrazilPost('__inc/procesarResultados.php', {
            fecha: fechaIso,
            loteria: codigoServidor,
            primera: resultado.primera,
            segunda: resultado.segunda,
            tercera: resultado.tercera,
            pick3: resultado.pick3,
            pick4: resultado.pick4
        });
    }

    async function autoBrazilVerificarProcesado(fechaUs, codigo, resultado) {
        for (const delay of AUTO_BRAZIL_VERIFY_DELAYS_MS) {
            await autoBrazilEsperar(delay);
            const snap = await autoBrazilConsultarRover(fechaUs, codigo);
            if (!snap.encontrada) continue;
            if (snap.procesada && autoBrazilCoincideCompleto(snap.valores, resultado)) {
                return { estado: 'DONE', snap };
            }
            if (snap.procesada && !autoBrazilCoincideCompleto(snap.valores, resultado)) {
                return { estado: 'CONFLICT', snap };
            }
            if (autoBrazilHayConflicto(snap.valores, resultado)) {
                return { estado: 'CONFLICT', snap };
            }
        }
        return { estado: 'PROCESS_UNCERTAIN' };
    }

    async function autoBrazilProcesarResultado(reloj, codigo, resultado) {
        const visibleInicial = autoBrazilSnapshotVisible(reloj.fechaUs, codigo);
        if (visibleInicial && autoBrazilHayConflicto(visibleInicial.valores, resultado)) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'CONFLICT', resultado,
                motivo: 'Los inputs visibles contienen valores distintos a QPlay.'
            });
            console.warn('[AUTO BRAZIL] CONFLICT visible', codigo, visibleInicial.valores, resultado);
            return;
        }

        const snap = await autoBrazilConsultarRover(reloj.fechaUs, codigo, resultado);
        if (!snap.encontrada) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'ERROR', resultado,
                motivo: 'Rover no devolvió la fila de la lotería.',
                nextAttemptMin: autoBrazilSiguienteMinuto(
                    reloj.minutoDia - AUTO_BRAZIL_CODIGOS[codigo].minuto
                )
            });
            return;
        }

        if (snap.procesada) {
            if (autoBrazilCoincideCompleto(snap.valores, resultado)) {
                autoBrazilReflejarVisible(reloj.fechaUs, codigo, resultado);
                autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                    estado: 'DONE', resultado, procesadoAt: Date.now(), motivo: 'Ya estaba procesada en Rover.'
                });
                console.log('[AUTO BRAZIL] ✅ Ya procesada', codigo);
            } else {
                autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                    estado: 'CONFLICT', resultado,
                    motivo: 'Rover está procesado con valores distintos a QPlay.',
                    rover: snap.valores
                });
                console.warn('[AUTO BRAZIL] CONFLICT procesada', codigo, snap.valores, resultado);
            }
            return;
        }

        if (autoBrazilHayConflicto(snap.valores, resultado)) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'CONFLICT', resultado,
                motivo: 'Rover contiene valores distintos a QPlay.',
                rover: snap.valores
            });
            console.warn('[AUTO BRAZIL] CONFLICT backend', codigo, snap.valores, resultado);
            return;
        }

        if (snap.duplicados.length) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'DUPLICATE', resultado,
                motivo: 'Rover detectaría un resultado duplicado; se requiere revisión manual.',
                duplicados: snap.duplicados
            });
            console.warn('[AUTO BRAZIL] DUPLICATE', codigo, snap.duplicados);
            return;
        }

        const visibleFinal = autoBrazilSnapshotVisible(reloj.fechaUs, codigo);
        if (visibleFinal && autoBrazilHayConflicto(visibleFinal.valores, resultado)) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'CONFLICT', resultado,
                motivo: 'Los inputs visibles cambiaron antes de procesar.'
            });
            console.warn('[AUTO BRAZIL] CONFLICT antes de POST', codigo);
            return;
        }

        autoBrazilReflejarVisible(reloj.fechaUs, codigo, resultado);
        autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
            estado: 'PROCESSING', resultado, processSentAt: Date.now(), codigoServidor: snap.codigoServidor
        });

        console.table([{
            Modo: 'AUTO', Fuente: 'QPlay Brazil', Fecha: reloj.fechaUs, Loteria: codigo,
            Primera: resultado.primera, Segunda: resultado.segunda, Tercera: resultado.tercera,
            Pick3: resultado.pick3, Pick4: resultado.pick4, Accion: 'PROCESS'
        }]);

        let postError = null;
        try {
            await autoBrazilEnviarProceso(reloj.fechaIso, snap.codigoServidor, resultado);
        } catch (error) {
            postError = error;
            console.error('[AUTO BRAZIL] POST incierto; se verificará antes de cualquier otra acción:', error);
        }

        autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
            estado: 'VERIFYING', resultado,
            motivo: postError ? postError.message : ''
        });

        const verificacion = await autoBrazilVerificarProcesado(reloj.fechaUs, codigo, resultado);
        if (verificacion.estado === 'DONE') {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'DONE', resultado, procesadoAt: Date.now(), motivo: ''
            });
            console.log('[AUTO BRAZIL] ✅ Procesado y verificado', codigo, resultado);
        } else if (verificacion.estado === 'CONFLICT') {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'CONFLICT', resultado,
                motivo: 'La verificación posterior encontró valores distintos.',
                rover: verificacion.snap?.valores || null
            });
            console.warn('[AUTO BRAZIL] CONFLICT después de procesar', codigo);
        } else {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'PROCESS_UNCERTAIN', resultado,
                motivo: 'No se pudo confirmar el procesamiento; no se reenviará automáticamente.',
                lastVerifyAt: Date.now()
            });
            console.warn('[AUTO BRAZIL] Estado incierto; NO se repetirá el POST', codigo);
        }
    }

    async function autoBrazilRevisarIncierto(reloj, codigo, estado) {
        if (!estado.resultado) return;
        if (Date.now() - Number(estado.lastVerifyAt || 0) < 120000) return;
        const snap = await autoBrazilConsultarRover(reloj.fechaUs, codigo);
        if (!snap.encontrada) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, { lastVerifyAt: Date.now() });
            return;
        }
        if (snap.procesada && autoBrazilCoincideCompleto(snap.valores, estado.resultado)) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'DONE', procesadoAt: Date.now(), lastVerifyAt: Date.now(), motivo: ''
            });
            console.log('[AUTO BRAZIL] ✅ Confirmación tardía', codigo);
            return;
        }
        if (snap.procesada || autoBrazilHayConflicto(snap.valores, estado.resultado)) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'CONFLICT', lastVerifyAt: Date.now(), rover: snap.valores,
                motivo: 'La comprobación tardía encontró valores distintos.'
            });
            return;
        }
        autoBrazilGuardarEstado(reloj.fechaIso, codigo, { lastVerifyAt: Date.now() });
    }

    async function autoBrazilEvaluarCodigo(reloj, codigo) {
        if (autoBrazilEnCurso.has(codigo)) return;
        const configAuto = AUTO_BRAZIL_CODIGOS[codigo];
        const transcurridos = reloj.minutoDia - configAuto.minuto;
        if (transcurridos < 1) {
            autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                estado: 'WAITING_TIME', nextAttemptMin: 1
            });
            return;
        }

        const estado = autoBrazilLeerEstado(reloj.fechaIso, codigo);
        if (['DONE', 'CONFLICT', 'DUPLICATE'].includes(estado.estado)) return;

        autoBrazilEnCurso.add(codigo);
        try {
            if (estado.estado === 'PROCESS_UNCERTAIN') {
                await autoBrazilRevisarIncierto(reloj, codigo, estado);
                return;
            }

            let resultado = estado.resultado;
            if (!autoBrazilResultadoValido(resultado)) {
                const nextAttemptMin = Number.isFinite(Number(estado.nextAttemptMin))
                    ? Number(estado.nextAttemptMin) : 1;
                if (transcurridos < nextAttemptMin) return;

                autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                    estado: 'SEARCHING', lastSearchAt: Date.now()
                });

                try {
                    resultado = await autoBrazilBuscarFuente(codigo, reloj.fechaUs);
                } catch (error) {
                    autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                        estado: 'ERROR', motivo: error.message,
                        nextAttemptMin: transcurridos + 5
                    });
                    console.error('[AUTO BRAZIL] Error consultando QPlay', codigo, error);
                    return;
                }

                if (!autoBrazilResultadoValido(resultado)) {
                    const siguiente = autoBrazilSiguienteMinuto(transcurridos);
                    autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                        estado: 'WAITING_RESULT', resultado: null,
                        nextAttemptMin: siguiente,
                        motivo: `Resultado todavía no disponible; próximo intento +${siguiente} min.`
                    });
                    console.log(`[AUTO BRAZIL] ${codigo} todavía no disponible; próximo intento +${siguiente} min`);
                    return;
                }

                autoBrazilGuardarEstado(reloj.fechaIso, codigo, {
                    estado: 'RESULT_READY', resultado, foundAt: Date.now(), motivo: ''
                });
                console.log('[AUTO BRAZIL] Resultado encontrado', codigo, resultado);
            }

            await autoBrazilProcesarResultado(reloj, codigo, resultado);
        } finally {
            autoBrazilEnCurso.delete(codigo);
        }
    }

    async function autoBrazilTick() {        if (!AUTO_BRAZIL_ENABLED) return;
        const reloj = autoBrazilAhoraRD();
        for (const codigo of Object.keys(AUTO_BRAZIL_CODIGOS)) {
            autoBrazilEvaluarCodigo(reloj, codigo).catch(error => {
                console.error('[AUTO BRAZIL] Error no controlado', codigo, error);
            });
        }
    }

    function iniciarAutoBrazil() {
        if (!AUTO_BRAZIL_ENABLED) return;
        console.log('[AUTO BRAZIL] ✅ Motor automático activo. Solo procesa sorteos de hoy en RD.');
        autoBrazilTick();
        setInterval(autoBrazilTick, AUTO_BRAZIL_TICK_MS);
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
        if (!esPaginaRoverValida()) return;
        instalarBotones();
        instalarListenerFecha();
    }

    iniciarAutoBrazil();
    iniciar();

    // Rover reemplaza #resultadosLoteria varias veces durante Search/filtros.
    // Agrupamos esas mutaciones y solo reinyectamos si realmente falta algo.
    const REINYECCION_DEBOUNCE_MS = 450;
    let reinyeccionTimer = null;

    function necesitaReinyeccion() {
        if (!esPaginaRoverValida()) return false;

        const fecha = document.querySelector('#fecha');
        if (fecha && !fecha.dataset.rsSourcesListenerInstalled) return true;

        for (const [codigo] of Object.entries(LOTERIAS)) {
            const input = buscarInputLoteria(codigo);
            if (!input) continue;

            const tr = input.closest('tr');
            if (!tr) continue;

            if (!tr.querySelector(`.rs-source-fetch-btn[data-codigo="${codigo}"]`)) {
                return true;
            }
        }

        return false;
    }

    function programarReinyeccion() {
        clearTimeout(reinyeccionTimer);
        reinyeccionTimer = setTimeout(() => {
            reinyeccionTimer = null;
            if (necesitaReinyeccion()) iniciar();
        }, REINYECCION_DEBOUNCE_MS);
    }

    const observer = new MutationObserver(() => programarReinyeccion());
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})();