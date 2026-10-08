import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../dist'),port=Number(process.env.PORT||5188),address=`http://localhost:${port}/`;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/manifest+json','.txt':'text/plain; charset=utf-8'};
const csp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'";
function openBrowser(){if(!process.argv.includes('--open'))return;const child=process.platform==='win32'?spawn('cmd.exe',['/c','start','',address],{windowsHide:true}):spawn(process.platform==='darwin'?'open':'xdg-open',[address]);child.on('error',()=>console.log(`请在浏览器打开 ${address}`));}
const server=http.createServer(async(req,res)=>{
  try{
    if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
    const pathname=decodeURIComponent(new URL(req.url,address).pathname),file=path.resolve(root,`.${pathname==='/'?'/index.html':pathname}`);
    if(!file.startsWith(`${root}${path.sep}`)){res.writeHead(403);res.end();return;}
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':file.endsWith('sw.js')||file.endsWith('index.html')?'no-cache':'public, max-age=3600','Content-Security-Policy':csp,'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Permissions-Policy':'camera=(), microphone=(), geolocation=()'});
    res.end(req.method==='HEAD'?undefined:body);
  }catch(error){res.writeHead(error?.code==='ENOENT'?404:400,{'Content-Type':'text/plain; charset=utf-8'});res.end('资源无法读取，请检查构建是否完成。');}
});
server.on('error',async error=>{if(error.code==='EADDRINUSE'){try{const result=await fetch(`${address}manifest.webmanifest`);if(result.ok&&(await result.json()).name==='划船机'){console.log(`划船机预览已运行：${address}`);openBrowser();return;}}catch{console.error('已占用端口未响应，请关闭原预览窗口后重试。');}}console.error(`预览未启动：${error.code}，端口 ${port}。`);process.exitCode=1;});
server.listen(port,'127.0.0.1',()=>{console.log(`划船机本地预览：${address}\n按 Ctrl+C 停止。数据保存在该浏览器中。`);openBrowser();});
