import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, RefreshCw, Check, X } from 'lucide-react';

function useDebounced<T>(v:T,d=400){const [s,setS]=useState(v);useEffect(()=>{const t=setTimeout(()=>setS(v),d);return()=>clearTimeout(t)},[v,d]);return s}
const d=(x:string)=> new Date(x).toISOString().slice(0,10);

export default function AdminBankTransfer(){
  const { user }=useAuth(); const [,setLocation]=useLocation(); const { toast }=useToast();
  const [search,setSearch]=useState(''); const dSearch=useDebounced(search,400);
  const [page,setPage]=useState(1); const limit=10;

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/bank-transfer/show', { search: dSearch, page, limit }], enabled: !!user&&user.role==='admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')) setLocation('/admin/login'); }});
  const rows = (data as any)?.data || [];
  const total = Number((data as any)?.pagination?.total || rows.length);

  const patch = useMutation({ mutationFn: async ({id, status}:{id:string; status:'approved'|'rejected'})=> (await apiRequest('PATCH', `/api/admin/bank-transfer/${id}`, { status })).json(), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['/api/admin/bank-transfer/show']}); toast({title:'Published'})}, onError:(e:any)=>toast({title:'Update failed',description:e.message,variant:'destructive'})});

  if(!user||user.role!=='admin') return (<div className='min-h-screen bg-background flex items-center justify-center'><Card><CardContent className='p-8 text-center'><div className='text-2xl font-bold mb-4'>Access Denied</div><Button onClick={()=>setLocation('/')}>Go Home</Button></CardContent></Card></div>);

  const exportCsv=()=>{const header=['ID','User Name','Amount','Payment Status','Payment Receipt','Created At']; const body=rows.map((r:any)=>[r._id,r.userName,r.amount,r.status,r.receiptUrl,d(r.createdAt)]); const csv=[header.join(','),...body.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='bank-transfers.csv'; a.click(); URL.revokeObjectURL(url)};

  return (
    <AdminLayout
      header={
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Bank Transfer</h1>
          </div>
          <div className='flex gap-2'>
            <Input placeholder='Search…' value={search} onChange={e=>setSearch(e.target.value)} className='w-64'/>
            <Button variant='outline' onClick={()=>queryClient.invalidateQueries({queryKey:['/api/admin/bank-transfer/show']})} disabled={isRefetching}><RefreshCw className='w-4 h-4 mr-2'/>Refresh</Button>
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Payment Receipt</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading? Array.from({length:10}).map((_,i)=>(<TableRow key={i}>{Array.from({length:7}).map((__,j)=>(<TableCell key={j}><div className='h-4 bg-gray-100 rounded'/></TableCell>))}</TableRow>)) : rows.length===0 ? (
                  <TableRow><TableCell colSpan={7}><div className='py-10 text-center text-gray-600'>No records found <Button variant='outline' className='ml-2' onClick={()=>setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
                ) : rows.map((r:any)=> (
                  <TableRow key={r._id}>
                    <TableCell className='max-w-[140px] truncate'>{r._id}</TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{r.amount}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>
                      {r.receiptUrl? (
                        <ReceiptPreview url={r.receiptUrl} />
                      ) : '-'}
                    </TableCell>
                    <TableCell>{d(r.createdAt)}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size='icon' variant='ghost' className='text-green-600'><Check className='w-4 h-4'/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Approve transfer?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async()=>{ const prev=r.status; r.status='approved'; try{ await patch.mutateAsync({id:r._id, status:'approved'});}catch{ r.status=prev; } }}>Approve</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button size='icon' variant='ghost' className='text-red-600'><X className='w-4 h-4'/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Reject transfer?</AlertDialogTitle></AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={async()=>{ const prev=r.status; r.status='rejected'; try{ await patch.mutateAsync({id:r._id, status:'rejected'});}catch{ r.status=prev; } }}>Reject</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
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
    </AdminLayout>
  )
}

function ReceiptPreview({ url }:{ url:string }){
  return (
    <a href={url} target='_blank' rel='noreferrer' className='text-blue-600 hover:underline'>View</a>
  )
}
