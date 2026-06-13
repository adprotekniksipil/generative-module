"use client";

import { useState } from "react";
import { Globe, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface UrlInputProps {
  onContentExtracted: (content: string, url: string) => void;
}

export function UrlInput({ onContentExtracted }: UrlInputProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleScrape = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch("/api/upload/url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) throw new Error("Gagal mengambil konten");

      const data = await res.json();
      onContentExtracted(data.text, url);
    } catch {
      alert("Gagal mengambil konten dari URL. Pastikan URL valid dan bisa diakses.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Paste URL artikel atau blog..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>
      <Button
        onClick={handleScrape}
        disabled={isLoading || !url.trim()}
        className="rounded-xl"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Ambil Konten"
        )}
      </Button>
    </div>
  );
}
