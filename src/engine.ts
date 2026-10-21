import{foilSurfaces}from'./paperTextures';
import type{LayerSettings,LayerId}from'./studio';
import paper from 'paper/dist/paper-core.js';
import ClipperLib from 'clipper-lib';
export type Settings={text:string;font:string;weight:number;effect:string;depth:number;angle:number;outline:number;stripes:number;gap:number;taper:number;snow:number;wave:number;coverage:number;face:string;ink:string;inline:boolean;hatch:boolean;density:number;hatchWidth:number;hatchCount:number;hatchGraduation:number;extrude:boolean;slant:number;ribbonPosition:number;ribbonWidth:number;ribbonAmplitude:number;ribbonPeriod:number;dotRadius:number;dotSpacing:number;dotOffset:number;highlightWidth:number;highlightInset:number;highlightAngle:number;highlightCoverage:number;highlightTaper:number;textureAmount:number;textureSize:number;textureSeed:number;accent:string;halfSpacing:number;halfRadius:number;halfFade:number;halfAngle:number;toneDirection:number;fragmentSize:number;fragmentGap:number;fragmentShift:number;stencilWidth:number;stencilAngle:number;stencilCount:number;stencilSpacing:number;playfulGap:number;voltBorder:number;lightGlow:number;lightOffset:number;lightSparkles:number;bevelWidth:number;bevelStrength:number;shadowSize:number;shadowOpacity:number;foilImpression:'raised'|'engraved'|'pillow';foilPressure:number;foilGrain:number;pencilContour:number;sketchLines:number;sketchJitter:number;sketchWidth:number;colorStart:string;colorEnd:string;colorAngle:number;shapeTop:number;shapeBottom:number;shapeArc:number;shapeRotate:number;shapeSkew:number;shapeScaleX:number;shapeScaleY:number;shapeWave:number;shapeWaveLength:number;shapeBend:number;shapePerspective:number};
export const defaults:Settings={text:'Good Luck!',font:'serif',weight:800,effect:'decorative',depth:30,angle:135,outline:1.8,stripes:15,gap:3,taper:28,snow:13,wave:5,coverage:90,face:'#fffdf7',ink:'#161715',inline:true,hatch:true,density:7,hatchWidth:1,hatchCount:65,hatchGraduation:85,extrude:true,slant:0,ribbonPosition:82,ribbonWidth:4,ribbonAmplitude:2,ribbonPeriod:30,dotRadius:2.5,dotSpacing:32,dotOffset:7,highlightWidth:4,highlightInset:3,highlightAngle:225,highlightCoverage:65,highlightTaper:100,textureAmount:45,textureSize:1.4,textureSeed:24,accent:'#555b58',halfSpacing:7,halfRadius:3,halfFade:85,halfAngle:15,toneDirection:0,fragmentSize:55,fragmentGap:3,fragmentShift:7,stencilWidth:4,stencilAngle:90,stencilCount:2,stencilSpacing:28,playfulGap:3,voltBorder:6,lightGlow:14,lightOffset:5,lightSparkles:3,bevelWidth:5,bevelStrength:85,shadowSize:7,shadowOpacity:22,foilImpression:'engraved',foilPressure:65,foilGrain:55,pencilContour:60,sketchLines:85,sketchJitter:3,sketchWidth:.65,colorStart:'#ff687d',colorEnd:'#ffb135',colorAngle:110,shapeTop:0,shapeBottom:0,shapeArc:0,shapeRotate:0,shapeSkew:0,shapeScaleX:100,shapeScaleY:100,shapeWave:0,shapeWaveLength:160,shapeBend:0,shapePerspective:0};
export const scope=new paper.PaperScope();scope.setup(new scope.Size(1200,600));
function path(d:string){return new scope.CompoundPath({pathData:d,insert:false});}
function union(a:paper.PathItem,b:paper.PathItem){const c=a.unite(b,{insert:false});a.remove();b.remove();return c;}
function combine(items:paper.PathItem[]):paper.PathItem {if(!items.length)return path('');while(items.length>1){const next:paper.PathItem[]=[];for(let i=0;i<items.length;i+=2)next.push(items[i+1]?union(items[i],items[i+1]):items[i]);items=next;}return items[0];}
export function shapeText(hb:any,data:ArrayBuffer,text:string,weight=800){
 const blob=hb.createBlob(new Uint8Array(data)),face=hb.createFace(blob,0),font=hb.createFont(face),buffer=hb.createBuffer();
 try{font.setScale(face.upem,face.upem);font.setVariations({wght:weight});buffer.addText(text);buffer.guessSegmentProperties();hb.shape(font,buffer);const glyphs=buffer.json();let x=0,y=0;const items:paper.PathItem[]=[];const stencilGroups=new Map<number|string,{paths:string[];body:paper.Rectangle;area:number}>();
 // Anusvara is shaped in the preceding cluster, but its visible ring needs its own bridge.
 const sunnaGlyphs=new Set<number>();if(text.includes("\u0c02")){const probe=hb.createBuffer();try{probe.addText("\u0c02");probe.guessSegmentProperties();hb.shape(font,probe);const marks=probe.json();const mark=marks.at(-1);if(mark?.g)sunnaGlyphs.add(mark.g);}finally{probe.destroy();}}
 let glyphIndex=0;for(const g of glyphs){const groupKey=sunnaGlyphs.has(g.g)?`sunna-${glyphIndex}`:g.cl;glyphIndex++;const d=font.glyphToPath(g.g);if(d){const p=path(d);p.scale(1,-1,new scope.Point(0,0));p.translate(new scope.Point(x+g.dx,y-g.dy));items.push(p);const body=contours(p).reduce((best,c)=>Math.abs(c.area)>Math.abs(best.area)?c:best,contours(p)[0]);if(body){const cluster=stencilGroups.get(groupKey)||{paths:[],body:body.bounds.clone(),area:0};cluster.paths.push(p.pathData);if(Math.abs(body.area)>cluster.area){cluster.body=body.bounds.clone();cluster.area=Math.abs(body.area);}stencilGroups.set(groupKey,cluster);}}x+=g.ax;y-=g.ay;}
 const result=combine(items);if(result.bounds.height>0){const scale=180/result.bounds.height;result.scale(scale,new scope.Point(0,0));const offset=new scope.Point(-result.bounds.left,-result.bounds.top);result.translate(offset);result.data.stencilGroups=[...stencilGroups.values()].map(group=>{const glyph=path(group.paths.join(' '));glyph.scale(scale,new scope.Point(0,0));glyph.translate(offset);const body=new scope.Rectangle(group.body.topLeft.multiply(scale).add(offset),group.body.size.multiply(scale));const value={pathData:glyph.pathData,center:[body.center.x,body.center.y]};glyph.remove();return value;});}
 return {item:result,missing:glyphs.some((g:any)=>g.g===0),glyphs:glyphs.length};
 }finally{buffer.destroy();font.destroy();face.destroy();blob.destroy();}
}
function contours(item:paper.PathItem):paper.Path[]{return item instanceof scope.Path?[item as paper.Path]:((item as paper.CompoundPath).children as paper.Path[]);}
// Integer polygon clipping avoids whole-contour loss on tangent glyph curves.
// Curves are sampled at 0.08 artwork units; the source outlines stay untouched.
export function vectorBoolean(a:paper.PathItem,b:paper.PathItem,operation:'intersect'|'subtract'){
 const scale=10000;
 const paths=(item:paper.PathItem)=>{const copy=item.clone({insert:false});try{return contours(copy).map(c=>{c.flatten(.08);return c.segments.map(s=>({X:Math.round(s.point.x*scale),Y:Math.round(s.point.y*scale)}));}).filter(p=>p.length>=3);}finally{copy.remove();}};
 const clipper=new ClipperLib.Clipper();clipper.AddPaths(paths(a),ClipperLib.PolyType.ptSubject,true);clipper.AddPaths(paths(b),ClipperLib.PolyType.ptClip,true);
 const solution:ClipperLib.Paths=[];clipper.Execute(operation==='intersect'?ClipperLib.ClipType.ctIntersection:ClipperLib.ClipType.ctDifference,solution,a.fillRule==='evenodd'?ClipperLib.PolyFillType.pftEvenOdd:ClipperLib.PolyFillType.pftNonZero,b.fillRule==='evenodd'?ClipperLib.PolyFillType.pftEvenOdd:ClipperLib.PolyFillType.pftNonZero);
 return new scope.CompoundPath({children:solution.map(points=>new scope.Path({segments:points.map(p=>new scope.Point(p.X/scale,p.Y/scale)),closed:true,insert:false})),insert:false});
}
export const sculptedEffects=['colorVolt','colorLight','colorSculpt','colorEmboss','colorMinty','colorStylish','colorEnamel'];
// Sixteen directional intersections erode filled geometry, expanding counters as well as shrinking outer edges.
export function insetGeometry(base:paper.PathItem,distance:number){
 let result=base.clone({insert:false});if(distance<=0)return result;
 for(let i=0;i<16&&!result.isEmpty();i++){const shifted=base.clone({insert:false});shifted.translate(new scope.Point({angle:i*22.5,length:distance}));const next=vectorBoolean(result,shifted,'intersect');result.remove();shifted.remove();result=next;}return result;
}
export function bevelGeometry(base:paper.PathItem,width:number,lightAngle:number){
 const inner=insetGeometry(base,Math.max(0,width));const rim=vectorBoolean(base,inner,'subtract');
 const shifted=base.clone({insert:false});shifted.translate(new scope.Point({angle:lightAngle+180,length:Math.max(.1,width*.8)}));
 const edge=vectorBoolean(base,shifted,'subtract'),light=vectorBoolean(edge,rim,'intersect');edge.remove();shifted.remove();
 const opposite=base.clone({insert:false});opposite.translate(new scope.Point({angle:lightAngle,length:Math.max(.1,width*.65)}));
 const darkEdge=vectorBoolean(base,opposite,'subtract'),dark=vectorBoolean(darkEdge,rim,'intersect');darkEdge.remove();opposite.remove();
 return {inner,rim,light,dark};
}
export function sweep(item:paper.PathItem,depth:number,angle:number){
 if(depth<=0)return item.clone({insert:false});const delta=new scope.Point({length:depth,angle});const pieces:paper.PathItem[]=[item.clone({insert:false})];
 const flat=item.clone({insert:false});for(const c of contours(flat)){c.flatten(.65);const pts=c.segments.map(s=>s.point);for(let i=0;i<pts.length;i++){const a=pts[i],b=pts[(i+1)%pts.length];if(Math.abs(b.subtract(a).cross(delta))<.001)continue;const q=new scope.Path({segments:[a,b,b.add(delta),a.add(delta)],closed:true,insert:false});q.clockwise=true;pieces.push(q);}}
 const back=item.clone({insert:false});back.translate(delta);pieces.push(back);flat.remove();return combine(pieces);
}
function speed(base:paper.PathItem,s:Settings){const b=base.bounds;const items:paper.PathItem[]=[];const pitch=b.height/s.stripes;
 for(let i=0;i<s.stripes;i++){const y=b.top+i*pitch,h=Math.max(.5,pitch-s.gap);const band=new scope.Path.Rectangle({rectangle:new scope.Rectangle(b.left-2,y,b.width+4,h),insert:false});const cut=vectorBoolean(base,band,'intersect');band.remove();if(!cut.isEmpty()){const pieces=contours(cut);for(const c of pieces){if(!c.clockwise)continue;const r=c.bounds;const tail=new scope.Path({segments:[[r.left-s.taper,y+h*.8],[r.left+Math.min(s.taper,r.width*.4),y],[r.left+Math.min(s.taper,r.width*.4),y+h]],closed:true,insert:false});const clipped=vectorBoolean(tail,base,'subtract');items.push(clipped);tail.remove();}items.push(cut);}else cut.remove();}return combine(items);
}
function snowCaps(base:paper.PathItem,s:Settings){const b=base.bounds;const bands:paper.PathItem[]=[];let top:paper.Point[]=[],bottom:paper.Point[]=[];
 const flush=()=>{if(top.length>1){const p=new scope.Path({segments:[...top,...bottom.reverse()],closed:true,insert:false});p.simplify(1);bands.push(p);}top=[];bottom=[];};
 for(let x=b.left;x<=b.right+2;x+=3){const line=new scope.Path.Line({from:[x,b.top-5],to:[x,b.bottom+5],insert:false});const hits=base.getIntersections(line).sort((a,b)=>a.point.y-b.point.y);line.remove();const selected=hits.length&&((x-b.left)/Math.max(1,b.width)*100<=s.coverage);if(!selected){flush();continue;}const y=hits[0].point.y; if(top.length&&Math.abs(y-bottom[bottom.length-1].y)>s.snow*3)flush();const wobble=Math.sin(x*.16)*s.wave*.55+Math.sin(x*.37)*s.wave*.3;top.push(new scope.Point(x,y-s.snow*.65+wobble));bottom.push(new scope.Point(x,y+s.snow*.65+wobble));}flush();return combine(bands);
}
export function ribbonCutouts(base:paper.PathItem,s:Settings){
 const b=base.bounds,center=b.top+b.height*s.ribbonPosition/100,period=Math.max(8,s.ribbonPeriod),amplitude=Math.max(0,s.ribbonAmplitude),width=Math.max(.5,s.ribbonWidth);const top:paper.Point[]=[],bottom:paper.Point[]=[];
 for(let x=b.left-4;x<=b.right+4;x+=1){const y=center+Math.sin((x-b.left)/period*Math.PI*2)*amplitude;top.push(new scope.Point(x,y-width/2));bottom.push(new scope.Point(x,y+width/2));}
 const wave=new scope.Path({segments:[...top,...bottom.reverse()],closed:true,insert:false});wave.simplify(.15);const cuts:paper.PathItem[]=[wave];const spacing=Math.max(8,s.dotSpacing);
 if(s.dotRadius>0)for(let x=b.left+spacing*.3;x<b.right;x+=spacing){cuts.push(new scope.Path.Circle({center:[x,center-s.dotOffset],radius:s.dotRadius,insert:false}));cuts.push(new scope.Path.Circle({center:[x+spacing/2,center+s.dotOffset],radius:s.dotRadius,insert:false}));}
 const all=combine(cuts),result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
export function contourHighlights(base:paper.PathItem,s:Settings){
 const light=new scope.Point({length:1,angle:s.highlightAngle}),threshold=1-Math.max(10,Math.min(95,s.highlightCoverage))/100;const cuts:paper.PathItem[]=[];
 type Sample={p:paper.Point;n:paper.Point;strength:number};
 for(const c of contours(base)){if(c.length<8)continue;const count=Math.max(12,Math.ceil(c.length/1.5));const samples:Sample[]=[];let darkest=0;
 for(let i=0;i<count;i++){const at=c.length*i/count,p=c.getPointAt(at),n=c.getNormalAt(at);if(!p||!n)continue;const strength=n.dot(light);samples.push({p,n,strength});if(strength<samples[darkest].strength)darkest=samples.length-1;}
 let run:Sample[]=[];const flush=()=>{if(run.length<4){run=[];return;}const outer:paper.Point[]=[],inner:paper.Point[]=[];for(let i=0;i<run.length;i++){const a=run[i],fade=Math.pow(Math.max(0,Math.sin(Math.PI*i/(run.length-1))),s.highlightTaper/100);const width=s.highlightWidth*Math.max(0,(a.strength-threshold)/(1-threshold))*fade;outer.push(a.p.subtract(a.n.multiply(s.highlightInset)));inner.push(a.p.subtract(a.n.multiply(s.highlightInset+width)));}const ribbon=new scope.Path({segments:[...outer,...inner.reverse()],closed:true,insert:false});ribbon.simplify(.2);cuts.push(ribbon);run=[];};
 for(let i=0;i<samples.length;i++){const a=samples[(darkest+i)%samples.length];if(a.strength>threshold)run.push(a);else flush();}flush();}
 const all=combine(cuts),result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
function seeded(seed:number){let n=Math.round(seed)|0;return()=>{n=(Math.imul(1664525,n)+1013904223)|0;return(n>>>0)/4294967296;};}
function looseCompound(items:paper.PathItem[]){const compound=new scope.CompoundPath({insert:false});for(const item of items){if(item instanceof scope.Path)compound.addChild(item);else{for(const c of [...(item as paper.CompoundPath).children])compound.addChild(c);item.remove();}}return compound;}
export function distressCuts(base:paper.PathItem,s:Settings,clip=true){
 const rand=seeded(s.textureSeed),b=base.bounds,cuts:paper.PathItem[]=[];if(s.textureAmount<=0)return path('');const amount=Math.min(100,Math.max(0,s.textureAmount));const budget=Math.min(2500,Math.round(amount*12*Math.sqrt(b.width/Math.max(1,b.height))));
 for(let i=0;i<budget;i++){const center=new scope.Point(b.left+rand()*b.width,b.top+rand()*b.height);if(!base.contains(center))continue;if(s.effect==='rust'&&center.y<b.center.y&&rand()>.25)continue;const radius=Math.max(.1,s.textureSize)*(.25+rand()*1.3);const pts:paper.Point[]=[];for(let j=0;j<6;j++)pts.push(center.add(new scope.Point({angle:j*60,length:radius*(.5+rand())})));const chip=new scope.Path({segments:pts,closed:true,insert:false});chip.clockwise=true;if(rand()<.12)chip.scale(3,.35,center);cuts.push(chip);}
 for(const c of contours(base)){const step=Math.max(4,120/(amount+1));for(let at=0;at<c.length;at+=step){if(rand()>.23)continue;const pt=c.getPointAt(at);if(pt)cuts.push(new scope.Path.Circle({center:pt,radius:s.textureSize*(.25+rand()),insert:false}));}}
 const all=looseCompound(cuts);if(!clip)return all;const result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
export function stencilCutouts(base:paper.PathItem,s:Settings){
 const cuts:paper.PathItem[]=[],angle=s.stencilAngle*Math.PI/180,direction=new scope.Point(Math.cos(angle),Math.sin(angle)),cross=new scope.Point(-direction.y,direction.x),width=Math.max(.5,s.stencilWidth),count=Math.round(Math.max(1,Math.min(12,s.stencilCount))),spacing=Math.max(2,Math.min(100,s.stencilSpacing));
 const groups: {item:paper.PathItem;center:paper.Point;owned:boolean}[]=Array.isArray(base.data?.stencilGroups)?base.data.stencilGroups.map((g:{pathData:string;center:[number,number]})=>{const item=path(g.pathData),center=new scope.Point(g.center);if(s.slant){item.shear(-s.slant/100,0,new scope.Point(0,180));center.x-=(center.y-180)*s.slant/100;}return{item,center,owned:true};}):contours(base).filter(c=>c.clockwise&&c.bounds.width>=1&&c.bounds.height>=1).map(item=>({item,center:item.bounds.center,owned:false}));
 for(const group of groups){const {item,center}=group,length=item.bounds.width+item.bounds.height+20;
  for(let i=0;i<count;i++){const origin=center.add(cross.multiply((i-(count-1)/2)*spacing)),a=origin.subtract(direction.multiply(length)),b=origin.add(direction.multiply(length));const strip=new scope.Path({segments:[a.subtract(cross.multiply(width/2)),a.add(cross.multiply(width/2)),b.add(cross.multiply(width/2)),b.subtract(cross.multiply(width/2))],closed:true,insert:false});const clipped=vectorBoolean(strip,item,'intersect');strip.remove();if(clipped.isEmpty())clipped.remove();else cuts.push(clipped);}
  if(group.owned)item.remove();
 }
 const all=combine(cuts),result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
export function shatterFace(base:paper.PathItem,s:Settings){
 if(s.fragmentGap===0&&s.fragmentShift===0)return base.clone({insert:false});
 const rand=seeded(s.textureSeed),b=base.bounds,size=Math.max(15,s.fragmentSize,Math.sqrt(b.width*b.height/400)),cols=Math.max(1,Math.ceil(b.width/size)),rows=Math.max(1,Math.ceil(b.height/size)),dx=(b.width+4)/cols,dy=(b.height+4)/rows;const nodes:paper.Point[][]=[];for(let y=0;y<=rows;y++){nodes[y]=[];for(let x=0;x<=cols;x++)nodes[y][x]=new scope.Point(b.left-2+x*dx+(x>0&&x<cols?(rand()-.5)*dx*.5:0),b.top-2+y*dy+(y>0&&y<rows?(rand()-.5)*dy*.45:0));}
 const shards:paper.PathItem[]=[];for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const a=nodes[y][x],bb=nodes[y][x+1],c=nodes[y+1][x+1],d=nodes[y+1][x];const triangles=(x+y)%2?[[a,bb,d],[bb,c,d]]:[[a,bb,c],[a,c,d]];for(const pts of triangles){const triangle=new scope.Path({segments:pts,closed:true,insert:false});const shard=vectorBoolean(base,triangle,'intersect');triangle.remove();if(shard.isEmpty()){shard.remove();continue;}const center=shard.bounds.center;const scale=Math.max(.55,1-Math.max(0,s.fragmentGap)/Math.max(5,Math.min(dx,dy)));shard.scale(scale,center);shard.translate(center.subtract(b.center).normalize(s.fragmentShift*.7).add(new scope.Point((rand()-.5)*s.fragmentShift,(rand()-.5)*s.fragmentShift)));shards.push(shard);}}
 return combine(shards);
}
export function halftoneDots(base:paper.PathItem,s:Settings){
 const b=base.bounds,grid=base.bounds.clone();const corners=[grid.topLeft,grid.topRight,grid.bottomRight,grid.bottomLeft].map(p=>p.rotate(-s.halfAngle,b.center));let limits=new scope.Rectangle(corners[0],corners[0]);for(const p of corners)limits=limits.include(p);const spacing=Math.max(3,s.halfSpacing,Math.sqrt(limits.area/6500)),radius=Math.min(spacing*.49,Math.max(.2,s.halfRadius)),direction=new scope.Point({length:1,angle:s.toneDirection});const projection=[b.topLeft,b.topRight,b.bottomRight,b.bottomLeft].map(p=>p.dot(direction)),lo=Math.min(...projection),hi=Math.max(...projection);const dots:paper.PathItem[]=[];
 for(let y=limits.top-spacing;y<=limits.bottom+spacing;y+=spacing)for(let x=limits.left-spacing;x<=limits.right+spacing;x+=spacing){const center=new scope.Point(x,y).rotate(s.halfAngle,b.center);const t=Math.max(0,Math.min(1,(center.dot(direction)-lo)/Math.max(1,hi-lo)));const r=radius*(1-Math.max(0,Math.min(100,s.halfFade))/100*(1-t));if(r<.08)continue;dots.push(new scope.Path.Circle({center,radius:r,insert:false}));}
 const all=looseCompound(dots),result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
export function pencilSketchMarks(base:paper.PathItem,s:Settings){
 const rand=seeded(s.textureSeed),b=base.bounds,marks:paper.PathItem[]=[];
 const longStroke=['sketchRocks','colorSketchRed'].includes(s.effect),chunks=longStroke?3:8;
 const height=Math.max(1,b.height),offset=height*(longStroke?1.35:.8),pitch=height/Math.max(15,Math.min(200,s.sketchLines));
 const count=Math.min(1000,Math.ceil((b.width+offset)/pitch));
 for(let i=0;i<count;i++)for(let j=0;j<chunks;j++){
  if(rand()<.08)continue;
  const t=Math.max(0,(j+rand()*.95-.3)/chunks),end=Math.min(1,t+(.7+rand()*.7)/chunks),x=b.left-offset+i*pitch;
  const a=new scope.Point(x+offset*t+(rand()-.5)*s.sketchJitter,height*(1-t)+b.top),z=new scope.Point(x+offset*end+(rand()-.5)*s.sketchJitter,height*(1-end)+b.top);
  const center=a.add(z).divide(2).add([(rand()-.5)*s.sketchJitter,0]),normal=z.subtract(a).rotate(90,new scope.Point(0,0)).normalize(s.sketchWidth*(.45+rand()*.8));
  const stroke=new scope.Path({segments:longStroke?[a.add(normal.multiply(.25)),center.add(normal),z.add(normal.multiply(.15)),z.subtract(normal.multiply(.15)),center.subtract(normal),a.subtract(normal.multiply(.25))]:[a,center.add(normal),z,center.subtract(normal)],closed:true,insert:false});stroke.clockwise=true;marks.push(stroke);
 }
 const clipped:paper.PathItem[]=[];for(let i=0;i<marks.length;i+=64){const batch=looseCompound(marks.slice(i,i+64));clipped.push(vectorBoolean(batch,base,'intersect'));batch.remove();}return looseCompound(clipped);
}
export function pencilSketchContours(base:paper.PathItem,s:Settings){
 const marks:paper.PathItem[]=[],strength=Math.max(0,Math.min(100,s.pencilContour))/100;
 if(!strength)return looseCompound(marks);
 const rand=seeded(s.textureSeed+773);
 for(const contour of contours(base))for(let pass=0;pass<2;pass++){
  const step=Math.max(3,contour.length/1800);
  for(let at=0;at<contour.length;at+=step*(.8+rand()*.6)){
   if(rand()>.7*strength+.15)continue;
   const a=contour.getPointAt(at),z=contour.getPointAt(Math.min(contour.length,at+step*(.6+rand()*.9))),n=contour.getNormalAt(at);
   if(!a||!z||!n)continue;
   const shift=n.multiply((pass?1:-1)*(.4+s.sketchJitter*.12)+(rand()-.5)*s.sketchJitter*.3),width=n.multiply((.15+s.sketchWidth*.6)*strength);
   const stroke=new scope.Path({segments:[a.add(shift),a.add(z).divide(2).add(shift).add(width),z.add(shift),a.add(z).divide(2).add(shift).subtract(width)],closed:true,insert:false});stroke.clockwise=true;marks.push(stroke);
  }
 }
 return looseCompound(marks);
}
export function pencilMarks(base:paper.PathItem,s:Settings){
 const rand=seeded(s.textureSeed),b=base.bounds,marks:paper.PathItem[]=[];
 const lines=Math.round(Math.max(15,Math.min(200,s.sketchLines))),offset=b.height*.65;
 for(let i=0;i<lines;i++){const x=b.left-offset+(b.width+offset)*(i+.5)/lines;
 for(let j=0;j<3;j++){const t0=j/3+rand()*.03,t1=Math.min(1,(j+1)/3-rand()*.04),jitter=(rand()-.5)*s.sketchJitter;
 const a=new scope.Point(x+offset*t0+jitter,b.bottom-b.height*t0),z=new scope.Point(x+offset*t1+jitter+(rand()-.5)*s.sketchJitter,b.bottom-b.height*t1),mid=a.add(z).divide(2).add([(rand()-.5)*s.sketchJitter,0]);
 const n=z.subtract(a).rotate(90,new scope.Point(0,0)).normalize(s.sketchWidth*(.2+rand()*.65));
 const line=new scope.Path({segments:[a,mid.add(n),z,mid.subtract(n)],closed:true,insert:false});line.clockwise=true;marks.push(line);
 }}
 const all=looseCompound(marks),result=vectorBoolean(all,base,'intersect');all.remove();return result;
}
export function sketchMarks(base:paper.PathItem,s:Settings){
 const rand=seeded(s.textureSeed),b=base.bounds,marks:paper.PathItem[]=[];const lines=Math.round(Math.max(15,Math.min(200,s.sketchLines))),width=Math.max(.1,s.sketchWidth);
 for(const angle of [55,125]){const radians=angle*Math.PI/180,offset=b.height/Math.tan(radians),start=b.left-Math.abs(offset)-5,end=b.right+Math.abs(offset)+5;for(let i=0;i<lines;i++){const x=start+(end-start)*(i+.5)/lines+(rand()-.5)*s.sketchJitter;const a=new scope.Point(x,b.bottom+3),bb=new scope.Point(x+offset,b.top-3),n=bb.subtract(a).rotate(90,new scope.Point(0,0)).normalize(width/2);const line=new scope.Path({segments:[a.subtract(n),a.add(n),bb.add(n),bb.subtract(n)],closed:true,insert:false});const cut=vectorBoolean(line,base,'intersect');line.remove();marks.push(cut);}}
 for(const c of contours(base))for(let at=0;at<c.length;at+=6+rand()*6){if(rand()>.65)continue;const point=c.getPointAt(at),normal=c.getNormalAt(at);if(!point||!normal)continue;const tangent=normal.rotate(65,new scope.Point(0,0));const a=point.subtract(tangent.multiply(3+s.sketchJitter*rand())),bb=point.add(tangent.multiply(3+s.sketchJitter*rand())),n=tangent.rotate(90,new scope.Point(0,0)).normalize(width/2);const tick=new scope.Path({segments:[a.subtract(n),a.add(n),bb.add(n),bb.subtract(n)],closed:true,insert:false});tick.clockwise=true;marks.push(tick);}
 return looseCompound(marks);
}
function rustShade(base:paper.PathItem){const b=base.bounds;const points:paper.Point[]=[];for(let x=b.left-2;x<=b.right+4;x+=4)points.push(new scope.Point(x,b.center.y+Math.sin(x*.09)*3-(x-b.center.x)*.13));points.push(b.bottomRight.add([4,4]),b.bottomLeft.add([-4,4]));const region=new scope.Path({segments:points,closed:true,insert:false}),shade=vectorBoolean(region,base,'intersect');region.remove();return shade;}
export function manipulateShapes(items:paper.PathItem[],s:Settings){
 if(!items.length)return;let bounds=items[0].bounds.clone();for(const item of items)bounds=bounds.unite(item.bounds);const center=bounds.center;
 if(s.shapeWave||s.shapeBend||s.shapePerspective||s.shapeTop||s.shapeBottom||s.shapeArc){for(const item of items)for(const contour of contours(item)){contour.flatten(.55);const samples:paper.Point[]=[];const vertices=contour.segments.map(segment=>segment.point.clone());for(let i=0;i<vertices.length;i++){const from=vertices[i],to=vertices[(i+1)%vertices.length];samples.push(from);if(contour.closed||i<vertices.length-1){const count=Math.ceil(from.getDistance(to)/3);for(let j=1;j<count;j++)samples.push(from.add(to.subtract(from).multiply(j/count)));}}contour.removeSegments();contour.addSegments(samples.map(point=>new scope.Segment(point)));for(const segment of contour.segments){const p=segment.point.clone(),t=(p.x-bounds.left)/Math.max(1,bounds.width),v=(p.y-bounds.top)/Math.max(1,bounds.height);let x=center.x+(p.x-center.x)*(1+(v-.5)*s.shapePerspective/100);let y=p.y+Math.sin((p.x-bounds.left)/Math.max(40,s.shapeWaveLength)*Math.PI*2)*s.shapeWave-s.shapeBend*4*t*(1-t);y+=bounds.height*4*t*(1-t)*(-s.shapeTop*(1-v)+s.shapeBottom*v)/100;if(s.shapeArc){const sweep=s.shapeArc*Math.PI/180,r=Math.max(bounds.width/Math.abs(sweep),bounds.height*.65),theta=(x-center.x)/Math.max(1,bounds.width)*sweep,sign=Math.sign(sweep),radial=r-sign*(y-center.y);x=center.x+radial*Math.sin(theta)*sign;y=center.y+sign*(r-radial*Math.cos(theta));}segment.point=new scope.Point(x,y);}}}
 for(const item of items){if(s.shapeSkew)item.shear(-s.shapeSkew/100,0,center);if(s.shapeScaleX!==100||s.shapeScaleY!==100)item.scale(s.shapeScaleX/100,s.shapeScaleY/100,center);if(s.shapeRotate)item.rotate(s.shapeRotate,center);}
}
export function mixColor(a:string,b:string,t:number){const channel=(i:number)=>Math.round(parseInt(a.slice(i,i+2),16)*(1-t)+parseInt(b.slice(i,i+2),16)*t).toString(16).padStart(2,'0');return '#'+[1,3,5].map(channel).join('');}
export function horizontalEngraving(base:paper.PathItem,count:number,width:number){const b=base.bounds,strips:paper.PathItem[]=[];for(let i=0;i<Math.round(count);i++)strips.push(new scope.Path.Rectangle({rectangle:new scope.Rectangle(b.left,b.top+(i+.5)*b.height/Math.max(1,count),b.width,width),insert:false}));const all=looseCompound(strips),clipped=vectorBoolean(all,base,'intersect');all.remove();return clipped;}
// Keep engraving clear of the continuous border, including around counters.
export function eenaduEngraving(base:paper.PathItem,s:Settings){
 const inset=insetGeometry(base,Math.max(0,s.highlightInset)),b=base.bounds;
 const run=b.height/Math.tan(Math.max(15,Math.min(75,s.halfAngle))*Math.PI/180);
 const count=Math.round(Math.max(5,Math.min(300,s.hatchCount))),pitch=(b.width+run+8)/count;
 const width=Math.max(.2,Math.min(20,s.hatchWidth))/Math.sin(Math.max(15,Math.min(75,s.halfAngle))*Math.PI/180);
 const strips:paper.PathItem[]=[];
 for(let i=0;i<count;i++){const x=b.left-run-4+(i+.5)*pitch;strips.push(new scope.Path({segments:[[x-width/2,b.bottom],[x+width/2,b.bottom],[x+run+width/2,b.top],[x+run-width/2,b.top]],closed:true,insert:false}));}
 const all=looseCompound(strips),result=vectorBoolean(all,inset,'intersect');all.remove();inset.remove();return result;
}
// Fine anisotropic foil wrinkles: clipped filled paths, not rasterized lettering.
function foilMicrograin(base:paper.PathItem,s:Settings){const b=base.bounds,rand=seeded(s.textureSeed),parts:paper.PathItem[]=[];const count=Math.min(1800,Math.round(b.area*s.foilGrain/12000));for(let i=0;i<count;i++){const x=b.left+rand()*b.width,y=b.top+rand()*b.height,len=.4+rand()*3.5,width=.05+rand()*.18;parts.push(new scope.Path({segments:[[x,y],[x+len,y+(rand()-.5)*.6],[x+len*.8,y+width],[x,y+width]],closed:true,insert:false}));}const marks=combine(parts),result=vectorBoolean(marks,base,'intersect');marks.remove();return result;}
export function render(base:paper.PathItem,s:Settings,options?:LayerSettings){const foil=['colorGoldFoil','colorSilverFoil'].includes(s.effect);const silverFoil=s.effect==='colorSilverFoil';if(foil)s={...s,outline:0,highlightAngle:s.foilImpression==='engraved'?(s.highlightAngle+180)%360:s.highlightAngle};const raisedMetal=['colorGold3d','colorSilver3d','colorGoldFoil','colorSilverFoil'].includes(s.effect),neonGlow=s.effect==='colorNeonGlow';if(raisedMetal)s={...s,effect:s.effect.includes('Silver')?'colorSilver':'colorGold'};if(neonGlow)s={...s,effect:'colorNeon'};let face=base.clone({insert:false});if(s.slant)face.shear(-s.slant/100,0,new scope.Point(0,180));if(s.effect==='speed'){const next=speed(face,s);face.remove();face=next;}
 if(s.effect==='ribbon'||s.effect==='shine'){const cuts=s.effect==='ribbon'?ribbonCutouts(face,s):contourHighlights(face,s);const next=vectorBoolean(face,cuts,'subtract');face.remove();cuts.remove();face=next;}
 if(['stencil','grungeStencil'].includes(s.effect)){const cuts=stencilCutouts(face,s),next=vectorBoolean(face,cuts,'subtract');face.remove();cuts.remove();face=next;}
 if(['rust','grungeStencil','colorSponge'].includes(s.effect)){const cuts=distressCuts(face,s,false),next=vectorBoolean(face,cuts,'subtract');face.remove();cuts.remove();face=next;}
 if(s.effect==='shatter'){const next=shatterFace(face,s);face.remove();face=next;}
 const layers:{item:paper.PathItem;fill:string;stroke?:string;width?:number;opacity?:number}[]=[];
 const sculpted=raisedMetal||sculptedEffects.includes(s.effect);
 if(foil&&s.foilPressure>0){const pressure=s.foilPressure/100;for(const [color,angle,opacity] of [['#000000',s.highlightAngle+180,.24],['#ffffff',s.highlightAngle,.65]] as [string,number,number][]){const press=face.clone({insert:false});press.translate(new scope.Point({angle,length:.3+pressure*.9}));layers.push({item:press,fill:color,stroke:color,width:pressure*.7,opacity:opacity*pressure});}}
 if(s.effect==='colorLight'&&s.lightGlow>0){const silhouette=s.extrude&&s.depth>0?sweep(face,s.depth,s.angle):face.clone({insert:false});for(let i=8;i>=1;i--)layers.push({item:silhouette.clone({insert:false}),fill:s.accent,stroke:s.accent,width:s.lightGlow*i/4,opacity:.045});silhouette.remove();}
 if(sculpted&&s.shadowSize>0&&s.shadowOpacity>0){for(let i=8;i>=1;i--){const shadow=s.effect==='colorStylish'&&s.extrude?sweep(face,s.depth,s.angle):face.clone({insert:false});shadow.translate(new scope.Point({angle:s.angle,length:(s.effect==='colorStylish'?0:s.extrude?s.depth:0)+s.shadowSize*.7}));layers.push({item:shadow,fill:s.effect==='colorStylish'?'#000b19':'#20180c',stroke:s.effect==='colorStylish'?'#000b19':'#20180c',width:s.shadowSize*i/4,opacity:s.shadowOpacity/100/8});}}
 if(s.effect==='colorStylish'&&s.shadowSize>0&&s.shadowOpacity>0){const shadow=s.extrude?sweep(face,s.depth,s.angle):face.clone({insert:false});shadow.translate(new scope.Point({angle:s.angle,length:s.shadowSize*.55}));layers.push({item:shadow,fill:'#000611',opacity:s.shadowOpacity/100*.75});}
 const shadowEnd=layers.length;
 if(s.effect==='echo'||(s.extrude&&['cutpaper','colorRetro'].includes(s.effect))){
 const steps=Math.max(2,Math.round(s.density));
 for(let i=steps;i>=1;i--){const offset=s.depth*i/steps;const item=s.effect==='echo'?face.clone({insert:false}):sweep(face,offset,s.angle);if(s.effect==='echo')item.translate(new scope.Point({angle:s.angle,length:offset}));const fill=s.effect==='echo'?'none':s.effect==='cutpaper'?(i%2?s.face:s.ink):(i%3===0?s.ink:i%3===1?s.colorEnd:s.accent);layers.push({item,fill,stroke:s.ink,width:s.outline});}
 }
 if(s.effect==='colorPlayful'&&s.extrude&&s.depth>0){const count=Math.max(2,Math.min(8,Math.round(s.density))),palette=[s.colorEnd,s.accent,s.face],pitch=s.depth/count;for(let i=count;i>=1;i--){layers.push({item:sweep(face,pitch*i,s.angle),fill:s.ink,stroke:s.ink,width:s.outline});layers.push({item:sweep(face,Math.max(0,pitch*i-Math.min(s.playfulGap,pitch*.8)),s.angle),fill:palette[(i-1)%3]});}}
 if(s.effect==='colorLayered'&&s.extrude&&s.depth>0){const count=Math.max(3,Math.min(10,Math.round(s.density))),palette=[s.ink,'#542a88','#a42c94',s.accent];for(let i=count;i>=1;i--){const t=(i-1)/(count-1)*(palette.length-1),index=Math.min(palette.length-2,Math.floor(t));layers.push({item:sweep(face,s.depth*i/count,s.angle),fill:mixColor(palette[index],palette[index+1],t-index)});}}
 if(s.effect==='colorDepth'&&s.extrude&&s.depth>0){const steps=Math.max(2,Math.min(8,Math.round(s.density)));for(let i=steps;i>=1;i--){const copy=face.clone({insert:false});copy.translate(new scope.Point({angle:s.angle,length:s.depth*i/steps}));layers.push({item:sweep(copy,Math.min(5,s.depth/steps),s.angle),fill:i%2?'#b0008c':'#690bb0',stroke:s.ink,width:s.outline});layers.push({item:copy,fill:i%2?'#bd008e':'#8309ca',stroke:s.accent,width:1.2});}}
 if(s.effect==='colorStylish'&&s.extrude&&s.depth>0){for(let i=24;i>=1;i--)layers.push({item:sweep(face,s.depth*i/24,s.angle),fill:mixColor(s.accent,s.ink,Math.pow(i/24,.7))});}
 if(s.extrude&&s.depth>0&&!['colorStylish','colorPlayful','colorLayered','colorDepth','cutpaper','colorRetro'].includes(s.effect))layers.push({item:sweep(face,s.depth,s.angle),fill:s.effect==='wire3d'?'none':sculpted?'url(#craftnor-depth)':s.ink,stroke:s.ink,width:s.effect==='colorVolt'?s.outline+s.voltBorder*2:s.outline});
 const depthEnd=layers.length;
 const isColor=s.effect.startsWith('color');
 if(s.effect==='colorVolt'&&s.voltBorder>0){layers.push({item:face.clone({insert:false}),fill:s.accent,stroke:s.accent,width:s.voltBorder*2});layers.push({item:face.clone({insert:false}),fill:s.colorStart,stroke:'#fff9dd',width:s.voltBorder*1.15});layers.push({item:face.clone({insert:false}),fill:s.colorEnd,stroke:s.colorEnd,width:s.voltBorder*.75});}
 if(['colorDark'].includes(s.effect)){layers.push({item:face.clone({insert:false}),fill:s.ink,stroke:s.ink,width:s.outline+5});layers.push({item:face.clone({insert:false}),fill:s.accent,stroke:s.accent,width:s.outline+3});}
 layers.push({item:face,fill:s.effect==='colorPlayful'?s.colorStart:s.effect==='colorLayered'?s.ink:s.effect==='wire3d'||neonGlow?'none':(isColor||s.effect==='steelMono')?'url(#craftnor-face)':s.face,stroke:s.ink,width:s.outline});
 if(s.effect==='colorEenadu'){if(s.outline>0){layers.push({item:insetGeometry(face,1.2),fill:s.accent});layers.push({item:insetGeometry(face,1.2+s.outline),fill:'url(#craftnor-face)'});}if(s.hatch)layers.push({item:eenaduEngraving(face,s),fill:s.accent});}
 if(s.effect==='colorLayered'){
 for(let i=1;i<=4&&s.highlightInset>0;i++){const inner=insetGeometry(face,s.highlightInset*i);if(inner.isEmpty()){inner.remove();break;}layers.push({item:inner,fill:i===4?'url(#craftnor-face)':mixColor(s.colorEnd,s.colorStart,i/4)});}
 if(s.hatch)layers.push({item:horizontalEngraving(face,s.hatchCount,s.hatchWidth),fill:'#ffffff',opacity:.3});
 const outline=face.clone({insert:false});outline.translate(new scope.Point({angle:225,length:s.lightOffset}));layers.push({item:outline,fill:'none',stroke:'#ffffff',width:1.1});
 }
 if(!foil&&['colorDark','colorGold','colorSilver','colorBronze','colorRose','colorPrism','steelMono'].includes(s.effect))layers.push({item:contourHighlights(face,s),fill:s.accent});
 if(s.effect==='colorStylish'&&s.bevelWidth>0){const geometry=bevelGeometry(face,s.bevelWidth,s.highlightAngle);layers.push({item:geometry.rim,fill:s.accent});layers.push({item:geometry.dark,fill:s.colorEnd,opacity:s.bevelStrength/100});layers.push({item:geometry.light,fill:'#fff4cb',opacity:s.bevelStrength/100});layers.push({item:geometry.inner,fill:'url(#craftnor-face)'});}
 if(sculpted&&s.effect!=='colorStylish'&&s.bevelWidth>0){
  const width=Math.min(s.bevelWidth*(foil?(s.foilImpression==='pillow'?7:1)*(s.foilPressure/100):1),face.bounds.height*.15),geometry=bevelGeometry(face,width,s.highlightAngle);
  layers.push({item:geometry.rim,fill:'url(#craftnor-rim)'});
  layers.push({item:geometry.dark,fill:foil?s.ink:s.colorEnd,opacity:s.bevelStrength/100*(foil?.65:.75)});
  layers.push({item:geometry.light,fill:s.effect==='colorVolt'?s.colorStart:s.accent,opacity:s.bevelStrength/100});
  layers.push({item:geometry.inner,fill:'url(#craftnor-face)',stroke:s.colorEnd,width:.35});
  const crest=bevelGeometry(face,width*.28,s.highlightAngle);crest.inner.remove();crest.rim.remove();crest.dark.remove();layers.push({item:crest.light,fill:'#fffbe1',opacity:s.bevelStrength/100*.9});
  const lip=contourHighlights(face,{...s,highlightWidth:Math.max(.5,s.highlightWidth*.4),highlightInset:width+1,highlightCoverage:85,highlightTaper:70});layers.push({item:lip,fill:s.effect==='colorVolt'?s.colorStart:s.accent,opacity:s.bevelStrength/100*.6});
 }
 if(foil&&s.foilGrain>0){const surface=insetGeometry(face,Math.min(s.bevelWidth*(s.foilImpression==='pillow'?7:1)*s.foilPressure/100,face.bounds.height*.15));layers.push({item:surface,fill:'url(#craftnor-foil-surface)',opacity:.35+s.foilGrain/100*.6});layers.push({item:foilMicrograin(face,s),fill:silverFoil?'#ffffff':'#fff3ae',opacity:.38});layers.push({item:foilMicrograin(face,{...s,textureSeed:s.textureSeed+71}),fill:s.ink,opacity:.17});}
 if(s.effect==='rust')layers.push({item:rustShade(face),fill:s.accent});
 if(['halftone','lineprint','colorPop'].includes(s.effect))layers.push({item:halftoneDots(face,s),fill:s.ink});
 if(['sketchRocks','colorSketchRed'].includes(s.effect)){
 layers.push({item:pencilSketchMarks(face,s),fill:s.ink});
 layers.push({item:face.clone({insert:false}),fill:'none',stroke:s.face,width:s.highlightInset});
 layers.push({item:pencilSketchContours(face,{...s,sketchWidth:s.sketchWidth*1.5}),fill:s.ink});
 }
 if(s.effect==='pencilSketch'){layers.push({item:pencilSketchMarks(face,s),fill:s.ink});layers.push({item:pencilSketchContours(face,s),fill:s.ink});}
 if(s.effect==='pencil')layers.push({item:pencilMarks(face,s),fill:s.ink});
 if(s.effect==='sketch')layers.push({item:sketchMarks(face,s),fill:s.ink});
 if(s.effect==='simple3d')layers.push({item:contourHighlights(face,{...s,highlightCoverage:95,highlightTaper:20,highlightAngle:225}),fill:s.ink});
 if(neonGlow&&s.lightGlow>0)for(let i=10;i>=1;i--)layers.push({item:face.clone({insert:false}),fill:'none',stroke:s.colorEnd,width:5+s.lightGlow*i/5,opacity:.04});
 if(s.effect==='colorNeon'){for(const [width,stroke] of [[9,s.ink],[5,s.colorEnd],[2.5,s.colorStart],[.7,'#ffffff']] as [number,string][]){layers.push({item:face.clone({insert:false}),fill:'none',stroke,width});}}
 if(s.inline){const inner=face.clone({insert:false});layers.push({item:inner,fill:'none',stroke:s.ink,width:Math.max(.4,s.outline*.45)}); // inset geometry through offset of flattened contours
 const insetParts:paper.PathItem[]=[];for(const c of contours(face)){const f=c.clone({insert:false});f.flatten(1);const pts=f.segments.map(seg=>{const n=f.getNormalAt(f.getOffsetOf(seg.point));return seg.point.subtract(n?n.multiply(4):new scope.Point(0,0));});const inset=new scope.Path({segments:pts,closed:true,insert:false});insetParts.push(inset);f.remove();}const insets=new scope.CompoundPath({children:insetParts as paper.Path[],insert:false});const clipped=vectorBoolean(insets,face,'intersect');insets.remove();layers.push({item:clipped,fill:'none',stroke:s.ink,width:.7});}
 if(s.hatch&&!['colorLayered','colorEenadu'].includes(s.effect)){const b=face.bounds;const lowerHalf=s.effect==='decorative'?new scope.Path.Rectangle({rectangle:new scope.Rectangle(b.left-2,b.center.y,b.width+4,b.height/2+2),insert:false}):null;const hatchFace=lowerHalf?vectorBoolean(face,lowerHalf,'intersect'):face;const strips:paper.PathItem[]=[];const count=Math.round(Math.max(5,Math.min(120,s.hatchCount)));const start=b.left-b.height-4;const pitch=(b.width+b.height+8)/count;const width=Math.max(.2,Math.min(20,s.hatchWidth))*Math.SQRT2;const topY=s.effect==='decorative'?b.center.y:b.top;const run=b.bottom-topY;const topWidth=width*(1-Math.max(0,Math.min(100,s.hatchGraduation))/100);for(let i=0;i<count;i++){const x=start+(i+.5)*pitch;const p=new scope.Path({segments:[[x-width/2,b.bottom],[x+width/2,b.bottom],[x+run+topWidth/2,topY],[x+run-topWidth/2,topY]],closed:true,insert:false});const cut=vectorBoolean(p,hatchFace,'intersect');p.remove();strips.push(cut);}lowerHalf?.remove();if(hatchFace!==face)hatchFace.remove();layers.push({item:combine(strips),fill:['colorEenadu','colorBronze'].includes(s.effect)?s.accent:s.ink});}
 if(s.effect==='colorLight'){
 const offset=face.clone({insert:false});offset.translate(new scope.Point({angle:225,length:s.lightOffset}));layers.push({item:offset,fill:'none',stroke:s.colorStart,width:1.25});
 const b=face.bounds,rand=seeded(s.textureSeed);for(let i=0;i<Math.round(s.lightSparkles);i++){const x=b.left+b.width*(i+.4+rand()*.2)/Math.max(1,s.lightSparkles),y=i%2?b.bottom+8:b.top-8,r=3+rand()*4;const points:paper.Point[]=[];for(let j=0;j<8;j++){const a=j*Math.PI/4,d=j%2?r*.15:r;points.push(new scope.Point(x+Math.cos(a)*d,y+Math.sin(a)*d));}layers.push({item:new scope.Path({segments:points,closed:true,insert:false}),fill:s.accent});}
 }
 if(s.effect==='ice')layers.push({item:snowCaps(face,s),fill:'#ffffff',stroke:s.ink,width:Math.max(1.8,s.outline)});
 const groups:Record<LayerId,typeof layers>={shadow:layers.slice(0,shadowEnd),depth:layers.slice(shadowEnd,depthEnd),face:layers.slice(depthEnd),texture:[],outline:[]};
 let shadeDefs='';
 if(options){
 if(options.shadowDistance>0){if(groups.shadow.length){for(const l of groups.shadow)l.item.translate(new scope.Point({angle:s.angle,length:options.shadowDistance}));}else{const shadow=s.extrude?sweep(face,s.depth,s.angle):face.clone({insert:false});shadow.translate(new scope.Point({angle:s.angle,length:options.shadowDistance}));groups.shadow.push({item:shadow,fill:'#000000',stroke:'#000000',width:s.shadowSize,opacity:s.shadowOpacity/100});}}
 if(options.texture!=='none'){const item=options.texture==='hatch'?eenaduEngraving(face,{...s,halfAngle:45,highlightInset:2}):options.texture==='dots'?halftoneDots(face,s):distressCuts(face,s,false);groups.texture.push({item,fill:s.ink,opacity:options.textureOpacity/100});}
 if(options.outlineWidth>0)groups.outline.push({item:face.clone({insert:false}),fill:'none',stroke:s.ink,width:options.outlineWidth});
 if(options.sideShading){const radians=s.highlightAngle*Math.PI/180;for(let i=0;i<groups.depth.length;i++){const layer=groups.depth[i];if(!/^#[0-9a-f]{6}$/i.test(layer.fill))continue;const color=layer.fill,id='craftnor-side-'+i,t=s.bevelStrength/100;shadeDefs+=`<linearGradient id="${id}" x1="${50-50*Math.cos(radians)}%" y1="${50-50*Math.sin(radians)}%" x2="${50+50*Math.cos(radians)}%" y2="${50+50*Math.sin(radians)}%"><stop stop-color="${mixColor(color,'#ffffff',t*.45)}"/><stop offset="1" stop-color="${mixColor(color,'#000000',t*.75)}"/></linearGradient>`;layer.fill=`url(#${id})`;}}
 }
 const allLayers=Object.values(groups).flat();manipulateShapes(allLayers.map(l=>l.item),s);

 let bounds=allLayers[0].item.bounds.clone();for(const l of allLayers)bounds=bounds.unite(l.item.bounds);bounds=bounds.expand(25+s.outline*2+(sculpted?s.shadowSize:0)+(s.effect==='colorLight'||neonGlow?s.lightGlow*2:0));const viewBox=[bounds.x,bounds.y,bounds.width,bounds.height].map(n=>+n.toFixed(3)).join(' ');
 const radians=s.colorAngle*Math.PI/180;const gradient=(isColor||s.effect==='steelMono')?`<defs><linearGradient id="craftnor-face" x1="${50-50*Math.cos(radians)}%" y1="${50-50*Math.sin(radians)}%" x2="${50+50*Math.cos(radians)}%" y2="${50+50*Math.sin(radians)}%">${foil?[[0,mixColor(s.colorEnd,s.colorStart,.32)],[.28,mixColor(s.colorEnd,s.colorStart,.55)],[.44,s.colorStart],[.52,mixColor(s.colorStart,'#ffffff',.5)],[.64,mixColor(s.colorEnd,s.colorStart,.45)],[.85,mixColor(s.colorEnd,s.colorStart,.62)],[1,s.colorEnd]].map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join(''):s.effect==='colorStylish'?[[0,mixColor(s.colorStart,'#ffffff',.15)],[.4,s.colorStart],[.72,mixColor(s.colorStart,s.colorEnd,.6)],[1,s.colorEnd]].map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join(''):s.effect==='colorSculpt'?[[0,s.colorEnd],[.25,s.colorStart],[.48,'#ffe466'],[.72,s.colorEnd],[.87,s.colorStart],[1,s.colorEnd]].map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join(''):['colorGold','colorSilver','colorBronze','colorRose','colorPrism','steelMono'].includes(s.effect)?[[0,s.effect==='steelMono'?'#777777':s.colorEnd],[.18,s.effect==='steelMono'?'#f2f2f2':s.colorStart],[.32,'#ffffff'],[.47,s.effect==='steelMono'?'#aaaaaa':s.colorEnd],[.5,s.ink],[.56,s.effect==='steelMono'?'#666666':s.colorEnd],[.78,s.effect==='steelMono'?'#eeeeee':s.colorStart],[.86,'#ffffff'],[1,s.effect==='steelMono'?'#888888':s.colorEnd]].map(([offset,color])=>`<stop offset="${offset}" stop-color="${color}"/>`).join(''):s.effect==='colorChrome'?`<stop offset="0" stop-color="${s.colorEnd}"/><stop offset=".42" stop-color="${s.colorStart}"/><stop offset=".49" stop-color="#ffffff"/><stop offset=".5" stop-color="${s.ink}"/><stop offset=".62" stop-color="${s.colorEnd}"/><stop offset="1" stop-color="${s.colorStart}"/>`:`<stop offset="0" stop-color="${s.colorStart}"/><stop offset="1" stop-color="${s.colorEnd}"/>`}</linearGradient></defs>`:'';
 const rimDark=s.effect==='colorVolt'?'#743b10':s.ink,rimAccent=s.effect==='colorVolt'?s.colorStart:s.accent;
 const reflectiveDefs=sculpted?`<defs><linearGradient id="craftnor-rim" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${s.highlightAngle-225} .5 .5)"><stop offset="0" stop-color="${s.colorEnd}"/><stop offset=".16" stop-color="${rimDark}"/><stop offset=".28" stop-color="${rimAccent}"/><stop offset=".38" stop-color="#fffbe1"/><stop offset=".49" stop-color="${s.colorEnd}"/><stop offset=".65" stop-color="${s.colorStart}"/><stop offset=".8" stop-color="${rimDark}"/><stop offset=".93" stop-color="${rimAccent}"/><stop offset="1" stop-color="${s.colorEnd}"/></linearGradient><linearGradient id="craftnor-depth" x1="0%" y1="0%" x2="100%" y2="100%">${s.effect==='colorStylish'?`<stop offset="0" stop-color="${s.colorEnd}"/><stop offset=".32" stop-color="${s.accent}"/><stop offset=".65" stop-color="${s.ink}"/><stop offset="1" stop-color="${s.ink}"/>`:`<stop offset="0" stop-color="${s.ink}"/><stop offset=".35" stop-color="${['colorLight','colorVolt'].includes(s.effect)?s.accent:s.colorEnd}"/><stop offset=".45" stop-color="${s.ink}"/><stop offset=".7" stop-color="${s.ink}"/><stop offset=".85" stop-color="${s.accent}"/><stop offset="1" stop-color="${s.ink}"/>`}</linearGradient></defs>`:'';
 const displayed=options?options.order.filter(id=>options.enabled[id]).flatMap(id=>groups[id]):allLayers;
 if(options&&!options.enabled.outline)for(const l of displayed)if(l.stroke===s.ink){l.stroke=undefined;l.width=undefined;}
 const foilDef=foil?`<defs><pattern id="craftnor-foil-surface" patternUnits="userSpaceOnUse" width="220" height="220" patternTransform="rotate(${s.colorAngle-90})"><image width="220" height="220" href="${foilSurfaces[silverFoil?'silverFoil':'goldFoil']}"/></pattern></defs>`:'';
 const body=gradient+reflectiveDefs+foilDef+(shadeDefs?`<defs>${shadeDefs}</defs>`:'')+displayed.map(l=>`<path d="${l.item.pathData}" fill="${l.fill}"${l.opacity!==undefined?` opacity="${l.opacity}"`: ''}${l.stroke?` stroke="${l.stroke}" stroke-width="${l.width}" stroke-linejoin="round"`:''} fill-rule="nonzero"/>`).join('');allLayers.forEach(l=>l.item.remove());return {body,viewBox,paths:displayed.length};
}
export function svgDocument(result:ReturnType<typeof render>){return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${result.viewBox}">${result.body}</svg>`;}
