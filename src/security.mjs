import {randomBytes,scrypt as scryptCb,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {db} from './db.mjs';
const scrypt=promisify(scryptCb);
export const token=()=>randomBytes(32).toString('hex');
const digest=s=>createHash('sha256').update(s).digest('hex');
export async function hashPassword(password){if(password.length<12||password.length>256)throw Error('Parola 12–256 karakter olmalı.');const salt=token();const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return salt+':'+hash.toString('hex');}
export async function verifyPassword(password,stored){if(typeof password!=='string'||password.length>256)return false;const [salt,hash]=stored.split(':');const out=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return timingSafeEqual(Buffer.from(hash,'hex'),out);}
export const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')));
export async function session(req){const raw=cookies(req).emin_session;if(!raw||!/^\w{64}$/.test(raw))return null;return (await db.prepare('SELECT sessions.*,users.username,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(digest(raw),Date.now()))||null;}
export async function createSession(userId){await db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());const raw=token(),csrf=token();await db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(raw),userId,csrf,Date.now()+8*60*60*1000);return raw;}
export async function endSession(req){const raw=cookies(req).emin_session;if(raw)await db.prepare('DELETE FROM sessions WHERE token=?').run(digest(raw));}
export function cookie(name,value,maxAge=28800){return `${name}=${value}; Path=/admin; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;}
export async function checkAttempt(ip){const now=Date.now();await db.prepare('DELETE FROM login_attempts WHERE until<?').run(now);const r=await db.prepare('INSERT INTO login_attempts VALUES(?,1,?) ON CONFLICT(ip) DO UPDATE SET count=login_attempts.count+1 RETURNING count').get(digest(ip),now+15*60*1000);return r.count<=5;}
export async function failedAttempt(ip){await db.prepare('INSERT INTO login_attempts VALUES(?,1,?) ON CONFLICT(ip) DO UPDATE SET count=count+1').run(digest(ip),Date.now()+15*60*1000);}
export async function clearAttempts(ip){await db.prepare('DELETE FROM login_attempts WHERE ip=?').run(digest(ip));}
export function securityHeaders(res){res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');res.setHeader('X-Frame-Options','DENY');res.setHeader('Permissions-Policy','camera=(), microphone=(), geolocation=()');res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");if(process.env.NODE_ENV==='production')res.setHeader('Strict-Transport-Security','max-age=31536000');}
export function fail(status,message){const e=new Error(message);e.status=status;throw e;}
export async function readBody(req,limit=256*1024){let size=0;const parts=[];for await(const part of req){size+=part.length;if(size>limit)fail(413,'İstek boyutu sınırı aşıldı.');parts.push(part);}return Buffer.concat(parts);}
export const formBody=async req=>Object.fromEntries(new URLSearchParams((await readBody(req)).toString('utf8')));
export function verifyOrigin(req){const expected=process.env.APP_ORIGIN||`http://127.0.0.1:${process.env.PORT||4173}`;if(req.headers.origin!==expected)fail(403,'İstek kaynağı doğrulanamadı. Sayfayı uygulamanın adresinden açın.');}
export function verifyCsrf(value,expected){if(typeof value!=='string'||typeof expected!=='string'||!/[a-f0-9]{64}/.test(value)||Buffer.byteLength(value)!==Buffer.byteLength(expected)||!timingSafeEqual(Buffer.from(value),Buffer.from(expected)))fail(403,'Oturum doğrulaması başarısız. Sayfayı yenileyin.');}
