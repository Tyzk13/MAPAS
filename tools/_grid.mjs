import sharp from 'sharp'; import fs from 'fs';
const [dir,out,cols='3']=process.argv.slice(2); const fs_=fs.readdirSync(dir).filter(f=>/\.(jpg|png)$/.test(f)).sort();
const W=640,H=360,C=+cols,R=Math.ceil(fs_.length/C); const comp=[];
for(let i=0;i<fs_.length;i++){comp.push({input:await sharp(dir+'/'+fs_[i]).resize(W,H).toBuffer(),left:(i%C)*W,top:Math.floor(i/C)*H});
comp.push({input:Buffer.from(`<svg width="${W}" height="22"><rect width="${W}" height="22" fill="black" opacity=".6"/><text x="4" y="16" font-size="14" fill="white">${fs_[i]}</text></svg>`),left:(i%C)*W,top:Math.floor(i/C)*H});}
await sharp({create:{width:C*W,height:R*H,channels:3,background:'#222'}}).composite(comp).jpeg({quality:85}).toFile(out);
