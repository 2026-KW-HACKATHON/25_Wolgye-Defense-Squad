import Login from './Login';
import PromoCardCanvas,{InstagramCarouselView} from './PromoCardCanvas';
import PlaceDetailPromos from './PlaceDetailPromos';
import Reward from './Reward';
import CatMessage from './CatMessage';
import PillSelect from './PillSelect';
import {browsePlaces,placeCategories,requestedCategories,wantsNearby} from './placeBrowse';
import ProfileFields from './ProfileFields';
import HomeCarousel from './HomeCarousel';
import {PlaceInfoView,PlaceInfoForm,RoleBadge} from './PlaceInfo';
import {getAuth,accountRequest} from './authClient';
import React,{useState,useEffect,useRef} from 'react';
import {House,Search,Map,Users,UserRound,Plus,ArrowUpRight,ArrowRight,Bookmark,MapPin,Mic,X,Check,ChevronRight,NotebookPen,Settings,LogOut,Link,CheckCircle2,Info,Gift,Volume2,Camera,ArrowLeft,Trash2} from 'lucide-react';
import {readState,saveState} from './data';
const initialPosts=[];
import './community.css';
import LocationMap from './LocationMap';
import Groups from './Groups';
import TravelInfo from './TravelInfo';
import Discovery from './Discovery';
import NewPlace from './NewPlace';
import {communityApi,today} from './contributions';
import SpeechInput from './SpeechInput';
import OwnerMarketing from './OwnerMarketing';
import PostActions from './PostActions';
import PlaceMarketing,{recordPlaceView} from './PlaceMarketing';
import ErrorBoundary from './ErrorBoundary';
const tabs=[['news','소식',House],['find','찾기',Search],['explore','발견',Map],['groups','모임',Users]];
const date=()=>new Date().toLocaleDateString('ko-KR');
function ProfileEditFields({user}){const [age,setAge]=useState(user?.user_metadata?.ageGroup||''),[gender,setGender]=useState(user?.user_metadata?.gender||'');return <ProfileFields age={age} gender={gender} onAge={setAge} onGender={setGender}/>;}
const TITLES={reward:'골목냥 키우기',news:'오늘의 골목',find:'장소 찾기',explore:'동네 발견',groups:'모임',profile:'마이페이지',owner:'사장님 공간'};
// 숫자가 0부터 올라가는 효과. 움직임 줄이기 설정을 켠 사용자에게는 바로 보여준다.
function CountUp({value}){
 const [shown,setShown]=useState(0);
 useEffect(()=>{if(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setShown(value);return;}let frame,start;const step=t=>{start??=t;const k=Math.min(1,(t-start)/700);setShown(Math.round(value*(1-Math.pow(1-k,3))));if(k<1)frame=requestAnimationFrame(step);};frame=requestAnimationFrame(step);return()=>cancelAnimationFrame(frame);},[value]);
 return shown;
}
export default function CommunityApp(){
 const [places,setPlaces]=useState([]),[catalogError,setCatalogError]=useState(''),[loadingPlaces,setLoadingPlaces]=useState(true),[busy,setBusy]=useState(false),[answerError,setAnswerError]=useState('');
 const [recommendation,setRecommendation]=useState(null),[recommendationBusy,setRecommendationBusy]=useState(false),[recommendationError,setRecommendationError]=useState('');
 const searchRequest=useRef(0);
 async function loadPlaces(silent=false){if(!silent)setLoadingPlaces(true);setCatalogError('');try{const r=await fetch('/api/community/places');if(!r.headers.get('content-type')?.includes('application/json'))throw new Error('서버에 연결하지 못했어요. 잠시 후 다시 불러와 주세요.');const d=await r.json();if(!r.ok)throw new Error(d.error);setPlaces(d.items);}catch(e){setCatalogError(e.message||'가게 정보를 불러오지 못했어요.');}finally{setLoadingPlaces(false);}}
 useEffect(()=>{loadPlaces();const refresh=()=>{if(document.visibilityState==='visible')loadPlaces(true);};const timer=setInterval(refresh,30000);window.addEventListener('focus',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);};},[]);
 async function ask(message,origin){const r=await fetch('/api/community/recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message,origin}),signal:AbortSignal.timeout(65000)});const d=await r.json();if(!r.ok)throw new Error(d.error||'답변을 받지 못했어요.');return d;}
 async function findPlaces(q=query){
  if(!q.trim()||busy||!places.length)return;
  const request=++searchRequest.current;
  setBusy(true);setRecommendationBusy(true);setEditing(false);setResult(null);setPlaceFilter('전체');setVerificationFilter('all');setRecommendation(null);setAnswerError('');setRecommendationError('');
  let origin=userLocation;
  if(wantsNearby(q)&&requestedCategories(q).length&&!origin&&window.isSecureContext&&navigator.geolocation){
   try{origin=await new Promise((resolve,reject)=>navigator.geolocation.getCurrentPosition(({coords})=>resolve({lat:coords.latitude,lng:coords.longitude}),reject,{enableHighAccuracy:false,timeout:10000,maximumAge:60000}));setUserLocation(origin);setLocationError('');}
   catch{setLocationError('현재 위치를 확인하지 못해 광운대 기준 거리순으로 보여줘요.');}
  }
  else if(wantsNearby(q)&&requestedCategories(q).length&&!origin)setLocationError('현재 위치를 사용할 수 없어 광운대 기준 거리순으로 보여줘요.');
  if(request!==searchRequest.current)return;
  const body=JSON.stringify({message:q,origin});
  fetch('/api/community/search',{method:'POST',headers:{'Content-Type':'application/json'},body,signal:AbortSignal.timeout(65000)})
   .then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'검색하지 못했어요.');return d;})
   .then(d=>{if(request===searchRequest.current){setResult(d);setPlaceSort(d.sort||'relevance');}})
   .catch(e=>{if(request===searchRequest.current)setAnswerError(e.name==='TimeoutError'?'검색이 지연되고 있어요. 다시 시도해 주세요.':e.message);})
   .finally(()=>{if(request===searchRequest.current)setBusy(false);});
  ask(q,origin).then(d=>{if(request===searchRequest.current)setRecommendation(d);})
   .catch(e=>{if(request===searchRequest.current)setRecommendationError(e.name==='TimeoutError'?'AI 추천이 지연되고 있어요.':'AI 추천을 불러오지 못했어요. '+e.message);})
   .finally(()=>{if(request===searchRequest.current)setRecommendationBusy(false);});
 }
 const [state,setState]=useState(()=>({nickname:'월계 이웃',posts:initialPosts,saved:[],visits:[],groups:[],...readState()}));
 const [sharedPosts,setSharedPosts]=useState([]),[postError,setPostError]=useState(''),[postsLoaded,setPostsLoaded]=useState(false);
 async function loadPosts(){try{const d=await communityApi('/posts');setSharedPosts(d.items);setPostError('');}catch(e){setPostError(e.message);}finally{setPostsLoaded(true);}}
 useEffect(()=>{loadPosts();const timer=setInterval(()=>{if(document.visibilityState==='visible')loadPosts();},10000);return()=>clearInterval(timer);},[]);
 const [user,setUser]=useState(null),[me,setMe]=useState(null),[loginNext,setLoginNext]=useState(null);
 const name=me?.nickname||user?.user_metadata?.nickname||state.nickname;
 const [tab,setTab]=useState('news'),[modal,setModalRaw]=useState(null),[toast,setToast]=useState(''),[query,setQuery]=useState(''),[result,setResult]=useState(null),[verificationFilter,setVerificationFilter]=useState('all'),[mapView,setMapView]=useState(false);
 const [suggestBusy,setSuggestBusy]=useState(false);
 function setModal(value){if(value&&['post','newPlace','delete','editInfo'].includes(value.type)&&!user){setLoginNext(()=>()=>setModalRaw(value));setModalRaw({type:'login',back:value.back});return;}setModalRaw(value);}
 useEffect(()=>{let stop=false,subscription;getAuth().then(c=>{if(stop)return;subscription=c.auth.onAuthStateChange((_event,session)=>{setUser(session?.user||null);}).data.subscription;return c.auth.getUser().then(({data})=>{if(!stop)setUser(data.user);});}).catch(()=>{});return()=>{stop=true;subscription?.unsubscribe();};},[]);
 const stateRef=useRef(state);stateRef.current=state;const [synced,setSynced]=useState(false);
 const backdropPointerStart=useRef(false);
 // 로그인하면 계정에 저장된 기록과 이 브라우저의 기록을 합쳐 계정에 저장한다.
 useEffect(()=>{loadPosts();setMe(null);setSynced(false);if(!user)return;let stop=false;accountRequest('/api/auth/me').then(d=>{if(!stop)setMe(d.user);}).catch(()=>{});accountRequest('/api/me/data').then(async remote=>{const local=stateRef.current,merged={saved:[...new Set([...remote.saved,...local.saved])],visits:[...new Set([...remote.visits,...local.visits])]};const saved=await accountRequest('/api/me/data',{method:'PUT',body:JSON.stringify(merged)});if(!stop){patch(saved);setSynced(true);}}).catch(()=>{if(!stop)setToast('계정에 저장된 기록을 불러오지 못했어요.');});return()=>{stop=true;};},[user?.id]);
 useEffect(()=>{if(user&&synced)accountRequest('/api/me/data',{method:'PUT',body:JSON.stringify({saved:state.saved,visits:state.visits})}).catch(()=>setToast('저장한 가게를 계정에 반영하지 못했어요.'));},[state.saved,state.visits]);
 function loginDone(u){setUser(u);setModalRaw(null);if(loginNext){loginNext();setLoginNext(null);}}
 // 연령대·성별은 회원가입 또는 마이페이지에서 자발적으로 입력한다.
 async function saveNickname(n,extra={}){const c=await getAuth();const {data,error}=await c.auth.updateUser({data:{nickname:n,...extra}});if(error)throw error;setUser(data.user);setMe(m=>m&&{...m,nickname:n});}
 async function logout(){const c=await getAuth();await c.auth.signOut();setUser(null);patch({saved:[],visits:[]});setTab('news');setModalRaw(null);}
 useEffect(()=>{if(new URLSearchParams(location.search).has('group'))setTab('groups');},[]);
 useEffect(()=>{
  const url=new URL(location.href),postId=url.searchParams.get('post');
  if(!postId||!postsLoaded||postError)return;
  const post=sharedPosts.find(p=>p.id===postId);
  setTab('news');
  if(post)setModalRaw({type:'read',post});else setToast('공유된 소식을 찾지 못했어요.');
  url.searchParams.delete('post');history.replaceState(null,'',url);
 },[postsLoaded,sharedPosts,postError]);
 useEffect(()=>{try{saveState(state);}catch{setToast('저장 공간이 부족합니다. 큰 사진을 줄여 주세요.');}},[state]);
 useEffect(()=>{if(toast){const t=setTimeout(()=>setToast(''),4000);return()=>clearTimeout(t);}},[toast]);
 useEffect(()=>{const escape=e=>{if(e.key==='Escape')setModal(null);};window.addEventListener('keydown',escape);document.body.style.overflow=modal?'hidden':'';return()=>{window.removeEventListener('keydown',escape);document.body.style.overflow='';};},[modal]);
 const patch=p=>setState(s=>({...s,...p}));
 const go=t=>{if(['profile','owner','reward'].includes(t)&&!user){setLoginNext(()=>()=>setTab(t));setModalRaw({type:'login',owner:t==='owner'});return;}setTab(t);window.scrollTo(0,0);};
 const kst=d=>new Date(d).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
 const home={todayPosts:sharedPosts.filter(p=>p.createdAt&&kst(p.createdAt)===kst(Date.now())).length,updatedPlaces:places.filter(p=>p.info?.history?.some(h=>Date.now()-Date.parse(h.updatedAt)<7*864e5)).length,groups:(()=>{try{return Object.keys(JSON.parse(localStorage.getItem('wolgye-group-memberships-v1'))||{}).length;}catch{return 0;}})()};
 const [compact,setCompact]=useState(false);
 useEffect(()=>{setCompact(false);const h=document.querySelector('.community main h1');if(!h||!('IntersectionObserver' in window))return;const o=new IntersectionObserver(([e])=>setCompact(!e.isIntersecting),{rootMargin:'-90px 0px 0px 0px'});o.observe(h);return()=>o.disconnect();},[tab]);
 // 검색을 어떻게 이해했는지 칩으로 보여준다. 칩을 빼거나 더하면 그 조건으로 다시 찾는다.
 const [editing,setEditing]=useState(false),[addText,setAddText]=useState('');
 const u=recommendation?.understood;
 const tokens=u?[...u.wants.map(w=>({key:'w'+w,kind:'want',label:`🍜 ${w}`,text:w})),...u.excludes.map(x=>({key:'x'+x,kind:'no',label:`🚫 ${x}`,text:`${x} 빼고`})),...(u.budget?[{key:'b',kind:'',label:`💰 ${u.budget.toLocaleString('ko-KR')}원 이하`,text:`${u.budget}원 이하`}]:[]),...(u.hour!=null?[{key:'h',kind:'',label:`🕖 ${u.hour}시`,text:`${u.hour}시`}]:[])]:[];
 function searchWith(list){const q=list.map(t=>t.text).join(' ').trim();setQuery(q);if(q)findPlaces(q);else{setResult(null);setRecommendation(null);setEditing(true);}}
 const errorKind=/Failed to fetch|NetworkError|서버에 연결|연결할 수 없/.test(answerError)?'wifi':/지연|AI 응답|붐|과부하|사용량/.test(answerError)?'sleep':'confused';
 // 찾기: 업종 필터, 이름순·거리순 정렬, 카드·이름 목록·지도 보기
 const [placeSort,setPlaceSort]=useState('name'),[placeFilter,setPlaceFilter]=useState('전체'),[listView,setListView]=useState(false),[userLocation,setUserLocation]=useState(null),[locating,setLocating]=useState(false),[locationError,setLocationError]=useState('');
 const searchPlaces=result?.items.filter(p=>verificationFilter==='all'||p.conditionStatus===verificationFilter);
 const visiblePlaces=browsePlaces(searchPlaces||places,{category:placeFilter,sort:result?placeSort:placeSort==='relevance'?'name':placeSort,location:result?.origin||userLocation});
 function requestLocation(){if(!window.isSecureContext||!navigator.geolocation){setLocationError('위치 확인은 localhost 또는 HTTPS에서 사용할 수 있어요.');return;}setLocating(true);setLocationError('');navigator.geolocation.getCurrentPosition(({coords})=>{setUserLocation({lat:coords.latitude,lng:coords.longitude});setLocating(false);},error=>{setLocating(false);setLocationError(error.code===1?'위치 권한을 허용해 주세요.':'현재 위치를 확인하지 못했어요.');},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});}
 function changePlaceSort(value){
  if(value!=='distance'){setPlaceSort(value);setLocationError('');return;}
  if(userLocation){setPlaceSort('distance');return;}
  if(!window.isSecureContext||!navigator.geolocation){setLocationError('거리순 정렬은 localhost 또는 HTTPS에서 위치를 지원하는 브라우저로 사용할 수 있어요.');return;}
  setLocating(true);setLocationError('');
  navigator.geolocation.getCurrentPosition(({coords})=>{setUserLocation({lat:coords.latitude,lng:coords.longitude});setPlaceSort('distance');setLocating(false);},error=>{setLocating(false);setLocationError(error.code===1?'위치 권한이 거부됐어요. 브라우저에서 위치 권한을 허용해 주세요.':'현재 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.');},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
 }
 useEffect(()=>{navigator.permissions?.query({name:'geolocation'}).then(permission=>{if(permission.state==='granted')requestLocation();}).catch(()=>{});},[]);
 // 사장님이 게시한 최신 포스터(가게별). 카드 배지·표지와 가게 상세 맨 위에 쓴다.
 const [promos,setPromos]=useState(()=>{
  try{
   const cached={};
   for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('place_campaigns_')){
     const pId=k.replace('place_campaigns_','');
     const list=JSON.parse(localStorage.getItem(k)||'[]');
     if(Array.isArray(list)&&list.length>0) cached[pId]=list[0];
    }
   }
   return cached;
  }catch{return {};}
 });
 const [promosAll,setPromosAll]=useState(()=>{
  try{
   const cached={};
   for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.startsWith('place_campaigns_')){
     const pId=k.replace('place_campaigns_','');
     const list=JSON.parse(localStorage.getItem(k)||'[]');
     if(Array.isArray(list)&&list.length>0) cached[pId]=list;
    }
   }
   return cached;
  }catch{return {};}
 });
 const handleCampaignPublished=(pId,newCampaign,allCampaigns)=>{
  setPromos(prev=>({...prev,[pId]:newCampaign}));
  setPromosAll(prev=>({...prev,[pId]:allCampaigns||[newCampaign,...(prev[pId]||[])]}));
 };
 useEffect(()=>{const load=()=>fetch('/api/owner/public-campaigns').then(r=>r.json()).then(d=>{if(d.items)setPromos(prev=>({...prev,...d.items}));if(d.allByPlace){setPromosAll(prev=>{const merged={...prev,...d.allByPlace};Object.entries(merged).forEach(([pId,list])=>{try{localStorage.setItem(`place_campaigns_${pId}`,JSON.stringify(list));}catch{}});return merged;});}}).catch(()=>{});load();const t=setInterval(()=>{if(document.visibilityState==='visible')load();},30000);return()=>clearInterval(t);},[]);
 const posterUrl=promo=>promo?.placeId&&promo?.id?`/api/owner/campaigns/${encodeURIComponent(promo.placeId)}/${promo.id}/poster`:'';
 const deliveryOf=p=>places.find(x=>x.id===p.id)?.deliveryLinks||p.deliveryLinks||{};
 const saved=id=>state.saved.includes(id);
 const toggleSave=id=>{patch({saved:saved(id)?state.saved.filter(x=>x!==id):[...state.saved,id]});};
 function postUrl(post){const url=new URL(location.href);url.search='';url.searchParams.set('post',post.id);return url;}
 function offerPostToGroup(post){
  let groups={};try{groups=JSON.parse(localStorage.getItem('wolgye-group-memberships-v1'))||{};}catch{}
  if(!Object.keys(groups).length){setToast('먼저 모임을 만들어 주세요.');go('groups');return;}
  setModalRaw({type:'suggest',post,groups});
 }
 async function addPostToGroup(post,id,membership){
  setSuggestBusy(true);
  try{
   const r=await fetch(`/api/groups/${encodeURIComponent(id)}/suggestions`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${membership.token}`},body:JSON.stringify({placeId:post.placeId})});
   const d=await r.json();if(!r.ok)throw new Error(d.error||'모임에 제안하지 못했어요.');
   setModalRaw(null);setToast(`${membership.name} 모임에 가게를 제안했어요.`);
  }catch(e){setToast(e.message||'모임에 제안하지 못했어요.');}finally{setSuggestBusy(false);}
 }
 async function sharePost(post){
  const url=postUrl(post),local=['localhost','127.0.0.1'].includes(url.hostname);
  if(local){setModalRaw({type:'share',post,url:url.href});return;}
  if(navigator.share){try{await navigator.share({title:post.title,text:post.body.slice(0,100),url:url.href});return;}catch(e){if(e.name==='AbortError')return;}}
  try{await navigator.clipboard.writeText(url.href);setToast('소식 링크를 복사했어요.');}
  catch{setModalRaw({type:'share',post,url:url.href});}
 }
 const postActions=post=><PostActions post={post} saved={saved(post.placeId)} onSave={()=>toggleSave(post.placeId)} onSuggest={()=>offerPostToGroup(post)} onShare={()=>sharePost(post)}/>;
 const detail=id=>{if(places.some(p=>p.id===id)){setModal({type:'place',id});recordPlaceView(id,user?.user_metadata);}else setToast('가게 정보를 다시 불러온 뒤 확인해 주세요.');};
 // 컴포넌트가 아니라 일반 함수로 그린다. 안쪽 컴포넌트로 두면 화면이 다시 그려질 때마다 카드가 새로 만들어져 등장 효과가 반복된다.
 function placeCard(p,compact=false,origin=userLocation){const photo=sharedPosts.find(post=>post.placeId===p.id&&post.image)?.image,promo=promos[p.id];return <article className="place-card"><button className="real-place-cover" onClick={()=>detail(p.id)}>{promo?.hasPoster?<><img className="place-cover-photo poster-cover" src={posterUrl(promo)} alt={`${p.name} 사장님 포스터`}/><small className="place-photo-source">사장님 포스터</small></>:promo?.carousel?.slides?.[0]?.image?<><img className="place-cover-photo poster-cover" src={promo.carousel.slides[0].image} alt={`${p.name} 사장님 캐러셀`}/><small className="place-photo-source">인스타 홍보</small></>:photo?<><img className="place-cover-photo" src={photo} alt={`${p.name}에 이웃이 올린 사진`}/><small className="place-photo-source">이웃이 올린 사진</small></>:<><House size={36}/><span>{p.kind}</span><small>가게 사진 미등록</small></>}</button><div className="place-body">{promo&&<span className="promo-badge">{promo.demo?'시연용 예시':'사장님 혜택'} · {promo.card?.heroMetric||promo.card?.badge||promo.carousel?.concept||'이벤트'}</span>}<div className="row"><h3>{p.name}</h3><button className={'icon-button '+(saved(p.id)?'selected':'')} aria-label={`${p.name} 저장`} aria-pressed={saved(p.id)} onClick={()=>toggleSave(p.id)}><Bookmark size={20}/></button></div><p>{p.address}<TravelInfo origin={origin} place={p}/></p>{p.source==='이웃 등록'&&<span className="pill">이웃 등록 · 확인 전</span>}{p.priceChecks?.length>0&&<div className="price-checks">{p.priceChecks.map(c=><span key={c.kind} className={'price-check '+c.status}>{c.kind==='budget'?'💰':'🕖'} {c.status==='met'?c.evidence:c.kind==='budget'?'가격 확인 필요':'영업시간 확인 필요'}</span>)}</div>}{p.reason&&<div className="candidate-reason"><b>후보로 고른 이유</b><p>{p.reason}</p><p className="candidate-check">{p.checks}</p></div>}{!compact&&(p.info?.fields?.menu?<p className="unknown"><RoleBadge role={p.info.fields.menu.role}/> {p.info.fields.menu.value.slice(0,40)}</p>:<p className="unknown">메뉴·가격·영업 정보를 기다리고 있어요</p>)}{!!Object.keys(deliveryOf(p)).length&&<div className="place-delivery">{[['baemin','배민'],['yogiyo','요기요'],['coupang','쿠팡이츠']].filter(([key])=>deliveryOf(p)[key]).map(([key,label])=><a key={key} href={deliveryOf(p)[key]} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}>{label} 주문 ↗</a>)}</div>}<button className="text-link" onClick={()=>detail(p.id)}>가게 자세히 <ArrowUpRight size={18}/></button></div></article>;}

 return <div className="community"><aside className="desktop-nav"><a className="brand" href="#" onClick={e=>{e.preventDefault();go('news');}}>월계밥상 <House fill="currentColor" size={24}/><span className="brand-spark">✦</span></a><p className="brand-sub">작은 발견이 모이는 동네</p><nav>{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>go(id)}><Icon size={22}/>{label}{tab===id&&<span className="nav-dot"/>}</button>)}</nav><div className="sidebar-bottom"><span className="eyebrow">WOLGYE NEIGHBORHOOD</span><h3>좋은 가게와<br/>좋은 이웃 사이.</h3><p>내가 아는 골목의 이야기가<br/>누군가의 새로운 발견이 돼요.</p><button className="profile-link" onClick={()=>go('profile')}><UserRound size={20}/>{user?name:'로그인'}<ChevronRight size={16}/></button></div></aside>
 <div className="page-shell"><header className={"topbar"+(compact?" compact":"")}><a className="mobile-brand" href="#" onClick={e=>{e.preventDefault();go('news');}}>월계밥상 <span>✦</span></a><span className="location"><MapPin size={15}/> 월계1동</span><span className={'topbar-title'+(compact?' show':'')} aria-hidden={!compact}>{TITLES[tab]}</span><span className="preview-label">서비스 프리뷰</span>{user?<button className={'account-chip '+(tab==='profile'?'active':'')} aria-label="마이페이지" onClick={()=>go('profile')}><UserRound size={20}/><span>{name}</span></button>:<button className="button dark login-button" onClick={()=>{setLoginNext(null);setModalRaw({type:'login'});}}>로그인</button>}</header>
 <main key={tab} className="tab-view">{loadingPlaces&&<p role="status">월계1동 가게 정보를 불러오고 있어요…</p>}{postError&&<p role="alert">소식을 불러오지 못했어요. {postError} <button className="text-link" onClick={loadPosts}>다시 불러오기</button></p>}{catalogError&&<div className="notice" role="alert"><p>{catalogError}</p><button className="button outline" onClick={()=>loadPlaces()}>다시 불러오기</button></div>}
 {tab==='news'&&<><section className="home-top"><div className="home-title"><div className="badge-title"><h1>오늘의 <mark className="hl">골목</mark></h1><span className="title-badge">{new Date().toLocaleDateString('ko-KR',{month:'long',day:'numeric',weekday:'long'})}</span></div><button className="compose-pill desktop-write" onClick={()=>setModal({type:'post'})}><Plus size={18}/>소식 올리기</button></div><HomeCarousel post={sharedPosts[0]} place={places.find(x=>x.id===sharedPosts[0]?.placeId)} onOpenPost={post=>setModal({type:'read',post})} onCompose={()=>setModal({type:'post'})} onOwner={()=>go('owner')} onReward={()=>go('reward')}/><div className="widgets"><button className="widget" onClick={()=>document.getElementById('news-feed')?.scrollIntoView({behavior:'smooth'})}><span className="widget-label"><NotebookPen size={15}/>오늘 올라온 소식</span><b><CountUp value={home.todayPosts}/></b><small>전체 {sharedPosts.length}개</small></button><button className="widget" onClick={()=>go('find')}><span className="widget-label"><Info size={15}/>정보가 바뀐 가게</span><b><CountUp value={home.updatedPlaces}/></b><small>최근 7일</small></button><button className="widget" onClick={()=>go('groups')}><span className="widget-label"><Users size={15}/>내 모임</span><b><CountUp value={home.groups}/></b><small>{home.groups?'모임 열기':'모임 만들기'}</small></button></div></section><div className="section-heading" id="news-feed"><h2>방금 전해진 이야기 <span>{sharedPosts.length}</span></h2></div>{!sharedPosts.length&&<p className="muted">아직 전해진 소식이 없어요. 직접 확인한 가게 이야기를 처음으로 남겨주세요.</p>}<div className="feed-grid">{sharedPosts.map(p=><article className="feed-card" key={p.id}><button className="feed-photo" onClick={()=>setModal({type:'read',post:p})}>{p.image?<img src={p.image} alt="게시글 첨부 사진"/>:<div className="real-place-cover"><NotebookPen size={32}/><small>사진 없는 소식</small></div>}<span>{p.type}</span></button><div><small><RoleBadge role={p.authorRole}/> {p.author} · {p.observedAt||p.date}</small><button className="feed-title" onClick={()=>setModal({type:'read',post:p})}>{p.title}</button><p>{p.body}</p>{postActions(p)}</div></article>)}</div><button className="mobile-compose" aria-label="소식 올리기" onClick={()=>setModal({type:'post'})}><Plus/>소식 올리기</button></>}
  {tab==='find'&&<>
   <div className="page-heading"><div className="badge-title"><h1>장소 <mark className="hl">찾기</mark></h1>{places.length>0&&<span className="title-badge">가게 {places.length}곳</span>}</div></div>
   <form className="search-panel" onSubmit={e=>{e.preventDefault();findPlaces();}}>
    {tokens.length>0&&!editing&&!busy?<div className="token-box">{tokens.map(t=><span key={t.key} className={'token '+t.kind}>{t.label}<button type="button" aria-label={`${t.label} 빼고 다시 찾기`} onClick={()=>searchWith(tokens.filter(x=>x!==t))}>×</button></span>)}<input value={addText} aria-label="조건 더하기" placeholder="조건 더하기…" onChange={e=>setAddText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.nativeEvent.isComposing){e.preventDefault();if(addText.trim()){searchWith([...tokens,{text:addText.trim()}]);setAddText('');}}}}/></div>:<textarea disabled={busy} maxLength={3000} aria-label="원하는 장소 조건" placeholder="원하는 장소와 필요한 조건을 자유롭게 적어주세요." value={query} onChange={e=>{setQuery(e.target.value);searchRequest.current++;setResult(null);setRecommendation(null);setBusy(false);setRecommendationBusy(false);}} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.nativeEvent.isComposing){e.preventDefault();findPlaces();}}}/>}
    <div className="row"><div className="search-tools"><SpeechInput value={query} maxLength={3000} disabled={busy} onChange={t=>{setQuery(t);if(!(tokens.length>0&&!editing)){searchRequest.current++;setResult(null);setRecommendation(null);}}} onEnd={t=>findPlaces(t)}/>{tokens.length>0&&!editing&&!busy&&<button type="button" className="text-link token-edit" onClick={()=>setEditing(true)}>문장으로 고치기</button>}</div>{!(tokens.length>0&&!editing&&!busy)&&<button className="button dark" disabled={!query.trim()||busy||!places.length}><Search size={18}/>{busy?'골목냥이 찾는 중…':'장소 찾아보기'}</button>}</div>
   </form>
   {busy&&<CatMessage mood="search" title="골목냥이 골목을 돌아보는 중이에요" body="조건에 맞는 가게를 찾고 있어요." progress/>}
   {answerError&&!busy&&<CatMessage mood="confused" title="검색하지 못했어요" body={answerError} actions={[{label:'다시 찾기',onClick:()=>findPlaces()}]}/>}
   {(recommendationBusy||recommendation||recommendationError)&&<section className="find-recommendations"><div className="section-heading"><h2>{recommendation?.method==='category-distance'?'업종·거리로 고른 후보':'AI가 추린 확인용 후보'}</h2></div>{recommendationBusy&&<p role="status">AI가 후보를 살펴보고 있어요…</p>}{recommendationError&&<p role="alert">{recommendationError}</p>}{recommendation?.answer&&<p className="search-note">{recommendation.answer}</p>}{recommendation?.items?.length>0&&<div className="places-grid">{recommendation.items.map(p=><React.Fragment key={p.id}>{placeCard(p,false,recommendation.origin||userLocation)}</React.Fragment>)}</div>}</section>}
   <div className="section-heading find-heading"><h2>{result?'검색된 가게 전체':'동네 가게 둘러보기'}</h2><div className="find-list-controls"><div className="place-sort-label">업종 <PillSelect label="가게 업종 필터" value={placeFilter} options={placeCategories} onChange={setPlaceFilter}/></div><div className="place-sort-label">정렬 <PillSelect label="가게 정렬" value={placeSort} options={[...(result?[{value:'relevance',label:'관련순'}]:[]),{value:'name',label:'이름순'},{value:'distance',label:'거리순'}]} onChange={changePlaceSort}/></div><div className="segmented" role="group" aria-label="가게 보기 방식"><button className={!listView?'active':''} onClick={()=>setListView(false)}>카드</button><button className={listView?'active':''} onClick={()=>setListView(true)}>이름 목록</button></div></div></div>
   <div className="row"><button className="text-link" onClick={requestLocation}>{locating?'위치 확인 중…':userLocation?'현재 위치 다시 확인':'현재 위치로 거리 보기'}</button>{locationError&&<p role="alert">{locationError}</p>}</div>
   {placeSort==='distance'&&<p className="place-browse-note">{result?.originLabel||'현재 위치'} 기준 거리순이에요. 위치는 저장하지 않아요.</p>}
   {result?.hasVerifiableConditions&&<div className="condition-filter" role="group" aria-label="조건 정보 확인 범위"><p>예산과 방문 시각은 등록된 메뉴 가격·영업시간으로만 판단해요. 이동·대기 시간 등 다른 조건은 별도로 확인해 주세요.</p><div className="segmented"><button aria-pressed={verificationFilter==='all'} className={verificationFilter==='all'?'active':''} onClick={()=>setVerificationFilter('all')}>전체 {result.items.length}</button><button aria-pressed={verificationFilter==='confirmed'} className={verificationFilter==='confirmed'?'active':''} onClick={()=>setVerificationFilter('confirmed')}>등록 정보상 {result.conditionLabel} 부합 {result.confirmedCount}</button><button aria-pressed={verificationFilter==='unverified'} className={verificationFilter==='unverified'?'active':''} onClick={()=>setVerificationFilter('unverified')}>정보 부족·확인 필요 {result.unverifiedCount}</button></div></div>}
   <p className="place-results-count">{visiblePlaces.length}곳 표시 · 카카오 장소 검색으로 확인된 월계1동 음식점·카페와 이웃이 등록한 가게</p>
   {listView?<div className="place-name-list">{visiblePlaces.map(p=><button key={p.id} className="place-name-row" onClick={()=>detail(p.id)}><span>{p.name}{result?.hasVerifiableConditions&&<b className={'condition-badge '+p.conditionStatus}>{p.conditionStatus==='confirmed'?'등록 정보상 부합':'정보 부족·확인 필요'}</b>}<small>{p.kind} · {p.address}{!!Object.keys(deliveryOf(p)).length&&' · 배달 주문 가능'}<TravelInfo origin={result?.origin||userLocation} place={p}/></small></span><ArrowUpRight size={18} aria-hidden="true"/></button>)}</div>:<div className="places-grid">{visiblePlaces.map(p=><div key={p.id} className="result-place-card">{result?.hasVerifiableConditions&&<span className={'condition-badge '+p.conditionStatus}>{p.conditionStatus==='confirmed'?'등록 정보상 부합':'정보 부족·확인 필요'}</span>}{placeCard(p,false,result?.origin||userLocation)}</div>)}</div>}
   {!visiblePlaces.length&&(result?.items.length===0?<CatMessage mood="confused" title="골목을 다 돌아봤는데 못 찾았어요" body={tokens.length>1?'조건을 하나 빼고 다시 찾아볼까요?':'원하는 메뉴나 분위기를 조금 다르게 말해 주세요.'} actions={tokens.length>1?tokens.slice(0,3).map(t=>({label:`${t.label.replace(/^\S+ /,'')} 빼고 찾기`,soft:true,onClick:()=>searchWith(tokens.filter(x=>x!==t))})):[]}/>:verificationFilter!=='all'?<p className="muted">이 범위에 표시할 가게가 없어요. 다른 조건 정보 범위를 선택해 주세요.</p>:<CatMessage mood="confused" title="이 업종의 가게가 없어요" body="업종을 전체로 바꿔 볼까요?" actions={[{label:'전체 보기',onClick:()=>setPlaceFilter('전체')}]}/>) }
   <button className="group-banner" onClick={()=>go('groups')}><Users size={26}/><div><b>함께 고를 때는, 모임에서</b><p>각자의 조건을 모아 후보를 비교해요.</p></div><ArrowRight/></button>
  </>}
 {tab==='explore'&&<Discovery places={places} posts={sharedPosts} saved={state.saved} user={user} onLogin={()=>{setLoginNext(null);setModalRaw({type:'login'});}} onPlace={detail} onAdd={()=>setModal({type:'newPlace'})} onContribute={id=>setModal({type:'editInfo',id})}/>}
 {tab==='groups'&&<Groups nickname={name} userLocation={userLocation} locating={locating} locationError={locationError} onLocate={requestLocation}/>}
 {tab==='owner'&&<OwnerMarketing places={places} admin={!!me?.admin} onBack={()=>go('news')} onLinksSaved={()=>loadPlaces(true)} onCampaignPublished={handleCampaignPublished}/>}
 {tab==='reward'&&<Reward onExplore={()=>go('explore')} onCompose={()=>setModal({type:'post'})}/>}
 {tab==='profile'&&<><div className="page-heading"><div className="badge-title"><h1>반가워요, <mark className="hl">{name}</mark></h1><span className="title-badge">{me?.admin?'관리자':me?.ownerPlaceId?'사장님':'이웃'}</span></div></div><div className="profile-layout"><section className="profile-box"><UserRound size={42}/><h2>{name}</h2>{user&&<p className="muted">{user.email}{me?.admin?' · 관리자':''}{[user.user_metadata?.ageGroup,user.user_metadata?.gender].filter(Boolean).map(x=>' · '+x).join('')}</p>}<button className="button outline" onClick={()=>setModal({type:'profile'})}>프로필 수정</button><button className="settings-row" onClick={()=>setModal({type:'settings'})}><Settings size={19}/>설정<ChevronRight size={18}/></button><button className="settings-row" onClick={()=>setModal({type:'visits'})}><Map size={19}/>내 방문 기록 보기<ChevronRight size={18}/></button><button className="settings-row reward-row" onClick={()=>go('reward')}><span className="reward-row-cat">🐱</span>골목냥 키우기<ChevronRight size={18}/></button><button className="settings-row" onClick={()=>go('owner')}><House size={19}/>{me?.admin?'사장님 공간 · 승인 관리':'사장님 공간'}<ChevronRight size={18}/></button><button className="settings-row" onClick={logout}><LogOut size={19}/>로그아웃<ChevronRight size={18}/></button></section><div><h2 className="section-title">내가 쓴 이야기</h2>{[...sharedPosts.filter(p=>p.mine),...(state.posts||[])].length===0?<p className="muted">아직 작성한 소식이 없어요.</p>:[...sharedPosts.filter(p=>p.mine),...(state.posts||[])].map(p=><div className="my-post" key={p.id}><div><b>{p.title}</b><small>{p.observedAt||p.date} · {p.mine?'공유 중':'이전 브라우저 기록'}</small></div><button className="text-link" onClick={()=>setModal({type:'post',post:p})}>수정</button><button className="icon-button" aria-label={`${p.title} 삭제`} onClick={()=>setModal({type:'delete',post:p})}><Trash2 size={17}/></button></div>)}<h2 className="section-title">저장한 가게 <span>{state.saved.length}</span></h2><div className="places-grid saved-grid">{places.filter(p=>saved(p.id)).map(p=><React.Fragment key={p.id}>{placeCard(p,true)}</React.Fragment>)}</div>{!state.saved.length&&<p className="muted">가게의 북마크를 눌러 여기에 모아보세요.</p>}</div></div></>}
 <footer className="page-footer"><span>월계밥상 <b>✦</b></span><button className="text-link" onClick={()=>go('owner')}>사장님 공간</button><p>작은 발견이 모여, 더 가까운 동네.</p><small>카카오 장소 정보 · NVIDIA Nemotron AI 답변 · 모임·장소·소식은 함께 공유 · 저장·방문 메모는 로그인 계정에 저장</small></footer>
 </main></div><nav className="bottom-nav" aria-label="주 메뉴">{tabs.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>go(id)}><span><Icon size={22}/></span>{label}</button>)}</nav>{toast&&<div className="toast" role="status">{toast}</div>}
 {modal&&<div className="modal-backdrop" onPointerDown={e=>{backdropPointerStart.current=e.target===e.currentTarget;}} onClick={e=>{if(backdropPointerStart.current&&e.target===e.currentTarget)setModal(null);backdropPointerStart.current=false;}}><section className={modal.type==='place' ? 'modal place-detail-modal' : 'modal'} role="dialog" aria-modal="true" aria-label="상세 및 입력"><button className="modal-close icon-button" aria-label="닫기" autoFocus onClick={()=>setModal(null)}><X/></button><ErrorBoundary onReset={()=>setModal(null)} fallback={()=>(<div style={{padding:'24px',textAlign:'center'}}><p style={{fontSize:'14px',color:'#64748b'}}>가게 상세 정보를 불러오는 도중 문제가 발생했어요.</p><button className="button dark" onClick={()=>setModal(null)}>닫기</button></div>)}>
  {modal.back&&<button type="button" className="modal-back" onClick={()=>setModal({type:'place',id:modal.back})}><ArrowLeft size={18}/>가게로 돌아가기</button>}
  {modal.type==='login'&&<Login onDone={loginDone} owner={!!modal.owner}/>}
 {modal.type==='editInfo'&&(()=>{const p=places.find(x=>x.id===modal.id);if(!p)return <p>가게 정보를 불러오지 못했어요.</p>;return <PlaceInfoForm place={p} isOwner={me?.ownerPlaceId===p.id} onSaved={async earned=>{await loadPlaces(true);setModal({type:'place',id:p.id});setToast(earned?`가게 정보를 고쳤어요 · 밥알 +${earned} 🍚`:'가게 정보를 고쳤어요.');}}/>;})()}
 {modal.type==='place'&&(()=>{const p=places.find(x=>x.id===modal.id);if(!p)return <p>가게 정보를 불러오지 못했어요.</p>;return <><span className="eyebrow">월계1동 · {p.source}{p.status?` · ${p.status}`:''}</span><h2>{p.name}</h2><p>{p.kind}</p><div className="place-detail-actions"><button className="button dark" onClick={()=>setModal({type:'editInfo',id:p.id,back:p.id})}>가게 정보 수정<span>메뉴·가격·영업시간</span></button><button className="button dark" onClick={()=>setModal({type:'post',placeId:p.id,back:p.id})}>소식 올리기<span>방문 이야기·이벤트</span></button></div><PlaceMarketing placeId={p.id} shopName={p.name} initialCampaigns={promosAll[p.id]||[]}/><PlaceDetailPromos placeId={p.id} shopName={p.name} defaultPromo={promos[p.id]} allPromos={promosAll[p.id]||[]}/>{p.ownerKeywords?.length>0&&<div className="place-keywords"><small>사장님 키워드 · 확인 전</small>{p.ownerKeywords.map(tag=><span key={tag}>#{tag}</span>)}</div>}{(()=>{const tags=[...new Set(sharedPosts.filter(post=>post.placeId===p.id).flatMap(post=>post.keywords||[]))];return tags.length>0&&<div className="place-keywords"><small>이웃 키워드 · 확인 전</small>{tags.map(tag=><span key={tag}>#{tag}</span>)}</div>;})()}<PlaceInfoView place={p} onEdit={()=>setModal({type:'editInfo',id:p.id,back:p.id})}/><p className="muted">주소·전화 출처: {p.source} · 메뉴·영업 정보는 이웃과 사장님이 남긴 내용이에요. 방문 전 매장에 확인해 주세요.</p>{p.placeUrl&&<a className="button dark full" href={p.placeUrl} target="_blank" rel="noreferrer">카카오맵에서 확인 <ArrowUpRight size={18}/></a>}<h3 className="place-neighbor-heading">이웃이 확인한 소식</h3>{sharedPosts.filter(n=>n.placeId===p.id).map(n=><article className="place-update" key={n.id}><b>{n.title}</b><p>{n.body}</p><small><RoleBadge role={n.authorRole}/> {n.author} · {n.observedAt} 확인{n.authorRole==='owner'?'':' · 이웃 제보'}</small>{n.image&&<img className="upload-preview" src={n.image} alt="이웃이 첨부한 가게 사진"/>}</article>)}{!sharedPosts.some(n=>n.placeId===p.id)&&<p>아직 소식이 없어요. 직접 확인한 정보를 남겨주세요.</p>}{me?.admin&&p.id.startsWith('local-')&&<button className="button outline admin-danger full" onClick={async()=>{if(!window.confirm('관리자 권한으로 이 장소와 장소에 달린 소식을 삭제할까요? 되돌릴 수 없어요.'))return;try{await communityApi('/places/'+encodeURIComponent(p.id),'DELETE');await Promise.all([loadPlaces(true),loadPosts()]);setModal(null);setToast('관리자 권한으로 장소를 삭제했어요.');}catch(e){setToast(e.message);}}}>장소 삭제 (관리자)</button>}</>;})()}

 {modal.type==='read'&&<>{modal.post.image&&<img className="detail-image" src={modal.post.image} alt="소식 사진"/>}<span className="eyebrow">{modal.post.type}</span><h2>{modal.post.title}</h2><small><RoleBadge role={modal.post.authorRole}/> {modal.post.author} · {modal.post.observedAt||modal.post.date}</small><p className="post-body">{modal.post.body}</p>{postActions(modal.post)}{!!modal.post.revisions?.length&&<details className="recommendation-info"><summary>이전 수정 기록 ({modal.post.revisions.length})</summary>{modal.post.revisions.map((r,i)=><article className="place-update" key={i}><b>{r.title}</b><p>{r.body}</p><small>{r.observedAt} 확인 · 이전 내용</small></article>)}</details>}<button className="button dark" onClick={()=>detail(modal.post.placeId)}>가게 정보 보기</button>{me?.admin&&!modal.post.mine&&<button className="button outline admin-danger" onClick={async()=>{if(!window.confirm('관리자 권한으로 이 소식을 삭제할까요? 되돌릴 수 없어요.'))return;try{await communityApi('/posts/'+modal.post.id,'DELETE');await loadPosts();setModal(null);setToast('관리자 권한으로 소식을 삭제했어요.');}catch(e){setToast(e.message);}}}>관리자 삭제</button>}</>}
 {modal.type==='suggest'&&<><h2>어느 모임에 제안할까요?</h2><p>{modal.post.title}에 소개된 가게를 모임에 보태요. 진행 중인 투표 후보는 그대로 유지돼요.</p><div className="suggest-group-list">{Object.entries(modal.groups).map(([id,m])=><button className="button outline full" key={id} disabled={suggestBusy} onClick={()=>addPostToGroup(modal.post,id,m)}>{m.name}</button>)}</div></>}
 {modal.type==='share'&&<><h2>소식 공유</h2><p>{modal.post.title}</p><p className="muted">현재는 내 컴퓨터의 로컬 주소라 다른 기기에서는 열리지 않아요. 배포 주소에서 같은 공유 버튼을 누르면 바로 공유할 수 있어요.</p><input aria-label="소식 공유 링크" readOnly value={modal.url} onFocus={e=>e.target.select()}/><button className="button dark full" onClick={async()=>{try{await navigator.clipboard.writeText(modal.url);setToast('소식 링크를 복사했어요.');}catch{setToast('링크를 선택해 직접 복사해 주세요.');}}}>링크 복사</button></>}
 {modal.type==='newPlace'&&<NewPlace onCancel={()=>setModal(null)} onAdded={p=>{setPlaces(old=>old.some(x=>x.id===p.id)?old:[p,...old]);setModal({type:'post',placeId:p.id,back:p.id});setToast('장소를 선택했어요. 사진이나 소식을 보태주세요.');}}/>}
 {modal.type==='post'&&<PostForm places={places} post={modal.post} placeId={modal.placeId} onAdded={p=>setPlaces(old=>old.some(x=>x.id===p.id)?old:[p,...old])} onSave={async p=>{const saved=await communityApi('/posts'+(modal.post?.mine?'/'+modal.post.id:''),modal.post?.mine?'PUT':'POST',p);if(modal.post&&!modal.post.mine)patch({posts:state.posts.filter(x=>x.id!==modal.post.id)});await loadPosts();setModal(null);setToast(saved?.earned?`소식을 공유했어요 · 밥알 +${saved.earned} 🍚`:'소식을 이웃과 공유했어요.');}} nickname={name}/>}
 {modal.type==='visits'&&<><h2>내 방문 기록</h2><p>로그인하면 계정에 저장되는 개인 메모예요. 다른 사람에게 공개되지 않고, 방문 인증은 아닙니다.</p>{state.visits.map(id=><p key={id}>{places.find(p=>p.id===id)?.name||'가게 정보 없음'}</p>)}{!state.visits.length&&<p>아직 기록이 없어요.</p>}<button className="button outline" onClick={()=>setModal({type:'visit'})}>방문 기록 남기기</button></>}
 {modal.type==='profile'&&<form onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget),n=f.get('nickname').trim();if(!n)return;try{await saveNickname(n,{fullName:null,ageGroup:f.get('ageGroup')||'',gender:f.get('gender')||''});setModal(null);setToast('프로필을 저장했어요. 닉네임은 새로 쓰는 소식부터 적용돼요.');}catch{setToast('닉네임을 저장하지 못했어요. 다시 시도해 주세요.');}}}><h2>프로필 수정</h2><label>닉네임<input name="nickname" defaultValue={name} required maxLength={20}/></label><ProfileEditFields user={user}/><button className="button dark full">저장하기</button></form>}
 {modal.type==='visit'&&<form onSubmit={e=>{e.preventDefault();const id=new FormData(e.currentTarget).get('place');if(!state.visits.includes(id))patch({visits:[...state.visits,id]});setModal(null);setToast('방문 메모를 저장했어요. 인증·리워드 적립은 아닙니다.');}}><h2>방문 기록 남기기</h2><p>로컬 시연용 메모입니다. 실제 위치나 구매를 인증하지 않아요.</p><label>가게<select required name="place">{places.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button disabled={!places.length} className="button dark full">방문 메모 저장</button></form>}
 {modal.type==='settings'&&<><h2>설정과 데이터</h2><div className="notice">닉네임과 작성한 소식은 계정에 연결돼요. 저장한 가게·방문 메모도 로그인하면 계정에 저장돼 다른 기기에서 볼 수 있어요. 알림 서비스는 아직 연결되지 않았어요.</div><h3>위치 정보</h3><p>지도에서 내 위치를 누르면 브라우저 권한을 요청해 현재 위치를 한 번 표시합니다. 좌표와 이동 경로는 저장하지 않아요. 지도 제공자에게 표시 영역의 지도 요청이 전송됩니다.</p><h3>음성 입력</h3><p>지원 브라우저에서만 작동하며 브라우저의 음성 처리 서비스를 사용할 수 있어요. 인식한 내용은 직접 확인한 후 저장하세요.</p><button className="button outline" onClick={()=>setModal({type:'reset'})}>프리뷰 데이터 초기화</button></>}
 {modal.type==='reset'&&<><h2>프리뷰 기록을 지울까요?</h2><p>이 브라우저의 닉네임·이전 로컬 글·저장·방문 메모만 초기화해요. 공유 소식·장소·모임은 유지됩니다.</p><button className="button dark" onClick={()=>{patch({nickname:'월계 이웃',posts:initialPosts,saved:[],visits:[],groups:[]});setModal(null);setToast('초기화했어요.');}}>초기화</button></>}
 {modal.type==='delete'&&<><h2>이 소식을 삭제할까요?</h2><p>{modal.post.title}</p><button className="button dark" onClick={async()=>{try{if(modal.post.mine){await communityApi('/posts/'+modal.post.id,'DELETE');await loadPosts();}else patch({posts:state.posts.filter(x=>x.id!==modal.post.id)});setModal(null);}catch(e){setToast(e.message);}}}>삭제하기</button></>}
 </ErrorBoundary></section></div>}
 </div>;
}
function PostForm({places,post,placeId,nickname,onSave,onAdded}){const [body,setBody]=useState(post?.body||''),[image,setImage]=useState(post?.image||''),[error,setError]=useState(''),[review,setReview]=useState(null),[adding,setAdding]=useState(false),[selected,setSelected]=useState(post?.placeId||placeId||''),[search,setSearch]=useState(''),[saving,setSaving]=useState(false);return <><div hidden={!adding}>{adding&&<NewPlace onCancel={()=>setAdding(false)} onAdded={p=>{onAdded(p);setSelected(p.id);setSearch('');setAdding(false);setReview(null);}}/>}</div><form hidden={adding} onSubmit={async e=>{e.preventDefault();const f=new FormData(e.currentTarget);const p={id:post?.id||crypto.randomUUID(),placeId:selected,title:f.get('title').trim(),body:body.trim(),type:f.get('type'),author:nickname,date:date(),observedAt:f.get('observedAt'),image,keywords:String(f.get('keywords')||'').split(/[\s,]+/).map(x=>x.replace(/^#+/,'').trim()).filter(Boolean).slice(0,8),seed:false};if(!p.title||!p.body)return;if(!selected){setError('가게를 선택해 주세요.');return;}if(review){setSaving(true);setError('');try{await onSave(p);}catch(e){setError(e.message);}finally{setSaving(false);}}else setReview(p);}}><span className="eyebrow">SHARE YOUR DISCOVERY</span><h2>{post?'소식 수정하기':'동네에 소식 전하기'}</h2><p>방문 이야기나 가게의 새로운 소식을 전해주세요. 메뉴·가격·영업시간 변경은 가게 상세의 ‘가게 정보 수정’에서 따로 저장해 주세요.</p><label>가게 검색<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="가게 이름으로 검색"/></label><label>가게<select required name="place" value={selected} onChange={e=>{setSelected(e.target.value);setReview(null);}}><option value="">가게를 선택해 주세요</option>{places.filter(p=>p.id===selected||p.name.includes(search)).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button type="button" className="button outline full" onClick={()=>setAdding(true)}>찾는 가게가 없나요? 새 장소 등록</button><label>직접 확인한 날짜<input type="date" name="observedAt" required max={today()} defaultValue={post?.observedAt||today()} onChange={()=>setReview(null)}/></label><label>소식 종류<select name="type" defaultValue={post?.type||'방문 이야기'} onChange={()=>setReview(null)}>{['방문 이야기','메뉴·가격','영업 소식','새로운 발견'].map(x=><option key={x}>{x}</option>)}</select></label><label>제목<input name="title" required maxLength={70} defaultValue={post?.title} placeholder="이웃에게 어떤 소식을 전할까요?" onChange={()=>setReview(null)}/></label><label>내용<textarea aria-label="내용" required value={body} maxLength={2000} placeholder="확인한 내용과 방문 시점을 적어주세요." onChange={e=>{setBody(e.target.value);setReview(null);}}/></label><label>가게 키워드 (선택)<input name="keywords" maxLength={180} defaultValue={(post?.keywords||[]).map(x=>`#${x}`).join(' ')} placeholder="#혼밥 #단체 #가성비" onChange={()=>setReview(null)}/></label><div className="post-photo"><label className={'post-photo-picker '+(image?'has-photo':'')}><input className="post-photo-file" aria-label="소식 사진 선택" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type)){setError('1MB 이하 JPG·PNG·WebP 사진을 선택해 주세요.');return;}const reader=new FileReader();reader.onload=()=>{setImage(reader.result);setError('');setReview(null);};reader.readAsDataURL(f);}}/><span className="post-photo-icon"><Camera size={25}/></span><span className="post-photo-copy"><strong>{image?'사진 변경':'사진 추가'}</strong><small>JPG · PNG · WebP / 최대 1MB</small></span><span className="post-photo-plus">+</span></label>{image&&<div className="post-photo-preview"><img src={image} alt="첨부 사진 미리보기"/><button type="button" aria-label="첨부 사진 삭제" onClick={()=>{setImage('');setReview(null);}}><X size={18}/></button></div>}</div>{error&&<p role="alert">{error}</p>}{review&&<div className="notice"><CheckCircle2 size={20}/><div><b>내용을 확인했나요?</b><p>확인 날짜와 함께 이웃에게 공개됩니다. 가게의 공식 정보나 인증된 정보로 표시되지는 않아요.</p></div></div>}<button disabled={saving||!selected} className="button dark full">{saving?'저장 중…':review?'확인하고 소식 저장':'등록 내용 확인'}</button></form></>;}
