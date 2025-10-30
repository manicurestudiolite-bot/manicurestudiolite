import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RevenueData {
  period: string;
  totalCents: number;
  count: number;
}

export interface TopService {
  serviceId: string;
  serviceName: string;
  count: number;
  totalCents: number;
}

export interface TopClient {
  clientId: string;
  clientName: string;
  count: number;
  totalCents: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  brand?: string;
  qty: number;
  low_stock_limit: number;
}

export const useRevenue = (params?: {
  period?: string;
  startDate?: string;
  endDate?: string;
}) => {
  return useQuery({
    queryKey: ['revenue', params],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('start_time, price, paid_amount, status')
        .eq('status', 'CONCLUIDO');

      if (params?.startDate) {
        query = query.gte('start_time', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('start_time', params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Aggregate data by period
      const revenueMap = new Map<string, { totalCents: number; count: number }>();

      data.forEach((apt: any) => {
        const date = new Date(apt.start_time);
        let periodKey: string;

        if (params?.period === 'day') {
          periodKey = date.toISOString().split('T')[0];
        } else if (params?.period === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
        } else {
          // month
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        const amount = (apt.paid_amount || apt.price || 0) * 100;

        if (!revenueMap.has(periodKey)) {
          revenueMap.set(periodKey, { totalCents: 0, count: 0 });
        }

        const current = revenueMap.get(periodKey)!;
        current.totalCents += amount;
        current.count += 1;
      });

      return Array.from(revenueMap.entries())
        .map(([period, data]) => ({
          period,
          ...data,
        }))
        .sort((a, b) => a.period.localeCompare(b.period));
    },
  });
};

export const useTopServices = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['top-services', params],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('service_id, price, paid_amount, status, service:services(name)')
        .eq('status', 'CONCLUIDO');

      if (params?.startDate) {
        query = query.gte('start_time', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('start_time', params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const servicesMap = new Map<string, { name: string; count: number; totalCents: number }>();

      data.forEach((apt: any) => {
        const serviceId = apt.service_id;
        const serviceName = apt.service?.name || 'Serviço desconhecido';
        const amount = (apt.paid_amount || apt.price || 0) * 100;

        if (!servicesMap.has(serviceId)) {
          servicesMap.set(serviceId, { name: serviceName, count: 0, totalCents: 0 });
        }

        const current = servicesMap.get(serviceId)!;
        current.count += 1;
        current.totalCents += amount;
      });

      return Array.from(servicesMap.entries())
        .map(([serviceId, data]) => ({
          serviceId,
          serviceName: data.name,
          count: data.count,
          totalCents: data.totalCents,
        }))
        .sort((a, b) => b.totalCents - a.totalCents);
    },
  });
};

export const useTopClients = (params?: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['top-clients', params],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select('client_id, price, paid_amount, status, client:clients(name)')
        .eq('status', 'CONCLUIDO');

      if (params?.startDate) {
        query = query.gte('start_time', params.startDate);
      }

      if (params?.endDate) {
        query = query.lte('start_time', params.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const clientsMap = new Map<string, { name: string; count: number; totalCents: number }>();

      data.forEach((apt: any) => {
        const clientId = apt.client_id;
        const clientName = apt.client?.name || 'Cliente desconhecido';
        const amount = (apt.paid_amount || apt.price || 0) * 100;

        if (!clientsMap.has(clientId)) {
          clientsMap.set(clientId, { name: clientName, count: 0, totalCents: 0 });
        }

        const current = clientsMap.get(clientId)!;
        current.count += 1;
        current.totalCents += amount;
      });

      return Array.from(clientsMap.entries())
        .map(([clientId, data]) => ({
          clientId,
          clientName: data.name,
          count: data.count,
          totalCents: data.totalCents,
        }))
        .sort((a, b) => b.totalCents - a.totalCents);
    },
  });
};

export const useLowStock = () => {
  return useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, qty, low_stock_limit')
        .order('qty');

      if (error) throw error;

      // Filter on client side for products below stock limit
      return (data || []).filter(
        (p: any) => p.qty <= p.low_stock_limit
      ) as LowStockProduct[];
    },
  });
};
