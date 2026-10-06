import React,{useEffect,useState} from 'react';
import {Users,Plus,Link,ArrowLeft,Check} from 'lucide-react';
import SpeechInput from './SpeechInput';
const KEY='wolgye-group-memberships-v1';
function stored(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch{return {};}}
export default function Groups({nickname}) {
  const [memberships,setMemberships]=useState(stored),[group,setGroup]=useState(null),[active,setActive]=useState(''),[name,setName]=useState(''),[nick,setNick]=useState(nickname),[code,setCode]=useState(()=>new URLSearchParams(location.search).get('group')||''),[condition,setCondition]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
  async function api(path,method='GET',body,token){
    const r=await fetch('/api/groups'+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(65000)});
    if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('모임 서버에 연결되지 않았어요. 잠시 후 다시 시도해 주세요.');
    const d=await r.json();if(!r.ok)throw new Error(d.error||'요청을 완료하지 못했어요.');return d;
  }
  const mine=memberships[active];
  const me=group?.members.find(m=>m.id===mine?.memberId);
  function accept(d){
    const next={...memberships,[d.group.id]:{token:d.token,memberId:d.memberId,name:d.group.name}};
    localStorage.setItem(KEY,JSON.stringify(next));setMemberships(next);setActive(d.group.id);setGroup(d.group);setCondition('');setError('');
  }
  async function perform(work){setBusy(true);setError('');setMessage('');try{await work();}catch(e){setError(e.name==='TimeoutError'?'응답이 지연되고 있어요. 다시 시도해 주세요.':e.message);}finally{setBusy(false);}}
  async function open(id){await perform(async()=>{const d=await api('/'+id,'GET',undefined,memberships[id].token);setActive(id);setGroup(d.group);setCondition(d.group.members.find(m=>m.id===memberships[id].memberId)?.condition||'');});}
  useEffect(()=>{
    if(!active||!mine||busy)return;
    let stopped=false,pending=false;
    const timer=setInterval(async()=>{if(pending)return;pending=true;try{const d=await api('/'+active,'GET',undefined,mine.token);if(!stopped){setGroup(d.group);setError('');}}catch(e){if(!stopped)setError(e.message);}finally{pending=false;}},3000);
    return()=>{stopped=true;clearInterval(timer);};
  },[active,mine?.token,busy]);
  const ready=group?.members.every(m=>m.condition);
  return <div className="groups-page">
    <div className="page-heading"><div><span className="eyebrow">BETTER TOGETHER</span><h1>각자의 조건을 모아,<br/>함께 골라요<span className="lime-period">.</span></h1><p>모임을 만들고 초대 코드를 나누세요. 각자 조건을 쓰고 함께 투표해요.</p></div></div>
    {error&&<div className="notice" role="alert">{error}</div>}{message&&<p role="status" className="notice">{message}</p>}
    {!group?<>
      <label>모임에서 사용할 닉네임<input value={nick} maxLength={30} onChange={e=>setNick(e.target.value)} /></label>
      <div className="group-grid">
        <form className="group-card" onSubmit={e=>{e.preventDefault();perform(async()=>accept(await api('/','POST',{name,nickname:nick})));}}><h2>새 모임</h2><label>모임 이름<input value={name} onChange={e=>setName(e.target.value)} required maxLength={40}/></label><button disabled={busy||!nick.trim()} className="button lime"><Plus size={18}/>모임 만들기</button></form>
        <form className="group-card" onSubmit={e=>{e.preventDefault();const id=code.trim().toUpperCase();if(memberships[id])open(id);else perform(async()=>accept(await api('/'+encodeURIComponent(id)+'/join','POST',{nickname:nick})));}}><h2>초대받았나요?</h2><label>초대 코드<input value={code} onChange={e=>setCode(e.target.value)} required maxLength={12}/></label><button disabled={busy||!nick.trim()} className="button outline"><Users size={18}/>모임 참여</button></form>
      </div><h2 className="section-title">내 모임</h2><div className="group-grid">{Object.entries(memberships).map(([id,m])=><button className="group-card" key={id} disabled={busy} onClick={()=>open(id)}><h3>{m.name}</h3><small>{id}</small></button>)}</div>
      <p className="muted">공유 주소에서 만든 모임은 초대 링크나 코드로 함께 참여할 수 있어요. 모임 코드를 아는 사람에게 참가 내용이 공유됩니다.</p>
    </>:<section className="group-workspace">
      <button className="text-link" onClick={()=>{setGroup(null);setActive('');setError('');}}><ArrowLeft size={18}/>모임 목록</button>
      <div className="section-heading"><h2>{group.name}</h2><button className="button outline" onClick={()=>perform(async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('group',group.id);await navigator.clipboard.writeText(url.toString());setMessage('초대 링크를 복사했어요. 받는 사람도 이 서버에 접속할 수 있어야 합니다.');})}><Link size={18}/>초대 링크 복사</button></div>
      <p>초대 코드 <strong>{group.id}</strong> · {group.members.length}명</p>
      <form onSubmit={e=>{e.preventDefault();perform(async()=>{const d=await api('/'+active+'/condition','PUT',{condition},mine.token);setGroup(d.group);setMessage('내 조건을 저장했어요. 조건이 바뀌면 이전 후보와 투표는 초기화됩니다.');});}}><label>{me?.name}님의 조건<textarea required maxLength={240} value={condition} onChange={e=>setCondition(e.target.value)} placeholder="원하는 조건을 자유롭게 적어주세요."/></label><SpeechInput value={condition} onChange={setCondition} maxLength={240} disabled={busy}/><button disabled={busy} className="button dark">내 조건 저장</button></form>
      <div className="group-members">{group.members.map(m=><div className="member-row" key={m.id}><b>{m.name}{m.id===mine.memberId?' (나)':''}</b><p>{m.condition||'조건 입력 중'}</p></div>)}</div>
      {group.ownerId===mine.memberId?<button className="button lime" disabled={busy||!ready} onClick={()=>perform(async()=>{const d=await api('/'+active+'/recommend','POST',{},mine.token);setGroup(d.group);})}>{busy?'처리 중…':'함께 갈 후보 찾기'}</button>:<p className="muted">모든 조건이 모이면 모임장이 후보를 만들어요.</p>}
      {!ready&&<p className="muted">아직 조건을 저장하지 않은 참가자가 있어요.</p>}
      {group.candidates&&<><details className="recommendation-info"><summary>추천 정보의 확인 범위</summary><p>{group.notice}</p></details>{!group.candidates.length?<p>현재 정보로 후보를 고르기 어려워요. 조건을 함께 확인해 주세요.</p>:<><h3>갈 수 있는 곳을 모두 선택하세요</h3><div className="group-grid">{group.candidates.map(p=>{const selected=group.votes[mine.memberId]?.includes(p.id);return <article key={p.id} className="group-card"><h3>{p.name}</h3><p>{p.kind} · {p.address}</p><div className="candidate-reason"><b>후보로 고른 이유</b><p>{p.reason||`등록 업종: ${p.kind}`}</p><p className="candidate-check">{p.checks||'세부 조건은 확인 필요'}</p>{p.status&&<span className="pill">이웃 등록 · 확인 전</span>}</div>{p.placeUrl&&<a href={p.placeUrl} target="_blank" rel="noreferrer">가게 정보 확인</a>}<p><strong>{Object.values(group.votes).filter(v=>v.includes(p.id)).length}표</strong></p><button className={'button '+(selected?'dark':'outline')} aria-pressed={!!selected} disabled={busy} onClick={()=>perform(async()=>{const old=group.votes[mine.memberId]||[];const ids=selected?old.filter(id=>id!==p.id):[...old,p.id];const d=await api('/'+active+'/vote','PUT',{ids,revision:group.revision},mine.token);setGroup(d.group);})}>{selected?<><Check size={16}/>선택 취소</>:'이 가게에 투표'}</button></article>;})}</div></>}</>}
    </section>}
  </div>;
}
