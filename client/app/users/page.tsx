'use client';
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { readJson, apiFetch } from '../../lib/api';
const API='/api';
type Role={_id:string;name:string};
type User={_id:string;name:string;email:string;phone?:string;status:string;role?:Role;createdAt?:string};
const headers=()=>({Authorization:`Bearer ${localStorage.getItem('accessToken')||''}`,'Content-Type':'application/json'});

export default function UsersPage(){
 const [rows,setRows]=useState<User[]>([]),[selected,setSelected]=useState<string[]>([]);
 const [error,setError]=useState(''),[loading,setLoading]=useState(true),[page,setPage]=useState(1),[totalPages,setTotalPages]=useState(1),[total,setTotal]=useState(0),[limit,setLimit]=useState(10);
 async function load(targetPage=page){
  setLoading(true); setError('');
  try{
   const params=new URLSearchParams({page:String(targetPage),limit:String(limit)});
   const r=await apiFetch(`${API}/users?${params.toString()}`,{headers:headers()}); const d=await readJson(r);
   if(!r.ok) throw Error(d.message||'Unable to load users');
   setRows(Array.isArray(d)?d:(d.users||[])); setPage(d.page||targetPage); setTotalPages(d.totalPages||1); setTotal(d.total??0);
  }catch(e){setError(e instanceof Error?e.message:'Unable to load users')}finally{setLoading(false)}
 }
 useEffect(()=>{if(!localStorage.getItem('accessToken')){location.href='/';return}load(1)},[limit]);
 async function remove(u:User){if(!confirm(`Delete ${u.name}?`))return;try{const r=await apiFetch(`${API}/users/${u._id}`,{method:'DELETE',headers:headers()});const d=await readJson(r);if(!r.ok)throw Error(d.message||'Delete failed');setSelected(v=>v.filter(id=>id!==u._id));load(page)}catch(e){setError(e instanceof Error?e.message:'Delete failed')}}
 async function removeSelected(){if(!selected.length){setError('Select at least one user to delete.');return} if(!confirm(`Delete ${selected.length} selected user${selected.length>1?'s':''}?`))return; try{for(const id of selected){const r=await apiFetch(`${API}/users/${id}`,{method:'DELETE',headers:headers()});const d=await readJson(r);if(!r.ok)throw Error(d.message||'Delete failed')}setSelected([]);load(page)}catch(e){setError(e instanceof Error?e.message:'Delete failed')}}
 const toggle=(id:string)=>setSelected(v=>v.includes(id)?v.filter(x=>x!==id):[...v,id]);
 const toggleAll=()=>setSelected(selected.length===rows.length?[]:rows.map(u=>u._id));
 const go=(p:number)=>{if(p>=1&&p<=totalPages&&p!==page)load(p)};
 const pages=Array.from({length:totalPages},(_,i)=>i+1); const from=total===0?0:(page-1)*limit+1; const to=Math.min(page*limit,total);
 return <AdminLayout active="Users" title="Users" actions={<><a className="oc-add page-action" href="/users/create" title="Add User"><i className="fa-solid fa-plus" /></a><button className="oc-delete page-action" onClick={removeSelected} title="Delete Selected"><i className="fa-regular fa-trash-can" /></button></>}>
  <section className="panel user-list-panel">
   <div className="panel-head"><h2><i className="fa-solid fa-list" /> User List</h2></div>
   {error&&<div className="alert">{error}</div>}
   <div className="table-wrap"><table className="oc-table"><thead><tr><th className="check-col"><input type="checkbox" checked={rows.length>0&&selected.length===rows.length} onChange={toggleAll} /></th><th>Username <span className="sort-arrow">⌃</span></th><th>Status</th><th>Date Added</th><th>Action</th></tr></thead><tbody>{loading?<tr><td colSpan={5} className="empty">Loading users...</td></tr>:rows.length===0?<tr><td colSpan={5} className="empty">No users found.</td></tr>:rows.map(u=><tr key={u._id}><td><input type="checkbox" checked={selected.includes(u._id)} onChange={()=>toggle(u._id)} /></td><td><strong>{u.name}</strong></td><td>{u.status==='Active'?'Enabled':u.status}</td><td>{u.createdAt?new Date(u.createdAt).toLocaleDateString('en-GB'):'—'}</td><td><a className="oc-edit" href={`/users/${u._id}/edit`} title="Edit"><i className="fa-solid fa-pen" /></a></td></tr>)}</tbody></table></div>
   <div className="oc-list-footer"><div className="pagination"><button onClick={()=>go(1)} disabled={page===1}>«</button><button onClick={()=>go(page-1)} disabled={page===1}>‹</button>{pages.map(p=><button key={p} className={p===page?'active-page':''} onClick={()=>go(p)}>{p}</button>)}<button onClick={()=>go(page+1)} disabled={page===totalPages}>›</button><button onClick={()=>go(totalPages)} disabled={page===totalPages}>»</button></div><span>Showing {from} to {to} of {total}</span></div>
  </section>
 </AdminLayout>
}
