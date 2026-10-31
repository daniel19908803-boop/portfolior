'use client';
import { useEffect } from 'react';

const clamp=value=>Math.max(0,Math.min(1,value));

export function heroExitProgress(hero) {
  if (!hero) return 0;
  const bounds=hero.getBoundingClientRect();
  const progress=clamp(-bounds.top/(bounds.height*.7));
  return progress*progress*(3-2*progress);
}

export function heroExitOpacity(progress) {
  const fade=clamp((progress-.12)/.78);
  return 1-fade*fade*(3-2*fade);
}

export default function useHeroExit(heroRef,motion) {
  useEffect(()=>{
    const hero=heroRef.current;
    if (!hero) return;
    const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0,previous=-1;
    const apply=progress=>{
      if (progress===previous) return;
      previous=progress;
      const opacity=heroExitOpacity(progress);
      hero.style.setProperty('--hero-exit',String(progress));
      hero.style.setProperty('--hero-exit-opacity',String(opacity));
      hero.toggleAttribute('data-hero-scattering',progress>0&&progress<1);
      // Fully faded controls should not retain keyboard focus or capture clicks.
      hero.inert=opacity<.02;
      window.dispatchEvent(new CustomEvent('portfolio-hero-exit',{detail:progress}));
    };
    const update=()=>{
      frame=0;
      apply(motion&&!reducedMotion.matches?heroExitProgress(hero):0);
    };
    const schedule=()=>{if (!frame) frame=requestAnimationFrame(update);};
    update();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule,{passive:true});
    window.addEventListener('pageshow',schedule);
    reducedMotion.addEventListener('change',schedule);
    return()=>{
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll',schedule);
      window.removeEventListener('resize',schedule);
      window.removeEventListener('pageshow',schedule);
      reducedMotion.removeEventListener('change',schedule);
      apply(0);
      hero.style.removeProperty('--hero-exit');
      hero.style.removeProperty('--hero-exit-opacity');
    };
  },[heroRef,motion]);
}
