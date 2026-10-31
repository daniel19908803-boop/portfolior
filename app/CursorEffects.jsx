'use client';
import { useEffect, useRef } from 'react';

const MAX_STARS = 120;

function starSprite(color) {
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 64;
  const ctx = sprite.getContext('2d');
  if (!ctx) return sprite;
  const glow = ctx.createRadialGradient(32,32,0,32,32,31);
  glow.addColorStop(0,color);
  glow.addColorStop(.16,color+'80');
  glow.addColorStop(1,color+'00');
  ctx.fillStyle = glow;
  ctx.fillRect(0,0,64,64);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i=0;i<8;i++) {
    const angle=i*Math.PI/4-Math.PI/2, radius=i%2 ? 2.5 : 17;
    const x=32+Math.cos(angle)*radius, y=32+Math.sin(angle)*radius;
    if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle='#ffffff';
  ctx.beginPath();ctx.arc(32,32,1.7,0,Math.PI*2);ctx.fill();
  return sprite;
}

function raiseOverlay(canvas) {
  // A manual popover keeps the decorative canvas above native project dialogs.
  if (!canvas?.showPopover) return;
  try {
    if (canvas.matches(':popover-open')) canvas.hidePopover();
    canvas.showPopover();
  } catch { /* Ordinary fixed positioning remains the fallback. */ }
}

export default function CursorEffects({ enabled, overlayKey }) {
  const canvasRef=useRef(null);

  useEffect(()=>{
    const canvas=canvasRef.current;
    const ctx=canvas?.getContext('2d');
    if (!canvas || !ctx || !enabled) return;

    const finePointer=matchMedia('(any-pointer: fine)');
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    let allowed=finePointer.matches&&!reducedMotion.matches;
    let width=0,height=0,frame=0,lastTime=0,initialized=false;
    let stars=[],ribbon=[],sprites=[],rgb='137,223,229',litCard=null;
    const pointer={x:0,y:0,target:null};
    const follower={x:0,y:0};

    const clearCard=()=>{
      if (!litCard) return;
      litCard.removeAttribute('data-cursor-lit');
      litCard.style.removeProperty('--cursor-x');
      litCard.style.removeProperty('--cursor-y');
      litCard=null;
    };
    const hide=()=>{
      canvas.removeAttribute('data-active');
      if (canvas.hidePopover) {
        try { canvas.hidePopover(); } catch {}
      }
    };
    const reset=()=>{
      cancelAnimationFrame(frame);frame=0;
      stars=[];ribbon=[];initialized=false;pointer.target=null;
      ctx.clearRect(0,0,width,height);clearCard();hide();
    };
    const resize=()=>{
      reset();width=innerWidth;height=innerHeight;
      const dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(4000000/(width*height)));
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      ctx.setTransform(dpr,0,0,dpr,0,0);
    };
    const updateTheme=()=>{
      const style=getComputedStyle(document.documentElement);
      const accent=style.getPropertyValue('--accent').trim()||'#89dfe5';
      rgb=style.getPropertyValue('--accent-rgb').trim()||'137,223,229';
      sprites=[starSprite(accent),starSprite('#f1fbff')];
    };
    const emit=(x,y,dx,dy)=>{
      if (stars.length>=MAX_STARS) stars.shift();
      const spread=Math.random()*Math.PI*2;
      stars.push({
        x:x+(Math.random()-.5)*10,y:y+(Math.random()-.5)*10,
        vx:dx*.045+Math.cos(spread)*(5+Math.random()*14),
        vy:dy*.045+Math.sin(spread)*(5+Math.random()*14),
        size:12+Math.random()*17,age:0,life:.55+Math.random()*.55,
        angle:Math.random()*Math.PI,spin:(Math.random()-.5)*1.1,
        sprite:Math.random()<.75?0:1,
      });
    };
    const draw=now=>{
      frame=0;
      const dt=Math.min((now-lastTime)/1000,.04);lastTime=now;
      ctx.clearRect(0,0,width,height);
      const oldX=follower.x,oldY=follower.y;
      const ease=1-Math.exp(-24*dt);
      follower.x+=(pointer.x-follower.x)*ease;
      follower.y+=(pointer.y-follower.y)*ease;
      const dx=follower.x-oldX,dy=follower.y-oldY,distance=Math.hypot(dx,dy);
      if (distance>.4) {
        // Interpolate along the path so fast motion leaves a continuous stream.
        const count=Math.min(16,Math.ceil(distance/7));
        for (let i=1;i<=count;i++) emit(oldX+dx*i/count,oldY+dy*i/count,dx/dt,dy/dt);
        ribbon.push({x:follower.x,y:follower.y,time:now});
        if (ribbon.length>28) ribbon.shift();
      }
      ribbon=ribbon.filter(point=>now-point.time<450);
      ctx.globalCompositeOperation='lighter';
      if (ribbon.length>2) {
        const first=ribbon[0],last=ribbon[ribbon.length-1];
        const gradient=ctx.createLinearGradient(first.x,first.y,last.x,last.y);
        gradient.addColorStop(0,`rgba(${rgb},0)`);
        gradient.addColorStop(1,`rgba(${rgb},.3)`);
        ctx.strokeStyle=gradient;ctx.lineWidth=1;ctx.lineCap='round';
        ctx.beginPath();ctx.moveTo(first.x,first.y);
        for (let i=1;i<ribbon.length-1;i++) {
          const point=ribbon[i],next=ribbon[i+1];
          ctx.quadraticCurveTo(point.x,point.y,(point.x+next.x)/2,(point.y+next.y)/2);
        }
        ctx.lineTo(last.x,last.y);ctx.stroke();
      }
      stars=stars.filter(star=>{
        star.age+=dt;
        if (star.age>=star.life) return false;
        star.x+=star.vx*dt;star.y+=star.vy*dt;
        star.vx*=Math.exp(-dt*2);star.vy-=7*dt;
        star.angle+=star.spin*dt;
        const fade=Math.pow(1-star.age/star.life,1.5);
        const size=star.size*(.65+.35*fade);
        ctx.save();ctx.translate(star.x,star.y);ctx.rotate(star.angle);
        ctx.globalAlpha=Math.min(1,star.age/.035)*fade*.85;
        ctx.drawImage(sprites[star.sprite],-size/2,-size/2,size,size);
        ctx.restore();
        return true;
      });
      ctx.globalCompositeOperation='source-over';
      if (pointer.target?.isConnected) {
        if (litCard!==pointer.target) { clearCard();litCard=pointer.target; }
        const bounds=litCard.getBoundingClientRect();
        litCard.style.setProperty('--cursor-x',`${pointer.x-bounds.left}px`);
        litCard.style.setProperty('--cursor-y',`${pointer.y-bounds.top}px`);
        litCard.setAttribute('data-cursor-lit','');
      } else clearCard();
      if (stars.length || ribbon.length || Math.hypot(pointer.x-follower.x,pointer.y-follower.y)>.4) {
        frame=requestAnimationFrame(draw);
      } else hide();
    };
    const move=event=>{
      if (!allowed || document.hidden) return;
      if (event.pointerType==='touch') { reset();return; }
      pointer.x=event.clientX;pointer.y=event.clientY;
      pointer.target=event.target instanceof Element?event.target.closest('.project-card,.stack-card'):null;
      if (!initialized) {
        follower.x=pointer.x;follower.y=pointer.y;initialized=true;
        for (let i=0;i<3;i++) emit(pointer.x,pointer.y,0,0);
      }
      if (!canvas.hasAttribute('data-active')) { canvas.setAttribute('data-active','');raiseOverlay(canvas); }
      if (!frame) { lastTime=performance.now();frame=requestAnimationFrame(draw); }
    };
    const leave=event=>{if (!event.relatedTarget) reset();};
    const preference=()=>{allowed=finePointer.matches&&!reducedMotion.matches;if (!allowed) reset();};
    const scroll=()=>{pointer.target=null;clearCard();};
    resize();updateTheme();
    window.addEventListener('pointermove',move,{passive:true});
    window.addEventListener('pointerout',leave,{passive:true});
    window.addEventListener('pointercancel',reset,{passive:true});
    window.addEventListener('blur',reset);
    window.addEventListener('resize',resize,{passive:true});
    window.addEventListener('scroll',scroll,{passive:true,capture:true});
    window.addEventListener('portfolio-theme',updateTheme);
    document.addEventListener('visibilitychange',reset);
    finePointer.addEventListener('change',preference);
    reducedMotion.addEventListener('change',preference);
    return()=>{
      reset();
      window.removeEventListener('pointermove',move);
      window.removeEventListener('pointerout',leave);
      window.removeEventListener('pointercancel',reset);
      window.removeEventListener('blur',reset);
      window.removeEventListener('resize',resize);
      window.removeEventListener('scroll',scroll,true);
      window.removeEventListener('portfolio-theme',updateTheme);
      document.removeEventListener('visibilitychange',reset);
      finePointer.removeEventListener('change',preference);
      reducedMotion.removeEventListener('change',preference);
    };
  },[enabled]);

  useEffect(()=>{
    const frame=requestAnimationFrame(()=>{
      const canvas=canvasRef.current;
      if (canvas?.hasAttribute('data-active')) raiseOverlay(canvas);
    });
    return()=>cancelAnimationFrame(frame);
  },[overlayKey]);

  return <canvas ref={canvasRef} className="cursor-stars" aria-hidden="true" popover="manual"/>;
}
