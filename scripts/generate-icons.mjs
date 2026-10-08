import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright-core';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const svg=fs.readFileSync(path.join(root,'public/icon.svg'),'utf8');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
try{fs.mkdirSync(path.join(root,'public/icons'),{recursive:true});for(const [size,name,maskable] of [[192,'icon-192.png',false],[512,'icon-512.png',false],[512,'maskable-512.png',true],[180,'apple-touch-icon.png',false]]){const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});const artwork=maskable?svg.replace('rx="110"','rx="0"'):svg;await page.setContent(`<html><body style="margin:0;background:transparent">${artwork.replace('<svg ','<svg style="display:block;width:100%;height:100%" ')}</body></html>`);await page.screenshot({path:path.join(root,'public/icons',name),omitBackground:true});await page.close();}}finally{await browser.close();}
