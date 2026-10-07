import {createHash,randomUUID} from 'node:crypto';
import {transaction} from './pool.js';
const hash=token=>createHash('sha256').update(token).digest('hex');
const publicRow=({ownerHash,...p},token)=>({...p,...(token?{mine:ownerHash===hash(token)}:{})});
const problem=(message,status=409)=>Object.assign(new Error(message),{status});
export function createPostgresCommunityStore(pool){
  async function rows(table){return (await pool.query(`SELECT data FROM wolgye.${table} ORDER BY data->>'createdAt' DESC`)).rows.map(r=>r.data);}
  return {
    places:async()=> (await rows('places')).map(p=>publicRow(p)),
    posts:async token=>(await rows('posts')).map(p=>publicRow(p,token)),
    addPlace:(p,token)=>transaction(pool,async c=>{
      // Serialize new place checks across API instances, not just one Node process.
      await c.query("SELECT pg_advisory_xact_lock(7142026)");
      const all=(await c.query('SELECT data FROM wolgye.places')).rows.map(r=>r.data);
      const normalized=p.name.replace(/\s/g,'').toLowerCase();
      if(all.some(x=>x.name.replace(/\s/g,'').toLowerCase()===normalized&&Math.hypot((x.lat-p.lat)*111000,(x.lng-p.lng)*88000)<150))throw problem('가까운 위치에 같은 이름의 가게가 이미 등록됐어요. 목록을 새로고침해 주세요.');
      if(all.length>=2000)throw problem('등록 가능한 가게 수를 초과했어요.');
      const row={...p,id:'local-'+randomUUID(),ownerHash:hash(token),source:'이웃 등록',status:'확인 전',createdAt:new Date().toISOString()};
      await c.query('INSERT INTO wolgye.places(id,data) VALUES ($1,$2)',[row.id,row]);return publicRow(row);
    }),
    savePost:(p,token,id)=>transaction(pool,async c=>{
      let old;
      if(id){old=(await c.query('SELECT data FROM wolgye.posts WHERE id=$1 FOR UPDATE',[id])).rows[0]?.data;if(!old||old.ownerHash!==hash(token))return null;}
      else{await c.query('SELECT pg_advisory_xact_lock(7142027)');if(Number((await c.query('SELECT count(*) AS count FROM wolgye.posts')).rows[0].count)>=1000)throw problem('소식 저장 공간이 가득 찼어요.');}
      const row={...p,id:id||randomUUID(),ownerHash:hash(token),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString(),revisions:old?[...(old.revisions||[]),{title:old.title,body:old.body,observedAt:old.observedAt,updatedAt:old.updatedAt}].slice(-20):[]};
      if(old)await c.query('UPDATE wolgye.posts SET data=$2 WHERE id=$1',[id,row]);else await c.query('INSERT INTO wolgye.posts(id,data) VALUES ($1,$2)',[row.id,row]);
      return publicRow(row,token);
    }),
    removePost:async(id,token)=>(await pool.query("DELETE FROM wolgye.posts WHERE id=$1 AND data->>'ownerHash'=$2",[id,hash(token)])).rowCount>0
  };
}
export function createPostgresGroupStore(pool){return {
  get:async id=>(await pool.query('SELECT data FROM wolgye.groups WHERE id=$1',[id])).rows[0]?.data,
  create:g=>transaction(pool,async c=>{await c.query('SELECT pg_advisory_xact_lock(7142028)');if(Number((await c.query('SELECT count(*) AS count FROM wolgye.groups')).rows[0].count)>=1000)throw problem('모임 저장 한도에 도달했어요.',429);await c.query('INSERT INTO wolgye.groups(id,data) VALUES ($1,$2)',[g.id,g]);return g;}),
  mutate:(id,work)=>transaction(pool,async c=>{const g=(await c.query('SELECT data FROM wolgye.groups WHERE id=$1 FOR UPDATE',[id])).rows[0]?.data;if(!g)throw problem('모임을 찾을 수 없어요.',404);const result=await work(g);await c.query('UPDATE wolgye.groups SET data=$2 WHERE id=$1',[id,g]);return result;})
};}
export function createPostgresMembershipStore(pool){return {
  get:async id=>(await pool.query('SELECT data FROM wolgye.discord_memberships WHERE id=$1',[id])).rows[0]?.data,
  set:async(id,value)=>{await pool.query('INSERT INTO wolgye.discord_memberships(id,data) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[id,value]);}
};}
