const fs = require('fs');
const path = require('path');
const root = path.join(process.cwd(),'app');
function findPages(dir){
  let results = [];
  const items = fs.readdirSync(dir,{withFileTypes:true});
  for(const it of items){
    const p = path.join(dir,it.name);
    if(it.isDirectory()) results = results.concat(findPages(p));
    else if(it.isFile() && it.name==='page.js') results.push(p);
  }
  return results;
}
if(!fs.existsSync(root)){
  console.log('No app dir found at', root); process.exit(0);
}
const pages = findPages(root);
console.log('Found pages:', pages.length);
for(const page of pages){
  let dir = path.dirname(page);
  let found=false;
  while(true){
    const layout = path.join(dir,'layout.js');
    if(fs.existsSync(layout)) { found=true; break; }
    if(path.resolve(dir)===path.resolve(root)) break;
    dir = path.dirname(dir);
  }
  console.log(page, 'hasLayoutInAncestors=', found);
}
