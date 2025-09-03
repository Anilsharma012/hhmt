import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { sanitizeHtml } from '@/lib/utils';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function RichEditor({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [codeMode, setCodeMode] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [preview, setPreview] = useState(false);
  const [codeVal, setCodeVal] = useState(value || '');

  useEffect(() => {
    if (codeMode) { setCodeVal(value || ''); return; }
    const el = ref.current; if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value, codeMode]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const insertHtml = (html: string) => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) { ref.current?.insertAdjacentHTML('beforeend', html); }
    else {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const temp = document.createElement('div');
      temp.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      while ((node = temp.firstChild)) frag.appendChild(node);
      range.insertNode(frag);
    }
    if (ref.current) onChange(ref.current.innerHTML);
  };

  const onImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const body = { filename: file.name, data: String(reader.result) };
        const res = await fetch('/api/admin/uploads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify(body) });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.message || 'Upload failed');
        insertHtml(`<img src="${json.url}" alt="" />`);
      } catch (err) {
        console.warn('Upload failed', err);
      } finally {
        if (fileRef.current) fileRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const containerCls = fullscreen ? 'fixed inset-0 z-50 bg-white p-4 overflow-auto' : '';

  return (
    <div className={containerCls}>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button type="button" variant="outline" size="sm" onClick={() => exec('undo')}>Undo</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('redo')}>Redo</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('formatBlock', '<p>')}>Paragraph</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('formatBlock', '<h2>')}>H2</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('bold')}>Bold</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('italic')}>Italic</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('underline')}>Underline</Button>
        <input type="color" onChange={(e) => exec('foreColor', e.target.value)} title="Text color" />
        <input type="color" onChange={(e) => exec('hiliteColor', e.target.value)} title="Highlight" />
        <Button type="button" variant="outline" size="sm" onClick={() => exec('justifyLeft')}>Left</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('justifyCenter')}>Center</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('justifyRight')}>Right</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('justifyFull')}>Justify</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('insertUnorderedList')}>• List</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('insertOrderedList')}>1. List</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('outdent')}>Outdent</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('indent')}>Indent</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { const url = prompt('Link URL'); if (url) exec('createLink', url); }}>Link</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>Image</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { const html = '<table class="min-w-full border"><tbody><tr><td class="border p-2">A1</td><td class="border p-2">B1</td></tr><tr><td class="border p-2">A2</td><td class="border p-2">B2</td></tr></tbody></table>'; insertHtml(html); }}>Table</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => { const url = prompt('Media URL (YouTube or MP4)'); if (!url) return; if (/youtube|youtu.be/.test(url)) { insertHtml(`<div class=\"aspect-video\"><iframe class=\"w-full h-full\" src=\"${url.replace('watch?v=', 'embed/')}\" allowfullscreen></iframe></div>`);} else { insertHtml(`<video src=\"${url}\" controls class=\"w-full\"></video>`);} }}>Media</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setCodeMode((v) => !v)}>{codeMode ? 'Design' : 'Code'}</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setPreview((v) => !v)}>Preview</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setFullscreen((v) => !v)}>{fullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</Button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onImagePick} />

      {codeMode ? (
        <textarea className="w-full h-[520px] border rounded p-3 bg-white text-black" value={codeVal} onChange={(e) => setCodeVal(e.target.value)} onBlur={() => onChange(codeVal)} />
      ) : (
        <div ref={ref} contentEditable className="min-h-[520px] border rounded p-3 bg-white text-black" onInput={() => onChange(ref.current?.innerHTML || '')} />
      )}

      {preview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setPreview(false)}>
          <div className="bg-white max-w-3xl w-full max-h-[80vh] overflow-auto p-6 rounded" onClick={(e) => e.stopPropagation()}>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(codeMode ? codeVal : (ref.current?.innerHTML || '')) }} />
          </div>
        </div>
      )}
    </div>
  );
}
