'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, checkIsAllowed } from '@/lib/api';
import { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isAllowed: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true, isAllowed: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAllowed, setIsAllowed] = useState(false);

  useEffect(() => {
    async function checkUser(u: User | null) {
      setUser(u);
      if (u?.email) {
        const allowed = await checkIsAllowed(u.email);
        setIsAllowed(allowed);
      } else {
        setIsAllowed(false);
      }
      setLoading(false);
    }

    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session?.user ?? null);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      checkUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isAllowed }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
