import { useState, useRef } from 'react';
import { Upload, File, Trash2, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { extractTextFromFile } from '@/lib/documentParser';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';
import type { CaseDocument } from '@/types';

interface DocumentUploadProps {
  caseId: string;
  documents: CaseDocument[];
  onUpdate: () => void;
}

interface UploadState {
  file: File;
  status: 'uploading' | 'parsing' | 'done' | 'error';
  error?: string;
}

export function DocumentUpload({ caseId, documents, onUpdate }: DocumentUploadProps) {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateUpload = (index: number, patch: Partial<UploadState>) => {
    setUploads((prev) => prev.map((u, i) => (i === index ? { ...u, ...patch } : u)));
  };

  const processFile = async (file: File) => {
    const idx = uploads.length;
    setUploads((prev) => [...prev, { file, status: 'uploading' }]);

    try {
      // 1. Upload to Supabase Storage
      const filePath = `${caseId}/${Date.now()}-${file.name}`;
      const { error: storageError } = await supabase.storage
        .from('case-documents')
        .upload(filePath, file);

      if (storageError) throw new Error(storageError.message);

      updateUpload(idx, { status: 'parsing' });

      // 2. Extract text client-side
      let extractedText = '';
      try {
        extractedText = await extractTextFromFile(file);
      } catch {
        extractedText = '(Text extraction failed — file uploaded successfully)';
      }

      // 3. Save record to DB
      const { error: dbError } = await supabase.from('case_documents').insert({
        case_id: caseId,
        file_name: file.name,
        file_path: filePath,
        extracted_text: extractedText,
      });

      if (dbError) throw new Error(dbError.message);

      updateUpload(idx, { status: 'done' });
      onUpdate();
    } catch (err) {
      updateUpload(idx, {
        status: 'error',
        error: err instanceof Error ? err.message : 'Upload failed',
      });
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(processFile);
  };

  const handleDelete = async (doc: CaseDocument) => {
    if (!confirm(`Delete "${doc.file_name}"? This cannot be undone.`)) return;

    await supabase.storage.from('case-documents').remove([doc.file_path]);
    await supabase.from('case_documents').delete().eq('id', doc.id);
    onUpdate();
  };

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.md"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT — text is extracted automatically</p>
      </div>

      {/* In-flight upload status */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          {uploads.map((u, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-md border bg-muted/30">
              {u.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              {u.status === 'parsing' && <Loader2 className="h-4 w-4 animate-spin text-amber-500" />}
              {u.status === 'done' && <CheckCircle className="h-4 w-4 text-green-500" />}
              {u.status === 'error' && <div className="h-4 w-4 rounded-full bg-destructive" />}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {u.status === 'uploading' && 'Uploading...'}
                  {u.status === 'parsing' && 'Extracting text...'}
                  {u.status === 'done' && 'Upload complete'}
                  {u.status === 'error' && (u.error ?? 'Error')}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Existing documents */}
      {documents.length === 0 && uploads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No documents uploaded yet.</p>
      ) : (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Uploaded documents</h3>
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex items-center gap-3 p-4 rounded-md border bg-card hover:bg-muted/30 transition-colors"
            >
              <File className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{doc.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  Uploaded {formatDateTime(doc.uploaded_at)}
                  {doc.extracted_text && ` · ${Math.round(doc.extracted_text.length / 100) / 10}k chars extracted`}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
