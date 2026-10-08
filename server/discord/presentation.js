const button=(label,custom_id,style=2)=>({type:2,label,custom_id,style});
const link=(label,url)=>({type:2,label,style:5,url});
const safe=s=>String(s||'').replace(/[@*_`~|>]/g,'').slice(0,400);
const MODE={majority:'다수결',roulette:'랜덤 룰렛',ai:'AI 추천'};

export const commands=[{name:'밥상',description:'월계1동 모임을 만들고 함께 식당을 골라요',options:[
  {type:1,name:'만들기',description:'새 모임 만들기',options:[{type:3,name:'이름',description:'모임 이름',required:true,max_length:40}]},
  ...['참여','현황','조건','추천'].map(name=>({type:1,name,description:{참여:'초대 코드로 모임 참여',현황:'최신 후보와 투표 현황',조건:'내 조건 입력',추천:'모임장이 후보 추천 요청'}[name],options:[{type:3,name:'코드',description:'12자리 초대 코드',required:true,min_length:12,max_length:12}]}))
]}];

// 모임 카드. 웹과 같은 규칙: 모두 투표를 완료하기 전에는 표 수를 숨기고, 결정되면 최종 가게를 보여준다.
export function groupMessage(g,webUrl='',myId=null){
  const voting=g.voting||{},revealed=voting.allSubmitted,decided=g.decision;
  const fields=[{name:'참여 현황',value:g.members.map(m=>`${safe(m.name)} · ${m.condition?'조건 입력 완료':'입력 대기'}${g.candidates?.length&&!revealed?(g.submittedVotes?.[m.id]?' · 투표 완료':' · 투표 중'):''}`).join('\n').slice(0,1024)||'아직 없어요.'}];
  for(const [i,p] of (g.candidates||[]).entries()){
    const count=revealed?` · ${voting.counts?.[p.id]||0}표`:'';
    const checks=(p.memberChecks||[]).map(m=>`${safe(m.name)}: ${m.checks.map(c=>c.statusLabel).join(', ')||'조건 없음'}`).join(' / ');
    fields.push({name:`${i+1}. ${safe(p.name)}${count}`,value:`${safe(p.kind)} · ${safe(p.reason||'')}\n${checks?`참가자별: ${checks}`:safe(p.checks||'세부 조건 확인 필요')}`.slice(0,1024)});
  }
  const winner=decided&&g.candidates?.find(p=>p.id===decided.placeId);
  if(winner)fields.unshift({name:`🎉 오늘은 ${safe(winner.name)}!`,value:`${safe(decided.reason)}\n(${MODE[decided.mode]||'결정'}으로 결정)`});
  const status=decided?'최종 가게가 정해졌어요.':revealed?`모두 투표를 마쳤어요. ${voting.majorityId?'과반수를 받은 가게가 있어요.':'과반수 가게가 없어요.'} 모임장이 결정 방식을 골라 주세요.`:g.candidates?.length?`갈 수 있는 후보를 모두 고른 뒤 **투표 완료**를 눌러 주세요. (${voting.submittedCount||0}/${g.members.length}명 완료) 모두 완료하면 결과가 공개돼요.`:'각자 조건을 입력하면 모임장이 후보를 만들 수 있어요.';

  const components=[];
  const top=[button('참여',`wg:join:${g.id}`,3),button('내 조건',`wg:condition:${g.id}`)];
  if(!g.candidates)top.push(button('후보 추천',`wg:recommend:${g.id}`));
  top.push(button('현황 새로고침',`wg:status:${g.id}`));
  components.push({type:1,components:top});
  if(g.candidates?.length&&!decided&&!revealed){
    components.push({type:1,components:[{type:3,custom_id:`wg:vote:${g.id}:${g.revision}`,placeholder:'갈 수 있는 후보 모두 선택 (선택을 바꾸면 다시 완료)',min_values:0,max_values:g.candidates.length,options:g.candidates.map((p,i)=>({label:`${i+1}. ${p.name}`.slice(0,100),value:p.id}))}]});
    components.push({type:1,components:[button(myId&&g.submittedVotes?.[myId]?'투표 완료됨':'투표 완료',`wg:submit:${g.id}:${g.revision}`,1)]});
  }
  if(revealed&&!decided)components.push({type:1,components:[
    voting.majorityId?button('다수결로 확정',`wg:finalize:${g.id}:majority`,3):button('재투표',`wg:revote:${g.id}`),
    button('랜덤 룰렛',`wg:finalize:${g.id}:roulette`),button('AI에게 맡기기',`wg:finalize:${g.id}:ai`)
  ]});
  const links=[];
  if(winner?.placeUrl)links.push(link('카카오맵에서 길 찾기',winner.placeUrl));
  if(webUrl){try{const u=new URL(webUrl);if(u.protocol==='https:'){u.search='';u.searchParams.set('group',g.id);links.push(link('웹에서 열기',u.toString()));}}catch{}}
  if(links.length)components.push({type:1,components:links});
  return {content:'',embeds:[{title:safe(g.name),description:`초대 코드 **${g.id}**\n${status}`,color:decided?0xd5f65b:0x193e33,fields:fields.slice(0,25),footer:{text:'이 메시지는 조회 시점의 현황이에요. 새로고침으로 최신 상태를 확인하세요.'}}],components,allowedMentions:{parse:[]}};
}

// 최종 결정은 채널 전체에 알린다.
export function decisionAnnouncement(g){
  const winner=g.candidates?.find(p=>p.id===g.decision?.placeId);
  return {content:'',embeds:[{title:`🎉 ${safe(g.name)} · 오늘은 ${safe(winner?.name||'이 가게')}!`,description:`${safe(g.decision?.reason)}\n${MODE[g.decision?.mode]||'결정'}으로 정했어요.`,color:0xd5f65b}],components:winner?.placeUrl?[{type:1,components:[link('카카오맵에서 길 찾기',winner.placeUrl)]}]:[],allowedMentions:{parse:[]}};
}

export function conditionModal(code){return {custom_id:`wg:condition:${code}`,title:'어떤 식사를 원하세요?',components:[{type:1,components:[{type:4,custom_id:'condition',label:'원하는 조건을 자유롭게 적어주세요',style:2,required:true,max_length:240,placeholder:'예: 만원 이하로 따뜻한 국물, 매운 건 못 먹어요'}]}]};}
