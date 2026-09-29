// ==UserScript==
// @name         Rs Loterías Rd
// @namespace    rover-loterías-dominicanas
// @version      0.9.7
// @description  Tennessee: Plan B scraping canal YouTube si RSS falla/tarda
// @author       Noe G
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @grant        GM_xmlhttpRequest
// @connect      api.loteriasdominicanas.com
// @connect      qplay777.net
// @connect      api.lotocentral.net
// @connect      test-results.supremeventures.com
// @connect      cp-api.supremegames.com
// @connect      feeds.feedblitz.com
// @connect      sorteosrd.com
// @connect      enloteria.com
// @connect      www.youtube.com
// @connect      loteriasdenicaragua.com
// @connect      api.loteriasdenicaragua.com
// @connect      client-back.temp.kiskooloterias.com
// ==/UserScript==

(function() {
    'use strict';

    const LOTDOM_API_BASE = 'https://api.loteriasdominicanas.com/dominicana/site-companies';

    const LOTDOM_IDS = {
        'primeraam':      '6966a6d2ea7015c3b8a3d5bd',
        'primerapm':      '6966a6d2ea7015c3b8a3d5bd',
        'kinglotteryam':  '6966a6d3ea7015c3b8a3d643',
        'kinglotterypm':  '6966a6d3ea7015c3b8a3d643',
        'suerteam':       '6966a6d3ea7015c3b8a3d5e0',
        'suertepm':       '6966a6d3ea7015c3b8a3d5e0',
        'pale':           '6966a6d1ea7015c3b8a3d44a',
        'loteka':         '6966a6d2ea7015c3b8a3d4d4',
        'nacional':       '6966a6d1ea7015c3b8a3d479',
        'ganamas':        '6966a6d1ea7015c3b8a3d479',
        'real':           '6966a6d2ea7015c3b8a3d4a5',
        'nuevayol':       '6966a6d2ea7015c3b8a3d4a5',
        'floridaam':      '6966a6d2ea7015c3b8a3d564',
        'floridapm':      '6966a6d2ea7015c3b8a3d564',
        'newyorkam':      '6966a6d2ea7015c3b8a3d52f',
        'newyorkpm':      '6966a6d2ea7015c3b8a3d52f',
        'anguilla':       '6966a6d3ea7015c3b8a3d60e',
        'anguilla1pm':    '6966a6d3ea7015c3b8a3d60e',
        'anguilla6pm':    '6966a6d3ea7015c3b8a3d60e',
        'anguilla9pm':    '6966a6d3ea7015c3b8a3d60e',
        // LoteDom
        'lotedom':        '6966a6d3ea7015c3b8a3d5f1',
        'quemaito':       '6966a6d3ea7015c3b8a3d5f1',
        // La Primera (Quinielón)
        'quinielonAM':    '6966a6d2ea7015c3b8a3d5bd',
        'quinielonPM':    '6966a6d2ea7015c3b8a3d5bd',
    };

    // siteGame._id directo — más robusto que seo.url (no se rompe si cambian los slugs)
    const LOTDOM_GAME_ID = {
        'primeraam':     '6966a6d2ea7015c3b8a3d5c3',  // La Primera Día
        'primerapm':     '6966a6d2ea7015c3b8a3d5c9',  // Primera Noche
        'kinglotteryam': { pick3: '6966a6d3ea7015c3b8a3d655', pick4: '6966a6d3ea7015c3b8a3d661' },  // Pick 3 Día / Pick 4 Día
        'kinglotterypm': { pick3: '6966a6d3ea7015c3b8a3d65b', pick4: '6966a6d3ea7015c3b8a3d667' },  // Pick 3 Noche / Pick 4 Noche
        'suerteam':      '6966a6d3ea7015c3b8a3d5e6',  // La Suerte 12:30
        'suertepm':      '6966a6d3ea7015c3b8a3d5ec',  // La Suerte 18:00
        'pale':          '6966a6d1ea7015c3b8a3d456',  // Quiniela Leidsa (Pale)
        'loteka':        '6966a6d2ea7015c3b8a3d4da',  // Quiniela Loteka
        'nacional':      '6966a6d1ea7015c3b8a3d47f',  // Lotería Nacional
        'ganamas':       '6966a6d2ea7015c3b8a3d485',  // Gana Más
        'real':          '6966a6d2ea7015c3b8a3d4b1',  // Quiniela Real
        'nuevayol':      '6966a6d2ea7015c3b8a3d4cf',  // Nueva Yol Real
        'floridaam':     { pick3: '6966a6d2ea7015c3b8a3d594', pick4: '6966a6d2ea7015c3b8a3d588' },  // Pick 3 Dia / Pick 4 Dia
        'floridapm':     { pick3: '6966a6d2ea7015c3b8a3d59a', pick4: '6966a6d2ea7015c3b8a3d58e' },  // Pick 3 Noche / Pick 4 Noche
        'newyorkam':     { pick3: '6966a6d2ea7015c3b8a3d541', pick4: '6966a6d2ea7015c3b8a3d535' },  // Numbers Medio Día / Win 4 Medio Día
        'newyorkpm':     { pick3: '6966a6d2ea7015c3b8a3d547', pick4: '6966a6d2ea7015c3b8a3d53b' },  // Numbers Noche / Win 4 Noche
        'anguilla':      '6966a6d3ea7015c3b8a3d638',  // Anguila Mañana (10AM)
        'anguilla1pm':   '6966a6d3ea7015c3b8a3d614',  // Anguila Medio Día
        'anguilla6pm':   '6966a6d3ea7015c3b8a3d61a',  // Anguila Tarde
        'anguilla9pm':   '6966a6d3ea7015c3b8a3d620',  // Anguila Noche
        // LoteDom
        'lotedom':       '6966a6d3ea7015c3b8a3d5f7',  // Quiniela LoteDom
        'quemaito':      '6966a6d3ea7015c3b8a3d5fd',  // El Quemaito Mayor
        // La Primera — Quinielón
        'quinielonAM':   '6966a6d2ea7015c3b8a3d5d5',  // El Quinielón Día
        'quinielonPM':   '6966a6d2ea7015c3b8a3d5db',  // El Quinielón Noche
    };

    const LOTERIAS = {
        'tennesseeMorning': {
            nombre: '🎲 Tennessee Morning', codigoRover: 'TENNESSEE MORNING', codigoRoverCorto: 'TN-AM',
            tipo: 'youtubeRSS', turno: 'Morning', categoria: 'dia'
        },

        'brazil12pm': {
            nombre: '🎲 Brazil 12PM', codigoRover: 'BRAZIL 12PM', codigoRoverCorto: 'BRAZIL12PM',
            tipo: 'qplay', url: 'https://qplay777.net/', hora: '12:00pm', categoria: 'dia'
        },
        'premier12pm': {
            nombre: '🎲 Premier Lotto 12PM', codigoRover: 'PREMIERLOTTO 12PM', codigoRoverCorto: 'PREMIER12PM',
            tipo: 'premier', url: 'https://api.lotocentral.net/api/v1/homepage/historical_results',
            textoWeb: 'Premier Lotto 12PM', categoria: 'dia'
        },
        'lotedom': {
            nombre: '🎲 LoteDom', codigoRover: 'LOTEDOM', codigoRoverCorto: 'LOTEDOM',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'quemaito': {
            nombre: '🎲 El Quemaito Mayor', codigoRover: 'EL QUEMAITO MAYOR', codigoRoverCorto: 'EQM',
            tipo: 'lotdomAPIUnico', categoria: 'dia'
        },
        'primeraam': {
            nombre: '🎲 Primera Dia', codigoRover: 'LA PRIMERA', codigoRoverCorto: 'LPM',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'quinielonAM': {
            nombre: '🎲 El Quinielón AM', codigoRover: 'EL QUINIELON AM', codigoRoverCorto: 'EQN-AM',
            tipo: 'lotdomAPIUnico', categoria: 'dia'
        },
        'kinglotteryam': {
            nombre: '🎲 King Lottery AM', codigoRover: 'KING LOTTERY AM', codigoRoverCorto: 'KING-AM',
            tipo: 'lotdomAPIPick', categoria: 'dia'
        },
        'suerteam': {
            nombre: '🎲 La Suerte Dia', codigoRover: 'LA SUERTE', codigoRoverCorto: 'LA-SUERTE',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'nuevayol': {
            nombre: '🎲 Nueva Yol Real', codigoRover: 'NUEVA YOL REAL', codigoRoverCorto: 'NYREAL',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'real': {
            nombre: '🎲 Lotería Real', codigoRover: 'LOTERIA REAL', codigoRoverCorto: 'LTR',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'pennsylvaniaAM': {
            nombre: '🎲 Pennsylvania AM', codigoRover: 'PENNSYLV AM', codigoRoverCorto: 'PA-AM',
            tipo: 'rss',
            urlPick3: 'https://feeds.feedblitz.com/PennsylvaniaLottery-WinningNumbers-DailyNumberMid-Day',
            urlPick4: 'https://feeds.feedblitz.com/PennsylvaniaLottery-WinningNumbers-Big4Mid-Day',
            categoria: 'dia'
        },
        
        'tennesseeMidday': {
            nombre: '🎲 Tennessee Midday', codigoRover: 'TENNESSEE MIDDAY', codigoRoverCorto: 'TN-MD',
            tipo: 'youtubeRSS', turno: 'Midday', categoria: 'dia'
        },
        'floridaam': {
            nombre: '🎲 Florida AM', codigoRover: 'FLORIDA AM', codigoRoverCorto: 'FL-AM',
            tipo: 'lotdomAPIPick', categoria: 'dia'
        },
        'newyorkam': {
            nombre: '🎲 New York AM', codigoRover: 'NEW YORK AM', codigoRoverCorto: 'NY-AM',
            tipo: 'lotdomAPIPick', categoria: 'dia'
        },
        'mangosam': {
            nombre: '🥭 Mangos AM', codigoRover: 'MANGOS AM', codigoRoverCorto: 'MANGOS-AM',
            tipo: 'mangos', categoria: 'dia',
            derivadas: [
                { codigoRover: 'EXTRA MIDDAY', codigoRoverCorto: 'EX-MD',
                  pick3: (p3,p4)=>p4.slice(0,3), pick4: null,
                  primera:(p3,p4)=>p4.slice(0,2), segunda:(p3,p4)=>p4.slice(1,3), tercera:null },
                { codigoRover: 'NY-BK AM', codigoRoverCorto: 'NYBK-AM',
                  pick3:(p3,p4)=>p4.slice(1,4), pick4:null,
                  primera:(p3,p4)=>p4.slice(1,3), segunda:(p3,p4)=>p4.slice(2,4), tercera:null },
                { codigoRover: 'NY-BP AM', codigoRoverCorto: 'NYBP-AM',
                  pick3:null, pick4:null,
                  primera:(p3,p4)=>p4.slice(2,4), segunda:null, tercera:null },
                { codigoRover: 'NY-FP AM', codigoRoverCorto: 'NYFP-AM',
                  pick3:null, pick4:null,
                  primera:(p3,p4)=>p4.slice(0,2), segunda:null, tercera:null }
            ]
        },
        'massmidday': {
            nombre: '🎲 Mass Midday', codigoRover: 'MASSACHUSETTS MIDDAY', codigoRoverCorto: 'MA-MD',
            tipo: 'massmidday', categoria: 'dia',
            derivadas: [
                { codigoRover:'MASSACHUSETTS MIDDAY', codigoRoverCorto:'MA-MD',
                  pick3:null, pick4:null,
                  primera:(p4)=>p4.slice(0,2), segunda:(p4)=>p4.slice(1,3), tercera:(p4)=>p4.slice(2,4) },
                { codigoRover:'MASS MD P3B', codigoRoverCorto:'MA-MD-P3B',
                  pick3:(p4)=>p4.slice(1,4), pick4:(p4)=>p4,
                  primera:()=>'X', segunda:()=>'X', tercera:()=>'X' },
                { codigoRover:'MASS MD P3F', codigoRoverCorto:'MA-MD-P3F',
                  pick3:(p4)=>p4.slice(0,3), pick4:(p4)=>p4,
                  primera:()=>'X', segunda:()=>'X', tercera:()=>'X' }
            ]
        },
        'ganamas': {
            nombre: '🎲 Gana Más', codigoRover: 'GANA MAS', codigoRoverCorto: 'GMS',
            tipo: 'lotdomAPI', categoria: 'dia'
        },
        'brazil03pm': {
            nombre: '🎲 Brazil 03PM', codigoRover: 'BRAZIL 03PM', codigoRoverCorto: 'BRAZIL03PM',
            tipo: 'qplay', url: 'https://qplay777.net/', hora: '3:00pm', categoria: 'dia'
        },
        'premier03pm': {
            nombre: '🎲 Premier Lotto 03PM', codigoRover: 'PREMIERLOTTO 03PM', codigoRoverCorto: 'PREMIER03PM',
            tipo: 'premier', url: 'https://api.lotocentral.net/api/v1/homepage/historical_results',
            textoWeb: 'Premier Lotto 3PM', categoria: 'dia'
        },
        'suertepm': {
            nombre: '🎲 La Suerte Noche', codigoRover: 'LA SUERTE', codigoRoverCorto: '(SUERTE-PM)',
            tipo: 'lotdomAPI', categoria: 'noche'
        },

        'tennesseeEvening': {
            nombre: '🎲 Tennessee Evening', codigoRover: 'TENNESSEE EVENING', codigoRoverCorto: 'TN-EVEN',
            tipo: 'youtubeRSS', turno: 'Evening', categoria: 'noche'
        },
        'kinglotterypm': {
            nombre: '🎲 King Lottery PM', codigoRover: 'KING LOTTERY PM', codigoRoverCorto: 'KING-PM',
            tipo: 'lotdomAPIPick', categoria: 'noche'
        },
        'primerapm': {
            nombre: '🎲 Primera Noche', codigoRover: 'LA PRIMERA NOCHE', codigoRoverCorto: '(LPM-PM)',
            tipo: 'lotdomAPI', categoria: 'noche'
        },
        'quinielonPM': {
            nombre: '🎲 El Quinielón PM', codigoRover: 'EL QUINIELON PM', codigoRoverCorto: 'EQN-PM',
            tipo: 'lotdomAPIUnico', categoria: 'noche'
        },
        'pale': {
            nombre: '🎲 Quiniela Pale', codigoRover: 'QUINIELA PALE', codigoRoverCorto: '(QPL)',
            tipo: 'lotdomAPI', categoria: 'noche'
        },
        'nacional': {
            nombre: '🎲 Lotería Nacional', codigoRover: 'NACIONAL', codigoRoverCorto: 'LTN',
            tipo: 'lotdomAPI', categoria: 'noche'
        },
        'brazil07pm': {
            nombre: '🎲 Brazil 07PM', codigoRover: 'BRAZIL 07PM', codigoRoverCorto: 'BRAZIL07PM',
            tipo: 'qplay', url: 'https://qplay777.net/', hora: '7:00pm', categoria: 'noche'
        },
        'brazil08pm': {
            nombre: '🎲 Brazil 08PM', codigoRover: 'BRAZIL 08PM', codigoRoverCorto: 'BRAZIL08PM',
            tipo: 'qplay', url: 'https://qplay777.net/', hora: '8:00pm', categoria: 'noche'
        },
        'premier07pm': {
            nombre: '🎲 Premier Lotto 07PM', codigoRover: 'PREMIERLOTTO 07PM', codigoRoverCorto: 'PREMIER07PM',
            tipo: 'premier', url: 'https://api.lotocentral.net/api/v1/homepage/historical_results',
            textoWeb: 'Premier Lotto 7PM', categoria: 'noche'
        },
        'premier08pm': {
            nombre: '🎲 Premier Lotto 08PM', codigoRover: 'PREMIERLOTTO 08PM', codigoRoverCorto: 'PREMIER08PM',
            tipo: 'premier', url: 'https://api.lotocentral.net/api/v1/homepage/historical_results',
            textoWeb: 'Premier Lotto 8PM', categoria: 'noche'
        },
        'floridapm': {
            nombre: '🎲 Florida PM', codigoRover: 'FLORIDA PM', codigoRoverCorto: 'FL-PM',
            tipo: 'lotdomAPIPick', categoria: 'noche'
        },
        'newyorkpm': {
            nombre: '🎲 New York PM', codigoRover: 'NEW YORK PM', codigoRoverCorto: 'NY-PM',
            tipo: 'lotdomAPIPick', categoria: 'noche'
        },
        'anguilla8am':  { nombre:'🇦🇮 Anguilla 8AM',  codigoRover:'ANGUILLA 8AM',  codigoRoverCorto:'ANG-8AM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla9am':  { nombre:'🇦🇮 Anguilla 9AM',  codigoRover:'ANGUILLA 9AM',  codigoRoverCorto:'ANG-9AM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla':     { nombre:'🇦🇮 Anguilla 10AM', codigoRover:'ANGUILLA 10AM', codigoRoverCorto:'ANGUILLA-10AM', tipo:'lotdomAPI', categoria:'anguilla' },
        'anguilla11am': { nombre:'🇦🇮 Anguilla 11AM', codigoRover:'ANGUILLA 11AM', codigoRoverCorto:'ANG-11AM',      tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla12pm': { nombre:'🇦🇮 Anguilla 12PM', codigoRover:'ANGUILLA 12PM', codigoRoverCorto:'ANG-12PM',      tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla1pm':  { nombre:'🇦🇮 Anguilla 1PM',  codigoRover:'ANGUILLA 1PM',  codigoRoverCorto:'ANGUILLA-1PM',  tipo:'lotdomAPI', categoria:'anguilla' },
        'anguilla2pm':  { nombre:'🇦🇮 Anguilla 2PM',  codigoRover:'ANGUILLA 2PM',  codigoRoverCorto:'ANG-2PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla3pm':  { nombre:'🇦🇮 Anguilla 3PM',  codigoRover:'ANGUILLA 3PM',  codigoRoverCorto:'ANG-3PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla4pm':  { nombre:'🇦🇮 Anguilla 4PM',  codigoRover:'ANGUILLA 4PM',  codigoRoverCorto:'ANG-4PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla5pm':  { nombre:'🇦🇮 Anguilla 5PM',  codigoRover:'ANGUILLA 5PM',  codigoRoverCorto:'ANG-5PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla6pm':  { nombre:'🇦🇮 Anguilla 6PM',  codigoRover:'ANGUILLA 6PM',  codigoRoverCorto:'ANGUILLA-6PM',  tipo:'lotdomAPI', categoria:'anguilla' },
        'anguilla7pm':  { nombre:'🇦🇮 Anguilla 7PM',  codigoRover:'ANGUILLA 7PM',  codigoRoverCorto:'ANG-7PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla8pm':  { nombre:'🇦🇮 Anguilla 8PM',  codigoRover:'ANGUILLA 8PM',  codigoRoverCorto:'ANG-8PM',       tipo:'sorteosrd', categoria:'anguilla' },
        'anguilla9pm':  { nombre:'🇦🇮 Anguilla 9PM',  codigoRover:'ANGUILLA 9PM',  codigoRoverCorto:'ANGUILLA-9PM',  tipo:'lotdomAPI', categoria:'anguilla' },
        'anguilla10pm': { nombre:'🇦🇮 Anguilla 10PM', codigoRover:'ANGUILLA 10PM', codigoRoverCorto:'ANG-10PM',      tipo:'sorteosrd', categoria:'anguilla' },
        'jamaicaearlybird': { nombre:'🇯🇲 Jamaica Earlybird',   codigoRover:'JAMAICA EARLYBIRD', codigoRoverCorto:'JM-EARLYBIRD', tipo:'jamaica', textoWeb:'EARLYBIRD', categoria:'jamaica' },
        'jamaicamorning':   { nombre:'🇯🇲 Jamaica Morning',     codigoRover:'JAMAICA MORNING',   codigoRoverCorto:'JM-MORNING',   tipo:'jamaica', textoWeb:'MORNING',   categoria:'jamaica' },
        'jamaicamidday':    { nombre:'🇯🇲 Jamaica Midday',      codigoRover:'JAMAICA MIDDAY',    codigoRoverCorto:'JM-MIDDAY',    tipo:'jamaica', textoWeb:'MIDDAY',    categoria:'jamaica' },
        'jamaicadrivetime': { nombre:'🇯🇲 Jamaica Drive Time',  codigoRover:'JAMAICA DRIVETIME', codigoRoverCorto:'JM-DRIVETIME', tipo:'jamaica', textoWeb:'DRIVETIME', categoria:'jamaica' },
        'jamaicaevening':   { nombre:'🇯🇲 Jamaica Evening',     codigoRover:'JAMAICA EVENING',   codigoRoverCorto:'JM-EVENING',   tipo:'jamaica', textoWeb:'EVENING',   categoria:'jamaica' },
        'haitibolet930am':  { nombre:'🇭🇹 Haiti B 9:30 AM',  codigoRover:'PRUEBAS FELIX ',        codigoRoverCorto:'PB-FELIX',       tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'9:30 AM',  categoria:'haitibolet' },
        'haitibolet1030am': { nombre:'🇭🇹 Haiti B 10:30 AM', codigoRover:'SP-ANG9AM-ANG5PM ',     codigoRoverCorto:'SP-ANG9AM-ANG5PM',tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'10:30 AM', categoria:'haitibolet' },
        'haitibolet1130am': { nombre:'🇭🇹 Haiti B 11:30 AM', codigoRover:'SP ANGUILLA2PM - LOTEDOM',codigoRoverCorto:'SP-ANG2PM-LOT', tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'11:30 AM', categoria:'haitibolet' },
        'nicaragua11am': { nombre:'🇳🇮 Nica 11AM', codigoRover:'NICA 11AM', codigoRoverCorto:'NICA-11AM', tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 12:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601e99', slug:'diaria-11-am' },
        'nicaragua3pm':  { nombre:'🇳🇮 Nica 3pm',  codigoRover:'NICA 3PM',  codigoRoverCorto:'NICA-3PM',  tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 15:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601ebd', slug:'diaria-3-pm'  },
        'nicaragua9pm':  { nombre:'🇳🇮 Nica 9pm',  codigoRover:'NICA 9PM',  codigoRoverCorto:'NICA-9PM',  tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 21:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601ed6', slug:'diaria-9-pm'  },
        'honduras11am': { nombre:'🇭🇳 Hond 11AM', codigoRover:'LA DIARIA 11AM', codigoRoverCorto:'LD11', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 11:00 AM', categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b31', slug:'la-diaria-10am' },
        'honduras3pm':  { nombre:'🇭🇳 Hond 3PM',  codigoRover:'LA DIARIA 03PM', codigoRoverCorto:'LD03', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 3:00 PM',  categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b07', slug:'la-diaria-2pm'  },
        'honduras9pm':  { nombre:'🇭🇳 Hond 9PM',  codigoRover:'LA DIARIA 09PM', codigoRoverCorto:'LD09', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 9:00 PM',  categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b1f', slug:'la-diaria-9pm'  }
    };

    // ==========================================
    // MENÚ
    // ==========================================
    function crearMenu() {
        const contenedor = document.createElement('div');
        contenedor.id = 'menu-loteria-script';
        contenedor.style.cssText = 'position:fixed;top:100px;right:20px;z-index:10000';

        const botonMenu = document.createElement('button');
        botonMenu.innerHTML = '🎰 COPIAR LOTERÍAS ▼';
        botonMenu.style.cssText = 'padding:10px 15px;background:#4CAF50;color:white;border:none;border-radius:6px;font-size:13px;font-weight:bold;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.2);white-space:nowrap';

        const menuDesplegable = document.createElement('div');
        menuDesplegable.style.cssText = 'display:none;background:white;border-radius:6px;box-shadow:0 2px 8px rgba(0,0,0,0.15);margin-top:5px;overflow:hidden;max-height:350px;overflow-y:auto;width:fit-content;min-width:220px';

        const categorias = {
            'dia':        { titulo:'☀️ DÍA',         items:[] },
            'noche':      { titulo:'🌙 NOCHE',        items:[] },
            'anguilla':   { titulo:'🇦🇮 ANGUILLA',    items:[] },
            'jamaica':    { titulo:'🇯🇲 JAMAICA',     items:[] },
            'haitibolet': { titulo:'🇭🇹 HAITI BOLET', items:[] },
            'diarias':    { titulo:'🌎 DIARIAS',       items:[] }
        };

        Object.keys(LOTERIAS).forEach(key => {
            categorias[LOTERIAS[key].categoria].items.push({ key, loteria: LOTERIAS[key] });
        });

        ['dia','noche','anguilla','jamaica','haitibolet','diarias'].forEach(cat => {
            if (categorias[cat].items.length === 0) return;

            const header = document.createElement('div');
            header.innerHTML = `<span style="display:inline-block;width:15px;">▶</span> ${categorias[cat].titulo}`;
            header.style.cssText = 'padding:10px 12px;background:#f8f9fa;color:#495057;font-size:12px;font-weight:bold;border-bottom:1px solid #dee2e6;cursor:pointer;user-select:none;transition:background 0.2s;white-space:nowrap;box-sizing:border-box';

            const itemsContainer = document.createElement('div');
            itemsContainer.style.cssText = 'display:none;background:white';

            categorias[cat].items.forEach(({ key, loteria }) => {
                const opcion = document.createElement('button');
                opcion.innerHTML = loteria.nombre;
                opcion.style.cssText = 'display:block;width:100%;padding:8px 12px 8px 30px;background:white;color:#333;border:none;border-bottom:1px solid #eee;cursor:pointer;font-size:12px;text-align:left;transition:background 0.2s;white-space:nowrap;box-sizing:border-box';
                opcion.onmouseover = () => opcion.style.background = '#f0f0f0';
                opcion.onmouseout  = () => opcion.style.background = 'white';
                opcion.onclick = (e) => {
                    e.stopPropagation();
                    menuDesplegable.style.display = 'none';
                    botonMenu.innerHTML = '🎰 COPIAR LOTERÍAS ▼';
                    copiarLoteria(key);
                };
                itemsContainer.appendChild(opcion);
            });

            header.onclick = (e) => {
                e.stopPropagation();
                const isVisible = itemsContainer.style.display === 'block';
                itemsContainer.style.display = isVisible ? 'none' : 'block';
                header.querySelector('span').textContent = isVisible ? '▶' : '▼';
            };
            header.onmouseover = () => header.style.background = '#e9ecef';
            header.onmouseout  = () => header.style.background = '#f8f9fa';

            menuDesplegable.appendChild(header);
            menuDesplegable.appendChild(itemsContainer);
        });

        botonMenu.onclick = (e) => {
            e.stopPropagation();
            const visible = menuDesplegable.style.display === 'block';
            menuDesplegable.style.display = visible ? 'none' : 'block';
            botonMenu.innerHTML = visible ? '🎰 COPIAR LOTERÍAS ▼' : '🎰 COPIAR LOTERÍAS ▲';
        };

        document.addEventListener('click', () => {
            menuDesplegable.style.display = 'none';
            botonMenu.innerHTML = '🎰 COPIAR LOTERÍAS ▼';
        });

        contenedor.appendChild(botonMenu);
        contenedor.appendChild(menuDesplegable);
        document.body.appendChild(contenedor);

        const bw = Math.ceil(botonMenu.getBoundingClientRect().width);
        if (bw) menuDesplegable.style.minWidth = bw + 'px';
    }

    // ==========================================
    // FECHA — legacy para qplay/premier/jamaica/etc.
    // ==========================================
    function obtenerFechaHoy() {
        const hoy = new Date();
        const dia = String(hoy.getDate()).padStart(2,'0');
        const mes = String(hoy.getMonth()+1).padStart(2,'0');
        const meses   = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const mesesEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return {
            formatoRover:     `${mes}/${dia}/${hoy.getFullYear()}`,
            formatoWeb:       `${dia}-${mes}`,
            formatoLoteriard: `${parseInt(dia)} de ${meses[hoy.getMonth()]}, ${hoy.getFullYear()}`,
            formatoQplay:     `${mes}/${dia}/${hoy.getFullYear()}`,
            formatoPremier:   `${hoy.getFullYear()}-${mes}-${dia}`,
            formatoJamaica:   `${parseInt(dia)} ${mesesEn[hoy.getMonth()]} ${hoy.getFullYear()}`,
            formatoLotDomISO: `${hoy.getFullYear()}-${mes}-${dia}T04:00:00.000Z`
        };
    }

    // ==========================================
    // FECHA DINÁMICA — lee input #fecha de Rover
    // Usado por lotdomAPI y lotdomAPIPick
    // ==========================================
    function obtenerFechaDesdeInput() {
        const inputFecha = document.getElementById('fecha');
        let fecha;
        if (inputFecha && inputFecha.value && /^\d{2}\/\d{2}\/\d{4}$/.test(inputFecha.value.trim())) {
            const [mes, dia, anio] = inputFecha.value.trim().split('/');
            fecha = new Date(Number(anio), Number(mes)-1, Number(dia));
        } else {
            fecha = new Date();
        }
        const dia  = String(fecha.getDate()).padStart(2,'0');
        const mes  = String(fecha.getMonth()+1).padStart(2,'0');
        const anio = fecha.getFullYear();
        const meses   = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
        const mesesEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        return {
            formatoRover:     `${mes}/${dia}/${anio}`,
            formatoWeb:       `${dia}-${mes}`,
            formatoLoteriard: `${parseInt(dia)} de ${meses[fecha.getMonth()]}, ${anio}`,
            formatoQplay:     `${mes}/${dia}/${anio}`,
            formatoPremier:   `${anio}-${mes}-${dia}`,
            formatoJamaica:   `${parseInt(dia)} ${mesesEn[fecha.getMonth()]} ${anio}`,
            formatoLotDomISO: `${anio}-${mes}-${dia}T04:00:00.000Z`
        };
    }

    // ==========================================
    // LOG
    // ==========================================
    function logTablaResultado({ loteria, fecha, resultado, estado, sonDeHoy }) {
        console.table([{ 'Lotería': loteria, 'Fecha': fecha, 'Resultado': resultado, 'Estado': estado, 'Son de hoy': sonDeHoy }]);
    }

    // ==========================================
    // DISPATCHER
    // ==========================================
    function copiarLoteria(tipo) {
        const lot = LOTERIAS[tipo];
        const btn = document.querySelector('#menu-loteria-script button');
        btn.disabled = true;

        if (lot.tipo === 'lotdomAPI')     return copiarLoteriaLotDomAPI(tipo, lot, btn);
        if (lot.tipo === 'lotdomAPIUnico') return copiarLoteriaLotDomAPIUnico(tipo, lot, btn);
        if (lot.tipo === 'lotdomAPIPick') return copiarLoteriaLotDomAPIPick(tipo, lot, btn);
        if (lot.tipo === 'mangos')        return copiarLoteriaMangos(lot, btn);
        if (lot.tipo === 'massmidday')    return copiarLoteriaMassMidday(lot, btn);
        if (lot.tipo === 'qplay')         return copiarLoteriaQplay(lot, btn);
        if (lot.tipo === 'premier')       return copiarLoteriaPremier(lot, btn);
        if (lot.tipo === 'jamaica')       return copiarLoteriaJamaica(lot, btn);
        if (lot.tipo === 'sorteosrd')     return copiarLoteriaSorteosRd(lot, btn);
        if (lot.tipo === 'rss')           return copiarLoteriaRSS(lot, btn);
        if (lot.tipo === 'youtubeRSS')    return copiarLoteriaYoutubeRSS(lot, btn);
        if (lot.tipo === 'haitibolet')    return copiarLoteriaHaitiBolet(lot, btn);
        if (lot.tipo === 'nicaragua')     return copiarLoteriaNicaragua(lot, btn);
        if (lot.tipo === 'honduras')      return copiarLoteriaHonduras(lot, btn);
        mostrarMensaje(btn, '❌ Tipo no reconocido', '#f44336');
    }

    // ==========================================
    // LOTDOM API — Quiniela normal
    // llenarCampos retorna bool → log exacto sin segunda búsqueda
    // ==========================================
    function copiarLoteriaLotDomAPI(key, lot, btn) {
        const f       = obtenerFechaDesdeInput();
        const compId  = LOTDOM_IDS[key];
        const gameId = LOTDOM_GAME_ID[key];

        if (!compId || !gameId) { mostrarMensaje(btn, '❌ ID/URL no configurado', '#f44336'); return; }

        const apiUrl = `${LOTDOM_API_BASE}/${compId}?date=${encodeURIComponent(f.formatoLotDomISO)}&limit=2`;

        GM_xmlhttpRequest({
            method: 'GET', url: apiUrl,
            headers: { 'Accept': 'application/json' },
            timeout: 20000,
            onload: r => {
                try {
                    const data      = JSON.parse(r.responseText);
                    const siteGames = data.siteGames || [];
                    const sg        = siteGames.find(g => g._id === gameId);

                    if (!sg) {
                        console.warn(`[LotDomAPI] ⚠️ ${lot.nombre} — siteGame "${gameId}" no hallado`);
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'siteGame no hallado', sonDeHoy: '—' });
                        mostrarMensaje(btn, '❌ Sorteo no hallado en API', '#f44336');
                        return;
                    }

                    const sessions = sg.game && sg.game.sessions ? sg.game.sessions : [];
                    const session  = sessions[0];

                    if (!session) {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Sin sesión', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Sin resultados aún', '#ff9800');
                        return;
                    }

                    const sessionDate = (session.date || '').slice(0, 10);
                    const fechaISO    = f.formatoLotDomISO.slice(0, 10);
                    const esDeHoy     = sessionDate === fechaISO;

                    if (!esDeHoy) {
                        console.warn(`[LotDomAPI] ⚠️ ${lot.nombre} — fecha sesión ${sessionDate} ≠ solicitada ${fechaISO}`);
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Fecha incorrecta', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Resultados no son de la fecha seleccionada', '#ff9800');
                        return;
                    }

                    const score = session.score && session.score[0] ? session.score[0] : [];
                    const p = score[0] || null;
                    const s = score[1] || null;
                    const t = score[2] || null;

                    if (p && s && t) {
                        // llenarCampos retorna true/false → el log usa ese valor directamente
                        const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
                        logTablaResultado({
                            loteria:   lot.nombre,
                            fecha:     f.formatoRover,
                            resultado: `${p}-${s}-${t}`,
                            estado:    ok ? '✅ Copiado' : '⚠️ Fila no visible',
                            sonDeHoy:  true
                        });
                    } else {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Números incompletos', sonDeHoy: true });
                        mostrarMensaje(btn, '❌ Números incompletos', '#f44336');
                    }
                } catch(e) {
                    console.error(`[LotDomAPI] Error ${lot.nombre}:`, e.message);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Error', sonDeHoy: '—' });
                    mostrarMensaje(btn, '❌ ERROR', '#f44336');
                }
            },
            onerror:   () => mostrarMensaje(btn, '❌ ERROR DE CONEXIÓN', '#f44336'),
            ontimeout: () => mostrarMensaje(btn, '❌ TIMEOUT', '#f44336')
        });
    }

    // ==========================================
    // LOTDOM API PICK — Pick3/Pick4
    // llenarCamposPick retorna bool → log exacto sin segunda búsqueda
    // ==========================================
    function copiarLoteriaLotDomAPIPick(key, lot, btn) {
        const f        = obtenerFechaDesdeInput();
        const compId   = LOTDOM_IDS[key];
        const gameIds = LOTDOM_GAME_ID[key];

        if (!compId || !gameIds || !gameIds.pick3 || !gameIds.pick4) {
            mostrarMensaje(btn, '❌ ID/URL no configurado', '#f44336'); return;
        }

        const apiUrl = `${LOTDOM_API_BASE}/${compId}?date=${encodeURIComponent(f.formatoLotDomISO)}&limit=2`;

        GM_xmlhttpRequest({
            method: 'GET', url: apiUrl,
            headers: { 'Accept': 'application/json' },
            timeout: 20000,
            onload: r => {
                try {
                    const data      = JSON.parse(r.responseText);
                    const siteGames = data.siteGames || [];
                    const fechaISO  = f.formatoLotDomISO.slice(0, 10);

                    function extraerScore(siteGameId) {
                        const sg = siteGames.find(g => g._id === siteGameId);
                        if (!sg) return null;
                        const sessions = sg.game && sg.game.sessions ? sg.game.sessions : [];
                        const session  = sessions[0];
                        if (!session) return null;
                        if ((session.date || '').slice(0,10) !== fechaISO) return null;
                        return session.score && session.score[0] ? session.score[0] : null;
                    }

                    const score3 = extraerScore(gameIds.pick3);
                    const score4 = extraerScore(gameIds.pick4);

                    if (!score3 && !score4) {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Fecha incorrecta', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Resultados no son de la fecha seleccionada', '#ff9800');
                        return;
                    }
                    if (!score3 || !score4) {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '⚠️ Parcial', estado: 'Parcial', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Resultados parciales', '#ff9800');
                        return;
                    }

                    const p3 = score3.slice(0,3).join('');
                    const p4 = score4.slice(0,4).join('');

                    if (!/^\d{3}$/.test(p3) || !/^\d{4}$/.test(p4)) {
                        console.warn(`[LotDomAPIPick] ⚠️ ${lot.nombre} — formatos inválidos p3="${p3}" p4="${p4}"`);
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `p3=${p3}|p4=${p4}`, estado: 'Formato inválido', sonDeHoy: false });
                        mostrarMensaje(btn, '❌ Formato inválido', '#f44336');
                        return;
                    }

                    // llenarCamposPick retorna true/false → log exacto
                    const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
                    logTablaResultado({
                        loteria:   lot.nombre,
                        fecha:     f.formatoRover,
                        resultado: `Pick3:${p3} | Pick4:${p4}`,
                        estado:    ok ? '✅ Copiado' : '⚠️ Fila no visible',
                        sonDeHoy:  true
                    });
                } catch(e) {
                    console.error(`[LotDomAPIPick] Error ${lot.nombre}:`, e.message);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Error', sonDeHoy: '—' });
                    mostrarMensaje(btn, '❌ ERROR', '#f44336');
                }
            },
            onerror:   () => mostrarMensaje(btn, '❌ ERROR DE CONEXIÓN', '#f44336'),
            ontimeout: () => mostrarMensaje(btn, '❌ TIMEOUT', '#f44336')
        });
    }


    // ==========================================
    // LOTDOM API ÚNICO — 1 solo bolo (Quemaito, Quinielón)
    // score[0][0] = número ganador (ej: [['75']] → '75')
    // ==========================================
    function copiarLoteriaLotDomAPIUnico(key, lot, btn) {
        const f       = obtenerFechaDesdeInput();
        const compId  = LOTDOM_IDS[key];
        const gameId  = LOTDOM_GAME_ID[key];

        if (!compId || !gameId) { mostrarMensaje(btn, '❌ ID no configurado', '#f44336'); return; }

        const apiUrl = `${LOTDOM_API_BASE}/${compId}?date=${encodeURIComponent(f.formatoLotDomISO)}&limit=2`;

        GM_xmlhttpRequest({
            method: 'GET', url: apiUrl,
            headers: { 'Accept': 'application/json' },
            timeout: 20000,
            onload: r => {
                try {
                    const data      = JSON.parse(r.responseText);
                    const siteGames = data.siteGames || [];
                    const sg        = siteGames.find(g => g._id === gameId);

                    if (!sg) {
                        console.warn(`[LotDomAPIUnico] ⚠️ ${lot.nombre} — siteGame "${gameId}" no hallado`);
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'siteGame no hallado', sonDeHoy: '—' });
                        mostrarMensaje(btn, '❌ Sorteo no hallado en API', '#f44336');
                        return;
                    }

                    const sessions = sg.game && sg.game.sessions ? sg.game.sessions : [];
                    const session  = sessions[0];

                    if (!session) {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Sin sesión', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Sin resultados aún', '#ff9800');
                        return;
                    }

                    const sessionDate = (session.date || '').slice(0, 10);
                    const fechaISO    = f.formatoLotDomISO.slice(0, 10);
                    const esDeHoy     = sessionDate === fechaISO;

                    if (!esDeHoy) {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Fecha incorrecta', sonDeHoy: false });
                        mostrarMensaje(btn, '⚠️ Resultados no son de la fecha seleccionada', '#ff9800');
                        return;
                    }

                    // score es [['75']] — extraer score[0][0]
                    const scoreRaw = session.score && session.score[0] ? session.score[0] : null;
                    const numero   = Array.isArray(scoreRaw) ? (scoreRaw[0] || null) : (scoreRaw || null);
                    const numStr   = numero ? String(numero).padStart(2, '0') : null;

                    if (numStr) {
                        const ok = llenarCampoUnico(lot, numStr, f.formatoRover, btn);
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numStr, estado: ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy: true });
                    } else {
                        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Número no encontrado', sonDeHoy: true });
                        mostrarMensaje(btn, '❌ Número no encontrado', '#f44336');
                    }
                } catch(e) {
                    console.error(`[LotDomAPIUnico] Error ${lot.nombre}:`, e.message);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Error', sonDeHoy: '—' });
                    mostrarMensaje(btn, '❌ ERROR', '#f44336');
                }
            },
            onerror:   () => mostrarMensaje(btn, '❌ ERROR DE CONEXIÓN', '#f44336'),
            ontimeout: () => mostrarMensaje(btn, '❌ TIMEOUT', '#f44336')
        });
    }

    // ==========================================
    // MASS MIDDAY
    // ==========================================
    function copiarLoteriaMassMidday(lot, btn) {
        let pick4Fuente = null;
        for (const fila of document.querySelectorAll('tr')) {
            const texto = fila.textContent;
            if (texto.includes('MASSACHUSETTS MIDDAY') || (texto.includes('MA-MD') && !texto.includes('MA-MD-P3'))) {
                const ip4 = fila.querySelector('input[name="pick4"]');
                if (ip4) pick4Fuente = ip4.value.trim();
                break;
            }
        }
        if (!pick4Fuente || !/^\d{4}$/.test(pick4Fuente)) {
            mostrarMensaje(btn, '⚠️ MA-MD: ingresa el pick4 primero', '#ff9800'); return;
        }
        const f  = obtenerFechaHoy();
        const cf = document.getElementById('fecha');
        if (cf) { cf.value = f.formatoRover; cf.dispatchEvent(new Event('input',{bubbles:true})); cf.dispatchEvent(new Event('change',{bubbles:true})); }

        let filladasOk = 0;
        for (const derivada of lot.derivadas) {
            let filaDestino = null;
            for (const fila of document.querySelectorAll('tr')) {
                if (fila.textContent.includes(derivada.codigoRover) || fila.textContent.includes(derivada.codigoRoverCorto)) { filaDestino = fila; break; }
            }
            if (!filaDestino) continue;
            const campos  = { pick3: filaDestino.querySelector('input[name="pick3"]'), pick4: filaDestino.querySelector('input[name="pick4"]'), primera: filaDestino.querySelector('input[name="primera"]'), segunda: filaDestino.querySelector('input[name="segunda"]'), tercera: filaDestino.querySelector('input[name="tercera"]') };
            const valores = { pick3: derivada.pick3?derivada.pick3(pick4Fuente):null, pick4: derivada.pick4?derivada.pick4(pick4Fuente):null, primera: derivada.primera?derivada.primera(pick4Fuente):null, segunda: derivada.segunda?derivada.segunda(pick4Fuente):null, tercera: derivada.tercera?derivada.tercera(pick4Fuente):null };
            for (const [campo, input] of Object.entries(campos)) {
                if (!input) continue;
                const valor = valores[campo];
                if (valor !== null) { input.value = valor; ['input','change','blur'].forEach(ev => input.dispatchEvent(new Event(ev,{bubbles:true}))); input.style.cssText = 'background:#d4edda;border-color:#28a745'; }
            }
            filladasOk++;
        }
        setTimeout(() => {
            for (const derivada of lot.derivadas) {
                for (const fila of document.querySelectorAll('tr')) {
                    if (fila.textContent.includes(derivada.codigoRover) || fila.textContent.includes(derivada.codigoRoverCorto)) {
                        fila.querySelectorAll('input[name="primera"],input[name="segunda"],input[name="tercera"],input[name="pick3"],input[name="pick4"]').forEach(i => { i.style.background=''; i.style.borderColor=''; }); break;
                    }
                }
            }
        }, 2000);
        if (filladasOk > 0) mostrarMensaje(btn, `✅ ¡COPIADO! (${filladasOk} loterías)`, '#2196F3');
        else                 mostrarMensaje(btn, '⚠️ Filas no visibles (quitar filtros)', '#ff9800');
    }

    // ==========================================
    // MANGOS AM
    // ==========================================
    function copiarLoteriaMangos(lot, btn) {
        let pick3Fuente = null, pick4Fuente = null;
        for (const fila of document.querySelectorAll('tr')) {
            const texto = fila.textContent;
            if (texto.includes('NEW YORK AM') || texto.includes('NY-AM')) {
                const ip3 = fila.querySelector('input[name="pick3"]');
                const ip4 = fila.querySelector('input[name="pick4"]');
                if (ip3 && ip4) { pick3Fuente = ip3.value.trim(); pick4Fuente = ip4.value.trim(); }
                break;
            }
        }
        if (!pick3Fuente || !pick4Fuente || !/^\d{3}$/.test(pick3Fuente) || !/^\d{4}$/.test(pick4Fuente)) {
            mostrarMensaje(btn, '⚠️ NY-AM sin resultados aún', '#ff9800'); return;
        }
        const f  = obtenerFechaHoy();
        const cf = document.getElementById('fecha');
        if (cf) { cf.value = f.formatoRover; cf.dispatchEvent(new Event('input',{bubbles:true})); cf.dispatchEvent(new Event('change',{bubbles:true})); }

        let filladasOk = 0;
        for (const derivada of lot.derivadas) {
            let filaDestino = null;
            for (const fila of document.querySelectorAll('tr')) {
                if (fila.textContent.includes(derivada.codigoRover) || fila.textContent.includes(derivada.codigoRoverCorto)) { filaDestino = fila; break; }
            }
            if (!filaDestino) continue;
            const campos  = { pick3: filaDestino.querySelector('input[name="pick3"]'), pick4: filaDestino.querySelector('input[name="pick4"]'), primera: filaDestino.querySelector('input[name="primera"]'), segunda: filaDestino.querySelector('input[name="segunda"]'), tercera: filaDestino.querySelector('input[name="tercera"]') };
            const valores = { pick3: derivada.pick3?derivada.pick3(pick3Fuente,pick4Fuente):null, pick4: derivada.pick4?derivada.pick4(pick3Fuente,pick4Fuente):null, primera: derivada.primera?derivada.primera(pick3Fuente,pick4Fuente):null, segunda: derivada.segunda?derivada.segunda(pick3Fuente,pick4Fuente):null, tercera: derivada.tercera?derivada.tercera(pick3Fuente,pick4Fuente):null };
            for (const [campo, input] of Object.entries(campos)) {
                if (!input) continue;
                const valor = valores[campo];
                if (valor !== null) { input.value = valor; ['input','change','blur'].forEach(ev => input.dispatchEvent(new Event(ev,{bubbles:true}))); input.style.cssText = 'background:#d4edda;border-color:#28a745'; }
            }
            filladasOk++;
        }
        setTimeout(() => {
            for (const derivada of lot.derivadas) {
                for (const fila of document.querySelectorAll('tr')) {
                    if (fila.textContent.includes(derivada.codigoRover) || fila.textContent.includes(derivada.codigoRoverCorto)) {
                        fila.querySelectorAll('input[name="primera"],input[name="segunda"],input[name="tercera"],input[name="pick3"],input[name="pick4"]').forEach(i => { i.style.background=''; i.style.borderColor=''; }); break;
                    }
                }
            }
        }, 2000);
        if (filladasOk > 0) mostrarMensaje(btn, `✅ ¡COPIADO! (${filladasOk} loterías)`, '#2196F3');
        else                 mostrarMensaje(btn, '⚠️ Filas no visibles (quitar filtros)', '#ff9800');
    }

    // ==========================================
    // JAMAICA
    // ==========================================
    function copiarLoteriaJamaica(lot, btn) {
        const f    = obtenerFechaHoy();
        const draw = String(lot.textoWeb || '').toUpperCase().trim();
        const drawLabels = { 'EARLYBIRD':'Early Bird (8:30 AM)', 'MORNING':'Morning (10:30 AM)', 'MIDDAY':'Midday (1:00 PM)', 'DRIVETIME':'Drive Time (5:00 PM)', 'EVENING':'Evening (8:25 PM)' };
        const drawLabel = drawLabels[draw];
        if (!drawLabel) { mostrarMensaje(btn, '❌ Sorteo no válido', '#f44336'); return; }

        const t0 = Date.now(), LOG = `[Jamaica ${draw}]`;
        let p3 = null, p4 = null, finalizado = false, verificacionProgramada = false;

        function finalizarSiListo(origen) {
            if (finalizado) return;
            if (p3 && p4) {
                finalizado = true;
                const dt = ((Date.now()-t0)/1000).toFixed(2);
                const p = p3.slice(-2), s = p4.slice(0,2), t = p4.slice(-2);
                console.log(`${LOG} ✅ Listo en ${dt}s | ${origen} | Pick3=${p3} | Pick4=${p4}`);
                guardarCacheJamaica(f.formatoPremier, draw, p3, p4, origen);
                llenarCamposPick(lot, p3, p4, f.formatoRover, btn, p, s, t);
                if (/^Plan B/.test(origen) || /^Plan C/.test(origen)) programarVerificacionPlanA();
            }
        }

        function leerCacheJamaica(fechaISO, drawKey) {
            try { const raw = localStorage.getItem('rs_jamaica_cache_v1'); if (!raw) return null; const obj = JSON.parse(raw); return (obj && obj[fechaISO] && obj[fechaISO][drawKey]) ? obj[fechaISO][drawKey] : null; } catch(e) { return null; }
        }
        function guardarCacheJamaica(fechaISO, drawKey, pick3, pick4, fuente) {
            try { const raw = localStorage.getItem('rs_jamaica_cache_v1'); const obj = raw ? JSON.parse(raw) : {}; if (!obj[fechaISO]) obj[fechaISO] = {}; obj[fechaISO][drawKey] = { pick3, pick4, fuente, ts: Date.now() }; const keys = Object.keys(obj).sort(); while (keys.length > 2) { const k = keys.shift(); delete obj[k]; } localStorage.setItem('rs_jamaica_cache_v1', JSON.stringify(obj)); } catch(e) {}
        }

        const cache = leerCacheJamaica(f.formatoPremier, draw);
        if (cache && cache.pick3 && cache.pick4) console.log(`${LOG} 📦 Cache disponible: Pick3=${cache.pick3} | Pick4=${cache.pick4}`);

        const timeToSearch = drawLabel;

        function intentarLandingPage() {
            GM_xmlhttpRequest({ method:'GET', url:'https://cp-api.supremegames.com/api/svgames-landing-page', headers:{'Accept':'application/json'}, timeout:12000,
                onload: (response) => {
                    try {
                        if (response.status !== 200) return;
                        const data = JSON.parse(response.responseText); const gameList = data && data.gameList; if (!Array.isArray(gameList)) return;
                        const pick3Item = gameList.find(g => String(g.gameId)==='5'); const pick4Item = gameList.find(g => String(g.gameId)==='6');
                        const ld3 = pick3Item && pick3Item.lastDrawDetails; const ld4 = pick4Item && pick4Item.lastDrawDetails;
                        const ok3 = ld3 && String(ld3.gameNumber||'').toUpperCase()===draw && String(ld3.gameDate)===f.formatoPremier;
                        const ok4 = ld4 && String(ld4.gameNumber||'').toUpperCase()===draw && String(ld4.gameDate)===f.formatoPremier;
                        if (ok3 && Array.isArray(ld3.gameResult) && ld3.gameResult.length===3) { const v=ld3.gameResult.join('').replace(/\s+/g,''); if(/^\d{3}$/.test(v)) p3=p3||v; }
                        if (ok4 && Array.isArray(ld4.gameResult) && ld4.gameResult.length===4) { const v=ld4.gameResult.join('').replace(/\s+/g,''); if(/^\d{4}$/.test(v)) p4=p4||v; }
                        if (p3||p4) finalizarSiListo('Plan B (SVGames LandingPage)');
                    } catch(e) {}
                }, onerror:()=>{}, ontimeout:()=>{}
            });
        }
        function intentarSVPick3() {
            GM_xmlhttpRequest({ method:'GET', url:'https://test-results.supremeventures.com/public/game/result/gameId/7/no/6', headers:{'Accept':'application/json','Authorization':'Bearer dMRwmGYPbpe28zts2z8rGdCjbIWU8FSTcMsoTQoT','Origin':'https://supremeventures.com','Referer':'https://supremeventures.com/'}, timeout:25000,
                onload:(response)=>{ try { if(response.status!==200) return; const data=JSON.parse(response.responseText); const arr=data&&data['Pick 3']; if(!Array.isArray(arr)) return; const s=arr.find(i=>i.gameDate===f.formatoPremier&&i.gameTime===timeToSearch); if(s&&s.gameResult&&s.gameResult.winNumber){const v=String(s.gameResult.winNumber).trim();if(/^\d{3}$/.test(v))p3=p3||v;finalizarSiListo('Plan A (SV TestResults)');} }catch(e){} },
                onerror:()=>{}, ontimeout:()=>{}
            });
        }
        function intentarSVPick4() {
            GM_xmlhttpRequest({ method:'GET', url:'https://test-results.supremeventures.com/public/game/result/gameId/8/no/6', headers:{'Accept':'application/json','Authorization':'Bearer dMRwmGYPbpe28zts2z8rGdCjbIWU8FSTcMsoTQoT','Origin':'https://supremeventures.com','Referer':'https://supremeventures.com/'}, timeout:25000,
                onload:(response)=>{ try { if(response.status!==200) return; const data=JSON.parse(response.responseText); const arr=data&&data['Pick 4']; if(!Array.isArray(arr)) return; const s=arr.find(i=>i.gameDate===f.formatoPremier&&i.gameTime===timeToSearch); if(s&&s.gameResult&&s.gameResult.winNumber){const v=String(s.gameResult.winNumber).trim();if(/^\d{4}$/.test(v))p4=p4||v;finalizarSiListo('Plan A (SV TestResults)');} }catch(e){} },
                onerror:()=>{}, ontimeout:()=>{}
            });
        }
        function programarVerificacionPlanA() {
            if (verificacionProgramada) return; verificacionProgramada = true;
            const intentarComparar = (tipo, intento) => {
                const isPick3 = tipo==='P3';
                const url = isPick3 ? 'https://test-results.supremeventures.com/public/game/result/gameId/7/no/6' : 'https://test-results.supremeventures.com/public/game/result/gameId/8/no/6';
                GM_xmlhttpRequest({ method:'GET', url, headers:{'Accept':'application/json','Authorization':'Bearer dMRwmGYPbpe28zts2z8rGdCjbIWU8FSTcMsoTQoT','Origin':'https://supremeventures.com','Referer':'https://supremeventures.com/'}, timeout:12000,
                    onload:(response)=>{ try { if(response.status!==200) return; const data=JSON.parse(response.responseText); const arr=data&&(isPick3?data['Pick 3']:data['Pick 4']); if(!Array.isArray(arr)) return; const s=arr.find(i=>i.gameDate===f.formatoPremier&&i.gameTime===timeToSearch); const esperado=isPick3?p3:p4; if(!s||!s.gameResult||!s.gameResult.winNumber){if(intento<2)setTimeout(()=>intentarComparar(tipo,intento+1),15000);return;} const obtenido=String(s.gameResult.winNumber).trim(); if(esperado&&obtenido===esperado)console.log(`${LOG} [Verif] ✅ ${tipo} coincide | ${obtenido}`); else if(esperado)console.warn(`${LOG} [Verif] ⚠️ ${tipo} DIFERENTE | Capturado=${esperado} | PlanA=${obtenido}`); }catch(e){} },
                    onerror:()=>{}, ontimeout:()=>{}
                });
            };
            setTimeout(()=>{ intentarComparar('P3',1); intentarComparar('P4',1); }, 6000);
        }

        intentarLandingPage();
        setTimeout(()=>{ if(finalizado) return; if(!p3) intentarSVPick3(); if(!p4) intentarSVPick4(); }, 2500);
        setTimeout(()=>{ if(finalizado) return; if(cache&&cache.pick3&&cache.pick4){p3=p3||cache.pick3;p4=p4||cache.pick4;finalizarSiListo('Plan C (Cache)');return;} if(!p3||!p4) mostrarMensaje(btn,'❌ Jamaica: sin resultado aún','#f44336'); }, 20000);
    }

    // ==========================================
    // RSS (Pennsylvania)
    // ==========================================
    function copiarLoteriaRSS(lot, btn) {
        const f = obtenerFechaHoy();
        let p3=null, p4=null, p3Listo=false, p4Listo=false, fechaP3=null, fechaP4=null;
        function verificarResultados() {
            if (!p3Listo||!p4Listo) return;
            if (p3&&p4) { if(fechaP3!==f.formatoRover||fechaP4!==f.formatoRover){mostrarMensaje(btn,'⚠️ Resultados no son de hoy','#ff9800');return;} const p=p3.slice(-2),s=p4.slice(0,2),t=p4.slice(-2); llenarCamposPick(lot,p3,p4,f.formatoRover,btn,p,s,t); }
            else mostrarMensaje(btn,'❌ No se encontraron números','#f44336');
        }
        GM_xmlhttpRequest({ method:'GET', url:lot.urlPick3+'?t='+Date.now(),
            onload:response=>{ try { if(response.status!==200){p3Listo=true;verificarResultados();return;} const doc=new DOMParser().parseFromString(response.responseText,'text/xml'); if(doc.querySelector('parsererror')){p3Listo=true;verificarResultados();return;} for(let item of doc.querySelectorAll('item')){const titulo=item.querySelector('title')?.textContent||'';const descripcion=item.querySelector('description')?.textContent||'';const fechaMatch=titulo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(fechaMatch){const[_,mes,dia,anio]=fechaMatch;const fechaRSS=`${mes.padStart(2,'0')}/${dia.padStart(2,'0')}/${anio}`;if(fechaRSS===f.formatoRover){const numerosMatch=descripcion.match(/Winning Numbers:[^\d]*(\d)[^\d]+(\d)[^\d]+(\d)/i);if(numerosMatch){p3=numerosMatch[1]+numerosMatch[2]+numerosMatch[3];fechaP3=fechaRSS;break;}}}} p3Listo=true;verificarResultados(); }catch(e){p3Listo=true;verificarResultados();} },
            onerror:()=>{p3Listo=true;verificarResultados();}
        });
        GM_xmlhttpRequest({ method:'GET', url:lot.urlPick4,
            onload:response=>{ try { if(response.status!==200){p4Listo=true;verificarResultados();return;} const doc=new DOMParser().parseFromString(response.responseText,'text/xml'); if(doc.querySelector('parsererror')){p4Listo=true;verificarResultados();return;} for(let item of doc.querySelectorAll('item')){const titulo=item.querySelector('title')?.textContent||'';const descripcion=item.querySelector('description')?.textContent||'';const fechaMatch=titulo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(fechaMatch){const[_,mes,dia,anio]=fechaMatch;const fechaRSS=`${mes.padStart(2,'0')}/${dia.padStart(2,'0')}/${anio}`;if(fechaRSS===f.formatoRover){const numerosMatch=descripcion.match(/Winning Numbers:[^\d]*(\d)[^\d]+(\d)[^\d]+(\d)[^\d]+(\d)/i);if(numerosMatch){p4=numerosMatch[1]+numerosMatch[2]+numerosMatch[3]+numerosMatch[4];fechaP4=fechaRSS;break;}}}} p4Listo=true;verificarResultados(); }catch(e){p4Listo=true;verificarResultados();} },
            onerror:()=>{p4Listo=true;verificarResultados();}
        });
    }

    // ==========================================
    // YOUTUBE RSS (Tennessee Cash3/Cash4)
    // Plan A: Feed RSS  |  Plan B: Página del canal (@TennesseeLottery/videos)
    // ==========================================
    const TENNESSEE_YT_CHANNEL_ID = 'UCjZL1HBaSxyhUs4ASqfuRrQ';

    function copiarLoteriaYoutubeRSS(lot, btn) {
        const f   = obtenerFechaDesdeInput();
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${TENNESSEE_YT_CHANNEL_ID}&t=${Date.now()}`;

        GM_xmlhttpRequest({
            method: 'GET', url,
            timeout: 15000,
            onload: response => {
                try {
                    if (response.status !== 200) {
                        console.warn('[YoutubeRSS] Plan A: status', response.status, '→ Plan B');
                        intentarYouTubeChannelPage(lot, btn, f);
                        return;
                    }
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/xml');
                    if (doc.querySelector('parsererror')) {
                        console.warn('[YoutubeRSS] Plan A: parser error → Plan B');
                        intentarYouTubeChannelPage(lot, btn, f);
                        return;
                    }

                    let p3 = null, p4 = null, encontrado = false;

                    // Namespace Atom para compatibilidad total
                    const entries = doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'entry');
                    for (const entry of entries) {
                        const tituloEl = entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'title')[0];
                        const titulo   = tituloEl ? tituloEl.textContent : '';

                        const regexTurno = new RegExp(`${lot.turno}_C3_C4`, 'i');
                        if (!regexTurno.test(titulo)) continue;

                        const fechaMatch = titulo.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        if (!fechaMatch) continue;
                        const fechaTitulo = `${fechaMatch[1]}/${fechaMatch[2]}/${fechaMatch[3]}`;
                        if (fechaTitulo !== f.formatoRover) continue;

                        // Descripción: probar media:description, luego summary/content
                        let descripcion = '';
                        const mediaDesc = entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'description')[0];
                        if (mediaDesc) {
                            descripcion = mediaDesc.textContent;
                        } else {
                            const alt = entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'summary')[0] ||
                                        entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'content')[0];
                            if (alt) descripcion = alt.textContent;
                        }

                        const m3 = descripcion.match(/Cash3_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);
                        const m4 = descripcion.match(/Cash4_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);

                        if (m3) p3 = m3[1] + m3[2] + m3[3];
                        if (m4) p4 = m4[1] + m4[2] + m4[3] + m4[4];

                        if (p3 && p4) { encontrado = true; break; }
                    }

                    if (!encontrado || !p3 || !p4) {
                        console.warn(`[YoutubeRSS] Plan A: ${lot.nombre} no hallado en RSS → Plan B`);
                        intentarYouTubeChannelPage(lot, btn, f);
                        return;
                    }

                    console.log(`[YoutubeRSS] Plan A ✅ ${lot.nombre} | Pick3=${p3} | Pick4=${p4}`);
                    const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
                    logTablaResultado({
                        loteria:   lot.nombre,
                        fecha:     f.formatoRover,
                        resultado: `Pick3: ${p3} | Pick4: ${p4}`,
                        estado:    ok ? '✅ Copiado' : '⚠️ Fila no visible',
                        sonDeHoy:  true
                    });
                } catch(e) {
                    console.error(`[YoutubeRSS] Plan A Error ${lot.nombre}:`, e.message, '→ Plan B');
                    intentarYouTubeChannelPage(lot, btn, f);
                }
            },
            onerror:   () => {
                console.warn('[YoutubeRSS] Plan A: error de conexión → Plan B');
                intentarYouTubeChannelPage(lot, btn, f);
            },
            ontimeout: () => {
                console.warn('[YoutubeRSS] Plan A: timeout → Plan B');
                intentarYouTubeChannelPage(lot, btn, f);
            }
        });
    }

    // Plan B: Scrapear la página del canal de YouTube via ytInitialData
    function intentarYouTubeChannelPage(lot, btn, f) {
        const channelUrl = `https://www.youtube.com/channel/${TENNESSEE_YT_CHANNEL_ID}/videos`;
        GM_xmlhttpRequest({
            method: 'GET',
            url: channelUrl,
            timeout: 15000,
            onload: response => {
                try {
                    const html = response.responseText;
                    const match = html.match(/var ytInitialData = ({[\s\S]+?});<\/script>/);
                    if (!match) {
                        console.warn('[YoutubeRSS] Plan B: ytInitialData no encontrado');
                        mostrarMensaje(btn, '⚠️ No encontrado (máx. ~1 semana)', '#ff9800');
                        return;
                    }

                    const data = JSON.parse(match[1]);
                    let videos = [];

                    // Navegar por ytInitialData para extraer videoRenderer items
                    const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
                    for (const tab of tabs) {
                        const contents = tab?.tabRenderer?.content?.sectionListRenderer?.contents || [];
                        for (const section of contents) {
                            const items = section?.itemSectionRenderer?.contents || [];
                            for (const item of items) {
                                const renderer = item?.videoRenderer || item?.richItemRenderer?.content?.videoRenderer;
                                if (renderer) {
                                    const title = renderer?.title?.runs?.map(r => r.text).join('') || '';
                                    const videoId = renderer?.videoId || '';
                                    const desc = renderer?.descriptionSnippet?.runs?.map(r => r.text).join('') || '';
                                    videos.push({ title, videoId, desc });
                                }
                            }
                        }
                    }

                    const regexTurno = new RegExp(`${lot.turno}_C3_C4`, 'i');
                    let p3 = null, p4 = null, encontrado = false;

                    for (const video of videos) {
                        if (!regexTurno.test(video.title)) continue;

                        const fechaMatch = video.title.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        if (!fechaMatch) continue;
                        const fechaTitulo = `${fechaMatch[1]}/${fechaMatch[2]}/${fechaMatch[3]}`;
                        if (fechaTitulo !== f.formatoRover) continue;

                        const m3 = video.desc.match(/Cash3_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);
                        const m4 = video.desc.match(/Cash4_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);

                        if (m3) p3 = m3[1] + m3[2] + m3[3];
                        if (m4) p4 = m4[1] + m4[2] + m4[3] + m4[4];

                        if (p3 && p4) {
                            encontrado = true;
                            break;
                        }
                    }

                    if (!encontrado || !p3 || !p4) {
                        console.warn(`[YoutubeRSS] Plan B: ${lot.nombre} — sin video para fecha ${f.formatoRover}`);
                        mostrarMensaje(btn, '⚠️ No encontrado (máx. ~1 semana)', '#ff9800');
                        return;
                    }

                    console.log(`[YoutubeRSS] Plan B ✅ ${lot.nombre} | Pick3=${p3} | Pick4=${p4}`);
                    const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
                    logTablaResultado({
                        loteria:   lot.nombre,
                        fecha:     f.formatoRover,
                        resultado: `Pick3: ${p3} | Pick4: ${p4}`,
                        estado:    ok ? '✅ Copiado' : '⚠️ Fila no visible',
                        sonDeHoy:  true
                    });
                } catch (e) {
                    console.error(`[YoutubeRSS] Plan B Error ${lot.nombre}:`, e.message);
                    mostrarMensaje(btn, '⚠️ No encontrado (máx. ~1 semana)', '#ff9800');
                }
            },
            onerror:   () => {
                console.warn('[YoutubeRSS] Plan B: error de conexión');
                mostrarMensaje(btn, '⚠️ No encontrado (máx. ~1 semana)', '#ff9800');
            },
            ontimeout: () => {
                console.warn('[YoutubeRSS] Plan B: timeout');
                mostrarMensaje(btn, '⚠️ No encontrado (máx. ~1 semana)', '#ff9800');
            }
        });
    }


    // ==========================================
    // ANGUILLA — doble fuente: SorteosRD (Plan A) + EnLoteria.com (Plan B)
    // ==========================================

    // Mapea codigoRoverCorto (ANG-8AM, etc.) → hora en formato SorteosRD y en formato EnLoteria
    const ANGUILLA_HORAS = {
        'ANG-8AM':  { sorteosRd: '8:00 AM',  enLoteria: '8AM'  },
        'ANG-9AM':  { sorteosRd: '9:00 AM',  enLoteria: '9AM'  },
        'ANG-11AM': { sorteosRd: '11:00 AM', enLoteria: '11AM' },
        'ANG-12PM': { sorteosRd: '12:00 PM', enLoteria: '12PM' },
        'ANG-2PM':  { sorteosRd: '2:00 PM',  enLoteria: '2PM'  },
        'ANG-3PM':  { sorteosRd: '3:00 PM',  enLoteria: '3PM'  },
        'ANG-4PM':  { sorteosRd: '4:00 PM',  enLoteria: '4PM'  },
        'ANG-5PM':  { sorteosRd: '5:00 PM',  enLoteria: '5PM'  },
        'ANG-7PM':  { sorteosRd: '7:00 PM',  enLoteria: '7PM'  },
        'ANG-8PM':  { sorteosRd: '8:00 PM',  enLoteria: '8PM'  },
        'ANG-10PM': { sorteosRd: '10:00 PM', enLoteria: '10PM' }
    };

    function copiarLoteriaSorteosRd(lot, btn) {
        const horas = ANGUILLA_HORAS[lot.codigoRoverCorto];
        if (!horas) { mostrarMensaje(btn, '❌ Configuración incorrecta', '#f44336'); return; }
        intentarSorteosRd(lot, btn, horas, () => intentarEnLoteria(lot, btn, horas));
    }

    // Plan A: SorteosRD
    function intentarSorteosRd(lot, btn, horas, onFallback) {
        const f = obtenerFechaHoy();
        let encontrado = false;
        const maxPaginas = 3;

        function extraerHoraExacta(texto) {
            const match = texto.match(/\b(1[0-2]|[1-9]):00\s?(AM|PM)\b/);
            return match ? match[0] : null;
        }

        function buscarEnPagina(numPagina) {
            if (encontrado || numPagina > maxPaginas) {
                if (!encontrado) {
                    console.warn(`[Anguilla] ⚠️ SorteosRD sin resultado para ${lot.codigoRoverCorto} → probando EnLoteria...`);
                    onFallback();
                }
                return;
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url: `https://www.sorteosrd.com/sorteosanguila?page=${numPagina}`,
                timeout: 15000,
                onload: response => {
                    try {
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        let p = null, s = null, t = null, noHoy = false;

                        for (let fila of doc.querySelectorAll('tr')) {
                            const celdas = fila.querySelectorAll('td');
                            if (celdas.length < 2) continue;
                            const fechaTexto = celdas[0].textContent.trim();
                            const horaEncontrada = extraerHoraExacta(fechaTexto);
                            if (horaEncontrada !== horas.sorteosRd) continue;
                            const fechaMatch = fechaTexto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                            if (!fechaMatch) continue;
                            const [_, dia, mes, anio] = fechaMatch;
                            const fechaFormateada = `${mes}/${dia}/${anio}`;
                            if (fechaFormateada !== f.formatoRover) {
                                const fe = new Date(anio, mes - 1, dia);
                                const fh = new Date(f.formatoRover);
                                if (fe < fh) { noHoy = true; break; }
                                continue;
                            }
                            const circulos = celdas[1].querySelectorAll('.circulo-naranja');
                            if (circulos.length >= 3) {
                                p = circulos[0].textContent.trim();
                                s = circulos[1].textContent.trim();
                                t = circulos[2].textContent.trim();
                                encontrado = true;
                                break;
                            }
                        }

                        if (encontrado && p && s && t) {
                            console.log(`[Anguilla] ✅ SorteosRD (Plan A) | ${lot.codigoRoverCorto} = ${p}-${s}-${t}`);
                            llenarCampos(lot, p, s, t, f.formatoRover, btn);
                        } else if (noHoy) {
                            console.warn(`[Anguilla] ⚠️ SorteosRD: resultados viejos → probando EnLoteria...`);
                            onFallback();
                        } else {
                            buscarEnPagina(numPagina + 1);
                        }
                    } catch(e) { buscarEnPagina(numPagina + 1); }
                },
                onerror:   () => buscarEnPagina(numPagina + 1),
                ontimeout: () => buscarEnPagina(numPagina + 1)
            });
        }
        buscarEnPagina(1);
    }

    // Plan B: EnLoteria.com — todos los horarios de Anguilla están en una sola página
    // Estructura real (vista por inspección):
    //   <h5 id="lottery_XXX_name">Anguilla 8AM</h5>
    //   <span class="result-date">Jueves 18 de junio, 2026</span>
    //   <div class="numbers" id="lottery_XXX_numbers_YYYY_MM_DD">
    //     <div class="result-ball"><div class="result-number">82</div></div>  x3
    //   </div>
    function intentarEnLoteria(lot, btn, horas) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: 'https://enloteria.com/resultados-anguilla',
            timeout: 15000,
            onload: response => {
                try {
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                    const f   = obtenerFechaHoy();

                    // Buscar el h5 cuyo texto sea "Anguilla {hora}" (ej: "Anguilla 8AM")
                    const targetTitle = `Anguilla ${horas.enLoteria}`;
                    let tituloEl = null;
                    for (const h5 of doc.querySelectorAll('h5.lottery-name')) {
                        if (h5.textContent.trim() === targetTitle) { tituloEl = h5; break; }
                    }

                    if (!tituloEl) {
                        console.warn(`[Anguilla] ❌ EnLoteria (Plan B): "${targetTitle}" no hallado`);
                        mostrarMensaje(btn, '❌ No se encontraron números', '#f44336');
                        return;
                    }

                    // El bloque del sorteo es el contenedor padre (.text-center) que envuelve título+fecha+números
                    const bloque = tituloEl.closest('.text-center') || tituloEl.parentElement;

                    // Verificar que la fecha sea de hoy: id="lottery_XXX_numbers_YYYY_MM_DD"
                    const numbersDiv = bloque.querySelector('.numbers[id*="_numbers_"]');
                    if (!numbersDiv) {
                        console.warn(`[Anguilla] ⚠️ EnLoteria (Plan B): sin resultado aún para ${targetTitle}`);
                        mostrarMensaje(btn, '⚠️ Resultados no son de hoy', '#ff9800');
                        return;
                    }

                    const idMatch = numbersDiv.id.match(/_numbers_(\d{4})_(\d{2})_(\d{2})$/);
                    if (idMatch) {
                        const [_, anio, mes, dia] = idMatch;
                        const fechaEncontrada = `${mes}/${dia}/${anio}`;
                        if (fechaEncontrada !== f.formatoRover) {
                            console.warn(`[Anguilla] ⚠️ EnLoteria (Plan B): fecha ${fechaEncontrada} ≠ hoy ${f.formatoRover}`);
                            mostrarMensaje(btn, '⚠️ Resultados no son de hoy', '#ff9800');
                            return;
                        }
                    }

                    const numeros = Array.from(numbersDiv.querySelectorAll('.result-number'))
                        .map(n => n.textContent.trim())
                        .filter(n => /^\d{2}$/.test(n));

                    if (numeros.length >= 3) {
                        const [p, s, t] = numeros;
                        console.log(`[Anguilla] ✅ EnLoteria (Plan B) | ${lot.codigoRoverCorto} = ${p}-${s}-${t}`);
                        llenarCampos(lot, p, s, t, f.formatoRover, btn);
                    } else {
                        mostrarMensaje(btn, '❌ No se encontraron números', '#f44336');
                    }
                } catch(e) {
                    console.error('[Anguilla] Error EnLoteria (Plan B):', e.message);
                    mostrarMensaje(btn, '❌ ERROR', '#f44336');
                }
            },
            onerror:   () => mostrarMensaje(btn, '❌ ERROR DE CONEXIÓN', '#f44336'),
            ontimeout: () => mostrarMensaje(btn, '❌ TIMEOUT', '#f44336')
        });
    }

    // ==========================================
    // HAITI BOLET
    // ==========================================
    function copiarLoteriaHaitiBolet(lot, btn) {
        GM_xmlhttpRequest({ method:'GET', url:lot.url,
            onload:r=>{ try {
                const doc=new DOMParser().parseFromString(r.responseText,'text/html'); const f=obtenerFechaHoy(); let p=null,s=null,t=null,fechaEsDeHoy=false,encontradoCard=false;
                for(let card of doc.querySelectorAll('.lottery-card')){ const textoCard=card.textContent; if(textoCard.includes('Haiti Bolet')&&textoCard.includes(lot.textoWeb)){ encontradoCard=true; const elementoFecha=card.querySelector('.fw-bold'); if(elementoFecha){const match=elementoFecha.textContent.trim().match(/(\d{2})\/(\d{2})\/(\d{4})/);if(match){const[_,dia,mes,anio]=match;if(`${mes}/${dia}/${anio}`===f.formatoRover)fechaEsDeHoy=true;}} const numeros=Array.from(card.querySelectorAll('.bolito .numero')).map(b=>b.textContent.trim()).filter(n=>/^\d{2}$/.test(n)); if(numeros.length>=3){p=numeros[0];s=numeros[1];t=numeros[2];break;} } }
                if(!encontradoCard) mostrarMensaje(btn,'❌ No se halló el sorteo','#f44336'); else if(!fechaEsDeHoy) mostrarMensaje(btn,'⚠️ Resultados viejos','#ff9800'); else if(p&&s&&t) llenarCampos(lot,p,s,t,f.formatoRover,btn); else mostrarMensaje(btn,'❌ Números no leídos','#f44336');
            }catch(e){mostrarMensaje(btn,'❌ ERROR DE CÓDIGO','#f44336');} },
            onerror:()=>mostrarMensaje(btn,'❌ ERROR DE CONEXIÓN','#f44336')
        });
    }

    // ==========================================
    // NICARAGUA / HONDURAS
    // ==========================================
    const NICA_API_BASE='https://api.loteriasdenicaragua.com/nicaragua', NICA_TZ='America/Managua';
    const HN_API_BASE='https://client-back.temp.kiskooloterias.com/honduras', HN_TZ='America/Tegucigalpa';

    function gmGetJson(url) { return new Promise((resolve,reject)=>{ GM_xmlhttpRequest({ method:'GET',url,headers:{'Accept':'application/json'}, onload:(r)=>{try{resolve(JSON.parse(r.responseText));}catch(e){reject(e);}}, onerror:(e)=>reject(e), ontimeout:()=>reject(new Error('timeout')), timeout:60000 }); }); }
    function keyInTZ(date,tz) { return new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
    function nicaIsoQueryTomorrow04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:NICA_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); const base=new Date(Date.UTC(y,m-1,d,4,0,0,0)); base.setUTCDate(base.getUTCDate()+1); return base.toISOString(); }
    function hnIsoQueryToday04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:HN_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); return new Date(Date.UTC(y,m-1,d,4,0,0,0)).toISOString(); }
    function hnIsoQueryTomorrow04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:HN_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); const base=new Date(Date.UTC(y,m-1,d,4,0,0,0)); base.setUTCDate(base.getUTCDate()+1); return base.toISOString(); }
    function flattenScoreIds(score) { const out=[]; (function walk(x){if(Array.isArray(x))x.forEach(walk);else if(typeof x==='string'||typeof x==='number')out.push(String(x));})(score); return out; }
    function buildIdToTextMapFromScoreLayout(scoreLayout,idSet) { const map=new Map(); (function walk(x){if(Array.isArray(x))return x.forEach(walk);if(!x||typeof x!=='object')return;if(Array.isArray(x.options)){for(const opt of x.options){if(opt?.id&&idSet.has(opt.id)&&opt.text)map.set(opt.id,opt.text);}}for(const k of Object.keys(x))walk(x[k]);})(scoreLayout); return map; }
    function extractWinnerText(game,session) { if(!game||!session?.score)return null; const scoreIds=flattenScoreIds(session.score); if(!scoreIds.length)return null; const direct=scoreIds.find(t=>/^\d{1,2}\s+\S/.test(t)); if(direct)return direct; const set=new Set(scoreIds); const idToText=buildIdToTextMapFromScoreLayout(game.score_layout,set); const texts=scoreIds.map(id=>idToText.get(id)).filter(Boolean); return texts.find(t=>/^\d{1,2}\s+\S/.test(t))||null; }
    function pickNicaCandidate(detailJson,now=new Date()) { const game=detailJson?.game; const sessions=Array.isArray(game?.sessions)?game.sessions:[]; const keyTodayNI=keyInTZ(now,NICA_TZ),keyYestNI=keyInTZ(new Date(now.getTime()-86400000),NICA_TZ); const scored=sessions.map(s=>{const sessionDate=s?.date||null;const keySite=sessionDate?sessionDate.slice(0,10):null;const text=extractWinnerText(game,s);const num=text?.match(/^(\d{1,2})/)?.[1]?.padStart(2,'0')||null;return{sessionDate,keySite,text,num};}).filter(x=>x.sessionDate&&x.text&&x.num).sort((a,b)=>new Date(b.sessionDate)-new Date(a.sessionDate)); const today=scored.find(x=>x.keySite===keyTodayNI)||null,yest=scored.find(x=>x.keySite===keyYestNI)||null,last=scored[0]||null; if(today)return{status:'HOY',...today,keyTodayNI,keyYestNI};if(yest)return{status:'AYER',...yest,keyTodayNI,keyYestNI};if(last)return{status:'ULTIMO',...last,keyTodayNI,keyYestNI};return{status:'SIN_DATOS',keyTodayNI,keyYestNI}; }
    function pickHnCandidate(detailJson,now=new Date()) { const game=detailJson?.game; const sessions=Array.isArray(game?.sessions)?game.sessions:Array.isArray(detailJson?.sessions)?detailJson.sessions:[]; const keyTodayHN=keyInTZ(now,HN_TZ),keyYestHN=keyInTZ(new Date(now.getTime()-86400000),HN_TZ); const scored=sessions.map(s=>{const sessionDate=s?.date||null;const keySite=sessionDate?sessionDate.slice(0,10):null;const text=extractWinnerText(game,s);const num=text?.match(/^(\d{1,2})/)?.[1]?.padStart(2,'0')||null;return{sessionDate,keySite,text,num};}).filter(x=>x.sessionDate&&x.text&&x.num).sort((a,b)=>new Date(b.sessionDate)-new Date(a.sessionDate)); const today=scored.find(x=>x.keySite===keyTodayHN)||null,yest=scored.find(x=>x.keySite===keyYestHN)||null,last=scored[0]||null; if(today)return{status:'HOY',...today,keyTodayHN,keyYestHN};if(yest)return{status:'AYER',...yest,keyTodayHN,keyYestHN};if(last)return{status:'ULTIMO',...last,keyTodayHN,keyYestHN};return{status:'SIN_DATOS',keyTodayHN,keyYestHN}; }

    function copiarLoteriaNicaragua(lot, btn) {
        (async()=>{ const f=obtenerFechaHoy(),now=new Date(),isoQuery=nicaIsoQueryTomorrow04Z(now); const url=`${NICA_API_BASE}/site-games/${lot.siteGameId}?date=${encodeURIComponent(isoQuery)}&t=${Date.now()}`; const detail=await gmGetJson(url); const cand=pickNicaCandidate(detail,now); if(cand.status==='HOY'){console.log(`🇳🇮 [HOY] ${lot.codigoRoverCorto} => ${cand.text}`);llenarCampoUnico(lot,cand.num,f.formatoRover,btn);return;} mostrarMensaje(btn,'⚠️ Resultados no son de hoy','#ff9800'); })().catch(err=>{console.error('Nicaragua error:',err);mostrarMensaje(btn,'❌ ERROR','#f44336');});
    }
    function copiarLoteriaHonduras(lot, btn) {
        (async()=>{ if(!lot.siteGameId){mostrarMensaje(btn,'⚠️ Falta ID','#ff9800');return;} const f=obtenerFechaHoy(),now=new Date(),isoTry=[hnIsoQueryToday04Z(now),hnIsoQueryTomorrow04Z(now)]; let best=null; for(const isoQuery of isoTry){const url=`${HN_API_BASE}/site-games/${lot.siteGameId}?date=${encodeURIComponent(isoQuery)}&t=${Date.now()}`;const detail=await gmGetJson(url);const cand=pickHnCandidate(detail,now);if(!best||cand.status==='HOY')best={cand,isoQuery};if(cand.status==='HOY')break;} const cand=best?.cand; if(cand?.status==='HOY'){console.log(`🇭🇳 [HOY] ${lot.codigoRoverCorto} => ${cand.text}`);llenarCampoUnico(lot,cand.num,f.formatoRover,btn);return;} mostrarMensaje(btn,'⚠️ Resultados no son de hoy','#ff9800'); })().catch(err=>{console.error('Honduras error:',err);mostrarMensaje(btn,'❌ ERROR','#f44336');});
    }

    // ==========================================
    // QPLAY (Brazil)
    // ==========================================
    function copiarLoteriaQplay(lot, btn) {
        GM_xmlhttpRequest({ method:'GET', url:lot.url,
            onload:r=>{ try {
                const doc=new DOMParser().parseFromString(r.responseText,'text/html'); const f=obtenerFechaHoy(); let p=null,s=null,t=null,p3=null,p4=null,noHoy=false; const horaEsperada=lot.hora||'3:00pm'; let seccionCorrecta=null;
                for(let sec of doc.querySelectorAll('.col-results')){const fe=sec.querySelector('h3.white');if(fe){const textoFecha=fe.textContent.trim();const fM=textoFecha.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);if(fM&&fM[1]!==f.formatoQplay){noHoy=true;break;}if(textoFecha.includes(horaEsperada)){seccionCorrecta=sec;break;}}}
                if(seccionCorrecta&&!noHoy){seccionCorrecta.querySelectorAll('.row').forEach(row=>{const txt=row.textContent;const logo=row.querySelector('img[src*="pick"]');const nums=Array.from(row.querySelectorAll('img[src*="/balls/"]')).map(b=>{const m=b.src.match(/\/balls\/(\d)\.png/);return m?m[1]:null;}).filter(n=>n);if(txt.includes('1st')&&nums.length===2)p=nums.join('');else if(txt.includes('2nd')&&nums.length===2)s=nums.join('');else if(txt.includes('3rd')&&nums.length===2)t=nums.join('');else if(logo&&logo.src.includes('pick3')&&nums.length===3)p3=nums.join('');else if(logo&&logo.src.includes('pick4')&&nums.length===4)p4=nums.join('');});}
                if(noHoy) mostrarMensaje(btn,'⚠️ Resultados no son de hoy','#ff9800'); else if(p&&s&&t&&p3&&p4) llenarCamposPick(lot,p3,p4,f.formatoRover,btn,p,s,t); else mostrarMensaje(btn,'❌ No se encontraron números','#f44336');
            }catch(e){mostrarMensaje(btn,'❌ ERROR','#f44336');} },
            onerror:()=>mostrarMensaje(btn,'❌ ERROR DE CONEXIÓN','#f44336')
        });
    }

    // ==========================================
    // PREMIER LOTTO
    // ==========================================
    function copiarLoteriaPremier(lot, btn) {
        GM_xmlhttpRequest({ method:'GET', url:lot.url, headers:{'Accept':'application/json','Origin':'https://premierlotto.tv','Referer':'https://premierlotto.tv/'},
            onload:r=>{ try {
                const data=JSON.parse(r.responseText); const f=obtenerFechaHoy(); let p=null,s=null,t=null,p3=null,p4=null,noHoy=false;
                const sorteo=data.results.find(item=>item.sortition&&item.sortition.name===lot.textoWeb&&item.date===f.formatoPremier);
                if(!sorteo){const hayOtraFecha=data.results.some(item=>item.sortition&&item.sortition.name===lot.textoWeb);if(hayOtraFecha)noHoy=true;else{mostrarMensaje(btn,'❌ No se encontraron números','#f44336');return;}}
                if(sorteo&&!noHoy){p=sorteo.first?sorteo.first.padStart(2,'0'):null;s=sorteo.second?sorteo.second.padStart(2,'0'):null;t=sorteo.third?sorteo.third.padStart(2,'0'):null;p3=sorteo.cashThree||null;p4=sorteo.pickFour||null;}
                if(noHoy) mostrarMensaje(btn,'⚠️ Resultados no son de hoy','#ff9800'); else if(p&&s&&t&&p3&&p4) llenarCamposPick(lot,p3,p4,f.formatoRover,btn,p,s,t); else mostrarMensaje(btn,'❌ No se encontraron números','#f44336');
            }catch(e){mostrarMensaje(btn,'❌ ERROR','#f44336');} },
            onerror:()=>mostrarMensaje(btn,'❌ ERROR DE CONEXIÓN','#f44336')
        });
    }

    // ==========================================
    // HELPERS DE LLENADO
    // llenarCampos y llenarCamposPick retornan boolean
    // ==========================================
    function filaContieneCodigoExacto(tx, codigo) {
        const escaped = codigo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp('(?:^|\\s|\\()' + escaped + '(?:\\s|\\)|$)', 'i');
        return re.test(tx);
    }

    function encontrarFilaLoteria(lot) {
        for (let f of document.querySelectorAll('tr')) {
            if (filaContieneCodigoExacto(f.textContent, lot.codigoRoverCorto)) return f;
        }
        for (let f of document.querySelectorAll('tr')) {
            if (filaContieneCodigoExacto(f.textContent, lot.codigoRover)) return f;
        }
        return null;
    }

    function llenarCampoUnico(lot, numero, fecha, btn) {
        const cf = document.getElementById('fecha');
        if (cf) { cf.value=fecha; cf.dispatchEvent(new Event('input',{bubbles:true})); cf.dispatchEvent(new Event('change',{bubbles:true})); }
        let filaEncontrada = null;
        const filas=document.querySelectorAll('tr'), codigoLimpio=lot.codigoRoverCorto.replace(/[()]/g,''), busquedaExacta=`(${codigoLimpio})`;
        for(let f of filas){if(f.textContent.includes(busquedaExacta)){filaEncontrada=f;break;}}
        if(!filaEncontrada){for(let f of filas){const texto=f.textContent;if(texto.includes(lot.codigoRover)){if(lot.categoria!=='noche'&&texto.includes('NOCHE'))continue;filaEncontrada=f;break;}}}
        if(!filaEncontrada){const regexCodigo=new RegExp(`[\\s(]${codigoLimpio}[\\s)]`,'i');for(let f of filas){const texto=f.textContent;if(regexCodigo.test(texto)){if(lot.categoria!=='noche'&&texto.includes('NOCHE'))continue;filaEncontrada=f;break;}}}
        if(filaEncontrada){const input=filaEncontrada.querySelector('input[name="primera"]');if(input){input.value=numero;['input','change','blur'].forEach(ev=>input.dispatchEvent(new Event(ev,{bubbles:true})));input.style.cssText='background:#d4edda;border-color:#28a745';mostrarMensaje(btn,'✅ ¡COPIADO!','#2196F3');setTimeout(()=>{input.style.background='';input.style.borderColor='';},2000);return true;}else{mostrarMensaje(btn,'❌ Input no encontrado','#f44336');return false;}}
        else{mostrarMensaje(btn,'⚠️ Fila no visible','#ff9800');return false;}
    }

    // Retorna true si llenó los campos, false si la fila no fue encontrada
    function llenarCamposPick(lot, p3, p4, fecha, btn, pp=null, ss=null, tt=null) {
        const cf = document.getElementById('fecha');
        if (cf) { cf.value=fecha; cf.dispatchEvent(new Event('input',{bubbles:true})); cf.dispatchEvent(new Event('change',{bubbles:true})); }
        const p=pp||p3.slice(-2), s=ss||p4.slice(0,2), t=tt||p4.slice(-2);
        const fila = encontrarFilaLoteria(lot);
        if (!fila) { mostrarMensaje(btn,'⚠️ Fila no visible (quitar filtros)','#ff9800'); return false; }
        const i1=fila.querySelector('input[name="primera"]'), i2=fila.querySelector('input[name="segunda"]'), i3=fila.querySelector('input[name="tercera"]'), i4=fila.querySelector('input[name="pick3"]'), i5=fila.querySelector('input[name="pick4"]');
        if (i1&&i2&&i3&&i4&&i5) {
            [i1,i2,i3,i4,i5].forEach((inp,idx)=>{ inp.value=[p,s,t,p3,p4][idx]; ['input','change','blur'].forEach(ev=>inp.dispatchEvent(new Event(ev,{bubbles:true}))); inp.style.cssText='background:#d4edda;border-color:#28a745'; });
            mostrarMensaje(btn,'✅ ¡COPIADO!','#2196F3');
            setTimeout(()=>{ fila.querySelectorAll('input[name="primera"],input[name="segunda"],input[name="tercera"],input[name="pick3"],input[name="pick4"]').forEach(i=>{i.style.background='';i.style.borderColor='';}); }, 2000);
            return true;
        }
        mostrarMensaje(btn,'⚠️ Fila no visible (quitar filtros)','#ff9800');
        return false;
    }

    // Retorna true si llenó los campos, false si la fila no fue encontrada
    function llenarCampos(lot, p, s, t, fecha, btn) {
        const cf = document.getElementById('fecha');
        if (cf) { cf.value=fecha; cf.dispatchEvent(new Event('input',{bubbles:true})); cf.dispatchEvent(new Event('change',{bubbles:true})); }
        const fila = encontrarFilaLoteria(lot);
        if (!fila) { mostrarMensaje(btn,'⚠️ Fila no visible (quitar filtros)','#ff9800'); return false; }
        const i1=fila.querySelector('input[name="primera"]'), i2=fila.querySelector('input[name="segunda"]'), i3=fila.querySelector('input[name="tercera"]');
        if (i1&&i2&&i3) {
            [i1,i2,i3].forEach((inp,idx)=>{ inp.value=[p,s,t][idx]; ['input','change','blur'].forEach(ev=>inp.dispatchEvent(new Event(ev,{bubbles:true}))); inp.style.cssText='background:#d4edda;border-color:#28a745'; });
            mostrarMensaje(btn,'✅ ¡COPIADO!','#2196F3');
            setTimeout(()=>{ fila.querySelectorAll('input[name="primera"],input[name="segunda"],input[name="tercera"]').forEach(i=>{i.style.background='';i.style.borderColor='';}); }, 2000);
            return true;
        }
        mostrarMensaje(btn,'⚠️ Fila no visible (quitar filtros)','#ff9800');
        return false;
    }

    function mostrarMensaje(btn, msg, col) {
        btn.innerHTML=msg; btn.style.backgroundColor=col; btn.disabled=true;
        setTimeout(()=>{ btn.innerHTML='🎰 COPIAR LOTERÍAS ▼'; btn.style.backgroundColor='#4CAF50'; btn.disabled=false; }, 3000);
    }

    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', crearMenu);
    else setTimeout(crearMenu, 1000);
})();