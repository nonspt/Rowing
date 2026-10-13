import {useEffect,useState} from 'react';
export type Theme='system'|'light'|'dark';
export function useTheme() {
  const [theme,setTheme]=useState<Theme>(()=>{try{const saved=localStorage.getItem('home-rower-theme');return saved==='dark'||saved==='light'?saved:'system';}catch{return 'system';}});
  const [error,setError]=useState('');
  useEffect(()=>{const sync=(event:StorageEvent)=>{if(event.key==='home-rower-theme'||event.key===null){setTheme(event.newValue==='dark'||event.newValue==='light'?event.newValue:'system');setError('');}};window.addEventListener('storage',sync);return()=>window.removeEventListener('storage',sync);},[]);
  useEffect(()=>{const query=matchMedia('(prefers-color-scheme: dark)');const apply=()=>{const dark=theme==='dark'||(theme==='system'&&query.matches);document.documentElement.dataset.theme=dark?'dark':'light';document.documentElement.style.colorScheme=dark?'dark':'light';document.querySelector('meta[name="theme-color"]')?.setAttribute('content',dark?'#11151b':'#F2F2F7');};apply();query.addEventListener('change',apply);try{localStorage.setItem('home-rower-theme',theme);}catch{setError('主题只在本次打开生效，外观偏好暂未写入本机。');}return()=>query.removeEventListener('change',apply);},[theme]);
  return {theme,setTheme:(next:Theme)=>{setError('');setTheme(next);},error};
}
