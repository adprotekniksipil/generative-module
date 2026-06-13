"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import {
  Loader2,
  Save,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Upload,
  Settings2,
  Eye,
  FileText,
  Link2,
  SlidersHorizontal,
  Users,
  CheckCircle2,
  PencilLine,
  Wand2,
} from "lucide-react";
import { VisibilitySelector } from "@/components/visibility/visibility-selector";
import { Header } from "@/components/layout/header";
import { TopicSelector } from "@/components/generation/topic-selector";
import { GenerationConfig } from "@/components/generation/generation-config";
import { StreamingOutput } from "@/components/generation/streaming-output";
import { SectionEditor } from "@/components/editor/section-editor";
import { FileUploader } from "@/components/upload/file-uploader";
import { UrlInput } from "@/components/upload/url-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Difficulty, Depth, Language, SourceType } from "@/lib/types";

export default function NewMaterialPage() {
  return (
    <Suspense>
      <NewMaterialContent />
    </Suspense>
  );
}

function NewMaterialContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialSource = searchParams.get("source") === "upload" ? "upload" : "topic";

  const [sourceTab, setSourceTab] = useState<string>(initialSource);
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("intermediate");
  const [depth, setDepth] = useState<Depth>("standard");
  const [language, setLanguage] = useState<Language>("id");
  const [customInstructions, setCustomInstructions] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [uploadedContent, setUploadedContent] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceName, setSourceName] = useState("");
  const [editedContent, setEditedContent] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [configOpen, setConfigOpen] = useState(true);

  const { completion, isLoading, complete } = useCompletion({
    api: "/api/generate/material",
    streamProtocol: "text",
  });

  const hasResult = !!completion && !isLoading;
  const sourceType: SourceType = sourceTab === "upload" ? (sourceUrl ? "url" : "file") : "topic";

  const handleGenerate = async () => {
    if (sourceTab === "topic" && (!topic || !subTopic)) {
      toast.error("Pilih bidang dan sub-topik terlebih dahulu");
      return;
    }
    if (sourceTab === "upload" && !uploadedContent) {
      toast.error("Upload file atau masukkan URL terlebih dahulu");
      return;
    }
    setEditedContent(null);
    setConfigOpen(false);
    await complete("", {
      body: {
        topic: topic || "general",
        subTopic: subTopic || "general",
        difficulty,
        depth,
        language,
        customInstructions,
        sourceType,
        sourceContent: sourceTab === "upload" ? uploadedContent : undefined,
        sourceUrl: sourceUrl || undefined,
      },
    });
  };

  const handleSave = async () => {
    const finalContent = editedContent ?? completion;
    if (!finalContent) return;
    setIsSaving(true);
    try {
      const titleMatch = finalContent.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1] ?? `Materi ${subTopic || "Baru"}`;
      const res = await fetch("/api/materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          topic: topic || "general",
          subTopic: subTopic || "general",
          difficulty,
          depth,
          language,
          content: finalContent,
          sourceType,
          sourceContent: sourceTab === "upload" ? uploadedContent : undefined,
          sourceUrl: sourceUrl || undefined,
          isPublished,
          groupIds: selectedGroupIds,
        }),
      });
      if (!res.ok) throw new Error("Gagal menyimpan");
      const data = await res.json();
      toast.success("Materi berhasil disimpan");
      router.push(`/materials/${data.id}`);
    } catch {
      toast.error("Gagal menyimpan materi");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileContent = (content: string, filename: string) => {
    setUploadedContent(content);
    setSourceName(filename);
    setSourceUrl("");
    toast.success(`Konten berhasil diekstrak dari ${filename}`);
  };

  const handleUrlContent = (content: string, url: string) => {
    setUploadedContent(content);
    setSourceUrl(url);
    setSourceName(url);
    toast.success("Konten berhasil diambil dari URL");
  };

  return (
    <>
      <Header title="Buat Materi Pembelajaran" />
      <div className="p-6 max-w-4xl space-y-5">

        {/* ── Config panel ── */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Panel toggle header */}
          <button
            type="button"
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-accent/30 transition-colors"
            onClick={() => setConfigOpen(!configOpen)}
            aria-expanded={configOpen}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Settings2 className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-none">Pengaturan Generate</p>
                {!configOpen && hasResult && (
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {subTopic || topic} &middot; {depth} &middot; {language === "id" ? "Indonesia" : "English"}
                  </p>
                )}
              </div>
              {!configOpen && hasResult && (
                <Badge variant="secondary" className="rounded-full text-[10px] px-2">
                  selesai dikonfigurasi
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[11px]">{configOpen ? "Sembunyikan" : "Tampilkan"}</span>
              {configOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </button>

          {configOpen && (
            <div className="border-t divide-y divide-border/60">

              {/* ── Step 1 — Sumber Materi ── */}
              <div className="px-5 py-5">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    1
                  </span>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-sm font-semibold">Sumber Materi</h4>
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>

                <div className="ml-9">
                  <Tabs value={sourceTab} onValueChange={setSourceTab}>
                    <TabsList className="h-9 rounded-lg">
                      <TabsTrigger value="topic" className="rounded-md gap-1.5 text-xs px-3">
                        <Sparkles className="h-3.5 w-3.5" />
                        Dari Topik
                      </TabsTrigger>
                      <TabsTrigger value="upload" className="rounded-md gap-1.5 text-xs px-3">
                        <Upload className="h-3.5 w-3.5" />
                        Upload / URL
                      </TabsTrigger>
                    </TabsList>

                  <TabsContent value="topic" className="mt-4">
                    <TopicSelector
                      topic={topic}
                      subTopic={subTopic}
                      onTopicChange={(v) => {
                        setTopic(v);
                        setSubTopic("");
                      }}
                      onSubTopicChange={setSubTopic}
                    />
                  </TabsContent>

                  <TabsContent value="upload" className="mt-4 space-y-4">
                    <FileUploader onContentExtracted={handleFileContent} />
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground flex items-center gap-1.5">
                          <Link2 className="h-3 w-3" />
                          atau dari URL
                        </span>
                      </div>
                    </div>
                    <UrlInput onContentExtracted={handleUrlContent} />
                    {uploadedContent && (
                      <div className="space-y-2">
                        <Label>
                          Preview Konten{" "}
                          <span className="text-muted-foreground font-normal">({sourceName})</span>
                        </Label>
                        <Textarea
                          value={uploadedContent}
                          onChange={(e) => setUploadedContent(e.target.value)}
                          rows={6}
                          className="text-xs font-mono rounded-xl"
                        />
                        <p className="text-xs text-muted-foreground">
                          {uploadedContent.split(/\s+/).filter(Boolean).length} kata
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                </div>
              </div>

              {/* ── Step 2 — Konfigurasi AI ── */}
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    2
                  </span>
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Konfigurasi AI</h4>
                  </div>
                </div>
                <GenerationConfig
                  difficulty={difficulty}
                  depth={depth}
                  language={language}
                  customInstructions={customInstructions}
                  onDifficultyChange={setDifficulty}
                  onDepthChange={setDepth}
                  onLanguageChange={setLanguage}
                  onCustomInstructionsChange={setCustomInstructions}
                />
              </div>

              {/* ── Step 3 — Visibilitas & Kelas ── */}
              <div className="px-5 py-5 space-y-4">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    3
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <h4 className="text-sm font-semibold">Visibilitas &amp; Kelas</h4>
                  </div>
                </div>
                <VisibilitySelector
                  isPublished={isPublished}
                  selectedGroupIds={selectedGroupIds}
                  onPublishChange={setIsPublished}
                  onGroupsChange={setSelectedGroupIds}
                />
              </div>

            </div>
          )}
        </div>

        {/* ── Generate button ── */}
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading}
          className={`w-full relative overflow-hidden rounded-xl h-14 text-sm font-semibold transition-all flex items-center justify-center gap-2.5 shadow-md
            ${isLoading
              ? "bg-primary/70 text-primary-foreground cursor-not-allowed"
              : "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground hover:shadow-lg active:scale-[0.99] cursor-pointer"
            }`}
          aria-label={isLoading ? "AI sedang menyusun materi" : completion ? "Re-generate materi" : "Generate materi dengan AI"}
        >
          {/* shimmer overlay saat idle */}
          {!isLoading && (
            <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2.5s_infinite]" />
          )}
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
              <span>AI sedang menyusun materi...</span>
            </>
          ) : completion ? (
            <>
              <Wand2 className="h-4 w-4 shrink-0" />
              <span>{sourceTab === "upload" ? "Re-generate dari Sumber" : "Re-generate Materi"}</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>{sourceTab === "upload" ? "Generate dari Sumber" : "Generate Materi dengan AI"}</span>
            </>
          )}
        </button>

        {/* ── Streaming output ── */}
        {isLoading && (
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 px-1">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </div>
              <span className="text-xs font-medium text-primary">AI sedang menulis materi...</span>
            </div>
            <StreamingOutput content={completion} isLoading={isLoading} />
          </div>
        )}

        {/* ── Editor hint + Section editor ── */}
        {hasResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
              <PencilLine className="h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium text-foreground">Mode Edit Aktif</p>
                <p className="text-xs text-muted-foreground">
                  Klik pada bagian mana saja untuk mengedit. Hover untuk opsi tambahan.
                </p>
              </div>
            </div>
            <div className="pl-10">
              <SectionEditor
                content={editedContent ?? completion}
                materialTitle={
                  (editedContent ?? completion).match(/^#\s+(.+)$/m)?.[1] ?? "Materi"
                }
                difficulty={difficulty}
                language={language}
                onContentChange={setEditedContent}
              />
            </div>
          </div>
        )}

        {/* ── Sticky save bar ── */}
        {hasResult && (
          <div className="sticky bottom-4 z-10">
            <div className="glass-card rounded-xl px-4 py-3 flex items-center justify-between shadow-lg border">
              {editedContent ? (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500" />
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400">
                    Ada perubahan yang belum disimpan
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">
                    Materi siap disimpan ke database
                  </p>
                </div>
              )}
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="rounded-xl gap-1.5 cursor-pointer"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Simpan Materi
              </Button>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
