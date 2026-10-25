// ==UserScript==
// @name         Rovs Loterias USA React 0.0.1
// @namespace    https://github.com/Nox1do/rover-lottery/Loterias-USA-React
// @version      0.0.4
// @description  Barra manual de loterías USA para la tabla React de Rover. Solo llenado de formulario.
// @author       noeg
// @match        https://central.roversport.net/*
// @run-at       document-end
// @grant        GM_xmlhttpRequest
// @grant        GM_info
// @connect      lotteryusa.com
// @connect      mobile-fla.lotteryservices.com
// @connect      lalotmobapi.intralot.us
// @connect      api-solutions.ohiolottery.com
// @connect      authapi-solutions.ohiolottery.com
// @connect      tna.p1.awc.lotteryservices.net
// @connect      ins.p1.awc.lotteryservices.net
// @connect      gas-v2.p1.awc.lotteryservices.net
// @connect      mapp.illinoislottery.com
// @updateURL    https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/Rovs-Loterias-USA-React.meta.js
// @downloadURL  https://raw.githubusercontent.com/Nox1do/rover-lottery/main/Loterias%20USA%20React/Rovs-Loterias-USA-React.user.js
// @homepageURL  https://github.com/Nox1do/rover-lottery/tree/main/Loterias%20USA%20React
// @supportURL   https://github.com/Nox1do/rover-lottery/issues
// @noframes
// ==/UserScript==

(function () {
'use strict';
const APP_VERSION = "0.0.4";

// --- src/config.js ---
    const LOTERIAS = [
        // =================================================================
        // ======================= CATEGORÍA: DÍA ==========================
        // =================================================================

        { id: "tn-morning", codigo: "TN-MORNING", nombreMenu: "🇺🇸 Tennessee Morning", nombreFila: "TENNESSEE MORNING",
          fuente: "TENNESSEE_API", sorteo: "MORNING",
          categoria: "DIA" },

        { id: "tx-morning", codigo: "TX-MORNING", nombreMenu: "🇺🇸 Texas Morning", nombreFila: "TEXAS MORNING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/morning-pick-3/",
          url4: "https://www.lotteryusa.com/texas/morning-pick-4/",
          categoria: "DIA" },

        { id: "md-am", codigo: "MD-AM", nombreMenu: "🇺🇸 Maryland Midday", nombreFila: "MARYLAND AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maryland/midday-pick-3/",
          url4: "https://www.lotteryusa.com/maryland/midday-pick-4/",
          categoria: "DIA" },

        { id: "ga-am", codigo: "GE-MD", nombreMenu: "🇺🇸 Georgia Midday", nombreFila: "GEORGIA MIDDAY",
          fuente: "GEORGIA_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "oh-am", codigo: "OHIO-MD", nombreMenu: "🇺🇸 Ohio Midday", nombreFila: "OHIO MIDDAY",
          fuente: "OHIO_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "nj-am", codigo: "NJ-AM", nombreMenu: "🇺🇸 New Jersey Midday", nombreFila: "NEW JERSEY AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-jersey/midday-pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/midday-pick-4/",
          categoria: "DIA" },

        { id: "sc-am", codigo: "SC-MIDDAY", nombreMenu: "🇺🇸 South Carolina Midday", nombreFila: "SOUTH C MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/south-carolina/midday-pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/midday-pick-4/",
          categoria: "DIA" },

        { id: "mi-am", codigo: "MICH-DAY", nombreMenu: "🇺🇸 Michigan Midday", nombreFila: "MICHIGAN DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/michigan/midday-3/",
          url4: "https://www.lotteryusa.com/michigan/midday-4/",
          categoria: "DIA" },

        { id: "me-am", codigo: "ME-DAY", nombreMenu: "🇺🇸 Maine Day", nombreFila: "MAINE DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maine/midday-3/",
          url4: "https://www.lotteryusa.com/maine/midday-4/",
          categoria: "DIA" },

        { id: "ky-am", codigo: "KNT-MD", nombreMenu: "🇺🇸 Kentucky Midday", nombreFila: "KENTUCKY MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kentucky/midday-pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/midday-pick-4/",
          categoria: "DIA" },

        { id: "in-am", codigo: "IN-MD", nombreMenu: "🇺🇸 Indiana Midday", nombreFila: "INDIANA MIDDAY",
          fuente: "INDIANA_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "ia-am", codigo: "IOWA-MD", nombreMenu: "🇺🇸 Iowa Midday", nombreFila: "IOWA MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/iowa/midday-3/",
          url4: "https://www.lotteryusa.com/iowa/midday-4/",
          categoria: "DIA" },

        { id: "pa-am", codigo: "PA-AM", nombreMenu: "🇺🇸 Pennsylvania Midday", nombreFila: "PENNSYLV AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/pennsylvania/midday-pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/midday-pick-4/",
          categoria: "DIA" },

        { id: "tn-midday", codigo: "TN-MD", nombreMenu: "🇺🇸 Tennessee Midday", nombreFila: "TENNESSEE MIDDAY",
          fuente: "TENNESSEE_API", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "tx-day", codigo: "TX-DAY", nombreMenu: "🇺🇸 Texas Day", nombreFila: "TEXAS DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/midday-pick-3/",
          url4: "https://www.lotteryusa.com/texas/midday-4/",
          categoria: "DIA" },

        { id: "ri-am", codigo: "RHOD-MD", nombreMenu: "🇺🇸 Rhode Island Midday", nombreFila: "RHODE ISLAND MIDDAY",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/midday-numbers/",
          categoria: "DIA" },

        { id: "il-am", codigo: "ILLINOIS-MD", nombreMenu: "🇺🇸 Illinois Midday", nombreFila: "ILLINOIS MIDDAY",
          fuente: "ILLINOIS_APP", sorteo: "MIDDAY",
          categoria: "DIA" },

        { id: "mo-am", codigo: "MO-MD", nombreMenu: "🇺🇸 Missouri Midday", nombreFila: "MISSOURI MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/missouri/midday-pick-3/",
          url4: "https://www.lotteryusa.com/missouri/midday-pick-4/",
          categoria: "DIA" },

        { id: "ma-am", codigo: "MA-MD", nombreMenu: "🇺🇸 Massachusetts Midday", nombreFila: "MASSACHUSETTS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/midday-numbers/",
          categoria: "DIA" },

        { id: "ar-am", codigo: "AR-MD", nombreMenu: "🇺🇸 Arkansas Midday", nombreFila: "ARKANSAS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arkansas/midday-cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/midday-cash-4/",
          categoria: "DIA" },

        { id: "va-am", codigo: "VIRG-DAY", nombreMenu: "🇺🇸 Virginia Day", nombreFila: "VIRGINIA DAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/virginia/midday-3/",
          url4: "https://www.lotteryusa.com/virginia/midday-4/",
          categoria: "DIA" },

        { id: "ks-am", codigo: "KS-MD", nombreMenu: "🇺🇸 Kansas Midday", nombreFila: "KANSAS MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kansas/midday-pick-3/",
          url4: null,
          categoria: "DIA" },

        { id: "de-am", codigo: "DE-AM", nombreMenu: "🇺🇸 Delaware Day", nombreFila: "DELAWARE AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/delaware/play-3-midday/",
          url4: "https://www.lotteryusa.com/delaware/play-4-midday/",
          categoria: "DIA" },

        { id: "ct-am", codigo: "CT-AM", nombreMenu: "🇺🇸 Connecticut Day", nombreFila: "CONNECT AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/connecticut/midday-3/",
          url4: "https://www.lotteryusa.com/connecticut/midday-4/",
          categoria: "DIA" },

        { id: "dc-am", codigo: "DC-MD", nombreMenu: "🇺🇸 Washington D.C. Midday", nombreFila: "WASHINGTON D.C MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-midday/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-midday/",
          categoria: "DIA" },

        { id: "pr-am", codigo: "PR-AM", nombreMenu: "🇺🇸 Puerto Rico Midday", nombreFila: "PUERTO RICO AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/puerto-rico/midday-pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/midday-pega-4/",
          categoria: "DIA" },

        { id: "wi-am", codigo: "WISC-MD", nombreMenu: "🇺🇸 Wisconsin Midday", nombreFila: "WISCONSIN MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4/",
          categoria: "DIA" },

        { id: "nc-am", codigo: "NC-AM", nombreMenu: "🇺🇸 North Carolina Day", nombreFila: "NORTH CAROLINA AM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/north-carolina/midday-3/",
          url4: "https://www.lotteryusa.com/north-carolina/midday-pick-4/",
          categoria: "DIA" },

        { id: "nm-am", codigo: "NM-MD", nombreMenu: "🇺🇸 New Mexico Midday", nombreFila: "NEW MEXICO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-mexico/midday-pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/midday-pick-4-plus/",
          categoria: "DIA" },

        { id: "ms-am", codigo: "MISS-MD", nombreMenu: "🇺🇸 Mississippi Midday", nombreFila: "MISSISSIPPI MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/mississippi/cash-3-midday/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4-midday/",
          categoria: "DIA" },

        { id: "co-am", codigo: "CO-MD", nombreMenu: "🇺🇸 Colorado Midday", nombreFila: "COLORADO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/colorado/pick-3-midday/",
          url4: null,
          categoria: "DIA" },

        { id: "or-am", codigo: "OR-1PM", nombreMenu: "🇺🇸 Oregon 1pm", nombreFila: "OREGON 1PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-1pm/",
          categoria: "DIA" },

        { id: "ca-am", codigo: "CA-MD", nombreMenu: "🇺🇸 California Midday", nombreFila: "CALIFORNIA MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/california/midday-3/",
          url4: null,
          categoria: "DIA" },

        { id: "id-am", codigo: "IDH-MD", nombreMenu: "🇺🇸 Idaho Midday", nombreFila: "IDAHO MIDDAY",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/idaho/midday-pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4-day/",
          categoria: "DIA" },

        { id: "fl-am", codigo: "FL-AM", nombreMenu: "🇺🇸 Florida Midday", nombreFila: "FLORIDA AM",
          fuente: "FLORIDA_API", sorteo: "MIDDAY",
          categoria: "DIA" },


        // =================================================================
        // ====================== CATEGORÍA: NOCHE =========================
        // =================================================================

        { id: "me-pm", codigo: "ME-EVEN", nombreMenu: "🇺🇸 Maine Evening", nombreFila: "MAINE EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maine/pick-3/",
          url4: "https://www.lotteryusa.com/maine/pick-4/",
          categoria: "NOCHE" },

        { id: "sc-pm", codigo: "SC-EVENING", nombreMenu: "🇺🇸 South Carolina Evening", nombreFila: "SOUTH C EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/south-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/south-carolina/pick-4/",
          categoria: "NOCHE" },

        { id: "ri-pm", codigo: "RHOD-EVEN", nombreMenu: "🇺🇸 Rhode Island Evening", nombreFila: "RHODE ISLAND EVENING",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/rhode-island/numbers/",
          categoria: "NOCHE" },

        { id: "pa-pm", codigo: "PA-PM", nombreMenu: "🇺🇸 Pennsylvania Evening", nombreFila: "PENNSYLV EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/pennsylvania/pick-3/",
          url4: "https://www.lotteryusa.com/pennsylvania/pick-4/",
          categoria: "NOCHE" },

        { id: "ga-pm", codigo: "GE-EV", nombreMenu: "🇺🇸 Georgia Evening", nombreFila: "GEORGIA EVENING",
          fuente: "GEORGIA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "tx-pm", codigo: "TX-EVEN", nombreMenu: "🇺🇸 Texas Evening", nombreFila: "TEXAS-EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/evening-pick-3/",
          url4: "https://www.lotteryusa.com/texas/evening-pick-4/",
          categoria: "NOCHE" },

        { id: "or-4pm", codigo: "OR-4PM", nombreMenu: "🇺🇸 Oregon 4pm", nombreFila: "OREGON 4PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-4pm/",
          categoria: "NOCHE" },

        { id: "tn-pm", codigo: "TN-EVEN", nombreMenu: "🇺🇸 Tennessee Evening", nombreFila: "TENNESSEE EVENING",
          fuente: "TENNESSEE_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "oh-pm", codigo: "OHIO-EVEN", nombreMenu: "🇺🇸 Ohio Evening", nombreFila: "OHIO EVENING",
          fuente: "OHIO_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "mi-pm", codigo: "MICH-NIGHT", nombreMenu: "🇺🇸 Michigan Night", nombreFila: "MICHIGAN NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/michigan/daily-3/",
          url4: "https://www.lotteryusa.com/michigan/daily-4/",
          categoria: "NOCHE" },

        { id: "dc-pm", codigo: "DC-EVEN", nombreMenu: "🇺🇸 Washington D.C. Evening", nombreFila: "WASHINGTON D.C EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-lucky-numbers/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4/",
          categoria: "NOCHE" },

        { id: "md-pm", codigo: "MD-PM", nombreMenu: "🇺🇸 Maryland Evening", nombreFila: "MARYLAND PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/maryland/pick-3/",
          url4: "https://www.lotteryusa.com/maryland/pick-4/",
          categoria: "NOCHE" },

        { id: "de-pm", codigo: "DE-PM", nombreMenu: "🇺🇸 Delaware PM", nombreFila: "DELAWARE PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/delaware/play-3/",
          url4: "https://www.lotteryusa.com/delaware/play-4/",
          categoria: "NOCHE" },

        { id: "ar-pm", codigo: "AR-EVEN", nombreMenu: "🇺🇸 Arkansas Evening", nombreFila: "ARKANSAS EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arkansas/cash-3/",
          url4: "https://www.lotteryusa.com/arkansas/cash-4/",
          categoria: "NOCHE" },

        { id: "pr-pm", codigo: "PR-PM", nombreMenu: "🇺🇸 Puerto Rico Noche", nombreFila: "PUERTO RICO PM ",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/puerto-rico/pega-3/",
          url4: "https://www.lotteryusa.com/puerto-rico/pega-4/",
          categoria: "NOCHE" },

        { id: "ma-pm", codigo: "MA-EVEN", nombreMenu: "🇺🇸 Massachusetts Evening", nombreFila: "MASSACHUSETTS EVENING",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/massachusetts/numbers/",
          categoria: "NOCHE" },

        { id: "az-pm", codigo: "AZ", nombreMenu: "🇺🇸 Arizona Pick 3", nombreFila: "ARIZONA",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/arizona/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "co-pm", codigo: "CO-EVE", nombreMenu: "🇺🇸 Colorado Evening", nombreFila: "COLORADO EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/colorado/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "ca-pm", codigo: "CA-EVEN", nombreMenu: "🇺🇸 California Evening", nombreFila: "CALIFORNIA EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/california/daily-3/",
          url4: "https://www.lotteryusa.com/california/daily-4/",
          categoria: "NOCHE" },

        { id: "mo-pm", codigo: "MO-EVEN", nombreMenu: "🇺🇸 Missouri Evening", nombreFila: "MISSOURI EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/missouri/pick-3/",
          url4: "https://www.lotteryusa.com/missouri/pick-4/",
          categoria: "NOCHE" },

        { id: "id-pm", codigo: "IDH-NG", nombreMenu: "🇺🇸 Idaho Night", nombreFila: "IDAHO NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/idaho/pick-3/",
          url4: "https://www.lotteryusa.com/idaho/pick-4/",
          categoria: "NOCHE" },

        { id: "wi-pm", codigo: "WISC-EVEN", nombreMenu: "🇺🇸 Wisconsin Evening", nombreFila: "WISCONSIN EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/wisconsin/daily-pick-3-evening/",
          url4: "https://www.lotteryusa.com/wisconsin/daily-pick-4-evening/",
          categoria: "NOCHE" },

        { id: "or-7pm", codigo: "OR-7PM", nombreMenu: "🇺🇸 Oregon 7pm", nombreFila: "OREGON 7PM",
          fuente: "LOTTERYUSA",
          url3: null,
          url4: "https://www.lotteryusa.com/oregon/pick-4-7pm/",
          categoria: "NOCHE" },

        { id: "ks-pm", codigo: "KS-EVEN", nombreMenu: "🇺🇸 Kansas Evening", nombreFila: "KANSAS EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kansas/pick-3/",
          url4: null,
          categoria: "NOCHE" },

        { id: "il-pm", codigo: "ILLINOIS-EVEN", nombreMenu: "🇺🇸 Illinois Evening", nombreFila: "ILLINOIS EVENING",
          fuente: "ILLINOIS_APP", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "ct-pm", codigo: "CT-PM", nombreMenu: "🇺🇸 Connecticut Night", nombreFila: "CONNECT PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/connecticut/play-3/",
          url4: "https://www.lotteryusa.com/connecticut/play-4/",
          categoria: "NOCHE" },

        { id: "ms-pm", codigo: "MISS-EVEN", nombreMenu: "🇺🇸 Mississippi Evening", nombreFila: "MISSISSIPPI EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/mississippi/cash-3/",
          url4: "https://www.lotteryusa.com/mississippi/cash-4/",
          categoria: "NOCHE" },

        { id: "nj-pm", codigo: "NJ-PM", nombreMenu: "🇺🇸 New Jersey Evening", nombreFila: "NEW JERSEY PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-jersey/pick-3/",
          url4: "https://www.lotteryusa.com/new-jersey/pick-4/",
          categoria: "NOCHE" },

        { id: "la-pm", codigo: "LOUI-EVEN", nombreMenu: "🇺🇸 Louisiana Evening", nombreFila: "LOUISIANA EVENING",
          fuente: "LOUISIANA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "va-night", codigo: "VIRG-NIGHT", nombreMenu: "🇺🇸 Virginia Night", nombreFila: "VIRGINIA NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/virginia/pick-3/",
          url4: "https://www.lotteryusa.com/virginia/pick-4/",
          categoria: "NOCHE" },

        { id: "ky-pm", codigo: "KNT-EVEN", nombreMenu: "🇺🇸 Kentucky Evening", nombreFila: "KENTUCKY EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/kentucky/pick-3/",
          url4: "https://www.lotteryusa.com/kentucky/pick-4/",
          categoria: "NOCHE" },

        { id: "ia-pm", codigo: "IOWA-EVEN", nombreMenu: "🇺🇸 Iowa Evening", nombreFila: "IOWA EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/iowa/pick-3/",
          url4: "https://www.lotteryusa.com/iowa/pick-4/",
          categoria: "NOCHE" },

        // Washington estado: fila WASHINGTON NIGHT, código corto WST-NG.
        { id: "wa-night", codigo: "WST-NG", nombreMenu: "🇺🇸 Washington Night", nombreFila: "WASHINGTON NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/washington/daily/",
          url4: null,
          categoria: "NOCHE" },

        { id: "in-pm", codigo: "IN-EVEN", nombreMenu: "🇺🇸 Indiana Evening", nombreFila: "INDIANA EVENING",
          fuente: "INDIANA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "tx-night", codigo: "TX-NIGHT", nombreMenu: "🇺🇸 Texas Night", nombreFila: "TEXAS NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/texas/pick-3/",
          url4: "https://www.lotteryusa.com/texas/daily-4/",
          categoria: "NOCHE" },

        { id: "fl-pm", codigo: "FL-PM", nombreMenu: "🇺🇸 Florida Evening", nombreFila: "FLORIDA PM",
          fuente: "FLORIDA_API", sorteo: "EVENING",
          categoria: "NOCHE" },

        { id: "nc-pm", codigo: "NC-PM", nombreMenu: "🇺🇸 North Carolina Evening", nombreFila: "NORTH CAROLINA PM",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/north-carolina/pick-3/",
          url4: "https://www.lotteryusa.com/north-carolina/pick-4/",
          categoria: "NOCHE" },

        { id: "nm-pm", codigo: "NM-EVEN", nombreMenu: "🇺🇸 New Mexico Evening", nombreFila: "NEW MEXICO EVENING",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/new-mexico/pick-3-plus/",
          url4: "https://www.lotteryusa.com/new-mexico/pick-4-plus/",
          categoria: "NOCHE" },

        { id: "dc-night", codigo: "DC-NG", nombreMenu: "🇺🇸 Washington D.C. Night", nombreFila: "WASHINGTON D.C NIGHT",
          fuente: "LOTTERYUSA",
          url3: "https://www.lotteryusa.com/district-of-columbia/dc-3-night/",
          url4: "https://www.lotteryusa.com/district-of-columbia/dc-4-night/",
          categoria: "NOCHE" },

        { id: "ga-night", codigo: "GE-NT", nombreMenu: "🇺🇸 Georgia Night", nombreFila: "GEORGIA NIGHT",
          fuente: "GEORGIA_API", sorteo: "NIGHT",
          categoria: "NOCHE" }
    ];

    const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];


// --- src/helpers.js ---
function normalizeLabel(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function buildValidLocalDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
    date.setHours(0, 0, 0, 0);
    return date;
}

function formatLocalDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function localDateKey(date) { return formatLocalDateKey(date); }

function parseCentralDate(text) {
    const match = /^(\d{1,2})\s+([a-záéíóú]+)\.?\s+(\d{4})$/i.exec(String(text || '').trim());
    if (!match) return null;
    const months = { ene: 1, feb: 2, mar: 3, abr: 4, may: 5, jun: 6, jul: 7, ago: 8, sep: 9, sept: 9, oct: 10, nov: 11, dic: 12 };
    const month = months[match[2].toLowerCase()];
    return month ? buildValidLocalDate(Number(match[3]), month, Number(match[1])) : null;
}

function nextRender() { return new Promise(resolve => setTimeout(resolve, 0)); }

// Cada consulta conserva fecha/sorteo, hora y los nombres propios del proveedor.
function queryReport(config, provider, snapshot, result, state) {
    const labels = provider?.labels || ['Pick 3', 'Pick 4'];
    return {
        'Lotería': config.nombreMenu, 'Código': config.codigo,
        'Fuente': result?.source || provider?.name || config.fuente,
        'Hora': new Date().toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        'Fecha': snapshot?.dateKey || 'Sin fecha vinculada',
        ...(config.sorteo ? { 'Sorteo': config.sorteo } : {}),
        [labels[0]]: result?.p3 || '—', [labels[1]]: result?.p4 || '—', 'Estado': state
    };
}


// --- src/providers.js ---
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


// --- src/rover.js ---
// Este adaptador solo trabaja con el formulario. No usa APIs internas de Rover,
// no intercepta fetch/XHR y no publica resultados ni pulsa botones de Procesar.
function createRoverAdapter(onChange) {
    const path = '/loteria/resultados/ver';
    const columns = { primera: '1ERA', segunda: '2DA', tercera: '3RA', pick3: 'PICK3', pick4: 'PICK4' };
    let epoch = 0, confirmed = null, candidate = null, pending = false, timer = null, lastView = '';

    function screen() {
        const form = [...document.querySelectorAll('#root form')].find(form =>
            [...form.querySelectorAll('button')].some(button => button.type === 'submit' && button.textContent.trim() === 'Buscar'));
        const search = form && [...form.querySelectorAll('button')].find(button => button.type === 'submit' && button.textContent.trim() === 'Buscar');
        const dateButton = form?.querySelector('button[aria-haspopup="dialog"]');
        const date = parseCentralDate(dateButton?.textContent);
        const serverButton = document.querySelector('button[title="Servidor cuyos datos se están viendo"]');
        const server = serverButton?.textContent.trim() || '';
        return { form, search, date, server };
    }

    function resultTable() {
        const tables = [...document.querySelectorAll('#root table')].filter(table => {
            const headers = [...table.querySelectorAll('thead th')].map(th => normalizeLabel(th.textContent));
            return Object.values(columns).every(key => headers.filter(h => h === key).length === 1) && headers.includes('LOTERIA');
        });
        return tables.length === 1 ? tables[0] : null;
    }

    function invalidate() { if (confirmed) { confirmed = null; epoch++; } }

    function sync() {
        clearTimeout(timer); timer = null;
        const active = location.pathname.replace(/\/$/, '') === path;
        const current = screen();
        const key = current.date && formatLocalDateKey(current.date);
        if (!active) { invalidate(); candidate = null; pending = false; }
        if (confirmed && (confirmed.dateKey !== key || confirmed.server !== current.server)) invalidate();
        if (candidate && (candidate.dateKey !== key || candidate.server !== current.server)) { candidate = null; pending = false; }
        const table = active && resultTable();
        if (active && pending && candidate && current.search && !current.search.disabled && table && Date.now() >= candidate.notBefore) {
            confirmed = { dateKey: candidate.dateKey, server: candidate.server }; candidate = null; pending = false;
        }
        if (active && pending && candidate && current.search && !current.search.disabled && table && Date.now() < candidate.notBefore) {
            timer = setTimeout(sync, candidate.notBefore - Date.now() + 1);
        }
        const ready = !!(active && confirmed && table && current.search && !current.search.disabled && !pending);
        const message = !active ? '' : ready ? `${confirmed.dateKey} · Listo` : pending ? 'Cargando la fecha de Rover…' : 'Pulsa Buscar en Rover para vincular la fecha.';
        const view = { active, ready, message, epoch };
        const signature = JSON.stringify(view);
        if (signature !== lastView) { lastView = signature; onChange(view); }
        return { ...view, ...current, table, dateKey: confirmed?.dateKey };
    }

    function schedule() { if (!timer) timer = setTimeout(sync, 30); }
    document.addEventListener('submit', event => {
        const current = screen();
        if (event.target !== current.form || location.pathname.replace(/\/$/, '') !== path) return;
        epoch++; confirmed = null;
        candidate = current.date && current.server ? { dateKey: formatLocalDateKey(current.date), server: current.server, notBefore: Date.now() + 20 } : null;
        pending = !!candidate; schedule();
    }, true);
    const observer = new MutationObserver(schedule);
    observer.observe(document.getElementById('root') || document.body, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    window.addEventListener('popstate', schedule);
    sync();

    function capture() {
        const current = sync();
        if (!current.ready) throw new Error(current.message || 'Abre Ver resultados en Rover.');
        return { epoch, dateKey: current.dateKey, date: new Date(current.date.getTime()), server: current.server };
    }

    function assertCurrent(snapshot) {
        const current = capture();
        if (snapshot.epoch !== current.epoch || snapshot.dateKey !== current.dateKey || snapshot.server !== current.server) {
            throw new Error('Cambió la fecha o el servidor. Consulta esta lotería otra vez.');
        }
    }

    function findFields(config) {
        const table = resultTable();
        if (!table) throw new Error('No se reconoce la tabla de resultados.');
        const headers = [...table.querySelectorAll('thead th')].map(th => normalizeLabel(th.textContent));
        const rows = [...table.querySelectorAll('tbody tr')].filter(row => {
            const first = row.querySelector('td');
            const name = first?.querySelector('.font-medium')?.textContent;
            const code = first?.querySelector('[data-slot="badge"]')?.textContent;
            return normalizeLabel(name) === normalizeLabel(config.nombreFila) && String(code || '').trim() === config.codigo;
        });
        if (rows.length !== 1) throw new Error(rows.length ? 'Hay más de una fila para esta lotería.' : 'La lotería no está visible. Revisa la fecha y el filtro de Rover.');
        const cells = [...rows[0].children];
        const fields = Object.fromEntries(Object.entries(columns).map(([name, header]) => [name, cells[headers.indexOf(header)]?.querySelector('input')]));
        if (Object.values(fields).some(input => !input || input.disabled || input.readOnly)) throw new Error('Los campos de esta lotería no están disponibles para editar.');
        return fields;
    }

    async function fill(config, result, snapshot) {
        assertCurrent(snapshot);
        findFields(config); // Validar todos los campos antes de la primera escritura.
        const expected = {}, picks = [];
        if (result.p3 != null) {
            if (!/^\d{3}$/.test(result.p3)) throw new Error('Pick 3 inválido.');
            expected.pick3 = result.p3; expected.primera = result.p3.slice(-2); picks.push('pick3');
        }
        if (result.p4 != null) {
            if (!/^\d{4}$/.test(result.p4)) throw new Error('Pick 4 inválido.');
            expected.pick4 = result.p4; expected.segunda = result.p4.slice(0, 2); expected.tercera = result.p4.slice(-2); picks.push('pick4');
        }
        for (const key of picks) {
            assertCurrent(snapshot);
            const input = findFields(config)[key];
            // Saltar el setter que React instala en la instancia permite que su
            // manejador nativo de input detecte el cambio y actualice su estado.
            const nativeSetter = Object.getOwnPropertyDescriptor(input.ownerDocument.defaultView.HTMLInputElement.prototype, 'value').set;
            nativeSetter.call(input, expected[key]);
            input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            await nextRender();
        }
        assertCurrent(snapshot);
        const fields = findFields(config);
        if (Object.entries(expected).some(([key, value]) => fields[key].value !== value)) throw new Error('Rover no conservó todos los valores. Revisa la fila antes de procesar.');
        return expected;
    }
    return { capture, assertCurrent, findFields, fill };
}


// --- src/feedback.js ---
// Feedback visual únicamente: no modifica valores ni emite eventos de formulario.
function createFillFeedback() {
    const style = document.createElement('style');
    style.textContent = `
      #root input.rlur-filled { font-weight: 700; }
      #root input.rlur-fill-flash { animation: rlur-filled-flash 2s ease-out; }
      @keyframes rlur-filled-flash {
        0%, 50% { background-color: #d1fae5; color: #065f46; }
      }
      @media (prefers-reduced-motion: reduce) {
        #root input.rlur-fill-flash { animation-duration: 1s; animation-timing-function: steps(1, end); }
      }
    `;
    document.head.append(style);
    const marked = new Set(), timers = new WeakMap();
    function remove(input) {
        clearTimeout(timers.get(input)); timers.delete(input);
        input.classList.remove('rlur-filled', 'rlur-fill-flash'); marked.delete(input);
    }
    function clear() { for (const input of marked) remove(input); }
    function highlight(inputs) {
        for (const input of marked) if (!input.isConnected) remove(input);
        for (const input of inputs) {
            remove(input);
            // Reiniciar el pulso incluso si se vuelve a consultar la misma fila.
            void input.offsetWidth;
            input.classList.add('rlur-filled', 'rlur-fill-flash'); marked.add(input);
            const duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 1000 : 2000;
            timers.set(input, setTimeout(() => { input.classList.remove('rlur-fill-flash'); timers.delete(input); }, duration));
        }
    }
    document.addEventListener('input', event => {
        if (!event.target.matches?.('#root table input')) return;
        for (const input of event.target.closest('tr')?.querySelectorAll('input') || []) remove(input);
    }, true);
    return { highlight, clear };
}


// --- src/ui.js ---
function createInterface(onQuery) {
    const feedback = createFillFeedback();
    const style = document.createElement('style');
    style.textContent = `
      #rlur-host { font-family: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; --rlur-font: clamp(.875rem, calc(.625rem + .208334vw), 1.125rem); --rlur-small: clamp(.75rem, calc(.625rem + .104167vw), .875rem); --rlur-row: clamp(52px, calc(40px + .625vw), 64px); font-size: var(--rlur-font); line-height: 1.4; color: var(--foreground, #0f172a); }
      #rlur-host * { box-sizing: border-box; }
      #rlur-bar { position: fixed; z-index: 40; display: flex; flex-direction: column; gap: 8px; padding: 12px; border: 1px solid var(--border, #cbd5e1); border-radius: var(--radius, 10px); background: var(--card, #fff); box-shadow: 0 8px 32px #0002; visibility: hidden; transform: translateY(100vh); transition: transform .18s ease, visibility .18s; }
      #rlur-bar[data-period="DIA"] { --rlur-accent: #2563eb; border-top: 3px solid #93c5fd; }
      #rlur-bar[data-period="NOCHE"] { --rlur-accent: #b45309; border-top: 3px solid #fcd34d; }
      .dark #rlur-bar[data-period="DIA"] { --rlur-accent: #93c5fd; }
      .dark #rlur-bar[data-period="NOCHE"] { --rlur-accent: #fcd34d; }
      #rlur-bar.is-open { visibility: visible; transform: translateY(0); }
      #rlur-bar.is-resizing { user-select: none; transition: none; }
      #rlur-bar[hidden], #rlur-toggle[hidden], #rlur-host [hidden] { display: none !important; }
      #rlur-host button, #rlur-host input { font: inherit; font-size: var(--rlur-font); }
      #rlur-host button { cursor: pointer; font-weight: 500; }
      #rlur-host button:disabled { cursor: wait; opacity: .6; }
      #rlur-host button:focus-visible, #rlur-host input:focus-visible { outline: 2px solid var(--ring, #94a3b8); outline-offset: 2px; }
      .rlur-controls { display: grid; grid-template-columns: auto 132px minmax(120px, 1fr) auto; gap: 10px; align-items: start; flex-shrink: 0; min-width: 0; }
      .rlur-title { display: flex; align-items: center; min-height: 38px; font-size: var(--rlur-font); font-weight: 600; white-space: nowrap; }
      .rlur-actions { display: flex; gap: 4px; }
      .rlur-close, .rlur-compact { min-height: 38px; border: 1px solid var(--border, #cbd5e1); background: transparent; color: var(--muted-foreground, #64748b); padding: 5px 8px; border-radius: 6px; }
      .rlur-close { min-width: 34px; font-size: 18px !important; }
      .rlur-tabs { display: flex; gap: 3px; padding: 3px; border-radius: 6px; background: var(--muted, #f1f5f9); }
      .rlur-tabs button { flex: 1; min-height: 32px; border: 0; padding: 5px 8px; border-radius: 4px; background: transparent; color: var(--muted-foreground, #64748b); white-space: nowrap; }
      .rlur-tabs button[aria-pressed="true"] { background: var(--card, #fff); color: var(--rlur-accent, var(--foreground, #0f172a)); box-shadow: 0 1px 3px #0001; font-weight: 600; }
      .rlur-search-wrap { min-width: 0; }
      #rlur-search { width: 100%; min-height: 38px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; padding: 6px 9px; }
      .rlur-version { display: block; margin-top: 3px; font-size: var(--rlur-small); font-weight: 700; color: #c45b62; }
      #rlur-context { flex-shrink: 0; font-size: var(--rlur-small); line-height: 1.4; color: var(--muted-foreground, #64748b); max-height: 42px; overflow: auto; overflow-wrap: anywhere; }
      .rlur-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, clamp(160px, 10vw, 240px)), 1fr)); grid-auto-rows: var(--rlur-row); gap: 6px; overflow-y: auto; overflow-x: hidden; min-height: 0; min-width: 0; flex: 1; padding: 2px; align-content: start; scrollbar-width: thin; overscroll-behavior: contain; }
      .rlur-lottery { display: flex; gap: 7px; align-items: center; justify-content: space-between; padding: 5px 9px; border: 1px solid var(--border, #cbd5e1); border-radius: 6px; background: transparent; color: inherit; text-align: left; min-height: 44px; min-width: 0; }
      .rlur-lottery > span:first-child { overflow: hidden; text-overflow: ellipsis; }
      .rlur-lottery:hover { background: var(--muted, #f1f5f9); }
      .rlur-lottery[data-status="success"] { border-color: #10b981; }
      .rlur-lottery[data-status="error"] { border-color: #d97777; }
      .rlur-status { display: inline-flex; flex-shrink: 0; width: 1em; height: 1em; color: var(--muted-foreground, #64748b); }
      [data-status="loading"] .rlur-status { border: 2px solid var(--border, #cbd5e1); border-top-color: var(--foreground, #0f172a); border-radius: 50%; animation: rlur-spin .8s linear infinite; }
      [data-status="success"] .rlur-status { color: #059669; }
      [data-status="error"] .rlur-status { color: #c45b62; }
      [data-status="warning"] .rlur-status { color: #b45309; }
      .dark [data-status="warning"] .rlur-status { color: #fcd34d; }
      .rlur-lottery[data-status="warning"] { border-color: #d97706; }
      #rlur-toggle { position: fixed; right: max(12px, env(safe-area-inset-right)); bottom: max(12px, env(safe-area-inset-bottom)); z-index: 40; display: flex; align-items: center; gap: 7px; min-height: 44px; padding: 0 13px; border: 1px solid var(--border, #cbd5e1); border-radius: 7px; background: var(--card, #fff); color: var(--foreground, #0f172a); box-shadow: 0 2px 9px #0002; font-weight: 600; }
      #rlur-toggle[aria-expanded="true"] { display: none; }
      #rlur-host svg { width: 1em; height: 1em; stroke: currentColor; fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
      #rlur-host .rlur-resize { position: absolute; z-index: 2; padding: 0; border: 0; background: transparent; touch-action: none; }
      .rlur-resize[data-resize="n"], .rlur-resize[data-resize="s"] { left: 24px; right: 24px; height: 20px; cursor: ns-resize; }
      .rlur-resize[data-resize="n"] { top: -9px; }
      .rlur-resize[data-resize="s"] { bottom: -9px; }
      .rlur-resize[data-resize="n"]::after { content: ''; position: absolute; left: calc(50% - 20px); top: 8px; width: 40px; height: 3px; border-radius: 4px; background: var(--muted-foreground, #64748b); opacity: .45; }
      .rlur-resize[data-resize="w"], .rlur-resize[data-resize="e"] { top: 24px; bottom: 24px; width: 20px; cursor: ew-resize; }
      .rlur-resize[data-resize="w"] { left: -9px; }
      .rlur-resize[data-resize="e"] { right: -9px; }
      .rlur-resize[data-resize="nw"], .rlur-resize[data-resize="ne"], .rlur-resize[data-resize="sw"], .rlur-resize[data-resize="se"] { width: 24px; height: 24px; }
      .rlur-resize[data-resize="nw"] { top: -9px; left: -9px; cursor: nwse-resize; }
      .rlur-resize[data-resize="ne"] { top: -9px; right: -9px; cursor: nesw-resize; }
      .rlur-resize[data-resize="sw"] { bottom: -9px; left: -9px; cursor: nesw-resize; }
      .rlur-resize[data-resize="se"] { bottom: -9px; right: -9px; cursor: nwse-resize; }
      #rlur-bar[data-narrow="false"] { display: grid; grid-template-columns: clamp(280px, 19vw, 360px) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr) auto; gap: 6px 16px; }
      #rlur-bar[data-narrow="false"] .rlur-controls { grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-content: start; }
      #rlur-bar[data-narrow="false"] .rlur-grid { grid-template-columns: none; grid-template-rows: repeat(var(--rlur-rows, 2), minmax(var(--rlur-row), 1fr)); grid-auto-flow: column; grid-auto-columns: clamp(184px, 11vw, 268px); overflow-x: auto; overflow-y: hidden; }
      #rlur-bar[data-narrow="false"] .rlur-title { display: none; }
      #rlur-bar[data-narrow="false"] .rlur-tabs { grid-column: 1; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-actions { grid-column: 2; grid-row: 1; }
      #rlur-bar[data-narrow="false"] .rlur-search-wrap { grid-column: 1 / -1; grid-row: 2; }
      #rlur-bar[data-narrow="false"] #rlur-context { grid-column: 1 / -1; }
      #rlur-bar[data-narrow="true"] .rlur-controls { grid-template-columns: minmax(144px, .9fr) minmax(0, 1fr); gap: 6px 8px; }
      #rlur-bar[data-narrow="true"] .rlur-title { grid-column: 1; grid-row: 1; font-size: var(--rlur-font); }
      #rlur-bar[data-narrow="true"] .rlur-actions { grid-column: 2; grid-row: 1; justify-content: end; }
      #rlur-bar[data-narrow="true"] .rlur-tabs { grid-column: 1; grid-row: 2; }
      #rlur-bar[data-narrow="true"] .rlur-search-wrap { grid-column: 2; grid-row: 2; }
      @media (max-width: 640px), (pointer: coarse) { #rlur-host .rlur-close, #rlur-host .rlur-compact, #rlur-search, .rlur-title { min-height: 44px; } .rlur-tabs { padding: 0; } .rlur-tabs button { min-height: 44px; } #rlur-search { font-size: 16px !important; } }
      @keyframes rlur-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { #rlur-bar { transition: none; } }
    `;
    document.head.appendChild(style);
    const host = document.createElement('div'); host.id = 'rlur-host';
    const bar = document.createElement('section'); bar.id = 'rlur-bar'; bar.setAttribute('aria-label', 'Loterías USA');
    const left = document.createElement('div'); left.className = 'rlur-controls';
    const title = document.createElement('div'); title.className = 'rlur-title'; title.textContent = 'Rovs Loterias USA';
    const close = document.createElement('button'); close.type = 'button'; close.className = 'rlur-close'; close.textContent = '×'; close.title = 'Cerrar barra'; close.setAttribute('aria-label', 'Cerrar barra'); left.append(title);
    const compact = document.createElement('button'); compact.type = 'button'; compact.className = 'rlur-compact'; compact.textContent = 'Compactar'; compact.setAttribute('aria-label', 'Volver al tamaño compacto');
    const actions = document.createElement('div'); actions.className = 'rlur-actions'; actions.append(compact, close);
    const tabs = document.createElement('div'); tabs.className = 'rlur-tabs'; tabs.setAttribute('aria-label', 'Categoría');
    const icons = {
        day: '<circle cx="7" cy="7" r="2.5"/><path d="M7 0v1M7 13v1M0 7h1M13 7h1M2 2l1 1M11 11l1 1M2 12l1-1M11 3l1-1"/>',
        night: '<path d="M11.7 8.4A5.3 5.3 0 0 1 5.6 2.3 5.3 5.3 0 1 0 11.7 8.4Z"/>',
        success: '<path d="m2 7 3 3 7-7"/>', error: '<path d="m3 3 8 8M11 3l-8 8"/>',
        warning: '<path d="M7 2 13 12H1Z M7 5v3 M7 10v.1"/>', pending: '<circle cx="7" cy="7" r="5"/><path d="M3.5 10.5 10.5 3.5"/>',
        panel: '<rect x="1" y="2" width="12" height="10" rx="2"/><path d="M1 8h12"/>'
    };
    const svg = key => `<svg viewBox="0 0 14 14" aria-hidden="true">${icons[key] || ''}</svg>`;
    let category = 'DIA', open = false;
    const categoryButtons = new Map(), buttons = new Map();
    for (const [id, label, icon] of [['DIA', 'Día', 'day'], ['NOCHE', 'Noche', 'night']]) {
        const button = document.createElement('button'); button.type = 'button'; button.dataset.category = id;
        button.innerHTML = svg(icon); button.append(document.createTextNode(' ' + label));
        button.setAttribute('aria-pressed', String(id === category)); button.onclick = () => { category = id; filter(); };
        categoryButtons.set(id, button); tabs.append(button);
    }
    left.append(tabs);
    const search = document.createElement('input'); search.id = 'rlur-search'; search.placeholder = 'Buscar lotería…'; search.setAttribute('aria-label', 'Filtrar botones de loterías'); const searchWrap = document.createElement('div'); searchWrap.className = 'rlur-search-wrap'; searchWrap.append(search); left.append(searchWrap);
    const version = document.createElement('strong'); version.className = 'rlur-version'; version.textContent = 'v' + (typeof GM_info !== 'undefined' ? GM_info.script?.version || APP_VERSION : APP_VERSION); searchWrap.append(version); left.append(actions);
    const context = document.createElement('div'); context.id = 'rlur-context'; context.setAttribute('role', 'status');
    const grid = document.createElement('div'); grid.className = 'rlur-grid';
    for (const config of LOTERIAS) {
        const button = document.createElement('button'); button.type = 'button'; button.className = 'rlur-lottery'; button.dataset.lotteryId = config.id;
        const label = document.createElement('span'); label.textContent = config.nombreMenu;
        const status = document.createElement('span'); status.className = 'rlur-status'; button.append(label, status);
        button.onclick = () => onQuery(config); button.dataset.status = 'idle'; buttons.set(config.id, button); grid.append(button);
    }
    function filter() {
        bar.dataset.period = category; grid.scrollLeft = grid.scrollTop = 0;
        for (const config of LOTERIAS) buttons.get(config.id).hidden = config.categoria !== category || !normalizeLabel(config.nombreMenu + config.codigo).includes(normalizeLabel(search.value));
        for (const [id, button] of categoryButtons) button.setAttribute('aria-pressed', String(id === category));
    }
    function updateGridRows() {
        const css = getComputedStyle(grid), gap = parseFloat(css.rowGap) || 0;
        const rowHeight = parseFloat(css.gridAutoRows) || 52;
        const available = grid.clientHeight - parseFloat(css.paddingTop) - parseFloat(css.paddingBottom);
        const rows = Math.max(1, Math.floor((available + gap) / (rowHeight + gap)));
        if (grid.style.getPropertyValue('--rlur-rows') !== String(rows)) grid.style.setProperty('--rlur-rows', String(rows));
    }
    const gridObserver = new ResizeObserver(updateGridRows); gridObserver.observe(grid);
    search.addEventListener('input', filter); filter();
    const toggle = document.createElement('button'); toggle.type = 'button'; toggle.id = 'rlur-toggle'; toggle.innerHTML = svg('panel'); toggle.append(document.createTextNode('Loterías USA'));
    // Geometry is local to this page: every reload starts compact.
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
    let geometry = null, resized = false, drag = null;
    function limits() {
        const viewport = window.visualViewport;
        const width = viewport?.width || window.innerWidth, height = viewport?.height || window.innerHeight;
        const margin = width <= 640 ? 10 : 12;
        const left = viewport?.offsetLeft || 0, top = (viewport?.offsetTop || 0) + margin;
        const maxWidth = Math.max(1, width), maxHeight = Math.max(1, height - margin * 2);
        return { left, top, right: left + maxWidth, bottom: top + maxHeight, maxWidth, maxHeight,
            minWidth: Math.min(360, maxWidth), minHeight: Math.min(width <= 640 || matchMedia('(pointer: coarse)').matches ? 244 : 154, maxHeight) };
    }
    function paint(next) {
        const bounds = limits();
        const width = clamp(next.width, bounds.minWidth, bounds.maxWidth);
        const minHeight = Math.min(bounds.maxHeight, width < 700 ? Math.max(214, bounds.minHeight) : bounds.minHeight);
        const height = clamp(next.height, minHeight, bounds.maxHeight);
        geometry = { left: clamp(next.left, bounds.left, bounds.right - width), top: clamp(next.top, bounds.top, bounds.bottom - height), width, height };
        Object.assign(bar.style, { left: geometry.left + 'px', top: geometry.top + 'px', width: width + 'px', height: height + 'px' });
        bar.dataset.narrow = String(width < 700); requestAnimationFrame(updateGridRows);
    }
    function resetSize() {
        resized = false;
        const b = limits(), width = b.maxWidth;
        // Dos filas legibles y espacio para scrollbars clásicos de Firefox en Windows.
        const compactHeight = 188 + clamp((window.innerWidth - 1920) / 80, 0, 24);
        const height = Math.min(b.maxHeight, width < 700 ? 270 : Math.ceil(compactHeight));
        paint({ left: b.right - width, top: b.bottom - height, width, height });
    }
    function resizeFrom(start, edge, dx, dy) {
        const b = limits();
        let left = start.left, top = start.top, right = left + start.width, bottom = top + start.height;
        // A narrow desktop panel needs two control rows too.
        const minHeight = Math.min(b.maxHeight, start.width < 700 ? Math.max(214, b.minHeight) : b.minHeight);
        if (edge.includes('w')) left = clamp(left + dx, b.left, right - b.minWidth);
        if (edge.includes('e')) right = clamp(right + dx, left + b.minWidth, b.right);
        if (edge.includes('n')) top = clamp(top + dy, b.top, bottom - minHeight);
        if (edge.includes('s')) bottom = clamp(bottom + dy, top + minHeight, b.bottom);
        resized = true;
        paint({ left, top, width: right - left, height: bottom - top });
    }
    const edgeNames = { n: 'superior', s: 'inferior', w: 'izquierdo', e: 'derecho', nw: 'superior izquierda', ne: 'superior derecha', sw: 'inferior izquierda', se: 'inferior derecha' };
    function endDrag() { drag = null; bar.classList.remove('is-resizing'); }
    for (const [edge, label] of Object.entries(edgeNames)) {
        const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'rlur-resize'; handle.dataset.resize = edge;
        handle.setAttribute('aria-label', 'Ajustar tamaño: ' + label); handle.title = 'Arrastra para ajustar; también puedes usar las flechas del teclado';
        handle.addEventListener('pointerdown', event => {
            if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
            event.preventDefault();
            drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: { ...geometry }, edge };
            bar.classList.add('is-resizing');
            // The pointer can end before capture (for example during a viewport change).
            try { handle.setPointerCapture(event.pointerId); } catch { /* Pointer already inactive. */ }
        });
        handle.addEventListener('pointermove', event => {
            if (drag?.id === event.pointerId) resizeFrom(drag.start, drag.edge, event.clientX - drag.x, event.clientY - drag.y);
        });
        for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) handle.addEventListener(eventName, endDrag);
        handle.addEventListener('keydown', event => {
            const delta = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] }[event.key];
            if (delta) { event.preventDefault(); resizeFrom(geometry, edge, ...delta); }
        });
        bar.append(handle);
    }
    const setOpen = value => {
        open = value; endDrag();
        bar.classList.toggle('is-open', open); bar.inert = !open; bar.setAttribute('aria-hidden', String(!open)); toggle.setAttribute('aria-expanded', String(open));
        if (open && matchMedia('(pointer: fine)').matches) search.focus();
        if (!open) toggle.focus();
    };
    toggle.setAttribute('aria-controls', 'rlur-bar'); toggle.setAttribute('aria-expanded', 'false'); toggle.onclick = () => setOpen(!open); close.onclick = () => setOpen(false); compact.onclick = resetSize;
    bar.append(left, grid, context); bar.inert = true; bar.setAttribute('aria-hidden', 'true'); host.append(bar, toggle); document.body.append(host); resetSize();
    const fitViewport = () => { endDrag(); if (resized) paint(geometry); else resetSize(); };
    window.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('resize', fitViewport);
    window.visualViewport?.addEventListener('scroll', fitViewport);
    function setStatus(id, state, message = '') {
        const button = buttons.get(id); button.dataset.status = state; button.disabled = state === 'loading'; button.title = message;
        button.querySelector('.rlur-status').innerHTML = state === 'loading' || state === 'idle' ? '' : svg(state);
    }
    let previousEpoch = -1;
    function setContext(view) {
        bar.hidden = toggle.hidden = !view.active; context.textContent = view.message; context.dataset.ready = String(view.ready);
        if (previousEpoch !== view.epoch) { feedback.clear(); for (const id of buttons.keys()) setStatus(id, 'idle'); previousEpoch = view.epoch; }
    }
    return { setStatus, setContext, highlightFields: feedback.highlight };
}


// --- src/main.js ---
if (document.getElementById('rlur-host')) return;
let writeQueue = Promise.resolve();
const running = new Map();
const ui = createInterface(runQuery);
const rover = createRoverAdapter(ui.setContext);

async function runQuery(config) {
    if (running.has(config.id)) return;
    const token = Symbol(); running.set(config.id, token);
    ui.setStatus(config.id, 'loading', 'Consultando sorteo…');
    let snapshot, provider, result;
    const details = message => [snapshot?.dateKey, config.sorteo, message, result?.source || provider?.name || config.fuente].filter(Boolean).join(' · ');
    const report = state => console.table(queryReport(config, provider, snapshot, result, state));
    try {
        snapshot = rover.capture();
        rover.findFields(config);
        provider = PROVIDERS[config.fuente];
        if (!provider) throw new Error('Fuente de resultados no disponible.');
        result = await provider.consultar(config, snapshot.date);
        rover.assertCurrent(snapshot);
        if (!result.p3 && !result.p4) {
            const message = 'Sin resultado para la fecha y sorteo seleccionados.';
            ui.setStatus(config.id, 'pending', details(message)); report(message); return;
        }
        const write = writeQueue.then(() => rover.fill(config, result, snapshot));
        writeQueue = write.catch(() => {});
        const expected = await write;
        const fields = rover.findFields(config);
        ui.highlightFields(Object.keys(expected).map(key => fields[key]));
        const missing = result.requiredGames.filter(key => !result[key]);
        const state = missing.length ? 'warning' : 'success';
        const message = missing.length ? `Resultado parcial: falta ${missing.map(key => provider.labels[key === 'p3' ? 0 : 1]).join(', ')}.` : 'Completado. Revisa la fila antes de procesar.';
        ui.setStatus(config.id, state, details(message));
        report(message);
    } catch (error) {
        const message = error instanceof Error ? error.message : 'No se pudo completar la consulta.';
        ui.setStatus(config.id, 'error', details(message)); report(message);
        console.error(`[Rovs Loterias USA React] ${config.nombreFila}: ${message}`);
    } finally { if (running.get(config.id) === token) running.delete(config.id); }
}

})();
