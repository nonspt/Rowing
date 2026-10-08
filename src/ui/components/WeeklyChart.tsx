export function WeeklyChart({minutes}:{minutes:number[]}) {
  const labels=['一','二','三','四','五','六','日'],max=Math.max(1,...minutes);
  return <svg className="weekly-chart" viewBox="0 0 350 108" role="img" aria-label={'本周每日训练分钟数：'+minutes.map((m,i)=>'周'+labels[i]+' '+m+' 分钟').join('，')}>
    {minutes.map((m,i)=>{const height=Math.max(3,m/max*50);return <g key={i}><rect x={i*49+17} y={70-height} width="18" height={height} rx="4" fill={m?'var(--accent)':'var(--line)'}/><text x={i*49+26} y="91" textAnchor="middle" fill="var(--secondary)" fontSize="13">{labels[i]}</text>{m>0&&<text x={i*49+26} y={62-height} textAnchor="middle" fill="var(--secondary)" fontSize="12">{m}</text>}</g>;})}
  </svg>;
}
