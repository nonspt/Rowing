import {useId,type ReactNode} from 'react';

export function PlanPanel({title,children,className='',detail}:{title:string;children:ReactNode;className?:string;detail?:ReactNode}){
  const id=useId();
  return <section className={`editor-panel plan-panel ${className}`} aria-labelledby={id}>
    <header className="plan-panel-header"><h3 id={id}>{title}</h3>{detail&&<span className="caption">{detail}</span>}</header>
    <div className="plan-panel-content" role="region" aria-label={title+'内容'} tabIndex={0}>{children}</div>
  </section>;
}
