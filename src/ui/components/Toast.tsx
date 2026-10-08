import {useLayoutEffect,useState} from 'react';
import {createPortal} from 'react-dom';
import {Icon} from './Icon.tsx';
export function Toast({message,onClose}:{message:string;onClose:()=>void}) {
  const [target,setTarget]=useState<HTMLElement>(document.body);
  // Native modal dialogs occupy the top layer. Put feedback inside the active
  // dialog so save errors remain visible and operable above its backdrop.
  useLayoutEffect(()=>{const dialogs=document.querySelectorAll<HTMLDialogElement>('dialog[open]');const next=dialogs[dialogs.length-1]||document.body;if(next!==target)setTarget(next);});
  return createPortal(<div className="toast" role="status"><span>{message}</span><button className="icon-button" aria-label="关闭提示" onClick={onClose}><Icon name="close" size={18}/></button></div>,target);
}
