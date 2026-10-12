import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launch,appURL,dialog,readState,useTemplate} from './ui-helpers.mjs';

const output='test-results/ipad-mini';await fs.mkdir(output,{recursive:true});
const browser=await launch(),context=await browser.newContext({viewport:{width:1133,height:744},screen:{width:1133,height:744},deviceScaleFactor:2,isMobile:true,hasTouch:true,colorScheme:'light'}),page=await context.newPage(),errors=[],results=[];
page.on('pageerror',e=>errors.push(e.message));
const closed=()=>page.waitForFunction(()=>!document.querySelector('dialog[open]'));
const layout=async label=>{
  const issues=await page.evaluate(()=>{
    const issues=[],active=[...document.querySelectorAll('dialog[open]')].at(-1)||document.querySelector('main');
    if(document.documentElement.scrollWidth>innerWidth+1)issues.push('document overflow');
    if(active.scrollWidth>active.clientWidth+1)issues.push('internal overflow');
    for(const e of active.querySelectorAll('button,input,select,summary,a')){
      const style=getComputedStyle(e),r=e.getBoundingClientRect();if(!r.width||!r.height||style.visibility==='hidden')continue;
      const target=e.matches('input[type=checkbox]')?e.closest('label'):e,t=target.getBoundingClientRect();
      if(t.width<43.5||t.height<43.5)issues.push((e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,30)+' touch target');
      if(r.left<-1||r.right>innerWidth+1)issues.push(e.tagName+' outside width');
    }
    return issues;
  });assert.deepEqual(issues,[],label);
};
const beside=async(left,right)=>{
  const a=await page.locator(left).boundingBox(),b=await page.locator(right).boundingBox();assert.ok(a.x+a.width<=b.x+1);assert.ok(Math.max(a.y,b.y)<Math.min(a.y+a.height,b.y+b.height),'columns overlap vertically');
};
const follow=async(landscape=false)=>{
  await page.getByRole('button',{name:'进入跟练',exact:true}).click();await dialog(page).getByRole('button',{name:'开始跟练'}).waitFor();await layout('follow');
  assert.equal(await dialog(page).locator('.effort-max').innerText(),'/ 16');assert.equal(await dialog(page).getByRole('img').count(),0);
  if(landscape){
    await beside('.timer-area','.session-targets');
    const bounds=await dialog(page).boundingBox();assert.ok(Math.abs(bounds.width-(await page.evaluate(()=>innerWidth)))<1);
    const limits=await page.evaluate(()=>({height:innerHeight,bottom:parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom'))||0}));
    const header=await dialog(page).locator('.sheet-header').boundingBox();for(const selector of ['.session-top','.timer','.effort-reading','.next-reading']){const b=await dialog(page).locator(selector).boundingBox();assert.ok(b.y>=header.y+header.height-1,selector+' not covered by header');assert.ok(b.y+b.height<=limits.height-limits.bottom+1,selector+' visible without scrolling');}
    for(const label of ['开始跟练','结束跟练']){const b=await dialog(page).getByRole('button',{name:label,exact:true}).boundingBox();assert.ok(b.height>=72);assert.ok(b.y>=0&&b.y+b.height<=limits.height-limits.bottom+1,label+' visible without scrolling');}
    assert.ok(await dialog(page).locator('.timer').evaluate(e=>parseFloat(getComputedStyle(e).fontSize))>=170);
  }
};
const closeFollow=async()=>{
  await dialog(page).getByRole('button',{name:'关闭跟练',exact:true}).click();await closed();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'丢弃本次',exact:true}).click();await page.getByRole('button',{name:'进入跟练',exact:true}).waitFor();
};
try{
  await page.goto(appURL,{waitUntil:'domcontentloaded'});await page.getByRole('heading',{name:'训练计划',exact:true}).waitFor();
  const device=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints}));assert.deepEqual(page.viewportSize(),{width:1133,height:744});assert.ok(Math.abs(device.width-1133)<=1,'mobile viewport rounding within 1 CSS px');assert.equal(device.height,744);assert.equal(device.touch,1);assert.ok(Math.abs(device.dpr-2)<.0001,'DPR floating-point tolerance');await layout('initial templates');
  const cards=await page.locator('.template-grid>.list-row').all();assert.equal(cards.length,3);const boxes=await Promise.all(cards.map(c=>c.boundingBox()));assert.ok(boxes.every(b=>Math.abs(b.y-boxes[0].y)<1));
  await page.screenshot({path:output+'/templates-light.png'});const png=await fs.readFile(output+'/templates-light.png');assert.equal(png.readUInt32BE(16),2266);assert.equal(png.readUInt32BE(20),1488);results.push('1133×744、DPR 2、触控、2266×1488 截图与三列模板');
  await useTemplate(page,8,'基础耐力');
  const modes=[{name:'landscape',width:1133,height:744,safe:{top:24,bottom:21},wide:true},{name:'browser-bars',width:1133,height:650,safe:{top:24,bottom:21},wide:true},{name:'portrait',width:744,height:1133,safe:{top:24,bottom:21}},{name:'split',width:567,height:744,safe:{top:24,bottom:21}}];
  for(const mode of modes)for(const color of ['light','dark']){
    await page.setViewportSize({width:mode.width,height:mode.height});await page.evaluate(s=>{for(const side of ['top','right','bottom','left'])document.documentElement.style.setProperty('--safe-'+side,(s[side]||0)+'px');},mode.safe);await page.emulateMedia({colorScheme:color,reducedMotion:'reduce'});await page.waitForFunction(c=>document.documentElement.dataset.theme===c,color);
    await layout(mode.name+' '+color+' plans');if(mode.wide)await beside('.plan-card','.plans-layout>.section');if(mode.name==='landscape')await page.screenshot({path:output+'/plans-'+color+'.png'});
    await page.getByRole('button',{name:'更换计划'}).click();await layout('library');if(mode.wide)assert.ok((await dialog(page).boundingBox()).width>=1000);
    await dialog(page).getByRole('button',{name:'无氧计划',exact:true}).click();await dialog(page).getByRole('button',{name:/无氧适应/}).click();await layout('preview');await dialog(page).getByRole('button',{name:'关闭采用计划'}).click();
    await dialog(page).getByRole('button',{name:'自定义计划',exact:true}).click();await dialog(page).getByLabel('训练类型').selectOption('anaerobic');await dialog(page).getByText('热身与放松',{exact:true}).click();await layout('custom');if(mode.wide)await beside('.editor-basics','.editor-training');if(mode.name==='landscape')await page.screenshot({path:output+'/custom-'+color+'.png'});await dialog(page).getByRole('button',{name:'关闭自定义计划'}).click();
    await follow(!!mode.wide);if(mode.name==='landscape')await page.screenshot({path:output+'/follow-'+color+'.png'});await closeFollow();results.push(mode.name+' '+color+'：计划、模板、预览、自定义与跟练布局');
  }
  await page.setViewportSize({width:1133,height:440});await page.getByRole('button',{name:'更换计划'}).click();await dialog(page).getByRole('button',{name:'自定义计划',exact:true}).click();await layout('keyboard-height editor');await dialog(page).getByLabel('计划名称').fill('iPad 横屏自定义');await dialog(page).getByLabel('计划周期（周）').fill('6');await dialog(page).getByLabel('主训练（分钟）').fill('5');await dialog(page).getByRole('button',{name:'保存并使用'}).click();await closed();assert.equal((await readState(page)).plans.find(p=>p.status==='active').training.weeks,6);results.push('1133×440 高度下填写与保存自定义计划，原生字段可滚动访问');
  await page.setViewportSize({width:1133,height:744});await page.getByRole('button',{name:'编辑计划',exact:true}).click();await dialog(page).getByLabel('计划周期（周）').fill('8');await dialog(page).getByRole('button',{name:'保存修改'}).click();await closed();assert.equal((await readState(page)).plans.find(p=>p.status==='active').training.weeks,8);await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'进入跟练'}).waitFor();results.push('横屏创建 / 编辑 / 刷新后计划持久保存');
  await page.evaluate(()=>document.documentElement.style.fontSize='34px');await layout('200% plans');await page.getByRole('button',{name:'更换计划'}).click();await layout('200% library');await dialog(page).getByRole('button',{name:'自定义计划',exact:true}).click();await layout('200% editor');await dialog(page).getByRole('button',{name:'关闭自定义计划'}).click();await follow();await dialog(page).getByRole('button',{name:'结束跟练'}).click();await dialog(page).getByRole('button',{name:'完成并返回计划'}).waitFor();await layout('200% summary');await dialog(page).getByRole('button',{name:'完成并返回计划'}).click();await closed();await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));results.push('200% 字体：模板 / 编辑 / 跟练 / 结束页面无横向溢出，操作可滚动访问');
  await page.getByRole('button',{name:'进入跟练'}).click();await dialog(page).getByRole('button',{name:'开始跟练'}).click();await dialog(page).getByRole('button',{name:'暂停训练'}).waitFor();await page.waitForTimeout(1200);await dialog(page).getByRole('button',{name:'暂停训练'}).click();const timer=await dialog(page).locator('.timer').innerText();await page.waitForTimeout(600);assert.equal(await dialog(page).locator('.timer').innerText(),timer);await dialog(page).getByRole('button',{name:'结束跟练'}).click();await dialog(page).getByRole('button',{name:'完成并返回计划'}).click();await closed();assert.equal((await readState(page)).workouts.length,1);results.push('横屏开始 / 暂停 / 结束与实际记录保存');
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'进入跟练'}).waitFor();await layout('offline plans');await follow(true);await context.setOffline(false);await closeFollow();results.push('横屏离线重开计划及跟练');
  await page.getByRole('button',{name:'打开设置'}).focus();await page.keyboard.press('Enter');await page.keyboard.press('Escape');await page.waitForFunction(()=>document.activeElement?.getAttribute('aria-label')==='打开设置');results.push('原生弹层键盘与焦点恢复');
  assert.deepEqual(errors,[]);await fs.writeFile(output+'/report.json',JSON.stringify({url:appURL,build:await page.locator('meta[name=home-rower-build]').getAttribute('content'),engine:await browser.version(),targetViewport:{width:1133,height:744,dpr:2},device,results,pageErrors:errors,limitation:'Chromium 参数模拟，未运行真实 iPadOS Safari；安全区与工具栏 / 键盘高度为压力值'},null,2));console.log(JSON.stringify({passed:results.length,results,pageErrors:errors},null,2));
}catch(error){await page.screenshot({path:output+'/failure.png',fullPage:true});throw error;}finally{await browser.close();}
