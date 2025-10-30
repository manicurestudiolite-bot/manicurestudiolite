import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useCreateProduct, useUpdateProduct } from '@/lib/queries/products';

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSave: () => void;
}

export const ProductDialog = ({ open, onOpenChange, product, onSave }: ProductDialogProps) => {
  const [loading, setLoading] = useState(false);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
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
      setQty(String(product.qty ?? 0));
      setLowStockLimit(String(product.low_stock_limit ?? product.lowStockLimit ?? 5));
      const pc = product.price_cents ?? product.priceCents;
      setPrice(pc ? (pc / 100).toFixed(2) : '');
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
      const data: any = {
        name,
        brand: brand || null,
        color: color || null,
        qty: parseInt(qty),
        low_stock_limit: parseInt(lowStockLimit),
        price_cents: price ? Math.round(parseFloat(price) * 100) : null,
      };

      if (product?.id) {
        await updateProduct.mutateAsync({ id: product.id, ...data });
        toast.success('Produto atualizado com sucesso!');
      } else {
        await createProduct.mutateAsync(data);
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
