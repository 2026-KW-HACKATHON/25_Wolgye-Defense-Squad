import React,{useEffect,useState} from 'react';

async function record(placeId,details){const response=await fetch(`/api/owner/views/${encodeURIComponent(placeId)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({details})});if(!response.ok)throw new Error('조회 정보를 반영하지 못했어요.');}
// 로그인한 이용자가 프로필에 연령대·성별을 남겼다면 그 값만 함께 보낸다(서버가 허용된 값만 저장).
export function recordPlaceView(placeId,profile){record(placeId,profile?{age:profile.ageGroup||undefined,gender:profile.gender||undefined}:undefined).catch(()=>{});}

export default function PlaceMarketing({placeId}){
 const [items,setItems]=useState([]);
 useEffect(()=>{let live=true;fetch(`/api/owner/campaigns/${encodeURIComponent(placeId)}`).then(r=>r.json()).then(d=>{if(live)setItems(d.items||[]);}).catch(()=>{});return()=>{live=false;};},[placeId]);
 return <><h3>사장님이 전하는 캠페인</h3>{items.length?items.map(c=><article className="place-update" key={c.id}><b>{c.title}</b><p>{c.body}</p><small>사장님 계정에서 게시 · {new Date(c.updatedAt).toLocaleDateString('ko-KR')}</small>{c.proposalId&&<img className="upload-preview" src={`/api/owner/campaigns/${encodeURIComponent(placeId)}/${c.id}/image`} alt="사장님이 승인한 AI 홍보 이미지"/>}</article>):<p className="muted">아직 사장님 캠페인이 없어요.</p>}</>;
}
