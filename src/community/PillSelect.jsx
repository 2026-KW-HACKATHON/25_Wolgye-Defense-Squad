import React,{useEffect,useRef,useState} from 'react';
import {Check,ChevronDown} from 'lucide-react';

// 둥근 드롭다운. 브라우저 기본 select 목록은 모양을 바꿀 수 없어서 직접 그린다.
// options: ['한식',...] 또는 [{value:'name',label:'이름순'},...]
export default function PillSelect({value,options,onChange,label,disabled=false}){
 const items=options.map(o=>typeof o==='string'?{value:o,label:o}:o);
 const [open,setOpen]=useState(false),[active,setActive]=useState(0);
 const box=useRef(null),list=useRef(null);
 const current=items.find(o=>o.value===value)||items[0];
 useEffect(()=>{
  if(!open)return;
  setActive(Math.max(0,items.findIndex(o=>o.value===value)));
  const close=e=>{if(!box.current?.contains(e.target))setOpen(false);};
  document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);
 },[open]);
 useEffect(()=>{if(open)list.current?.children[active]?.scrollIntoView({block:'nearest'});},[active,open]);
 const choose=o=>{onChange(o.value);setOpen(false);};
 function onKey(e){
  if(e.key==='Escape'){setOpen(false);return;}
  if(!open&&['ArrowDown','ArrowUp','Enter',' '].includes(e.key)){e.preventDefault();setOpen(true);return;}
  if(!open)return;
  if(e.key==='ArrowDown'){e.preventDefault();setActive(i=>Math.min(items.length-1,i+1));}
  if(e.key==='ArrowUp'){e.preventDefault();setActive(i=>Math.max(0,i-1));}
  if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(items[active]);}
 }
 return <div className={'pill-select'+(open?' open':'')} ref={box}>
  <button type="button" className="pill-select-button" aria-haspopup="listbox" aria-expanded={open} aria-label={label} disabled={disabled} onClick={()=>setOpen(o=>!o)} onKeyDown={onKey}>
   <span className="pill-select-label">{items.map(o=><span key={o.value} aria-hidden={o.value!==current?.value} className={o.value===current?.value?'':'ghost'}>{o.label}</span>)}</span><ChevronDown size={16} aria-hidden="true"/>
  </button>
  {open&&<ul className="pill-select-menu" role="listbox" aria-label={label} ref={list}>
   {items.map((o,i)=><li key={o.value} role="option" aria-selected={o.value===value} className={(o.value===value?'selected ':'')+(i===active?'active':'')} onPointerEnter={()=>setActive(i)} onClick={()=>choose(o)}>
    <span>{o.label}</span>{o.value===value&&<Check size={16} aria-hidden="true"/>}
   </li>)}
  </ul>}
 </div>;
}
