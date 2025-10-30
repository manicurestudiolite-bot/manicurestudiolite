import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Product {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  color?: string;
  qty: number;
  low_stock_limit: number;
  price_cents?: number;
  created_at: string;
}

export interface StockMove {
  id: string;
  product_id: string;
  delta: number;
  reason?: string;
  created_at: string;
}

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useProductHistory = (productId: string) => {
  return useQuery({
    queryKey: ['product-history', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stock_moves')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as StockMove[];
    },
    enabled: !!productId,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: Omit<Product, 'id' | 'user_id' | 'created_at'>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('products')
        .insert({ ...product, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto criado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar produto');
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao atualizar produto');
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao excluir produto');
    },
  });
};

export const useAdjustStock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      delta,
      reason,
    }: {
      productId: string;
      delta: number;
      reason?: string;
    }) => {
      // Get current product
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('qty')
        .eq('id', productId)
        .single();

      if (productError) throw productError;

      const newQty = product.qty + delta;

      // Update product quantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ qty: newQty })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Create stock move record
      const { error: moveError } = await supabase
        .from('stock_moves')
        .insert({
          product_id: productId,
          delta,
          reason,
        });

      if (moveError) throw moveError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product-history', variables.productId] });
      toast.success('Estoque ajustado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao ajustar estoque');
    },
  });
};
