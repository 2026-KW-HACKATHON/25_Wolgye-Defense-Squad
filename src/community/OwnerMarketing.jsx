import MenuReview from './MenuReview';
import {authHeaders} from './authClient';
import React,{useEffect,useRef,useState} from 'react';
import {ArrowLeft,Mic,Send,LogOut,Sparkles,Image as ImageIcon,CheckCircle} from 'lucide-react';
import './ownerMarketing.css';
import PromoCardCanvas,{generatePromoImageBase64,InstagramCarouselView,generateCarouselSlideBase64} from './PromoCardCanvas';

async function api(path,{method='GET',body}={}){
  const response=await fetch(`/api/owner${path}`,{
    method,
    headers:{...(body?{'Content-Type':'application/json'}:{}),...await authHeaders()},
    body:body?JSON.stringify(body):undefined
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'요청에 실패했어요.');
  return data;
}

const readFile=file=>new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(reader.result);
  reader.onerror=reject;
  reader.readAsDataURL(file);
});
export default function OwnerMarketing({places,admin=false,onBack,onLinksSaved}){
  const [token,setToken]=useState('account');
  const [placeId,setPlaceId]=useState('');
  const [section,setSection]=useState('studio'); // 'studio' (통합 AI 홍보 스튜디오)
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [busy,setBusy]=useState(false);
  const [choice,setChoice]=useState('');
  const [pending,setPending]=useState([]);
  const [adminLoaded,setAdminLoaded]=useState(false);

  // AI 홍보 스튜디오 상태
  const [chat,setChat]=useState([]);
  const [message,setMessage]=useState('');
  const [recording,setRecording]=useState(false);
  const [activeVisual,setActiveVisual]=useState(null); // { type: 'carousel' | 'card', data: ... }
  const [brief,setBrief]=useState('');
  const [format,setFormat]=useState('square');
  const [proposals,setProposals]=useState([]);
  const [preview,setPreview]=useState({});
  const [generatingStep,setGeneratingStep]=useState(0);
  const [currentStepInfo,setCurrentStepInfo]=useState(null);
  const stepTimer=useRef(null);

  const deriveStepsForContext=(taskText, actionType='visual')=>{
    const text=String(taskText||'');
    const celebMatch=text.match(/(카리나|뉴진스|아이유|차은우|성시경|백종원|풍자|이영자|유재석|쯔양|침착맨|안성재|최현석|[가-힣]{2,4}\s*(?:아이돌|배우|가수|연예인))/);
    const celebName=celebMatch?celebMatch[1]:'화제의 미식 셀럽';
    const isCeleb=Boolean(celebMatch);

    const foodMatch=text.match(/(삼겹살|제육|돈까스|돈가스|치킨|피자|국밥|김치찌개|된장찌개|파스타|스테이크|초밥|스시|회|마라탕|떡볶이|냉면|라면|우동|칼국수|커피|디저트|베이커리|빵|샌드위치|샐러드)/);
    const foodName=foodMatch?foodMatch[1]:'시그니처 대표 메뉴';

    if(actionType==='chat'){
      return [
        {icon:'💬',text:'1단계: 사장님 홍보 고민 및 마케팅 맥락 분석 중'},
        {icon:'💡',text:'2단계: 골목 상권 맞춤 카피라이팅 조언 작성 중'}
      ];
    }

    const isPoster=/(포스터|단일\s*포스터|할인\s*포스터)/i.test(text);

    if(isPoster){
      return [
        {icon:'🎯',text:`1단계: 사장님 대화 분석 ("${text.slice(0,20)}...") 기획 중`},
        {icon:'✍️',text:`2단계: [${foodName}] 혜택 카피라이팅 & 핵심 헤드라인 문구 작성 중`},
        {icon:'📸',text:`3단계: [${foodName}] 고화질 실사 사진 웹 검색 및 배경 검증 중`},
        {icon:'🎨',text:`4단계: 상업용 포스터 레이아웃 완성 & 히스토리 보관 중`}
      ];
    }

    return [
      {icon:'🎯',text:`1단계: 대화 내역 분석 및 ${isCeleb ? `${celebName} 출연 ` : ''}[${foodName}] 카드뉴스 기획 중`},
      {icon:'✍️',text:`2단계: 슬라이드별 훅(Hook) & ${isCeleb ? `${celebName} 추천 멘트` : '방문 유도 카피'} 작성 중`},
      {icon:'📸',text:`3단계: ${isCeleb ? `${celebName} 실사 사진 & ` : ''}[${foodName}] 웹 사진 검색 및 적합성 검증 중`},
      {icon:'🎨',text:`4단계: 인스타그램 4:5 피드 규격 비주얼 바인딩 완성 & 히스토리 보관 중`}
    ];
  };

  // 캠페인 & 키워드 & 쿠폰 & 리포트 & 배달앱 링크
  const [campaigns,setCampaigns]=useState([]);
  const [campaign,setCampaign]=useState({title:'',body:'',status:'draft',proposalId:''});
  const [report,setReport]=useState(null);
  const [keywords,setKeywords]=useState('');
  const [coupons,setCoupons]=useState([]);
  const [coupon,setCoupon]=useState({title:'',minLevel:2});
  const [deliveryLinks,setDeliveryLinks]=useState({});

  const recorder=useRef(null);
  const parts=useRef([]);
  const previewUrls=useRef([]);
  const selectedPlace=places.find(p=>p.id===placeId);

  const run=async (work, contextPrompt='', actionType='visual')=>{
    setBusy(true);
    setError('');
    setNotice('');
    const steps=deriveStepsForContext(contextPrompt||message||brief, actionType);
    setGeneratingStep(1);
    setCurrentStepInfo(steps[0]);
    let s=1;
    clearInterval(stepTimer.current);
    const intervalTime=actionType==='chat'?1000:1800;
    stepTimer.current=setInterval(()=>{
      s=(s%steps.length)+1;
      setGeneratingStep(s);
      setCurrentStepInfo(steps[s-1]);
    },intervalTime);
    try{
      await work();
    }catch(e){
      setError(e.message);
    }finally{
      clearInterval(stepTimer.current);
      setGeneratingStep(0);
      setCurrentStepInfo(null);
      setBusy(false);
    }
  };


  const load=async()=>{
    const me=await api('/me');
    setNotice(me.status==='pending'?'가게 관리 신청을 확인 중이에요. 승인 후 이용할 수 있어요.':'');
    if(!me.placeId){setPlaceId('');return;}
    const [p,c,r,k,cp,d]=await Promise.all([
      api('/proposals'),
      api('/campaigns'),
      api('/report'),
      api('/keywords'),
      api('/coupons'),
      api('/delivery-links')
    ]);
    setCoupons(cp.items);
    setPlaceId(me.placeId);
    setProposals(p.items);
    setCampaigns(c.items);
    setReport(r);
    setKeywords(k.items.map(x=>`#${x}`).join(' '));
    setDeliveryLinks(d.items||{});

    // 최신 제안이 있으면 기본 비주얼로 세팅
    if(p.items[0]?.card){
      setActiveVisual({type:'card',data:p.items[0].card});
    }
  };

  useEffect(()=>{
    load().catch(e=>setError(e.message));
  },[]);

  useEffect(()=>()=>{
    clearInterval(stepTimer.current);
    for(const url of previewUrls.current)URL.revokeObjectURL(url);
  },[]);

  async function register(e){
    e.preventDefault();
    await run(async()=>{
      await api('/register',{method:'POST',body:{placeId:choice}});
      setNotice('가입 신청을 받았어요. 관리자 승인 후 이용할 수 있습니다.');
    });
  }

  // 1. 가벼운 실시간 마케팅 대화 (Fast Conversational Ideation)
  async function send(e){
    e?.preventDefault();
    const text=message.trim();
    if(!text)return;
    setMessage('');
    await run(async()=>{
      const history=chat.map(x=>({
        role:x.role,
        content:x.content
      }));
      const payload={
        message:text,
        history
      };
      const d=await api('/chat',{method:'POST',body:payload});
      setChat(x=>[...x,{role:'user',content:text},{role:'assistant',content:d.reply}]);
    },text,'chat');
  }

  // 2. 논문 기반 One-Pass 확정 정형화 생성 (대화 내역 100% 반영 + 실사 검색 매칭 + 히스토리 자동 보관)
  async function synthesizeVisual(type='carousel',customBrief=''){
    const userText=customBrief||message.trim()||brief.trim();
    const defaultBrief=type==='card'
      ?'사장님 대화 내역을 바탕으로 매력적인 상업용 단일 포스터 제작'
      :`${selectedPlace?.name||'우리 가게'} 대표 매력과 대화 내역을 담은 인스타그램 4:5 캐러셀 카드뉴스`;
    const promptBrief=userText||defaultBrief;
    const history=chat.map(x=>({role:x.role,content:x.content}));

    await run(async()=>{
      const d=await api('/synthesize-visual',{
        method:'POST',
        body:{
          type,
          promptBrief,
          history
        }
      });

      if(d.carousel){
        setActiveVisual({type:'carousel',data:d.carousel});
        setChat(x=>[
          ...x,
          {role:'user',content:`[인스타 카드뉴스 생성 요청] ${promptBrief}`},
          {
            role:'assistant',
            content:'📸 사장님과 나눈 대화 내역을 바탕으로 인스타그램 캐러셀 카드뉴스를 원패스(One-Pass)로 완성했어요! 우측 스튜디오와 하단 보관함에서 확인해 보세요.',
            carousel:d.carousel
          }
        ]);
        setNotice('🎉 대화 내용을 바탕으로 인스타 카드뉴스가 완성되어 우측 스튜디오와 하단 보관함에 보관되었습니다!');
      }else if(d.card){
        setActiveVisual({type:'card',data:d.card});
        setChat(x=>[
          ...x,
          {role:'user',content:`[단일 포스터 생성 요청] ${promptBrief}`},
          {
            role:'assistant',
            content:'📜 사장님과 나눈 대화 내역을 바탕으로 상업용 포스터를 원패스(One-Pass)로 완성했어요! 우측 스튜디오와 하단 보관함에서 확인해 보세요.',
            card:d.card
          }
        ]);
        setNotice('🎉 대화 내용을 바탕으로 단일 포스터가 완성되어 우측 스튜디오와 하단 보관함에 보관되었습니다!');
      }

      // 히스토리(proposals) 자동 갱신
      api('/proposals').then(res=>setProposals(res.items)).catch(()=>{});
    },promptBrief,'visual');
  }

  // 1. 인스타 캐러셀 카드뉴스 쾌속 생성 (대화 내역 100% 반영)
  async function generateQuickCarousel(promptText){
    const briefText=promptText||message.trim()||`${selectedPlace?.name||'우리 가게'} 대표 메뉴와 매력을 담은 인스타 카드뉴스`;
    await synthesizeVisual('carousel',briefText);
  }

  // 2. 연예인·셀럽 추천 스토리 쾌속 생성 (사장님이 지정한 연예인 및 대화 내역 100% 반영)
  async function generateQuickCelebStory(){
    const text=message.trim();
    const briefText=text?`[셀럽 추천 스토리] ${text}`:`${selectedPlace?.name||'우리 가게'} 화제의 인기 아이돌·셀럽 극찬 맛집 스토리`;
    await synthesizeVisual('carousel',briefText);
  }

  // 3. 파격 할인 단일 포스터 쾌속 생성 (대화 내역 반영 및 실사 사진 결합)
  async function generateQuickPoster(promptText){
    const userText=promptText||message.trim()||'주말 학생 할인 20% 파격 혜택 단일 포스터';
    const briefText=userText.includes('포스터')?userText:`${userText} 단일 포스터로 만들어줘`;
    await synthesizeVisual('card',briefText);
  }


  // 음성 녹음 제어
  async function toggleRecord(){
    if(recording){
      recorder.current?.stop();
      setRecording(false);
      return;
    }
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder){
      setError('이 브라우저에서 녹음할 수 없어요. 보안 연결(HTTPS)인지 확인해 주세요.');
      return;
    }
    try{
      const stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const r=new MediaRecorder(stream);
      recorder.current=r;
      parts.current=[];
      r.ondataavailable=e=>parts.current.push(e.data);
      r.onstop=async()=>{
        stream.getTracks().forEach(t=>t.stop());
        const blob=new Blob(parts.current,{type:r.mimeType||'audio/webm'});
        if(blob.size>4_000_000){
          setError('녹음이 너무 길어요. 4MB 이하로 다시 녹음해 주세요.');
          return;
        }
        await run(async()=>{
          const audio=await readFile(blob);
          const d=await api('/transcribe',{method:'POST',body:{audio,mime:blob.type}});
          setMessage(m=>[m,d.text].filter(Boolean).join(' '));
        });
      };
      r.start();
      setRecording(true);
    }catch(e){
      setError(e.message||'마이크 사용 권한을 확인해 주세요.');
    }
  }

  // 제안 생성
  async function generate(e){
    e?.preventDefault();
    await run(async()=>{
      const d=await api('/proposals',{method:'POST',body:{brief,format}});
      const updated=(await api('/proposals')).items;
      setProposals(updated);
      setBrief('');
      setNotice('포스터 제안을 생성했어요. 우측 스튜디오에서 다듬어 게시해 보세요.');
      if(d.card){
        setActiveVisual({type:'card',data:d.card});
      }
      if(d.hasImage)await showImage(d.id);
    });
  }

  async function showImage(id){
    if(preview[id])return;
    const r=await fetch(`/api/owner/proposals/${id}/image`,{headers:await authHeaders()});
    if(!r.ok)throw new Error('이미지를 불러오지 못했어요.');
    const url=URL.createObjectURL(await r.blob());
    previewUrls.current.push(url);
    setPreview(x=>({...x,[id]:url}));
  }

  // 현재 활성화된 비주얼(캐러셀 or 단일 포스터) 즉시 게시
  async function quickPublishActive(){
    if(!activeVisual?.data)return;
    await run(async()=>{
      if(activeVisual.type==='carousel'){
        const carousel=activeVisual.data;
        const coverPng=await generateCarouselSlideBase64(carousel.slides[0],0,carousel.slides.length,carousel,selectedPlace?.name);
        await api('/quick-publish',{method:'POST',body:{carousel,image:coverPng||undefined}});
        setCampaigns((await api('/campaigns')).items);
        setNotice('🎉 인스타그램 캐러셀 소식을 게시했어요! 주민 화면 가게 카드에 바로 보입니다.');
      }else{
        const card=activeVisual.data;
        const image=generatePromoImageBase64(card,selectedPlace?.name);
        const {bgImage,...clean}=card;
        await api('/quick-publish',{method:'POST',body:{card:clean,image}});
        setCampaigns((await api('/campaigns')).items);
        setNotice('🎉 포스터를 게시했어요. 주민 화면의 가게 카드와 상세 화면에 바로 보여요.');
      }
    });
  }

  async function quickPublish(card){
    if(!card)return;
    await run(async()=>{
      const image=generatePromoImageBase64(card,selectedPlace?.name);
      const {bgImage,...clean}=card;
      await api('/quick-publish',{method:'POST',body:{card:clean,image}});
      setCampaigns((await api('/campaigns')).items);
      setNotice('🎉 포스터를 게시했어요. 주민 화면의 가게 카드와 상세 화면에 바로 보여요.');
    });
  }

  function updateProposalCard(id,card){
    setProposals(list=>list.map(p=>p.id===id?{...p,card}:p));
    api(`/proposals/${id}`,{method:'PATCH',body:{card}}).catch(()=>{});
  }

  async function review(id,status){
    await run(async()=>{
      await api(`/proposals/${id}`,{method:'PATCH',body:{status}});
      setProposals((await api('/proposals')).items);
    });
  }

  async function saveCampaign(e){
    e.preventDefault();
    await run(async()=>{
      await api('/campaigns',{method:'POST',body:campaign});
      setCampaigns((await api('/campaigns')).items);
      setCampaign({title:'',body:'',status:'draft',proposalId:''});
      setNotice('캠페인을 저장했어요.');
    });
  }

  async function removeCampaign(id){
    if(!window.confirm('이 캠페인을 삭제할까요?'))return;
    await run(async()=>{
      await api(`/campaigns/${id}`,{method:'DELETE'});
      setCampaigns((await api('/campaigns')).items);
    });
  }

  async function refreshAdmin(){
    setAdminLoaded(false);
    setPending([]);
    await run(async()=>{
      setPending((await api('/admin/requests')).items);
      setAdminLoaded(true);
    });
  }

  async function decide(id,approve){
    await run(async()=>{
      await api(`/admin/requests/${id}`,{method:'POST',body:{approve}});
      setPending((await api('/admin/requests')).items);
    });
  }

  const chart=(title,values)=>(
    <div className="owner-chart">
      <h3>{title}</h3>
      {Object.entries(values||{}).sort((a,b)=>b[1]-a[1]).map(([label,count])=>(
        <div className="owner-bar" key={label}>
          <span>{label}</span>
          <div><i style={{width:`${Math.max(3,100*count/(report?.totalViews||1))}%`}}/></div>
          <b>{count}</b>
        </div>
      ))}
    </div>
  );

  return (
    <div className="owner-page">
      <button className="text-link" onClick={onBack}><ArrowLeft size={18}/> 월계밥상으로</button>
      <div className="page-heading">
        <div className="badge-title">
          <h1>가게를 <mark className="hl">알리는</mark> 공간</h1>
          {(selectedPlace||admin)&&<span className="title-badge">{selectedPlace?.name||'관리자'}</span>}
        </div>
      </div>

      {admin&&<MenuReview/>}
      {admin&&(
        <section className="owner-card">
          <h2>사장님 신청 승인</h2>
          <p className="muted">관리자 계정에만 보여요. 신청한 계정이 실제 가게 사장님인지 확인한 뒤 승인해 주세요.</p>
          <button className="button outline" disabled={busy} onClick={refreshAdmin}>신청 목록 불러오기</button>
          {adminLoaded&&!pending.length&&<p className="muted">대기 중인 신청이 없어요.</p>}
          <div className="owner-list">
            {pending.map(a=>(
              <article className="owner-list-item" key={a.id}>
                <small>{new Date(a.createdAt).toLocaleDateString('ko-KR')} 신청</small>
                <h3>{places.find(p=>p.id===a.placeId)?.name||a.placeId}</h3>
                <p>{a.email}</p>
                <div className="owner-actions">
                  <button className="button lime" disabled={busy} onClick={()=>decide(a.id,true)}>승인</button>
                  <button className="button outline" disabled={busy} onClick={()=>decide(a.id,false)}>거절</button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {!placeId?(
        admin?null:(
          <section className="owner-card">
            <h2>내 가게 관리 신청</h2>
            <p>현재 로그인한 계정으로 신청합니다. 운영자가 가게 관리 권한을 확인한 뒤 승인해요.</p>
            <form onSubmit={register}>
              <label>
                내 가게
                <select required value={choice} onChange={e=>setChoice(e.target.value)}>
                  <option value="">가게 선택</option>
                  {places.map(p=><option key={p.id} value={p.id}>{p.name} · {p.address}</option>)}
                </select>
              </label>
              <div className="owner-apply-actions">
                <button className="button dark" disabled={busy}>관리 권한 신청</button>
                <button type="button" className="button outline" onClick={()=>run(()=>load())}>승인 상태 다시 확인</button>
              </div>
            </form>
          </section>
        )
      ):(
        <>
          <div className="owner-identity">
            <b>{selectedPlace?.name||'내 가게'}</b>
            <span style={{fontSize:'12px',color:'#4d7c0f',fontWeight:700}}>✓ 사장님 인증 완료</span>
          </div>

          {/* 탭 네비게이션: AI 홍보 대화와 제안 검토를 'AI 홍보 스튜디오'로 통합 */}
          <div className="owner-tabs">
            {[
              ['studio','AI 홍보 스튜디오 (대화+제안+캐러셀)'],
              ['campaigns','캠페인 관리'],
              ['keywords','가게 키워드'],
              ['delivery','배달앱 링크'],
              ['coupons','단골 쿠폰'],
              ['report','성과 리포트']
            ].map(([id,label])=>(
              <button key={id} className={section===id?'active':''} onClick={()=>setSection(id)}>
                {label}
              </button>
            ))}
          </div>

          {/* =========================================================================
              통합 섹션 1: AI 홍보 스튜디오 (대화창 + 실시간 캐러셀/포스터 뷰어 + 제안 보관함)
          ========================================================================= */}
          {section==='studio'&&(
            <section className="owner-card studio-card">
              {/* 스튜디오 상단 헤더 & 원클릭 퀵 액션 */}
              <div className="studio-header">
                <div>
                  <h2 style={{margin:'0 0 6px',fontSize:'24px',fontWeight:900,color:'#0f172a'}}>
                    🎨 AI 홍보 스튜디오
                  </h2>
                  <p className="muted" style={{margin:0,fontSize:'13px'}}>
                    AI와 대화하며 인스타그램 캐러셀(슬라이드 카드뉴스)과 포스터를 만들고, 동네 풍경·음식·연예인 사진을 검색해 자유롭게 꾸며보세요.
                  </p>
                </div>

                <div className="studio-quick-chips">
                  <button
                    type="button"
                    className="chip-btn"
                    disabled={busy}
                    onClick={()=>generateQuickCarousel()}
                  >
                    🔥 인스타 캐러셀 카드뉴스 (3~5장)
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    disabled={busy}
                    onClick={generateQuickCelebStory}
                    title="입력창에 특정 연예인/아이돌(예: 카리나, 뉴진스 등)을 적고 누르면 해당 인물로 제작됩니다"
                  >
                    ⭐ 연예인·셀럽 먹방 추천 스토리
                  </button>
                  <button
                    type="button"
                    className="chip-btn"
                    disabled={busy}
                    onClick={()=>generateQuickPoster()}
                  >
                    ⚡ 파격 할인 단일 포스터
                  </button>
                </div>
              </div>

              {/* 진행 상태 인디케이터 (상단 전체 진행 바) */}
              {generatingStep>0&&currentStepInfo&&(
                <div style={{background:'#eff6ff',border:'1.5px solid #bfdbfe',borderRadius:'12px',padding:'12px 18px',margin:'14px 0',boxShadow:'0 2px 8px rgba(37,99,235,0.08)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                    <span style={{fontWeight:800,fontSize:'14px',color:'#1e40af'}}>
                      {currentStepInfo.icon} {currentStepInfo.text}
                    </span>
                    <span style={{fontSize:'12px',fontWeight:700,color:'#2563eb'}}>진행 중 ({generatingStep}/4)</span>
                  </div>
                  <div style={{width:'100%',background:'#dbeafe',borderRadius:'99px',height:'8px',overflow:'hidden'}}>
                    <div style={{width:`${generatingStep*25}%`,background:'linear-gradient(90deg, #3b82f6, #1d4ed8)',height:'100%',transition:'width 0.4s ease',borderRadius:'99px'}}/>
                  </div>
                </div>
              )}

              {/* 2단 분할 레이아웃: 좌측 대화창 & 요청 / 우측 실시간 뷰어 & 편집기 */}
              <div className="studio-split-layout">
                {/* 1. 좌측 칼럼: AI 대화 및 기획 요청 */}
                <div className="studio-left-col">
                  <div className="studio-box-title">
                    <span>💬 AI 홍보 대화 & 요청</span>
                    {chat.length>0&&(
                      <button type="button" className="text-link" onClick={()=>setChat([])}>
                        대화 지우기
                      </button>
                    )}
                  </div>

                  <div className="owner-chat studio-chat-box">
                    {chat.length?chat.map((x,i)=>{
                      const cleanContent=x.content.replace(/```(?:json)?[\s\S]*?```/g,'').replace(/\{[\s\S]*?(?:"slides"|"layout")[\s\S]*?\}/g,'').trim();
                      return (
                        <div key={i} className={'owner-chat-msg '+x.role}>
                          <p className={x.role}>{cleanContent||x.content}</p>
                          {x.role==='assistant'&&(x.carousel||x.card)&&(
                            <div className="chat-card-preview-btn">
                              <button
                                type="button"
                                className="button outline small"
                                onClick={()=>setActiveVisual(x.carousel?{type:'carousel',data:x.carousel}:{type:'card',data:x.card})}
                              >
                                👁️ {x.carousel?'캐러셀 카드뉴스 스튜디오에서 보기':'포스터 스튜디오에서 보기'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    }):(
                      <div className="studio-chat-empty">
                        <p style={{margin:'0 0 8px',fontWeight:800,color:'#1e293b'}}>
                          💡 <b>무엇이든 편하게 물어보거나 홍보를 요청해 보세요!</b>
                        </p>
                        <p style={{margin:'0 0 10px',fontSize:'12px',color:'#64748b'}}>
                          AI가 사장님의 고민을 듣고 인스타그램 캐러셀 카드뉴스나 포스터를 즉시 기획해 드립니다.
                        </p>
                        <ul>
                          <li>"인스타 카드뉴스로 대표 메뉴 4장 만들어줘"</li>
                          <li>"카리나(또는 뉴진스) 먹방 추천 스타일로 카드뉴스 만들어줘"</li>
                          <li>"주말 학생 할인 20% 이벤트 포스터 만들어줘"</li>
                          <li>"3번 슬라이드 연예인을 차은우로 바꿔줘"</li>
                          <li>"사진을 광운대역 주변 풍경으로 바꾸고 싶어"</li>
                        </ul>
                      </div>
                    )}
                    {/* 채팅 창 내부 실시간 진행 상태 카드 */}
                    {busy&&currentStepInfo&&(
                      <div className="owner-chat-msg assistant">
                        <div style={{background:'#ffffff',border:'1.5px solid #93c5fd',borderRadius:'15px',padding:'12px 16px',boxShadow:'0 2px 8px rgba(59,130,246,0.1)'}}>
                          <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                            <span style={{fontSize:'16px'}}>{currentStepInfo.icon}</span>
                            <span style={{fontWeight:800,fontSize:'13px',color:'#1e40af'}}>AI 실시간 작업 중...</span>
                            <span style={{fontSize:'11px',color:'#3b82f6',fontWeight:700,marginLeft:'auto'}}>단계 {generatingStep}/4</span>
                          </div>
                          <p style={{margin:0,fontSize:'12.5px',color:'#334155',fontWeight:600}}>
                            {currentStepInfo.text}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* 대화 내역 기반 One-Pass 확정 생성 버튼 바 (대화가 있을 때 노출) */}
                  {chat.length>0&&(
                    <div style={{display:'flex',gap:'8px',margin:'10px 0 6px',flexWrap:'wrap'}}>
                      <button
                        type="button"
                        className="button lime small"
                        disabled={busy}
                        onClick={()=>synthesizeVisual('carousel')}
                        style={{flex:1,minWidth:'150px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',fontWeight:700}}
                        title="지금까지 나눈 대화 내용을 바탕으로 4:5 인스타그램 캐러셀 카드뉴스를 한 번에 생성합니다"
                      >
                        <Sparkles size={14}/> ✨ 대화 내용으로 카드뉴스 완성
                      </button>
                      <button
                        type="button"
                        className="button outline small"
                        disabled={busy}
                        onClick={()=>synthesizeVisual('card')}
                        style={{flex:1,minWidth:'150px',display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',fontWeight:700}}
                        title="지금까지 나눈 대화 내용을 바탕으로 상업용 단일 포스터를 한 번에 생성합니다"
                      >
                        📜 대화 내용으로 단일 포스터 완성
                      </button>
                    </div>
                  )}

                  {/* 대화 입력 폼 (텍스트 + 음성 녹음 + 전송) */}
                  <form className="owner-chat-form" onSubmit={send}>
                    <input
                      value={message}
                      onChange={e=>setMessage(e.target.value)}
                      maxLength={1000}
                      placeholder="홍보 고민, 이벤트 기획을 말해주세요 (빠른 1:1 상담)"
                    />
                    <button
                      type="button"
                      className="button outline"
                      onClick={toggleRecord}
                      aria-label={recording?'녹음 끝내기':'녹음 시작'}
                    >
                      {recording?'끝내기':<Mic size={18}/>}
                    </button>
                    <button className="button dark" disabled={busy||!message.trim()}>
                      <Send size={17}/> 보내기
                    </button>
                  </form>

                  {/* 기획 목적 직접 작성 폼 (이전 proposals 제안 생성 기능 통합) */}
                  <details className="studio-direct-generator" style={{marginTop:'12px',background:'#f8fafc',padding:'10px 14px',borderRadius:'12px',border:'1px solid #e2e8f0'}}>
                    <summary style={{cursor:'pointer',fontSize:'13px',fontWeight:700,color:'#334155'}}>
                      🎯 기획 프롬프트로 바로 생성하기 (포스터 / 카드뉴스)
                    </summary>
                    <div style={{padding:'10px 0 4px'}}>
                      <textarea
                        value={brief}
                        onChange={e=>setBrief(e.target.value)}
                        maxLength={1000}
                        placeholder="예: 광운대 학생들을 위한 가성비 점심 세트와 성시경 연예인 추천을 담은 인스타 카드뉴스"
                        style={{width:'100%',minHeight:'70px',borderRadius:'10px',padding:'10px',boxSizing:'border-box',fontSize:'13px'}}
                      />
                      <div style={{display:'flex',gap:'8px',marginTop:'8px',flexWrap:'wrap'}}>
                        <button
                          type="button"
                          className="button lime"
                          disabled={busy||!brief.trim()}
                          onClick={()=>synthesizeVisual('carousel',brief)}
                        >
                          📸 인스타 캐러셀 카드뉴스 생성
                        </button>
                        <button
                          type="button"
                          className="button outline"
                          disabled={busy||!brief.trim()}
                          onClick={()=>synthesizeVisual('card',brief)}
                        >
                          📜 단일 포스터 생성
                        </button>
                      </div>
                    </div>
                  </details>
                </div>

                {/* 2. 우측 칼럼: 실시간 비주얼 스튜디오 (캐러셀 / 포스터 렌더링 & 편집) */}
                <div className="studio-right-col">
                  <div className="studio-box-title">
                    <span>🎨 실시간 비주얼 스튜디오</span>
                    {activeVisual&&(
                      <span className="badge-tag">
                        {activeVisual.type==='carousel'?'인스타그램 캐러셀':'단일 포스터'}
                      </span>
                    )}
                  </div>

                  <div className="studio-viewer-box">
                    {/* 비주얼 스튜디오 화면 내 실시간 상황별 진행 단계 표시 */}
                    {busy&&currentStepInfo&&(
                      <div style={{background:'#ffffff',border:'2px solid #3b82f6',borderRadius:'16px',padding:'16px 20px',marginBottom:'14px',boxShadow:'0 4px 16px rgba(59,130,246,0.15)'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                          <span style={{fontSize:'14px',fontWeight:800,color:'#1e40af'}}>
                            {currentStepInfo.icon} {currentStepInfo.text}
                          </span>
                          <span style={{background:'#eff6ff',color:'#2563eb',padding:'3px 8px',borderRadius:'99px',fontSize:'11px',fontWeight:800}}>
                            비주얼 렌더링 {generatingStep}/4
                          </span>
                        </div>
                        <div style={{width:'100%',background:'#dbeafe',borderRadius:'99px',height:'6px',overflow:'hidden'}}>
                          <div style={{width:`${generatingStep*25}%`,background:'linear-gradient(90deg, #3b82f6, #1d4ed8)',height:'100%',transition:'width 0.4s ease'}}/>
                        </div>
                      </div>
                    )}

                    {activeVisual?.type==='carousel'&&(

                      <div>
                        <InstagramCarouselView
                          carousel={activeVisual.data}
                          shopName={selectedPlace?.name}
                          editable
                          onEdit={c=>setActiveVisual({type:'carousel',data:c})}
                        />
                        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                          <button
                            type="button"
                            className="button lime full"
                            disabled={busy}
                            onClick={quickPublishActive}
                          >
                            🚀 인스타그램 카드뉴스 우리 가게 소식으로 바로 게시
                          </button>
                        </div>
                      </div>
                    )}

                    {activeVisual?.type==='card'&&(
                      <div>
                        <PromoCardCanvas
                          card={activeVisual.data}
                          shopName={selectedPlace?.name}
                          editable
                          onEdit={c=>setActiveVisual({type:'card',data:c})}
                        />
                        <div style={{display:'flex',gap:'8px',marginTop:'14px'}}>
                          <button
                            type="button"
                            className="button lime full"
                            disabled={busy}
                            onClick={quickPublishActive}
                          >
                            🚀 이 포스터로 바로 게시
                          </button>
                        </div>
                      </div>
                    )}

                    {!activeVisual&&(
                      <div className="studio-empty-viewer">
                        <div style={{fontSize:'42px',marginBottom:'12px'}}>✨</div>
                        <h3>제작 중인 홍보 콘텐츠가 없습니다</h3>
                        <p className="muted">
                          좌측에서 AI와 대화하거나 상단의 <b>[🔥 인스타 캐러셀 카드뉴스]</b> 버튼을 누르면 실시간으로 슬라이드가 생성되고 사진을 교체할 수 있습니다.
                        </p>
                        <button
                          type="button"
                          className="button lime"
                          disabled={busy}
                          onClick={()=>generateQuickCarousel('월계1동 골목 맛집 인스타 캐러셀 카드뉴스')}
                        >
                          🔥 예시 인스타 카드뉴스 1초 생성
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3. 하단 섹션: 제안 히스토리 및 시안 보관함 (이전 proposals 검토 목록 통합) */}
              <div className="studio-history-section">
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'14px'}}>
                  <div>
                    <h3 style={{margin:0,fontSize:'18px',fontWeight:800}}>
                      📁 제안 히스토리 및 보관된 시안 ({proposals.length}개)
                    </h3>
                    <p className="muted" style={{margin:'4px 0 0',fontSize:'12px'}}>
                      이전에 생성되었거나 검토 중인 시안입니다. 클릭하면 위의 스튜디오로 불러와 수정 및 게시할 수 있습니다.
                    </p>
                  </div>
                </div>

                {proposals.length===0?(
                  <p className="muted">보관된 시안이 아직 없습니다.</p>
                ):(
                  <div className="studio-proposals-grid">
                    {proposals.map(p=>{
                      const card=p.card?(preview[p.id]?{...p.card,bgImage:preview[p.id]}:p.card):null;
                      return (
                        <article className="studio-history-card" key={p.id}>
                          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                            <div style={{display:'flex',gap:'6px',alignItems:'center'}}>
                              <span className="badge-tag" style={{fontSize:'10px',padding:'2px 6px'}}>
                                {p.carousel?'📸 캐러셀':card?'📜 포스터':'💡 시안'}
                              </span>
                              <small style={{color:'#64748b',fontSize:'11px'}}>
                                {new Date(p.createdAt).toLocaleDateString('ko-KR')}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="button outline small"
                              onClick={()=>{
                                if(p.carousel){
                                  setActiveVisual({type:'carousel',data:p.carousel});
                                }else if(card){
                                  setActiveVisual({type:'card',data:card});
                                }
                                window.scrollTo({top:200,behavior:'smooth'});
                              }}
                            >
                              불러오기
                            </button>
                          </div>

                          {p.carousel?(
                            <div>
                              <div style={{fontWeight:800,fontSize:'13px',color:'#0f172a',marginBottom:'4px'}}>
                                {p.carousel.concept||'인스타그램 캐러셀'}
                              </div>
                              <p style={{fontSize:'12px',color:'#475569',margin:'0 0 8px',lineHeight:1.4}}>
                                총 {p.carousel.slides?.length||0}장 슬라이드 ({p.carousel.slides?.[0]?.title||''})
                              </p>
                              {p.carousel.slides?.[0]?.image&&(
                                <img
                                  src={p.carousel.slides[0].image.startsWith('http')?`/api/owner/proxy-image?url=${encodeURIComponent(p.carousel.slides[0].image)}`:p.carousel.slides[0].image}
                                  alt="표지"
                                  style={{width:'100%',height:'140px',objectFit:'cover',borderRadius:'10px',border:'1px solid #e2e8f0'}}
                                />
                              )}
                            </div>
                          ):card?(
                            <div style={{transform:'scale(0.85)',transformOrigin:'top center',margin:'-15px 0'}}>
                              <PromoCardCanvas card={card} shopName={selectedPlace?.name} editable={false}/>
                            </div>
                          ):(
                            <div>
                              <p style={{fontSize:'13px',margin:'6px 0'}}>{p.copy}</p>
                              {preview[p.id]?(
                                <img className="owner-generated" src={preview[p.id]} alt="미리보기" style={{maxHeight:'160px'}}/>
                              ):p.hasImage?(
                                <button type="button" className="text-link" onClick={()=>run(()=>showImage(p.id))}>
                                  이미지 불러오기
                                </button>
                              ):null}
                            </div>
                          )}

                          <div className="owner-actions" style={{marginTop:'10px'}}>
                            {card&&p.status!=='rejected'&&(
                              <button type="button" className="button lime small" onClick={()=>quickPublish(card)}>
                                바로 게시
                              </button>
                            )}
                            {p.carousel&&p.status!=='rejected'&&(
                              <button type="button" className="button lime small" onClick={()=>{setActiveVisual({type:'carousel',data:p.carousel});quickPublishActive();}}>
                                바로 게시
                              </button>
                            )}
                            {p.status==='review'&&(
                              <>
                                <button type="button" className="button outline small" onClick={()=>review(p.id,'approved')}>
                                  승인
                                </button>
                                <button type="button" className="button outline small" onClick={()=>review(p.id,'rejected')}>
                                  사용 안 함
                                </button>
                              </>
                            )}
                          </div>
                        </article>
                      );

                    })}
                  </div>
                )}
              </div>
            </section>
          )}

          {/* =========================================================================
              섹션 2: 사장님 캠페인 관리
          ========================================================================= */}
          {section==='campaigns'&&(
            <section className="owner-card">
              <h2>사장님 캠페인</h2>
              <p className="muted">이웃 누구나 쓰는 ‘소식’과 별개로, 승인받은 사장님 계정만 게시합니다.</p>
              <form onSubmit={saveCampaign}>
                <label>
                  제목
                  <input required maxLength={100} value={campaign.title} onChange={e=>setCampaign(x=>({...x,title:e.target.value}))}/>
                </label>
                <label>
                  내용
                  <textarea required maxLength={1500} value={campaign.body} onChange={e=>setCampaign(x=>({...x,body:e.target.value}))}/>
                </label>
                <label>
                  승인된 이미지 제안
                  <select value={campaign.proposalId} onChange={e=>setCampaign(x=>({...x,proposalId:e.target.value}))}>
                    <option value="">이미지 없이 게시</option>
                    {proposals.filter(p=>p.status==='approved').map(p=>(
                      <option key={p.id} value={p.id}>{p.copy.slice(0,40)}</option>
                    ))}
                  </select>
                </label>
                <label>
                  공개 상태
                  <select value={campaign.status} onChange={e=>setCampaign(x=>({...x,status:e.target.value}))}>
                    <option value="draft">임시 저장</option>
                    <option value="published">게시</option>
                  </select>
                </label>
                <button className="button dark" disabled={busy}>저장</button>
              </form>
              <div className="owner-list">
                {campaigns.map(c=>(
                  <article className="owner-list-item" key={c.id}>
                    <small>{c.status==='published'?'게시 중':'임시 저장'} · {new Date(c.updatedAt).toLocaleDateString('ko-KR')}</small>
                    <h3>{c.title}</h3>
                    <p>{c.body}</p>
                    <div className="owner-actions">
                      <button className="button outline" onClick={()=>setCampaign({id:c.id,title:c.title,body:c.body,status:c.status,proposalId:c.proposalId||''})}>수정</button>
                      <button className="button outline" onClick={()=>removeCampaign(c.id)}>삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              섹션 3: 단골 쿠폰
          ========================================================================= */}
          {section==='coupons'&&(
            <section className="owner-card">
              <h2>단골 쿠폰</h2>
              <p className="muted">골목냥 레벨이 정한 단계 이상인 주민에게 쿠폰이 열려요. 주민이 가게에서 ‘사용하기’를 누르면 사용 완료로 바뀌니, 화면을 확인하고 혜택을 주세요.</p>
              <form onSubmit={e=>{
                e.preventDefault();
                run(async()=>{
                  await api('/coupons',{method:'POST',body:{title:coupon.title,minLevel:Number(coupon.minLevel)}});
                  setCoupons((await api('/coupons')).items);
                  setCoupon({title:'',minLevel:2});
                  setNotice('쿠폰을 등록했어요.');
                });
              }}>
                <label>
                  혜택 내용
                  <input required maxLength={60} value={coupon.title} onChange={e=>setCoupon(x=>({...x,title:e.target.value}))} placeholder="예: 아메리카노 사이즈업"/>
                </label>
                <label>
                  열리는 레벨
                  <select value={coupon.minLevel} onChange={e=>setCoupon(x=>({...x,minLevel:e.target.value}))}>
                    {[1,2,3,4,5].map(n=><option key={n} value={n}>Lv.{n} 이상</option>)}
                  </select>
                </label>
                <button className="button dark" disabled={busy}>쿠폰 등록</button>
              </form>
              <div className="owner-list">
                {coupons.map(c=>(
                  <article className="owner-list-item" key={c.id}>
                    <small>Lv.{c.minLevel} 이상</small>
                    <h3>{c.title}</h3>
                    <div className="owner-actions">
                      <button className="button outline" onClick={()=>run(async()=>{await api('/coupons/'+c.id,{method:'DELETE'});setCoupons((await api('/coupons')).items);})}>삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* =========================================================================
              섹션 4: 가게 키워드
          ========================================================================= */}
          {section==='keywords'&&(
            <section className="owner-card">
              <h2>가게 키워드</h2>
              <p className="muted">직접 확인한 가게의 특징을 적어 주세요. 가게 상세에 ‘사장님 키워드’로 보이고, 모임의 AI 최종 선택에 참고 자료로 쓰여요. 확인되지 않은 내용은 사실로 단정하지 않아요.</p>
              <form onSubmit={e=>{
                e.preventDefault();
                run(async()=>{
                  const items=keywords.split(/[\s,]+/).map(x=>x.replace(/^#+/,'').trim()).filter(Boolean);
                  if(items.length>10)throw new Error('키워드는 최대 10개까지 입력해 주세요.');
                  const d=await api('/keywords',{method:'PUT',body:{items}});
                  setKeywords(d.items.map(x=>`#${x}`).join(' '));
                  setNotice('가게 키워드를 저장했어요.');
                });
              }}>
                <label>
                  키워드 (최대 10개)
                  <input value={keywords} maxLength={300} onChange={e=>setKeywords(e.target.value)} placeholder="#혼밥 #단체 #가성비"/>
                </label>
                <button className="button dark" disabled={busy}>키워드 저장</button>
              </form>
            </section>
          )}

          {/* =========================================================================
              섹션 5: 성과 리포트
          ========================================================================= */}
          {section==='report'&&(
            <section className="owner-card">
              <h2>성과 리포트</h2>
              <p className="muted">{report?.period||'조회 기록을 불러오고 있어요.'} · 실제 매장 방문이나 매출 전환은 측정하지 않습니다.</p>
              <button className="text-link" onClick={()=>run(async()=>setReport(await api('/report')))}>새로고침</button>
              <div className="owner-total"><b>{report?.totalViews??0}</b><span>가게 상세 조회</span></div>
              <p className="muted">연령·성별·인원·예산·식사 시간은 이용자가 자발적으로 입력한 값만 집계하며 미입력은 ‘미응답’입니다.</p>
              {chart('연령',report?.age)}
              {chart('성별',report?.gender)}
              {chart('인원 수',report?.people)}
              {chart('원하는 금액 (원)',report?.budget)}
              {chart('원하는 식사 시간',report?.mealTime)}
            </section>
          )}
          {/* =========================================================================
              섹션 6: 배달앱 링크
          ========================================================================= */}
          {section==='delivery'&&(
            <section className="owner-card">
              <h2>배달앱 링크</h2>
              <p className="muted">각 배달앱에서 내 가게의 공유 주소를 복사해 붙여 주세요. 등록한 링크는 주민의 가게 상세에 주문 버튼으로 표시돼요. 주문·결제는 해당 배달앱에서 진행됩니다.</p>
              <form onSubmit={e=>{
                e.preventDefault();
                run(async()=>{
                  const d=await api('/delivery-links',{method:'PUT',body:{items:deliveryLinks}});
                  setDeliveryLinks(d.items);
                  await onLinksSaved?.();
                  setNotice('배달앱 링크를 저장했어요. 찾기 탭에서도 확인할 수 있어요.');
                });
              }}>
                {[['baemin','배달의민족'],['yogiyo','요기요'],['coupang','쿠팡이츠']].map(([key,label])=>(
                  <label key={key}>
                    {label} 가게 공유 링크
                    <input type="text" inputMode="url" value={deliveryLinks[key]||''} onChange={e=>setDeliveryLinks(x=>({...x,[key]:e.target.value}))} placeholder="https://"/>
                  </label>
                ))}
                <button className="button dark" disabled={busy}>링크 저장</button>
                {error&&<p role="alert" className="notice">{error}</p>}
                {notice&&<p role="status" className="notice">{notice}</p>}
              </form>
            </section>
          )}
        </>
      )}

      {error&&<p className="notice" role="alert">{error}</p>}
      {notice&&<p className={'owner-status'+(notice.includes('확인 중')?' pending':'')} role="status">{notice.includes('확인 중')?<><span className="owner-status-dot"/><b>승인 대기 중</b> 관리자가 가게 사장님이 맞는지 확인하고 있어요. 승인되면 바로 쓸 수 있어요.</>:notice}</p>}
    </div>
  );
}
