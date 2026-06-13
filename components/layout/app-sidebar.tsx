"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  ClipboardList,
  Home,
  GraduationCap,
  PlusCircle,
  FileText,
  Users,
  FolderOpen,
  LogOut,
  Layers,
  BarChart3,
  Settings,
  ScrollText,
  TableProperties,
  SlidersHorizontal,
  UserCircle,
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

const createItems = [
  { title: "Buat Materi", href: "/materials/new", icon: PlusCircle },
  { title: "Buat Soal", href: "/quizzes/new", icon: FileText },
  { title: "Buat RPS", href: "/rps/new", icon: ScrollText },
];

const manageItems = [
  { title: "Daftar Materi", href: "/materials", icon: BookOpen },
  { title: "Daftar Soal", href: "/quizzes", icon: ClipboardList },
  { title: "Daftar RPS", href: "/rps", icon: ScrollText },
  { title: "Kelola Bidang", href: "/topics", icon: Layers },
  { title: "Kelola Kelas", href: "/groups", icon: FolderOpen },
  { title: "Kelola Pengguna", href: "/users", icon: Users },
  { title: "Laporan & Evaluasi", href: "/reports", icon: BarChart3 },
  { title: "Pengaturan", href: "/settings", icon: Settings },
  { title: "Integrasi Moodle", href: "/settings/moodle", icon: BookOpen },
];

const gradeItems = [
  { title: "Matriks Nilai", href: "/grade-matrix", icon: TableProperties },
  { title: "Skala Nilai", href: "/settings/grade-scale", icon: SlidersHorizontal },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <Sidebar>
      <SidebarHeader className="px-5 py-5">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight">Modul Generator</span>
            <p className="text-[11px] text-muted-foreground font-medium">Teknik Sipil</p>
          </div>
        </Link>
      </SidebarHeader>

      <div className="px-4 mb-2">
        <Link
          href="/materials/new"
          className="flex items-center justify-center gap-2 w-full rounded-xl bg-primary text-primary-foreground py-2.5 px-4 text-sm font-semibold shadow-soft hover:opacity-90 transition-opacity"
        >
          <PlusCircle className="h-4 w-4" />
          Buat Konten Baru
        </Link>
      </div>

      <SidebarSeparator className="mx-4 my-2" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  render={<Link href="/dashboard" />}
                  isActive={pathname === "/dashboard"}
                >
                  <Home className="h-4 w-4" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3">
            Buat Konten
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {createItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3">
            Kelola
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {manageItems.map((item) => {
                const isActive =
                  item.href === "/settings"
                    ? pathname === "/settings"
                    : pathname === item.href ||
                      (pathname.startsWith(item.href + "/") && !pathname.endsWith("/new"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-[11px] uppercase tracking-wider font-semibold text-muted-foreground/60 px-3">
            Penilaian
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {gradeItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-4 space-y-3">
        {user && (
          <div className="rounded-xl bg-muted/50 border p-3 space-y-2">
            <div>
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            <div className="flex items-center justify-between">
              <Link
                href="/profile"
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <UserCircle className="h-3.5 w-3.5" />
                Profil Saya
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors"
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
