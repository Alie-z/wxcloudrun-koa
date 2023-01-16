const Koa = require('koa');
const Router = require('koa-router');
const logger = require('koa-logger');
const bodyParser = require('koa-bodyparser');
const fs = require('fs');
const path = require('path');
const {init: initDB, Counter} = require('./db');
const {createProxyMiddleware} = require('http-proxy-middleware');
const k2c = require('koa2-connect');
const {PhotoCrawler} = require('./crawler/photo');
const {Resolve} = require('./lib/helper');
const res = new Resolve();

const router = new Router();

const homePage = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');

// 首页
router.get('/home', async ctx => {
    ctx.body = homePage;
});

// 更新计数
router.post('/api/count', async ctx => {
    console.log('🚀 > ctx', ctx.request.body);
    const {request} = ctx;
    const {action} = request.body;
    if (action === 'inc') {
        await Counter.create();
    } else if (action === 'clear') {
        await Counter.destroy({
            truncate: true
        });
    }

    ctx.body = {
        code: 0,
        data: await Counter.count()
    };
});

// 获取计数
router.get('/api/count', async ctx => {
    const result = await Counter.count();

    ctx.body = {
        code: 0,
        data: result
    };
});

// 小程序调用，获取微信 Open ID
router.get('/api/wx_openid', async ctx => {
    if (ctx.request.headers['x-wx-source']) {
        ctx.body = ctx.request.headers['x-wx-openid'];
    }
});

// 查询图集
router.post('/api/photo/search', async ctx => {
    console.log('🚀 > ctx', ctx.request.body);
    const {kw, page = 1} = ctx.request.body;
    const [err, data, hasMore] = await PhotoCrawler.getPhoto({kw, page});
    if (!err) {
        // 返回结果
        ctx.response.status = 200;
        ctx.body = res.json(data, void 0, void 0, void 0, hasMore);
    } else {
        ctx.body = res.fail(err);
    }
});

const app = new Koa();
app.use(logger()).use(bodyParser()).use(router.routes()).use(router.allowedMethods());

const baseURL = 'https://wallhaven.cc/api/v1/';

app.use(async (ctx, next) => {
    if (ctx.url.startsWith('/')) {
        ctx.respond = false;
        await k2c(
            createProxyMiddleware({
                target: baseURL,
                changeOrigin: true,
                onProxyReq(proxyReq) {
                    let url = proxyReq.path;
                    proxyReq.path = url
                        .replace(/categories=[01]{3}/g, 'categories=100')
                        .replace(/purity=[01]{3}/g, 'purity=100');
                }
            })
        )(ctx, next);
    }
    await next();
});

const port = process.env.PORT || 80;
async function bootstrap() {
    await initDB();
    app.listen(port, () => {
        console.log('启动成功', port);
    });
}
bootstrap();
