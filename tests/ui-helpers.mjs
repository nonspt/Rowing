import {chromium} from 'playwright-core';
export const appURL=process.env.APP_URL||'http://localhost:5188/';
export const launch=()=>chromium.launch({executablePath:process.env.CHROME_PATH||'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',headless:true});
export const dialog=page=>page.locator('dialog[open]').last();
export const readState=page=>page.evaluate(()=>new Promise((resolve,reject)=>{
  const request=indexedDB.open('home-rower-db');request.onerror=()=>reject(request.error);
  request.onsuccess=()=>{const db=request.result,names=['profiles','lessonProgress','plans','scheduledSessions','drafts','workouts','meta'],tx=db.transaction(names,'readonly'),state={version:db.version};for(const name of names){const r=tx.objectStore(name).getAll();r.onsuccess=()=>state[name]=r.result;}tx.oncomplete=()=>{db.close();resolve(state);};tx.onabort=()=>reject(tx.error);};
}));
export async function useTemplate(page,weeks=4,title='轻松有氧'){
  await page.getByRole('button',{name:weeks+' 周',exact:true}).click();await page.getByRole('button',{name:new RegExp(title)}).click();await dialog(page).getByRole('button',{name:'使用这个计划'}).click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
}
export async function exportBackup(page){
  await page.getByRole('button',{name:'打开设置'}).click();await dialog(page).getByText('数据备份',{exact:true}).click();const downloading=page.waitForEvent('download');await dialog(page).getByRole('button',{name:'导出备份'}).click();return downloading;
}
