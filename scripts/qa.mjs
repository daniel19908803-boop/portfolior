import {writeFile} from 'node:fs/promises';
import {browser} from './browser.mjs';
const b=await browser();const {call,evaluate}=b;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const results=[];
const assert=(value,label)=>{if(!value)throw new Error('FAIL: '+label);results.push(label);console.log('PASS: '+label);};
const shot=async name=>{await sleep(350);const {data}=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile('.preview/'+name+'.png',Buffer.from(data,'base64'));};
try{
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
  await call('Page.navigate',{url:'http://127.0.0.1:3000/'});
  for(let i=0;i<100;i++){if(await evaluate('document.readyState==="complete" && !!document.querySelector(".splash")'))break;await sleep(100);}
  await shot('intro');await sleep(5700);
  await evaluate('document.fonts.ready');
  assert(await evaluate('document.documentElement.lang === "pt-BR"'),'Portuguese is the default language');
  assert(await evaluate('!document.querySelector(".splash")'),'Three-second opening completes');
  assert(await evaluate('document.querySelector(".hero").classList.contains("scene-ready") && !!document.querySelector("canvas")'),'Three.js scene renders');
  assert(await evaluate('document.querySelectorAll(".project-card").length === 6'),'Initially shows six project cards');
  assert(await evaluate('!!document.querySelector("video") && document.querySelector("video").readyState >= 2'),'Local project showcase video loads');
  assert(await evaluate('document.fonts.check(\'500 16px "Manrope"\') && document.fonts.check(\'italic 16px "Instrument"\')'),'Both local fonts load');
  await shot('desktop-hero');
  await evaluate('document.querySelector("#settings-toggle").click()');
  assert(await evaluate('document.querySelectorAll(".theme-grid button").length === 4'),'Settings shows four image themes');
  for(let i=0;i<4;i++){
    await evaluate(`document.querySelectorAll('.theme-grid button')[${i}].click()`);
    assert(await evaluate(`document.documentElement.dataset.theme === ${JSON.stringify(['ocean','aurora','amethyst','sunset'][i])}`),'Theme '+i+' changes the whole page');
  }
  await evaluate('document.querySelectorAll(".theme-grid button")[0].click()');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  assert(await evaluate('!document.querySelector(".settings-panel")'),'Escape closes settings');
  for(const locale of ['en','es','ja','ru','fr','de','it','pt-BR']){
    await evaluate(`document.querySelector('#language-toggle').click()`);
    await evaluate(`document.querySelector('.language-panel button[lang="${locale}"]').click()`);
    assert(await evaluate(`document.documentElement.lang === ${JSON.stringify(locale)} && !document.querySelector('.language-panel')`),'Language '+locale+' updates and closes menu');
  }
  await evaluate('document.querySelector(".more-button").click()');await sleep(250);
  assert(await evaluate('document.querySelectorAll(".project-card").length===20'),'Show more reveals all 20 projects');
  await evaluate('document.querySelector(".more-button").click()');
  assert(await evaluate('document.querySelectorAll(".project-card").length===6'),'Show less restores six cards');
  await evaluate('document.querySelectorAll(".filters button")[3].click()');
  assert(await evaluate('document.querySelectorAll(".project-card").length===2'),'Mobile category filter shows the two dating app projects');
  await evaluate('document.querySelectorAll(".filters button")[0].click()');
  await evaluate('document.querySelector(".project-open").click()');await sleep(250);
  assert(await evaluate('document.querySelector(".project-dialog").open && document.querySelector(".modal-image img").naturalWidth > 0'),'Project opens its image in a dialog');
  await shot('project-modal');
  await evaluate('document.querySelectorAll(".modal-controls button")[1].click()');
  assert(await evaluate('document.querySelector("#project-dialog-title").textContent === "Tinder Bot"'),'Project dialog navigation');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  await sleep(100);
  assert(await evaluate('!document.querySelector(".project-dialog").open && document.body.style.overflow !== "hidden"'),'Escape closes dialog and restores scrolling');
  for(const id of ['sobre','tecnologias','projetos','contato']){
    await evaluate(`document.documentElement.style.scrollBehavior='auto';document.getElementById('${id}').scrollIntoView({behavior:'instant'})`);await sleep(800);await shot('desktop-'+id);
  }
  assert(await evaluate('document.querySelector(".main-nav a.active").getAttribute("href")==="#contato"'),'Navigation tracks the current section');
  await evaluate('document.querySelector("form").requestSubmit()');
  assert(await evaluate('!!document.querySelector("form") && !document.querySelector(".prepared-message")'),'Required fields prevent preparing an empty message');
  await evaluate('document.querySelector("#contact-name").value="QA Visitor";document.querySelector("#contact-email").value="qa@example.com";document.querySelector("#contact-message").value="I want to discuss a new project and a delivery timeline.";document.querySelector("form").requestSubmit()');
  assert(await evaluate('!!document.querySelector(".prepared-message") && document.querySelector(".prepared-message textarea").value.includes("QA Visitor")'),'Form prepares the real visitor message');
  assert(await evaluate('document.querySelector(".prepared-message").textContent.includes("ainda não foi configurado")'),'Contact clearly discloses missing delivery configuration');
  await call('Browser.grantPermissions',{origin:'http://127.0.0.1:3000',permissions:['clipboardReadWrite','clipboardSanitizedWrite']});
  await evaluate('document.querySelector(".prepared-actions .primary-button").click()');await sleep(150);
  assert(await evaluate('navigator.clipboard.readText().then(text=>text.includes("QA Visitor") && text.includes("delivery timeline"))'),'Copy message writes the visitor’s actual brief to the clipboard');
  await evaluate('document.querySelector(".prepared-actions .quiet-button").click()');
  assert(await evaluate('!!document.querySelector("form")'),'Contact returns to the form');
  for(const width of [320,360,390,560,768,1024,1440,1920]){
    await call('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<600});await sleep(180);
    const dims=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');
    assert(dims.scroll<=dims.width,'No horizontal overflow at '+width+'px');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:360,height:900,deviceScaleFactor:1,mobile:true});
  for(const locale of ['en','es','ja','ru','fr','de','it','pt-BR']){
    await evaluate('document.querySelector("#language-toggle").click()');
    await evaluate(`document.querySelector('.language-panel button[lang="${locale}"]').click()`);
    const dims=await evaluate('({width:innerWidth,scroll:document.documentElement.scrollWidth})');
    assert(dims.scroll<=dims.width,'Mobile '+locale+' content fits without overflow');
  }
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');await sleep(900);await shot('mobile-hero');
  await evaluate('document.querySelector("#settings-toggle").click()');await shot('mobile-settings');
  const panelBounds=await evaluate('(()=>{const r=document.querySelector(".settings-panel").getBoundingClientRect();return {left:r.left,right:r.right}})()');assert(panelBounds.left>=0&&panelBounds.right<=390,'Mobile settings fits the screen');
  await evaluate('document.querySelector(".switch").click()');await sleep(500);
  assert(await evaluate('document.documentElement.dataset.motion==="off"'),'Motion can be disabled');
  assert(await evaluate('document.querySelector("video").paused'),'Disabling ambient motion also pauses the showcase video');
  await evaluate('document.querySelector(".popover-heading button").click();document.getElementById("contato").scrollIntoView({behavior:"instant"})');await sleep(400);await shot('mobile-contact');
  await evaluate('document.querySelector("#language-toggle").click()');
  await evaluate('document.querySelector(".language-panel button[lang=en]").click()');
  await evaluate('document.querySelector("#settings-toggle").click()');
  await evaluate('document.querySelectorAll(".theme-grid button")[2].click()');
  await call('Page.reload');await sleep(4200);
  assert(await evaluate('document.documentElement.lang==="en" && document.documentElement.dataset.theme==="amethyst" && document.documentElement.dataset.motion==="off"'),'Language, theme, and motion persist after reload');
  await evaluate('document.querySelector("#language-toggle").click()');
  await evaluate('document.querySelector(\'.language-panel button[lang="pt-BR"]\').click()');
  await evaluate('document.querySelector("#settings-toggle").click()');
  await evaluate('document.querySelectorAll(".theme-grid button")[0].click()');
  await evaluate('document.querySelector(".switch").click()');
  await evaluate('document.querySelector(".popover-heading button").click()');
  const fallbackScript=await call('Page.addScriptToEvaluateOnNewDocument',{source:"const originalContext=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/i.test(type)?null:originalContext.call(this,type,...args)}"});
  await call('Page.reload');await sleep(4200);
  assert(await evaluate('!document.querySelector(".hero").classList.contains("scene-ready") && document.querySelector("h1").classList.contains("hero-fallback")'),'Without WebGL the accessible name remains visible');
  await call('Page.removeScriptToEvaluateOnNewDocument',{identifier:fallbackScript.identifier});
  assert(b.errors.length===0,'No uncaught browser errors');
  await writeFile('.preview/qa-result.json',JSON.stringify({passed:results.length,checks:results,errors:b.errors},null,2));console.log('All '+results.length+' checks passed.');
}finally{b.close();}
