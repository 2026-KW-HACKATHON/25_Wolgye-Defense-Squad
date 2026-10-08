// 가게 정보는 로그인한 누구나 고칠 수 있다. 항목마다 마지막으로 고친 사람의 역할(owner/neighbor)과 확인 날짜를 남긴다.
export const INFO_FIELDS={menu:{label:'메뉴·가격',max:1000},hours:{label:'영업시간',max:200},notice:{label:'기타 안내',max:300}};

export function applyInfoEdit(old,placeId,changes,editor){
  const now=new Date().toISOString();
  const row={placeId,fields:{...(old?.fields||{})},history:[...(old?.history||[])]};
  let changed=false;
  for(const [key,value] of Object.entries(changes)){
    if(!INFO_FIELDS[key]||(row.fields[key]?.value||'')===value)continue;
    changed=true;
    row.history.push({field:key,before:row.fields[key]?.value||'',after:value,role:editor.role,author:editor.author,observedAt:editor.observedAt,updatedAt:now,editorHash:editor.editorHash});
    // role: owner(사장님) | neighbor(이웃) | internet(인터넷 메뉴판 자동 수집, sourceUrl에 출처)
    if(value)row.fields[key]={value,role:editor.role,author:editor.author,observedAt:editor.observedAt,updatedAt:now,...(editor.sourceUrl?{sourceUrl:editor.sourceUrl}:{})};
    else delete row.fields[key];
  }
  row.history=row.history.slice(-50);
  return changed?row:null;
}

export function publicInfo(info){
  if(!info)return {fields:{},history:[]};
  return {fields:info.fields||{},history:(info.history||[]).map(({editorHash,...h})=>h).reverse()};
}

// 추천 근거로 쓸 수 있게 가게 정보를 제보와 같은 형태로 바꾼다.
export function infoReports(info){
  return Object.entries(info?.fields||{}).map(([key,f])=>({id:`info-${key}`,body:`${INFO_FIELDS[key]?.label||key}: ${f.value}`,type:f.role==='owner'?'사장님 확인 정보':'이웃 수정 정보',observedAt:f.observedAt}));
}

// 기여 현황: 함께 채운 이웃 수와 내 기여. 소식·장소의 ownerHash는 hash(token), 가게 정보 기록의 editorHash는 token 그대로 저장돼 있다.
export function contributionStats({posts=[],places=[],infos={},token,hash}){
  const people=new Set();
  for(const row of [...posts,...places])if(row.ownerHash)people.add(row.ownerHash);
  for(const info of Object.values(infos))for(const h of info.history||[])if(h.editorHash)people.add(hash(h.editorHash));
  if(!token)return {contributors:people.size,mine:null};
  const me=hash(token);
  return {contributors:people.size,mine:{
    posts:posts.filter(p=>p.ownerHash===me).length,
    places:Object.values(infos).filter(info=>(info.history||[]).some(h=>h.editorHash===token)).length,
    added:places.filter(p=>p.ownerHash===me).length
  }};
}
