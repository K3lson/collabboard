import { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, FileText, Loader2 } from "lucide-react";

export default function FileUploader({ files = [], onFilesChange }) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef(null);

  const handleUpload = async (e) => {
    const fileList = e.target.files;
    if (!fileList?.length) return;
    setUploading(true);
    const newUrls = [...files];
    for (const file of fileList) {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      newUrls.push(file_url);
    }
    onFilesChange(newUrls);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const getFileName = (url) => {
    const parts = url.split("/");
    return decodeURIComponent(parts[parts.length - 1]).slice(0, 30);
  };

  return (
    <div className="mt-1.5 space-y-2">
      <input ref={inputRef} type="file" multiple className="hidden" onChange={handleUpload} />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/40 hover:bg-primary/5 transition group"
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="w-5 h-5 mx-auto text-muted-foreground animate-spin" />
        ) : (
          <>
            <Upload className="w-5 h-5 mx-auto text-muted-foreground group-hover:text-primary transition" />
            <p className="text-xs text-muted-foreground mt-1">Click to upload files</p>
          </>
        )}
      </button>

      {files.length > 0 && (
        <div className="space-y-1.5">
          {files.map((url, i) => (
            <div key={i} className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline truncate flex-1"
              >
                {getFileName(url)}
              </a>
              <button onClick={() => removeFile(i)} className="text-muted-foreground hover:text-destructive transition">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}