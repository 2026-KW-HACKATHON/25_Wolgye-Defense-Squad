import React,{useState} from 'react';
import LocationMap from './LocationMap';
export default function Discovery({places,posts,saved,onPlace,onAdd,onContribute}){
  const [filter,setFilter]=useState('정보 보태기');
  const shown=places.filter(p=>filter==='최근 등록'?p.source==='이웃 등록':filter==='저장한 가게'?saved.includes(p.id):!posts.some(n=>n.placeId===p.id&&n.type==='메뉴·가격'));
  return <><div className="page-heading"><div><span className="eyebrow">DISCOVER & CONTRIBUTE</span><h1>동네 발견<span className="lime-period">.</span></h1><p>몰랐던 가게를 만나고, 다음 이웃에게 필요한 정보를 남겨요.</p></div><button className="button lime" onClick={onAdd}>+ 새 장소 등록</button></div>
    <div className="discovery-intro"><b>한 장의 메뉴판이 다음 식사의 단서가 돼요.</b><p>정보가 부족한 가게를 살펴보고 방문했다면 메뉴·가격·영업 소식을 보태주세요.</p></div>
    <div className="filter-tabs discovery-filters">{['정보 보태기','최근 등록','저장한 가게'].map(f=><button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    <LocationMap places={shown} onPlace={onPlace}/><div className="section-heading"><h2>{filter} <span>{shown.length}</span></h2></div>
    {!shown.length&&<p>아직 해당하는 가게가 없어요. 새 장소를 등록하거나 가게를 저장해 보세요.</p>}
    <div className="places-grid">{shown.map(p=><article key={p.id} className="discovery-card"><span className="pill">{p.source==='이웃 등록'?'이웃 등록 · 확인 전':'메뉴·가격 소식 기다리는 중'}</span><h3>{p.name}</h3><p>{p.kind} · {p.address}</p><div className="row"><button className="text-link" onClick={()=>onPlace(p.id)}>가게 살펴보기</button><button className="button outline" onClick={()=>onContribute(p.id)}>정보 보태기</button></div></article>)}</div>
    <p className="muted">정보 보태기는 메뉴·가격 소식이 아직 없는 가게를 보여줘요. 등록이나 소식 작성으로 방문 도장·리워드가 지급되지는 않습니다.</p>
  </>;
}
