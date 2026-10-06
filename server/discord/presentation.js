const button=(label,custom_id,style=2)=>({type:2,label,custom_id,style});
const safe=s=>String(s||'').replace(/[@*_`~|>]/g,'').slice(0,400);
export const commands=[{name:'밥상',description:'월계1동 모임을 만들고 함께 식당을 골라요',options:[
  {type:1,name:'만들기',description:'새 모임 만들기',options:[{type:3,name:'이름',description:'모임 이름',required:true,max_length:40}]},
  ...['참여','현황','조건','추천'].map(name=>({type:1,name,description:{참여:'초대 코드로 모임 참여',현황:'최신 후보와 투표 현황',조건:'내 조건 입력',추천:'모임장이 후보 추천 요청'}[name],options:[{type:3,name:'코드',description:'12자리 초대 코드',required:true,min_length:12,max_length:12}]}))
]}];
export function groupMessage(g,webUrl=''){
  const fields=[{name:'참여 현황',value:g.members.map(m=>`${safe(m.name)} · ${m.condition?'조건 입력 완료':'입력 대기'}`).join('\n').slice(0,1024)||'아직 없어요.'}];
  for(const [i,p] of (g.candidates||[]).entries())fields.push({name:`${i+1}. ${safe(p.name)} · ${Object.values(g.votes).filter(v=>v.includes(p.id)).length}표`,value:`${safe(p.reason||p.kind)}\n${safe(p.checks||'세부 조건 확인 필요')}`});
  const row={type:1,components:[button('참여',`wg:join:${g.id}`,3),button('내 조건',`wg:condition:${g.id}`),button('후보 추천',`wg:recommend:${g.id}`),button('현황 새로고침',`wg:status:${g.id}`)]};
  const components=[row];
  if(g.candidates?.length)components.push({type:1,components:[{type:3,custom_id:`wg:vote:${g.id}:${g.revision}`,placeholder:'갈 수 있는 후보 모두 선택 (선택 해제로 투표 취소)',min_values:0,max_values:g.candidates.length,options:g.candidates.map((p,i)=>({label:`${i+1}. ${p.name}`.slice(0,100),value:p.id}))}]});
  if(webUrl){try{const u=new URL(webUrl);if(u.protocol==='https:'){u.search='';u.searchParams.set('group',g.id);components.push({type:1,components:[{type:2,label:'웹에서 열기',style:5,url:u.toString()}]});}}catch{}}
  return {content:'',embeds:[{title:safe(g.name),description:`초대 코드 **${g.id}**\n${g.candidates?.length?'갈 수 있는 후보에 복수 투표해 주세요.':'각자 조건을 입력하면 모임장이 후보를 만들 수 있어요.'}`,color:0x193e33,fields,footer:{text:'이 메시지는 조회 시점의 현황입니다. 새로고침으로 최신 투표를 확인하세요.'}}],components,allowedMentions:{parse:[]}};
}
export function conditionModal(code){return {custom_id:`wg:condition:${code}`,title:'어떤 식사를 원하세요?',components:[{type:1,components:[{type:4,custom_id:'condition',label:'원하는 조건을 자유롭게 적어주세요',style:2,required:true,max_length:240}]}]};}
