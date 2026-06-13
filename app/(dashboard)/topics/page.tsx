"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "@/components/layout/header";
import {
  PlusCircle,
  Trash2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import type { DBTopic, DBSubTopic } from "@/lib/constants/topics";
import { useTopics } from "@/contexts/topics-context";

export default function TopicsPage() {
  const { refreshTopics } = useTopics();
  const [topics, setTopics] = useState<DBTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());

  // Add topic
  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicLabel, setNewTopicLabel] = useState("");
  const [addingTopic, setAddingTopic] = useState(false);

  // Edit topic
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editTopicLabel, setEditTopicLabel] = useState("");

  // Add subtopic
  const [addingSubTopicForId, setAddingSubTopicForId] = useState<string | null>(null);
  const [newSubTopicLabel, setNewSubTopicLabel] = useState("");
  const [addingSubTopic, setAddingSubTopic] = useState(false);

  // Edit subtopic
  const [editingSubTopicId, setEditingSubTopicId] = useState<string | null>(null);
  const [editSubTopicLabel, setEditSubTopicLabel] = useState("");

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      if (res.ok) setTopics(await res.json());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const toggleExpand = (topicId: string) => {
    setExpandedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) next.delete(topicId);
      else next.add(topicId);
      return next;
    });
  };

  const expandAll = () => {
    if (expandedTopics.size === topics.length) {
      setExpandedTopics(new Set());
    } else {
      setExpandedTopics(new Set(topics.map((t) => t.id)));
    }
  };

  // ─── Topic CRUD ───────────────────────────────────────

  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicLabel.trim()) return;
    setAddingTopic(true);
    try {
      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newTopicLabel }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Bidang "${data.label}" berhasil ditambahkan`);
        setNewTopicLabel("");
        setShowAddTopic(false);
        fetchTopics();
        refreshTopics();
      } else {
        toast.error(data.error);
      }
    } finally {
      setAddingTopic(false);
    }
  };

  const startEditTopic = (topic: DBTopic) => {
    setEditingTopicId(topic.id);
    setEditTopicLabel(topic.label);
  };

  const handleEditTopic = async (topicId: string) => {
    if (!editTopicLabel.trim()) return;
    try {
      const res = await fetch(`/api/topics/${topicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editTopicLabel }),
      });
      if (res.ok) {
        toast.success("Bidang berhasil diupdate");
        setEditingTopicId(null);
        fetchTopics();
        refreshTopics();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Gagal mengupdate bidang");
    }
  };

  const handleDeleteTopic = async (topic: DBTopic) => {
    if (
      !confirm(
        `Hapus bidang "${topic.label}" beserta ${topic.subtopics.length} sub-topiknya?\n\nPerhatian: Materi/kuis yang sudah menggunakan bidang ini tidak akan terpengaruh, tapi bidang ini tidak akan muncul lagi di pilihan.`
      )
    )
      return;
    try {
      const res = await fetch(`/api/topics/${topic.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Bidang "${topic.label}" dihapus`);
        fetchTopics();
        refreshTopics();
      }
    } catch {
      toast.error("Gagal menghapus bidang");
    }
  };

  // ─── SubTopic CRUD ────────────────────────────────────

  const handleAddSubTopic = async (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    if (!newSubTopicLabel.trim()) return;
    setAddingSubTopic(true);
    try {
      const res = await fetch(`/api/topics/${topicId}/subtopics`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newSubTopicLabel }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sub-topik "${data.label}" berhasil ditambahkan`);
        setNewSubTopicLabel("");
        setAddingSubTopicForId(null);
        fetchTopics();
        refreshTopics();
      } else {
        toast.error(data.error);
      }
    } finally {
      setAddingSubTopic(false);
    }
  };

  const startEditSubTopic = (subtopic: DBSubTopic) => {
    setEditingSubTopicId(subtopic.id);
    setEditSubTopicLabel(subtopic.label);
  };

  const handleEditSubTopic = async (subtopicId: string) => {
    if (!editSubTopicLabel.trim()) return;
    try {
      const res = await fetch(`/api/subtopics/${subtopicId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: editSubTopicLabel }),
      });
      if (res.ok) {
        toast.success("Sub-topik berhasil diupdate");
        setEditingSubTopicId(null);
        fetchTopics();
        refreshTopics();
      } else {
        const data = await res.json();
        toast.error(data.error);
      }
    } catch {
      toast.error("Gagal mengupdate sub-topik");
    }
  };

  const handleDeleteSubTopic = async (subtopic: DBSubTopic) => {
    if (!confirm(`Hapus sub-topik "${subtopic.label}"?`)) return;
    try {
      const res = await fetch(`/api/subtopics/${subtopic.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Sub-topik "${subtopic.label}" dihapus`);
        fetchTopics();
        refreshTopics();
      }
    } catch {
      toast.error("Gagal menghapus sub-topik");
    }
  };

  // ─── Render ───────────────────────────────────────────

  const totalSubtopics = topics.reduce((sum, t) => sum + t.subtopics.length, 0);

  return (
    <div className="flex flex-col">
      <Header
        title="Kelola Bidang & Sub-topik"
        description="Atur bidang ilmu dan sub-topik untuk materi dan soal"
      />
      <div className="p-6 space-y-6 max-w-4xl">
        {/* Stats + Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{topics.length} bidang</span>
            <span className="text-sm text-muted-foreground">·</span>
            <span className="text-sm text-muted-foreground">{totalSubtopics} sub-topik</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl text-xs"
              onClick={expandAll}
            >
              {expandedTopics.size === topics.length ? "Tutup Semua" : "Buka Semua"}
            </Button>
            <Button
              size="sm"
              className="rounded-xl gap-1.5"
              onClick={() => setShowAddTopic(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Bidang
            </Button>
          </div>
        </div>

        {/* Add Topic Form */}
        {showAddTopic && (
          <form
            onSubmit={handleAddTopic}
            className="glass-card rounded-2xl p-4 flex items-center gap-3"
          >
            <input
              type="text"
              value={newTopicLabel}
              onChange={(e) => setNewTopicLabel(e.target.value)}
              placeholder="Nama bidang baru..."
              autoFocus
              className="flex h-9 flex-1 rounded-xl border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" size="sm" disabled={addingTopic} className="rounded-xl gap-1.5">
              {addingTopic ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Simpan
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl"
              onClick={() => { setShowAddTopic(false); setNewTopicLabel(""); }}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </form>
        )}

        {/* Topics List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 flex flex-col items-center text-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
              <BookOpen className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold">Belum ada bidang</h3>
            <p className="text-sm text-muted-foreground">
              Tambahkan bidang ilmu pertama untuk mulai mengorganisasi materi dan soal
            </p>
            <Button
              className="rounded-xl gap-1.5 mt-1"
              onClick={() => setShowAddTopic(true)}
            >
              <PlusCircle className="h-4 w-4" />
              Tambah Bidang
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {topics.map((topic) => {
              const isExpanded = expandedTopics.has(topic.id);
              const isEditing = editingTopicId === topic.id;

              return (
                <div key={topic.id} className="glass-card rounded-2xl overflow-hidden">
                  {/* Topic Header */}
                  <div className="flex items-center gap-3 p-4">
                    {/* Topic icon */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>

                    {/* Chevron toggle */}
                    <button
                      onClick={() => toggleExpand(topic.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label={isExpanded ? "Tutup sub-topik" : "Buka sub-topik"}
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </button>

                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editTopicLabel}
                          onChange={(e) => setEditTopicLabel(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleEditTopic(topic.id);
                            if (e.key === "Escape") setEditingTopicId(null);
                          }}
                          className="flex h-8 flex-1 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        />
                        <button
                          onClick={() => handleEditTopic(topic.id)}
                          className="text-primary hover:text-primary/80"
                          aria-label="Simpan perubahan"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingTopicId(null)}
                          className="text-muted-foreground hover:text-foreground"
                          aria-label="Batal edit"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleExpand(topic.id)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <span className="font-semibold text-sm">{topic.label}</span>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <Badge variant="secondary" className="rounded-lg text-[11px]">
                            {topic.subtopics.length} sub-topik
                          </Badge>
                          <button
                            onClick={() => startEditTopic(topic)}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            aria-label={`Edit bidang ${topic.label}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTopic(topic)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            aria-label={`Hapus bidang ${topic.label}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Subtopics */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-2 space-y-1">
                      {topic.subtopics.map((st) => {
                        const isEditingSt = editingSubTopicId === st.id;
                        return (
                          <div
                            key={st.id}
                            className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-muted/50 group"
                          >
                            {isEditingSt ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editSubTopicLabel}
                                  onChange={(e) => setEditSubTopicLabel(e.target.value)}
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") handleEditSubTopic(st.id);
                                    if (e.key === "Escape") setEditingSubTopicId(null);
                                  }}
                                  className="flex h-7 flex-1 rounded-lg border border-input bg-background px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                />
                                <button
                                  onClick={() => handleEditSubTopic(st.id)}
                                  className="text-primary hover:text-primary/80"
                                  aria-label="Simpan perubahan sub-topik"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingSubTopicId(null)}
                                  className="text-muted-foreground hover:text-foreground"
                                  aria-label="Batal edit sub-topik"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1 text-sm">{st.label}</span>
                                <span className="text-[11px] text-muted-foreground font-mono">
                                  {st.slug}
                                </span>
                                <button
                                  onClick={() => startEditSubTopic(st)}
                                  className="text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                  aria-label={`Edit sub-topik ${st.label}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </button>
                                <button
                                  onClick={() => handleDeleteSubTopic(st)}
                                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity p-0.5"
                                  aria-label={`Hapus sub-topik ${st.label}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })}

                      {/* Add SubTopic */}
                      {addingSubTopicForId === topic.id ? (
                        <form
                          onSubmit={(e) => handleAddSubTopic(e, topic.id)}
                          className="flex items-center gap-2 py-1.5 px-3"
                        >
                          <input
                            type="text"
                            value={newSubTopicLabel}
                            onChange={(e) => setNewSubTopicLabel(e.target.value)}
                            placeholder="Nama sub-topik baru..."
                            autoFocus
                            className="flex h-7 flex-1 rounded-lg border border-input bg-background px-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          />
                          <Button
                            type="submit"
                            size="sm"
                            variant="ghost"
                            disabled={addingSubTopic}
                            className="h-7 px-2"
                          >
                            {addingSubTopic ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Check className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2"
                            onClick={() => {
                              setAddingSubTopicForId(null);
                              setNewSubTopicLabel("");
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </form>
                      ) : (
                        <button
                          onClick={() => {
                            setAddingSubTopicForId(topic.id);
                            setNewSubTopicLabel("");
                            // auto expand
                            setExpandedTopics((prev) => new Set([...prev, topic.id]));
                          }}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1.5 px-3 w-full rounded-lg hover:bg-muted/50"
                        >
                          <PlusCircle className="h-3.5 w-3.5" />
                          Tambah sub-topik
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
