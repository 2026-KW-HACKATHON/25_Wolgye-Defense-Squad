export const places = [
 {id:'golmok',name:'골목식탁',kind:'한식',menu:'한상 정식',price:9000,image:'/community/restaurant.jpg',tag:'골목에서 발견한 한 끼',description:'작은 가게의 새로운 이야기를 만나보세요.',facts:['의자석','한식'],x:35,y:42},
 {id:'damso',name:'담소부엌',kind:'분식',menu:'김밥과 국수',price:8000,image:'/community/food.jpg',tag:'소박하게 차린 한 상',description:'메뉴판으로 가격을 확인하는 동네 식탁.',facts:['분식'],x:70,y:27},
 {id:'small',name:'작은식탁',kind:'양식',menu:'토마토 파스타',price:11000,image:'/community/cafe.jpg',tag:'익숙한 골목의 새로운 발견',description:'함께 먹을 메뉴를 천천히 골라보세요.',facts:['의자석','양식'],x:62,y:74}
];
export const initialPosts=[{id:'seed1',placeId:'golmok',title:'지나쳤던 골목에, 이런 가게가.',body:'동네의 작은 가게를 발견하고, 확인한 정보를 함께 나눠요.',type:'새로운 발견',author:'월계 이웃',date:'시안 예시',image:'/community/restaurant.jpg',seed:true},{id:'seed2',placeId:'damso',title:'메뉴판이 새로 올라왔어요',body:'바뀐 메뉴와 가격을 한곳에서 확인할 수 있어요.',type:'메뉴·가격',author:'방문자 제보',date:'시안 예시',image:'/community/food.jpg',seed:true}];
export function readState(){try {return JSON.parse(localStorage.getItem('wolgye-community-live-v2'))||{};}catch{return {};}}
export function saveState(state){localStorage.setItem('wolgye-community-live-v2',JSON.stringify(state));}
// Local preview adapter. Replace with the shared API when connecting web and bots.
export function previewRecommendations(text, catalog=places){
 const m=text.match(/(\d+(?:\.\d+)?)\s*(만원|천원|원)\s*(?:이하|까지|안쪽|내외)?/);
 const budget=m?Number(m[1])*({'만원':10000,'천원':1000,'원':1}[m[2]]):null;
 return {budget,items:catalog.filter(p=>budget===null||p.price<=budget),notice:'가격 표현만 읽는 시연용 필터입니다. 목적·시간·제외 조건은 아직 해석하지 않으며, 충족 여부를 확인할 수 없습니다.'};
}
