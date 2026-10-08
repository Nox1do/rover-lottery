// ==UserScript==
// @name         Rovs Loterías USA V0.6.0
// @namespace    http://tampermonkey.net/
// @version      0.6.2
// @description  Proveedores móviles y LotteryUSA separados, con controlador y transporte comunes
// @author       noeg
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      lotteryusa.com
// @connect      mobile-fla.lotteryservices.com
// @connect      lalotmobapi.intralot.us
// @connect      api-solutions.ohiolottery.com
// @connect      authapi-solutions.ohiolottery.com
// @connect      tna.p1.awc.lotteryservices.net
// @connect      ins.p1.awc.lotteryservices.net
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA/Rovs-Loterias-USA.meta.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA/Rovs-Loterias-USA.user.js
// @homepageURL  https://github.com/Nox1do/rover-lottery/tree/main/Loterias%20USA
// @supportURL   https://github.com/Nox1do/rover-lottery/issues
// ==/UserScript==

(function() {
    'use strict';

    console.log("Rovs Loterías USA V0.6.0 · Proveedores móviles + LotteryUSA");

    // === CONFIGURACIÓN MAESTRA ===
    const LOTERIAS = [
        // =================================================================
        // ======================= CATEGORÍA: DÍA ==========================
        // =================================================================

        { id: "tn-morning", nombreMenu: "🇺🇸 Tennessee Morning", nombreFila: "TENNESSEE MORNING",
          fuente: "TENNESSEE_API", sorteo: "MORNING",
          categoria: "DIA" },

        { id: "tx-morning", nombreMenu: "🇺🇸 Texas Morning", nombreFila: "TEXAS MORNING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/morning-pick-3/",
          url4: "https://www.lotteryusa.com/texas/morning-pick-4/",
          categoria: "DIA" },

        { id: "md-am", nombreMenu: "🇺🇸 Maryland Midday", nombreFila: "MARYLAND AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maryland/midday-pick-3/",
          url4: "https://www.lotteryusa.com/maryland/midday-pick-4/",
          categoria: "DIA" },

        { id: "ga-am", nombreMenu: "🇺🇸 Georgia Midday", nombreFila: "GEORGIA MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/georgia/midday-3/",
          url4: "https://www.lotteryusa.com/georgia/midday-4/",
          categoria: "DIA" },

        { id: "oh-am", nombreMenu: "🇺🇸 Ohio Midday", nombreFila: "OHIO MIDDAY",
          fuente: "OHIO_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "nj-am", nombreMenu: "🇺🇸 New Jersey Midday", nombreFila: "NEW JERSEY AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-jersey/midday-pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/midday-pick-4/",
          categoria: "DIA" },

        { id: "sc-am", nombreMenu: "🇺🇸 South Carolina Midday", nombreFila: "SOUTH C MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/south-carolina/midday-pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/midday-pick-4/",
          categoria: "DIA" },

        { id: "mi-am", nombreMenu: "🇺🇸 Michigan Midday", nombreFila: "MICHIGAN DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/michigan/midday-3/",
          url4: "https://www.lotteryusa.com/michigan/midday-4/",
          categoria: "DIA" },

        { id: "me-am", nombreMenu: "🇺🇸 Maine Day", nombreFila: "MAINE DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maine/midday-3/",
          url4: "https://www.lotteryusa.com/maine/midday-4/",
          categoria: "DIA" },

        { id: "ky-am", nombreMenu: "🇺🇸 Kentucky Midday", nombreFila: "KENTUCKY MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kentucky/midday-pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/midday-pick-4/",
          categoria: "DIA" },

        { id: "in-am", nombreMenu: "🇺🇸 Indiana Midday", nombreFila: "INDIANA MIDDAY",
          fuente: "INDIANA_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "ia-am", nombreMenu: "🇺🇸 Iowa Midday", nombreFila: "IOWA MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/iowa/midday-3/",
          url4: "https://www.lotteryusa.com/iowa/midday-4/",
          categoria: "DIA" },

        { id: "pa-am", nombreMenu: "🇺🇸 Pennsylvania Midday", nombreFila: "PENNSYLV AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/pennsylvania/midday-pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/midday-pick-4/",
          categoria: "DIA" },

        { id: "tn-midday", nombreMenu: "🇺🇸 Tennessee Midday", nombreFila: "TENNESSEE MIDDAY",
          fuente: "TENNESSEE_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "tx-day", nombreMenu: "🇺🇸 Texas Day", nombreFila: "TEXAS DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/midday-pick-3/",
          url4: "https://www.lotteryusa.com/texas/midday-4/",
          categoria: "DIA" },

        { id: "ri-am", nombreMenu: "🇺🇸 Rhode Island Midday", nombreFila: "RHODE ISLAND MIDDAY",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/midday-numbers/",
          categoria: "DIA" },

        { id: "il-am", nombreMenu: "🇺🇸 Illinois Midday", nombreFila: "ILLINOIS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/illinois/midday-3/",
          url4: "https://www.lotteryusa.com/illinois/midday-4/",
          categoria: "DIA" },

        { id: "mo-am", nombreMenu: "🇺🇸 Missouri Midday", nombreFila: "MISSOURI MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/missouri/midday-pick-3/",
          url4: "https://www.lotteryusa.com/missouri/midday-pick-4/",
          categoria: "DIA" },

        { id: "ma-am", nombreMenu: "🇺🇸 Massachusetts Midday", nombreFila: "MASSACHUSETTS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/midday-numbers/",
          categoria: "DIA" },

        { id: "ar-am", nombreMenu: "🇺🇸 Arkansas Midday", nombreFila: "ARKANSAS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arkansas/midday-cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/midday-cash-4/",
          categoria: "DIA" },

        { id: "va-am", nombreMenu: "🇺🇸 Virginia Day", nombreFila: "VIRGINIA DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/virginia/midday-3/",
          url4: "https://www.lotteryusa.com/virginia/midday-4/",
          categoria: "DIA" },

        { id: "ks-am", nombreMenu: "🇺🇸 Kansas Midday", nombreFila: "KANSAS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kansas/midday-pick-3/",
          url4: null,
          categoria: "DIA" },

        { id: "de-am", nombreMenu: "🇺🇸 Delaware Day", nombreFila: "DELAWARE AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/delaware/play-3-midday/",
          url4: "https://www.lotteryusa.com/delaware/play-4-midday/",
          categoria: "DIA" },

        { id: "ct-am", nombreMenu: "🇺🇸 Connecticut Day", nombreFila: "CONNECT AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/connecticut/midday-3/",
          url4: "https://www.lotteryusa.com/connecticut/midday-4/",
          categoria: "DIA" },

        { id: "dc-am", nombreMenu: "🇺🇸 Washington D.C. Midday", nombreFila: "WASHINGTON D.C MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-midday/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-midday/",
          categoria: "DIA" },

        { id: "pr-am", nombreMenu: "🇺🇸 Puerto Rico Midday", nombreFila: "PUERTO RICO AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/puerto-rico/midday-pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/midday-pega-4/",
          categoria: "DIA" },

        { id: "wi-am", nombreMenu: "🇺🇸 Wisconsin Midday", nombreFila: "WISCONSIN MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4/",
          categoria: "DIA" },

        { id: "nc-am", nombreMenu: "🇺🇸 North Carolina Day", nombreFila: "NORTH CAROLINA AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/north-carolina/midday-3/",
          url4: "https://www.lotteryusa.com/north-carolina/midday-pick-4/",
          categoria: "DIA" },

        { id: "nm-am", nombreMenu: "🇺🇸 New Mexico Midday", nombreFila: "NEW MEXICO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-mexico/midday-pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/midday-pick-4-plus/",
          categoria: "DIA" },

        { id: "ms-am", nombreMenu: "🇺🇸 Mississippi Midday", nombreFila: "MISSISSIPPI MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/mississippi/cash-3-midday/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4-midday/",
          categoria: "DIA" },

        { id: "co-am", nombreMenu: "🇺🇸 Colorado Midday", nombreFila: "COLORADO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/colorado/pick-3-midday/",
          url4: null,
          categoria: "DIA" },

        { id: "or-am", nombreMenu: "🇺🇸 Oregon 1pm", nombreFila: "OREGON 1PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-1pm/",
          categoria: "DIA" },

        { id: "ca-am", nombreMenu: "🇺🇸 California Midday", nombreFila: "CALIFORNIA MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/california/midday-3/",
          url4: null,
          categoria: "DIA" },

        { id: "id-am", nombreMenu: "🇺🇸 Idaho Midday", nombreFila: "IDAHO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/idaho/midday-pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4-day/",
          categoria: "DIA" },

        { id: "fl-am", nombreMenu: "🇺🇸 Florida Midday", nombreFila: "FLORIDA AM",
          fuente: "FLORIDA_API", sorteo: "MIDDAY",
          categoria: "DIA" },


        // =================================================================
        // ====================== CATEGORÍA: NOCHE =========================
        // =================================================================

        { id: "me-pm", nombreMenu: "🇺🇸 Maine Evening", nombreFila: "MAINE EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maine/pick-3/",
          url4: "https://www.lotteryusa.com/maine/pick-4/",
          categoria: "NOCHE" },

        { id: "sc-pm", nombreMenu: "🇺🇸 South Carolina Evening", nombreFila: "SOUTH C EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/south-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/pick-4/",
          categoria: "NOCHE" },

        { id: "ri-pm", nombreMenu: "🇺🇸 Rhode Island Evening", nombreFila: "RHODE ISLAND EVENING",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/numbers/",
          categoria: "NOCHE" },

        { id: "pa-pm", nombreMenu: "🇺🇸 Pennsylvania Evening", nombreFila: "PENNSYLV EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/pennsylvania/pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/pick-4/",
          categoria: "NOCHE" },

        { id: "ga-pm", nombreMenu: "🇺🇸 Georgia Evening", nombreFila: "GEORGIA EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/georgia/cash-3-evening/",
          url4: "https://www.lotteryusa.com/georgia/cash-4-evening/",
          categoria: "NOCHE" },

        { id: "tx-pm", nombreMenu: "🇺🇸 Texas Evening", nombreFila: "TEXAS-EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/evening-pick-3/",
          url4: "https://www.lotteryusa.com/texas/evening-pick-4/",
          categoria: "NOCHE" },

        { id: "or-4pm", nombreMenu: "🇺🇸 Oregon 4pm", nombreFila: "OREGON 4PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-4pm/",
          categoria: "NOCHE" },

        { id: "tn-pm", nombreMenu: "🇺🇸 Tennessee Evening", nombreFila: "TENNESSEE EVENING",
          fuente: "TENNESSEE_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "oh-pm", nombreMenu: "🇺🇸 Ohio Evening", nombreFila: "OHIO EVENING",
          fuente: "OHIO_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "mi-pm", nombreMenu: "🇺🇸 Michigan Night", nombreFila: "MICHIGAN NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/michigan/daily-3/",
          url4: "https://www.lotteryusa.com/michigan/daily-4/",
          categoria: "NOCHE" },

        { id: "dc-pm", nombreMenu: "🇺🇸 Washington D.C. Evening", nombreFila: "WASHINGTON D.C EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-numbers/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4/",
          categoria: "NOCHE" },

        { id: "md-pm", nombreMenu: "🇺🇸 Maryland Evening", nombreFila: "MARYLAND PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maryland/pick-3/",
          url4: "https://www.lotteryusa.com/maryland/pick-4/",
          categoria: "NOCHE" },

        { id: "de-pm", nombreMenu: "🇺🇸 Delaware PM", nombreFila: "DELAWARE PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/delaware/play-3/",
          url4: "https://www.lotteryusa.com/delaware/play-4/",
          categoria: "NOCHE" },

        { id: "ar-pm", nombreMenu: "🇺🇸 Arkansas Evening", nombreFila: "ARKANSAS EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arkansas/cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/cash-4/",
          categoria: "NOCHE" },

        { id: "pr-pm", nombreMenu: "🇺🇸 Puerto Rico Noche", nombreFila: "PUERTO RICO PM ",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/puerto-rico/pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/pega-4/",
          categoria: "NOCHE" },

        { id: "ma-pm", nombreMenu: "🇺🇸 Massachusetts Evening", nombreFila: "MASSACHUSETTS EVENING",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/numbers/",
          categoria: "NOCHE" },

        { id: "az-pm", nombreMenu: "🇺🇸 Arizona Pick 3", nombreFila: "ARIZONA",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arizona/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "co-pm", nombreMenu: "🇺🇸 Colorado Evening", nombreFila: "COLORADO EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/colorado/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "ca-pm", nombreMenu: "🇺🇸 California Evening", nombreFila: "CALIFORNIA EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/california/daily-3/",
          url4: "https://www.lotteryusa.com/california/daily-4/",
          categoria: "NOCHE" },

        { id: "mo-pm", nombreMenu: "🇺🇸 Missouri Evening", nombreFila: "MISSOURI EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/missouri/pick-3/",
          url4: "https://www.lotteryusa.com/missouri/pick-4/",
          categoria: "NOCHE" },

        { id: "id-pm", nombreMenu: "🇺🇸 Idaho Night", nombreFila: "IDAHO NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/idaho/pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4/",
          categoria: "NOCHE" },

        { id: "wi-pm", nombreMenu: "🇺🇸 Wisconsin Evening", nombreFila: "WISCONSIN EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3-evening/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4-evening/",
          categoria: "NOCHE" },

        { id: "or-7pm", nombreMenu: "🇺🇸 Oregon 7pm", nombreFila: "OREGON 7PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-7pm/",
          categoria: "NOCHE" },

        { id: "ks-pm", nombreMenu: "🇺🇸 Kansas Evening", nombreFila: "KANSAS EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kansas/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "il-pm", nombreMenu: "🇺🇸 Illinois Evening", nombreFila: "ILLINOIS EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/illinois/daily-3/",
          url4: "https://www.lotteryusa.com/illinois/daily-4/",
          categoria: "NOCHE" },

        { id: "ct-pm", nombreMenu: "🇺🇸 Connecticut Night", nombreFila: "CONNECT PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/connecticut/play-3/",
          url4: "https://www.lotteryusa.com/connecticut/play-4/",
          categoria: "NOCHE" },

        { id: "ms-pm", nombreMenu: "🇺🇸 Mississippi Evening", nombreFila: "MISSISSIPPI EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/mississippi/cash-3/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4/",
          categoria: "NOCHE" },

        { id: "nj-pm", nombreMenu: "🇺🇸 New Jersey Evening", nombreFila: "NEW JERSEY PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-jersey/pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/pick-4/",
          categoria: "NOCHE" },

        { id: "la-pm", nombreMenu: "🇺🇸 Louisiana Evening", nombreFila: "LOUISIANA EVENING",
          fuente: "LOUISIANA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "va-night", nombreMenu: "🇺🇸 Virginia Night", nombreFila: "VIRGINIA NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/virginia/pick-3/",
          url4: "https://www.lotteryusa.com/virginia/pick-4/",
          categoria: "NOCHE" },

        { id: "ky-pm", nombreMenu: "🇺🇸 Kentucky Evening", nombreFila: "KENTUCKY EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kentucky/pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/pick-4/",
          categoria: "NOCHE" },

        { id: "ia-pm", nombreMenu: "🇺🇸 Iowa Evening", nombreFila: "IOWA EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/iowa/pick-3/",
          url4: "https://www.lotteryusa.com/iowa/pick-4/",
          categoria: "NOCHE" },

        { id: "in-pm", nombreMenu: "🇺🇸 Indiana Evening", nombreFila: "INDIANA EVENING",
          fuente: "INDIANA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "tx-night", nombreMenu: "🇺🇸 Texas Night", nombreFila: "TEXAS NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/pick-3/",
          url4: "https://www.lotteryusa.com/texas/daily-4/",
          categoria: "NOCHE" },

        { id: "fl-pm", nombreMenu: "🇺🇸 Florida Evening", nombreFila: "FLORIDA PM",
          fuente: "FLORIDA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "nc-pm", nombreMenu: "🇺🇸 North Carolina Evening", nombreFila: "NORTH CAROLINA PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/north-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/north-carolina/pick-4/",
          categoria: "NOCHE" },

        { id: "nm-pm", nombreMenu: "🇺🇸 New Mexico Evening", nombreFila: "NEW MEXICO EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-mexico/pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/pick-4-plus/",
          categoria: "NOCHE" },

        { id: "dc-night", nombreMenu: "🇺🇸 Washington D.C. Night", nombreFila: "WASHINGTON D.C NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-3-night/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-night/",
          categoria: "NOCHE" },

        { id: "ga-night", nombreMenu: "🇺🇸 Georgia Night", nombreFila: "GEORGIA NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/georgia/cash-3/",
          url4: "https://www.lotteryusa.com/georgia/cash-4/",
          categoria: "NOCHE" }
    ];

    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // === CSS ===
    const style = document.createElement('style');
    style.textContent = `
        .gm-bar { position: fixed; bottom: 0; left: 0; width: 100%; height: 150px; background: #ffffff; border-top: 4px solid #007bff; box-shadow: 0 -4px 15px rgba(0,0,0,0.1); z-index: 2147483647; display: flex; flex-direction: row; font-family: sans-serif; transform: translateY(100%); transition: transform 0.3s ease; }
        .gm-bar.visible { transform: translateY(0); }
        .gm-bar.mode-day { border-top-color: #007bff; }
        .gm-bar.mode-night { border-top-color: #f1c40f; }
        .gm-left-panel { width: 240px; background: #f8f9fa; border-right: 1px solid #e9ecef; display: flex; flex-direction: column; padding: 10px; flex-shrink: 0; }
        .gm-tabs { display: flex; background: #e9ecef; border-radius: 6px; padding: 4px; margin-bottom: 10px; }
        .gm-tab-btn { flex: 1; background: transparent; border: none; padding: 6px; font-size: 13px; font-weight: 600; color: #6c757d; border-radius: 4px; cursor: pointer; }
        .gm-tab-btn.active { background: white; color: #007bff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .gm-bar.mode-night .gm-tab-btn.active { color: #d35400; }
        .gm-search-input { width: 100%; padding: 8px; border: 1px solid #ced4da; border-radius: 6px; box-sizing: border-box; }
        .gm-grid-horizontal { flex-grow: 1; display: grid; grid-template-rows: repeat(2, 1fr); grid-auto-flow: column; grid-auto-columns: 180px; gap: 10px; padding: 15px 15px 10px 15px; overflow-x: auto; overflow-y: hidden; }
        .gm-loto-btn { background: white; border: 1px solid #dee2e6; border-radius: 6px; padding: 0 12px; height: 38px; min-width: 170px; display: none; align-items: center; justify-content: space-between; font-size: 13px; color: #495057; cursor: pointer; transition: all 0.15s; }
        .gm-loto-btn.visible-cat { display: flex; }
        .gm-loto-btn:hover { border-color: #007bff; background: #f8f9fa; transform: translateY(-1px); }
        .gm-bar.mode-night .gm-loto-btn:hover { border-color: #f1c40f; }
        .gm-status-icon { font-weight: bold; min-width: 20px; text-align: center; }
        .gm-loading { display: inline-block; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .gm-toggle-btn { position: fixed; bottom: 20px; right: 20px; width: 45px; height: 45px; background: #007bff; color: white; border-radius: 50%; border: none; box-shadow: 0 4px 10px rgba(0,0,0,0.2); font-size: 20px; cursor: pointer; z-index: 2147483647; transition: all 0.3s; }
        .gm-toggle-btn.open { transform: translateY(-130px) rotate(45deg); background: #dc3545; }
    `;

    // === INICIO SEGURO ===
    function init() {
        if (document.getElementById('gm-bar')) return;
        if (!document.body) { setTimeout(init, 500); return; }
        try { createInterface(); } catch (e) { console.error(e); }
    }

    function createInterface() {
        document.head.appendChild(style);
        const bar = document.createElement('div'); bar.id = 'gm-bar'; bar.className = 'gm-bar mode-day';
        const leftPanel = document.createElement('div'); leftPanel.className = 'gm-left-panel';

        const tabs = document.createElement('div'); tabs.className = 'gm-tabs';
        const tabDia = document.createElement('button'); tabDia.className = 'gm-tab-btn active'; tabDia.innerText = '☀️ DÍA';
        const tabNoche = document.createElement('button'); tabNoche.className = 'gm-tab-btn'; tabNoche.innerText = '🌙 NOCHE';
        tabs.appendChild(tabDia); tabs.appendChild(tabNoche); leftPanel.appendChild(tabs);

        const searchInput = document.createElement('input'); searchInput.className = 'gm-search-input'; searchInput.placeholder = '🔍 Filtrar...'; leftPanel.appendChild(searchInput);
        bar.appendChild(leftPanel);
        const grid = document.createElement('div'); grid.className = 'gm-grid-horizontal';

        LOTERIAS.forEach(loto => {
            const btn = document.createElement('button'); btn.className = `gm-loto-btn cat-${loto.categoria}`;
            if (loto.categoria === 'DIA') btn.classList.add('visible-cat');
            const spanName = document.createElement('span'); spanName.innerText = loto.nombreMenu;
            const spanStatus = document.createElement('span'); spanStatus.className = 'gm-status-icon';
            btn.appendChild(spanName); btn.appendChild(spanStatus);
            btn.onclick = () => executeScrape(loto, spanStatus);
            grid.appendChild(btn);
        });
        bar.appendChild(grid); document.body.appendChild(bar);

        const updateVisibility = (cat) => {
            const term = searchInput.value.toLowerCase();
            document.querySelectorAll('.gm-loto-btn').forEach(btn => {
                const isCat = btn.classList.contains(`cat-${cat}`);
                const isMatch = btn.innerText.toLowerCase().includes(term);
                if (isCat && isMatch) btn.classList.add('visible-cat'); else btn.classList.remove('visible-cat');
            });
        };
        tabDia.onclick = () => { tabDia.classList.add('active'); tabNoche.classList.remove('active'); bar.classList.replace('mode-night', 'mode-day'); updateVisibility('DIA'); };
        tabNoche.onclick = () => { tabDia.classList.remove('active'); tabNoche.classList.add('active'); bar.classList.replace('mode-day', 'mode-night'); updateVisibility('NOCHE'); };
        searchInput.addEventListener('input', () => updateVisibility(tabDia.classList.contains('active') ? 'DIA' : 'NOCHE'));

        const toggleBtn = document.createElement('button'); toggleBtn.className = 'gm-toggle-btn'; toggleBtn.innerHTML = '⭐';
        toggleBtn.onclick = () => { const isOpen = bar.classList.toggle('visible'); toggleBtn.classList.toggle('open'); if (isOpen) setTimeout(() => searchInput.focus(), 200); };
        document.body.appendChild(toggleBtn);
    }

    function getDateObj() {
        const preferredSelectors = [
            '#fecha',
            'input[name="fecha"]',
            '#fecha_desde',
            'input[name="fecha_desde"]',
            'input[name="date"]',
            'input[type="date"]'
        ];

        for (const selector of preferredSelectors) {
            const element = document.querySelector(selector);
            const parsed = parseRoverDateValue(element && element.value);
            if (parsed) {
                console.log('[Fecha Rover]', {
                    fecha: formatLocalDateKey(parsed),
                    origen: selector,
                    valor: element.value
                });
                return parsed;
            }
        }

        // Respaldo: buscar un control real cuyo valor tenga formato de fecha.
        const controls = [...document.querySelectorAll('input, select')]
            .filter(element => !element.closest('#gm-bar') && !element.classList.contains('gm-search-input'));

        for (const element of controls) {
            const parsed = parseRoverDateValue(element.value);
            if (!parsed) continue;

            console.log('[Fecha Rover]', {
                fecha: formatLocalDateKey(parsed),
                origen: element.id ? `#${element.id}` : (element.name || element.type || element.tagName),
                valor: element.value
            });
            return parsed;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        console.warn('[Fecha Rover] No se encontró #fecha_desde ni otro control válido; se usará hoy.', {
            fecha: formatLocalDateKey(today)
        });
        return today;
    }

    function parseRoverDateValue(rawValue) {
        const raw = String(rawValue || '').trim();
        if (!raw) return null;

        // YYYY-MM-DD o YYYY/MM/DD
        let match = raw.match(/(?:^|\D)(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\D|$)/);
        if (match) return buildValidLocalDate(Number(match[1]), Number(match[2]), Number(match[3]));

        // MM/DD/YYYY o DD/MM/YYYY. Si es ambiguo, Rover usa MM/DD/YYYY.
        match = raw.match(/(?:^|\D)(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\D|$)/);
        if (match) {
            const first = Number(match[1]);
            const second = Number(match[2]);
            const year = Number(match[3]);
            const month = first > 12 ? second : first;
            const day = first > 12 ? first : second;
            return buildValidLocalDate(year, month, day);
        }

        return null;
    }

    function buildValidLocalDate(year, month, day) {
        if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function formatLocalDateKey(dateObj) {
        return [
            dateObj.getFullYear(),
            String(dateObj.getMonth() + 1).padStart(2, '0'),
            String(dateObj.getDate()).padStart(2, '0')
        ].join('-');
    }


    // === PROVEEDORES ===
    // Contrato: consultar(config, fecha) -> { p3, p4, source, requiredGames }.
    // Los proveedores obtienen datos; el controlador es el único que escribe en Rover.
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
        })
    });

    function createMobileProvider({ name, games, fetchGame, parseGame, labels = ['Pick 3', 'Pick 4'] }) {
        return {
            name, labels,
            async consultar(config, dateObj) {
                const [data3, data4] = await Promise.all([
                    fetchGame(games[0], dateObj), fetchGame(games[1], dateObj)
                ]);
                return {
                    p3: parseGame(data3, dateObj, config.sorteo, 3),
                    p4: parseGame(data4, dateObj, config.sorteo, 4),
                    source: `📱 API móvil ${name} Lottery`,
                    requiredGames: ['p3', 'p4']
                };
            }
        };
    }

    // === CONTROLADOR COMÚN ===
    const activeQueries = new WeakMap();

    async function executeScrape(lotoConfig, statusSpan) {
        const queryId = Symbol();
        activeQueries.set(statusSpan, queryId);
        const isCurrent = () => activeQueries.get(statusSpan) === queryId;
        updateStatus(statusSpan, '⏳', '', '');
        statusSpan.classList.add('gm-loading');

        try {
            const dateObj = getDateObj();
            const provider = Object.prototype.hasOwnProperty.call(PROVIDERS, lotoConfig.fuente)
                ? PROVIDERS[lotoConfig.fuente] : null;
            if (!provider) throw new Error(`Fuente desconocida: ${lotoConfig.fuente}`);
            const result = await provider.consultar(lotoConfig, dateObj);
            // Otro clic sobre este botón pasa a ser dueño de su estado y resultado.
            if (!isCurrent()) return;
            if (localDateKey(getDateObj()) !== localDateKey(dateObj)) {
                updateStatus(statusSpan, '⚠️', 'orange', 'Cambió la fecha de Rover. Consulta esta lotería otra vez.');
                return;
            }
            presentResult(result, lotoConfig, provider, statusSpan, dateObj);
        } catch (error) {
            if (!isCurrent()) return;
            const message = error instanceof Error ? error.message : 'Error de consulta';
            updateStatus(statusSpan, '❌', 'red', `${lotoConfig.nombreMenu}: ${message}`);
            // Nunca registrar cabeceras, tokens, contraseñas ni cuerpos de autenticación.
            console.error(`[${lotoConfig.fuente}] ${lotoConfig.nombreMenu}: ${message}`);
        } finally {
            if (isCurrent()) {
                statusSpan.classList.remove('gm-loading');
                activeQueries.delete(statusSpan);
            }
        }
    }

    function updateStatus(statusSpan, icon, color, title) {
        statusSpan.innerText = icon;
        statusSpan.style.color = color;
        statusSpan.title = title;
    }

    function presentResult(result, config, provider, statusSpan, dateObj) {
        const { p3, p4, source, requiredGames } = result;
        let state, icon, color;
        if (!p3 && !p4) {
            state = 'Sin resultado para la fecha y sorteo seleccionados'; icon = '⛔'; color = 'gray';
        } else if (!fillTable(p3, p4, config.nombreFila)) {
            state = 'No encontró fila'; icon = '⚠️'; color = 'orange';
        } else {
            const missing = requiredGames.filter(game => !result[game]);
            if (missing.length) {
                const names = missing.map(game => provider.labels[game === 'p3' ? 0 : 1]);
                state = `Resultado parcial: falta ${names.join(', ')}`; icon = '⚠️'; color = 'orange';
            } else {
                state = 'Llenado'; icon = '✅'; color = 'green';
            }
        }
        updateStatus(statusSpan, icon, color, `${localDateKey(dateObj)}${config.sorteo ? ' · ' + config.sorteo : ''}: ${state}`);
        const log = {
            'Lotería': { valor: config.nombreMenu },
            'Fuente': { valor: source },
            'Hora': { valor: new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
            'Fecha': { valor: localDateKey(dateObj) }
        };
        if (config.sorteo) log['Sorteo'] = { valor: config.sorteo };
        log[provider.labels[0]] = { valor: p3 ?? '—' };
        log[provider.labels[1]] = { valor: p4 ?? '—' };
        log['Estado'] = { valor: state };
        console.table(log);
    }

    function localDateKey(dateObj) {
        return formatLocalDateKey(dateObj);
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


    // === ROVER: LLENADO DEL FORMULARIO ===

    function fillTable(p3, p4, targetRowName) {
        const tableRows = document.querySelectorAll('table tbody tr');
        let bestRow = null; let shortestLength = Infinity;
        const searchNameClean = superClean(targetRowName);

        tableRows.forEach(tr => {
            const rowTextClean = superClean(tr.innerText);
            if (rowTextClean.includes(searchNameClean)) {
                if (rowTextClean.length < shortestLength) { shortestLength = rowTextClean.length; bestRow = tr; }
            }
        });

        if (!bestRow) return false;
        const inputs = bestRow.querySelectorAll('input[type="text"], input[type="number"]');
        if (inputs.length < 5) return false;

        const r1 = p3 ? p3.slice(-2) : "";
        const r2 = p4 ? p4.slice(0, 2) : "";
        const r3 = p4 ? p4.slice(-2) : "";

        if (p3) triggerInput(inputs[3], p3);
        if (p3) triggerInput(inputs[0], r1);
        if (p4) triggerInput(inputs[4], p4);
        if (p4) triggerInput(inputs[1], r2);
        if (p4) triggerInput(inputs[2], r3);
        return true;
    }

    function triggerInput(el, val) {
        if (!el) return;
        el.value = val;
        if (val !== "") {
            el.style.transition = "none"; el.style.backgroundColor = "#d1fae5"; el.style.color = "#065f46"; el.style.fontWeight = "bold";
            setTimeout(() => { el.style.transition = "all 1s ease"; el.style.backgroundColor = ""; el.style.color = ""; }, 1000);
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }


    if (document.readyState === 'loading') {
        window.addEventListener('load', init);
    } else {
        init();
    }

})();
