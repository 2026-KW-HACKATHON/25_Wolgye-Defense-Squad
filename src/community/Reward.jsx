import React,{useEffect,useState} from 'react';
import {accountRequest} from './authClient';
import {GolmokCat} from './CatMessage';

// 골목냥 키우기: 동네에 정보를 보태 밥알을 모으고, 밥을 주면 골목냥이 자란다. 레벨이 오르면 사장님이 등록한 단골 쿠폰이 열린다.
const LINES={hungry:['배고프다냥… 메뉴판 정보 먹고 싶다냥!','오늘은 어떤 가게 이야기 들려줄 거냥?'],fed:['냠냠! 고맙다냥 💚','배부르다냥~ 골목 한 바퀴 돌고 올게냥'],full:['밥알을 모으면 밥 줄 수 있다냥','정보 하나 보태 주면 밥알이 생긴다냥!']};
const pick=list=>list[Math.floor(Math.random()*list.length)];

export default function Reward({onExplore,onCompose}){
  const [data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[line,setLine]=useState(pick(LINES.hungry)),[eating,setEating]=useState(false),[celebrate,setCelebrate]=useState('');
  const call=async(path,method='GET')=>{setBusy(true);setError('');try{const d=await accountRequest('/api/rewards'+path,{method});setData(d);return d;}catch(e){setError(e.message);}finally{setBusy(false);}};
  useEffect(()=>{call('');},[]);
  if(!data)return <p className="muted">{error||'골목냥을 데려오는 중이에요…'}</p>;
  const {rules}=data,checked=data.today.keys.includes('checkin'),canFeed=data.bap>=rules.feed;
  const prev=data.levels.find(l=>l.level===data.level).xp,progress=data.nextXp?Math.round((data.xp-prev)/(data.nextXp-prev)*100):100;
  async function feed(){const d=await call('/feed','POST');if(!d)return;setEating(true);setLine(pick(LINES.fed));setTimeout(()=>setEating(false),900);if(d.levelUp)setCelebrate(`🎉 골목냥이 ${d.levelName}이 됐어요!`);}
  async function checkin(){const d=await call('/checkin','POST');if(d?.earned)setLine(`출석 고맙다냥! 밥알 +${d.earned}`);}
  async function use(c){if(!window.confirm(`${c.placeName} · ${c.title}\n\n가게 직원 앞에서 눌러 주세요. 사용 처리할까요?`))return;const d=await call(`/coupons/${c.id}/use`,'POST');if(d)setCelebrate(`✅ ${c.placeName} 쿠폰을 사용했어요. 직원에게 이 화면을 보여주세요.`);}
  const missions=[
    {key:'checkin',icon:'✅',label:'출석하기',amount:rules.checkin,done:checked,action:checked?null:{label:'출석',onClick:checkin}},
    {key:'info',icon:'🍜',label:'정보가 필요한 가게 채우기',amount:rules.info,done:data.today.keys.some(k=>k.startsWith('info:')),action:{label:'보태러 가기',onClick:onExplore}},
    {key:'photo',icon:'📷',label:'사진과 함께 소식 올리기',amount:rules.photoPost,action:{label:'올리기',onClick:onCompose}},
    {key:'post',icon:'📝',label:'소식 올리기',amount:rules.post,action:{label:'올리기',onClick:onCompose}}
  ];
  return <>
    <div className="page-heading"><div className="badge-title"><h1>골목냥 <mark className="hl">키우기</mark></h1><span className="title-badge">Lv.{data.level} {data.levelName}</span></div></div>
    {celebrate&&<div className="reward-celebrate" role="status" onClick={()=>setCelebrate('')}>{celebrate}</div>}
    <section className="pet-card">
      <span className="pet-speech">{canFeed?line:data.bap?pick(LINES.full):line}</span>
      <div className={'pet-stage'+(eating?' eating':'')}><GolmokCat mood="happy" size={170}/>{eating&&<span className="pet-yum">냠냠 🍚</span>}</div>
      <div className="pet-stats"><span>🍚 밥알 <b>{data.bap}</b></span><span>{data.nextXp?`${data.nextName}까지 ${data.nextXp-data.xp}`:'최고 레벨이에요!'}</span></div>
      <div className="pet-bar"><i style={{width:`${progress}%`}}/></div>
      <button className="button dark pet-feed" disabled={busy||!canFeed} onClick={feed}>🍚 밥 주기 (밥알 {rules.feed})</button>
      {!canFeed&&<small className="muted">밥알 {rules.feed - data.bap}개를 더 모으면 밥을 줄 수 있어요.</small>}
    </section>
    {error&&<p className="notice" role="alert">{error}</p>}
    <section className="rw-card"><div className="row"><h3>오늘의 미션</h3><small className="muted">오늘 {data.today.earned} / {rules.dailyCap}</small></div>
      {missions.map(m=><div key={m.key} className={'mission'+(m.done?' done':'')}><span className="ic">{m.icon}</span><span className="mission-label">{m.label}</span><b>+{m.amount}</b>{m.action&&!m.done&&<button className="button outline" onClick={m.action.onClick} disabled={busy}>{m.action.label}</button>}</div>)}
      <p className="muted reward-rule">같은 가게 정보는 하루 1번, 하루 최대 {rules.dailyCap}개까지 모을 수 있어요. 지워진 글의 밥알은 회수돼요.</p>
    </section>
    <section className="rw-card"><h3>동네 쿠폰함</h3>
      {!data.coupons.length&&<p className="muted">아직 등록된 쿠폰이 없어요. 사장님이 사장님 공간에서 단골 쿠폰을 등록하면 여기에 열려요.</p>}
      {data.coupons.map(c=><div key={c.id} className={'coupon'+(c.unlocked?'':' locked')+(c.used?' used':'')}><div><b>{c.placeName}</b><p>{c.title}{c.demo&&<em> · 시연용 예시</em>}</p></div>
        {c.used?<span className="coupon-state">사용 완료</span>:c.unlocked?<button className="button dark" disabled={busy} onClick={()=>use(c)}>사용하기</button>:<span className="coupon-state">🔒 Lv.{c.minLevel}</span>}</div>)}
    </section>
    {data.ledger.length>0&&<section className="rw-card"><h3>최근 밥알</h3>{data.ledger.map((e,i)=><div key={i} className="ledger-row"><span>{e.reason}</span><b className={e.amount<0?'minus':''}>{e.amount>0?'+':''}{e.amount}</b></div>)}</section>}
  </>;
}
