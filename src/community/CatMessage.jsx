import React from 'react';

// 골목냥 캐릭터. mood: happy(기본) | sleep(붐빔) | confused(못 찾음) | wifi(연결 끊김) | search(찾는 중)
export function GolmokCat({mood='happy',size=80}){
  const eyes=mood==='sleep'
    ?<><path d="M58 86 Q66 80 74 86" stroke="#173d32" strokeWidth="4" fill="none" strokeLinecap="round"/><path d="M96 86 Q104 80 112 86" stroke="#173d32" strokeWidth="4" fill="none" strokeLinecap="round"/></>
    :<><circle cx="66" cy="86" r="6" fill="#173d32"/><circle cx="104" cy="86" r="6" fill="#173d32"/><circle cx="68" cy="84" r="2" fill="#fff"/><circle cx="106" cy="84" r="2" fill="#fff"/></>;
  const mouth=mood==='confused'?<path d="M78 104 Q85 99 92 104" stroke="#173d32" strokeWidth="3" fill="none" strokeLinecap="round"/>
    :mood==='wifi'?<ellipse cx="85" cy="103" rx="5" ry="4" fill="#173d32"/>
    :<path d="M80 98 Q85 103 90 98" stroke="#173d32" strokeWidth="3" fill="none" strokeLinecap="round"/>;
  const badge={sleep:'💤',confused:'❓',wifi:'📡',search:'🔍'}[mood];
  return <svg className={'golmok-cat mood-'+mood} viewBox="0 0 170 150" width={size} height={size*150/170} aria-hidden="true">
    <ellipse cx="85" cy="140" rx="48" ry="6" fill="#173d3218"/>
    <path d="M40 70 L48 30 L70 55 Z" fill="#f2a65a"/><path d="M130 70 L122 30 L100 55 Z" fill="#f2a65a"/>
    <path d="M47 40 L52 56 L62 54 Z" fill="#f8c99a"/><path d="M123 40 L118 56 L108 54 Z" fill="#f8c99a"/>
    <ellipse cx="85" cy="95" rx="55" ry="45" fill="#f6b56b"/><ellipse cx="85" cy="105" rx="34" ry="28" fill="#fde3c0"/>
    {eyes}{mouth}
    <circle cx="56" cy="99" r="6" fill="#f48b7a" opacity=".45"/><circle cx="114" cy="99" r="6" fill="#f48b7a" opacity=".45"/>
    {badge&&<text x="122" y="42" fontSize="24">{badge}</text>}
  </svg>;
}

// 오류·빈 결과·기다림을 골목냥이 말해준다. actions: [{label,onClick,soft}]
export default function CatMessage({mood,title,body,actions=[],progress=false}){
  return <div className={'cat-message mood-'+mood} role={mood==='search'||mood==='sleep'?'status':'alert'}>
    <GolmokCat mood={mood}/>
    <div><b>{title}{(mood==='search'||mood==='sleep')&&<span className="cat-dots"/>}</b>{body&&<p>{body}</p>}
      {progress&&<div className="cat-progress"><i/></div>}
      {actions.length>0&&<div className="cat-actions">{actions.map(a=><button key={a.label} type="button" className={'button '+(a.soft?'outline':'dark')} onClick={a.onClick}>{a.label}</button>)}</div>}
    </div>
  </div>;
}
