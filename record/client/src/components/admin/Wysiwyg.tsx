import { useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function Wysiwyg({ value, onChange }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.innerHTML !== value) el.innerHTML = value || '';
  }, [value]);

  const exec = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    ref.current && onChange(ref.current.innerHTML);
  };

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <Button type="button" variant="outline" size="sm" onClick={() => exec('bold')}>Bold</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('italic')}>Italic</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('underline')}>Underline</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('formatBlock', '<h2>')}>H2</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('insertUnorderedList')}>• List</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => exec('createLink', prompt('Enter URL') || '')}>Link</Button>
      </div>
      <div
        ref={ref}
        contentEditable
        className="min-h-[160px] border rounded p-3 bg-white text-black"
        onInput={() => onChange(ref.current?.innerHTML || '')}
      />
    </div>
  );
}
