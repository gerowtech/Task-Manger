'use client';

import { apiFetch } from '../lib/api';
import { ReactNode, useEffect, useRef, useState } from 'react';

const API='/api';
export const menu=[
 {label:'Dashboard',href:'/dashboard',icon:'fa-house'},
 {label:'Users',href:'/users',icon:'fa-users'},
 {label:'Roles & Permissions',href:'/permissions',icon:'fa-shield-halved'},
 {label:'Projects',href:'/projects',icon:'fa-folder-open'},
 {label:'Tasks',href:'/tasks',icon:'fa-list-check'},
 {label:'Reports',href:'/reports',icon:'fa-chart-column'},
];

type Notice={id:number;icon:string;title:string;message:string;time:string;href:string;read:boolean;tone:string};

const defaultNotifications:Notice[]=[
 {id:1,icon:'fa-list-check',title:'New task assigned',message:'You have a new task waiting for your attention.',time:'Just now',href:'/tasks',read:false,tone:'blue'},
 {id:2,icon:'fa-clock',title:'Deadline reminder',message:'A project deadline is approaching.',time:'10 minutes ago',href:'/projects',read:false,tone:'orange'},
 {id:3,icon:'fa-circle-check',title:'Task completed',message:'A team task was marked as completed.',time:'1 hour ago',href:'/tasks',read:false,tone:'green'},
 {id:4,icon:'fa-folder-open',title:'Project update',message:'Project activity has been updated.',time:'2 hours ago',href:'/projects',read:true,tone:'violet'},
];

export default function AdminLayout({active,children,title,crumb=active,actions}:{active:string;children:ReactNode;title:string;crumb?:string;actions?:ReactNode}){
 const [mobile,setMobile]=useState(false);
 const [user,setUser]=useState<any>(null);
 const [profileOpen,setProfileOpen]=useState(false);
 const [notificationsOpen,setNotificationsOpen]=useState(false);
 const [notifications,setNotifications]=useState<Notice[]>(defaultNotifications);
 const profileRef=useRef<HTMLDivElement>(null);
 const notificationRef=useRef<HTMLDivElement>(null);

 useEffect(()=>{
   if(!localStorage.getItem('accessToken')){window.location.href='/';return;}
   const raw=localStorage.getItem('user');
   if(raw) try{setUser(JSON.parse(raw))}catch{}
   try{
     const saved=localStorage.getItem('taskManagementNotifications');
     if(saved) setNotifications(JSON.parse(saved));
   }catch{}
 },[]);

 useEffect(()=>{
   function closeMenus(e:MouseEvent){
     const target=e.target as Node;
     if(profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false);
     if(notificationRef.current && !notificationRef.current.contains(target)) setNotificationsOpen(false);
   }
   document.addEventListener('mousedown',closeMenus);
   return()=>document.removeEventListener('mousedown',closeMenus);
 },[]);

 useEffect(()=>{
   localStorage.setItem('taskManagementNotifications',JSON.stringify(notifications));
 },[notifications]);

 function logout(){
   const refreshToken=localStorage.getItem('refreshToken');
   apiFetch(`${API}/auth/logout`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({refreshToken})})
     .finally(()=>{localStorage.clear();window.location.href='/'})
 }

 function markAllRead(){setNotifications(current=>current.map(item=>({...item,read:true})));}
 function markRead(id:number){setNotifications(current=>current.map(item=>item.id===id?{...item,read:true}:item));}

 const unreadCount=notifications.filter(item=>!item.read).length;
 const initial=(user?.name||'A').charAt(0).toUpperCase();

 return <div className="admin-shell">
   <aside className={`sidebar ${mobile?'sidebar-open':''}`}>
     <div className="brand"><div className="brand-mark">TM</div><div><div className="brand-name">Task Management</div><div className="brand-sub">System</div></div></div>
     <nav className="nav"><div className="nav-title">Navigation</div>{menu.map(item=><a key={item.label} href={item.href} onClick={()=>setMobile(false)} className={`nav-item ${active===item.label?'active':''}`}><span className="nav-icon"><i className={`fa-solid ${item.icon}`} aria-hidden="true"></i></span><span>{item.label}</span>{['Users','Roles & Permissions','Projects','Tasks'].includes(item.label)&&<span className="chevron">›</span>}</a>)}</nav>
   </aside>
   {mobile&&<button className="overlay" aria-label="Close menu" onClick={()=>setMobile(false)} />}
   <div className="content-wrap">
     <header className="topbar">
       <div className="top-left"><button className="mobile-menu" onClick={()=>setMobile(true)} aria-label="Open menu"><i className="fa-solid fa-bars" aria-hidden="true"></i></button></div>
       <div className="top-right">
         <div className="notification-dropdown" ref={notificationRef}>
           <button className={`notification-trigger ${notificationsOpen?'open':''}`} onClick={()=>{setNotificationsOpen(v=>!v);setProfileOpen(false)}} aria-label="Notifications" aria-expanded={notificationsOpen}>
             <i className="fa-regular fa-bell" aria-hidden="true"></i>
             {unreadCount>0&&<span className="notification-badge">{unreadCount>9?'9+':unreadCount}</span>}
           </button>
           {notificationsOpen&&<div className="notification-menu">
             <div className="notification-head">
               <strong>Notifications</strong>
               {unreadCount>0&&<button onClick={markAllRead}>Mark all read</button>}
             </div>
             <div className="notification-list">
               {notifications.length===0&&<div className="notification-empty"><i className="fa-regular fa-bell-slash"></i><span>No notifications</span></div>}
               {notifications.map(item=><a key={item.id} href={item.href} className={`notification-item ${item.read?'read':''}`} onClick={()=>markRead(item.id)}>
                 <span className={`notification-icon ${item.tone}`}><i className={`fa-solid ${item.icon}`} aria-hidden="true"></i></span>
                 <span className="notification-copy"><strong>{item.title}</strong><span>{item.message}</span><small>{item.time}</small></span>
                 {!item.read&&<span className="notification-dot" aria-label="Unread"></span>}
               </a>)}
             </div>
             <a className="notification-footer" href="/tasks" onClick={()=>setNotificationsOpen(false)}>View all activity <i className="fa-solid fa-arrow-right"></i></a>
           </div>}
         </div>
         <div className="profile-dropdown" ref={profileRef}>
           <button className="profile-trigger" onClick={()=>{setProfileOpen(v=>!v);setNotificationsOpen(false)}} aria-expanded={profileOpen}>
             <div className="avatar">{initial}</div>
             <div className="user-menu"><strong>{user?.name||'Admin User'}</strong><span>{user?.role?.name||'Administrator'}</span></div>
             <span className="profile-chevron"><i className="fa-solid fa-chevron-down" aria-hidden="true"></i></span>
           </button>
           {profileOpen&&<div className="profile-menu">
             <div className="profile-menu-title"><span className="profile-menu-avatar">{initial}</span><span><strong>{user?.name||'Admin User'}</strong><small>{user?.email||'admin@example.com'}</small></span></div>
             <a href="/profile" onClick={()=>setProfileOpen(false)}><i className="fa-regular fa-user" aria-hidden="true"></i> <span>Profile</span></a>
             <a href="/settings" onClick={()=>setProfileOpen(false)}><i className="fa-solid fa-gear" aria-hidden="true"></i> <span>Settings</span></a>
             <button onClick={logout}><i className="fa-solid fa-right-from-bracket" aria-hidden="true"></i> <span>Logout</span></button>
           </div>}
         </div>
       </div>
     </header>
     <main className="main">
       <div className="page-head"><div><h1>{title}</h1><div className="breadcrumb"><i className="fa-solid fa-house" aria-hidden="true"></i> Home <span>›</span> <b>{crumb}</b></div></div><div className="page-actions">{actions}</div></div>
       {children}
     </main>
     <footer className="admin-footer">Task Management System © 2009-2026 All Rights Reserved.</footer>
   </div>
 </div>;
}
