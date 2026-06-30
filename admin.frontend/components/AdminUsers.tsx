"use client";

import React, { useState, useEffect } from "react";
// Ha az AWS Amplify-t használod a bejelentkezéshez, innen kérheted el a tokent
import { fetchAuthSession } from "aws-amplify/auth"; 

interface User {
  username: string;
  email: string;
  enabled: boolean;
  status: string;
  createdAt: string;
  groups: string[];
}

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form állapotok az új userhez
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Az új API Gateway URL-ed (ezt célszerűbb a .env-ből olvasni)
  const API_URL = process.env.NEXT_PUBLIC_API_URL as string + process.env.NEXT_PUBLIC_USERS_API_URL as string;
  // Segédfüggvény a token kinyeréséhez
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

  // 1. Felhasználók listázása (GET)
  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(API_URL, { method: "GET", headers });
      
      if (!res.ok) throw new Error("Hiba történt a felhasználók lekérésekor.");
      
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || "Ismeretlen hiba.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 2. Új felhasználó létrehozása (POST - CREATE_USER)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newEmail) return;

    setFormSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const headers = await getAuthHeaders();
      
      // Első lépés: User létrehozása
      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          action: "CREATE_USER",
          username: newUsername,
          email: newEmail,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Nem sikerült a felhasználó létrehozása.");

      // Második lépés: Ha választottunk ki csoportot, adjuk hozzá azonnal
      if (selectedGroup) {
        await fetch(API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            action: "ADD_TO_GROUP",
            username: newUsername,
            groupName: selectedGroup,
          }),
        });
      }

      setSuccessMessage(`Sikeresen létrehozva! Ideiglenes jelszó kiküldve az alábbi címre: ${newEmail}`);
      setNewUsername("");
      setNewEmail("");
      setSelectedGroup("");
      fetchUsers(); // Táblázat frissítése
    } catch (err: any) {
      setError(err.message || "Hiba történt.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // 3. Jelszó visszaállítás (POST - RESET_PASSWORD)
  const handleResetPassword = async (username: string) => {
    if (!confirm(`Biztosan alaphelyzetbe akarod állítani ${username} jelszavát?`)) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "RESET_PASSWORD", username }),
      });
      if (res.ok) alert("A jelszóvisszaállító emailt sikeresen kiküldtük!");
    } catch (err) {
      alert("Hiba a jelszó visszaállításakor.");
    }
  };

  // 4. Felhasználó törlése (POST - DELETE_USER)
  const handleDeleteUser = async (username: string) => {
    if (!confirm(`FIGYELEM! Biztosan véglegesen törölni akarod a(z) ${username} felhasználót?`)) return;
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ action: "DELETE_USER", username }),
      });
      if (res.ok) {
        setSuccessMessage("Felhasználó sikeresen törölve!");
        fetchUsers();
      }
    } catch (err) {
      alert("Hiba a törlés során.");
    }
  };

  // 5. EMAIL CÍM SZERKESZTÉSE (POST - UPDATE_EMAIL)
  const handleUpdateEmail = async (username: string, currentEmail: string) => {
    const newEmail = prompt(`Módosítsd ${username} email címét:`, currentEmail);
    
    // Ha a felhasználó megszakította (Cancel), vagy nem írt be semmit, vagy ugyanazt írta be
    if (!newEmail || newEmail.trim() === "" || newEmail === currentEmail) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(API_URL, {
        method: "POST",
        headers: headers as HeadersInit,
        body: JSON.stringify({
          action: "UPDATE_EMAIL",
          username,
          email: newEmail.trim(),
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Nem sikerült az email frissítése.");

      setSuccessMessage(`Sikeresen módosítottad ${username} email címét!`);
      fetchUsers(); // Táblázat újratöltése
    } catch (err: any) {
      setError(err.message || "Hiba történt az email módosításakor.");
    } finally {
      setLoading(false);
    }
  };

  // 6. CSOPORT MÓDOSÍTÁSA (Hozzáadás / Eltávolítás)
  const handleGroupChange = async (username: string, currentGroups: string[]) => {
    const targetGroup = prompt("Melyik csoporthoz szeretnéd rendelni? Írd be pontosan: Admin vagy Superadmin\n(Ha el akarod távolítani az összes csoportból, hagyd üresen!)");
    
    // Ha Cancel-t nyomott
    if (targetGroup === null) return;

    setLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      const headers = await getAuthHeaders();
      const cleanGroup = targetGroup.trim();

      // Ha üresen hagyta, akkor kivesszük a meglévő csoportjaiból (leminősítés sima userré)
      if (cleanGroup === "") {
        for (const group of currentGroups) {
          await fetch(API_URL, {
            method: "POST",
            headers: headers as HeadersInit,
            body: JSON.stringify({ action: "REMOVE_FROM_GROUP", username, groupName: group }),
          });
        }
        setSuccessMessage(`Minden csoportot eltávolítottál ${username} felhasználótól.`);
      } 
      // Ha beírta az Admin vagy Superadmin szót
      else if (cleanGroup === "Admin" || cleanGroup === "Superadmin") {
        // Első lépés: Biztonság kedvéért kivesszük a többiből, hogy ne legyen egyszerre Admin és Superadmin is
        for (const group of currentGroups) {
          if (group !== cleanGroup) {
            await fetch(API_URL, {
              method: "POST",
              headers: headers as HeadersInit,
              body: JSON.stringify({ action: "REMOVE_FROM_GROUP", username, groupName: group }),
            });
          }
        }
        // Második lépés: Hozzáadjuk az új csoporthoz
        const res = await fetch(API_URL, {
          method: "POST",
          headers: headers as HeadersInit,
          body: JSON.stringify({ action: "ADD_TO_GROUP", username, groupName: cleanGroup }),
        });
        
        if (!res.ok) throw new Error("Nem sikerült a csoporthoz adás.");
        setSuccessMessage(`${username} mostantól a(z) ${cleanGroup} csoport tagja!`);
      } else {
        alert("Hiba: Csak az 'Admin' vagy 'Superadmin' csoportnevek elfogadottak!");
      }

      fetchUsers(); // Táblázat frissítése
    } catch (err: any) {
      setError(err.message || "Hiba történt a csoport módosításakor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto p-4 text-slate-800">
      
      {/* Értesítési sávok */}
      {error && <div className="p-4 bg-rose-100 text-rose-700 border border-rose-300 rounded-lg font-medium">{error}</div>}
      {successMessage && <div className="p-4 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg font-medium">{successMessage}</div>}

      {/* ==================== ÚJ FELHASZNÁLÓ FORM ==================== */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-slate-900 flex items-center gap-2">
          <span>👤</span> Új felhasználó felvétele
        </h2>
        
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Felhasználónév</label>
            <input 
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              placeholder="pl. kovacspeti"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Email cím</label>
            <input 
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="peti@rr35.hu"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Kezdeti Csoport</label>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D6E43] text-sm"
            >
              <option value="">Nincs csoport (Sima user)</option>
              <option value="Admin">Admin</option>
              <option value="Superadmin">Superadmin</option>
            </select>
          </div>

          {/* EXCEL-ZÖLD LÉTREHOZÁS GOMB */}
          <button
            type="submit"
            disabled={formSubmitting}
            className="w-full bg-[#1D6E43] hover:bg-[#22804E] text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 text-sm shadow-sm disabled:opacity-50"
          >
            {formSubmitting ? "Létrehozás..." : "Felhasználó mentése"}
          </button>
        </form>
      </div>

      {/* ==================== FELHASZNÁLÓK TÁBLÁZATA ==================== */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">Regisztrált felhasználók listája</h2>
          <button 
            onClick={fetchUsers} 
            className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded-lg text-xs font-medium transition-colors"
          >
            🔄 Frissítés
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium">Felhasználók betöltése az AWS-ből...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Felhasználónév</th>
                  <th className="p-4">Email cím</th>
                  <th className="p-4">Csoportok</th>
                  <th className="p-4">Cognito Státusz</th>
                  <th className="p-4 text-right">Műveletek</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => (
                  <tr key={user.username} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-semibold text-slate-900">{user.username}</td>
                    <td className="p-4 text-slate-600">{user.email}</td>
                    <td className="p-4">
                      {user.groups.length === 0 ? (
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border">User</span>
                      ) : (
                        user.groups.map(g => (
                          <span 
                            key={g} 
                            className={`text-xs px-2 py-0.5 rounded border font-medium mr-1 ${
                              g === "Superadmin" ? "bg-amber-100 text-amber-800 border-amber-200" : "bg-blue-100 text-blue-800 border-blue-200"
                            }`}
                          >
                            {g}
                          </span>
                        ))
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${
                        user.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-700 animate-pulse"
                      }`}>
                        {user.status === "CONFIRMED" ? "Aktív" : `Meghívva (${user.status})`}
                      </span>
                    </td>
                    {/* <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      
                      {/* KRÉM SZÍNŰ JELSZÓ RESET GOMB 
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        className="bg-[#F5E6CC] hover:bg-[#EADCBF] text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors duration-200"
                      >
                        🔑 Jelszó Reset
                      </button>

                      {/* TÖRLÉS GOMB 
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-1.5 px-3 rounded-lg border border-rose-200 transition-colors duration-200"
                      >
                        ❌ Törlés
                      </button>

                    </td> */}
                    <td className="p-4 text-right space-x-2 whitespace-nowrap">
                      {/* KRÉM SZÍNŰ EMAIL SZERKESZTÉS GOMB */}
                      <button
                        onClick={() => handleUpdateEmail(user.username, user.email)}
                        className="bg-[#F5E6CC] hover:bg-[#EADCBF] text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors duration-200"
                      >
                        📝 Email
                      </button>

                      {/* KRÉM SZÍNŰ CSOPORT JOGOSULTSÁG GOMB */}
                      <button
                        onClick={() => handleGroupChange(user.username, user.groups)}
                        className="bg-[#F5E6CC] hover:bg-[#EADCBF] text-slate-800 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors duration-200"
                      >
                        🔑 Csoportok
                      </button>

                      {/* JELSZÓ RESET GOMB */}
                      <button
                        onClick={() => handleResetPassword(user.username)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors duration-200"
                      >
                        🔄 Jelszó Reset
                      </button>

                      {/* TÖRLÉS GOMB */}
                      <button
                        onClick={() => handleDeleteUser(user.username)}
                        className="bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-semibold py-1.5 px-3 rounded-lg border border-rose-200 transition-colors duration-200"
                      >
                        ❌ Törlés
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}