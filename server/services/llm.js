import 'dotenv/config';

// 모든 글 생성 AI는 OpenRouter로 호출한다. 모델은 .env의 AI_TEXT_MODEL로 바꾼다.
// 음성 인식·이미지 생성은 Nemotron이 지원하지 않아 ownerMarketingRoutes.js에서 별도 모델을 쓴다.
export const DEFAULT_TEXT_MODEL='nvidia/nemotron-3-ultra-550b-a55b';
const URL='https://openrouter.ai/api/v1/chat/completions';

export const textModel=()=>process.env.AI_TEXT_MODEL?.trim()||DEFAULT_TEXT_MODEL;
export const aiReady=()=>!!process.env.OPENROUTER_API_KEY?.trim();

async function call(messages,{model,temperature,maxTokens,json,timeout}){
  const response=await fetch(URL,{method:'POST',signal:AbortSignal.timeout(timeout),
    headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,'Content-Type':'application/json'},
    body:JSON.stringify({model,messages,temperature,max_tokens:maxTokens,
      // 생각 과정을 끄고 응답이 빠른 제공 업체를 먼저 써서 시연 중 대기 시간을 줄인다.
      reasoning:{enabled:false},provider:{sort:'latency'},
      ...(json?{response_format:{type:'json_object'}}:{})})});
  const data=await response.json().catch(()=>({}));
  // 무료 모델은 과부하 오류를 HTTP 200 본문에 담아 보내기도 한다. 내용이 없으면 실패로 본다.
  const content=data.choices?.[0]?.message?.content;
  if(!response.ok||data.error||typeof content!=='string'||!content.trim())throw Object.assign(new Error(`AI 응답을 받지 못했어요 (${data.error?.code||response.status}).`),{status:502,retry:true});
  return content;
}

// 실패하면 잠깐 쉬고 다시 시도한다. 무료 모델(:free)이 계속 안 되면 같은 모델의 유료 버전으로 넘어간다.
export async function chat(messages,{model=textModel(),temperature=0.2,maxTokens=800,json=false,timeout=45000,validate}={}){
  if(!aiReady())throw Object.assign(new Error('OPENROUTER_API_KEY 설정이 필요해요.'),{status:503});
  const plan=[model,model,...(model.endsWith(':free')?[model.replace(/:free$/,'')]:[])];
  let last;
  for(const [n,m] of plan.entries()){
    try{const text=await call(messages,{model:m,temperature,maxTokens,json,timeout});if(validate)validate(text);return text;}
    catch(e){last=e;if(e.name==='TimeoutError'&&n>0)break;if(n<plan.length-1)await new Promise(r=>setTimeout(r,400*(n+1)));}
  }
  throw last;
}

const parseJSON=text=>JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,'').match(/\{[\s\S]*\}/)?.[0]||'');

export async function chatJSON(messages,options={}){
  // JSON이 깨져 오면 다시 시도하도록 chat의 검사 단계에서 확인한다.
  const text=await chat(messages,{...options,json:true,validate:t=>{try{parseJSON(t);}catch{throw Object.assign(new Error('AI 답변 형식을 확인하지 못했어요. 다시 시도해 주세요.'),{status:502});}}});
  return parseJSON(text);
}
