import 'dotenv/config';

// 모든 글 생성 AI는 OpenRouter로 호출한다. 모델은 .env의 AI_TEXT_MODEL로 바꾼다.
// 음성 인식·이미지 생성은 Nemotron이 지원하지 않아 ownerMarketingRoutes.js에서 별도 모델을 쓴다.
export const DEFAULT_TEXT_MODEL='nvidia/nemotron-3-ultra-550b-a55b';
const URL='https://openrouter.ai/api/v1/chat/completions';

export const textModel=()=>process.env.AI_TEXT_MODEL?.trim()||DEFAULT_TEXT_MODEL;
export const aiReady=()=>!!process.env.OPENROUTER_API_KEY?.trim();

export async function chat(messages,{model=textModel(),temperature=0.2,maxTokens=800,json=false,timeout=45000}={}){
  if(!aiReady())throw Object.assign(new Error('OPENROUTER_API_KEY 설정이 필요해요.'),{status:503});
  const response=await fetch(URL,{method:'POST',signal:AbortSignal.timeout(timeout),
    headers:{Authorization:`Bearer ${process.env.OPENROUTER_API_KEY.trim()}`,'Content-Type':'application/json'},
    body:JSON.stringify({model,messages,temperature,max_tokens:maxTokens,
      // 생각 과정을 끄고 응답이 빠른 제공 업체를 먼저 써서 시연 중 대기 시간을 줄인다.
      reasoning:{enabled:false},provider:{sort:'latency'},
      ...(json?{response_format:{type:'json_object'}}:{})})});
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw Object.assign(new Error(`AI 응답을 받지 못했어요 (${response.status}). 잠시 후 다시 시도해 주세요.`),{status:502});
  return data.choices?.[0]?.message?.content||'';
}

export async function chatJSON(messages,options={}){
  const text=await chat(messages,{...options,json:true});
  try{return JSON.parse(text.trim().replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));}
  catch{throw Object.assign(new Error('AI 답변 형식을 확인하지 못했어요. 다시 시도해 주세요.'),{status:502});}
}
