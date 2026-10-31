import { writeFile } from 'node:fs/promises';
import { browser } from './browser.mjs';

const b=await browser(9240),{call,evaluate}=b;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const waitFor=async expression=>{
  const deadline=Date.now()+5000;
  while(Date.now()<deadline){if(await evaluate(expression))return true;await pause(80);}
  return false;
};
const checks=[];
const assert=(condition,label)=>{
  if (!condition) throw new Error('FAIL: '+label);
  checks.push(label);console.log('PASS: '+label);
};
const pixels=()=>evaluate(`(()=>{const c=document.querySelector('.cursor-stars'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let count=0,warm=0;for(let i=0;i<p.length;i+=4){if(p[i+3]>15)count++;if(p[i+3]>25&&p[i]>p[i+2]+15)warm++;}return {count,warm};})()`);
const move=async(x,y)=>{await call('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await pause(24);};
const trail=async()=>{
  for(let i=0;i<15;i++) await move(280+i*35,400+Math.sin(i*.32)*85);
};
try{
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await call('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('portfolio-motion','on');localStorage.setItem('portfolio-language','en');localStorage.setItem('portfolio-theme','ocean');"});
  await call('Page.navigate',{url:(process.env.QA_BASE_URL||'http://127.0.0.1:3000')+'/'});
  await pause(4200);
  assert(await evaluate("matchMedia('(any-pointer: fine)').matches"),'Desktop provides a fine pointer');
  for(const section of ['inicio','sobre','tecnologias','projetos','contato']){
    await evaluate(`document.getElementById('${section}').scrollIntoView({behavior:'instant'})`);await pause(200);
    await trail();
    assert((await pixels()).count>100,'Stars render over '+section);
  }
  assert(await evaluate("(()=>{const opacity=Number(getComputedStyle(document.querySelector('.cursor-stars')).opacity);return opacity>0&&opacity<1;})()"),'Star clusters remain partially transparent');
  await evaluate("document.getElementById('sobre').scrollIntoView({behavior:'instant'})");await pause(200);
  const portrait=await evaluate("(()=>{const r=document.querySelector('.portrait-interaction').getBoundingClientRect();return {left:r.left,top:r.top,width:r.width,height:r.height};})()");
  await move(portrait.left+portrait.width*.2,portrait.top+portrait.height*.25);await pause(70);
  const earlyTilt=await evaluate("getComputedStyle(document.querySelector('.portrait-card')).transform");
  await pause(300);
  assert(await evaluate("getComputedStyle(document.querySelector('.portrait-card')).transform")!==earlyTilt,'Portrait tilt eases into position with inertia');
  assert(await waitFor("!new DOMMatrix(getComputedStyle(document.querySelector('.portrait-card')).transform).isIdentity && Number(getComputedStyle(document.querySelector('.portrait-reflection')).opacity)>.5"),'Hover adds a weighted tilt and visible light reflection');
  const lightBefore=await evaluate("document.querySelector('.portrait-card').style.getPropertyValue('--portrait-light-x')");
  await move(portrait.left+portrait.width*.8,portrait.top+portrait.height*.7);await pause(400);
  assert(await evaluate("document.querySelector('.portrait-card').style.getPropertyValue('--portrait-light-x')")!==lightBefore,'Light reflection follows the pointer across the portrait');
  const portraitShot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('.preview/portrait-reflection.png',Buffer.from(portraitShot.data,'base64'));
  await move(1100,900);await pause(1800);
  assert(await waitFor("new DOMMatrix(getComputedStyle(document.querySelector('.portrait-card')).transform).isIdentity && Number(getComputedStyle(document.querySelector('.portrait-reflection')).opacity)===0"),'Portrait settles flat and the reflection fades after pointer exit');
  await evaluate("document.querySelector('.portrait-interaction').dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:300,clientY:400,bubbles:true}))");
  assert(await evaluate("new DOMMatrix(getComputedStyle(document.querySelector('.portrait-card')).transform).isIdentity"),'Touch input leaves the portrait still');
  await evaluate("document.getElementById('contato').scrollIntoView({behavior:'instant'})");await pause(200);
  assert(await evaluate("getComputedStyle(document.querySelector('.cursor-stars')).pointerEvents==='none'"),'Overlay cannot intercept clicks');
  const input=await evaluate("(()=>{const r=document.getElementById('contact-name').getBoundingClientRect();return {x:r.left+40,y:r.top+r.height/2};})()");
  await move(input.x,input.y);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...input});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...input});
  assert(await evaluate("document.activeElement.id==='contact-name'"),'Contact fields remain clickable through the trail');
  await evaluate("document.getElementById('tecnologias').scrollIntoView({behavior:'instant'})");await pause(200);
  const card=await evaluate("(()=>{const r=document.querySelector('.stack-card').getBoundingClientRect();return {x:r.left+70,y:r.top+70};})()");
  await move(card.x,card.y);await pause(100);
  assert(await evaluate("document.querySelector('.stack-card').hasAttribute('data-cursor-lit')"),'Cards glow at the cursor');
  const before=await evaluate("document.querySelector('.stack-card').style.getPropertyValue('--cursor-x')");
  await move(card.x+50,card.y+30);await pause(100);
  assert(await evaluate("document.querySelector('.stack-card').style.getPropertyValue('--cursor-x')")!==before,'Card glow follows movement inside the card');
  await evaluate("document.getElementById('projetos').scrollIntoView({behavior:'instant'});document.querySelector('.project-open').click()");await pause(300);
  await trail();
  assert(await evaluate("document.querySelector('.project-dialog').open && document.querySelector('.cursor-stars').matches(':popover-open')")&&(await pixels()).count>100,'Trail remains in the top layer above native project dialogs');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await pause(150);
  assert(await evaluate("!document.querySelector('.project-dialog').open"),'Escape still dismisses project dialogs');
  await evaluate("document.querySelector('#settings-toggle').click();");await pause(100);
  await evaluate("document.querySelectorAll('.theme-grid button')[3].click();document.querySelector('.popover-heading button').click()");
  await trail();assert((await pixels()).warm>20,'Star colors follow a theme change');
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile('.preview/cursor-stars.png',Buffer.from(shot.data,'base64'));
  await pause(1500);
  assert((await pixels()).count===0&&await evaluate("!document.querySelector('.cursor-stars').hasAttribute('data-active')"),'Stars fade completely and the overlay stops when idle');
  await trail();
  await evaluate("window.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:400,clientY:300}))");
  assert((await pixels()).count===0,'Touch input does not create a trail');
  await trail();
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await pause(150);
  await trail();assert((await pixels()).count===0,'System reduced motion disables the effect immediately');
  assert(await evaluate("new DOMMatrix(getComputedStyle(document.querySelector('.portrait-card')).transform).isIdentity && Number(getComputedStyle(document.querySelector('.portrait-reflection')).opacity)===0"),'Reduced motion keeps the portrait and reflection still');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await trail();assert((await pixels()).count>100,'Trail resumes when reduced motion is removed');
  await evaluate("document.querySelector('#settings-toggle').click()");await pause(100);
  await evaluate("document.querySelector('.switch').click();document.querySelector('.popover-heading button').click()");await pause(150);
  await trail();assert((await pixels()).count===0,'The site motion toggle disables the trail');
  assert(await evaluate("new DOMMatrix(getComputedStyle(document.querySelector('.portrait-card')).transform).isIdentity"),'The site motion toggle leaves the portrait flat');
  assert(await evaluate("!document.querySelector('[data-cursor-lit]')"),'Disabling motion removes card highlights');
  assert(b.errors.length===0,'No uncaught browser errors');
  await writeFile('.preview/qa-cursor-result.json',JSON.stringify({passed:checks.length,checks},null,2));
  console.log('All '+checks.length+' cursor checks passed.');
}finally{b.close();}
