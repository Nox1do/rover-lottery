import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

const blank = () => ({ primera: '', segunda: '', tercera: '', pick3: '', pick4: '' });
const definitions = [
  ['GEORGIA MIDDAY', 'GE-MD'], ['GEORGIA NIGHT', 'GE-NT'],
  ['GEORGIA MIDDAY MARIAGE PALE', 'GE-MD-MR'],
  ['WASHINGTON NIGHT', 'WST-NG'], ['WASHINGTON D.C NIGHT', 'DC-NG']
];
const keys = ['primera', 'segunda', 'tercera', 'pick3', 'pick4'];
const initial = () => Object.fromEntries(definitions.map(([, code]) => [code, blank()]));

function App() {
  const [selected, setSelected] = useState('24 oct 2026');
  const [loaded, setLoaded] = useState(null);
  const [busy, setBusy] = useState(false);
  const [values, setValues] = useState(initial);
  const [filter, setFilter] = useState('');
  const [server, setServer] = useState('PRINCIPAL');
  const [tick, setTick] = useState(0);
  window.fixtureState = values;
  window.fixtureLoaded = loaded;
  window.fixtureRender = () => setTick(v => v + 1);
  window.fixtureDate = date => setSelected(date);
  window.fixtureServer = () => setServer(s => s === 'PRINCIPAL' ? 'SEGUNDO' : 'PRINCIPAL');
  window.fixtureValues = (code, fields) => setValues(old => ({ ...old, [code]: { ...old[code], ...fields } }));
  window.fixtureDuplicate = false;
  function change(code, key, raw) {
    if (window.fixtureIgnoreInput) return;
    setValues(old => {
      const row = { ...old[code] }, value = raw.replace(/[^A-Za-z0-9]/g, '').slice(0, key.startsWith('pick') ? 4 : 2);
      row[key] = value;
      if (key === 'pick3') row.primera = value.length === 3 ? value.slice(-2) : '';
      if (key === 'pick4') { row.segunda = value.length === 4 ? value.slice(0, 2) : ''; row.tercera = value.length === 4 ? value.slice(-2) : ''; }
      const next = { ...old, [code]: row };
      if (code === 'GE-MD') next['GE-MD-MR'] = { ...row };
      return next;
    });
  }
  return <main data-tick={tick}>
    <h1>Ver resultados</h1>
    <button title="Servidor cuyos datos se están viendo" onClick={window.fixtureServer}>{server}</button>
    <form onSubmit={event => { event.preventDefault(); setBusy(true); setTimeout(() => { setLoaded(selected); setBusy(false); setValues(initial()); }, window.fixtureLoadDelay || 90); }}>
      <label>Fecha</label><button type="button" aria-haspopup="dialog" onClick={() => setSelected(selected === '24 oct 2026' ? '23 oct 2026' : '24 oct 2026')}>{selected}</button>
      <button type="submit" disabled={busy}>Buscar</button>
    </form>
    {loaded && <section><input placeholder="Buscar lotería" value={filter} onChange={e => setFilter(e.target.value)} />
      <table><thead><tr>{['LOTERÍA', 'HORA', '1ERA', '2DA', '3RA', 'PICK 3', 'PICK 4', 'PEND.', 'PROC.', 'ACCIÓN'].map(h => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{definitions.filter(([name]) => name.includes(filter.toUpperCase())).map(([name, code]) => <tr key={code} data-code={code}>
          <td><div className="font-medium">{name}</div><span data-slot="badge">{code}</span></td><td>1:00 PM</td>
          {keys.map(key => <td key={key}><input data-slot="input" value={values[code][key]} onChange={event => change(code, key, event.target.value)} /></td>)}
          <td>0</td><td>—</td><td><button title="Procesar" onClick={() => { window.processClicks = (window.processClicks || 0) + 1; }}>Procesar</button></td>
        </tr>)}</tbody></table>
    </section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App />);
