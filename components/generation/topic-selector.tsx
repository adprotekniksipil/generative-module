"use client";

import { useTopics } from "@/contexts/topics-context";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TopicSelectorProps {
  topic: string;
  subTopic: string;
  onTopicChange: (topic: string) => void;
  onSubTopicChange: (subTopic: string) => void;
}

export function TopicSelector({
  topic,
  subTopic,
  onTopicChange,
  onSubTopicChange,
}: TopicSelectorProps) {
  const { topics } = useTopics();

  const selectedTopic = topics.find((t) => t.id === topic);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label>Bidang</Label>
        <Select value={topic} onValueChange={(v) => v && onTopicChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Pilih bidang..." />
          </SelectTrigger>
          <SelectContent>
            {topics.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Sub-topik</Label>
        <Select
          value={subTopic}
          onValueChange={(v) => v && onSubTopicChange(v)}
          disabled={!topic}
        >
          <SelectTrigger>
            <SelectValue placeholder="Pilih sub-topik..." />
          </SelectTrigger>
          <SelectContent>
            {selectedTopic?.subtopics.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
