import fs from 'node:fs';
const files=fs.readdirSync('src',{recursive:true}).filter(f=>/\.(tsx|css)$/.test(f)),issues=[];
for(const file of files){const text=fs.readFileSync('src/'+file,'utf8');if(/<(?:img|canvas)\b/.test(text))issues.push(file+' raster/canvas in UI');if(/\p{Extended_Pictographic}/u.test(text))issues.push(file+' emoji');if(/@font-face|icon-font|fontawesome|material-icons/i.test(text))issues.push(file+' icon font');}
const icon=fs.readFileSync('src/ui/components/Icon.tsx','utf8');
for(const expected of ['viewBox="0 0 24 24"','stroke="currentColor"','strokeLinecap="round"','aria-hidden="true"'])if(!icon.includes(expected))issues.push('Icon missing '+expected);
if(!fs.readFileSync('scripts/generate-icons.mjs','utf8').includes("public/icon.svg"))issues.push('Install icons SVG source missing');
const report={date:new Date().toISOString(),inspectedSourceFiles:files.length,issues,svg:{navigationAndActions:'src/ui/components/Icon.tsx',rowing:'src/ui/components/RowingFigure.tsx',planProgress:'src/ui/pages/Plans.tsx',progress:'src/ui/pages/Session.tsx',disclosureChevron:'SVG mask token in app.css',installationSource:'public/icon.svg'},nativeElements:['HTML button / input / select / textarea / dialog / details / summary','CSS layout, surfaces, typography, switch track and knob'],platformRasterAssets:{reason:'Manifest and apple-touch-icon compatibility',source:'public/icon.svg',generator:'scripts/generate-icons.mjs',files:fs.readdirSync('public/icons')}};
fs.mkdirSync('test-results',{recursive:true});
fs.writeFileSync('test-results/svg-audit.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(issues.length)process.exitCode=1;
