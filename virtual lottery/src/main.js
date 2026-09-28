(function bootstrapVirtualLottery(VL){'use strict';
 if(location.hostname==='www.lotterypost.com'){VL.handleExtraTab();return}
 if(!/^(www\.)?roversport\.(lol|net)$/.test(location.hostname))return;
 const style=document.createElement('style');style.id='vl-styles';style.textContent=VL.UI_CSS;if(!document.querySelector('#vl-styles'))document.head.appendChild(style);
 const storage=VL.createGMStorage(),settingsStore=VL.createSettingsStore(storage,VL.LOTTERY_REGISTRY),stateStore=VL.createStateStore(storage,{retentionDays:7});const now=VL.createRDClock();stateStore.migrateLegacyBrazil(now.dateIso,Object.keys(VL.LOTTERY_REGISTRY.brazil.draws));stateStore.gc(now.dateIso);
 const sources=VL.createSourceAdapters(),reader=VL.createRoverReader(),processor=VL.createRoverProcessor(),logger=VL.createLogger('[AUTO]');const engine=VL.createAutoEngine({registry:VL.LOTTERY_REGISTRY,settingsStore,stateStore,sourceAdapters:sources,roverReader:reader,roverProcessor:processor,verifier:VL.verifyProcessed,logger});
 const manual=VL.createManualController({root:document,registry:VL.LOTTERY_REGISTRY,sourceAdapters:sources});
 const ensure=()=>{manual.installButtons();manual.installDateListener();VL.ensureToolbar({root:document,settingsStore,stateStore,registry:VL.LOTTERY_REGISTRY,onSettingsChanged:()=>engine.onSettingsChanged()})};ensure();engine.start();
 const observer=new MutationObserver(()=>manual.scheduleReinjection(ensure));observer.observe(document.documentElement,{childList:true,subtree:true});
})(globalThis.__VL__ ||= {});
