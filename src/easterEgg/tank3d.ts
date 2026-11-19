/** Real lightweight WebGL 3D rendering for the fictional Winter Front arcade.
 * Uses the Three.js version already installed in Focus Buddy.
 * Game mechanics remain in tankGame.ts; the renderer is presentation-only.
 */
import * as THREE from "three";
import { TANK_WIDTH, TANK_HEIGHT, type TankInput, type TankState, type Ally } from "./tankGame";
import { USA_TANK_FLAG_URL } from "./tankPaint";

type TankVisual = { root:THREE.Group; turret:THREE.Group };
export type Tank3DRenderer = {
  draw: (state:TankState,input:TankInput,time:number) => void;
  resize: (width:number,height:number) => void;
  pick: (u:number,v:number) => {x:number;y:number};
  dispose: () => void;
};
const rnd=(n:number)=>{const x=Math.sin(n*78.233)*43758.5453;return x-Math.floor(x);};
const gx=(x:number)=>(x-TANK_WIDTH/2)/34;
const gz=(y:number)=>(y-TANK_HEIGHT/2)/27;
const mat=(color:number)=>new THREE.MeshLambertMaterial({color});
const snowMat=mat(0xe1ecf0), snowLite=mat(0xf5f8f1), coldBlue=mat(0x9bb5c6),
  treeMat=mat(0x3b786d), treeBright=mat(0x70a992), trunkMat=mat(0x644c42),
  roadMat=mat(0xb8cbd2), buildingMat=mat(0x8498a9),
  warmLight=new THREE.MeshBasicMaterial({color:0xffe5b1}),
  allyUniform=mat(0x5b8c69), allyHelmet=mat(0x668e77);
const boxGeo=new THREE.BoxGeometry(1,1,1);
const shellGeo=new THREE.SphereGeometry(1,8,6);
const cylinderGeo=new THREE.CylinderGeometry(1,1,1,8);
function addBox(group:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,
  material:THREE.Material,rotY=0) {
  const mesh=new THREE.Mesh(boxGeo,material);
  mesh.position.set(x,y,z);mesh.scale.set(w,h,d);mesh.rotation.y=rotY;
  group.add(mesh);return mesh;
}
function addSphere(group:THREE.Object3D,x:number,y:number,z:number,
  radius:number,material:THREE.Material) {
  const m=new THREE.Mesh(shellGeo,material);
  m.position.set(x,y,z);m.scale.setScalar(radius);group.add(m);return m;
}
function addCylinder(group:THREE.Object3D,x:number,y:number,z:number,
  radius:number,height:number,material:THREE.Material) {
  const mesh=new THREE.Mesh(cylinderGeo,material);
  mesh.position.set(x,y,z);mesh.scale.set(radius,height,radius);group.add(mesh);return mesh;
}
function makeTank(player:boolean,flagMaterial:THREE.Material):TankVisual {
  const root=new THREE.Group();
  const main=mat(player?0x6a8558:0x74838d);
  const light=mat(player?0x9bac77:0xadbcc3);
  const dark=mat(player?0x354a3b:0x334956);
  const tread=mat(0x283740);
  const metal=mat(player?0x9ba87c:0x9eb2b7);
  const chassis=new THREE.Group();
  root.add(chassis);
  // Physical low-poly height/width/depth create actual 3D parallax.
  addBox(chassis,0,.53,0,1.5,.62,2.3,main);
  addBox(chassis,0,.94,-.18,1.15,.2,1.48,light);
  for(const sign of [-1,1]) {
    addBox(chassis,sign*.83,.4,0,.33,.7,2.65,tread);
    addBox(chassis,sign*.8,.48,0,.16,.44,2.36,dark);
    for(let i=0;i<4;i++)addCylinder(chassis,sign*.95,.4,(i-1.5)*.6,.17,.16,metal);
  }
  addBox(chassis,0,.5,-1.1,.7,.27,.4,dark);
  const turret=new THREE.Group();turret.position.y=1.17;
  chassis.add(turret);
  addCylinder(turret,0,.19,0,.67,.5,main);
  addBox(turret,0,.35,-.2,.82,.31,.75,light);
  addBox(turret,0,.19,-1.23,.22,.22,1.7,metal);
  addBox(turret,0,.19,-2.05,.32,.32,.18,dark);
  addCylinder(turret,-.27,.54,.14,.17,.1,metal);
  if(player) {
    // Friendly red star as a small decorative badge; no historical claims.
    const star=addBox(turret,0,.58,0,.35,.03,.33,mat(0xd9b66e));
    star.rotation.y=Math.PI/4;
  } else {
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.35,6),metal);
    pole.position.set(.72,1.45,.72);root.add(pole);
    const flag=new THREE.Mesh(new THREE.PlaneGeometry(.97,.58),flagMaterial);
    flag.position.set(1.23,1.93,.72);
    flag.rotation.y=-.1;
    root.add(flag);
  }
  // Cast-free fake ground shadow, inexpensive on low-power GPUs.
  const shadow=new THREE.Mesh(
    new THREE.CircleGeometry(1.6,16),
    new THREE.MeshBasicMaterial({color:0x244048,transparent:true,opacity:.24,depthWrite:false}),
  );
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.02;
  root.add(shadow);
  if(!player)root.rotation.y=Math.PI;
  return {root,turret};
}
function makeAlly(kind:Ally["kind"]) {
  const root=new THREE.Group();
  const body=kind==="ranger"?mat(0x547685):kind==="guard"?mat(0x728d61):allyUniform;
  const skin=mat(0xe0b89b);
  addBox(root,-.16,.27,0,.18,.5,.22,body);
  addBox(root,.16,.27,0,.18,.5,.22,body);
  addBox(root,0,.79,0,.53,.53,.34,body);
  addBox(root,-.37,.76,0,.2,.46,.22,body);
  addBox(root,.37,.76,0,.2,.46,.22,body);
  addSphere(root,0,1.22,0,.22,skin);
  addCylinder(root,0,1.43,0,.31,.18,allyHelmet);
  addBox(root,.06,.83,-.3,.17,.13,.7,coldBlue);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(.48,12),
    new THREE.MeshBasicMaterial({color:0x375449,transparent:true,opacity:.28}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;root.add(shadow);
  return root;
}
function makeTerrain(scene:THREE.Scene) {
  const earth=new THREE.Mesh(new THREE.PlaneGeometry(38,30),snowMat);
  earth.rotation.x=-Math.PI/2;scene.add(earth);
  const road=new THREE.Mesh(new THREE.PlaneGeometry(11,26),roadMat);
  road.rotation.x=-Math.PI/2;road.position.y=.014;scene.add(road);
  // Roads and lane markings are 3D scene meshes, not fake 2D textures.
  const dash=mat(0xe1eee9);
  for(let i=-9;i<=9;i+=2) addBox(scene,0,.032,i,.1,.018,.7,dash);
  const bank=new THREE.Mesh(new THREE.BoxGeometry(37,.55,.8),coldBlue);
  bank.position.set(0,.27,11.4);scene.add(bank);
  for(let i=0;i<13;i++) {
    const x=-17+i*2.8;
    const h=1.5+(i*7%4)*.6;
    addBox(scene,x,h/2,-13.2,2.1,h,1.9,buildingMat);
    addBox(scene,x,h+.04,-13.2,2.2,.22,2.1,snowLite);
    for(let j=0;j<2;j++) {
      addBox(scene,x- .4+j*.8,h*.57,-12.17,.25,.3,.06,warmLight);
    }
  }
  for(let i=0;i<26;i++) {
    const right=i%2===0;
    const x=(right?1:-1)*(9.9+rnd(i*2)*7.2);
    const z=-10.4+rnd(i*3+1)*20.5;
    const height=1.3+rnd(i*5+2)*2.4;
    addCylinder(scene,x,height*.22,z,.14,height*.45,trunkMat);
    const cone=new THREE.Mesh(new THREE.ConeGeometry(.8+height*.15,height,6),
      i%3===0?treeBright:treeMat);
    cone.position.set(x,height*.65,z);
    scene.add(cone);
    const cap=new THREE.Mesh(new THREE.ConeGeometry(.42+height*.1,.5,6),snowLite);
    cap.position.set(x,height*1.09,z);
    scene.add(cap);
  }
  for(let i=0;i<65;i++) {
    const x=-16+rnd(i*3+12)*32,z=-10+rnd(i*7+3)*20;
    const stone=addBox(scene,x,.045,z,.15+rnd(i)*.27,.09,.16, i%3?snowLite:coldBlue);
    stone.rotation.y=rnd(i*11)*6.2;
  }
}
function createFlagMaterial() {
  const canvas=document.createElement("canvas");
  canvas.width=128;canvas.height=76;
  const ctx=canvas.getContext("2d");
  if(ctx) {
    ctx.fillStyle="#fff";ctx.fillRect(0,0,128,76);
    for(let i=0;i<7;i++){
      ctx.fillStyle="#ba4454";ctx.fillRect(0,i*11,128,5);
    }
    ctx.fillStyle="#345b91";ctx.fillRect(0,0,55,39);
  }
  const placeholder=new THREE.CanvasTexture(canvas);
  const material=new THREE.MeshBasicMaterial({map:placeholder,side:THREE.DoubleSide});
  // Exact repo image, reused by all enemies, not copied into each tank.
  new THREE.TextureLoader().load(
    USA_TANK_FLAG_URL,
    texture => { texture.colorSpace=THREE.SRGBColorSpace;material.map=texture;material.needsUpdate=true; },
    undefined,
    () => { /* Keep fallback flag if network is unavailable. */ },
  );
  return material;
}
function makeBallPool(scene:THREE.Scene,max:number,radius:number,color:number) {
  const material=new THREE.MeshBasicMaterial({color});
  const geometry=new THREE.SphereGeometry(radius,7,5);
  return Array.from({length:max},()=>{
    const sphere=new THREE.Mesh(geometry,material);
    sphere.visible=false;scene.add(sphere);return sphere;
  });
}
/** Creates and owns exactly one WebGL context. Throws to allow 2D fallback. */
export function createTank3D(mount:HTMLElement):Tank3DRenderer {
  const renderer=new THREE.WebGLRenderer({antialias:false,alpha:false,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.35));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.setClearColor(0xa4bece);
  renderer.shadowMap.enabled=false;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0xaac2cf);
  scene.fog=new THREE.FogExp2(0xaac2cf,.018);
  scene.add(new THREE.HemisphereLight(0xf7f9eb,0x5a7181,2.4));
  const sun=new THREE.DirectionalLight(0xffe5bf,2);
  sun.position.set(-5,14,7);scene.add(sun);
  makeTerrain(scene);
  const camera=new THREE.PerspectiveCamera(52,5/3,.1,150);
  camera.position.set(0,25,27);
  camera.lookAt(0,0,0);
  const flagMaterial=createFlagMaterial();
  const player=makeTank(true,flagMaterial);
  scene.add(player.root);
  const enemies=new Map<number,TankVisual>();
  const allies=new Map<number,THREE.Group>();
  const playerShots=makeBallPool(scene,26,.13,0xffe2a6);
  const allyShots=makeBallPool(scene,32,.13,0xc7fff0);
  const hostileShots=makeBallPool(scene,30,.11,0xf3a5a3);
  const blastGeometry=new THREE.TorusGeometry(1,.045,4,32);
  const blasts=Array.from({length:5},()=>{
    const m=new THREE.Mesh(blastGeometry,new THREE.MeshBasicMaterial({
      color:0xffdf9f,transparent:true,opacity:.8,depthWrite:false,
    }));
    m.rotation.x=Math.PI/2;m.visible=false;scene.add(m);return m;
  });
  mount.appendChild(renderer.domElement);
  renderer.domElement.className="tank-webgl-canvas";
  renderer.domElement.setAttribute("aria-hidden","true");
  function resize(width:number,height:number){
    const w=Math.max(320,width),h=Math.max(180,height);
    camera.aspect=w/h;
    camera.updateProjectionMatrix();
    renderer.setSize(w,h,false);
  }
  function balls(pool:THREE.Mesh[],shots:TankState["shots"]){
    for(let i=0;i<pool.length;i++) {
      const shot=shots[i];const ball=pool[i];
      ball.visible=!!shot;
      if(shot)ball.position.set(gx(shot.x),1.1,gz(shot.y));
    }
  }
  function draw(state:TankState,input:TankInput,time:number){
    player.root.position.set(gx(state.player.x),0,gz(state.player.y));
    const angle=Math.atan2(
      (input.aimX-state.player.x)/34,
      -(input.aimY-state.player.y)/27,
    );
    player.turret.rotation.y=angle;
    player.root.rotation.z=Math.sin(time*7)*.008;
    player.root.visible=state.player.invulnerable<=0||Math.sin(time*24)>.25;
    const present=new Set(state.troops.map(t=>t.id));
    for(const [id,visual] of enemies) if(!present.has(id)){
      scene.remove(visual.root);enemies.delete(id);
    }
    for(const enemy of state.troops){
      let visual=enemies.get(enemy.id);
      if(!visual){
        visual=makeTank(false,flagMaterial);
        scene.add(visual.root);enemies.set(enemy.id,visual);
      }
      const scale=enemy.type==="armored"?1.2:enemy.type==="scout"?.78:.95;
      visual.root.scale.setScalar(scale);
      visual.root.position.set(gx(enemy.x),0,gz(enemy.y));
      visual.turret.rotation.y=Math.sin(time+enemy.id)*.15;
    }
    const activeAllies=new Set(state.allies.map(ally=>ally.id));
    for(const [id,unit] of allies) if(!activeAllies.has(id)) {
      scene.remove(unit);allies.delete(id);
    }
    for(const ally of state.allies){
      let unit=allies.get(ally.id);
      if(!unit){
        unit=makeAlly(ally.kind);
        scene.add(unit);allies.set(ally.id,unit);
      }
      unit.position.set(gx(ally.x),0,gz(ally.y));
      unit.rotation.y=Math.sin(time*2+ally.id)*.08;
    }
    balls(playerShots,state.shots);
    balls(allyShots,state.allyShots);
    balls(hostileShots,state.hostileShots);
    for(let i=0;i<blasts.length;i++){
      const effect=state.missileBlasts[i],mesh=blasts[i];
      mesh.visible=!!effect;
      if(!effect)continue;
      const progress=Math.min(1,effect.age/effect.ttl);
      const radius=(effect.radius/34)*(.22+progress*.78);
      mesh.position.set(gx(effect.x),.08,gz(effect.y));
      mesh.scale.set(radius,radius,radius);
      (mesh.material as THREE.MeshBasicMaterial).opacity=(1-progress)*.8;
    }
    renderer.render(scene,camera);
  }
  const raycaster=new THREE.Raycaster();
  const surfacePlane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
  const hit=new THREE.Vector3();
  function pick(u:number,v:number){
    raycaster.setFromCamera(new THREE.Vector2(u*2-1,1-v*2),camera);
    const point=raycaster.ray.intersectPlane(surfacePlane,hit);
    if(!point)return {x:TANK_WIDTH/2,y:30};
    return {x:point.x*34+TANK_WIDTH/2,y:point.z*27+TANK_HEIGHT/2};
  }
  function dispose(){
    renderer.dispose();
    // Shared geometries/materials from scene and unique meshes released.
    const geometries=new Set<THREE.BufferGeometry>();
    const materials=new Set<THREE.Material>();
    scene.traverse(object=>{
      if(!(object instanceof THREE.Mesh))return;
      geometries.add(object.geometry);
      const assigned=Array.isArray(object.material)?object.material:[object.material];
      assigned.forEach(material=>materials.add(material));
    });
    geometries.forEach(geometry=>geometry.dispose());
    materials.forEach(material=>material.dispose());
    flagMaterial.map?.dispose();
    renderer.domElement.remove();
  }
  return {draw,resize,pick,dispose};
}
