// ==UserScript==
// @name         Rovs Loterías USA V0.5.1
// @namespace    http://tampermonkey.net/
// @version      0.5.1
// @description  Fix anti-caché en fetch + validación estricta de fecha en parser + UI minimalista con Tabler Icons.
// @author       noeg
// @match        https://www.roversport.net/adm/es/lottery.php*
// @match        https://roversport.net/adm/es/lottery.php*
// @match        https://www.roversport.lol/adm/es/lottery.php*
// @match        https://roversport.lol/adm/es/lottery.php*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @connect      lotteryusa.com
// ==/UserScript==

(function() {
    'use strict';

    console.log("Rovs Script V50 (Anti-Cache + Date Validation + UI Iconos) Iniciando...");

    // === CONFIGURACIÓN MAESTRA ===
    const LOTERIAS = [
        // =================================================================
        // ======================= CATEGORÍA: DÍA ==========================
        // =================================================================

        { id: "tn-morning", nombreMenu: "Tennessee Morning", nombreFila: "TENNESSEE MORNING",
          url3: "https://www.lotteryusa.com/tennessee/morning-cash-3/",
          url4: "https://www.lotteryusa.com/tennessee/morning-cash-4/",
          sorteosBusqueda: ["MORNING"], excluir: ["MIDDAY", "EVENING"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "DIA" },

        { id: "tx-morning", nombreMenu: "Texas Morning", nombreFila: "TEXAS MORNING",
          url3: "https://www.lotteryusa.com/texas/morning-pick-3/",
          url4: "https://www.lotteryusa.com/texas/morning-pick-4/",
          sorteosBusqueda: ["MORNING", "10:00"], excluir: ["DAY", "EVENING", "NIGHT"],
          juego3: "Pick 3", juego4: "Daily 4", categoria: "DIA" },

        { id: "md-am", nombreMenu: "Maryland Midday", nombreFila: "MARYLAND AM",
          url3: "https://www.lotteryusa.com/maryland/midday-pick-3/",
          url4: "https://www.lotteryusa.com/maryland/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ga-am", nombreMenu: "Georgia Midday", nombreFila: "GEORGIA MIDDAY",
          url3: "https://www.lotteryusa.com/georgia/midday-3/",
          url4: "https://www.lotteryusa.com/georgia/midday-4/",
          sorteosBusqueda: ["MIDDAY"], excluir: ["EVENING", "NIGHT"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "DIA" },

        { id: "oh-am", nombreMenu: "Ohio Midday", nombreFila: "OHIO MIDDAY",
          url3: "https://www.lotteryusa.com/ohio/midday-pick-3/",
          url4: "https://www.lotteryusa.com/ohio/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "nj-am", nombreMenu: "New Jersey Midday", nombreFila: "NEW JERSEY AM",
          url3: "https://www.lotteryusa.com/new-jersey/midday-pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "sc-am", nombreMenu: "South Carolina Midday", nombreFila: "SOUTH C MIDDAY",
          url3: "https://www.lotteryusa.com/south-carolina/midday-pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "mi-am", nombreMenu: "Michigan Midday", nombreFila: "MICHIGAN DAY",
          url3: "https://www.lotteryusa.com/michigan/midday-3/",
          url4: "https://www.lotteryusa.com/michigan/midday-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING", "NIGHT"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "DIA" },

        { id: "me-am", nombreMenu: "Maine Day", nombreFila: "MAINE DAY",
          url3: "https://www.lotteryusa.com/maine/midday-3/",
          url4: "https://www.lotteryusa.com/maine/midday-4/",
          sorteosBusqueda: ["DAY", "MIDDAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ky-am", nombreMenu: "Kentucky Midday", nombreFila: "KENTUCKY MIDDAY",
          url3: "https://www.lotteryusa.com/kentucky/midday-pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "in-am", nombreMenu: "Indiana Midday", nombreFila: "INDIANA MIDDAY",
          url3: "https://www.lotteryusa.com/indiana/midday-3/",
          url4: "https://www.lotteryusa.com/indiana/midday-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "DIA" },

        { id: "ia-am", nombreMenu: "Iowa Midday", nombreFila: "IOWA MIDDAY",
          url3: "https://www.lotteryusa.com/iowa/midday-3/",
          url4: "https://www.lotteryusa.com/iowa/midday-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "pa-am", nombreMenu: "Pennsylvania Midday", nombreFila: "PENNSYLV AM",
          url3: "https://www.lotteryusa.com/pennsylvania/midday-pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "tn-midday", nombreMenu: "Tennessee Midday", nombreFila: "TENNESSEE MIDDAY",
          url3: "https://www.lotteryusa.com/tennessee/midday-cash-3/",
          url4: "https://www.lotteryusa.com/tennessee/midday-cash-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["MORNING", "EVENING"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "DIA" },

        { id: "tx-day", nombreMenu: "Texas Day", nombreFila: "TEXAS DAY",
          url3: "https://www.lotteryusa.com/texas/midday-pick-3/",
          url4: "https://www.lotteryusa.com/texas/midday-4/",
          sorteosBusqueda: ["DAY", "12:27"], excluir: ["MORNING", "EVENING", "NIGHT"],
          juego3: "Pick 3", juego4: "Daily 4", categoria: "DIA" },

        { id: "ri-am", nombreMenu: "Rhode Island Midday", nombreFila: "RHODE ISLAND MIDDAY",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/midday-numbers/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Numbers", categoria: "DIA", soloPick4: true },

        { id: "il-am", nombreMenu: "Illinois Midday", nombreFila: "ILLINOIS MIDDAY",
          url3: "https://www.lotteryusa.com/illinois/midday-3/",
          url4: "https://www.lotteryusa.com/illinois/midday-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "mo-am", nombreMenu: "Missouri Midday", nombreFila: "MISSOURI MIDDAY",
          url3: "https://www.lotteryusa.com/missouri/midday-pick-3/",
          url4: "https://www.lotteryusa.com/missouri/midday-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ma-am", nombreMenu: "Massachusetts Midday", nombreFila: "MASSACHUSETTS MIDDAY",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/midday-numbers/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Numbers", categoria: "DIA", soloPick4: true },

        { id: "ar-am", nombreMenu: "Arkansas Midday", nombreFila: "ARKANSAS MIDDAY",
          url3: "https://www.lotteryusa.com/arkansas/midday-cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/midday-cash-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "DIA" },

        { id: "va-am", nombreMenu: "Virginia Day", nombreFila: "VIRGINIA DAY",
          url3: "https://www.lotteryusa.com/virginia/midday-3/",
          url4: "https://www.lotteryusa.com/virginia/midday-4/",
          sorteosBusqueda: ["DAY"], excluir: ["NIGHT"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ks-am", nombreMenu: "Kansas Midday", nombreFila: "KANSAS MIDDAY",
          url3: "https://www.lotteryusa.com/kansas/midday-pick-3/",
          url4: null,
          sorteosBusqueda: ["MIDDAY", "MID-DAY", "PICK 3"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "de-am", nombreMenu: "Delaware Day", nombreFila: "DELAWARE AM",
          url3: "https://www.lotteryusa.com/delaware/play-3-midday/",
          url4: "https://www.lotteryusa.com/delaware/play-4-midday/",
          sorteosBusqueda: ["DAY"], excluir: ["NIGHT"],
          juego3: "Play 3", juego4: "Play 4", categoria: "DIA" },

        { id: "ct-am", nombreMenu: "Connecticut Day", nombreFila: "CONNECT AM",
          url3: "https://www.lotteryusa.com/connecticut/midday-3/",
          url4: "https://www.lotteryusa.com/connecticut/midday-4/",
          sorteosBusqueda: ["DAY", "PLAY3 DAY"], excluir: ["NIGHT"],
          juego3: "Play 3", juego4: "Play 4", categoria: "DIA" },

        { id: "dc-am", nombreMenu: "Washington D.C. Midday", nombreFila: "WASHINGTON D.C MIDDAY",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-midday/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-midday/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING", "NIGHT"],
          juego3: "DC-3", juego4: "DC-4", categoria: "DIA" },

        { id: "pr-am", nombreMenu: "Puerto Rico Midday", nombreFila: "PUERTO RICO AM",
          url3: "https://www.lotteryusa.com/puerto-rico/midday-pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/midday-pega-4/",
          sorteosBusqueda: ["MIDDAY", "Pega"], excluir: ["NOCHE", "EVENING"],
          juego3: "Pega 3", juego4: "Pega 4", categoria: "DIA" },

        { id: "wi-am", nombreMenu: "Wisconsin Midday", nombreFila: "WISCONSIN MIDDAY",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "nc-am", nombreMenu: "North Carolina Day", nombreFila: "NORTH CAROLINA AM",
          url3: "https://www.lotteryusa.com/north-carolina/midday-3/",
          url4: "https://www.lotteryusa.com/north-carolina/midday-pick-4/",
          sorteosBusqueda: ["DAYTIME"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "nm-am", nombreMenu: "New Mexico Midday", nombreFila: "NEW MEXICO MIDDAY",
          url3: "https://www.lotteryusa.com/new-mexico/midday-pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/midday-pick-4-plus/",
          sorteosBusqueda: ["DAY", "MIDDAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ms-am", nombreMenu: "Mississippi Midday", nombreFila: "MISSISSIPPI MIDDAY",
          url3: "https://www.lotteryusa.com/mississippi/cash-3-midday/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4-midday/",
          sorteosBusqueda: ["MIDDAY", "MID-DAY"], excluir: ["EVENING"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "DIA" },

        { id: "co-am", nombreMenu: "Colorado Midday", nombreFila: "COLORADO MIDDAY",
          url3: "https://www.lotteryusa.com/colorado/pick-3-midday/",
          url4: null,
          sorteosBusqueda: ["MIDDAY"], excluir: ["EVENING"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "or-am", nombreMenu: "Oregon 1pm", nombreFila: "OREGON 1PM",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-1pm/",
          sorteosBusqueda: ["1pm", "1:00"], excluir: ["4pm", "7pm"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },

        { id: "ca-am", nombreMenu: "California Midday", nombreFila: "CALIFORNIA MIDDAY",
          url3: "https://www.lotteryusa.com/california/midday-3/",
          url4: null,
          sorteosBusqueda: ["MIDDAY"], excluir: ["EVENING"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "DIA", soloPick3: true },

        { id: "id-am", nombreMenu: "Idaho Midday", nombreFila: "IDAHO MIDDAY",
          url3: "https://www.lotteryusa.com/idaho/midday-pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4-day/",
          sorteosBusqueda: ["DAY", "Midday"], excluir: ["NIGHT"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "DIA" },


        // =================================================================
        // ====================== CATEGORÍA: NOCHE =========================
        // =================================================================

        { id: "me-pm", nombreMenu: "Maine Evening", nombreFila: "MAINE EVENING",
          url3: "https://www.lotteryusa.com/maine/pick-3/",
          url4: "https://www.lotteryusa.com/maine/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["DAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "sc-pm", nombreMenu: "South Carolina Evening", nombreFila: "SOUTH C EVENING",
          url3: "https://www.lotteryusa.com/south-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY", "MID-DAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ri-pm", nombreMenu: "Rhode Island Evening", nombreFila: "RHODE ISLAND EVENING",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/numbers/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Numbers", categoria: "NOCHE", soloPick4: true },

        { id: "pa-pm", nombreMenu: "Pennsylvania Evening", nombreFila: "PENNSYLV EVENING",
          url3: "https://www.lotteryusa.com/pennsylvania/pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/pick-4/",
          sorteosBusqueda: ["EVENING", "PICK 3"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ga-pm", nombreMenu: "Georgia Evening", nombreFila: "GEORGIA EVENING",
          url3: "https://www.lotteryusa.com/georgia/cash-3-evening/",
          url4: "https://www.lotteryusa.com/georgia/cash-4-evening/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY", "NIGHT"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "NOCHE" },

        { id: "tx-pm", nombreMenu: "Texas Evening", nombreFila: "TEXAS-EVENING",
          url3: "https://www.lotteryusa.com/texas/evening-pick-3/",
          url4: "https://www.lotteryusa.com/texas/evening-pick-4/",
          sorteosBusqueda: ["EVENING", "6:00"], excluir: ["MORNING", "DAY", "NIGHT"],
          juego3: "Pick 3", juego4: "Daily 4", categoria: "NOCHE" },

        { id: "or-4pm", nombreMenu: "Oregon 4pm", nombreFila: "OREGON 4PM",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-4pm/",
          sorteosBusqueda: ["4pm", "4:00"], excluir: ["1pm", "7pm"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "tn-pm", nombreMenu: "Tennessee Evening", nombreFila: "TENNESSEE EVENING",
          url3: "https://www.lotteryusa.com/tennessee/cash-3/",
          url4: "https://www.lotteryusa.com/tennessee/cash-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MORNING", "MIDDAY"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "NOCHE" },

        { id: "oh-pm", nombreMenu: "Ohio Evening", nombreFila: "OHIO EVENING",
          url3: "https://www.lotteryusa.com/ohio/pick-3/",
          url4: "https://www.lotteryusa.com/ohio/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "mi-pm", nombreMenu: "Michigan Night", nombreFila: "MICHIGAN NIGHT",
          url3: "https://www.lotteryusa.com/michigan/daily-3/",
          url4: "https://www.lotteryusa.com/michigan/daily-4/",
          sorteosBusqueda: ["EVENING", "NIGHT"], excluir: ["MIDDAY"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "NOCHE" },

        { id: "dc-pm", nombreMenu: "Washington D.C. Evening", nombreFila: "WASHINGTON D.C EVENING",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-numbers/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4/",
          sorteosBusqueda: ["EVENING", "7:50"], excluir: ["MIDDAY", "NIGHT"],
          juego3: "DC-3", juego4: "DC-4", categoria: "NOCHE" },

        { id: "md-pm", nombreMenu: "Maryland Evening", nombreFila: "MARYLAND PM",
          url3: "https://www.lotteryusa.com/maryland/pick-3/",
          url4: "https://www.lotteryusa.com/maryland/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "de-pm", nombreMenu: "Delaware PM", nombreFila: "DELAWARE PM",
          url3: "https://www.lotteryusa.com/delaware/play-3/",
          url4: "https://www.lotteryusa.com/delaware/play-4/",
          sorteosBusqueda: ["NIGHT"], excluir: ["DAY"],
          juego3: "Play 3", juego4: "Play 4", categoria: "NOCHE" },

        { id: "ar-pm", nombreMenu: "Arkansas Evening", nombreFila: "ARKANSAS EVENING",
          url3: "https://www.lotteryusa.com/arkansas/cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/cash-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "NOCHE" },

        { id: "pr-pm", nombreMenu: "Puerto Rico Noche", nombreFila: "PUERTO RICO PM ",
          url3: "https://www.lotteryusa.com/puerto-rico/pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/pega-4/",
          sorteosBusqueda: ["NOCHE", "Pega"], excluir: ["DIA", "Midday"],
          juego3: "Pega 3", juego4: "Pega 4", categoria: "NOCHE" },

        { id: "ma-pm", nombreMenu: "Massachusetts Evening", nombreFila: "MASSACHUSETTS EVENING",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/numbers/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Numbers", categoria: "NOCHE", soloPick4: true },

        { id: "az-pm", nombreMenu: "Arizona Pick 3", nombreFila: "ARIZONA",
          url3: "https://www.lotteryusa.com/arizona/pick-3/",
          url4: null,
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "co-pm", nombreMenu: "Colorado Evening", nombreFila: "COLORADO EVENING",
          url3: "https://www.lotteryusa.com/colorado/pick-3/",
          url4: null,
          sorteosBusqueda: ["EVENING", "Pick 3"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE", soloPick3: true },

        { id: "ca-pm", nombreMenu: "California Evening", nombreFila: "CALIFORNIA EVENING",
          url3: "https://www.lotteryusa.com/california/daily-3/",
          url4: "https://www.lotteryusa.com/california/daily-4/",
          sorteosBusqueda: ["EVENING", "Daily 4"], excluir: ["MIDDAY"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "NOCHE" },

        { id: "mo-pm", nombreMenu: "Missouri Evening", nombreFila: "MISSOURI EVENING",
          url3: "https://www.lotteryusa.com/missouri/pick-3/",
          url4: "https://www.lotteryusa.com/missouri/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "id-pm", nombreMenu: "Idaho Night", nombreFila: "IDAHO NIGHT",
          url3: "https://www.lotteryusa.com/idaho/pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4/",
          sorteosBusqueda: ["NIGHT"], excluir: ["DAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "wi-pm", nombreMenu: "Wisconsin Evening", nombreFila: "WISCONSIN EVENING",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3-evening/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4-evening/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "or-7pm", nombreMenu: "Oregon 7pm", nombreFila: "OREGON 7PM",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-7pm/",
          sorteosBusqueda: ["7pm", "7:00"], excluir: ["1pm", "4pm"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ks-pm", nombreMenu: "Kansas Evening", nombreFila: "KANSAS EVENING",
          url3: "https://www.lotteryusa.com/kansas/pick-3/",
          url4: null,
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "il-pm", nombreMenu: "Illinois Evening", nombreFila: "ILLINOIS EVENING",
          url3: "https://www.lotteryusa.com/illinois/daily-3/",
          url4: "https://www.lotteryusa.com/illinois/daily-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ct-pm", nombreMenu: "Connecticut Night", nombreFila: "CONNECT PM",
          url3: "https://www.lotteryusa.com/connecticut/play-3/",
          url4: "https://www.lotteryusa.com/connecticut/play-4/",
          sorteosBusqueda: ["NIGHT", "PLAY3 NIGHT"], excluir: ["DAY"],
          juego3: "Play 3", juego4: "Play 4", categoria: "NOCHE" },

        { id: "ms-pm", nombreMenu: "Mississippi Evening", nombreFila: "MISSISSIPPI EVENING",
          url3: "https://www.lotteryusa.com/mississippi/cash-3/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "NOCHE" },

        { id: "nj-pm", nombreMenu: "New Jersey Evening", nombreFila: "NEW JERSEY PM",
          url3: "https://www.lotteryusa.com/new-jersey/pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "la-pm", nombreMenu: "Louisiana Evening", nombreFila: "LOUISIANA EVENING",
          url3: "https://www.lotteryusa.com/louisiana/pick-3/",
          url4: "https://www.lotteryusa.com/louisiana/pick-4/",
          sorteosBusqueda: ["Pick 3", "Pick 4"], excluir: ["Draw"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "va-night", nombreMenu: "Virginia Night", nombreFila: "VIRGINIA NIGHT",
          url3: "https://www.lotteryusa.com/virginia/pick-3/",
          url4: "https://www.lotteryusa.com/virginia/pick-4/",
          sorteosBusqueda: ["NIGHT"], excluir: ["DAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ky-pm", nombreMenu: "Kentucky Evening", nombreFila: "KENTUCKY EVENING",
          url3: "https://www.lotteryusa.com/kentucky/pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "ia-pm", nombreMenu: "Iowa Evening", nombreFila: "IOWA EVENING",
          url3: "https://www.lotteryusa.com/iowa/pick-3/",
          url4: "https://www.lotteryusa.com/iowa/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "in-pm", nombreMenu: "Indiana Evening", nombreFila: "INDIANA EVENING",
          url3: "https://www.lotteryusa.com/indiana/daily-3/",
          url4: "https://www.lotteryusa.com/indiana/daily-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Daily 3", juego4: "Daily 4", categoria: "NOCHE" },

        { id: "tx-night", nombreMenu: "Texas Night", nombreFila: "TEXAS NIGHT",
          url3: "https://www.lotteryusa.com/texas/pick-3/",
          url4: "https://www.lotteryusa.com/texas/daily-4/",
          sorteosBusqueda: ["NIGHT", "10:12"], excluir: ["MORNING", "DAY", "EVENING"],
          juego3: "Pick 3", juego4: "Daily 4", categoria: "NOCHE" },

        { id: "nc-pm", nombreMenu: "North Carolina Evening", nombreFila: "NORTH CAROLINA PM",
          url3: "https://www.lotteryusa.com/north-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/north-carolina/pick-4/",
          sorteosBusqueda: ["EVENING"], excluir: ["DAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "nm-pm", nombreMenu: "New Mexico Evening", nombreFila: "NEW MEXICO EVENING",
          url3: "https://www.lotteryusa.com/new-mexico/pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/pick-4-plus/",
          sorteosBusqueda: ["EVENING"], excluir: ["MIDDAY"],
          juego3: "Pick 3", juego4: "Pick 4", categoria: "NOCHE" },

        { id: "dc-night", nombreMenu: "Washington D.C. Night", nombreFila: "WASHINGTON D.C NIGHT",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-3-night/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-night/",
          sorteosBusqueda: ["NIGHT", "11:30"], excluir: ["MIDDAY", "EVENING"],
          juego3: "DC-3", juego4: "DC-4", categoria: "NOCHE" },

        { id: "ga-night", nombreMenu: "Georgia Night", nombreFila: "GEORGIA NIGHT",
          url3: "https://www.lotteryusa.com/georgia/cash-3/",
          url4: "https://www.lotteryusa.com/georgia/cash-4/",
          sorteosBusqueda: ["NIGHT"], excluir: ["EVENING", "MIDDAY"],
          juego3: "Cash 3", juego4: "Cash 4", categoria: "NOCHE" }
    ];

    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // === TABLER ICONS (CDN, webfont minimalista outline) ===
    function loadTablerIcons() {
        if (document.getElementById('gm-tabler-link')) return;
        const link = document.createElement('link');
        link.id = 'gm-tabler-link';
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css';
        document.head.appendChild(link);
    }

    // === CSS (rediseño minimalista, plano) ===
    const style = document.createElement('style');
    style.textContent = `
        .gm-bar {
            position: fixed; bottom: 0; left: 0; width: 100%; height: 165px;
            background: #ffffff;
            border-top: 1px solid #e2e8f0;
            box-shadow: 0 -2px 8px rgba(15, 23, 42, 0.06);
            z-index: 2147483647; display: flex; flex-direction: row;
            font-family: 'Segoe UI', Roboto, sans-serif;
            transform: translateY(100%); transition: transform 0.3s ease;
        }
        .gm-bar.visible { transform: translateY(0); }
        .gm-bar.mode-day .gm-tab-btn.active { color: #2563eb; border-color: #2563eb; }
        .gm-bar.mode-night .gm-tab-btn.active { color: #b45309; border-color: #b45309; }

        .gm-left-panel {
            width: 230px; background: #fafafa; border-right: 1px solid #ececec;
            display: flex; flex-direction: column; padding: 12px; flex-shrink: 0;
        }

        .gm-tabs { display: flex; gap: 6px; margin-bottom: 10px; }
        .gm-tab-btn {
            flex: 1; background: transparent; border: 1px solid #e2e8f0; padding: 6px 4px; font-size: 13px;
            font-weight: 500; color: #64748b; border-radius: 6px; cursor: pointer;
            display: flex; align-items: center; justify-content: center; gap: 6px;
            transition: border-color 0.15s, color 0.15s;
        }
        .gm-tab-btn i { font-size: 15px; }

        .gm-search-wrap { position: relative; }
        .gm-search-wrap i {
            position: absolute; left: 9px; top: 50%; transform: translateY(-50%);
            color: #9ca3af; font-size: 14px; pointer-events: none;
        }
        .gm-search-input {
            width: 100%; padding: 8px 10px 8px 28px; border: 1px solid #e2e8f0; border-radius: 6px;
            box-sizing: border-box; font-size: 13px; background: white; transition: border-color 0.15s;
        }
        .gm-search-input:focus { outline: none; border-color: #94a3b8; }

        .gm-grid-horizontal {
            flex-grow: 1; display: grid; grid-template-rows: repeat(2, 1fr);
            grid-auto-flow: column; grid-auto-columns: 188px; gap: 8px;
            padding: 16px 16px 12px 16px; overflow-x: auto; overflow-y: hidden;
        }

        .gm-loto-btn {
            background: white; border: 1px solid #e5e7eb; border-radius: 8px;
            padding: 0 10px; height: 40px; min-width: 176px;
            display: none; align-items: center; gap: 9px;
            font-size: 13px; color: #374151; cursor: pointer;
            transition: border-color 0.15s, background 0.15s;
        }
        .gm-loto-btn.visible-cat { display: flex; }
        .gm-loto-btn:hover { border-color: #94a3b8; background: #fafafa; }

        .gm-loto-icon { font-size: 16px; color: #6b7280; flex-shrink: 0; display: flex; }

        .gm-loto-name { flex-grow: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

        .gm-status-icon { font-size: 15px; min-width: 16px; text-align: center; flex-shrink: 0; display: flex; }
        .gm-status-icon i { display: block; }
        @keyframes gm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .gm-status-icon i.ti-loader-2 { animation: gm-spin 0.8s linear infinite; }

        .gm-toggle-btn {
            position: fixed; bottom: 22px; right: 22px; width: 44px; height: 44px;
            background: white; color: #374151; border-radius: 50%;
            border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(15,23,42,0.10); font-size: 18px; cursor: pointer;
            z-index: 2147483647; transition: transform 0.3s; display: flex; align-items: center; justify-content: center;
        }
        .gm-toggle-btn.open { transform: translateY(-145px) rotate(90deg); color: #dc2626; border-color: #fecaca; }
    `;

    // === ICONOS POR ESTADO (Tabler, heurística simple sobre el id) ===
    function iconClassFor(loto) {
        const id = loto.id;
        if (id.startsWith('pr-')) return 'ti ti-flag';
        if (id.startsWith('dc-')) return 'ti ti-building-bank';
        if (id.includes('az-')) return 'ti ti-sun';
        return 'ti ti-dice-3';
    }

    // === INICIO SEGURO ===
    function init() {
        if (document.getElementById('gm-bar')) return;
        if (!document.body) { setTimeout(init, 500); return; }
        try { loadTablerIcons(); createInterface(); } catch (e) { console.error(e); }
    }

    function createInterface() {
        document.head.appendChild(style);
        const bar = document.createElement('div'); bar.id = 'gm-bar'; bar.className = 'gm-bar mode-day';
        const leftPanel = document.createElement('div'); leftPanel.className = 'gm-left-panel';

        const tabs = document.createElement('div'); tabs.className = 'gm-tabs';
        const tabDia = document.createElement('button'); tabDia.className = 'gm-tab-btn active';
        tabDia.innerHTML = '<i class="ti ti-sun"></i> Día';
        const tabNoche = document.createElement('button'); tabNoche.className = 'gm-tab-btn';
        tabNoche.innerHTML = '<i class="ti ti-moon"></i> Noche';
        tabs.appendChild(tabDia); tabs.appendChild(tabNoche); leftPanel.appendChild(tabs);

        const searchWrap = document.createElement('div'); searchWrap.className = 'gm-search-wrap';
        const searchIcon = document.createElement('i'); searchIcon.className = 'ti ti-search';
        const searchInput = document.createElement('input'); searchInput.className = 'gm-search-input'; searchInput.placeholder = 'Filtrar...';
        searchWrap.appendChild(searchIcon); searchWrap.appendChild(searchInput);
        leftPanel.appendChild(searchWrap);

        bar.appendChild(leftPanel);
        const grid = document.createElement('div'); grid.className = 'gm-grid-horizontal';

        LOTERIAS.forEach(loto => {
            const btn = document.createElement('button'); btn.className = `gm-loto-btn cat-${loto.categoria}`;
            if (loto.categoria === 'DIA') btn.classList.add('visible-cat');

            const iconWrap = document.createElement('span'); iconWrap.className = 'gm-loto-icon';
            iconWrap.innerHTML = `<i class="${iconClassFor(loto)}"></i>`;

            const spanName = document.createElement('span'); spanName.className = 'gm-loto-name';
            spanName.innerText = loto.nombreMenu;

            const spanStatus = document.createElement('span'); spanStatus.className = 'gm-status-icon';

            btn.appendChild(iconWrap); btn.appendChild(spanName); btn.appendChild(spanStatus);
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

        const toggleBtn = document.createElement('button'); toggleBtn.className = 'gm-toggle-btn';
        toggleBtn.innerHTML = '<i class="ti ti-star"></i>';
        toggleBtn.onclick = () => { const isOpen = bar.classList.toggle('visible'); toggleBtn.classList.toggle('open'); if (isOpen) setTimeout(() => searchInput.focus(), 200); };
        document.body.appendChild(toggleBtn);
    }

    function getDateObj() {
        const dateInput = document.querySelector('input[name="date"]') || document.querySelector('input[type="text"]');
        let dateObj = new Date();
        if (dateInput && dateInput.value) {
            const parts = dateInput.value.split('/');
            if (parts.length === 3) dateObj = new Date(parts[2], parts[0] - 1, parts[1]);
        }
        // Normalizar a medianoche para comparaciones estrictas de fecha
        dateObj.setHours(0, 0, 0, 0);
        return dateObj;
    }

    function setStatusIcon(span, type) {
        if (type === 'loading') {
            span.innerHTML = '<i class="ti ti-loader-2"></i>'; span.style.color = '#2563eb';
        } else if (type === 'ok') {
            span.innerHTML = '<i class="ti ti-circle-check"></i>'; span.style.color = '#16a34a';
        } else if (type === 'warn') {
            span.innerHTML = '<i class="ti ti-alert-triangle"></i>'; span.style.color = '#d97706';
        } else if (type === 'none') {
            span.innerHTML = '<i class="ti ti-circle"></i>'; span.style.color = '#9ca3af';
        } else if (type === 'error') {
            span.innerHTML = '<i class="ti ti-x"></i>'; span.style.color = '#dc2626';
        }
    }

    function executeScrape(lotoConfig, statusSpan) {
        setStatusIcon(statusSpan, 'loading');

        const dateObj = getDateObj();

        const urlsToFetch = [];
        if (lotoConfig.url3) urlsToFetch.push({ type: 'P3', url: lotoConfig.url3 });
        if (lotoConfig.url4) urlsToFetch.push({ type: 'P4', url: lotoConfig.url4 });

        const promises = urlsToFetch.map(item =>
            fetchWithGM(item.url).then(html => ({ type: item.type, html, source: 'DIRECT' }))
        );

        Promise.all(promises).then(results => {
            let p3 = null; let p4 = null;
            let source = "Ninguno";

            // ANALISIS DIRECTO
            results.forEach(res => {
                const parsed = parseLotteryUSA(res.html, dateObj, lotoConfig, true, res.type);
                if (res.type === 'P3' && parsed.p3) p3 = parsed.p3;
                if (res.type === 'P4' && parsed.p4) p4 = parsed.p4;
            });

            if (p3 || p4) source = "📂 HISTORIAL (Link Directo)";

            // PLAN B (Rescate)
            if ((lotoConfig.url3 && !p3) || (lotoConfig.url4 && !p4)) {
                const mainUrl = deriveMainUrl(lotoConfig.url3 || lotoConfig.url4);
                if (mainUrl) {
                    fetchWithGM(mainUrl).then(htmlMain => {
                        const parsedMain = parseLotteryUSA(htmlMain, dateObj, lotoConfig, false, null);
                        if (!p3 && parsedMain.p3) p3 = parsedMain.p3;
                        if (!p4 && parsedMain.p4) p4 = parsedMain.p4;
                        if (!source.includes("HISTORIAL") && (p3 || p4)) source = "🌍 PORTADA PRINCIPAL (Plan B)";
                        finalize(p3, p4, source);
                    }).catch(() => finalize(p3, p4, source));
                } else {
                    finalize(p3, p4, source);
                }
            } else {
                finalize(p3, p4, source);
            }

            function finalize(finalP3, finalP4, finalSource) {
                const now = new Date();
                const hora = now.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                const fecha = dateObj.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });

                let estado;
                if (finalP3 || finalP4) {
                    const filled = fillTable(finalP3, finalP4, lotoConfig.nombreFila);
                    if (filled) { setStatusIcon(statusSpan, 'ok'); estado = '✅ Llenado'; }
                    else        { setStatusIcon(statusSpan, 'warn'); estado = '⚠️ No encontró fila'; }
                } else {
                    setStatusIcon(statusSpan, 'none'); estado = '⛔ Sin resultado';
                }

                console.table({
                    'Lotería':    { valor: lotoConfig.nombreMenu },
                    'Fuente':     { valor: finalSource },
                    'Hora':       { valor: hora },
                    'Fecha':      { valor: fecha },
                    'Pick 3':     { valor: finalP3 ?? '—' },
                    'Pick 4':     { valor: finalP4 ?? '—' },
                    'Estado':     { valor: estado }
                });
            }

        }).catch(err => {
            setStatusIcon(statusSpan, 'error');
            console.error(err);
        });
    }

    function deriveMainUrl(specificUrl) {
        if (!specificUrl) return null;
        try {
            const parts = specificUrl.split('/');
            if (parts.length >= 5) return parts.slice(0, 4).join('/') + '/';
        } catch(e) { return null; }
        return null;
    }

    // === FETCH CON ANTI-CACHÉ ===
    function fetchWithGM(url) {
        return new Promise((resolve, reject) => {
            const cacheBuster = "?_=" + Date.now();
            const finalUrl = url.includes('?') ? url + "&_=" + Date.now() : url + cacheBuster;
            GM_xmlhttpRequest({
                method: "GET",
                url: finalUrl,
                headers: {
                    "Cache-Control": "no-cache, no-store, must-revalidate",
                    "Pragma": "no-cache"
                },
                onload: (res) => {
                    if (res.status === 200) resolve(res.responseText);
                    else reject("Error " + res.status);
                },
                onerror: reject
            });
        });
    }

    function cleanStr(str) { return str ? str.toUpperCase().replace(/\s+/g, '') : ""; }
    function superClean(str) { return str ? str.toUpperCase().replace(/[^A-Z0-9]/g, '') : ""; }

    // === VALIDACIÓN ESTRICTA DE FECHA ===
    // Verifica que el texto de la fila corresponde exactamente al día, mes y año solicitados.
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

    // === PARSER INTELIGENTE ===
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

            const titleNode = row.querySelector('.c-game-result-card__title, .game-header-title');
            const rowTitle = titleNode ? cleanStr(titleNode.innerText) : cleanStr(row.innerText);

            // FILTROS
            if (!isDirect) {
                if (config.excluir && config.excluir.some(bad => rowTitle.includes(cleanStr(bad)))) continue;
                const matchSorteo = config.sorteosBusqueda.some(k => rowTitle.includes(cleanStr(k)));
                if (!matchSorteo) continue;
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
            if (targetType === 'P3') {
                if (nums.length === 4) nums = nums.slice(0, 3);
                if (nums.length === 3) foundP3 = nums.join('');
            } else if (targetType === 'P4') {
                if (nums.length === 5) nums = nums.slice(0, 4);
                if (nums.length === 4) foundP4 = nums.join('');
            } else {
                // PLAN B (Contexto General)
                const isExplicitP4 = rowTitle.includes("PICK4") || rowTitle.includes("CASH4") || rowTitle.includes("DAILY4") || rowTitle.includes("DC4") || (config.juego4 && rowTitle.includes(cleanStr(config.juego4)));
                if (isExplicitP4) {
                    if (nums.length === 5) nums = nums.slice(0, 4);
                    if (nums.length === 4) foundP4 = nums.join('');
                } else {
                    if (!config.soloPick4) {
                        if (nums.length === 4) nums = nums.slice(0, 3);
                        if (nums.length === 3) foundP3 = nums.join('');
                    }
                    if (config.soloPick4 && nums.length === 4) foundP4 = nums.join('');
                }
            }

            if (foundP3 || foundP4) break;
        }

        return { p3: foundP3, p4: foundP4 };
    }

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