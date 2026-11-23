import {handleRequest} from '../src/server.mjs';
export const config={api:{bodyParser:false}};
export default async function handler(req,res){
 const url=new URL(req.url,'https://emin-iletisim.vercel.app');
 // Vercel routing passes the original public path explicitly.
 const route=url.searchParams.get('__path');
 if(route){url.searchParams.delete('__path');req.url=route+(url.searchParams.size?'?'+url.searchParams:'');}
 await handleRequest(req,res);
}
