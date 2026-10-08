const hosts={
  baemin:['baemin.com','baemin.me'],
  yogiyo:['yogiyo.co.kr'],
  coupang:['coupangeats.com','eats.coupang.com']
};

export function cleanDeliveryLinks(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  if(Object.keys(input).some(key=>!Object.hasOwn(hosts,key)))return null;
  const result={};
  for(const [provider,allowed] of Object.entries(hosts)){
    const raw=input[provider];
    if(raw===undefined||raw==='')continue;
    if(typeof raw!=='string'||raw.length>500)return null;
    try{
      const url=new URL(raw.trim());
      if(url.protocol!=='https:'||url.username||url.password||!allowed.some(host=>url.hostname===host||url.hostname.endsWith(`.${host}`)))return null;
      result[provider]=url.href;
    }catch{return null;}
  }
  return result;
}
