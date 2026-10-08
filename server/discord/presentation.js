const button=(label,custom_id,style=2)=>({type:2,label,custom_id,style});
const link=(label,url)=>({type:2,label,style:5,url});
const safe=s=>String(s||'').replace(/[@*_`~|>]/g,'').slice(0,400);
const MODE={majority:'다수결',roulette:'랜덤 룰렛',ai:'AI 추천'};

// 명령어는 두 개만: 모임 만들기, 웹에서 만든 모임 불러오기. 나머지는 카드 버튼으로 진행한다.
export const commands=[{name:'밥상',description:'월계1동 모임을 만들고 함께 식당을 골라요',options:[
  {type:1,name:'만들기',description:'채널에 새 모임 카드 올리기',options:[{type:3,name:'이름',description:'모임 이름',required:true,max_length:40}]},
  {type:1,name:'참여',description:'웹에서 만든 모임을 초대 코드로 불러오기',options:[{type:3,name:'코드',description:'12자리 초대 코드',required:true,min_length:12,max_length:12}]}
]}];

// 채널에 하나만 올라가는 모임 카드. 누가 버튼을 누르든 이 카드 자체가 최신 상태로 바뀐다.
// 웹과 같은 규칙: 모두 투표를 완료하기 전에는 표 수를 숨기고, 결정되면 최종 가게를 보여준다.
// typing: 지금 조건 창을 열어둔 사람 [{memberId,name}]
export function groupMessage(g,webUrl='',typing=[]){
  const voting=g.voting||{},revealed=voting.allSubmitted,decided=g.decision,voteStage=g.candidates?.length&&!revealed&&!decided;
  const typingIds=new Set(typing.map(t=>t.memberId).filter(Boolean));
  const member=m=>{
    const who=`**${safe(m.name)}**${m.id===g.ownerId?' (모임장)':''}`;
    if(voteStage)return `${who} · ${g.submittedVotes?.[m.id]?'✅ 투표 완료':'🗳️ 투표 중…'}`;
    if(typingIds.has(m.id))return `${who} · ✏️ 조건 입력 중…`;
    if(!m.condition)return `${who} · 아직 입력 전`;
    // 비밀로 한 조건은 카드에 내용을 보여주지 않는다(카드는 모두가 보므로 본인 것도 가린다).
    return m.private?`${who} · 🔒 비밀 조건`:`${who} · “${safe(m.condition).slice(0,80)}”`;
  };
  const newcomers=typing.filter(t=>!t.memberId).map(t=>`**${safe(t.name)}** · ✏️ 참여해서 조건 입력 중…`);
  const fields=[{name:`참가자 ${g.members.length}명`,value:[...g.members.map(member),...newcomers].join('\n').slice(0,1024)||'아직 없어요.'}];
  for(const [i,p] of (g.candidates||[]).entries()){
    const count=revealed?` · ${voting.counts?.[p.id]||0}표`:'';
    const checks=(p.memberChecks||[]).map(m=>`${safe(m.name)}: ${m.checks.map(c=>c.statusLabel).join(', ')||'조건 없음'}`).join(' / ');
    fields.push({name:`${i+1}. ${safe(p.name)}${count}`,value:`${safe(p.kind)}${checks?`\n참가자별: ${checks}`:''}`.slice(0,1024)});
  }
  const winner=decided&&g.candidates?.find(p=>p.id===decided.placeId);
  if(winner)fields.unshift({name:`🎉 오늘은 ${safe(winner.name)}!`,value:`${safe(decided.reason)}\n(${MODE[decided.mode]||'결정'}으로 결정)`});
  const ready=g.members.length>0&&g.members.every(m=>m.condition);
  const status=decided?'최종 가게가 정해졌어요.'
    :revealed?`모두 투표를 마쳤어요. ${voting.majorityId?'과반수를 받은 가게가 있어요.':'과반수 가게가 없어요.'} 모임장이 결정 방식을 골라 주세요.`
    :voteStage?`갈 수 있는 후보를 모두 고르고 **투표 완료**를 눌러 주세요. (${voting.submittedCount||0}/${g.members.length}명 완료)`
    :g.candidates&&!g.candidates.length?'조건에 맞는 후보를 찾지 못했어요. 조건을 바꿔 다시 입력해 주세요.'
    :ready?'모두 조건을 입력했어요. 모임장이 **후보 추천**을 눌러 주세요.'
    :'**조건 입력하기**를 누르면 모임에 참여돼요. 모두 입력하면 모임장이 후보를 추천해요.';

  const components=[];
  if(!decided&&!revealed&&!voteStage)components.push({type:1,components:[button('참여',`wg:join:${g.id}`),button('조건 입력하기',`wg:condition:${g.id}`,1),button('후보 추천',`wg:recommend:${g.id}`,ready?3:2)]});
  if(voteStage){
    components.push({type:1,components:[{type:3,custom_id:`wg:vote:${g.id}:${g.revision}`,placeholder:'갈 수 있는 후보를 모두 고르세요',min_values:0,max_values:g.candidates.length,options:g.candidates.map((p,i)=>({label:`${i+1}. ${p.name}`.slice(0,100),value:p.id}))}]});
    components.push({type:1,components:[button('투표 완료',`wg:submit:${g.id}:${g.revision}`,1)]});
  }
  if(revealed&&!decided)components.push({type:1,components:[
    voting.majorityId?button('다수결로 확정',`wg:finalize:${g.id}:majority`,3):button('재투표',`wg:revote:${g.id}`),
    button('랜덤 룰렛',`wg:finalize:${g.id}:roulette`),button('AI에게 맡기기',`wg:finalize:${g.id}:ai`)
  ]});
  const links=[];
  if(winner?.placeUrl)links.push(link('카카오맵에서 길 찾기',winner.placeUrl));
  if(webUrl){try{const u=new URL(webUrl);if(u.protocol==='https:'){u.search='';u.searchParams.set('group',g.id);links.push(link('웹에서 열기',u.toString()));}}catch{}}
  if(links.length)components.push({type:1,components:links});
  return {content:'',embeds:[{title:safe(g.name),description:`초대 코드 **${g.id}**\n${status}`,color:decided?0xd5f65b:0x193e33,fields:fields.slice(0,25)}],components,allowedMentions:{parse:[]}};
}

// 최종 결정은 채널 전체에 알린다.
export function decisionAnnouncement(g){
  const winner=g.candidates?.find(p=>p.id===g.decision?.placeId);
  return {content:'',embeds:[{title:`🎉 ${safe(g.name)} · 오늘은 ${safe(winner?.name||'이 가게')}!`,description:`${safe(g.decision?.reason)}\n${MODE[g.decision?.mode]||'결정'}으로 정했어요.`,color:0xd5f65b}],components:winner?.placeUrl?[{type:1,components:[link('카카오맵에서 길 찾기',winner.placeUrl)]}]:[],allowedMentions:{parse:[]}};
}

// 조건 입력 창: 글 입력 + '비밀로 하기' 체크박스(체크하면 다른 사람에게 내용이 보이지 않음)
export function conditionModal(code,current=''){return {custom_id:`wg:condition:${code}`,title:'어떤 식사를 원하세요?',components:[
  {type:18,label:'원하는 조건을 자유롭게 적어주세요',component:{type:4,custom_id:'condition',style:2,required:true,max_length:240,value:current||undefined,placeholder:'예: 만원 이하로 따뜻한 국물, 매운 건 못 먹어요'}},
  {type:18,label:'비밀로 하기',description:'체크하면 다른 참가자에게 조건 내용이 보이지 않아요. 추천에는 그대로 쓰여요.',component:{type:23,custom_id:'private'}}
]};}
