// Expose only community/group routes; API keys remain on the loopback backend.
import express from 'express';
import {fileURLToPath} from 'node:url';
const app=express();
app.use(express.json({limit:'1500kb'}));
app.use('/api',async(req,res)=>{
  const allowed=(['GET','POST'].includes(req.method)&&req.path==='/community/posts')||
    (['PUT','DELETE'].includes(req.method)&&/^\/community\/posts\/[a-f0-9-]{36}$/.test(req.path))||
    (req.method==='POST'&&req.path==='/community/places')||
    (req.method==='GET'&&req.path==='/community/places')||
    (req.method==='POST'&&req.path==='/community/recommend')||
    (req.method==='POST'&&/^\/groups\/?$/.test(req.path))||
    (req.method==='GET'&&/^\/groups\/[A-F0-9]{12}$/i.test(req.path))||
    (req.method==='POST'&&/^\/groups\/[A-F0-9]{12}\/(join|recommend)$/i.test(req.path))||
    (req.method==='PUT'&&/^\/groups\/[A-F0-9]{12}\/(condition|vote)$/i.test(req.path));
  if(!allowed)return res.status(404).json({error:'지원하지 않는 요청입니다.'});
  const origin=req.get('origin');
  if(origin){try{if(new URL(origin).host!==req.get('host'))return res.status(403).json({error:'이 사이트에서 요청해 주세요.'});}catch{return res.sendStatus(403);}}
  try{
    const response=await fetch('http://127.0.0.1:3001/api'+req.path,{method:req.method,headers:{'Content-Type':'application/json',...(req.get('authorization')?{Authorization:req.get('authorization')}:{})},body:req.method==='GET'?undefined:JSON.stringify(req.body),signal:AbortSignal.timeout(60000)});
    res.status(response.status).type('json').send(await response.text());
  }catch{res.status(502).json({error:'서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'});}
});
const dist=fileURLToPath(new URL('../dist/',import.meta.url));
app.use(express.static(dist));
app.get('*',(req,res)=>res.sendFile('index.html',{root:dist}));
app.listen(4174,'127.0.0.1',()=>console.log('Community sharing gateway: http://127.0.0.1:4174'));

