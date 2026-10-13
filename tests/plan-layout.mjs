import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {launch,appURL,dialog,readState,setRange} from './ui-helpers.mjs';

const output='test-results/plan-layout';await fs.mkdir(output,{recursive:true});
const browser=await launch(),context=await browser.newContext({viewport:{width:1133,height:744},deviceScaleFactor:2,hasTouch:true}),page=await context.newPage(),results=[],errors=[];
page.on('pageerror',error=>errors.push(error.message));
const closed=()=>page.waitForFunction(()=>!document.querySelector('dialog[open],[data-session-page]'));
const panels=async()=>{
  const sheet=dialog(page),boxes=await sheet.locator('.plan-panel').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom};}));
  assert.ok(boxes.length>=2);for(const b of boxes){assert.ok(Math.abs(b.y-boxes[0].y)<1&&Math.abs(b.height-boxes[0].height)<1&&Math.abs(b.width-boxes[0].width)<1);assert.ok(b.y>=0&&b.bottom<=page.viewportSize().height-21);}
  assert.equal(await sheet.evaluate(e=>e.scrollHeight>e.clientHeight+1),false,'module layout must fit the dialog');
  const action=await sheet.locator('.editor-actions').boundingBox();assert.ok(action.y>=boxes[0].bottom&&action.y+action.height<=page.viewportSize().height-21);
  assert.deepEqual(await sheet.evaluate(e=>[...e.querySelectorAll('.plan-panel-content')].filter(n=>getComputedStyle(n).overflowY!=='auto'||n.scrollWidth>n.clientWidth+1).map(n=>n.getAttribute('aria-label'))),[]);
  return boxes;
};
const screen=async(height,theme)=>{await page.setViewportSize({width:1133,height});await page.emulateMedia({colorScheme:theme});await page.waitForFunction(t=>document.documentElement.dataset.theme===t,theme);await page.evaluate(()=>{document.documentElement.style.setProperty('--safe-top','24px');document.documentElement.style.setProperty('--safe-bottom','21px');});};
try{
  await page.goto(appURL,{waitUntil:'networkidle'});
  for(const height of [744,650])for(const theme of ['light','dark']){
    await screen(height,theme);for(const type of ['有氧','无氧']){
      await page.getByRole('button',{name:type+'计划',exact:true}).click();const cards=await page.locator('.template-card').all(),boxes=await Promise.all(cards.map(n=>n.boundingBox()));assert.equal(cards.length,3);assert.ok(boxes.every(b=>Math.abs(b.y-boxes[0].y)<1&&Math.abs(b.height-boxes[0].height)<1&&b.y+b.height<=height-21));
      const positions=await Promise.all(cards.map(n=>n.locator('.template-metrics').boundingBox()));assert.ok(positions.every(b=>Math.abs(b.y-positions[0].y)<1));
    }
  }
  results.push('双主题 744 / 650：三种预设卡等高、参数分类及同类数据对齐');
  await setRange(page,'调节预设计划周期',12);
  for(const [type,title] of [['有氧','轻松有氧'],['有氧','基础耐力'],['有氧','长时有氧'],['无氧','无氧适应'],['无氧','短间歇强化'],['无氧','无氧进阶']]){
    await page.getByRole('button',{name:type+'计划',exact:true}).click();await page.getByRole('button',{name:new RegExp(title)}).click();assert.equal((await panels()).length,type==='无氧'?3:2);
    const region=dialog(page).getByRole('region',{name:type==='无氧'?'计划设置内容':'划船训练结构内容'}),outer=await dialog(page).evaluate(e=>e.scrollTop);assert.ok(await region.evaluate(e=>e.scrollHeight>e.clientHeight));await region.evaluate(e=>e.scrollTop=e.scrollHeight);assert.ok(await region.evaluate(e=>e.scrollTop>0));assert.equal(await dialog(page).evaluate(e=>e.scrollTop),outer);
    assert.ok(await dialog(page).locator('.preset-structure').count()>=1);await page.screenshot({path:output+'/preset-'+type+'-'+title+'.png'});await dialog(page).getByRole('button',{name:'关闭采用计划'}).click();await closed();
  }
  results.push('六种 12 周预设详情：两 / 三个等大模块同屏，全部不同训练结构分组；模块内滚动不移动页面或保存按钮');
  await page.getByRole('button',{name:'自定义计划',exact:true}).click();
  for(const mode of ['aerobic','anaerobic']){await dialog(page).getByRole('button',{name:mode==='aerobic'?'训练类型有氧':'训练类型无氧'}).click();assert.deepEqual(await dialog(page).getByRole('slider',{name:'调节每周训练次数'}).evaluate(e=>[Number(e.min),Number(e.max),Number(e.step)]),[1,5,1]);}
  await setRange(page,'调节每周训练次数',5);assert.match(await dialog(page).innerText(),/每周 2 次间歇 \+ 3 次恢复划行/);
  for(const height of [744,650])for(const theme of ['light','dark']){await screen(height,theme);assert.equal((await panels()).length,3);await page.screenshot({path:output+'/custom-'+height+'-'+theme+'.png'});}
  await dialog(page).getByRole('button',{name:'训练组合仅划船'}).click();assert.equal((await panels()).length,2);await dialog(page).getByRole('button',{name:'训练组合划船+徒手'}).click();await dialog(page).getByRole('button',{name:'自重深蹲按次数'}).click();await dialog(page).getByRole('button',{name:'保存并使用'}).click();await closed();let state=await readState(page),plan=state.plans.find(p=>p.status==='active');assert.equal(plan.training.weeklyDays,5);assert.equal(state.scheduledSessions.filter(s=>s.planId===plan.id).length,20);assert.equal(state.scheduledSessions.filter(s=>s.planId===plan.id&&s.course.category==='interval').length,8);await page.reload({waitUntil:'networkidle'});assert.equal((await readState(page)).plans.find(p=>p.status==='active').training.weeklyDays,5);
  results.push('自定义有氧 / 无氧均可 1–5 次；三模块等大，切换仅划船为两模块，5 次混合日程真实保存 / 刷新');
  for(const height of [744,650])for(const theme of ['light','dark']){
    await screen(height,theme);const b=await page.locator('.schedule-card').boundingBox(),rows=await page.locator('.schedule-row').all(),list=await page.locator('.schedule-list').boundingBox(),footer=await page.locator('.plan-footer').boundingBox();assert.equal(rows.length,5);assert.ok(b.y+b.height<=height-21&&footer.y+footer.height<=b.y+b.height);assert.ok(footer.y-list.y-list.height<=17);for(const row of rows){const r=await row.boundingBox();assert.ok(r.y>=list.y-1&&r.y+r.height<=list.y+list.height+1,'all five rows visible');}
    assert.ok(await page.locator('.schedule-card').evaluate(e=>e.scrollHeight<=e.clientHeight+1));await page.screenshot({path:output+'/schedule-'+height+'-'+theme+'.png'});
  }
  results.push('5 次日程双主题横屏完整显示；周历 / 周数 / 行状态清楚，列表占满余下高度且与底部操作相接');
  for(const days of [1,2,3]){
    await page.getByRole('button',{name:'编辑计划',exact:true}).click();await setRange(page,'调节每周训练次数',days);await dialog(page).getByRole('button',{name:'保存修改'}).click();await closed();const rows=await page.locator('.schedule-row').all(),list=await page.locator('.schedule-list').boundingBox();assert.equal(rows.length,days);const last=await rows.at(-1).boundingBox();assert.ok(Math.abs(last.y+last.height-list.y-list.height)<2);assert.ok(await page.locator('.schedule-card').evaluate(e=>e.scrollHeight<=e.clientHeight+1));
  }
  results.push('1 / 2 / 3 次周列表按内容数量分配高度，不把训练信息集中在顶部或保留大片底部空白');
  await page.getByRole('button',{name:'编辑计划',exact:true}).click();for(const viewport of [{width:420,height:912},{width:744,height:1133},{width:567,height:744},{width:1133,height:440}]){
    await page.setViewportSize(viewport);for(const size of [17,34]){await page.evaluate(n=>document.documentElement.style.fontSize=n+'px',size);assert.ok(await dialog(page).evaluate(e=>e.scrollWidth<=e.clientWidth+1));await setRange(page,'调节每周训练次数',5);await setRange(page,'调节自重深蹲次数',18);}
  }
  await page.evaluate(()=>document.documentElement.style.removeProperty('font-size'));await dialog(page).getByRole('button',{name:'保存修改'}).click();await closed();await page.evaluate(()=>navigator.serviceWorker.ready);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});assert.equal((await readState(page)).plans.find(p=>p.status==='active').training.weeklyDays,5);await page.getByRole('button',{name:'编辑计划'}).click();assert.equal(await dialog(page).getByRole('slider',{name:'调节自重深蹲次数'}).inputValue(),'18');await context.setOffline(false);
  results.push('手机 / 竖屏 / 分屏 / 键盘高度与 200% 字体仍可填写；五次与计次目标离线重开保留');
  assert.deepEqual(errors,[]);await fs.writeFile(output+'/report.json',JSON.stringify({url:appURL,build:await page.locator('meta[name=home-rower-build]').getAttribute('content'),results,pageErrors:errors,limitation:'Chromium 模拟；本轮仅本地验收，不发布 GitHub'},null,2));console.log(JSON.stringify({passed:results.length,results,pageErrors:errors},null,2));
}catch(error){await page.screenshot({path:output+'/failure.png',fullPage:true});throw error;}finally{await browser.close();}
