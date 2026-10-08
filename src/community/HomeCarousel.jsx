import React,{useEffect,useRef,useState} from 'react';
import {NotebookPen,Plus,House} from 'lucide-react';
import {RoleBadge} from './PlaceInfo';

// 메인 상단에서 옆으로 넘겨보는 배너. 장을 추가하거나 글귀를 바꾸려면 아래 slides만 고치면 된다.
// 배경 사진: public/community/wolgye/ 에 사진을 넣고 BACKGROUNDS에 파일 이름을 적는다. 남이 찍은 사진이면 credit에 출처를 적는다.
const BACKGROUNDS={post:null,owner:null}; // 예: post:{src:'/community/wolgye/alley.jpg',credit:''}
export default function HomeCarousel({post,place,onOpenPost,onCompose,onOwner}){
 const slides=[
  post?{key:'post',onClick:()=>onOpenPost(post),image:post.image,icon:<NotebookPen size={56}/>,
    kicker:`방금 올라온 소식 · ${post.type}`,title:post.title,body:post.body,
    meta:<><RoleBadge role={post.authorRole}/> {post.author}{place?` · ${place.name}`:''} · {post.observedAt} 확인</>}
   :{key:'post',onClick:onCompose,icon:<Plus size={56}/>,background:BACKGROUNDS.post,kicker:'아직 올라온 소식이 없어요',
    title:<>첫 번째 골목 소식을<br/>남겨주세요</>,body:'새 메뉴, 달라진 가격, 오늘의 영업 소식처럼 직접 확인한 이야기를 이웃에게 전해요.'},
  {key:'owner',tone:'dark',onClick:onOwner,background:BACKGROUNDS.owner,icon:<House size={56}/>,kicker:'사장님이신가요?',
    title:<>우리 가게 소식,<br/>사장님이 직접 알려주세요</>,body:'가게 관리 권한을 받으면 메뉴·영업시간에 ‘사장님’ 표시가 붙고, AI로 홍보 문구와 이미지를 만들 수 있어요.'}
 ];
 const track=useRef(null),[index,setIndex]=useState(0),[paused,setPaused]=useState(false);
 // 마우스 위치에 따라 카드가 살짝 기울고 빛이 반사된다(마우스를 쓰는 기기에서만).
 const tilt=e=>{if(!window.matchMedia?.('(hover: hover)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;const el=e.currentTarget,r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;el.style.setProperty('--ry',`${(x-.5)*5}deg`);el.style.setProperty('--rx',`${(.5-y)*5}deg`);el.style.setProperty('--gx',`${x*100}%`);el.style.setProperty('--gy',`${y*100}%`);};
 const untilt=e=>{for(const k of ['--rx','--ry'])e.currentTarget.style.setProperty(k,'0deg');};
 const goTo=i=>{const el=track.current;if(el)el.scrollTo({left:el.clientWidth*i,behavior:'smooth'});};
 // 6초마다 다음 장으로. 마우스를 올리거나 손가락을 대면 멈춘다.
 useEffect(()=>{
  if(paused||slides.length<2||window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)return;
  const timer=setInterval(()=>goTo((index+1)%slides.length),6000);return()=>clearInterval(timer);
 },[index,paused,slides.length]);
 return <section className="carousel-wrap" aria-roledescription="carousel" aria-label="골목 소식과 안내"
   onMouseEnter={()=>setPaused(true)} onMouseLeave={()=>setPaused(false)} onTouchStart={()=>setPaused(true)} onTouchEnd={()=>setTimeout(()=>setPaused(false),4000)}>
  <div className="carousel" ref={track} onScroll={e=>setIndex(Math.round(e.currentTarget.scrollLeft/Math.max(1,e.currentTarget.clientWidth)))}>
   {slides.map((s,i)=><button key={s.key} className={'featured'+(s.image||s.background?' photo':' empty')+(s.tone?' '+s.tone:'')} onClick={s.onClick} onMouseMove={tilt} onMouseLeave={untilt} aria-label={`${i+1}/${slides.length}`}>
    {s.image?<img src={s.image} alt=""/>:s.background?<img src={s.background.src} alt="월계1동 풍경"/>:<div className="featured-art"><span className="art-orb">{s.icon}</span></div>}{s.background?.credit&&<small className="photo-credit">{s.background.credit}</small>}<span className="glare" aria-hidden="true"/>
    <div className="featured-copy"><span className="featured-kicker">{s.kicker}</span><h2>{s.title}</h2><p>{s.body}</p>{s.meta&&<small>{s.meta}</small>}</div>
   </button>)}
  </div>
  <div className="carousel-dots">{slides.map((s,i)=><button key={s.key} className={i===index?'active':''} aria-label={`${i+1}번째 배너 보기`} onClick={()=>goTo(i)}/>)}</div>
 </section>;
}
