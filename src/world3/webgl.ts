import * as T from "three";
import {place,scaleFor,type Surface,type Anchor,type Frame} from "./view";
import type {Piece,Shape} from "./scenery";

export function glSurface(canvas:HTMLCanvasElement,anchor:Anchor):Surface{
 const renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));
 renderer.outputColorSpace=T.SRGBColorSpace;
 const scene=new T.Scene(),cam=new T.OrthographicCamera(-1,1,1,-1,.1,100);
 const sky=new T.HemisphereLight("#fff4dc","#c2cbcf",2.25),sun=new T.DirectionalLight("#fff4db",2.1);
 sun.position.set(4,10,5);scene.add(sky,sun);
 const shapes:Record<Shape,T.BufferGeometry>={box:new T.BoxGeometry(),pot:new T.CylinderGeometry(.5,.39,1,14),ball:new T.SphereGeometry(.5,12,8),cone:new T.ConeGeometry(.5,1,12),gem:new T.OctahedronGeometry(.5)};
 const material=new T.MeshStandardMaterial({roughness:.89});
 let fixed:Piece[]|null=null,marks:Piece[]|null=null,lastW=0,lastH=0;
 const terrain=new T.Group(),dynamic=new T.Group();scene.add(terrain,dynamic);
 const matrix=new T.Matrix4(),t=new T.Vector3(),s=new T.Vector3(),q=new T.Quaternion(),color=new T.Color();
 const purge=(group:T.Group)=>{for(const m of [...group.children]){group.remove(m);if(m instanceof T.InstancedMesh)m.dispose();}};
 const batch=(group:T.Group,items:Piece[])=>{
   purge(group);
   for(const k of Object.keys(shapes) as Shape[]){const subset=items.filter(i=>i.shape===k);if(!subset.length)continue;
    const mesh=new T.InstancedMesh(shapes[k],material,subset.length);mesh.userData.items=subset;
    subset.forEach((o,i)=>{matrix.compose(t.set(o.x,o.y,o.z),q,s.set(o.w,o.h,o.d));mesh.setMatrixAt(i,matrix);mesh.setColorAt(i,color.set(o.color));});group.add(mesh);}
 };
 function draw(f:Frame){
 const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return;
 if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);lastW=w;lastH=h;}
 const scale=scaleFor(f,w,h),center=f.scene.center;
 cam.left=-w/(2*scale);cam.right=-cam.left;cam.top=h/(2*scale);cam.bottom=-cam.top;
 cam.position.set(center[0]+Math.sin(f.yaw)*23,center[1]+14.4,center[2]+Math.cos(f.yaw)*23);cam.lookAt(...center);cam.updateProjectionMatrix();
 sky.intensity=f.scene.night?1.55:2.05;sun.intensity=f.scene.night?1.4:1.95;
 if(fixed!==f.scene.fixed){fixed=f.scene.fixed;batch(terrain,fixed);}
 if(marks!==f.markers){marks=f.markers;batch(dynamic,marks);}
 renderer.render(scene,cam);const projected=t.set(...f.buddy).project(cam);
 place(anchor,(projected.x+1)*w*.5,(1-projected.y)*h*.5,scale,f.scene.room);
 }
 const caster=new T.Raycaster();
 return {draw,pick(x,y){caster.setFromCamera(new T.Vector2(2*x/canvas.clientWidth-1,1-2*y/canvas.clientHeight),cam);const hit=caster.intersectObjects(terrain.children)[0];return hit?.instanceId===undefined?undefined:(hit.object.userData.items as Piece[])[hit.instanceId]?.action;},destroy(){purge(terrain);purge(dynamic);Object.values(shapes).forEach(g=>g.dispose());material.dispose();renderer.dispose();renderer.forceContextLoss();}};
}
