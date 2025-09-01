import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, RefreshCw } from 'lucide-react';

function useDebounced<T>(v:T,d=400){const [s,setS]=useState(v);useEffect(()=>{const t=setTimeout(()=>setS(v),d);return()=>clearTimeout(t)},[v,d]);return s}
const inr=(n:number)=>{try{return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR'}).format(n)}catch{return `₹${n}`}}
const d=(x:string)=> new Date(x).toISOString().slice(0,10);

export default function AdminTransactions(){
  const { user }=useAuth(); const [,setLocation]=useLocation(); const { toast }=useToast();
  const [search,setSearch]=useState(''); const dSearch=useDebounced(search,400);
  const [page,setPage]=useState(1); const limit=10;

  const { data, isLoading, isRefetching } = useQuery({ queryKey: ['/api/admin/payment-transactions', { search: dSearch, page, limit }], enabled: !!user&&user.role==='admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')) setLocation('/admin/login'); }});
  const rows = (data as any)?.data || [];
  const total = Number((data as any)?.pagination?.total || rows.length);

  const patch = useMutation({ mutationFn: async ({id, body}:{id:string; body:any})=> (await apiRequest('PATCH', `/api/admin/payment-transactions/${id}`, body)).json(), onSuccess:()=>{queryClient.invalidateQueries({queryKey:['/api/admin/payment-transactions']}); toast({title:'Published'})}, onError:(e:any)=>toast({title:'Update failed',description:e.message,variant:'destructive'})});

  if(!user||user.role!=='admin') return (<div className='min-h-screen bg-background flex items-center justify-center'><Card><CardContent className='p-8 text-center'><div className='text-2xl font-bold mb-4'>Access Denied</div><Button onClick={()=>setLocation('/')}>Go Home</Button></CardContent></Card></div>);

  const exportCsv=()=>{const header=['ID','User Name','Amount','Payment Gateway','Payment Status','Created At']; const body=rows.map((r:any)=>[r._id,r.userName,inr(r.amount||0),r.gateway,r.status,d(r.createdAt)]); const csv=[header.join(','),...body.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='payment-transactions.csv'; a.click(); URL.revokeObjectURL(url)};

  return (
    <AdminLayout
      header={
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Payment Transactions</h1>
          </div>
          <div className='flex gap-2'>
            <Input placeholder='Search…' value={search} onChange={e=>setSearch(e.target.value)} className='w-64'/>
            <Button variant='outline' onClick={()=>queryClient.invalidateQueries({queryKey:['/api/admin/payment-transactions']})} disabled={isRefetching}><RefreshCw className='w-4 h-4 mr-2'/>Refresh</Button>
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
                  <TableHead>Payment Gateway</TableHead>
                  <TableHead>Payment Status</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading? Array.from({length:10}).map((_,i)=>(<TableRow key={i}>{Array.from({length:6}).map((__,j)=>(<TableCell key={j}><div className='h-4 bg-gray-100 rounded'/></TableCell>))}</TableRow>)) : rows.length===0 ? (
                  <TableRow><TableCell colSpan={6}><div className='py-10 text-center text-gray-600'>No records found <Button variant='outline' className='ml-2' onClick={()=>setSearch('')}>Reset Search</Button></div></TableCell></TableRow>
                ) : rows.map((r:any)=> (
                  <TableRow key={r._id}>
                    <TableCell className='max-w-[140px] truncate'>{r._id}</TableCell>
                    <TableCell>{r.userName}</TableCell>
                    <TableCell>{inr(r.amount||0)}</TableCell>
                    <TableCell>{r.gateway}</TableCell>
                    <TableCell>{r.status}</TableCell>
                    <TableCell>{d(r.createdAt)}</TableCell>
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
