const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

export function postImage(post){
  const match=/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/.exec(post?.image||'');
  if(!match)return null;
  const bytes=Buffer.from(match[2],'base64');
  return bytes.length<=1024*1024?{type:`image/${match[1]}`,bytes}:null;
}

export function postShareHtml(indexHtml,post,url){
  const title=`${post.title} | 월계밥상`;
  const description=String(post.body||'').replace(/\s+/g,' ').slice(0,150);
  const image=postImage(post)?new URL(`/api/community/post-image/${encodeURIComponent(post.id)}`,url).href:null;
  const tags=[
    ['og:type','article'],['og:site_name','월계밥상'],['og:title',title],
    ['og:description',description],['og:url',url],
    ...(image?[['og:image',image]]:[])
  ].map(([property,content])=>`<meta property="${property}" content="${escapeHtml(content)}" />`).join('\n    ');
  return indexHtml.replace(/<title>[^<]*<\/title>/,`<title>${escapeHtml(title)}</title>`)
    .replace('</head>',`    ${tags}\n  </head>`);
}
