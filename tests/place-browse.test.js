import test from 'node:test';
import assert from 'node:assert/strict';
import {browsePlaces,distanceMeters,placeCategory} from '../src/community/placeBrowse.js';

test('place categories use registered category, never business name',()=>{
  assert.equal(placeCategory({name:'한식처럼',category:'음식점 > 중식 > 중국요리'}),'중식');
  assert.equal(placeCategory({name:'피자집',category:'음식점 > 한식'}),'한식');
  assert.equal(placeCategory({category:'음식점 > 양식 > 햄버거'}),'패스트푸드');
  assert.equal(placeCategory({kind:'카페'}),'카페·디저트');
});

test('filter and distance sort use coordinates without changing source order',()=>{
  const places=[
    {name:'먼 한식',category:'음식점 > 한식',lat:37.62,lng:127.07},
    {name:'가까운 중식',category:'음식점 > 중식',lat:37.62,lng:127.051},
    {name:'가까운 한식',category:'음식점 > 한식',lat:37.62,lng:127.05}
  ];
  const location={lat:37.62,lng:127.05};
  assert.deepEqual(browsePlaces(places,{category:'한식',sort:'distance',location}).map(p=>p.name),['가까운 한식','먼 한식']);
  assert.equal(places[0].name,'먼 한식');
  assert.equal(Math.round(distanceMeters(location,places[2])),0);
});
