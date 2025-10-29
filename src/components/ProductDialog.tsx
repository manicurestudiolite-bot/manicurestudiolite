import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Product } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product;
  onSave: () => void;
}

export const ProductDialog = ({ open, onOpenChange, product, onSave }: ProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState('');
  const [lowStockLimit, setLowStockLimit] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    if (product) {
      setName(product.name);
      setBrand(product.brand || '');
      setColor(product.color || '');
      setQty(product.qty.toString());
      setLowStockLimit(product.lowStockLimit.toString());
      setPrice(product.priceCents ? (product.priceCents / 100).toFixed(2) : '');
    } else {
      setName('');
      setBrand('');
      setColor('');
      setQty('0');
      setLowStockLimit('5');
      setPrice('');
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name,
        brand: brand || undefined,
        color: color || undefined,
        qty: parseInt(qty),
        lowStockLimit: parseInt(lowStockLimit),
        priceCents: price ? Math.round(parseFloat(price) * 100) : undefined,
      };

      if (product) {
        await api.products.update(product.id, data);
        toast.success('Produto atualizado com sucesso!');
      } else {
        await api.products.create(data);
        toast.success('Produto criado com sucesso!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{product ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Esmalte Vermelho"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input
                id="brand"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ex: Risqué"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="Ex: Vermelho"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="qty">Quantidade Atual *</Label>
              <Input
                id="qty"
                type="number"
                min="0"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockLimit">Estoque Mínimo *</Label>
              <Input
                id="lowStockLimit"
                type="number"
                min="0"
                value={lowStockLimit}
                onChange={(e) => setLowStockLimit(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Preço Unitário (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="12.50"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
