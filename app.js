'use strict';
const D=window.DATA, KEY='delfa1:';
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COLORS={co:'#e2574c',ce:'#2f9e8f',pe:'#3b82c4',po:'#a855a0',eb:'#d98a1f'};
function sget(k){try{return JSON.parse(localStorage.getItem(KEY+k))}catch(e){return null}}
function sset(k,v){try{localStorage.setItem(KEY+k,JSON.stringify(v))}catch(e){}}
function sdel(p){try{Object.keys(localStorage).filter(k=>k.startsWith(KEY+(p||''))).forEach(k=>localStorage.removeItem(k))}catch(e){}}
const norm=s=>String(s==null?'':s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]/g,'');
const digits=s=>String(s==null?'':s).replace(/\D/g,'');
const fmt=n=>(Math.round(n*100)/100).toString().replace('.',',');
const selfT=it=>it.t==='write'||it.t==='speak'||it.t==='draw';
function graded(it){return !selfT(it)&&it.a!==null&&it.a!==undefined}
function check(it,v){
  if(!graded(it)) return null;
  if(it.t==='mcq'||it.t==='match') return v!==null&&v!==undefined&&+v===it.a;
  v=(v||'').trim(); if(!v) return false;
  const a=it.a;
  if(it.t==='phone'){return [].concat(a).some(x=>digits(x)===digits(v))}
  const n=norm(v);
  if(a&&a.all) return a.all.every(k=>n.includes(norm(k)));
  const L=[].concat(a).map(norm).filter(Boolean);
  return it.has? L.some(x=>n.includes(x)) : L.includes(n);
}
function ansText(it){
  const a=it.a; if(it.t==='mcq'||it.t==='match') return it.o[a];
  if(a&&a.all) return a.all.join(' + ');
  return [].concat(a)[0];
}
const imgs=x=>x?[].concat(x).map(s=>`<img src="${s}" alt="" loading="lazy">`).join(''):'';
/* ---------- activity stats ---------- */
function maxOf(a){return a.items.reduce((m,it)=>m+((graded(it)||(selfT(it)&&it.p>0))?it.p:0),0)}
function stat(ch,a){return sget(ch+':'+a.id)}
/* ---------- MAIN ---------- */
function Main(){
  const nav=$('#nav'),main=$('#main');let tot=0,done=0,sc=0,mx=0;
  D.skills.forEach(s=>{
    nav.insertAdjacentHTML('beforeend',`<a href="#${s.id}" style="border-color:${s.color}33">${s.icon} ${s.ko} <small>${s.fr}</small></a>`);
    let h=`<section class="skill" id="${s.id}" style="--c:${s.color}"><div class="skhead"><div class="skicon" style="background:${s.color}">${s.icon}</div><div><h2>${s.ko} <small>· ${s.fr}</small></h2></div></div>
    <div class="info">${s.info.map(i=>`<div><b>${i[0]}</b>${i[1]}</div>`).join('')}</div><div class="grid">`;
    s.chapters.forEach((c,i)=>{
      const acts=D.acts[c.id]||[];let d=0,cs=0,cm=0;
      acts.forEach(a=>{const st=stat(c.id,a);if(st&&st.done){d++;cs+=st.s;cm+=st.m}tot++});
      done+=d;sc+=cs;mx+=cm;
      h+=`<a class="ccard" href="chapter.html?c=${c.id}" style="--c:${s.color}"><span class="n">${s.id==='eb'?'MOCK':'CHAPITRE'} ${i+1}</span><h3>${esc(c.fr)}</h3><p>${esc(c.ko)}</p>
      <div class="meta">${c.n}개 활동 · ${c.items}문항${cm?` · 점수 ${fmt(cs)}/${fmt(cm)}`:''}</div><div class="mini"><i style="width:${c.n?d/c.n*100:0}%"></i></div></a>`;
    });
    h+='</div>';
    s.chapters.forEach(c=>{if(D.notes[c.id])h+=`<div class="note">${D.notes[c.id]}</div>`});
    main.insertAdjacentHTML('beforeend',h+'</section>');
  });
  const p=tot?Math.round(done/tot*100):0;$('#op').textContent=p+'%';$('#ob').style.width=p+'%';
  $('#os').textContent=`(${done}/${tot} 활동${mx?` · 누적 ${fmt(sc)}/${fmt(mx)}점`:''})`;
  $('#reset').onclick=()=>{if(confirm('이 브라우저에 저장된 모든 풀이 기록을 지울까요?')){sdel();location.reload()}};
}
/* ---------- CHAPTER ---------- */
function Chapter(){
  const id=new URLSearchParams(location.search).get('c'),acts=D.acts[id];
  let sk,ch;D.skills.forEach(s=>s.chapters.forEach(c=>{if(c.id===id){sk=s;ch=c}}));
  const app=$('#app');
  if(!acts){app.innerHTML='<p style="padding:30px">Chapitre introuvable. <a href="index.html">← 메인</a></p>';return}
  document.title=ch.fr+' — DELF A1';
  const hasTrain=acts.some(a=>a.level==='train'),hasPrep=acts.some(a=>a.level!=='train');
  app.innerHTML=`<div class="chead" style="--c:${sk.color}"><div class="wrap"><a class="back" href="index.html#${sk.id}">← 메인으로 · ${sk.ko} ${sk.fr}</a><h1>${esc(ch.fr)}</h1><div class="sub">${esc(ch.ko)}</div></div></div>
  <div class="score-top"><div class="wrap"><span class="big" id="tot">0 / 0점</span><div class="bar" style="background:var(--line)"><i id="pbar" style="background:${sk.color}"></i></div><span id="prog" style="font-size:14px;color:var(--mute)"></span><button id="allbtn">전체 채점</button></div></div>
  <main class="wrap"><div class="tabs" id="tabs"></div><div class="toc" id="toc"></div><div id="acts"></div>${D.notes[id]?`<div class="note">${D.notes[id]}</div>`:''}<p style="margin:30px 0"><a class="btn" href="index.html#${sk.id}">← 메인으로</a></p></main>`;
  let filter='all';
  const tabs=$('#tabs');
  if(hasTrain&&hasPrep){[['all','전체'],['prep','Se préparer · 준비 연습'],['train','S\'entraîner · 실전 연습']].forEach(([k,l])=>{const b=document.createElement('button');b.textContent=l;b.className=k===filter?'on':'';b.onclick=()=>{filter=k;$$('button',tabs).forEach(x=>x.className='');b.className='on';draw()};tabs.append(b)})}
  const host=$('#acts');
  function draw(){
    host.innerHTML='';let lastG=null;
    acts.forEach(a=>{
      if(filter!=='all'&&(filter==='train')!==(a.level==='train'))return;
      if(a.group&&a.group!==lastG){host.insertAdjacentHTML('beforeend',`<div class="grp">${esc(a.group)}</div>`);lastG=a.group}
      host.append(renderAct(a));
    });
    toc();updateTop();
  }
  function toc(){
    $('#toc').innerHTML=acts.map(a=>{const st=stat(id,a);return `<a href="#a-${a.id}" class="${st&&st.done?'done':''}">${a.id}</a>`}).join('');
  }
  function updateTop(){
    let s=0,m=0,d=0;acts.forEach(a=>{const st=stat(id,a);if(st&&st.done){s+=st.s;m+=st.m;d++}});
    $('#tot').textContent=m?`${fmt(s)} / ${fmt(m)}점`:'점수 —';
    $('#prog').textContent=`${d}/${acts.length} 완료`;$('#pbar').style.width=(d/acts.length*100)+'%';toc();
  }
  $('#allbtn').onclick=()=>{$$('.act').forEach(el=>el._check&&el._check());};
  /* ---- render one activity ---- */
  function renderAct(a){
    const el=document.createElement('div');el.className='act';el.id='a-'+a.id;
    const st=stat(id,a)||{},saved=st.a||[],self=st.self||{};
    let h=`<h3>${esc(a.title||a.id)} <span class="tag ${a.level==='train'?'ex':''}">${a.level==='train'?'S\'entraîner':'Se préparer'}</span></h3><div class="instr">${esc(a.instr)}</div>`;
    if(a.track)h+=`<div class="audio"><b>🎧 Piste ${String(a.track).padStart(2,'0')}</b><audio controls preload="none" src="audio/piste_${String(a.track).padStart(2,'0')}.mp3"></audio></div>`;
    if(a.img)h+=`<div class="doc">${imgs(a.img)}</div>`;
    if(a.note)h+=`<div class="note2">${esc(a.note)}</div>`;
    let lastG=null;
    a.items.forEach((it,i)=>{
      if(it.g&&it.g!==lastG){h+=`<div class="gtitle">${esc(it.g)}</div>`;lastG=it.g}
      const nm=`${id}-${a.id}-${i}`,sv=saved[i];
      h+=`<div class="item" data-i="${i}"><div class="q"><span>${a.items.length>1&&!/^\d/.test(it.q)&&!/^(Image|Photo|Question|Dialogue|Document)/.test(it.q)?(i+1)+'. ':''}${esc(it.q)}</span>${it.p?`<span class="pt">${fmt(it.p)}점</span>`:''}</div>`;
      if(it.img)h+=`<div class="itemimg">${imgs(it.img)}</div>`;
      if(it.t==='mcq'||it.t==='match'){
        const row=it.o.every(o=>o.length<22);
        h+=`<div class="opts ${row?'row':''}">`+it.o.map((o,j)=>`<label class="opt"><input type="radio" name="${nm}" value="${j}" ${sv==j&&sv!==null&&sv!==undefined?'checked':''}><span>${esc(o)}</span></label>`).join('')+'</div>';
      }else if(it.t==='text'||it.t==='num'||it.t==='phone'){
        h+=`<div>${it.pre?esc(it.pre)+' ':''}<input class="txt" type="text" autocomplete="off" spellcheck="false" placeholder="${it.t==='phone'?'__ __ __ __ __':'Votre réponse…'}" value="${esc(sv||'')}">${it.post?' '+esc(it.post):''}</div>`;
      }else if(it.t==='write'||it.t==='speak'){
        h+=`<textarea rows="${it.rows||3}" placeholder="${it.t==='speak'?'말할 내용을 미리 메모해 보세요 (선택)…':'Écrivez ici…'}">${esc(sv||'')}</textarea>`;
        if(it.words)h+=`<div class="wc"><span class="n">0</span> mots · objectif ${it.words}</div>`;
        if(it.t==='speak')h+=`<div class="rec"><button class="recb" type="button">● 녹음</button><span class="recs" style="font-size:13px;color:var(--mute)">내 발음을 녹음해서 들어 보세요 (저장되지 않음)</span></div>`;
      }else if(it.t==='draw'){
        h+=`<canvas data-map="${it.map}"></canvas><div class="actions"><button class="clr" type="button">지우기</button><span class="hint">지도 위에 손가락/마우스로 경로를 그리세요.</span></div>`;
      }
      if(it.hint)h+=`<div class="hint">💡 ${esc(it.hint)}</div>`;
      h+='<div class="fbx"></div></div>';
    });
    h+=`<div class="actions"><button class="pri chk">정답 확인</button><button class="rst">다시 풀기</button><span class="res"></span></div>`;
    el.innerHTML=h;
    /* word counters */
    $$('textarea',el).forEach(t=>{const c=t.parentElement.querySelector('.wc .n');if(c){const f=()=>c.textContent=(t.value.trim().match(/\S+/g)||[]).length;t.addEventListener('input',f);f()}});
    /* radio highlight */
    $$('.opt input',el).forEach(r=>r.addEventListener('change',()=>{$$(`input[name="${r.name}"]`,el).forEach(x=>x.parentElement.classList.toggle('sel',x.checked))}));
    $$('.opt input:checked',el).forEach(r=>r.parentElement.classList.add('sel'));
    /* canvases */
    $$('canvas',el).forEach(cv=>{
      const im=new Image();im.onload=()=>{cv.width=im.naturalWidth;cv.height=im.naturalHeight;cv._im=im;redraw(cv)};im.src=cv.dataset.map;cv._p=[];
      const ctx=()=>cv.getContext('2d');let on=false;
      const pos=e=>{const r=cv.getBoundingClientRect();return[(e.clientX-r.left)*cv.width/r.width,(e.clientY-r.top)*cv.height/r.height]};
      cv.addEventListener('pointerdown',e=>{on=true;cv.setPointerCapture(e.pointerId);cv._p.push([pos(e)]);});
      cv.addEventListener('pointermove',e=>{if(!on)return;const s=cv._p[cv._p.length-1];s.push(pos(e));redraw(cv)});
      const up=()=>{on=false};cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
      cv.parentElement.querySelector('.clr').onclick=()=>{cv._p=[];redraw(cv)};
    });
    function redraw(cv){const c=cv.getContext('2d');c.clearRect(0,0,cv.width,cv.height);if(cv._im)c.drawImage(cv._im,0,0);c.strokeStyle='#e0222d';c.lineWidth=Math.max(4,cv.width/110);c.lineCap=c.lineJoin='round';
      cv._p.forEach(s=>{c.beginPath();s.forEach((p,k)=>k?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke()})}
    /* recorders */
    $$('.recb',el).forEach(b=>{
      let mr=null,chunks=[];
      if(!(navigator.mediaDevices&&window.MediaRecorder)){b.disabled=true;b.title='이 브라우저는 녹음을 지원하지 않습니다';return}
      b.onclick=async()=>{
        const box=b.parentElement;
        if(mr&&mr.state==='recording'){mr.stop();return}
        try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});mr=new MediaRecorder(stream);chunks=[];
          mr.ondataavailable=e=>chunks.push(e.data);
          mr.onstop=()=>{stream.getTracks().forEach(t=>t.stop());b.textContent='● 다시 녹음';let au=box.querySelector('audio');if(!au){au=document.createElement('audio');au.controls=true;box.append(au)}au.src=URL.createObjectURL(new Blob(chunks,{type:mr.mimeType}))};
          mr.start();b.textContent='■ 정지';
        }catch(e){box.querySelector('.recs').textContent='마이크 권한이 필요합니다.'}
      };
    });
    /* get answers */
    function collect(){
      return a.items.map((it,i)=>{
        const w=$(`.item[data-i="${i}"]`,el);
        if(it.t==='mcq'||it.t==='match'){const r=$('input:checked',w);return r?+r.value:null}
        if(it.t==='draw')return null;
        const f=$('input.txt,textarea',w);return f?f.value:null;
      });
    }
    function paint(){
      const ans=collect();let s=0,m=0;
      a.items.forEach((it,i)=>{
        const w=$(`.item[data-i="${i}"]`,el),fb=$('.fbx',w);let h='';
        $$('.opt',w).forEach(o=>o.classList.remove('right','wrong'));
        const inp=$('input.txt',w);if(inp)inp.classList.remove('right','wrong');
        if(selfT(it)){
          const lv=self[i]==null?null:self[i];
          h=it.t==='draw'?`<div class="doc"><img src="${it.ans_img}" alt=""></div><div class="hint">↑ 교재의 정답 경로와 비교해 보세요.</div>`
            :`<div class="model"><b>${it.t==='speak'?'모범 답안 · 말하기 예시':'모범 답안 (Proposition)'}</b>\n${esc(it.model)}</div>`;
          if(it.p>0){m+=it.p;if(lv!=null)s+=it.p*lv;
            h+=`<div class="self">자가 채점 → ${[[0,'다시 도전'],[.5,'절반'],[1,'잘했어요']].map(([v,l])=>`<button type="button" data-v="${v}" class="${lv===v?'on':''}">${l}</button>`).join('')}</div>`}
          fb.innerHTML=h;
          $$('.self button',fb).forEach(b=>b.onclick=()=>{self[i]=+b.dataset.v;persist(true);paint()});
          return;
        }
        if(!graded(it)){fb.innerHTML='<div class="fb pend">정답 확인 중 (채점 제외)</div>';return}
        m+=it.p;const ok=check(it,ans[i]);
        if(ok)s+=it.p;
        if(it.t==='mcq'||it.t==='match'){$$('.opt',w).forEach((o,j)=>{if(j===it.a)o.classList.add('right');else if(ans[i]==j)o.classList.add('wrong')})}
        else if(inp)inp.classList.add(ok?'right':'wrong');
        fb.innerHTML=ok?`<div class="fb ok">✔ 정답 (+${fmt(it.p)})</div>`:`<div class="fb no">✘ 정답: <b>${esc(ansText(it))}</b></div>`;
      });
      $('.res',el).textContent=m?`${fmt(s)} / ${fmt(m)}점`:'';
      return{s,m,ans};
    }
    function persist(keep){
      const r=paint();sset(id+':'+a.id,{a:r.ans,self,s:r.s,m:r.m,done:true});updateTop();
    }
    el._check=()=>persist();
    $('.chk',el).onclick=()=>{persist();};
    $('.rst',el).onclick=()=>{
      sdel(id+':'+a.id);Object.keys(self).forEach(k=>delete self[k]);
      el.replaceWith(renderAct(a));updateTop();
    };
    if(st.done)paint();
    return el;
  }
  draw();
  if(location.hash){const t=document.getElementById(location.hash.slice(1));t&&t.scrollIntoView()}
}
