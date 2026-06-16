"use client";

import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

// Defináljuk a DynamoDB üzenet típusát TypeScriptben
type Message = {
  id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
  enabled: boolean; // Az új attribútum, amit kértél
};

export function AdminMessages() {
  // Kezdő tesztadatok (mock adatok), amíg az API nincs kész
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg_1",
      name: "Kovács János",
      email: "janos@example.com",
      message: "Nagyon szuper lett a portfólió oldalad, gratulálok!",
      createdAt: "2026-06-10 14:32",
      enabled: true,
    },
    {
      id: "msg_2",
      name: "Teszt Elek",
      email: "elek@example.com",
      message: "Valami fura spamm szöveg, amit nem szeretnék kiengedni.",
      createdAt: "2026-06-11 09:15",
      enabled: false,
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadMessages = async () => {
    try {
        setLoading(true);
        setError("");

        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if(!token) {
            throw new Error("Nincs érvényes token. Kérem jelentkezzen be újra.");
        }

        const response = await fetch("https://1sszvc3u7f.execute-api.eu-central-1.amazonaws.com/admin/messages", {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Nem sikerült betölteni az üzeneteket. HTTP hiba: " + response.status);
        }

        const data = await response.json();
        setMessages(data);
    } catch (err: any) {
        setError(err.message || "Hiba történt az üzenetek betöltése során.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  // Ezt a függvényt fogjuk meghívni, ha kattintasz a kapcsolóra (Toggle)
  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // 1. Kliensoldalon azonnal átbillentjük az állapotot (Optimistic UI update)
    setMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, enabled: nextStatus } : msg))
    );

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if(!token) {
        throw new Error("Nincs érvényes token. Kérem jelentkezzen be újra.");
      }

      const response = await fetch(`https://1sszvc3u7f.execute-api.eu-central-1.amazonaws.com/admin/messages/${id}`, {
        method: "PATCH",
        headers: {
          "Authorization": token,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ enabled: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Nem sikerült frissíteni a státuszt.");
      }

      console.log(`Üzenet ${id} állapota módosítva: ${nextStatus}`);
    } catch (error) {
      console.error("Nem sikerült frissíteni a státuszt:", error);
      // Ha az API elhasal, visszaállítjuk az eredetire
      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, enabled: currentStatus } : msg))
      );
    }
  };

  if (loading) {
    return <div className="text-slate-400 py-4 text-center">Üzenetek betöltése...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-200">Vendégkönyv üzenetek</h2>
          <p className="text-xs text-slate-400 mt-1">
            Itt láthatod a DynamoDB tábla oszlopait. Az "Engedélyezve" kapcsolóval szabályozhatod, mi jelenjen meg a weblapon.
          </p>
        </div>
      </div>

      {/* TÁBLÁZAT KONTÉNER (Overflow-x az esetleges mobil nézethez) */}
      <div className="w-full overflow-x-auto bg-[#0f172a]/60 border border-[#334155]/60 rounded-xl shadow-inner">
        <table className="w-full text-left border-collapse">
          {/* TÁBLÁZAT FEJLÉC (DynamoDB attribútum nevek) */}
          <thead>
            <tr className="border-b border-[#334155] bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <th className="px-6 py-4">ID</th>
              <th className="px-6 py-4">Név (name)</th>
              <th className="px-6 py-4">E-mail (email)</th>
              <th className="px-6 py-4">Üzenet (message)</th>
              <th className="px-6 py-4">Dátum (create date)</th>
              <th className="px-6 py-4 text-center">Státusz (enabled)</th>
            </tr>
          </thead>

          {/* TÁBLÁZAT TARTALOM */}
          <tbody className="divide-y divide-[#334155]/40 text-sm text-slate-300">
            {messages.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-slate-500">
                  Nincs megjeleníthető üzenet a DynamoDB-ben.
                </td>
              </tr>
            ) : (
              messages.map((msg) => (
                <tr key={msg.id} className="hover:bg-slate-800/30 transition-colors">
                  {/* ID */}
                  <td className="px-6 py-4 font-mono text-xs text-slate-500 select-all max-w-[100px] truncate">
                    {msg.id}
                  </td>
                  {/* NÉV */}
                  <td className="px-6 py-4 font-semibold text-slate-200 whitespace-nowrap">
                    {msg.name}
                  </td>
                  {/* EMAIL */}
                  <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                    {msg.email}
                  </td>
                  {/* ÜZENET */}
                  <td className="px-6 py-4 max-w-xs md:max-w-md xl:max-w-xl break-words text-slate-300">
                    {msg.message}
                  </td>
                  {/* DÁTUM */}
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                    {msg.createdAt}
                  </td>
                  {/* ENABLED GOMB / SWITCH */}
                  <td className="px-6 py-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(msg.id, msg.enabled)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                        msg.enabled
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                          : "bg-rose-950/30 text-rose-400 border-rose-900/40"
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${msg.enabled ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                      {msg.enabled ? "Aktív (True)" : "Inaktív (False)"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}