import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User, Utensils, Share2, AlertCircle, RefreshCw, Compass } from 'lucide-react';
import RestaurantCard from './RestaurantCard';
import KakaoShareOverlay from './KakaoShareOverlay';

const QUICK_PROMPTS = [
  "혼자 먹기 좋은 곳이요, 예산은 만 원 이내로요",
  "오늘 3명이서 인당 1만 원 이하로 매콤한 거 먹고 싶은데, 공강이 90분이야",
  "동아리 친구들이랑 든든하게 고기나 백반 먹고 싶어요",
  "공강 30분인데 초스피드로 먹을 수 있는 가성비 식당 있어?"
];

export default function ChatContainer({ userProfile, onOpenAuth }) {
  const [messages, setMessages] = useState([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: '안녕하세요! 광운대 인근 맛집을 찾아드릴게요 🍽️\n오늘 어떤 식사를 원하시나요? 예산, 메뉴, 분위기, 공강 시간 등 편하게 말씀해 주세요.',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [shareOverlayData, setShareOverlayData] = useState(null);
  const [isShareOverlayOpen, setIsShareOverlayOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleSendMessage = async (customText) => {
    const textToSend = typeof customText === 'string' ? customText : inputValue;
    if (!textToSend.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4)
        })
      });

      if (!response.ok) {
        throw new Error('서버 응답 오류가 발생했습니다.');
      }

      const data = await response.json();

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: data.aiMessage || '광운대 인근 추천 식당 3곳을 선별했어요! 🥢',
        restaurants: data.restaurants || [],
        extracted: data.extracted || {},
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: '죄송합니다, 잠시 후 다시 시도해 주세요. (NVIDIA NIM 연결 확인 중)',
          isError: true,
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);

    try {
      const response = await fetch('/api/share/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId: restaurant.id
        })
      });

      const data = await response.json();

      // Append Agentic Approval Message into chat flow (Wireframe v2)
      const approvalMsg = {
        id: `approval-${Date.now()}`,
        sender: 'ai',
        text: data.aiIntro || `${restaurant.name}을(를) 선택하셨군요! 카카오톡으로 친구에게 공유할까요? 😊`,
        approvalData: data,
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, approvalMsg]);
    } catch (err) {
      console.error('Share prepare error:', err);
    }
  };

  const handleOpenKakaoShare = (approvalData) => {
    setShareOverlayData(approvalData.shareCard);
    setIsShareOverlayOpen(true);
  };

  const handleDismissApproval = (msgId) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return (
    <div className="flex h-full flex-col bg-gray-50/50">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gray-900 px-5 py-2.5 text-xs font-semibold text-white shadow-xl animate-in fade-in slide-in-from-top-2">
          {toastMessage}
        </div>
      )}

      {/* 대화 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Messages list */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-sm ${
                msg.sender === 'user'
                  ? 'border-orange-200 bg-white ml-auto max-w-xl'
                  : 'border-gray-200/80 bg-white'
              }`}
            >
              {/* Message Header */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gradient-to-tr from-orange-500 to-amber-400 text-white'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="h-4 w-4" />
                  ) : (
                    <Bot className="h-4 w-4" />
                  )}
                </div>
                <span className="text-xs font-bold text-gray-800">
                  {msg.sender === 'user'
                    ? userProfile?.name || '나'
                    : '로컬 미식 AI'}
                </span>
                <span className="text-[11px] text-gray-400 ml-auto">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {/* Message Text */}
              <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line font-medium">
                {msg.text}
              </div>

              {/* 식당 3곳 추천 카드 리스트 (와이어프레임 v2) */}
              {msg.restaurants && msg.restaurants.length > 0 && (
                <div className="mt-4 pt-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {msg.restaurants.map((rest) => (
                      <RestaurantCard
                        key={rest.id}
                        restaurant={rest}
                        breakTime={msg.extracted?.breakTime}
                        isSelected={selectedRestaurant?.id === rest.id}
                        onSelect={handleSelectRestaurant}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 카카오톡 공유 승인 박스 (Agentic Approval Flow - 와이어프레임 v2) */}
              {msg.approvalData && (
                <div className="mt-4 rounded-xl border border-yellow-300 bg-yellow-50/60 p-4 shadow-sm">
                  <div className="text-xs font-bold text-yellow-800 mb-1 flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5" />
                    카카오톡 공유 미리보기
                  </div>
                  <div className="rounded-lg border border-yellow-200 bg-white p-3 space-y-1">
                    <div className="text-sm font-bold text-gray-900">
                      {msg.approvalData.shareCard.title}
                    </div>
                    <div className="text-xs text-gray-600">
                      {msg.approvalData.shareCard.description}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      📍 {msg.approvalData.shareCard.address}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleDismissApproval(msg.id)}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenKakaoShare(msg.approvalData)}
                      className="flex items-center gap-1.5 rounded-lg bg-[#FEE500] px-3.5 py-1.5 text-xs font-bold text-[#191919] shadow-sm hover:brightness-95 active:scale-95"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      카카오톡으로 공유 승인
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm animate-pulse max-w-sm">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="text-xs text-gray-600 font-medium">
                광운대 인근 골목 상권 및 소상공인 맛집 분석 중...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 하단 입력 및 추천 질문 영역 */}
      <div className="border-t border-gray-200 bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-3xl">
          {/* Quick Prompts Chips */}
          <div className="mb-2 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs text-gray-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-colors disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar (와이어프레임 v2: row input type=area) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2 rounded-2xl border border-gray-300 bg-white p-1.5 shadow-sm focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20"
          >
            <textarea
              rows={1}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="광운대 인근 식당 추천해줘... 예: '매운 거 먹고 싶어', '친구랑 파스타', '공강 60분 만원 이하'"
              className="flex-1 resize-none border-0 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-0 max-h-24"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm hover:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 active:scale-95 transition-all"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="mt-1.5 text-center text-[10px] text-gray-400">
            NVIDIA NIM (Llama 3.2 11B) 및 광운로 소상공인 골목상권 가중치 추천 모델이 적용되어 있습니다.
          </div>
        </div>
      </div>

      {/* Kakao Share Overlay Modal (overlay:kakao-share) */}
      <KakaoShareOverlay
        isOpen={isShareOverlayOpen}
        onClose={() => setIsShareOverlayOpen(false)}
        shareData={shareOverlayData}
        onSuccess={showToast}
      />
    </div>
  );
}
