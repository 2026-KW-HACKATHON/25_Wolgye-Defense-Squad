export const placeCategories=['전체','한식','중식','일식','양식','패스트푸드','분식','카페·디저트','기타'];

export function placeCategory(place) {
  // Kakao supplies a category path; a neighbor-added place supplies its own kind.
  // The business name is deliberately never used to guess the category.
  const source=String(place.category||place.kind||'');
  if(/패스트푸드|햄버거|피자|샌드위치|토스트|치킨/.test(source))return '패스트푸드';
  if(/카페|커피|디저트|베이커리|제과|제빵/.test(source))return '카페·디저트';
  for(const category of ['한식','중식','일식','양식','분식']) {
    if(source.includes(category))return category;
  }
  return '기타';
}

export function distanceMeters(origin,place) {
  if(!origin||!Number.isFinite(Number(place.lat))||!Number.isFinite(Number(place.lng)))return Infinity;
  const radians=n=>n*Math.PI/180;
  const dLat=radians(Number(place.lat)-origin.lat),dLng=radians(Number(place.lng)-origin.lng);
  const a=Math.sin(dLat/2)**2+Math.cos(radians(origin.lat))*Math.cos(radians(Number(place.lat)))*Math.sin(dLng/2)**2;
  return 6371000*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

export function browsePlaces(places,{category='전체',sort='name',location=null}={}) {
  const selected=places.filter(place=>category==='전체'||placeCategory(place)===category);
  if(sort==='distance'&&location)selected.sort((a,b)=>distanceMeters(location,a)-distanceMeters(location,b)||a.name.localeCompare(b.name,'ko'));
  else selected.sort((a,b)=>a.name.localeCompare(b.name,'ko'));
  return selected;
}
