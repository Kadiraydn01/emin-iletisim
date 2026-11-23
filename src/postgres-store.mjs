import pg from 'pg';
import {AsyncLocalStorage} from 'node:async_hooks';
pg.types.setTypeParser(20,Number);
const connection=new URL(process.env.DATABASE_URL);connection.searchParams.set('sslmode','verify-full');
const pool=new pg.Pool({connectionString:connection.href,max:5,idleTimeoutMillis:10000,connectionTimeoutMillis:10000,allowExitOnIdle:true});
pool.on('error',()=>console.error('Database connection error'));
const context=new AsyncLocalStorage();
const executor=()=>context.getStore()?.client||pool;
const placeholders=sql=>{let n=0;return sql.replace(/\?/g,()=>'$'+(++n));};
export const dataDir=null;
export const db={
 prepare(sql){const converted=placeholders(sql);return {
  async all(...params){return (await executor().query(converted,params)).rows;},
  async get(...params){return (await executor().query(converted,params)).rows[0];},
  async run(...params){const returning=/^INSERT INTO (pages|users)\b/i.test(converted)&&!(/RETURNING/i.test(converted));const r=await executor().query(converted+(returning?' RETURNING id':''),params);return {changes:r.rowCount,lastInsertRowid:r.rows[0]?.id};}
 };},
 async exec(sql){const ctx=context.getStore();await executor().query(sql);if(ctx&&sql==='BEGIN')ctx.inTransaction=true;if(ctx&&['COMMIT','ROLLBACK'].includes(sql))ctx.inTransaction=false;},
 async close(){await pool.end();}
};
export async function withData(fn){
 const client=await pool.connect();const ctx={client,inTransaction:false,settings:new Map(),pages:[],media:new Map()};
 try{return await context.run(ctx,async()=>{const rows=await client.query('SELECT * FROM settings; SELECT * FROM pages ORDER BY id; SELECT * FROM media');
 ctx.settings=new Map(rows[0].rows.map(r=>[r.key,JSON.parse(r.value)]));ctx.pages=rows[1].rows.map(decode);ctx.media=new Map(rows[2].rows.map(r=>[r.id,r]));return await fn();});}
 finally{if(ctx.inTransaction)await client.query('ROLLBACK');client.release();}
}
const state=()=>{const s=context.getStore();if(!s)throw Error('Database request scope missing');return s;};
const decode=r=>({...JSON.parse(r.data),id:r.id});
export const getSetting=key=>state().settings.get(key)||null;
export async function setSetting(key,value){await db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));context.getStore()?.settings.set(key,value);}
export const allPages=()=>state().pages;
export const pageById=id=>allPages().find(p=>p.id===Number(id))||null;
export const pageBySlug=slug=>allPages().find(p=>p.slug===slug)||null;
export const isPublished=p=>p&&p.status==='published'&&Date.parse(p.publishedAt)<=Date.now();
export const publishedPages=()=>allPages().filter(isPublished);
export const mediaById=id=>state().media.get(id);
export async function savePage(p){await db.exec('BEGIN');try{
 if(p.id){const old=pageById(p.id);if(!old)throw Error('Sayfa bulunamadı.');await db.prepare('UPDATE pages SET slug=?,type=?,data=? WHERE id=?').run(p.slug,p.type,JSON.stringify(p),p.id);
 if(old.slug!==p.slug){await db.prepare('DELETE FROM redirects WHERE source=?').run('/'+p.slug);await db.prepare('UPDATE redirects SET target=? WHERE target=?').run('/'+p.slug,'/'+old.slug);await db.prepare('INSERT INTO redirects VALUES(?,?) ON CONFLICT(source) DO UPDATE SET target=excluded.target').run('/'+old.slug,'/'+p.slug);}
 }else{p.id=Number((await db.prepare('INSERT INTO pages(slug,type,data) VALUES(?,?,?)').run(p.slug,p.type,JSON.stringify(p))).lastInsertRowid);await db.prepare('DELETE FROM redirects WHERE source=?').run('/'+p.slug);}
 await db.exec('COMMIT');state().pages=[...allPages().filter(x=>x.id!==p.id),p].sort((a,b)=>a.id-b.id);return p.id;
 }catch(e){await db.exec('ROLLBACK');throw e;}}
export async function deletePage(id){const p=pageById(id);if(!p)return;await db.exec('BEGIN');try{await db.prepare('DELETE FROM pages WHERE id=?').run(id);await db.prepare('DELETE FROM redirects WHERE target=?').run('/'+p.slug);await db.exec('COMMIT');state().pages=allPages().filter(p=>p.id!==id);}catch(e){await db.exec('ROLLBACK');throw e;}}
