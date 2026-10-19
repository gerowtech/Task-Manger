'use client';
import { useRouter } from 'next/navigation';
import AdminLayout from '../../../components/AdminLayout';
import UserForm from '../../../components/UserForm';
export default function CreateUserPage(){const router=useRouter();return <AdminLayout active="Users" title="Users Details" crumb="Users Details"><UserForm onDone={()=>router.push('/users')}/></AdminLayout>}
