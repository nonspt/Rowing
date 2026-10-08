import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright-core';
const url=process.env.APP_URL||'http://localhost:5188/';
const output='test-results/iphone-air';
await fs.mkdir(output,{recursive:true});
if(!process.env.AIR_FOCUS_ONLY){
  const flow=spawnSync(process.execPath,['tests/browser.mjs'],{env:{...process.env,DEVICE_PROFILE:'iphone-air'},encoding:'utf8'});
  process.stdout.write(flow.stdout);process.stderr.write(flow.stderr);
  assert.equal(flow.status,0,'iPhone Air 核心功能流程');
}
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
const context=await browser.newContext({viewport:{width:420,height:912},screen:{width:420,height:912},deviceScaleFactor:3,isMobile:true,hasTouch:true,acceptDownloads:true,colorScheme:'light'});
const page=await context.newPage(),results=[],errors=[],checks=[];
page.on('pageerror',e=>errors.push(e.message));
const dialog=()=>page.locator('dialog[open]').last();
const record=async(name,task)=>{const start=Date.now();await task();results.push({name,status:'passed',ms:Date.now()-start});console.log('PASS '+name);};
const tab=async name=>{await page.getByRole('navigation',{name:'主要导航'}).getByRole('link',{name,exact:true}).tap();await page.getByRole('heading',{name,exact:true}).waitFor();await page.waitForTimeout(60);};
const insets=async value=>page.evaluate(v=>{for(const side of ['top','right','bottom','left'])document.documentElement.style.setProperty('--safe-'+side,(v[side]||0)+'px');},value);
const layout=async(label)=>{
  const issues=await page.evaluate(()=>{
    const errors=[];
    if(document.documentElement.scrollWidth>innerWidth+1)errors.push('document overflow');
    const active=document.querySelector('dialog[open]:last-of-type')||document.querySelector('main');
    for(const e of active.querySelectorAll('button,input,select,textarea,summary,a')){
      const style=getComputedStyle(e),rect=e.getBoundingClientRect();
      if(!rect.width||!rect.height||style.visibility==='hidden')continue;
      const target=(e.matches('input[type=checkbox]')?e.closest('label'):e)||e,r=target.getBoundingClientRect();
      if(r.height<43.5||r.width<43.5)errors.push((e.getAttribute('aria-label')||e.textContent||e.tagName).trim().slice(0,45)+' target '+Math.round(r.width)+'x'+Math.round(r.height));
      if(rect.left<-1||rect.right>innerWidth+1)errors.push(e.tagName+' outside width');
    }
    for(const e of document.querySelectorAll('dialog[open],.stats-card,.today-card,.group')){
      if(e.getBoundingClientRect().width&&e.scrollWidth>e.clientWidth+1)errors.push(e.className+' internal overflow');
    }
    return errors;
  });
  assert.deepEqual(issues,[],label);
};
try{
  await page.goto(url,{waitUntil:'networkidle'});
  await page.getByRole('button',{name:'先用新手默认设置'}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await record('420×912 CSS、DPR 3、触控及 1260×2736 截图',async()=>{
    const actual=await page.evaluate(()=>({width:innerWidth,height:innerHeight,dpr:devicePixelRatio,touch:navigator.maxTouchPoints,mobile:matchMedia('(pointer:coarse)').matches}));
    assert.ok(Math.abs(actual.dpr-3)<.0001);assert.deepEqual({...actual,dpr:3},{width:420,height:912,dpr:3,touch:1,mobile:true});
    await page.screenshot({path:output+'/today-light.png'});const png=await fs.readFile(output+'/today-light.png');assert.equal(png.readUInt32BE(16),1260);assert.equal(png.readUInt32BE(20),2736);checks.push(actual);
  });
  await record('双主题与主屏／工具栏／横屏布局及安全区',async()=>{
    const modes=[
      {name:'portrait',width:420,height:912,safe:{top:62,bottom:34}},
      {name:'browser-bars',width:420,height:760,safe:{}},
      {name:'landscape',width:912,height:420,safe:{left:62,right:62,bottom:21}}
    ];
    for(const mode of modes)for(const color of ['light','dark']){
      await page.setViewportSize({width:mode.width,height:mode.height});await insets(mode.safe);await page.emulateMedia({colorScheme:color,reducedMotion:'reduce'});
      await page.waitForFunction(c=>document.documentElement.dataset.theme===c,color);
      for(const [name,key]of [['今日','today'],['训练','training'],['学习','learn'],['记录','history']]){
        await tab(name);await layout(mode.name+' '+color+' '+name);
        if(mode.name==='portrait'){await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:output+'/'+key+'-'+color+'.png'});}
      }
      const safe=await page.locator('.tabbar').evaluate(e=>({left:parseFloat(getComputedStyle(e).paddingLeft),right:parseFloat(getComputedStyle(e).paddingRight),bottom:parseFloat(getComputedStyle(e).paddingBottom)}));
      assert.ok(safe.left>=(mode.safe.left||0));assert.ok(safe.right>=(mode.safe.right||0));assert.ok(safe.bottom>=(mode.safe.bottom||0));
      checks.push({mode:mode.name,color,...safe});
    }
  });
  await record('课程筛选、折叠阶段、轻松替代入口',async()=>{
    await page.setViewportSize({width:420,height:912});await insets({top:62,bottom:34});await tab('训练');
    await page.getByText('筛选课程',{exact:true}).tap();await page.getByLabel('可用时间').selectOption('15');
    assert.equal(await page.locator('main .group button.list-row').count(),3);
    await page.getByRole('button',{name:'清除筛选'}).tap();assert.equal(await page.locator('main .group button.list-row').count(),10);
    await page.getByRole('button',{name:/短间歇体验/}).tap();await dialog().getByRole('button',{name:'查看轻松替代课'}).waitFor();assert.ok(await dialog().getByRole('button',{name:'准备开始训练'}).isDisabled());
    await dialog().getByRole('button',{name:'查看轻松替代课'}).tap();await dialog().getByRole('heading',{name:'轻松连续',exact:true}).waitFor();
    await dialog().getByText('课程与阶段安排',{exact:true}).tap();assert.equal(await dialog().locator('.group .list-row').count(),3);await layout('expanded course');
    await dialog().getByRole('button',{name:'关闭轻松连续'}).tap();
  });
  await record('SVG 动画移动、暂停、六步骤及慢速',async()=>{
    await tab('学习');await page.emulateMedia({colorScheme:'dark',reducedMotion:'no-preference'});await page.evaluate(()=>scrollTo(0,0));
    const figure=page.locator('.rowing-demo .rowing-figure').first(),leg=figure.locator('path').nth(2);
    const before=await figure.innerHTML();await page.waitForTimeout(250);assert.notEqual(await figure.innerHTML(),before);
    await page.getByRole('button',{name:'暂停动作演示'}).tap();const paused=await figure.innerHTML();await page.waitForTimeout(220);assert.equal(await figure.innerHTML(),paused);
    await page.getByRole('button',{name:'分步查看',exact:true}).tap();
    for(const name of ['1. 蹬腿','2. 打开躯干','3. 拉柄','4. 伸手','5. 前倾','6. 屈膝']){await page.getByRole('button',{name,exact:true}).tap();assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');}
    await page.getByRole('button',{name:'慢速演示'}).tap();assert.equal(await page.getByRole('button',{name:'恢复速度'}).getAttribute('aria-pressed'),'true');
    await page.screenshot({path:output+'/animation-steps-dark.png'});await layout('six stroke steps');
  });
  await record('系统减少动态效果与隐藏页面冻结',async()=>{
    await page.emulateMedia({reducedMotion:'reduce'});const figure=page.locator('.rowing-demo .rowing-figure').first(),before=await figure.innerHTML();
    await page.waitForTimeout(250);assert.equal(await figure.innerHTML(),before);assert.ok(await page.getByRole('button',{name:'静态动作演示'}).isDisabled());
    await page.emulateMedia({reducedMotion:'no-preference'});await page.getByRole('button',{name:'播放动作演示'}).tap();
    await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
    await page.waitForTimeout(100);const stopped=await figure.innerHTML();await page.waitForTimeout(250);assert.equal(await figure.innerHTML(),stopped);
    await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
    await page.emulateMedia({reducedMotion:'reduce'});
  });
  await record('200% 相对字体、双主题四页及表单重排',async()=>{
    await page.evaluate(()=>document.documentElement.style.fontSize='34px');
    for(const color of ['light','dark']){
      await page.emulateMedia({colorScheme:color});
      for(const name of ['今日','训练','学习','记录']){await tab(name);await layout('200% '+color+' '+name);}
      await page.getByRole('button',{name:'补录训练',exact:true}).first().tap();await layout('200% '+color+' form');await page.screenshot({path:output+'/large-text-'+color+'.png'});await dialog().getByRole('button',{name:'关闭补录训练'}).tap();
    }
    await page.evaluate(()=>document.documentElement.style.fontSize='17px');
  });
  await record('缩短视口下表单输入、保存、编辑与删除',async()=>{
    await tab('记录');await page.getByRole('button',{name:'补录训练',exact:true}).first().tap();
    await page.setViewportSize({width:420,height:512});await insets({});
    await dialog().getByLabel('训练名称',{exact:true}).fill('Air 模拟训练');await dialog().getByText('设备读数 · 可选',{exact:true}).tap();await dialog().getByLabel('整次距离（米）',{exact:true}).fill('1500');await dialog().getByLabel('备注 · 可选').fill('触控与缩短视口验收');
    await layout('short viewport form');await dialog().getByRole('button',{name:'保存记录',exact:true}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    await page.setViewportSize({width:420,height:912});await page.getByRole('button',{name:/Air 模拟训练/}).tap();await dialog().getByRole('button',{name:'编辑读数与感受'}).tap();await dialog().getByLabel('备注 · 可选').fill('已编辑');await dialog().getByRole('button',{name:'保存记录',exact:true}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    await page.getByRole('button',{name:/Air 模拟训练/}).tap();await dialog().getByText('已编辑',{exact:true}).waitFor();await dialog().getByRole('button',{name:'删除记录',exact:true}).tap();await dialog().getByRole('button',{name:'删除这条记录'}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));assert.equal(await page.getByRole('button',{name:/Air 模拟训练/}).count(),0);
  });
  await record('计划调整日期、跳过、重复与偏好／外观／声音',async()=>{
    await tab('训练');await page.getByRole('button',{name:'四周计划',exact:true}).tap();await page.getByRole('button',{name:/动作与习惯/}).tap();await dialog().getByRole('button',{name:'采用这个计划'}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    await page.locator('.schedule-disclosure summary').first().tap();await page.getByRole('button',{name:'调整日期'}).first().tap();const dates=await page.locator('.schedule-item .row-copy small').allTextContents(),taken=dates.map(t=>t.slice(0,10));let free=new Date(taken[1]+'T00:00:00Z');do{free.setUTCDate(free.getUTCDate()+1);}while(taken.includes(free.toISOString().slice(0,10)));await dialog().getByLabel('训练日期').fill(taken[1]);await dialog().getByRole('button',{name:'保存日期'}).tap();await dialog().getByText('这天已有课程，请选择其他日期。',{exact:true}).waitFor();await dialog().getByLabel('训练日期').fill(free.toISOString().slice(0,10));await dialog().getByRole('button',{name:'保存日期'}).tap();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
    const summary=page.locator('.schedule-disclosure summary').first();if(!await summary.evaluate(e=>e.parentElement.open))await summary.tap();await page.getByRole('button',{name:'跳过本节'}).first().tap();await page.getByText('计划进度',{exact:true}).tap();await page.getByRole('button',{name:'重复当前周'}).tap();
    await page.getByRole('button',{name:'打开设置'}).tap();await dialog().getByRole('switch',{name:'阶段提示音'}).tap();await page.waitForFunction(()=>document.querySelector('input[role=switch]').checked);await dialog().getByRole('switch',{name:'阶段提示音'}).tap();await page.waitForFunction(()=>!document.querySelector('input[role=switch]').checked);await dialog().getByRole('button',{name:'浅色',exact:true}).tap();await page.waitForFunction(()=>document.documentElement.dataset.theme==='light');await dialog().getByRole('button',{name:'跟随系统',exact:true}).tap();
    await dialog().getByRole('button',{name:/训练偏好/}).tap();await dialog().getByRole('heading',{name:'训练偏好',exact:true}).waitFor();await layout('profile');await dialog().getByRole('button',{name:'关闭训练偏好'}).tap();await dialog().getByRole('button',{name:'关闭设置'}).tap();
  });
  await record('图标、动作、图表使用 SVG 与折叠键盘访问',async()=>{
    await tab('今日');await page.getByText('每日训练',{exact:true}).focus();await page.keyboard.press('Enter');assert.equal(await page.locator('.weekly-chart').count(),1);
    assert.equal(await page.locator('main img,main canvas,.row-icon:not(:has(svg)),.brand-symbol:not(:has(svg))').count(),0);
    await tab('学习');await page.getByRole('button',{name:/2\. 入水位/}).tap();await page.emulateMedia({reducedMotion:'reduce'});await dialog().getByRole('button',{name:'分步查看',exact:true}).tap();await dialog().getByRole('button',{name:'3. 拉柄',exact:true}).tap();await page.screenshot({path:output+'/finish-dark.png'});await dialog().getByRole('button',{name:'关闭入水位'}).tap();
    const svgIssues=await page.locator('svg[role=img]').evaluateAll(es=>es.filter(e=>!e.getAttribute('aria-label')&&!document.getElementById(e.getAttribute('aria-labelledby'))?.textContent).map(e=>e.outerHTML.slice(0,100)));
    assert.deepEqual(svgIssues,[]);
  });
  await record('设备尺寸下离线重开与动画资源可用',async()=>{
    await page.evaluate(async()=>{await navigator.serviceWorker.ready;});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload({waitUntil:'networkidle'});await tab('学习');await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.rowing-demo .rowing-figure').count(),1);await page.getByRole('button',{name:'分步查看',exact:true}).tap();await page.getByRole('button',{name:'4. 伸手',exact:true}).tap();await tab('训练');assert.ok(await page.getByRole('button',{name:/动作起步/}).count());await context.setOffline(false);
  });
  assert.deepEqual(errors,[]);
  const flowReport=JSON.parse(await fs.readFile('test-results/iphone-air-flow-report.json','utf8'));
  const report={url,build:await page.locator('meta[name=home-rower-build]').getAttribute('content'),date:new Date().toISOString(),engine:'Chromium '+browser.version(),device:{name:'iPhone Air',viewport:{width:420,height:912},physicalPixels:{width:1260,height:2736},deviceScaleFactor:3},scope:'分辨率／触控／布局模拟；安全区为注入压力值，缩短视口为键盘／工具栏近似，不是 iOS 真机或 Safari 验收',passed:results.length+flowReport.results.length,focused:results,flow:flowReport,checks,pageErrors:errors};
  await fs.writeFile(output+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify({passed:report.passed,pageErrors:errors}));
}catch(error){await page.screenshot({path:output+'/failure.png',fullPage:true});await fs.writeFile(output+'/failure.json',JSON.stringify({results,errors,error:error.message},null,2));throw error;}finally{await browser.close();}
