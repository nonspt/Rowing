import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';

// Serve the production artifact under the Pages subpath without custom HTTP policies.
const root=path.resolve('dist'),base='/Rowing/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(!pathname.startsWith(base)){res.writeHead(404);res.end();return;}
    const relative=pathname.slice(base.length)||'index.html',file=path.resolve(root,relative);
    if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
    const body=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});res.end(body);
  }catch(error){if(error.code==='ENOENT'){res.writeHead(404);res.end();return;}console.error(error);res.writeHead(500);res.end();}
});
await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
const url=`http://localhost:${server.address().port}${base}`,errors=[];
let browser;
try{
  browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
  const context=await browser.newContext({viewport:{width:420,height:912},deviceScaleFactor:3,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  page.on('pageerror',error=>errors.push(error.message));
  page.on('response',response=>{if(response.status()>=400)errors.push(`${response.status()} ${response.url()}`);});
  await page.goto(url,{waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'训练计划',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  const manifestURL=new URL(await page.locator('link[rel=manifest]').getAttribute('href'),url);
  const manifest=await (await fetch(manifestURL)).json();
  assert.equal(new URL(manifest.scope,manifestURL).pathname,base);
  assert.equal(new URL(manifest.start_url,manifestURL).href,url+'#/plans');
  for(const icon of manifest.icons)assert.equal((await fetch(new URL(icon.src,manifestURL))).status,200);
  await page.evaluate(async()=>{await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const sw=await page.evaluate(async()=>{const r=await navigator.serviceWorker.ready;return {scope:r.scope,url:r.active.scriptURL};});
  assert.equal(sw.scope,url);assert.equal(sw.url,url+'sw.js');
  // An inline script must be blocked by the HTML policy even without a CSP header.
  const policy=await page.evaluate(()=>new Promise(resolve=>{
    document.addEventListener('securitypolicyviolation',e=>resolve({directive:e.effectiveDirective,executed:!!window.__pagesInlineProbe}),{once:true});
    const script=document.createElement('script');script.textContent='window.__pagesInlineProbe=true';document.head.append(script);
  }));
  assert.match(policy.directive,/script-src/);assert.equal(policy.executed,false);
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});
  await page.getByRole('heading',{name:'训练计划',exact:true}).waitFor();
  await page.getByRole('button',{name:'有氧计划',exact:true}).waitFor();
  assert.equal(await page.getByRole('navigation').count(),0);
  await context.setOffline(false);assert.deepEqual(errors,[]);
  await browser.close();browser=undefined;
  const code=await new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,['tests/iphone-air.mjs'],{env:{...process.env,APP_URL:url},stdio:'inherit'});
    child.once('error',reject);child.once('close',resolve);
  });
  assert.equal(code,0,'Pages 子目录下完整 iPhone Air 流程');
  await fs.mkdir('test-results',{recursive:true});
  await fs.writeFile('test-results/pages-report.json',JSON.stringify({url,scope:sw,manifestScope:base,htmlCsp:policy,offlinePlans:true,pageErrors:errors},null,2));
  console.log('PASS Pages 子路径、安装图标、SW scope、HTML CSP、单页离线及 iPhone Air 完整流程');
}finally{
  if(browser)await browser.close();
  await new Promise((resolve,reject)=>{server.close(error=>error?reject(error):resolve());server.closeAllConnections();});
}
