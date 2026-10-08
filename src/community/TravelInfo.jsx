import React from 'react';
import {travelEstimate} from './placeBrowse';

export default function TravelInfo({origin,place}) {
  const estimate=travelEstimate(origin,place);
  if(!estimate)return null;
  return <span className="travel-info" title="좌표 사이 거리와 도보 속도로 계산한 참고값입니다. 실제 길찾기와 다를 수 있어요.">
    거리 약 {estimate.distance} · 도보 약 {estimate.walkMinutes}분
  </span>;
}
