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
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { Download, RefreshCw } from 'lucide-react';

function useDebounced<T>(v:T,d=400){const [s,setS]=useState(v);useEffect(()=>{const t=setTimeout(()=>setS(v),d);return()=>clearTimeout(t)},[v,d]);return s}
const fmtDate=(d?:string)=> d? new Date(d).toISOString().slice(0,10):'';

export default function AdminUserPackages(){
  const { user }=useAuth(); const [,setLocation]=useLocation(); const { toast }=useToast();
  const [search,setSearch]=useState(''); const dSearch=useDebounced(search,400);
  const [page,setPage]=useState(1); const limit=10; const [selected,setSelected]=useState<any|null>(null);

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/user-packages', { search: dSearch, page, limit }], enabled: !!user&&user.role==='admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')) setLocation('/admin/login'); }});
  const rows = (data as any)?.data || [];
  const total = Number((data as any)?.pagination?.total || rows.length);

  const patch = useMutation({ mutationFn: async ({id, body}:{id:string; body:any})=> (await apiRequest('PATCH', `/api/admin/user-packages/${id}`, body)).json(), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['/api/admin/user-packages']}); toast({title:'Published'});}, onError:(e:any)=>toast({title:'Update failed',description:e.message,variant:'destructive'})});
  const create = useMutation({ mutationFn: async (body:any)=> (await apiRequest('POST', '/api/admin/user-packages', body)).json(), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['/api/admin/user-packages']}); toast({title:'Published'});}, onError:(e:any)=>toast({title:'Create failed',description:e.message,variant:'destructive'})});

  if(!user||user.role!=='admin') return (<div className='min-h-screen bg-background flex items-center justify-center'><Card><CardContent className='p-8 text-center'><div className='text-2xl font-bold mb-4'>Access Denied</div><Button onClick={()=>setLocation('/')}>Go Home</Button></CardContent></Card></div>);

  const exportCsv=()=>{const header=['ID','User Name','Package Name','Start Date','End Date','Total Limit','Used Limit']; const body=rows.map((r:any)=>[r._id,r.userName,r.packageName,fmtDate(r.startDate),fmtDate(r.endDate),r.totalLimit??'∞',r.usedLimit??0]); const csv=[header.join(','),...body.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='user-packages.csv'; a.click(); URL.revokeObjectURL(url)};

  return (
    <AdminLayout
      header={
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold text-gray-900'>User Packages</h1>
            <Drawer>
              <DrawerTrigger asChild><Button variant='link' className='px-0'>+ Assign Package</Button></DrawerTrigger>
              <DrawerContent>
                <DrawerHeader><DrawerTitle>Assign Package</DrawerTitle></DrawerHeader>
                <AssignForm onSave={async (body)=>{ await create.mutateAsync(body); }} />
                <DrawerFooter><DrawerClose asChild><Button variant='outline'>Close</Button></DrawerClose></DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
          <div className='flex gap-2'>
            <Input placeholder='Search…' value={search} onChange={e=>setSearch(e.target.value)} className='w-64'/>
            <Button variant='outline' onClick={()=>queryClient.invalidateQueries({queryKey:['/api/admin/user-packages']})} disabled={isRefetching}><RefreshCw className='w-4 h-4 mr-2'/>Refresh</Button>
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
                  <TableHead>User Name</TableHead>
                  <TableHead>Package Name</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Total Limit</TableHead>
                  <TableHead>Used Limit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading? Array.from({length:10}).map((_,i)=>(<TableRow key={i}>{Array.from({length:7}).map((__,j)=>(<TableCell key={j}><div className='h-4 bg-gray-100 rounded'/></TableCell>))}</TableRow>)) : rows.length===0 ? (
                  <TableRow><TableCell colSpan={7}><div className='py-10 text-center text-gray-600'>No records found <Button variant='outline' className='ml-2' onClick={()=>setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
                ) : rows.map((r:any)=> (
                  <TableRow key={r._id} className='cursor-pointer' onClick={()=>setSelected(r)}>
                    <TableCell className='max-w-[140px] truncate'>{r._id}</TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{r.packageName}</TableCell>
                    <TableCell>{fmtDate(r.startDate)}</TableCell>
                    <TableCell>{fmtDate(r.endDate)}</TableCell>
                    <TableCell>{r.totalLimit??'∞'}</TableCell>
                    <TableCell>{r.usedLimit??0}</TableCell>
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
        </CardContent>
      </Card>

      <Drawer open={!!selected} onClose={()=>setSelected(null)}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>Package Assignment Details</DrawerTitle></DrawerHeader>
          {selected && (
            <div className='p-4 space-y-3'>
              <div className='grid grid-cols-2 gap-3 text-sm'>
                <div><div className='text-gray-500'>User</div><div>{selected.userName}</div></div>
                <div><div className='text-gray-500'>Package</div><div>{selected.packageName}</div></div>
                <div><div className='text-gray-500'>Start</div><div>{fmtDate(selected.startDate)}</div></div>
                <div><div className='text-gray-500'>End</div><div>{fmtDate(selected.endDate)}</div></div>
                <div><div className='text-gray-500'>Total Limit</div><div>{selected.totalLimit??'∞'}</div></div>
                <div><div className='text-gray-500'>Used</div><div>{selected.usedLimit??0}</div></div>
              </div>
              <div className='flex gap-2'>
                <Button onClick={async()=>{ const nextEnd = new Date(selected.endDate||Date.now()); nextEnd.setDate(nextEnd.getDate()+7); const prev=selected.endDate; selected.endDate=nextEnd; try{ await patch.mutateAsync({id:selected._id, body:{ endDate: nextEnd }});}catch{ selected.endDate=prev; }} }>Extend Dates</Button>
                <Button variant='outline' onClick={async()=>{ const prev=selected.totalLimit; const next=(prev??0)+5; selected.totalLimit=next; try{ await patch.mutateAsync({id:selected._id, body:{ totalLimit: next }});}catch{ selected.totalLimit=prev; } }}>Increase Limit</Button>
              </div>
            </div>
          )}
          <DrawerFooter><DrawerClose asChild><Button variant='outline'>Close</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  )
}

function AssignForm({ onSave }:{ onSave:(body:any)=>Promise<void> }){
  const [userId,setUserId]=useState(''); const [packageId,setPackageId]=useState('');
  const [startDate,setStart]=useState<string>(''); const [endDate,setEnd]=useState<string>('');
  const [totalLimit,setTotal]=useState<number|null>(null); const [usedLimit,setUsed]=useState<number>(0);
  const { data: users } = useQuery({ queryKey: ['/api/admin/users'], select:(d:any)=>d?.data||[] });
  const { data: packages } = useQuery({ queryKey: ['/api/admin/packages'], select:(d:any)=>d?.data||[] });

  useEffect(()=>{ const p=(packages as any||[]).find((x:any)=>x._id===packageId); if(p){ const days=p.days??null; if(days){ const s=new Date(startDate||new Date()); const e=new Date(s); e.setDate(s.getDate()+Number(days)); setEnd(e.toISOString().slice(0,10)); } else { setEnd(''); } const limit=p.adLimit??null; setTotal(limit); } },[packageId,startDate,packages]);

  return (
    <div className='p-4 space-y-3'>
      <div>
        <label className='text-sm'>User</label>
        <select className='w-full border rounded px-3 py-2' value={userId} onChange={e=>setUserId(e.target.value)}>
          <option value="">Select user</option>
          {(users as any[]).map((u:any)=>(<option key={u._id} value={u._id}>{u.name}</option>))}
        </select>
      </div>
      <div>
        <label className='text-sm'>Package</label>
        <select className='w-full border rounded px-3 py-2' value={packageId} onChange={e=>setPackageId(e.target.value)}>
          <option value="">Select package</option>
          {(packages as any[]).map((p:any)=>(<option key={p._id} value={p._id}>{p.name}</option>))}
        </select>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <label className='text-sm'>Start Date</label>
          <Input type='date' value={startDate} onChange={e=>setStart(e.target.value)} />
        </div>
        <div>
          <label className='text-sm'>End Date</label>
          <Input type='date' value={endDate} onChange={e=>setEnd(e.target.value)} />
        </div>
      </div>
      <div className='grid grid-cols-2 gap-2'>
        <div>
          <label className='text-sm'>Total Limit</label>
          <Input type='number' value={totalLimit??0} onChange={e=>setTotal(Math.max(0,Number(e.target.value||0)))} />
        </div>
        <div>
          <label className='text-sm'>Used Limit</label>
          <Input type='number' value={usedLimit} onChange={e=>setUsed(Math.max(0,Number(e.target.value||0)))} />
        </div>
      </div>
      <div className='flex gap-2'>
        <Button onClick={async()=>{ if(!userId||!packageId){ return; } const body:any={ userId, packageId, startDate, endDate: endDate||null, totalLimit: totalLimit??null, usedLimit }; await onSave(body); }}>
          Assign Package
        </Button>
      </div>
    </div>
  )
}
