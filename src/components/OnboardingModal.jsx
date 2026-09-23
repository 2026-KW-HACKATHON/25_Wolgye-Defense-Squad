import React, { useState } from 'react';
import { Sparkles, Utensils, MessageCircle, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';

export default function OnboardingModal({ isOpen, onComplete }) {
  // Step: 'welcome' (n2) -> 'kakao_login' (n4) -> 'consent' (n7) -> complete (n9)
  const [step, setStep] = useState('welcome');
  const [agreedKakao, setAgreedKakao] = useState(true);
  const [agreedCalendar, setAgreedCalendar] = useState(true);

  if (!isOpen) return null;

  const handleAllAgree = (e) => {
    const checked = e.target.checked;
    setAgreedKakao(checked);
    setAgreedCalendar(checked);
  };

  const handleFinish = (userProfile) => {
    onComplete(userProfile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-100">
        {/* Step 1: 온보딩 / 시작 화면 (n2) */}
        {step === 'welcome' && (
          <div className="p-6 sm:p-8">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-inner">
              <Utensils className="h-7 w-7" />
            </div>

            <div className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600 mb-3 border border-orange-200/60">
              <Sparkles className="h-3.5 w-3.5" />
              <span>광운대 해커톤 상권 활성화 프로젝트</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
              능동형 로컬 미식 에이전트
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              “오늘 공강 90분인데 뭐 먹지?”<br />
              광운대 학생의 공강 시간과 예산에 맞춰, 숨겨진 골목 상권 소상공인 맛집을 AI가 맞춤 추천하고 카카오톡 공유까지 도와드려요.
            </p>

            <div className="mt-6 space-y-3 rounded-xl bg-gray-50 p-4 border border-gray-100 text-xs text-gray-700">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold">1</span>
                <span>공강 시간 및 왕복 도보·식사 소요 시간 추정 안내</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold">2</span>
                <span>광운로 골목 소상공인 식당 가중치 및 블로그 핵심 인용문</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white font-bold">3</span>
                <span>친구와 빠르게 공유할 수 있는 카카오톡 승인 연동</span>
              </div>
            </div>

            <div className="mt-8 space-y-2.5">
              <button
                type="button"
                onClick={() => setStep('kakao_login')}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FEE500] py-3.5 px-4 text-sm font-semibold text-[#191919] shadow-sm hover:brightness-95 active:scale-[0.98] transition-all"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3C6.477 3 2 6.477 2 10.767c0 2.775 1.879 5.2 4.73 6.545-.208.775-.75 2.802-.858 3.238-.135.545.198.538.417.393.173-.114 2.748-1.87 3.864-2.632.607.086 1.23.131 1.847.131 5.523 0 10-3.477 10-7.767C22 6.477 17.523 3 12 3z" />
                </svg>
                카카오 로그인 화면 체험 (모의)
              </button>

              <button
                type="button"
                onClick={() => handleFinish({ name: '광운대생(게스트)', isLoggedIn: false, permissionsGranted: false })}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-[0.98] transition-all"
              >
                게스트로 바로 체험하기
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 카카오 로그인 시뮬레이션 (n4 / n5) */}
        {step === 'kakao_login' && (
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FEE500] text-[#191919] shadow-md">
                <svg className="h-8 w-8 fill-current" viewBox="0 0 24 24">
                  <path d="M12 3C6.477 3 2 6.477 2 10.767c0 2.775 1.879 5.2 4.73 6.545-.208.775-.75 2.802-.858 3.238-.135.545.198.538.417.393.173-.114 2.748-1.87 3.864-2.632.607.086 1.23.131 1.847.131 5.523 0 10-3.477 10-7.767C22 6.477 17.523 3 12 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">카카오 로그인 시뮬레이션</h3>
              <p className="mt-1 text-xs text-gray-500">
                실제 계정 연결이나 권한 부여 없이 화면만 체험합니다.
              </p>
            </div>

            <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-400 flex items-center justify-center text-white font-bold text-sm shadow">
                  KW
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">광운인 (학생)</div>
                  <div className="text-xs text-gray-500">kw_student@kw.ac.kr</div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2">
              <button
                type="button"
                onClick={() => setStep('consent')}
                className="w-full rounded-xl bg-[#FEE500] py-3.5 text-sm font-semibold text-[#191919] hover:brightness-95 active:scale-[0.98] transition-all"
              >
                예시 계정으로 체험
              </button>
              <button
                type="button"
                onClick={() => setStep('welcome')}
                className="w-full rounded-xl py-2.5 text-xs text-gray-500 hover:text-gray-800"
              >
                뒤로 가기
              </button>
            </div>
          </div>
        )}

        {/* Step 3: 권한 동의 화면 (n7 / n8) */}
        {step === 'consent' && (
          <div className="p-6 sm:p-8">
            <h3 className="text-xl font-bold text-gray-900">권한 동의 화면 체험</h3>
            <p className="mt-1 text-xs text-gray-500 leading-relaxed">
              식당 추천 결과 공유 및 일정 추가 기능을 위해 아래 권한에 동의해 주세요.
            </p>

            <div className="mt-5 space-y-3">
              <label className="flex items-center gap-3 p-3 rounded-xl border border-orange-200 bg-orange-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedKakao && agreedCalendar}
                  onChange={handleAllAgree}
                  className="h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm font-semibold text-gray-900">전체 항목 동의</span>
              </label>

              <div className="divide-y divide-gray-100 rounded-xl border border-gray-200 bg-white p-2">
                <label className="flex items-start gap-3 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedKakao}
                    onChange={(e) => setAgreedKakao(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <MessageCircle className="h-3.5 w-3.5 text-[#FEE500] fill-[#191919]" />
                      카카오톡 메시지 전송 및 공유 권한
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500 leading-tight">
                      선택한 식당 정보와 추천 사유를 친구 대화방에 공유할 수 있습니다. (대화방 열람 권한 없음)
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedCalendar}
                    onChange={(e) => setAgreedCalendar(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-800">
                      <Calendar className="h-3.5 w-3.5 text-blue-500" />
                      캘린더 일정 추가 권한 (선택)
                    </div>
                    <p className="mt-0.5 text-[11px] text-gray-500 leading-tight">
                      결정된 식당 방문 및 식사 시간을 캘린더에 일정으로 등록합니다.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                disabled={!agreedKakao}
                onClick={() =>
                  handleFinish({
                    name: '광운인',
                    email: 'kw_student@kw.ac.kr',
                    isLoggedIn: true,
                    permissionsGranted: agreedKakao
                  })
                }
                className="w-full rounded-xl bg-orange-600 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:opacity-50 active:scale-[0.98] transition-all"
              >
                모의 동의 후 체험하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
