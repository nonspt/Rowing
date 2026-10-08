import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),dist=path.join(root,'dist');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item=>item.isDirectory()?walk(path.join(dir,item.name)):[path.join(dir,item.name)]);}
const files=walk(dist).filter(file=>!file.endsWith('sw.js')&&!file.endsWith('_headers')).map(file=>path.relative(dist,file).replaceAll('\\','/'));
const source=fs.readFileSync(path.join(root,'public/sw.js'),'utf8');
const hash=crypto.createHash('sha256');for(const file of files)hash.update(fs.readFileSync(path.join(dist,file)));hash.update(source);hash.update(fs.readFileSync(fileURLToPath(import.meta.url)));const build=hash.digest('hex').slice(0,12);
// GitHub Pages does not apply _headers. Enforce the supported policy in built HTML.
const htmlCsp="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'";
const htmlPath=path.join(dist,'index.html');let html=fs.readFileSync(htmlPath,'utf8');html=html.replace('<head>',`<head><meta http-equiv="Content-Security-Policy" content="${htmlCsp}" /><meta name="referrer" content="no-referrer" />`);html=html.replace('</head>',`<meta name="home-rower-build" content="${build}" /></head>`);fs.writeFileSync(htmlPath,html);
fs.writeFileSync(path.join(dist,'sw.js'),source.replace('__BUILD__',JSON.stringify(build)).replace('__ASSETS__',JSON.stringify(files)));
const headers="/*\n  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'\n  Referrer-Policy: no-referrer\n  X-Content-Type-Options: nosniff\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n/sw.js\n  Cache-Control: no-cache\n/index.html\n  Cache-Control: no-cache\n";
fs.writeFileSync(path.join(dist,'_headers'),headers);
const assets=files.filter(file=>/\.(js|css)$/.test(file));const compressed=assets.reduce((sum,file)=>sum+gzipSync(fs.readFileSync(path.join(dist,file))).length,0);const total=files.reduce((sum,file)=>sum+fs.statSync(path.join(dist,file)).size,0);
if(compressed>250*1024||total>5*1024*1024)throw new Error('构建超出文档性能预算。');
console.log(JSON.stringify({build,precacheFiles:files.length,compressedJsCssKB:Math.round(compressed/1024*10)/10,offlineKB:Math.round(total/1024*10)/10}));
