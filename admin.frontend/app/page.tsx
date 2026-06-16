"use client";

import Image from "next/image";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { AdminDashboard } from "@/components/AdminDashboard";

export default function AdminMainPage() {
  const { user, isAdmin, isSuperadmin, loading, login, logout } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [pending, setPending] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setPending(true);

    try {
      await login(username.trim(), password);
    } catch (err: any) {
      console.error(err);
      // Cognito specifikus hibaüzenetek kezelése barátságos formában
      if (err.name === "NotAuthorizedException") {
        setErrorMsg("Hibás felhasználónév vagy jelszó!");
      } else if (err.name === "UserNotFoundException") {
        setErrorMsg("A felhasználó nem létezik!");
      } else {
        setErrorMsg("Hiba történt a bejelentkezés során. Próbáld újra!");
      }
    } finally {
      setPending(false);
    }
  };

  // 1. TÖLTÉSI ÁLLAPOT (Amíg ellenőrizzük a LocalStorage tokent)
  if (loading) {
    return (
      <div className="min-height-screen bg-[#C5952B] flex items-center justify-center text-[#9B1111]">
        Ellenőrzés...
      </div>
    );
  }

  // 2. SIKERES BEJELENTKEZÉS ÁG (Ha van user ÉS benne van az Admins csoportban)
  if (user && isAdmin) {
    return (
      <div className="min-height-screen bg-[#F5E6CC] text-slate-100">
        {/* KÉRT CÍMSOR / FEJLÉC */}
        <header className="bg-[#C5952B] border-b border-[#4A2A0C] px-8 py-4 flex justify-between items-center shadow-lg">
          <h1 className="text-2xl font-black tracking-wider text-[#9B1111] uppercase">
            Adminsite
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#9B1111]">Üdv, {user.username}!</span>
            <button
              onClick={logout}
              className="bg-[#1D6E43] hover:bg-[#4A2A0C] text-slate-100 text-xs font-bold py-2 px-4 rounded border border-[#1D6E43] hover:border-[#4A2A0C] transition-all cursor-pointer"
            >
              Kijelentkezés
            </button>
          </div>
        </header>

        {/* Az admin panel belső tartalma (egyelőre üres placeholder) */}
        <main className="flex h-screen w-full justify-center bg-[#F5E6CC] p-10">
          <AdminDashboard />
        </main>
      </div>
    );
  }

  // 3. HA VAN USER, DE NEM ADMIN (Biztonsági védelem)
  if (user && !isAdmin) {
    return (
      <div className="flex h-screen w-full bg-[#F5E6CC] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#C5952B] border border-[#C5952B] rounded-2xl p-8 max-w-md shadow-2xl">
          <h2 className="text-[#9B1111] text-xl font-bold mb-3">Hozzáférés megtagadva</h2>
          <p className="text-[#9B1111] text-sm mb-6">
            Be vagy jelentkezve ({user.username}), de nincs Adminisztrátori jogosultságod ehhez a felülethez!
          </p>
          <button onClick={logout} className="bg-[#1D6E43] hover:bg-[#4A2A0C] text-slate-100 font-bold py-2 px-6 rounded-lg">
            Kijelentkezés / Váltás
          </button>
        </div>
      </div>
    );
  }

  // 4. ALAPÉRTELMEZETT BEJELENTKEZŐ FELÜLET (Ha nincs belépve senki)
  return (
    <div className="flex h-screen w-full bg-[#F5E6CC] flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#C5952B] border border-[#C5952B] rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-[#9B1111] tracking-tight">Admin Login</h2>
          <p className="text-sm text-[#9B1111] mt-2">Kérlek add meg a hozzáférési adataidat</p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#9B1111] uppercase tracking-wider mb-2">
              Felhasználónév
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Admin felhasználónév"
              className="w-full bg-[#1D6E43] border border-[#1D6E43] rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-[#4A2A0C] transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#9B1111] uppercase tracking-wider mb-2">
              Jelszó
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#1D6E43] border border-[#1D6E43] rounded-lg px-4 py-2.5 text-slate-100 focus:outline-none focus:border-[#4A2A0C] transition-colors"
            />
          </div>

          {errorMsg && (
            <div className="text-xl font-semibold text-[#9B1111] bg-[#1D6E43] border border-[#1D6E43] rounded-lg p-3 text-center">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full bg-[#1D6E43] hover:bg-[#4A2A0C] disabled:bg-amber-300/50 text-slate-100 font-bold py-3 px-6 rounded-lg transition-colors shadow-md cursor-pointer flex justify-center items-center"
          >
            {pending ? "Bejelentkezés..." : "Belépés"}
          </button>
        </form>
      </div>
    </div>
  );
}