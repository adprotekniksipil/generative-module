"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Home,
  GraduationCap,
  FolderOpen,
  LogOut,
  BarChart3,
  UserCircle,
  ScrollText,
  Award,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/auth-context";

const menuItems = [
  { title: "Daftar Materi", href: "/belajar/materi", icon: BookOpen },
  { title: "Daftar Kuis", href: "/belajar/kuis", icon: ClipboardList },
  { title: "RPS", href: "/belajar/rps", icon: ScrollText },
  { title: "Kelas Saya", href: "/belajar/kelas", icon: FolderOpen },
  { title: "Nilai Saya", href: "/belajar/nilai", icon: Award },
  { title: "Evaluasi Saya", href: "/belajar/evaluasi", icon: BarChart3 },
];

export function StudentSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">Portal Belajar</span>
            <p className="text-[11px] text-muted-foreground font-medium">Teknik Sipil</p>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarSeparator className="mx-4 my-2" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/belajar" />}
                  isActive={pathname === "/belajar"}
                >
                  <Home className="h-4 w-4" />
                  <span>Beranda</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3">
            Pembelajaran
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname.startsWith(item.href)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 space-y-3">
        {user && (
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-3 space-y-2">
            <Link href="/belajar/profil" className="block hover:opacity-80 transition-opacity">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              {user.nim && (
                <p className="text-[11px] text-muted-foreground truncate">NIM: {user.nim}</p>
              )}
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </Link>
            <div className="flex items-center gap-3 pt-1 border-t border-emerald-500/10">
              <Link
                href="/belajar/profil"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <UserCircle className="h-3.5 w-3.5" />
                Profil
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Keluar
              </button>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
