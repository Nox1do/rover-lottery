// ==UserScript==
// @name         Rs Loterías Rd
// @namespace    rover-loterías-dominicanas
// @version      1.3.1
// @description  Valida HTTP con ws.session, concilia resultados con el WebSocket en vivo y agrega Lotería Real Noche (LTR-PM)
// @author       Noe G
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @grant        GM_xmlhttpRequest
// @connect      api.loteriasdominicanas.com
// @connect      client-ws.kiskooloterias.com
// @connect      qplay777.net
// @connect      api.lotocentral.net
// @connect      test-results.supremeventures.com
// @connect      cp-api.supremegames.com
// @connect      feeds.feedblitz.com
// @connect      sorteosrd.com
// @connect      enloteria.com
// @connect      www.youtube.com
// @connect      vimeo.com
// @connect      loteriasdenicaragua.com
// @connect      api.loteriasdenicaragua.com
// @connect      client-back.temp.kiskooloterias.com
// @connect      api.loteriasdehonduras.com
// @connect      loto.sv
// @connect      facebook.com
// @connect      www.facebook.com
// ==/UserScript==

(function() {
    'use strict';

    const LOTDOM_API_BASE = 'https://api.loteriasdominicanas.com/dominicana';
    const RESULTADOS_WS_BASE = 'wss://client-ws.kiskooloterias.com/';
    const RESULTADOS_WS_SITIOS = ['dominicana', 'nicaragua', 'honduras'];

    const LOTDOM_SITE_GAME_ID = {
        'primeraam':     '6966a6d2ea7015c3b8a3d5c3',
        'primerapm':     '6966a6d2ea7015c3b8a3d5c9',
        'kinglotteryam': { pick3: '6966a6d3ea7015c3b8a3d655', pick4: '6966a6d3ea7015c3b8a3d661' },
        'kinglotterypm': { pick3: '6966a6d3ea7015c3b8a3d65b', pick4: '6966a6d3ea7015c3b8a3d667' },
        'suerteam':      '6966a6d3ea7015c3b8a3d5e6',
        'suertepm':      '6966a6d3ea7015c3b8a3d5ec',
        'pale':          '6966a6d1ea7015c3b8a3d456',
        'loteka':        '6966a6d2ea7015c3b8a3d4da',
        'nacional':      '6966a6d1ea7015c3b8a3d47f',
        'ganamas':       '6966a6d2ea7015c3b8a3d485',
        'real':          '6966a6d2ea7015c3b8a3d4b1',
        'nuevayol':      '6966a6d2ea7015c3b8a3d4cf',
        'floridaam':     { pick3: '6966a6d2ea7015c3b8a3d594', pick4: '6966a6d2ea7015c3b8a3d588' },
        'floridapm':     { pick3: '6966a6d2ea7015c3b8a3d59a', pick4: '6966a6d2ea7015c3b8a3d58e' },
        'newyorkam':     { pick3: '6966a6d2ea7015c3b8a3d541', pick4: '6966a6d2ea7015c3b8a3d535' },
        'newyorkpm':     { pick3: '6966a6d2ea7015c3b8a3d547', pick4: '6966a6d2ea7015c3b8a3d53b' },
        'anguilla8am':   '6a51354907d516b9c510fd8c',
        'anguilla9am':   '6a4e7cc307d516b9c509fcd7',
        'anguilla':      '6966a6d3ea7015c3b8a3d638',
        'anguilla11am':  '6a4e828207d516b9c50a2a4b',
        'anguilla12pm':  '6a4e843f07d516b9c50a3c74',
        'anguilla1pm':   '6966a6d3ea7015c3b8a3d614',
        'anguilla2pm':   '6a4e844107d516b9c50a3c86',
        'anguilla3pm':   '6a4e844307d516b9c50a3c9e',
        'anguilla4pm':   '6a51354c07d516b9c510fd9d',
        'anguilla5pm':   '6a51354e07d516b9c510fdb1',
        'anguilla6pm':   '6966a6d3ea7015c3b8a3d61a',
        'anguilla7pm':   '6a51355107d516b9c510fdc2',
        'anguilla8pm':   '6a51355507d516b9c510fdd3',
        'anguilla9pm':   '6966a6d3ea7015c3b8a3d620',
        'anguilla10pm':  '6a51355807d516b9c510fde4',
        'haitibolet930am':  '6a4e8a4307d516b9c50a6f33',
        'haitibolet1030am': '6a4e8a6207d516b9c50a6f8c',
        'haitibolet1130am': '6a4e8a6307d516b9c50a6fa3',
        'haitibolet530pm':  '6a4e8a6507d516b9c50a6fa9',
        'haitibolet630pm':  '6a4e8a6607d516b9c50a6fc5',
        'haitibolet730pm':  '6a4e8a6707d516b9c50a6fd3',
        'lotedom':       '6966a6d3ea7015c3b8a3d5f7',
        'quemaito':      '6966a6d3ea7015c3b8a3d5fd',
        'quinielonAM':   '6966a6d2ea7015c3b8a3d5d5',
        'quinielonPM':   '6966a6d2ea7015c3b8a3d5db',
        'realpm':        '6a97695a445bdb3562dc7f50',
    };

    const LOTDOM_PICK_COMPANY_ID = {
        'kinglotteryam': '6966a6d3ea7015c3b8a3d643',
        'kinglotterypm': '6966a6d3ea7015c3b8a3d643',
        'floridaam':     '6966a6d2ea7015c3b8a3d564',
        'floridapm':     '6966a6d2ea7015c3b8a3d564',
        'newyorkam':     '6966a6d2ea7015c3b8a3d52f',
        'newyorkpm':     '6966a6d2ea7015c3b8a3d52f'
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
            tipo: 'pennsylvaniaVimeo',
            urlVimeo: 'https://vimeo.com/pennsylvanialottery',
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
        'realpm': {
            nombre: '🎲 Lotería Real Noche', codigoRover: 'LOTERIA REAL PM', codigoRoverCorto: 'LTR-PM',
            tipo: 'lotdomAPI', hora: '7:55 PM', categoria: 'noche',
            url: 'https://loteriasdominicanas.com/loto-real/quiniela-loteria-real-noche/'
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
        'anguilla8am':  { nombre:'🇦🇮 Anguilla 8AM',  codigoRover:'ANGUILLA 8AM',  codigoRoverCorto:'ANG-8AM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-8-am',       categoria:'anguilla' },
        'anguilla9am':  { nombre:'🇦🇮 Anguilla 9AM',  codigoRover:'ANGUILLA 9AM',  codigoRoverCorto:'ANG-9AM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-9-am',       categoria:'anguilla' },
        'anguilla':     { nombre:'🇦🇮 Anguilla 10AM', codigoRover:'ANGUILLA 10AM', codigoRoverCorto:'ANGUILLA-10AM', tipo:'anguilla3fuentes', slugLotDom:'anguila-manana',     categoria:'anguilla' },
        'anguilla11am': { nombre:'🇦🇮 Anguilla 11AM', codigoRover:'ANGUILLA 11AM', codigoRoverCorto:'ANG-11AM',      tipo:'anguilla3fuentes', slugLotDom:'anguila-11-am',      categoria:'anguilla' },
        'anguilla12pm': { nombre:'🇦🇮 Anguilla 12PM', codigoRover:'ANGUILLA 12PM', codigoRoverCorto:'ANG-12PM',      tipo:'anguilla3fuentes', slugLotDom:'anguila-12-pm',      categoria:'anguilla' },
        'anguilla1pm':  { nombre:'🇦🇮 Anguilla 1PM',  codigoRover:'ANGUILLA 1PM',  codigoRoverCorto:'ANGUILLA-1PM',  tipo:'anguilla3fuentes', slugLotDom:'anguila-medio-dia',  categoria:'anguilla' },
        'anguilla2pm':  { nombre:'🇦🇮 Anguilla 2PM',  codigoRover:'ANGUILLA 2PM',  codigoRoverCorto:'ANG-2PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-2-pm',       categoria:'anguilla' },
        'anguilla3pm':  { nombre:'🇦🇮 Anguilla 3PM',  codigoRover:'ANGUILLA 3PM',  codigoRoverCorto:'ANG-3PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-3-pm',       categoria:'anguilla' },
        'anguilla4pm':  { nombre:'🇦🇮 Anguilla 4PM',  codigoRover:'ANGUILLA 4PM',  codigoRoverCorto:'ANG-4PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-4pm',        categoria:'anguilla' },
        'anguilla5pm':  { nombre:'🇦🇮 Anguilla 5PM',  codigoRover:'ANGUILLA 5PM',  codigoRoverCorto:'ANG-5PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-5pm',        categoria:'anguilla' },
        'anguilla6pm':  { nombre:'🇦🇮 Anguilla 6PM',  codigoRover:'ANGUILLA 6PM',  codigoRoverCorto:'ANGUILLA-6PM',  tipo:'anguilla3fuentes', slugLotDom:'anguila-tarde',      categoria:'anguilla' },
        'anguilla7pm':  { nombre:'🇦🇮 Anguilla 7PM',  codigoRover:'ANGUILLA 7PM',  codigoRoverCorto:'ANG-7PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-7pm',        categoria:'anguilla' },
        'anguilla8pm':  { nombre:'🇦🇮 Anguilla 8PM',  codigoRover:'ANGUILLA 8PM',  codigoRoverCorto:'ANG-8PM',       tipo:'anguilla3fuentes', slugLotDom:'anguila-8pm',        categoria:'anguilla' },
        'anguilla9pm':  { nombre:'🇦🇮 Anguilla 9PM',  codigoRover:'ANGUILLA 9PM',  codigoRoverCorto:'ANGUILLA-9PM',  tipo:'anguilla3fuentes', slugLotDom:'anguila-noche',      categoria:'anguilla' },
        'anguilla10pm': { nombre:'🇦🇮 Anguilla 10PM', codigoRover:'ANGUILLA 10PM', codigoRoverCorto:'ANG-10PM',      tipo:'anguilla3fuentes', slugLotDom:'anguila-10pm',       categoria:'anguilla' },
        'jamaicaearlybird': { nombre:'🇯🇲 Jamaica Earlybird',   codigoRover:'JAMAICA EARLYBIRD', codigoRoverCorto:'JM-EARLYBIRD', tipo:'jamaica', textoWeb:'EARLYBIRD', categoria:'jamaica' },
        'jamaicamorning':   { nombre:'🇯🇲 Jamaica Morning',     codigoRover:'JAMAICA MORNING',   codigoRoverCorto:'JM-MORNING',   tipo:'jamaica', textoWeb:'MORNING',   categoria:'jamaica' },
        'jamaicamidday':    { nombre:'🇯🇲 Jamaica Midday',      codigoRover:'JAMAICA MIDDAY',    codigoRoverCorto:'JM-MIDDAY',    tipo:'jamaica', textoWeb:'MIDDAY',    categoria:'jamaica' },
        'jamaicadrivetime': { nombre:'🇯🇲 Jamaica Drive Time',  codigoRover:'JAMAICA DRIVETIME', codigoRoverCorto:'JM-DRIVETIME', tipo:'jamaica', textoWeb:'DRIVETIME', categoria:'jamaica' },
        'jamaicaevening':   { nombre:'🇯🇲 Jamaica Evening',     codigoRover:'JAMAICA EVENING',   codigoRoverCorto:'JM-EVENING',   tipo:'jamaica', textoWeb:'EVENING',   categoria:'jamaica' },
        'haitibolet930am':  { nombre:'🇭🇹 Haiti Bolet 9:30 AM',  codigoRover:'HAITI BOLET 9:30 AM',  codigoRoverCorto:'BOLET-9-30AM',  tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'9:30 AM',  slugLotDom:'haiti-bolet-930-am',  categoria:'haitibolet' },
        'haitibolet1030am': { nombre:'🇭🇹 Haiti Bolet 10:30 AM', codigoRover:'HAITI BOLET 10:30 AM', codigoRoverCorto:'BOLET-10-30AM', tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'10:30 AM', slugLotDom:'haiti-bolet-1030-am', categoria:'haitibolet' },
        'haitibolet1130am': { nombre:'🇭🇹 Haiti Bolet 11:30 AM', codigoRover:'HAITI BOLET 11:30 AM', codigoRoverCorto:'BOLET-11-30AM', tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'11:30 AM', slugLotDom:'haiti-bolet-1130-am', categoria:'haitibolet' },
        'haitibolet530pm':  { nombre:'🇭🇹 Haiti Bolet 5:30 PM',  codigoRover:'HAITI BOLET 5:30 PM',  codigoRoverCorto:'BOLET-5-30PM',  tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'5:30 PM',  slugLotDom:'haiti-bolet-530-pm',  categoria:'haitibolet' },
        'haitibolet630pm':  { nombre:'🇭🇹 Haiti Bolet 6:30 PM',  codigoRover:'HAITI BOLET 6:30 PM',  codigoRoverCorto:'BOLET-6-30PM',  tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'6:30 PM',  slugLotDom:'haiti-bolet-630-pm',  categoria:'haitibolet' },
        'haitibolet730pm':  { nombre:'🇭🇹 Haiti Bolet 7:30 PM',  codigoRover:'HAITI BOLET 7:30 PM',  codigoRoverCorto:'BOLET-7-30PM',  tipo:'haitibolet', url:'https://sorteosrd.com/', textoWeb:'7:30 PM',  slugLotDom:'haiti-bolet-730-pm',  categoria:'haitibolet' },
        'nicaragua11am': { nombre:'🇳🇮 Nica 11AM', codigoRover:'NICA 11AM', codigoRoverCorto:'NICA-11AM', tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 12:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601e99', slug:'diaria-11-am' },
        'nicaragua3pm':  { nombre:'🇳🇮 Nica 3pm',  codigoRover:'NICA 3PM',  codigoRoverCorto:'NICA-3PM',  tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 15:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601ebd', slug:'diaria-3-pm'  },
        'nicaragua9pm':  { nombre:'🇳🇮 Nica 9pm',  codigoRover:'NICA 9PM',  codigoRoverCorto:'NICA-9PM',  tipo:'nicaragua', url:'https://loteriasdenicaragua.com/', textoWeb:'Diaria 21:00', categoria:'diarias', siteGameId:'6938bae65aada821ed601ed6', slug:'diaria-9-pm'  },
        'honduras11am': { nombre:'🇭🇳 Hond 11AM', codigoRover:'LA DIARIA 11AM', codigoRoverCorto:'LD11', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 11:00 AM', categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b31', slug:'la-diaria-10am' },
        'honduras3pm':  { nombre:'🇭🇳 Hond 3PM',  codigoRover:'LA DIARIA 03PM', codigoRoverCorto:'LD03', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 3:00 PM',  categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b07', slug:'la-diaria-2pm'  },
        'honduras9pm':  { nombre:'🇭🇳 Hond 9PM',  codigoRover:'LA DIARIA 09PM', codigoRoverCorto:'LD09', tipo:'honduras', url:'https://loteriasdehonduras.com/', textoWeb:'La Diaria 9:00 PM',  categoria:'diarias', siteGameId:'693ae5bbd7b13e9daed23b1f', slug:'la-diaria-9pm'  },
        'salvador11am': { nombre:'🇸🇻 Salv 11AM', codigoRover:'SALV 11AM', codigoRoverCorto:'SALV-11AM', tipo:'salvador', apiTurno:'11', hora:'11:00 AM', categoria:'diarias' },
        'salvador9pm':  { nombre:'🇸🇻 Salv 9PM',  codigoRover:'SALV 9PM',  codigoRoverCorto:'SALV-9PM',  tipo:'salvador', apiTurno:'21', hora:'9:00 PM',  categoria:'diarias' }
    };

    // ==========================================
    // MENÚ
    // ==========================================
    function crearMenu() {
        if (!document.getElementById('rs-lotdom-live-style')) {
            const style = document.createElement('style');
            style.id = 'rs-lotdom-live-style';
            style.textContent = '@keyframes rsLotDomGirar{to{transform:rotate(360deg)}} .rs-lotdom-cargando{display:inline-block;animation:rsLotDomGirar .8s linear infinite;color:#2196f3;font-weight:bold}';
            document.head.appendChild(style);
        }
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
                const separador = loteria.nombre.indexOf(' ');
                const iconoOriginal = separador > 0 ? loteria.nombre.slice(0, separador) : '🎲';
                const textoNombre = separador > 0 ? loteria.nombre.slice(separador + 1) : loteria.nombre;
                const icono = document.createElement('span');
                icono.textContent = iconoOriginal;
                icono.style.cssText = 'display:inline-block;width:20px;text-align:center;margin-right:5px';
                const texto = document.createElement('span');
                texto.textContent = textoNombre;
                opcion.append(icono, texto);
                opcion.dataset.loteriaKey = key;
                opcion.style.cssText = 'display:block;width:100%;padding:8px 12px 8px 30px;background:white;color:#333;border:none;border-bottom:1px solid #eee;cursor:pointer;font-size:12px;text-align:left;transition:background 0.2s;white-space:nowrap;box-sizing:border-box';
                lotDomLive.opcionesMenu.set(key, { boton:opcion, icono, original:iconoOriginal });
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
        instalarVigilanciaFechaLotDom();

        const bw = Math.ceil(botonMenu.getBoundingClientRect().width);
        if (bw) menuDesplegable.style.minWidth = bw + 'px';
    }

    // ==========================================
    // FECHA
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
    function logTablaResultado({ loteria, fecha, resultado, estado, sonDeHoy, fuente='—' }) {
        console.table([{ 'Lotería': loteria, 'Fecha': fecha, 'Resultado': resultado, 'Fuente': fuente, 'Estado': estado, 'Son de hoy': sonDeHoy }]);
    }

    // ==========================================
    // LOTDOM — una consulta HTTP + WebSocket compartido
    // ==========================================
    const lotDomLive = {
        cache: new Map(),
        cacheMeta: new Map(),
        seguimientos: new Map(),
        operaciones: new Map(),
        opcionesMenu: new Map(),
        conexiones: new Map()
    };

    function claveSesionLotDom(gameId, fecha, siteEnv = 'dominicana') {
        return `${siteEnv}|${gameId || ''}|${String(fecha || '').slice(0, 10)}`;
    }

    function estadoWebSocketResultados(siteEnv = 'dominicana') {
        return lotDomLive.conexiones.get(siteEnv)?.estado || 'desconectado';
    }

    function normalizarIdSesionResultados(valor) {
        return String(valor || '').replace(/-/g, '').toLowerCase().trim();
    }

    function registrarIdSesionResultados(siteEnv, valor) {
        const sessionId = normalizarIdSesionResultados(valor);
        if (!sessionId) return false;
        let conexion = lotDomLive.conexiones.get(siteEnv);
        if (!conexion) {
            conexion = { socket:null, reconexion:null, intentos:0, estado:'desconectado', sessionId:null, sessionRecibidaEn:0, esperasSession:new Set() };
            lotDomLive.conexiones.set(siteEnv, conexion);
        }
        const cambio = conexion.sessionId !== sessionId;
        conexion.sessionId = sessionId;
        conexion.sessionRecibidaEn = Date.now();
        for (const espera of Array.from(conexion.esperasSession || [])) {
            clearTimeout(espera.timer);
            conexion.esperasSession.delete(espera);
            espera.resolve(sessionId);
        }
        if (cambio) console.log(`[Resultados WebSocket] 🔐 ${siteEnv}: sesión HTTP disponible`);
        return true;
    }

    function invalidarIdSesionResultados(siteEnv, motivo = 'respuesta HTTP no validada') {
        const conexion = lotDomLive.conexiones.get(siteEnv);
        if (!conexion?.sessionId) return;
        conexion.sessionId = null;
        conexion.sessionRecibidaEn = 0;
        console.warn(`[Resultados WebSocket] 🔐 ${siteEnv}: sesión HTTP invalidada (${motivo}); se esperará el próximo ws.session`);
    }

    function esperarIdSesionResultados(siteEnv = 'dominicana', timeoutMs = 4000) {
        const existente = lotDomLive.conexiones.get(siteEnv)?.sessionId;
        if (existente) return Promise.resolve(existente);
        conectarWebSocketResultados(siteEnv);
        const conexion = lotDomLive.conexiones.get(siteEnv);
        if (!conexion) return Promise.resolve(null);
        conexion.esperasSession ||= new Set();
        return new Promise(resolve => {
            const espera = {
                resolve,
                timer:setTimeout(() => {
                    conexion.esperasSession.delete(espera);
                    resolve(null);
                }, timeoutMs)
            };
            conexion.esperasSession.add(espera);
            if (conexion.sessionId) {
                clearTimeout(espera.timer);
                conexion.esperasSession.delete(espera);
                resolve(conexion.sessionId);
            }
        });
    }

    function acceptLanguageConSesionResultados(sessionId) {
        const limpio = normalizarIdSesionResultados(sessionId);
        if (!limpio) return '';
        const firma = `x-${(limpio.match(/.{1,8}/g) || [limpio]).join('-')};q=0.1`;
        const idiomas = (Array.isArray(navigator.languages) && navigator.languages.length ? [...navigator.languages] : ['es'])
            .filter(valor => /^[A-Za-z0-9-]+$/.test(valor))
            .slice(0, 3)
            .map((valor, indice) => indice === 0 ? valor : `${valor};q=${(1 - indice * 0.1).toFixed(1)}`);
        if (!idiomas.length) idiomas.push('es');
        while (idiomas.length > 1 && idiomas.join(',').length + 1 + firma.length > 128) idiomas.pop();
        return [...idiomas, firma].join(',');
    }

    function valorCabeceraRespuesta(response, nombre) {
        const patron = new RegExp(`(?:^|\\r?\\n)${nombre.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\s*:\\s*([^\\r\\n]+)`, 'i');
        return String(response?.responseHeaders || '').match(patron)?.[1]?.trim() || '';
    }

    function autenticarRespuestaResultados(response, siteEnv) {
        const cacheControl = valorCabeceraRespuesta(response, 'cache-control');
        const autenticada = !/\bno-store\b/i.test(cacheControl);
        if (!autenticada) invalidarIdSesionResultados(siteEnv, `Cache-Control: ${cacheControl}`);
        return { autenticada, cacheControl:cacheControl || '—' };
    }

    function marcaTemporalSesionLotDom(session) {
        if (!session || typeof session !== 'object') return 0;
        const campos = [
            'updatedAt', 'updated_at', 'modifiedAt', 'modified_at',
            'lastUpdate', 'last_update', 'lastUpdated', 'last_updated'
        ];
        const objetos = [session, session.live, session.metadata, session.meta].filter(Boolean);
        for (const objeto of objetos) {
            for (const campo of campos) {
                const valor = objeto?.[campo];
                if (valor == null || valor === '') continue;
                if (typeof valor === 'number' && Number.isFinite(valor)) {
                    return valor < 1e12 ? valor * 1000 : valor;
                }
                if (/^\d+(?:\.\d+)?$/.test(String(valor))) {
                    const numero = Number(valor);
                    if (Number.isFinite(numero)) return numero < 1e12 ? numero * 1000 : numero;
                }
                const fecha = Date.parse(valor);
                if (Number.isFinite(fecha)) return fecha;
            }
        }
        return 0;
    }

    function firmaSesionLotDom(session) {
        return flattenScoreIds(session?.score).map(valor => String(valor ?? '').trim()).filter(Boolean).join('|');
    }

    function describirMarcaTemporalLotDom(timestamp) {
        return timestamp ? new Date(timestamp).toISOString() : 'no disponible';
    }

    function guardarSesionLotDomWebSocket(session, siteEnv = 'dominicana') {
        if (!session?.game_id || !session?.date) return false;
        const clave = claveSesionLotDom(session.game_id, session.date, siteEnv);
        const anterior = lotDomLive.cache.get(clave);
        const metaAnterior = lotDomLive.cacheMeta.get(clave) || {};
        const cantidad = candidata => flattenScoreIds(candidata?.score).filter(Boolean).length;
        const timestampServidor = marcaTemporalSesionLotDom(session);
        const timestampAnterior = Number(metaAnterior.timestampServidor || 0);
        const esMasAntigua = Boolean(anterior && timestampServidor && timestampAnterior && timestampServidor < timestampAnterior);
        const pierdeCalidadSinSerPosterior = Boolean(
            anterior &&
            cantidad(session) < cantidad(anterior) &&
            !(timestampServidor && timestampAnterior && timestampServidor > timestampAnterior)
        );
        if (esMasAntigua || pierdeCalidadSinSerPosterior) {
            console.table([{
                Evento: 'WebSocket descartado',
                Sitio: siteEnv,
                GameID: session.game_id,
                Fecha: String(session.date).slice(0, 10),
                ResultadoEntrante: firmaSesionLotDom(session) || '—',
                ResultadoConservado: firmaSesionLotDom(anterior) || '—',
                Motivo: esMasAntigua ? 'evento con actualización anterior' : 'evento no posterior con menos datos'
            }]);
            return false;
        }
        lotDomLive.cache.set(clave, session);
        lotDomLive.cacheMeta.set(clave, {
            timestampServidor,
            recibidoEn: Date.now(),
            firma: firmaSesionLotDom(session)
        });
        if (lotDomLive.cache.size > 500) {
            const primeraClave = lotDomLive.cache.keys().next().value;
            lotDomLive.cache.delete(primeraClave);
            lotDomLive.cacheMeta.delete(primeraClave);
        }
        return true;
    }

    function procesarSesionLotDomWebSocket(session, siteEnv = 'dominicana') {
        if (!session?.game_id || !session?.date) return;
        const clave = claveSesionLotDom(session.game_id, session.date, siteEnv);
        const seguimiento = lotDomLive.seguimientos.get(clave);
        if (!seguimiento) return;
        let resultado = scoreLotDom(session).join('-') || '—';
        if (typeof seguimiento.describirResultado === 'function') {
            try { resultado = seguimiento.describirResultado(session) || resultado; } catch (_) {}
        }
        let completa = false;
        try { completa = Boolean(seguimiento.esCompleta(session)); } catch (_) {}
        console.table([{
            Evento: 'session.live.score.updated',
            Sitio: siteEnv,
            Sorteo: seguimiento.etiqueta,
            Fecha: seguimiento.fechaRover,
            GameID: session.game_id,
            Resultado: resultado,
            Completo: completa,
            Acción: completa ? 'copiado automático solicitado' : 'actualización parcial; continúa azul',
            SolicitudesHTTP: 0,
            WebSocket: estadoWebSocketResultados(siteEnv)
        }]);
        if (!completa) return;
        lotDomLive.seguimientos.delete(clave);
        if (typeof seguimiento.alCompletar === 'function') {
            try { seguimiento.alCompletar(session); }
            catch (e) { console.warn(`[LotDom WebSocket] No se pudo cerrar el proceso activo: ${e.message}`); }
        }
    }

    function sesionCacheLotDom(gameId, fechaISO, siteEnv = 'dominicana') {
        return lotDomLive.cache.get(claveSesionLotDom(gameId, fechaISO, siteEnv)) || null;
    }

    function conciliarSesionesLotDom({ sessionHttp, sessionWs, f, esCompleta, etiqueta, siteEnv, fuenteHttp }) {
        const esHoy = esFechaLotDomDeHoy(f);
        const httpCompleta = Boolean(sessionHttp && esCompleta(sessionHttp));
        const wsCompleta = Boolean(esHoy && sessionWs && esCompleta(sessionWs));
        const scoreHttp = firmaSesionLotDom(sessionHttp);
        const scoreWs = firmaSesionLotDom(sessionWs);
        const timestampHttp = marcaTemporalSesionLotDom(sessionHttp);
        const timestampWs = marcaTemporalSesionLotDom(sessionWs);
        let session = null;
        let fuente = fuenteHttp;
        let motivo = 'sin resultado completo';

        if (!esHoy) {
            session = sessionHttp;
            motivo = httpCompleta ? 'fecha histórica: HTTP es la fuente válida' : 'fecha histórica sin resultado HTTP completo';
        } else if (httpCompleta && wsCompleta) {
            if (scoreHttp === scoreWs) {
                session = sessionWs;
                fuente = 'LotDom WebSocket (caché verificada)';
                motivo = 'HTTP y WebSocket coinciden';
            } else if (timestampHttp && timestampWs && timestampHttp > timestampWs) {
                session = sessionHttp;
                motivo = 'HTTP tiene una actualización posterior';
            } else {
                session = sessionWs;
                fuente = 'LotDom WebSocket (caché conciliada)';
                motivo = timestampHttp && timestampWs && timestampWs > timestampHttp
                    ? 'WebSocket tiene una actualización posterior'
                    : 'resultados distintos sin fechas comparables; se prefiere la fuente en vivo';
            }
            if (scoreHttp !== scoreWs) {
                console.table([{
                    Alerta: 'Discrepancia HTTP/WebSocket',
                    Sitio: siteEnv,
                    Lotería: etiqueta,
                    Fecha: f.formatoRover,
                    HTTP: scoreHttp || '—',
                    WebSocket: scoreWs || '—',
                    ActualizaciónHTTP: describirMarcaTemporalLotDom(timestampHttp),
                    ActualizaciónWebSocket: describirMarcaTemporalLotDom(timestampWs),
                    Elegido: session === sessionWs ? scoreWs : scoreHttp,
                    FuenteElegida: fuente,
                    Motivo: motivo,
                    SolicitudesHTTPAdicionales: 0
                }]);
            }
        } else if (wsCompleta) {
            session = sessionWs;
            fuente = 'LotDom WebSocket (caché)';
            motivo = 'WebSocket completo; HTTP incompleto';
        } else if (httpCompleta) {
            session = sessionHttp;
            motivo = 'HTTP completo; WebSocket sin resultado completo';
        } else {
            const calidad = candidata => flattenScoreIds(candidata?.score).filter(Boolean).length;
            session = calidad(sessionWs) >= calidad(sessionHttp) && sessionWs ? sessionWs : sessionHttp;
            fuente = session === sessionWs && sessionWs ? 'LotDom WebSocket (caché parcial)' : fuenteHttp;
            motivo = session ? 'resultado incompleto' : 'sin sesión para la fecha seleccionada';
        }

        return {
            session,
            fuente,
            motivo,
            completa: Boolean(session && esCompleta(session)),
            httpCompleta,
            wsCompleta,
            scoreHttp,
            scoreWs,
            timestampHttp,
            timestampWs
        };
    }

    function esTipoConSeguimientoLotDom(tipo) {
        return ['lotdomAPI', 'lotdomAPIUnico', 'lotdomAPIPick', 'anguilla3fuentes', 'haitibolet', 'nicaragua', 'honduras'].includes(tipo);
    }

    function nombresInputsSeguimientoLotDom(lot) {
        if (['lotdomAPIUnico', 'nicaragua', 'honduras'].includes(lot.tipo)) return ['primera'];
        if (lot.tipo === 'lotdomAPIPick') return ['pick3', 'pick4'];
        return ['primera', 'segunda', 'tercera'];
    }

    function actualizarIconoSeguimientoLotDom(key, activo) {
        const opcion = lotDomLive.opcionesMenu.get(key);
        if (!opcion?.icono) return;
        opcion.icono.textContent = activo ? '⟳' : opcion.original;
        opcion.icono.classList.toggle('rs-lotdom-cargando', activo);
        opcion.boton.setAttribute('aria-label', activo ? `${LOTERIAS[key].nombre}, seguimiento activo; pulsa para cancelar` : LOTERIAS[key].nombre);
    }

    function restaurarInputsOperacionLotDom(operacion) {
        for (const item of operacion.inputs) {
            if (item.escuchando) {
                item.input.removeEventListener('input', item.alEditar);
                item.escuchando = false;
            }
            item.input.style.background = item.estilo.background;
            item.input.style.borderColor = item.estilo.borderColor;
            item.input.style.boxShadow = item.estilo.boxShadow;
        }
    }

    function limpiarSeguimientosOperacionLotDom(operacion) {
        for (const clave of operacion.claves) {
            const seguimiento = lotDomLive.seguimientos.get(clave);
            if (!seguimiento || seguimiento.operacionId === operacion.id) lotDomLive.seguimientos.delete(clave);
        }
        operacion.claves.clear();
    }

    function operacionLotDomActiva(operacion) {
        return Boolean(operacion && !operacion.cancelada && !operacion.finalizada && lotDomLive.operaciones.get(operacion.key) === operacion);
    }

    function cancelarOperacionLotDom(operacion, motivo = 'cancelado') {
        if (!operacionLotDomActiva(operacion)) return false;
        operacion.cancelada = true;
        restaurarInputsOperacionLotDom(operacion);
        limpiarSeguimientosOperacionLotDom(operacion);
        actualizarIconoSeguimientoLotDom(operacion.key, false);
        lotDomLive.operaciones.delete(operacion.key);
        if (typeof operacion.alCancelar === 'function') {
            try { operacion.alCancelar(motivo); } catch (_) {}
        }
        liberarBotonPorWebSocket(document.querySelector('#menu-loteria-script > button'));
        console.table([{
            Lotería: operacion.lot.nombre,
            Fecha: operacion.fechaRover,
            Seguimiento: 'OFF',
            Motivo: motivo,
            Inputs: operacion.inputs.map(x => x.nombre).join(', ') || 'fila no visible',
            WebSocket: estadoWebSocketResultados(operacion.siteEnv)
        }]);
        return true;
    }

    function finalizarOperacionLotDom(operacion, fuente, resultado) {
        if (!operacionLotDomActiva(operacion)) return false;
        operacion.finalizada = true;
        restaurarInputsOperacionLotDom(operacion);
        limpiarSeguimientosOperacionLotDom(operacion);
        actualizarIconoSeguimientoLotDom(operacion.key, false);
        lotDomLive.operaciones.delete(operacion.key);
        console.table([{
            Lotería: operacion.lot.nombre,
            Fecha: operacion.fechaRover,
            Seguimiento: 'COMPLETADO',
            Fuente: fuente,
            Resultado: resultado || '—',
            Acción: operacion.esperando ? 'spinner OFF; azul OFF; llenado en verde' : 'azul no activado; llenado directo en verde'
        }]);
        return true;
    }

    function iniciarOperacionLotDom(key, lot, f, siteEnv = 'dominicana') {
        const anterior = lotDomLive.operaciones.get(key);
        if (anterior) cancelarOperacionLotDom(anterior, 'reemplazado por una operación nueva');
        const operacion = {
            id: `LOTDOM-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7)}`,
            key,
            lot,
            siteEnv,
            fechaRover: f.formatoRover,
            fechaISO: f.formatoLotDomISO,
            inputs: [],
            claves: new Set(),
            esperando: false,
            actualizando: false,
            cancelada: false,
            finalizada: false
        };
        const fila = encontrarFilaLoteria(lot);
        if (fila) {
            for (const nombre of nombresInputsSeguimientoLotDom(lot)) {
                const input = fila.querySelector(`input[name="${nombre}"]`);
                if (!input) continue;
                const item = {
                    nombre,
                    input,
                    estilo: {
                        background: input.style.background,
                        borderColor: input.style.borderColor,
                        boxShadow: input.style.boxShadow
                    },
                    alEditar: null,
                    escuchando: false
                };
                item.alEditar = () => {
                    if (!operacion.actualizando) cancelarOperacionLotDom(operacion, `edición manual en ${nombre}`);
                };
                operacion.inputs.push(item);
            }
        }
        lotDomLive.operaciones.set(key, operacion);
        return operacion;
    }

    function activarEsperaOperacionLotDom(operacion, nombresPendientes = null) {
        if (!operacionLotDomActiva(operacion) || operacion.esperando) return false;
        operacion.esperando = true;
        const pendientes = nombresPendientes ? new Set(nombresPendientes) : null;
        for (const item of operacion.inputs) {
            if (pendientes && !pendientes.has(item.nombre)) continue;
            item.input.addEventListener('input', item.alEditar);
            item.escuchando = true;
            item.input.style.background = '#dbeafe';
            item.input.style.borderColor = '#3b82f6';
            item.input.style.boxShadow = '0 0 0 1px #93c5fd';
        }
        actualizarIconoSeguimientoLotDom(operacion.key, true);
        console.table([{
            Lotería: operacion.lot.nombre,
            Fecha: operacion.fechaRover,
            Seguimiento: 'ON',
            InputsAzules: operacion.inputs.filter(x => x.escuchando).map(x => x.nombre).join(', ') || 'fila no visible',
            SegundoClic: 'cancela',
            EdiciónManual: 'cancela',
            WebSocket: estadoWebSocketResultados(operacion.siteEnv)
        }]);
        return true;
    }

    function marcarPickDisponibleOperacion(operacion, nombre, valor, fuente) {
        if (!operacionLotDomActiva(operacion) || !/^(pick3|pick4)$/.test(nombre)) return false;
        const item = operacion.inputs.find(x => x.nombre === nombre);
        if (!item) return false;
        if (item.escuchando) {
            item.input.removeEventListener('input', item.alEditar);
            item.escuchando = false;
        }
        operacion.actualizando = true;
        try {
            item.input.value = valor;
            ['input','change','blur'].forEach(ev => item.input.dispatchEvent(new Event(ev,{bubbles:true})));
        } finally {
            operacion.actualizando = false;
        }
        item.input.style.background = '#d4edda';
        item.input.style.borderColor = '#28a745';
        item.input.style.boxShadow = 'none';
        console.table([{
            Lotería: operacion.lot.nombre,
            Campo: nombre === 'pick3' ? 'Pick 3' : 'Pick 4',
            Resultado: valor,
            Fuente: fuente,
            Estado: 'disponible; verde',
            OtrosPendientes: operacion.inputs.filter(x => x.escuchando).map(x => x.nombre).join(', ') || 'ninguno'
        }]);
        return true;
    }

    function vincularSeguimientoOperacionLotDom(operacion, resultado, f, alCompletar) {
        if (!operacionLotDomActiva(operacion)) return false;
        const gameId = resultado?.data?.game_id || resultado?.data?.game?._id || resultado?.session?.game_id;
        if (!gameId) return false;
        const clave = claveSesionLotDom(gameId, f.formatoLotDomISO, operacion.siteEnv);
        const seguimiento = lotDomLive.seguimientos.get(clave);
        if (!seguimiento) return false;
        seguimiento.operacionId = operacion.id;
        seguimiento.alCompletar = session => {
            if (!operacionLotDomActiva(operacion)) return;
            const fechaActual = document.getElementById('fecha')?.value?.trim();
            if (fechaActual && fechaActual !== operacion.fechaRover) {
                cancelarOperacionLotDom(operacion, 'cambio de fecha');
                return;
            }
            alCompletar(session);
        };
        operacion.claves.add(clave);
        return true;
    }

    function instalarVigilanciaFechaLotDom() {
        const input = document.getElementById('fecha');
        if (!input || input.dataset.lotdomVigilado === '1') return;
        input.dataset.lotdomVigilado = '1';
        const revisar = () => {
            const fecha = input.value.trim();
            for (const operacion of Array.from(lotDomLive.operaciones.values())) {
                if (fecha && fecha !== operacion.fechaRover) cancelarOperacionLotDom(operacion, 'cambio de fecha');
            }
        };
        input.addEventListener('input', revisar);
        input.addEventListener('change', revisar);
    }

    function conectarWebSocketResultados(siteEnv) {
        let conexion = lotDomLive.conexiones.get(siteEnv);
        if (!conexion) {
            conexion = { socket:null, reconexion:null, intentos:0, estado:'desconectado', sessionId:null, sessionRecibidaEn:0, esperasSession:new Set() };
            lotDomLive.conexiones.set(siteEnv, conexion);
        }
        const ws = conexion.socket;
        if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;
        if (typeof WebSocket !== 'function') {
            conexion.estado = 'no disponible';
            return;
        }
        try {
            clearTimeout(conexion.reconexion);
            conexion.intentos++;
            conexion.estado = 'conectando';
            conexion.socket = new WebSocket(`${RESULTADOS_WS_BASE}?site=${encodeURIComponent(siteEnv)}`);
            conexion.socket.addEventListener('open', () => {
                conexion.estado = 'conectado';
                conexion.intentos = 0;
                console.log(`[Resultados WebSocket] ✅ ${siteEnv}: conectado y escuchando en vivo`);
            });
            conexion.socket.addEventListener('message', event => {
                try {
                const mensaje = JSON.parse(event.data);
                const session = mensaje?.data?.session;
                if (mensaje?.subject === 'ws.session') {
                    registrarIdSesionResultados(siteEnv, mensaje?.data?.id);
                    return;
                }
                if (mensaje?.subject === 'session.live.score.deleted') {
                    if (session?.game_id && session?.date) {
                        const clave = claveSesionLotDom(session.game_id, session.date, siteEnv);
                        lotDomLive.cache.delete(clave);
                        lotDomLive.cacheMeta.delete(clave);
                    }
                    return;
                }
                if (mensaje?.subject !== 'session.live.score.updated') return;
                const aceptada = guardarSesionLotDomWebSocket(session, siteEnv);
                if (aceptada) procesarSesionLotDomWebSocket(session, siteEnv);
                } catch (e) {
                    console.warn(`[Resultados WebSocket] ${siteEnv}: mensaje inválido: ${e.message}`);
                }
            });
            conexion.socket.addEventListener('error', () => {
                conexion.estado = 'error';
                console.warn(`[Resultados WebSocket] ${siteEnv}: error de conexión`);
            });
            conexion.socket.addEventListener('close', () => {
                conexion.socket = null;
                conexion.estado = 'desconectado';
                conexion.sessionId = null;
                conexion.sessionRecibidaEn = 0;
                if (conexion.intentos < 5) {
                    conexion.reconexion = setTimeout(() => conectarWebSocketResultados(siteEnv), 2000);
                } else {
                    console.warn(`[Resultados WebSocket] ${siteEnv}: no disponible; HTTP protegido también queda en espera de ws.session`);
                }
            });
        } catch (e) {
            conexion.socket = null;
            conexion.estado = 'no disponible';
            console.warn(`[Resultados WebSocket] ${siteEnv}: no se pudo abrir: ${e.message}`);
        }
    }

    function mostrarEsperaLotDom(btn, texto = '⏳ Consultando LotDom...') {
        if (!btn) return;
        btn.innerHTML = texto;
        btn.style.backgroundColor = '#2196f3';
        btn.disabled = true;
    }

    function esFechaLotDomDeHoy(f) {
        return f.formatoRover === obtenerFechaHoy().formatoRover;
    }

    function scoreLotDom(session) {
        return Array.isArray(session?.score?.[0]) ? session.score[0].map(v => String(v ?? '').trim()) : [];
    }

    function sesionLotDomPorFecha(data, fechaISO) {
        const sessions = Array.isArray(data?.game?.sessions) ? data.game.sessions : [];
        return sessions.find(s => String(s?.date || '').slice(0, 10) === fechaISO.slice(0, 10)) || null;
    }

    async function solicitarSiteGameLotDom(siteGameId, f, siteEnv = 'dominicana') {
        const sessionId = await esperarIdSesionResultados(siteEnv);
        if (!sessionId) throw new Error('HTTP omitido: ws.session no disponible después de 4 s');
        const url = `${LOTDOM_API_BASE}/site-games/${siteGameId}?date=${encodeURIComponent(f.formatoLotDomISO)}`;
        const acceptLanguage = acceptLanguageConSesionResultados(sessionId);
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: { 'Accept-Language':acceptLanguage },
                timeout: 15000,
                onload: r => {
                    try {
                        if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const validacion = autenticarRespuestaResultados(r, siteEnv);
                        resolve({ data:JSON.parse(r.responseText), url, status:r.status, ...validacion });
                    } catch (e) { reject(e); }
                },
                onerror: () => reject(new Error('error de conexión')),
                ontimeout: () => reject(new Error('timeout'))
            });
        });
    }

    async function solicitarCompaniaLotDom(companyId, f, siteEnv = 'dominicana') {
        const sessionId = await esperarIdSesionResultados(siteEnv);
        if (!sessionId) throw new Error('HTTP omitido: ws.session no disponible después de 4 s');
        const url = `${LOTDOM_API_BASE}/site-companies/${companyId}?date=${encodeURIComponent(f.formatoLotDomISO)}&limit=2`;
        const acceptLanguage = acceptLanguageConSesionResultados(sessionId);
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: { 'Accept-Language':acceptLanguage },
                timeout: 15000,
                onload: r => {
                    try {
                        if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const validacion = autenticarRespuestaResultados(r, siteEnv);
                        resolve({ data:JSON.parse(r.responseText), url, status:r.status, ...validacion });
                    } catch (e) { reject(e); }
                },
                onerror: () => reject(new Error('error de conexión')),
                ontimeout: () => reject(new Error('timeout'))
            });
        });
    }

    function resolverSesionCompartidaLotDom(siteGame, siteGameId, f, esCompleta, etiqueta, operacion, apiUrl, httpAutenticado, cacheControl) {
        const fechaISO = f.formatoLotDomISO;
        const gameId = siteGame?.game_id || siteGame?.game?._id;
        const sessionHttp = httpAutenticado ? sesionLotDomPorFecha(siteGame, fechaISO) : null;
        const sessionWs = gameId ? sesionCacheLotDom(gameId, fechaISO, operacion.siteEnv) : null;
        const decision = conciliarSesionesLotDom({
            sessionHttp,
            sessionWs,
            f,
            esCompleta,
            etiqueta,
            siteEnv: operacion.siteEnv,
            fuenteHttp: httpAutenticado ? 'LotDom site-companies validado' : 'LotDom HTTP señuelo descartado'
        });
        const clave = gameId ? claveSesionLotDom(gameId, fechaISO, operacion.siteEnv) : null;

        console.table([{
            Fuente: 'LotDom site-companies',
            Sorteo: etiqueta,
            SiteGameID: siteGameId,
            GameID: gameId || '—',
            FechaBuscada: fechaISO.slice(0,10),
            SolicitudesHTTPDelClic: 1,
            RespuestaCompartida: 'Pick 3 + Pick 4',
            HTTPValidado: httpAutenticado,
            CacheControl: cacheControl,
            SesiónHTTP: sessionHttp?.date || '—',
            ScoreHTTP: scoreLotDom(sessionHttp).join('-') || '—',
            HTTPCompleto: decision.httpCompleta,
            ScoreWebSocket: scoreLotDom(sessionWs).join('-') || '—',
            CachéCompleta: decision.wsCompleta,
            FuenteElegida: decision.fuente,
            MotivoElección: decision.motivo,
            WebSocket: estadoWebSocketResultados(operacion.siteEnv),
            URL: apiUrl
        }]);

        if (decision.completa) {
            if (clave) lotDomLive.seguimientos.delete(clave);
            return { session:decision.session, data:siteGame, fuente:decision.fuente, intentos:1, motivo:null };
        }

        if (clave && esFechaLotDomDeHoy(f) && operacionLotDomActiva(operacion)) {
            lotDomLive.seguimientos.set(clave, {
                etiqueta,
                fechaRover:f.formatoRover,
                siteGameId,
                siteEnv:operacion.siteEnv,
                esCompleta,
                operacionId:operacion.id
            });
        }
        return {
            session:decision.session,
            data:siteGame,
            fuente:decision.fuente,
            intentos:1,
            motivo:siteGame ? decision.motivo : 'SiteGame no encontrado en la respuesta compartida'
        };
    }

    async function obtenerSesionLotDom(siteGameId, f, esCompleta, etiqueta = 'resultado', operacion = null) {
        const fechaISO = f.formatoLotDomISO;
        const siteEnv = operacion?.siteEnv || 'dominicana';
        try {
            const respuesta = await solicitarSiteGameLotDom(siteGameId, f, siteEnv);
            const data = respuesta.data;
            const gameId = data?.game_id || data?.game?._id;
            const sessionHttp = respuesta.autenticada ? sesionLotDomPorFecha(data, fechaISO) : null;
            const scoreHttp = scoreLotDom(sessionHttp);
            const sessionWs = gameId ? sesionCacheLotDom(gameId, fechaISO, siteEnv) : null;
            const decision = conciliarSesionesLotDom({
                sessionHttp,
                sessionWs,
                f,
                esCompleta,
                etiqueta,
                siteEnv,
                fuenteHttp: respuesta.autenticada ? 'LotDom site-games validado' : 'LotDom HTTP señuelo descartado'
            });
            console.table([{
                Fuente: 'LotDom site-games',
                Sorteo: etiqueta,
                SiteGameID: siteGameId,
                GameID: gameId || '—',
                FechaBuscada: fechaISO.slice(0, 10),
                SolicitudesHTTP: 1,
                CredencialWS: 'ws.session presente',
                HTTPValidado: respuesta.autenticada,
                CacheControl: respuesta.cacheControl,
                SesionesRecibidas: Array.isArray(data?.game?.sessions) ? data.game.sessions.length : 0,
                SesiónEncontrada: sessionHttp?.date || '—',
                ScoreHTTP: scoreHttp.length ? scoreHttp.join('-') : '—',
                HTTPCompleto: decision.httpCompleta,
                ScoreWebSocket: scoreLotDom(sessionWs).join('-') || '—',
                WebSocketCompleto: decision.wsCompleta,
                FuenteElegida: decision.fuente,
                MotivoElección: decision.motivo,
                WebSocket: estadoWebSocketResultados(siteEnv),
                URL: respuesta.url
            }]);

            if (decision.completa) {
                if (gameId) lotDomLive.seguimientos.delete(claveSesionLotDom(gameId, fechaISO, siteEnv));
                return { session:decision.session, data, fuente:decision.fuente, intentos:1, motivo:null };
            }

            if (gameId && esFechaLotDomDeHoy(f) && (!operacion || operacionLotDomActiva(operacion))) {
                lotDomLive.seguimientos.set(claveSesionLotDom(gameId, fechaISO, siteEnv), {
                    etiqueta,
                    fechaRover: f.formatoRover,
                    siteGameId,
                    siteEnv,
                    esCompleta,
                    operacionId: operacion?.id || null
                });
                console.table([{
                    Fuente: 'LotDom WebSocket (caché)',
                    Sorteo: etiqueta,
                    GameID: gameId,
                    FechaBuscada: fechaISO.slice(0, 10),
                    Estado: sessionWs ? 'resultado en caché todavía incompleto' : 'sin resultado recibido para esta fecha',
                    WebSocket: estadoWebSocketResultados(siteEnv),
                    ScoreEnCaché: scoreLotDom(sessionWs).join('-') || '—',
                    Seguimiento: 'activo hasta recibir el resultado completo',
                    EsperaDelClic: '0 s',
                    SolicitudesHTTPAdicionales: 0
                }]);
            }

            return {
                session:decision.session,
                data,
                fuente:decision.fuente,
                intentos: 1,
                motivo:decision.motivo
            };
        } catch (e) {
            console.warn(`[LotDom site-games] ${etiqueta}: ${e.message}`);
            console.table([{
                Fuente: 'LotDom site-games',
                Sorteo: etiqueta,
                SiteGameID: siteGameId,
                FechaBuscada: fechaISO.slice(0, 10),
                SolicitudesHTTP: 1,
                Estado: `error: ${e.message}`,
                WebSocket: estadoWebSocketResultados(siteEnv)
            }]);
            return { session:null, data:null, fuente:'LotDom site-games', intentos:1, motivo:e.message };
        }
    }

    // ==========================================
    // DISPATCHER
    // ==========================================
    function copiarLoteria(tipo) {
        const lot = LOTERIAS[tipo];
        const btn = document.querySelector('#menu-loteria-script button');
        const operacionActiva = lotDomLive.operaciones.get(tipo);
        if (esTipoConSeguimientoLotDom(lot?.tipo) && operacionActiva) {
            cancelarOperacionLotDom(operacionActiva, 'segundo clic en la lotería');
            return;
        }
        btn.disabled = true;

        if (lot.tipo === 'lotdomAPI')        return copiarLoteriaLotDomAPI(tipo, lot, btn);
        if (lot.tipo === 'lotdomAPIUnico')   return copiarLoteriaLotDomAPIUnico(tipo, lot, btn);
        if (lot.tipo === 'lotdomAPIPick')    return copiarLoteriaLotDomAPIPick(tipo, lot, btn);
        if (lot.tipo === 'mangos')           return copiarLoteriaMangos(lot, btn);
        if (lot.tipo === 'massmidday')       return copiarLoteriaMassMidday(lot, btn);
        if (lot.tipo === 'qplay')            return copiarLoteriaQplay(lot, btn);
        if (lot.tipo === 'premier')          return copiarLoteriaPremier(lot, btn);
        if (lot.tipo === 'jamaica')          return copiarLoteriaJamaica(lot, btn);
        if (lot.tipo === 'anguilla3fuentes') return copiarLoteriaAnguillaTresFuentes(tipo, lot, btn);
        if (lot.tipo === 'pennsylvaniaVimeo') return copiarLoteriaPennsylvaniaVimeo(lot, btn);
        if (lot.tipo === 'rss')              return copiarLoteriaRSS(lot, btn);
        if (lot.tipo === 'youtubeRSS')       return copiarLoteriaYoutubeRSS(lot, btn);
        if (lot.tipo === 'haitibolet')       return copiarLoteriaHaitiBolet(tipo, lot, btn);
        if (lot.tipo === 'nicaragua')        return copiarLoteriaNicaragua(tipo, lot, btn);
        if (lot.tipo === 'honduras')         return copiarLoteriaHonduras(tipo, lot, btn);
        if (lot.tipo === 'salvador')         return copiarLoteriaSalvador(lot, btn);
        mostrarMensaje(btn, '❌ Tipo no reconocido', '#f44336');
    }

    // ==========================================
    // LOTDOM API — Quiniela normal
    // ==========================================
    async function copiarLoteriaLotDomAPI(key, lot, btn) {
        const f = obtenerFechaDesdeInput();
        const siteGameId = LOTDOM_SITE_GAME_ID[key];
        if (!siteGameId || typeof siteGameId !== 'string') { mostrarMensaje(btn, '❌ SiteGame ID no configurado', '#f44336'); return; }
        const operacion = iniciarOperacionLotDom(key, lot, f);

        try {
            mostrarEsperaLotDom(btn);
            const completa = session => {
                const score = scoreLotDom(session);
                return score.length >= 3 && score.slice(0, 3).every(n => /^\d{1,2}$/.test(n));
            };
            const resultado = await obtenerSesionLotDom(siteGameId, f, completa, lot.nombre, operacion);
            if (!operacionLotDomActiva(operacion)) return;
            const score = scoreLotDom(resultado.session);

            if (!completa(resultado.session)) {
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: score.join('-') || '—', fuente: resultado.fuente, estado: resultado.motivo, sonDeHoy: esFechaLotDomDeHoy(f) });
                const vinculado = vincularSeguimientoOperacionLotDom(operacion, resultado, f, sessionWs => {
                    const numeros = scoreLotDom(sessionWs).slice(0, 3);
                    if (!finalizarOperacionLotDom(operacion, 'LotDom WebSocket', numeros.join('-'))) return;
                    const ok = llenarCampos(lot, numeros[0], numeros[1], numeros[2], f.formatoRover, btn);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numeros.join('-'), fuente: 'LotDom WebSocket', estado: ok ? '✅ Copiado automáticamente' : '⚠️ Fila no visible', sonDeHoy: true });
                });
                if (vinculado) {
                    activarEsperaOperacionLotDom(operacion);
                    liberarBotonPorWebSocket(btn);
                }
                else {
                    cancelarOperacionLotDom(operacion, resultado.motivo || 'WebSocket no disponible para esta fecha');
                    mostrarMensaje(btn, `⚠️ ${resultado.motivo}`, '#ff9800');
                }
                return;
            }

            const [p, s, t] = score.slice(0, 3);
            finalizarOperacionLotDom(operacion, resultado.fuente, `${p}-${s}-${t}`);
            const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `${p}-${s}-${t}`, fuente: resultado.fuente, estado: ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy: esFechaLotDomDeHoy(f) });
        } catch(e) {
            cancelarOperacionLotDom(operacion, `error: ${e.message}`);
            console.error(`[LotDom site-games] Error ${lot.nombre}:`, e);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'LotDom site-games', estado: e.message, sonDeHoy: '—' });
            mostrarMensaje(btn, '❌ ERROR DE LOTDOM', '#f44336');
        }
    }

    // ==========================================
    // LOTDOM API PICK — Pick3/Pick4
    // ==========================================
    async function copiarLoteriaLotDomAPIPick(key, lot, btn) {
        const f = obtenerFechaDesdeInput();
        const gameIds = LOTDOM_SITE_GAME_ID[key];
        const companyId = LOTDOM_PICK_COMPANY_ID[key];
        if (!companyId || !gameIds?.pick3 || !gameIds?.pick4) { mostrarMensaje(btn, '❌ IDs Pick no configurados', '#f44336'); return; }
        const operacion = iniciarOperacionLotDom(key, lot, f);

        try {
            mostrarEsperaLotDom(btn, '⏳ Consultando Pick 3 y Pick 4...');
            const completa3 = session => {
                const score = scoreLotDom(session);
                return score.length >= 3 && score.slice(0, 3).every(n => /^\d$/.test(n));
            };
            const completa4 = session => {
                const score = scoreLotDom(session);
                return score.length >= 4 && score.slice(0, 4).every(n => /^\d$/.test(n));
            };
            const respuesta = await solicitarCompaniaLotDom(companyId, f, operacion.siteEnv);
            if (!operacionLotDomActiva(operacion)) return;
            const siteGames = Array.isArray(respuesta.data?.siteGames) ? respuesta.data.siteGames : [];
            const siteGame3 = siteGames.find(item => item?._id === gameIds.pick3) || null;
            const siteGame4 = siteGames.find(item => item?._id === gameIds.pick4) || null;
            const r3 = resolverSesionCompartidaLotDom(siteGame3, gameIds.pick3, f, completa3, `${lot.nombre} Pick 3`, operacion, respuesta.url, respuesta.autenticada, respuesta.cacheControl);
            const r4 = resolverSesionCompartidaLotDom(siteGame4, gameIds.pick4, f, completa4, `${lot.nombre} Pick 4`, operacion, respuesta.url, respuesta.autenticada, respuesta.cacheControl);
            operacion.pick3 = scoreLotDom(r3.session).slice(0, 3).join('');
            operacion.pick4 = scoreLotDom(r4.session).slice(0, 4).join('');
            const p3 = operacion.pick3;
            const p4 = operacion.pick4;
            const fuente = r3.fuente === r4.fuente ? r3.fuente : `${r3.fuente} + ${r4.fuente}`;

            if (!/^\d{3}$/.test(p3) || !/^\d{4}$/.test(p4)) {
                const motivo = `Pick parcial: P3=${p3 || '—'} | P4=${p4 || '—'}`;
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: motivo, fuente, estado: r3.motivo || r4.motivo || 'resultado incompleto', sonDeHoy: esFechaLotDomDeHoy(f) });
                const completarSiListo = fuenteWs => {
                    if (!operacionLotDomActiva(operacion)) return;
                    if (!/^\d{3}$/.test(operacion.pick3 || '') || !/^\d{4}$/.test(operacion.pick4 || '')) return;
                    const resultadoFinal = `Pick3:${operacion.pick3} | Pick4:${operacion.pick4}`;
                    if (!finalizarOperacionLotDom(operacion, fuenteWs, resultadoFinal)) return;
                    const ok = llenarCamposPick(lot, operacion.pick3, operacion.pick4, f.formatoRover, btn);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: resultadoFinal, fuente: fuenteWs, estado: ok ? '✅ Copiado automáticamente' : '⚠️ Fila no visible', sonDeHoy: true });
                };
                let vinculados = 0;
                let faltantes = 0;
                const inputsPendientes = [];
                if (/^\d{3}$/.test(p3)) marcarPickDisponibleOperacion(operacion, 'pick3', p3, r3.fuente);
                if (/^\d{4}$/.test(p4)) marcarPickDisponibleOperacion(operacion, 'pick4', p4, r4.fuente);
                if (!/^\d{3}$/.test(p3)) {
                    faltantes++;
                    inputsPendientes.push('pick3');
                    vinculados += Number(vincularSeguimientoOperacionLotDom(operacion, r3, f, sessionWs => {
                        operacion.pick3 = scoreLotDom(sessionWs).slice(0, 3).join('');
                        marcarPickDisponibleOperacion(operacion, 'pick3', operacion.pick3, 'LotDom WebSocket');
                        completarSiListo('LotDom WebSocket');
                    }));
                }
                if (!/^\d{4}$/.test(p4)) {
                    faltantes++;
                    inputsPendientes.push('pick4');
                    vinculados += Number(vincularSeguimientoOperacionLotDom(operacion, r4, f, sessionWs => {
                        operacion.pick4 = scoreLotDom(sessionWs).slice(0, 4).join('');
                        marcarPickDisponibleOperacion(operacion, 'pick4', operacion.pick4, 'LotDom WebSocket');
                        completarSiListo('LotDom WebSocket');
                    }));
                }
                if (vinculados === faltantes) {
                    activarEsperaOperacionLotDom(operacion, inputsPendientes);
                    liberarBotonPorWebSocket(btn);
                }
                else {
                    cancelarOperacionLotDom(operacion, 'Pick incompleto sin seguimiento WebSocket disponible');
                    mostrarMensaje(btn, '⚠️ Resultados parciales', '#ff9800');
                }
                return;
            }

            finalizarOperacionLotDom(operacion, fuente, `Pick3:${p3} | Pick4:${p4}`);
            const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `Pick3:${p3} | Pick4:${p4}`, fuente, estado: ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy: esFechaLotDomDeHoy(f) });
        } catch(e) {
            cancelarOperacionLotDom(operacion, `error: ${e.message}`);
            console.error(`[LotDom site-games Pick] Error ${lot.nombre}:`, e);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'LotDom site-games', estado: e.message, sonDeHoy: '—' });
            mostrarMensaje(btn, '❌ ERROR DE LOTDOM', '#f44336');
        }
    }

    // ==========================================
    // LOTDOM API ÚNICO — 1 solo bolo
    // ==========================================
    async function copiarLoteriaLotDomAPIUnico(key, lot, btn) {
        const f = obtenerFechaDesdeInput();
        const siteGameId = LOTDOM_SITE_GAME_ID[key];
        if (!siteGameId || typeof siteGameId !== 'string') { mostrarMensaje(btn, '❌ SiteGame ID no configurado', '#f44336'); return; }
        const operacion = iniciarOperacionLotDom(key, lot, f);

        try {
            mostrarEsperaLotDom(btn);
            const completa = session => /^\d{1,2}$/.test(scoreLotDom(session)[0] || '');
            const resultado = await obtenerSesionLotDom(siteGameId, f, completa, lot.nombre, operacion);
            if (!operacionLotDomActiva(operacion)) return;
            const numero = scoreLotDom(resultado.session)[0] || '';

            if (!completa(resultado.session)) {
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numero || '—', fuente: resultado.fuente, estado: resultado.motivo, sonDeHoy: esFechaLotDomDeHoy(f) });
                const vinculado = vincularSeguimientoOperacionLotDom(operacion, resultado, f, sessionWs => {
                    const numeroWs = String(scoreLotDom(sessionWs)[0] || '').padStart(2, '0');
                    if (!finalizarOperacionLotDom(operacion, 'LotDom WebSocket', numeroWs)) return;
                    const ok = llenarCampoUnico(lot, numeroWs, f.formatoRover, btn);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numeroWs, fuente: 'LotDom WebSocket', estado: ok ? '✅ Copiado automáticamente' : '⚠️ Fila no visible', sonDeHoy: true });
                });
                if (vinculado) {
                    activarEsperaOperacionLotDom(operacion);
                    liberarBotonPorWebSocket(btn);
                }
                else {
                    cancelarOperacionLotDom(operacion, resultado.motivo || 'WebSocket no disponible para esta fecha');
                    mostrarMensaje(btn, `⚠️ ${resultado.motivo}`, '#ff9800');
                }
                return;
            }

            const numStr = String(numero).padStart(2, '0');
            finalizarOperacionLotDom(operacion, resultado.fuente, numStr);
            const ok = llenarCampoUnico(lot, numStr, f.formatoRover, btn);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numStr, fuente: resultado.fuente, estado: ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy: esFechaLotDomDeHoy(f) });
        } catch(e) {
            cancelarOperacionLotDom(operacion, `error: ${e.message}`);
            console.error(`[LotDom site-games Único] Error ${lot.nombre}:`, e);
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'LotDom site-games', estado: e.message, sonDeHoy: '—' });
            mostrarMensaje(btn, '❌ ERROR DE LOTDOM', '#f44336');
        }
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
    // PENNSYLVANIA MIDDAY — Vimeo principal, RSS respaldo
    // ==========================================
    function extraerUrlVideoPennsylvaniaVimeo(html, fechaRover) {
        const tituloEsperado = `PA Lottery PA_MidDay_2016 ${fechaRover}`.toLowerCase();
        const doc = new DOMParser().parseFromString(html, 'text/html');

        // Plan A: enlace visible/SSR del perfil.
        for (const enlace of doc.querySelectorAll('a[href]')) {
            const titulo = [
                enlace.textContent,
                enlace.getAttribute('title'),
                enlace.getAttribute('aria-label')
            ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
            if (!titulo.includes(tituloEsperado)) continue;

            const href = enlace.getAttribute('href') || '';
            const m = href.match(/(?:vimeo\.com\/|\/)(\d+)(?:$|[/?#])/i);
            if (m) return `https://vimeo.com/${m[1]}`;
        }

        // Plan B: Vimeo suele incluir las tarjetas en JSON dentro del HTML.
        // Se normalizan escapes comunes y se busca el ID más cercano al título exacto.
        const plano = String(html)
            .replace(/\\u002F/gi, '/')
            .replace(/\\\//g, '/')
            .replace(/\\"/g, '"')
            .replace(/&quot;/gi, '"')
            .replace(/&#x2F;/gi, '/')
            .replace(/&amp;/gi, '&');
        const indiceTitulo = plano.toLowerCase().indexOf(tituloEsperado);
        if (indiceTitulo < 0) return null;

        const inicio = Math.max(0, indiceTitulo - 5000);
        const fin = Math.min(plano.length, indiceTitulo + tituloEsperado.length + 5000);
        const bloque = plano.slice(inicio, fin);
        const candidatos = [];
        const patrones = [
            /https?:\/\/vimeo\.com\/(\d{6,12})/gi,
            /["'](?:uri|href)["']\s*:\s*["']\/(?:videos\/)?(\d{6,12})(?:[/?#"'])/gi,
            /href=["'][^"']*\/(\d{6,12})(?:[/?#"'])/gi
        ];
        for (const re of patrones) {
            let m;
            while ((m = re.exec(bloque)) !== null) {
                candidatos.push({ id: m[1], distancia: Math.abs((inicio + m.index) - indiceTitulo) });
            }
        }
        if (!candidatos.length) return null;
        candidatos.sort((a, b) => a.distancia - b.distancia);
        return `https://vimeo.com/${candidatos[0].id}`;
    }

    function extraerPicksPennsylvaniaVimeo(html) {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const texto = [
            doc.querySelector('.css-1besbcg p.first')?.textContent || '',
            doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '',
            doc.querySelector('meta[name="description"]')?.getAttribute('content') || '',
            doc.body?.textContent || '',
            String(html)
                .replace(/\\n/g, '\n')
                .replace(/\\u0028/gi, '(')
                .replace(/\\u0029/gi, ')')
        ].join('\n');

        function leerPick(nombre, cantidad) {
            const re = new RegExp(`${nombre}\\s*((?:\\(\\s*\\d\\s*\\)\\s*){${cantidad}})`, 'i');
            const m = texto.match(re);
            if (!m) return null;
            const digitos = m[1].match(/\d/g) || [];
            return digitos.length === cantidad ? digitos.join('') : null;
        }

        const p3 = leerPick('Pick3', 3);
        const p4 = leerPick('Pick4', 4);
        return p3 && p4 ? { p3, p4 } : null;
    }

    function copiarLoteriaPennsylvaniaVimeo(lot, btn) {
        const f = obtenerFechaDesdeInput();
        const esFechaDeHoy = f.formatoRover === obtenerFechaHoy().formatoRover;
        const usarRSS = motivo => {
            console.warn(`[Pennsylvania] Vimeo: ${motivo} → RSS`);
            logTablaResultado({
                loteria: lot.nombre,
                fecha: f.formatoRover,
                resultado: '—',
                fuente: 'Vimeo → RSS FeedBlitz',
                estado: `⚠️ ${motivo}`,
                sonDeHoy: '—'
            });
            copiarLoteriaRSS(lot, btn, f);
        };

        GM_xmlhttpRequest({
            method: 'GET',
            url: `${lot.urlVimeo}?t=${Date.now()}`,
            headers: {
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache, no-store, max-age=0',
                'Pragma': 'no-cache'
            },
            timeout: 15000,
            onload: response => {
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const videoUrl = extraerUrlVideoPennsylvaniaVimeo(response.responseText, f.formatoRover);
                    if (!videoUrl) { usarRSS('video Midday de la fecha seleccionada no encontrado'); return; }

                    console.log(`[Pennsylvania] Vimeo ✅ Video localizado: ${videoUrl}`);
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: `${videoUrl}?t=${Date.now()}`,
                        headers: {
                            'Accept-Language': 'en-US,en;q=0.9',
                            'Cache-Control': 'no-cache, no-store, max-age=0',
                            'Pragma': 'no-cache'
                        },
                        timeout: 15000,
                        onload: videoResponse => {
                            try {
                                if (videoResponse.status !== 200) throw new Error(`HTTP ${videoResponse.status}`);
                                const picks = extraerPicksPennsylvaniaVimeo(videoResponse.responseText);
                                if (!picks) { usarRSS('descripción sin Pick3/Pick4 completos'); return; }

                                const { p3, p4 } = picks;
                                console.log(`[Pennsylvania] Vimeo ✅ ${lot.nombre} | Pick3=${p3} | Pick4=${p4}`);
                                const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
                                logTablaResultado({
                                    loteria: lot.nombre,
                                    fecha: f.formatoRover,
                                    resultado: `Pick3: ${p3} | Pick4: ${p4}`,
                                    fuente: 'Vimeo',
                                    estado: ok ? '✅ Copiado (Vimeo)' : '⚠️ Fila no visible',
                                    sonDeHoy: esFechaDeHoy
                                });
                            } catch(e) { usarRSS(`video: ${e.message}`); }
                        },
                        onerror:   () => usarRSS('error al abrir el video'),
                        ontimeout: () => usarRSS('timeout al abrir el video')
                    });
                } catch(e) { usarRSS(`perfil: ${e.message}`); }
            },
            onerror:   () => usarRSS('error al consultar el perfil'),
            ontimeout: () => usarRSS('timeout al consultar el perfil')
        });
    }

    // RSS de respaldo (Pennsylvania)
    function copiarLoteriaRSS(lot, btn, fechaSeleccionada=null) {
        const f = fechaSeleccionada || obtenerFechaDesdeInput();
        const esFechaDeHoy = f.formatoRover === obtenerFechaHoy().formatoRover;
        let p3=null, p4=null, p3Listo=false, p4Listo=false, fechaP3=null, fechaP4=null, finalizado=false;
        let estadoP3='pendiente', estadoP4='pendiente';

        function verificarResultados() {
            if (!p3Listo || !p4Listo || finalizado) return;
            finalizado = true;

            if (p3 && p4 && fechaP3 === f.formatoRover && fechaP4 === f.formatoRover) {
                const p=p3.slice(-2), s=p4.slice(0,2), t=p4.slice(-2);
                const ok = llenarCamposPick(lot,p3,p4,f.formatoRover,btn,p,s,t);
                console.log(`[Pennsylvania] RSS FeedBlitz ✅ ${lot.nombre} | Fecha=${f.formatoRover} | Pick3=${p3} | Pick4=${p4}`);
                logTablaResultado({
                    loteria: lot.nombre,
                    fecha: f.formatoRover,
                    resultado: `Pick3: ${p3} | Pick4: ${p4}`,
                    fuente: 'RSS FeedBlitz',
                    estado: ok ? '✅ Copiado (RSS)' : '⚠️ Fila no visible',
                    sonDeHoy: esFechaDeHoy
                });
                return;
            }

            const detalle = `Pick3: ${estadoP3} | Pick4: ${estadoP4}`;
            console.warn(`[Pennsylvania] RSS FeedBlitz ⚠️ ${f.formatoRover} | ${detalle}`);
            logTablaResultado({
                loteria: lot.nombre,
                fecha: f.formatoRover,
                resultado: `Pick3: ${p3 || '—'} | Pick4: ${p4 || '—'}`,
                fuente: 'RSS FeedBlitz',
                estado: `⚠️ Resultado no disponible para la fecha seleccionada | ${detalle}`,
                sonDeHoy: false
            });
            mostrarMensaje(btn,'⚠️ RSS sin resultado para esa fecha','#ff9800');
        }

        GM_xmlhttpRequest({ method:'GET', url:lot.urlPick3+'?t='+Date.now(),
            onload:response=>{ try { if(response.status!==200){estadoP3=`HTTP ${response.status}`;p3Listo=true;verificarResultados();return;} const doc=new DOMParser().parseFromString(response.responseText,'text/xml'); if(doc.querySelector('parsererror')){estadoP3='RSS inválido';p3Listo=true;verificarResultados();return;} estadoP3='fecha no encontrada'; for(let item of doc.querySelectorAll('item')){const titulo=item.querySelector('title')?.textContent||'';const descripcion=item.querySelector('description')?.textContent||'';const fechaMatch=titulo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(fechaMatch){const[_,mes,dia,anio]=fechaMatch;const fechaRSS=`${mes.padStart(2,'0')}/${dia.padStart(2,'0')}/${anio}`;if(fechaRSS===f.formatoRover){const numerosMatch=descripcion.match(/Winning Numbers:[^\d]*(\d)[^\d]+(\d)[^\d]+(\d)/i);if(numerosMatch){p3=numerosMatch[1]+numerosMatch[2]+numerosMatch[3];fechaP3=fechaRSS;estadoP3='OK';break;}estadoP3='números no leídos';}}} p3Listo=true;verificarResultados(); }catch(e){estadoP3=`error: ${e.message}`;p3Listo=true;verificarResultados();} },
            onerror:()=>{estadoP3='error de conexión';p3Listo=true;verificarResultados();},
            ontimeout:()=>{estadoP3='timeout';p3Listo=true;verificarResultados();},
            timeout:15000
        });
        GM_xmlhttpRequest({ method:'GET', url:lot.urlPick4+'?t='+Date.now(),
            onload:response=>{ try { if(response.status!==200){estadoP4=`HTTP ${response.status}`;p4Listo=true;verificarResultados();return;} const doc=new DOMParser().parseFromString(response.responseText,'text/xml'); if(doc.querySelector('parsererror')){estadoP4='RSS inválido';p4Listo=true;verificarResultados();return;} estadoP4='fecha no encontrada'; for(let item of doc.querySelectorAll('item')){const titulo=item.querySelector('title')?.textContent||'';const descripcion=item.querySelector('description')?.textContent||'';const fechaMatch=titulo.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(fechaMatch){const[_,mes,dia,anio]=fechaMatch;const fechaRSS=`${mes.padStart(2,'0')}/${dia.padStart(2,'0')}/${anio}`;if(fechaRSS===f.formatoRover){const numerosMatch=descripcion.match(/Winning Numbers:[^\d]*(\d)[^\d]+(\d)[^\d]+(\d)[^\d]+(\d)/i);if(numerosMatch){p4=numerosMatch[1]+numerosMatch[2]+numerosMatch[3]+numerosMatch[4];fechaP4=fechaRSS;estadoP4='OK';break;}estadoP4='números no leídos';}}} p4Listo=true;verificarResultados(); }catch(e){estadoP4=`error: ${e.message}`;p4Listo=true;verificarResultados();} },
            onerror:()=>{estadoP4='error de conexión';p4Listo=true;verificarResultados();},
            ontimeout:()=>{estadoP4='timeout';p4Listo=true;verificarResultados();},
            timeout:15000
        });
    }

    // ==========================================
    // YOUTUBE / TENNESSEE
    // ==========================================
    const TENNESSEE_YT_CHANNEL_ID = 'UCjZL1HBaSxyhUs4ASqfuRrQ';

    function copiarLoteriaYoutubeRSS(lot, btn) {
        const f = obtenerFechaDesdeInput();
        buscarTennesseeEnCanal(lot, btn, f);
    }

    function extraerJsonAsignadoYoutube(html, marcador) {
        const indiceMarcador = html.indexOf(marcador);
        if (indiceMarcador < 0) return null;
        const inicio = html.indexOf('{', indiceMarcador + marcador.length);
        if (inicio < 0) return null;
        let profundidad = 0, enCadena = false, escapado = false;
        for (let i = inicio; i < html.length; i++) {
            const c = html[i];
            if (enCadena) { if (escapado) escapado = false; else if (c === '\\') escapado = true; else if (c === '"') enCadena = false; continue; }
            if (c === '"') enCadena = true;
            else if (c === '{') profundidad++;
            else if (c === '}') { profundidad--; if (profundidad === 0) return JSON.parse(html.slice(inicio, i + 1)); }
        }
        return null;
    }

    function textoRendererYoutube(obj) {
        if (!obj) return '';
        if (typeof obj === 'string') return obj;
        if (typeof obj.simpleText === 'string') return obj.simpleText;
        if (typeof obj.content === 'string') return obj.content;
        if (Array.isArray(obj.runs)) return obj.runs.map(r => r.text || '').join('');
        return '';
    }

    function recolectarVideosYoutube(nodo, mapa) {
        if (!nodo || typeof nodo !== 'object') return;
        const renderers = [nodo.videoRenderer, nodo.gridVideoRenderer, nodo.compactVideoRenderer].filter(Boolean);
        for (const renderer of renderers) {
            const videoId = renderer.videoId || '';
            const title   = textoRendererYoutube(renderer.title);
            if (videoId && title && !mapa.has(videoId)) mapa.set(videoId, { videoId, title });
        }
        const lockup = nodo.lockupViewModel;
        if (lockup) {
            const videoId = lockup.contentId || lockup.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint?.videoId || '';
            const title = textoRendererYoutube(lockup.metadata?.lockupMetadataViewModel?.title);
            if (videoId && title && !mapa.has(videoId)) mapa.set(videoId, { videoId, title });
        }
        for (const valor of Object.values(nodo)) recolectarVideosYoutube(valor, mapa);
    }

    function extraerResultadosTennessee(descripcion) {
        const texto = String(descripcion || '');
        const m3 = texto.match(/Cash3_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);
        const m4 = texto.match(/Cash4_WildBall\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)\s*\((\d)\)/i);
        if (!m3 || !m4) return null;
        return { p3: m3[1] + m3[2] + m3[3], p4: m4[1] + m4[2] + m4[3] + m4[4] };
    }

    function completarTennessee(lot, btn, f, resultados, origen) {
        const { p3, p4 } = resultados;
        console.log(`[Tennessee] ${origen} ✅ ${lot.nombre} | Pick3=${p3} | Pick4=${p4}`);
        const ok = llenarCamposPick(lot, p3, p4, f.formatoRover, btn);
        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `Pick3: ${p3} | Pick4: ${p4}`, estado: ok ? `✅ Copiado (${origen})` : '⚠️ Fila no visible', sonDeHoy: true });
    }

    function buscarTennesseeEnCanal(lot, btn, f) {
        const url = `https://www.youtube.com/channel/${TENNESSEE_YT_CHANNEL_ID}/videos?hl=en&persist_hl=1&_=${Date.now()}`;
        GM_xmlhttpRequest({
            method: 'GET', url,
            headers: { 'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache, no-store, max-age=0', 'Pragma': 'no-cache' },
            timeout: 15000,
            onload: response => {
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const data = extraerJsonAsignadoYoutube(response.responseText, 'var ytInitialData =');
                    if (!data) throw new Error('ytInitialData no encontrado');
                    const mapa = new Map();
                    recolectarVideosYoutube(data, mapa);
                    const regexTurno = new RegExp(`${lot.turno}_C3_C4(?:_WB)?`, 'i');
                    const video = Array.from(mapa.values()).find(v => {
                        if (!regexTurno.test(v.title)) return false;
                        const m = v.title.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        return m && `${m[1]}/${m[2]}/${m[3]}` === f.formatoRover;
                    });
                    if (!video) { console.warn(`[Tennessee] Canal: video no encontrado → RSS`); buscarTennesseeEnRSS(lot, btn, f); return; }
                    console.log(`[Tennessee] Canal ✅ Video localizado: ${video.title}`);
                    leerVideoTennessee(video.videoId, lot, btn, f);
                } catch(e) { console.warn(`[Tennessee] Canal: ${e.message} → RSS`); buscarTennesseeEnRSS(lot, btn, f); }
            },
            onerror:   () => { console.warn('[Tennessee] Canal: error → RSS'); buscarTennesseeEnRSS(lot, btn, f); },
            ontimeout: () => { console.warn('[Tennessee] Canal: timeout → RSS'); buscarTennesseeEnRSS(lot, btn, f); }
        });
    }

    function leerVideoTennessee(videoId, lot, btn, f) {
        const url = `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&hl=en&_=${Date.now()}`;
        GM_xmlhttpRequest({
            method: 'GET', url,
            headers: { 'Accept-Language': 'en-US,en;q=0.9', 'Cache-Control': 'no-cache, no-store, max-age=0', 'Pragma': 'no-cache' },
            timeout: 15000,
            onload: response => {
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const player = extraerJsonAsignadoYoutube(response.responseText, 'var ytInitialPlayerResponse =');
                    let descripcion = player?.videoDetails?.shortDescription || '';
                    if (!descripcion) {
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        descripcion = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
                    }
                    const resultados = extraerResultadosTennessee(descripcion);
                    if (!resultados) { console.warn('[Tennessee] Video: descripción sin números → RSS'); buscarTennesseeEnRSS(lot, btn, f); return; }
                    completarTennessee(lot, btn, f, resultados, 'YouTube directo');
                } catch(e) { console.warn(`[Tennessee] Video: ${e.message} → RSS`); buscarTennesseeEnRSS(lot, btn, f); }
            },
            onerror:   () => { console.warn('[Tennessee] Video: error → RSS'); buscarTennesseeEnRSS(lot, btn, f); },
            ontimeout: () => { console.warn('[Tennessee] Video: timeout → RSS'); buscarTennesseeEnRSS(lot, btn, f); }
        });
    }

    function buscarTennesseeEnRSS(lot, btn, f) {
        const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${TENNESSEE_YT_CHANNEL_ID}&t=${Date.now()}`;
        GM_xmlhttpRequest({
            method: 'GET', url,
            headers: { 'Cache-Control': 'no-cache, no-store, max-age=0', 'Pragma': 'no-cache' },
            timeout: 15000,
            onload: response => {
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/xml');
                    if (doc.querySelector('parsererror')) throw new Error('RSS inválido');
                    const regexTurno = new RegExp(`${lot.turno}_C3_C4(?:_WB)?`, 'i');
                    const entries = doc.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'entry');
                    for (const entry of entries) {
                        const titulo = entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'title')[0]?.textContent || '';
                        if (!regexTurno.test(titulo)) continue;
                        const mFecha = titulo.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        if (!mFecha || `${mFecha[1]}/${mFecha[2]}/${mFecha[3]}` !== f.formatoRover) continue;
                        const mediaDesc = entry.getElementsByTagNameNS('http://search.yahoo.com/mrss/', 'description')[0];
                        const alt = entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'summary')[0] || entry.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'content')[0];
                        const descripcion = mediaDesc?.textContent || alt?.textContent || '';
                        const resultados = extraerResultadosTennessee(descripcion);
                        if (resultados) { completarTennessee(lot, btn, f, resultados, 'RSS'); return; }
                    }
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', estado: 'Video/resultado todavía no disponible', sonDeHoy: false });
                    mostrarMensaje(btn, '⚠️ Video/resultado todavía no disponible', '#ff9800');
                } catch(e) {
                    console.error(`[Tennessee] RSS: ${e.message}`);
                    mostrarMensaje(btn, '❌ No se pudo consultar YouTube', '#f44336');
                }
            },
            onerror:   () => mostrarMensaje(btn, '❌ No se pudo consultar YouTube', '#f44336'),
            ontimeout: () => mostrarMensaje(btn, '❌ TIMEOUT DE YOUTUBE', '#f44336')
        });
    }

    // ==========================================
    // ANGUILLA — 3 fuentes
    // ==========================================
    const ANGUILLA_HORAS = {
        'ANG-8AM':       { sorteosRd:'8:00 AM',  rss:'8AM'  },
        'ANG-9AM':       { sorteosRd:'9:00 AM',  rss:'9AM'  },
        'ANGUILLA-10AM': { sorteosRd:'10:00 AM', rss:'10AM' },
        'ANG-11AM':      { sorteosRd:'11:00 AM', rss:'11AM' },
        'ANG-12PM':      { sorteosRd:'12:00 PM', rss:'12PM' },
        'ANGUILLA-1PM':  { sorteosRd:'1:00 PM',  rss:'1PM'  },
        'ANG-2PM':       { sorteosRd:'2:00 PM',  rss:'2PM'  },
        'ANG-3PM':       { sorteosRd:'3:00 PM',  rss:'3PM'  },
        'ANG-4PM':       { sorteosRd:'4:00 PM',  rss:'4PM'  },
        'ANG-5PM':       { sorteosRd:'5:00 PM',  rss:'5PM'  },
        'ANGUILLA-6PM':  { sorteosRd:'6:00 PM',  rss:'6PM'  },
        'ANG-7PM':       { sorteosRd:'7:00 PM',  rss:'7PM'  },
        'ANG-8PM':       { sorteosRd:'8:00 PM',  rss:'8PM'  },
        'ANGUILLA-9PM':  { sorteosRd:'9:00 PM',  rss:'9PM'  },
        'ANG-10PM':      { sorteosRd:'10:00 PM', rss:'10PM' }
    };

    function textoDiagAnguilla(valor, maximo = 700) {
        let texto;
        try { texto = typeof valor === 'string' ? valor : JSON.stringify(valor); }
        catch (_) { texto = String(valor); }
        if (!texto) return '—';
        return texto.length > maximo ? `${texto.slice(0, maximo)}…` : texto;
    }

    function cabecerasDiagAnguilla(response) {
        const headers = String(response?.responseHeaders || '');
        const leer = nombre => headers.match(new RegExp(`^${nombre}:\\s*(.+)$`, 'im'))?.[1]?.trim() || '—';
        return `date=${leer('date')} | age=${leer('age')} | cache-control=${leer('cache-control')} | etag=${leer('etag')}`;
    }

    function logDiagAnguilla(diag, etapa, datos = {}) {
        console.table([{ Consulta: diag.id, Etapa: etapa, ...datos }]);
    }

    function crearDiagAnguilla(key, lot, horas, f) {
        const diag = { id: `ANG-${Date.now().toString(36).toUpperCase()}`, inicio: Date.now() };
        console.log(`🔎 [Anguilla ${diag.id}] ${lot.nombre} | ${f.formatoRover}`);
        logDiagAnguilla(diag, 'Inicio', {
            Lotería: lot.nombre,
            Código: lot.codigoRoverCorto,
            FechaRover: f.formatoRover,
            FechaLotDom: f.formatoLotDomISO,
            Endpoint: 'site-games',
            SiteGameID: LOTDOM_SITE_GAME_ID[key] || '—',
            Slug: lot.slugLotDom || '—',
            HoraSorteosRD: horas.sorteosRd,
            TítuloRSS: `Anguilla ${horas.rss} hoy:`
        });
        return diag;
    }

    function cerrarDiagAnguilla(diag, estado) {
        if (diag.finalizado) return;
        diag.finalizado = true;
        logDiagAnguilla(diag, 'Fin', { Estado: estado, DuraciónMs: Date.now() - diag.inicio });
    }

    function liberarBotonPorWebSocket(btn) {
        if (!btn) return;
        btn.innerHTML = '🎰 COPIAR LOTERÍAS ▼';
        btn.style.backgroundColor = '#4CAF50';
        btn.disabled = false;
    }

    function copiarLoteriaAnguillaTresFuentes(key, lot, btn) {
        const f = obtenerFechaDesdeInput();
        const horas = ANGUILLA_HORAS[lot.codigoRoverCorto];
        if (!horas) { mostrarMensaje(btn, '❌ Horario Anguilla no configurado', '#f44336'); return; }
        const operacion = iniciarOperacionLotDom(key, lot, f);
        const diag = crearDiagAnguilla(key, lot, horas, f);
        diag.operacion = operacion;
        operacion.alCancelar = motivo => {
            diag.cancelada = true;
            cerrarDiagAnguilla(diag, `Seguimiento cancelado: ${motivo}`);
        };
        intentarAnguillaLotDom(key, lot, btn, horas, f, diag);
    }

    function completarAnguilla(lot, btn, f, numeros, fuente, diag) {
        if (diag.cancelada) return;
        const [p, s, t] = numeros.map(n => String(n).padStart(2, '0'));
        if (diag.operacion && operacionLotDomActiva(diag.operacion)) {
            finalizarOperacionLotDom(diag.operacion, fuente, `${p}-${s}-${t}`);
        }
        console.log(`[Anguilla] ✅ ${fuente} | ${lot.codigoRoverCorto} = ${p}-${s}-${t}`);
        const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
        logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `${p}-${s}-${t}`, fuente, estado: ok ? `✅ Copiado (${fuente})` : '⚠️ Fila no visible', sonDeHoy: esFechaLotDomDeHoy(f) });
        cerrarDiagAnguilla(diag, ok ? `Copiado desde ${fuente}` : `Encontrado en ${fuente}; fila no visible`);
    }

    // Fuente 1: Loterías Dominicanas API
    async function intentarAnguillaLotDom(key, lot, btn, horas, f, diag) {
        const siteGameId = LOTDOM_SITE_GAME_ID[key];
        if (!siteGameId || typeof siteGameId !== 'string') {
            if (diag.operacion && operacionLotDomActiva(diag.operacion)) {
                diag.operacion.alCancelar = null;
                cancelarOperacionLotDom(diag.operacion, 'SiteGame ID no configurado');
            }
            logDiagAnguilla(diag, 'LotDom descartado', { Motivo: 'SiteGame ID no configurado', PróximaFuente: 'SorteosRD' });
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'LotDom site-games', estado: '❌ ID no configurado', sonDeHoy: false });
            intentarAnguillaSorteosRd(lot, btn, horas, f, diag);
            return;
        }

        const fechaISO = f.formatoLotDomISO.slice(0, 10);
        const apiUrl = `${LOTDOM_API_BASE}/site-games/${siteGameId}?date=${encodeURIComponent(f.formatoLotDomISO)}`;
        logDiagAnguilla(diag, 'LotDom site-games solicitud', { URL: apiUrl, FechaBuscada: fechaISO, SiteGameID: siteGameId, Slug: lot.slugLotDom || '—', SolicitudesMax: 1 });
        mostrarEsperaLotDom(btn);

        try {
            const completa = session => {
                const score = scoreLotDom(session);
                return score.length >= 3 && score.slice(0, 3).every(n => /^\d{1,2}$/.test(n));
            };
            const resultado = await obtenerSesionLotDom(siteGameId, f, completa, lot.nombre, diag.operacion);
            if (diag.operacion && !operacionLotDomActiva(diag.operacion)) return;
            const session = resultado.session;
            const numeros = scoreLotDom(session).slice(0, 3);
            const usuarios = Array.isArray(session?.users) ? session.users : [];

            logDiagAnguilla(diag, 'LotDom site-games resultado', {
                FuenteReal: resultado.fuente,
                Intentos: resultado.intentos,
                SiteGameID: siteGameId,
                GameIDInterno: resultado.data?.game_id || resultado.data?.game?._id || session?.game_id || '—',
                Sesiones: Array.isArray(resultado.data?.game?.sessions) ? resultado.data.game.sessions.length : 0,
                FechasRecibidas: textoDiagAnguilla((resultado.data?.game?.sessions || []).map(s => s?.date || 'sin fecha')),
                SesiónSeleccionada: session?.date || 'ninguna',
                ScorePrincipalCrudo: textoDiagAnguilla(session?.score),
                NúmerosInterpretados: numeros.join('-') || '—',
                RegistrosUsuarios: usuarios.length,
                ScoresUsuarios: textoDiagAnguilla(usuarios.map(u => ({ fecha:u?.date || u?.createdAt || u?.updatedAt, score:u?.score }))),
                MotivoSiFalla: resultado.motivo || '—'
            });

            if (!completa(session)) {
                const vinculado = vincularSeguimientoOperacionLotDom(diag.operacion, resultado, f, sessionWs => {
                    const numerosWs = scoreLotDom(sessionWs).slice(0, 3);
                    diag.cancelada = true;
                    logDiagAnguilla(diag, 'Respaldos cancelados por WebSocket', {
                        Fuente: 'LotDom WebSocket',
                        Resultado: numerosWs.join('-') || '—',
                        Acción: 'SorteosRD/RSS detenidos; llenado automático'
                    });
                    if (!finalizarOperacionLotDom(diag.operacion, 'LotDom WebSocket', numerosWs.join('-'))) return;
                    const [p, s, t] = numerosWs.map(n => String(n).padStart(2, '0'));
                    const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: `${p}-${s}-${t}`, fuente: 'LotDom WebSocket', estado: ok ? '✅ Copiado automáticamente' : '⚠️ Fila no visible', sonDeHoy: true });
                    cerrarDiagAnguilla(diag, ok ? 'Copiado automáticamente desde WebSocket' : 'WebSocket completo; fila no visible');
                });
                if (vinculado) {
                    activarEsperaOperacionLotDom(diag.operacion);
                    liberarBotonPorWebSocket(btn);
                }
                else if (diag.operacion) {
                    diag.operacion.alCancelar = null;
                    cancelarOperacionLotDom(diag.operacion, resultado.motivo || 'WebSocket no disponible para esta fecha');
                }
                console.warn(`[Anguilla] ${resultado.motivo} → SorteosRD`);
                logDiagAnguilla(diag, 'LotDom descartado', { Motivo: resultado.motivo, Intentos: resultado.intentos, PróximaFuente: 'SorteosRD' });
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: numeros.join('-') || '—', fuente: resultado.fuente, estado: `❌ LotDom: ${resultado.motivo}`, sonDeHoy: esFechaLotDomDeHoy(f) });
                intentarAnguillaSorteosRd(lot, btn, horas, f, diag);
                return;
            }

            completarAnguilla(lot, btn, f, numeros, resultado.fuente, diag);
        } catch (e) {
            if (diag.operacion && operacionLotDomActiva(diag.operacion)) {
                diag.operacion.alCancelar = null;
                cancelarOperacionLotDom(diag.operacion, `error LotDom: ${e.message}`);
            }
            console.warn(`[Anguilla] LotDom site-games: ${e.message} → SorteosRD`);
            logDiagAnguilla(diag, 'LotDom error', { Motivo: e.message, PróximaFuente: 'SorteosRD' });
            logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'LotDom site-games', estado: `❌ ${e.message}`, sonDeHoy: false });
            intentarAnguillaSorteosRd(lot, btn, horas, f, diag);
        }
    }

    // Fuente 2: SorteosRD
    function intentarAnguillaSorteosRd(lot, btn, horas, f, diag) {
        if (diag.cancelada) return;
        const maxPaginas = 3;

        function extraerHoraExacta(texto) {
            const match = texto.match(/\b(1[0-2]|[1-9]):00\s?(AM|PM)\b/i);
            return match ? match[0].toUpperCase().replace(/\s+/g, ' ') : null;
        }

        function siguiente(numPagina, motivo) {
            if (diag.cancelada) return;
            if (numPagina < maxPaginas) {
                buscarEnPagina(numPagina + 1);
            } else {
                console.warn(`[Anguilla] SorteosRD: ${motivo || 'sin resultado'} → RSS`);
                logDiagAnguilla(diag, 'SorteosRD descartado', { Motivo: motivo || 'sin resultado', PáginasRevisadas: maxPaginas, PróximaFuente: 'RSS EnLoteria' });
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'SorteosRD', estado: `❌ SorteosRD: ${motivo || 'sin resultado'}`, sonDeHoy: false });
                intentarAnguillaRSS(lot, btn, horas, f, diag);
            }
        }

        function buscarEnPagina(numPagina) {
            if (diag.cancelada) return;
            const url = `https://www.sorteosrd.com/sorteosanguila?page=${numPagina}&t=${Date.now()}`;
            const inicio = Date.now();
            logDiagAnguilla(diag, `SorteosRD solicitud P${numPagina}`, { URL: url, FechaBuscada: f.formatoRover, HoraBuscada: horas.sorteosRd });
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                headers: { 'Cache-Control':'no-cache' },
                timeout: 15000,
                onload: response => {
                    if (diag.cancelada) return;
                    try {
                        if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                        const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                        const filas = Array.from(doc.querySelectorAll('tr'));
                        const muestras = [];
                        let mismaHora = 0;
                        let mismaFechaYHora = 0;

                        for (const fila of filas) {
                            const celdas = fila.querySelectorAll('td');
                            if (celdas.length < 2) continue;
                            const fechaTexto = celdas[0].textContent.trim();
                            const horaEncontrada = extraerHoraExacta(fechaTexto);
                            if (horaEncontrada !== horas.sorteosRd) continue;
                            mismaHora++;
                            const mFecha = fechaTexto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                            const fechaEncontrada = mFecha ? `${mFecha[2]}/${mFecha[1]}/${mFecha[3]}` : 'fecha no reconocida';
                            const numeros = Array.from(celdas[1].querySelectorAll('.circulo-naranja'))
                                .map(el => el.textContent.trim())
                                .filter(n => /^\d{1,2}$/.test(n))
                                .slice(0, 3);
                            if (muestras.length < 5) muestras.push({ FechaCruda: fechaTexto, FechaConvertida: fechaEncontrada, Hora: horaEncontrada, Círculos: numeros.join('-') || '—', TextoResultado: celdas[1].textContent.trim() || '—' });
                            if (fechaEncontrada !== f.formatoRover) continue;
                            mismaFechaYHora++;
                            if (numeros.length === 3) {
                                logDiagAnguilla(diag, `SorteosRD coincidencia P${numPagina}`, { FechaCruda: fechaTexto, Resultado: numeros.join('-'), Selector: '.circulo-naranja' });
                                completarAnguilla(lot, btn, f, numeros, 'SorteosRD', diag);
                                return;
                            }
                        }

                        logDiagAnguilla(diag, `SorteosRD respuesta P${numPagina}`, {
                            HTTP: response.status,
                            DuraciónMs: Date.now() - inicio,
                            Bytes: String(response.responseText || '').length,
                            FilasTotales: filas.length,
                            FilasMismaHora: mismaHora,
                            FilasFechaYHora: mismaFechaYHora,
                            MuestrasMismaHora: textoDiagAnguilla(muestras),
                            Caché: cabecerasDiagAnguilla(response)
                        });

                        siguiente(numPagina, 'resultado no encontrado');
                    } catch(e) {
                        logDiagAnguilla(diag, `SorteosRD error P${numPagina}`, { Motivo: e.message, HTTP: response.status, DuraciónMs: Date.now() - inicio });
                        siguiente(numPagina, e.message);
                    }
                },
                onerror: () => {
                    if (diag.cancelada) return;
                    logDiagAnguilla(diag, `SorteosRD error P${numPagina}`, { Motivo: 'error de conexión', DuraciónMs: Date.now() - inicio });
                    siguiente(numPagina, 'error de conexión');
                },
                ontimeout: () => {
                    if (diag.cancelada) return;
                    logDiagAnguilla(diag, `SorteosRD timeout P${numPagina}`, { DuraciónMs: Date.now() - inicio });
                    siguiente(numPagina, 'timeout');
                }
            });
        }

        buscarEnPagina(1);
    }

    function fechaRoverDesdePubDate(pubDate) {
        const fecha = new Date(pubDate);
        if (Number.isNaN(fecha.getTime())) return null;
        const partes = new Intl.DateTimeFormat('en-US', { timeZone:'America/Santo_Domingo', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(fecha);
        const valor = tipo => partes.find(p => p.type === tipo)?.value || '';
        return `${valor('month')}/${valor('day')}/${valor('year')}`;
    }

    // Fuente 3: RSS EnLoteria
    function intentarAnguillaRSS(lot, btn, horas, f, diag) {
        if (diag.cancelada) return;
        const url = `https://enloteria.com/rss?t=${Date.now()}`;
        const inicio = Date.now();
        const tituloEsperado = `Anguilla ${horas.rss} hoy:`.toLowerCase();
        logDiagAnguilla(diag, 'RSS solicitud', { URL: url, FechaBuscada: f.formatoRover, TítuloEsperado: tituloEsperado });
        GM_xmlhttpRequest({
            method: 'GET',
            url,
            headers: { 'Accept':'application/rss+xml, application/xml, text/xml', 'Cache-Control':'no-cache' },
            timeout: 15000,
            onload: response => {
                if (diag.cancelada) return;
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/xml');
                    if (doc.querySelector('parsererror')) throw new Error('RSS inválido');

                    const items = Array.from(doc.querySelectorAll('item'));
                    const coincidenTitulo = [];
                    for (const item of items) {
                        const titulo = item.querySelector('title')?.textContent.trim() || '';
                        if (!titulo.toLowerCase().startsWith(tituloEsperado)) continue;
                        const pubDate = item.querySelector('pubDate')?.textContent.trim() || '';
                        const fechaConvertida = fechaRoverDesdePubDate(pubDate);
                        const descripcion = item.querySelector('description')?.textContent || '';
                        coincidenTitulo.push({ Título: titulo, PubDate: pubDate, FechaConvertida: fechaConvertida, Descripción: textoDiagAnguilla(descripcion, 180) });
                        if (fechaConvertida !== f.formatoRover) continue;
                        const m = descripcion.match(/GANADORES:\s*(\d{1,2})-(\d{1,2})-(\d{1,2})/i) ||
                                  titulo.match(/hoy:\s*(\d{1,2})-(\d{1,2})-(\d{1,2})/i);
                        if (!m) continue;
                        logDiagAnguilla(diag, 'RSS coincidencia', { Título: titulo, PubDate: pubDate, FechaConvertida: fechaConvertida, Resultado: `${m[1]}-${m[2]}-${m[3]}` });
                        completarAnguilla(lot, btn, f, [m[1], m[2], m[3]], 'RSS EnLoteria', diag);
                        return;
                    }

                    logDiagAnguilla(diag, 'RSS respuesta', {
                        HTTP: response.status,
                        DuraciónMs: Date.now() - inicio,
                        Bytes: String(response.responseText || '').length,
                        ItemsTotales: items.length,
                        CoincidenTítulo: coincidenTitulo.length,
                        CoincidenFecha: coincidenTitulo.filter(x => x.FechaConvertida === f.formatoRover).length,
                        Coincidencias: textoDiagAnguilla(coincidenTitulo.slice(0, 5)),
                        PrimerosTítulos: textoDiagAnguilla(items.slice(0, 5).map(item => item.querySelector('title')?.textContent.trim() || 'sin título')),
                        Caché: cabecerasDiagAnguilla(response)
                    });

                    console.warn(`[Anguilla] Sin resultado en las 3 fuentes | ${lot.codigoRoverCorto} ${f.formatoRover}`);
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'RSS EnLoteria', estado: '❌ RSS: sin resultado en las 3 fuentes', sonDeHoy: false });
                    mostrarMensaje(btn, '⚠️ Resultado no disponible en las 3 fuentes', '#ff9800');
                    cerrarDiagAnguilla(diag, 'Sin resultado en las 3 fuentes');
                } catch(e) {
                    console.error(`[Anguilla] RSS: ${e.message}`);
                    logDiagAnguilla(diag, 'RSS error', { Motivo: e.message, HTTP: response.status, DuraciónMs: Date.now() - inicio });
                    logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'RSS EnLoteria', estado: `❌ RSS: ${e.message}`, sonDeHoy: false });
                    mostrarMensaje(btn, '❌ Fallaron las 3 fuentes', '#f44336');
                    cerrarDiagAnguilla(diag, `Error RSS: ${e.message}`);
                }
            },
            onerror: () => {
                if (diag.cancelada) return;
                logDiagAnguilla(diag, 'RSS error', { Motivo: 'error de conexión', DuraciónMs: Date.now() - inicio });
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'RSS EnLoteria', estado: '❌ RSS: error de conexión', sonDeHoy: false });
                mostrarMensaje(btn, '❌ Fallaron las 3 fuentes', '#f44336');
                cerrarDiagAnguilla(diag, 'Error de conexión RSS');
            },
            ontimeout: () => {
                if (diag.cancelada) return;
                logDiagAnguilla(diag, 'RSS timeout', { DuraciónMs: Date.now() - inicio });
                logTablaResultado({ loteria: lot.nombre, fecha: f.formatoRover, resultado: '—', fuente: 'RSS EnLoteria', estado: '❌ RSS: timeout', sonDeHoy: false });
                mostrarMensaje(btn, '❌ TIMEOUT EN LAS 3 FUENTES', '#f44336');
                cerrarDiagAnguilla(diag, 'Timeout RSS');
            }
        });
    }

    // ==========================================
    // HAITI BOLET — 3 fuentes
    // ==========================================
    function logDiagHaiti(diag, etapa, datos = {}) {
        console.table([{ Consulta: diag.id, Etapa: etapa, ...datos }]);
    }

    function crearDiagHaiti(key, lot, f) {
        const diag = { id:`HAITI-${Date.now().toString(36).toUpperCase()}`, inicio:Date.now(), cancelada:false, finalizado:false };
        console.log(`🔎 [Haiti Bolet ${diag.id}] ${lot.nombre} | ${f.formatoRover}`);
        logDiagHaiti(diag, 'Inicio', {
            Lotería: lot.nombre,
            CódigoLargo: lot.codigoRover,
            CódigoCorto: lot.codigoRoverCorto,
            FechaRover: f.formatoRover,
            FechaLotDom: f.formatoLotDomISO,
            Orden: '1. LotDom → 2. SorteosRD → 3. RSS EnLoteria',
            SiteGameID: LOTDOM_SITE_GAME_ID[key] || '—',
            Slug: lot.slugLotDom || '—',
            HoraSorteosRD: lot.textoWeb,
            TítuloRSS: `Haiti Bolet ${lot.textoWeb} hoy:`
        });
        return diag;
    }

    function cerrarDiagHaiti(diag, estado) {
        if (diag.finalizado) return;
        diag.finalizado = true;
        logDiagHaiti(diag, 'Fin', { Estado:estado, DuraciónMs:Date.now() - diag.inicio });
    }

    function haitiWebSocketSigueActivo(diag) {
        return Boolean(diag.operacion && operacionLotDomActiva(diag.operacion) && diag.operacion.claves.size);
    }

    function cancelarOperacionHaitiSinCancelarCadena(diag, motivo) {
        if (!diag.operacion || !operacionLotDomActiva(diag.operacion)) return;
        diag.operacion.alCancelar = null;
        cancelarOperacionLotDom(diag.operacion, motivo);
    }

    function copiarLoteriaHaitiBolet(key, lot, btn) {
        const f = obtenerFechaDesdeInput();
        const operacion = iniciarOperacionLotDom(key, lot, f);
        const diag = crearDiagHaiti(key, lot, f);
        diag.operacion = operacion;
        operacion.alCancelar = motivo => {
            diag.cancelada = true;
            cerrarDiagHaiti(diag, `Seguimiento cancelado: ${motivo}`);
        };
        intentarHaitiLotDom(key, lot, btn, f, diag);
    }

    function completarHaiti(lot, btn, f, numeros, fuente, diag) {
        if (diag.cancelada || diag.finalizado) return;
        const [p, s, t] = numeros.map(n => String(n).padStart(2, '0'));
        if (diag.operacion && operacionLotDomActiva(diag.operacion)) {
            finalizarOperacionLotDom(diag.operacion, fuente, `${p}-${s}-${t}`);
        }
        console.log(`[Haiti Bolet] ✅ ${fuente} | ${lot.codigoRoverCorto} = ${p}-${s}-${t}`);
        const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
        logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:`${p}-${s}-${t}`, fuente, estado:ok ? `✅ Copiado (${fuente})` : '⚠️ Fila no visible', sonDeHoy:esFechaLotDomDeHoy(f) });
        cerrarDiagHaiti(diag, ok ? `Copiado desde ${fuente}` : `Encontrado en ${fuente}; fila no visible`);
    }

    // Fuente 1: una sola solicitud a Loterías Dominicanas.
    async function intentarHaitiLotDom(key, lot, btn, f, diag) {
        const siteGameId = LOTDOM_SITE_GAME_ID[key];
        if (!siteGameId) {
            cancelarOperacionHaitiSinCancelarCadena(diag, 'SiteGame ID no configurado');
            logDiagHaiti(diag, 'LotDom descartado', { Motivo:'SiteGame ID no configurado', PróximaFuente:'SorteosRD' });
            intentarHaitiSorteosRd(lot, btn, f, diag);
            return;
        }

        const apiUrl = `${LOTDOM_API_BASE}/site-games/${siteGameId}?date=${encodeURIComponent(f.formatoLotDomISO)}`;
        logDiagHaiti(diag, 'LotDom solicitud', { URL:apiUrl, FechaBuscada:f.formatoLotDomISO.slice(0, 10), SolicitudesMax:1 });
        mostrarEsperaLotDom(btn);

        try {
            const completa = session => {
                const score = scoreLotDom(session).slice(0, 3);
                return score.length === 3 && score.every(n => /^\d{1,2}$/.test(n));
            };
            const resultado = await obtenerSesionLotDom(siteGameId, f, completa, lot.nombre, diag.operacion);
            if (diag.cancelada || diag.finalizado) return;
            if (diag.operacion && !operacionLotDomActiva(diag.operacion)) return;

            const session = resultado.session;
            const numeros = scoreLotDom(session).slice(0, 3);
            logDiagHaiti(diag, 'LotDom respuesta', {
                FuenteReal: resultado.fuente,
                HTTPIntentos: resultado.intentos,
                SiteGameID: siteGameId,
                GameIDInterno: resultado.data?.game_id || resultado.data?.game?._id || session?.game_id || '—',
                SesiónSeleccionada: session?.date || 'ninguna',
                ScoreCrudo: textoDiagAnguilla(session?.score),
                NúmerosInterpretados: numeros.join('-') || '—',
                MotivoSiFalla: resultado.motivo || '—'
            });

            if (completa(session)) {
                completarHaiti(lot, btn, f, numeros, resultado.fuente, diag);
                return;
            }

            const vinculado = vincularSeguimientoOperacionLotDom(diag.operacion, resultado, f, sessionWs => {
                if (diag.cancelada || diag.finalizado) return;
                const numerosWs = scoreLotDom(sessionWs).slice(0, 3);
                diag.cancelada = true;
                logDiagHaiti(diag, 'WebSocket completó el resultado', {
                    Resultado: numerosWs.join('-'),
                    Acción: 'respuestas tardías de SorteosRD/RSS ignoradas; llenado automático'
                });
                if (!finalizarOperacionLotDom(diag.operacion, 'LotDom WebSocket', numerosWs.join('-'))) return;
                const [p, s, t] = numerosWs.map(n => String(n).padStart(2, '0'));
                const ok = llenarCampos(lot, p, s, t, f.formatoRover, btn);
                logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:`${p}-${s}-${t}`, fuente:'LotDom WebSocket', estado:ok ? '✅ Copiado automáticamente' : '⚠️ Fila no visible', sonDeHoy:true });
                diag.cancelada = false;
                cerrarDiagHaiti(diag, ok ? 'Copiado automáticamente desde WebSocket' : 'WebSocket completo; fila no visible');
            });
            if (vinculado) {
                activarEsperaOperacionLotDom(diag.operacion);
                liberarBotonPorWebSocket(btn);
            } else {
                cancelarOperacionHaitiSinCancelarCadena(diag, resultado.motivo || 'WebSocket no disponible para esta fecha');
            }

            logDiagHaiti(diag, 'LotDom descartado', { Motivo:resultado.motivo, WebSocket:vinculado ? 'escuchando' : 'no disponible', PróximaFuente:'SorteosRD' });
            logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:numeros.join('-') || '—', fuente:resultado.fuente, estado:`❌ LotDom: ${resultado.motivo}`, sonDeHoy:esFechaLotDomDeHoy(f) });
            intentarHaitiSorteosRd(lot, btn, f, diag);
        } catch (e) {
            if (diag.cancelada || diag.finalizado) return;
            cancelarOperacionHaitiSinCancelarCadena(diag, `error LotDom: ${e.message}`);
            logDiagHaiti(diag, 'LotDom error', { Motivo:e.message, PróximaFuente:'SorteosRD' });
            logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:'—', fuente:'LotDom site-games', estado:`❌ ${e.message}`, sonDeHoy:false });
            intentarHaitiSorteosRd(lot, btn, f, diag);
        }
    }

    // Fuente 2: una sola solicitud a la página principal de SorteosRD.
    function intentarHaitiSorteosRd(lot, btn, f, diag) {
        if (diag.cancelada || diag.finalizado) return;
        const url = `https://sorteosrd.com/?t=${Date.now()}`;
        const inicio = Date.now();
        logDiagHaiti(diag, 'SorteosRD solicitud', { URL:url, FechaBuscada:f.formatoRover, HoraBuscada:lot.textoWeb, SolicitudesMax:1 });

        const pasarARss = motivo => {
            if (diag.cancelada || diag.finalizado) return;
            logDiagHaiti(diag, 'SorteosRD descartado', { Motivo:motivo, PróximaFuente:'RSS EnLoteria' });
            logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:'—', fuente:'SorteosRD', estado:`❌ SorteosRD: ${motivo}`, sonDeHoy:false });
            intentarHaitiRSS(lot, btn, f, diag);
        };

        GM_xmlhttpRequest({
            method:'GET',
            url,
            headers:{ 'Cache-Control':'no-cache' },
            timeout:15000,
            onload:response => {
                if (diag.cancelada || diag.finalizado) return;
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                    const cards = Array.from(doc.querySelectorAll('.lottery-card'));
                    const muestras = [];
                    let tarjetasHaiti = 0;
                    let mismaHora = 0;
                    for (const card of cards) {
                        const nombre = card.querySelector('h6')?.textContent.trim() || '';
                        if (!/^Haiti Bolet$/i.test(nombre)) continue;
                        tarjetasHaiti++;
                        const horas = Array.from(card.querySelectorAll('p.text-muted')).map(el => el.textContent.trim().toUpperCase().replace(/\s+/g, ' '));
                        if (!horas.includes(lot.textoWeb.toUpperCase())) continue;
                        mismaHora++;
                        const fechaTexto = card.querySelector('.fw-bold')?.textContent.trim() || '';
                        const mFecha = fechaTexto.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                        const fechaEncontrada = mFecha ? `${mFecha[2]}/${mFecha[1]}/${mFecha[3]}` : null;
                        const numeros = Array.from(card.querySelectorAll('.bolos-resultados .numero'))
                            .map(el => el.textContent.trim())
                            .filter(n => /^\d{1,2}$/.test(n))
                            .slice(0, 3);
                        muestras.push({ FechaCruda:fechaTexto || '—', FechaConvertida:fechaEncontrada || '—', Hora:lot.textoWeb, Resultado:numeros.join('-') || '—' });
                        if (fechaEncontrada === f.formatoRover && numeros.length === 3) {
                            logDiagHaiti(diag, 'SorteosRD coincidencia', { FechaCruda:fechaTexto, FechaConvertida:fechaEncontrada, Resultado:numeros.join('-') });
                            completarHaiti(lot, btn, f, numeros, 'SorteosRD', diag);
                            return;
                        }
                    }
                    logDiagHaiti(diag, 'SorteosRD respuesta', {
                        HTTP:response.status,
                        DuraciónMs:Date.now() - inicio,
                        Bytes:String(response.responseText || '').length,
                        TarjetasTotales:cards.length,
                        TarjetasHaiti:tarjetasHaiti,
                        TarjetasMismaHora:mismaHora,
                        Muestras:textoDiagAnguilla(muestras.slice(0, 5)),
                        Caché:cabecerasDiagAnguilla(response)
                    });
                    pasarARss(mismaHora ? 'fecha o resultado no disponible' : 'sorteo/horario no encontrado');
                } catch (e) {
                    logDiagHaiti(diag, 'SorteosRD error', { Motivo:e.message, HTTP:response.status, DuraciónMs:Date.now() - inicio });
                    pasarARss(e.message);
                }
            },
            onerror:() => pasarARss('error de conexión'),
            ontimeout:() => pasarARss('timeout')
        });
    }

    // Fuente 3: una sola solicitud al RSS de EnLoteria.
    function intentarHaitiRSS(lot, btn, f, diag) {
        if (diag.cancelada || diag.finalizado) return;
        const url = `https://enloteria.com/rss?t=${Date.now()}`;
        const inicio = Date.now();
        const tituloEsperado = `Haiti Bolet ${lot.textoWeb} hoy:`.toLowerCase();
        logDiagHaiti(diag, 'RSS solicitud', { URL:url, FechaBuscada:f.formatoRover, TítuloEsperado:tituloEsperado, SolicitudesMax:1 });

        const terminarSinResultado = (motivo, esError = false) => {
            if (diag.cancelada || diag.finalizado) return;
            if (haitiWebSocketSigueActivo(diag)) {
                logDiagHaiti(diag, 'Respaldos terminados', { Estado:'🟦 WebSocket sigue escuchando', Motivo:motivo, SolicitudesHTTP:'terminadas; no habrá reintentos' });
                logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:'—', fuente:'LotDom WebSocket', estado:'🟦 Seguimiento activo; respaldos terminados', sonDeHoy:true });
                liberarBotonPorWebSocket(btn);
                return;
            }
            cancelarOperacionHaitiSinCancelarCadena(diag, motivo);
            mostrarMensaje(btn, esError ? '❌ Fallaron las 3 fuentes' : '⚠️ Resultado no disponible en las 3 fuentes', esError ? '#f44336' : '#ff9800');
            cerrarDiagHaiti(diag, motivo);
        };

        GM_xmlhttpRequest({
            method:'GET',
            url,
            headers:{ 'Accept':'application/rss+xml, application/xml, text/xml', 'Cache-Control':'no-cache' },
            timeout:15000,
            onload:response => {
                if (diag.cancelada || diag.finalizado) return;
                try {
                    if (response.status !== 200) throw new Error(`HTTP ${response.status}`);
                    const doc = new DOMParser().parseFromString(response.responseText, 'text/xml');
                    if (doc.querySelector('parsererror')) throw new Error('RSS inválido');
                    const items = Array.from(doc.querySelectorAll('item'));
                    const coincidencias = [];
                    for (const item of items) {
                        const titulo = item.querySelector('title')?.textContent.trim() || '';
                        if (!titulo.toLowerCase().startsWith(tituloEsperado)) continue;
                        const pubDate = item.querySelector('pubDate')?.textContent.trim() || '';
                        const fechaConvertida = fechaRoverDesdePubDate(pubDate);
                        const descripcion = item.querySelector('description')?.textContent || '';
                        coincidencias.push({ Título:titulo, PubDate:pubDate, FechaConvertida:fechaConvertida, Descripción:textoDiagAnguilla(descripcion, 180) });
                        if (fechaConvertida !== f.formatoRover) continue;
                        const m = descripcion.match(/GANADORES:\s*(\d{1,2})-(\d{1,2})-(\d{1,2})/i) || titulo.match(/hoy:\s*(\d{1,2})-(\d{1,2})-(\d{1,2})/i);
                        if (!m) continue;
                        logDiagHaiti(diag, 'RSS coincidencia', { Título:titulo, PubDate:pubDate, FechaConvertida:fechaConvertida, Resultado:`${m[1]}-${m[2]}-${m[3]}` });
                        completarHaiti(lot, btn, f, [m[1], m[2], m[3]], 'RSS EnLoteria', diag);
                        return;
                    }
                    logDiagHaiti(diag, 'RSS respuesta', {
                        HTTP:response.status,
                        DuraciónMs:Date.now() - inicio,
                        Bytes:String(response.responseText || '').length,
                        ItemsTotales:items.length,
                        CoincidenTítulo:coincidencias.length,
                        CoincidenFecha:coincidencias.filter(x => x.FechaConvertida === f.formatoRover).length,
                        Coincidencias:textoDiagAnguilla(coincidencias.slice(0, 5)),
                        Caché:cabecerasDiagAnguilla(response)
                    });
                    terminarSinResultado('sin resultado en las 3 fuentes');
                } catch (e) {
                    logDiagHaiti(diag, 'RSS error', { Motivo:e.message, HTTP:response.status, DuraciónMs:Date.now() - inicio });
                    terminarSinResultado(`error RSS: ${e.message}`, true);
                }
            },
            onerror:() => {
                logDiagHaiti(diag, 'RSS error', { Motivo:'error de conexión', DuraciónMs:Date.now() - inicio });
                terminarSinResultado('error de conexión RSS', true);
            },
            ontimeout:() => {
                logDiagHaiti(diag, 'RSS timeout', { DuraciónMs:Date.now() - inicio });
                terminarSinResultado('timeout RSS', true);
            }
        });
    }

    // ==========================================
    // NICARAGUA / HONDURAS
    // ==========================================
    const NICA_API_BASE='https://api.loteriasdenicaragua.com/nicaragua', NICA_TZ='America/Managua';
    const HN_API_BASE='https://api.loteriasdehonduras.com/honduras', HN_TZ='America/Tegucigalpa';

    function gmGetJson(url) { return new Promise((resolve,reject)=>{ GM_xmlhttpRequest({ method:'GET',url,headers:{'Accept':'application/json','Cache-Control':'no-cache, no-store, max-age=0','Pragma':'no-cache'}, onload:(r)=>{try{if(r.status!==200)throw new Error(`HTTP ${r.status}`);resolve(JSON.parse(r.responseText));}catch(e){reject(e);}}, onerror:()=>reject(new Error('error de conexión')), ontimeout:()=>reject(new Error('timeout')), timeout:15000 }); }); }
    async function gmGetJsonResultados(url, siteEnv) {
        const sessionId = await esperarIdSesionResultados(siteEnv);
        if (!sessionId) throw new Error('HTTP omitido: ws.session no disponible después de 4 s');
        const acceptLanguage = acceptLanguageConSesionResultados(sessionId);
        return new Promise((resolve,reject) => {
            GM_xmlhttpRequest({
                method:'GET',
                url,
                headers:{ 'Accept-Language':acceptLanguage },
                timeout:15000,
                onload:r => {
                    try {
                        if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
                        const validacion = autenticarRespuestaResultados(r, siteEnv);
                        resolve({ data:JSON.parse(r.responseText), ...validacion });
                    } catch (e) { reject(e); }
                },
                onerror:()=>reject(new Error('error de conexión')),
                ontimeout:()=>reject(new Error('timeout'))
            });
        });
    }
    function keyInTZ(date,tz) { return new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).format(date); }
    function nicaIsoQueryTomorrow04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:NICA_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); const base=new Date(Date.UTC(y,m-1,d,4,0,0,0)); base.setUTCDate(base.getUTCDate()+1); return base.toISOString(); }
    function hnIsoQueryToday04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:HN_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); return new Date(Date.UTC(y,m-1,d,4,0,0,0)).toISOString(); }
    function hnIsoQueryTomorrow04Z(now=new Date()) { const parts=new Intl.DateTimeFormat('en-CA',{timeZone:HN_TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now); const y=Number(parts.find(p=>p.type==='year').value),m=Number(parts.find(p=>p.type==='month').value),d=Number(parts.find(p=>p.type==='day').value); const base=new Date(Date.UTC(y,m-1,d,4,0,0,0)); base.setUTCDate(base.getUTCDate()+1); return base.toISOString(); }
    function flattenScoreIds(score) { const out=[]; (function walk(x){if(Array.isArray(x))x.forEach(walk);else if(typeof x==='string'||typeof x==='number')out.push(String(x));})(score); return out; }
    function buildIdToTextMapFromScoreLayout(scoreLayout,idSet) { const map=new Map(); (function walk(x){if(Array.isArray(x))return x.forEach(walk);if(!x||typeof x!=='object')return;if(Array.isArray(x.options)){for(const opt of x.options){if(opt?.id&&idSet.has(opt.id)&&opt.text)map.set(opt.id,opt.text);}}for(const k of Object.keys(x))walk(x[k]);})(scoreLayout); return map; }
    function extractWinnerText(game,session) { if(!game||!session?.score)return null; const scoreIds=flattenScoreIds(session.score); if(!scoreIds.length)return null; const direct=scoreIds.find(t=>/^\d{1,2}\s+\S/.test(t)); if(direct)return direct; const set=new Set(scoreIds); const idToText=buildIdToTextMapFromScoreLayout(game.score_layout,set); const texts=scoreIds.map(id=>idToText.get(id)).filter(Boolean); return texts.find(t=>/^\d{1,2}\s+\S/.test(t))||null; }
    function pickNicaCandidate(detailJson,now=new Date()) { const game=detailJson?.game; const sessions=Array.isArray(game?.sessions)?game.sessions:[]; const keyTodayNI=keyInTZ(now,NICA_TZ),keyYestNI=keyInTZ(new Date(now.getTime()-86400000),NICA_TZ); const scored=sessions.map(s=>{const sessionDate=s?.date||null;const keySite=sessionDate?sessionDate.slice(0,10):null;const text=extractWinnerText(game,s);const num=text?.match(/^(\d{1,2})/)?.[1]?.padStart(2,'0')||null;return{sessionDate,keySite,text,num};}).filter(x=>x.sessionDate&&x.text&&x.num).sort((a,b)=>new Date(b.sessionDate)-new Date(a.sessionDate)); const today=scored.find(x=>x.keySite===keyTodayNI)||null,yest=scored.find(x=>x.keySite===keyYestNI)||null,last=scored[0]||null; if(today)return{status:'HOY',...today,keyTodayNI,keyYestNI};if(yest)return{status:'AYER',...yest,keyTodayNI,keyYestNI};if(last)return{status:'ULTIMO',...last,keyTodayNI,keyYestNI};return{status:'SIN_DATOS',keyTodayNI,keyYestNI}; }
    function pickHnCandidate(detailJson,now=new Date()) { const game=detailJson?.game; const sessions=Array.isArray(game?.sessions)?game.sessions:Array.isArray(detailJson?.sessions)?detailJson.sessions:[]; const keyTodayHN=keyInTZ(now,HN_TZ),keyYestHN=keyInTZ(new Date(now.getTime()-86400000),HN_TZ); const scored=sessions.map(s=>{const sessionDate=s?.date||null;const keySite=sessionDate?sessionDate.slice(0,10):null;const text=extractWinnerText(game,s);const num=text?.match(/^(\d{1,2})/)?.[1]?.padStart(2,'0')||null;return{sessionDate,keySite,text,num};}).filter(x=>x.sessionDate&&x.text&&x.num).sort((a,b)=>new Date(b.sessionDate)-new Date(a.sessionDate)); const today=scored.find(x=>x.keySite===keyTodayHN)||null,yest=scored.find(x=>x.keySite===keyYestHN)||null,last=scored[0]||null; if(today)return{status:'HOY',...today,keyTodayHN,keyYestHN};if(yest)return{status:'AYER',...yest,keyTodayHN,keyYestHN};if(last)return{status:'ULTIMO',...last,keyTodayHN,keyYestHN};return{status:'SIN_DATOS',keyTodayHN,keyYestHN}; }

    function numeroGanadorExterno(detail, session, fechaClave) {
        if (!session || String(session.date || '').slice(0, 10) !== fechaClave) return null;
        const text = extractWinnerText(detail?.game, session);
        return text?.match(/^(\d{1,2})/)?.[1]?.padStart(2, '0') || null;
    }

    function prepararSeguimientoExterno(operacion, detail, fechaClave, lot, btn, bandera) {
        if (!operacionLotDomActiva(operacion)) return { estado:'cancelado' };
        const gameId = detail?.game_id || detail?.game?._id;
        if (!gameId) return { estado:'fallo', motivo:'la API no devolvió el GameID interno' };
        const leerNumero = session => numeroGanadorExterno(detail, session, fechaClave);
        const sessionCache = sesionCacheLotDom(gameId, fechaClave, operacion.siteEnv);
        const numeroCache = leerNumero(sessionCache);
        if (numeroCache) {
            console.table([{
                Sitio: operacion.siteEnv,
                Lotería: lot.nombre,
                Fecha: fechaClave,
                Fuente: 'WebSocket (caché)',
                Resultado: numeroCache,
                InputsAzules: 'NO',
                Acción: 'llenado directo en verde'
            }]);
            return { estado:'cache', numero:numeroCache };
        }

        const clave = claveSesionLotDom(gameId, fechaClave, operacion.siteEnv);
        lotDomLive.seguimientos.set(clave, {
            etiqueta: lot.nombre,
            fechaRover: operacion.fechaRover,
            siteGameId: lot.siteGameId,
            siteEnv: operacion.siteEnv,
            operacionId: operacion.id,
            esCompleta: session => Boolean(leerNumero(session)),
            describirResultado: session => leerNumero(session) || `${flattenScoreIds(session?.score).length} identificador(es), aún sin ganador`,
            alCompletar: session => {
                if (!operacionLotDomActiva(operacion)) return;
                const fechaActual = document.getElementById('fecha')?.value?.trim();
                if (fechaActual && fechaActual !== operacion.fechaRover) {
                    cancelarOperacionLotDom(operacion, 'cambio de fecha');
                    return;
                }
                const numero = leerNumero(session);
                if (!numero || !finalizarOperacionLotDom(operacion, `${bandera} WebSocket`, numero)) return;
                const ok = llenarCampoUnico(lot, numero, operacion.fechaRover, btn);
                logTablaResultado({ loteria:lot.nombre, fecha:operacion.fechaRover, resultado:numero, fuente:`${bandera} WebSocket`, estado:ok?'✅ Copiado automáticamente':'⚠️ Fila no visible', sonDeHoy:true });
            }
        });
        operacion.claves.add(clave);
        activarEsperaOperacionLotDom(operacion);
        liberarBotonPorWebSocket(btn);
        return { estado:'esperando' };
    }

    async function copiarLoteriaNicaragua(key, lot, btn) {
        const f=obtenerFechaHoy(), now=new Date();
        if(!lot.siteGameId){mostrarMensaje(btn,'⚠️ Falta ID','#ff9800');return;}
        const operacion=iniciarOperacionLotDom(key,lot,f,'nicaragua');
        try {
            mostrarEsperaLotDom(btn,'⏳ Consultando Nicaragua...');
            const isoQuery=nicaIsoQueryTomorrow04Z(now);
            const url=`${NICA_API_BASE}/site-games/${lot.siteGameId}?date=${encodeURIComponent(isoQuery)}`;
            const respuesta=await gmGetJsonResultados(url,'nicaragua'), detail=respuesta.data;
            if(!operacionLotDomActiva(operacion))return;
            const cand=respuesta.autenticada?pickNicaCandidate(detail,now):{status:'SEÑUELO_DESCARTADO',num:null}, fechaClave=keyInTZ(now,NICA_TZ);
            console.table([{Sitio:'nicaragua',Lotería:lot.nombre,FechaBuscada:fechaClave,SolicitudesHTTP:1,HTTPValidado:respuesta.autenticada,CacheControl:respuesta.cacheControl,EstadoAPI:cand.status,ResultadoAPI:cand.num||'—',WebSocket:estadoWebSocketResultados('nicaragua'),URL:url}]);
            if(cand.status==='HOY'){
                finalizarOperacionLotDom(operacion,'Nicaragua site-games',cand.num);
                const ok=llenarCampoUnico(lot,cand.num,f.formatoRover,btn);
                logTablaResultado({loteria:lot.nombre,fecha:f.formatoRover,resultado:cand.num,fuente:'Nicaragua site-games',estado:ok?'✅ Copiado':'⚠️ Fila no visible',sonDeHoy:true});
                return;
            }
            const seguimiento=prepararSeguimientoExterno(operacion,detail,fechaClave,lot,btn,'🇳🇮 Nicaragua');
            if(seguimiento.estado==='cache'){
                finalizarOperacionLotDom(operacion,'Nicaragua WebSocket (caché)',seguimiento.numero);
                llenarCampoUnico(lot,seguimiento.numero,f.formatoRover,btn);
            } else if(seguimiento.estado==='fallo') {
                cancelarOperacionLotDom(operacion,seguimiento.motivo);
                mostrarMensaje(btn,'⚠️ Sin seguimiento WebSocket','#ff9800');
            }
        } catch(err) {
            cancelarOperacionLotDom(operacion,`error: ${err.message}`);
            console.error('Nicaragua error:',err);
            mostrarMensaje(btn,'❌ ERROR','#f44336');
        }
    }

    async function copiarLoteriaHonduras(key, lot, btn) {
        const f=obtenerFechaHoy(), now=new Date();
        if(!lot.siteGameId){mostrarMensaje(btn,'⚠️ Falta ID','#ff9800');return;}
        const operacion=iniciarOperacionLotDom(key,lot,f,'honduras');
        try {
            mostrarEsperaLotDom(btn,'⏳ Consultando Honduras...');
            const isoQuery=hnIsoQueryToday04Z(now);
            const url=`${HN_API_BASE}/site-games/${lot.siteGameId}?date=${encodeURIComponent(isoQuery)}`;
            const respuesta=await gmGetJsonResultados(url,'honduras'), detail=respuesta.data;
            if(!operacionLotDomActiva(operacion))return;
            const cand=respuesta.autenticada?pickHnCandidate(detail,now):{status:'SEÑUELO_DESCARTADO',num:null}, fechaClave=keyInTZ(now,HN_TZ);
            console.table([{Sitio:'honduras',Lotería:lot.nombre,FechaBuscada:fechaClave,SolicitudesHTTP:1,HTTPValidado:respuesta.autenticada,CacheControl:respuesta.cacheControl,EstadoAPI:cand.status,ResultadoAPI:cand.num||'—',WebSocket:estadoWebSocketResultados('honduras'),URL:url}]);
            if(cand.status==='HOY'){
                finalizarOperacionLotDom(operacion,'Honduras site-games',cand.num);
                const ok=llenarCampoUnico(lot,cand.num,f.formatoRover,btn);
                logTablaResultado({loteria:lot.nombre,fecha:f.formatoRover,resultado:cand.num,fuente:'Honduras site-games',estado:ok?'✅ Copiado':'⚠️ Fila no visible',sonDeHoy:true});
                return;
            }
            const seguimiento=prepararSeguimientoExterno(operacion,detail,fechaClave,lot,btn,'🇭🇳 Honduras');
            if(seguimiento.estado==='cache'){
                finalizarOperacionLotDom(operacion,'Honduras WebSocket (caché)',seguimiento.numero);
                llenarCampoUnico(lot,seguimiento.numero,f.formatoRover,btn);
            } else if(seguimiento.estado==='fallo') {
                cancelarOperacionLotDom(operacion,seguimiento.motivo);
                mostrarMensaje(btn,'⚠️ Sin seguimiento WebSocket','#ff9800');
            }
        } catch(err) {
            cancelarOperacionLotDom(operacion,`error: ${err.message}`);
            console.error('Honduras error:',err);
            mostrarMensaje(btn,'❌ ERROR','#f44336');
        }
    }

    // ==========================================
    // EL SALVADOR — La Diaria (API oficial -> Facebook)
    // ==========================================
    const SALVADOR_FB_PROFILE_ID = '100085608171994';
    const SALVADOR_FB_SESSION_URL = 'https://www.facebook.com/';
    const SALVADOR_FB_GRAPHQL_URL = 'https://www.facebook.com/api/graphql/';
    const SALVADOR_FB_TIMELINE_DOC_ID = '28496295223301538';
    const SALVADOR_FB_MAX_PAGES = 8;
    const SALVADOR_FB_COUNT_PER_PAGE = 10;
    const salvadorFacebookCache = new Map();

    function gmRequestTexto(opciones) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                timeout: 30000,
                ...opciones,
                onload: resolve,
                onerror: () => reject(new Error('error de conexión')),
                ontimeout: () => reject(new Error('timeout'))
            });
        });
    }

    function decodificarTokenFacebook(valor) {
        return String(valor || '')
            .replace(/\\u0025/g, '%')
            .replace(/\\u003A/g, ':')
            .replace(/\\u002F/g, '/')
            .replace(/\\\//g, '/')
            .trim();
    }

    function extraerTokenFacebook(html, tipo) {
        const patrones = {
            fb_dtsg: [
                /"DTSGInitialData"[\s\S]{0,2000}?"token"\s*:\s*"([^"]+)"/i,
                /"DTSGInitData"[\s\S]{0,2000}?"token"\s*:\s*"([^"]+)"/i,
                /DTSGInitialData[\s\S]{0,2000}?token\\?["']?\s*[:=]\s*\\?["']([^"'\\]+)/i,
                /DTSGInitData[\s\S]{0,2000}?token\\?["']?\s*[:=]\s*\\?["']([^"'\\]+)/i,
                /name=["']fb_dtsg["'][^>]{0,500}?value=["']([^"']+)["']/i,
                /value=["']([^"']+)["'][^>]{0,500}?name=["']fb_dtsg["']/i,
                /["']fb_dtsg["']\s*:\s*["']([^"']+)["']/i,
                /fb_dtsg=([^&"'\\\s]+)/i
            ],
            lsd: [
                /"LSD"[\s\S]{0,1500}?"token"\s*:\s*"([^"]+)"/i,
                /name=["']lsd["'][^>]{0,500}?value=["']([^"']+)["']/i,
                /value=["']([^"']+)["'][^>]{0,500}?name=["']lsd["']/i,
                /["']lsd["']\s*:\s*["']([^"']+)["']/i
            ],
            jazoest: [
                /name=["']jazoest["'][^>]{0,500}?value=["']([^"']+)["']/i,
                /["']jazoest["']\s*:\s*["']([^"']+)["']/i
            ],
            user: [
                /"USER_ID"\s*:\s*"(\d+)"/i,
                /"ACCOUNT_ID"\s*:\s*"(\d+)"/i,
                /"actorID"\s*:\s*"(\d+)"/i,
                /"actorId"\s*:\s*"(\d+)"/i,
                /"viewerID"\s*:\s*"(\d+)"/i
            ]
        };

        for (const patron of patrones[tipo] || []) {
            const encontrado = html.match(patron);
            if (encontrado?.[1]) return decodificarTokenFacebook(encontrado[1]);
        }

        if (tipo === 'fb_dtsg') {
            const posiciones = [];
            const marcador = /DTSGInitialData|DTSGInitData|fb_dtsg/gi;
            let encontrado;
            while ((encontrado = marcador.exec(html)) && posiciones.length < 10) posiciones.push(encontrado.index);
            for (const posicion of posiciones) {
                const fragmento = html.slice(Math.max(0, posicion - 1000), posicion + 8000);
                const candidatos = [
                    /"token"\s*:\s*"([^"]{10,})"/i,
                    /token\\?"?\s*:\s*\\?"([^"\\]{10,})/i,
                    /fb_dtsg[^A-Za-z0-9_-]{0,200}([A-Za-z0-9:_-]{20,})/i,
                    /NA[A-Za-z0-9_-]{20,}(?::\d+:\d+)?/
                ];
                for (const candidato of candidatos) {
                    const match = fragmento.match(candidato);
                    const valor = match?.[1] || match?.[0];
                    if (valor?.length >= 15) return decodificarTokenFacebook(valor);
                }
            }
        }
        return null;
    }

    function extraerDocIdTimelineFacebook(html) {
        const patrones = [
            /"queryName"\s*:\s*"ProfileCometTimelineFeedRefetchQuery"[\s\S]{0,500}?"queryID"\s*:\s*"(\d{10,})"/i,
            /"queryID"\s*:\s*"(\d{10,})"[\s\S]{0,500}?"queryName"\s*:\s*"ProfileCometTimelineFeedRefetchQuery"/i,
            /"name"\s*:\s*"ProfileCometTimelineFeedRefetchQuery"[\s\S]{0,500}?"id"\s*:\s*"(\d{10,})"/i
        ];
        for (const patron of patrones) {
            const match = html.match(patron);
            if (match?.[1]) return match[1];
        }
        return SALVADOR_FB_TIMELINE_DOC_ID;
    }

    function decodificarCadenaJsonFacebook(valor) {
        try { return JSON.parse(`"${valor}"`); }
        catch (_) { return String(valor || ''); }
    }

    function normalizarTextoFacebook(valor) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = String(valor || '');
        return textarea.value
            .normalize('NFKC')
            .replace(/[\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function extraerMensajesFacebook(texto) {
        const mensajes = [];
        const vistos = new Set();
        const patrones = [
            /"message"\s*:\s*\{\s*"text"\s*:\s*"((?:\\.|[^"\\])*)"/gi,
            /"seo_title"\s*:\s*"((?:\\.|[^"\\])*)"/gi,
            /:\s*"((?:\\.|[^"\\])*)"/g
        ];
        for (const patron of patrones) {
            let match;
            while ((match = patron.exec(texto))) {
                if (!/DIARIA/i.test(match[1]) || !/Salvador/i.test(match[1])) continue;
                const mensaje = normalizarTextoFacebook(decodificarCadenaJsonFacebook(match[1]));
                if (!mensaje || vistos.has(mensaje)) continue;
                vistos.add(mensaje);
                mensajes.push(mensaje);
            }
        }
        return mensajes;
    }

    function extraerCursorFacebook(texto) {
        const patrones = [
            /"end_cursor"\s*:\s*"((?:\\.|[^"])*)"/i,
            /"endCursor"\s*:\s*"((?:\\.|[^"])*)"/i
        ];
        for (const patron of patrones) {
            const match = texto.match(patron);
            if (match?.[1]) return decodificarCadenaJsonFacebook(match[1]);
        }
        return null;
    }

    function facebookTienePaginaSiguiente(texto) {
        const match = texto.match(/"has_next_page"\s*:\s*(true|false)/i);
        return !match || match[1].toLowerCase() === 'true';
    }

    function patronFechaFacebook(formatoRover) {
        const [mes, dia, anio] = String(formatoRover).split('/').map(Number);
        return new RegExp(`(?:^|\\D)0?${dia}[\\/-]0?${mes}[\\/-]${anio}(?:\\D|$)`);
    }

    function patronHoraFacebook(hora) {
        const match = String(hora || '').match(/(\d{1,2}):?(\d{2})?\s*(AM|PM)/i);
        if (!match) return /$a/;
        const hh = Number(match[1]);
        const mm = match[2] || '00';
        const periodo = match[3].toUpperCase();
        return new RegExp(`(?:^|\\D)0?${hh}\\s*:\\s*${mm}\\s*${periodo}(?:\\D|$)`, 'i');
    }

    function analizarPostsSalvadorFacebook(texto, lot, fechaRover, etapa) {
        const fechaEsperada = patronFechaFacebook(fechaRover);
        const horaEsperada = patronHoraFacebook(lot.hora);
        const mensajes = extraerMensajesFacebook(texto);
        const candidatos = mensajes
            .filter(mensaje => /\bDIARIA\b/i.test(mensaje) && /El\s+Salvador/i.test(mensaje))
            .map((mensaje, indice) => {
                const fechaCoincide = fechaEsperada.test(mensaje);
                const horaCoincide = horaEsperada.test(mensaje);
                const numero = mensaje.match(/El\s+Salvador\s*\(\s*(\d{1,2})\b/i)?.[1]?.padStart(2, '0') || null;
                return { indice:indice + 1, fechaCoincide, horaCoincide, numero, mensaje };
            });

        console.table(candidatos.length ? candidatos.map(item => ({
            Etapa: etapa,
            Candidato: item.indice,
            FechaCorrecta: item.fechaCoincide,
            HoraCorrecta: item.horaCoincide,
            Resultado: item.numero || '—',
            Texto: item.mensaje.slice(0, 240)
        })) : [{ Etapa:etapa, Candidatos:0, Estado:'sin publicaciones DIARIA de El Salvador en la respuesta' }]);

        return candidatos.find(item => item.fechaCoincide && item.horaCoincide && item.numero) || null;
    }

    function crearVariablesTimelineFacebook(cursor) {
        return {
            afterTime:null, beforeTime:null,
            count:SALVADOR_FB_COUNT_PER_PAGE,
            cursor:cursor || null,
            feedLocation:'TIMELINE', feedbackSource:0, focusCommentID:null,
            memorializedSplitTimeFilter:null, omitPinnedPost:false,
            postedBy:{ group:'OWNER' }, privacy:null,
            privacySelectorRenderLocation:'COMET_STREAM', referringStoryRenderLocation:null,
            renderLocation:'timeline', scale:1, stream_count:1, taggedInOnly:null,
            trackingCode:null, useDefaultActor:false, id:SALVADOR_FB_PROFILE_ID,
            __relay_internal__pv__GHLShouldChangeAdIdFieldNamerelayprovider:true,
            __relay_internal__pv__GHLShouldChangeSponsoredDataFieldNamerelayprovider:true,
            __relay_internal__pv__CometFeedStory_enable_reactor_facepilerelayprovider:false,
            __relay_internal__pv__CometFeedStory_enable_social_bubblesrelayprovider:false,
            __relay_internal__pv__CometFeedStory_enable_post_permalink_white_space_clickrelayprovider:false,
            __relay_internal__pv__CometUFICommentActionLinksRewriteEnabledrelayprovider:true,
            __relay_internal__pv__CometUFICommentAvatarStickerAnimatedImagerelayprovider:false,
            __relay_internal__pv__IsWorkUserrelayprovider:false,
            __relay_internal__pv__TestPilotShouldIncludeDemoAdUseCaserelayprovider:false,
            __relay_internal__pv__FBReels_deprecate_short_form_video_context_gkrelayprovider:true,
            __relay_internal__pv__FBReels_enable_view_dubbed_audio_type_gkrelayprovider:true,
            __relay_internal__pv__CometFeedShareMedia_shouldPrefetchShareImagerelayprovider:true,
            __relay_internal__pv__CometImmersivePhotoCanUserDisable3DMotionrelayprovider:false,
            __relay_internal__pv__WorkCometIsEmployeeGKProviderrelayprovider:false,
            __relay_internal__pv__IsMergQAPollsrelayprovider:false,
            __relay_internal__pv__FBReelsMediaFooter_comet_enable_reels_ads_gkrelayprovider:true,
            __relay_internal__pv__CometUFIReactionsEnableShortNamerelayprovider:false,
            __relay_internal__pv__CometUFICommentAutoTranslationTyperelayprovider:'AUTO_TRANSLATE',
            __relay_internal__pv__CometUFIShareActionMigrationrelayprovider:true,
            __relay_internal__pv__CometUFISingleLineUFIrelayprovider:true,
            __relay_internal__pv__relay_provider_comet_ufi_ssr_seo_deferrelayprovider:true,
            __relay_internal__pv__CometUFI_dedicated_comment_routable_dialog_gkrelayprovider:true,
            __relay_internal__pv__ReelsIFUCard_reelsIFULikeCountrelayprovider:false,
            __relay_internal__pv__FBReelsIFUTileContent_reelsIFUPlayOnHoverrelayprovider:true,
            __relay_internal__pv__GroupsCometGYSJFeedItemHeightrelayprovider:206,
            __relay_internal__pv__StoriesShouldEnablePhotosensitiveContentWarningrelayprovider:false,
            __relay_internal__pv__ShouldEnableBakedInTextStoriesrelayprovider:false,
            __relay_internal__pv__StoriesShouldIncludeFbNotesrelayprovider:false
        };
    }

    async function consultarPaginaTimelineFacebook(sesion, cursor, docId) {
        const bodyData = {
            __user:sesion.user,
            fb_dtsg:sesion.fbDtsg,
            lsd:sesion.lsd,
            fb_api_caller_class:'RelayModern',
            fb_api_req_friendly_name:'ProfileCometTimelineFeedRefetchQuery',
            server_timestamps:'true',
            variables:JSON.stringify(crearVariablesTimelineFacebook(cursor)),
            doc_id:docId
        };
        if (sesion.jazoest) bodyData.jazoest = sesion.jazoest;
        return gmRequestTexto({
            method:'POST',
            url:SALVADOR_FB_GRAPHQL_URL,
            headers:{ 'Content-Type':'application/x-www-form-urlencoded', Accept:'*/*' },
            data:new URLSearchParams(bodyData).toString()
        });
    }

    async function obtenerSalvadorDesdeFacebook(lot, f, btn) {
        const inicio = Date.now();
        const claveCache = `${f.formatoRover}|${lot.hora}`;
        const cache = salvadorFacebookCache.get(claveCache);
        if (cache?.numero) {
            console.table([{
                Sitio:'Facebook / Bolido Belice', Lotería:lot.nombre,
                FechaBuscada:f.formatoRover, HoraBuscada:lot.hora,
                Resultado:cache.numero, Fuente:'caché de esta sesión',
                SolicitudesFacebook:0, Estado:'✅ coincidencia exacta guardada'
            }]);
            return { numero:cache.numero, fuente:'Facebook (caché Bolido Belice)', solicitudes:0, duracion:0 };
        }

        mostrarEsperaLotDom(btn, '⏳ Facebook: obteniendo sesión...');
        const acceso = await gmRequestTexto({
            method:'GET',
            url:SALVADOR_FB_SESSION_URL,
            headers:{
                Accept:'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Cache-Control':'no-cache, no-store, max-age=0',
                Pragma:'no-cache'
            }
        });
        const html = String(acceso.responseText || '');
        if (acceso.status !== 200) throw new Error(`Facebook sesión HTTP ${acceso.status}`);

        const sesion = {
            user:extraerTokenFacebook(html, 'user'),
            fbDtsg:extraerTokenFacebook(html, 'fb_dtsg'),
            lsd:extraerTokenFacebook(html, 'lsd'),
            jazoest:extraerTokenFacebook(html, 'jazoest')
        };
        console.table([{
            Sitio:'Facebook sesión', Lotería:lot.nombre,
            FechaBuscada:f.formatoRover, HoraBuscada:lot.hora,
            HTTP:acceso.status, Bytes:html.length,
            Usuario:sesion.user ? 'OK' : 'NO',
            FbDtsg:sesion.fbDtsg ? 'OK' : 'NO', LSD:sesion.lsd ? 'OK' : 'NO',
            SolicitudesFacebook:1
        }]);
        if (!sesion.user || !sesion.fbDtsg || !sesion.lsd) {
            throw new Error('Facebook requiere iniciar sesión en este navegador');
        }

        const docId = extraerDocIdTimelineFacebook(html);
        let cursor = null;
        let paginasConsultadas = 0;

        for (let pagina = 1; pagina <= SALVADOR_FB_MAX_PAGES; pagina++) {
            mostrarEsperaLotDom(btn, `⏳ Facebook página ${pagina}/${SALVADOR_FB_MAX_PAGES}...`);
            const graphql = await consultarPaginaTimelineFacebook(sesion, cursor, docId);
            paginasConsultadas = pagina;
            const respuesta = String(graphql.responseText || '');
            if (graphql.status !== 200) throw new Error(`Facebook GraphQL HTTP ${graphql.status} en página ${pagina}`);
            if (/Log in to continue|Not Logged In|error"\s*:\s*1357001/i.test(respuesta)) {
                throw new Error('Facebook rechazó la sesión; inicia sesión nuevamente');
            }

            const encontrado = analizarPostsSalvadorFacebook(respuesta, lot, f.formatoRover, `GraphQL página ${pagina}`);
            const siguienteCursor = extraerCursorFacebook(respuesta);
            const haySiguiente = facebookTienePaginaSiguiente(respuesta);
            console.table([{
                Sitio:'Facebook GraphQL', Lotería:lot.nombre,
                FechaBuscada:f.formatoRover, HoraBuscada:lot.hora,
                Página:`${pagina}/${SALVADOR_FB_MAX_PAGES}`,
                HTTP:graphql.status, BytesRespuesta:respuesta.length,
                DIARIA:(respuesta.match(/DIARIA/gi) || []).length,
                ElSalvador:(respuesta.match(/El\s+Salvador/gi) || []).length,
                Resultado:encontrado?.numero || '—',
                CursorSiguiente:siguienteCursor ? 'SÍ' : 'NO',
                Estado:encontrado ? '✅ coincidencia exacta; STOP' : '⚠️ continúa si existe otra página',
                SolicitudesFacebook:1 + pagina,
                DuraciónMs:Date.now() - inicio
            }]);

            if (encontrado) {
                salvadorFacebookCache.set(claveCache, { numero:encontrado.numero, guardadoEn:Date.now() });
                return {
                    numero:encontrado.numero,
                    fuente:`Facebook GraphQL (Bolido Belice, página ${pagina})`,
                    solicitudes:1 + pagina,
                    duracion:Date.now() - inicio
                };
            }
            if (!haySiguiente || !siguienteCursor) break;
            if (siguienteCursor === cursor) {
                console.warn(`[El Salvador Facebook] Cursor repetido en página ${pagina}; proceso detenido.`);
                break;
            }
            cursor = siguienteCursor;
        }

        console.table([{
            Sitio:'Facebook GraphQL', Lotería:lot.nombre,
            FechaBuscada:f.formatoRover, HoraBuscada:lot.hora,
            PáginasConsultadas:paginasConsultadas,
            SolicitudesFacebook:1 + paginasConsultadas,
            Resultado:'—', Estado:'⚠️ no encontrado dentro del límite',
            DuraciónMs:Date.now() - inicio
        }]);
        return null;
    }

    async function copiarLoteriaSalvador(lot, btn) {
        const f = obtenerFechaDesdeInput();
        const fechaISO = f.formatoLotDomISO.slice(0, 10);
        const url = `https://loto.sv/api/resultados_diaria_sv.php?fecha=${encodeURIComponent(fechaISO)}&t=${Date.now()}`;
        const inicio = Date.now();
        mostrarEsperaLotDom(btn, '⏳ Consultando El Salvador...');

        let motivoRespaldo = 'resultado no disponible';

        try {
            const data = await gmGetJson(url);
            const registro = data?.[lot.apiTurno] ?? null;
            const valorCrudo = registro?.par1 == null ? '' : String(registro.par1).trim();
            const numero = /^\d{1,2}$/.test(valorCrudo) ? valorCrudo.padStart(2, '0') : null;

            console.table([{
                Sitio: 'loto.sv',
                Lotería: lot.nombre,
                CódigoRover: lot.codigoRoverCorto,
                FechaRover: f.formatoRover,
                FechaAPI: fechaISO,
                TurnoAPI: lot.apiTurno,
                HoraEsperada: lot.hora,
                HoraRecibida: registro?.hora || '—',
                ValorCrudo: valorCrudo || '—',
                Resultado: numero || '—',
                SolicitudesHTTP: 1,
                Estado: numero ? '✅ resultado válido' : '⚠️ resultado no disponible',
                Fuente: 'API oficial Loto El Salvador',
                DuraciónMs: Date.now() - inicio,
                URL: url
            }]);

            if (!numero) {
                motivoRespaldo = 'API oficial sin resultado para el turno';
            } else {
                const ok = llenarCampoUnico(lot, numero, f.formatoRover, btn);
                logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:numero, fuente:'API oficial Loto El Salvador', estado:ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy:esFechaLotDomDeHoy(f) });
                return;
            }
        } catch (err) {
            motivoRespaldo = `API oficial falló: ${err.message}`;
            console.table([{
                Sitio: 'loto.sv',
                Lotería: lot.nombre,
                CódigoRover: lot.codigoRoverCorto,
                FechaRover: f.formatoRover,
                FechaAPI: fechaISO,
                TurnoAPI: lot.apiTurno,
                SolicitudesHTTP: 1,
                Estado: `❌ ${err.message}`,
                Fuente: 'API oficial Loto El Salvador',
                DuraciónMs: Date.now() - inicio,
                URL: url
            }]);
        }

        console.info(`[El Salvador] Activando respaldo Facebook: ${motivoRespaldo}`);
        try {
            const facebook = await obtenerSalvadorDesdeFacebook(lot, f, btn);
            if (!facebook?.numero) {
                logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:'—', fuente:'API oficial → Facebook', estado:'⚠️ Resultado no disponible', sonDeHoy:esFechaLotDomDeHoy(f) });
                mostrarMensaje(btn, '⚠️ Resultado no disponible', '#ff9800');
                return;
            }
            const ok = llenarCampoUnico(lot, facebook.numero, f.formatoRover, btn);
            logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:facebook.numero, fuente:facebook.fuente, estado:ok ? '✅ Copiado' : '⚠️ Fila no visible', sonDeHoy:esFechaLotDomDeHoy(f) });
        } catch (err) {
            console.table([{
                Sitio:'Facebook / Bolido Belice',
                Lotería:lot.nombre,
                FechaBuscada:f.formatoRover,
                HoraBuscada:lot.hora,
                Fuente:'Respaldo Facebook',
                Estado:`❌ ${err.message}`,
                MotivoRespaldo:motivoRespaldo
            }]);
            logTablaResultado({ loteria:lot.nombre, fecha:f.formatoRover, resultado:'—', fuente:'API oficial → Facebook', estado:`❌ ${err.message}`, sonDeHoy:esFechaLotDomDeHoy(f) });
            mostrarMensaje(btn, /iniciar sesión|sesión/i.test(err.message) ? '⚠️ Inicia sesión en Facebook' : '❌ ERROR EL SALVADOR', /iniciar sesión|sesión/i.test(err.message) ? '#ff9800' : '#f44336');
        }
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

    RESULTADOS_WS_SITIOS.forEach(conectarWebSocketResultados);
    if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', crearMenu);
    else setTimeout(crearMenu, 1000);
})();