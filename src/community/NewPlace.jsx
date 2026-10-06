import React,{useState} from 'react';
import LocationMap from './LocationMap';
import {communityApi} from './contributions';
export default function NewPlace({onAdded,onCancel}){
  const [point,setPoint]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[duplicate,setDuplicate]=useState(null);
  return <form className="new-place-form" onSubmit={async e=>{e.preventDefault();if(!point)return;const f=new FormData(e.currentTarget);setBusy(true);setError('');setDuplicate(null);try{const d=await communityApi('/places','POST',{...Object.fromEntries(f),...point});onAdded(d.place);}catch(e){setError(e.message);setDuplicate(e.duplicate);}finally{setBusy(false);}}}>
    <span className="eyebrow">ADD A LOCAL PLACE</span><h2>골목의 가게를 알려주세요</h2><p>아직 없는 가게를 지도에 추가해요. 등록 후 사진과 소식을 보탤 수 있어요.</p>
    <label>가게 이름<input name="name" required maxLength={70}/></label><label>업종<input name="kind" required maxLength={40} placeholder="예: 한식, 카페"/></label><label>주소<input name="address" required maxLength={160} placeholder="도로명·건물 번호 또는 정확한 위치 설명"/></label><label>전화번호 (선택)<input name="phone" type="tel" maxLength={30}/></label>
    <h3>지도에서 가게 위치를 눌러주세요</h3><LocationMap onPick={setPoint} selected={point}/><p>{point?'위치를 선택했어요. 실제 가게 위치인지 확인해 주세요.':'월계1동 경계 안에서 선택할 수 있어요.'}</p>
    <p className="muted">이웃 등록 · 확인 전으로 공개됩니다. 사장님 인증이나 방문 인증이 되지는 않아요.</p>{error&&<p role="alert">{error}</p>}{duplicate&&<button type="button" className="button outline" onClick={()=>onAdded(duplicate)}>기존 {duplicate.name} 선택</button>}
    <div className="row"><button type="button" className="button outline" onClick={onCancel}>돌아가기</button><button className="button dark" disabled={!point||busy}>{busy?'저장 중…':'장소 등록'}</button></div>
  </form>;
}
