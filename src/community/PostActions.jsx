import React from 'react';
import {Bookmark,Share2,Users} from 'lucide-react';

export default function PostActions({post,saved,onSave,onSuggest,onShare}){
  return <div className="post-actions" aria-label={`${post.title} 바로가기`}>
    <button type="button" aria-pressed={saved} onClick={onSave}><Bookmark size={16} fill={saved?'currentColor':'none'}/>{saved?'가게 저장됨':'가게 저장'}</button>
    <button type="button" onClick={onSuggest}><Users size={16}/>모임 후보로</button>
    <button type="button" onClick={onShare}><Share2 size={16}/>공유</button>
  </div>;
}
