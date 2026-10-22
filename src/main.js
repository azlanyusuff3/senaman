import './style.css';
import {EXERCISES,GROUPS,PLANS,getExercise,getPlan,durationOf,levelName,buildCorePlan} from './data.js';

const STORE = 'senaman-v1';
const state = {
  page:'home', focus:'core', side:'front', query:'', gear:'all', difficulty:0,
  history:[], voice:false, details:null, active:null, finish:null,
  installPrompt:null, customizeMinutes:15, customizeLevel:1
};
try {
  const saved = JSON.parse(localStorage.getItem(STORE) || '{}');
  state.history = Array.isArray(saved.history) ? saved.history : [];
  state.voice = !!saved.voice;
} catch (_) {}
const app = document.querySelector('#app');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const store = () => { try { localStorage.setItem(STORE,JSON.stringify({history:state.history,voice:state.voice})); } catch (_) {} };
const clock = n => Math.floor(Math.max(0,n)/60).toString().padStart(2,'0') + ':' + (Math.max(0,n)%60).toString().padStart(2,'0');
const today = () => new Date().toLocaleDateString('en-CA');
const gearName = gear => ({bodyweight:'Tanpa alat',dumbbell:'Dumbbell',treadmill:'Treadmill'}[gear] || gear);
const labelFor = id => GROUPS.find(x=>x.id===id)?.label || 'Full Body';
const weekCount = () => {
  const start = new Date(); start.setHours(0,0,0,0); start.setDate(start.getDate()-6);
  return state.history.filter(x=>new Date(x.date+'T00:00:00')>=start).length;
};
const totalMinutes = () => Math.round(state.history.reduce((n,x)=>n+(x.seconds||0),0)/60);
const streak = () => {
  const set = new Set(state.history.map(x=>x.date)); let count = 0;
  const d = new Date(); d.setHours(12,0,0,0);
  if (!set.has(d.toLocaleDateString('en-CA'))) d.setDate(d.getDate()-1);
  for(let i=0;i<400 && set.has(d.toLocaleDateString('en-CA'));i++){
    count++; d.setDate(d.getDate()-1);
  }
  return count;
};
function art(ex,animated=false) {
  if (!ex || !ex.slug) return '<div class="art-fallback" aria-label="Senaman tanpa animasi">♥</div>';
  const prefix = 'https://cdn.jsdelivr.net/npm/@bryllim/workout-guide@1.0.0/assets/' + encodeURIComponent(ex.slug) + '/frame-';
  if(animated) return '<div class="frames" role="img" aria-label="Ilustrasi pergerakan '+escapeHtml(ex.name)+'">' +
    [1,2,3].map(n=>'<img loading="lazy" data-demo="1" src="'+prefix+n+'.png" alt="" aria-hidden="true">').join('') + '</div>';
  return '<img loading="lazy" data-demo="1" src="'+prefix+'1.png" alt="Ilustrasi '+escapeHtml(ex.name)+'"><span class="art-fallback" aria-hidden="true">◎</span>';
}
function bodyMap(){
  const selected=state.focus;
  const shape=(d,group)=>'<path tabindex="0" role="button" aria-label="Fokus '+escapeHtml(labelFor(group))+'" data-action="focus" data-id="'+group+'" class="muscle-shape '+(selected===group?'is-selected':'')+'" d="'+d+'"/>';
  const isBack=state.side==='back';
  return '<div class="body-map"><svg viewBox="0 0 280 335" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Pilih otot pada badan">' +
  '<circle class="body-base" cx="140" cy="32" r="24"/><path class="body-base" d="M106 57 Q85 62 79 85 L65 164 Q63 176 72 178 L83 179 102 113 101 172 110 205 101 315 127 316 142 219 152 316 178 315 171 206 181 171 179 113 199 177 208 179 Q218 175 214 165 L202 86 Q195 64 174 57 L156 53 123 53Z"/>' +
  (isBack ?
  shape('M109 60 L138 71 L138 129 L99 149 L103 97Z','back')+shape('M142 71 L173 60 L178 98 L181 148 L142 129Z','back')+
  shape('M110 156 Q140 166 171 156 L169 194 111 194Z','core'):
  shape('M107 66 Q140 79 173 66 L172 97 Q140 103 108 97Z','chest')+
  shape('M113 101 L167 101 168 175 112 175Z','core')) +
  shape('M89 75 L107 62 L101 121 84 156 72 153Z','shoulder')+
  shape('M173 62 L191 76 207 153 193 157 178 121Z','shoulder')+
  shape('M70 157 L86 154 80 177 71 177Z','arms')+
  shape('M194 156 L209 158 209 176 198 176Z','arms')+
  shape('M111 196 L139 205 128 278 101 280Z','legs')+
  shape('M143 205 L171 195 179 279 153 278Z','legs')+
  '<path class="guide-line" d="M140 105 V166 M114 127 H167 M116 148 H166"/>' +
  '</svg></div>';
}
function head() {
 return '<header class="topbar"><div class="brand"><span class="brand-mark">S</span><div>SENAMAN<small>HOME FITNESS</small></div></div><div class="top-actions"><span class="pill">🏠 Home only</span><button class="btn ghost small" data-action="go" data-page="settings">⚙ Settings</button></div></header>';
}
function footer(){return '<div class="footer">Senaman • Personal home fitness • Data hanya disimpan pada peranti ini</div>';}
function nav(){
 return '<nav class="tabbar" aria-label="Navigasi utama">'+[
 ['home','⌂','Utama'],['explore','◎','Senaman'],['progress','▥','Progress'],['settings','⚙','Settings']
 ].map(x=>'<button class="tab '+(state.page===x[0]?'active':'')+'" data-action="go" data-page="'+x[0]+'"><i>'+x[1]+'</i>'+x[2]+'</button>').join('')+'</nav>';
}
function planCard(plan) {
 return '<article class="plan"><div class="plan-ico">'+escapeHtml(plan.icon)+'</div><div><h3>'+escapeHtml(plan.name)+'</h3><p>'+escapeHtml(plan.subtitle)+'</p></div><div class="plan-meta"><span>◷ '+durationOf(plan)+' min</span><span>'+levelName(plan.level)+'</span></div><button class="btn small" data-action="start" data-id="'+plan.id+'">▶ Mula workout</button></article>';
}
function home(){
 const popular=[getPlan('core-starter'),getPlan('core-focus'),getPlan('walk-core')];
 return '<div class="intro"><div><div class="eyebrow">WORKOUT DI RUMAH</div><h2>Hai, jom bergerak 👋</h2><p class="muted">Dumbbell, treadmill atau berat badan sendiri. Mulakan dengan perut & core.</p></div></div>'+
 '<div class="grid-2"><section class="hero"><div class="hero-copy"><div class="ribbon">FOKUS UTAMA • CORE</div><h1>Perut lebih kuat.<br>Setiap minggu.</h1><p>Latihan ringkas dan konsisten, lengkap dengan panduan gerakan.</p><div class="row"><button class="btn" data-action="start" data-id="core-starter">▶ Core Starter</button><button class="btn secondary" data-action="focus" data-id="core">Lihat senaman</button></div></div></section>'+
 '<section class="surface focus-card"><div><div class="focus-card-head"><div><div class="eyebrow">BODY MAP</div><h3>Pilih bahagian badan</h3></div><span class="tag">'+escapeHtml(labelFor(state.focus))+'</span></div>'+bodyMap()+
 '<div class="body-controls"><button class="seg '+(state.side==='front'?'active':'')+'" data-action="side" data-id="front">Depan</button><button class="seg '+(state.side==='back'?'active':'')+'" data-action="side" data-id="back">Belakang</button></div></div></section></div>'+
 '<div class="stats"><div class="stat"><strong>'+weekCount()+'</strong><span>Workout (7 hari)</span></div><div class="stat"><strong>'+totalMinutes()+'</strong><span>Minit terkumpul</span></div><div class="stat"><strong>'+streak()+' 🔥</strong><span>Hari berturut</span></div></div>'+
 '<section><div class="section-head"><div><div class="eyebrow">TERUS BOLEH MULAKAN</div><h2>Workout untuk kau</h2></div><button class="mini-link" data-action="go" data-page="explore">Semua senaman →</button></div><div class="plans-grid">'+popular.map(planCard).join('')+'</div></section>'+
 '<div class="divider"></div><section class="grid-2"><div><div class="section-head"><h3>Target bahagian badan</h3></div><div class="group-row">'+GROUPS.map(x=>'<button class="group-chip '+(state.focus===x.id?'active':'')+'" data-action="focus" data-id="'+x.id+'">'+x.icon+' '+x.label+'</button>').join('')+'</div><div class="divider"></div><div class="section-head"><h3>Alat yang kita guna</h3></div><div class="equipment"><div class="equip"><span>🏋️</span> Dumbbell</div><div class="equip"><span>🏃</span> Treadmill</div><div class="equip"><span>🧘</span> Tanpa alat</div></div></div>'+
 '<div class="surface"><div class="eyebrow">BUAT RUTIN SENDIRI</div><h3 style="margin:10px 0 8px">Workout Generator</h3><p class="muted" style="font-size:13px">Bina rutin ikut masa dan tahap. Core akan diutamakan.</p>'+
 '<div class="row" style="margin:18px 0"><label class="muted" for="custom-time">Masa</label><select id="custom-time" class="select" data-change="minutes"><option value="10" '+(state.customizeMinutes===10?'selected':'')+'>10 min</option><option value="15" '+(state.customizeMinutes===15?'selected':'')+'>15 min</option><option value="20" '+(state.customizeMinutes===20?'selected':'')+'>20 min</option><option value="30" '+(state.customizeMinutes===30?'selected':'')+'>30 min</option></select><label class="muted" for="custom-level">Tahap</label><select id="custom-level" class="select" data-change="level"><option value="1" '+(state.customizeLevel===1?'selected':'')+'>Beginner</option><option value="2" '+(state.customizeLevel===2?'selected':'')+'>Intermediate</option><option value="3" '+(state.customizeLevel===3?'selected':'')+'>Advanced</option></select></div>'+
 '<button class="btn full" data-action="generate">✦ Generate core workout</button></div></section>'+
 '<div style="margin-top:24px" class="notice">Nota: Senaman core menguatkan otot perut tetapi tidak membakar lemak di perut secara khusus. Gabungkan latihan kekuatan, berjalan dan pemakanan yang sesuai. Berhenti jika sakit atau pening.</div>';
}
function exerciseCard(ex){
 return '<article class="exercise-card"><div class="exercise-art">'+art(ex)+'</div><div class="exercise-info"><div class="label-list"><span class="small-label">'+gearName(ex.gear)+'</span><span class="small-label">'+levelName(ex.level)+'</span></div><h3>'+escapeHtml(ex.name)+'</h3><p>'+escapeHtml(ex.desc)+'</p><button class="btn small secondary" data-action="details" data-id="'+ex.id+'">Lihat gerakan →</button></div></article>';
}
function explore(){
 const list = EXERCISES.filter(ex=>(state.focus==='all'||ex.group===state.focus) && (state.gear==='all'||ex.gear===state.gear) && (!state.difficulty||ex.level<=state.difficulty) && (ex.name.toLowerCase().includes(state.query.toLowerCase())||ex.desc.toLowerCase().includes(state.query.toLowerCase())));
 return '<button class="back" data-action="go" data-page="home">← Kembali</button><div class="eyebrow">EXERCISE LIBRARY</div><h1 style="font-size:42px;margin:7px 0">Cari gerakan yang sesuai</h1><p class="muted">Tap kategori otot dan lihat animasi, teknik serta video form guide bila tersedia.</p>'+
 '<div class="group-row" style="margin:19px 0"><button class="group-chip '+(state.focus==='all'?'active':'')+'" data-action="filter-group" data-id="all">Semua</button>'+GROUPS.map(x=>'<button class="group-chip '+(state.focus===x.id?'active':'')+'" data-action="filter-group" data-id="'+x.id+'">'+x.icon+' '+x.label+'</button>').join('')+'</div>'+
 '<div class="explore-toolbar"><input class="search" type="search" placeholder="Cari nama senaman..." id="exercise-search" value="'+escapeHtml(state.query)+'" aria-label="Cari senaman"><select class="select" data-change="gear"><option value="all">Semua alat</option>'+['bodyweight','dumbbell','treadmill'].map(g=>'<option value="'+g+'" '+(state.gear===g?'selected':'')+'>'+gearName(g)+'</option>').join('')+'</select><select class="select" data-change="difficulty"><option value="0">Semua tahap</option>'+[1,2,3].map(l=>'<option value="'+l+'" '+(state.difficulty===l?'selected':'')+'>Sehingga '+levelName(l)+'</option>').join('')+'</select></div>'+
 '<div class="section-head"><h3>'+escapeHtml(labelFor(state.focus==='all'?'all':state.focus))+'</h3><span class="muted">'+list.length+' gerakan</span></div>'+
 (list.length?'<div class="exercise-grid">'+list.map(exerciseCard).join('')+'</div>':'<div class="empty">Tiada senaman untuk filter ini. Cuba tukar kategori atau equipment.</div>');
}
function detail(){
 const ex=getExercise(state.details); if(!ex){state.details=null;return explore();}
 const videoUrl=ex.video?'https://www.youtube.com/watch?v='+ex.video:'https://www.youtube.com/results?search_query='+encodeURIComponent(ex.name+' exercise proper form tutorial');
 const videoText=ex.video?'▶ Tonton video panduan':'⌕ Cari video demonstrasi';
 return '<button class="back" data-action="close-details">← Semua senaman</button><div class="detail-layout"><div><div class="detail-art">'+art(ex,true)+'</div><div class="detail-notice">Animasi 3-frame jika aset tersedia • Demo dari Workout Guide</div></div>'+
 '<div class="surface"><div class="eyebrow">'+escapeHtml(labelFor(ex.group))+' • '+gearName(ex.gear)+'</div><h1 style="font-size:clamp(28px,4vw,44px);margin:12px 0">'+escapeHtml(ex.name)+'</h1><p class="muted">'+escapeHtml(ex.desc)+'</p><div class="row" style="margin:16px 0"><span class="tag">'+levelName(ex.level)+'</span><span class="tag">'+escapeHtml(ex.reps)+'</span><span class="tag">~'+clock(ex.seconds)+'</span></div><h3>Cara buat</h3><ol class="steps">'+ex.steps.map(s=>'<li>'+escapeHtml(s)+'</li>').join('')+'</ol><div class="session-tip">💡 '+escapeHtml(ex.tip)+'</div><div class="detail-buttons"><a class="btn" href="'+videoUrl+'" target="_blank" rel="noopener noreferrer">'+videoText+' ↗</a><button class="btn secondary" data-action="single" data-id="'+ex.id+'">▶ Buat sekarang</button></div></div></div>'+
 (ex.video ? '<section class="surface" style="margin-top:16px"><h3>Video cara buat</h3><p class="muted" style="font-size:12px;margin:7px 0 12px">Video tutorial daripada sumber asal, terus dalam aplikasi.</p><div class="video-box"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/'+ex.video+'" title="Video tutorial '+escapeHtml(ex.name)+'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div></section>' : '') + '<div class="notice" style="margin-top:16px">Video YouTube perlukan internet. Visual 3-frame dimuatkan daripada library terbuka; jika tiada ilustrasi, rujuk panduan bertulis/video.</div>';
}
function progress(){
 const recent=state.history.slice().reverse();
 return '<div class="eyebrow">REKOD PERIBADI</div><h1 style="font-size:42px;margin:8px 0 12px">Progress kau</h1><p class="muted">Disimpan hanya pada browser/peranti ini. Tak perlu login.</p>'+
 '<div class="stats"><div class="stat"><strong>'+state.history.length+'</strong><span>Workout selesai</span></div><div class="stat"><strong>'+totalMinutes()+'</strong><span>Jumlah minit</span></div><div class="stat"><strong>'+streak()+'</strong><span>Streak hari</span></div></div>'+
 '<div class="section-head"><h2>Sejarah latihan</h2><button class="btn small secondary" data-action="export">⇩ Export data</button></div>'+
 (recent.length?'<div class="progress-list">'+recent.map(item=>'<div class="progress-item"><div><strong>'+escapeHtml(item.name)+'</strong><small>'+escapeHtml(item.date)+' • '+item.exercises+' set gerakan selesai</small></div><span class="tag">'+Math.round(item.seconds/60)+' min</span></div>').join('')+'</div>':'<div class="empty">Belum ada rekod. Cuba mulakan Core Starter hari ini.</div>');
}
function settings(){
 return '<div class="eyebrow">PREFERENCES</div><h1 style="font-size:42px;margin:8px 0 18px">Settings</h1>'+
 '<div class="settings-card"><div><strong>Voice Coach</strong><small>Suara Bahasa Melayu melalui text-to-speech browser, jika disokong.</small></div><input type="checkbox" class="toggle" data-change="voice" '+(state.voice?'checked':'')+' aria-label="Aktifkan voice coach"></div>'+
 '<div class="settings-card"><div><strong>Export rekod workout</strong><small>Simpan salinan JSON pada device.</small></div><button class="btn small secondary" data-action="export">Export</button></div>'+
 '<div class="settings-card"><div><strong>Reset progress</strong><small>Padam rekod local browser ini sahaja.</small></div><button class="btn small danger" data-action="reset">Reset</button></div>'+
 '<div class="surface" style="margin-top:20px"><h3>Tentang aplikasi</h3><p class="muted" style="font-size:13px;margin-top:11px">Personal trainer PWA untuk kegunaan di rumah. Tiada login, tiada tracking lokasi, tiada backend. Data workout disimpan dalam localStorage. Uninstall, clear site data atau tukar device boleh menghilangkan rekod kecuali diexport terlebih dahulu.</p>'+
 '<p class="muted" style="font-size:13px;margin-top:11px">Ilustrasi 3-frame daripada <a href="https://github.com/bryllim/workout-guide" target="_blank" rel="noopener noreferrer">Workout Guide oleh Bryl Lim</a>, berdasarkan artwork Everkinetic, dilesenkan <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noopener noreferrer">CC BY-SA 4.0</a>. Perubahan: animasi frame melalui CSS sahaja, tiada pengubahsuaian fail SVG. Kod serta teks aplikasi Senaman ialah ciptaan projek ini.</p>'+
 '<p class="muted" style="font-size:13px;margin-top:11px">Pautan video kepada saluran pihak ketiga bukan salinan atau hak milik Senaman. Ciri asas PWA berfungsi offline selepas dipasang/dicache; animasi remote dan YouTube memerlukan internet sekurang-kurangnya pada akses pertama.</p>'+
 '<div class="notice" style="margin-top:16px">Keselamatan: Mulakan dengan intensiti rendah, pastikan kawasan treadmill selamat dan gunakan beban yang boleh dikawal. Hentikan senaman jika sakit, pening, sesak nafas luar biasa atau simptom lain yang membimbangkan.</div></div>';
}
function speak(text){
 if(!state.voice||!('speechSynthesis' in window))return;
 try{
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(text);
  utterance.lang='ms-MY'; utterance.rate=.94; window.speechSynthesis.speak(utterance);
 }catch(_){}
}
function makeSequence(plan){
 const sequence=[];
 for(let r=0;r<plan.rounds;r++){
  for(let i=0;i<plan.items.length;i++){
   const ex=getExercise(plan.items[i]); if(!ex)continue;
   sequence.push({type:'exercise',id:ex.id,round:r+1});
   if(!(r===plan.rounds-1 && i===plan.items.length-1)) sequence.push({type:'rest',seconds:plan.rest});
  }
 }
 return sequence;
}
function start(plan){
 const sequence=makeSequence(plan);
 if(!sequence.length)return;
 state.finish=null; state.details=null; state.active={name:plan.name,sequence,index:0,remaining:getExercise(sequence[0].id).seconds,elapsed:0,completed:0,paused:false,started:new Date().toISOString()};
 if(navigator.wakeLock?.request) navigator.wakeLock.request('screen').then(lock=>state.wakeLock=lock).catch(()=>{});
 speak('Jom mula senaman. '+getExercise(sequence[0].id).name);
 render();
}
function advance(skipped=false){
 const w=state.active;if(!w)return;
 const current=w.sequence[w.index];
 if(current.type==='exercise'&&!skipped)w.completed++;
 w.index++;
 if(w.index>=w.sequence.length){finishWorkout();return;}
 const item=w.sequence[w.index];w.remaining=item.type==='rest'?item.seconds:getExercise(item.id).seconds;
 if(item.type==='exercise')speak('Seterusnya: '+getExercise(item.id).name);
 else speak('Rehat sebentar');
 render();
}
function finishWorkout(){
 const w=state.active;if(!w)return;
 const seconds=w.elapsed;
 const entry={name:w.name,date:today(),seconds,exercises:w.completed};
 state.history.push(entry);store();
 state.finish=entry; state.active=null;state.wakeLock?.release().catch(()=>{});state.wakeLock=null;
 speak('Syabas. Workout selesai.');
 render();
}
function cancelWorkout(){
 if(window.confirm('Keluar dari workout? Progress sesi ini tidak akan direkodkan.')){
  state.active=null;state.wakeLock?.release().catch(()=>{});state.wakeLock=null;
  window.speechSynthesis?.cancel();render();
 }
}
function session(){
 const w=state.active,item=w.sequence[w.index],rest=item.type==='rest';
 const ex=rest?null:getExercise(item.id);
 const total=rest?item.seconds:ex.seconds;
 const position=w.index+1,percent=(position-1+(1-w.remaining/total))/w.sequence.length*100;
 return '<div class="session-shell"><div class="session-top"><button class="back" data-action="exit" style="padding:0">✕ Keluar</button><span>'+escapeHtml(w.name)+' • '+position+'/'+w.sequence.length+'</span><span>◷ '+clock(w.elapsed)+'</span></div>'+
 '<div class="session-progress"><div style="width:'+Math.min(100,percent)+'%"></div></div><section class="session-focus"><div class="eyebrow">'+(rest?'REHAT':('GERAKAN '+w.sequence.filter((x,i)=>x.type==='exercise'&&i<=w.index).length))+'</div><h1 style="margin:8px 0">'+(rest?'Tarik nafas, rehat 😌':escapeHtml(ex.name))+'</h1><p class="muted">'+(rest?'Bersedia untuk gerakan seterusnya':escapeHtml(ex.reps)+' • '+escapeHtml(gearName(ex.gear)))+'</p>'+
 '<div class="session-art">'+(rest?'<span class="rest-art">◷</span>':art(ex,true))+'</div><div class="timer" id="time-left">'+clock(w.remaining)+'</div><div class="timer-sub">'+(rest?'Rest timer':'Ikut reps dengan teknik yang betul; timer sebagai panduan')+'</div>'+
 '<div class="session-actions"><button class="btn secondary" data-action="previous" '+(w.index===0?'disabled':'')+'>← Kembali</button><button class="btn" data-action="pause">'+(w.paused?'▶ Sambung':'Ⅱ Pause')+'</button><button class="btn secondary" data-action="next">'+(rest?'Skip →':'✓ Siap →')+'</button></div>'+
 (!rest?'<div class="session-tip">💡 '+escapeHtml(ex.tip)+'</div>':'<div class="session-tip">Boleh mula sebelum rehat tamat dengan menekan Skip.</div>')+'</section></div>';
}
function complete(){
 const f=state.finish;return '<div class="app-shell"><div class="complete"><div class="complete-badge">🏆</div><div class="eyebrow">WORKOUT SELESAI</div><h1>Bagus! Kau dah buat.</h1><p class="muted" style="margin-top:12px">Konsisten lebih penting daripada perfect. Rehat dan beri badan masa untuk pulih.</p><div class="stats"><div class="stat"><strong>'+Math.round(f.seconds/60)+'</strong><span>Minit</span></div><div class="stat"><strong>'+f.exercises+'</strong><span>Gerakan siap</span></div><div class="stat"><strong>'+streak()+'</strong><span>Hari streak</span></div></div><button class="btn full" data-action="finish-close">Kembali ke Home →</button></div></div>';
}
function render(){
 if(state.active){app.innerHTML=session();return;}
 if(state.finish){app.innerHTML=complete();return;}
 app.innerHTML='<div class="app-shell">'+head()+
  (state.details?detail():state.page==='home'?home():state.page==='explore'?explore():state.page==='progress'?progress():settings())+
  footer()+'</div>'+nav();
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-action]');if(!el)return;
 const action=el.dataset.action, id=el.dataset.id;
 if(action==='go'){state.page=el.dataset.page;state.details=null;window.scrollTo(0,0);}
 else if(action==='focus'||action==='filter-group'){state.focus=id;state.page='explore';state.details=null;state.query='';window.scrollTo(0,0);}
 else if(action==='side'){state.side=id;}
 else if(action==='details'){state.details=id;state.page='explore';window.scrollTo(0,0);}
 else if(action==='close-details'){state.details=null;}
 else if(action==='start'){start(getPlan(id));window.scrollTo(0,0);return;}
 else if(action==='single'){const ex=getExercise(id);start({name:ex.name,items:[id],rounds:1,rest:0});return;}
 else if(action==='generate'){
  start(buildCorePlan(state.customizeMinutes,state.customizeLevel));return;
 }
 else if(action==='next'){advance(false);return;}
 else if(action==='previous'){const w=state.active;w.index=Math.max(0,w.index-1);const x=w.sequence[w.index];w.remaining=x.type==='rest'?x.seconds:getExercise(x.id).seconds;w.paused=true;}
 else if(action==='pause'){state.active.paused=!state.active.paused;}
 else if(action==='exit'){cancelWorkout();return;}
 else if(action==='finish-close'){state.finish=null;state.page='home';window.scrollTo(0,0);}
 else if(action==='export'){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),history:state.history},null,2)],{type:'application/json'});
  const href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download='senaman-progress-'+today()+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);return;
 }
 else if(action==='reset'){if(window.confirm('Padam semua rekod workout dalam browser ini?')){state.history=[];store();}}
 else if(action==='install'){state.installPrompt?.prompt();return;}
 else return;
 render();
});
document.addEventListener('keydown',e=>{
 if((e.key==='Enter'||e.key===' ')&&e.target.matches('svg [data-action]')){e.preventDefault();e.target.dispatchEvent(new MouseEvent('click',{bubbles:true}));}
});
document.addEventListener('change',e=>{
 const type=e.target.dataset.change;if(!type)return;
 if(type==='minutes')state.customizeMinutes=Number(e.target.value);
 if(type==='level')state.customizeLevel=Number(e.target.value);
 if(type==='gear')state.gear=e.target.value;
 if(type==='difficulty')state.difficulty=Number(e.target.value);
 if(type==='voice'){state.voice=e.target.checked;store();}
 render();
});
document.addEventListener('input',e=>{
 if(e.target.id!=='exercise-search')return;
 state.query=e.target.value;
 const cursor=e.target.selectionStart;render();
 const input=document.querySelector('#exercise-search');input?.focus();try{input?.setSelectionRange(cursor,cursor);}catch(_){}
});
document.addEventListener('error',e=>{
 const img=e.target;if(!(img instanceof HTMLImageElement)||!img.dataset.demo)return;
 const frames=img.closest('.frames');
 if(frames){frames.innerHTML='<span class="art-fallback" role="img" aria-label="Ilustrasi tidak tersedia">◎</span>';}
 else img.classList.add('failed');
},true);
setInterval(()=>{
 const w=state.active;if(!w||w.paused)return;
 w.remaining--;w.elapsed++;
 if(w.remaining<=0)advance(false);
 else{
  const display=document.querySelector('#time-left');if(display)display.textContent=clock(w.remaining);
  const progress=document.querySelector('.session-progress>div');
  if(progress){const item=w.sequence[w.index],max=item.type==='rest'?item.seconds:getExercise(item.id).seconds;progress.style.width=((w.index+(1-w.remaining/max))/w.sequence.length*100)+'%';}
 }
},1000);
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();state.installPrompt=e;});
if('serviceWorker' in navigator){window.addEventListener('load',()=>navigator.serviceWorker.register(import.meta.env.BASE_URL+'sw.js').catch(()=>{}));}
render();
