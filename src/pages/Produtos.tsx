import { useState, useEffect } from 'react';
import { Package, Plus, Search, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ProductDialog } from '@/components/ProductDialog';
import { Product } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const Produtos = () => {
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await api.products.list();
      setProducts(data.products || []);
    } catch (error: any) {
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleAdjust = async (productId: string, delta: number) => {
    try {
      await api.products.adjust(productId, { delta });
      toast.success('Estoque atualizado!');
      loadProducts();
    } catch (error: any) {
      toast.error('Erro ao ajustar estoque');
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Package className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Produtos</h1>
        </div>
        <Button size="icon" className="rounded-full shadow-soft" onClick={() => { setSelectedProduct(undefined); setDialogOpen(true); }}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {loading ? (
        <Card className="shadow-soft"><CardContent className="pt-6"><p className="text-center text-muted-foreground py-8">Carregando...</p></CardContent></Card>
      ) : filteredProducts.length === 0 ? (
        <Card className="shadow-soft"><CardContent className="pt-6"><div className="text-center text-muted-foreground py-8"><Package className="w-12 h-12 mx-auto mb-2 opacity-50" /><p>Nenhum produto cadastrado</p><Button className="mt-4" size="sm" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-2" />Novo Produto</Button></div></CardContent></Card>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="shadow-soft">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.brand} {product.color && `- ${product.color}`}</p>
                    {product.qty <= product.lowStockLimit && <Badge variant="destructive" className="mt-1">Estoque baixo</Badge>}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" onClick={() => handleAdjust(product.id, -1)} disabled={product.qty === 0}><Minus className="w-4 h-4" /></Button>
                    <span className="w-12 text-center font-bold">{product.qty}</span>
                    <Button size="icon" variant="outline" onClick={() => handleAdjust(product.id, 1)}><Plus className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ProductDialog open={dialogOpen} onOpenChange={setDialogOpen} product={selectedProduct} onSave={loadProducts} />
    </div>
  );
};

export default Produtos;
