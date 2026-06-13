"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  RefreshCw,
  ImagePlus,
  ImageMinus,
  Loader2,
  MessageSquare,
  Check,
  X,
  Trash2,
  GripVertical,
  Pencil,
  Plus,
  ArrowUp,
  ArrowDown,
  Paperclip,
  FileText,
  Presentation,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { FilePreviewViewer } from "@/components/ui/file-preview-viewer";
import { toast } from "sonner";
import {
  parseSections,
  reconstructMarkdown,
  replaceSection,
  type MaterialSection,
} from "@/lib/utils/section-parser";

interface MaterialAttachment {
  id: string;
  sectionIndex: number;
  sectionHeading: string;
  filename: string;
  fileType: string;
  fileSize: number;
  url: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentIcon({ fileType }: { fileType: string }) {
  if (fileType === "pdf")
    return <FileText className="h-4 w-4 text-red-500 shrink-0" />;
  return <Presentation className="h-4 w-4 text-orange-500 shrink-0" />;
}

interface SectionEditorProps {
  content: string;
  materialTitle: string;
  difficulty: string;
  language: string;
  onContentChange: (newContent: string) => void;
  materialId?: string;
}

export function SectionEditor({
  content,
  materialTitle,
  difficulty,
  language,
  onContentChange,
  materialId,
}: SectionEditorProps) {
  const [sections, setSections] = useState<MaterialSection[]>(() =>
    parseSections(content)
  );
  const [editingSection, setEditingSection] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editingHeading, setEditingHeading] = useState<number | null>(null);
  const [editHeadingText, setEditHeadingText] = useState("");
  const [commentSection, setCommentSection] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [regeneratingSection, setRegeneratingSection] = useState<number | null>(null);
  const [generatingIllustration, setGeneratingIllustration] = useState<number | null>(null);
  const [attachmentSection, setAttachmentSection] = useState<number | null>(null);
  const [attachments, setAttachments] = useState<MaterialAttachment[]>([]);
  const [uploadingSection, setUploadingSection] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadTargetRef = useRef<{ index: number; heading: string } | null>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch attachments on mount
  useEffect(() => {
    if (!materialId) return;
    fetch(`/api/materials/${materialId}/attachments`)
      .then((r) => r.json())
      .then((data) => setAttachments(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [materialId]);

  const updateSections = useCallback(
    (newSections: MaterialSection[]) => {
      setSections(newSections);
      onContentChange(reconstructMarkdown(newSections));
    },
    [onContentChange]
  );

  // Auto-resize textarea
  useEffect(() => {
    if (editTextareaRef.current) {
      editTextareaRef.current.style.height = "auto";
      editTextareaRef.current.style.height =
        editTextareaRef.current.scrollHeight + "px";
    }
  }, [editText]);

  // Click outside to save & unfocus editing
  useEffect(() => {
    if (editingSection === null && editingHeading === null) return;

    function handleClickOutside(e: MouseEvent) {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target as Node)) return;

      // Save current edits before unfocusing
      if (editingSection !== null) {
        const section = sections.find((s) => s.index === editingSection);
        if (section) {
          const headingLine =
            section.level > 0
              ? `${"#".repeat(section.level)} ${section.heading}`
              : "";
          const newFullText = headingLine
            ? `${headingLine}\n\n${editText.trim()}`
            : editText.trim();
          const newSections = sections.map((s) =>
            s.index === editingSection
              ? { ...s, content: editText.trim(), fullText: newFullText }
              : s
          );
          setSections(newSections);
          onContentChange(reconstructMarkdown(newSections));
        }
        setEditingSection(null);
        setEditText("");
      }

      if (editingHeading !== null) {
        const section = sections.find((s) => s.index === editingHeading);
        if (section && editHeadingText.trim()) {
          const newHeading = editHeadingText.trim();
          const headingLine =
            section.level > 0 ? `${"#".repeat(section.level)} ${newHeading}` : "";
          const newFullText = headingLine
            ? `${headingLine}\n\n${section.content}`
            : section.content;
          const newSections = sections.map((s) =>
            s.index === editingHeading
              ? { ...s, heading: newHeading, fullText: newFullText }
              : s
          );
          setSections(newSections);
          onContentChange(reconstructMarkdown(newSections));
        }
        setEditingHeading(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingSection, editingHeading, editText, editHeadingText, sections, onContentChange]);

  // ─── Inline Edit ──────────────────────────────────────

  const startEdit = (section: MaterialSection) => {
    setEditingSection(section.index);
    setEditText(section.content);
    setCommentSection(null);
  };

  const saveEdit = (sectionIndex: number) => {
    const section = sections.find((s) => s.index === sectionIndex);
    if (!section) return;

    const headingLine =
      section.level > 0
        ? `${"#".repeat(section.level)} ${section.heading}`
        : "";
    const newFullText = headingLine
      ? `${headingLine}\n\n${editText.trim()}`
      : editText.trim();

    const newSections = sections.map((s) =>
      s.index === sectionIndex
        ? { ...s, content: editText.trim(), fullText: newFullText }
        : s
    );
    updateSections(newSections);
    setEditingSection(null);
    setEditText("");
  };

  const cancelEdit = () => {
    setEditingSection(null);
    setEditText("");
  };

  // ─── Heading Edit ─────────────────────────────────────

  const startEditHeading = (section: MaterialSection) => {
    setEditingHeading(section.index);
    setEditHeadingText(section.heading);
  };

  const saveHeading = (sectionIndex: number) => {
    const section = sections.find((s) => s.index === sectionIndex);
    if (!section || !editHeadingText.trim()) return;

    const newHeading = editHeadingText.trim();
    const headingLine =
      section.level > 0 ? `${"#".repeat(section.level)} ${newHeading}` : "";
    const newFullText = headingLine
      ? `${headingLine}\n\n${section.content}`
      : section.content;

    const newSections = sections.map((s) =>
      s.index === sectionIndex
        ? { ...s, heading: newHeading, fullText: newFullText }
        : s
    );
    updateSections(newSections);
    setEditingHeading(null);
  };

  // ─── Delete Section ───────────────────────────────────

  const deleteSection = (sectionIndex: number) => {
    const section = sections.find((s) => s.index === sectionIndex);
    if (!section) return;
    if (!confirm(`Hapus bagian "${section.heading}"?`)) return;

    const newSections = sections
      .filter((s) => s.index !== sectionIndex)
      .map((s, i) => ({ ...s, index: i }));
    updateSections(newSections);
    toast.success(`Bagian "${section.heading}" dihapus`);
  };

  // ─── Move Section ─────────────────────────────────────

  const moveSection = (sectionIndex: number, direction: "up" | "down") => {
    const idx = sections.findIndex((s) => s.index === sectionIndex);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const newSections = [...sections];
    [newSections[idx], newSections[targetIdx]] = [
      newSections[targetIdx],
      newSections[idx],
    ];
    updateSections(
      newSections.map((s, i) => ({ ...s, index: i }))
    );
  };

  // ─── Add Section ──────────────────────────────────────

  const addSectionAfter = (sectionIndex: number) => {
    const idx = sections.findIndex((s) => s.index === sectionIndex);
    const newSection: MaterialSection = {
      index: 0,
      heading: "Bagian Baru",
      level: 2,
      content: "Tulis konten di sini...",
      fullText: "## Bagian Baru\n\nTulis konten di sini...",
    };

    const newSections = [
      ...sections.slice(0, idx + 1),
      newSection,
      ...sections.slice(idx + 1),
    ].map((s, i) => ({ ...s, index: i }));

    updateSections(newSections);

    // Auto-edit the new section
    const newIdx = idx + 1;
    setEditingSection(newSections[newIdx].index);
    setEditText(newSections[newIdx].content);
    setEditingHeading(newSections[newIdx].index);
    setEditHeadingText(newSections[newIdx].heading);
  };

  // ─── Regenerate ───────────────────────────────────────

  const handleRegenerateSection = async (sectionIndex: number) => {
    if (!comment.trim()) {
      toast.error("Tulis komentar/masukan untuk regenerasi");
      return;
    }

    const section = sections.find((s) => s.index === sectionIndex);
    if (!section) return;

    setRegeneratingSection(sectionIndex);

    try {
      const res = await fetch("/api/generate/section", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          materialTitle,
          sectionHeading: section.heading,
          sectionContent: section.fullText,
          fullMaterialContext: reconstructMarkdown(sections),
          comment: comment.trim(),
          difficulty,
          language,
        }),
      });

      if (!res.ok) throw new Error("Gagal regenerasi");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let newContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        newContent += decoder.decode(value, { stream: true });
      }

      if (newContent.trim()) {
        const newSections = replaceSection(sections, sectionIndex, newContent);
        updateSections(newSections);
        setComment("");
        setCommentSection(null);
        toast.success(`Bagian "${section.heading}" berhasil di-generate ulang`);
      }
    } catch {
      toast.error("Gagal melakukan regenerasi bagian");
    } finally {
      setRegeneratingSection(null);
    }
  };

  // ─── Illustration ─────────────────────────────────────

  const handleGenerateIllustration = async (sectionIndex: number) => {
    const section = sections.find((s) => s.index === sectionIndex);
    if (!section) return;

    setGeneratingIllustration(sectionIndex);

    try {
      const res = await fetch("/api/generate/illustration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sectionHeading: section.heading,
          sectionContent: section.content,
          materialTitle,
        }),
      });

      const data = await res.json();

      if (!data.success || !data.image) {
        throw new Error(data.error ?? "Gagal generate ilustrasi");
      }

      const illustrationMarkdown = `\n\n<figure>\n<img src="${data.image}" alt="Ilustrasi: ${section.heading}" />\n<figcaption>Ilustrasi: ${section.heading}</figcaption>\n</figure>\n`;
      const newContent = section.fullText + illustrationMarkdown;
      const newSections = replaceSection(sections, sectionIndex, newContent);
      updateSections(newSections);

      toast.success(`Ilustrasi untuk "${section.heading}" berhasil dibuat`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal generate ilustrasi";
      toast.error(message);
    } finally {
      setGeneratingIllustration(null);
    }
  };

  // ─── Illustration helpers ─────────────────────────────

  const ILLUSTRATION_RE =
    /\n*<figure>\s*<img\s[^>]*alt="Ilustrasi:[^"]*"[^>]*\/?>\s*<figcaption>[^<]*<\/figcaption>\s*<\/figure>\n*/;
  const ILLUSTRATION_MD_RE =
    /\n*!\[Ilustrasi:[^\]]*\]\([^)]+\)\n*/;

  const sectionHasIllustration = (section: MaterialSection) =>
    ILLUSTRATION_RE.test(section.fullText) ||
    ILLUSTRATION_MD_RE.test(section.fullText);

  const handleDeleteIllustration = (sectionIndex: number) => {
    const section = sections.find((s) => s.index === sectionIndex);
    if (!section) return;
    if (!confirm("Hapus ilustrasi dari bagian ini?")) return;

    // Use global variants for replace to remove all occurrences
    const cleaned = section.fullText
      .replace(new RegExp(ILLUSTRATION_RE.source, "g"), "")
      .replace(new RegExp(ILLUSTRATION_MD_RE.source, "g"), "");

    const newSections = replaceSection(sections, sectionIndex, cleaned);
    updateSections(newSections);
    toast.success("Ilustrasi dihapus");
  };

  // ─── Attachments ─────────────────────────────────────

  const handleUploadClick = (sectionIndex: number, sectionHeading: string) => {
    uploadTargetRef.current = { index: sectionIndex, heading: sectionHeading };
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !materialId || !uploadTargetRef.current) return;
    e.target.value = "";

    const { index: sectionIndex, heading: sectionHeading } = uploadTargetRef.current;
    setUploadingSection(sectionIndex);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("sectionIndex", String(sectionIndex));
      form.append("sectionHeading", sectionHeading);

      const res = await fetch(`/api/materials/${materialId}/attachments`, {
        method: "POST",
        body: form,
      });

      let data: Record<string, unknown> = {};
      try {
        data = await res.json();
      } catch {
        // response bukan JSON (kemungkinan error 500 dari server)
      }

      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : `Upload gagal (${res.status})`
        );
      }

      setAttachments((prev) => [...prev, data as unknown as MaterialAttachment]);
      toast.success(`"${file.name}" berhasil diunggah`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload gagal");
    } finally {
      setUploadingSection(null);
      uploadTargetRef.current = null;
    }
  };

  const handleDeleteAttachmentFile = async (attachmentId: string, filename: string) => {
    if (!materialId || !confirm(`Hapus lampiran "${filename}"?`)) return;

    try {
      const res = await fetch(
        `/api/materials/${materialId}/attachments/${attachmentId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Gagal menghapus");
      setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
      toast.success("Lampiran dihapus");
    } catch {
      toast.error("Gagal menghapus lampiran");
    }
  };

  // ─── Render ───────────────────────────────────────────

  return (
    <div ref={containerRef} className="space-y-1">
      {/* Hidden file input for attachment upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.ppt,.pptx"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-xs text-muted-foreground px-1 mb-3">
        {sections.length} bagian &bull; Hover untuk opsi &bull; Klik isi untuk edit
      </p>

      {sections.map((section, idx) => {
        const isEditing = editingSection === section.index;
        const isEditingH = editingHeading === section.index;
        const isCommenting = commentSection === section.index;
        const isRegenerating = regeneratingSection === section.index;
        const isGenIllustration = generatingIllustration === section.index;
        const isFirst = idx === 0;
        const isLast = idx === sections.length - 1;

        return (
          <div key={section.index} className="group/block relative">
            {/* Block container */}
            <div
              className={`glass-card rounded-2xl overflow-hidden transition-all ${
                isEditing ? "ring-2 ring-primary/30" : ""
              } ${isRegenerating ? "opacity-50" : ""}`}
            >
              {/* Hover toolbar - left gutter */}
              <div className="absolute -left-10 top-3 opacity-0 group-hover/block:opacity-100 transition-opacity flex flex-col items-center gap-0.5">
                <button
                  className="p-1 text-muted-foreground/50 hover:text-muted-foreground rounded"
                  title="Pindah"
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Section Header */}
              <div className="flex items-center gap-2 px-5 pt-4 pb-2">
                {isEditingH ? (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-muted-foreground text-xs font-mono">
                      {"#".repeat(section.level)}
                    </span>
                    <input
                      type="text"
                      value={editHeadingText}
                      onChange={(e) => setEditHeadingText(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveHeading(section.index);
                        if (e.key === "Escape") setEditingHeading(null);
                      }}
                      className="flex-1 bg-transparent border-b-2 border-primary/30 text-lg font-semibold outline-none py-1"
                    />
                    <button
                      onClick={() => saveHeading(section.index)}
                      className="text-primary hover:text-primary/80"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingHeading(null)}
                      className="text-muted-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => startEditHeading(section)}
                      className="flex-1 text-left group/heading"
                    >
                      {section.level === 1 ? (
                        <h1 className="text-2xl font-bold group-hover/heading:text-primary/80 transition-colors">
                          {section.heading}
                        </h1>
                      ) : (
                        <h2 className="text-lg font-semibold group-hover/heading:text-primary/80 transition-colors">
                          {section.heading}
                        </h2>
                      )}
                    </button>

                    {/* Action buttons - visible on hover */}
                    <div className="flex items-center gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity">
                      {!isFirst && (
                        <button
                          onClick={() => moveSection(section.index, "up")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Pindah ke atas"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {!isLast && (
                        <button
                          onClick={() => moveSection(section.index, "down")}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          title="Pindah ke bawah"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(section)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Edit konten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {section.level === 2 && (
                        <>
                          <button
                            onClick={() => {
                              setCommentSection(
                                isCommenting ? null : section.index
                              );
                              setComment("");
                            }}
                            disabled={isRegenerating || isGenIllustration}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                            title="Regenerasi dengan AI"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() =>
                              handleGenerateIllustration(section.index)
                            }
                            disabled={isRegenerating || isGenIllustration}
                            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30"
                            title="Generate ilustrasi"
                          >
                            {isGenIllustration ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ImagePlus className="h-3.5 w-3.5" />
                            )}
                          </button>
                          {sectionHasIllustration(section) && (
                            <button
                              onClick={() =>
                                handleDeleteIllustration(section.index)
                              }
                              disabled={isRegenerating || isGenIllustration}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-30"
                              title="Hapus ilustrasi"
                            >
                              <ImageMinus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </>
                      )}
                      {section.level === 2 && materialId && (
                        <button
                          onClick={() =>
                            setAttachmentSection(
                              attachmentSection === section.index ? null : section.index
                            )
                          }
                          disabled={uploadingSection === section.index}
                          className={`p-1.5 rounded-lg transition-colors ${
                            attachmentSection === section.index
                              ? "text-primary bg-primary/10"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          } ${attachments.filter((a) => a.sectionIndex === section.index).length > 0 ? "text-primary/70" : ""}`}
                          title="Kelola lampiran (PDF/PPT)"
                        >
                          {uploadingSection === section.index ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Paperclip className="h-3.5 w-3.5" />
                          )}
                        </button>
                      )}
                      {section.level === 2 && (
                        <button
                          onClick={() => deleteSection(section.index)}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Hapus bagian"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Regeneration comment panel */}
              {isCommenting && (
                <div className="px-5 py-3 bg-primary/[0.03] border-t border-border/50 mx-4 mb-2 rounded-xl">
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    Masukan untuk regenerasi:
                  </p>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Contoh: Tambahkan contoh perhitungan, jelaskan lebih detail..."
                    rows={2}
                    className="text-sm rounded-xl mb-2"
                    disabled={isRegenerating}
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl gap-1 text-xs"
                      onClick={() => handleRegenerateSection(section.index)}
                      disabled={isRegenerating || !comment.trim()}
                    >
                      {isRegenerating ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <MessageSquare className="h-3 w-3" />
                      )}
                      {isRegenerating ? "Generating..." : "Generate Ulang"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        setCommentSection(null);
                        setComment("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}

              {/* Attachment Panel */}
              {attachmentSection === section.index && materialId && (
                <div className="px-5 py-3 bg-amber-50/50 dark:bg-amber-950/20 border-t border-border/50 mx-4 mb-2 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <Paperclip className="h-3.5 w-3.5" />
                      Lampiran Bagian Ini
                    </p>
                    <button
                      onClick={() => handleUploadClick(section.index, section.heading)}
                      disabled={uploadingSection === section.index}
                      className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
                    >
                      <Upload className="h-3 w-3" />
                      Tambah File
                    </button>
                  </div>
                  <p className="text-[10px] text-muted-foreground mb-2">
                    Format: PDF, PPT, PPTX &bull; Maks. 20MB
                  </p>
                  {attachments.filter((a) => a.sectionIndex === section.index).length === 0 ? (
                    <p className="text-xs text-muted-foreground italic py-1">
                      Belum ada lampiran untuk bagian ini.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {attachments
                        .filter((a) => a.sectionIndex === section.index)
                        .map((att) => (
                          <div
                            key={att.id}
                            className="rounded-lg border bg-background"
                          >
                            <div className="flex items-center gap-2 px-3 py-2">
                              <AttachmentIcon fileType={att.fileType} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{att.filename}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {att.fileType.toUpperCase()} &bull; {formatFileSize(att.fileSize)}
                                </p>
                              </div>
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-muted-foreground hover:text-primary shrink-0"
                              >
                                Unduh
                              </a>
                              <button
                                onClick={() => handleDeleteAttachmentFile(att.id, att.filename)}
                                className="p-1 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                title="Hapus lampiran"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <div className="px-3 pb-2">
                              <FilePreviewViewer url={att.url} filename={att.filename} fileType={att.fileType} />
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section Content */}
              <div className="px-8 pb-5">
                {isRegenerating && (
                  <div className="flex items-center gap-2 mb-3 text-sm text-primary">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sedang men-generate ulang...
                  </div>
                )}

                {isEditing ? (
                  <div className="space-y-3">
                    <Textarea
                      ref={editTextareaRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="font-mono text-sm rounded-xl min-h-[120px] resize-none"
                      placeholder="Tulis konten markdown..."
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        className="rounded-xl gap-1.5 text-xs"
                        onClick={() => saveEdit(section.index)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Simpan
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl text-xs"
                        onClick={cancelEdit}
                      >
                        <X className="h-3.5 w-3.5" />
                        Batal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="cursor-text hover:bg-accent/20 rounded-xl -mx-3 px-3 py-1 transition-colors"
                    onClick={() => startEdit(section)}
                  >
                    <MarkdownRenderer content={section.content} />
                  </div>
                )}
              </div>
            </div>

            {/* Add section button between blocks */}
            <div className="flex justify-center py-0.5 opacity-0 group-hover/block:opacity-100 transition-opacity">
              <button
                onClick={() => addSectionAfter(section.index)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary px-3 py-1 rounded-full hover:bg-primary/5 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Tambah bagian
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
