import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export async function browser(port=9238){
  await mkdir('.preview',{recursive:true});
  const chrome=spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',['--headless=new',`--remote-debugging-port=${port}`,`--user-data-dir=${path.resolve('.preview/chrome-portfolio')}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--enable-unsafe-swiftshader','--use-angle=swiftshader','--hide-scrollbars','about:blank'],{windowsHide:true,stdio:'ignore'});
  let target;
  for(let i=0;i<80;i++){try{target=(await(await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t=>t.type==='page');if(target)break;}catch{}await new Promise(r=>setTimeout(r,150));}
  if(!target){chrome.kill();throw new Error('Chrome did not start');}
  const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
  let id=0;const pending=new Map(),errors=[];
  ws.onmessage=message=>{const d=JSON.parse(message.data);if(d.id){const request=pending.get(d.id);if(request){pending.delete(d.id);d.error?request.reject(new Error(JSON.stringify(d.error))):request.resolve(d.result);}}if(d.method==='Runtime.exceptionThrown')errors.push(d.params.exceptionDetails);};
  const call=(method,params={})=>new Promise((resolve,reject)=>{const requestId=++id;pending.set(requestId,{resolve,reject});ws.send(JSON.stringify({id:requestId,method,params}));});
  const evaluate=async(expression)=>{const r=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
  await call('Runtime.enable');await call('Page.enable');
  return {call,evaluate,errors,close:()=>{ws.close();chrome.kill();}};
}
