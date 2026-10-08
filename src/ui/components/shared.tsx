import type {ReactNode} from 'react';
import {Icon,type IconName} from './Icon.tsx';
export function Section({title,action,children}:{title:string;action?:ReactNode;children:ReactNode}){return <section className="section"><div className="section-title"><h2>{title}</h2>{action}</div>{children}</section>;}
export function Row({icon,title,subtitle,right,onClick}:{icon?:IconName;title:string;subtitle?:string;right?:ReactNode;onClick?:()=>void}) {
  const content=<>{icon&&<span className="row-icon"><Icon name={icon} size={21}/></span>}<span className="row-copy"><strong>{title}</strong>{subtitle&&<small>{subtitle}</small>}</span>{right&&<span className="row-value">{right}</span>}{onClick&&<Icon name="chevron" size={18}/>}</>;
  return onClick?<button className="list-row" type="button" onClick={onClick}>{content}</button>:<div className="list-row">{content}</div>;
}
export function Empty({title,description,children}:{title:string;description:string;children?:ReactNode}){return <div className="empty"><span className="empty-icon"><Icon name="row" size={32}/></span><h3>{title}</h3><p>{description}</p>{children}</div>;}
export function Notice({children,tone='normal'}:{children:ReactNode;tone?:'normal'|'error'|'warning'}){return <div className={`notice ${tone}`} role={tone==='error'?'alert':undefined}><Icon name="info" size={20}/><div>{children}</div></div>;}
