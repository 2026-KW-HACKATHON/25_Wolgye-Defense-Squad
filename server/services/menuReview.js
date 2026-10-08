import {getPool,transaction} from '../db/pool.js';
import {applyInfoEdit} from './placeInfo.js';
export function menuFingerprint(text){return String(text).normalize('NFKC').split(/\s*\/\s*|\n/).map(x=>x.replace(/[\s,]/g,'').toLowerCase()).filter(Boolean).sort().join('|');}
export function classifyMenu(row){const v=row.verification||{};if(v.kindMatch===false||v.foreignCurrency===true||v.koreanMenu===false||v.krw===false)return 'rejected';return row.blogMatch&&v.shopNameVisible===true&&v.kindMatch===true&&v.koreanMenu===true&&v.krw===true&&v.foreignCurrency===false?'eligible':'pending';}
export async function saveReview(row){await getPool().query('INSERT INTO wolgye.menu_reviews(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[row.id,row]);}
export async function listReviews(){return (await getPool().query("SELECT data FROM wolgye.menu_reviews WHERE data->>'status'='pending' ORDER BY data->>'createdAt' DESC LIMIT 500")).rows.map(r=>r.data);}
export async function decideReview(id,approve,actor){return transaction(getPool(),async c=>{
 await c.query('SELECT pg_advisory_xact_lock(7142040)');
 const review=(await c.query('SELECT data FROM wolgye.menu_reviews WHERE id=$1 FOR UPDATE',[id])).rows[0]?.data;
 if(!review||!['pending','eligible'].includes(review.status))throw Object.assign(new Error('이미 처리됐거나 없는 항목이에요.'),{status:409});
 if(approve){
  await c.query('SELECT pg_advisory_xact_lock(hashtext($1))',[review.placeId]);
  const old=(await c.query('SELECT data FROM wolgye.place_info WHERE id=$1 FOR UPDATE',[review.placeId])).rows[0]?.data;
  if(old?.fields?.menu&&old.fields.menu.role!=='internet')throw Object.assign(new Error('이웃·사장님이 작성한 메뉴가 있어 덮어쓰지 않았어요.'),{status:409});
  const row=applyInfoEdit(old,review.placeId,{menu:review.text},{role:'internet',author:'인터넷 메뉴판',observedAt:review.sourceDate,editorHash:actor,sourceUrl:review.sourceUrl});
  if(row)await c.query('INSERT INTO wolgye.place_info(id,data) VALUES($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[review.placeId,row]);
 }
 review.status=approve?'approved':'rejected';review.reviewedAt=new Date().toISOString();review.reviewedBy=actor;
 await c.query('UPDATE wolgye.menu_reviews SET data=$2 WHERE id=$1',[id,review]);return review;
});}
