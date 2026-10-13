import {useState} from 'react';
import type {Snapshot} from '../../domain/types.ts';
import {downloadJson} from '../../adapters/download.ts';
import {localDate} from '../../domain/plans.ts';
import {useApp} from '../context.ts';
import {Sheet} from './Sheet.tsx';
import {Icon} from './Icon.tsx';

export function DataReset({onDeleted}:{onDeleted:()=>void}) {
  const {service,perform,busy,setTheme}=useApp();
  const [review,setReview]=useState<Snapshot|null>(null),[confirmed,setConfirmed]=useState(false);
  const inspect=()=>void perform(async()=>{setReview(await service.repository.read());setConfirmed(false);});
  const backup=()=>void perform(async()=>{
    downloadJson(await service.backup(),`home-rower-backup-${localDate()}.json`);
    await service.markBackup();
    setReview(await service.repository.read());setConfirmed(false);
  },'已发起备份下载，请确认文件已保存。');
  const remove=()=>{if(!review||!confirmed)return;void perform(async()=>{
    await service.deleteAllData(review.revision);
    setTheme('system');
  },'所有本机数据已删除。').then(ok=>{setConfirmed(false);if(ok){setReview(null);onDeleted();}});};
  return <section className="section data-reset"><div className="section-title"><h2>数据管理</h2></div>
    <div className="group"><button className="list-row danger" disabled={busy} onClick={inspect}><span className="row-icon"><Icon name="trash" size={21}/></span><span className="row-copy"><strong>删除所有数据</strong><small>清空本机计划、训练记录与偏好</small></span><Icon name="chevron" size={18}/></button></div>
    {review&&<Sheet title="删除所有数据" onClose={()=>{setReview(null);setConfirmed(false);}}>
      <p className="detail-lead">删除后无法撤销，可通过已导出的备份恢复。</p>
      <dl className="reset-counts"><div><dt>计划</dt><dd>{review.plans.length}</dd></div><div><dt>日程</dt><dd>{review.scheduled.length}</dd></div><div><dt>训练记录</dt><dd>{review.workouts.length}</dd></div></dl>
      <p className="caption">{review.draft?'未完成跟练、':''}旧版学习记录、声音和外观偏好也会清空。应用仍可离线使用。</p>
      <button className="secondary full" disabled={busy} onClick={backup}><Icon name="download" size={20}/>先导出备份</button>
      <label className="check-row"><input type="checkbox" checked={confirmed} disabled={busy} onChange={e=>setConfirmed(e.target.checked)}/><span>我已保存备份，或确认不需要保留这些数据</span></label>
      <div className="reset-actions"><button className="secondary" disabled={busy} onClick={()=>{setReview(null);setConfirmed(false);}}>取消</button><button className="primary destructive" disabled={!confirmed||busy} onClick={remove}>确认删除所有数据</button></div>
    </Sheet>}
  </section>;
}
