import React, { useState } from 'react';
import { X, Check, Copy, Share2, Calendar, Sparkles } from 'lucide-react';

export default function KakaoShareOverlay({
  isOpen,
  onClose,
  shareData,
  onSuccess
}) {
  if (!isOpen || !shareData) return null;

  const [copied, setCopied] = useState(false);
  const [calendarAdded, setCalendarAdded] = useState(false);
  const [customComment, setCustomComment] = useState('다 같이 가실 분?!');

  const shareText = `[광운대 로컬 미식 AI 추천]
🍜 ${shareData.title}
📍 위치: ${shareData.address}
🚶 이동: 도보 약 ${shareData.walkingTime}분
💰 평균 예산: 1인 약 ${shareData.price?.toLocaleString()}원
💬 "${shareData.description}"

👉 ${customComment}
🔗 상세 링크: ${shareData.link}`;

  const handleShare = async () => {
    // Web Share API support check
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareText,
          url: shareData.link
        });
        if (onSuccess) onSuccess('카카오톡 공유가 성공적으로 전달되었습니다!');
        onClose();
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Web Share API error, falling back to clipboard:', err);
        }
      }
    }

    // Clipboard fallback
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      if (onSuccess) onSuccess('카카오톡 공유 문구가 클립보드에 복사되었습니다! 대화방에 붙여넣어 공유하세요.');
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const handleAddToCalendar = () => {
    // Generate .ics or open Google Calendar link
    const title = encodeURIComponent(`[식사] ${shareData.title}`);
    const details = encodeURIComponent(`${shareData.description}\n주소: ${shareData.address}\n\n추천: 광운대 로컬 미식 AI`);
    const location = encodeURIComponent(shareData.address);
    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
    window.open(googleCalendarUrl, '_blank');
    setCalendarAdded(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FEE500] text-[#191919] font-bold">
              <Share2 className="h-4 w-4" />
            </div>
            <h3 className="text-base font-bold text-gray-900">카카오톡 공유 승인</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-xs text-gray-500 mb-4">
            AI 에이전트가 생성한 추천 내용을 확인하고 카카오톡으로 전송합니다.
          </p>

          {/* Kakao Card Preview Box */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            {shareData.imageUrl && (
              <img
                src={shareData.imageUrl}
                alt={shareData.title}
                className="h-32 w-full object-cover"
              />
            )}
            <div className="p-4 space-y-2 bg-[#FEE500]/10 border-t border-yellow-200/50">
              <div className="inline-flex items-center gap-1 rounded bg-yellow-400/30 px-2 py-0.5 text-[10px] font-semibold text-yellow-900">
                <Sparkles className="h-3 w-3" />
                로컬 미식 AI 추천 카드
              </div>
              <h4 className="text-sm font-bold text-gray-900 leading-snug">
                {shareData.title}
              </h4>
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {shareData.description}
              </p>
              <div className="flex items-center justify-between pt-1 text-[11px] text-gray-500">
                <span>📍 {shareData.address}</span>
                <span className="font-semibold text-orange-600">
                  도보 {shareData.walkingTime}분
                </span>
              </div>
            </div>
          </div>

          {/* Editable Comment */}
          <div className="mt-4">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              친구에게 함께 보낼 한마디 (수정 가능)
            </label>
            <input
              type="text"
              value={customComment}
              onChange={(e) => setCustomComment(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              placeholder="예: 같이 점심 먹을 사람? 12시에 출발!"
            />
          </div>

          {/* Calendar Option */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-blue-50/60 p-3 border border-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-blue-900 font-medium">캘린더에 식사 일정 등록</span>
            </div>
            <button
              type="button"
              onClick={handleAddToCalendar}
              className="rounded-lg bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-blue-700 active:scale-95 transition-all"
            >
              {calendarAdded ? '등록 완료' : '일정 추가'}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-2 rounded-xl bg-[#FEE500] px-5 py-2.5 text-xs font-bold text-[#191919] shadow-sm hover:brightness-95 active:scale-[0.98] transition-all"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span>복사 완료! 대화방에 공유</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4" />
                <span>카카오톡으로 공유하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
