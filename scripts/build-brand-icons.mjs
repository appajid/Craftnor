import{readFile,writeFile}from'node:fs/promises';
import{Resvg}from'@resvg/resvg-js';
const source=await readFile(new URL('../public/branding/app-icon.svg',import.meta.url),'utf8');
for(const [file,width]of[['../desktop/resources/icon.png',1024],['../public/branding/app-icon-192.png',192]]){const png=new Resvg(source,{fitTo:{mode:'width',value:width}}).render().asPng();await writeFile(new URL(file,import.meta.url),png);}
console.log('Rendered supplied vector mark as Craftnor C icons.');

const documentSource=await readFile(new URL('../public/branding/document-icon.svg',import.meta.url),'utf8');for(const[file,width]of[['../desktop/resources/cfnr.png',1024],['../public/branding/document-icon-192.png',192]])await writeFile(new URL(file,import.meta.url),new Resvg(documentSource,{fitTo:{mode:'width',value:width}}).render().asPng());
