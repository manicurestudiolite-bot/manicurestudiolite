import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type AppointmentStatus = 'PENDENTE' | 'PREPAGO' | 'CONCLUIDO' | 'CANCELADO' | 'FALTOU';

export interface Appointment {
  id: string;
  user_id: string;
  client_id: string;
  service_id: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  price?: number;
  paid_amount?: number;
  notes?: string;
  created_at: string;
  client?: {
    id: string;
    name: string;
    phone: string;
  };
  service?: {
    id: string;
    name: string;
    color?: string;
  };
}

export const useAppointments = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['appointments', params],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:clients(id, name, phone),
          service:services(id, name, color)
        `)
        .order('start_time');

      if (params?.startDate) {
        query = query.gte('start_time', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('start_time', params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Appointment[];
    },
  });
};

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      appointment: Omit<Appointment, 'id' | 'user_id' | 'created_at' | 'client' | 'service'>
    ) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('appointments')
        .insert({ ...appointment, user_id: user.id })
        .select(`
          *,
          client:clients(id, name, phone),
          service:services(id, name, color)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar agendamento');
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Appointment> & { id: string }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          client:clients(id, name, phone),
          service:services(id, name, color)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar agendamento');
    },
  });
};

export const useUpdateAppointmentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppointmentStatus }) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Status atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar status');
    },
  });
};

export const useDeleteAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Agendamento excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir agendamento');
    },
  });
};
