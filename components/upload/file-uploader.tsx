"use client";

import { useCallback, useState } from "react";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FileUploaderProps {
  onContentExtracted: (content: string, filename: string) => void;
}

export function FileUploader({ onContentExtracted }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processFile = useCallback(
    async (file: File) => {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      ];

      if (!allowedTypes.includes(file.type)) {
        alert("Format file tidak didukung. Gunakan PDF, Word (.docx), PowerPoint (.ppt/.pptx), atau TXT.");
        return;
      }

      setIsProcessing(true);
      setFileName(file.name);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload/file", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Gagal memproses file");

        const data = await res.json();
        onContentExtracted(data.text, file.name);
      } catch {
        alert("Gagal memproses file. Silakan coba lagi.");
        setFileName(null);
      } finally {
        setIsProcessing(false);
      }
    },
    [onContentExtracted]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragging
            ? "border-primary bg-primary/5 shadow-soft"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-accent/30"
        }`}
      >
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Memproses {fileName}...</p>
          </div>
        ) : fileName ? (
          <div className="flex items-center justify-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-4 w-4 text-blue-600" />
            </div>
            <span className="text-sm font-medium">{fileName}</span>
            <Button
              variant="ghost"
              size="sm"
              className="rounded-lg"
              onClick={() => setFileName(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground">
              Drag & drop file PDF, Word (.docx), atau PowerPoint (.pptx) di sini
            </p>
            <label>
              <input
                type="file"
                accept=".pdf,.docx,.txt,.ppt,.pptx"
                onChange={handleFileInput}
                className="hidden"
              />
              <span className="text-sm text-primary cursor-pointer hover:underline font-medium">
                atau klik untuk memilih file
              </span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
