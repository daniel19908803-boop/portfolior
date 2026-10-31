'use client';
import { useEffect, useRef } from 'react';

const properties=['--portrait-rx','--portrait-ry','--portrait-lift','--portrait-presence','--portrait-light-x','--portrait-light-y','--portrait-shine-angle','--portrait-shadow-x','--portrait-shadow-y'];

export default function PortraitCard({ motion }) {
  const surfaceRef=useRef(null),cardRef=useRef(null);

  useEffect(()=>{
    const surface=surfaceRef.current,card=cardRef.current;
    if (!surface || !card || !motion) return;
    const finePointer=matchMedia('(any-pointer: fine)');
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    const target={x:0,y:0,presence:0};
    const position={x:0,y:0,presence:0},velocity={x:0,y:0,presence:0};
    let frame=0,lastTime=0;
    const allowed=()=>finePointer.matches&&!reducedMotion.matches;
    const clearStyles=()=>{
      for (const property of properties) card.style.removeProperty(property);
      surface.removeAttribute('data-portrait-active');
    };
    const reset=()=>{
      cancelAnimationFrame(frame);frame=0;
      for (const axis of Object.keys(target)) target[axis]=position[axis]=velocity[axis]=0;
      clearStyles();
    };
    const paint=()=>{
      const presence=Math.max(0,Math.min(1,position.presence));
      card.style.setProperty('--portrait-rx',`${-position.y*7}deg`);
      card.style.setProperty('--portrait-ry',`${position.x*8}deg`);
      card.style.setProperty('--portrait-lift',`${-presence*5}px`);
      card.style.setProperty('--portrait-presence',String(presence));
      card.style.setProperty('--portrait-light-x',`${50+position.x*50}%`);
      card.style.setProperty('--portrait-light-y',`${50+position.y*50}%`);
      card.style.setProperty('--portrait-shine-angle',`${125+position.x*18-position.y*12}deg`);
      card.style.setProperty('--portrait-shadow-x',`${15-position.x*10}px`);
      card.style.setProperty('--portrait-shadow-y',`${25+presence*10}px`);
    };
    const draw=now=>{
      frame=0;
      const dt=Math.min((now-lastTime)/1000,.25);lastTime=now;
      // A damped spring gives the photo inertia instead of matching the cursor instantly.
      const steps=Math.max(1,Math.ceil(dt/.008)),step=dt/steps;
      for (let i=0;i<steps;i++) for (const axis of Object.keys(target)) {
        const acceleration=((target[axis]-position[axis])*110-velocity[axis]*23)/1.65;
        velocity[axis]+=acceleration*step;
        position[axis]+=velocity[axis]*step;
      }
      const settled=Object.keys(target).every(axis=>Math.abs(target[axis]-position[axis])<.001&&Math.abs(velocity[axis])<.002);
      if (settled) {
        for (const axis of Object.keys(target)) { position[axis]=target[axis];velocity[axis]=0; }
      }
      paint();
      if (!settled) frame=requestAnimationFrame(draw);
      else if (!target.presence) clearStyles();
    };
    const start=()=>{
      surface.setAttribute('data-portrait-active','');
      if (!frame) { lastTime=performance.now();frame=requestAnimationFrame(draw); }
    };
    const move=event=>{
      if (!allowed() || document.hidden) return;
      if (event.pointerType==='touch') { reset();return; }
      // Measure the stationary wrapper so tilting never changes the pointer's reference frame.
      const bounds=surface.getBoundingClientRect();
      target.x=Math.max(-1,Math.min(1,(event.clientX-bounds.left)/bounds.width*2-1));
      target.y=Math.max(-1,Math.min(1,(event.clientY-bounds.top)/bounds.height*2-1));
      target.presence=1;start();
    };
    const leave=()=>{target.x=target.y=target.presence=0;start();};
    const preference=()=>{if (!allowed()) reset();};
    surface.addEventListener('pointerenter',move,{passive:true});
    surface.addEventListener('pointermove',move,{passive:true});
    surface.addEventListener('pointerleave',leave,{passive:true});
    surface.addEventListener('pointercancel',reset,{passive:true});
    window.addEventListener('blur',reset);
    window.addEventListener('resize',reset,{passive:true});
    window.addEventListener('scroll',leave,{passive:true});
    document.addEventListener('visibilitychange',reset);
    finePointer.addEventListener('change',preference);
    reducedMotion.addEventListener('change',preference);
    return()=>{
      reset();
      surface.removeEventListener('pointerenter',move);
      surface.removeEventListener('pointermove',move);
      surface.removeEventListener('pointerleave',leave);
      surface.removeEventListener('pointercancel',reset);
      window.removeEventListener('blur',reset);
      window.removeEventListener('resize',reset);
      window.removeEventListener('scroll',leave);
      document.removeEventListener('visibilitychange',reset);
      finePointer.removeEventListener('change',preference);
      reducedMotion.removeEventListener('change',preference);
    };
  },[motion]);

  return <div ref={surfaceRef} className="portrait-interaction">
    <div ref={cardRef} className="identity-card portrait-card">
      <img className="identity-portrait" src="/gabriel-fonseca.webp" alt="Gabriel Fonseca" width={960} height={960} loading="lazy" decoding="async"/>
      <span className="portrait-reflection" aria-hidden="true"/>
      <div className="identity-bottom"><span>GABRIEL FONSECA</span><p>SOFTWARE ENGINEER<span>↗</span></p></div>
      <div className="identity-edge"/>
    </div>
  </div>;
}
