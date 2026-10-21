import type {Settings} from './engine';
export type Control=[keyof Settings,string,number,number,string?,number?,number?];
export const effectControls:Record<string,Control[]>={
 pencilSketch:[['sketchLines','Shading density',15,200],['sketchWidth','Pencil thickness',.1,3,'',.1],['sketchJitter','Hand roughness',0,12,'',.5],['pencilContour','Contour strength',0,100,'%'],['textureSeed','Stroke variation',0,999]],
 pencil:[['sketchLines','Shading density',15,200],['sketchWidth','Pencil thickness',.1,3,'',.1],['sketchJitter','Hand roughness',0,12,'',.5],['textureSeed','Stroke variation',0,999]],
 echo:[['density','Echo count',3,20],['depth','Echo distance',0,200],['angle','Echo direction',0,360,'°']],
 cutpaper:[['density','Depth bands',3,20]],
 colorRetro:[['density','Depth bands',3,20]],
 engraved:[['hatchCount','Line count',5,120],['hatchWidth','Line thickness',.2,20,'',.2],['hatchGraduation','Graduation',0,100,'%']],
 speed:[['stripes','Stripe count',3,35],['gap','Stripe gap',1,10,'',.5],['taper','Trail length',0,80],['slant','Slant',-30,40,'°']],
 ice:[['snow','Snow thickness',3,32],['wave','Waviness',0,14],['coverage','Coverage',10,100,'%']],
 ribbon:[['ribbonPosition','Band position',5,95,'%'],['ribbonWidth','Band thickness',.5,15,'',.5],['ribbonAmplitude','Wave height',0,12,'',.5],['ribbonPeriod','Wave length',8,80],['dotRadius','Dot radius',0,8,'',.5],['dotSpacing','Dot spacing',8,65],['dotOffset','Dot row distance',3,25]],
 shine:[['highlightWidth','Highlight thickness',.5,15,'',.5],['highlightInset','Inset distance',.5,15,'',.5],['highlightAngle','Light direction',0,360,'°'],['highlightCoverage','Highlight coverage',10,95,'%'],['highlightTaper','Highlight taper',0,100,'%']],
 halftone:[['halfSpacing','Dot grid spacing',3,25,'',.5],['halfRadius','Maximum dot radius',.2,10,'',.2],['halfFade','Dot graduation',0,100,'%'],['halfAngle','Grid angle',0,90,'°'],['toneDirection','Tone direction',0,360,'°']],
 stencil:[['stencilCount','Number of cuts',1,12],['stencilSpacing','Distance between cuts',2,100],['stencilWidth','Bridge gap',.5,15,'',.5],['stencilAngle','Bridge direction',0,180,'°']],
 grungeStencil:[['stencilCount','Number of cuts',1,12],['stencilSpacing','Distance between cuts',2,100],['stencilWidth','Bridge gap',.5,15,'',.5],['stencilAngle','Bridge direction',0,180,'°'],['textureAmount','Wear amount',0,100,'%'],['textureSize','Chip size',.2,6,'',.2],['textureSeed','Pattern seed',0,999]],
 rust:[['textureAmount','Wear amount',0,100,'%'],['textureSize','Chip size',.2,6,'',.2],['textureSeed','Pattern seed',0,999]],
 shatter:[['fragmentSize','Fragment size',15,100],['fragmentGap','Fracture gap',0,10,'',.5],['fragmentShift','Fragment displacement',0,25],['textureSeed','Pattern seed',0,999]],
 sketch:[['sketchLines','Sketch line count',15,200],['sketchWidth','Sketch line thickness',.1,3,'',.1],['sketchJitter','Roughness',0,12,'',.5],['textureSeed','Pattern seed',0,999]],
 simple3d:[['highlightInset','Trim inset',.5,15,'',.5],['highlightWidth','Trim thickness',.5,8,'',.5]]
};
effectControls.colorDepth=[['density','Depth tiers',2,8]];
effectControls.sketchRocks=[...effectControls.pencilSketch,['highlightInset','White contour gap',.5,8,'',.5]];
effectControls.colorSketchRed=effectControls.sketchRocks;
effectControls.colorSponge=effectControls.rust;
for(const id of ['colorDark','colorEmboss','colorSculpt','colorMinty','colorStylish','colorGold','colorSilver','colorRose','colorPrism','colorEnamel','steelMono'])effectControls[id]=effectControls.shine;
effectControls.colorBronze=[...effectControls.shine,...effectControls.engraved];
effectControls.colorEenadu=effectControls.engraved;
effectControls.lineprint=effectControls.halftone;effectControls.colorPop=effectControls.halftone;
for(const id of ['colorSculpt','colorEmboss','colorMinty','colorStylish','colorEnamel'])effectControls[id]=[['bevelWidth','Bevel width',0,12,'',.5],['bevelStrength','Bevel contrast',0,100,'%'],['highlightAngle','Light direction',0,360,'°'],['highlightWidth','Inner glint thickness',.5,8,'',.5],['shadowSize','Shadow softness',0,30],['shadowOpacity','Shadow strength',0,60,'%']];
effectControls.colorLight=[['lightGlow','Mint glow spread',0,30],['lightOffset','Floating outline offset',0,12,'',.5],['lightSparkles','Sparkles',0,12],['bevelWidth','Bevel width',0,12,'',.5],['bevelStrength','Bevel contrast',0,100,'%'],['highlightAngle','Light direction',0,360,'°'],['textureSeed','Sparkle variation',0,999]];
effectControls.colorVolt=[['voltBorder','Blue casing width',0,12,'',.5],...effectControls.colorSculpt];
effectControls.colorLayered=[['density','Depth layer count',3,10],['highlightInset','Inset band width',0,5,'',.5],['lightOffset','White outline offset',0,12,'',.5],['hatchCount','Horizontal line count',5,120],['hatchWidth','Horizontal line thickness',.2,2,'',.1]];
effectControls.colorPlayful=[['density','Colored layer count',2,8],['playfulGap','Dark separator thickness',0,10,'',.5]];
export const shapeControls:Control[]=[['shapeTop','Top curve',-40,40,'%'],['shapeBottom','Bottom curve',-40,40,'%'],['shapeArc','Circular arc',-240,240,'°'],['shapeRotate','Rotation',-180,180,'°'],['shapeSkew','Lean',-40,40,'%'],['shapeScaleX','Width adjustment',50,160,'%',1,100],['shapeScaleY','Height adjustment',50,160,'%',1,100],['shapeWave','Wave amplitude',0,40],['shapeWaveLength','Wavelength adjustment',40,400,'',1,160],['shapeBend','Arch',-60,60],['shapePerspective','Perspective',-70,70,'%']];

effectControls.colorEenadu=[['hatchCount','Line count',5,300],['hatchWidth','Line thickness',.2,4,'',.1],['highlightInset','Engraving inset',.5,15,'',.5],['halfAngle','Engraving angle',15,75,'°']];
effectControls.colorStylish=[['bevelWidth','Rim width',0,6,'',.1],['bevelStrength','Rim contrast',0,100,'%'],['highlightAngle','Light direction',0,360,'°'],['shadowSize','Shadow softness',0,30],['shadowOpacity','Shadow strength',0,90,'%']];

for(const id of ["colorGold3d","colorSilver3d","colorGoldFoil","colorSilverFoil"])effectControls[id]=[["bevelWidth","Edge emboss width",0,12,"",.2],["bevelStrength","Edge emboss contrast",0,100,"%"],["highlightAngle","Emboss light direction",0,360,"°"],["shadowSize","Shadow softness",0,30],["shadowOpacity","Shadow strength",0,90,"%"]];
effectControls.colorNeonGlow=[["lightGlow","Neon glow spread",0,30]];

for(const id of ['colorGoldFoil','colorSilverFoil'])effectControls[id]=[['foilPressure','Stamp pressure',0,100,'%'],['bevelWidth','Stamp edge width',0,6,'',.1],['foilGrain','Foil surface grain',0,100,'%'],['bevelStrength','Stamp edge contrast',0,100,'%'],['highlightAngle','Stamp lighting direction',0,360,'°'],['textureSeed','Foil grain variation',0,999]];
