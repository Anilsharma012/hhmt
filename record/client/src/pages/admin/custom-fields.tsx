import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from 'wouter';
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Drawer, DrawerClose, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Download, RefreshCw, Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { uploadImage } from '@/lib/api';

function useDebounced<T>(value: T, delay = 400) { const [v, setV] = useState(value); useEffect(() => { const t = setTimeout(() => setV(value), delay); return () => clearTimeout(t); }, [value, delay]); return v; }

const TYPES = ['dropdown','radio','text','number','checkbox','textarea','multiselect'] as const;

type CFType = typeof TYPES[number];

type CustomField = {
  _id: string;
  id: number;
  name: string;
  categoryId: string;
  type: CFType;
  image: string;
  required: boolean;
  showInList: boolean;
  filterable: boolean;
  order: number;
  placeholder?: string;
  defaultValue?: string|number|boolean|string[];
  options?: Array<{ id?:string; label:string; value:string }>;
  rules?: { min?:number; max?:number; step?:number; maxLength?:number };
}

type ListResponse = { data: CustomField[]; total: number; page: number; limit: number };

export default function AdminCustomFields(){
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [category,setCategory]=useState('');
  const [type,setType]=useState<''|CFType>('');
  const [search,setSearch]=useState('');
  const dSearch=useDebounced(search,400);
  const [page,setPage]=useState(1); const limit=10;
  const [selected,setSelected]=useState<string[]>([]);
  const [open,setOpen]=useState(false);
  const [editing,setEditing]=useState<CustomField|null>(null);

  const { data: cats } = useQuery({ queryKey: ['/api/admin/categories', { active: true }], select:(d:any)=>d?.data||[], enabled: !!user&&user.role==='admin' });

  const params = useMemo(()=>({ category, type, search: dSearch, page, limit, sort: 'id:desc' }),[category,type,dSearch,page,limit]);
  const { data, isLoading, isRefetching } = useQuery<ListResponse|any>({ queryKey: ['/api/admin/custom-fields', params], enabled: !!user&&user.role==='admin', onError:(e:any)=>{ if(String(e?.message||'').startsWith('401')) setLocation('/admin/login'); }});
  const rows:CustomField[] = data?.data||[]; const total=Number(data?.total||0); const pages=Math.max(1, Math.ceil(total/limit));

  useEffect(()=>{ setPage(1); },[category,type,dSearch]);
  useEffect(()=>{ if(!open) setEditing(null); },[open]);

  const create = useMutation({ mutationFn: async (body:any)=> (await apiRequest('POST','/api/admin/custom-fields', body)).json(), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['/api/admin/custom-fields']}); toast({title:'Created'}); setOpen(false); }, onError:(e:any)=>toast({title:'Create failed', description:e.message, variant:'destructive'})});
  const patch = useMutation({ mutationFn: async ({id, body}:{id:string;body:any})=> (await apiRequest('PATCH',`/api/admin/custom-fields/${id}`, body)).json(), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['/api/admin/custom-fields']}); toast({title:'Saved'}); setOpen(false); }, onError:(e:any)=>toast({title:'Update failed', description:e.message, variant:'destructive'})});
  const del = useMutation({ mutationFn: async (id:string)=> (await apiRequest('DELETE',`/api/admin/custom-fields/${id}`)).json(), onSuccess:()=>{ queryClient.invalidateQueries({queryKey:['/api/admin/custom-fields']}); toast({title:'Deleted'}); }, onError:(e:any)=>toast({title:'Delete failed', description:e.message, variant:'destructive'})});
  const bulkDel = useMutation({ mutationFn: async (ids:string[])=> (await apiRequest('POST','/api/admin/custom-fields/bulk-delete',{ ids })).json(), onSuccess:()=>{ setSelected([]); queryClient.invalidateQueries({queryKey:['/api/admin/custom-fields']}); toast({title:'Deleted Selected'}); }, onError:(e:any)=>toast({title:'Bulk delete failed', description:e.message, variant:'destructive'})});

  if(!user || user.role!=='admin') return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="text-center"><div className="text-2xl font-bold mb-4">Access Denied</div><Button onClick={()=>setLocation('/')}>Go Home</Button></div></div>);

  const exportCsv = ()=>{ const header=['ID','Image','Name','Category','Type']; const csvRows=rows.map(r=>{ const catName = (cats||[]).find((c:any)=>c._id===r.categoryId)?.name||''; return [r.id, r.image||'', r.name, catName, r.type]; }); const csv=[header.join(','), ...csvRows.map(r=>r.map(v=>`"${String(v??'').replace(/"/g,'""')}"`).join(','))].join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='custom-fields.csv'; a.click(); URL.revokeObjectURL(url); };

  const allSelected = rows.length>0 && rows.every(r=>selected.includes(r._id));
  const toggleAll = (v:boolean)=> setSelected(v? Array.from(new Set([...selected, ...rows.map(r=>r._id)])) : selected.filter(id=>!rows.find(r=>r._id===id)));
  const toggleOne = (id:string, v:boolean)=> setSelected(s=> v? [...s,id]: s.filter(x=>x!==id));

  return (
    <AdminLayout
      header={
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={category || '__all__'} onValueChange={v=>setCategory(v==='__all__'?'':v)}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {(cats||[]).map((c:any)=> (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={type || '__all__'} onValueChange={v=>setType((v==='__all__'?'': v) as CFType)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All</SelectItem>
                {TYPES.map(t=> (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <Input placeholder="Search by name…" value={search} onChange={e=>setSearch(e.target.value)} className="w-64" />
            <Button variant="outline" onClick={()=>queryClient.invalidateQueries({queryKey:['/api/admin/custom-fields']})} disabled={isRefetching}><RefreshCw className="w-4 h-4 mr-2"/>Refresh</Button>
            <Button onClick={exportCsv}><Download className="w-4 h-4 mr-2"/>Export</Button>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={()=>{ setEditing(null); setOpen(true); }}>+ Create Custom Field</Button>
          </div>
        </div>
      }
    >
      <div className="relative">
        {selected.length>0 && (
          <div className="sticky top-0 z-10 mb-2 bg-blue-50 border border-blue-200 text-blue-800 rounded p-2 flex items-center justify-between">
            <div>{selected.length} selected</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="destructive" onClick={()=>bulkDel.mutate(selected)}>Delete Selected</Button>
              <Button size="sm" variant="outline" onClick={()=>setSelected([])}>Clear</Button>
            </div>
          </div>
        )}
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><input type="checkbox" checked={allSelected} onChange={e=>toggleAll(e.target.checked)} /></TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? Array.from({length:10}).map((_,i)=> (
                <TableRow key={i} className={i%2? 'bg-gray-50':''}>{Array.from({length:7}).map((__,j)=> (<TableCell key={j}><div className="h-4 bg-gray-100 rounded"/></TableCell>))}</TableRow>
              )) : rows.length===0 ? (
                <TableRow><TableCell colSpan={7}><div className="py-10 text-center text-gray-600">No custom fields found <Button variant="outline" className="ml-2" onClick={()=>{ setCategory(''); setType(''); setSearch(''); }}>Reset Filters</Button></div></TableCell></TableRow>
              ) : rows.map((r,i)=>{
                const catName=(cats||[]).find((c:any)=>c._id===r.categoryId)?.name||'';
                return (
                  <TableRow key={r._id} className={i%2? 'bg-gray-50':''}>
                    <TableCell><input type="checkbox" checked={selected.includes(r._id)} onChange={e=>toggleOne(r._id, e.target.checked)} /></TableCell>
                    <TableCell className="text-xs text-gray-600">{r.id}</TableCell>
                    <TableCell>{r.image? <img src={r.image} className="w-10 h-10 rounded object-cover"/>: <div className="w-10 h-10 rounded bg-gray-100 flex items-center justify-center"><ImageIcon className="w-4 h-4 text-gray-400"/></div>}</TableCell>
                    <TableCell>
                      <button className="text-blue-600 hover:underline max-w-[220px] truncate" title={r.name} onClick={()=>{ setEditing(r); setOpen(true); }}>{r.name}</button>
                    </TableCell>
                    <TableCell className="max-w-[160px] truncate" title={catName}>{catName}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{r.type}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={()=>{ setEditing(r); setOpen(true); }}><Pencil className="w-4 h-4 text-blue-600"/></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-600"><Trash2 className="w-4 h-4"/></Button></AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete custom field?</AlertDialogTitle>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={()=>del.mutate(r._id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>Showing {total===0?0: ((page-1)*limit+1)} to {Math.min(page*limit, total)} of {total} rows</div>
          <div className="flex gap-2">
            <Button variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</Button>
            <Button variant="outline" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Next</Button>
          </div>
        </div>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>{editing? 'Edit Custom Field':'Create Custom Field'}</DrawerTitle></DrawerHeader>
          <FieldForm key={editing?._id||'new'} initial={editing||undefined} categories={cats||[]} onCancel={()=>setOpen(false)} onSave={async (body)=>{ if(editing) await patch.mutateAsync({id: editing._id, body}); else await create.mutateAsync(body); }}/>
          <DrawerFooter><DrawerClose asChild><Button variant="outline">Close</Button></DrawerClose></DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AdminLayout>
  );
}

function FieldForm({ initial, categories, onSave, onCancel }:{ initial?: CustomField; categories:any[]; onSave:(b:any)=>Promise<any>; onCancel:()=>void }){
  const { toast } = useToast();
  const [name,setName]=useState(initial?.name||'');
  const [categoryId,setCategoryId]=useState(initial?.categoryId||'');
  const [type,setType]=useState<CFType>(initial?.type||'text');
  const [image,setImage]=useState(initial?.image||'');
  const [required,setRequired]=useState(!!initial?.required);
  const [showInList,setShowInList]=useState(!!initial?.showInList);
  const [filterable,setFilterable]=useState(!!initial?.filterable);
  const [order,setOrder]=useState<number|''>(typeof initial?.order==='number'? initial!.order:'' );
  const [placeholder,setPlaceholder]=useState(initial?.placeholder||'');
  const [defaultValue,setDefaultValue]=useState<any>(initial?.defaultValue ?? (type==='checkbox'? false : type==='multiselect'? [] : ''));
  const [options,setOptions]=useState<Array<{id?:string;label:string;value:string}>>(initial?.options||[]);
  const [rules,setRules]=useState<{min?:number;max?:number;step?:number;maxLength?:number}>({ ...(initial?.rules||{}) });
  const [submitting,setSubmitting]=useState(false);

  useEffect(()=>{ // adjust default when type changes
    if(type==='checkbox') setDefaultValue(Boolean(initial?.defaultValue ?? false));
    else if(type==='multiselect') setDefaultValue(Array.isArray(initial?.defaultValue)? initial?.defaultValue: []);
    else if(type==='number') setDefaultValue(typeof initial?.defaultValue==='number'? initial?.defaultValue: '');
    else setDefaultValue(typeof initial?.defaultValue==='string'? initial?.defaultValue: '');
  },[type]);

  const onPick = async (file: File)=>{ try{ const url= await uploadImage(file); setImage(url);}catch{ toast({title:'Upload failed', variant:'destructive'});} };

  const valid = name.trim() && categoryId && type;

  const save = async ()=>{
    if(!valid){ toast({title:'Please fill required fields', variant:'destructive'}); return; }
    const body:any={ name: name.trim(), categoryId, type, image, required, showInList, filterable, order: order===''? undefined: Number(order), placeholder: placeholder||undefined };
    if(type==='dropdown' || type==='radio' || type==='multiselect') body.options = options.filter(o=>o.label && o.value);
    if(type==='number') body.rules = { min: rules.min, max: rules.max, step: rules.step };
    if(type==='text' || type==='textarea') body.rules = { maxLength: rules.maxLength };
    if(type==='checkbox') body.defaultValue = Boolean(defaultValue);
    else if(type==='number') body.defaultValue = defaultValue===''? undefined: Number(defaultValue);
    else if(type==='multiselect') body.defaultValue = Array.isArray(defaultValue)? defaultValue: [];
    else body.defaultValue = defaultValue||undefined;

    try{ setSubmitting(true); await onSave(body); toast({title:'Published'}); } finally{ setSubmitting(false); }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Input placeholder="Field Name" value={name} onChange={e=>setName(e.target.value)} />
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c:any)=> (<SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={type} onValueChange={v=>setType(v as CFType)}>
          <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
          <SelectContent>
            {TYPES.map(t=> (<SelectItem key={t} value={t}>{t}</SelectItem>))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <div className="flex-1"><Input placeholder="Image URL" value={image} onChange={e=>setImage(e.target.value)} /></div>
          <label className="px-3 py-2 border rounded cursor-pointer text-sm">Upload<input type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; if(f) onPick(f); }} /></label>
        </div>
        <div className="flex items-center gap-3"><span className="text-sm">Required</span><Switch checked={required} onCheckedChange={setRequired} /></div>
        <div className="flex items-center gap-3"><span className="text-sm">Show on Listing</span><Switch checked={showInList} onCheckedChange={setShowInList} /></div>
        <div className="flex items-center gap-3"><span className="text-sm">Filterable</span><Switch checked={filterable} onCheckedChange={setFilterable} /></div>
        <Input type="number" placeholder="Order" value={String(order)} onChange={e=>setOrder(e.target.value===''? '': Number(e.target.value))} />
        <Input placeholder="Placeholder" value={placeholder} onChange={e=>setPlaceholder(e.target.value)} />
        {(type==='text' || type==='textarea') && (
          <Input type="number" placeholder="maxLength" value={String(rules.maxLength??'')} onChange={e=>setRules(r=>({...r, maxLength: e.target.value===''? undefined: Number(e.target.value)}))} />
        )}
        {type==='number' && (
          <div className="grid grid-cols-3 gap-2 md:col-span-2">
            <Input type="number" placeholder="min" value={String(rules.min??'')} onChange={e=>setRules(r=>({...r, min: e.target.value===''? undefined: Number(e.target.value)}))} />
            <Input type="number" placeholder="max" value={String(rules.max??'')} onChange={e=>setRules(r=>({...r, max: e.target.value===''? undefined: Number(e.target.value)}))} />
            <Input type="number" placeholder="step" value={String(rules.step??'')} onChange={e=>setRules(r=>({...r, step: e.target.value===''? undefined: Number(e.target.value)}))} />
          </div>
        )}
        {type==='checkbox' && (
          <div className="flex items-center gap-3 md:col-span-2"><span className="text-sm">Default Checked</span><Switch checked={Boolean(defaultValue)} onCheckedChange={v=>setDefaultValue(v)} /></div>
        )}
        {(type==='text' || type==='textarea') && (
          <Input placeholder="Default Value" value={String(defaultValue||'')} onChange={e=>setDefaultValue(e.target.value)} className="md:col-span-2" />
        )}
        {type==='number' && (
          <Input type="number" placeholder="Default Value" value={String(defaultValue||'')} onChange={e=>setDefaultValue(e.target.value===''? '': Number(e.target.value))} className="md:col-span-2" />
        )}
        {type==='multiselect' && (
          <MultiselectDefault value={Array.isArray(defaultValue)? defaultValue: []} onChange={setDefaultValue} options={options} />
        )}
      </div>

      {(type==='dropdown'||type==='radio'||type==='multiselect') && (
        <div>
          <div className="font-semibold mb-2">Options</div>
          <OptionsManager options={options} onChange={setOptions} />
        </div>
      )}

      {image && (<div className="pt-2"><img src={image} className="w-16 h-16 rounded object-cover border"/></div>)}

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={save} disabled={submitting}>{submitting? 'Saving…':'Save'}</Button>
      </div>
    </div>
  );
}

function OptionsManager({ options, onChange }:{ options: Array<{id?:string;label:string;value:string}>; onChange:(opts:any)=>void }){
  const [list,setList]=useState(options.slice());
  useEffect(()=>{ setList(options.slice()); },[options.map(o=>o.value+o.label).join('|')]);
  const add = ()=>{ setList(s=>[...s,{label:'',value:''}]); };
  const update = (i:number, key:'label'|'value', val:string)=>{ const next=list.slice(); next[i] = { ...next[i], [key]: val }; setList(next); onChange(next); };
  const remove = (i:number)=>{ const next=list.slice(); next.splice(i,1); setList(next); onChange(next); };
  const onDrop=(e:React.DragEvent, idx:number)=>{ const from=Number(e.dataTransfer.getData('text/plain')); const next=list.slice(); const [m]=next.splice(from,1); next.splice(idx,0,m); setList(next); onChange(next); };
  return (
    <div className="space-y-2">
      {list.map((o, i)=> (
        <div key={i} className="grid grid-cols-12 gap-2 items-center p-2 border rounded bg-white" draggable onDragStart={e=>e.dataTransfer.setData('text/plain', String(i))} onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,i)}>
          <div className="col-span-5"><Input placeholder="Label" value={o.label} onChange={e=>update(i,'label', e.target.value)} /></div>
          <div className="col-span-5"><Input placeholder="Value" value={o.value} onChange={e=>update(i,'value', e.target.value)} /></div>
          <div className="col-span-2 flex justify-end"><Button size="sm" variant="outline" className="text-red-600" onClick={()=>remove(i)}>Delete</Button></div>
        </div>
      ))}
      <Button variant="outline" onClick={add}>+ Add Option</Button>
    </div>
  );
}

function MultiselectDefault({ value, onChange, options }:{ value:string[]; onChange:(v:string[])=>void; options:Array<{label:string;value:string}> }){
  const toggle=(v:string)=>{ onChange(value.includes(v)? value.filter(x=>x!==v): [...value, v]); };
  return (
    <div className="md:col-span-2">
      <div className="text-sm text-gray-600 mb-1">Default Selected</div>
      <div className="flex flex-wrap gap-2">
        {options.map(o=> (
          <label key={o.value} className="px-2 py-1 border rounded text-sm cursor-pointer select-none">
            <input type="checkbox" className="mr-2" checked={value.includes(o.value)} onChange={()=>toggle(o.value)} />{o.label}
          </label>
        ))}
      </div>
    </div>
  );
}
