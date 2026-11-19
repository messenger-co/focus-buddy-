import { directions, nextCell, type Board, type Direction, type State } from "./logic";

export interface Furnishings { night:boolean; wood:"oak"|"walnut"|"mint"; rug:"sea"|"berry"|"honey"; plant:"fern"|"cactus"|"flower"; lamp:boolean; mirror:boolean }
export const defaults:Furnishings={night:false,wood:"oak",rug:"sea",plant:"fern",lamp:true,mirror:false};
export type Action="focus"|"tasks"|"books"|"plant"|"window"|"lamp"|"games";
export type Shape="box"|"ball"|"pot"|"cone"|"gem";
export interface Piece {shape:Shape; x:number;y:number;z:number;w:number;h:number;d:number;color:string;action?:Action}
export type Pos=[number,number,number];
export interface Diorama {fixed:Piece[]; width:number; depth:number; center:Pos; night:boolean; room:boolean;}
const wood={oak:"#c58c65",walnut:"#825640",mint:"#83b9ab"},rug={sea:"#77b5b4",berry:"#cc91a4",honey:"#e4b66b"};
function builder(){const pieces:Piece[]=[];const put=(shape:Shape,x:number,y:number,z:number,w:number,h:number,d:number,color:string,action?:Action)=>{pieces.push({shape,x,y,z,w,h,d,color,action})};return {pieces,put};}
export function roomScene(p:Furnishings,now:Date):Diorama{
 const {pieces,put}=builder();
 const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string,a?:Action)=>put("box",x,y,z,w,h,d,c,a);
 const ball=(x:number,y:number,z:number,w:number,h:number,d:number,c:string,a?:Action)=>put("ball",x,y,z,w,h,d,c,a);
 const timber=wood[p.wood],wall=p.night?"#637586":"#e5d8bf",woodDark="#805d50";
 box(0,-.35,0,9.5,.56,7.5,woodDark);for(let i=0;i<12;i++)box(0,-.035,-3.3+i*.6,9.25,.12,.58,i%3?"#e4c6a7":"#dac0a3");
 box(0,1.96,-3.58,9.35,3.98,.16,wall);box(-4.58,1.96,0,.16,3.98,7.26,wall);
 box(0,.18,-3.43,9.2,.24,.13,timber);box(-4.41,.18,0,.14,.24,7.13,timber);
 box(-1.78,2.52,-3.46,3.55,2.38,.14,woodDark,"window");box(-1.78,2.52,-3.32,3.33,2.17,.12,p.night?"#343c69":"#a7d8dc","window");
 ball(-2.65,3.15,-3.21,.44,.44,.07,p.night?"#faf1c6":"#ffe0a0","window");
 for(let i=0;i<8;i++)ball(-3.18+.4*i,1.72+.16*Math.sin(i*2),-3.22,.74,.65+(.19*(i%3)),.12,p.night?"#53637c":"#81b5a2","window");
 box(-1.78,2.52,-3.10,.095,2.18,.09,"#f4e3c4","window");box(-1.78,2.46,-3.10,3.35,.09,.09,"#f4e3c4","window");box(-1.78,1.37,-3.03,3.65,.14,.47,timber,"window");
 const desk=p.mirror?1.49:-1.1,dz=-1.46; box(desk,1.35,dz,3.65,.20,1.6,timber,"tasks");
 for(const ox of [-1.45,1.45])for(const oz of [-.54,.54])box(desk+ox,.69,dz+oz,.15,1.32,.15,woodDark,"tasks");
 box(desk,1.52,dz-.21,.66,.08,.43,"#45565b","games");box(desk,1.76,dz-.28,.14,.4,.1,"#485a62","games");
 box(desk,2.12,dz-.28,1.6,.88,.12,"#435562","games");box(desk,2.13,dz-.198,1.45,.72,.04,p.night?"#6c83a9":"#81bbc0","games");
 for(let i=0;i<3;i++)box(desk-.29+i*.03,2.30-i*.16,dz-.165,.63-i*.12,.045,.02,"#e1f3df","games");
 box(desk,1.49,dz+.46,1.15,.07,.38,"#ece1cb","tasks");
 const lx=desk+1.33;put("pot",lx,1.53,dz,.47,.12,.46,woodDark,"lamp");box(lx,1.89,dz,.07,.72,.07,"#93705b","lamp");put("cone",lx,2.27,dz,.56,.42,.54,p.lamp?"#f6ce7e":"#8b9a98","lamp");
 box(desk,.75,.06,1.0,.18,.86,woodDark);box(desk,.87,.06,.95,.14,.83,rug[p.rug]);box(desk,1.19,.48,.97,.59,.14,timber);
 for(const x of [-.35,.35])for(const z of [-.27,.27])box(desk+x,.39,.06+z,.1,.72,.1,woodDark);
 box(1.22,.05,1.34,3.63,.09,2.16,"#f0d9b3");box(1.22,.11,1.34,3.40,.04,1.97,rug[p.rug]);for(const x of [-.16,2.60])box(x,.14,1.34,.06,.02,1.89,"#f6e3c8");
 const shelf=p.mirror?-3.35:2.99;box(shelf,1.53,-3.17,2.05,2.92,.29,timber,"books");
 for(const h of [.22,1.19,2.16,3.05])box(shelf,h,-2.89,2.15,.15,.67,woodDark,"books");
 const covers=["#bc7770","#9cb9aa","#e5bd77","#829db4","#d7b0bf"];
 for(let i=0;i<16;i++){const h=.38+(i%4)*.12;box(shelf-.77+(i%8)*.2,.30+Math.floor(i/8)*.96+h/2,-2.83,.15,h,.34,covers[i%5],"books");}
 put("pot",3.46,.43,1.65,.73,.79,.72,"#c88468","plant");
 for(let i=0;i<7;i++){const a=i*.9,h=.5+(i%3)*.22;ball(3.46+Math.sin(a)*.24,1.11+h*.25,1.65+Math.cos(a)*.24,p.plant==="cactus"?.25:.48,h,.36,i%2?"#699b87":"#448a76","plant");if(p.plant==="flower"&&i%2)ball(3.46+Math.sin(a)*.27,1.31+h*.59,1.65+Math.cos(a)*.27,.26,.2,.25,"#ffbbbc","plant");}
 ball(.85,3,-3.38,.8,.8,.12,woodDark,"focus");ball(.85,3,-3.27,.67,.67,.09,"#fff1c9","focus");
 for(let i=0;i<12;i++){const a=Math.PI*i/6;ball(.85+Math.sin(a)*.26,3+Math.cos(a)*.26,-3.21,.025,.025,.025,"#896858","focus");}
 for(const [unit,n,len] of [[now.getHours()%12+now.getMinutes()/60,12,.15],[now.getMinutes(),60,.23]])for(let j=1;j<7;j++){const a=unit/n*Math.PI*2;ball(.85+Math.sin(a)*len*j/6,3+Math.cos(a)*len*j/6,-3.18,.034,.034,.034,"#4c6464","focus");}
 return {fixed:pieces,width:11.2,depth:8.2,night:p.night,room:true,center:[0,1.27,0]};
}
export function point(b:Board,idx:number,y=0):Pos{return [idx%b.width-(b.width-1)/2,y,Math.floor(idx/b.width)-(b.height-1)/2];}
export function elevation(b:Board,i:number){return b.game==="parkour"?.10+((i*7)%5)*.14:.04;}
export function mapScene(b:Board):Diorama{
 const {pieces,put}=builder(),ice=b.game==="parkour",orchid=b.game==="play";
 b.cells.forEach((c,i)=>{if(c==="~")return;const [x,,z]=point(b,i),e=elevation(b,i);
 if(orchid&&c==="#")return;
 put("box",x,e-.17,z,.99,.34,.99,ice?"#a0b2d3":orchid?"#a993ba":"#c0a37d");
 put("box",x,e+.016,z,.98,.048,.98,ice?"#d0dff2":orchid?"#e6d4b9":(i+Math.floor(i/b.width))%2?"#b4cc96":"#c0d7a0");
 if(c==="#"){put("box",x,.38,z,.97,.65,.97,b.game==="puzzle"?"#a98773":"#537f6d");if(b.game!=="puzzle")put("ball",x,.76,z,.94,.32,.94,"#84a682");}
 if(c==="G"||c==="C"||c==="o")put("pot",x,e+.11,z,.76,.1,.76,c==="G"?"#f1c578":c==="C"?"#80c7ae":"#d79a6e");
 if(c==="G"||c==="C"){put("box",x-.31,e+.48,z-.31,.04,.78,.04,"#735e58");put("box",x-.10,e+.72,z-.31,.38,.22,.05,c==="G"?"#e3a35d":"#81c5b6");}
 if(ice)put("gem",x,e-.56,z,.71,.65,.7,"#a7b8d7");});
 return {fixed:pieces,width:Math.max(5,b.width+.7),depth:Math.max(5,b.height+1),night:ice||orchid,room:false,center:[0,.32,0]};
}
export const padColors=["#edb75d","#e5a0b4","#85c9ae","#86bad4"];
export function markers(b:Board,s:State,cue:Direction|null){
 const {pieces,put}=builder();s.boxes.forEach(n=>{const [x,,z]=point(b,n),done=b.goals.includes(n);put("box",x,.45,z,.72,.72,.72,done?"#90b994":"#c58c58");put("box",x,.818,z,.12,.032,.7,"#edd192");});
 b.gems.forEach((p,i)=>{if(s.jewels&(1<<i))return;const [x,,z]=point(b,p);put("gem",x,.56,z,.43,.71,.41,b.game==="maze"?"#edb750":"#65babe");});
 if(b.game==="play")directions.forEach((d,i)=>{const [x,,z]=point(b,nextCell(b,b.start,d));put("pot",x,.15,z,.83,.14,.83,padColors[i]);if(d===cue){put("gem",x,.62,z,.52,.73,.52,"#fff5b2");}});
 return pieces;
}
