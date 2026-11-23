import {test,after,before} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,stat,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import sharp from 'sharp';
process.env.DATA_DIR=await mkdtemp(resolve(tmpdir(),'emin-tests-'));
process.env.BACKUP_DIR=resolve(process.env.DATA_DIR,'backups');
const {db,allPages,getSetting,setSetting,pageById}=await import('../src/db.mjs');
const {hashPassword,verifyPassword}=await import('../src/security.mjs');
const {createServer}=await import('../src/server.mjs');
const {markdown}=await import('../src/render.mjs');
const server=createServer();let base,cookie='',csrf='';
const password='test-only-very-long-password';
const request=(path,options={})=>fetch(base+path,{redirect:'manual',...options,headers:{Cookie:cookie,...options.headers}});
async function post(path,data,headers={}){return request(path,{method:'POST',headers:{Origin:base,...headers},body:new URLSearchParams({csrf,...data})});}
async function login(pass=password){const get=await request('/admin/login');const text=await get.text();const loginCookie=get.headers.get('set-cookie').split(';')[0];const t=text.match(/name="csrf" value="([^"]+)"/)[1];return request('/admin/login',{method:'POST',headers:{Origin:base,Cookie:loginCookie},body:new URLSearchParams({username:'testadmin',password:pass,csrf:t})});}
const content=(overrides={})=>({type:'post',slug:'blog/test-yazi',title:'Test yazısı',seoTitle:'Test yazısı SEO',description:'Test açıklaması',excerpt:'Test özet',content:'## Başlık\n\nYararlı içerik. [Telefon tamiri](/corlu-telefon-tamiri)',status:'draft',schema:'on',faqs:'[{"q":"Soru?","a":"Yanıt."}]',related:'["corlu-telefon-tamiri"]',...overrides});
before(async()=>{db.prepare('INSERT INTO users(username,password) VALUES(?,?)').run('testadmin',await hashPassword(password));await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;process.env.APP_ORIGIN=base;});
after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));db.close();});

test('public SSR: 16 pages, unique titles, H1, contacts and real 404',async()=>{
 const titles=new Set();for(const p of ['/', '/blog',...allPages().map(p=>'/'+p.slug)]){const res=await request(p);assert.equal(res.status,200,p);const html=await res.text();assert.equal((html.match(/<h1[ >]/g)||[]).length,1,p);assert.match(html,/905315779797/);assert.match(html,/Boyacılar Sokak 3A/);assert.match(html,/noindex,follow/);const title=html.match(/<title>([^<]+)/)[1];assert(!titles.has(title));titles.add(title);assert.match(res.headers.get('content-security-policy'),/frame-ancestors 'none'/);}
 assert.equal((await request('/yok')).status,404);assert.equal((await request('/data/site.sqlite')).status,404);assert.equal((await request('/uploads/../../site.config.json')).status,404);
 assert.equal((await request('/%2f%2fevil.example/')).status,400);
 const old=await request('/hizmetler/telefon-tamiri');assert.equal(old.status,301);assert.equal(old.headers.get('location'),'/corlu-telefon-tamiri');
});
test('anonymous admin and forged login are rejected',async()=>{
 assert.equal((await request('/admin')).status,303);
 assert.equal((await post('/admin/login',{username:'testadmin',password})).status,403);
 assert.equal((await request('/admin/login')).headers.get('x-robots-tag'),'noindex, nofollow');
});
test('login, admin screens and CSRF protection',async()=>{
 const res=await login();assert.equal(res.status,303);cookie=res.headers.get('set-cookie').split(';')[0];assert.match(res.headers.get('set-cookie'),/HttpOnly/);assert.match(res.headers.get('set-cookie'),/SameSite=Strict/);
 const text=await (await request('/admin')).text();csrf=text.match(/name="csrf" value="([^"]+)"/)[1];
 for(const path of ['/admin','/admin/edit','/admin/settings','/admin/media','/admin/seo','/admin/redirects','/admin/account'])assert.equal((await request(path)).status,200,path);
 assert.equal((await post('/admin/save',content({csrf:'bad'}))).status,403);
 assert.equal((await post('/admin/save',content(),{Origin:'https://evil.example'})).status,403);
});
let created;
test('draft CRUD, publication, escaping, slug redirects and persistence',async()=>{
 let res=await post('/admin/save',content());assert.equal(res.status,303);created=Number(res.headers.get('location').match(/id=(\d+)/)[1]);
 assert.equal((await request('/blog/test-yazi')).status,404);
 res=await post('/admin/save',content({id:created,status:'published',content:'## Başlık\n\n<script>alert(1)</script> [Kötü](javascript:alert)'}));assert.equal(res.status,303);
 let html=await (await request('/blog/test-yazi')).text();assert(!html.includes('<script>alert'));assert(!html.includes('href="javascript:'));assert.match(html,/&lt;script&gt;/);
 res=await post('/admin/save',content({id:created,status:'published',slug:'blog/yeni-yazi'}));assert.equal(res.status,303);
 res=await request('/blog/test-yazi');assert.equal(res.status,301);assert.equal(res.headers.get('location'),'/blog/yeni-yazi');
 res=await post('/admin/save',content({id:created,status:'published',slug:'blog/son-yazi'}));assert.equal(res.status,303);assert.equal((await request('/blog/test-yazi')).headers.get('location'),'/blog/son-yazi');
 const child=spawnSync(process.execPath,['--input-type=module','-e',"import {db,pageById} from './src/db.mjs'; console.log(pageById("+created+").slug); db.close();"],{encoding:'utf8',env:process.env});assert.equal(child.status,0);assert.match(child.stdout,/blog\/son-yazi/);
});
test('page validation blocks bad slugs, duplicate paths and unsafe canonical',async()=>{
 for(const changes of [{slug:'admin',type:'page'},{slug:'../escape'},{slug:'blog/son-yazi'},{canonical:'javascript:alert(1)'},{image:'not-real'},{faqs:'broken'}])assert.equal((await post('/admin/save',content(changes))).status,400,JSON.stringify(changes));
});
test('core slugs are stable and Istanbul publication input converts correctly',async()=>{
 const {pageInput}=await import('../src/validation.mjs');assert.equal(pageInput(content({publishedAt:'2026-11-23T10:30'})).publishedAt,'2026-11-23T07:30:00.000Z');const core=allPages().find(p=>p.slug==='iletisim');assert.equal((await post('/admin/save',content({id:core.id,type:'page',slug:'yeni-iletisim'}))).status,400);
});
test('scheduled and noindex content stay out of sitemap; metadata/schema render',async()=>{
 const c=getSetting('business');setSetting('business',{...c,url:'https://example.com',indexable:true});
 await post('/admin/save',content({id:created,slug:'blog/son-yazi',status:'published'}));
 let xml=await (await request('/sitemap.xml')).text();assert.match(xml,/https:\/\/example.com\/blog\/son-yazi/);
 let html=await (await request('/blog/son-yazi')).text();assert.match(html,/<link rel="canonical" href="https:\/\/example.com\/blog\/son-yazi"/);assert.match(html,/index,follow/);
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert(schema['@graph'].some(x=>x['@type']==='Article'));assert(schema['@graph'].some(x=>x['@type']==='BreadcrumbList'));
 await post('/admin/save',content({id:created,slug:'blog/son-yazi',status:'published',noindex:'on'}));assert(!(await (await request('/sitemap.xml')).text()).includes('/blog/son-yazi'));
 await post('/admin/save',content({id:created,slug:'blog/son-yazi',status:'published',publishedAt:'2099-01-01T00:00:00Z'}));assert.equal((await request('/blog/son-yazi')).status,404);
 await post('/admin/save',content({id:created,slug:'blog/son-yazi',status:'published',canonical:'https://example.com/different'}));assert(!(await (await request('/sitemap.xml')).text()).includes('/blog/son-yazi'));
});
let media;
test('image upload decodes/re-encodes, serves responsive WebP and rejects SVG',async()=>{
 const image=await sharp({create:{width:800,height:600,channels:3,background:'#c6ac85'}}).png().toBuffer();
 let res=await request('/admin/upload',{method:'POST',headers:{Origin:base,'X-CSRF-Token':csrf,'X-Image-Alt':encodeURIComponent('Test fotoğrafı'),'Content-Type':'image/png'},body:image});assert.equal(res.status,200);media=(await res.json()).id;
 res=await request('/uploads/'+media+'.webp');assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/webp');assert.equal((await sharp(Buffer.from(await res.arrayBuffer())).metadata()).format,'webp');
 assert.equal((await request('/uploads/'+media+'-small.webp')).status,200);
 res=await request('/admin/upload',{method:'POST',headers:{Origin:base,'X-CSRF-Token':csrf,'X-Image-Alt':'test'},body:'<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"></svg>'});assert.equal(res.status,400);
 res=await request('/admin/upload',{method:'POST',headers:{Origin:base,'X-CSRF-Token':'bad','X-Image-Alt':'test'},body:image});assert.equal(res.status,403);
});
test('settings update is transactional and changes public home/menu/contacts',async()=>{
 const c=getSetting('business'),h=getSetting('home');
 const data={...c,social:'https://example.com/social',homeTitle:'Yeni ana başlık',homeIntro:h.intro,homeSeoTitle:h.seoTitle,homeDescription:h.description,homeFaqs:JSON.stringify(h.faqs),image:media,homeImageAlt:'Test görseli',menu:'[{"label":"Rehber","url":"/blog"}]',indexable:'on'};
 assert.equal((await post('/admin/settings',{...data,menu:'bad'})).status,400);assert.notEqual(getSetting('home').title,'Yeni ana başlık');
 assert.equal((await post('/admin/settings',data)).status,303);const html=await (await request('/')).text();assert.match(html,/Yeni ana başlık/);assert.match(html,/srcset=/);assert.match(html,/Test görseli/);
});
test('redirect management avoids live source and offsite targets',async()=>{
 assert.equal((await post('/admin/redirects',{source:'/old',target:'/corlu-telefon-tamiri'})).status,303);assert.equal((await request('/old')).status,301);
 assert.equal((await post('/admin/redirects',{source:'/corlu-telefon-tamiri',target:'/'})).status,400);
 assert.equal((await post('/admin/redirects',{source:'/evil',target:'https://evil.example'})).status,400);
 assert.equal((await post('/admin/redirects/delete',{source:'/old'})).status,303);assert.equal((await request('/old')).status,404);
});
test('delete requires explicit confirmation and removes content',async()=>{
 assert.equal((await post('/admin/delete',{id:created})).status,400);
 assert.equal((await post('/admin/delete',{id:created,confirm:'on'})).status,303);assert.equal(pageById(created),null);assert.equal((await request('/blog/son-yazi')).status,404);
});
test('password change revokes session, persists hash and logout revokes new session',async()=>{
 const newPass='new-test-password-for-admin';assert.equal((await post('/admin/account',{current:password,password:newPass,repeat:newPass})).status,303);assert.equal((await request('/admin')).status,303);
 const user=db.prepare('SELECT * FROM users WHERE username=?').get('testadmin');assert(!user.password.includes(newPass));assert(await verifyPassword(newPass,user.password));
 let res=await login(newPass);assert.equal(res.status,303);cookie=res.headers.get('set-cookie').split(';')[0];csrf=(await (await request('/admin')).text()).match(/name="csrf" value="([^"]+)"/)[1];
 assert.equal((await post('/admin/logout',{})).status,303);assert.equal((await request('/admin')).status,303);
});
test('rate limit blocks sixth failed login',async()=>{cookie='';for(let i=0;i<5;i++)assert.equal((await login('wrong')).status,401);assert.equal((await login('wrong')).status,429);});
test('markdown never executes raw HTML or unsafe link protocols',()=>{assert(!markdown('<img src=x onerror=alert(1)>').includes('<img'));assert(!markdown('[x](javascript:alert)').includes('href='));assert(!markdown('[x](//evil.test)').includes('href='));});
test('backup is readable and includes original media',async()=>{
 if(!media){media='a'.repeat(24);await writeFile(resolve(process.env.DATA_DIR,'uploads',media+'.webp'),await sharp({create:{width:10,height:10,channels:3,background:'#fff'}}).webp().toBuffer());}
 const child=spawnSync(process.execPath,['scripts/backup.mjs'],{encoding:'utf8',env:process.env});assert.equal(child.status,0,child.stderr);const target=child.stdout.trim().replace('Yedek hazır: ','');assert((await stat(resolve(target,'site.sqlite'))).size>0);assert((await stat(resolve(target,'uploads',media+'.webp'))).size>0);const read=spawnSync(process.execPath,['--input-type=module','-e',"import {DatabaseSync} from 'node:sqlite'; const db=new DatabaseSync(process.argv[1]); console.log(db.prepare('PRAGMA integrity_check').get().integrity_check); db.close();",resolve(target,'site.sqlite')],{encoding:'utf8'});assert.match(read.stdout,/ok/);
});

