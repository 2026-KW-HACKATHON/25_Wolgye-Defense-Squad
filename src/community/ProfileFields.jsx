import React from 'react';

// 가입·프로필 수정에서 함께 쓰는 필수 항목. 사장님 성과 리포트의 구분과 같게 맞춘다.
export const AGES=['10대','20대','30대','40대','50대 이상'];
export const GENDERS=['여성','남성','기타'];
export const needsProfile=user=>!!user&&(!AGES.includes(user.user_metadata?.ageGroup)||!GENDERS.includes(user.user_metadata?.gender));

export default function ProfileFields({age='',gender='',onAge,onGender}){
 return <>
  <div className="profile-fields">
   <label>연령대<select name="ageGroup" required value={age} onChange={e=>onAge?.(e.target.value)}><option value="" disabled>선택해 주세요</option>{AGES.map(a=><option key={a}>{a}</option>)}</select></label>
   <label>성별<select name="gender" required value={gender} onChange={e=>onGender?.(e.target.value)}><option value="" disabled>선택해 주세요</option>{GENDERS.map(g=><option key={g}>{g}</option>)}</select></label>
  </div>
  <p className="muted field-note">연령대·성별은 다른 이용자에게 공개되지 않아요. 가게 조회 통계를 연령대·성별 단위로 묶어 사장님께 보여주는 데 써요.</p>
 </>;
}
