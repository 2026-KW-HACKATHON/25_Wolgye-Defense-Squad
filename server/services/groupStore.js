import fs from 'node:fs';
import path from 'node:path';
import {getPool,useDatabase} from '../db/pool.js';
import {createPostgresGroupStore} from '../db/postgresStores.js';
export function createFileGroupStore(file){
  let groups=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{};
  const write=next=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(next));fs.renameSync(file+'.tmp',file);groups=next;};
  return {
    get:id=>structuredClone(groups[id]),
    create:g=>{if(Object.keys(groups).length>=1000)throw Object.assign(new Error('모임 저장 한도에 도달했어요.'),{status:429});if(groups[g.id])throw new Error('Duplicate group');write({...groups,[g.id]:structuredClone(g)});return g;},
    mutate:(id,work)=>{if(!groups[id])throw Object.assign(new Error('모임을 찾을 수 없어요.'),{status:404});const g=structuredClone(groups[id]);const result=work(g);if(result instanceof Promise)throw new Error('File mutations must be synchronous');write({...groups,[id]:g});return result;}
  };
}
export const defaultGroupStore=()=>useDatabase()?createPostgresGroupStore(getPool()):createFileGroupStore(path.resolve('.local-data/groups.json'));
