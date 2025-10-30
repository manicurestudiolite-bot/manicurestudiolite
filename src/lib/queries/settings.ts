import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type Theme = 'light' | 'dark' | 'system';

export interface UserSettings {
  user_id: string;
  notif_24h: boolean;
  notif_3h: boolean;
  notif_1h: boolean;
  theme: Theme;
}

export const useSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, return defaults
      if (!data) {
        return {
          user_id: user.id,
          notif_24h: true,
          notif_3h: true,
          notif_1h: true,
          theme: 'system' as Theme,
        };
      }

      return data as UserSettings;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: Partial<Omit<UserSettings, 'user_id'>>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('user_settings')
        .upsert(
          { user_id: user.id, ...settings },
          { onConflict: 'user_id' }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('Configurações atualizadas!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar configurações');
    },
  });
};
