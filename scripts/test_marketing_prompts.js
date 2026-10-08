async function main() {
  const enterRes = await fetch('http://localhost:3001/api/owner/enter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ placeId: 'kakao-1724922445' })
  });
  const { token } = await enterRes.json();

  const testPrompts = [
    "비 오는 날 따뜻한 김치전이랑 막걸리 세트 20% 할인 포스터 만들어줘",
    "광운대 중간고사 기간 대학생 응원 이벤트! 학생증 제시 시 치즈사리나 음료수 공짜로 주는 포스터",
    "오늘 점심 특선 제육볶음 정식 8,900원 한정수량 타임세일 포스터 제작해줘",
    "봄맞이 신메뉴 생딸기 크로플 출시 기념 아메리카노 1,000원 세트 포스터 만들어줘",
    "불타는 금요일 밤 9시 이후 입장 고객 생맥주 1+1 이벤트 포스터 만들어줘"
  ];

  console.log('=== MULTI-PROMPT MARKETING POSTER GENERATION TEST ===\n');
  for (let i = 0; i < testPrompts.length; i++) {
    const p = testPrompts[i];
    console.log(`\n--------------------------------------------------`);
    console.log(`[TEST CASE ${i + 1}] 요청: "${p}"`);
    try {
      const res = await fetch('http://localhost:3001/api/owner/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: p, history: [] })
      });
      const data = await res.json();
      console.log(`Status: ${res.status}`);
      console.log(`Card output:`, JSON.stringify(data.card, null, 2));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}

main();
