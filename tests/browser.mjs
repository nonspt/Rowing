import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright-core';
const air=process.env.DEVICE_PROFILE==='iphone-air',viewport=air?{width:420,height:912}:{width:390,height:844};
const root=process.cwd(),url=process.env.APP_URL||'http://localhost:5188/';
await fs.mkdir(path.join(root,'test-results'),{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const errors=[],results=[];
const context=await browser.newContext({viewport,screen:viewport,deviceScaleFactor:air?3:1,isMobile:true,hasTouch:true,acceptDownloads:true});
const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
const dialogs=()=>page.locator('dialog[open]').last();
const clickTab=async name=>{await page.getByRole('navigation',{name:'主要导航'}).getByRole('link',{name,exact:true}).click();await page.getByRole('heading',{name,exact:true}).waitFor();await page.waitForTimeout(80);};
const savedState=()=>page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('home-rower-db',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,names=['workouts','drafts','meta','scheduledSessions','plans'],tx=db.transaction(names,'readonly'),state={};for(const name of names){const r=tx.objectStore(name).getAll();r.onsuccess=()=>state[name]=r.result;}tx.oncomplete=()=>{db.close();resolve(state);};};}));
try{
  await page.goto(url,{waitUntil:'networkidle'});await page.getByRole('button',{name:'先用新手默认设置'}).click();await page.getByRole('heading',{name:'今日',exact:true}).waitFor();
  await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  assert.equal((await savedState()).workouts.length,0);results.push('首次设置与空记录');
  // Validate every top-level page at narrow and desktop sizes, both themes.
  for(const width of [320,390,430,768,1200])for(const color of ['light','dark']){
    await page.setViewportSize({width,height:width>=768?900:844});await page.emulateMedia({colorScheme:color,reducedMotion:'reduce'});
    await page.evaluate(()=>localStorage.setItem('home-rower-theme','system'));await page.reload({waitUntil:'networkidle'});
    await page.waitForFunction(expected=>document.documentElement.dataset.theme===expected,color);
    for(const [name,key] of [['今日','today'],['训练','training'],['学习','learn'],['记录','history']]){
      await clickTab(name);assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`Overflow: ${width} ${color} ${name}`);
      if(width===390||width===1200)await page.screenshot({path:`test-results/${key}-${width}-${color}.png`,fullPage:true});
    }
  }
  results.push('5 种宽度 × 双主题 × 四页面无横向溢出');
  await page.setViewportSize(viewport);
  await clickTab('学习');await page.getByRole('button',{name:/2\. 入水位/}).click();await dialogs().locator('summary').filter({hasText:'练习后的自检'}).click();await dialogs().getByRole('checkbox').first().check();await dialogs().getByRole('button',{name:'保存学习与自检'}).click();await dialogs().getByRole('button',{name:'关闭入水位'}).click();
  await clickTab('训练');await page.getByRole('button',{name:'四周计划',exact:true}).click();await page.getByRole('button',{name:/动作与习惯/}).click();await dialogs().getByRole('button',{name:'采用这个计划'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal((await savedState()).plans.length,1);assert.equal((await savedState()).scheduledSessions.length,3);results.push('学习自检与计划、日程真实持久保存');
  await clickTab('今日');await page.getByRole('button',{name:'查看今日训练'}).click();await dialogs().getByRole('button',{name:'准备开始训练'}).click();await dialogs().getByRole('button',{name:'开始跟练'}).click();await page.waitForTimeout(2300);await dialogs().getByRole('button',{name:'暂停训练'}).click();
  const elapsed=await dialogs().locator('.timer').innerText();await page.waitForTimeout(1200);assert.equal(await dialogs().locator('.timer').innerText(),elapsed);await dialogs().getByRole('button',{name:'继续训练'}).click();
  const second=await context.newPage();await second.goto(url,{waitUntil:'networkidle'});await second.getByRole('button',{name:'恢复上次训练'}).click();await second.getByRole('status').filter({hasText:/其他窗口正在训练/}).waitFor();await second.close();results.push('暂停不累计与有效租约保护');
  await dialogs().getByRole('button',{name:'关闭跟练'}).click();await dialogs().getByRole('button',{name:'保留草稿并退出'}).click();await page.reload({waitUntil:'networkidle'});await page.getByRole('button',{name:'恢复上次训练'}).click();await dialogs().getByText('训练曾中断',{exact:true}).waitFor();
  await dialogs().getByRole('button',{name:'继续训练'}).click();await page.waitForTimeout(1400);await dialogs().getByRole('button',{name:'结束并填写记录'}).click();
  await dialogs().getByText('设备读数 · 可选',{exact:true}).click();await dialogs().getByLabel('整次距离（米）',{exact:true}).fill('120');
  // Failed transaction must retain the draft and expose a visible retry message.
  await page.evaluate(()=>{window.originalTransaction=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(names,mode,...rest){if(mode==='readwrite')throw new DOMException('故障注入','QuotaExceededError');return window.originalTransaction.call(this,names,mode,...rest);};});
  await dialogs().getByRole('button',{name:'保存训练记录'}).click();await dialogs().getByText('故障注入',{exact:false}).first().waitFor();assert.equal((await savedState()).workouts.length,0);assert.equal((await savedState()).drafts.length,1);
  await page.evaluate(()=>{IDBDatabase.prototype.transaction=window.originalTransaction;});await dialogs().getByRole('button',{name:'保存训练记录'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  let state=await savedState();assert.equal(state.workouts.length,1);assert.equal(state.drafts.length,0);assert.equal(state.workouts[0].completionStatus,'ended-early');assert.ok(state.workouts[0].activeDurationSeconds>=3);assert.ok(state.workouts[0].activeDurationSeconds<10);results.push('刷新恢复、保存故障重试与提前结束记录');
  await clickTab('记录');await page.getByRole('button',{name:/动作起步/}).click();await dialogs().getByRole('button',{name:'编辑读数与感受'}).click();await dialogs().getByLabel('备注 · 可选').fill('浏览器验收记录');await dialogs().getByRole('button',{name:'保存记录',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));await page.reload({waitUntil:'networkidle'});state=await savedState();assert.equal(state.workouts[0].feedback.note,'浏览器验收记录');results.push('历史编辑与重新打开');
  await page.getByRole('button',{name:'打开设置'}).click();const downloaded=page.waitForEvent('download');await dialogs().getByRole('button',{name:/导出 JSON 备份/}).click();const file=await downloaded;const backupText=await fs.readFile(await file.path(),'utf8');const backup=JSON.parse(backupText);assert.equal(backup.counts.workouts,1);await dialogs().getByLabel('选择 JSON 备份文件').setInputFiles({name:'backup.json',mimeType:'application/json',buffer:Buffer.from(backupText)});await dialogs().getByRole('button',{name:'确认合并导入'}).click();await page.waitForTimeout(300);assert.equal((await savedState()).workouts.length,1);results.push('真实备份下载、导入预览、幂等合并');
  await dialogs().getByRole('button',{name:'关闭设置'}).click();await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await clickTab('学习');await page.getByRole('heading',{name:'学习',exact:true}).waitFor();await clickTab('记录');assert.equal((await savedState()).workouts.length,1);await page.screenshot({path:'test-results/offline-history.png',fullPage:true});await context.setOffline(false);results.push('正式构建离线启动、教学和记录');
  // A full course uses a virtual clock, not a shortcut in production code.
  await clickTab('训练');await page.getByRole('button',{name:/恢复划行/}).click();await dialogs().getByRole('button',{name:'准备开始训练'}).click();await page.clock.install();await dialogs().getByRole('button',{name:'开始跟练'}).click();await dialogs().getByRole('button',{name:'暂停训练'}).waitFor();await page.clock.runFor(12*60*1000+500);await dialogs().getByRole('heading',{name:'训练摘要',exact:true}).waitFor();await dialogs().getByRole('button',{name:'保存训练记录'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));state=await savedState();assert.equal(state.workouts.length,2);assert.equal(state.workouts.find(w=>w.course.id==='R01').completionStatus,'completed');assert.equal(state.workouts.find(w=>w.course.id==='R01').activeDurationSeconds,720);results.push('完整课程正常结束与阶段累计');
  const broken=await browser.newContext();await broken.addInitScript(()=>{Object.defineProperty(indexedDB,'open',{value:()=>{throw new DOMException('不可用','SecurityError');}});});const temp=await broken.newPage();await temp.goto(url,{waitUntil:'networkidle'});await temp.getByRole('button',{name:'使用临时模式'}).click();await temp.getByRole('button',{name:'先用新手默认设置'}).click();await temp.getByText(/临时模式：记录尚未永久保存/).waitFor();await broken.close();results.push('存储不可用的明确临时模式');
  assert.deepEqual(errors,[]);
  await fs.writeFile(air?'test-results/iphone-air-flow-report.json':'test-results/browser-report.json',JSON.stringify({url,build:await page.locator('meta[name=home-rower-build]').getAttribute('content'),device:air?'iPhone Air Chromium emulation':'generic Chromium',viewport,pixelRatio:air?3:1,results,pageErrors:errors},null,2));console.log(JSON.stringify({passed:results.length,results,pageErrors:errors},null,2));
}catch(error){const state=await savedState();console.log('failure-state',JSON.stringify({workouts:state.workouts.length,drafts:state.drafts.map(d=>({state:d.state,revision:d.revision,elapsedMs:d.elapsedMs})),plans:state.plans.length,scheduled:state.scheduledSessions.length}));console.log('page-errors',JSON.stringify(errors));await page.screenshot({path:'test-results/failure.png',fullPage:true});throw error;}finally{await browser.close();}
