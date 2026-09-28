(function (VL) {
  'use strict';
  const draw = (label, time, extra={}) => ({ label, time, enabledByDefault:true, ...extra });
  const LOTTERY_REGISTRY = Object.freeze({
    extra: {
      name:'EXTRA', source:'extra', automationSupported:false, enabledByDefault:false,
      draws:{ EXTRA: draw('EXTRA', null, { roverCode:'EXTRA', hora:'Diario' }) }
    },
    winner: {
      name:'Winner', source:'nationjl', automationSupported:false, enabledByDefault:false,
      draws:{
        'WIN-10-00PM':draw('10:00 PM','22:00',{roverCode:'WIN-10-00PM',hora:'10:00 PM'}),
        'WIN-7-30PM':draw('7:30 PM','19:30',{roverCode:'WIN-7-30PM',hora:'07:30 PM'}),
        'WIN-5-30PM':draw('5:30 PM','17:30',{roverCode:'WIN-5-30PM',hora:'05:30 PM'}),
        'WIN-1-00PM':draw('1:00 PM','13:00',{roverCode:'WIN-1-00PM',hora:'01:00 PM'}),
        'WIN-11-00AM':draw('11:00 AM','11:00',{roverCode:'WIN-11-00AM',hora:'11:00 AM'}),
        'WIN-9-30AM':draw('9:30 AM','09:30',{roverCode:'WIN-9-30AM',hora:'09:30 AM'})
      }
    },
    rapid: {
      name:'Rapid', source:'rapid', automationSupported:false, enabledByDefault:false,
      draws:{
        'RPL-11AM':draw('11:00 AM','11:00',{roverCode:'RPL-11AM',hora:'11:00 AM',hora24:'11:00'}),
        'RPL-1PM':draw('1:00 PM','13:00',{roverCode:'RPL-1PM',hora:'01:00 PM',hora24:'13:00'}),
        'RPL-3PM':draw('3:00 PM','15:00',{roverCode:'RPL-3PM',hora:'03:00 PM',hora24:'15:00'}),
        'RPL-5PM':draw('5:00 PM','17:00',{roverCode:'RPL-5PM',hora:'05:00 PM',hora24:'17:00'}),
        'RPL-7PM':draw('7:00 PM','19:00',{roverCode:'RPL-7PM',hora:'07:00 PM',hora24:'19:00'}),
        'RPL-9PM':draw('9:00 PM','21:00',{roverCode:'RPL-9PM',hora:'09:00 PM',hora24:'21:00'})
      }
    },
    premier: {
      name:'Premier', source:'premier', automationSupported:false, enabledByDefault:false,
      draws:{
        PREMIER12PM:draw('12:00 PM','12:00',{roverCode:'PREMIER12PM',hora:'12:00 PM',premierKey:'12PM'}),
        PREMIER03PM:draw('3:00 PM','15:00',{roverCode:'PREMIER03PM',hora:'03:00 PM',premierKey:'3PM'}),
        PREMIER07PM:draw('7:00 PM','19:00',{roverCode:'PREMIER07PM',hora:'07:00 PM',premierKey:'7PM'}),
        PREMIER08PM:draw('8:00 PM','20:00',{roverCode:'PREMIER08PM',hora:'08:00 PM',premierKey:'8PM'})
      }
    },
    brazil: {
      name:'Brazil', source:'qplay', automationSupported:true, enabledByDefault:true,
      retryPolicy:{ offsets:[1,3,5,8,12,20,30,45,60,90,120], afterLast:30 },
      draws:{
        BRAZIL12PM:draw('12:00 PM','12:00',{roverCode:'BRAZIL12PM',hora:'12:00 PM'}),
        BRAZIL03PM:draw('3:00 PM','15:00',{roverCode:'BRAZIL03PM',hora:'03:00 PM'}),
        BRAZIL07PM:draw('7:00 PM','19:00',{roverCode:'BRAZIL07PM',hora:'07:00 PM'}),
        BRAZIL08PM:draw('8:00 PM','20:00',{roverCode:'BRAZIL08PM',hora:'08:00 PM'})
      }
    },
    queen: {
      name:'Queen', source:'queen', automationSupported:false, enabledByDefault:false,
      draws:{
        'QLT-MORNING':draw('Morning',null,{roverCode:'QLT-MORNING',hora:'Morning',queenKey:'QL MORNING'}),
        'QLT-MIDDAY':draw('Midday',null,{roverCode:'QLT-MIDDAY',hora:'Midday',queenKey:'QL MIDDAY'}),
        'QLT-AFTN':draw('Afternoon',null,{roverCode:'QLT-AFTN',hora:'Afternoon',queenKey:'QL AFTERNOON'}),
        'QLT-EVENING':draw('Evening',null,{roverCode:'QLT-EVENING',hora:'Evening',queenKey:'QL EVENING'}),
        'QLT-NIGHT':draw('Night',null,{roverCode:'QLT-NIGHT',hora:'Night',queenKey:'QL NIGHT'})
      }
    }
  });
  const hasOwn = (obj,key) => !!obj && Object.prototype.hasOwnProperty.call(obj,key);
  function getDrawByCode(code) {
    if (typeof code !== 'string') return null;
    for (const lotteryId of Object.keys(LOTTERY_REGISTRY)) {
      const lottery = LOTTERY_REGISTRY[lotteryId];
      if (hasOwn(lottery.draws, code)) return { lotteryId, lottery, draw: lottery.draws[code] };
    }
    return null;
  }
  Object.assign(VL,{LOTTERY_REGISTRY,getDrawByCode,hasOwn});
})(globalThis.__VL__ ||= {});
