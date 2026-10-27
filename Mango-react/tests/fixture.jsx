import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
const keys = ["primera", "segunda", "tercera", "pick3", "pick4"];
const empty = () => ({
  primera: "",
  segunda: "",
  tercera: "",
  pick3: "",
  pick4: "",
});
const base = [
  ["REAL", "REAL"],
  ["NEW YORK AM", "NY-AM"],
  ["NEW YORK AM BP", "NY-BP"],
];
function App() {
  const [date, setDate] = useState("27 oct 2026"),
    [server, setServer] = useState("PRINCIPAL"),
    [data, setData] = useState(null),
    [values, setValues] = useState({}),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState(""),
    [dialog, setDialog] = useState(false),
    [reverse, setReverse] = useState(false),
    [readOnly, setReadOnly] = useState(false),
    [tick, setTick] = useState(0);
  window.fx = {
    setDate,
    setServer,
    setDialog,
    setReadOnly,
    render: () => setTick((x) => x + 1),
    values: (code, f) =>
      setValues((v) => ({ ...v, [code]: { ...v[code], ...f } })),
    get valuesState() {
      return values;
    },
    get data() {
      return data;
    },
  };
  async function load() {
    setBusy(true);
    try {
      const body = await fetch("/api/loteria/resultadosLoteria2", {
        method: "POST",
        headers: { "X-Servidor": server === "PRINCIPAL" ? "1" : "2" },
        body: JSON.stringify({
          fecha: date === "27 oct 2026" ? "10/27/2026" : "10/26/2026",
        }),
      }).then((r) => {
        if (!r.ok) throw Error("load failed");
        return r.json();
      });
      setData(body);
    } catch {
    } finally {
      setBusy(false);
    }
  }
  const previous = useRef({ date: null, values: {} });
  useEffect(() => {
    if (!data) return;
    const incoming = Object.fromEntries(
      data.filas.map((r) => [
        r.abrev,
        Object.fromEntries(keys.map((k) => [k, r[k] ?? ""])),
      ]),
    );
    const old = previous.current,
      sameDate = old.date === data.fecha;
    const equal = (a, b) =>
      a && b && keys.every((k) => (a[k] ?? "") === (b[k] ?? ""));
    setValues((local) =>
      sameDate
        ? Object.fromEntries(
            Object.entries(incoming).map(([code, fields]) => [
              code,
              local[code] &&
              !equal(local[code], old.values[code]) &&
              equal(fields, old.values[code])
                ? local[code]
                : fields,
            ]),
          )
        : incoming,
    );
    previous.current = { date: data.fecha, values: incoming };
  }, [data]);
  useEffect(() => {
    fetch("/api/loteria/resultadosLoteria2/dependientes", {
      headers: { "X-Servidor": server === "PRINCIPAL" ? "1" : "2" },
    }).then((r) => r.json());
    fetch("/api/loteria/resultadosLoteria2/revision?fecha=10/27/2026", {
      headers: { "X-Servidor": server === "PRINCIPAL" ? "1" : "2" },
    }).then((r) => r.json());
  }, [server]);
  function change(code, key, raw) {
    if (window.fxIgnore) return;
    const val = raw
      .replace(/[^A-Za-z0-9]/g, "")
      .slice(0, key.startsWith("pick") ? 4 : 2);
    setValues((old) => {
      const row = { ...old[code], [key]: val };
      if (key === "pick3") row.primera = val.length === 3 ? val.slice(-2) : "";
      if (key === "pick4") {
        row.segunda = val.length === 4 ? val.slice(0, 2) : "";
        row.tercera = val.length === 4 ? val.slice(2) : "";
      }
      const next = { ...old, [code]: row };
      if (code === "NY-AM")
        next["NY-BP"] = {
          ...old["NY-BP"],
          primera: row.pick4.length === 4 ? row.pick4.slice(2) : "",
          segunda: "X",
          tercera: "X",
        };
      return next;
    });
    if (val.length > 1)
      setTimeout(
        () =>
          document
            .querySelector(`[data-code="${code}"] td:nth-child(8) input`)
            ?.focus(),
        0,
      );
  }
  let list =
    data?.filas.filter((r) =>
      (r.nombre + " " + r.abrev).includes(filter.toUpperCase()),
    ) ?? [];
  if (reverse) list = [...list].reverse();
  if (window.fxDuplicate && list[0]) list = [...list, list[0]];
  return (
    <main data-tick={tick}>
      <h1>Ver resultados</h1>
      <button title="Servidor cuyos datos se están viendo">
        <span className="truncate">{server}</span>
        <span>3</span>
      </button>
      {readOnly && (
        <span title="Las acciones que modifican datos están bloqueadas">
          Solo lectura
        </span>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <button type="button" aria-haspopup="dialog">
          {date}
        </button>
        <button type="submit" disabled={busy}>
          Buscar
        </button>
      </form>
      {data && (
        <>
          <input
            placeholder="Buscar lotería"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div style={{ maxHeight: 400, overflow: "auto" }}>
            <table>
              <thead>
                <tr>
                  {[
                    "Lotería",
                    "Fotos",
                    "Hora",
                    "1era",
                    "2da",
                    "3ra",
                    "Pick 3",
                    "Pick 4",
                    "Pend.",
                    "Proc.",
                    "Historial",
                    "Status",
                    "Acción",
                  ].map((h) => (
                    <th key={h}>
                      <button
                        type="button"
                        onClick={() => setReverse((v) => !v)}
                      >
                        {h}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => (
                  <tr key={r.abrev + i} data-code={r.abrev}>
                    <td>
                      <div className="font-medium">{r.nombre}</div>
                      <span data-slot="badge">{r.abrev}</span>
                    </td>
                    <td>0</td>
                    <td>1:00 PM</td>
                    {keys.map((k) => (
                      <td key={k}>
                        <input
                          value={values[r.abrev]?.[k] ?? ""}
                          onChange={(e) => change(r.abrev, k, e.target.value)}
                        />
                      </td>
                    ))}
                    <td>0</td>
                    <td>
                      {r.procesado ? (
                        <svg className="lucide lucide-circle-check-big text-emerald-600" />
                      ) : (
                        <svg className="lucide lucide-circle-x text-destructive" />
                      )}
                    </td>
                    <td>
                      <button onClick={() => setDialog(true)}>Historial</button>
                    </td>
                    <td>
                      <svg className="lucide-circle-check-big" />
                    </td>
                    <td>
                      <button
                        disabled={readOnly}
                        title="Procesar"
                        onClick={() => {
                          window.processClicks =
                            (window.processClicks || 0) + 1;
                          setDialog(true);
                        }}
                      >
                        Procesar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {dialog && (
        <div role="dialog" data-state="open">
          <button onClick={() => setDialog(false)}>Cerrar</button>
          <table>
            <thead>
              <tr>
                <th>Lotería</th>
                <th>1era</th>
              </tr>
            </thead>
          </table>
        </div>
      )}
      <input id="work" placeholder="Trabajo local" />
    </main>
  );
}
window.makeFixtureData = (date = "10/27/2026", overrides = {}) => ({
  fecha: date,
  filas: [
    ...base,
    ...Array.from(
      { length: Math.max(0, (window.fxRowCount || 3) - 3) },
      (_, i) => ["LOTTERY " + i, "FIX" + i],
    ),
  ].map(([nombre, abrev]) => ({
    nombre,
    abrev,
    procesado: false,
    ...empty(),
    ...overrides[abrev],
  })),
});
createRoot(document.getElementById("root")).render(<App />);
