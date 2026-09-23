import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Sparkles, UserCheck, ShieldCheck, HelpCircle } from 'lucide-react';
import ChatContainer from './components/ChatContainer';
import OnboardingModal from './components/OnboardingModal';

export default function App() {
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    // Check local storage for existing session
    const saved = localStorage.getItem('kw_gourmet_user');
    if (saved) {
      try {
        setUserProfile(JSON.parse(saved));
      } catch (e) {
        setIsOnboardingOpen(true);
      }
    } else {
      setIsOnboardingOpen(true);
    }
  }, []);

  const handleOnboardingComplete = (profile) => {
    setUserProfile(profile);
    localStorage.setItem('kw_gourmet_user', JSON.stringify(profile));
    setIsOnboardingOpen(false);
  };

  const handleRestartOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-white">
      {/* Top Navigation Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white px-4 sm:px-6 shadow-sm z-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base text-gray-900 tracking-tight">
                광운대 로컬 미식 AI
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold text-orange-700">
                <Sparkles className="h-3 w-3" />
                v2 에이전트
              </span>
            </div>
            <p className="hidden sm:block text-[11px] text-gray-500">
              광운대학교 캠퍼스 골목 상권 활성화 & 스마트 식당 추천
            </p>
          </div>
        </div>

        {/* User Status and Onboarding Trigger */}
        <div className="flex items-center gap-2">
          {userProfile ? (
            <button
              type="button"
              onClick={handleRestartOnboarding}
              className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              {userProfile.isLoggedIn ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-gray-900">{userProfile.name}</span>
                  <span className="text-[10px] text-gray-400">(모의 계정)</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-gray-600">게스트 모드</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-orange-700"
            >
              시작하기
            </button>
          )}
        </div>
      </header>

      {/* Main Chat Layout (와이어프레임 v2 layout=app) */}
      <main className="relative flex-1 overflow-hidden">
        <ChatContainer
          userProfile={userProfile}
          onOpenAuth={() => setIsOnboardingOpen(true)}
        />
      </main>

      {/* Onboarding / Auth Modal (유저플로우 v2 s1: n1~n8) */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={handleOnboardingComplete}
      />
    </div>
  );
}
