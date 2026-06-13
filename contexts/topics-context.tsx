"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { TOPICS_FALLBACK, dbTopicsToFlat } from "@/lib/constants/topics";
import type { Topic, DBTopic } from "@/lib/constants/topics";

interface TopicsContextType {
  topics: Topic[];
  getTopicLabel: (topicSlug: string) => string;
  getSubTopicLabel: (topicSlug: string, subTopicSlug: string) => string;
  refreshTopics: () => Promise<void>;
}

const TopicsContext = createContext<TopicsContextType>({
  topics: TOPICS_FALLBACK,
  getTopicLabel: (slug) => TOPICS_FALLBACK.find((t) => t.id === slug)?.label ?? slug,
  getSubTopicLabel: (topicSlug, subSlug) =>
    TOPICS_FALLBACK.find((t) => t.id === topicSlug)?.subtopics.find((s) => s.id === subSlug)?.label ?? subSlug,
  refreshTopics: async () => {},
});

export function TopicsProvider({ children }: { children: React.ReactNode }) {
  const [topics, setTopics] = useState<Topic[]>(TOPICS_FALLBACK);

  const fetchTopics = async () => {
    try {
      const res = await fetch("/api/topics");
      if (!res.ok) return;
      const data: DBTopic[] = await res.json();
      if (data && data.length > 0) setTopics(dbTopicsToFlat(data));
    } catch {/* fallback stays */}
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const getTopicLabel = (slug: string) =>
    topics.find((t) => t.id === slug)?.label ?? slug;

  const getSubTopicLabel = (topicSlug: string, subSlug: string) =>
    topics.find((t) => t.id === topicSlug)?.subtopics.find((s) => s.id === subSlug)?.label ?? subSlug;

  return (
    <TopicsContext.Provider value={{ topics, getTopicLabel, getSubTopicLabel, refreshTopics: fetchTopics }}>
      {children}
    </TopicsContext.Provider>
  );
}

export function useTopics() {
  return useContext(TopicsContext);
}
