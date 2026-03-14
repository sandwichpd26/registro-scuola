// ════════════════════════════════════════════════════════════════
//  ENGLISH SCHOOL — REGISTRO ELETTRONICO  (versione Supabase)
//
//  SETUP RAPIDO:
//  1. Crea progetto su supabase.com
//  2. Vai su SQL Editor e incolla + esegui il file supabase_setup.sql
//  3. Sostituisci SUPABASE_URL e SUPABASE_ANON_KEY qui sotto
//  4. npm install   (installa anche @supabase/supabase-js)
//  5. npm start
// ════════════════════════════════════════════════════════════════

import { useState, useMemo, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── ⚙️  CONFIGURA QUI ──────────────────────────────────────────────
const SUPABASE_URL  = "https://kckgcwaeqoshyyjlyiur.supabase.co"; // ← sostituisci
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtja2djd2FlcW9zaHl5amx5aXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMwMjQwNjQsImV4cCI6MjA4ODYwMDA2NH0.YdtDNaig_ScfMqh5iQsncP_inQoBdmXlpb-rSO3GsEc";                                // ← sostituisci
// ──────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── HELPERS (identici all'originale) ──────────────────────────────
const uid      = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2,18);
const today    = () => new Date().toISOString().split("T")[0];
const fmtDate  = d => { if(!d)return""; const [y,m,dd]=d.split("-"); return `${dd}/${m}/${y}`; };
const LEVELS   = Array.from({length:50},(_,i)=>i+1);
const DURATIONS= [30,45,60,90,120];
const THEMES = {
  indigo:  {name:"Indigo",     primary:"#6366f1", sidebar:"#312e81"},
  violet:  {name:"Viola",      primary:"#7c3aed", sidebar:"#4c1d95"},
  blue:    {name:"Blu",        primary:"#2563eb", sidebar:"#1e3a8a"},
  teal:    {name:"Verde acqua",primary:"#0d9488", sidebar:"#115e59"},
  green:   {name:"Verde",      primary:"#16a34a", sidebar:"#166534"},
  pink:    {name:"Rosa",       primary:"#ec4899", sidebar:"#831843"},
  rosso:   {name:"Rosso",      primary:"#e11d48", sidebar:"#881337"},
  orange:  {name:"Arancione",  primary:"#ea580c", sidebar:"#7c2d12"},
  slate:   {name:"Grigio",     primary:"#475569", sidebar:"#1e293b"},
};
const T_COLORS = ["#6366f1","#8b5cf6","#a855f7","#d946ef","#ec4899","#ef4444","#e11d48","#f97316","#f59e0b","#eab308","#84cc16","#22c55e","#10b981","#14b8a6","#06b6d4","#0ea5e9","#3b82f6","#0284c7","#0891b2","#059669","#15803d","#65a30d","#ca8a04","#dc2626","#7c3aed","#b45309","#78716c","#64748b","#475569","#1e293b"];

const pkgRemaining = o => Math.max(0,(o?.package_total||0)-(o?.package_used||0));
const pkgColor     = o => { const r=pkgRemaining(o); return r<=0?"#ef4444":r<=3?"#f59e0b":"#10b981"; };

// ── SUPABASE DB LAYER ─────────────────────────────────────────────
// Tutte le chiamate al database sono qui, separate dalla UI.
const db = {
  async getTeachers()  { const {data,error}=await supabase.from("teachers").select("*").order("name"); if(error)throw error; return data||[]; },
  async upsertTeacher(t) { const {data,error}=await supabase.from("teachers").upsert(t).select().single(); if(error)throw error; return data; },
  async deleteTeacher(id){ const {error}=await supabase.from("teachers").delete().eq("id",id); if(error)throw error; },

  async getStudents()  { const {data,error}=await supabase.from("students").select("*").order("name"); if(error)throw error; return data||[]; },
  async upsertStudent(s) { const {data,error}=await supabase.from("students").upsert(s).select().single(); if(error)throw error; return data; },
  async updateStudentField(id,fields) { const {error}=await supabase.from("students").update(fields).eq("id",id); if(error)throw error; },

  async getLessons()   { const {data,error}=await supabase.from("lessons").select("*").order("date",{ascending:false}); if(error)throw error; return data||[]; },
  async upsertLesson(l){ const {data,error}=await supabase.from("lessons").upsert(l).select().single(); if(error)throw error; return data; },
  async deleteLesson(id){ const {error}=await supabase.from("lessons").delete().eq("id",id); if(error)throw error; },

  async getClasses()   { const {data,error}=await supabase.from("classes").select("*").order("name"); if(error)throw error; return data||[]; },
  async upsertClass(c) { const {data,error}=await supabase.from("classes").upsert(c).select().single(); if(error)throw error; return data; },
  async deleteClass(id){ const {error}=await supabase.from("classes").delete().eq("id",id); if(error)throw error; },

  async getClassLessons()  { const {data,error}=await supabase.from("class_lessons").select("*").order("date",{ascending:false}); if(error)throw error; return data||[]; },
  async upsertClassLesson(l){ const {data,error}=await supabase.from("class_lessons").upsert(l).select().single(); if(error)throw error; return data; },
  async deleteClassLesson(id){ const {error}=await supabase.from("class_lessons").delete().eq("id",id); if(error)throw error; },

  async getNotes(userId) { const {data,error}=await supabase.from("notes").select("*").eq("user_id",userId).order("date",{ascending:false}); if(error)throw error; return data||[]; },
  async upsertNote(n)    { const {data,error}=await supabase.from("notes").upsert(n).select().single(); if(error)throw error; return data; },
  async deleteNote(id)   { const {error}=await supabase.from("notes").delete().eq("id",id); if(error)throw error; },
};

// ── APP ROOT ──────────────────────────────────────────────────────
export default function App() {
  const [teachers,setTeachers]         = useState([]);
  const [students,setStudents]         = useState([]);
  const [lessons,setLessons]           = useState([]);
  const [classes,setClasses]           = useState([]);
  const [classLessons,setClassLessons] = useState([]);
  const [notes,setNotes]               = useState([]);
  const [currentUser,setCurrentUser]   = useState(null);
  const [page,setPage]                 = useState("login");
  const [loading,setLoading]           = useState(true);
  const [toast,setToast]               = useState(null);

  const showToast = useCallback((msg, type="ok") => {
    setToast({msg,type});
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Carica insegnanti al primo avvio (serve per il login)
  useEffect(() => {
    db.getTeachers()
      .then(setTeachers)
      .catch(() => showToast("Errore connessione database","err"))
      .finally(() => setLoading(false));
  }, [showToast]);

  // Carica tutto dopo il login
  const loadAll = useCallback(async (user) => {
    setLoading(true);
    try {
      const [st,les,cl,cll,nt] = await Promise.all([
        db.getStudents(),
        db.getLessons(),
        db.getClasses(),
        db.getClassLessons(),
        db.getNotes(user.id),
      ]);
      setStudents(st); setLessons(les); setClasses(cl);
      setClassLessons(cll); setNotes(nt);
    } catch(e) {
      showToast("Errore caricamento dati","err");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Realtime disabilitato — i dati si aggiornano dopo ogni operazione

  const isAdmin          = currentUser?.role==="admin";
  const myStudents       = isAdmin ? students : students.filter(s=>s.teacher_id===currentUser?.id);
  const activeStudents   = myStudents.filter(s=>s.active&&!s.deleted&&!s.is_class_student);
  const allActiveStudents = myStudents.filter(s=>s.active&&!s.deleted);
  const archivedStudents = isAdmin ? students.filter(s=>!s.active&&!s.deleted) : [];
  const trashedStudents  = isAdmin ? students.filter(s=>s.deleted) : [];
  const safePage         = (!isAdmin&&["archive","admin","trash"].includes(page))?"home":page;
  const [profileModal,setProfileModal]=useState(false);
  const [seenHomework,setSeenHomework]=useState(()=>{try{return JSON.parse(localStorage.getItem("seen_homework")||"[]");}catch{return[];}});
  const [reviewHomework,setReviewHomework]=useState(()=>{try{return JSON.parse(localStorage.getItem("review_homework")||"[]");}catch{return[];}});
  const [themeKey,setThemeKey]=useState(()=>localStorage.getItem("app_theme")||"indigo");
  const th=THEMES[themeKey]||THEMES.indigo;
  const changeTheme=(key)=>{setThemeKey(key);localStorage.setItem("app_theme",key);};
  const myClasses        = currentUser?(isAdmin?classes:classes.filter(c=>c.teacher_id===currentUser.id)):[];

  // ── CRUD — ogni operazione aggiorna lo state ottimisticamente
  //    e poi sincronizza con Supabase (se fallisce, ripristina)

  const addTeacher = async t => {
    const obj = {...t, id:uid(), role:"teacher", color:T_COLORS[teachers.filter(x=>x.role==="teacher").length%T_COLORS.length]};
    setTeachers(p=>[...p,obj]);
    try { await db.upsertTeacher(obj); showToast("Insegnante aggiunto"); }
    catch(e) { setTeachers(p=>p.filter(x=>x.id!==obj.id)); showToast("Errore salvataggio","err"); }
  };
  const updateTeacher = async t => {
    setTeachers(p=>p.map(x=>x.id===t.id?t:x));
    try { await db.upsertTeacher(t); showToast("Modifiche salvate"); }
    catch(e) { showToast("Errore salvataggio","err"); }
  };
  const delTeacher = async id => {
    const prev=teachers;
    setTeachers(p=>p.filter(t=>t.id!==id));
    try { await db.deleteTeacher(id); showToast("Insegnante rimosso"); }
    catch(e) { setTeachers(prev); showToast("Errore","err"); }
  };

  const addStudent = async s => {
    const obj={...s,id:uid(),active:true,package_used:s.package_used||0};
    setStudents(p=>[...p,obj]);
    try { await db.upsertStudent(obj); showToast("Studente aggiunto"); }
    catch(e) { setStudents(p=>p.filter(x=>x.id!==obj.id)); showToast("Errore salvataggio","err"); }
  };
  const updateStudent = async s => {
    const prev=students.find(x=>x.id===s.id);
    // Se il pacchetto totale cambia e c'erano lezioni usate, salva storico
    let updatedS=s;
    if(prev&&s.package_total!==prev.package_total&&prev.package_used>0){
      const entry={date:today(),total:prev.package_total,used:prev.package_used,remaining:pkgRemaining(prev)};
      const history=Array.isArray(prev.package_history)?prev.package_history:[];
      updatedS={...s,package_history:[...history,entry]};
    }
    setStudents(p=>p.map(x=>x.id===s.id?updatedS:x));
    try { await db.upsertStudent(updatedS); showToast("Modifiche salvate"); }
    catch(e) { showToast("Errore salvataggio","err"); }
  };
  const archiveStudent = async id => {
    setStudents(p=>p.map(x=>x.id===id?{...x,active:false}:x));
    try { await db.updateStudentField(id,{active:false}); showToast("Studente archiviato"); }
    catch(e) { showToast("Errore","err"); }
  };
  const restoreStudent = async (id,tid) => {
    setStudents(p=>p.map(x=>x.id===id?{...x,active:true,teacher_id:tid}:x));
    try { await db.updateStudentField(id,{active:true,teacher_id:tid}); showToast("Studente ripristinato"); }
    catch(e) { showToast("Errore","err"); }
  };
  const trashStudent = async id => {
    setStudents(p=>p.map(x=>x.id===id?{...x,deleted:true}:x));
    try { await db.updateStudentField(id,{deleted:true,active:false}); showToast("Studente spostato nel cestino"); }
    catch(e) { showToast("Errore","err"); }
  };
  const restoreFromTrash = async (id) => {
    setStudents(p=>p.map(x=>x.id===id?{...x,deleted:false,active:true}:x));
    try { await db.updateStudentField(id,{deleted:false,active:true}); showToast("Studente ripristinato"); }
    catch(e) { showToast("Errore","err"); }
  };
  const deleteForever = async id => {
    const prev=students;
    setStudents(p=>p.filter(x=>x.id!==id));
    try { await supabase.from("students").delete().eq("id",id); showToast("Studente eliminato definitivamente"); }
    catch(e) { setStudents(prev); showToast("Errore","err"); }
  };
  const reassignStudent = async (id,tid) => {
    setStudents(p=>p.map(x=>x.id===id?{...x,teacher_id:tid}:x));
    try { await db.updateStudentField(id,{teacher_id:tid}); showToast("Studente riassegnato"); }
    catch(e) { showToast("Errore","err"); }
  };
  const bump = async (sid,d) => {
    setStudents(p=>p.map(x=>{if(x.id!==sid)return x; return {...x,package_used:Math.max(0,(x.package_used||0)+d)};}));
    const s=students.find(x=>x.id===sid); if(!s)return;
    const newUsed=Math.max(0,(s.package_used||0)+d);
    try { await db.updateStudentField(sid,{package_used:newUsed}); }
    catch(e) { showToast("Errore aggiornamento pacchetto","err"); }
  };

  const addRecurringLessons = async (baseLesson, times) => {
    const groupId = uid();
    const lessons = Array.from({length: times}, (_, i) => {
      const d = new Date(baseLesson.date);
      d.setDate(d.getDate() + i * 7);
      return {...baseLesson, id: uid(), teacher_id: currentUser.id, date: d.toISOString().split("T")[0], recurring_group: groupId};
    });
    setLessons(p=>[...lessons,...p]);
    lessons.forEach(obj=>bump(obj.student_id,1));
    try {
      for(const obj of lessons) await db.upsertLesson(obj);
      showToast(`${times} lezioni registrate ✓`);
    } catch(e) { showToast("Errore salvataggio","err"); }
  };
  const addLesson = async l => {
    const obj={...l,id:uid(),teacher_id:currentUser.id};
    setLessons(p=>[obj,...p]); bump(l.student_id,1);
    try { await db.upsertLesson(obj); showToast("Lezione registrata ✓"); }
    catch(e) { setLessons(p=>p.filter(x=>x.id!==obj.id)); showToast("Errore salvataggio","err"); }
  };
  const addLessonAsAdmin = async l => {
    const obj={...l,id:uid()};
    setLessons(p=>[obj,...p]); bump(l.student_id,1);
    try { await db.upsertLesson(obj); }
    catch(e) { setLessons(p=>p.filter(x=>x.id!==obj.id)); throw e; }
  };
  const updateLesson = async l => {
    setLessons(p=>p.map(x=>x.id===l.id?l:x));
    try { await db.upsertLesson(l); showToast("Lezione aggiornata"); }
    catch(e) { showToast("Errore salvataggio","err"); }
  };
  const deleteLesson = async (id,sid) => {
    const prev=lessons;
    setLessons(p=>p.filter(l=>l.id!==id)); bump(sid,-1);
    try { await db.deleteLesson(id); showToast("Lezione eliminata"); }
    catch(e) { setLessons(prev); showToast("Errore","err"); }
  };

  const bumpC = async (cid,d) => {
    setClasses(p=>p.map(x=>{if(x.id!==cid)return x; return {...x,package_used:Math.max(0,(x.package_used||0)+d)};}));
    const c=classes.find(x=>x.id===cid); if(!c)return;
    const newUsed=Math.max(0,(c.package_used||0)+d);
    try { await db.upsertClass({id:cid,package_used:newUsed}); }
    catch(e) { showToast("Errore aggiornamento pacchetto","err"); }
  };
  const addClass = async c => {
    const obj={...c,id:uid(),teacher_id:currentUser.id,package_used:0};
    setClasses(p=>[...p,obj]);
    try { await db.upsertClass(obj); showToast("Classe creata"); }
    catch(e) { setClasses(p=>p.filter(x=>x.id!==obj.id)); showToast("Errore salvataggio","err"); }
  };
  const updateClass = async c => {
    setClasses(p=>p.map(x=>x.id===c.id?c:x));
    try { await db.upsertClass(c); showToast("Classe aggiornata"); }
    catch(e) { showToast("Errore salvataggio","err"); }
  };
  const deleteClass = async id => {
    const prev=classes;
    setClasses(p=>p.filter(c=>c.id!==id));
    try { await db.deleteClass(id); showToast("Classe eliminata"); }
    catch(e) { setClasses(prev); showToast("Errore","err"); }
  };
  const addClassLesson = async l => {
    const obj={...l,id:uid(),teacher_id:currentUser.id};
    setClassLessons(p=>[obj,...p]); bumpC(l.class_id,1);
    try { await db.upsertClassLesson(obj); showToast("Lezione registrata ✓"); }
    catch(e) { setClassLessons(p=>p.filter(x=>x.id!==obj.id)); showToast("Errore salvataggio","err"); }
  };
  const updateClassLesson = async l => {
    setClassLessons(p=>p.map(x=>x.id===l.id?l:x));
    try { await db.upsertClassLesson(l); showToast("Lezione aggiornata"); }
    catch(e) { showToast("Errore salvataggio","err"); }
  };
  const deleteClassLesson = async (id,cid) => {
    const prev=classLessons;
    setClassLessons(p=>p.filter(l=>l.id!==id)); bumpC(cid,-1);
    try { await db.deleteClassLesson(id); showToast("Lezione eliminata"); }
    catch(e) { setClassLessons(prev); showToast("Errore","err"); }
  };
  const addNote    = async n => { const obj={...n,id:uid(),user_id:currentUser.id}; setNotes(p=>[...p,obj]); try{await db.upsertNote(obj);}catch(e){setNotes(p=>p.filter(x=>x.id!==obj.id));showToast("Errore","err");} };
  const updateNote = async n => { setNotes(p=>p.map(x=>x.id===n.id?n:x)); try{await db.upsertNote(n);}catch(e){showToast("Errore","err");} };
  const deleteNote = async id=> { setNotes(p=>p.filter(n=>n.id!==id)); try{await db.deleteNote(id);}catch(e){showToast("Errore","err");} };

  // Schermata di caricamento iniziale
  if (loading && !currentUser) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",background:"#f8fafc",gap:16}}>
      <div style={{fontSize:48}}>🎓</div>
      <div style={{width:40,height:40,borderRadius:"50%",border:"3px solid #f1f5f9",borderTopColor:"#6366f1",animation:"spin 0.8s linear infinite"}}/>
      <div style={{color:"#6b7280",fontSize:14}}>Connessione al database…</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (!currentUser) return (
    <LoginScreen
      teachers={teachers}
      onLogin={async u => { setCurrentUser(u); setPage("home"); await loadAll(u); }}
    />
  );

  const myClassLessons = isAdmin?classLessons:classLessons.filter(l=>l.teacher_id===currentUser.id);
  const alertCount = [...activeStudents,...myClasses].filter(x=>pkgRemaining(x)<=3&&x.package_total>0).length;
  const myNotes = notes.filter(n=>n.user_id===currentUser.id);

  const pages = {
    home:     <HomePage     user={currentUser} students={myStudents} lessons={lessons} classLessons={classLessons} classes={myClasses} teachers={teachers} setPage={setPage} isAdmin={isAdmin} seenHomework={seenHomework} setSeenHomework={setSeenHomework} reviewHomework={reviewHomework} setReviewHomework={setReviewHomework}/>,
    students: <StudentsPage user={currentUser} students={allActiveStudents} classes={myClasses} teachers={teachers} lessons={lessons} classLessons={classLessons} isAdmin={isAdmin} onAdd={addStudent} onUpdate={updateStudent} onArchive={archiveStudent} onTrash={trashStudent}/>,
    lessons:  <LessonsPage  user={currentUser} students={activeStudents} lessons={lessons} teachers={teachers} isAdmin={isAdmin} onAdd={addLesson} onAddRecurring={addRecurringLessons} onUpdate={updateLesson} onDelete={deleteLesson}/>,
    classes:  <ClassesPage  user={currentUser} students={allActiveStudents} classes={myClasses} classLessons={myClassLessons} teachers={teachers} isAdmin={isAdmin} onAddClass={addClass} onUpdateClass={updateClass} onDeleteClass={deleteClass} onAddClassLesson={addClassLesson} onUpdateClassLesson={updateClassLesson} onDeleteClassLesson={deleteClassLesson}/>,
    calendar: <CalendarPage user={currentUser} students={myStudents} lessons={lessons} classLessons={classLessons} classes={myClasses} teachers={teachers} isAdmin={isAdmin} notes={myNotes} onAddNote={addNote} onUpdateNote={updateNote} onDeleteNote={deleteNote} onImportLesson={addLessonAsAdmin} allStudents={students} allTeachers={teachers}/>,
    reports:  <ReportsPage  user={currentUser} students={isAdmin?students:activeStudents} classes={myClasses} lessons={lessons} classLessons={classLessons} teachers={teachers} isAdmin={isAdmin}/>,
    report_s: <StudentReportPage user={currentUser} students={myStudents.filter(s=>s.active&&!s.deleted)} lessons={lessons} isAdmin={isAdmin}/>,
    archive:  isAdmin?<ArchivePage students={archivedStudents} teachers={teachers} lessons={lessons} onRestore={restoreStudent} onTrash={trashStudent}/>:null,
    trash:    isAdmin?<TrashPage students={trashedStudents} onRestore={restoreFromTrash} onDeleteForever={deleteForever}/>:null,
    admin:    isAdmin?<AdminPage   teachers={teachers} students={students} lessons={lessons} classLessons={classLessons} onAddTeacher={addTeacher} onDeleteTeacher={delTeacher} onUpdateTeacher={updateTeacher} onReassignStudent={reassignStudent}/>:null,
  };

  return (
    <div style={S.app}><style>{CSS}</style>
      {/* Barra di caricamento in cima durante operazioni */}
      {loading && <div style={S.loadingBar}><div style={S.loadingBarFill}/></div>}
      {/* Toast notifiche */}
      {toast && <Toast msg={toast.msg} type={toast.type}/>}
      <Sidebar user={currentUser} page={safePage} setPage={setPage} isAdmin={isAdmin}
        onLogout={()=>{
          setCurrentUser(null); setPage("login");
          setStudents([]); setLessons([]); setClasses([]); setClassLessons([]); setNotes([]);
        }}
        archivedCount={0} trashedCount={isAdmin?trashedStudents.length:0} alertCount={alertCount} onProfile={()=>setProfileModal(true)} theme={th} themeKey={themeKey} onChangeTheme={changeTheme}
      />
      <main style={S.main}><div className="page-anim" key={safePage}>{pages[safePage]||pages.home}</div></main>
      {profileModal&&<ProfileModal user={currentUser} themeKey={themeKey} onChangeTheme={changeTheme} onSave={async(pw)=>{try{await db.upsertTeacher({id:currentUser.id,password:pw});showToast("Password aggiornata");}catch(e){showToast("Errore","err");}setProfileModal(false);}} onClose={()=>setProfileModal(false)}/>}
    </div>
  );
}

function ProfileModal({user,themeKey,onChangeTheme,onSave,onClose}) {
  const [pw,setPw]=useState("");const [pw2,setPw2]=useState("");const [err,setErr]=useState("");
  const save=()=>{if(pw.length<4){setErr("Minimo 4 caratteri");return;}if(pw!==pw2){setErr("Le password non coincidono");return;}onSave(pw);};
  return (<Overlay onClose={onClose}><h2 style={S.modalTitle}>👤 Il tuo profilo</h2>
    <div style={{background:"#f0fdf4",borderRadius:10,padding:"12px 16px",marginBottom:16,fontSize:14}}><strong>{user.name}</strong><br/><span style={{color:"#6b7280"}}>{user.email}</span></div>
    {onChangeTheme&&<div style={{marginBottom:20}}>
      <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#374151"}}>🎨 Tema colore</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:10}}>
        {Object.entries(THEMES).map(([key,t])=>(
          <button key={key} onClick={()=>onChangeTheme(key)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 14px",borderRadius:10,border:themeKey===key?"2px solid #0f172a":"2px solid #e2e8f0",background:themeKey===key?"#f8fafc":"white",cursor:"pointer",fontSize:13,fontWeight:themeKey===key?700:400}}>
            <span style={{width:16,height:16,borderRadius:"50%",background:t.primary,display:"inline-block",flexShrink:0}}/>
            {t.name}
          </button>
        ))}
      </div>
    </div>}
    <div style={{fontWeight:700,fontSize:14,marginBottom:12,color:"#374151"}}>🔒 Cambia password</div>
    {err&&<div style={S.error}>{err}</div>}
    <div style={S.field}><label style={S.label}>Nuova password</label><input type="password" style={S.input} value={pw} onChange={e=>{setPw(e.target.value);setErr("");}}/></div>
    <div style={S.field}><label style={S.label}>Conferma password</label><input type="password" style={S.input} value={pw2} onChange={e=>{setPw2(e.target.value);setErr("");}}/></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!pw} onClick={save}>Aggiorna Password</button></div>
  </Overlay>);
}

// ── TOAST ─────────────────────────────────────────────────────────
function Toast({msg,type}) {
  const bg    = type==="err"?"#fee2e2":type==="warn"?"#fef3c7":"#d1fae5";
  const color = type==="err"?"#991b1b":type==="warn"?"#92400e":"#065f46";
  const icon  = type==="err"?"❌":type==="warn"?"⚠️":"✅";
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:9999,background:bg,color,borderRadius:12,
      padding:"12px 20px",fontWeight:600,fontSize:14,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",
      display:"flex",alignItems:"center",gap:8,animation:"slideUp 0.2s ease"}}>
      {icon} {msg}
    </div>
  );
}

// ── LOGIN — identico all'originale ma onLogin è async ─────────────
function LoginScreen({teachers,onLogin}) {
  const [email,setEmail]=useState(""); const [pass,setPass]=useState(""); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const go = async () => {
    setBusy(true); setErr("");
    const u=teachers?.find(t=>t.email===email&&t.password===pass);
    if(u) { await onLogin(u); }
    else  { setErr("Email o password non corretti"); setBusy(false); }
  };
  return (<div style={S.loginBg}><div style={S.loginCard}>
    <div style={S.loginLogo}>🎓</div>
    <h1 style={S.loginTitle}>Sandwich Institute</h1>
    <p style={S.loginSub}>Registro Elettronico</p>
    <div style={S.field}><label style={S.label}>Email</label>
      <input style={S.input} type="email" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()} autoFocus/>
    </div>
    <div style={S.field}><label style={S.label}>Password</label>
      <input style={S.input} type="password" value={pass} onChange={e=>{setPass(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&go()}/>
    </div>
    {err&&<div style={S.error}>{err}</div>}
    <button style={{...S.btnPrimary,opacity:busy?0.7:1}} disabled={busy} onClick={go}>
      {busy?"Accesso in corso…":"Accedi"}
    </button>
  </div></div>);
}

// ── SIDEBAR — identica all'originale ─────────────────────────────
function Sidebar({user,page,setPage,isAdmin,onLogout,onProfile,archivedCount,trashedCount,alertCount,theme,themeKey,onChangeTheme}) {
  const items=[{id:"home",icon:"🏠",label:"Dashboard"},{id:"students",icon:"👤",label:"Studenti & Classi"},{id:"lessons",icon:"📚",label:"Lezioni Individuali"},{id:"classes",icon:"👥",label:"Lezioni di Classe"},{id:"calendar",icon:"📅",label:"Calendario"},{id:"reports",icon:"📊",label:"Report",badge:alertCount>0?`⚠️ ${alertCount}`:null,warn:true},{id:"report_s",icon:"📋",label:"Report Studenti"},...(isAdmin?[{id:"archive",icon:"🗄️",label:"Archivio",badge:archivedCount>0?archivedCount:null},{id:"trash",icon:"🗑️",label:"Cestino",badge:trashedCount>0?trashedCount:null},{id:"admin",icon:"⚙️",label:"Amministrazione"}]:[])];
  const sb=theme?.sidebar||"#0f172a";const sbBorder=`1px solid rgba(255,255,255,0.08)`;
  return (<aside style={{...S.sidebar,background:sb}}>
    <div style={{...S.sidebarTop,borderBottom:sbBorder}}><div style={S.sidebarLogo}>🎓</div><div><div style={S.sidebarBrand}>Sandwich Institute</div><div style={{color:"rgba(255,255,255,0.4)",fontSize:10}}>Registro</div></div></div>
    <nav style={{...S.nav,background:"transparent"}}>{items.map(item=>(<button key={item.id} className="nav-item" style={{...S.navItem,color:"rgba(255,255,255,0.6)",...(page===item.id?{...S.navItemActive,background:theme?.primary||"#6366f1",color:"white"}:{})}} onClick={()=>setPage(item.id)}><span style={S.navIcon}>{item.icon}</span><span style={{flex:1}}>{item.label}</span>{item.badge&&<span style={{...S.badge,...(item.warn?{background:"rgba(239,68,68,0.2)",color:"#fca5a5"}:{})}}>{item.badge}</span>}</button>))}</nav>
    <div style={{...S.sidebarBottom,borderTop:sbBorder}}><div style={{...S.userChip,cursor:"pointer"}} onClick={onProfile}><div style={{...S.avatar,background:theme?.primary||"#6366f1"}}>{user.name[0]}</div><div><div style={S.userName}>{user.name}</div><div style={{...S.userRole,color:"rgba(255,255,255,0.4)"}}>{user.role==="admin"?"Amministratore":"Insegnante"}</div></div></div><button style={{...S.logoutBtn,border:`1px solid rgba(255,255,255,0.1)`,color:"rgba(255,255,255,0.5)",marginBottom:4}} onClick={onProfile}>👤 Profilo</button><button style={{...S.logoutBtn,border:`1px solid rgba(255,255,255,0.1)`,color:"rgba(255,255,255,0.5)"}} onClick={onLogout}>Esci →</button></div>
  </aside>);
}

// ── HOME PAGE — identica all'originale ───────────────────────────
function HomePage({user,students,lessons,classLessons,classes,teachers,setPage,isAdmin,seenHomework,setSeenHomework,reviewHomework,setReviewHomework}) {
  const [dashFilter,setDashFilter]=useState("today");const [dashDetail,setDashDetail]=useState(null);const [hwPanel,setHwPanel]=useState(false);
  const active=students.filter(s=>s.active);
  const allHomework=useMemo(()=>lessons.filter(l=>l.homework&&l.homework.trim()!==""),[lessons]);
  const unseenHw=useMemo(()=>allHomework.filter(l=>!seenHomework.includes(l.id)||reviewHomework.includes(l.id)),[allHomework,seenHomework,reviewHomework]);
  const markAllSeen=()=>{
    const ids=unseenHw.map(l=>l.id);
    const newSeen=[...new Set([...seenHomework,...ids])];
    const newReview=reviewHomework.filter(id=>!ids.includes(id));
    setSeenHomework(newSeen);setReviewHomework(newReview);
    try{localStorage.setItem("seen_homework",JSON.stringify(newSeen));localStorage.setItem("review_homework",JSON.stringify(newReview));}catch{}
  };
  const markReview=(id)=>{
    const newReview=[...new Set([...reviewHomework,id])];
    setReviewHomework(newReview);
    try{localStorage.setItem("review_homework",JSON.stringify(newReview));}catch{}
  };
  const openHwPanel=()=>{setHwPanel(true);markAllSeen();};
  const myL=isAdmin?lessons:lessons.filter(l=>l.teacher_id===user.id);
  const todayStr=today();
  const weekStart=useMemo(()=>{const d=new Date();d.setHours(0,0,0,0);const day=d.getDay();d.setDate(d.getDate()-(day===0?6:day-1));return d.toISOString().split("T")[0];},[]);
  const weekEnd=useMemo(()=>{const d=new Date();d.setHours(0,0,0,0);const day=d.getDay();d.setDate(d.getDate()+(day===0?0:7-day));return d.toISOString().split("T")[0];},[]);
  const filteredStudents=useMemo(()=>{
    if(!isAdmin||dashFilter==="all")return active;
    const relL=dashFilter==="today"?[...lessons.filter(l=>l.date===todayStr),...classLessons.filter(l=>l.date===todayStr)]:[...lessons.filter(l=>l.date>=weekStart&&l.date<=weekEnd),...classLessons.filter(l=>l.date>=weekStart&&l.date<=weekEnd)];
    const sids=new Set();relL.forEach(l=>{if(l.student_id)sids.add(l.student_id);if(l.attendances)Object.keys(l.attendances).forEach(id=>sids.add(id));});
    return active.filter(s=>sids.has(s.id));
  },[dashFilter,active,lessons,classLessons,todayStr,weekStart,weekEnd,isAdmin]);
  const todayIndiv=(isAdmin?lessons:lessons.filter(l=>l.teacher_id===user.id)).filter(l=>l.date===todayStr).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const todayClass=(isAdmin?classLessons:classLessons.filter(l=>l.teacher_id===user.id)).filter(l=>l.date===todayStr).sort((a,b)=>(a.time||"").localeCompare(b.time||""));
  const lowS=active.filter(s=>pkgRemaining(s)<=3&&s.package_total>0);
  const lowC=classes.filter(c=>pkgRemaining(c)<=3&&c.package_total>0);
  const thisWeek=myL.filter(l=>l.date>=weekStart&&l.date<=weekEnd);
  return (<div style={S.page}>
    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:4}}>
      <div><h1 style={S.pageTitle}>Ciao, {user.name.split(" ")[0]}! 👋</h1>
      <p style={{...S.pageSub,margin:0}}>{new Date().toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p></div>
      {isAdmin&&<button onClick={openHwPanel} style={{position:"relative",background:"white",border:"1px solid #e2e8f0",borderRadius:14,padding:"10px 18px",cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:600,color:"#374151",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        📝 Compiti assegnati
        {unseenHw.length>0&&<span style={{background:"#ef4444",color:"white",borderRadius:"50%",width:20,height:20,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700}}>{unseenHw.length}</span>}
      </button>}
    </div>
    <div style={S.statsGrid}>{[{label:"Studenti Attivi",value:active.length,icon:"👤",color:"#10b981",action:()=>setPage("students")},{label:"Lezioni (sett.)",value:thisWeek.length,icon:"📚",color:"#6366f1",action:()=>setPage("lessons")},{label:"Classi",value:classes.length,icon:"👥",color:"#f59e0b",action:()=>setPage("classes")},{label:"Pacchetti in scadenza",value:lowS.length+lowC.length,icon:"⚠️",color:"#ef4444",action:()=>setPage("reports")}].map((s,i)=>(
      <div key={i} style={{...S.statCard,cursor:"pointer"}} onClick={s.action}><div style={{...S.statIcon,background:s.color+"20",color:s.color}}>{s.icon}</div><div style={S.statValue}>{s.value}</div><div style={S.statLabel}>{s.label}</div></div>
    ))}</div>
    {isAdmin&&(<div style={{...S.card,marginBottom:24}}>
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14,flexWrap:"wrap"}}>
        <h2 style={{...S.sectionTitle,margin:0}}>👤 Studenti con lezioni</h2>
        <div style={{display:"flex",gap:6}}>{[["today","Oggi"],["week","Questa settimana"],["all","Tutti iscritti"]].map(([v,l])=>(<button key={v} onClick={()=>setDashFilter(v)} style={{padding:"5px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:dashFilter===v?"#6366f1":"#f1f5f9",color:dashFilter===v?"white":"#374151"}}>{l}</button>))}</div>
        <span style={{fontSize:12,color:"#9ca3af",marginLeft:"auto"}}>{filteredStudents.length} studenti</span>
      </div>
      {filteredStudents.length===0?<div style={S.emptySmall}>Nessuno studente per il filtro selezionato</div>:
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{filteredStudents.map(s=>{const t=teachers.find(x=>x.id===s.teacher_id);return(<div key={s.id} style={{background:"#f8fafc",borderRadius:12,padding:"10px 14px",border:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}><div style={{...S.studentAvatar,width:32,height:32,fontSize:12}}>{s.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.name}</div><div style={{fontSize:11,color:"#9ca3af"}}>{t?.name||"—"}</div></div><PkgBar used={s.package_used} total={s.package_total}/><button style={{...S.btnSm,marginLeft:4,padding:"3px 10px",fontSize:11}} onClick={()=>setDashDetail(s)}>Dettagli</button></div>);})}</div>
      }
    </div>)}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,marginBottom:32}}>
      <div style={S.card}>
        <h2 style={S.sectionTitle}>📋 Lezioni di oggi</h2>
        {todayIndiv.length===0&&todayClass.length===0?<div style={S.emptySmall}>Nessuna lezione programmata</div>:<>
          {todayIndiv.map(l=>{const st=students.find(s=>s.id===l.student_id);const idx=lessons.filter(x=>x.student_id===l.student_id).sort((a,b)=>a.date.localeCompare(b.date)).findIndex(x=>x.id===l.id)+1;return(<div key={l.id} style={S.todayItem}><span style={S.timeBadge}>{l.time}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{st?.name||"—"}</div><div style={{fontSize:11,color:"#6b7280"}}>{l.topic} · {l.duration}min</div></div><ModeBadge mode={l.mode}/><LessonCounter current={idx} total={st?.package_total||0}/></div>);})}
          {todayClass.map(l=>{const cls=classes.find(c=>c.id===l.class_id);const idx=classLessons.filter(x=>x.class_id===l.class_id).sort((a,b)=>a.date.localeCompare(b.date)).findIndex(x=>x.id===l.id)+1;return(<div key={l.id} style={{...S.todayItem,borderLeft:"3px solid #f59e0b"}}><span style={S.timeBadge}>{l.time}</span><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{cls?.name||"—"} 👥</div><div style={{fontSize:11,color:"#6b7280"}}>{l.topic} · {l.duration}min</div></div><ModeBadge mode={l.mode}/><LessonCounter current={idx} total={cls?.package_total||0}/></div>);})}
        </>}
      </div>
      <div style={S.card}>
        <h2 style={S.sectionTitle}>⚠️ Pacchetti in scadenza</h2>
        {lowS.length===0&&lowC.length===0?<div style={S.emptySmall}>✅ Tutti i pacchetti sono regolari</div>:<>
          {lowS.map(s=><div key={s.id} style={S.alertItem}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{s.name}</div><div style={{fontSize:11,color:"#6b7280"}}>Studente</div></div><PkgBar used={s.package_used} total={s.package_total}/></div>)}
          {lowC.map(c=><div key={c.id} style={S.alertItem}><div style={{flex:1}}><div style={{fontWeight:600,fontSize:13}}>{c.name} 👥</div><div style={{fontSize:11,color:"#6b7280"}}>Classe</div></div><PkgBar used={c.package_used} total={c.package_total}/></div>)}
        </>}
      </div>
    </div>
    <div style={S.section}><h2 style={S.sectionTitle}>Prossime lezioni</h2>
      <div style={S.tableWrap}><table style={S.table}><thead><tr><th style={S.th}>N°</th><th style={S.th}>Data</th><th style={S.th}>Ora</th><th style={S.th}>Studente</th><th style={S.th}>Argomento</th><th style={S.th}>Modalità</th><th style={S.th}>Presenza</th></tr></thead>
        <tbody>{[...myL].filter(l=>l.date>=todayStr).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5).map(l=>{const st=students.find(s=>s.id===l.student_id);const idx=lessons.filter(x=>x.student_id===l.student_id).sort((a,b)=>a.date.localeCompare(b.date)).findIndex(x=>x.id===l.id)+1;return(<tr key={l.id} style={S.tr}><td style={S.td}><LessonCounter current={idx} total={st?.package_total||0}/></td><td style={S.td}>{fmtDate(l.date)}</td><td style={S.td}><span style={S.timeBadge}>{l.time}</span></td><td style={S.td}><strong>{st?.name||"—"}</strong></td><td style={{...S.td,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.topic}</td><td style={S.td}><ModeBadge mode={l.mode}/></td><td style={S.td}><Pill ok={l.present}/></td></tr>);})}</tbody>
      </table></div>
    </div>
    {dashDetail&&<StudentDetailModal student={dashDetail} lessons={lessons.filter(l=>l.student_id===dashDetail.id)} onClose={()=>setDashDetail(null)}/>}
    {hwPanel&&isAdmin&&<HomeworkPanel lessons={unseenHw} students={students} teachers={teachers} onMarkReview={markReview} onClose={()=>setHwPanel(false)}/>}
  </div>);
}

function HomeworkPanel({lessons,students,teachers,onMarkReview,onClose}) {
  const sorted=[...lessons].sort((a,b)=>b.date.localeCompare(a.date));
  return (<Overlay onClose={onClose} wide>
    <h2 style={S.modalTitle}>📝 Compiti assegnati</h2>
    {sorted.length===0
      ? <div style={{textAlign:"center",padding:"40px 0",color:"#9ca3af"}}><div style={{fontSize:36,marginBottom:8}}>✅</div><div>Nessun compito da vedere</div></div>
      : <div style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"60vh",overflowY:"auto"}}>
          {sorted.map(l=>{
            const st=students.find(s=>s.id===l.student_id);
            const t=teachers.find(t=>t.id===l.teacher_id);
            return(<div key={l.id} style={{background:"#fffbeb",borderRadius:12,padding:"14px 16px",border:"1px solid #fde68a",display:"flex",gap:12,alignItems:"flex-start"}}>
              <div style={{fontSize:24}}>📝</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:14,marginBottom:2}}>{st?.name||"—"}</div>
                <div style={{fontSize:13,color:"#374151",marginBottom:4}}>{l.homework}</div>
                <div style={{fontSize:11,color:"#9ca3af",display:"flex",gap:10}}>
                  <span>📅 {fmtDate(l.date)}</span>
                  <span>🎓 {t?.name||"—"}</span>
                  {l.topic&&<span>📖 {l.topic}</span>}
                </div>
              </div>
              <button onClick={()=>onMarkReview(l.id)} style={{flexShrink:0,background:"#fef3c7",border:"1px solid #fcd34d",borderRadius:8,padding:"5px 10px",fontSize:12,fontWeight:600,color:"#92400e",cursor:"pointer",whiteSpace:"nowrap"}}>⭐ Da rivedere</button>
            </div>);
          })}
        </div>
    }
    <div style={{marginTop:16,textAlign:"right"}}><button style={S.btnSecondary} onClick={onClose}>Chiudi</button></div>
  </Overlay>);
}

// ── STUDENTI & CLASSI — identica all'originale ────────────────────
function StudentsPage({user,students,classes,teachers,lessons,classLessons,isAdmin,onAdd,onUpdate,onArchive,onTrash}) {
  const [tab,setTab]=useState("students");const [search,setSearch]=useState("");const [detailStudent,setDS]=useState(null);const [detailClass,setDC]=useState(null);const [editModal,setEdit]=useState(null);const [confirm,setConfirm]=useState(null);const [confirmTrash,setConfirmTrash]=useState(null);
  const fS=students.filter(s=>s.name.toLowerCase().includes(search.toLowerCase())||String(s.level).includes(search));
  const fC=classes.filter(c=>c.name.toLowerCase().includes(search.toLowerCase()));
  return (<div style={S.page}>
    <div style={S.pageHeader}><div><h1 style={S.pageTitle}>Studenti & Classi</h1><p style={S.pageSub}>{students.length} studenti · {classes.length} classi</p></div>{isAdmin&&<button style={{...S.btnPrimary,width:"auto"}} onClick={()=>setEdit("add")}>+ Nuovo Studente</button>}</div>
    {!isAdmin&&<div style={{background:"#fef3c7",border:"1px solid #fbbf24",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#92400e"}}>ℹ️ Solo l'amministratore può aggiungere nuovi studenti.</div>}
    <div style={{display:"flex",gap:8,marginBottom:16}}>{[["students","👤 Studenti Individuali"],["classes","👥 Classi"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,background:tab===id?"#6366f1":"#f1f5f9",color:tab===id?"white":"#374151"}}>{label}</button>))}</div>
    <input style={{...S.input,marginBottom:20,maxWidth:320}} placeholder="🔍  Cerca…" value={search} onChange={e=>setSearch(e.target.value)}/>
    {tab==="students"&&(fS.length===0?<Empty text="Nessuno studente trovato"/>:(<div style={S.cardGrid}>{fS.map(student=>{
      const sl=lessons.filter(l=>l.student_id===student.id);const lastL=[...sl].sort((a,b)=>b.date.localeCompare(a.date))[0];const teacher=teachers.find(t=>t.id===student.teacher_id);const rem=pkgRemaining(student);
      return(<div key={student.id} style={{...S.studentCard,borderTop:`3px solid ${pkgColor(student)}`}}>
        <div style={S.cardTop}><div style={S.studentAvatar}>{student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={S.studentName}>{student.name}</div><div style={S.studentMeta}>{teacher?.name||"—"}</div></div><LevelBadge level={student.level}/></div>
        <div style={{marginBottom:10,fontSize:12,color:"#6b7280",display:"flex",gap:12,flexWrap:"wrap"}}>{student.phone&&<span>📞 {student.phone}</span>}{student.email&&<span>✉️ {student.email}</span>}</div>
        <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#6b7280"}}>Pacchetto</span><span style={{fontWeight:700,color:pkgColor(student)}}>{student.package_used}/{student.package_total} · <span style={{color:rem<=3?"#ef4444":"#10b981"}}>{rem} rimaste</span></span></div><div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(student.package_used/student.package_total)*100)}%`,background:pkgColor(student),borderRadius:3}}/></div></div>
        <div style={S.cardStats}><div style={S.miniStat}><span style={S.miniStatVal}>{sl.length}</span><span style={S.miniStatLbl}>lezioni</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{lastL?fmtDate(lastL.date):"—"}</span><span style={S.miniStatLbl}>ultima</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{lastL?.time||"—"}</span><span style={S.miniStatLbl}>orario</span></div></div>
        {student.notes&&<div style={S.cardNotes}>📝 {student.notes}</div>}
        <div style={S.cardActions}><button style={S.btnSm} onClick={()=>setDS(student)}>Scheda</button>{isAdmin&&<button style={S.btnSm} onClick={()=>setEdit(student)}>Modifica</button>}{isAdmin&&<button style={{...S.btnSm,...S.btnDanger}} onClick={()=>setConfirm(student.id)}>Archivia</button>}{isAdmin&&<button style={{...S.btnSm,background:"#fee2e220",color:"#dc2626",border:"1px solid #fca5a5"}} onClick={()=>setConfirmTrash(student.id)}>🗑️ Cestino</button>}</div>
      </div>);
    })}</div>))}
    {tab==="classes"&&(fC.length===0?<Empty text="Nessuna classe trovata"/>:(<div style={S.cardGrid}>{fC.map(cls=>{
      const clsS=students.filter(s=>(cls.student_ids||[]).includes(s.id));const clsL=classLessons.filter(l=>l.class_id===cls.id);const lastL=[...clsL].sort((a,b)=>b.date.localeCompare(a.date))[0];const teacher=teachers.find(t=>t.id===cls.teacher_id);const rem=pkgRemaining(cls);
      return(<div key={cls.id} style={{...S.studentCard,borderTop:`3px solid ${pkgColor(cls)}`}}>
        <div style={S.cardTop}><div style={{...S.studentAvatar,background:"#f59e0b20",color:"#f59e0b",fontSize:20}}>👥</div><div style={{flex:1}}><div style={S.studentName}>{cls.name}</div><div style={S.studentMeta}>{teacher?.name||"—"} · {cls.schedule}{cls.company&&<span style={{marginLeft:6,background:"#e0f2fe",color:"#0369a1",borderRadius:6,padding:"1px 6px",fontSize:11}}>🏢 {cls.company}</span>}</div></div></div>
        <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#6b7280"}}>Pacchetto</span><span style={{fontWeight:700,color:pkgColor(cls)}}>{cls.package_used}/{cls.package_total} · <span style={{color:rem<=3?"#ef4444":"#10b981"}}>{rem} rimaste</span></span></div><div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(cls.package_used/cls.package_total)*100)}%`,background:pkgColor(cls),borderRadius:3}}/></div></div>
        <div style={S.cardStats}><div style={S.miniStat}><span style={S.miniStatVal}>{clsS.length}</span><span style={S.miniStatLbl}>studenti</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{clsL.length}/{cls.package_total}</span><span style={S.miniStatLbl}>lezioni</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{lastL?fmtDate(lastL.date):"—"}</span><span style={S.miniStatLbl}>ultima</span></div></div>
        <div style={{marginBottom:10,display:"flex",flexWrap:"wrap",gap:4}}>{clsS.map(s=><span key={s.id} style={{fontSize:11,background:"#f1f5f9",borderRadius:6,padding:"2px 8px"}}>{s.name.split(" ")[0]}</span>)}</div>
        <div style={S.cardActions}><button style={S.btnSm} onClick={()=>setDC(cls)}>Scheda</button></div>
      </div>);
    })}</div>))}
    {editModal&&isAdmin&&<StudentModal user={user} teachers={teachers} student={editModal==="add"?null:editModal} onSave={s=>{editModal==="add"?onAdd(s):onUpdate(s);setEdit(null);}} onClose={()=>setEdit(null)}/>}
    {confirm&&<ConfirmModal title="Archivia studente" text="Verrà spostato nell'archivio." onConfirm={()=>{onArchive(confirm);setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    {confirmTrash&&<ConfirmModal title="Elimina studente" text="Lo studente andrà nel cestino. Potrai recuperarlo o eliminarlo definitivamente." onConfirm={()=>{onTrash(confirmTrash);setConfirmTrash(null);}} onClose={()=>setConfirmTrash(null)}/>}
    {detailStudent&&<StudentDetailModal student={detailStudent} lessons={lessons.filter(l=>l.student_id===detailStudent.id)} onClose={()=>setDS(null)}/>}
    {detailClass&&<ClassDetailModal cls={detailClass} students={students.filter(s=>(detailClass.student_ids||[]).includes(s.id))} classLessons={classLessons.filter(l=>l.class_id===detailClass.id)} onClose={()=>setDC(null)}/>}
  </div>);
}

function StudentModal({user,teachers,student,onSave,onClose}) {
  const [form,setForm]=useState(student||{name:"",level:1,teacher_id:user.role==="admin"?"":user.id,phone:"",email:"",company:"",notes:"",package_total:10,package_used:0,is_class_student:false});
  const [newPkg,setNewPkg]=useState(false);
  const [newPkgTotal,setNewPkgTotal]=useState(student?.package_total||10);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const handleSave=()=>{
    if(newPkg&&student){
      const entry={date:today(),total:form.package_total,used:form.package_used,remaining:pkgRemaining(form)};
      const history=Array.isArray(form.package_history)?form.package_history:[];
      onSave({...form,package_total:newPkgTotal,package_used:0,package_history:[...history,entry]});
    } else {
      onSave(form);
    }
  };
  return (<Overlay onClose={onClose}>
    <h2 style={S.modalTitle}>{student?"Modifica Studente":"Nuovo Studente"}</h2>
    <div style={S.field}><label style={S.label}>Nome completo *</label><input style={S.input} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Es. Mario Rossi"/></div>
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Livello (1–50)</label><select style={S.input} value={form.level} onChange={e=>set("level",Number(e.target.value))}>{LEVELS.map(l=><option key={l} value={l}>Livello {l}</option>)}</select></div><div style={S.field}><label style={S.label}>Telefono</label><input style={S.input} value={form.phone||""} onChange={e=>set("phone",e.target.value)} placeholder="333-0000000"/></div></div>
    <div style={S.field}><label style={S.label}>Email</label><input style={S.input} type="email" value={form.email||""} onChange={e=>set("email",e.target.value)} placeholder="studente@email.it"/></div>
    <div style={S.field}><label style={S.label}>Azienda</label><input style={S.input} value={form.company||""} onChange={e=>set("company",e.target.value)} placeholder="Es. Acme Srl (opzionale)"/></div>
    {user.role==="admin"&&<div style={{background:"#f0f9ff",borderRadius:10,padding:"10px 14px",marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:13,fontWeight:600,color:"#0369a1"}}><input type="checkbox" checked={form.is_class_student||false} onChange={e=>set("is_class_student",e.target.checked)}/> 👥 Studente di classe aziendale (non compare nelle lezioni individuali)</label></div>}
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Lezioni pacchetto</label><input type="number" min="1" style={S.input} value={form.package_total||10} onChange={e=>set("package_total",Number(e.target.value))}/></div><div style={S.field}><label style={S.label}>Già usate</label><input type="number" min="0" style={S.input} value={form.package_used||0} onChange={e=>set("package_used",Number(e.target.value))}/></div></div>
    {student&&<div style={{background:newPkg?"#f0fdf4":"#f8fafc",border:`1.5px solid ${newPkg?"#10b981":"#e2e8f0"}`,borderRadius:12,padding:"14px 16px",marginBottom:14}}>
      <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontWeight:600,fontSize:13,color:newPkg?"#065f46":"#374151",marginBottom:newPkg?12:0}}>
        <input type="checkbox" checked={newPkg} onChange={e=>setNewPkg(e.target.checked)}/> 🔄 Nuovo pacchetto (salva quello attuale nello storico)
      </label>
      {newPkg&&<div style={{display:"flex",alignItems:"center",gap:10,marginTop:4}}>
        <label style={{...S.label,margin:0,whiteSpace:"nowrap"}}>Lezioni nuovo pacchetto:</label>
        <input type="number" min="1" style={{...S.input,width:100}} value={newPkgTotal} onChange={e=>setNewPkgTotal(Number(e.target.value))}/>
        <span style={{fontSize:12,color:"#6b7280"}}>Le lezioni usate verranno azzerate a 0</span>
      </div>}
    </div>}
    {user.role==="admin"&&<div style={S.field}><label style={S.label}>Insegnante</label><select style={S.input} value={form.teacher_id||""} onChange={e=>set("teacher_id",e.target.value)}><option value="">— Seleziona —</option>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
    <div style={S.field}><label style={S.label}>Note</label><textarea style={{...S.input,height:72,resize:"vertical"}} value={form.notes||""} onChange={e=>set("notes",e.target.value)}/></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!form.name} onClick={handleSave}>{student?"Salva Modifiche":"Aggiungi Studente"}</button></div>
  </Overlay>);
}

function StudentDetailModal({student,lessons,onClose}) {
  const sorted=[...lessons].sort((a,b)=>a.date.localeCompare(b.date));
  return (<Overlay onClose={onClose} wide>
    <h2 style={S.modalTitle}>Scheda: {student.name}</h2>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>{[["Livello",`Livello ${student.level}`],["Telefono",student.phone||"—"],["Email",student.email||"—"],["Azienda",student.company||"—"],["Note",student.notes||"—"]].map(([k,v])=>(<div key={k} style={{background:"#f9fafb",borderRadius:8,padding:"10px 14px"}}><div style={{fontSize:11,color:"#9ca3af",marginBottom:2}}>{k}</div><div style={{fontSize:13,fontWeight:600,wordBreak:"break-all"}}>{v}</div></div>))}</div>
    <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:"#166534"}}>📦 <strong>{student.package_used}/{student.package_total}</strong> lezioni · <strong style={{color:pkgRemaining(student)<=3?"#ef4444":"#10b981"}}>{pkgRemaining(student)} rimaste</strong></div>
    <div style={{...S.tableWrap,maxHeight:280,overflowY:"auto"}}><table style={S.table}><thead><tr><th style={S.th}>N°</th><th style={S.th}>Data</th><th style={S.th}>Ora</th><th style={S.th}>Argomento</th><th style={S.th}>Compiti</th><th style={S.th}>Modalità</th><th style={S.th}>Presenza</th></tr></thead>
      <tbody>{sorted.map((l,i)=><tr key={l.id} style={S.tr}><td style={{...S.td,fontWeight:700,color:"#6366f1"}}>{i+1}/{student.package_total}</td><td style={S.td}>{fmtDate(l.date)}</td><td style={S.td}><span style={S.timeBadge}>{l.time}</span></td><td style={S.td}>{l.topic}</td><td style={{...S.td,fontSize:12,color:"#6b7280"}}>{l.homework||"—"}</td><td style={S.td}><ModeBadge mode={l.mode} zoom={l.zoom_account}/></td><td style={S.td}><Pill ok={l.present}/></td></tr>)}</tbody>
    </table></div>
    {Array.isArray(student.package_history)&&student.package_history.length>0&&(
      <div style={{marginTop:16}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:8,color:"#374151"}}>📦 Storico pacchetti</div>
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {[...student.package_history].reverse().map((h,i)=>(
            <div key={i} style={{background:"#f8fafc",borderRadius:8,padding:"8px 14px",fontSize:12,display:"flex",gap:16,alignItems:"center"}}>
              <span style={{color:"#9ca3af"}}>📅 {fmtDate(h.date)}</span>
              <span style={{fontWeight:600}}>{h.used}/{h.total} lezioni usate</span>
              <span style={{color:h.remaining<=0?"#ef4444":"#10b981",fontWeight:600}}>{h.remaining} rimaste</span>
            </div>
          ))}
        </div>
      </div>
    )}
    <div style={{marginTop:16,textAlign:"right"}}><button style={S.btnSecondary} onClick={onClose}>Chiudi</button></div>
  </Overlay>);
}

function ClassDetailModal({cls,students,classLessons,onClose}) {
  const sorted=[...classLessons].sort((a,b)=>a.date.localeCompare(b.date));
  return (<Overlay onClose={onClose} wide>
    <h2 style={S.modalTitle}>Scheda Classe: {cls.name}</h2>
    <div style={{background:"#f0fdf4",borderRadius:10,padding:"10px 14px",marginBottom:12,fontSize:13,color:"#166534"}}>📦 <strong>{cls.package_used}/{cls.package_total}</strong> · <strong style={{color:pkgRemaining(cls)<=3?"#ef4444":"#10b981"}}>{pkgRemaining(cls)} rimaste</strong> · {cls.schedule}</div>
    <div style={{marginBottom:12,display:"flex",flexWrap:"wrap",gap:6}}>{students.map(s=><span key={s.id} style={{background:"#eff6ff",color:"#3b82f6",borderRadius:8,padding:"4px 12px",fontSize:13,fontWeight:600}}>{s.name} <LevelBadge level={s.level} small/></span>)}</div>
    <div style={{...S.tableWrap,maxHeight:300,overflowY:"auto"}}><table style={S.table}><thead><tr><th style={S.th}>N°</th><th style={S.th}>Data</th><th style={S.th}>Argomento</th><th style={S.th}>Modalità</th><th style={S.th}>Presenze</th></tr></thead>
      <tbody>{sorted.map((l,i)=><tr key={l.id} style={S.tr}><td style={{...S.td,fontWeight:700,color:"#6366f1"}}>{i+1}/{cls.package_total}</td><td style={S.td}>{fmtDate(l.date)}</td><td style={S.td}>{l.topic}</td><td style={S.td}><ModeBadge mode={l.mode} zoom={l.zoom_account}/></td><td style={S.td}><div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{students.map(s=>{const p=l.attendances?.[s.id]??false;return<span key={s.id} style={{padding:"2px 8px",borderRadius:12,fontSize:11,fontWeight:600,background:p?"#d1fae5":"#fee2e2",color:p?"#065f46":"#991b1b"}}>{p?"✓":"✗"} {s.name.split(" ")[0]}</span>;})}</div></td></tr>)}</tbody>
    </table></div>
    <div style={{marginTop:16,textAlign:"right"}}><button style={S.btnSecondary} onClick={onClose}>Chiudi</button></div>
  </Overlay>);
}

function ModeFields({form,set}) {
  return (<div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
    <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>📍 Modalità lezione</div>
    <div style={{display:"flex",gap:10,marginBottom:form.mode==="online"?12:0}}>{[["presenza","🏫 In presenza"],["online","💻 Online (Zoom)"]].map(([v,l])=>(<label key={v} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",padding:"9px",borderRadius:10,border:`2px solid ${form.mode===v?"#6366f1":"#e2e8f0"}`,background:form.mode===v?"#eef2ff":"white",fontWeight:600,fontSize:13,color:form.mode===v?"#4f46e5":"#6b7280"}}><input type="radio" checked={form.mode===v} onChange={()=>set("mode",v)} style={{display:"none"}}/>{l}</label>))}</div>
    {form.mode==="online"&&<div style={{marginTop:10}}><label style={S.label}>Account Zoom</label><input style={S.input} value={form.zoom_account||""} onChange={e=>set("zoom_account",e.target.value)} placeholder="insegnante@zoom.it"/></div>}
  </div>);
}

// ── LEZIONI INDIVIDUALI — identica all'originale ──────────────────
function LessonsPage({user,students,lessons,teachers,isAdmin,onAdd,onAddRecurring,onUpdate,onDelete}) {
  const [modal,setModal]=useState(null);const [fS,setFS]=useState("");const [fM,setFM]=useState("");const [fY,setFY]=useState("");const [fD,setFD]=useState("");const [fT,setFT]=useState("");const [confirm,setConfirm]=useState(null);const [openDays,setOpenDays]=useState({});const toggleDay=d=>setOpenDays(p=>({...p,[d]:!p[d]}));const isDayOpen=d=>openDays[d]!==false;const [detailSt,setDetailSt]=useState(null);const [viewMode,setViewMode]=useState("day");
  const myL=isAdmin?lessons:lessons.filter(l=>l.teacher_id===user.id);
  const filtered=myL.filter(l=>l.date>=today()&&(!fS||l.student_id===fS)&&(!fT||l.teacher_id===fT)&&(!fY||l.date.startsWith(fY))&&(!fM||l.date.slice(0,7)===fM)&&(!fD||l.date===fD));
  const sorted=[...filtered].sort((a,b)=>a.date.localeCompare(b.date)||(a.time||"").localeCompare(b.time||""));
  const years=[...new Set(myL.map(l=>l.date.slice(0,4)))].sort().reverse();
  const months=[...new Set(myL.map(l=>l.date.slice(0,7)))].sort().reverse();
  const lIdx=l=>{const all=lessons.filter(x=>x.student_id===l.student_id).sort((a,b)=>a.date.localeCompare(b.date));return all.findIndex(x=>x.id===l.id)+1;};
  // Raggruppa per giorno
  const byDay=useMemo(()=>{const map={};sorted.forEach(l=>{if(!map[l.date])map[l.date]=[];map[l.date].push(l);});return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0]));},[ sorted ]);
  return (<div style={S.page}>
    <div style={S.pageHeader}><div><h1 style={S.pageTitle}>Lezioni Individuali</h1><p style={S.pageSub}>{myL.length} lezioni registrate</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:8,padding:3}}>{[["day","Per giorno"],["table","Tabella"]].map(([v,l])=><button key={v} onClick={()=>setViewMode(v)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:viewMode===v?"white":"transparent",color:viewMode===v?"#374151":"#9ca3af",boxShadow:viewMode===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>)}</div>
        <button style={{...S.btnPrimary,width:"auto"}} onClick={()=>setModal("add")}>+ Nuova Lezione</button>
      </div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
      <select style={{...S.input,width:"auto",minWidth:170}} value={fS} onChange={e=>setFS(e.target.value)}><option value="">Tutti gli studenti</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      {isAdmin&&<select style={{...S.input,width:"auto",minWidth:160}} value={fT} onChange={e=>setFT(e.target.value)}><option value="">Tutti gli insegnanti</option>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
      <select style={{...S.input,width:"auto",minWidth:100}} value={fY} onChange={e=>{setFY(e.target.value);setFM("");setFD("");}}><option value="">Anno</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
      <select style={{...S.input,width:"auto",minWidth:150}} value={fM} onChange={e=>{setFM(e.target.value);setFD("");}}><option value="">Mese</option>{months.filter(m=>!fY||m.startsWith(fY)).map(m=><option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("it-IT",{month:"long",year:"numeric"})}</option>)}</select>
      <div style={{display:"flex",alignItems:"center",gap:6}}><label style={{fontSize:13,color:"#6b7280"}}>Giorno:</label><input type="date" style={{...S.input,width:"auto"}} value={fD} onChange={e=>setFD(e.target.value)}/></div>
      {(fS||fT||fY||fM||fD)&&<button style={{...S.btnSecondary,padding:"8px 14px",fontSize:12}} onClick={()=>{setFS("");setFT("");setFY("");setFM("");setFD("");}}>✕ Rimuovi filtri</button>}
    </div>
    {sorted.length===0?<Empty text="Nessuna lezione trovata"/>:(
      viewMode==="day"?(
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          {byDay.map(([date,dayLessons])=>(
            <div key={date} style={{background:"white",borderRadius:16,border:"1px solid #f1f5f9",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.04)"}}>
              <div onClick={()=>toggleDay(date)} style={{background:"#f8fafc",padding:"10px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
                <span style={{fontSize:13,color:"#9ca3af",marginRight:4}}>{isDayOpen(date)?"▼":"▶"}</span>
                <span style={{fontWeight:700,fontSize:14,color:"#374151"}}>{new Date(date+"T00:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
                <span style={{marginLeft:"auto",fontSize:12,background:"#e0e7ff",color:"#4f46e5",borderRadius:20,padding:"2px 10px",fontWeight:600}}>{dayLessons.length} lezioni</span>
              </div>
              {isDayOpen(date)&&<div style={{padding:"8px 0"}}>
                {[...dayLessons].sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map(l=>{
                  const st=students.find(s=>s.id===l.student_id);if(!st)return null;
                  const t=teachers.find(x=>x.id===l.teacher_id);
                  return(<div key={l.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 18px",borderBottom:"1px solid #f8fafc"}}>
                    <span style={S.timeBadge}>{l.time||"—"}</span>
                    <span style={{fontSize:12,color:"#9ca3af",minWidth:32}}>{l.duration}m</span>
                    <strong style={{fontSize:13,flex:"0 0 auto",minWidth:100}}>{st.name}</strong>
                    {isAdmin&&<span style={{fontSize:11,color:t?.color||"#6b7280",fontWeight:600,minWidth:80}}>👤 {t?.name||"—"}</span>}
                    <span style={{fontSize:12,color:"#6b7280",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.topic||"—"}</span>
                    <ModeBadge mode={l.mode}/>
                    <Pill ok={l.present}/>
                    <LessonCounter current={lIdx(l)} total={st.package_total||0}/>
                    <button style={{...S.btnSm,padding:"3px 10px",fontSize:11}} onClick={()=>setDetailSt({student:st,lesson:l})}>Dettagli</button>
                    <div style={{display:"flex",gap:4}}><button style={S.iconBtn} onClick={()=>setModal(l)}>✏️</button><button style={S.iconBtn} onClick={()=>setConfirm({id:l.id,sid:l.student_id})}>🗑️</button></div>
                  </div>);
                })}
              </div>}
            </div>
          ))}
        </div>
      ):(
        <div style={S.tableWrap}><table style={S.table}>
          <thead><tr><th style={S.th}>N°</th><th style={S.th}>Data</th><th style={S.th}>Ora</th><th style={S.th}>Min</th><th style={S.th}>Studente</th><th style={S.th}>Argomento</th><th style={S.th}>Compiti</th><th style={S.th}>Modalità</th><th style={S.th}>Presenza</th><th style={S.th}></th></tr></thead>
          <tbody>{sorted.map(l=>{const st=students.find(s=>s.id===l.student_id);if(!st)return null;return(<tr key={l.id} style={S.tr}><td style={S.td}><LessonCounter current={lIdx(l)} total={st.package_total||0}/></td><td style={S.td}>{fmtDate(l.date)}</td><td style={S.td}><span style={S.timeBadge}>{l.time||"—"}</span></td><td style={S.td}><span style={{fontSize:12,color:"#6b7280"}}>{l.duration}m</span></td><td style={S.td}><strong>{st.name}</strong></td><td style={{...S.td,maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.topic}</td><td style={{...S.td,maxWidth:120,color:"#6b7280",fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{l.homework||"—"}</td><td style={S.td}><ModeBadge mode={l.mode} zoom={l.zoom_account}/></td><td style={S.td}><Pill ok={l.present}/></td><td style={S.td}><div style={{display:"flex",gap:4}}><button style={S.iconBtn} onClick={()=>setModal(l)}>✏️</button><button style={S.iconBtn} onClick={()=>setConfirm({id:l.id,sid:l.student_id})}>🗑️</button></div></td></tr>);})}</tbody>
        </table></div>
      )
    )}
    {detailSt&&<StudentDetailModal student={detailSt.student} lessons={lessons.filter(l=>l.student_id===detailSt.student.id)} onClose={()=>setDetailSt(null)}/>}
    {modal&&<LessonModal user={user} students={students} lesson={modal==="add"?null:modal} onSave={l=>{modal==="add"?onAdd(l):onUpdate(l);setModal(null);}} onSaveRecurring={(l,n)=>{onAddRecurring(l,n);setModal(null);}} onClose={()=>setModal(null)}/>}
    {confirm&&<ConfirmModal title="Elimina lezione" text="Operazione irreversibile." onConfirm={()=>{onDelete(confirm.id,confirm.sid);setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
  </div>);
}

function LessonModal({user,students,lesson,onSave,onSaveRecurring,onClose}) {
  const [form,setForm]=useState(lesson||{student_id:"",date:today(),time:"09:00",duration:60,present:true,topic:"",homework:"",mode:"presenza",zoom_account:""});
  const [recurring,setRecurring]=useState(false);const [recTimes,setRecTimes]=useState(4);
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (<Overlay onClose={onClose}>
    <h2 style={S.modalTitle}>{lesson?"Modifica Lezione":"Nuova Lezione"}</h2>
    <div style={S.field}><label style={S.label}>Studente *</label><select style={S.input} value={form.student_id} onChange={e=>set("student_id",e.target.value)}><option value="">— Seleziona —</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} — Liv. {s.level}</option>)}</select></div>
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={form.date} onChange={e=>set("date",e.target.value)}/></div><div style={S.field}><label style={S.label}>Orario *</label><input type="time" style={S.input} value={form.time||""} onChange={e=>set("time",e.target.value)}/></div><div style={S.field}><label style={S.label}>Durata</label><select style={S.input} value={form.duration||60} onChange={e=>set("duration",Number(e.target.value))}>{DURATIONS.map(d=><option key={d} value={d}>{d} min</option>)}</select></div></div>
    <div style={S.field}><label style={S.label}>Argomento trattato</label><input style={S.input} value={form.topic||""} onChange={e=>set("topic",e.target.value)} placeholder="Es. Present Perfect… (opzionale)"/></div>
    <div style={S.field}><label style={S.label}>Compiti assegnati</label><input style={S.input} value={form.homework||""} onChange={e=>set("homework",e.target.value)} placeholder="Es. Ex. 3-5 pag. 28…"/></div>
    <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>✅ Presenza studente</div>
      <div style={{display:"flex",gap:10}}>{[true,false].map(v=>(<label key={String(v)} style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",padding:"9px",borderRadius:10,border:`2px solid ${form.present===v?(v?"#10b981":"#ef4444"):"#e2e8f0"}`,background:form.present===v?(v?"#f0fdf4":"#fff0f0"):"white",fontWeight:600,fontSize:13,color:form.present===v?(v?"#065f46":"#991b1b"):"#6b7280"}}><input type="radio" checked={form.present===v} onChange={()=>set("present",v)} style={{display:"none"}}/>{v?"✅ Presente":"❌ Assente"}</label>))}</div>
    </div>
    <ModeFields form={form} set={set}/>
    {!lesson&&<div style={{background:"#f0f9ff",borderRadius:12,padding:"14px 16px",marginBottom:14}}><label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontWeight:600,fontSize:13,color:"#0369a1"}}><input type="checkbox" checked={recurring} onChange={e=>setRecurring(e.target.checked)}/> 🔁 Ripeti lezione</label>{recurring&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:10}}><label style={S.label}>Numero ripetizioni</label><select style={{...S.input,width:"auto"}} value={recTimes} onChange={e=>setRecTimes(Number(e.target.value))}>{[2,3,4,5,6,7,8,10,12].map(n=><option key={n} value={n}>{n} settimane</option>)}</select><span style={{fontSize:12,color:"#6b7280"}}>stessa ora, ogni settimana</span></div>}</div>}
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!form.student_id} onClick={()=>{if(recurring&&!lesson)onSaveRecurring(form,recTimes);else onSave(form);}}>{lesson?"Salva Modifiche":recurring?"Registra "+recTimes+" lezioni":"Registra Lezione"}</button></div>
  </Overlay>);
}

// ── LEZIONI DI CLASSE — identica all'originale ────────────────────
function ClassesPage({user,students,classes,classLessons,teachers,isAdmin,onAddClass,onUpdateClass,onDeleteClass,onAddClassLesson,onUpdateClassLesson,onDeleteClassLesson}) {
  const [sel,setSel]=useState(null);const [classModal,setCM]=useState(null);const [lessonModal,setLM]=useState(null);const [confirm,setConfirm]=useState(null);
  const [fCompany,setFCompany]=useState("");const [fTeacher,setFTeacher]=useState("");const [fClass,setFClass]=useState("");
  const activeClass=sel?classes.find(c=>c.id===sel):null;
  const companies=[...new Set(classes.map(c=>c.company).filter(Boolean))];
  const visibleClasses=classes.filter(c=>(!fCompany||c.company===fCompany)&&(!fTeacher||c.teacher_id===fTeacher)&&(!fClass||c.id===fClass));
  const classStudents=activeClass?students.filter(s=>(activeClass.student_ids||[]).includes(s.id)):[];
  const thisLessons=activeClass?[...classLessons.filter(l=>l.class_id===activeClass.id)].sort((a,b)=>a.date.localeCompare(b.date)):[];
  const futureClassLessons=thisLessons.filter(l=>l.date>=today());
  const [openClassDays,setOpenClassDays]=useState({});const toggleClassDay=d=>setOpenClassDays(p=>({...p,[d]:!p[d]}));const isClassDayOpen=d=>openClassDays[d]!==false;
  return (<div style={S.page}>
    {!sel?(<>
      <div style={S.pageHeader}><div><h1 style={S.pageTitle}>Lezioni di Classe</h1><p style={S.pageSub}>{classes.length} classi</p></div>{isAdmin&&<button style={{...S.btnPrimary,width:"auto"}} onClick={()=>setCM("add")}>+ Nuova Classe</button>}</div>
      <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        {companies.length>0&&<select style={{...S.input,width:"auto",minWidth:160}} value={fCompany} onChange={e=>setFCompany(e.target.value)}><option value="">Tutte le aziende</option>{companies.map(co=><option key={co} value={co}>{co}</option>)}</select>}
        {isAdmin&&<select style={{...S.input,width:"auto",minWidth:160}} value={fTeacher} onChange={e=>setFTeacher(e.target.value)}><option value="">Tutti gli insegnanti</option>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
        <select style={{...S.input,width:"auto",minWidth:160}} value={fClass} onChange={e=>setFClass(e.target.value)}><option value="">Tutte le classi</option>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        {(fCompany||fTeacher||fClass)&&<button style={{...S.btnSecondary,padding:"8px 14px",fontSize:12}} onClick={()=>{setFCompany("");setFTeacher("");setFClass("");}}>✕ Rimuovi filtri</button>}
      </div>
      {classes.length===0?<Empty text="Nessuna classe"/>:(<div style={S.cardGrid}>{visibleClasses.map(cls=>{
        const clsS=students.filter(s=>(cls.student_ids||[]).includes(s.id));const clsL=classLessons.filter(l=>l.class_id===cls.id);const teacher=teachers.find(t=>t.id===cls.teacher_id);const rem=pkgRemaining(cls);
        return(<div key={cls.id} style={{...S.studentCard,borderTop:`3px solid ${pkgColor(cls)}`,cursor:"pointer"}} onClick={()=>setSel(cls.id)}>
          <div style={S.cardTop}><div style={{...S.studentAvatar,background:"#f59e0b20",color:"#f59e0b",fontSize:20}}>👥</div><div style={{flex:1}}><div style={S.studentName}>{cls.name}</div><div style={S.studentMeta}>{teacher?.name||"—"} · {cls.schedule}</div></div></div>
          <div style={{marginBottom:12}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,marginBottom:4}}><span style={{color:"#6b7280"}}>Pacchetto</span><span style={{fontWeight:700}}>{cls.package_used}/{cls.package_total} · <span style={{color:rem<=3?"#ef4444":"#10b981"}}>{rem} rimaste</span></span></div><div style={{height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(cls.package_used/cls.package_total)*100)}%`,background:pkgColor(cls),borderRadius:3}}/></div></div>
          <div style={S.cardStats}><div style={S.miniStat}><span style={S.miniStatVal}>{clsS.length}</span><span style={S.miniStatLbl}>studenti</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{clsL.length}/{cls.package_total}</span><span style={S.miniStatLbl}>lezioni</span></div></div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>{clsS.map(s=><span key={s.id} style={{fontSize:11,background:"#f1f5f9",borderRadius:6,padding:"2px 8px"}}>{s.name.split(" ")[0]}</span>)}</div>
          <div style={S.cardActions} onClick={e=>e.stopPropagation()}>{isAdmin&&<button style={S.btnSm} onClick={()=>setCM(cls)}>Modifica</button>}{isAdmin&&<button style={{...S.btnSm,...S.btnDanger}} onClick={()=>setConfirm({type:"class",id:cls.id})}>Elimina</button>}</div>
        </div>);
      })}</div>)}
    </>):(<>
      <button style={{...S.btnSecondary,width:"auto",marginBottom:20}} onClick={()=>setSel(null)}>← Tutte le Classi</button>
      <div style={S.pageHeader}>
        <div><h1 style={S.pageTitle}>{activeClass?.name}</h1><p style={S.pageSub}>{classStudents.length} studenti · {activeClass?.schedule}</p></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{background:"#f0fdf4",borderRadius:10,padding:"8px 16px",fontSize:13,color:"#166534",fontWeight:600}}>📦 {activeClass?.package_used}/{activeClass?.package_total} · {pkgRemaining(activeClass)} rimaste</div><button style={{...S.btnPrimary,width:"auto"}} onClick={()=>setLM("add")}>+ Nuova Lezione</button></div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:24}}>
        <div><h2 style={S.sectionTitle}>Studenti ({classStudents.length})</h2>
          {classStudents.map(st=>(<div key={st.id} style={{background:"white",borderRadius:12,padding:"12px 16px",border:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10,marginBottom:8}}><div style={{...S.studentAvatar,width:34,height:34,fontSize:12}}>{st.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={{fontWeight:600,fontSize:14}}>{st.name}</div></div><LevelBadge level={st.level}/></div>))}
        </div>
        <div><h2 style={S.sectionTitle}>Registro ({thisLessons.length}/{activeClass?.package_total})</h2>
          {futureClassLessons.length===0?<Empty text="Nessuna lezione futura"/>:(()=>{
            const byDay={};futureClassLessons.forEach(l=>{if(!byDay[l.date])byDay[l.date]=[];byDay[l.date].push(l);});
            return(<div style={{display:"flex",flexDirection:"column",gap:12}}>
              {Object.entries(byDay).sort((a,b)=>a[0].localeCompare(b[0])).map(([date,dayLessons])=>(
                <div key={date} style={{background:"white",borderRadius:14,border:"1px solid #f1f5f9",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                  <div onClick={()=>toggleClassDay(date)} style={{background:"#f8fafc",padding:"10px 18px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",userSelect:"none"}}>
                    <span style={{fontSize:13,color:"#9ca3af",marginRight:4}}>{isClassDayOpen(date)?"▼":"▶"}</span>
                    <span style={{fontWeight:700,fontSize:14,color:"#374151"}}>{new Date(date+"T00:00:00").toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
                    <span style={{marginLeft:"auto",fontSize:12,background:"#fef3c7",color:"#d97706",borderRadius:20,padding:"2px 10px",fontWeight:600}}>{dayLessons.length} lezioni</span>
                  </div>
                  {isClassDayOpen(date)&&dayLessons.map((lesson)=>{
                    const idx=thisLessons.findIndex(x=>x.id===lesson.id)+1;const tot=activeClass?.package_total||0;const att=Object.values(lesson.attendances||{}).filter(Boolean).length;
                    return(<div key={lesson.id} style={{padding:18,borderTop:"1px solid #f1f5f9"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}><LessonCounter current={idx} total={tot}/>
                          <div><div style={{fontWeight:700,fontSize:15}}>{lesson.topic||"—"}</div>
                            <div style={{fontSize:12,color:"#6b7280",marginTop:2,display:"flex",alignItems:"center",gap:8}}><span style={S.timeBadge}>{lesson.time}</span> · {lesson.duration}min · <ModeBadge mode={lesson.mode} zoom={lesson.zoom_account}/></div>
                            {lesson.homework&&<div style={{fontSize:12,color:"#6b7280",marginTop:2}}>📝 {lesson.homework}</div>}
                          </div>
                        </div>
                        <div style={{display:"flex",gap:6}}><button style={S.iconBtn} onClick={()=>setLM(lesson)}>✏️</button><button style={S.iconBtn} onClick={()=>setConfirm({type:"classLesson",id:lesson.id,cid:lesson.class_id})}>🗑️</button></div>
                      </div>
                      <div style={{borderTop:"1px solid #f1f5f9",paddingTop:8}}>
                        <div style={{fontSize:11,fontWeight:600,color:"#9ca3af",marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>Presenze: {att}/{classStudents.length}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:5}}>{classStudents.map(st=>{const p=lesson.attendances?.[st.id]??false;return<span key={st.id} style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:p?"#d1fae5":"#fee2e2",color:p?"#065f46":"#991b1b"}}>{p?"✓":"✗"} {st.name.split(" ")[0]}</span>;})}</div>
                      </div>
                    </div>);
                  })}
                </div>
              ))}
            </div>);
          })()}
        </div>
      </div>
    </>)}
    {classModal&&<ClassModal user={user} students={students} teachers={teachers} cls={classModal==="add"?null:classModal} onSave={c=>{classModal==="add"?onAddClass(c):onUpdateClass(c);setCM(null);}} onClose={()=>setCM(null)}/>}
    {lessonModal&&activeClass&&<ClassLessonModal cls={activeClass} students={classStudents} lesson={lessonModal==="add"?null:lessonModal} onSave={l=>{const wc={...l,class_id:activeClass.id};lessonModal==="add"?onAddClassLesson(wc):onUpdateClassLesson(wc);setLM(null);}} onClose={()=>setLM(null)}/>}
    {confirm&&<ConfirmModal title="Elimina" text="Operazione irreversibile." onConfirm={()=>{if(confirm.type==="class"){onDeleteClass(confirm.id);setSel(null);}if(confirm.type==="classLesson")onDeleteClassLesson(confirm.id,confirm.cid);setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
  </div>);
}

function ClassModal({user,students,teachers,cls,onSave,onClose}) {
  const [form,setForm]=useState(cls||{name:"",teacher_id:user.role==="admin"?"":user.id,student_ids:[],schedule:"",company:"",package_total:20,package_used:0});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggle=id=>setForm(f=>({...f,student_ids:f.student_ids.includes(id)?f.student_ids.filter(x=>x!==id):[...f.student_ids,id]}));
  const avail=students.filter(s=>s.is_class_student);
  return (<Overlay onClose={onClose} wide>
    <h2 style={S.modalTitle}>{cls?"Modifica Classe":"Nuova Classe"}</h2>
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Nome classe *</label><input style={S.input} value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Es. Gruppo A1 Mattino"/></div><div style={S.field}><label style={S.label}>Azienda</label><input style={S.input} value={form.company||""} onChange={e=>set("company",e.target.value)} placeholder="Es. Acme Srl"/></div></div>
    <div style={S.field}><label style={S.label}>Orario ricorrente</label><input style={S.input} value={form.schedule||""} onChange={e=>set("schedule",e.target.value)} placeholder="Es. Lunedì 09:00"/></div>
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Lezioni pacchetto</label><input type="number" min="1" style={S.input} value={form.package_total||20} onChange={e=>set("package_total",Number(e.target.value))}/></div>{user.role==="admin"&&<div style={S.field}><label style={S.label}>Insegnante</label><select style={S.input} value={form.teacher_id||""} onChange={e=>set("teacher_id",e.target.value)}><option value="">— Seleziona —</option>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}</div>
    <div style={S.field}><label style={S.label}>Studenti della classe</label><div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:8}}>{avail.map(s=>(<label key={s.id} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",background:form.student_ids.includes(s.id)?"#6366f115":"#f8fafc",border:`1.5px solid ${form.student_ids.includes(s.id)?"#6366f1":"#e2e8f0"}`,borderRadius:8,padding:"6px 12px",fontSize:13}}><input type="checkbox" checked={form.student_ids.includes(s.id)} onChange={()=>toggle(s.id)}/>{s.name} <LevelBadge level={s.level} small/></label>))}</div></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!form.name} onClick={()=>onSave(form)}>{cls?"Salva":"Crea Classe"}</button></div>
  </Overlay>);
}

function ClassLessonModal({cls,students,lesson,onSave,onClose}) {
  const initAtt=()=>{const a={};students.forEach(s=>{a[s.id]=lesson?.attendances?.[s.id]??true;});return a;};
  const [form,setForm]=useState(lesson||{date:today(),time:"09:00",duration:90,topic:"",homework:"",attendances:initAtt(),mode:"presenza",zoom_account:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const toggleAtt=sid=>setForm(f=>({...f,attendances:{...f.attendances,[sid]:!f.attendances[sid]}}));
  return (<Overlay onClose={onClose} wide>
    <h2 style={S.modalTitle}>{lesson?"Modifica":"Nuova Lezione"} — {cls.name}</h2>
    <div style={S.fieldRow}><div style={S.field}><label style={S.label}>Data *</label><input type="date" style={S.input} value={form.date} onChange={e=>set("date",e.target.value)}/></div><div style={S.field}><label style={S.label}>Orario *</label><input type="time" style={S.input} value={form.time||""} onChange={e=>set("time",e.target.value)}/></div><div style={S.field}><label style={S.label}>Durata</label><select style={S.input} value={form.duration||90} onChange={e=>set("duration",Number(e.target.value))}>{DURATIONS.map(d=><option key={d} value={d}>{d} min</option>)}</select></div></div>
    <div style={S.field}><label style={S.label}>Argomento trattato</label><input style={S.input} value={form.topic||""} onChange={e=>set("topic",e.target.value)} placeholder="Es. Vocabulary Unit 4… (opzionale)"/></div>
    <div style={S.field}><label style={S.label}>Compiti</label><input style={S.input} value={form.homework||""} onChange={e=>set("homework",e.target.value)}/></div>
    <ModeFields form={form} set={set}/>
    <div style={{background:"#f8fafc",borderRadius:12,padding:"14px 16px",marginBottom:14}}>
      <div style={{fontWeight:600,fontSize:13,marginBottom:10}}>✅ Presenze — {Object.values(form.attendances||{}).filter(Boolean).length}/{students.length} presenti</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:8}}>{students.map(s=>{const p=form.attendances?.[s.id]??true;return<button key={s.id} onClick={()=>toggleAtt(s.id)} style={{display:"flex",alignItems:"center",gap:6,cursor:"pointer",background:p?"#d1fae5":"#fee2e2",border:`1.5px solid ${p?"#10b981":"#ef4444"}`,color:p?"#065f46":"#991b1b",borderRadius:8,padding:"7px 14px",fontSize:13,fontWeight:600}}>{p?"✓":"✗"} {s.name.split(" ")[0]}</button>;})}</div>
    </div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} onClick={()=>onSave(form)}>{lesson?"Salva":"Registra"}</button></div>
  </Overlay>);
}

// ── CALENDARIO — identico all'originale ───────────────────────────
function CalendarPage({user,students,lessons,classLessons,classes,teachers,isAdmin,notes,onAddNote,onUpdateNote,onDeleteNote,onImportLesson,allStudents,allTeachers}) {
  const [cur,setCur]=useState(()=>{ const d=new Date(); return new Date(d.getFullYear(),d.getMonth(),1); });
  const [selDay,setSel]=useState(null);const [filterT,setFT]=useState("all");const [noteModal,setNM]=useState(null);
  const [gcStatus,setGcStatus]=useState("idle");
  const [gcMessage,setGcMsg]=useState("");
  const [gcCount,setGcCount]=useState(null);

  const GOOGLE_CLIENT_ID = "389289626389-tehsnne7dqg4mnff2pu8npc8ce26382v.apps.googleusercontent.com";
  const SCOPES = "https://www.googleapis.com/auth/calendar.readonly";

  const year=cur.getFullYear(),month=cur.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate();
  const startOffset=(new Date(year,month,1).getDay()+6)%7;
  const myL=isAdmin?lessons:lessons.filter(l=>l.teacher_id===user.id);
  const myCL=isAdmin?classLessons:classLessons.filter(l=>l.teacher_id===user.id);
  const filtL=filterT==="all"?myL:myL.filter(l=>l.teacher_id===filterT);
  const filtCL=filterT==="all"?myCL:myCL.filter(l=>l.teacher_id===filterT);
  const forDay=d=>{const ds=`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;return{indiv:filtL.filter(l=>l.date===ds),cls:filtCL.filter(l=>l.date===ds),dayNotes:notes.filter(n=>n.date===ds),ds};};
  const todayStr=today();const selData=selDay?forDay(selDay):null;
  const weekDays=["Lun","Mar","Mer","Gio","Ven","Sab","Dom"];
  const teacherList=teachers.filter(t=>t.role==="teacher");
  const tc=tid=>teachers.find(t=>t.id===tid)?.color||"#6366f1";
  const monthNotes=notes.filter(n=>n.date.startsWith(`${year}-${String(month+1).padStart(2,"0")}`));

  const loadGapiScript = () => new Promise((resolve,reject)=>{
    if(window.gapi){resolve();return;}
    const s=document.createElement("script");s.src="https://apis.google.com/js/api.js";
    s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  const loadGisScript = () => new Promise((resolve,reject)=>{
    if(window.google?.accounts){resolve();return;}
    const s=document.createElement("script");s.src="https://accounts.google.com/gsi/client";
    s.onload=resolve;s.onerror=reject;document.head.appendChild(s);
  });
  const parseGoogleEvent = (event) => {
    const start=event.start?.dateTime||event.start?.date;
    const end=event.end?.dateTime||event.end?.date;
    if(!start) return null;
    const startDate=start.split("T")[0];
    const startTime=start.includes("T")?start.split("T")[1].slice(0,5):"09:00";
    let duration=60;
    if(end){const s=new Date(start),e=new Date(end);const mins=Math.round((e-s)/60000);if(mins>=15&&mins<=480)duration=mins;}
    const title=(event.summary||"").toLowerCase();
    const mode=title.includes("onl.")||title.includes("online")||title.includes("zoom")?"online":"presenza";
    return {startDate,startTime,duration,summary:event.summary||"",mode};
  };
  const findStudent = (eventSummary) => {
    const active=(allStudents||students).filter(s=>s.active&&!s.deleted);
    const titleLower=eventSummary.toLowerCase();
    return active.find(s=>s.name.toLowerCase().split(" ").filter(p=>p.length>2).some(p=>titleLower.includes(p)));
  };
  const syncGoogleCalendar = async () => {
    setGcStatus("loading");setGcMsg("Caricamento librerie Google...");setGcCount(null);
    try {
      await Promise.all([loadGapiScript(),loadGisScript()]);
      await new Promise((res,rej)=>window.gapi.load("client",{callback:res,onerror:rej}));
      await window.gapi.client.init({});
      await window.gapi.client.load("https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest");
      setGcMsg("Accesso a Google Calendar...");
      const token = await new Promise((resolve,reject)=>{
        const client=window.google.accounts.oauth2.initTokenClient({
          client_id:GOOGLE_CLIENT_ID,scope:SCOPES,
          callback:(resp)=>{if(resp.error)reject(new Error(resp.error));else resolve(resp.access_token);}
        });
        client.requestAccessToken({prompt:""});
      });
      window.gapi.client.setToken({access_token:token});
      setGcMsg("Lettura calendari...");
      const calListResp=await window.gapi.client.calendar.calendarList.list();
      const calendars=calListResp.result.items||[];
      const timeMin=new Date(year,month,1).toISOString();
      const timeMax=new Date(year,month+4,0).toISOString();
      setGcMsg("Importazione lezioni...");
      let imported=0,skipped=0,errors=[];
      for(const cal of calendars){
        const calName=cal.summary||"";
        const matchedTeacher=(allTeachers||teachers).find(t=>t.role==="teacher"&&(
          calName.toLowerCase().includes(t.name.toLowerCase().split(" ")[0].toLowerCase())||
          t.name.toLowerCase().includes(calName.toLowerCase().split(" ")[0].toLowerCase())
        ));
        if(!matchedTeacher) continue;
        const eventsResp=await window.gapi.client.calendar.events.list({
          calendarId:cal.id,timeMin,timeMax,singleEvents:true,orderBy:"startTime",maxResults:500
        });
        for(const event of eventsResp.result.items||[]){
          const parsed=parseGoogleEvent(event);
          if(!parsed) continue;
          const student=findStudent(parsed.summary);
          if(!student){errors.push('"'+parsed.summary+'" ('+matchedTeacher.name+')');skipped++;continue;}
          const dup=lessons.find(l=>l.student_id===student.id&&l.date===parsed.startDate&&l.time===parsed.startTime);
          if(dup){skipped++;continue;}
          try{
            await onImportLesson({student_id:student.id,teacher_id:matchedTeacher.id,date:parsed.startDate,time:parsed.startTime,duration:parsed.duration,topic:parsed.summary,homework:"",present:true,mode:parsed.mode,zoom_account:""});
            imported++;
          }catch(e){skipped++;}
        }
      }
      setGcStatus("done");setGcCount({imported,skipped,errors});
      setGcMsg(imported>0?("✅ Importate "+imported+" nuove lezioni"):"✅ Nessuna nuova lezione da importare");
    }catch(e){setGcStatus("error");setGcMsg("Errore: "+(e.message||"problema con Google Calendar"));}
  };

  return (<div style={S.page}>
    <div style={S.pageHeader}>
      <div><h1 style={S.pageTitle}>📅 Calendario</h1><p style={S.pageSub}>{isAdmin?"Vista per insegnante (colori)":`Lezioni di ${user.name}`}</p></div>
      <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
        {isAdmin&&<select style={{...S.input,width:"auto",minWidth:180}} value={filterT} onChange={e=>setFT(e.target.value)}><option value="all">Tutti gli insegnanti</option>{teacherList.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select>}
        {isAdmin&&(
          <button style={{...S.btnPrimary,width:"auto",padding:"8px 16px",background:gcStatus==="error"?"#ef4444":gcStatus==="done"?"#10b981":"#4285f4",opacity:gcStatus==="loading"?0.7:1}} disabled={gcStatus==="loading"} onClick={syncGoogleCalendar}>
            {gcStatus==="loading"?"⏳ Sincronizzazione...":gcStatus==="done"?"✅ Sincronizzato":"🔄 Sincronizza Google Calendar"}
          </button>
        )}
        <button style={{...S.btnPrimary,width:"auto",padding:"8px 16px"}} onClick={()=>setNM("add")}>+ Nota</button>
      </div>
    </div>
    {gcStatus!=="idle"&&(
      <div style={{background:gcStatus==="error"?"#fee2e2":gcStatus==="done"?"#f0fdf4":"#eff6ff",border:"1px solid "+(gcStatus==="error"?"#fca5a5":gcStatus==="done"?"#86efac":"#93c5fd"),borderRadius:12,padding:"12px 18px",marginBottom:16,fontSize:13}}>
        <div style={{fontWeight:600,color:gcStatus==="error"?"#dc2626":gcStatus==="done"?"#166534":"#1d4ed8",marginBottom:gcCount?.errors?.length>0?6:0}}>{gcMessage}</div>
        {gcCount?.errors?.length>0&&(<div>
          <div style={{fontSize:12,color:"#92400e",fontWeight:600,marginBottom:4}}>Lezioni non abbinate ({gcCount.errors.length}):</div>
          {gcCount.errors.slice(0,5).map((e,i)=><div key={i} style={{fontSize:11,color:"#b45309"}}>• {e}</div>)}
          {gcCount.errors.length>5&&<div style={{fontSize:11,color:"#9ca3af"}}>...e altri {gcCount.errors.length-5}</div>}
        </div>)}
        {gcStatus==="done"&&<button style={{...S.btnSecondary,marginTop:8,padding:"4px 12px",fontSize:12}} onClick={()=>{setGcStatus("idle");setGcMsg("");setGcCount(null);}}>Chiudi</button>}
      </div>
    )}
    {isAdmin&&(<div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap"}}>
      {teacherList.map(t=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:6,background:"white",borderRadius:8,padding:"6px 12px",border:"2px solid "+t.color+"30",fontSize:13}}><span style={{width:10,height:10,borderRadius:"50%",background:t.color,display:"inline-block"}}/><span style={{fontWeight:600,color:t.color}}>{t.name}</span></div>))}
      <div style={{display:"flex",alignItems:"center",gap:6,background:"white",borderRadius:8,padding:"6px 12px",border:"1px solid #f1f5f9",fontSize:13}}><span style={{width:10,height:10,borderRadius:"50%",background:"#94a3b8",display:"inline-block"}}/><span style={{color:"#6b7280"}}>Note personali</span></div>
    </div>)}
    <div style={{display:"grid",gridTemplateColumns:"1fr 360px",gap:24}}>
      <div style={{background:"white",borderRadius:20,border:"1px solid #f1f5f9",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:"1px solid #f1f5f9"}}><button style={S.iconBtn} onClick={()=>setCur(new Date(year,month-1,1))}>◀</button><h2 style={{margin:0,fontSize:18,fontWeight:700}}>{cur.toLocaleDateString("it-IT",{month:"long",year:"numeric"})}</h2><button style={S.iconBtn} onClick={()=>setCur(new Date(year,month+1,1))}>▶</button></div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"12px 8px 8px"}}>
          {weekDays.map(d=><div key={d} style={{textAlign:"center",fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",paddingBottom:8}}>{d}</div>)}
          {Array.from({length:startOffset}).map((_,i)=><div key={"e"+i}/>)}
          {Array.from({length:daysInMonth},(_,i)=>i+1).map(day=>{
            const {indiv,cls,dayNotes,ds}=forDay(day);const isToday=ds===todayStr,isSel=selDay===day;
            const tIds=[...new Set([...indiv.map(l=>l.teacher_id),...cls.map(l=>l.teacher_id)])];
            return(<div key={day} onClick={()=>setSel(day===selDay?null:day)} style={{aspectRatio:"1",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:10,cursor:"pointer",margin:2,background:isSel?"#6366f1":isToday?"#eff6ff":"transparent",border:isToday&&!isSel?"2px solid #6366f1":"2px solid transparent"}}>
              <span style={{fontSize:13,fontWeight:isToday?700:400,color:isSel?"white":isToday?"#6366f1":"#374151"}}>{day}</span>
              {(tIds.length>0||dayNotes.length>0)&&<div style={{display:"flex",gap:2,marginTop:2,flexWrap:"wrap",justifyContent:"center"}}>
                {isAdmin?tIds.map((tid,i)=><span key={i} style={{width:6,height:6,borderRadius:"50%",background:isSel?"white":tc(tid),display:"inline-block"}}/>):<>
                  {indiv.length>0&&<span style={{width:6,height:6,borderRadius:"50%",background:isSel?"white":"#6366f1",display:"inline-block"}}/>}
                  {cls.length>0&&<span style={{width:6,height:6,borderRadius:"50%",background:isSel?"white":"#f59e0b",display:"inline-block"}}/>}
                </>}
                {dayNotes.length>0&&<span style={{width:6,height:6,borderRadius:"50%",background:isSel?"white":"#94a3b8",display:"inline-block"}}/>}
              </div>}
            </div>);
          })}
        </div>
        <div style={{padding:"8px 16px 12px",borderTop:"1px solid #f8fafc",display:"flex",gap:12,flexWrap:"wrap"}}>
          {isAdmin?teacherList.map(t=><div key={t.id} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:t.color}}><span style={{width:8,height:8,borderRadius:"50%",background:t.color,display:"inline-block"}}/>{t.name}</div>):[[" #6366f1","Individuali"],["#f59e0b","Classi"]].map(([c,l])=><div key={l} style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}><span style={{width:8,height:8,borderRadius:"50%",background:c,display:"inline-block"}}/>{l}</div>)}
          <div style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#6b7280"}}><span style={{width:8,height:8,borderRadius:"50%",background:"#94a3b8",display:"inline-block"}}/>Note</div>
        </div>
      </div>
      <div style={{background:"white",borderRadius:20,border:"1px solid #f1f5f9",padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.06)"}}>
        {!selDay?(<div>
          <div style={{textAlign:"center",padding:"20px 0",color:"#9ca3af"}}><div style={{fontSize:32,marginBottom:8}}>📅</div><div style={{fontSize:13}}>Seleziona un giorno</div></div>
          {monthNotes.length>0&&<div><div style={{fontSize:13,fontWeight:700,marginBottom:8}}>📌 Note del mese ({monthNotes.length})</div>{monthNotes.map(n=><div key={n.id} style={{background:"#fffbeb",borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:"3px solid #f59e0b",fontSize:13}}><div style={{fontSize:11,color:"#9ca3af",marginBottom:2}}>{fmtDate(n.date)}</div><div>{n.text}</div></div>)}</div>}
        </div>):(<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <h3 style={{margin:0,fontSize:14,fontWeight:700}}>{new Date(selData.ds).toLocaleDateString("it-IT",{weekday:"long",day:"numeric",month:"long"})}</h3>
            <button style={{...S.btnPrimary,width:"auto",padding:"5px 12px",fontSize:12}} onClick={()=>setNM({date:selData.ds,text:""})}>+ Nota</button>
          </div>
          {selData.dayNotes.length>0&&<div style={{marginBottom:12}}><div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>📌 Note</div>
            {selData.dayNotes.map(n=><div key={n.id} style={{background:"#fffbeb",borderRadius:10,padding:"10px 12px",marginBottom:6,borderLeft:"3px solid #f59e0b",fontSize:13,display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}><span style={{flex:1}}>{n.text}</span><div style={{display:"flex",gap:4,flexShrink:0}}><button style={S.iconBtn} onClick={()=>setNM(n)}>✏️</button><button style={S.iconBtn} onClick={()=>onDeleteNote(n.id)}>🗑️</button></div></div>)}
          </div>}
          {selData.indiv.length===0&&selData.cls.length===0?<div style={{textAlign:"center",padding:"16px 0",color:"#9ca3af",fontSize:13}}>Nessuna lezione</div>:<>
            {selData.indiv.length>0&&<><div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>Individuali</div>
              {[...selData.indiv].sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map(l=>{const st=students.find(s=>s.id===l.student_id);const t=teachers.find(t=>t.id===l.teacher_id);return<div key={l.id} style={{background:"#f8fafc",borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:"3px solid "+tc(l.teacher_id)}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={S.timeBadge}>{l.time}</span><span style={{fontSize:11,color:"#6b7280"}}>{l.duration}min</span></div><div style={{fontWeight:600,fontSize:13}}>{st?.name||"—"}</div><div style={{fontSize:12,color:"#6b7280"}}>{l.topic}</div>{isAdmin&&<div style={{fontSize:11,color:tc(l.teacher_id),fontWeight:600,marginTop:2}}>👤 {t?.name}</div>}</div>;})}
            </>}
            {selData.cls.length>0&&<><div style={{fontSize:11,fontWeight:700,color:"#9ca3af",textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6,marginTop:8}}>Classi</div>
              {[...selData.cls].sort((a,b)=>(a.time||"").localeCompare(b.time||"")).map(l=>{const cls=classes.find(c=>c.id===l.class_id);const t=teachers.find(t=>t.id===l.teacher_id);const att=Object.values(l.attendances||{}).filter(Boolean).length;const tot2=Object.keys(l.attendances||{}).length;return<div key={l.id} style={{background:"#fffbeb",borderRadius:10,padding:"10px 12px",marginBottom:8,borderLeft:"3px solid "+tc(l.teacher_id)}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}><span style={S.timeBadge}>{l.time}</span><span style={{fontSize:12,color:"#6b7280"}}>{att}/{tot2} presenti</span></div><div style={{fontWeight:600,fontSize:13}}>{cls?.name||"—"} 👥</div><div style={{fontSize:12,color:"#6b7280"}}>{l.topic}</div>{isAdmin&&<div style={{fontSize:11,color:tc(l.teacher_id),fontWeight:600,marginTop:2}}>👤 {t?.name}</div>}</div>;})}
            </>}
          </>}
        </>)}
      </div>
    </div>
    {noteModal&&<NoteModal note={noteModal==="add"?{date:today(),text:""}:noteModal} isNew={noteModal==="add"||!noteModal.id} onSave={n=>{noteModal==="add"||!noteModal.id?onAddNote(n):onUpdateNote(n);setNM(null);}} onClose={()=>setNM(null)}/>}
  </div>);
}

function NoteModal({note,isNew,onSave,onClose}) {
  const [form,setForm]=useState({date:note.date||today(),text:note.text||"",...(note.id?{id:note.id}:{})});
  return (<Overlay onClose={onClose}>
    <h2 style={S.modalTitle}>{isNew?"📌 Nuova Nota":"✏️ Modifica Nota"}</h2>
    <div style={S.field}><label style={S.label}>Data</label><input type="date" style={S.input} value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
    <div style={S.field}><label style={S.label}>Nota *</label><textarea style={{...S.input,height:100,resize:"vertical"}} value={form.text} onChange={e=>setForm(f=>({...f,text:e.target.value}))} placeholder="Es. Preparare materiale, contattare studente…"/></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!form.text} onClick={()=>onSave(form)}>{isNew?"Salva Nota":"Aggiorna"}</button></div>
  </Overlay>);
}

// ── REPORT — identico all'originale ──────────────────────────────
function ReportsPage({user,students,classes,lessons,classLessons,teachers,isAdmin}) {
  const [fT,setFT]=useState("");const [tab,setTab]=useState("students");
  const fS=students.filter(s=>s.active&&(!fT||s.teacher_id===fT));
  const fC=classes.filter(c=>!fT||c.teacher_id===fT);
  const pkgStatus=o=>{const r=pkgRemaining(o);if(r<=0)return{label:"Esaurito",color:"#ef4444",bg:"#fee2e2"};if(r<=3)return{label:"In scadenza",color:"#f59e0b",bg:"#fef3c7"};return{label:"Regolare",color:"#10b981",bg:"#d1fae5"};};
  const allObjs=[...students.filter(s=>s.active),...classes];
  const monthlyHours=useMemo(()=>{
    const now=new Date();const ym=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}`;
    return teachers.filter(t=>t.role==="teacher").map(t=>{
      const im=lessons.filter(l=>l.teacher_id===t.id&&l.date.startsWith(ym)).reduce((s,l)=>s+(l.duration||0),0);
      const cm=classLessons.filter(l=>l.teacher_id===t.id&&l.date.startsWith(ym)).reduce((s,l)=>s+(l.duration||0),0);
      const total=im+cm;return{teacher:t,mins:total,hours:Math.floor(total/60),rem:total%60};
    });
  },[teachers,lessons,classLessons]);
  return (<div style={S.page}>
    <div style={S.pageHeader}><div><h1 style={S.pageTitle}>📊 Report & Statistiche</h1><p style={S.pageSub}>Monitoraggio pacchetti, ore e lezioni</p></div></div>
    <div style={S.statsGrid}>{[{label:"Studenti attivi",value:students.filter(s=>s.active).length,icon:"👤",color:"#6366f1"},{label:"Pacchetti in scadenza",value:allObjs.filter(x=>pkgRemaining(x)<=3&&pkgRemaining(x)>0).length,icon:"⚠️",color:"#f59e0b"},{label:"Pacchetti esauriti",value:allObjs.filter(x=>pkgRemaining(x)<=0&&x.package_total>0).length,icon:"🔴",color:"#ef4444"},{label:"Lezioni totali",value:lessons.length+classLessons.length,icon:"📚",color:"#10b981"}].map((s,i)=>(<div key={i} style={S.statCard}><div style={{...S.statIcon,background:s.color+"20",color:s.color}}>{s.icon}</div><div style={S.statValue}>{s.value}</div><div style={S.statLabel}>{s.label}</div></div>))}</div>
    <div style={{...S.card,marginBottom:24}}>
      <h2 style={S.sectionTitle}>🕐 Ore di lezione questo mese — {new Date().toLocaleDateString("it-IT",{month:"long",year:"numeric"})}</h2>
      <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
        {monthlyHours.map(({teacher,hours,rem,mins})=>(<div key={teacher.id} style={{background:"#f8fafc",borderRadius:12,padding:"14px 20px",border:`2px solid ${teacher.color}25`,flex:"1 1 160px",minWidth:160}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{width:10,height:10,borderRadius:"50%",background:teacher.color,display:"inline-block"}}/><span style={{fontWeight:700,fontSize:13}}>{teacher.name}</span></div>
          <div style={{fontSize:26,fontWeight:800,color:teacher.color,lineHeight:1}}>{hours}<span style={{fontSize:13,fontWeight:500,color:"#6b7280"}}>h {rem>0?`${rem}m`:""}</span></div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:4}}>{mins} minuti totali</div>
        </div>))}
        {monthlyHours.every(x=>x.mins===0)&&<div style={S.emptySmall}>Nessuna lezione registrata questo mese</div>}
      </div>
    </div>
    {isAdmin&&<div style={{display:"flex",gap:12,marginBottom:20}}><select style={{...S.input,width:"auto",minWidth:200}} value={fT} onChange={e=>setFT(e.target.value)}><option value="">Tutti gli insegnanti</option>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></div>}
    <div style={{display:"flex",gap:8,marginBottom:20}}>{[["students","👤 Studenti"],["classes","👥 Classi"]].map(([id,label])=>(<button key={id} onClick={()=>setTab(id)} style={{padding:"8px 20px",borderRadius:10,border:"none",cursor:"pointer",fontWeight:600,fontSize:14,background:tab===id?"#6366f1":"#f1f5f9",color:tab===id?"white":"#374151"}}>{label}</button>))}</div>
    {tab==="students"&&<div style={S.tableWrap}><table style={S.table}><thead><tr><th style={S.th}>Studente</th><th style={S.th}>Insegnante</th><th style={S.th}>Livello</th><th style={S.th}>Svolte</th><th style={S.th}>Rimaste</th><th style={S.th}>Tot.</th><th style={S.th}>Stato</th></tr></thead>
      <tbody>{fS.map(s=>{const st=pkgStatus(s);const t=teachers.find(t=>t.id===s.teacher_id);return<tr key={s.id} style={S.tr}><td style={S.td}><strong>{s.name}</strong></td><td style={S.td}>{t?.name||"—"}</td><td style={S.td}><LevelBadge level={s.level}/></td><td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700}}>{s.package_used}</span><div style={{width:60,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(s.package_used/s.package_total)*100)}%`,background:pkgColor(s),borderRadius:3}}/></div></div></td><td style={{...S.td,fontWeight:700,color:pkgRemaining(s)<=3?"#ef4444":"#10b981"}}>{pkgRemaining(s)}</td><td style={S.td}>{s.package_total}</td><td style={S.td}><span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td></tr>;})}
      </tbody></table></div>}
    {tab==="classes"&&<div style={S.tableWrap}><table style={S.table}><thead><tr><th style={S.th}>Classe</th><th style={S.th}>Insegnante</th><th style={S.th}>Studenti</th><th style={S.th}>Svolte</th><th style={S.th}>Rimaste</th><th style={S.th}>Tot.</th><th style={S.th}>Stato</th></tr></thead>
      <tbody>{fC.map(c=>{const st=pkgStatus(c);const t=teachers.find(t=>t.id===c.teacher_id);return<tr key={c.id} style={S.tr}><td style={S.td}><strong>{c.name}</strong></td><td style={S.td}>{t?.name||"—"}</td><td style={S.td}>{(c.student_ids||[]).length}</td><td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{fontWeight:700}}>{c.package_used}</span><div style={{width:60,height:6,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(100,(c.package_used/c.package_total)*100)}%`,background:pkgColor(c),borderRadius:3}}/></div></div></td><td style={{...S.td,fontWeight:700,color:pkgRemaining(c)<=3?"#ef4444":"#10b981"}}>{pkgRemaining(c)}</td><td style={S.td}>{c.package_total}</td><td style={S.td}><span style={{padding:"3px 10px",borderRadius:20,fontSize:12,fontWeight:600,background:st.bg,color:st.color}}>{st.label}</span></td></tr>;})}
      </tbody></table></div>}
  </div>);
}

// ── REPORT STUDENTI ──────────────────────────────────────────────
function StudentReportPage({user,students,lessons,isAdmin}) {
  const [fStudent,setFStudent]=useState("");const [fYear,setFYear]=useState("");const [fMonth,setFMonth]=useState("");const [openDetail,setOpenDetail]=useState(null);
  const myStudents=isAdmin?students:students.filter(s=>s.teacher_id===user.id);
  const myLessons=isAdmin?lessons:lessons.filter(l=>l.teacher_id===user.id);
  const years=[...new Set(myLessons.map(l=>l.date.slice(0,4)))].sort().reverse();
  const months=[...new Set(myLessons.filter(l=>!fYear||l.date.startsWith(fYear)).map(l=>l.date.slice(0,7)))].sort().reverse();
  const filteredLessons=myLessons.filter(l=>(!fStudent||l.student_id===fStudent)&&(!fYear||l.date.startsWith(fYear))&&(!fMonth||l.date.startsWith(fMonth)));
  const byStudent=myStudents.map(s=>{const sl=filteredLessons.filter(l=>l.student_id===s.id);return{student:s,lessons:sl};}).filter(x=>x.lessons.length>0||(fStudent&&x.student.id===fStudent));
  return (<div style={S.page}>
    <div style={S.pageHeader}><div><h1 style={S.pageTitle}>📋 Report Studenti</h1><p style={S.pageSub}>Argomenti trattati per studente</p></div></div>
    <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap",alignItems:"center"}}>
      <select style={{...S.input,width:"auto",minWidth:180}} value={fStudent} onChange={e=>setFStudent(e.target.value)}><option value="">Tutti gli studenti</option>{myStudents.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
      <select style={{...S.input,width:"auto",minWidth:100}} value={fYear} onChange={e=>{setFYear(e.target.value);setFMonth("");}}><option value="">Anno</option>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>
      <select style={{...S.input,width:"auto",minWidth:150}} value={fMonth} onChange={e=>setFMonth(e.target.value)}><option value="">Mese</option>{months.map(m=><option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("it-IT",{month:"long",year:"numeric"})}</option>)}</select>
      {(fStudent||fYear||fMonth)&&<button style={{...S.btnSecondary,padding:"8px 14px",fontSize:12}} onClick={()=>{setFStudent("");setFYear("");setFMonth("");}}>✕ Rimuovi filtri</button>}
    </div>
    {filteredLessons.length===0&&<Empty text="Nessuna lezione trovata con i filtri selezionati"/>}
    {byStudent.length>0&&(
      <div style={{display:"flex",flexDirection:"column",gap:8}}>
        {byStudent.map(({student,lessons:sl})=>(
          <div key={student.id} style={{background:"white",borderRadius:14,border:"1px solid #f1f5f9",overflow:"hidden"}}>
            <div style={{display:"flex",alignItems:"center",gap:12,padding:"14px 18px",cursor:"pointer"}} onClick={()=>setOpenDetail(openDetail===student.id?null:student.id)}>
              <div style={{...S.studentAvatar,width:36,height:36,fontSize:12,flexShrink:0}}>{student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div>
              <div style={{flex:1}}>
                <div style={{fontWeight:700,fontSize:15}}>{student.name}</div>
                <div style={{fontSize:12,color:"#6b7280"}}>{student.company&&<>🏢 {student.company} · </>}Livello {student.level} · {sl.length} lezioni</div>
              </div>
              <div style={{background:"#f0fdf4",borderRadius:10,padding:"6px 14px",fontSize:13,color:"#166534",fontWeight:600}}>📦 {student.package_used}/{student.package_total} · {pkgRemaining(student)} rimaste</div>
              <button style={{...S.btnSm,padding:"5px 14px",fontSize:12,flexShrink:0}}>{openDetail===student.id?"▲ Chiudi":"▼ Dettagli"}</button>
            </div>
            {openDetail===student.id&&(
              <div style={{borderTop:"1px solid #f1f5f9",padding:"0 0 12px 0"}}>
                <div style={{...S.tableWrap,maxHeight:320,overflowY:"auto"}}>
                  <table style={S.table}><thead><tr><th style={S.th}>N°</th><th style={S.th}>Data</th><th style={S.th}>Ora</th><th style={S.th}>Durata</th><th style={S.th}>Argomento</th><th style={S.th}>Compiti</th><th style={S.th}>Modalità</th><th style={S.th}>Presenza</th></tr></thead>
                  <tbody>{[...sl].sort((a,b)=>a.date.localeCompare(b.date)).map((l,i)=>(
                    <tr key={l.id} style={S.tr}>
                      <td style={{...S.td,fontWeight:700,color:"#6366f1"}}>{i+1}/{student.package_total}</td>
                      <td style={S.td}>{fmtDate(l.date)}</td>
                      <td style={S.td}><span style={S.timeBadge}>{l.time||"—"}</span></td>
                      <td style={S.td}><span style={{fontSize:12,color:"#6b7280"}}>{l.duration}m</span></td>
                      <td style={{...S.td,maxWidth:200}}>{l.topic||<span style={{color:"#9ca3af",fontStyle:"italic"}}>—</span>}</td>
                      <td style={{...S.td,maxWidth:150,fontSize:12,color:"#6b7280"}}>{l.homework||"—"}</td>
                      <td style={S.td}><ModeBadge mode={l.mode}/></td>
                      <td style={S.td}><Pill ok={l.present}/></td>
                    </tr>
                  ))}</tbody></table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>);
}

// ── ARCHIVIO — identico all'originale ────────────────────────────
function ArchivePage({students,teachers,lessons,onRestore,onTrash}) {
  const [restoreModal,setRM]=useState(null);const [selected,setSel]=useState(null);const [confirmTrash,setConfirmTrash]=useState(null);const [archSearch,setArchSearch]=useState("");
  const filteredArch=students.filter(s=>!archSearch||s.name.toLowerCase().includes(archSearch.toLowerCase()));
  return (<div style={S.page}>
    <h1 style={S.pageTitle}>Archivio Studenti</h1><p style={S.pageSub}>Solo l'amministratore può accedere a questa sezione.</p>
    <div style={{display:"flex",gap:10,marginBottom:16,alignItems:"center"}}>
      <input style={{...S.input,width:"auto",minWidth:240}} placeholder="🔍 Cerca per nome…" value={archSearch} onChange={e=>setArchSearch(e.target.value)}/>
      {archSearch&&<button style={{...S.btnSecondary,padding:"8px 14px",fontSize:12}} onClick={()=>setArchSearch("")}>✕ Rimuovi</button>}
    </div>
    {students.length===0?<Empty text="L'archivio è vuoto"/>:filteredArch.length===0?<Empty text="Nessuno studente trovato"/>:(<div style={S.cardGrid}>{filteredArch.map(student=>{
      const sl=lessons.filter(l=>l.student_id===student.id);const teacher=teachers.find(t=>t.id===student.teacher_id);
      return(<div key={student.id} style={{...S.studentCard,borderLeft:"4px solid #8b5cf6"}}>
        <div style={S.cardTop}><div style={{...S.studentAvatar,background:"#8b5cf620",color:"#8b5cf6"}}>{student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={S.studentName}>{student.name}</div><div style={S.studentMeta}>Ultimo ins: {teacher?.name||"—"}</div></div><LevelBadge level={student.level}/></div>
        <div style={{marginBottom:10,fontSize:12,color:"#6b7280",display:"flex",gap:12,flexWrap:"wrap"}}>{student.phone&&<span>📞 {student.phone}</span>}{student.email&&<span>✉️ {student.email}</span>}</div>
        <div style={S.cardStats}><div style={S.miniStat}><span style={S.miniStatVal}>{sl.length}</span><span style={S.miniStatLbl}>lezioni totali</span></div><div style={S.miniStat}><span style={S.miniStatVal}>{student.package_used}/{student.package_total}</span><span style={S.miniStatLbl}>usate/tot</span></div></div>
        {student.notes&&<div style={S.cardNotes}>📝 {student.notes}</div>}
        <div style={S.cardActions}><button style={S.btnSm} onClick={()=>setSel(student)}>Scheda</button><button style={{...S.btnSm,background:"#10b98110",color:"#10b981",border:"1px solid #10b98130"}} onClick={()=>setRM(student)}>♻️ Ripristina</button><button style={{...S.btnSm,background:"#fee2e220",color:"#dc2626",border:"1px solid #fca5a5"}} onClick={()=>setConfirmTrash(student.id)}>🗑️ Cestino</button></div>
      </div>);
    })}</div>)}
    {selected&&<StudentDetailModal student={selected} lessons={lessons.filter(l=>l.student_id===selected.id)} onClose={()=>setSel(null)}/>}
    {restoreModal&&<RestoreModal student={restoreModal} teachers={teachers} onRestore={(tid)=>{onRestore(restoreModal.id,tid);setRM(null);}} onClose={()=>setRM(null)}/>}
    {confirmTrash&&<ConfirmModal title="Sposta nel cestino" text="Lo studente andrà nel cestino. Potrai recuperarlo o eliminarlo definitivamente." onConfirm={()=>{onTrash(confirmTrash);setConfirmTrash(null);}} onClose={()=>setConfirmTrash(null)}/>}
  </div>);
}

function TrashPage({students,onRestore,onDeleteForever}) {
  const [confirmDel,setConfirmDel]=useState(null);
  return (<div style={S.page}>
    <h1 style={S.pageTitle}>🗑️ Cestino</h1><p style={S.pageSub}>Gli studenti nel cestino possono essere recuperati o eliminati definitivamente.</p>
    {students.length===0?<Empty text="Il cestino è vuoto"/>:(<div style={S.cardGrid}>{students.map(student=>{
      return(<div key={student.id} style={{...S.studentCard,borderLeft:"4px solid #ef4444",opacity:0.85}}>
        <div style={S.cardTop}><div style={{...S.studentAvatar,background:"#ef444420",color:"#ef4444"}}>{student.name.split(" ").map(n=>n[0]).join("").slice(0,2)}</div><div style={{flex:1}}><div style={S.studentName}>{student.name}</div><div style={S.studentMeta}>Livello {student.level}</div></div><LevelBadge level={student.level}/></div>
        <div style={{marginBottom:10,fontSize:12,color:"#6b7280",display:"flex",gap:12,flexWrap:"wrap"}}>{student.phone&&<span>📞 {student.phone}</span>}{student.email&&<span>✉️ {student.email}</span>}</div>
        <div style={S.cardActions}>
          <button style={{...S.btnSm,background:"#10b98110",color:"#10b981",border:"1px solid #10b98130"}} onClick={()=>onRestore(student.id)}>♻️ Ripristina</button>
          <button style={{...S.btnSm,background:"#ef444420",color:"#ef4444",border:"1px solid #fca5a5"}} onClick={()=>setConfirmDel(student.id)}>❌ Elimina definitivamente</button>
        </div>
      </div>);
    })}</div>)}
    {confirmDel&&<ConfirmModal title="Elimina definitivamente" text="Attenzione: questa operazione è irreversibile. Lo studente e tutti i suoi dati verranno eliminati per sempre." onConfirm={()=>{onDeleteForever(confirmDel);setConfirmDel(null);}} onClose={()=>setConfirmDel(null)}/>}
  </div>);
}

function RestoreModal({student,teachers,onRestore,onClose}) {
  const [sel,setSel]=useState(student.teacher_id);
  return (<Overlay onClose={onClose}><h2 style={S.modalTitle}>♻️ Ripristina {student.name}</h2>
    <div style={S.field}><label style={S.label}>Assegna a insegnante</label><select style={S.input} value={sel} onChange={e=>setSel(e.target.value)}>{teachers.filter(t=>t.role==="teacher").map(t=><option key={t.id} value={t.id}>{t.name}{t.id===student.teacher_id?" (precedente)":""}</option>)}</select></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,background:"#10b981",width:"auto"}} onClick={()=>onRestore(sel)}>Ripristina</button></div>
  </Overlay>);
}

function ColorPicker({color,onChange}) {
  const [open,setOpen]=useState(false);
  return (<div style={{position:"relative",display:"inline-block"}}>
    <button onClick={()=>setOpen(o=>!o)} title="Cambia colore" style={{width:24,height:24,borderRadius:"50%",background:color||"#6366f1",border:"2px solid #e2e8f0",cursor:"pointer",display:"block"}}/>
    {open&&(<>
      <div onClick={()=>setOpen(false)} style={{position:"fixed",inset:0,zIndex:999}}/>
      <div style={{position:"absolute",top:30,left:0,zIndex:1000,background:"white",borderRadius:12,padding:10,boxShadow:"0 8px 30px rgba(0,0,0,0.15)",display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:6,width:192}}>
        {T_COLORS.map(c=>(<button key={c} onClick={()=>{onChange(c);setOpen(false);}} style={{width:22,height:22,borderRadius:"50%",background:c,border:(color===c)?"3px solid #0f172a":"2px solid transparent",cursor:"pointer",padding:0}}/>))}
      </div>
    </>)}
  </div>);
}
// ── AMMINISTRAZIONE — identica all'originale ──────────────────────
function AdminPage({teachers,students,lessons,classLessons,onAddTeacher,onDeleteTeacher,onUpdateTeacher,onReassignStudent}) {
  const [tm,setTM]=useState(false);const [confirm,setConfirm]=useState(null);const [rm,setRM]=useState(null);const [editT,setEditT]=useState(null);const [reassignSearch,setReassignSearch]=useState("");const [reassignView,setReassignView]=useState("name");
  const exportCSV=()=>{
    const rows=[["Nome","Email","Telefono","Livello","Insegnante","Pacchetto Tot","Pacchetto Usato","Rimaste","Attivo","Azienda","Note"]];
    students.forEach(s=>{
      const t=teachers.find(x=>x.id===s.teacher_id);
      rows.push([s.name,s.email||"",s.phone||"",s.level,t?.name||"",s.package_total||0,s.package_used||0,pkgRemaining(s),s.active?"Si":"No",s.company||"",s.notes||""]);
    });
    const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"` ).join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv;charset=utf-8;"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download=`studenti_${today()}.csv`;a.click();
    URL.revokeObjectURL(url);
  };
  const active=students.filter(s=>s.active);
  return (<div style={S.page}>
    <div style={S.pageHeader}><div><h1 style={S.pageTitle}>Amministrazione</h1><p style={S.pageSub}>Gestione insegnanti e riassegnazioni</p></div><div style={{display:"flex",gap:8}}><button style={{...S.btnSecondary,width:"auto"}} onClick={exportCSV}>⬇️ Backup CSV</button><button style={{...S.btnPrimary,width:"auto"}} onClick={()=>setTM(true)}>+ Nuovo Insegnante</button></div></div>
    <div style={S.section}><h2 style={S.sectionTitle}>Insegnanti</h2>
      <div style={{...S.tableWrap,overflow:"visible"}}><table style={S.table}><thead><tr><th style={S.th}>Nome</th><th style={S.th}>Email</th><th style={S.th}>Telefono</th><th style={S.th}>Colore</th><th style={S.th}>Studenti</th><th style={S.th}>Lezioni</th><th style={S.th}></th></tr></thead>
        <tbody>{teachers.filter(t=>t.role==="teacher").map(t=>{
          const lCount=lessons.filter(l=>l.teacher_id===t.id).length+classLessons.filter(l=>l.teacher_id===t.id).length;
          return(<tr key={t.id} style={S.tr}>
            <td style={S.td}><div style={{display:"flex",alignItems:"center",gap:8}}><span style={{width:10,height:10,borderRadius:"50%",background:t.color,display:"inline-block"}}/><strong>{t.name}</strong></div></td>
            <td style={S.td}>{t.email}</td><td style={S.td}>{t.phone||"—"}</td>
            <td style={S.td}><ColorPicker color={t.color} onChange={c=>onUpdateTeacher({...t,color:c})}/></td>
            <td style={S.td}>{students.filter(s=>s.teacher_id===t.id&&s.active).length}</td>
            <td style={S.td}>{lCount}</td>
            <td style={S.td}><div style={{display:"flex",gap:4}}><button style={S.iconBtn} onClick={()=>setEditT(t)}>✏️</button><button style={{...S.iconBtn,color:"#ef4444"}} onClick={()=>setConfirm(t.id)}>🗑️</button></div></td>
          </tr>);
        })}</tbody>
      </table></div>
    </div>
    <div style={S.section}><h2 style={S.sectionTitle}>Riassegna Studenti</h2>
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
        <input style={{...S.input,width:"auto",minWidth:220}} placeholder="🔍 Cerca studente per nome…" value={reassignSearch} onChange={e=>setReassignSearch(e.target.value)}/>
        <div style={{display:"flex",gap:4,background:"#f1f5f9",borderRadius:8,padding:3}}>{[["name","Per nome"],["teacher","Per insegnante"]].map(([v,l])=><button key={v} onClick={()=>setReassignView(v)} style={{padding:"5px 12px",borderRadius:6,border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:reassignView===v?"white":"transparent",color:reassignView===v?"#374151":"#9ca3af",boxShadow:reassignView===v?"0 1px 3px rgba(0,0,0,0.1)":"none"}}>{l}</button>)}</div>
        {reassignSearch&&<button style={{...S.btnSecondary,padding:"5px 12px",fontSize:12}} onClick={()=>setReassignSearch("")}>✕</button>}
      </div>
      {reassignView==="name"?(
        <div style={S.tableWrap}><table style={S.table}><thead><tr><th style={S.th}>Studente</th><th style={S.th}>Livello</th><th style={S.th}>Insegnante attuale</th><th style={S.th}></th></tr></thead>
          <tbody>{active.filter(s=>!reassignSearch||s.name.toLowerCase().includes(reassignSearch.toLowerCase())).map(s=>{const t=teachers.find(x=>x.id===s.teacher_id);return(<tr key={s.id} style={S.tr}><td style={S.td}><strong>{s.name}</strong></td><td style={S.td}><LevelBadge level={s.level}/></td><td style={S.td}>{t?.name||"—"}</td><td style={S.td}><button style={{...S.btnSm,flex:"none",width:"auto",padding:"6px 14px"}} onClick={()=>setRM(s)}>🔄 Riassegna</button></td></tr>);})}</tbody>
        </table></div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {teachers.filter(t=>t.role==="teacher").map(t=>{
            const ts=active.filter(s=>s.teacher_id===t.id&&(!reassignSearch||s.name.toLowerCase().includes(reassignSearch.toLowerCase())));
            if(ts.length===0&&!reassignSearch) return null;
            return(<div key={t.id} style={{background:"white",borderRadius:12,border:"1px solid #f1f5f9",overflow:"hidden"}}>
              <div style={{background:"#f8fafc",padding:"10px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:8}}>
                <span style={{width:10,height:10,borderRadius:"50%",background:t.color,display:"inline-block"}}/>
                <span style={{fontWeight:700,fontSize:14,color:t.color}}>{t.name}</span>
                <span style={{fontSize:12,color:"#9ca3af",marginLeft:4}}>{ts.length} studenti</span>
              </div>
              {ts.length===0?<div style={{padding:"10px 16px",fontSize:13,color:"#9ca3af"}}>Nessuno studente</div>:
              <table style={S.table}><thead><tr><th style={S.th}>Studente</th><th style={S.th}>Livello</th><th style={S.th}></th></tr></thead>
                <tbody>{ts.map(s=>(<tr key={s.id} style={S.tr}><td style={S.td}><strong>{s.name}</strong></td><td style={S.td}><LevelBadge level={s.level}/></td><td style={S.td}><button style={{...S.btnSm,flex:"none",width:"auto",padding:"6px 14px"}} onClick={()=>setRM(s)}>🔄 Riassegna</button></td></tr>))}</tbody>
              </table>}
            </div>);
          })}
        </div>
      )}
    </div>
    {(tm||editT)&&<TeacherModal teacher={editT} onSave={t=>{editT?onUpdateTeacher(t):onAddTeacher(t);setTM(false);setEditT(null);}} onClose={()=>{setTM(false);setEditT(null);}}/>}
    {confirm&&<ConfirmModal title="Rimuovi insegnante" text="I dati resteranno." onConfirm={()=>{onDeleteTeacher(confirm);setConfirm(null);}} onClose={()=>setConfirm(null)}/>}
    {rm&&<ReassignModal student={rm} teachers={teachers.filter(t=>t.role==="teacher")} onReassign={(tid)=>{onReassignStudent(rm.id,tid);setRM(null);}} onClose={()=>setRM(null)}/>}
  </div>);
}

function TeacherModal({teacher,onSave,onClose}) {
  const [form,setForm]=useState(teacher||{name:"",email:"",password:"",phone:""});
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  return (<Overlay onClose={onClose}><h2 style={S.modalTitle}>{teacher?"Modifica Insegnante":"Nuovo Insegnante"}</h2>
    <div style={S.field}><label style={S.label}>Nome</label><input style={S.input} value={form.name} onChange={e=>set("name",e.target.value)}/></div>
    <div style={S.field}><label style={S.label}>Email</label><input style={S.input} type="email" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
    <div style={S.fieldRow}>
      <div style={S.field}><label style={S.label}>Password</label><input style={S.input} value={form.password} onChange={e=>set("password",e.target.value)}/></div>
      <div style={S.field}><label style={S.label}>Telefono</label><input style={S.input} value={form.phone||""} onChange={e=>set("phone",e.target.value)} placeholder="347-0000000"/></div>
    </div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={!form.name||!form.email} onClick={()=>onSave(form)}>{teacher?"Salva":"Aggiungi"}</button></div>
  </Overlay>);
}

function ReassignModal({student,teachers,onReassign,onClose}) {
  const [sel,setSel]=useState(student.teacher_id);
  return (<Overlay onClose={onClose}><h2 style={S.modalTitle}>🔄 Riassegna {student.name}</h2>
    <div style={S.field}><label style={S.label}>Nuovo insegnante</label><select style={S.input} value={sel} onChange={e=>setSel(e.target.value)}>{teachers.map(t=><option key={t.id} value={t.id}>{t.name}{t.id===student.teacher_id?" (attuale)":""}</option>)}</select></div>
    <div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,width:"auto"}} disabled={sel===student.teacher_id} onClick={()=>onReassign(sel)}>Conferma</button></div>
  </Overlay>);
}

// ── COMPONENTI CONDIVISI — identici all'originale ─────────────────
function LevelBadge({level,small}) {
  const color=level<=15?"#10b981":level<=30?"#6366f1":level<=45?"#f59e0b":"#ef4444";
  return <span style={{background:color+"18",color,borderRadius:small?5:8,padding:small?"2px 6px":"4px 10px",fontSize:small?10:12,fontWeight:700,whiteSpace:"nowrap"}}>Liv. {level}</span>;
}
function LessonCounter({current,total}) {
  const over=total>0&&current>total;const color=over?"#ef4444":"#6366f1";
  return <span style={{fontFamily:"monospace",fontSize:12,fontWeight:700,color,background:color+"12",borderRadius:6,padding:"2px 8px",whiteSpace:"nowrap"}}>{current}/{total||"?"}</span>;
}
function PkgBar({used,total}) {
  const r=total-used;const pct=total>0?Math.min(100,(used/total)*100):0;const color=r<=0?"#ef4444":r<=3?"#f59e0b":"#10b981";
  return (<div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}><span style={{fontSize:12,fontWeight:700,color}}>{used}/{total}</span><div style={{width:60,height:5,background:"#f1f5f9",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:3}}/></div></div>);
}
function ModeBadge({mode,zoom}) {
  if(!mode||mode==="presenza") return <span style={{display:"inline-flex",alignItems:"center",gap:3,background:"#f0fdf4",color:"#16a34a",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap"}}>🏫 Presenza</span>;
  return (<span title={zoom?`Zoom: ${zoom}`:""} style={{display:"inline-flex",alignItems:"center",gap:3,background:"#eff6ff",color:"#2563eb",borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:600,whiteSpace:"nowrap",cursor:zoom?"help":"default"}}>💻 Zoom{zoom?` · ${zoom}`:""}</span>);
}
function Pill({ok}) {
  return <span style={{display:"inline-flex",alignItems:"center",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600,...(ok?{background:"#d1fae5",color:"#065f46"}:{background:"#fee2e2",color:"#991b1b"})}}>{ok?"✓ Presente":"✗ Assente"}</span>;
}
function Empty({text}) {
  return <div style={S.empty}><div style={S.emptyIcon}>📭</div><div>{text}</div></div>;
}
function Overlay({onClose,children,wide}) {
  return (<div style={S.overlayBg} onClick={e=>e.target===e.currentTarget&&onClose()}><div style={{...S.overlayCard,maxWidth:wide?700:480}}>{children}</div></div>);
}
function ConfirmModal({title,text,onConfirm,onClose}) {
  return (<Overlay onClose={onClose}><h2 style={S.modalTitle}>⚠️ {title}</h2><p style={{color:"#6b7280",marginBottom:24}}>{text}</p><div style={S.modalActions}><button style={S.btnSecondary} onClick={onClose}>Annulla</button><button style={{...S.btnPrimary,background:"#ef4444",width:"auto"}} onClick={onConfirm}>Conferma</button></div></Overlay>);
}

// ── CSS & STYLES — identici all'originale + nuove animazioni ──────
const CSS=`
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&display=swap');
  *{box-sizing:border-box}body{margin:0}
  ::-webkit-scrollbar{width:6px;height:6px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#cbd5e1;border-radius:3px}
  input:focus,select:focus,textarea:focus{border-color:#6366f1!important;box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important;outline:none}
  button:hover{filter:brightness(0.93)}.nav-item:hover{background:#1e293b!important;color:#e2e8f0!important}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}.page-anim{animation:fadeIn 0.2s ease}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes loadbar{0%{transform:translateX(-100%)}100%{transform:translateX(400%)}}
`;
const S={
  app:{display:"flex",height:"100vh",overflow:"hidden",background:"#f8fafc",fontFamily:"'DM Sans',system-ui,sans-serif"},
  main:{flex:1,overflowY:"auto",height:"100vh"},
  loadingBar:{position:"fixed",top:0,left:0,right:0,height:3,zIndex:9998,background:"#e2e8f0",overflow:"hidden"},
  loadingBarFill:{height:"100%",width:"30%",background:"linear-gradient(90deg,#6366f1,#818cf8)",animation:"loadbar 1s ease infinite"},
  loginBg:{display:"flex",alignItems:"center",justifyContent:"center",minHeight:"100vh",background:"linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#0f172a 100%)",padding:20},
  loginCard:{background:"white",borderRadius:20,padding:"48px 40px",width:"100%",maxWidth:400,boxShadow:"0 25px 60px rgba(0,0,0,0.3)"},
  loginLogo:{fontSize:48,textAlign:"center",marginBottom:8},loginTitle:{textAlign:"center",fontSize:26,fontWeight:800,color:"#0f172a",margin:"0 0 4px"},loginSub:{textAlign:"center",color:"#6b7280",fontSize:14,marginBottom:32},
  sidebar:{width:240,background:"#0f172a",display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,flexShrink:0,overflow:"hidden"},
  sidebarTop:{padding:"28px 20px 20px",borderBottom:"1px solid #1e293b",display:"flex",alignItems:"center",gap:10},
  sidebarLogo:{fontSize:28},sidebarBrand:{color:"white",fontWeight:700,fontSize:15},
  nav:{flex:1,padding:"16px 12px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"},
  navItem:{display:"flex",alignItems:"center",gap:10,padding:"9px 14px",borderRadius:10,background:"transparent",border:"none",color:"#94a3b8",cursor:"pointer",fontSize:13,fontWeight:500,textAlign:"left",transition:"all 0.15s"},
  navItemActive:{background:"#1e293b",color:"white"},navIcon:{fontSize:16,width:22,textAlign:"center"},
  badge:{marginLeft:"auto",background:"#8b5cf6",color:"white",borderRadius:20,fontSize:11,padding:"2px 8px",fontWeight:700},
  sidebarBottom:{padding:"16px 12px",borderTop:"1px solid #1e293b"},
  userChip:{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",marginBottom:8},
  avatar:{width:36,height:36,borderRadius:"50%",background:"#6366f1",color:"white",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:15,flexShrink:0},
  userName:{color:"white",fontSize:13,fontWeight:600},userRole:{color:"#64748b",fontSize:11},
  logoutBtn:{width:"100%",padding:"8px 14px",background:"transparent",border:"1px solid #1e293b",color:"#64748b",borderRadius:8,cursor:"pointer",fontSize:13},
  page:{padding:"36px 40px",maxWidth:1200,margin:"0 auto"},
  pageHeader:{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28,gap:16},
  pageTitle:{fontSize:28,fontWeight:800,color:"#0f172a",margin:"0 0 4px"},pageSub:{color:"#6b7280",fontSize:14,margin:0},
  section:{marginTop:32},sectionTitle:{fontSize:18,fontWeight:700,color:"#0f172a",marginBottom:16},
  card:{background:"white",borderRadius:16,padding:20,border:"1px solid #f1f5f9",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"},
  statsGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:16,marginBottom:28},
  statCard:{background:"white",borderRadius:16,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9"},
  statIcon:{width:44,height:44,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,marginBottom:12},
  statValue:{fontSize:28,fontWeight:800,color:"#0f172a",lineHeight:1},statLabel:{fontSize:12,color:"#6b7280",marginTop:4},
  cardGrid:{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:20},
  studentCard:{background:"white",borderRadius:16,padding:20,boxShadow:"0 1px 3px rgba(0,0,0,0.08)",border:"1px solid #f1f5f9"},
  cardTop:{display:"flex",alignItems:"center",gap:12,marginBottom:14},
  studentAvatar:{width:44,height:44,borderRadius:"50%",background:"#6366f120",color:"#6366f1",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:16,flexShrink:0},
  studentName:{fontWeight:700,fontSize:15,color:"#0f172a"},studentMeta:{fontSize:12,color:"#6b7280"},
  cardStats:{display:"flex",gap:8,marginBottom:12},
  miniStat:{flex:1,background:"#f8fafc",borderRadius:8,padding:"7px 6px",textAlign:"center"},
  miniStatVal:{display:"block",fontWeight:700,fontSize:13,color:"#0f172a"},miniStatLbl:{display:"block",fontSize:10,color:"#9ca3af",marginTop:2},
  cardNotes:{fontSize:12,color:"#6b7280",background:"#fffbeb",borderRadius:8,padding:"8px 12px",marginBottom:12},
  cardActions:{display:"flex",gap:8},
  tableWrap:{background:"white",borderRadius:16,border:"1px solid #f1f5f9",overflow:"hidden",boxShadow:"0 1px 3px rgba(0,0,0,0.06)"},
  table:{width:"100%",borderCollapse:"collapse"},
  th:{padding:"12px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#6b7280",textTransform:"uppercase",letterSpacing:"0.05em",background:"#f8fafc",borderBottom:"1px solid #f1f5f9"},
  tr:{borderBottom:"1px solid #f8fafc"},td:{padding:"12px 16px",fontSize:14,color:"#374151",verticalAlign:"middle"},
  pill:{display:"inline-flex",alignItems:"center",borderRadius:20,padding:"3px 10px",fontSize:12,fontWeight:600},
  timeBadge:{display:"inline-flex",alignItems:"center",background:"#eff6ff",color:"#3b82f6",borderRadius:6,padding:"2px 8px",fontSize:12,fontWeight:600,fontFamily:"monospace"},
  todayItem:{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f8fafc",borderRadius:10,marginBottom:8,borderLeft:"3px solid #6366f1"},
  alertItem:{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#fffbeb",borderRadius:10,marginBottom:8,borderLeft:"3px solid #f59e0b"},
  emptySmall:{textAlign:"center",padding:"24px 0",color:"#9ca3af",fontSize:13},
  field:{marginBottom:16,flex:1},fieldRow:{display:"flex",gap:12},
  label:{display:"block",fontSize:13,fontWeight:600,color:"#374151",marginBottom:6},
  input:{width:"100%",padding:"10px 14px",border:"1.5px solid #e2e8f0",borderRadius:10,fontSize:14,color:"#0f172a",background:"white",outline:"none",boxSizing:"border-box",fontFamily:"inherit",transition:"border-color 0.15s"},
  error:{background:"#fee2e2",color:"#991b1b",borderRadius:8,padding:"10px 14px",fontSize:13,marginBottom:16},
  btnPrimary:{padding:"11px 22px",background:"#6366f1",color:"white",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",width:"100%",transition:"filter 0.15s"},
  btnSecondary:{padding:"11px 22px",background:"#f1f5f9",color:"#374151",border:"none",borderRadius:10,fontSize:14,fontWeight:600,cursor:"pointer"},
  btnSm:{flex:1,padding:"7px 12px",background:"#f1f5f9",color:"#374151",border:"1px solid #e2e8f0",borderRadius:8,fontSize:12,fontWeight:600,cursor:"pointer"},
  btnDanger:{background:"#fee2e220",color:"#ef4444",border:"1px solid #fecaca"},
  iconBtn:{padding:"6px 8px",background:"transparent",border:"none",cursor:"pointer",fontSize:16,borderRadius:6},
  overlayBg:{position:"fixed",inset:0,background:"rgba(15,23,42,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:20},
  overlayCard:{background:"white",borderRadius:20,padding:32,width:"100%",maxHeight:"90vh",overflowY:"auto",boxShadow:"0 25px 60px rgba(0,0,0,0.25)"},
  modalTitle:{fontSize:20,fontWeight:800,color:"#0f172a",marginBottom:24,marginTop:0},
  modalActions:{display:"flex",gap:12,justifyContent:"flex-end",marginTop:8},
  empty:{textAlign:"center",padding:"60px 20px",color:"#9ca3af",fontSize:15},emptyIcon:{fontSize:40,marginBottom:12},
};
