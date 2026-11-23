// Explicit cloud integration check; creates and removes only its own draft/media records.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {randomBytes} from 'node:crypto';
import sharp from 'sharp';
import {del} from '@vercel/blob';
import {db,cloud,withData,publishedPages,deletePage,pageBySlug} from '../src/db.mjs';
import {createServer} from '../src/server.mjs';
if(!cloud)throw Error('DATABASE_URL gerekli.');
const credentials=JSON.parse(await readFile('data/canli-yonetici.txt','utf8'));
const server=process.env.CHECK_ORIGIN?null:createServer();if(server)await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.CHECK_ORIGIN||'http://127.0.0.1:'+server.address().port;process.env.APP_ORIGIN=base;
let cookie='',csrf='',media='',draftId=null;
const slug='blog/deploy-check-'+randomBytes(6).toString('hex');
const request=(path,options={})=>fetch(base+path,{redirect:'manual',...options,headers:{Cookie:cookie,...options.headers}});
const post=(path,data)=>request(path,{method:'POST',headers:{Origin:base},body:new URLSearchParams({csrf,...data})});
try{
 const pages=await withData(()=>publishedPages());
 for(const path of ['/', '/blog',...pages.map(p=>'/'+p.slug)]){const r=await request(path);assert.equal(r.status,200,path);const html=await r.text();assert.match(html,/application\/ld\+json/);assert.match(html,/index,follow/);}
 let r=await request('/admin/login');let html=await r.text();cookie=r.headers.get('set-cookie').split(';')[0];csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
 r=await post('/admin/login',{username:credentials.username,password:credentials.password});assert.equal(r.status,303);cookie=r.headers.get('set-cookie').split(';')[0];
 html=await (await request('/admin')).text();csrf=html.match(/name="csrf" value="([^"]+)"/)[1];
 for(const path of ['/admin/edit','/admin/media','/admin/settings','/admin/seo','/admin/redirects','/admin/account'])assert.equal((await request(path)).status,200,path);
 const input={type:'post',slug,title:'Deployment test',seoTitle:'Deployment test',description:'Temporary test',excerpt:'Temporary test',content:'## Temporary\n\nCloud persistence test.',status:'draft',schema:'on',related:'[]',faqs:'[]'};
 r=await post('/admin/save',input);assert.equal(r.status,303,await r.text());draftId=Number(r.headers.get('location').match(/id=(\d+)/)[1]);assert.equal((await request('/'+slug)).status,404);
 await withData(()=>assert.equal(pageBySlug(slug).id,draftId));
 r=await post('/admin/save',{...input,id:draftId,title:'Updated deployment test'});assert.equal(r.status,303);await withData(()=>assert.equal(pageBySlug(slug).title,'Updated deployment test'));
 const png=await sharp({create:{width:720,height:540,channels:3,background:'#eee'}}).png().toBuffer();
 r=await request('/admin/upload',{method:'POST',headers:{Origin:base,'X-CSRF-Token':csrf,'X-Image-Alt':'Deployment check','Content-Type':'image/png'},body:png});assert.equal(r.status,200,await r.clone().text());media=(await r.json()).id;
 for(const suffix of ['','-small']){r=await request('/uploads/'+media+suffix+'.webp');assert.equal(r.status,200);const metadata=await sharp(Buffer.from(await r.arrayBuffer())).metadata();assert.equal(metadata.format,'webp');}
 assert.equal((await request('/admin/media')).status,200);
 assert.equal((await post('/admin/save',{...input,csrf:'invalid'})).status,403);
 await post('/admin/logout',{});assert.equal((await request('/admin')).status,303);
 console.log('PASS: Neon SSR, admin login/screens, draft CRUD/persistence, CSRF, Blob upload/download, logout.');
}finally{
 if(draftId)await withData(()=>deletePage(draftId));
 if(media){await db.prepare('DELETE FROM media WHERE id=?').run(media);await del(['media/'+media+'.webp','media/'+media+'-small.webp']);}
 if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await db.close();
}
