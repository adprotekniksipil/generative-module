import React from "react";
import { HardHat, Compass, FileStack, BookOpen, PenTool, LayoutTemplate, BriefcaseBusiness, Map, LineChart, Users, CheckCircle, GraduationCap, Building2, Sparkles, ClipboardList, FolderOpen } from "lucide-react";

export function StatMaterialIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="24" cy="42" rx="16" ry="4" fill="#e2e8f0" />
      
      {/* Folders Stack (Back to Front) */}
      <rect x="18" y="10" width="18" height="26" rx="2" fill="#cbd5e1" transform="rotate(10 27 23)" />
      <rect x="14" y="12" width="18" height="26" rx="2" fill="#94a3b8" transform="rotate(5 23 25)" />
      
      {/* Front Folder (Blue) */}
      <rect x="10" y="14" width="22" height="26" rx="2" fill="#3b82f6" />
      {/* Folder Tab/Label */}
      <rect x="10" y="14" width="22" height="6" rx="2" fill="#2563eb" />
      
      {/* Inner Document */}
      <rect x="13" y="24" width="16" height="12" rx="1" fill="#ffffff" />
      <circle cx="17" cy="28" r="2" fill="#93c5fd" />
      <rect x="21" y="27" width="6" height="1.5" rx="0.75" fill="#cbd5e1" />
      <rect x="21" y="30" width="6" height="1.5" rx="0.75" fill="#cbd5e1" />
    </svg>
  );
}

export function StatQuizIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="24" cy="42" rx="14" ry="4" fill="#e2e8f0" />
      
      {/* Base Pink Board */}
      <rect x="12" y="8" width="24" height="32" rx="3" fill="#fbcfe8" />
      
      {/* White Paper */}
      <rect x="15" y="12" width="18" height="26" rx="1.5" fill="#ffffff" />
      
      {/* Purple Document Header */}
      <rect x="15" y="12" width="18" height="6" fill="#c084fc" />
      
      {/* Document Lines */}
      <rect x="18" y="22" width="12" height="1.5" rx="0.75" fill="#cbd5e1" />
      <rect x="18" y="26" width="9" height="1.5" rx="0.75" fill="#cbd5e1" />
      
      {/* Top Clip */}
      <rect x="20" y="6" width="8" height="4" rx="1" fill="#94a3b8" />
      
      {/* Round Stamp/Badge */}
      <circle cx="32" cy="34" r="6" fill="#f472b6" />
      <path d="M29 34l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatClassIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="24" cy="42" rx="14" ry="4" fill="#e2e8f0" />
      
      {/* Base Green Document */}
      <rect x="12" y="10" width="24" height="30" rx="2" fill="#d1fae5" />
      <rect x="14" y="12" width="20" height="26" rx="1" fill="#ffffff" />
      
      {/* Green Header */}
      <rect x="14" y="12" width="20" height="6" fill="#34d399" />
      
      {/* Info Boxes */}
      <rect x="18" y="22" width="12" height="2" rx="1" fill="#a7f3d0" />
      <rect x="18" y="26" width="8" height="2" rx="1" fill="#a7f3d0" />
      <rect x="18" y="30" width="12" height="2" rx="1" fill="#a7f3d0" />
      
      {/* Bottom Check Icon */}
      <circle cx="32" cy="34" r="6" fill="#10b981" />
      <path d="M29 34l2 2 4-4" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatStudentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Shadow */}
      <ellipse cx="24" cy="42" rx="16" ry="4" fill="#e2e8f0" />
      
      {/* Center Figure (Yellow/Orange) */}
      <circle cx="24" cy="18" r="4" fill="#fbbf24" opacity="0.4" />
      <rect x="18" y="24" width="12" height="14" rx="4" fill="#fbbf24" opacity="0.4" />
      
      {/* Center Figure Base */}
      <circle cx="24" cy="18" r="4" fill="#fbbf24" />
      <path d="M18 34v-6a4 4 0 014-4h4a4 4 0 014 4v6H18z" fill="#f59e0b" />
      
      {/* Left Figure (Green) */}
      <circle cx="16" cy="22" r="3" fill="#34d399" />
      <path d="M12 36v-5a3 3 0 013-3h2a3 3 0 013 3v5h-8z" fill="#10b981" />
      
      {/* Right Figure (Blue) */}
      <circle cx="32" cy="22" r="3" fill="#60a5fa" />
      <path d="M28 36v-5a3 3 0 013-3h2a3 3 0 013 3v5h-8z" fill="#3b82f6" />
    </svg>
  );
}

{/* HERO BACKGROUND - DOSEN */}
export function HeroDosenIllustration() {
  return (
    <div className="absolute inset-0 right-0 h-full w-[400px] sm:w-[500px] md:w-[600px] pointer-events-none overflow-hidden opacity-90 right-0 ml-auto flex items-center">
      {/* Abstract Glowing shapes */}
      <div className="absolute top-10 right-10 w-96 h-96 bg-[#256877] rounded-full blur-3xl opacity-50 mix-blend-screen" />
      <div className="absolute -bottom-10 right-40 w-64 h-64 bg-[#76A8B5] rounded-full blur-3xl opacity-30 mix-blend-screen" />
      
      {/* Architectural Blueprints Vectors */}
      <div className="absolute top-8 right-12 w-64 h-48 bg-white/5 rounded-xl border border-white/10 overflow-hidden transform rotate-3 backdrop-blur-sm shadow-xl flex items-center justify-center p-4">
        <div className="w-full h-full border border-teal-200/20 rounded grid grid-cols-4 grid-rows-3 gap-2 p-2">
            <div className="col-span-1 bg-teal-200/10 rounded-sm"></div>
            <div className="col-span-3 bg-teal-200/20 rounded-sm"></div>
            <div className="col-span-2 bg-teal-200/10 rounded-sm flex justify-center items-center"><Building2 className="text-teal-100/30 w-5 h-5" /></div>
            <div className="col-span-2 bg-teal-500/30 rounded-sm flex items-center justify-center"><LineChart className="text-teal-100/50 w-6 h-6" /></div>
            <div className="col-span-4 bg-teal-200/10 rounded-sm flex items-center px-4"><div className="w-1/2 h-1 bg-teal-200/40 rounded-full"></div></div>
        </div>
      </div>

      <div className="absolute top-4 right-48 w-40 h-32 bg-white/5 rounded-xl border border-white/10 overflow-hidden transform -rotate-6 backdrop-blur-md shadow-2xl flex items-center justify-center p-4">
         <FileStack className="text-white/40 w-12 h-12" />
      </div>
      
      {/* Floating tools */}
      <div className="absolute top-[60%] right-[320px] bg-amber-500/20 p-3 rounded-2xl backdrop-blur-md shadow-lg border border-amber-500/30 text-amber-300">
        <HardHat size={28} />
      </div>
      <div className="absolute top-[20%] right-[300px] bg-blue-500/20 p-3 rounded-2xl backdrop-blur-md shadow-lg border border-blue-500/30 text-blue-300">
        <Compass size={28} />
      </div>
      <div className="absolute top-[40%] right-[40px] bg-emerald-500/20 p-4 rounded-2xl backdrop-blur-md shadow-lg border border-emerald-500/30 text-emerald-300">
        <LayoutTemplate size={36} />
      </div>
      
      {/* Base floor grid */}
      <div className="absolute bottom-0 right-[-10%] w-[120%] h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgyMHYyMEgyMHptLTIwIDBoMjB2MjBIMHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
    </div>
  );
}

{/* HERO BACKGROUND - STUDENT */}
export function HeroStudentIllustration() {
  return (
    <div className="absolute inset-0 right-0 h-full w-[400px] sm:w-[500px] md:w-[600px] pointer-events-none overflow-hidden opacity-90 right-0 ml-auto">
      {/* Abstract Glowing shapes */}
      <div className="absolute top-0 right-20 w-80 h-80 bg-[#1A8A6D] rounded-full blur-3xl opacity-50 mix-blend-screen" />
      <div className="absolute bottom-0 right-60 w-64 h-64 bg-[#34D399] rounded-full blur-3xl opacity-20 mix-blend-screen" />
      
      {/* Centerpiece Book/Laptop */}
      <div className="absolute top-12 right-24 w-56 h-40 bg-white/5 rounded-2xl border border-white/10 overflow-hidden transform -rotate-2 backdrop-blur-sm shadow-2xl flex items-center justify-center p-4">
        <div className="w-full h-full rounded border-2 border-emerald-300/20 p-2 flex flex-col gap-2">
           <div className="flex-1 rounded-sm bg-gradient-to-tr from-emerald-500/20 to-teal-400/10 flex items-center justify-center shadow-inner">
             <BookOpen className="text-emerald-200/60 w-12 h-12" />
           </div>
           <div className="w-8 h-1 bg-emerald-200/50 rounded-full mx-auto mt-1" />
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-[25%] right-[320px] bg-yellow-500/20 p-3 rounded-full backdrop-blur-md shadow-lg border border-yellow-500/30 text-yellow-300 transform rotate-12">
        <GraduationCap size={32} />
      </div>
       <div className="absolute top-[65%] right-[100px] bg-blue-400/20 p-3 rounded-xl backdrop-blur-md shadow-lg border border-blue-400/30 text-blue-200 transform -rotate-12">
        <Building2 size={24} />
      </div>

       {/* Base floor grid */}
       <div className="absolute bottom-0 right-[-10%] w-[120%] h-32 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwem0yMCAyMGgyMHYyMEgyMHptLTIwIDBoMjB2MjBIMHoiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyIvPjwvc3ZnPg==')] [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
    </div>
  );
}

{/* ACTION CARDS BACKGROUND ARTS */}

export function ActionMaterialArt() {
  return (
    <div className="absolute -right-4 -bottom-4 opacity-[0.12] transform rotate-[-8deg] group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 ease-out pointer-events-none">
      <div className="relative">
        <BookOpen strokeWidth={1.5} className="w-36 h-36 text-white" />
        <Sparkles strokeWidth={2} className="absolute -top-4 -left-4 w-12 h-12 text-white" />
      </div>
    </div>
  );
}

export function ActionQuizArt() {
  return (
    <div className="absolute -right-4 -bottom-4 opacity-[0.12] transform rotate-[8deg] group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 ease-out pointer-events-none">
      <div className="relative">
        <ClipboardList strokeWidth={1.5} className="w-36 h-36 text-white" />
        <CheckCircle strokeWidth={2} className="absolute bottom-4 -left-6 w-12 h-12 text-white" />
      </div>
    </div>
  );
}

export function ActionClassArt() {
  return (
    <div className="absolute -right-4 -bottom-4 opacity-[0.12] transform rotate-[-5deg] group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 ease-out pointer-events-none">
      <div className="relative">
        <Users strokeWidth={1.5} className="w-36 h-36 text-white" />
        <FolderOpen strokeWidth={2} className="absolute top-2 -left-8 w-12 h-12 text-white" />
      </div>
    </div>
  );
}

export function ActionLearnArt() {
  return (
    <div className="absolute -right-4 -bottom-8 opacity-[0.12] transform rotate-[-10deg] group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 ease-out pointer-events-none">
      <div className="relative">
        <BookOpen strokeWidth={1.5} className="w-40 h-40 text-white" />
        <Compass strokeWidth={2} className="absolute -top-4 -left-4 w-14 h-14 text-white" />
      </div>
    </div>
  );
}

export function ActionTestArt() {
  return (
    <div className="absolute -right-4 -bottom-4 opacity-[0.12] transform rotate-[10deg] group-hover:scale-110 group-hover:rotate-0 transition-transform duration-700 ease-out pointer-events-none">
      <div className="relative">
        <LayoutTemplate strokeWidth={1.5} className="w-36 h-36 text-white" />
        <CheckCircle strokeWidth={2} className="absolute bottom-2 -left-6 w-14 h-14 text-white" />
      </div>
    </div>
  );
}
