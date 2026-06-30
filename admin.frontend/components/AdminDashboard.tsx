"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminUsers } from "@/components/AdminUsers";
import { UserSettings } from "./UserSettings";
import { AdminNews } from "./AdminNews";
//import {  AdminMessages } from "@/components/AdminMessages";

export function AdminDashboard() {
  const { user, isAdmin, isSuperadmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<"news" | "messages" | "users" | "settings">("news");

  return (
    <div className="w-full flex-1 bg-[#C5952B] border border-[#334155] rounded-xl p-6 flex flex-col">
      
      {/* TABS NAVIGÁCIÓ */}
      <div className="flex border-b border-[#334155] mb-6 gap-2">
        <button
          onClick={() => setActiveTab("news")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "news"
              ? "border-[#1D6E43] text-[#1D6E43]"
              : "border-transparent text-[#9B1111] hover:text-[#1D6E43]"
          }`}
        >
          📰 Hírek kezelése
        </button>
        <button
          onClick={() => setActiveTab("messages")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "messages"
              ? "border-[#1D6E43] text-[#1D6E43]"
              : "border-transparent text-[#9B1111] hover:text-[#1D6E43]"
          }`}
        >
          💬 Üzenetek kezelése
        </button>
        {isSuperadmin && (
          <button
            onClick={() => setActiveTab("users")}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === "users"
                ? "border-[#1D6E43] text-[#1D6E43]"
                : "border-transparent text-[#9B1111] hover:text-[#1D6E43]"
            }`}
          >
            👥 Felhasználók
          </button>
        )}
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-5 py-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "settings"
              ? "border-[#1D6E43] text-[#1D6E43]"
              : "border-transparent text-[#9B1111] hover:text-[#1D6E43]"
          }`}
        >
          ⚙️ Beállítások
        </button>
      </div>

      {/* TABS TARTALOM */}
      <div className="flex-1 bg-[#0f172a]/40 border border-[#334155]/60 rounded-lg p-6">
        {activeTab === "news" && (
          <div className="space-y-2">
            <AdminNews/>
          </div>
        )}

        {activeTab === "messages" && (
          <div className="space-y-2">
            <h2>Ide jon az üzenetek kezelese</h2>
          </div>
        )}

        {activeTab === "users" && isSuperadmin && (
          <div className="space-y-2">
            {/*<h2 className="text-xl font-bold text-slate-200 mb-4">Regisztrált felhasználók</h2>*/}
            {/*<p className="text-sm text-slate-400">Itt láthatod majd a Cognitóba regisztrált usereket, és itt tudod őket az Admins csoportba tenni.</p>*/}
            <AdminUsers/>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-2">
            {/*<h2 className="text-xl font-bold text-slate-200 mb-4">Admin Beállítások</h2>*/}
            {/*<p className="text-sm text-slate-400">Globális rendszerbeállítások és az adminisztrátori profil testreszabása.</p>*/}
            <UserSettings/>
          </div>
        )}
      </div>

    </div>
  );
}