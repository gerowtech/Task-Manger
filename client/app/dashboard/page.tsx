'use client';
import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { readJson, apiFetch } from '../../lib/api';

const API='/api';
type Stats={users:number;projects:number;tasks:number;completedTasks:number;overdueTasks:number;taskStatus:{status:string;count:number}[];projectStatus:{status:string;count:number}[];recentTasks:any[];recentProjects:any[]};
const colors:Record<string,string>={'To Do':'blue','In Progress':'orange','Review':'violet','Completed':'green','Cancelled':'red'};
function badgeClass(value:string){return `badge badge-${colors[value]||'slate'}`}

export default function Dashboard(){
 const [stats,setStats]=useState<Stats|null>(null); const [error,setError]=useState('');
 useEffect(()=>{const token=localStorage.getItem('accessToken');if(!token){window.location.href='/';return;}apiFetch(`${API}/dashboard`,{headers:{Authorization:`Bearer ${token}`}}).then(async r=>{const d=await readJson(r);if(!r.ok)throw new Error(d.message||'Unable to load dashboard');setStats(d)}).catch(e=>setError(e instanceof Error?e.message:'Unable to load dashboard'))},[]);
 const taskTotal=useMemo(()=>stats?.taskStatus.reduce((a,b)=>a+b.count,0)||0,[stats]);
 const projectMax=Math.max(...(stats?.projectStatus.map(x=>x.count)||[1]),1);
 return <AdminLayout active="Dashboard" title="Dashboard">
   {error&&<div className="alert">{error}</div>}
   <section className="stat-grid">
    {[
      ["TOTAL USERS",stats?.users??'—','blue',<i className="fa-solid fa-users" aria-hidden="true"></i>],
      ["TOTAL PROJECTS",stats?.projects??'—','green',<i className="fa-solid fa-folder-open" aria-hidden="true"></i>],
      ["TOTAL TASKS",stats?.tasks??'—','orange',<i className="fa-solid fa-list-check" aria-hidden="true"></i>],
      ["COMPLETED TASKS",stats?.completedTasks??'—','red',<i className="fa-solid fa-circle-check" aria-hidden="true"></i>]
    ].map(([label,value,color,icon])=><div className={`stat-card ${color}`} key={String(label)}><div className="stat-icon">{icon}</div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-footer">View more... <span>›</span></div></div>)}
   </section>
   <section className="panel-grid">
    <div className="panel"><div className="panel-head"><h2>Task Status Overview</h2><button>▣</button></div><div className="task-overview"><div className="donut" style={{background:taskTotal?'conic-gradient(#2f80ed 0 31%,#f59e0b 31% 56%,#8b5cf6 56% 68%,#22a06b 68% 93%,#ef4444 93% 100%)':''}}><div><strong>{taskTotal}</strong><span>Tasks</span></div></div><div className="legend">{stats?.taskStatus.map(x=><div className="legend-row" key={x.status}><span className={`dot dot-${colors[x.status]||'blue'}`}></span><span>{x.status}</span><b>{x.count} {taskTotal?`(${Math.round(x.count/taskTotal*100)}%)`:''}</b></div>)||<div className="muted">Loading...</div>}</div></div></div>
    <div className="panel"><div className="panel-head"><h2>Project Overview</h2><select><option>Projects</option></select></div><div className="bars">{stats?.projectStatus.map(x=><div className="bar-col" key={x.status}><div className="bar-value">{x.count}</div><div className="bar" style={{height:`${Math.max(8,x.count/projectMax*150)}px`}}></div><span>{x.status}</span></div>)||<div className="muted">Loading...</div>}</div></div>
   </section>
   <section className="bottom-grid">
    <div className="panel activity"><div className="panel-head"><h2>Recent Activity</h2><a href="/tasks">View all</a></div>{(stats?.recentTasks||[]).slice(0,5).map((t,i)=><div className="activity-row" key={t._id||i}><div className={`activity-icon a-${i%5}`}>{i===0?'✓':i===1?'↻':i===2?'●':'▰'}</div><div><strong>{i===0?'Task updated':i===1?'Task status updated':i===2?'New task assigned':'Project activity'}</strong><span>{t.title}</span></div><time>{i+1}h ago</time></div>)}</div>
    <div className="panel latest"><div className="panel-head"><h2>Latest Tasks</h2><a href="/tasks">View all</a></div><div className="table-wrap"><table><thead><tr><th>#</th><th>Title</th><th>Project</th><th>Assigned To</th><th>Status</th><th>Priority</th><th>Due Date</th><th>Action</th></tr></thead><tbody>{stats?.recentTasks.map((t,i)=><tr key={t._id}><td>{i+1}</td><td><strong>{t.title}</strong></td><td>{t.project?.name||'—'}</td><td>{t.assignedTo?.name||'Unassigned'}</td><td><span className={badgeClass(t.status)}>{t.status}</span></td><td><span className={`priority priority-${String(t.priority).toLowerCase()}`}>{t.priority}</span></td><td>{t.dueDate?new Date(t.dueDate).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}):'—'}</td><td><a className="view-btn" href={`/tasks/${t._id}`}>◉</a></td></tr>)||<tr><td colSpan={8} className="empty">Loading...</td></tr>}</tbody></table></div></div>
   </section>
 </AdminLayout>;
}
