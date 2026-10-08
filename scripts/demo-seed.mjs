// 시연용 예시 데이터 넣기/지우기.
//   넣기: node scripts/demo-seed.mjs
//   지우기: node scripts/demo-seed.mjs --remove
// 실제 가게에 지어낸 정보이므로 작성자를 모두 "시연용 예시"로 표시하고, 전시 전에 지우거나 실제 확인한 정보로 바꾼다.
import 'dotenv/config';
import {createHash} from 'node:crypto';
import {communityStore} from '../server/services/communityStore.js';
import {useDatabase,getPool} from '../server/db/pool.js';

const AUTHOR='시연용 예시';
const TOKEN=createHash('sha256').update('wolgye-demo-seed').digest('hex'); // 시연 데이터 전용 작성자 표시
const today=new Date(),day=n=>new Date(today.getTime()-n*86400000).toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});

// 가게 정보: 메뉴·가격, 영업시간, 기타 안내 (모두 예시)
const INFO={
  'kakao-24997619':{menu:'칼국수 8,000원 / 수제비 8,000원 / 만두 5,000원',hours:'11:00~21:00',notice:'점심시간 대기 있음'},
  'kakao-10198074':{menu:'김밥 3,500원 / 라면 4,500원 / 떡볶이 5,000원',hours:'08:00~22:00',notice:'혼밥 좌석 많음'},
  'kakao-1389338267':{menu:'순대국밥 9,000원 / 뼈해장국 10,000원',hours:'24시간'},
  'kakao-19009728':{menu:'김치찌개 9,000원 / 부대찌개 2인 20,000원',hours:'11:00~22:00',notice:'4인 이상 단체석 있음'},
  'kakao-27503771':{menu:'고기 무한리필 1인 16,900원',hours:'16:00~23:00',notice:'주말 저녁 예약 권장'},
  'kakao-364066914':{menu:'마라탕 100g당 1,800원 (최소 8,000원)',hours:'11:00~21:30'},
  'kakao-1682165592':{menu:'아메리카노 2,500원 / 라떼 3,500원',hours:'08:00~20:00',notice:'콘센트 좌석 있음'},
  'kakao-1504047176':{menu:'닭볶음탕 20,000원 / 오뎅탕 15,000원',hours:'17:00~03:00'}
};
// 이웃 소식 (모두 예시)
const POSTS=[
  {placeId:'kakao-24997619',type:'메뉴·가격',title:'칼국수 가격 그대로예요',body:'점심에 칼국수 먹었는데 아직 8,000원이에요. 면이 쫄깃하고 김치가 맛있어요.',keywords:['혼밥','가성비'],observedAt:day(0)},
  {placeId:'kakao-10198074',type:'방문 이야기',title:'공강 때 빨리 먹기 좋아요',body:'주문하고 5분 만에 나왔어요. 혼자 앉는 자리도 넉넉해요.',keywords:['혼밥','빠른식사'],observedAt:day(0)},
  {placeId:'kakao-19009728',type:'영업 소식',title:'단체석 생겼어요',body:'안쪽에 6명까지 앉는 단체석이 생겼어요. 모임하기 좋아요.',keywords:['단체'],observedAt:day(1)},
  {placeId:'kakao-27503771',type:'방문 이야기',title:'주말 저녁엔 줄이 길어요',body:'토요일 7시쯤 갔더니 20분 기다렸어요. 예약하고 가는 걸 추천해요.',keywords:['고기','모임'],observedAt:day(2)},
  {placeId:'kakao-1682165592',type:'새로운 발견',title:'조용히 작업하기 좋은 카페',body:'창가 쪽에 콘센트 자리가 있어서 과제하기 좋았어요.',keywords:['카공','조용함'],observedAt:day(3)}
];

const remove=process.argv.includes('--remove');
try{
  if(remove){
    let posts=0,infos=0;
    for(const p of await communityStore.posts(TOKEN))if(p.mine&&await communityStore.removePost(p.id,TOKEN))posts++;
    // 가게 정보는 시연 데이터만 남아 있는 가게의 기록만 지운다. 이웃이 고친 기록이 섞여 있으면 남겨둔다.
    const all=await communityStore.placeInfo();
    for(const [id,info] of Object.entries(all)){
      const history=info.history||[];
      if(!history.length||!history.every(h=>h.editorHash===TOKEN))continue;
      if(useDatabase())await getPool().query('DELETE FROM wolgye.place_info WHERE id=$1',[id]);
      else await communityStore.savePlaceInfo(id,Object.fromEntries(Object.keys(info.fields||{}).map(k=>[k,''])),{role:'neighbor',author:AUTHOR,observedAt:day(0),editorHash:TOKEN});
      infos++;
    }
    console.log(`시연용 예시 삭제: 소식 ${posts}개, 가게 정보 ${infos}곳`);
  }else{
    let infos=0,posts=0;
    for(const [id,fields] of Object.entries(INFO))if(await communityStore.savePlaceInfo(id,fields,{role:'neighbor',author:AUTHOR,observedAt:day(1),editorHash:TOKEN}))infos++;
    const existing=await communityStore.posts(TOKEN);
    for(const p of POSTS){
      if(existing.some(x=>x.mine&&x.title===p.title))continue;
      await communityStore.savePost({...p,body:`[시연용 예시] ${p.body}`,author:AUTHOR,image:'',authorRole:'neighbor'},TOKEN);posts++;
    }
    console.log(`시연용 예시 추가: 가게 정보 ${infos}곳, 소식 ${posts}개 (지우기: node scripts/demo-seed.mjs --remove)`);
  }
}finally{if(useDatabase())await getPool().end();}
