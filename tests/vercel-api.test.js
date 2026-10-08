import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';

test('Vercel API entry forwards nested routes to Express without opening a second port', {timeout:15000}, async () => {
  process.env.VERCEL = '1';
  process.env.NODE_ENV = 'test';
  process.env.DATA_STORE = 'file';
  const {default: handler} = await import('../api/index.js');
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = url.pathname.replace(/^\/api\//, '');
    url.searchParams.set('__apiPath', route);
    req.url = `/api/index${url.search}`;
    void handler(req, res);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    const health = await fetch(`${base}/api/health?source=deployment`);
    assert.equal(health.status, 200);
    assert.equal((await health.json()).status, 'ok');

    const invalidSearch = await fetch(`${base}/api/community/search`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({message: ''})
    });
    assert.equal(invalidSearch.status, 400);
    assert.match((await invalidSearch.json()).error, /검색어/);
  } finally {
    server.close();
    await once(server, 'close');
  }
});
