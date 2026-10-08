import {expand} from './groupRecommend.js';
// Lexical retrieval: no embeddings and no inferred shop facts.
const stop = new Set(['식당','가게','추천','해주세요','싶어요','먹고','있는','참가자']);
export function inspectConditions(message, place) {
  const checks=[];
  for(const category of ['카페','술집','한식','중식','일식','분식']) {
    if(new RegExp(`${category}(?:는|은|을|를)?\\s*(?:제외(?:해|하자|$|[,.!\\s])|빼줘|말고|싫어)`).test(message)
      && !new RegExp(`${category}(?:는|은|을|를)?\\s*제외\\s*하지`).test(message)) {
      checks.push({label:`${category} 제외`,status:String(place.category||place.kind||'').includes(category)?'violated':'unknown'});
    }
  }
  if(/원|예산|저렴|가격/.test(message))checks.push({label:'예산·메뉴 가격',status:'unknown'});
  if(/분|시간|빨리|복귀/.test(message))checks.push({label:'이동·대기·식사 시간',status:'unknown'});
  if(/조용|대화|분위기|시끄/.test(message))checks.push({label:'소음·분위기',status:'unknown'});
  if(/예약|자리|좌석|명/.test(message))checks.push({label:'좌석·예약',status:'unknown'});
  if(/알레르기|알러지|채식|못 먹/.test(message))checks.push({label:'식재료·식단 제한',status:'unknown'});
  return checks;
}
function tokens(text) {
  return [...new Set(String(text || '').toLowerCase().match(/[가-힣a-z0-9]+/g)?.flatMap(word => {
    if (stop.has(word)) return [];
    return word.length > 2 ? [word, ...Array.from({length:word.length-1},(_,i)=>word.slice(i,i+2))] : [word];
  }) || [])];
}
export function retrieveCommunity(message, places, now=Date.now()) {
  // "국물"처럼 가게 업종에 직접 나오지 않는 표현은 모임 추천과 같은 사전으로 넓혀 검색한다.
  const query=tokens(`${message} ${(String(message).match(/[가-힣]+/g)||[]).flatMap(w=>expand(w).slice(1)).join(' ')}`);
  const docs=places.flatMap(p=>[
    {placeId:p.id,text:`${p.name} ${p.kind} ${p.category||''}`,source:'listing'},
    ...(p.reports||[]).map(report=>({placeId:p.id,text:report.body,source:'report',report}))
  ]).map(d=>({...d,terms:tokens(d.text)}));
  const avg=docs.reduce((n,d)=>n+d.terms.length,0)/Math.max(docs.length,1);
  const df=new Map(query.map(t=>[t,docs.filter(d=>d.terms.includes(t)).length]));
  const ranked=docs.map(d=>{
    const score=query.reduce((sum,t)=>sum+(d.terms.includes(t)?Math.log(1+(docs.length-df.get(t)+0.5)/(df.get(t)+0.5))*2.2/(1+1.2*(0.25+0.75*d.terms.length/Math.max(avg,1))):0),0);
    const age=(now-Date.parse(d.report?.observedAt))/86400000;
    // Recency only breaks relevance ties; a new unrelated post cannot become evidence.
    const freshness=Number.isFinite(age)&&age>=0?1/(1+age/30):0;
    return {...d,score:score*(1+0.1*freshness)};
  }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score);
  const byPlace=new Map();
  for(const d of ranked){
    if(!byPlace.has(d.placeId))byPlace.set(d.placeId,{score:d.score,reports:[]});
    const item=byPlace.get(d.placeId);
    if(d.report&&item.reports.length<3)item.reports.push(d.report);
  }
  const items=[...byPlace].map(([id,retrieval])=>{
    const place=places.find(p=>p.id===id);
    return {...place,reports:retrieval.reports,retrievalScore:retrieval.score,conditionChecks:inspectConditions(message,place)};
  }).filter(p=>!p.conditionChecks.some(c=>c.status==='violated')).slice(0,15);
  return {items,method:'lexical-bm25',searchedPlaces:places.length,searchedDocuments:docs.length};
}
