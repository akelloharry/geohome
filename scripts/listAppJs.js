const fs = require('fs');
const path = require('path');
function walk(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name);
    const stat=fs.statSync(p);
    if(stat.isDirectory()) out.push(...walk(p));
    else if(name.endsWith('.js')) out.push(p);
  }
  return out;
}
const root=path.join(process.cwd(),'app');
if(!fs.existsSync(root)){ console.log('no app dir'); process.exit(0); }
const files=walk(root);
console.log(files.join('\n'));
console.log('count',files.length);
