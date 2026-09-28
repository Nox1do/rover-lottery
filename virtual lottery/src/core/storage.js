(function (VL) {
  'use strict';
  function createGMStorage(api=globalThis) {
    return {
      get(key,fallback){ try { const value=api.GM_getValue(key,fallback); return value === undefined ? fallback : value; } catch { return fallback; } },
      set(key,value){ return api.GM_setValue(key,value); },
      delete(key){ return api.GM_deleteValue(key); }
    };
  }
  VL.createGMStorage=createGMStorage;
})(globalThis.__VL__ ||= {});
