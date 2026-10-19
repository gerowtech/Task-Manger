'use client';
import { useParams,useRouter } from 'next/navigation';
import AdminLayout from '../../../../components/AdminLayout';
import UserForm from '../../../../components/UserForm';
export default function EditUserPage(){const p=useParams();const router=useRouter();return <AdminLayout active="Users" title="Users Details" crumb="Users Details"><UserForm id={String(p.id)} onDone={()=>router.push('/users')}/></AdminLayout>}
