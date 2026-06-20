import React, { createContext, useContext, useState, useEffect } from 'react';
import { signInAnonymously, onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '../firebase';

interface AuthContextType {
  user: User | null;
  committeeNumber: string | null;
  setCommittee: (num: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [committeeNumber, setCommitteeNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) {
        const savedCommittee = localStorage.getItem('committeeNumber');
        if (savedCommittee) {
          setCommitteeNumber(savedCommittee);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const setCommittee = async (num: string) => {
    try {
      if (!user) {
        await signInAnonymously(auth);
      }
      setCommitteeNumber(num);
      localStorage.setItem('committeeNumber', num);
    } catch (error) {
      console.error("Login failed", error);
      throw error;
    }
  };

  const logout = () => {
    setCommitteeNumber(null);
    localStorage.removeItem('committeeNumber');
    auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, committeeNumber, setCommittee, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
