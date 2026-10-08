import {useEffect,useRef,type ReactNode} from 'react';
import {Icon} from './Icon.tsx';
export function Sheet({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null), close=useRef(onClose); close.current=onClose;
  useEffect(()=>{const previous=document.activeElement as HTMLElement|null,dialog=ref.current!;dialog.showModal();const cancel=(e:Event)=>{e.preventDefault();close.current();};dialog.addEventListener('cancel',cancel);return()=>{dialog.removeEventListener('cancel',cancel);dialog.close();previous?.focus();};},[]);
  return <dialog ref={ref} className={`sheet ${wide?'wide':''}`} aria-label={title}><div className="sheet-handle"/><header className="sheet-header"><h2>{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label={`关闭${title}`}><Icon name="close"/></button></header><div className="sheet-content">{children}</div></dialog>;
}
