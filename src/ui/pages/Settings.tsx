import {useState} from 'react';
import {newEntity,APP_VERSION,type Backup,type Profile} from '../../domain/types.ts';
import {parseBackup} from '../../domain/validation.ts';
import {importPreview} from '../../application/service.ts';
import {downloadJson} from '../../adapters/download.ts';
import {localDate} from '../../domain/plans.ts';
import {useApp} from '../context.ts';
import {Row,Section,Notice} from '../components/shared.tsx';
import {Sheet} from '../components/Sheet.tsx';
import {Icon} from '../components/Icon.tsx';
export function defaultProfile():Profile{return {...newEntity('profile'),experience:'new',goal:'aerobic',weeklyDays:3,availableMinutes:30,machine:'通用家用划船机',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone,sound:false};}
export function Settings({onClose}:{onClose:()=>void}){
  const {data,service,perform,busy,theme,setTheme,themeError,notify,offlineReady,updateAvailable,applyUpdate}=useApp(),[preview,setPreview]=useState<{backup:Backup;revision:number}|null>(null);
  const readFile=async(file?:File)=>{if(!file)return;try{if(!/\.json$/i.test(file.name)||file.size>10*1024*1024)throw new Error('请选择 10MB 以内的 JSON 备份。');const backup=parseBackup(await file.text());const latest=await service.repository.read();setPreview({backup,revision:latest.revision});}catch(error){notify(error instanceof Error?error.message:'文件读取失败，请重新选择。');}};
  return <Sheet title="设置" onClose={onClose}>
    <Section title="外观"><div className="segmented" role="group" aria-label="外观模式">{(['system','light','dark'] as const).map(t=><button key={t} aria-pressed={theme===t} className={theme===t?'selected':''} onClick={()=>setTheme(t)}>{t==='system'?'跟随系统':t==='light'?'浅色':'深色'}</button>)}</div>{themeError&&<Notice>{themeError}</Notice>}</Section>
    <div className="group"><label className="switch-row"><span>阶段提示音</span><input type="checkbox" role="switch" checked={data.profile?.sound||false} disabled={busy} onChange={e=>{const p=data.profile||defaultProfile();void perform(()=>service.saveProfile({...p,sound:e.target.checked,version:p.version+1,updatedAt:new Date().toISOString()}));}}/></label></div>
    <details className="disclosure"><summary>数据备份</summary><div className="group"><Row icon="download" title="导出备份" onClick={()=>void perform(async()=>{downloadJson(await service.backup(),`home-rower-backup-${localDate()}.json`);await service.markBackup();},'已发起备份下载。')}/><label className="list-row file-row"><Icon name="upload" size={21}/><span className="row-copy"><strong>导入备份</strong></span><input type="file" accept=".json,application/json" aria-label="选择 JSON 备份文件" disabled={busy||!!data.draft||!service.repository.persistent} onChange={e=>{void readFile(e.target.files?.[0]);e.target.value='';}}/></label></div><p className="caption">数据保存在本机。备份包含旧版记录，合并导入保留本机冲突。</p>{data.draft&&<p className="caption">完成或丢弃当前跟练后可导入。</p>}</details>
    <details className="disclosure"><summary>安装与版本</summary><p className="caption">划船机 {APP_VERSION} · {offlineReady?'可离线跟练':'离线资源准备中'}</p><p className="caption">Safari → 分享 → 添加到主屏幕</p>{updateAvailable&&<button className="secondary full" disabled={!!data.draft||busy} onClick={()=>void applyUpdate()}>更新应用版本</button>}</details>
    {preview&&<Sheet title="导入预览" onClose={()=>setPreview(null)}><Notice>合并导入保留已有数据与本机冲突。</Notice><div className="group"><Row title="计划 / 日程" right={`${preview.backup.counts.plans} / ${preview.backup.counts.scheduled}`}/><Row title="新增训练" right={String(importPreview(preview.backup,data).added)}/><Row title="重复 / 冲突" right={`${importPreview(preview.backup,data).duplicates} / ${importPreview(preview.backup,data).conflicts}`}/></div><button className="primary full" disabled={busy||!!data.draft} onClick={()=>void perform(async()=>{await service.importBackup(preview.backup,preview.revision);const verified=await service.repository.read();if(verified.schemaVersion!==2)throw new Error('导入核验失败，请保留备份。');},'备份已合并。').then(ok=>{if(ok)setPreview(null);})}>确认合并导入</button></Sheet>}
  </Sheet>;
}
