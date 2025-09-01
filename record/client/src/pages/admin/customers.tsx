import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, ShoppingCart } from 'lucide-react';

function useDebounced<T>(v:T,d=400){const [s,setS]=useState(v);useEffect(()=>{const t=setTimeout(()=>setS(v),d);return()=>clearTimeout(t)},[v,d]);return s}
const d=(x?:string)=> x? new Date(x).toISOString().slice(0,10):'';

export default function AdminCustomers(){
  const { user }=useAuth(); const [,setLocation]=useLocation(); const { toast }=useToast();
  const [search,setSearch]=useState(''); const dSearch=useDebounced(search,400);
  const [page,setPage]=useState(1); const limit=10; const [selected,setSelected]=useState<any|null>(null);

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/users', { search: dSearch }], enabled: !!user&&user.role==='admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')) setLocation('/admin/login'); }});
  const all=(data as any)?.data||[];
  const filtered = useMemo(()=> all.filter((u:any)=>{if(!dSearch) return true; const t=(u.name||'')+' '+(u.email||'')+' '+(u.phone||''); return t.toLowerCase().includes(dSearch.toLowerCase());}),[all,dSearch]);
  const pages=Math.max(1, Math.ceil(filtered.length/limit)); const rows=filtered.slice((page-1)*limit, page*limit);
  useEffect(()=>{setPage(1)},[dSearch]);

  const update = useMutation({ mutationFn: async ({id, body}:{id:string; body:any})=> (await apiRequest('PUT', `/api/admin/users/${id}`, body)).json(), onError:(e:any)=>toast({title:'Update failed',description:e.message,variant:'destructive'}), onSuccess:()=>queryClient.invalidateQueries({queryKey:['/api/admin/users']})});
  const resetPwd = useMutation({ mutationFn: async (id:string)=> (await apiRequest('POST', `/api/admin/users/${id}/reset-password`)).json(), onSuccess:()=>toast({title:'Password reset sent'}), onError:(e:any)=>toast({title:'Reset failed',description:e.message,variant:'destructive'})});

  if(!user||user.role!=='admin') return (<div className='min-h-screen bg-background flex items-center justify-center'><Card><CardContent className='p-8 text-center'><div className='text-2xl font-bold mb-4'>Access Denied</div><Button onClick={()=>setLocation('/')}>Go Home</Button></CardContent></Card></div>);

  const exportCsv=()=>{const header=['ID','Profile','Name','Email','Mobile','Type','Address','Total Post','Status','Auto Approve']; const body=rows.map((u:any)=>{const addr=[u.location?.area,u.location?.city,u.location?.state].filter(Boolean).join(', '); return [u._id,u.avatar||'-',u.name,u.email,u.phone||'',(u.authType||'email'),addr,String(u.totalPosts??''),u.active?'Active':'Inactive',u.autoApproveAds?'Yes':'No']}); const csv=[header.join(','),...body.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='customers.csv'; a.click(); URL.revokeObjectURL(url)};

  return (
    <AdminLayout
      header={
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Customers</h1>
          </div>
          <div className='flex gap-2'>
            <Input placeholder='Search…' value={search} onChange={e=>setSearch(e.target.value)} className='w-64'/>
            <Button variant='outline' onClick={()=>queryClient.invalidateQueries({queryKey:['/api/admin/users']})} disabled={isRefetching}><RefreshCw className='w-4 h-4 mr-2'/>Refresh</Button>
            <Button onClick={exportCsv}><Download className='w-4 h-4 mr-2'/>Export</Button>
          </div>
        </div>
      }
    >
      <Card>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Mobile</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Total Post</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Auto Approve Advertisement</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading? Array.from({length:10}).map((_,i)=>(<TableRow key={i}>{Array.from({length:11}).map((__,j)=>(<TableCell key={j}><div className='h-4 bg-gray-100 rounded'/></TableCell>))}</TableRow>)) : rows.length===0 ? (
                  <TableRow><TableCell colSpan={11}><div className='py-10 text-center text-gray-600'>No records found <Button variant='outline' className='ml-2' onClick={()=>setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
                ) : rows.map((u:any)=>{
                  const addr=[u.location?.area,u.location?.city,u.location?.state].filter(Boolean).join(', ');
                  return (
                  <TableRow key={u._id}>
                    <TableCell className='max-w-[140px] truncate'>{u._id}</TableCell>
                    <TableCell>{u.avatar? <img src={u.avatar} className='w-10 h-10 rounded-full object-cover'/> : '-'}</TableCell>
                    <TableCell>{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone||''}</TableCell>
                    <TableCell>{u.authType||'email'}</TableCell>
                    <TableCell title={addr} className='max-w-[220px] truncate'>{addr||'-'}</TableCell>
                    <TableCell><UserPostCount userId={u._id} /></TableCell>
                    <TableCell>
                      <Switch checked={u.active!==false} onCheckedChange={async(v)=>{ const prev=u.active!==false; const next=v; u.active=next; queryClient.setQueryData(['/api/admin/users',{search:dSearch}], (old:any)=>old); try{ await update.mutateAsync({id:u._id, body:{ active: next }});}catch{ u.active=prev; queryClient.invalidateQueries({queryKey:['/api/admin/users']}); }} } />
                    </TableCell>
                    <TableCell>
                      <Switch checked={!!u.autoApproveAds} onCheckedChange={async(v)=>{ const prev=!!u.autoApproveAds; u.autoApproveAds=v; queryClient.setQueryData(['/api/admin/users',{search:dSearch}], (old:any)=>old); try{ await update.mutateAsync({id:u._id, body:{ autoApproveAds: v }});}catch{ u.autoApproveAds=prev; queryClient.invalidateQueries({queryKey:['/api/admin/users']}); }} } />
                    </TableCell>
                    <TableCell>
                      <Button size='icon' className='rounded-full bg-red-500 hover:bg-red-600' onClick={()=>setSelected(u)}><ShoppingCart className='w-4 h-4 text-white'/></Button>
                    </TableCell>
                  </TableRow>)})}
              </TableBody>
            </Table>
          </div>
          <div className='p-3 flex items-center justify-between text-sm text-gray-600'>
            <div>Showing {(page-1)*limit+1} to {Math.min(page*limit, filtered.length)} of {filtered.length} rows</div>
            <div className='flex gap-2'>
              <Button variant='outline' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
              <Button variant='outline' onClick={()=>setPage(p=>p+1)}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Drawer open={!!selected} onClose={()=>setSelected(null)}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>User Ads & Actions</DrawerTitle>
            <div className='flex gap-2 mt-2'>
              <Button variant='outline' size='sm' onClick={()=>setLocation(`/admin/send-notification?userId=${selected?._id}`)}>Send Notification</Button>
              {(selected?.email)&& (<Button variant='outline' size='sm' onClick={()=>selected&&resetPwd.mutate(selected._id)}>Reset Password</Button>)}
            </div>
          </DrawerHeader>
          {selected && <UserDrawer user={selected} />}
          <DrawerFooter><DrawerClose asChild><Button variant='outline'>Close</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  )
}

function UserPostCount({ userId }:{ userId:string }){
  const { data } = useQuery({ queryKey: ['/api/listings', { userId, limit: 1 }], select:(d:any)=>Number(d?.pagination?.total||0) });
  return <span>{data??0}</span>;
}

function UserDrawer({ user }:{ user:any }){
  const [tab,setTab]=useState('ads');
  return (
    <div className='p-4'>
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value='ads'>Ads</TabsTrigger>
          <TabsTrigger value='packages'>Packages</TabsTrigger>
        </TabsList>
        <TabsContent value='ads'>
          <UserAds userId={user._id} />
        </TabsContent>
        <TabsContent value='packages'>
          <UserPackages userId={user._id} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function UserAds({ userId }:{ userId:string }){
  const [page,setPage]=useState(1); const limit=10;
  const { data, isLoading } = useQuery({ queryKey: ['/api/admin/users/'+userId+'/ads', { page, limit }], select:(d:any)=>d, retry:false });
  const rows = (data as any)?.data||[]; const total=Number((data as any)?.total||rows.length);
  return (
    <div>
      <div className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>City</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading? Array.from({length:5}).map((_,i)=>(<TableRow key={i}>{Array.from({length:7}).map((__,j)=>(<TableCell key={j}><div className='h-4 bg-gray-100 rounded'/></TableCell>))}</TableRow>)) : rows.length===0 ? (
              <TableRow><TableCell colSpan={7}><div className='py-6 text-center text-gray-600'>No records found</div></TableCell></TableRow>
            ) : rows.map((a:any)=> (
              <TableRow key={a._id}>
                <TableCell className='max-w-[140px] truncate'>{a._id}</TableCell>
                <TableCell>{a.images?.[0]? <img src={a.images[0]} className='w-8 h-8 rounded object-cover'/> : '-'}</TableCell>
                <TableCell className='max-w-[240px] truncate'>{a.title}</TableCell>
                <TableCell>{a.status}</TableCell>
                <TableCell>{d(a.createdAt)}</TableCell>
                <TableCell>{a.location?.city||''}</TableCell>
                <TableCell><a className='text-blue-600 hover:underline' href={`/listing/${a._id}`} target='_blank' rel='noreferrer'>View on site</a></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className='p-3 flex items-center justify-between text-sm text-gray-600'>
        <div>Showing {(page-1)*limit+1} to {Math.min(page*limit, total)} of {total} rows</div>
        <div className='flex gap-2'>
          <Button variant='outline' disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
          <Button variant='outline' onClick={()=>setPage(p=>p+1)}>Next</Button>
        </div>
      </div>
    </div>
  )
}

function UserPackages({ userId }:{ userId:string }){
  const { data, isLoading } = useQuery({ queryKey: ['/api/admin/user-packages', { userId }], retry:false });
  const rows = (data as any)?.data||[];
  return (
    <div className='p-2'>
      {isLoading? <div className='h-6 bg-gray-100 rounded w-40'/> : rows.length===0? (<div className='text-gray-600'>No packages</div>) : (
        <ul className='list-disc pl-6 space-y-1 text-sm'>
          {rows.map((p:any)=>(<li key={p._id}>{p.packageName} ({d(p.startDate)} → {d(p.endDate)})</li>))}
        </ul>
      )}
    </div>
  )
}
