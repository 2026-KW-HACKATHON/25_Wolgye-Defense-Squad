import test from 'node:test';
import assert from 'node:assert/strict';
import {postImage,postShareHtml} from '../server/services/postShare.js';

test('shared news previews escape user text and use the post-specific URL',()=>{
  const post={id:'abc123',title:'맛집 <추천> "오늘"',body:'좋아요 <script>alert(1)</script>',image:'data:image/png;base64,aGVsbG8='};
  const html=postShareHtml('<html><head><title>월계밥상</title></head><body></body></html>',post,'https://example.com/?post=abc123');
  assert.match(html,/<title>맛집 &lt;추천&gt; &quot;오늘&quot; \| 월계밥상<\/title>/);
  assert.match(html,/property="og:url" content="https:\/\/example\.com\/\?post=abc123"/);
  assert.match(html,/property="og:image" content="https:\/\/example\.com\/api\/community\/post-image\/abc123"/);
  assert.doesNotMatch(html,/<script>/);
  assert.deepEqual(postImage(post).bytes,Buffer.from('hello'));
  assert.equal(postImage({...post,image:'https://other.example/image.jpg'}),null);
});
