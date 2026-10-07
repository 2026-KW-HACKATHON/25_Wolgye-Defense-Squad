import 'dotenv/config';
import pg from 'pg';
import fs from 'node:fs';
let pool;
export function useDatabase(){
  const mode=process.env.DATA_STORE||'file';
  if(!['file','postgres'].includes(mode))throw new Error('DATA_STORE는 file 또는 postgres로 설정하세요.');
  if(mode==='file'&&process.env.NODE_ENV==='production')throw new Error('운영 서버는 DATA_STORE=postgres 설정이 필요합니다.');
  return mode==='postgres';
}
export function getPool(){
  if(pool)return pool;
  if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL을 서버 환경변수에 설정하세요.');
  const connection=new URL(process.env.DATABASE_URL);
  if(!['postgres:','postgresql:'].includes(connection.protocol))throw new Error('PostgreSQL 연결 주소를 확인하세요.');
  const local=['localhost','127.0.0.1','[::1]'].includes(connection.hostname);
  // pg URL SSL flags otherwise override this verified TLS configuration.
  for(const key of ['sslmode','sslrootcert','sslcert','sslkey'])connection.searchParams.delete(key);
  const ssl=local?false:{rejectUnauthorized:true,...(process.env.DATABASE_CA_FILE?{ca:fs.readFileSync(process.env.DATABASE_CA_FILE,'utf8')}:{})};
  pool=new pg.Pool({connectionString:connection.toString(),ssl,max:5,connectionTimeoutMillis:10000,idleTimeoutMillis:30000,statement_timeout:15000});
  pool.on('error',()=>console.error('공용 DB 연결 오류. DB 상태와 네트워크를 확인하세요.'));
  return pool;
}
export async function transaction(pool,work){
  const client=await pool.connect();
  try{await client.query('BEGIN');const result=await work(client);await client.query('COMMIT');return result;}
  catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}
export async function checkDatabase(){
  if(!useDatabase())return;
  await getPool().query('SELECT id FROM wolgye.groups LIMIT 0');
  await getPool().query('SELECT id FROM wolgye.posts LIMIT 0');
  await getPool().query('SELECT id FROM wolgye.places LIMIT 0');
  await getPool().query('SELECT id FROM wolgye.discord_memberships LIMIT 0');
}
