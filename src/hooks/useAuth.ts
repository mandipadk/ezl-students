import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
}

export function useAuth() {
  const { user, isLoaded: userLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    isLoading: !userLoaded,
    error: null,
  });

  useEffect(() => {
    if (userLoaded) {
      setState({
        isAuthenticated: !!user,
        userId: user?.id || null,
        isLoading: false,
        error: null,
      });
    }
  }, [user, userLoaded]);

  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      await signOut();
      setState({
        isAuthenticated: false,
        userId: null,
        isLoading: false,
        error: null,
      });
      router.push('/');
      toast.success('Successfully logged out');
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to logout',
        isLoading: false,
      }));
      toast.error('Failed to logout. Please try again.');
    }
  };

  return {
    ...state,
    logout,
  };
} 