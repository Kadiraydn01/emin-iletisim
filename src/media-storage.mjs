import {readFile,writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {dataDir,cloud} from './db.mjs';
export const uploadLimit=cloud?3*1024*1024:8*1024*1024;
export async function writeImage(name,buffer){
 if(cloud){const {put}=await import('@vercel/blob');await put('media/'+name,buffer,{access:'public',addRandomSuffix:false,contentType:'image/webp',cacheControlMaxAge:31536000});}
 else await writeFile(resolve(dataDir,'uploads',name),buffer);
}
export async function readImage(name){
 if(!cloud)return readFile(resolve(dataDir,'uploads',name));
 const {get}=await import('@vercel/blob');const result=await get('media/'+name,{access:'public'});
 if(!result||result.statusCode!==200){const e=new Error('Görsel bulunamadı.');e.code='ENOENT';throw e;}
 return Buffer.from(await new Response(result.stream).arrayBuffer());
}
