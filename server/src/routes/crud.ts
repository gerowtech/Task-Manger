import {Router} from 'express';
import {Permission,Role,User,Project,Task} from '../models/index.js';
import {auth,allow,AuthRequest} from '../middleware/auth.js';
import {hashPassword} from '../utils/auth.js';

const router=Router();
router.use(auth);

const crud=(path:string,Model:any,permission:string)=>{
  const populate=(query:any)=>{
    if(path==='roles') return query.populate('permissions');
    if(path==='projects') return query.populate('owner members');
    if(path==='tasks') return query.populate('project assignedTo createdBy');
    return query;
  };
  router.get('/'+path,allow(permission+'.view'),async(req,res)=>{
    try { res.json(await populate(Model.find())); }
    catch(e) { res.status(500).json({message:e instanceof Error?e.message:'Unable to load data'}); }
  });
  router.get('/'+path+'/:id',allow(permission+'.view'),async(req,res)=>{
    try {
      const x=await populate(Model.findById(req.params.id));
      if(!x)return res.status(404).json({message:'Not found'});
      res.json(x);
    } catch(e) { res.status(500).json({message:e instanceof Error?e.message:'Unable to load data'}); }
  });
  router.post('/'+path,allow(permission+'.create'),async(req:AuthRequest,res)=>{
    try {
      const payload=path==='tasks' ? {...req.body,createdBy:req.body.createdBy || req.user?._id} : req.body;
      const x=await Model.create(payload);
      res.status(201).json(x);
    } catch(e) { res.status(400).json({message:e instanceof Error?e.message:'Invalid data'}); }
  });
  router.put('/'+path+'/:id',allow(permission+'.update'),async(req,res)=>{
    try {
      const x=await Model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true});
      if(!x)return res.status(404).json({message:'Not found'});
      res.json(x);
    } catch(e) { res.status(400).json({message:e instanceof Error?e.message:'Invalid data'}); }
  });
  router.delete('/'+path+'/:id',allow(permission+'.delete'),async(req,res)=>{
    try {
      const x=await Model.findByIdAndDelete(req.params.id);
      if(!x)return res.status(404).json({message:'Not found'});
      if(path==='projects') await Task.deleteMany({project:req.params.id});
      res.json({message:'Deleted'});
    } catch(e) { res.status(400).json({message:e instanceof Error?e.message:'Unable to delete'}); }
  });
};

crud('permissions',Permission,'permissions');
crud('roles',Role,'roles');
crud('projects',Project,'projects');
crud('tasks',Task,'tasks');

router.get('/users',allow('users.view'),async(req,res)=>{
 try{
  const page=Math.max(1,Number(req.query.page)||1); const limit=Math.min(100,Math.max(1,Number(req.query.limit)||10));
  const search=String(req.query.search||'').trim(); const status=String(req.query.status||'').trim(); const filter:any={};
  if(search) filter.$or=[{name:{$regex:search,$options:'i'}},{email:{$regex:search,$options:'i'}}];
  if(status && status!=='All') filter.status=status;
  const [users,total]=await Promise.all([
   User.find(filter).populate({path:'role',populate:{path:'permissions'}}).sort({createdAt:-1}).skip((page-1)*limit).limit(limit),
   User.countDocuments(filter)
  ]);
  res.json({users,total,page,limit,totalPages:Math.max(1,Math.ceil(total/limit))});
 }catch(e){res.status(500).json({message:e instanceof Error?e.message:'Unable to load users'});}
});
router.get('/users/:id',allow('users.view'),async(req,res)=>{const u=await User.findById(req.params.id).populate({path:'role',populate:{path:'permissions'}});if(!u)return res.status(404).json({message:'Not found'});res.json(u)});
router.post('/users',allow('users.create'),async(req,res)=>{try{const b={...req.body,password:await hashPassword(req.body.password||'Password123!')};res.status(201).json(await User.create(b))}catch(e){res.status(400).json({message:e instanceof Error?e.message:'Invalid data'})}});
router.put('/users/:id',allow('users.update'),async(req,res)=>{const b={...req.body};if(b.password)b.password=await hashPassword(b.password);const u=await User.findByIdAndUpdate(req.params.id,b,{new:true,runValidators:true});if(!u)return res.status(404).json({message:'Not found'});res.json(u)});
router.delete('/users/:id',allow('users.delete'),async(req,res)=>{const u=await User.findByIdAndDelete(req.params.id);if(!u)return res.status(404).json({message:'Not found'});res.json({message:'Deleted'})});

router.get('/dashboard',allow('dashboard.view'),async(req,res)=>{
  const [users,projects,tasks,completedTasks,overdueTasks,taskGroups,projectGroups,recentTasks,recentProjects]=await Promise.all([
    User.countDocuments(),Project.countDocuments(),Task.countDocuments(),Task.countDocuments({status:'Completed'}),
    Task.countDocuments({dueDate:{$lt:new Date()},status:{$nin:['Completed','Cancelled']}}),
    Task.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]),
    Project.aggregate([{$group:{_id:'$status',count:{$sum:1}}}]),
    Task.find().sort({updatedAt:-1}).limit(6).populate('project assignedTo').lean(),
    Project.find().sort({updatedAt:-1}).limit(5).populate('owner').lean()
  ]);
  const taskStatus=['To Do','In Progress','Review','Completed','Cancelled'].map(status=>({status,count:taskGroups.find((x:any)=>x._id===status)?.count||0}));
  const projectStatus=['Planning','Active','On Hold','Completed','Cancelled'].map(status=>({status,count:projectGroups.find((x:any)=>x._id===status)?.count||0}));
  res.json({users,projects,tasks,completedTasks,overdueTasks,taskStatus,projectStatus,recentTasks,recentProjects});
});

router.use((err:any,req:any,res:any,next:any)=>{ console.error(err); if(res.headersSent) return next(err); res.status(500).json({message:err?.message || 'Internal server error'}); });

export default router;
