import 'dotenv/config';
import mongoose from 'mongoose';
import { Permission, Role, User, Project, Task, Token } from './models/index.js';
import { hashPassword } from './utils/auth.js';

const permissionNames = [
  'users.view','users.create','users.update','users.delete',
  'permissions.view','permissions.create','permissions.update','permissions.delete',
  'roles.view','roles.create','roles.update','roles.delete',
  'projects.view','projects.create','projects.update','projects.delete',
  'tasks.view','tasks.create','tasks.update','tasks.delete','dashboard.view'
];

async function seed() {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/task-management';
  await mongoose.connect(uri);

  // Upsert permissions so running the seed is safe on an existing database.
  const permissionDocs = [];
  for (const name of permissionNames) {
    permissionDocs.push(await Permission.findOneAndUpdate(
      { name },
      { $set: { name, description: `Permission to ${name.replace('.', ' ')}` } },
      { upsert: true, new: true }
    ));
  }

  const byName = new Map(permissionDocs.map((p: any) => [p.name, p._id]));
  const all = permissionDocs.map((p: any) => p._id);
  const without = (names: string[]) => all.filter((id: any) => !names.includes(permissionDocs.find((p: any) => p._id.equals(id))?.name));
  const managerPermissions = permissionDocs.filter((p: any) => /^(projects|tasks)\./.test(p.name) || p.name === 'dashboard.view').map((p: any) => p._id);
  const memberPermissions = permissionDocs.filter((p: any) => ['tasks.view','tasks.update','dashboard.view'].includes(p.name)).map((p: any) => p._id);

  const roleData = [
    { name: 'Super Admin', description: 'Full system access', permissions: all },
    { name: 'Admin', description: 'Administrative access', permissions: without(['roles.delete','permissions.delete']) },
    { name: 'Manager', description: 'Project and task management', permissions: managerPermissions },
    { name: 'Team Member', description: 'Assigned task access', permissions: memberPermissions }
  ];
  const roles: Record<string, any> = {};
  for (const data of roleData) {
    roles[data.name] = await Role.findOneAndUpdate(
      { name: data.name }, data, { upsert: true, new: true }
    );
  }

  // Always synchronize the demo passwords so the documented credentials work.
  const demoUsers = [
    { name: 'System Administrator', email: 'admin@example.com', password: 'Admin@12345', role: roles['Super Admin']._id, phone: '+92 300 0000000' },
    { name: 'Project Manager', email: 'manager@example.com', password: 'Manager@12345', role: roles['Manager']._id },
    { name: 'Team Member', email: 'member@example.com', password: 'Member@12345', role: roles['Team Member']._id }
  ];

  const users: Record<string, any> = {};
  for (const data of demoUsers) {
    const password = await hashPassword(data.password);
    users[data.email] = await User.findOneAndUpdate(
      { email: data.email },
      { $set: { name: data.name, password, role: data.role, status: 'Active', ...(data.phone ? { phone: data.phone } : {}) } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  // Keep refresh tokens clean for the demo accounts.
  await Token.deleteMany({ user: { $in: Object.values(users).map((u: any) => u._id) } });

  let p1 = await Project.findOne({ key: 'WEB' });
  if (!p1) {
    p1 = await Project.create({
      name: 'Website Redesign', key: 'WEB', description: 'Redesign the company website.',
      owner: users['manager@example.com']._id,
      members: [users['manager@example.com']._id, users['member@example.com']._id],
      status: 'Active', priority: 'High', startDate: new Date(), dueDate: new Date(Date.now()+30*86400000)
    });
  }

  let p2 = await Project.findOne({ key: 'TMP' });
  if (!p2) {
    p2 = await Project.create({
      name: 'Task Management Platform', key: 'TMP', description: 'Build and test the task management application.',
      owner: users['admin@example.com']._id,
      members: [users['admin@example.com']._id, users['manager@example.com']._id, users['member@example.com']._id],
      status: 'Planning', priority: 'Critical'
    });
  }

  const taskSamples = [
    { title:'Create authentication flow', description:'Implement login and token refresh.', project:p2._id, assignedTo:users['manager@example.com']._id, createdBy:users['admin@example.com']._id, status:'Completed', priority:'High', tags:['auth','backend'] },
    { title:'Build dashboard UI', description:'Create dashboard cards and task overview.', project:p2._id, assignedTo:users['member@example.com']._id, createdBy:users['manager@example.com']._id, status:'In Progress', priority:'High', tags:['frontend','dashboard'] },
    { title:'Prepare website wireframes', description:'Create initial responsive wireframes.', project:p1._id, assignedTo:users['member@example.com']._id, createdBy:users['manager@example.com']._id, status:'To Do', priority:'Medium', tags:['design'] },
    { title:'Review API endpoints', description:'Verify REST endpoint validation and authorization.', project:p2._id, assignedTo:users['manager@example.com']._id, createdBy:users['admin@example.com']._id, status:'Review', priority:'Critical', tags:['api','qa'] }
  ];
  for (const sample of taskSamples) {
    const exists = await Task.findOne({ title: sample.title, project: sample.project });
    if (!exists) await Task.create(sample);
  }

  console.log('Seed complete. Demo login: admin@example.com / Admin@12345');
  await mongoose.disconnect();
}

seed().catch(e => { console.error(e); process.exit(1); });
