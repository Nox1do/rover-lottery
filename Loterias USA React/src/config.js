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
