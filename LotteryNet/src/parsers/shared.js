// Lottery.net result HTML parser. Pure, fail-closed, no network or Rover writes.
const MONTHS=['january','february','march','april','may','june','july','august','september','october','november','december'];
const split=(s,re)=>{const m=[...s.matchAll(re)];return m.map((x,i)=>s.slice(x.index,i+1<m.length?m[i+1].index:s.length));};
const text=s=>String(s).replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim();
function dateKey(label){
 const m=text(label).match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),\s*(\d{4})\b/i);
 if(!m)throw Error('Fecha ilegible');
 return m[3]+'-'+String(MONTHS.indexOf(m[1].toLowerCase())+1).padStart(2,'0')+'-'+m[2].padStart(2,'0');
}
function validateIso(date){
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Formato fecha inválido');
 const [y,m,d]=date.split('-').map(Number),dt=new Date(Date.UTC(y,m-1,d));
 if(dt.getUTCFullYear()!==y||dt.getUTCMonth()+1!==m||dt.getUTCDate()!==d)throw Error('Fecha imposible');
}
function digitsFrom(slot,count){
 const ul=slot.match(/<ul\b[^>]*class=["'][^"']*\bballs\b[^"']*["'][^>]*>([\s\S]*?)<\/ul>/i);
 if(!ul)throw Error('Lista de bolas ausente');
 const parts=new Map();
 for(const li of ul[1].matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/gi)){
  const cls=li[1].match(/\bclass=["']([^"']+)["']/i)?.[1]?.split(/\s+/)??[];
  const numbered=cls.find(x=>/^number-part-\d{2}$/i.test(x));
  if(!numbered)continue;
  if(cls.some(x=>['fireball','wild-ball','super-ball'].includes(x.toLowerCase())))throw Error('Bola bonus como principal');
  const idx=Number(numbered.slice(-2)),value=text(li[2]);
  if(idx<1||idx>count||parts.has(idx)||!/^\d$/.test(value))throw Error('Posiciones o dígitos inválidos');
  parts.set(idx,value);
 }
 if(parts.size!==count)throw Error('Número de bolas principales incorrecto');
 return Array.from({length:count},(_,i)=>parts.get(i+1)).join('');
}
export function parseLotteryNetHtml(html,{url,date,turn,digits,allowUnlabelledEvening=false}={}){
 validateIso(date);
 const source=new URL(url);
 if(source.protocol!=='https:'||source.hostname!=='www.lottery.net'||!/^\/[a-z-]+\/[a-z0-9-]+\/numbers\/?$/.test(source.pathname))throw Error('Origen no autorizado');
 if(![3,4].includes(digits))throw Error('Juego inválido');
 if(!['MORNING','MIDDAY','EVENING'].includes(turn))throw Error('Turno inválido');
 if(typeof html!=='string'||html.length<200)throw Error('HTML incompleto');
 const boxes=split(html,/<div\b[^>]*class=["'][^"']*\bresultBox\b[^"']*["'][^>]*>/gi);
 if(!boxes.length)throw Error('Sin resultados');
 const found=[];let recognized=0;
 for(const box of boxes){
  const dateHtml=box.match(/<div\b[^>]*class=["'][^"']*\bresultDate\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
  const link=box.match(/<a\b[^>]*href=["'](https:\/\/www\.lottery\.net\/[^"']+\/numbers\/\d{2}-\d{2}-\d{4})["']/i)?.[1];
  if(!dateHtml||!link)continue;
  const printed=dateKey(dateHtml);
  const expected=source.pathname.replace(/\/$/,'')+'/'+printed.slice(5,7)+'-'+printed.slice(8,10)+'-'+printed.slice(0,4);
  if(new URL(link).pathname!==expected)throw Error('Fecha/enlace incongruentes');
  recognized++;
  if(printed!==date)continue;
  const stats=box.search(/<div\b[^>]*class=["'][^"']*\bresultStats\b/i);
  const slots=split(stats>=0?box.slice(0,stats):box,/<div\b[^>]*class=["'][^"']*\bdrawTime\b[^"']*["'][^>]*>/gi);
  for(const slot of slots){
   const heading=slot.match(/<strong\b[^>]*>([\s\S]*?)<\/strong>/i);
   const label=heading?text(heading[1]).toUpperCase():'';
   if(label!==turn&&!(allowUnlabelledEvening&&turn==='EVENING'&&!label&&slots.length===1))continue;
   found.push({date,turn,digits,value:digitsFrom(slot,digits),url:source.href,source:'Lottery.net'});
  }
 }
 if(!recognized)throw Error('No se reconocieron resultados fechados');
 if(found.length>1)throw Error('Resultado duplicado o ambiguo');
 return found[0]??null;
}
