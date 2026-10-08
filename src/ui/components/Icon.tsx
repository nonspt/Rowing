const paths={
  today:'M12 3v2m0 14v2M3 12h2m14 0h2M5.6 5.6l1.4 1.4m10 10 1.4 1.4M5.6 18.4 7 17m10-10 1.4-1.4M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  train:'M7 5v14m10-14v14M4 8v8m16-8v8M7 12h10',
  learn:'M12 6C9 4 5 4 3 5v14c3-1 6-1 9 1m0-14c3-2 7-2 9-1v14c-3-1-6-1-9 1V6',
  history:'M5 4h14v17H5V4m3 5h8m-8 4h8m-8 4h5M8 2v4m8-4v4',
  settings:'M9 3h6l.5 2.1 1.8 1 2.2-.3L22 10l-1.6 1.5v1L22 14l-2.5 4.2-2.2-.3-1.8 1L15 21H9l-.5-2.1-1.8-1-2.2.3L2 14l1.6-1.5v-1L2 10l2.5-4.2 2.2.3 1.8-1L9 3m7 9a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  chevron:'m9 5 7 7-7 7', back:'m15 5-7 7 7 7', close:'m6 6 12 12M6 18 18 6',
  play:'m8 4 12 8-12 8V4',pause:'M8 5v14m8-14v14',check:'m4 12 5 5L20 6',
  clock:'M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  arrow:'M4 12h16m-6-6 6 6-6 6',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
  upload:'M12 15V3m-5 5 5-5 5 5M4 16v5h16v-5',
  plus:'M12 4v16M4 12h16',trash:'M3 6h18M9 3h6m-9 3 1 15h10l1-15M10 10v7m4-7v7',
  heart:'M12 20S3 15 3 9a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6-9 11-9 11',
  info:'M12 11v6m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
  row:'M13 4h.01m-1 4-4 4 4 4 5 2M8 12l-4 4m4-4h7l3 3M3 21h18',
  shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3m-4 9 3 3 5-6',
  offline:'m3 3 18 18M5 8c1-.7 2-1.2 3-1.5m5-.5c3 .2 5 1 8 3M7 12c3-2 7-2 10 0m-7 4c1-.7 3-.7 4 0m-2 4h.01',
};
export type IconName=keyof typeof paths;
export function Icon({name,size=24}:{name:IconName;size?:number}) {return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]}/></svg>;}
