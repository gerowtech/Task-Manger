'use client';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { readJson, apiFetch } from '../../lib/api';

const API='/api';
type User={_id:string;name:string;email:string;role?:{name:string}};
type Project={_id:string;name:string;key:string;description?:string;owner?:User;members?:User[];status:string;priority:string;startDate?:string;dueDate?:string;createdAt:string;updatedAt:string};

const statusColors:Record<string,string>={Planning:'slate',Active:'blue','On Hold':'orange',Completed:'green',Cancelled:'red'};
const priorityColors:Record<string,string>={Low:'low',Medium:'medium',High:'high',Critical:'critical'};

function fmtDate(v?:string){return v?new Date(v).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}
function badge(v:string){return `badge badge-${statusColors[v]||'slate'}`}
function priority(v:string){return `priority priority-${priorityColors[v]||'medium'}`}

export default function ProjectsPage(){
  const [projects,setProjects]=useState<Project[]>([]);
  const [users,setUsers]=useState<User[]>([]);
  const [user,setUser]=useState<User|null>(null);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<Project|null>(null);
  const [search,setSearch]=useState('');
  const [status,setStatus]=useState('All');
  const [priorityFilter,setPriorityFilter]=useState('All');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({name:'',key:'',description:'',owner:'',status:'Planning',priority:'Medium',startDate:'',dueDate:''});

  const token=typeof window!=='undefined'?localStorage.getItem('accessToken'):null;
  const headers=()=>({Authorization:`Bearer ${localStorage.getItem('accessToken')||''}`});

  async function load(){
    setLoading(true);setError('');
    try{
      const [p,u]=await Promise.all([
        apiFetch(`${API}/projects`,{headers:headers()}),
        apiFetch(`${API}/users`,{headers:headers()})
      ]);
      if(!p.ok){const d=await readJson(p).catch(()=>({}));throw new Error(d.message||'Unable to load projects');}
      const pd=await readJson(p); const ud=u.ok?await readJson(u):[];
      setProjects(pd);setUsers(ud);
      const saved=localStorage.getItem('user');if(saved)try{setUser(JSON.parse(saved))}catch{}
    }catch(e){setError(e instanceof Error?e.message:'Unable to load projects')}
    finally{setLoading(false)}
  }
  useEffect(()=>{if(!token){window.location.href='/';return;}load()},[]);

  const filtered=useMemo(()=>projects.filter(p=>{
    const q=search.toLowerCase();
    return (!q||p.name.toLowerCase().includes(q)||p.key.toLowerCase().includes(q)||(p.description||'').toLowerCase().includes(q))
      &&(status==='All'||p.status===status)&&(priorityFilter==='All'||p.priority===priorityFilter)
  }),[projects,search,status,priorityFilter]);

  const counts=useMemo(()=>({total:projects.length,active:projects.filter(x=>x.status==='Active').length,planning:projects.filter(x=>x.status==='Planning').length,completed:projects.filter(x=>x.status==='Completed').length}),[projects]);

  function openCreate(){setEditing(null);setForm({name:'',key:'',description:'',owner:users[0]?._id||'',status:'Planning',priority:'Medium',startDate:'',dueDate:''});setOpen(true);}
  function openEdit(p:Project){setEditing(p);setForm({name:p.name,key:p.key,description:p.description||'',owner:p.owner?._id||'',status:p.status,priority:p.priority,startDate:p.startDate?p.startDate.slice(0,10):'',dueDate:p.dueDate?p.dueDate.slice(0,10):''});setOpen(true)}
  async function save(e:FormEvent){e.preventDefault();setSaving(true);setError('');
    try{
      const body={...form,startDate:form.startDate||undefined,dueDate:form.dueDate||undefined};
      const url=editing?`${API}/projects/${editing._id}`:`${API}/projects`;
      const r=await fetch(url,{method:editing?'PUT':'POST',headers:{...headers(),'Content-Type':'application/json'},body:JSON.stringify(body)});
      const d=await readJson(r);if(!r.ok)throw new Error(d.message||'Unable to save project');
      setOpen(false);await load();
    }catch(e){setError(e instanceof Error?e.message:'Unable to save project')}
    finally{setSaving(false)}
  }
  async function remove(p:Project){if(!confirm(`Delete project "${p.name}"?`))return;setError('');try{const r=await apiFetch(`${API}/projects/${p._id}`,{method:'DELETE',headers:headers()});const d=await readJson(r);if(!r.ok)throw new Error(d.message||'Unable to delete project');await load()}catch(e){setError(e instanceof Error?e.message:'Unable to delete project')}}

  return <AdminLayout active="Projects" title="Projects">
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:18}}><button className="save-btn" onClick={openCreate} title="Add User" aria-label="Add User"><i className="fa-solid fa-plus" aria-hidden="true"></i> New Project</button></div>
        {error&&<div className="alert">{error}</div>}
        <section className="stat-grid project-stats">
          <div className="stat-card blue"><div className="stat-icon">▰</div><div className="stat-label">TOTAL PROJECTS</div><div className="stat-value">{counts.total}</div><div className="stat-footer">All projects <span>›</span></div></div>
          <div className="stat-card green"><div className="stat-icon">✓</div><div className="stat-label">ACTIVE PROJECTS</div><div className="stat-value">{counts.active}</div><div className="stat-footer">Currently active <span>›</span></div></div>
          <div className="stat-card orange"><div className="stat-icon">◷</div><div className="stat-label">PLANNING</div><div className="stat-value">{counts.planning}</div><div className="stat-footer">In planning <span>›</span></div></div>
          <div className="stat-card red"><div className="stat-icon">✓</div><div className="stat-label">COMPLETED</div><div className="stat-value">{counts.completed}</div><div className="stat-footer">Finished projects <span>›</span></div></div>
        </section>

        <section className="panel project-toolbar"><div className="toolbar-search"><span><i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i></span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search projects by name, key or description..."/></div><div className="toolbar-filters"><select value={status} onChange={e=>setStatus(e.target.value)}><option>All</option><option>Planning</option><option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option></select><select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)}><option>All</option><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><button className="refresh-btn" onClick={load}>↻ Refresh</button></div></section>

        <section className="panel latest project-table"><div className="panel-head"><h2>All Projects</h2><span className="result-count">{filtered.length} project{filtered.length===1?'':'s'}</span></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Project</th><th>Owner</th><th>Status</th><th>Priority</th><th>Start Date</th><th>Due Date</th><th>Members</th><th>Actions</th></tr></thead><tbody>
          {loading?<tr><td colSpan={9} className="empty">Loading projects...</td></tr>:filtered.length===0?<tr><td colSpan={9} className="empty">No projects found.</td></tr>:filtered.map((p,i)=><tr key={p._id}><td>{i+1}</td><td><div className="project-name-cell"><div className="project-avatar">{p.key.slice(0,2)}</div><div><strong>{p.name}</strong><span>{p.key} · {p.description||'No description'}</span></div></div></td><td>{p.owner?.name||'—'}</td><td><span className={badge(p.status)}>{p.status}</span></td><td><span className={priority(p.priority)}>{p.priority}</span></td><td>{fmtDate(p.startDate)}</td><td>{fmtDate(p.dueDate)}</td><td><span className="member-count">{p.members?.length||0}</span></td><td><div className="action-group"><button className="action view" title="View">◉</button><button className="action edit" title="Edit" onClick={()=>openEdit(p)}><i className="fa-solid fa-pen-to-square" aria-hidden="true"></i></button><button className="action delete" title="Delete" onClick={()=>remove(p)}>×</button></div></td></tr>)}
        </tbody></table></div></section>

        <section className="panel-grid project-bottom"><div className="panel"><div className="panel-head"><h2>Project Status</h2></div><div className="status-summary">{['Planning','Active','On Hold','Completed','Cancelled'].map(s=>{const n=projects.filter(p=>p.status===s).length;const pct=projects.length?Math.round(n/projects.length*100):0;return <div className="status-line" key={s}><div><span className={`dot dot-${statusColors[s]||'slate'}`}></span>{s}<b>{n}</b></div><div className="progress"><i style={{width:`${pct}%`}}/></div></div>})}</div></div><div className="panel"><div className="panel-head"><h2>Upcoming Deadlines</h2><a href="/tasks">View tasks</a></div><div className="deadline-list">{projects.filter(p=>p.dueDate).sort((a,b)=>new Date(a.dueDate!).getTime()-new Date(b.dueDate!).getTime()).slice(0,5).map(p=><div className="deadline-row" key={p._id}><div><strong>{p.name}</strong><span>{p.key}</span></div><b>{fmtDate(p.dueDate)}</b></div>)}{projects.filter(p=>p.dueDate).length===0&&<div className="empty">No upcoming deadlines.</div>}</div></div></section>

    {open&&<div className="modal-backdrop"><div className="project-modal"><div className="modal-head"><div><h2>{editing?'Edit Project':'Create Project'}</h2><span>{editing?'Update project information':'Add a new project to your workspace'}</span></div><button onClick={()=>setOpen(false)}>×</button></div><form onSubmit={save}><div className="form-grid"><label>Project Name<input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="e.g. Website Redesign"/></label><label>Project Key<input required value={form.key} onChange={e=>setForm({...form,key:e.target.value.toUpperCase()})} placeholder="e.g. WEB-01"/></label><label className="full">Description<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} placeholder="Describe the project..." rows={3}/></label><label>Owner<select required value={form.owner} onChange={e=>setForm({...form,owner:e.target.value})}><option value="">Select owner</option>{users.map(u=><option key={u._id} value={u._id}>{u.name} — {u.email}</option>)}</select></label><label>Status<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Planning</option><option>Active</option><option>On Hold</option><option>Completed</option><option>Cancelled</option></select></label><label>Priority<select value={form.priority} onChange={e=>setForm({...form,priority:e.target.value})}><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select></label><label>Start Date<input type="date" value={form.startDate} onChange={e=>setForm({...form,startDate:e.target.value})}/></label><label>Due Date<input type="date" value={form.dueDate} onChange={e=>setForm({...form,dueDate:e.target.value})}/></label></div><div className="modal-actions"><button type="button" className="cancel-btn" onClick={()=>setOpen(false)}>Cancel</button><button className="save-btn" disabled={saving}>{saving?'Saving...':editing?'Update Project':'Create Project'}</button></div></form></div></div>}
  </AdminLayout>
}
