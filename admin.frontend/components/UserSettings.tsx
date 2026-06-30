"use client";

import React, { useState } from "react";
// Az AWS Amplify v6 gyári függvényei a saját adatok módosítására
import { updatePassword, updateUserAttribute } from "aws-amplify/auth";

export function UserSettings() {
  // Jelszó állapotok
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  // Email állapotok
  const [newEmail, setNewEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // A: SAJÁT JELSZÓ MÓDOSÍTÁSA
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await updatePassword({ oldPassword, newPassword });
      setMessage({ type: "success", text: "A jelszavad sikeresen megváltozott!" });
      setOldPassword("");
      setNewPassword("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Hiba a jelszó módosításakor." });
    } finally {
      setLoading(false);
    }
  };

  // B: SAJÁT EMAIL CÍM MÓDOSÍTÁSA
  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await updateUserAttribute({
        userAttribute: { attributeKey: "email", value: newEmail }
      });
      setMessage({ 
        type: "success", 
        text: "Email cím frissítve! Kérjük, ellenőrizd a postaládádat a megerősítő kódért." 
      });
      setNewEmail("");
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Hiba az email módosításakor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto p-4 text-slate-800">
      <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
        ⚙️ Fiók Beállítások
      </h1>

      {/* Értesítések */}
      {message.text && (
        <div className={`p-4 rounded-lg font-medium border ${
          message.type === "success" ? "bg-emerald-100 text-emerald-800 border-emerald-300" : "bg-rose-100 text-rose-700 border-rose-300"
        }`}>
          {message.text}
        </div>
      )}

      {/* JELSZÓ MÓDOSÍTÁS FORM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-slate-900">Jelszó megváltoztatása</h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Jelenlegi jelszó</label>
            <input 
              type="password" 
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Új jelszó</label>
            <input 
              type="password" 
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            />
          </div>
          {/* EXCEL-ZÖLD GOMB */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1D6E43] hover:bg-[#22804E] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm shadow-sm disabled:opacity-50"
          >
            {loading ? "Mentés..." : "Jelszó frissítése"}
          </button>
        </form>
      </div>

      {/* EMAIL MÓDOSÍTÁS FORM */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-slate-900">Email cím módosítása</h2>
        <form onSubmit={handleEmailChange} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Új email cím</label>
            <input 
              type="email" 
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="uj-email@rr35.hu"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            />
          </div>
          {/* EXCEL-ZÖLD GOMB */}
          <button
            type="submit"
            disabled={loading}
            className="bg-[#1D6E43] hover:bg-[#22804E] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm shadow-sm disabled:opacity-50"
          >
            {loading ? "Mentés..." : "Email cím frissítése"}
          </button>
        </form>
      </div>
    </div>
  );
}