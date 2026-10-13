import {chromium} from 'playwright-core';
export const appURL=process.env.APP_URL||'http://localhost:5188/';
export const launch=()=>chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
export const dialog=page=>page.locator('[data-session-page],dialog[open]').last();
export const readState=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('home-rower-db');request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{const db=request.result,names=['profiles','lessonProgress','plans','scheduledSessions','drafts','workouts','meta'],tx=db.transaction(names,'readonly'),state={version:db.version};for(const name of names){const r=tx.objectStore(name).getAll();r.onsuccess=()=>state[name]=r.result;}tx.oncomplete=()=>{db.close();resolve(state);};tx.onabort=()=>reject(tx.error);};
}));
export async function useTemplate(page,weeks=4,title='轻松有氧'){
  await setRange(page,'调节预设计划周期',weeks);await page.getByRole('button',{name:new RegExp(title)}).click();await dialog(page).getByRole('button',{name:'使用这个计划'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
}
export async function exportBackup(page){
  await page.getByRole('button',{name:'打开设置'}).click();await dialog(page).getByText('数据备份',{exact:true}).click();const downloading=page.waitForEvent('download');await dialog(page).getByRole('button',{name:'导出备份'}).click();return downloading;
}

export async function setRange(page,name,value){
  const host=(await dialog(page).count())?dialog(page):page,slider=host.getByRole('slider',{name,exact:true});
  const bounds=await slider.evaluate(e=>({min:Number(e.min),max:Number(e.max),step:Number(e.step)||1,stops:e.dataset.stops?.split(',').map(Number)}));
  const target=bounds.stops?bounds.stops.indexOf(value):value;
  if(target<bounds.min||target>bounds.max||(target-bounds.min)%bounds.step!==0)throw new Error('Requested slider value is outside its range');
  await slider.press('Home');for(let n=bounds.min;n<target;n+=bounds.step)await slider.press('ArrowRight');
  if(Number(await slider.inputValue())!==target)throw new Error('Slider keyboard interaction did not set the requested value');
}
