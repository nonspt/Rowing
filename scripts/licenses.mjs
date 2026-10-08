import fs from 'node:fs';
import path from 'node:path';
const packages=new Map(),base=path.resolve('node_modules/.pnpm'),lock=fs.readFileSync('pnpm-lock.yaml','utf8');
function inspect(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){if(entry.name.startsWith('.'))continue;const target=path.join(dir,entry.name);if(entry.name.startsWith('@')){inspect(target);continue;}const file=path.join(target,'package.json');if(!fs.existsSync(file))continue;const info=JSON.parse(fs.readFileSync(file,'utf8'));packages.set(`${info.name}@${info.version}`,info.license||'UNKNOWN');}}
for(const entry of fs.readdirSync(base,{withFileTypes:true})){const dir=path.join(base,entry.name,'node_modules');if(entry.isDirectory()&&fs.existsSync(dir))inspect(dir);}
const report=Object.fromEntries([...packages].filter(([key])=>lock.includes(`\n  ${key}:`)||lock.includes(`\n  '${key}':`)).sort());console.log(JSON.stringify(report,null,2));if(Object.values(report).includes('UNKNOWN'))process.exitCode=1;
