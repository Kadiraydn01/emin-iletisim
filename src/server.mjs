import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {pathToFileURL} from 'node:url';
import {db,withData,pageBySlug,isPublished} from './db.mjs';
import {home,renderPage,blog,notFound,sitemap,robots,markdown,esc} from './render.mjs';
import {readImage} from './media-storage.mjs';
import {adminGet,adminPost,adminShell,loginPage} from './admin.mjs';
import {securityHeaders,session,cookie,cookies,token,formBody,verifyOrigin,verifyCsrf,verifyPassword,createSession,endSession,checkAttempt,clearAttempts,fail} from './security.mjs';
async function processRequest(req,res){
 securityHeaders(res);res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');let admin=false,s=null;
 try{
 const url=new URL(req.url,'http://localhost'),path=decodeURIComponent(url.pathname);admin=path==='/admin'||path.startsWith('/admin/');
 if(path.startsWith('//')||/[\\\x00-\x1f\x7f]/.test(path))fail(400,'Geçersiz adres.');
 if(!['GET','HEAD','POST'].includes(req.method)){res.setHeader('Allow','GET, HEAD, POST');fail(405,'Bu yöntem desteklenmiyor.');}
 if(admin){res.setHeader('X-Robots-Tag','noindex, nofollow');s=await session(req);
 if(path==='/admin/login'){
 if(req.method!=='POST'){const t=token();res.setHeader('Set-Cookie',cookie('emin_login',t,600));res.end(await loginPage(t));return;}
 verifyOrigin(req);const f=await formBody(req);verifyCsrf(f.csrf,cookies(req).emin_login);
 const ip=(process.env.VERCEL?String(req.headers['x-vercel-forwarded-for']||req.headers['x-forwarded-for']||'').split(',')[0].trim():req.socket.remoteAddress)||'unknown';if(!await checkAttempt(ip)){res.setHeader('Retry-After','900');fail(429,'Çok fazla giriş denemesi. 15 dakika sonra tekrar deneyin.');}
 const user=await db.prepare('SELECT * FROM users WHERE username=?').get(String(f.username||'').slice(0,80));
 const valid=await verifyPassword(f.password||'',user?.password||'0'.repeat(64)+':'+'0'.repeat(128));
 if(!user||!valid){res.statusCode=401;res.end(await loginPage(f.csrf,'Kullanıcı adı veya parola yanlış.'));return;}
 await clearAttempts(ip);res.setHeader('Set-Cookie',[cookie('emin_session',await createSession(user.id)),cookie('emin_login','',0)]);res.writeHead(303,{Location:'/admin'});res.end();return;
 }
 if(!s){res.writeHead(303,{Location:'/admin/login'});res.end();return;}
 if(s.role!=='admin')fail(403,'Yönetici yetkisi gerekli.');
 if(req.method==='POST'&&path==='/admin/logout'){verifyOrigin(req);const f=await formBody(req);verifyCsrf(f.csrf,s.csrf);await endSession(req);res.setHeader('Set-Cookie',cookie('emin_session','',0));res.writeHead(303,{Location:'/admin/login'});res.end();return;}
 if(req.method==='POST'&&path==='/admin/preview'){verifyOrigin(req);const f=await formBody(req);verifyCsrf(f.csrf,s.csrf);res.end(markdown(f.content||''));return;}
 if(req.method==='POST'){await adminPost(req,res,path,s);return;}
 const html=await adminGet(path,url,s);res.end(url.searchParams.get('saved')?html.replace('<h1>','<p role="status" class="success notice">Değişiklikler kaydedildi.</p><h1>'):html);return;
 }
 if(req.method==='POST')fail(405,'Bu adreste POST desteklenmiyor.');
 if(path==='/robots.txt'){res.setHeader('Content-Type','text/plain; charset=utf-8');res.end(robots());return;}
 if(path==='/sitemap.xml'){res.setHeader('Content-Type','application/xml; charset=utf-8');res.end(sitemap());return;}
 const assets=['/style.css','/app.js','/admin.css','/admin.js','/phone.svg','/favicon.svg'];
 if(assets.includes(path)||/^\/uploads\/[a-f0-9]{24}(?:-small)?\.webp$/.test(path)){
 const file=resolve('public',path.slice(1));
 try{const data=path.startsWith('/uploads/')?await readImage(path.split('/').pop()):await readFile(file);res.setHeader('Content-Type',({'.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp'})[extname(file)]);res.setHeader('Cache-Control',path.startsWith('/uploads/')?'public, max-age=31536000, immutable':'public, max-age=300');res.end(req.method==='HEAD'?undefined:data);return;}catch(e){if(e.code!=='ENOENT')throw e;}
 }
 const redirect=await db.prepare('SELECT target FROM redirects WHERE source=?').get(path);if(redirect){res.writeHead(301,{Location:redirect.target});res.end();return;}
 if(path!=='/'&&path.endsWith('/')){res.writeHead(301,{Location:path.slice(0,-1)+url.search});res.end();return;}
 let html;if(path==='/')html=home();else if(path==='/blog')html=blog();else{const p=pageBySlug(path.slice(1));if(isPublished(p))html=renderPage(p);}
 if(!html){res.statusCode=404;res.setHeader('X-Robots-Tag','noindex');html=notFound();}res.end(req.method==='HEAD'?undefined:html);
 }catch(e){const status=e.status||((e.code==='SQLITE_CONSTRAINT_UNIQUE'||admin)?400:500);res.statusCode=status;res.setHeader('Content-Type','text/html; charset=utf-8');res.end(admin?adminShell('İşlem tamamlanamadı',`<p class="notice" role="alert">${esc(status===500?'Beklenmeyen bir hata oluştu.':e.message)}</p><p>Tarayıcının geri düğmesiyle formunuza dönüp bilgileri düzeltebilirsiniz.</p><a href="/admin">Yönetime dön</a>`,s):'<h1>İstek işlenemedi</h1><p>'+esc(status===500?'Beklenmeyen bir hata oluştu.':e.message)+'</p>');if(status===500)console.error('Request failure:',e.message);}
}
export async function handleRequest(req,res){try{return await withData(()=>processRequest(req,res));}catch(e){console.error('Database request failure',e.code||'unknown');if(!res.headersSent){res.writeHead(503,{'Content-Type':'text/plain; charset=utf-8','Retry-After':'30'});res.end('Hizmet kısa süreliğine kullanılamıyor. Lütfen tekrar deneyin.');}else res.end();}}
export function createServer(){const server=http.createServer(handleRequest);server.requestTimeout=30000;server.headersTimeout=15000;server.maxHeadersCount=60;return server;}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){if(process.env.NODE_ENV==='production'&&!/^https:\/\//.test(process.env.APP_ORIGIN||''))throw Error('Üretimde APP_ORIGIN HTTPS olarak tanımlanmalı.');const port=Number(process.env.PORT||4173),host=process.env.HOST||'127.0.0.1';createServer().listen(port,host,()=>console.log(`Local: http://${host}:${port}\nAdmin: http://${host}:${port}/admin`));}
