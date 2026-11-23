import {home,renderPage,blog,sitemap,robots} from '../src/render.mjs';
import {publishedPages,db,withData} from '../src/db.mjs';
import assert from 'node:assert/strict';
await withData(async()=>{
const documents=[home(),blog(),...publishedPages().map(renderPage)];
for(const html of documents){assert.equal((html.match(/<h1[ >]/g)||[]).length,1);assert.match(html,/<meta name="description" content="[^"]+"/);assert.match(html,/<html lang="tr"/);for(const [,json] of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);}
assert.match(sitemap(),/<urlset/);assert.match(robots(),/Disallow: \/admin/);console.log(`SSR doğrulandı: ${documents.length} sayfa.`);
});await db.close();
