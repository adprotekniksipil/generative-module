import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-soft">
          <GraduationCap className="h-6 w-6" />
        </div>
        <div>
          <span className="font-bold text-lg tracking-tight">Modul Generator</span>
          <p className="text-xs text-muted-foreground">Teknik Sipil</p>
        </div>
      </div>
      {children}
    </div>
  );
}
