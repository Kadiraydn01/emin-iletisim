import {readFile,writeFile,readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {randomBytes} from 'node:crypto';
import {db,cloud,withData,getSetting,setSetting} from '../src/db.mjs';
import {hashPassword} from '../src/security.mjs';
import {writeImage} from '../src/media-storage.mjs';
if(!cloud)throw Error('DATABASE_URL gerekli; bu komut yalnızca açıkça seçilen bulut veritabanını hazırlar.');
await db.exec(`CREATE TABLE IF NOT EXISTS settings(key TEXT PRIMARY KEY,value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS pages(id SERIAL PRIMARY KEY,slug TEXT NOT NULL UNIQUE,type TEXT NOT NULL,data TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS users(id SERIAL PRIMARY KEY,username TEXT NOT NULL UNIQUE,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'admin');
CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,csrf TEXT NOT NULL,expires BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS media(id TEXT PRIMARY KEY,alt TEXT NOT NULL,width INTEGER NOT NULL,height INTEGER NOT NULL,created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS redirects(source TEXT PRIMARY KEY,target TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS login_attempts(ip TEXT PRIMARY KEY,count INTEGER NOT NULL,until BIGINT NOT NULL);`);
await withData(async()=>{
 if(getSetting('business')){console.log('Bulut veritabanı zaten hazırlanmış; mevcut içerikler korunuyor.');return;}
 const local=await import('../src/sqlite-store.mjs');
 await db.exec('BEGIN');
 try{
 for(const row of local.db.prepare('SELECT * FROM settings').all())await setSetting(row.key,JSON.parse(row.value));
 const business={...local.getSetting('business'),url:process.env.APP_ORIGIN||'https://emin-iletisim.vercel.app',indexable:true};await setSetting('business',business);
 for(const p of local.db.prepare('SELECT * FROM pages').all())await db.prepare('INSERT INTO pages(id,slug,type,data) VALUES(?,?,?,?)').run(p.id,p.slug,p.type,p.data);
 for(const m of local.db.prepare('SELECT * FROM media').all())await db.prepare('INSERT INTO media VALUES(?,?,?,?,?)').run(m.id,m.alt,m.width,m.height,m.created_at);
 for(const r of local.db.prepare('SELECT * FROM redirects').all())await db.prepare('INSERT INTO redirects VALUES(?,?)').run(r.source,r.target);
 const users=local.db.prepare('SELECT * FROM users').all();
 for(const u of users)await db.prepare('INSERT INTO users(id,username,password,role) VALUES(?,?,?,?)').run(u.id,u.username,u.password,u.role);
 if(!users.length){
 const password=randomBytes(24).toString('base64url');
 await db.prepare('INSERT INTO users(username,password) VALUES(?,?)').run('emin-admin',await hashPassword(password));
 await writeFile(resolve('data','canli-yonetici.txt'),JSON.stringify({url:business.url+'/admin',username:'emin-admin',password,note:'Bu dosya özeldir ve siteye yüklenmez. İlk girişten sonra Hesabım ekranından parolanızı değiştirebilirsiniz.'},null,2),{mode:0o600});
 }
 for(const name of await readdir(resolve(local.dataDir,'uploads')))if(/^[a-f0-9]{24}(?:-small)?\.webp$/.test(name))await writeImage(name,await readFile(resolve(local.dataDir,'uploads',name)));
 await db.exec("SELECT setval(pg_get_serial_sequence('pages','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM pages),1)); SELECT setval(pg_get_serial_sequence('users','id'), GREATEST((SELECT COALESCE(MAX(id),1) FROM users),1));");
 await db.exec('COMMIT');console.log('İçerikler buluta taşındı. Yönetici bilgileri yalnızca data/canli-yonetici.txt dosyasında.');
 }catch(e){await db.exec('ROLLBACK');throw e;}finally{local.db.close();}
});
await db.close();
