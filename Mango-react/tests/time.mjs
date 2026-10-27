// Deterministic fixture day without freezing timer progress.
export function clockSource(target = "window.Date") {
  if (target === "lexical")
    return `const MangoNativeDate=globalThis.Date;const mangoDateOffset=MangoNativeDate.parse('2026-10-27T17:00:00Z')-MangoNativeDate.now();const Date=class extends MangoNativeDate{constructor(...args){super(...(args.length?args:[MangoNativeDate.now()+mangoDateOffset]));}static now(){return MangoNativeDate.now()+mangoDateOffset;}};`;
  return `(()=>{const NativeDate=globalThis.Date;const offset=NativeDate.parse('2026-10-27T17:00:00Z')-NativeDate.now();${target}=class extends NativeDate{constructor(...args){super(...(args.length?args:[NativeDate.now()+offset]));}static now(){return NativeDate.now()+offset;}};})();`;
}
