// Proveedores extraídos sin cambios de Rovs Loterías USA 0.6.7.
    const PROVIDERS = Object.freeze({
        LOTTERYUSA: {
            name: 'LotteryUSA', labels: ['Pick 3', 'Pick 4'],
            consultar: queryLotteryUSA
        },
        FLORIDA_API: createMobileProvider({
            name: 'Florida', games: ['pck3', 'pck4'],
            fetchGame: fetchFloridaGame, parseGame: parseFloridaGame
        }),
        LOUISIANA_API: createMobileProvider({
            name: 'Louisiana', games: [2138, 2139], fetchGame: fetchLouisianaGame,
            parseGame: (data, date, draw, digits) => parseLouisianaGame(data, date, digits)
        }),
        OHIO_API: createMobileProvider({
            name: 'Ohio', games: ['Pick3', 'Pick4'],
            fetchGame: fetchOhioGame, parseGame: parseOhioGame
        }),
        TENNESSEE_API: createMobileProvider({
            name: 'Tennessee', games: ['cash3', 'cash4'], labels: ['Cash 3', 'Cash 4'],
            fetchGame: fetchTennesseeGame, parseGame: parseTennesseeGame
        }),
        INDIANA_API: createMobileProvider({
            name: 'Indiana', games: ['pck3', 'pck4'], labels: ['Daily 3', 'Daily 4'],
            fetchGame: fetchIndianaGame, parseGame: parseIndianaGame
        }),
        GEORGIA_API: createMobileProvider({
            name: 'Georgia', games: ['CASH 3', 'CASH 4'], labels: ['Cash 3', 'Cash 4'],
            fetchGame: fetchGeorgiaGame, parseGame: parseGeorgiaGame
        }),
        ILLINOIS_APP: createMobileProvider({
            name: 'Illinois', games: ['pick3', 'pick4'], source: '📱 App oficial Illinois Lottery',
            fetchGame: fetchIllinoisGame, parseGame: parseIllinoisGame
        })
    });

    function createMobileProvider({ name, games, fetchGame, parseGame, labels = ['Pick 3', 'Pick 4'], source = `📱 API móvil ${name} Lottery` }) {
        return {
            name, labels,
            async consultar(config, dateObj) {
                const [data3, data4] = await Promise.all([
                    fetchGame(games[0], dateObj), fetchGame(games[1], dateObj)
                ]);
                return {
                    p3: parseGame(data3, dateObj, config.sorteo, 3),
                    p4: parseGame(data4, dateObj, config.sorteo, 4),
                    source,
                    requiredGames: ['p3', 'p4']
                };
            }
        };
    }

    // === TRANSPORTE COMPARTIDO ===
    // Cada proveedor conserva sus cabeceras, autenticación y validación de esquema.
    function requestWithGM(options) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET', timeout: 20000, ...options,
                onload: response => {
                    if (response.status === 200) { resolve(response); return; }
                    const error = new Error(`HTTP ${response.status}`);
                    error.status = response.status;
                    reject(error);
                },
                onerror: () => reject(new Error('Error de conexión')),
                ontimeout: () => reject(new Error('Tiempo de espera agotado')),
                onabort: () => reject(new Error('Solicitud cancelada'))
            });
        });
    }

    async function requestJsonWithGM(options, validate = () => true) {
        const response = await requestWithGM(options);
        let data;
        try { data = JSON.parse(response.responseText); }
        catch (_) { throw new Error('JSON inválido'); }
        if (!validate(data)) throw new Error('Respuesta de API inválida');
        return data;
    }


    // === LOTTERYUSA: CONSULTA, PLAN B Y PARSER ===

    async function queryLotteryUSA(config, dateObj) {
        const games = [
            { type: 'P3', key: 'p3', url: config.url3 },
            { type: 'P4', key: 'p4', url: config.url4 }
        ].filter(game => game.url);
        const responses = await Promise.all(games.map(async game => ({
            ...game, html: await fetchWithGM(game.url)
        })));
        const result = { p3: null, p4: null, source: 'Ninguno', requiredGames: games.map(game => game.key) };
        for (const response of responses) {
            const parsed = parseLotteryUSA(response.html, dateObj, config, true, response.type);
            if (parsed[response.key]) result[response.key] = parsed[response.key];
        }
        if (result.p3 || result.p4) result.source = '📂 HISTORIAL (Link Directo)';

        if (games.some(game => !result[game.key])) {
            const mainUrl = deriveMainUrl(config.url3 || config.url4);
            if (mainUrl) {
                try {
                    const html = await fetchWithGM(mainUrl);
                    const parsed = parseLotteryUSA(html, dateObj, config, false, null);
                    for (const game of games) {
                        if (!result[game.key] && parsed[game.key]) result[game.key] = parsed[game.key];
                    }
                    if (result.source === 'Ninguno' && (result.p3 || result.p4)) result.source = '🌍 PORTADA PRINCIPAL (Plan B)';
                } catch (_) {
                    // Un fallo de la portada conserva lo obtenido por enlace directo.
                }
            }
        }
        return result;
    }

    function deriveMainUrl(specificUrl) {
        if (!specificUrl) return null;
        try {
            const parts = specificUrl.split('/');
            if (parts.length >= 5) return parts.slice(0, 4).join('/') + '/';
        } catch(e) { return null; }
        return null;
    }

    function superClean(str) { return str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '') : ""; }

    function rowMatchesDate(dateText, d, monthShort, monthFull, y) {
        const text = dateText.toUpperCase();
        const dayStr = String(d);
        const dayPad = String(d).padStart(2, '0');
        const yearStr = String(y);

        const hasMonth = text.includes(monthShort.toUpperCase()) || text.includes(monthFull.toUpperCase());
        const hasDay   = text.includes(` ${dayStr},`) || text.includes(` ${dayPad},`) || text.includes(` ${dayStr} `) || text.includes(` ${dayPad} `);
        const hasYear  = text.includes(yearStr);

        return hasMonth && hasDay && hasYear;
    }

    function parseLotteryUSA(htmlString, dateObj, config, isDirect, targetType) {
        const d = dateObj.getDate();
        const m = dateObj.getMonth();
        const y = dateObj.getFullYear();
        const monthShort = MONTHS_SHORT[m];
        const monthFull  = MONTHS_EN[m];

        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, "text/html");

        let foundP3 = null; let foundP4 = null;

        const rows = doc.querySelectorAll('tr, .c-result-card, .result-card, .c-results-table__item');

        for (let row of rows) {
            const timeNode = row.querySelector('time');
            const dateText = timeNode ? timeNode.innerText : row.innerText;

            // VALIDACIÓN ESTRICTA: día + mes + año deben coincidir
            if (!rowMatchesDate(dateText, d, monthShort, monthFull, y)) continue;

            let matchedType = null;
            if (!isDirect) {
                // La portada contiene otros juegos del mismo horario (p. ej. Quick Draw).
                // El enlace del juego identifica inequívocamente el Pick 3 o Pick 4.
                const gamePaths = {
                    P3: config.url3 && new URL(config.url3).pathname.replace(/\/+$/, ''),
                    P4: config.url4 && new URL(config.url4).pathname.replace(/\/+$/, '')
                };
                for (const link of row.querySelectorAll('a[href]')) {
                    let path;
                    try { path = new URL(link.href, 'https://www.lotteryusa.com').pathname.replace(/\/+$/, ''); }
                    catch (_) { continue; }
                    if (path === gamePaths.P3) matchedType = 'P3';
                    if (path === gamePaths.P4) matchedType = 'P4';
                }
                if (!matchedType) continue;
            }

            let nums = [];
            const balls = row.querySelectorAll('.c-ball, .c-result-item, .game-result li');
            balls.forEach(b => {
                if (b.closest('.c-result__bonus') || b.closest('.c-bonus-ball')) return;
                const n = b.innerText.trim();
                if (/^\d$/.test(n)) nums.push(n);
            });

            if (nums.length === 0) {
                const digits = row.innerText.match(/\b\d\b/g);
                if (digits) nums = digits;
            }

            // LÓGICA DE ASIGNACIÓN
            const resultType = targetType || matchedType;
            if (resultType === 'P3') {
                if (nums.length === 4) nums = nums.slice(0, 3);
                if (nums.length === 3) foundP3 = nums.join('');
            } else if (resultType === 'P4') {
                if (nums.length === 5) nums = nums.slice(0, 4);
                if (nums.length === 4) foundP4 = nums.join('');
            }

            if (
                (targetType === 'P3' && foundP3) ||
                (targetType === 'P4' && foundP4) ||
                (!targetType && (!config.url3 || foundP3) && (!config.url4 || foundP4))
            ) break;
        }

        return { p3: foundP3, p4: foundP4 };
    }

    function fetchWithGM(url) {
        const finalUrl = url + (url.includes('?') ? '&' : '?') + '_=' + Date.now();
        return requestWithGM({
            url: finalUrl,
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
        }).then(response => response.responseText);
    }


    // === FLORIDA: API MÓVIL OFICIAL ===

    function fetchFloridaGame(gameName) {
        const params = [
            'order=DESC', `game-names=${encodeURIComponent(gameName)}`,
            'page=0', 'size=10', 'previous-draws=10', `_=${Date.now()}`
        ].join('&');
        return requestJsonWithGM({
            url: `https://mobile-fla.lotteryservices.com/api/v2/draw-games/draws/page?${params}`,
            headers: {
                'Accept': 'application/json, text/javascript, */*; q=0.01',
                'X-App-Version': 'v2.1', 'X-Requested-With': 'com.flalottery.FLALOTTERY'
            }
        });
    }

    function parseFloridaGame(data, dateObj, requestedDraw, digitsCount) {
        const draws = Array.isArray(data)
            ? data
            : (data.draws || data.content || data.items || data.results || []);

        if (!Array.isArray(draws)) return null;

        const requestedDate = localDateKey(dateObj);
        const candidates = draws.filter(draw => {
            if (!draw) return false;
            if (floridaDateKey(draw.drawTime) !== requestedDate) return false;
            if (floridaDrawType(draw.closeTime) !== requestedDraw) return false;
            return Boolean(extractFloridaPrimary(draw, digitsCount));
        });

        // Si la API repite una revisión del sorteo, usar la de ID más alto.
        candidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        const draw = candidates[0];
        if (!draw) {
            console.warn(`[Florida API] No se encontró ${requestedDraw} Pick ${digitsCount}`, {
                fechaSolicitada: requestedDate,
                sorteosRecibidos: draws.length
            });
            console.table(draws.map(item => ({
                Juego: item && (item.brandName || item.gameName),
                ID: item && item.id,
                Estado: item && item.status,
                Fecha: item ? floridaDateKey(item.drawTime) : '',
                Sorteo: item ? floridaDrawType(item.closeTime) : '',
                Primary: item ? (extractFloridaPrimary(item, digitsCount) || '—') : '—'
            })));
            return null;
        }

        return extractFloridaPrimary(draw, digitsCount);
    }

    function extractFloridaPrimary(draw, digitsCount) {
        if (!draw || !Array.isArray(draw.results)) return null;

        for (const result of draw.results) {
            const primary = result && result.primary;
            if (!Array.isArray(primary)) continue;

            const digits = primary.map(value => String(value).trim());
            const selected = digits.slice(0, digitsCount);
            if (selected.length === digitsCount && selected.every(n => /^\d$/.test(n))) {
                return selected.join('');
            }
        }
        return null;
    }

    function floridaDrawType(closeTime) {
        if (!closeTime) return null;
        const hour = Number(new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/New_York',
            hour: '2-digit',
            hourCycle: 'h23'
        }).format(new Date(Number(closeTime))));
        return hour < 17 ? 'MIDDAY' : 'EVENING';
    }

    function floridaDateKey(epoch) {
        if (!epoch) return '';
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(new Date(Number(epoch)));
        const get = type => parts.find(part => part.type === type)?.value || '';
        return `${get('year')}-${get('month')}-${get('day')}`;
    }


    // === LOUISIANA: API MÓVIL OFICIAL ===

    function fetchLouisianaGame(gameId, dateObj) {
        // /draw/last excluye el día de la ruta; el día siguiente incluye el solicitado.
        const limit = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate() + 1);
        const datePath = `${limit.getFullYear()}/${limit.getMonth() + 1}/${limit.getDate()}`;
        return requestJsonWithGM({
            url: `https://lalotmobapi.intralot.us/en/mobile/api/v2.0/draw/last/${gameId}/${datePath}?_=${Date.now()}`,
            headers: {
                'Accept': 'application/json', 'Content-Type': 'application/json; charset=UTF-8',
                'MOBILECANVAS': 'mX3a45l9pU-EH18NqmW7690q5dpx37k'
            }
        }, data => data && !data.error && Array.isArray(data.response));
    }

    function parseLouisianaGame(data, dateObj, digitsCount) {
        if (!data || data.error || !Array.isArray(data.response)) return null;
        const requestedDate = localDateKey(dateObj);
        const candidates = data.response.filter(draw =>
            draw && louisianaDateKey(draw.drawDate) === requestedDate &&
            extractLouisianaDigits(draw.results, digitsCount)
        );
        candidates.sort((a, b) => Number(b.drawNumber || 0) - Number(a.drawNumber || 0));
        return candidates.length ? extractLouisianaDigits(candidates[0].results, digitsCount) : null;
    }

    function extractLouisianaDigits(results, digitsCount) {
        if (typeof results !== 'string') return null;
        const digits = results.split(',').map(value => value.trim());
        return digits.length === digitsCount && digits.every(value => /^\d$/.test(value))
            ? digits.join('') : null;
    }

    function louisianaDateKey(epoch) {
        if (!epoch) return '';
        const date = new Date(Number(epoch));
        if (!Number.isFinite(date.getTime())) return '';
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Chicago',
            year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(date);
        const get = type => parts.find(part => part.type === type)?.value || '';
        return `${get('year')}-${get('month')}-${get('day')}`;
    }


    // === OHIO: API MÓVIL OFICIAL Y SESIÓN DEL CLIENTE PÚBLICO ===

    const OHIO_API = {
        baseUrl: 'https://api-solutions.ohiolottery.com/1.0',
        authUrl: 'https://authapi-solutions.ohiolottery.com/1.0/Authentication/Login',
        appVersion: '8.4.0',
        publicUser: 'mobilepublic@mtllc.com',
        publicPassword: "R7V5Sz8@"
    };
    // Sesión pública de la app: compartida por AM/PM y mantenida solo en memoria.
    const ohioSession = { token: '', expiresAt: 0, pending: null, deviceId: '' };


    function getOhioAppToken() {
        if (ohioSession.token && Date.now() < ohioSession.expiresAt) {
            return Promise.resolve(ohioSession.token);
        }
        if (ohioSession.pending) return ohioSession.pending;

        if (!ohioSession.deviceId) ohioSession.deviceId = crypto.randomUUID();
        ohioSession.pending = requestOhioApi(OHIO_API.authUrl, {
            method: 'POST',
            body: {
                userName: OHIO_API.publicUser,
                password: OHIO_API.publicPassword,
                refreshToken: '',
                deviceID: ohioSession.deviceId,
                appVersion: OHIO_API.appVersion,
                isAndroid: true
            }
        }).then(response => {
            const token = response.data.token;
            const minutes = Number(response.data.minutesToExpiration);
            if (typeof token !== 'string' || !token.trim() || !Number.isFinite(minutes) || minutes <= 0) {
                throw new Error('La app no entregó una sesión válida');
            }
            ohioSession.token = token;
            ohioSession.expiresAt = Date.now() + minutes * 60000 * 0.99;
            return token;
        }).finally(() => { ohioSession.pending = null; });
        return ohioSession.pending;
    }

    async function fetchOhioGame(gameName) {
        const token = await getOhioAppToken();
        const url = `${OHIO_API.baseUrl}/Games/DrawGames/${gameName}/GetGameInformation?_=${Date.now()}`;
        const response = await requestOhioApi(url, { token });
        const gameId = gameName === 'Pick3' ? 13 : 14;
        if (response.data.drawGameId !== gameId || !Array.isArray(response.data.draws)) {
            throw new Error(`${gameName}: respuesta de juego inválida`);
        }
        return response;
    }

    function requestOhioApi(url, { method = 'GET', body, token = '' } = {}) {
        const headers = { 'Accept': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        if (body) headers['Content-Type'] = 'application/json-patch+json';
        const invalidateToken = () => {
            if (token && token === ohioSession.token) {
                ohioSession.token = ''; ohioSession.expiresAt = 0;
            }
        };
        return requestJsonWithGM({
            method, url, headers, anonymous: true,
            data: body ? JSON.stringify(body) : undefined
        }, response => {
            if (response && response.statusCode === 401) invalidateToken();
            return response && response.statusCode === 200 && !response.error && response.data;
        }).catch(error => {
            if (error.status === 401) invalidateToken();
            throw error;
        });
    }

    function parseOhioGame(response, dateObj, requestedDraw, digitsCount) {
        const gameId = digitsCount === 3 ? 13 : 14;
        if (!response || response.statusCode !== 200 || response.error ||
            !response.data || response.data.drawGameId !== gameId || !Array.isArray(response.data.draws)) return null;

        const modifier = { MIDDAY: 1, EVENING: 2 }[requestedDraw];
        if (!modifier) return null;
        const requestedDate = localDateKey(dateObj);
        const candidates = response.data.draws.filter(draw => draw &&
            draw.drawGameId === gameId && draw.modifier === modifier &&
            ohioDrawDateKey(draw.drawDate) === requestedDate &&
            extractOhioDigits(draw.numbers, digitsCount)
        );
        candidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        return candidates.length ? extractOhioDigits(candidates[0].numbers, digitsCount) : null;
    }

    function extractOhioDigits(numbers, digitsCount) {
        if (!Array.isArray(numbers)) return null;
        // La posición identifica las cifras primarias; no añadir una bola promocional.
        const selected = numbers.filter(number => number && number.modifier === 0 &&
            Number.isInteger(number.position) && number.position >= 1 && number.position <= digitsCount
        ).sort((a, b) => a.position - b.position);
        if (selected.length !== digitsCount || !selected.every((number, index) =>
            number.position === index + 1 && /^\d$/.test(String(number.value).trim())
        )) return null;
        return selected.map(number => String(number.value).trim()).join('');
    }

    function ohioDrawDateKey(value) {
        // drawDate es una fecha de calendario de Ohio, sin zona, no un instante UTC.
        if (typeof value !== 'string') return '';
        const match = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
        if (!match) return '';
        const date = buildValidLocalDate(Number(match[1]), Number(match[2]), Number(match[3]));
        return date ? localDateKey(date) : '';
    }


    // === TENNESSEE: API MÓVIL OFICIAL E HISTORIAL PAGINADO ===

    const TENNESSEE_API = {
        origin: 'https://tna.p1.awc.lotteryservices.net',
        drawPath: '/api/v2/draw-games/draws/page',
        // Clave pública del cliente móvil, sin cuenta personal ni sesión de usuario.
        appKey: 'bFpklBJyZQa73GNPPHwwqTUb/6QQdfKTf'
    };


    async function fetchTennesseeGame(gameName, dateObj) {
        const requestedDate = localDateKey(dateObj);
        let url = new URL(TENNESSEE_API.drawPath, TENNESSEE_API.origin);
        url.search = new URLSearchParams({
            order: 'DESC', 'game-names': gameName, size: '100', 'previous-draws': '180'
        }).toString();
        const draws = [], visited = new Set();

        // La app pide 180 sorteos; el servicio limita cada página a 100.
        // Seguir solo las páginas necesarias para alcanzar la fecha de Rover.
        for (let page = 0; page < 3; page++) {
            if (visited.has(url.href)) throw new Error(`${gameName}: paginación repetida`);
            visited.add(url.href);
            const data = await requestTennesseePage(url, gameName);
            draws.push(...data.draws);
            const dates = data.draws.map(draw => tennesseeDrawParts(draw.drawTime)?.dateKey).filter(Boolean);
            const oldestDate = dates.sort()[0];
            if (!data.nextItems || !data.draws.length || (oldestDate && oldestDate < requestedDate)) {
                return { draws };
            }

            if (typeof data.nextPageUrl !== 'string' || !data.nextPageUrl) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            const next = new URL(data.nextPageUrl, TENNESSEE_API.origin);
            // La cabecera de la app se envía únicamente a este servicio y juego.
            if (next.origin !== TENNESSEE_API.origin || next.pathname !== TENNESSEE_API.drawPath ||
                next.username || next.password || next.searchParams.get('game-names') !== gameName) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            url = next;
        }
        throw new Error(`${gameName}: historial incompleto`);
    }

    function requestTennesseePage(pageUrl, gameName) {
        const url = new URL(pageUrl.href);
        url.searchParams.set('_', String(Date.now()));
        return requestJsonWithGM({
            url: url.href, anonymous: true,
            headers: { 'Accept': 'application/json', 'x-esa-api-key': TENNESSEE_API.appKey }
        }, data => data && !data.code && !data.error && Array.isArray(data.draws) &&
            data.draws.every(draw => draw && draw.gameName === gameName));
    }

    function parseTennesseeGame(data, dateObj, requestedDraw, digitsCount) {
        if (!data || data.code || data.error || !Array.isArray(data.draws) ||
            !['MORNING', 'MIDDAY', 'EVENING'].includes(requestedDraw)) return null;
        const gameName = digitsCount === 3 ? 'cash3' : 'cash4';
        const dateKey = localDateKey(dateObj);
        const candidates = data.draws.filter(draw => {
            if (!draw || draw.gameName !== gameName) return false;
            const drawDate = tennesseeDrawParts(draw.drawTime);
            const close = tennesseeDrawParts(draw.closeTime);
            if (!drawDate || !close || drawDate.dateKey !== dateKey) return false;
            // Mismos límites horarios que DrawInfoModel de la app, en hora central.
            const drawName = close.hour <= 10 ? 'MORNING' : close.hour <= 13 ? 'MIDDAY' : 'EVENING';
            return drawName === requestedDraw && extractTennesseeDigits(draw.results, digitsCount);
        });
        candidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        return candidates.length ? extractTennesseeDigits(candidates[0].results, digitsCount) : null;
    }

    function extractTennesseeDigits(results, digitsCount) {
        if (!Array.isArray(results) || ![3, 4].includes(digitsCount)) return null;
        // Regular.primary contiene el número completo como texto; conservar ceros.
        // Wild Ball y secondary son resultados adicionales, no cifras del Cash.
        const regular = results.find(result => result && result.prizeTierId === 'Regular');
        const primary = regular?.primary;
        if (!Array.isArray(primary) || primary.length !== 1 || typeof primary[0] !== 'string') return null;
        const digits = primary[0].trim();
        return new RegExp(`^\\d{${digitsCount}}$`).test(digits) ? digits : null;
    }

    function tennesseeDrawParts(epoch) {
        if ((typeof epoch !== 'number' && typeof epoch !== 'string') || !Number.isFinite(Number(epoch)) || Number(epoch) <= 0) return null;
        const date = new Date(Number(epoch));
        if (!Number.isFinite(date.getTime())) return null;
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Chicago', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', hourCycle: 'h23'
        }).formatToParts(date);
        const get = type => parts.find(part => part.type === type)?.value || '';
        return { dateKey: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
    }


    const INDIANA_API = {
        origin: 'https://ins.p1.awc.lotteryservices.net',
        drawPath: '/api/v2/draw-games/draws/page',
        // Clave pública del cliente móvil, sin cuenta personal ni sesión de usuario.
        appKey: 'qpQOqPOvA75mOXx+jUZlhAPXatV1z59EL'
    };


    async function fetchIndianaGame(gameName, dateObj) {
        const requestedDate = localDateKey(dateObj);
        let url = new URL(INDIANA_API.drawPath, INDIANA_API.origin);
        url.search = new URLSearchParams({
            order: 'DESC', 'game-names': gameName, size: '100', 'previous-draws': '180'
        }).toString();
        url.searchParams.set('page', '0');
        url.searchParams.append('status', 'PAYABLE');
        url.searchParams.append('status', 'RESULTS_AVAILABLE');
        const draws = [], visited = new Set();

        // La app pide 180 sorteos; el servicio limita cada página a 100.
        // Seguir solo las páginas necesarias para alcanzar la fecha de Rover.
        for (let page = 0; page < 3; page++) {
            if (visited.has(url.href)) throw new Error(`${gameName}: paginación repetida`);
            visited.add(url.href);
            const data = await requestIndianaPage(url, gameName);
            draws.push(...data.draws);
            const dates = data.draws.map(draw => indianaDrawParts(draw.drawTime)?.dateKey).filter(Boolean);
            const oldestDate = dates.sort()[0];
            if (!data.nextItems || !data.draws.length || (oldestDate && oldestDate < requestedDate)) {
                return { draws };
            }

            if (typeof data.nextPageUrl !== 'string' || !data.nextPageUrl) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            const next = new URL(data.nextPageUrl, INDIANA_API.origin);
            // El parámetro de caché no identifica una página distinta.
            next.searchParams.delete('_');
            // La cabecera de la app se envía únicamente a este servicio y juego.
            if (next.origin !== INDIANA_API.origin || next.pathname !== INDIANA_API.drawPath ||
                next.username || next.password || next.searchParams.get('game-names') !== gameName) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            url = next;
        }
        throw new Error(`${gameName}: historial incompleto`);
    }

    function requestIndianaPage(pageUrl, gameName) {
        const url = new URL(pageUrl.href);
        url.searchParams.set('_', String(Date.now()));
        return requestJsonWithGM({
            url: url.href, anonymous: true,
            headers: { 'Accept': 'application/json', 'x-esa-api-key': INDIANA_API.appKey }
        }, data => data && !data.code && !data.error && Array.isArray(data.draws) &&
            data.draws.every(draw => draw && draw.gameName === gameName));
    }

    function parseIndianaGame(data, dateObj, requestedDraw, digitsCount) {
        if (!data || data.code || data.error || !Array.isArray(data.draws) ||
            !['MIDDAY', 'EVENING'].includes(requestedDraw)) return null;
        const gameName = digitsCount === 3 ? 'pck3' : 'pck4';
        const dateKey = localDateKey(dateObj);
        const candidates = data.draws.filter(draw => {
            if (!draw || draw.gameName !== gameName) return false;
            const drawDate = indianaDrawParts(draw.drawTime);
            const close = indianaDrawParts(draw.closeTime);
            if (!drawDate || !close || drawDate.dateKey !== dateKey) return false;
            // Mismo límite horario que la app Hoosier, en hora del este.
            const drawName = close.hour > 16 ? 'EVENING' : 'MIDDAY';
            return drawName === requestedDraw && extractIndianaDigits(draw.results, digitsCount);
        });
        candidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        return candidates.length ? extractIndianaDigits(candidates[0].results, digitsCount) : null;
    }

    function extractIndianaDigits(results, digitsCount) {
        if (!Array.isArray(results) || ![3, 4].includes(digitsCount)) return null;
        // Regular.primary contiene el número completo como texto; conservar ceros.
        // Superball y secondary son resultados adicionales, no cifras del Daily.
        const regular = results.find(result => result && result.prizeTierId === 'Regular');
        const primary = regular?.primary;
        if (!Array.isArray(primary) || primary.length !== 1 || typeof primary[0] !== 'string') return null;
        const digits = primary[0].trim();
        return new RegExp(`^\\d{${digitsCount}}$`).test(digits) ? digits : null;
    }

    function indianaDrawParts(epoch) {
        if ((typeof epoch !== 'number' && typeof epoch !== 'string') || !Number.isFinite(Number(epoch)) || Number(epoch) <= 0) return null;
        const date = new Date(Number(epoch));
        if (!Number.isFinite(date.getTime())) return null;
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', hourCycle: 'h23'
        }).formatToParts(date);
        const get = type => parts.find(part => part.type === type)?.value || '';
        return { dateKey: `${get('year')}-${get('month')}-${get('day')}`, hour: Number(get('hour')) };
    }


    // === GEORGIA: API MÓVIL OFICIAL E HISTORIAL PAGINADO ===

    const GEORGIA_API = {
        origin: 'https://gas-v2.p1.awc.lotteryservices.net',
        drawPath: '/api/v2/draw-games/draws/page',
        // Clave pública de Georgia Lottery Official App, sin sesión personal.
        appKey: 'AWcLE1rjUGNGmCJthYKHF3FI9bC+7jQVC'
    };

    async function fetchGeorgiaGame(gameName, dateObj) {
        const requestedDate = localDateKey(dateObj);
        let url = new URL(GEORGIA_API.drawPath, GEORGIA_API.origin);
        url.search = new URLSearchParams({
            order: 'DESC', 'game-names': gameName, page: '0', size: '100', 'previous-draws': '180'
        }).toString();
        const draws = [], visited = new Set();

        for (let page = 0; page < 3; page++) {
            if (visited.has(url.href)) throw new Error(`${gameName}: paginación repetida`);
            visited.add(url.href);
            const data = await requestGeorgiaPage(url, gameName);
            draws.push(...data.draws);
            const dates = data.draws.map(draw => georgiaDateKey(draw.drawTime)).filter(Boolean);
            const oldestDate = dates.sort()[0];
            if (!data.nextItems || !data.draws.length || (oldestDate && oldestDate < requestedDate)) {
                return { draws };
            }
            if (typeof data.nextPageUrl !== 'string' || !data.nextPageUrl) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            // URL codifica también los espacios de CASH 3 y CASH 4.
            const next = new URL(data.nextPageUrl, GEORGIA_API.origin);
            next.searchParams.delete('_');
            if (next.origin !== GEORGIA_API.origin || next.pathname !== GEORGIA_API.drawPath ||
                next.username || next.password || next.searchParams.get('game-names') !== gameName) {
                throw new Error(`${gameName}: paginación inválida`);
            }
            url = next;
        }
        throw new Error(`${gameName}: historial incompleto`);
    }

    function requestGeorgiaPage(pageUrl, gameName) {
        const url = new URL(pageUrl.href);
        url.searchParams.set('_', String(Date.now()));
        return requestJsonWithGM({
            url: url.href, anonymous: true,
            headers: { 'Accept': 'application/json', 'x-esa-api-key': GEORGIA_API.appKey }
        }, data => data && !data.code && !data.error && Array.isArray(data.draws) &&
            data.draws.every(draw => draw && draw.gameName === gameName));
    }

    function parseGeorgiaGame(data, dateObj, requestedDraw, digitsCount) {
        if (!data || data.code || data.error || !Array.isArray(data.draws) ||
            !['MIDDAY', 'EVENING', 'NIGHT'].includes(requestedDraw) || ![3, 4].includes(digitsCount)) return null;
        const gameName = digitsCount === 3 ? 'CASH 3' : 'CASH 4';
        const dateKey = localDateKey(dateObj);
        const candidates = data.draws.filter(draw => draw && draw.gameName === gameName &&
            draw.name === requestedDraw && georgiaDateKey(draw.drawTime) === dateKey &&
            ['CLOSED', 'PAYABLE', 'RESULTS_AVAILABLE'].includes(draw.status) &&
            extractGeorgiaDigits(draw.results, digitsCount)
        );
        candidates.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        return candidates.length ? extractGeorgiaDigits(candidates[0].results, digitsCount) : null;
    }

    function extractGeorgiaDigits(results, digitsCount) {
        if (!Array.isArray(results) || ![3, 4].includes(digitsCount)) return null;
        // Georgia entrega cada cifra por separado en Regular.primary.
        const primary = results.find(result => result && result.drawType === 'Regular')?.primary;
        if (!Array.isArray(primary) || primary.length !== digitsCount ||
            !primary.every(digit => typeof digit === 'string' && /^\d$/.test(digit))) return null;
        return primary.join('');
    }

    function georgiaDateKey(epoch) {
        if ((typeof epoch !== 'number' && typeof epoch !== 'string') || !Number.isFinite(Number(epoch)) || Number(epoch) <= 0) return '';
        const date = new Date(Number(epoch));
        if (!Number.isFinite(date.getTime())) return '';
        const parts = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'
        }).formatToParts(date);
        const get = type => parts.find(part => part.type === type)?.value || '';
        return `${get('year')}-${get('month')}-${get('day')}`;
    }


    // === ILLINOIS: FUENTE OFICIAL DE LA APP ===
    // El APK oficial carga mapp.illinoislottery.com. Sus resultados se entregan
    // como HTML, no como JSON; nunca insertar ese documento en la página de Rover.
    async function fetchIllinoisGame(gameCode, dateObj) {
        const dateKey = localDateKey(dateObj);
        const url = new URL(`/dbg/results/${gameCode}`, 'https://mapp.illinoislottery.com');
        url.searchParams.set('dateFrom', dateKey);
        url.searchParams.set('dateTo', dateKey);
        url.searchParams.set('_', String(Date.now()));
        const response = await requestWithGM({
            url: url.href, anonymous: true, headers: { 'Accept': 'text/html' }
        });
        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
        let config;
        try { config = JSON.parse(doc.querySelector('#client-data')?.textContent || '').__exc_server_config__; }
        catch (_) { throw new Error('Respuesta de Illinois inválida'); }
        if (doc.body.id !== `dbg-results-${gameCode}` || config?.gameCode !== gameCode ||
            config.dateFrom !== dateKey || config.dateTo !== dateKey) {
            throw new Error('Respuesta de Illinois inválida');
        }
        return doc;
    }

    function parseIllinoisGame(doc, dateObj, drawName, digits) {
        if (!['MIDDAY', 'EVENING'].includes(drawName) || ![3, 4].includes(digits)) return null;
        const gameCode = `pick${digits}`;
        const dateText = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const text = (row, selector) => row.querySelector(selector)?.textContent.trim().replace(/\s+/g, ' ');
        const rows = [...doc.querySelectorAll(`.dbg-results__list--${gameCode} > [data-test-id^="draw-result-"]`)];
        const results = rows.filter(row =>
            text(row, '[data-test-id^="draw-result-info-date-"]') === dateText &&
            text(row, '[data-test-id^="draw-result-schedule-type-text-"]')?.toUpperCase() === drawName
        ).map(row => {
            const href = row.querySelector('a[data-test-id="draw-result-cell"]')?.getAttribute('href') || '';
            const link = /^\/dbg\/results\/(pick[34])\/draw\/\d+$/.exec(href);
            if (link?.[1] !== gameCode) return null;
            // Fireball figura en ball-secondary y no pertenece al Pick 3/Pick 4.
            const balls = [...row.querySelectorAll('[data-test-id^="ball-primary-"]')].map(ball => ball.textContent.trim());
            return balls.length === digits && balls.every(ball => /^\d$/.test(ball)) ? balls.join('') : null;
        });
        // Si una respuesta contiene datos contradictorios, no elegir una fila al azar.
        const unique = new Set(results);
        return unique.size === 1 ? [...unique][0] : null;
    }
