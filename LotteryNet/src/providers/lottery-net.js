import {parseLotteryNetHtml} from '../parsers/shared.js';
// Alcance vigente del plan: cinco estados, diez sorteos. Catálogo de 74 no activado.
export const GAME_URLS=Object.freeze({
 FL:{p3:'florida/pick-3',p4:'florida/pick-4'},
 LA:{p3:'louisiana/pick-3',p4:'louisiana/pick-4'},
 OH:{p3:'ohio/pick-3',p4:'ohio/pick-4'},
 TN:{p3:'tennessee/cash-3',p4:'tennessee/cash-4'},
 IN:{p3:'indiana/daily-3',p4:'indiana/daily-4'}
});
export function extractFromPage(html,{state,game,date,turn}){
 const path=GAME_URLS[state]?.[game];
 if(!path)throw Error('Estado o juego fuera de alcance');
 return parseLotteryNetHtml(html,{
  url:'https://www.lottery.net/'+path+'/numbers',
  date,turn,digits:game==='p3'?3:4,allowUnlabelledEvening:state==='LA'
 });
}
export async function fetchLotteryNetResult(request,config){
 const path=GAME_URLS[config.state]?.[config.game];
 if(!path||typeof request!=='function')throw Error('Juego o transporte inválido');
 return extractFromPage(await request('https://www.lottery.net/'+path+'/numbers'),config);
}
