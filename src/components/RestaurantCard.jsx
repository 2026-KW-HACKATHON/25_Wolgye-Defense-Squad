import React from 'react';
import { MapPin, Clock, DollarSign, ExternalLink, Check, Award, Compass } from 'lucide-react';

export default function RestaurantCard({
  restaurant,
  onSelect,
  breakTime,
  isSelected
}) {
  const roundTripTime = restaurant.walkingTimeMin * 2;
  const totalRequiredTime = roundTripTime + restaurant.diningTimeMin;
  const isTimeSafe = !breakTime || totalRequiredTime <= breakTime;

  return (
    <div
      className={`group flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-200 hover:shadow-md ${
        isSelected
          ? 'border-orange-500 ring-2 ring-orange-500/20'
          : 'border-gray-200 hover:border-orange-300'
      }`}
    >
      {/* 식당 사진 */}
      <div className="relative h-36 w-full overflow-hidden bg-gray-100">
        <img
          src={restaurant.imageUrl}
          alt={restaurant.name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* 상단 뱃지: 로컬 분류 미확인 맛집 */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          {restaurant.isLocal && (
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-600/90 backdrop-blur-sm px-2.5 py-0.5 text-[11px] font-semibold text-white shadow-sm">
              <Award className="h-3 w-3" />
              지역 가게 후보
            </span>
          )}
          <span className="rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 text-[11px] font-medium text-white">
            {restaurant.category}
          </span>
        </div>

        {/* 하단 가격/거리 오버레이 */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-1 font-medium">
            <Compass className="h-3.5 w-3.5 text-orange-400" />
            <span>도보 추정 {restaurant.walkingTimeMin}분 (편도)</span>
          </div>
          <span className="font-bold text-orange-200">
            업종 추정 {restaurant.avgPrice.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 식당 콘텐츠 바디 */}
      <div className="flex flex-1 flex-col p-4">
        {/* 이름 및 상태 */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-base font-bold text-gray-900 leading-snug">
            {restaurant.name}
          </h4>
          {restaurant.isLocal && (
            <span className="shrink-0 rounded border border-orange-200 bg-orange-50 px-1.5 py-0.5 text-[10px] font-bold text-orange-700">
              분류 미확인
            </span>
          )}
        </div>

        {/* 상세 메트릭스: 도보 & 식사 소요 시간 */}
        <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 border border-gray-100">
            <Clock className="h-3.5 w-3.5 text-gray-500" />
            <span>총 약 {totalRequiredTime}분 소요</span>
            <span className="text-[10px] text-gray-400">(왕복{roundTripTime}분+식사{restaurant.diningTimeMin}분)</span>
          </div>

          {breakTime && (
            <span
              className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                isTimeSafe
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isTimeSafe ? `공강 ${breakTime}분 내 추정` : `공강 시간 촉박`}
            </span>
          )}
        </div>

        {/* 블로그 핵심 인용문 */}
        <div className="mt-3 rounded-xl bg-orange-50/50 p-3 border border-orange-100/70">
          <p className="text-xs text-gray-700 italic leading-relaxed">
            “{restaurant.blogQuote}”
          </p>
          <div className="mt-1.5 flex items-center justify-between text-[11px] text-gray-400">
            <span>출처: {restaurant.blogSource}</span>
          </div>
        </div>

        {/* 하단 액션 버튼 (와이어프레임 v2 기준) */}
        <div className="mt-4 flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSelect(restaurant)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-semibold shadow-sm transition-all active:scale-[0.98] ${
              isSelected
                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {isSelected ? (
              <>
                <Check className="h-3.5 w-3.5" />
                선택됨
              </>
            ) : (
              '이 식당 선택할게요'
            )}
          </button>

          <a
            href={restaurant.blogUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 rounded-xl border border-gray-200 bg-white py-2.5 px-3 text-xs font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
          >
            블로그 원문
            <ExternalLink className="h-3 w-3 text-gray-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
