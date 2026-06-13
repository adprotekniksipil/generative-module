"use client";

import {
  DIFFICULTY_LEVELS,
  DEPTH_LEVELS,
  LANGUAGES,
} from "@/lib/constants/topics";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Difficulty, Depth, Language } from "@/lib/types";

interface GenerationConfigProps {
  difficulty: Difficulty;
  depth: Depth;
  language: Language;
  customInstructions: string;
  onDifficultyChange: (value: Difficulty) => void;
  onDepthChange: (value: Depth) => void;
  onLanguageChange: (value: Language) => void;
  onCustomInstructionsChange: (value: string) => void;
  showDepth?: boolean;
}

export function GenerationConfig({
  difficulty,
  depth,
  language,
  customInstructions,
  onDifficultyChange,
  onDepthChange,
  onLanguageChange,
  onCustomInstructionsChange,
  showDepth = true,
}: GenerationConfigProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Tingkat Kesulitan</Label>
          <Select value={difficulty} onValueChange={(v) => v && onDifficultyChange(v as Difficulty)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {showDepth && (
          <div className="space-y-2">
            <Label>Kedalaman</Label>
            <Select value={depth} onValueChange={(v) => v && onDepthChange(v as Depth)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPTH_LEVELS.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.label} ({d.description})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="space-y-2">
          <Label>Bahasa</Label>
          <Select value={language} onValueChange={(v) => v && onLanguageChange(v as Language)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Instruksi Tambahan (opsional)</Label>
        <Textarea
          placeholder="Tambahkan instruksi khusus, misalnya: fokuskan pada SNI 2847:2019, gunakan contoh proyek gedung bertingkat..."
          value={customInstructions}
          onChange={(e) => onCustomInstructionsChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}
