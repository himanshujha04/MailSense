import { useState } from 'react';
import type { ReactNode } from 'react';
import { AuthContext } from './useAuth';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<{ name: string } | null>(null);

    const login = (name: string) => {
        setUser({ name });
    };

    const logout = () => {
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
