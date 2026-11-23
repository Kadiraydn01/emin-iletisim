import {createInterface} from 'node:readline/promises';
import {stdin,stdout} from 'node:process';
import {db} from '../src/db.mjs';
import {hashPassword} from '../src/security.mjs';
if(!stdin.isTTY){console.error('Bu komutu etkileşimli terminalde çalıştırın.');process.exit(1);}
const rl=createInterface({input:stdin,output:stdout});const username=(await rl.question('Yönetici kullanıcı adı: ')).trim();rl.close();
if(!/^[a-zA-Z0-9_.-]{3,40}$/.test(username))throw Error('Kullanıcı adı 3–40 harf, rakam, nokta, tire veya alt çizgi olmalı.');
function secret(prompt){stdout.write(prompt);stdin.setRawMode(true);stdin.resume();return new Promise((resolve,reject)=>{let value='';const listen=chunk=>{for(const c of chunk.toString()){if(c==='\u0003'){cleanup();reject(Error('İptal edildi.'));return;}if(c==='\r'||c==='\n'){cleanup();resolve(value);return;}if(c==='\u007f'||c==='\b'){value=value.slice(0,-1);continue;}if(c>=' ')value+=c;}};function cleanup(){stdin.off('data',listen);stdin.setRawMode(false);stdin.pause();stdout.write('\n');}stdin.on('data',listen);});}
const password=await secret('Parola (en az 12 karakter, görünmez): ');const repeat=await secret('Parola tekrar: ');if(password!==repeat)throw Error('Parolalar eşleşmiyor.');
if(await db.prepare('SELECT id FROM users WHERE username=?').get(username))throw Error('Kullanıcı zaten var. Parola değişikliği için yönetim panelini kullanın.');
await db.prepare('INSERT INTO users(username,password) VALUES(?,?)').run(username,await hashPassword(password));console.log('Yönetici oluşturuldu. /admin adresinden giriş yapabilirsiniz.');await db.close();
