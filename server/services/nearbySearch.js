import {campusOrigin,distanceMeters,placeCategory,requestedCategories,wantsNearby} from '../../src/community/placeBrowse.js';

function validOrigin(value){
  const lat=Number(value?.lat),lng=Number(value?.lng);
  return value&&Number.isFinite(lat)&&Number.isFinite(lng)&&Math.abs(lat)<=90&&Math.abs(lng)<=180?{lat,lng}:null;
}

export function nearbyCategoryMatches(message,places,origin){
  const categories=requestedCategories(message);
  if(!wantsNearby(message)||!categories.length)return null;
  const reference=validOrigin(origin)||campusOrigin;
  const categoryOf=place=>placeCategory(place)==='카페·디저트'?'카페':placeCategory(place);
  const items=places.filter(place=>categories.includes(categoryOf(place))&&Number.isFinite(distanceMeters(reference,place)))
    .sort((a,b)=>distanceMeters(reference,a)-distanceMeters(reference,b)||a.name.localeCompare(b.name,'ko'));
  return {items,categories,origin:reference,originLabel:validOrigin(origin)?'현재 위치':'광운대',categoryOf};
}

export function nearbyShortlist(match,limit=3){
  const picked=match.items.slice(0,limit);
  if(match.categories.length>1&&picked.length===limit){
    for(const category of match.categories){
      if(picked.some(place=>match.categoryOf(place)===category))continue;
      const alternative=match.items.find(place=>match.categoryOf(place)===category);
      if(!alternative)continue;
      const distance=distanceMeters(match.origin,alternative);
      const farthest=distanceMeters(match.origin,picked[picked.length-1]);
      if(distance<=Math.max(800,farthest*2))picked[picked.length-1]=alternative;
    }
  }
  return [...new Map(picked.map(place=>[place.id,place])).values()]
    .sort((a,b)=>distanceMeters(match.origin,a)-distanceMeters(match.origin,b));
}
