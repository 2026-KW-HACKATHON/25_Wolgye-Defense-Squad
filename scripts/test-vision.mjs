import { chat } from '../server/services/llm.js';

export async function inspectCandidateImage(imageUrl, shopName = '') {
  const prompt = `이 이미지를 분석하세요.
1. 타 식당의 간판이나 매장 외관(간판 글씨)이 크게 찍힌 사진인가요?
2. 맛있는 음식/요리 또는 연예인/인물의 먹방 사진인가요?
JSON으로만 답하세요:
{
  "hasOtherShopSignboard": boolean (타 식당의 간판/상호 글씨가 크게 보이면 true),
  "signboardText": "읽힌 간판 글씨(없으면 빈 문자열)",
  "isFoodOrPerson": boolean (음식 접시/요리나 인물/먹방 사진이면 true),
  "isAppropriateForBackground": boolean (인스타 배경으로 적합하면 true, 타식당 간판이면 false)
}`;
  try {
    const raw = await chat([
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: imageUrl } }
        ]
      }
    ], { model: 'google/gemini-2.5-flash-lite', timeout: 12000 });
    const match = raw.match(/\{[\s\S]*?\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    console.error('Vision inspection error:', e.message);
  }
  return { hasOtherShopSignboard: false, isFoodOrPerson: true, isAppropriateForBackground: true };
}

async function run() {
  const test1 = 'https://postfiles.pstatic.net/MjAyNDA1MTJfMjMy/MDAxNzE1NTExMDAwMDI3.2HEUC7rXaJYPQnUsvcKrUUeHo5pu2wK55a281Kz4oJYg.CXHEANwKJV4xDvRGZqUiSvdc5iSiq-xivUCRCIcAZ8Yg.JPEG/JK69cGshoFAsVsbH3Wzez4.jpg?type=w966';
  const res = await inspectCandidateImage(test1, '월계분식');
  console.log('Inspection result:', res);
}
run();

