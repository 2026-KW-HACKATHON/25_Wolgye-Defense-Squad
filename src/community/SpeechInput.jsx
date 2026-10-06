import React,{useEffect,useRef,useState} from 'react';
import {Mic,Square} from 'lucide-react';
import {speechText} from './speechTranscript';
export default function SpeechInput({value,onChange,maxLength=2000,disabled=false,className='text-link'}){
  const recognition=useRef(null),expected=useRef(value),callback=useRef(onChange),preview=useRef(null);
  const [listening,setListening]=useState(false),[status,setStatus]=useState('');
  callback.current=onChange;
  function cancel(){const r=recognition.current;recognition.current=null;if(r){r.onresult=null;r.onend=null;r.onerror=null;r.abort();}setListening(false);}
  useEffect(()=>()=>{const r=recognition.current;if(r){r.onresult=null;r.onend=null;r.onerror=null;r.abort();}},[]);
  useEffect(()=>{if(recognition.current&&value!==expected.current){cancel();setStatus('직접 수정한 내용을 유지했어요.');}},[value]);
  useEffect(()=>{if(disabled&&recognition.current){cancel();setStatus('입력된 내용을 사용합니다.');}},[disabled]);
  useEffect(()=>{if(preview.current)preview.current.scrollTop=preview.current.scrollHeight;},[value]);
  function toggle(){
    if(recognition.current){recognition.current.stop();return;}
    const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!Recognition){setStatus('이 브라우저는 음성 입력을 지원하지 않아요. Chrome에서 열거나 글로 입력해 주세요.');return;}
    const r=new Recognition();const base=value;expected.current=value;recognition.current=r;
    r.lang='ko-KR';r.continuous=true;r.interimResults=true;
    r.onresult=e=>{if(recognition.current!==r)return;const text=speechText(base,e.results,maxLength);expected.current=text;callback.current(text);if(text.length>=maxLength){setStatus('입력 가능한 글자 수에 도달했어요.');r.stop();}};
    r.onerror=e=>{if(recognition.current!==r)return;setStatus(e.error==='not-allowed'?'마이크 권한을 허용해 주세요.':e.error==='no-speech'?'음성이 들리지 않았어요. 다시 눌러 말씀해 주세요.':'음성 연결을 확인한 뒤 다시 시도해 주세요.');};
    r.onend=()=>{if(recognition.current!==r)return;recognition.current=null;setListening(false);setStatus(s=>s==='듣고 있어요. 말하는 내용이 입력창에 바로 표시됩니다.'?'입력된 내용을 확인하고 수정해 주세요.':s);};
    try{r.start();setListening(true);setStatus('듣고 있어요. 말하는 내용이 입력창에 바로 표시됩니다.');}catch{recognition.current=null;setListening(false);setStatus('마이크를 시작하지 못했어요. 다시 시도해 주세요.');}
  }
  return <div className={'speech-control '+(listening?'is-listening':'')}><button type="button" className={className} disabled={disabled&&!listening} aria-pressed={listening} onClick={toggle}>{listening?<Square size={24}/>:<Mic size={24}/>}<span><strong>{listening?'입력 마치기':'말로 입력'}</strong>{className.includes('post-voice')&&<small>{listening?'말하는 내용을 바로 표시해요':'누르고 말씀해 주세요'}</small>}</span></button>{listening&&<div className="speech-preview" ref={preview} aria-label="실시간 음성 입력 미리보기"><small>실시간 입력</small><p>{value||'말씀해 주세요…'}</p></div>}{status&&<small className="speech-status" role="status">{status}</small>}</div>;
}
