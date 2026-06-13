"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { TopicsProvider } from "@/contexts/topics-context";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TopicsProvider>
        <SidebarProvider>
          <StudentSidebar />
          <SidebarInset className="overflow-y-auto">{children}</SidebarInset>
        </SidebarProvider>
      </TopicsProvider>
    </AuthProvider>
  );
}
