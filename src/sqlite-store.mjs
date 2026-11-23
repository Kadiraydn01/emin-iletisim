import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {initialPages,homeDefaults} from './seed.mjs';
export const dataDir=resolve(process.env.DATA_DIR||'data');
mkdirSync(dataDir,{recursive:true});
mkdirSync(resolve(dataDir,'uploads'),{recursive:true});
export const db=new DatabaseSync(resolve(dataDir,'site.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pages(id INTEGER PRIMARY KEY,slug TEXT NOT NULL UNIQUE,type TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,alt TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS redirects(source TEXT PRIMARY KEY,target TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);
PRAGMA user_version=1;`);
export const getSetting=(key)=>{const row=db.prepare('SELECT value FROM settings WHERE key=?').get(key);return row?JSON.parse(row.value):null;};
export const setSetting=(key,value)=>db.prepare('INSERT INTO settings VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').run(key,JSON.stringify(value));
if(!getSetting('business')){
 const c=JSON.parse(readFileSync(new URL('../site.config.json',import.meta.url),'utf8'));
 db.exec('BEGIN');
 try{
 setSetting('business',{...c,social:[],googleVerification:'',bingVerification:''});setSetting('home',homeDefaults);
 setSetting('menu',[{label:'Hizmetler',url:'/#hizmetler'},{label:'İkinci el',url:'/corlu-ikinci-el-telefon'},{label:'Hakkımızda',url:'/hakkimizda'},{label:'Rehber',url:'/blog'},{label:'İletişim',url:'/iletisim'}]);
 for(const p of initialPages())db.prepare('INSERT INTO pages(slug,type,data) VALUES(?,?,?)').run(p.slug,p.type,JSON.stringify(p));
 for(const [old,next] of [['telefon-tamiri','telefon-tamiri'],['ekran-degisimi','telefon-ekran-degisimi'],['ikinci-el-telefon','ikinci-el-telefon']])db.prepare('INSERT INTO redirects VALUES(?,?)').run('/hizmetler/'+old,'/corlu-'+next);
 db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}
}
const decode=r=>r?{...JSON.parse(r.data),id:r.id}:null;
export const allPages=()=>db.prepare('SELECT * FROM pages ORDER BY id').all().map(decode);
export const pageById=id=>decode(db.prepare('SELECT * FROM pages WHERE id=?').get(Number(id)));
export const pageBySlug=slug=>decode(db.prepare('SELECT * FROM pages WHERE slug=?').get(slug));
export const isPublished=p=>p&&p.status==='published'&&Date.parse(p.publishedAt)<=Date.now();
export const publishedPages=()=>allPages().filter(isPublished);
export function savePage(p){
 db.exec('BEGIN');try{
 if(p.id){const old=pageById(p.id);if(!old)throw Error('Sayfa bulunamadı.');
 db.prepare('UPDATE pages SET slug=?,type=?,data=? WHERE id=?').run(p.slug,p.type,JSON.stringify(p),p.id);
 if(old.slug!==p.slug){db.prepare('DELETE FROM redirects WHERE source=?').run('/'+p.slug);db.prepare('UPDATE redirects SET target=? WHERE target=?').run('/'+p.slug,'/'+old.slug);db.prepare('INSERT INTO redirects VALUES(?,?) ON CONFLICT(source) DO UPDATE SET target=excluded.target').run('/'+old.slug,'/'+p.slug);}
 }else{p.id=Number(db.prepare('INSERT INTO pages(slug,type,data) VALUES(?,?,?)').run(p.slug,p.type,JSON.stringify(p)).lastInsertRowid);db.prepare('DELETE FROM redirects WHERE source=?').run('/'+p.slug);}
 db.exec('COMMIT');return p.id;
 }catch(e){db.exec('ROLLBACK');throw e;}
}
export function deletePage(id){const p=pageById(id);if(!p)return;db.exec('BEGIN');try{db.prepare('DELETE FROM pages WHERE id=?').run(id);db.prepare('DELETE FROM redirects WHERE target=?').run('/'+p.slug);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}}
