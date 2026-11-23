import {safeUrl} from './render.mjs';
import {mediaById,pageById,pageBySlug} from './db.mjs';
export function required(value,label,max=500){const v=String(value||'').trim();if(!v||v.length>max)throw Error(`${label} zorunlu ve en fazla ${max} karakter olmalı.`);return v;}
export function parseList(value,label){try{const parsed=JSON.parse(value||'[]');if(!Array.isArray(parsed)||parsed.length>100)throw Error();return parsed;}catch{throw Error(`${label} geçerli bir JSON listesi olmalı.`);}}
export function faqs(value){return parseList(value,'SSS').map(x=>({q:required(x.q,'Soru',300),a:required(x.a,'Yanıt',2000)}));}
export function mediaId(value){if(!value)return '';if(!mediaById(value))throw Error('Görsel bulunamadı. Medya kütüphanesinden seçim yapın.');return value;}
export function pageInput(f){
 const old=f.id?pageById(f.id):null;if(f.id&&!old)throw Error('Sayfa bulunamadı.');
 const type=['service','page','post'].includes(f.type)?f.type:'page';
 const slug=required(f.slug,'URL',150).replace(/^\/+|\/+$/g,'');
 if(old&&['hakkimizda','iletisim','gizlilik'].includes(old.slug)&&slug!==old.slug)throw Error('Temel sayfaların URL’si sabittir; başlık ve içerikleri düzenleyebilirsiniz.');
 if(!/^(blog\/)?[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||['admin','blog','uploads','404','style','app','favicon','robots','sitemap'].includes(slug))throw Error('URL küçük İngilizce harf, rakam ve tire içermeli. Blog yazıları blog/ ile başlamalı.');
 if((type==='post')!==slug.startsWith('blog/'))throw Error('Blog URL’si blog/ ile başlamalı; diğer türlerde kullanılmamalı.');
 if(pageBySlug(slug)&&pageBySlug(slug).id!==old?.id)throw Error('Bu URL zaten kullanılıyor.');
 const canonical=String(f.canonical||'').trim();if(canonical&&(!safeUrl(canonical)||!canonical.startsWith('https://')||new URL(canonical).hash||new URL(canonical).username))throw Error('Canonical geçerli bir HTTPS adresi olmalı.');
 const dateInput=String(f.publishedAt||'');
 const publishedAt=dateInput?new Date(/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(dateInput)?dateInput+':00+03:00':dateInput).toISOString():new Date().toISOString();
 const image=mediaId(f.image),imageAlt=String(f.imageAlt||'').trim();if(image&&!imageAlt)throw Error('Görsel alt metni gerekli.');
 return {id:old?.id,type,slug,title:required(f.title,'Başlık',180),seoTitle:String(f.seoTitle||'').trim().slice(0,180),description:String(f.description||'').trim().slice(0,500),excerpt:required(f.excerpt,'Özet',1000),content:required(f.content,'İçerik',80000),category:String(f.category||'').slice(0,80),status:f.status==='published'?'published':'draft',noindex:f.noindex==='on',schema:f.schema==='on',canonical,image,imageAlt,publishedAt,updatedAt:new Date().toISOString(),faqs:faqs(f.faqs),related:parseList(f.related,'İlgili sayfalar').map(s=>required(s,'İlgili URL',150))};
}
