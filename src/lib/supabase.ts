import { createClient } from '@supabase/supabase-js';
import { toast } from '../components/ToastCustom';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Erro de configuração do Supabase');
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    flowType: 'pkce',
    autoRefreshToken: true,
    debug: false,
    storage: {
      getItem: (key) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key, value) => {
        try {
          if (value) {
            localStorage.setItem(key, value);
          }
        } catch {
          console.warn('Failed to save auth state to localStorage');
        }
      },
      removeItem: (key) => {
        try {
          if (key) {
            localStorage.removeItem(key);
          }
        } catch {
          console.warn('Failed to remove auth state from localStorage');
        }
      }
    }
  }
});