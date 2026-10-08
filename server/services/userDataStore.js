import fs from 'node:fs';
import path from 'node:path';
import {getPool,useDatabase} from '../db/pool.js';

// 계정별 개인 기록(저장한 가게, 방문 메모). 다른 사람에게 공개하지 않는다.
const clean=list=>Array.isArray(list)?[...new Set(list.filter(x=>typeof x==='string'&&x.length<=120))].slice(0,500):[];
export const cleanUserData=d=>({saved:clean(d?.saved),visits:clean(d?.visits)});

export function createUserDataStore(file=path.resolve('.local-data/user-data.json')){
  let data={};
  if(fs.existsSync(file))data=JSON.parse(fs.readFileSync(file,'utf8'));
  const persist=()=>{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file+'.tmp',JSON.stringify(data));fs.renameSync(file+'.tmp',file);};
  return {
    get:userId=>cleanUserData(data[userId]),
    set:(userId,value)=>{data[userId]=cleanUserData(value);persist();return data[userId];}
  };
}

export function createPostgresUserDataStore(pool){
  return {
    get:async userId=>cleanUserData((await pool.query('SELECT data FROM wolgye.user_data WHERE id=$1',[userId])).rows[0]?.data),
    set:async(userId,value)=>{const row=cleanUserData(value);await pool.query('INSERT INTO wolgye.user_data(id,data) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET data=excluded.data',[userId,row]);return row;}
  };
}

export const userDataStore=useDatabase()?createPostgresUserDataStore(getPool()):createUserDataStore();
