import express from 'express';
import {createHash,randomUUID,timingSafeEqual} from 'node:crypto';
import {getCommunityPlaces} from './services/communityService.js';
import {ownerMarketingStore as store} from './services/ownerMarketingStore.js';

export function createOwnerMarketingRouter(){
  const router=express.Router();
  const secret=()=>process.env.OPENROUTER_API_KEY?.trim();
  const owner=(req,res,next)=>{const token=req.get('authorization')?.replace(/^Bearer /i,'');const s=store.session(token);if(!s)return res.status(401).json({error:'사장님 인증이 필요해요.'});req.owner=s;req.ownerToken=token;next();};
  const admin=(req,res,next)=>{const expected=process.env.OWNER_ADMIN_KEY?.trim(),given=req.get('x-owner-admin-key')||'';if(!expected||expected.length<24)return res.status(503).json({error:'관리자 키 설정이 필요해요.'});const hash=v=>createHash('sha256').update(v).digest();if(!timingSafeEqual(hash(expected),hash(given)))return res.status(401).json({error:'관리자 인증에 실패했어요.'});next();};
  const placeExists=async id=>(await getCommunityPlaces()).items.some(p=>p.id===id);
  const clean=(v,max)=>typeof v==='string'?v.trim().slice(0,max):'';
  const attempts=new Map();
  const limit=(max,period=60000)=>(req,res,next)=>{const key=`${req.ip}:${req.path}`,now=Date.now(),row=attempts.get(key);if(!row||row.until<now){attempts.set(key,{count:1,until:now+period});return next();}if(row.count++>=max)return res.status(429).json({error:'요청이 많아요. 잠시 후 다시 시도해 주세요.'});next();};
  const ai=async(path,body,asForm=false)=>{if(!secret())throw Object.assign(new Error('OPENROUTER_API_KEY 설정이 필요해요.'),{status:503});const response=await fetch(`https://openrouter.ai/api/v1/${path}`,{method:'POST',headers:{Authorization:`Bearer ${secret()}`,...(asForm?{}:{'Content-Type':'application/json'})},body:asForm?body:JSON.stringify(body),signal:AbortSignal.timeout(path==='images'?120000:60000)});const json=await response.json().catch(()=>({}));if(!response.ok)throw Object.assign(new Error(json.error?.message||'AI 요청에 실패했어요.'),{status:502});return json;};
  const failure=(res,e)=>res.status(e.status||500).json({error:e.name==='TimeoutError'?'AI 응답이 지연되고 있어요. 다시 시도해 주세요.':e.message});

  router.post('/register',limit(5,3600000),async(req,res)=>{try{const placeId=clean(req.body?.placeId,120),email=clean(req.body?.email,150).toLowerCase(),password=req.body?.password;if(!placeId||!await placeExists(placeId))return res.status(400).json({error:'등록된 가게를 선택해 주세요.'});if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||typeof password!=='string'||password.length<12||password.length>128)return res.status(400).json({error:'이메일과 12자 이상의 비밀번호를 입력해 주세요.'});if(!store.requestAccount(placeId,email,password))return res.status(409).json({error:'이미 신청한 이메일이에요.'});res.status(201).json({status:'pending'});}catch(e){failure(res,e);}});
  router.get('/admin/requests',admin,(req,res)=>res.json({items:store.pendingAccounts()}));
  router.post('/enter',limit(30,60000),async(req,res)=>{try{const placeId=clean(req.body?.placeId,120);if(!placeId||!await placeExists(placeId))return res.status(400).json({error:'등록된 가게를 선택해 주세요.'});const token=store.issueSession(placeId);res.json({token,placeId});}catch(e){failure(res,e);}});
  router.post('/login',limit(30,60000),async(req,res)=>{const placeId=clean(req.body?.placeId,120);if(placeId){if(!await placeExists(placeId))return res.status(400).json({error:'등록된 가게를 선택해 주세요.'});return res.json({token:store.issueSession(placeId),placeId});}const email=clean(req.body?.email,150).toLowerCase(),password=req.body?.password;if(typeof password!=='string')return res.status(400).json({error:'비밀번호를 입력해 주세요.'});const result=store.login(email,password);if(!result)return res.status(401).json({error:'계정이 승인되지 않았거나 로그인 정보가 틀렸어요.'});res.json(result);});
  router.post('/logout',owner,(req,res)=>{store.logout(req.ownerToken);res.json({ok:true});});
  router.get('/me',owner,(req,res)=>res.json({placeId:req.owner.placeId,aiReady:!!secret()}));
  router.get('/public-campaigns',async(req,res)=>{
    const all = store.allPublicCampaigns();
    const map = {};
    for (const c of all) {
      if (!map[c.placeId] || new Date(c.updatedAt) > new Date(map[c.placeId].updatedAt)) {
        map[c.placeId] = c;
      }
    }
    res.json({ map, items: map });
  });
  router.get('/campaigns/:placeId',async(req,res)=>{try{if(!await placeExists(req.params.placeId))return res.status(404).json({error:'가게를 찾지 못했어요.'});res.json({items:store.publicCampaigns(req.params.placeId)});}catch(e){failure(res,e);}});
  router.get('/campaigns',owner,(req,res)=>res.json({items:store.campaigns(req.owner.placeId)}));
  router.post('/campaigns',owner,(req,res)=>{const title=clean(req.body?.title,100),body=clean(req.body?.body,1500),status=req.body?.status==='published'?'published':'draft',proposalId=clean(req.body?.proposalId,100),card=req.body?.card,image=typeof req.body?.image==='string'?req.body.image:undefined;if(!title||!body)return res.status(400).json({error:'제목과 내용을 입력해 주세요.'});if(proposalId&&!store.proposals(req.owner.placeId).some(p=>p.id===proposalId&&p.status==='approved'))return res.status(400).json({error:'승인한 콘텐츠만 캠페인에 연결할 수 있어요.'});const row=store.saveCampaign(req.owner.placeId,{title,body,status,proposalId,card,image},clean(req.body?.id,100)||undefined);if(!row)return res.status(404).json({error:'캠페인을 찾지 못했어요.'});res.json(row);});
  router.post('/quick-publish',owner,(req,res)=>{
    const title=clean(req.body?.title,100),body=clean(req.body?.body,1500),card=req.body?.card,image=typeof req.body?.image==='string'?req.body.image:undefined;
    if(!title||!body)return res.status(400).json({error:'제목과 내용을 입력해 주세요.'});
    const row=store.saveCampaign(req.owner.placeId,{title,body,status:'published',card,image});
    res.json({ok:true,campaign:row});
  });
  router.delete('/campaigns/:id',owner,(req,res)=>res.status(store.removeCampaign(req.owner.placeId,req.params.id)?200:404).json({ok:true}));
  router.get('/proposals',owner,(req,res)=>res.json({items:store.proposals(req.owner.placeId).map(({image,...p})=>({...p,hasImage:!!image}))}));
  router.get('/proposals/:id/image',owner,(req,res)=>{const p=store.proposals(req.owner.placeId).find(x=>x.id===req.params.id);if(!p?.image)return res.status(404).end();res.type('png').send(Buffer.from(p.image,'base64'));});
  router.get('/campaigns/:placeId/:id/image',(req,res)=>{const c=store.publicCampaigns(req.params.placeId).find(x=>x.id===req.params.id);if(c?.image){const match=c.image.match(/^data:image\/png;base64,(.+)$/);if(match)return res.type('png').send(Buffer.from(match[1],'base64'));}const p=store.proposals(req.params.placeId).find(x=>x.id===c?.proposalId&&x.status==='approved');if(!p?.image)return res.status(404).end();res.type('png').send(Buffer.from(p.image,'base64'));});
  router.patch('/proposals/:id',owner,(req,res)=>{const status=req.body?.status,card=req.body?.card;if(status&&!['approved','rejected'].includes(status))return res.status(400).json({error:'검토 상태가 올바르지 않아요.'});const row=store.reviewProposal(req.owner.placeId,req.params.id,status,card);if(!row)return res.status(404).json({error:'제안을 찾지 못했어요.'});res.json({id:row.id,status:row.status,card:row.card});});
  router.post('/chat',owner,limit(20),async(req,res)=>{
    const message=clean(req.body?.message,1000),history=Array.isArray(req.body?.history)?req.body.history.slice(-8).filter(x=>['user','assistant'].includes(x.role)&&typeof x.content==='string').map(x=>({role:x.role,content:x.content.slice(0,1000)})):[];
    if(!message)return res.status(400).json({error:'대화 내용을 입력해 주세요.'});
    try{
      const place=(await getCommunityPlaces()).items.find(p=>p.id===req.owner.placeId);
      const placeName=place?.name||'동네 가게';
      const placeKind=place?.kind||'음식점';
      const sysPrompt=`당신은 월계1동 식당 [${placeName} (${placeKind})] 사장님을 돕는 전문 홍보 조언자이자 프로 포스터 그래픽 디자이너입니다.
사장님과의 대화를 통해 단순한 글상자가 아닌, 매장 부착 및 SNS에서 시선을 사로잡는 강력하고 감각적인 '이벤트 홍보 포스터'를 함께 기획하고 만듭니다.
포스터에는 사람들의 눈길을 끄는 대형 혜택 숫자(heroMetric), 감성 부제(catchphrase), 명확한 행사 기간/시간(period), 도장/스탬프(stamp), 그리고 최적의 포스터 레이아웃 템플릿(layout)이 포함됩니다.
한국어로 친절하고 실용적으로 답변하세요.
사장님이 홍보 아이디어, 이벤트, 할인, 신메뉴, 학생 혜택 등을 요청하거나 대화 중에 홍보할 내용이 정해지면, 답변 본문 끝에 반드시 아래 형태의 JSON 코드 블록을 포함해 주세요:
\`\`\`json
{
  "layout": "bold-impact | retro-chalkboard | magazine-editorial | neon-night | ticket-coupon 중 가장 어울리는 포스터 레이아웃 1개",
  "theme": "warm | lime | dark | retro | pastel | red-hot | indigo 중 테마 1개",
  "title": "포스터 메인 타이틀 (예: 비 오는 날 따뜻한 김치전 할인)",
  "catchphrase": "시선을 끄는 감성 부제 한 줄 (예: 빗소리와 함께 지글지글, 막걸리 한 잔의 여유)",
  "heroMetric": "포스터 중앙에 가장 크고 굵게 박힐 숫자/핵심키워드 (예: 20% OFF, 1+1, 8,900원, FREE, 1,000원)",
  "benefit": "구체적인 혜택 내용 (예: 김치전 + 막걸리 세트 20% 즉시 할인)",
  "period": "이벤트 기간/시간 조건 (예: 비 오는 날 한정, 오늘 점심 11:30~14:00, 매주 금요일 밤 9시~)",
  "badge": "오늘의 혜택 | 학생 할인 | 사장님 추천 | 시즌 한정 | 타임 세일 | 깜짝 이벤트 중 택1",
  "stamp": "사장님 쏜다 | LIMITED | BEST | STUDENT ONLY | HOT | SPECIAL 중 택1",
  "body": "방문 고객에게 전하는 친절하고 생생한 홍보 본문 (2~3문장)"
}
\`\`\`
사장님이 "숫자를 더 크게", "레트로 칠판 느낌으로", "혜택을 음료수 무료로", "테마를 네온 다크로" 등 피드백을 주면 이전 설정을 반영하여 즉시 업데이트된 JSON을 다시 제공하세요.
홍보와 무관한 단순 질문일 때는 JSON 없이 자연스럽게 답해도 됩니다.`;

      const data=await ai('chat/completions',{model:process.env.OWNER_TEXT_MODEL||'openai/gpt-4o-mini',temperature:0.7,max_tokens:800,messages:[{role:'system',content:sysPrompt},...history,{role:'user',content:message}]});
      const rawText=data.choices?.[0]?.message?.content||'답변을 받지 못했어요.';
      let card=null;
      const jsonMatch=rawText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if(jsonMatch){
        try{card=JSON.parse(jsonMatch[1]);}catch{}
      }
      const cleanReply=rawText.replace(/```(?:json)?\s*\{[\s\S]*?\}\s*```/,'').trim();
      res.json({reply:cleanReply||rawText,card});
    }catch(e){failure(res,e);}
  });
  router.post('/transcribe',owner,limit(12),async(req,res)=>{const audio=req.body?.audio,mime=clean(req.body?.mime,80),match=typeof audio==='string'&&audio.match(/^data:audio\/(webm|mp4|mpeg|ogg|wav)(?:;[^,]+)*;base64,/);if(!match||audio.length>6_000_000)return res.status(400).json({error:'5MB 이하의 녹음 파일을 보내 주세요.'});try{const base64=audio.split(',')[1],form=new FormData();form.append('file',new Blob([Buffer.from(base64,'base64')],{type:mime||`audio/${match[1]}`}),`recording.${match[1]}`);form.append('model',process.env.OWNER_STT_MODEL||'openai/gpt-4o-mini-transcribe');form.append('language','ko');const data=await ai('audio/transcriptions',form,true);res.json({text:data.text||''});}catch(e){failure(res,e);}});
  router.post('/proposals',owner,limit(10,3600000),async(req,res)=>{
    const brief=clean(req.body?.brief,1000),format=req.body?.format||'portrait';
    if(!brief)return res.status(400).json({error:'홍보 목적과 내용을 입력해 주세요.'});
    try{
      const place=(await getCommunityPlaces()).items.find(p=>p.id===req.owner.placeId);
      const placeName=place?.name||'동네 식당';
      const placeKind=place?.kind||'음식점';

      const posterSysPrompt=`당신은 월계1동 식당 [${placeName} (${placeKind})] 사장님을 위한 전문 포스터 디자이너입니다.
사장님의 요청에 따라 소비자의 시선을 사로잡을 이벤트 홍보 포스터의 문안과 디자인 요소를 기획하세요.
반드시 아래 JSON 포맷으로만 답변하세요:
\`\`\`json
{
  "layout": "bold-impact | retro-chalkboard | magazine-editorial | neon-night | ticket-coupon 중 택1",
  "theme": "warm | lime | dark | retro | pastel | red-hot | indigo 중 택1",
  "title": "포스터 메인 타이틀 (12~24자)",
  "catchphrase": "시선을 끄는 감성 부제 한 줄",
  "heroMetric": "포스터 중앙에 강조할 핵심 혜택 숫자/키워드 (예: 20% OFF, 1+1, 8,900원, FREE)",
  "benefit": "구체적인 혜택 내용",
  "period": "행사 기간/시간 조건 (예: 비 오는 날 한정, 오늘 점심 11:30~14:00)",
  "badge": "오늘의 혜택 | 학생 할인 | 사장님 추천 | 시즌 한정 | 타임 세일 중 택1",
  "stamp": "사장님 쏜다 | LIMITED | BEST | SPECIAL | HOT 중 택1",
  "body": "손님에게 전할 친절한 홍보 문구 (2~3문장)"
}
\`\`\``;

      const imgPrompt=`월계밥상 식당 포스터 배경용 고화질 음식 사진. 가게: ${placeName}. 요청: ${brief}. 포스터 그래픽 뒤에 배경으로 은은하게 깔릴 맛있는 음식과 식당 분위기 사진, 텍스트 글자 없음.`;

      const [cardRes, imageRes]=await Promise.all([
        ai('chat/completions',{
          model:process.env.OWNER_TEXT_MODEL||'openai/gpt-4o-mini',
          max_tokens:600,
          messages:[
            {role:'system',content:posterSysPrompt},
            {role:'user',content:`가게: ${placeName}. 사장님 요청: ${brief}`}
          ]
        }),
        ai('images',{
          model:process.env.OWNER_IMAGE_MODEL||'openai/gpt-image-1-mini',
          prompt:imgPrompt,
          quality:'low',
          aspect_ratio:format==='portrait'?'2:3':'1:1'
        }).catch(err=>{
          console.warn('Image generation fallback:', err.message);
          return {data:[]};
        })
      ]);

      const cardText=cardRes.choices?.[0]?.message?.content||'';
      let card=null;
      const jsonMatch=cardText.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if(jsonMatch){
        try{card=JSON.parse(jsonMatch[1]);}catch{}
      }
      if(!card){
        card={
          layout:'bold-impact',
          theme:'warm',
          title:brief.slice(0,30),
          catchphrase:'월계1동 골목에서 전하는 특별한 한 끼',
          heroMetric:'SPECIAL',
          benefit:brief,
          period:'방문 시 혜택 적용',
          badge:'사장님 추천',
          stamp:'사장님 쏜다',
          body:cardText.replace(/```[\s\S]*?```/g,'').trim()||brief
        };
      }

      const b64=imageRes.data?.[0]?.b64_json;
      if(b64){
        card.bgImage=`data:image/png;base64,${b64}`;
      }

      const copyText=`[${card.title}] ${card.benefit}\n${card.body}`;
      const row=store.saveProposal(req.owner.placeId,{
        brief,
        format,
        copy:copyText,
        card,
        image:b64||null
      });
      res.json({id:row.id,copy:row.copy,card:row.card,status:row.status,hasImage:!!b64});
    }catch(e){failure(res,e);}
  });
  router.post('/views/:placeId',limit(100,3600000),async(req,res)=>{try{const id=req.params.placeId;if(!await placeExists(id))return res.status(404).json({error:'가게를 찾지 못했어요.'});let viewer=(req.get('cookie')||'').match(/(?:^|;\s*)wolgye_viewer=([a-f0-9-]{36})(?:;|$)/)?.[1];if(!viewer){viewer=randomUUID();res.cookie('wolgye_viewer',viewer,{httpOnly:true,sameSite:'lax',maxAge:90*86400000,secure:req.secure});}store.recordView(id,viewer,req.body?.details||{});res.json({ok:true});}catch(e){failure(res,e);}});
  router.get('/report',owner,(req,res)=>res.json(store.report(req.owner.placeId)));
  return router;
}
