"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { signIn, signOut, getCurrentUser, fetchAuthSession } from "aws-amplify/auth";
import "@/lib/auth-config"; // Beolvassuk az Amplify konfigurációt

type AuthContextType = {
  user: any | null;
  isAdmin: boolean;
  isSuperadmin: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isSuperadmin, setIsSuperadmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Oldalbetöltéskor ellenőrizzük, van-e már aktív munkamenet a háttérben (LocalStorage)
  useEffect(() => {
    async function checkCurrentSession() {
      try {
        const currentUser = await getCurrentUser();
        const session = await fetchAuthSession();
        
        // Kiolvassuk a Cognito-tól kapott JWT tokenből a csoportokat (Groups)
        const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || [];
        
        setUser(currentUser);
        setIsAdmin(groups.includes("Admin")); // Igaz lesz, ha benne van az 'Admin' csoportban
        setIsSuperadmin(groups.includes("Superadmin")); // Igaz lesz, ha benne van az 'Superadmin' csoportban
      } catch (error) {
        // Nincs aktív session, semmi gond
        setUser(null);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    }
    checkCurrentSession();
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      // Hivatalos Amplify Cognito bejelentkezés kérés
      await signIn({ username, password });
      
      // Sikeres belépés után azonnal frissítjük az állapotot
      const currentUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const groups = (session.tokens?.idToken?.payload?.["cognito:groups"] as string[]) || [];

      setUser(currentUser);
      setIsAdmin(groups.includes("Admin"));
      setIsSuperadmin(groups.includes("Superadmin"));
    } catch (error) {
      setUser(null);
      setIsAdmin(false);
      throw error; // Továbbdobjuk a hibát a Login formnak (pl. hibás jelszó)
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
      setUser(null);
      setIsAdmin(false);
      setIsSuperadmin(false);
    } catch (error) {
      console.error("Hiba a kijelentkezés során:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, isSuperadmin, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}