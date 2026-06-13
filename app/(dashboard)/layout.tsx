"use client";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AuthProvider } from "@/contexts/auth-context";
import { TopicsProvider } from "@/contexts/topics-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <TopicsProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset className="overflow-y-auto">{children}</SidebarInset>
        </SidebarProvider>
      </TopicsProvider>
    </AuthProvider>
  );
}
