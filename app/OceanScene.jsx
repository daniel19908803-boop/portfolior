'use client';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const NAME_PARTICLE_SPACING = 10;
const NAME_PARTICLE_SIZE = 4.8;

export default function OceanScene({ motion, onReady }) {
  const host = useRef(null);
  useEffect(() => {
    const el = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ alpha:true, antialias:false, powerPreference:'low-power' }); }
    catch { return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));
    renderer.setClearColor(0,0);
    el.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45,1,.1,100);
    camera.position.z = 18;
    const color = new THREE.Color(getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#89dfe5');
    const material = new THREE.ShaderMaterial({
      transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      uniforms:{uColor:{value:color},uTime:{value:0},uDpr:{value:renderer.getPixelRatio()}},
      vertexShader:`attribute float size; varying float vAlpha; uniform float uTime; uniform float uDpr; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.); vAlpha=.85+.15*sin(uTime*.65+position.x*2.); gl_PointSize=size*uDpr*(18./-mv.z); gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`uniform vec3 uColor; varying float vAlpha; void main(){float d=length(gl_PointCoord-.5); if(d>.5)discard; float a=smoothstep(.5,.05,d)*vAlpha; gl_FragColor=vec4(mix(uColor,vec3(1.),.22),a);}`,
    });
    const text = document.createElement('canvas');
    text.width = 2200; text.height = 330;
    const ctx = text.getContext('2d', {willReadFrequently:true});
    ctx.fillStyle = 'white'; ctx.font = '600 256px Arial'; ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText('Gabriel Fonseca',1100,155);
    const pixels = ctx.getImageData(0,0,2200,330).data;
    const targets = [];
    // Larger, staggered points leave breathing room while preserving the letter shapes.
    for(let row=0,y=28;y<290;y+=NAME_PARTICLE_SPACING,row++) {
      const offset=row%2 ? NAME_PARTICLE_SPACING/2 : 0;
      for(let x=90+offset;x<2110;x+=NAME_PARTICLE_SPACING) {
        if(pixels[(y*2200+x)*4+3]>150) targets.push([x,y]);
      }
    }
    const count = targets.length;
    const positions = new Float32Array(count*3), origins = new Float32Array(count*3), sizes=new Float32Array(count), baseSizes=new Float32Array(count);
    for(let i=0;i<count;i++) {
      const angle=i*2.39996, r=7+Math.random()*17;
      origins[i*3]=Math.cos(angle)*r; origins[i*3+1]=Math.sin(angle)*r*.6; origins[i*3+2]=(Math.random()-.5)*15;
      baseSizes[i]=NAME_PARTICLE_SIZE+Math.random()*.9;sizes[i]=baseSizes[i];
    }
    positions.set(origins);
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.BufferAttribute(positions,3)); geo.setAttribute('size',new THREE.BufferAttribute(sizes,1));
    const name = new THREE.Points(geo,material); name.frustumCulled=false; scene.add(name);
    const starGeo=new THREE.BufferGeometry(), sp=new Float32Array(340*3), ss=new Float32Array(340);
    for(let i=0;i<340;i++){ sp[i*3]=(Math.random()-.5)*46;sp[i*3+1]=(Math.random()-.5)*26;sp[i*3+2]=-Math.random()*12;ss[i]=Math.random()*2+.5; }
    starGeo.setAttribute('position',new THREE.BufferAttribute(sp,3));starGeo.setAttribute('size',new THREE.BufferAttribute(ss,1));
    const stars=new THREE.Points(starGeo,material);scene.add(stars);
    const cols=170, rows=33, wp=new Float32Array(cols*rows*3), ws=new Float32Array(cols*rows).fill(.9);
    const waveGeo=new THREE.BufferGeometry();waveGeo.setAttribute('position',new THREE.BufferAttribute(wp,3));waveGeo.setAttribute('size',new THREE.BufferAttribute(ws,1));
    const waveMat=material.clone();waveMat.uniforms.uColor.value=color.clone();
    const wave=new THREE.Points(waveGeo,waveMat);wave.frustumCulled=false;scene.add(wave);
    let width=1,height=1,worldWidth=20,worldHeight=12,visible=true,renderStatic=()=>{};
    const resize=()=>{width=el.clientWidth;height=el.clientHeight;renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();worldHeight=2*Math.tan(Math.PI*45/360)*18;worldWidth=worldHeight*camera.aspect;for(let i=0;i<count;i++)sizes[i]=baseSizes[i]*Math.max(.3,Math.min(1,width/1280));geo.attributes.size.needsUpdate=true;if(!motion)renderStatic();};
    const ro=new ResizeObserver(resize);ro.observe(el);resize();
    const pointer={x:1000,y:1000};
    const move=e=>{const r=el.getBoundingClientRect();pointer.x=((e.clientX-r.left)/width-.5)*worldWidth;pointer.y=(.5-(e.clientY-r.top)/height)*worldHeight;};
    const leave=()=>{pointer.x=1000;pointer.y=1000;};
    window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerout',leave);
    const change=e=>{material.uniforms.uColor.value.set(e.detail);waveMat.uniforms.uColor.value.set(e.detail);if(!motion)renderStatic();};window.addEventListener('portfolio-theme',change);
    const io=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible&&!motion)renderStatic();});io.observe(el);
    const start=performance.now();
    const draw=()=>{
      if(!visible || document.hidden)return;
      const time=motion ? (performance.now()-start)/1000 : 4;
      const progress=THREE.MathUtils.smoothstep(time,.15,2.7), ease=1-Math.pow(1-progress,3);
      const scale=worldWidth*(width<600?.91:.86)/1900;
      for(let i=0;i<count;i++){
        const tx=(targets[i][0]-1100)*scale,ty=(155-targets[i][1])*scale + worldHeight*.055;
        const dx=tx-pointer.x,dy=ty-pointer.y,dist=Math.sqrt(dx*dx+dy*dy),force=motion ? Math.max(0,1-dist/1.8)*.65 : 0;
        positions[i*3]=origins[i*3]*(1-ease)+tx*ease+(dist>0?dx/dist*force:0);
        positions[i*3+1]=origins[i*3+1]*(1-ease)+ty*ease+(dist>0?dy/dist*force:0)+(motion?Math.sin(time*.7+i*.2)*.012:0);
        positions[i*3+2]=origins[i*3+2]*(1-ease)+(motion?Math.sin(time*.5+i*.15)*.11:0);
      }
      geo.attributes.position.needsUpdate=true;
      for(let z=0;z<rows;z++)for(let x=0;x<cols;x++){
        const i=(z*cols+x)*3, xx=(x/(cols-1)-.5)*worldWidth*1.8, zz=(z/rows)*15-9;
        wp[i]=xx;wp[i+1]=-worldHeight*.40+Math.sin(xx*.38+zz*.5+time*.28)*.30+Math.cos(xx*.2-zz*.6+time*.22)*.20;wp[i+2]=zz;
      }
      waveGeo.attributes.position.needsUpdate=true;material.uniforms.uTime.value=time;waveMat.uniforms.uTime.value=time;
      if(motion){stars.rotation.z=Math.sin(time*.025)*.008;name.rotation.y=pointer.x<100?pointer.x*.0015:0;}
      renderer.render(scene,camera);
    };
    renderStatic=draw;draw();if(motion)renderer.setAnimationLoop(draw);onReady?.();
    return()=>{renderer.setAnimationLoop(null);ro.disconnect();io.disconnect();window.removeEventListener('pointermove',move);window.removeEventListener('pointerout',leave);window.removeEventListener('portfolio-theme',change);geo.dispose();starGeo.dispose();waveGeo.dispose();material.dispose();waveMat.dispose();renderer.dispose();renderer.domElement.remove();};
  },[motion,onReady]);
  return <div ref={host} className="ocean-scene" aria-hidden="true" />;
}
