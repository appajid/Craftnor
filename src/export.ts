import{withBackground,defaultBackground}from'./background';
import {svgDocument,type render} from './engine';
export type ExportFormat='svg'|'png'|'jpg';
export function rasterDimensions(viewBox:string,requestedWidth:number){
 const values=viewBox.trim().split(/\s+/).map(Number),ratio=values[2]/values[3];
 if(values.length!==4||!values.every(Number.isFinite)||values[2]<=0||values[3]<=0)throw Error('The artwork has invalid dimensions.');
 let width=Math.max(1,Math.min(8192,Math.round(Number.isFinite(requestedWidth)?requestedWidth:2400))),height=Math.max(1,Math.round(width/ratio));
 const scale=Math.min(1,8192/height,Math.sqrt(16000000/(width*height)));
 width=Math.max(1,Math.floor(width*scale));height=Math.max(1,Math.floor(height*scale));return {width,height};
}
export async function artworkBlob(art:ReturnType<typeof render>,format:ExportFormat,width=2400,background:string|null=null,quality=.95){
 const svg=svgDocument(background?withBackground(art,{...defaultBackground,mode:'color',color:background}):art);if(format==='svg')return new Blob([svg],{type:'image/svg+xml'});
 const size=rasterDimensions(art.viewBox,width),canvas=document.createElement('canvas');canvas.width=size.width;canvas.height=size.height;
 const context=canvas.getContext('2d');if(!context)throw Error('Image export is unavailable in this browser.');
 const source=URL.createObjectURL(new Blob([svg.replace('<svg ',`<svg width="${size.width}" height="${size.height}" `)],{type:'image/svg+xml'}));
 try{const image=new Image();image.src=source;await image.decode();if(background||format==='jpg'){context.fillStyle=background||'#ffffff';context.fillRect(0,0,size.width,size.height);}context.drawImage(image,0,0,size.width,size.height);
 return await new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(Error('Image encoding failed. Try a smaller width.')),format==='png'?'image/png':'image/jpeg',Math.max(.6,Math.min(1,quality))));
 }finally{URL.revokeObjectURL(source);canvas.width=0;canvas.height=0;}
}
export function downloadBlob(name:string,blob:Blob){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
