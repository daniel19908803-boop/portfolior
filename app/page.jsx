'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ArrowUpRight, ArrowDown, ArrowUp, ArrowRight, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Check, X, Settings2, Globe2, Mail, Github, Linkedin, Sparkles, Cpu, Layers3, Code2, Smartphone, ShoppingBag, Cloud, ChartNoAxesCombined, Send, CheckCheck, Copy, MapPin, Circle, Command } from 'lucide-react';
import { copy, languages, stacks } from './content';
import { projects, projectCopy } from './projects';
import { siteConfig } from './site.config';

const OceanScene = dynamic(()=>import('./OceanScene'),{ssr:false});
const sectionIds = ['inicio','sobre','projetos','contato'];
const themes = ['ocean','aurora','amethyst','sunset'];
const colors = ['#89dfe5','#a0e0b0','#c0a3ee','#efbd99'];
const stackColors = ['#b6a6e9','#edb38b','#8dcbe7','#b1b7ec','#8cd6b0','#e5a3b7'];
const StackIcons = [Cpu,Layers3,Smartphone,ShoppingBag,Cloud,ChartNoAxesCombined];

function Mark({ className='' }) {
  return <svg className={`monogram ${className}`} viewBox="0 0 64 64" fill="none" aria-hidden="true"><path className="mark-frame" d="M32 3 57 17.5v29L32 61 7 46.5v-29Z"/><path className="mark-g" d="M32 21H21v23h15V32H27"/><path className="mark-f" d="M42 44V21h12M42 31h10"/><path className="mark-glint" d="M31 3v5M7 18l5 3M52 43l5 3"/></svg>;
}

function Magnetic({ as:Tag='div', children, className='', strength=7, disabled=false, ...props }) {
  return <Tag {...props} className={className} onPointerMove={e=>{
    if(disabled || e.pointerType==='touch')return;
    const r=e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.transform=`translate(${((e.clientX-r.left)/r.width-.5)*strength}px,${((e.clientY-r.top)/r.height-.5)*strength}px)`;
  }} onPointerLeave={e=>{e.currentTarget.style.transform='';}}>{children}</Tag>;
}

function SectionLabel({number,children}){return <p className="eyebrow"><span>{number}</span><i/>{children}</p>;}

export default function Portfolio(){
  const [lang,setLang]=useState('pt-BR');
  const [theme,setTheme]=useState('ocean');
  const [motion,setMotion]=useState(true);
  const [intro,setIntro]=useState(true);
  const [active,setActive]=useState('inicio');
  const [panel,setPanel]=useState(null);
  const [expanded,setExpanded]=useState(false);
  const [filter,setFilter]=useState(0);
  const [selected,setSelected]=useState(null);
  const [sceneReady,setSceneReady]=useState(false);
  const [role,setRole]=useState(0);
  const [time,setTime]=useState('—:—');
  const [prepared,setPrepared]=useState('');
  const [copyState,setCopyState]=useState('');
  const [videoError,setVideoError]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const settingsRef=useRef(null),dialogRef=useRef(null),formRef=useRef(null),lastFocus=useRef(null),heroRef=useRef(null);
  const c={...(copy[lang]||copy['pt-BR']),...(projectCopy[lang]||projectCopy['pt-BR'])};
  const onSceneReady=useCallback(()=>setSceneReady(true),[]);
  const filtered=projects.filter(p=>!filter||p.group===filter);
  const shown=expanded?filtered:filtered.slice(0,6);
  const description=p=>lang==='pt-BR'?p.pt:p.en;

  useEffect(()=>{
    try{
      const savedLang=localStorage.getItem('portfolio-language'),savedTheme=localStorage.getItem('portfolio-theme');
      if(copy[savedLang])setLang(savedLang);if(themes.includes(savedTheme))setTheme(savedTheme);
      const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
      setMotion(localStorage.getItem('portfolio-motion')==='off'?false:!reduced);
    }catch{}
    const timer=setTimeout(()=>setIntro(false),3000);
    const clock=()=>setTime(new Intl.DateTimeFormat('en-GB',{timeZone:'America/Sao_Paulo',hour:'2-digit',minute:'2-digit'}).format(new Date()));clock();
    const interval=setInterval(clock,30000);
    return()=>{clearTimeout(timer);clearInterval(interval);};
  },[]);

  useEffect(()=>{
    document.documentElement.lang=lang;
    try{localStorage.setItem('portfolio-language',lang);}catch{}
  },[lang]);
  useEffect(()=>{
    document.documentElement.dataset.theme=theme;
    window.dispatchEvent(new CustomEvent('portfolio-theme',{detail:colors[themes.indexOf(theme)]}));
    try{localStorage.setItem('portfolio-theme',theme);}catch{}
  },[theme]);
  useEffect(()=>{
    document.documentElement.dataset.motion=motion?'on':'off';
    try{localStorage.setItem('portfolio-motion',motion?'on':'off');}catch{}
    const video=heroRef.current?.querySelector('video');
    if(video){if(motion)video.play().catch(()=>{});else video.pause();}
    if(!motion)return;
    const timer=setInterval(()=>setRole(r=>1-r),4400);return()=>clearInterval(timer);
  },[motion]);
  useEffect(()=>{
    const update=()=>{
      const y=window.scrollY+window.innerHeight*.40;
      let current='inicio';for(const id of sectionIds){const el=document.getElementById(id);if(el && el.offsetTop<=y)current=id;}
      setActive(current);setScrolled(window.scrollY>40);
    };
    window.addEventListener('scroll',update,{passive:true});update();return()=>window.removeEventListener('scroll',update);
  },[]);
  useEffect(()=>{
    const els=document.querySelectorAll('.reveal');
    const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('revealed');observer.unobserve(entry.target);}}),{threshold:.08});
    els.forEach(el=>observer.observe(el));return()=>observer.disconnect();
  },[expanded,filter]);
  useEffect(()=>{
    if(!panel)return;
    const close=e=>{if(e.key==='Escape'){setPanel(null);document.getElementById(panel==='language'?'language-toggle':'settings-toggle')?.focus();}};
    const outside=e=>{if(!settingsRef.current?.contains(e.target))setPanel(null);};
    document.addEventListener('keydown',close);document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',outside);};
  },[panel]);
  useEffect(()=>{
    const dialog=dialogRef.current;
    if(selected){if(!dialog.open){lastFocus.current=document.activeElement;dialog.showModal();}dialog.scrollTop=0;document.body.style.overflow='hidden';}
    else {if(dialog.open)dialog.close();document.body.style.overflow='';lastFocus.current?.focus();}
    return()=>{document.body.style.overflow='';};
  },[selected]);

  const chooseLanguage=value=>{setLang(value);setPanel(null);document.getElementById('language-toggle')?.focus();};
  const prepareMessage=e=>{
    e.preventDefault();const data=new FormData(e.currentTarget);
    const text=`${data.get('name')} <${data.get('email')}>\n\n${data.get('message')}`;
    setPrepared(text);setCopyState('');
    if(siteConfig.email)window.location.href=`mailto:${siteConfig.email}?subject=${encodeURIComponent('Portfolio — '+data.get('name'))}&body=${encodeURIComponent(text)}`;
  };
  const copyMessage=async()=>{try{await navigator.clipboard.writeText(prepared);setCopyState('copied');}catch{setCopyState('error');}};
  const changeProject=dir=>{const i=filtered.findIndex(p=>p.id===selected.id);setSelected(filtered[(i+dir+filtered.length)%filtered.length]);};
  const closeProject=()=>setSelected(null);
  const contactFromProject=()=>{closeProject();document.getElementById('contato').scrollIntoView({behavior:motion?'smooth':'instant'});setTimeout(()=>document.getElementById('contact-name')?.focus({preventScroll:true}),450);};

  return <>
    <a className="skip-link" href="#main">{c.skip}</a>
    {intro&&<div className="splash" role="status" aria-label={c.loading}><div className="splash-ripple ripple-one"/><div className="splash-ripple ripple-two"/><div className="splash-ripple ripple-three"/><Mark/><span>{c.loading}</span><div className="splash-progress"/></div>}
    <header className={`site-header ${scrolled?'is-scrolled':''}`}>
      <div className="header-inner">
        <Magnetic as="a" href="#inicio" className="brand" aria-label="Gabriel Fonseca — Home" disabled={!motion} strength={12}><Mark/><span>GABRIEL<span>FONSECA<span className="brand-dot">.</span></span></span></Magnetic>
        <nav className="main-nav" aria-label={c.nav.join(', ')}>{sectionIds.map((id,i)=><Magnetic as="a" key={id} href={`#${id}`} className={active===id?'active':''} aria-current={active===id?'location':undefined} disabled={!motion}>{c.nav[i]}</Magnetic>)}</nav>
        <div className="header-tools" ref={settingsRef}>
          <button id="language-toggle" className={`tool-button language-button ${panel==='language'?'selected':''}`} aria-label={c.language} aria-expanded={panel==='language'} aria-controls="language-panel" onClick={()=>setPanel(panel==='language'?null:'language')}><Globe2 size={15}/><span>{languages.find(l=>l[0]===lang)[1]}</span><ChevronDown size={12}/></button>
          <button id="settings-toggle" className={`tool-button settings-button ${panel==='settings'?'selected':''}`} aria-label={c.settings} aria-expanded={panel==='settings'} aria-controls="settings-panel" onClick={()=>setPanel(panel==='settings'?null:'settings')}><Settings2 size={18}/></button>
          {panel==='language'&&<div className="popover language-panel" id="language-panel" role="group" aria-label={c.language}><p className="popover-label">{c.language}</p>{languages.map(([value,short,label])=><button key={value} lang={value} aria-pressed={lang===value} onClick={()=>chooseLanguage(value)}><span className="locale-code">{short}</span><span>{label}</span>{lang===value&&<Check size={15}/>}</button>)}</div>}
          {panel==='settings'&&<div className="popover settings-panel" id="settings-panel" role="group" aria-label={c.settings}><div className="popover-heading"><span><Sparkles size={15}/>{c.settings}</span><button aria-label={c.close} onClick={()=>setPanel(null)}><X size={16}/></button></div><p className="popover-label">{c.themeSub}</p><div className="theme-grid">{themes.map((value,i)=><button key={value} className={theme===value?'chosen':''} aria-pressed={theme===value} onClick={()=>setTheme(value)}><img src={`/themes/${value}.svg`} alt=""/><span>{c.themes[i]}</span>{theme===value&&<Check size={13}/>}</button>)}</div><div className="motion-setting"><span>{c.motion}</span><button className={`switch ${motion?'on':''}`} role="switch" aria-checked={motion} aria-label={c.motion} onClick={()=>{setMotion(!motion);setSceneReady(false);}}><i/></button></div><p className="settings-note">{c.sound}</p></div>}
        </div>
      </div>
    </header>

    <aside className="side-rail" aria-label={c.nav[3]}><a href="#contato" aria-label={c.talk}><Mail size={17}/></a>{siteConfig.github&&<a href={siteConfig.github} target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={17}/></a>}{siteConfig.linkedin&&<a href={siteConfig.linkedin} target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={17}/></a>}<a href="#projetos" aria-label={c.work}><Code2 size={18}/></a><span className="rail-line"/><span className="rail-coordinate">23°33′ S · 46°38′ W</span></aside>

    <main id="main" inert={intro?true:undefined}>
      <section id="inicio" ref={heroRef} className={`hero ${sceneReady?'scene-ready':''}`} onPointerMove={e=>{if(!motion||e.pointerType==='touch')return;const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--pointer-x',`${(e.clientX/r.width-.5)*9}px`);e.currentTarget.style.setProperty('--pointer-y',`${((e.clientY-r.top)/r.height-.5)*8}px`);}}>
        {!videoError&&<video className="project-reel" autoPlay muted loop playsInline preload="none" poster="/projects/03.svg" aria-hidden="true" onError={()=>setVideoError(true)}><source src={siteConfig.projectVideo} type="video/webm"/></video>}
        <div className="hero-glow"/><div className="hero-orbit orbit-a"/><div className="hero-orbit orbit-b"/>
        {!intro&&<OceanScene motion={motion} onReady={onSceneReady}/>}
        <div className="hero-topline"><span className="availability"><i/>{c.available}</span><p>{c.location}</p></div>
        <div className="hero-copy"><p className="hero-kicker">INDEPENDENT SOFTWARE ENGINEER</p><h1 className={sceneReady?'sr-only':'hero-fallback'}>Gabriel Fonseca<span>.</span></h1></div>
        <div className="hero-subcopy"><div className="role-line" aria-live="off"><span key={role}>{c.role[role]}</span><i/></div><p>{c.hero}</p><div className="hero-actions"><Magnetic as="a" href="#projetos" className="primary-button" disabled={!motion}>{c.work}<ArrowUpRight size={17}/></Magnetic><a href="#contato" className="quiet-button">{c.talk}<ArrowRight size={15}/></a></div></div>
        <div className="hero-bottom"><span className="hero-index"><b>01</b><span>/</span>04</span><a href="#sobre" className="scroll-cue"><span>{c.scroll}</span><ArrowDown size={15}/></a><span className="local-time"><i/>{time}<span>UTC−3 · {c.brazil}</span></span></div>
      </section>

      <section id="sobre" className="about-section section-shell">
        <div className="section-container"><SectionLabel number="02">{c.intro}</SectionLabel>
          <div className="about-layout"><div className="identity-visual reveal"><div className="identity-card"><div className="card-topline"><span>GF® — ENGINEERING</span><span className="tiny-dot"/></div><div className="identity-grid"/><div className="identity-orbit one"/><div className="identity-orbit two"/><Mark className="identity-mark"/><div className="identity-bottom"><span>GABRIEL FONSECA</span><p>IDEAS INTO REALITY<span>↗</span></p></div><div className="identity-edge"/></div><div className="identity-caption"><MapPin size={13}/><span>{c.brazil}</span><span className="caption-line"/><span>REMOTE · WORLDWIDE</span></div></div>
            <div className="about-copy reveal"><h2>{c.about1}<br/><span className="serif-accent">{c.about2}</span></h2><p className="about-lead">{c.lead}</p>{c.bio.map((p,i)=><p key={i} className="bio-paragraph">{p}</p>)}<a className="text-link" href="#contato">{c.talk}<ArrowUpRight size={17}/></a></div>
          </div>
          <div className="about-principles reveal">{c.principles.map((p,i)=><div key={p}><span className="principle-number">0{i+1}</span><CheckCheck size={17}/><span>{p}</span></div>)}</div><p className="about-signature reveal">“{c.signature}”<span>Gabriel Fonseca</span></p>
        </div>
      </section>

      <section className="stack-section section-shell" id="tecnologias"><div className="section-container"><div className="stack-heading reveal"><SectionLabel number="02.1">{c.stackLabel}</SectionLabel><h2>{c.stack1}<br/><span className="serif-accent">{c.stack2}</span></h2><p>{c.stackSub}</p><div className="stack-orbit-decoration" aria-hidden="true"><Command/><span/><i/></div></div>
        <div className="stack-grid">{stacks.map((items,i)=>{const Icon=StackIcons[i];return <article key={i} className="stack-card reveal" style={{'--card-accent':stackColors[i],'--delay':`${i%3*90}ms`}}><div className="stack-card-heading"><span className="stack-icon"><Icon size={21}/></span><h3>{c.specialties[i]}</h3><span className="stack-number">0{i+1}</span></div><p>{c.stackDescriptions[i]}</p><div className="stack-divider"/><ul>{items.map(item=><li key={item}><i/>{item}</li>)}</ul><div className="stack-base"><span/><span/><span/><span/><span/></div></article>;})}</div>
      </div></section>

      <section id="projetos" className="projects-section section-shell"><div className="section-container"><div className="projects-heading reveal"><div><SectionLabel number="03">{c.projectsLabel}</SectionLabel><h2>{c.projects1}<br/><span className="serif-accent">{c.projects2}</span></h2></div><div className="projects-intro"><span className="section-spark">✳</span><p>{c.projectsSub}</p></div></div>
        <div className="project-toolbar"><div className="filters" role="group" aria-label={c.nav[2]}>{[c.all,...c.filters].map((label,i)=><button key={i} className={filter===i?'active':''} aria-pressed={filter===i} onClick={()=>{setFilter(i);setExpanded(false);}}>{label}{i===0&&<span>{projects.length}</span>}</button>)}</div><span className="project-count">{String(filtered.length).padStart(2,'0')} {c.count}</span></div>
        <div className="project-grid" id="project-grid">{shown.map((p,i)=><article className="project-card reveal" key={p.id} style={{'--project-accent':p.accent,'--delay':`${i%3*70}ms`}}><button className="project-open" onClick={()=>setSelected(p)} aria-label={`${c.view}: ${p.title}`}><div className="project-image"><img src={p.thumbnail} alt={`${p.title} — ${p.label}`} width="900" height="620" loading="lazy"/><span className={`project-status status-${p.status}`}><i/>{c.statuses[p.status]}</span><span className="project-image-number">{String(p.id).padStart(2,'0')}</span><span className="project-image-action"><ArrowUpRight size={24}/></span></div><div className="project-content"><p className="project-category">{p.label}</p><h3>{p.title}<ArrowUpRight size={17}/></h3><p className="project-description">{description(p)}</p><div className="project-tags">{p.tags.map(tag=><span key={tag}>{tag}</span>)}</div><div className="project-card-bottom"><span>{c.view}</span><ArrowRight size={15}/></div></div></button></article>)}</div>
        <div className="gallery-bottom"><p><Circle size={6}/>{c.galleryNote}</p>{filtered.length>6&&<button className="more-button" aria-expanded={expanded} aria-controls="project-grid" onClick={()=>{if(expanded){document.getElementById('projetos').scrollIntoView({behavior:'instant'});}setExpanded(!expanded);}}>{expanded?c.less:c.more}<span>{expanded?<ChevronUp size={16}/>:<ChevronDown size={16}/>}</span></button>}<span className="gallery-range">{String(shown.length).padStart(2,'0')} / {String(filtered.length).padStart(2,'0')}</span></div>
      </div></section>

      <section id="contato" className="contact-section section-shell"><div className="contact-watermark" aria-hidden="true">CONTACT</div><div className="contact-glow"/><div className="section-container contact-inner"><SectionLabel number="04">{c.contactLabel}</SectionLabel><div className="contact-heading reveal"><h2>{c.contact1}<br/><span className="serif-accent">{c.contact2}</span></h2><p>{c.contactSub}</p></div>
        <div className="contact-form-wrap reveal">{!prepared?<form ref={formRef} onSubmit={prepareMessage}><div className="form-row"><label htmlFor="contact-name">{c.fields[0]}<input id="contact-name" name="name" autoComplete="name" placeholder={c.placeholders[0]} required maxLength={100}/></label><label htmlFor="contact-email">{c.fields[1]}<input id="contact-email" name="email" type="email" autoComplete="email" placeholder={c.placeholders[1]} required maxLength={200}/></label></div><label htmlFor="contact-message">{c.fields[2]}<textarea id="contact-message" name="message" rows={5} placeholder={c.placeholders[2]} required minLength={10} maxLength={5000}/></label><div className="form-bottom"><p><span className="tiny-dot"/>{c.formNote}</p><button type="submit" className="submit-button">{c.send}<Send size={16}/></button></div></form>:<div className="prepared-message" role="status"><span className="success-icon"><Check size={24}/></span><h3>{c.prepared}</h3><p>{siteConfig.email?siteConfig.email:c.noEmail}</p><textarea readOnly value={prepared} aria-label={c.prepared} rows={5}/><div className="prepared-actions"><button className="primary-button" onClick={copyMessage}>{copyState==='copied'?c.copied:c.copy}{copyState==='copied'?<Check size={16}/>:<Copy size={16}/>}</button><button className="quiet-button" onClick={()=>setPrepared('')}>{c.back}<ArrowRight size={15}/></button></div>{copyState==='error'&&<p>{c.copyError}</p>}</div>}</div>
      </div></section>

      <footer className="site-footer"><div className="section-container"><div className="footer-top"><a href="#contato" className="footer-call"><h2>{c.footer1}<br/><span>{c.footer2}</span></h2><span className="footer-arrow"><ArrowUpRight size={35}/></span></a><div className="footer-side"><Mark/><p>{c.footerNote}</p><span>GABRIEL FONSECA · {c.brazil}</span></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Gabriel Fonseca</span><span className="footer-project-name">My Portfolio</span><a href="#inicio" className="back-top" aria-label={c.top}><span>{c.top}</span><ArrowUp size={17}/></a></div></div></footer>
    </main>
    <dialog className="project-dialog" ref={dialogRef} onCancel={e=>{e.preventDefault();closeProject();}} onClick={e=>{if(e.target===e.currentTarget)closeProject();}} onKeyDown={e=>{if(e.key==='ArrowRight')changeProject(1);if(e.key==='ArrowLeft')changeProject(-1);}} aria-labelledby="project-dialog-title">
      {selected&&<><button className="modal-close" aria-label={c.close} onClick={closeProject}><X size={20}/></button><div className="modal-image"><a href={selected.image} target="_blank" rel="noreferrer" aria-label={`${c.fullImage}: ${selected.title}`}><img key={selected.id} src={selected.image} alt={`${selected.title} — ${selected.label}`}/></a></div><div className="modal-content"><div className="modal-meta"><span>{c.caseLabel}</span><span>{String(projects.findIndex(p=>p.id===selected.id)+1).padStart(2,'0')} / {projects.length}</span></div><h2 id="project-dialog-title">{selected.title}</h2><p className="modal-description">{description(selected)}</p><p className="modal-scope">{c.scope}</p><div className="project-tags">{selected.tags.map(tag=><span key={tag}>{tag}</span>)}</div><a className="modal-full-image text-link" href={selected.image} target="_blank" rel="noreferrer">{c.fullImage}<ArrowUpRight size={16}/></a>{selected.status==='private'&&<p className="project-private-note">{c.privateNote}</p>}<div className="modal-bottom"><button className="text-link" onClick={contactFromProject}>{c.related}<ArrowUpRight size={17}/></button><div className="modal-controls"><button onClick={()=>changeProject(-1)} aria-label={c.previousProject}><ChevronLeft size={20}/></button><button onClick={()=>changeProject(1)} aria-label={c.nextProject}><ChevronRight size={20}/></button></div></div></div></>}
    </dialog>
  </>;
}
