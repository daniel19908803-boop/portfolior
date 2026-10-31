import { writeFile } from 'node:fs/promises';
import { browser } from './browser.mjs';

const b=await browser(9249),{call,evaluate}=b;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const checks=[];
const assert=(condition,label)=>{if(!condition)throw new Error('FAIL: '+label);checks.push(label);console.log('PASS: '+label);};
const scroll=async fraction=>{
  await evaluate(`document.documentElement.style.scrollBehavior='auto';window.scrollTo({top:document.querySelector('.hero').offsetHeight*${fraction},behavior:'instant'});`);
  await evaluate('new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(true))))');
  await pause(150);
};
const state=()=>evaluate(`(()=>{const h=document.querySelector('.hero'),t=getComputedStyle(document.querySelector('.hero-topline>.availability'));return {progress:Number(h.style.getPropertyValue('--hero-exit')),opacity:Number(t.opacity),scale:Number(t.scale),inert:h.inert,overflow:document.documentElement.scrollWidth>innerWidth,aboutTop:document.getElementById('sobre').offsetTop};})()`);
const waitFor=async predicate=>{
  const deadline=Date.now()+5000;
  while(Date.now()<deadline){if(predicate(await state()))return true;await pause(80);}
  return false;
};
const screenshot=async name=>{const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('.preview/'+name+'.png',Buffer.from(shot.data,'base64'));};
try{
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('portfolio-motion','on');localStorage.setItem('portfolio-language','en');"});
  await call('Page.navigate',{url:(process.env.QA_BASE_URL||'http://127.0.0.1:3000')+'/'});
  for(let i=0;i<100;i++){if(await evaluate("!!document.querySelector('.hero.scene-ready')"))break;await pause(100);}
  await pause(3000);
  const initial=await state();
  assert(initial.progress===0&&initial.opacity===1&&initial.scale===1&&!initial.inert,'Home starts fully visible and interactive');
  await scroll(.15);const early=await state();
  assert(early.progress>0&&early.progress<1&&early.scale>1,'Home expands progressively with scroll');
  await scroll(.35);const middle=await state();
  assert(middle.progress>early.progress&&middle.opacity<early.opacity,'The transition advances and fades with scroll position');
  assert(await evaluate("getComputedStyle(document.querySelector('.hero-topline>.availability')).translate!==getComputedStyle(document.querySelector('.hero-topline>.hero-kicker')).translate"),'Home elements scatter in different directions');
  assert(middle.aboutTop===initial.aboutTop&&!middle.overflow,'The transition preserves page flow and prevents horizontal overflow');
  await screenshot('hero-scatter-desktop');
  await scroll(.7);const gone=await state();
  assert(gone.opacity===0&&gone.inert,'Fully scattered Home controls cannot capture clicks or keyboard focus');
  await scroll(.2);const reverse=await state();
  assert(reverse.progress<middle.progress&&reverse.opacity>middle.opacity&&!reverse.inert,'Scrolling back smoothly restores the Home elements');
  await scroll(0);const restored=await state();
  assert(restored.progress===0&&restored.scale===1&&restored.opacity===1,'Returning to the top fully restores Home');
  await scroll(.35);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(250);
  assert(await waitFor(s=>s.progress===0&&s.scale===1),'System reduced motion disables the scatter transition');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await pause(250);
  assert(await waitFor(s=>s.progress>0),'Removing reduced motion restores the current scroll position');
  await evaluate("document.querySelector('#settings-toggle').click()");await pause(100);
  await evaluate("document.querySelector('.switch').click();document.querySelector('.popover-heading button').click()");await pause(300);
  await scroll(.45);
  assert(await waitFor(s=>s.progress===0&&s.opacity===1),'The site motion toggle disables scattering');
  await scroll(0);
  await evaluate("document.querySelector('#settings-toggle').click()");await pause(100);
  await evaluate("document.querySelector('.switch').click();document.querySelector('.popover-heading button').click()");
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});await pause(400);
  await pause(3000);
  await scroll(.35);const mobile=await state();
  assert(mobile.progress>0&&mobile.scale>1&&!mobile.overflow,'The transition works on mobile without horizontal overflow');
  await screenshot('hero-scatter-mobile');
  await scroll(0);
  const fallback=await call('Page.addScriptToEvaluateOnNewDocument',{source:"const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:original.call(this,type,...args)}"});
  await call('Page.reload');await pause(4000);await scroll(.35);
  assert(await evaluate("!document.querySelector('.hero').classList.contains('scene-ready')&&document.querySelector('h1').classList.contains('hero-fallback')&&Number(getComputedStyle(document.querySelector('.hero-copy')).scale)>1"),'The text fallback also expands and scatters without WebGL');
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:fallback.identifier});
  assert(b.errors.length===0,'No uncaught browser errors');
  await writeFile('.preview/qa-hero-scroll-result.json',JSON.stringify({passed:checks.length,checks},null,2));
  console.log('All '+checks.length+' Home scroll checks passed.');
}finally{b.close();}
