import {authConfig,authenticate,requireUser} from './auth.js';
import {checkDatabase} from './db/pool.js';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { processChatRecommendation, prepareShareApproval } from './services/nimService.js';
import fs from 'fs';
import {createContributionRouter} from './contributionRoutes.js';
import {communityRoutes} from './communityRoutes.js';
import {createGroupRouter} from './groupRoutes.js';
import {createOwnerMarketingRouter} from './ownerMarketingRoutes.js';
import {ownerMarketingStore} from './services/ownerMarketingStore.js';
import {userDataStore} from './services/userDataStore.js';
import {createRewardRouter,earn} from './rewardRoutes.js';
import {rewardStore} from './services/rewardStore.js';
import {aiReady,textModel} from './services/llm.js';
import {communityStore} from './services/communityStore.js';
import {postImage,postShareHtml} from './services/postShare.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({limit:'8mb'}));
app.get('/api/auth/config',(req,res)=>{const config=authConfig();if(!config.url||!config.key)return res.status(503).json({error:'로그인 설정이 필요해요.'});res.json(config);});
app.get('/api/auth/me',authenticate,requireUser,async(req,res)=>{const a=await ownerMarketingStore.accountForUser(req.user.id);res.json({user:{id:req.user.id,email:req.user.email,nickname:req.user.user_metadata?.nickname||'월계 이웃',admin:req.isAdmin,ownerPlaceId:a?.status==='approved'?a.placeId:null}});});
app.get('/api/me/data',authenticate,requireUser,async(req,res)=>{try{res.json(await userDataStore.get(req.user.id));}catch{res.status(503).json({error:'내 기록을 불러오지 못했어요.'});}});
app.put('/api/me/data',authenticate,requireUser,async(req,res)=>{try{res.json(await userDataStore.set(req.user.id,req.body));}catch{res.status(503).json({error:'내 기록을 저장하지 못했어요.'});}});
// 장소 목록과 찾기 검색은 로그인 없이 쓸 수 있어야 하므로 로그인 검사보다 먼저 연결한다.
app.use('/api/community', communityRoutes);
app.use('/api/community', authenticate, createContributionRouter({requireAccount:true,onEarn:earn,onRevoke:refKey=>rewardStore.revokeRef(refKey),roleFor:async(req,placeId)=>{if(!req.user)return 'neighbor';const a=await ownerMarketingStore.accountForUser(req.user.id);return a?.status==='approved'&&a.placeId===placeId?'owner':'neighbor';}}));
app.use('/api/groups', createGroupRouter());
app.use('/api/rewards', createRewardRouter());
app.use('/api/owner', createOwnerMarketingRouter());

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    model: textModel(),
    hasKey: aiReady(),
    hasKakaoKey: !!(process.env.KAKAO_REST_API_KEY && process.env.KAKAO_REST_API_KEY !== 'your_kakao_rest_api_key_here')
  });
});

// Chat recommendation endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    const result = await processChatRecommendation(message, history || []);
    res.json(result);
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Prepare approval for KakaoTalk share
app.post('/api/share/prepare', async (req, res) => {
  try {
    const { restaurantId, userMessage } = req.body;
    if (!restaurantId) {
      return res.status(400).json({ error: 'restaurantId is required' });
    }

    const result = await prepareShareApproval(restaurantId, userMessage);
    res.json(result);
  } catch (error) {
    console.error('Share prepare error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get restaurant catalog via Kakao API
app.get('/api/restaurants', async (req, res) => {
  try {
    const { searchKakaoMultiQuery } = await import('./services/kakaoService.js');
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '맛집';
    const result = await searchKakaoMultiQuery([query || '맛집']);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve static frontend files in production
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.get('/api/community/post-image/:id',async(req,res)=>{
    const post=(await communityStore.posts()).find(p=>p.id===req.params.id);
    const image=postImage(post);
    if(!image)return res.sendStatus(404);
    res.type(image.type).set('Cache-Control','public, max-age=3600').send(image.bytes);
  });
  app.get('/',async(req,res,next)=>{
    const id=req.query.post;
    if(typeof id!=='string'||!/^[-\w]{1,100}$/.test(id))return next();
    const post=(await communityStore.posts()).find(p=>p.id===id);
    if(!post)return next();
    const protocol=req.get('x-forwarded-proto')==='https'?'https':req.protocol;
    const url=`${protocol}://${req.get('host')}/?post=${encodeURIComponent(id)}`;
    const html=fs.readFileSync(path.join(distPath,'index.html'),'utf8');
    res.type('html').set('Cache-Control','no-store').send(postShareHtml(html,post,url));
  });
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Vercel imports the Express app as a Function. Only the local server owns a port.
if (!process.env.VERCEL) {
  try{await checkDatabase();}catch{console.error('공용 DB 연결 또는 테이블 확인 실패. 서버를 시작하지 않습니다. DB 설정과 npm run db:setup을 확인하세요.');process.exit(1);}
  const server = app.listen(PORT, process.env.HOST || '127.0.0.1', () => {
    console.log(`Local Gourmet Agent server running on http://localhost:${server.address().port}`);
  });
}

export default app;
