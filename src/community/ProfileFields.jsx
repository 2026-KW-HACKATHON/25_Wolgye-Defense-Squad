import React from 'react';

// 가입·프로필 수정에서 함께 쓰는 선택 항목. 사장님 성과 리포트의 구분과 같게 맞춘다.
export const AGES=['10대','20대','30대','40대','50대 이상'];
export const GENDERS=['여성','남성','기타'];

export default function ProfileFields({age='',gender='',onAge,onGender}){
 return <>
  <div className="profile-fields">
   <label>연령대 (선택)<select name="ageGroup" value={age} onChange={e=>onAge?.(e.target.value)}><option value="">선택하지 않음</option>{AGES.map(a=><option key={a}>{a}</option>)}</select></label>
   <label>성별 (선택)<select name="gender" value={gender} onChange={e=>onGender?.(e.target.value)}><option value="">선택하지 않음</option>{GENDERS.map(g=><option key={g}>{g}</option>)}</select></label>
  </div>
  <p className="muted field-note">입력하지 않아도 이용할 수 있어요. 입력한 값은 다른 이용자에게 공개되지 않고 가게 조회 통계로만 묶어 보여줘요.</p>
 </>;
}
