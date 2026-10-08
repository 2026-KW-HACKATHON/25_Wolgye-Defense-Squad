// 공용 DB에 테이블을 만든다. 이미 있는 테이블과 데이터는 건드리지 않는다(CREATE IF NOT EXISTS).
import fs from 'node:fs';
import {getPool} from '../server/db/pool.js';
const pool=getPool();
try{
  await pool.query(fs.readFileSync(new URL('../server/db/schema.sql',import.meta.url),'utf8'));
  const {rows}=await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='wolgye' ORDER BY 1");
  console.log('wolgye 테이블:',rows.map(r=>r.table_name).join(', '));
}catch(e){console.error('DB 준비 실패:',e.code==='SELF_SIGNED_CERT_IN_CHAIN'?'Supabase CA 인증서가 필요해요. .env의 DATABASE_CA_FILE을 확인하세요.':e.message);process.exitCode=1;}
finally{await pool.end();}
