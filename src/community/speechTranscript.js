// Each event contains the whole session, including revised interim results.
// Rebuild from the original input instead of appending every partial event.
export function speechText(base,results,maxLength=2000){
  const transcript=Array.from(results,r=>r[0]?.transcript||'').join(' ').trim();
  return (base.trimEnd()+(base.trim()&&transcript?'\n':'')+transcript).slice(0,maxLength);
}
