import assert from 'node:assert/strict';
import {home,renderPage,blog} from '../src/render.mjs';
import {publishedPages,db} from '../src/db.mjs';
const pages=publishedPages(),paths=new Set(['/', '/blog',...pages.map(p=>'/'+p.slug)]);let links=0;
for(const html of [home(),blog(),...pages.map(renderPage)])for(const [,ref] of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)){if(ref.startsWith('/uploads/')||['/style.css','/favicon.svg'].includes(ref))continue;assert(paths.has(ref),'Kırık iç bağlantı: '+ref);links++;}
console.log(`PASS: ${pages.length+2} sayfa, ${links} iç bağlantı.`);db.close();
