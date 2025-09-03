import { useEffect, useId, useRef } from 'react';
import { Button } from '@/components/ui/button';

declare global {
  interface Window { tinymce?: any }
}

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export default function TinyEditor({ value, onChange }: Props) {
  const id = useId().replace(/:/g, '');
  const textareaId = `tinymce_${id}`;
  const initialized = useRef(false);

  useEffect(() => {
    let destroyed = false;
    const init = () => {
      if (destroyed || initialized.current) return;
      window.tinymce.init({
        selector: `#${textareaId}`,
        menubar: 'file edit view insert format tools table help',
        plugins: 'advlist autolink lists link image media table charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime emoticons help wordcount',
        toolbar: 'undo redo | blocks | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image media table | removeformat | code preview fullscreen emoticons',
        height: 520,
        branding: false,
        setup: (editor: any) => {
          editor.on('init', () => {
            editor.setContent(value || '');
            initialized.current = true;
          });
          editor.on('change keyup undo redo', () => {
            onChange(editor.getContent());
          });
        },
        images_upload_handler: async (blobInfo: any, success: (url: string) => void, failure: (msg: string) => void) => {
          try {
            const blob = blobInfo.blob();
            const reader = new FileReader();
            reader.onload = async () => {
              try {
                const body = { filename: blob.name || blobInfo.filename(), data: String(reader.result) };
                const res = await fetch('/api/admin/uploads', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  credentials: 'include',
                  body: JSON.stringify(body),
                });
                const json = await res.json();
                if (!res.ok || !json?.ok) throw new Error(json?.message || 'Upload failed');
                success(json.url);
              } catch (e: any) {
                failure(e?.message || 'Upload failed');
              }
            };
            reader.readAsDataURL(blob);
          } catch (e: any) {
            failure(e?.message || 'Upload failed');
          }
        },
      });
    };

    if (!window.tinymce) {
      const s = document.createElement('script');
      s.src = 'https://cdn.tiny.cloud/1/no-api-key/tinymce/6/tinymce.min.js';
      s.referrerPolicy = 'origin';
      s.onload = init;
      document.body.appendChild(s);
      return () => { destroyed = true; window.tinymce?.remove?.(textareaId); s.remove(); };
    } else {
      init();
      return () => { destroyed = true; window.tinymce?.remove?.(textareaId); };
    }
  }, [textareaId]);

  return (
    <div>
      <textarea id={textareaId} defaultValue={value} />
      <div className="sr-only">
        <Button type="button" className="hidden" />
      </div>
    </div>
  );
}
