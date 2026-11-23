import {createServer} from '../src/server.mjs';
createServer().listen(4173,'127.0.0.1',()=>console.log('Local: http://127.0.0.1:4173'));
