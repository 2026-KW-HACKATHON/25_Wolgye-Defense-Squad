import React, {useEffect, useRef, useState} from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {MapPin} from 'lucide-react';
import boundary from './wolgye1-boundary.json';

const polygons = boundary.geometry.coordinates;
function inRing([x,y], ring) {
  let inside = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [xi,yi]=ring[i], [xj,yj]=ring[j];
    if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
  }
  return inside;
}
export const inWolgye1 = (lat,lng) => polygons.some(rings => inRing([lng,lat],rings[0]) && !rings.slice(1).some(r=>inRing([lng,lat],r)));
const districtBounds = L.geoJSON(boundary).getBounds();
// highlight: 강조할 가게 id 목록. 주면 나머지 가게는 작고 흐린 점, 강조 가게는 큰 연두색 점으로 그린다.
export default function LocationMap({places=[],onPlace,onPick,selected,highlight}) {
  const container = useRef(null), map = useRef(null), locationLayer = useRef(null), request = useRef(0);
  const [busy, setBusy] = useState(false), [status, setStatus] = useState('');
  useEffect(() => {
    const instance = L.map(container.current, {maxBounds:districtBounds, maxBoundsViscosity:1}).fitBounds(districtBounds);
    instance.setMinZoom(instance.getBoundsZoom(districtBounds));
    map.current = instance;
    const mutedPane = instance.createPane('mutedDistrict');
    mutedPane.style.zIndex = '200';
    mutedPane.style.filter = 'grayscale(1)';
    mutedPane.style.opacity = '.4';
    const colorPane = instance.createPane('colorDistrict');
    colorPane.style.zIndex = '210';
    const clipDistrict = () => {
      const path = polygons.flatMap(rings=>rings.map(ring=>ring.map(([lng,lat],i)=>{
        const p=instance.latLngToLayerPoint([lat,lng]);return `${i?'L':'M'}${p.x} ${p.y}`;
      }).join(' ')+' Z')).join(' ');
      colorPane.style.clipPath = `path(evenodd, "${path}")`;
    };
    clipDistrict();
    instance.on('move zoomend viewreset resize',clipDistrict);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {pane:'mutedDistrict',maxZoom:19}).addTo(instance);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      pane:'colorDistrict',
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(instance);
    L.geoJSON(boundary,{style:{color:'#193e33',weight:4,opacity:1,fillOpacity:0},interactive:false}).addTo(instance);
    instance.attributionControl.addAttribution('<a href="https://github.com/vuski/admdongkor">행정동 경계 · 2026-07</a>');
    tiles.on('tileerror', () => setStatus('지도 일부를 불러오지 못했어요. 인터넷 연결을 확인해 주세요.'));
    const observer = new ResizeObserver(() => {instance.invalidateSize();instance.setMinZoom(instance.getBoundsZoom(districtBounds));});
    observer.observe(container.current);
    return () => { request.current++; observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(()=>{
    if(!map.current)return;
    const layer=L.layerGroup().addTo(map.current);
    for(const place of places){
      if(!inWolgye1(place.lat,place.lng))continue;
      const box=document.createElement('div');
      const title=document.createElement('strong');title.textContent=place.name;box.append(title);
      const button=document.createElement('button');button.textContent='가게 정보 보기';button.style.display='block';button.style.padding='8px 0';button.onclick=()=>onPlace?.(place.id);box.append(button);
      const on=highlight?.includes(place.id);
      const style=!highlight?{radius:7,color:'#fff',weight:2,fillColor:'#193e33',fillOpacity:1}:on?{radius:10,color:'#193e33',weight:3,fillColor:'#d5f65b',fillOpacity:1}:{radius:6,color:'#fff',weight:1.5,fillColor:'#193e33',fillOpacity:.45};
      const marker=L.circleMarker([place.lat,place.lng],style).bindPopup(box).addTo(layer);
      if(on)marker.bringToFront();
    }
    return()=>layer.remove();
  },[places,onPlace,highlight?.join(',')]);
  useEffect(()=>{
    if(!map.current||!onPick)return;
    const click=e=>{if(inWolgye1(e.latlng.lat,e.latlng.lng)){onPick({lat:e.latlng.lat,lng:e.latlng.lng});setStatus('선택한 위치에 새 가게를 등록합니다.');}else setStatus('월계1동 경계 안을 선택해 주세요.');};
    map.current.on('click',click);return()=>map.current?.off('click',click);
  },[onPick]);
  useEffect(()=>{if(!map.current||!selected)return;const marker=L.circleMarker([selected.lat,selected.lng],{radius:12,color:'#193e33',weight:3,fillColor:'#d5f06c',fillOpacity:1}).addTo(map.current);return()=>marker.remove();},[selected]);
  function locate() {
    if (!window.isSecureContext || !navigator.geolocation) {
      setStatus('현재 위치는 HTTPS 주소 또는 localhost의 지원 브라우저에서 사용할 수 있어요.'); return;
    }
    const id = ++request.current;
    setBusy(true); setStatus('위치를 확인하고 있어요…');
    navigator.geolocation.getCurrentPosition(({coords}) => {
      if (id !== request.current || !map.current) return;
      const point = [coords.latitude, coords.longitude];
      locationLayer.current?.remove();
      if (!inWolgye1(coords.latitude, coords.longitude)) {
        locationLayer.current = null;
        setBusy(false);setStatus('지금 월계1동 밖에 있어서 내 위치는 표시하지 않았어요.');return;
      }
      locationLayer.current = L.layerGroup([
        L.circle(point, {radius: coords.accuracy, color:'#3478dc', weight:1, fillOpacity:.1}),
        L.circleMarker(point, {radius:9, color:'#fff', weight:3, fillColor:'#2474e8', fillOpacity:1}).bindPopup('내 현재 위치')
      ]).addTo(map.current);
      map.current.setView(point, 16);
      setBusy(false); setStatus(`내 위치를 표시했어요 (오차 약 ${Math.round(coords.accuracy).toLocaleString()}m)`);
    }, error => {
      if (id !== request.current) return;
      setBusy(false);
      setStatus(error.code === 1 ? '위치 권한이 거부됐어요. 주소창의 사이트 권한에서 위치를 허용한 뒤 다시 눌러주세요.' : error.code === 3 ? '위치 확인 시간이 초과됐어요. 다시 시도해 주세요.' : '현재 위치를 확인할 수 없어요. 기기의 위치 설정을 확인해 주세요.');
    }, {enableHighAccuracy:true, timeout:15000, maximumAge:0});
  }
  return <section className="location-map-panel">
    <div className="location-map-toolbar"><b>월계1동 골목 지도</b><div><button type="button" className="button outline" onClick={()=>map.current?.fitBounds(districtBounds)}>동네 전체</button><button type="button" className="button dark" onClick={locate} disabled={busy}><MapPin size={18}/>{busy?'확인 중…':'내 위치'}</button></div></div>
    <div ref={container} className="live-location-map" aria-label="현재 위치를 확인할 수 있는 실제 지도"/>
    {status&&<p role="status" className="location-status">{status}</p>}
    <small className="location-note">📍 내 위치는 버튼을 누를 때만 확인하고 저장하지 않아요.</small>
  </section>;
}
