const K='focusflow.v1',$=s=>document.querySelector(s);
let S=null;try{S=JSON.parse(localStorage.getItem(K))}catch(e){}
S=Object.assign({tasks:[],notes:[],sessions:[]},S||{});S.settings=Object.assign({name:'',focus:25,brk:5,theme:'auto'},S.settings);
const save=()=>{try{localStorage.setItem(K,JSON.stringify(S))}catch(e){toast('Could not save: browser storage is full or blocked')}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,10),P={High:3,Medium:2,Low:1};
const iso=d=>{d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')},today=()=>iso();
const addD=(s,n)=>{const d=new Date(s+'T00:00');d.setDate(d.getDate()+n);return iso(d)};
const nextD=(s,r)=>{if(r=='daily')return addD(s,1);if(r=='weekly')return addD(s,7);const d=new Date(s+'T00:00');d.setMonth(d.getMonth()+1);return iso(d)};
const fd=s=>s?new Date(s+'T00:00').toLocaleDateString(undefined,{month:'short',day:'numeric'}):'';
const T=id=>S.tasks.find(t=>t.id==id),N_=id=>S.notes.find(n=>n.id==id);
const od=t=>t.status=='todo'&&t.due&&t.due<today();
const fmtMin=m=>m>=60?Math.floor(m/60)+'h '+(m%60)+'m':m+'m';
const focusMin=id=>S.sessions.filter(s=>!id||s.task==id).reduce((a,s)=>a+s.min,0);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toast.h);toast.h=setTimeout(()=>t.classList.remove('on'),2200)}
function theme(){const t=S.settings.theme;if(t=='auto')delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t}
function streaks(){const ds=[...new Set(S.tasks.filter(t=>t.doneOn).map(t=>t.doneOn))].sort();let best=0,run=0,prev=null;
ds.forEach(d=>{run=prev&&addD(prev,1)==d?run+1:1;best=Math.max(best,run);prev=d});
let cur=0,d=ds.includes(today())?today():addD(today(),-1);while(ds.includes(d)){cur++;d=addD(d,-1)}return{cur,best}}
const row=t=>`<div class="row ${t.status=='done'?'done':''}"><button class="chk" data-act="toggle" data-id="${t.id}" aria-label="Mark ${t.status=='done'?'incomplete':'complete'}: ${esc(t.title)}">${t.status=='done'?'✓':''}</button>
<div class="t"><b>${esc(t.title)}</b>${t.desc?`<div class="meta">${esc(t.desc)}</div>`:''}<div class="meta"><span class="chip ${t.pri}">${t.pri}</span>${t.due?`<span class="chip ${od(t)?'od':''}">${od(t)?'Overdue · ':''}${fd(t.due)}${t.time?' '+t.time:''}</span>`:''}${t.cat?`<span>${esc(t.cat)}</span>`:''}${t.rec?`<span>repeats ${t.rec}</span>`:''}${focusMin(t.id)?`<span>${fmtMin(focusMin(t.id))} focused</span>`:''}</div></div>
<div class="bar" style="margin:0;flex:none"><button class="btn s" data-act="edit" data-id="${t.id}">Edit</button><button class="btn s" data-act="arch" data-id="${t.id}">${t.status=='archived'?'Restore':'Archive'}</button><button class="btn s d" data-act="del" data-id="${t.id}">Delete</button></div></div>`;

let F={q:'',st:'active',pri:'',cat:'',due:'',sort:'due'},NS={sel:null,q:'',arch:false},CM=new Date();CM.setDate(1);
const V={
dashboard(){const a=S.tasks.filter(t=>t.status!='archived'),done=a.filter(t=>t.status=='done'),pend=a.filter(t=>t.status=='todo'),sk=streaks(),td=today();
const wkAgo=addD(td,-6),wkT=a.filter(t=>t.due&&t.due>=wkAgo&&t.due<=td),rate=wkT.length?Math.round(wkT.filter(t=>t.status=='done').length/wkT.length*100)+'%':'–';
const days=[...Array(7)].map((_,i)=>addD(td,i-6)),cnt=days.map(d=>S.tasks.filter(t=>t.doneOn==d).length),mx=Math.max(1,...cnt);
const up=pend.filter(t=>t.due).sort((x,y)=>x.due.localeCompare(y.due)).slice(0,5),rn=S.notes.filter(n=>!n.arch).sort((x,y)=>y.upd-x.upd).slice(0,4);
const st=(b,l)=>`<div class="card stat"><b>${b}</b><span>${l}</span></div>`;
return`<h1>${S.settings.name?'Hi, '+esc(S.settings.name):'Dashboard'}</h1><p class="sub">${S.tasks.length?'Here is where things stand.':'Start by adding your first task.'}</p>
<div class="bar"><button class="btn p" data-act="newtask">Add task</button><button class="btn" data-act="newnote">New note</button></div>
<div class="grid">${st(a.length,'Total tasks')}${st(done.length,'Completed')}${st(pend.length,'Pending')}${st(pend.filter(od).length,'Overdue')}${st(pend.filter(t=>t.due==td).length,'Due today')}${st(rate,'Weekly completion')}${st(fmtMin(focusMin()),'Focus time')}${st(sk.cur+' day'+(sk.cur==1?'':'s'),'Streak (best '+sk.best+')')}</div>
<div class="two"><div class="card"><h2>Upcoming deadlines</h2>${up.length?up.map(row).join(''):'<div class="empty">No deadlines set. Add a due date to a task.</div>'}</div>
<div><div class="card" style="margin-bottom:12px"><h2>Completed this week</h2><div class="wk">${cnt.map((c,i)=>`<div><i style="height:${c/mx*70}px" title="${c}"></i>${new Date(days[i]+'T00:00').toLocaleDateString(undefined,{weekday:'short'})}</div>`).join('')}</div></div>
<div class="card"><h2>Recent notes</h2>${rn.length?rn.map(n=>`<div class="nitem" data-act="opennote" data-id="${n.id}"><b>${esc(n.title||'Untitled')}</b><small>${esc(n.body)}</small></div>`).join(''):'<div class="empty">No notes yet.</div>'}</div></div></div>`},
tasks(){const cats=[...new Set(S.tasks.map(t=>t.cat).filter(Boolean))];
return`<h1>Tasks</h1><p class="sub">Search, filter and sort everything you need to do.</p>
<div class="bar"><input id="f-q" placeholder="Search tasks" aria-label="Search tasks" value="${esc(F.q)}"><button class="btn p" data-act="newtask">Add task</button></div>
<div class="bar"><select id="f-st" aria-label="Status">${[['active','Active'],['todo','To do'],['done','Completed'],['archived','Archived'],['all','All']].map(o=>`<option value="${o[0]}" ${F.st==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
<select id="f-pri" aria-label="Priority"><option value="">Any priority</option>${['High','Medium','Low'].map(p=>`<option ${F.pri==p?'selected':''}>${p}</option>`).join('')}</select>
<select id="f-cat" aria-label="Category"><option value="">Any category</option>${cats.map(c=>`<option ${F.cat==c?'selected':''}>${esc(c)}</option>`).join('')}</select>
<select id="f-due" aria-label="Due date">${[['','Any due date'],['over','Overdue'],['today','Today'],['week','Next 7 days'],['none','No due date']].map(o=>`<option value="${o[0]}" ${F.due==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select>
<select id="f-sort" aria-label="Sort">${[['due','Sort: deadline'],['pri','Sort: priority'],['new','Sort: newest'],['status','Sort: status']].map(o=>`<option value="${o[0]}" ${F.sort==o[0]?'selected':''}>${o[1]}</option>`).join('')}</select></div>
<div class="card" id="tl" style="padding:0"></div>`},
notes(){return`<h1>Notes</h1><p class="sub">Write things down. Changes save as you type.</p>
<div class="bar"><input id="n-q" placeholder="Search notes" aria-label="Search notes" value="${esc(NS.q)}"><button class="btn" data-act="narch">${NS.arch?'Show active':'Show archived'}</button><button class="btn p" data-act="newnote">New note</button></div>
<div class="notes"><div class="card" id="nl" style="padding:0;max-height:70vh;overflow:auto"></div><div class="card ed" id="ne"></div></div>`},
calendar(){const y=CM.getFullYear(),m=CM.getMonth(),start=new Date(y,m,1-new Date(y,m,1).getDay()),td=today();let h='';
['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>h+=`<div class="h">${d}</div>`);
for(let i=0;i<42;i++){const d=new Date(start);d.setDate(start.getDate()+i);const s=iso(d),ts=S.tasks.filter(t=>t.due==s&&t.status!='archived');
h+=`<div class="day ${d.getMonth()!=m?'dim':''} ${s==td?'now':''}" data-act="newtask" data-d="${s}"><span class="n">${d.getDate()}</span>${ts.slice(0,3).map(t=>`<span class="pill ${od(t)?'od':''} ${t.status=='done'?'dn':''}" data-act="edit" data-id="${t.id}">${esc(t.title)}</span>`).join('')}${ts.length>3?`<span style="color:var(--mute)">+${ts.length-3} more</span>`:''}</div>`}
return`<h1>Calendar</h1><p class="sub">Click a day to add a task, or a task to open it.</p><div class="bar"><button class="btn" data-act="cprev" aria-label="Previous month">‹</button><b style="min-width:150px;text-align:center">${CM.toLocaleDateString(undefined,{month:'long',year:'numeric'})}</b><button class="btn" data-act="cnext" aria-label="Next month">›</button><button class="btn" data-act="ctoday">Today</button></div><div class="cal">${h}</div>`},
focus(){const ts=S.tasks.filter(t=>t.status=='todo'),td=S.sessions.filter(s=>s.at.slice(0,10)==today());
return`<h1>Focus</h1><p class="sub">Pick a task and work in timed sessions.</p><div class="card center">
<label for="ftask" style="display:block;text-align:left;color:var(--mute);font-size:13px">Task</label><select id="ftask"><option value="">No specific task</option>${ts.map(t=>`<option value="${t.id}" ${TM.task==t.id?'selected':''}>${esc(t.title)}</option>`).join('')}</select>
<div id="mode" style="margin-top:14px;color:var(--mute)"></div><div class="clock" id="clock" aria-live="off"></div>
<div class="bar"><button class="btn p" id="fgo" data-act="fgo"></button><button class="btn" data-act="freset">Reset</button><button class="btn" data-act="fmode">Switch to ${TM.mode=='focus'?'break':'focus'}</button></div>
<p class="sub" style="margin:10px 0 0">${td.length} session${td.length==1?'':'s'} today · ${fmtMin(focusMin())} total${TM.task&&T(TM.task)?' · '+fmtMin(focusMin(TM.task))+' on this task':''}</p></div>
<p class="sub" style="text-align:center;margin-top:14px"><a href="#/tasks" data-act="none">Mark the task complete from Tasks when you finish.</a></p>`},
settings(){const s=S.settings;return`<h1>Settings</h1><p class="sub">Everything is stored in this browser on this device.</p><div class="card" style="max-width:480px">
<label for="s-name">Display name</label><input id="s-name" value="${esc(s.name)}">
<div class="f2"><div><label for="s-focus">Focus minutes</label><input type="number" min="1" max="180" id="s-focus" value="${s.focus}"></div><div><label for="s-brk">Break minutes</label><input type="number" min="1" max="60" id="s-brk" value="${s.brk}"></div></div>
<label for="s-theme">Theme</label><select id="s-theme">${['auto','light','dark'].map(t=>`<option value="${t}" ${s.theme==t?'selected':''}>${t[0].toUpperCase()+t.slice(1)}</option>`).join('')}</select>
<div class="bar" style="margin-top:16px"><button class="btn" data-act="export">Export data</button><button class="btn d" data-act="wipe">Delete all data</button></div></div>`}};

function tl(){let l=S.tasks.filter(t=>{const q=F.q.toLowerCase(),td=today();
if(F.st=='active'&&t.status=='archived')return 0;if(!['active','all'].includes(F.st)&&t.status!=F.st)return 0;
if(F.pri&&t.pri!=F.pri)return 0;if(F.cat&&t.cat!=F.cat)return 0;
if(F.due=='over'&&!od(t))return 0;if(F.due=='today'&&t.due!=td)return 0;if(F.due=='week'&&!(t.due&&t.due>=td&&t.due<=addD(td,7)))return 0;if(F.due=='none'&&t.due)return 0;
return!q||(t.title+' '+t.desc+' '+t.cat).toLowerCase().includes(q)});
const so={due:(a,b)=>(a.due||'9')<(b.due||'9')?-1:(a.due||'9')>(b.due||'9')?1:0,pri:(a,b)=>P[b.pri]-P[a.pri],new:(a,b)=>b.created-a.created,status:(a,b)=>(a.status=='done')-(b.status=='done')};
l.sort(so[F.sort]);$('#tl').innerHTML=l.length?l.map(row).join(''):`<div class="empty">${S.tasks.length?'No tasks match these filters.':'No tasks yet. Add one to get started.'}</div>`}
function nl(){const q=NS.q.toLowerCase(),l=S.notes.filter(n=>!!n.arch==NS.arch&&(!q||(n.title+' '+n.body+' '+n.tags.join(' ')).toLowerCase().includes(q))).sort((a,b)=>(b.pin-a.pin)||b.upd-a.upd);
$('#nl').innerHTML=l.length?l.map(n=>`<div class="nitem ${n.id==NS.sel?'on':''}" data-act="selnote" data-id="${n.id}"><b>${n.pin?'📌 ':''}${esc(n.title||'Untitled')}</b><small>${esc(n.body)||'Empty note'}</small></div>`).join(''):'<div class="empty">No notes here.</div>';
const n=N_(NS.sel);$('#ne').innerHTML=n?`<input id="e-title" placeholder="Title" aria-label="Note title" value="${esc(n.title)}"><textarea id="e-body" aria-label="Note content" placeholder="Write something">${esc(n.body)}</textarea>
<input id="e-tags" aria-label="Tags" placeholder="Tags, separated by commas" value="${esc(n.tags.join(', '))}"><select id="e-task" aria-label="Linked task"><option value="">No linked task</option>${S.tasks.map(t=>`<option value="${t.id}" ${n.task==t.id?'selected':''}>${esc(t.title)}</option>`).join('')}</select>
<div class="bar" style="margin:0"><button class="btn" data-act="pin">${n.pin?'Unpin':'Pin'}</button><button class="btn" data-act="narc">${n.arch?'Restore':'Archive'}</button><button class="btn d" data-act="ndel">Delete</button></div>`:'<div class="empty">Select a note or create a new one.</div>'}

const TM={mode:'focus',left:null,end:null,run:false,task:''};
const dur=()=>(TM.mode=='focus'?S.settings.focus:S.settings.brk)*60;
function tick(){if(TM.left==null)TM.left=dur();if(TM.run){TM.left=Math.max(0,Math.round((TM.end-Date.now())/1000));if(TM.left==0)finish()}
const c=$('#clock');if(c){c.textContent=String(Math.floor(TM.left/60)).padStart(2,'0')+':'+String(TM.left%60).padStart(2,'0');$('#mode').textContent=TM.mode=='focus'?'Focus session':'Break';$('#fgo').textContent=TM.run?'Pause':(TM.left<dur()?'Resume':'Start')}}
function finish(){TM.run=false;if(TM.mode=='focus'){S.sessions.push({id:uid(),task:TM.task,min:S.settings.focus,at:new Date().toISOString()});save();toast('Focus session recorded. Time for a break.')}else toast('Break over.');TM.mode=TM.mode=='focus'?'break':'focus';TM.left=dur();if(location.hash=='#/focus')render()}
setInterval(tick,500);

function openTask(id,due){const t=id?T(id):null;$('#dt').textContent=t?'Edit task':'New task';$('#dlg').dataset.id=id||'';
$('#cats').innerHTML=[...new Set(S.tasks.map(x=>x.cat).filter(Boolean))].map(c=>`<option value="${esc(c)}">`).join('');
$('#t-title').value=t?t.title:'';$('#t-desc').value=t?t.desc:'';$('#t-pri').value=t?t.pri:'Medium';$('#t-cat').value=t?t.cat:'';$('#t-due').value=t?t.due:(due||'');$('#t-time').value=t?t.time:'';$('#t-rec').value=t?t.rec:'';$('#dlg').showModal();$('#t-title').focus()}
const A={none(){},
newtask:d=>openTask(null,d.d),edit:d=>openTask(d.id),dlgx:()=>$('#dlg').close(),
dlgsave(){const title=$('#t-title').value.trim();if(!title){toast('Enter a task title');$('#t-title').focus();return}
const id=$('#dlg').dataset.id,v={title,desc:$('#t-desc').value.trim(),pri:$('#t-pri').value,cat:$('#t-cat').value.trim(),due:$('#t-due').value,time:$('#t-time').value,rec:$('#t-rec').value};
if(id)Object.assign(T(id),v);else S.tasks.push({id:uid(),status:'todo',created:Date.now(),doneOn:null,...v});save();$('#dlg').close();toast('Task saved');render()},
toggle(d){const t=T(d.id);if(t.status=='done'){t.status='todo';t.doneOn=null}else{t.status='done';t.doneOn=today();if(t.rec&&t.due)S.tasks.push({...t,id:uid(),status:'todo',doneOn:null,due:nextD(t.due,t.rec),created:Date.now()})}save();render()},
arch(d){const t=T(d.id);t.status=t.status=='archived'?'todo':'archived';save();render()},
del(d){if(confirm('Delete this task? This cannot be undone.')){S.tasks=S.tasks.filter(t=>t.id!=d.id);save();toast('Task deleted');render()}},
newnote(){const n={id:uid(),title:'',body:'',tags:[],task:'',pin:false,arch:false,upd:Date.now()};S.notes.push(n);NS.sel=n.id;NS.arch=false;save();if(location.hash!='#/notes')location.hash='#/notes';else render()},
opennote(d){NS.sel=d.id;location.hash='#/notes'},selnote(d){NS.sel=d.id;nl()},
narch(){NS.arch=!NS.arch;NS.sel=null;nl();$('[data-act=narch]').textContent=NS.arch?'Show active':'Show archived'},
pin(){const n=N_(NS.sel);n.pin=!n.pin;save();nl()},narc(){const n=N_(NS.sel);n.arch=!n.arch;NS.sel=null;save();nl()},
ndel(){if(confirm('Delete this note? This cannot be undone.')){S.notes=S.notes.filter(n=>n.id!=NS.sel);NS.sel=null;save();toast('Note deleted');nl()}},
cprev(){CM.setMonth(CM.getMonth()-1);render()},cnext(){CM.setMonth(CM.getMonth()+1);render()},ctoday(){CM=new Date();CM.setDate(1);render()},
fgo(){if(TM.run){TM.run=false}else{TM.end=Date.now()+TM.left*1000;TM.run=true}tick()},
freset(){TM.run=false;TM.left=dur();tick()},fmode(){TM.run=false;TM.mode=TM.mode=='focus'?'break':'focus';TM.left=dur();render()},
export(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,2)],{type:'application/json'}));a.download='focusflow-data.json';a.click()},
wipe(){if(confirm('Delete all tasks, notes and sessions from this browser?')){S.tasks=[];S.notes=[];S.sessions=[];save();toast('All data deleted');render()}}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;if(b.classList.contains('day')&&e.target.closest('.pill'))return;if(b.dataset.act=='newtask'&&b.classList.contains('day')&&e.target!==b&&!e.target.classList.contains('n'))return;A[b.dataset.act]&&A[b.dataset.act](b.dataset)});
const FM={'f-q':'q','f-st':'st','f-pri':'pri','f-cat':'cat','f-due':'due','f-sort':'sort'};
function onIn(e){const i=e.target.id;if(FM[i]){F[FM[i]]=e.target.value;tl();return}
if(i=='n-q'){NS.q=e.target.value;nl();return}
if(i=='ftask'){TM.task=e.target.value;render();return}
const n=N_(NS.sel);if(n&&i.startsWith('e-')){if(i=='e-title')n.title=e.target.value;if(i=='e-body')n.body=e.target.value;if(i=='e-tags')n.tags=e.target.value.split(',').map(x=>x.trim()).filter(Boolean);if(i=='e-task')n.task=e.target.value;n.upd=Date.now();save();
const it=document.querySelector('.nitem.on');if(it&&(i=='e-title'||i=='e-body')){it.innerHTML=`<b>${n.pin?'📌 ':''}${esc(n.title||'Untitled')}</b><small>${esc(n.body)||'Empty note'}</small>`}return}
if(i.startsWith('s-')){const k=i.slice(2),v=e.target.value,s=S.settings;if(k=='name')s.name=v;else if(k=='theme'){s.theme=v;theme()}else{const x=Math.max(1,parseInt(v)||1);s[k]=x;if(!TM.run)TM.left=null}save()}}
document.addEventListener('input',onIn);document.addEventListener('change',e=>{if(e.target.id=='f-st'||e.target.id=='f-pri')onIn(e)});
function render(){const r=location.hash.slice(2)||'dashboard',v=V[r]?r:'dashboard';document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('on',a.dataset.r==v));
$('#main').innerHTML=V[v]();if(v=='tasks')tl();if(v=='notes')nl();tick();window.scrollTo(0,0)}
addEventListener('hashchange',render);theme();render();
