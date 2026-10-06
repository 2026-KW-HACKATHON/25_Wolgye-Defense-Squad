import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createGroupRouter} from '../server/groupRoutes.js';
test('independent members share persisted conditions and votes, protect identity and invalidate stale candidates',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-groups-'));
  const file=path.join(dir,'groups.json');let finish;
  const app=express();app.use(express.json());app.use('/groups',createGroupRouter({file,recommend:()=>new Promise(r=>{finish=r;})}));
  const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(url,method='GET',body,token)=>{const r=await fetch(base+url,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,...await r.json()};};
  try{
    const a=await api('/','POST',{name:'저녁',nickname:'가'});assert.equal(a.status,201);const id=a.group.id;
    assert.ok(!a.group.members[0].token);
    assert.equal((await api('/'+id)).status,403);
    const b=await api('/'+id+'/join','POST',{nickname:'나'});
    assert.equal((await api('/'+id,'GET',null,a.token)).group.members.length,2);
    await api('/'+id+'/condition','PUT',{condition:'한식'},a.token);
    assert.equal((await api('/'+id+'/recommend','POST',{},a.token)).status,409);
    await api('/'+id+'/condition','PUT',{condition:'국수'},b.token);
    assert.equal((await api('/'+id+'/recommend','POST',{},b.token)).status,403);
    const rec=api('/'+id+'/recommend','POST',{},a.token);
    while(!finish)await new Promise(r=>setTimeout(r,5));
    finish({items:[{id:'p1',name:'후보'}],answer:'확인 필요',notice:'확인 후보'});
    const result=await rec;assert.equal(result.status,200);
    const revision=result.group.revision;
    await api('/'+id+'/vote','PUT',{ids:['p1'],revision},a.token);
    await api('/'+id+'/vote','PUT',{ids:['p1'],revision},b.token);
    assert.equal(Object.keys((await api('/'+id,'GET',null,a.token)).group.votes).length,2);
    assert.equal((await api('/'+id+'/vote','PUT',{ids:['invented'],revision},b.token)).status,400);
    await api('/'+id+'/condition','PUT',{condition:'변경'},b.token);
    const changed=(await api('/'+id,'GET',null,a.token)).group;assert.equal(changed.candidates,null);assert.deepEqual(changed.votes,{});
    assert.equal((await api('/'+id+'/vote','PUT',{ids:['p1'],revision},a.token)).status,409);
    const persisted=JSON.parse(fs.readFileSync(file));assert.equal(persisted[id].members[1].condition,'변경');
  }finally{await new Promise(r=>server.close(r));fs.rmSync(dir,{recursive:true,force:true});}
});
