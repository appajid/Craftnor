from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFilter,ImageFont
import base64,io,json
root=Path(__file__).resolve().parents[1]
N=1024
rng=np.random.default_rng(82437)
def smooth(grid):
 # Periodic low frequency field: no straight tile seams.
 a=rng.normal(0,1,(grid,grid));a=np.pad(a,((1,1),(1,1)),mode='wrap')
 im=Image.fromarray(np.uint8(np.clip(a*35+128,0,255))).resize((N+2*N//grid,N+2*N//grid),Image.Resampling.BICUBIC)
 a=np.asarray(im,dtype=float)[N//grid:N//grid+N,N//grid:N//grid+N];return (a-a.mean())/(a.std()+1e-6)
base=[smooth(g) for g in [4,12,40,120,300]]
configs=[('paper','Fine paper',(245,242,231),[.5,.6,.8,1.5,1.0],6000,.08),('cotton','Cotton rag',(242,237,220),[1,1.5,2,2.4,1.8],19000,.12),('kraft','Kraft paper',(186,145,97),[1.1,1.5,2,2,1.6],22000,.25),('parchment','Parchment',(226,203,158),[4,3,1.4,1.2,1],5500,.12),('watercolor','Cold-press watercolor',(242,240,226),[.5,1,2,4,2],12000,.08),('leather','Fine-grain leather',(99,59,38),[.5,.8,1,1.8,1.2],16000,.05)]
out=root/'public/textures';out.mkdir(exist_ok=True)
exports={};previews=[]
for key,label,color,weights,count,fiber_strength in configs:
 field=sum(a*w for a,w in zip(base,weights))+rng.normal(0,.65,(N,N))
 fiber=Image.new('L',(N,N),128);d=ImageDraw.Draw(fiber)
 for i in range(count):
  x,y=rng.uniform(0,N,2);angle=rng.uniform(0,np.pi);length=rng.uniform(1,16 if key in ['cotton','kraft'] else 7)
  dx,dy=np.cos(angle)*length,np.sin(angle)*length
  shade=int(rng.uniform(60,195));d.line([(x,y),(x+dx*.5,y+dy*.5+rng.uniform(-1,1)),(x+dx,y+dy)],fill=shade,width=1)
 f=np.asarray(fiber.filter(ImageFilter.GaussianBlur(.35)),dtype=float)-128
 field+=f*fiber_strength
 # Small-scale directional light reveals the paper relief, without obvious drawn specks.
 relief=base[3]*.6+base[4]*.4
 lighting=(np.roll(relief,1,axis=0)-np.roll(relief,-1,axis=0))* (3 if key=='watercolor' else 1.5)
 field+=lighting
 if key=='leather':
  yy,xx=np.mgrid[:512,:512];first=np.full((512,512),1e9);second=first.copy()
  grid=53;pitch=512/grid;cx=(np.arange(grid)[None,:]+rng.uniform(.1,.9,(grid,grid)))*pitch;cy=(np.arange(grid)[:,None]+rng.uniform(.1,.9,(grid,grid)))*pitch
  warp=np.asarray(Image.fromarray(np.float32(base[2])).resize((512,512),Image.Resampling.BICUBIC));xx=xx+warp*.6;yy=yy+np.roll(warp,17,0)*.6
  ix=np.floor(xx/pitch).astype(int);iy=np.floor(yy/pitch).astype(int)
  for dy0 in [-1,0,1]:
   for dx0 in [-1,0,1]:
    dx=np.abs(xx-cx[(iy+dy0)%grid,(ix+dx0)%grid]);dy=np.abs(yy-cy[(iy+dy0)%grid,(ix+dx0)%grid]);distance=np.sqrt(np.minimum(dx,512-dx)**2+np.minimum(dy,512-dy)**2)
    smaller=distance<first;second=np.where(smaller,first,np.minimum(second,distance));first=np.minimum(first,distance)
  gap=second-first;ridge=np.clip(gap/.75,0,1)*10-10
  relief=np.asarray(Image.fromarray(np.float32(ridge)).resize((N,N),Image.Resampling.BICUBIC))
  field+=relief+(np.roll(relief,1,0)-np.roll(relief,-1,0))*.8
 rgb=np.clip(np.array(color)[None,None,:]+field[:,:,None],0,255).astype('uint8')
 im=Image.fromarray(rgb)
 b=io.BytesIO();im.save(b,'JPEG',quality=91,subsampling=0,optimize=True)
 (out/(key+'.jpg')).write_bytes(b.getvalue());exports[key]='data:image/jpeg;base64,'+base64.b64encode(b.getvalue()).decode()
 previews.append((label,im))
foil_exports={}
# A shallow rolled foil surface: fine directional wrinkles disturb its reflected light.
height=base[1]*.25+base[2]*.5+base[3]*.15
normal=(np.roll(height,2,axis=0)-np.roll(height,-2,axis=0))*3
broad=base[0]*.12+base[1]*.18
reflection=np.clip(.52+normal*.3+broad,0,1)
reflection=.22+reflection*.65
for key,dark,light in [('goldFoil',(141,103,27),(255,232,141)),('silverFoil',(105,110,116),(248,250,251))]:
 rgb=np.clip(np.array(dark)[None,None,:]+reflection[:,:,None]*(np.array(light)-np.array(dark))[None,None,:]+rng.normal(0,.8,(N,N,1)),0,255).astype('uint8')
 image=Image.fromarray(rgb);buf=io.BytesIO();image.save(buf,'JPEG',quality=92,subsampling=0,optimize=True);(out/(key+'.jpg')).write_bytes(buf.getvalue());foil_exports[key]='data:image/jpeg;base64,'+base64.b64encode(buf.getvalue()).decode()
(root/'src/paperTextures.ts').write_text('// Original procedurally generated paper surfaces. Rebuild with scripts/generate-paper-textures.py.\nexport const paperSurfaces:Record<string,string>='+json.dumps(exports,separators=(',',':'))+';\nexport const foilSurfaces:Record<string,string>='+json.dumps(foil_exports,separators=(',',':'))+';\nexport const paperColors:Record<string,string>='+json.dumps({c[0]:'#%02x%02x%02x'%c[2] for c in configs})+';\n')
