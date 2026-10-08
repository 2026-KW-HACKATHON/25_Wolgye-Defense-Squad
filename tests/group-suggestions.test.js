import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createGroupRouter} from '../server/groupRoutes.js';

test('news place suggestions persist without changing an active vote',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wolgye-suggestions-'));
  const file=path.join(dir,'groups.json');
  const app=express();
  app.use(express.json());
  app.use('/groups',createGroupRouter({file,getPlaces:async()=>({items:[{id:'place-1',name:'월계식당'}]}),recommend:async()=>({items:[{id:'place-1',name:'월계식당'}],answer:'',notice:''})}));
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const base=`http://127.0.0.1:${server.address().port}/groups`;
  const api=async(route,method='GET',body,token)=>{
    const response=await fetch(base+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
    return {status:response.status,...await response.json()};
  };
  try{
    const created=await api('/','POST',{name:'저녁',nickname:'준석'});
    const id=created.group.id,token=created.token;
    assert.equal((await api(`/${id}/suggestions`,'POST',{placeId:'place-1'})).status,403);
    assert.equal((await api(`/${id}/suggestions`,'POST',{placeId:'missing'},token)).status,404);
    await api(`/${id}/condition`,'PUT',{condition:'한식'},token);
    const recommended=await api(`/${id}/recommend`,'POST',{},token);
    const revision=recommended.group.revision;
    await api(`/${id}/vote`,'PUT',{ids:['place-1'],revision},token);
    const added=await api(`/${id}/suggestions`,'POST',{placeId:'place-1'},token);
    assert.equal(added.status,200);
    assert.equal(added.group.suggestions[0].placeName,'월계식당');
    assert.equal(added.group.revision,revision);
    assert.deepEqual(added.group.votes[created.memberId],['place-1']);
    const duplicate=await api(`/${id}/suggestions`,'POST',{placeId:'place-1'},token);
    assert.equal(duplicate.group.suggestions.length,1);
    const restored=await api(`/${id}`,'GET',undefined,token);
    assert.equal(restored.group.suggestions.length,1);
  }finally{
    await new Promise(resolve=>server.close(resolve));
    fs.rmSync(dir,{recursive:true,force:true});
  }
});
