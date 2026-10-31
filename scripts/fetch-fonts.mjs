import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/fonts',{recursive:true});
const ua='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
for(const [family,file] of [['Manrope:wght@200..800','manrope.woff2'],['Instrument+Serif:ital@1','instrument-serif-italic.woff2']]){
  const css=await (await fetch('https://fonts.googleapis.com/css2?family='+family+'&display=swap',{headers:{'User-Agent':ua}})).text();
  const urls=[...css.matchAll(/url\((https:[^)]+)\)/g)];
  if(!urls.length)throw new Error('No font found: '+family);
  const response=await fetch(urls.at(-1)[1]);if(!response.ok)throw new Error('Font download failed');
  await writeFile('public/fonts/'+file,Buffer.from(await response.arrayBuffer()));
  console.log('Downloaded '+file);
  const slug=file.startsWith('manrope')?'manrope':'instrumentserif';
  const license=await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${slug}/OFL.txt`);
  if(!license.ok)throw new Error('Font license download failed');
  await writeFile(`public/fonts/${slug}-OFL.txt`,await license.text());
}
