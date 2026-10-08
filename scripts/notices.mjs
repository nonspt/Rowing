import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),react=require.resolve('react/package.json'),dom=require.resolve('react-dom/package.json'),scheduler=createRequire(dom).resolve('scheduler/package.json');
const text=[['React',react],['React DOM',dom],['Scheduler',scheduler]].map(([name,file])=>`${name}\n${fs.readFileSync(path.join(path.dirname(file),'LICENSE'),'utf8')}`).join('\n\n---\n\n');
fs.writeFileSync('public/third-party-notices.txt',text);
