import {backup} from 'node:sqlite';
import {mkdir,cp,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {db,dataDir,cloud,withData} from '../src/db.mjs';
import {readImage} from '../src/media-storage.mjs';
const target=resolve(process.env.BACKUP_DIR||'backups',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(target,{recursive:true});
if(cloud){
 const snapshot={version:1,createdAt:new Date().toISOString(),tables:{}};
 await withData(async()=>{await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');try{for(const name of ['settings','pages','users','media','redirects'])snapshot.tables[name]=await db.prepare('SELECT * FROM '+name).all();await db.exec('COMMIT');}catch(e){await db.exec('ROLLBACK');throw e;}});
 await writeFile(resolve(target,'postgres.json'),JSON.stringify(snapshot),{mode:0o600});await mkdir(resolve(target,'uploads'));
 for(const m of snapshot.tables.media)for(const suffix of ['','-small'])await writeFile(resolve(target,'uploads',m.id+suffix+'.webp'),await readImage(m.id+suffix+'.webp'));
 await writeFile(resolve(target,'README.txt'),'Neon tablo yedeği: postgres.json. Oturum ve rate-limit kayıtları bilerek dışarıda bırakılmıştır. Görseller uploads içinde. Yedek parola hashleri içerir, özel saklayın. Geri yükleme önce ayrı bir Neon veritabanında doğrulanmalıdır.\n');
}else{
 await backup(db,resolve(target,'site.sqlite'));await cp(resolve(dataDir,'uploads'),resolve(target,'uploads'),{recursive:true});await writeFile(resolve(target,'README.txt'),'Geri yükleme: sunucuyu durdurun. Mevcut data dizinini koruyun. site.sqlite ve uploads öğelerini yeni data dizinine kopyalayın. Eski WAL/SHM dosyalarını taşımayın. Yedek parola hashleri içerir; özel saklayın.\n');
}
console.log('Yedek hazır: '+target);await db.close();
