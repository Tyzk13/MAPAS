// @ts-nocheck — código portado do HTML original.
// Importar um .glb do computador como mapa novo, com jardim e decoração opcionais ao redor (frente = +z).
// Nomes das peças: floor/piso/chao = onde se pisa · wall/parede = colide ao caminhar · roof/telhado = camada "Telhado"
import * as THREE from 'three';
import { begin, seed, rnd, mat, cyl, inst, PL, TX, cl, halo, mistTex } from './kit';

export function dressSite(sz, M){const R2=Math.max(sz.x,sz.z),hx=sz.x/2,hz=sz.z/2,fz=hz+2;seed(21);const G=M.G,walk=M.walk,MS=M.mist;const {grass,cob}=TX();const lampM=new THREE.MeshBasicMaterial({color:0x7a7468});M.lamps.push(lampM);
 const fl2=(w,d,x,z,y,m)=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),m);p.rotation.x=-Math.PI/2;p.position.set(x,y,z);p.userData.ns=1;G.add(p);return p};
 const gt=new THREE.Mesh(new THREE.PlaneGeometry(400,400,80,80),mat(0xffffff,{map:grass,bumpMap:grass,bumpScale:2,roughness:1})),gp=gt.geometry.attributes.position;
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=-gp.getY(i),m=Math.min(1,Math.max(0,(Math.hypot(x,z)-(R2*.8+22))/22));gp.setZ(i,m*(Math.sin(x*.21)+Math.sin(z*.17)+1.3*Math.sin((x+z)*.11)+2)*.16)}
 gt.geometry.computeVertexNormals();gt.rotation.x=-Math.PI/2;gt.position.y=-.06;gt.userData.ns=1;gt.receiveShadow=true;G.add(gt);walk.push(gt);
 const tr=[],cr=[],tf=[],fw=[],lf=[],FL=[0xf4f1ea,0xe9dfe0,0xd8d6cc];
 for(let i=0;i<80;i++){const a=rnd()*6.283,r=R2*.7+12+rnd()*55,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<hx+7&&Math.abs(z)<hz+7)continue;if(Math.abs(x)<4&&z>0)continue;const h=3+rnd()*4,b=1.6+rnd()*1.6;tr.push({x:x,y:h/2-.06,z:z,sx:1.3,sy:h});cr.push({x:x,y:h+b*.6,z:z,sx:b*1.3,sy:b*1.1,sz:b*1.3,c:[0x23402a,0x2a4a30,0x1f3a28,0x2f4f2e][rnd()*4|0],r:rnd()*6})}
 inst(new THREE.CylinderGeometry(.18,.28,1,8),mat(0x5b3f28),tr);inst(new THREE.IcosahedronGeometry(1,1),mat(0xffffff,{flatShading:true}),cr,1).userData.canopy=1;
 for(let i=0;i<700;i++){const x=(rnd()-.5)*(R2*2+60),z=(rnd()-.5)*(R2*2+60);if((Math.abs(x)<hx+2&&Math.abs(z)<hz+2)||(Math.abs(x)<2&&z>0))continue;tf.push({x:x,y:-.06,z:z,sx:.8+rnd()*.8,sy:.6+rnd()*1.2,r:rnd()*6,c:[0x364f2c,0x2f4a2a,0x445c33][rnd()*3|0]})}
 inst(new THREE.ConeGeometry(.12,.8,4),mat(0xffffff),tf,1);
 const L=Math.max(30,R2);fl2(3.4,L,0,fz+L/2,-.05,mat(0xffffff,{map:cl(cob,1,Math.round(L/3.5)),roughness:.5}));fl2(1.4,L,0,fz+L/2,-.04,mat(0xefece4,{roughness:.9}));
 for(let z=fz+3;z<fz+L;z+=3)[-1,1].forEach(q=>{for(let k=0;k<5;k++)fw.push({x:q*1.2+(rnd()-.5)*.5,y:.1+rnd()*.25,z:z+(rnd()-.5)*.5,sx:.1+rnd()*.07,c:FL[rnd()*3|0]});lf.push({x:q*1.2,y:0,z:z,sx:.3,sy:.15,sz:.3,c:0x2f4f2e})});
 const az=fz+Math.min(14,L*.4),ac=new THREE.Mesh(new THREE.TorusGeometry(2.1,.08,8,32,Math.PI),mat(0xcfc9bc));ac.position.set(0,-.06,az);G.add(ac);
 for(let k=0;k<=30;k++){const a=k/30*Math.PI,x=Math.cos(a)*2.1,y=-.06+Math.sin(a)*2.1;lf.push({x:x,y:y,z:az,sx:.2,sy:.16,sz:.2,c:0x2f4f2e});for(let j=0;j<2;j++)fw.push({x:x+(rnd()-.5)*.2,y:y+(rnd()-.5)*.2,z:az+(rnd()-.5)*.25,sx:.09+rnd()*.06,c:FL[rnd()*3|0]})}
 const fm2=mat(0xffffff,{roughness:.8});inst(new THREE.IcosahedronGeometry(1,0),fm2,fw,1);inst(new THREE.IcosahedronGeometry(1,0),fm2,lf,1);
 for(let z=fz+3,i=0;z<fz+L;z+=8,i++)[-2.6,2.6].forEach(x=>{cyl(.06,.08,2.8,x,1.34,z,0x1d1d22);const b=new THREE.Mesh(new THREE.SphereGeometry(.22,10,10),lampM);b.position.set(x,2.7,z);b.userData.ns=1;G.add(b);halo(x,2.7,z,3);if(i<2)PL(x,2.6,z,0,1.5,16)});
 halo(-1.8,3,fz,2.6);halo(1.8,3,fz,2.6);PL(0,2.6,fz+.5,0,1.6,12);
 const mt=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),r=g.createRadialGradient(64,64,0,64,64,64);r.addColorStop(0,'rgba(255,255,255,.55)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();
 for(let i=0;i<40;i++){const m=new THREE.Sprite(new THREE.SpriteMaterial({map:mt,transparent:true,depthWrite:false,opacity:.2,color:0xaeb8c8,fog:false})),sc=14+rnd()*16;m.scale.set(sc,sc*.35,1);m.position.set((rnd()-.5)*(R2*2+60),.8+rnd()*2.2,(rnd()-.5)*(R2*2+60));m.userData.v=.15+rnd()*.25;G.add(m);MS.push(m)}}

export function buildGlb(M, root, k, dress){
  begin(M, 21);const G=M.G,walk=M.walk;
  if(root.userData.RG)root.userData.RG.children.slice().forEach(o=>root.attach(o));
  root.position.set(0,0,0);root.scale.setScalar(k);root.updateMatrixWorld(true);
  const bb=new THREE.Box3().setFromObject(root),sz=bb.getSize(new THREE.Vector3()),c=bb.getCenter(new THREE.Vector3());
  root.position.set(-c.x,-bb.min.y,-c.z);G.add(root);root.updateMatrixWorld(true);
  const roof=[],fl=[],all=[],solid=[],RG=new THREE.Group();
  root.traverse(o=>{if(!o.isMesh)return;o.castShadow=o.receiveShadow=true;const n=(o.name||'').toLowerCase();
   if(/roof|telhado|teto|ceiling|cobertura/.test(n)){roof.push(o);return}
   all.push(o);if(/floor|chao|chão|piso|ground|terreno|walk/.test(n))fl.push(o);if(/wall|parede|solid|colis/.test(n))solid.push(o);
   const m=o.material;if(m&&m.isMeshStandardMaterial&&m.envMapIntensity===1)m.envMapIntensity=.7});
  roof.forEach(o=>RG.attach(o));RG.visible=false;G.add(RG);root.userData.RG=RG;
  (fl.length?fl:all).forEach(o=>walk.push(o));
  const Lx=Math.ceil(sz.x/2)+1,Lz=Math.ceil(sz.z/2)+1,R2=Math.max(sz.x,sz.z);
  M.shadowRadius=R2;
  const gp=[];for(let x=-Lx;x<=Lx;x++)gp.push(x,.03,-Lz,x,.03,Lz);for(let z=-Lz;z<=Lz;z++)gp.push(-Lx,.03,z,Lx,.03,z);
  const gg=new THREE.BufferGeometry();gg.setAttribute('position',new THREE.Float32BufferAttribute(gp,3));const gl=new THREE.LineSegments(gg,new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.12}));gl.userData.ns=1;G.add(gl);
  M.layers=roof.length?[{n:'Telhado',o:RG,v:false}]:[];
  M.views=[{n:'Geral',p:[0,Math.max(6,R2*.6),R2*.9],t:[0,sz.y*.3,0]},{n:'Tática',p:[0,R2*1.2,.1],t:[0,0,0]}];
  M.solid=()=>solid;M.walkStart={x:0,z:0};
  M.vtt={areas:[{n:'Modelo inteiro',b:[-Lx,Lx,-Lz,Lz],lv:1}],walls:[],portals:[],lights:[]};
  if(dress){dressSite(sz,M);M.tick=()=>M.mist.forEach(m=>{m.position.x+=m.userData.v*.012;if(m.position.x>R2+60)m.position.x=-R2-60});M.vtt.areas.push({n:'Com terreno',b:[-R2-15,R2+15,-R2-15,R2+25],lv:1})}}
