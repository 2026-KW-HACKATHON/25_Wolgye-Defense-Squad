import React,{useEffect,useState} from 'react';
import {communityApi} from './contributions';
import LocationMap from './LocationMap';
const PAGE=6;
// 비어 있는 가게 정보 항목. 메뉴·가격 소식이 있으면 메뉴는 채워진 것으로 본다.
const missing=(p,posts)=>[!p.info?.fields?.menu&&!posts.some(n=>n.placeId===p.id&&n.type==='메뉴·가격')&&'메뉴·가격',!p.info?.fields?.hours&&'영업시간'].filter(Boolean);
// 날짜마다 바뀌는 순서. 같은 날에는 누가 봐도 같은 순서라 목록이 갑자기 바뀌지 않는다.
const dailyRank=id=>{let h=2166136261;for(const c of new Date().toLocaleDateString('sv-SE')+id)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;};
// 내 기여 게이지가 채워지는 목표. 목표에 닿으면 다음 목표로 넘어간다.
const GOALS=[5,10,20,50,100];
function ContributionPill({user,places,onLogin}){
  const [stats,setStats]=useState(null);
  useEffect(()=>{let live=true;communityApi('/contributions').then(d=>{if(live)setStats(d);}).catch(()=>{});return()=>{live=false;};},[user?.id,places]);
  if(!stats)return null;
  const people=stats.contributors,mine=stats.mine;
  const together=people?`이웃 ${people}명이 함께 채우는 중`:'첫 번째로 동네 정보를 채워보세요';
  if(!user||!mine)return <div className="contrib-pill"><i className="dot"/><span>{people?<>이웃 <b>{people}명</b>이 함께 동네 정보를 채우고 있어요</>:together}</span><button className="contrib-cta" onClick={onLogin}>나도 보태기</button></div>;
  const total=mine.places+mine.posts+mine.added,goal=GOALS.find(g=>g>total)||total||1;
  return <div className="contrib-pill"><span className="ring" style={{'--p':`${Math.round(total/goal*100)}%`}} title={`다음 목표 ${goal}건`}><b>{total}</b></span>
    <span>{total?<>내 기여 <b>{total}건</b> · 정보 {mine.places}곳, 소식 {mine.posts}개{mine.added?`, 새 장소 ${mine.added}곳`:''}</>:'첫 정보를 보태보세요'}{people>0&&<em> · {together}</em>}</span></div>;
}
export default function Discovery({places,posts,saved,user,onLogin,onPlace,onAdd,onContribute}){
  const [filter,setFilter]=useState('정보 보태기'),[page,setPage]=useState(0);
  // 정보 보태기: 관심(이웃 소식)은 있는데 정보가 빈 가게 → 확인 전 새 가게 → 나머지는 날짜별로 섞어 6곳씩.
  const needed=places.filter(p=>missing(p,posts).length).map(p=>({p,score:(posts.some(n=>n.placeId===p.id)?2:0)+(p.source==='이웃 등록'?1:0),rank:dailyRank(p.id)})).sort((a,b)=>b.score-a.score||a.rank-b.rank).map(x=>x.p);
  const pages=Math.max(1,Math.ceil(needed.length/PAGE));
  const shown=filter==='전체'?[]:filter==='최근 등록'?places.filter(p=>p.source==='이웃 등록'):filter==='저장한 가게'?places.filter(p=>saved.includes(p.id)):needed.slice((page%pages)*PAGE,(page%pages)*PAGE+PAGE);
  return <><div className="page-heading"><div className="badge-title"><h1>동네 <mark className="hl">발견</mark></h1><span className="title-badge">정보 필요 {needed.length}곳</span></div><button className="button lime" onClick={onAdd}>+ 새 장소 등록</button></div>
    <ContributionPill user={user} places={places} onLogin={onLogin}/>
    <LocationMap places={places} highlight={filter==='전체'?undefined:shown.map(p=>p.id)} onPlace={onPlace}/>{filter!=='전체'&&<p className="muted map-legend"><span className="legend-dot"/>아래 목록의 가게 · 진한 점은 동네의 다른 가게</p>}
    <div className="filter-tabs discovery-filters">{['정보 보태기','전체','최근 등록','저장한 가게'].map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    {filter==='전체'?<p className="muted section-note all-note">지도에서 동네 가게 {places.length}곳을 모두 보여줘요. 점을 누르면 가게 정보를 볼 수 있어요. 정보가 필요한 가게를 보려면 ‘정보 보태기’를 눌러주세요.</p>:<><div className="section-heading"><h2>{filter==='정보 보태기'?'오늘 정보가 필요한 가게':filter} <span>{filter==='정보 보태기'?`${shown.length} / ${needed.length}`:shown.length}</span></h2>{filter==='정보 보태기'&&needed.length>PAGE&&<button className="button outline" onClick={()=>setPage(x=>x+1)}>다른 가게 {PAGE}곳 보기</button>}</div>
    {filter==='정보 보태기'&&<p className="muted section-note">정보 보태기는 메뉴·가격이나 영업시간이 비어 있는 가게를 하루 단위로 골라 6곳씩 보여줘요. 등록이나 소식 작성으로 방문 도장·리워드가 지급되지는 않습니다.</p>}
    {!shown.length&&<p>아직 해당하는 가게가 없어요. 새 장소를 등록하거나 가게를 저장해 보세요.</p>}
    <div className="places-grid">{shown.map(p=><article key={p.id} className="discovery-card"><span className="pill">{p.source==='이웃 등록'?'이웃 등록 · 확인 전':missing(p,posts).length?`${missing(p,posts).join(', ')} 필요`:'정보 있음'}</span><h3>{p.name}</h3><p>{p.kind} · {p.address}</p><div className="row"><button className="text-link" onClick={()=>onPlace(p.id)}>가게 살펴보기</button><button className="button outline" onClick={()=>onContribute(p.id)}>정보 보태기</button></div></article>)}</div></>}
  </>;
}
