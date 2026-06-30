"use client";

import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

// Defináljuk a DynamoDB üzenet típusát TypeScriptben
type NewsEntry = {
  id: string;
  title: string;
  description: string;
  createDate: string;
  enabled: boolean;
  createdBy: string;
};

export function AdminNews() {
  const NEWS_API_URL = process.env.NEXT_PUBLIC_API_URL as string + process.env.NEXT_PUBLIC_NEWS_API_URL as string;
  const [news, setNews] = useState<NewsEntry[]>([]);
  {/*
  // Kezdő tesztadatok (mock adatok), amíg az API nincs kész
  const [news, setNews] = useState<NewsEntry[]>([
    {
      id: "msg_1",
      title: "Kovács János",
      description: "Nagyon szuper lett a portfólió oldalad, gratulálok!",
      createDate: "2026-06-10 14:32",
      enabled: true,
      createdBy: "adri",
    },
    {
      id: "msg_2",
      title: "Teszt Elek",
      description: "Valami fura spamm szöveg, amit nem szeretnék kiengedni.",
      createDate: "2026-06-11 09:15",
      enabled: false,
      createdBy: "szilard",
    },
  ]);*/}

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const loadNews = async () => {
    try {
        setLoading(true);
        setError("");

        const session = await fetchAuthSession();
        const token = session.tokens?.idToken?.toString();

        if(!token) {
            throw new Error("Nincs érvényes token. Kérem jelentkezzen be újra.");
        }

        const response = await fetch(NEWS_API_URL, {
            headers: {
                "Authorization": token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Nem sikerült betölteni az üzeneteket. HTTP hiba: " + response.status);
        }

        const data = await response.json();
        setNews( data.sortedItems );
    } catch (err: any) {
        setError(err.message || "Hiba történt az hírek betöltése során.");
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  // Ezt a függvényt fogjuk meghívni, ha kattintasz a kapcsolóra (Toggle)
  const handleToggleEnabled = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    // 1. Kliensoldalon azonnal átbillentjük az állapotot (Optimistic UI update)
    setNews((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, enabled: nextStatus } : msg))
    );

    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      if(!token) {
        throw new Error("Nincs érvényes token. Kérem jelentkezzen be újra.");
      }

      const response = await fetch(NEWS_API_URL + `/${id}`, {
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
      setNews((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, enabled: currentStatus } : msg))
      );
    }
  };

  const getAuthHeaders = async (): Promise<HeadersInit> => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();
      return {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${token}` : "",
      };
    } catch (err) {
      console.error("Nem sikerült lekérni a session-t", err);
      return { "Content-Type": "application/json" };
    }
  };

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription) return;

    setFormSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const headers = await getAuthHeaders();
      
      // Első lépés: User létrehozása
      const res = await fetch(NEWS_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "CREATE_NEWS",
          title: newTitle,
          description: newDescription,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Nem sikerült a felhasználó létrehozása.");

      setSuccessMessage(`Sikeresen létrehozva!`);
      setNewTitle("");
      setNewDescription("");
      loadNews(); // Táblázat frissítése
    } catch (err: any) {
      setError(err.message || "Hiba történt.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const formatDynamoDate = (timestampStr: string) => {
    const timestamp : number =  +timestampStr;
    // Ha 10 számjegyű (másodperc), megszorozzuk 1000-rel
    const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp;
    
    return new Date(ms).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm max-w-xl mx-auto">
        <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
          Új hír felvétele
        </h2>
        
        <form onSubmit={handleCreateNews} className="space-y-4 max-w-xl">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap">Hír címe</label>
            <input 
              type="text"
              required
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="pl. Hír"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm text-slate-500"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Leírás</label>
            <textarea 
              required
              rows={4}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Most szombaton kezdődik az év!!"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm text-slate-500 resize-y min-h-[80px]"
            />
          </div>

          {/* EXCEL-ZÖLD LÉTREHOZÁS GOMB */}
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full sm:w-48 bg-[#1D6E43] hover:bg-[#22804E] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm shadow-sm disabled:opacity-50"
          >
            {formSubmitting ? "Létrehozás..." : "Hír mentése"}
          </button>
        </form>
      </div>

      {/* TÁBLÁZAT KONTÉNER (Overflow-x az esetleges mobil nézethez) */}
      { loading ? (
        <div className="text-slate-400 py-4 text-center">Hírek betöltése...</div>
      ) : (
        <div className="w-full overflow-x-auto bg-[#0f172a]/60 border border-[#334155]/60 rounded-xl shadow-inner">
          <table className="w-full text-left border-collapse">
            {/* TÁBLÁZAT FEJLÉC (DynamoDB attribútum nevek) */}
            <thead>
              <tr className="border-b border-[#334155] bg-slate-900/40 text-xs font-semibold uppercase tracking-wider text-slate-400">
                {/*<th className="px-6 py-4">ID</th>*/}
                <th className="px-6 py-4">Cím</th>
                <th className="px-6 py-4">Leírás</th>
                <th className="px-6 py-4">Létrehozva</th>
                <th className="px-6 py-4 text-center">Státusz (enabled)</th>
                <th className="px-6 py-4">Létrehozó</th>
              </tr>
            </thead>

            {/* TÁBLÁZAT TARTALOM */}
            <tbody className="divide-y divide-[#334155]/40 text-sm text-slate-300">
              { !news || news.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    Nincs megjeleníthető üzenet a DynamoDB-ben.
                  </td>
                </tr>
              ) : (
                news.map((newsEntry) => (
                  <tr key={newsEntry.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* ID /}
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 select-all max-w-[100px] truncate">
                      {newsEntry.id}
                    </td>*/}
                    {/* CíM */}
                    <td className="px-6 py-4 font-semibold text-slate-200 whitespace-nowrap">
                      {newsEntry.title}
                    </td>
                    {/* LEíRÁS */}
                    <td className="px-6 py-4 max-w-xs md:max-w-md xl:max-w-xl break-words text-slate-300">
                      {newsEntry.description}
                    </td>
                    {/* DÁTUM */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {formatDynamoDate(newsEntry.createDate)}
                    </td>
                    {/* ENABLED GOMB / SWITCH */}
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleToggleEnabled(newsEntry.id, newsEntry.enabled)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                          newsEntry.enabled
                            ? "bg-emerald-950/40 text-emerald-400 border-emerald-800/60 shadow-[0_0_12px_rgba(16,185,129,0.1)]"
                            : "bg-rose-950/30 text-rose-400 border-rose-900/40"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${newsEntry.enabled ? "bg-emerald-400" : "bg-rose-400"}`}></span>
                        {newsEntry.enabled ? "Aktív (True)" : "Inaktív (False)"}
                      </button>
                    </td>
                    {/* LÉTREHOZÓ */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {newsEntry.createdBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}