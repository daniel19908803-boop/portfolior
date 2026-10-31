import {readFile,writeFile} from 'node:fs/promises';
import {browser} from './browser.mjs';
const b=await browser();
try{
  const slides=await Promise.all([1,2,3,4,5,6].map(async id=>'data:image/svg+xml;base64,'+(await readFile(`public/projects/${String(id).padStart(2,'0')}.svg`)).toString('base64')));
  const base64=await b.evaluate(`(async()=>{
    const images=await Promise.all(${JSON.stringify(slides)}.map(src=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=reject;img.src=src;})));
    const canvas=document.createElement('canvas');canvas.width=1280;canvas.height=720;document.body.append(canvas);const ctx=canvas.getContext('2d');
    const stream=canvas.captureStream(15);const recorder=new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9',videoBitsPerSecond:900000});const chunks=[];recorder.ondataavailable=e=>chunks.push(e.data);
    const finished=new Promise(resolve=>recorder.onstop=()=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.readAsDataURL(new Blob(chunks,{type:'video/webm'}));});
    const start=performance.now();const draw=()=>{const elapsed=(performance.now()-start)/1000;const index=Math.floor(elapsed/1.5)%images.length;const progress=(elapsed%1.5)/1.5;ctx.fillStyle='#070d14';ctx.fillRect(0,0,1280,720);const scale=1.45+progress*.03;const w=900*scale,h=620*scale;ctx.drawImage(images[index],(1280-w)/2,(720-h)/2,w,h);if(elapsed<9)requestAnimationFrame(draw);else recorder.stop();};draw();recorder.start();return await finished;
  })()`);
  await writeFile('public/project-reel.webm',Buffer.from(base64,'base64'));console.log('Created silent 9-second project showcase reel.');
}finally{b.close();}
