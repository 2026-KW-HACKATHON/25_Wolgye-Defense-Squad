let appPromise;

export default async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const route = url.searchParams.get('__apiPath');
  if (!route || route.startsWith('/') || route.split('/').includes('..')) {
    res.statusCode = 404;
    res.end();
    return;
  }

  url.searchParams.delete('__apiPath');
  req.url = `/api/${route}${url.search}`;

  try {
    appPromise ??= import('../server/index.js').then(module => module.default).catch(error => {
      appPromise = null;
      throw error;
    });
    const app = await appPromise;
    await new Promise(resolve => {
      res.once('finish', resolve);
      res.once('close', resolve);
      app(req, res);
    });
  } catch (error) {
    console.error('Vercel API initialization failed:', error);
    if (!res.headersSent) {
      res.statusCode = 503;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({error: '배포 서버 설정을 확인해 주세요.'}));
    }
  }
}
