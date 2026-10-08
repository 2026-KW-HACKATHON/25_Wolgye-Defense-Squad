import {getPool,useDatabase} from '../db/pool.js';
import {createPostgresCommunityStore} from '../db/postgresStores.js';
import fs from 'node:fs';
import path from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {applyInfoEdit} from './placeInfo.js';

export function createCommunityStore(file=path.resolve('.local-data/community.json')) {
  let data={places:[],posts:[],placeInfo:{}};
  if(fs.existsSync(file))data={...data,...JSON.parse(fs.readFileSync(file,'utf8'))};
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data));fs.renameSync(file+'.tmp',file);};
  const owner=token=>createHash('sha256').update(token).digest('hex');
  const publicRow=({ownerHash,...row},token)=>({...row,...(token?{mine:ownerHash===owner(token)}:{})});
  return {
    places:()=>data.places.map(p=>publicRow(p)),
    posts:token=>data.posts.map(p=>publicRow(p,token)),
    addPlace:(p,token)=>{const row={...p,id:'local-'+randomUUID(),ownerHash:owner(token),source:'이웃 등록',status:'확인 전',createdAt:new Date().toISOString()};data.places.unshift(row);persist();return publicRow(row);},
    savePost:(p,token,id)=>{
      const index=id?data.posts.findIndex(p=>p.id===id):-1;
      if(id&&(index<0||data.posts[index].ownerHash!==owner(token)))return null;
      const row={...p,id:id||randomUUID(),ownerHash:owner(token),createdAt:index<0?new Date().toISOString():data.posts[index].createdAt,updatedAt:new Date().toISOString(),revisions:index<0?[]:[...(data.posts[index].revisions||[]),{title:data.posts[index].title,body:data.posts[index].body,observedAt:data.posts[index].observedAt,updatedAt:data.posts[index].updatedAt}].slice(-20)};
      if(index<0)data.posts.unshift(row);else data.posts[index]=row;
      persist();return publicRow(row,token);
    },
    placeInfo:()=>data.placeInfo,
    savePlaceInfo:(placeId,changes,editor)=>{const row=applyInfoEdit(data.placeInfo[placeId],placeId,changes,editor);if(!row)return null;data.placeInfo[placeId]=row;persist();return row;},
    removePost:(id,token)=>{const i=data.posts.findIndex(p=>p.id===id&&p.ownerHash===owner(token));if(i<0)return false;data.posts.splice(i,1);persist();return true;}
  };
}
export const communityStore=useDatabase()?createPostgresCommunityStore(getPool()):createCommunityStore();
