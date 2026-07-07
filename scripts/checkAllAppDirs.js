const fs=require('fs');const path=require('path');
function findDirs(dir){
  const out=[];
  for(const name of fs.readdirSync(dir)){
    const p=path.join(dir,name);
    try{ const s=fs.statSync(p); if(s.isDirectory()){ out.push(p); out.push(...findDirs(p)); } }catch(e){}
  }
  return out;
}
const root=process.cwd();
const dirs=findDirs(root).filter(d=>path.basename(d)==='app');
console.log('Found app dirs:', dirs.length);
for(const appDir of dirs){
  const pages=[];
  (function walk(dir){
    for(const name of fs.readdirSync(dir)){
      const p=path.join(dir,name);
      const s=fs.statSync(p);
      if(s.isDirectory()) walk(p);
      else if(name==='page.js') pages.push(p);
    }
  })(appDir);
  console.log('\nappDir:', appDir, 'pages:', pages.length);
  for(const page of pages){
    let dir=path.dirname(page);
    let found=false;
    while(true){ if(fs.existsSync(path.join(dir,'layout.js'))){ found=true; break; } if(path.resolve(dir)===path.resolve(appDir)) break; dir=path.dirname(dir);
    }
    console.log(page, 'hasAncestorLayout=', found);
  }
}
