import React,{useState} from 'react';
import {communityApi} from './contributions';

export const INFO_FIELDS=[['menu','메뉴·가격','예: 칼국수 8,000원 / 수제비 8,000원',500],['hours','영업시간','예: 매일 11:00~21:00, 월요일 휴무',200],['notice','기타 안내','예: 주차 2대 가능, 단체 예약 가능',300]];
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});

export function RoleBadge({role}){
 return role==='owner'?<span className="role-badge owner">사장님</span>:<span className="role-badge">이웃</span>;
}

export function PlaceInfoView({place,onEdit}){
 const fields=place.info?.fields||{},history=place.info?.history||[];
 return <section className="place-info">
  <div className="row"><h3>가게 정보</h3><button className="text-link" onClick={onEdit}>정보 수정하기</button></div>
  <div className="fact-list">
   <div><span>주소</span><b>{place.address}</b></div>
   <div><span>전화</span><b>{place.phone||'등록 정보 없음'}</b></div>
   {INFO_FIELDS.map(([key,label])=>{const f=fields[key];return <div key={key}><span>{label}</span>{f?<b className="info-value">{f.value}<small><RoleBadge role={f.role}/> {f.author} · {f.observedAt} 확인{f.role!=='owner'&&' · 사장님 확인 전'}</small></b>:<b className="unknown">아직 정보가 없어요</b>}</div>;})}
  </div>
  {!!history.length&&<details className="recommendation-info"><summary>수정 기록 ({history.length})</summary>{history.map((h,i)=><article className="place-update" key={i}><b>{INFO_FIELDS.find(f=>f[0]===h.field)?.[1]||h.field}</b><p>{h.before||'(없음)'} → {h.after||'(삭제)'}</p><small><RoleBadge role={h.role}/> {h.author} · {h.observedAt} 확인</small></article>)}</details>}
 </section>;
}

export function PlaceInfoForm({place,isOwner,onSaved}){
 const fields=place.info?.fields||{};
 const [values,setValues]=useState(()=>Object.fromEntries(INFO_FIELDS.map(([key])=>[key,fields[key]?.value||''])));
 const [observedAt,setObservedAt]=useState(today()),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 async function submit(e){
  e.preventDefault();setSaving(true);setError('');
  try{const d=await communityApi(`/places/${encodeURIComponent(place.id)}/info`,'PUT',{fields:values,observedAt});await onSaved(d?.earned||0);}
  catch(err){setError(err.message);}finally{setSaving(false);}
 }
 return <form onSubmit={submit}>
  <span className="eyebrow">{place.name}</span><h2>가게 정보 수정</h2>
  <p>{isOwner?'사장님 계정으로 수정하면 ‘사장님’ 표시가 붙어요.':'누구나 고칠 수 있어요. 이웃이 고친 정보는 ‘이웃 · 사장님 확인 전’으로 표시돼요.'} 바뀐 항목만 기록에 남아요.</p>
  {INFO_FIELDS.map(([key,label,placeholder,max])=><label key={key}>{label}<textarea maxLength={max} placeholder={placeholder} value={values[key]} onChange={e=>setValues(v=>({...v,[key]:e.target.value}))}/></label>)}
  <label>직접 확인한 날짜<input type="date" required max={today()} value={observedAt} onChange={e=>setObservedAt(e.target.value)}/></label>
  {error&&<p role="alert">{error}</p>}
  <button className="button dark full" disabled={saving}>{saving?'저장 중…':'정보 저장'}</button>
 </form>;
}
