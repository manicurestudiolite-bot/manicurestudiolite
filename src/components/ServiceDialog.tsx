import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Service } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';

interface ServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service;
  onSave: () => void;
}

export const ServiceDialog = ({ open, onOpenChange, service, onSave }: ServiceDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [color, setColor] = useState('#e91e63');

  useEffect(() => {
    if (service) {
      setName(service.name);
      setPrice((service.priceCents / 100).toFixed(2));
      setDuration(service.durationMinutes.toString());
      setColor(service.color || '#e91e63');
    } else {
      setName('');
      setPrice('');
      setDuration('');
      setColor('#e91e63');
    }
  }, [service, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const priceCents = Math.round(parseFloat(price) * 100);
      const durationMinutes = parseInt(duration);

      if (service) {
        await api.services.update(service.id, { name, priceCents, durationMinutes, color });
        toast.success('Serviço atualizado com sucesso!');
      } else {
        await api.services.create({ name, priceCents, durationMinutes, color });
        toast.success('Serviço criado com sucesso!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? 'Editar Serviço' : 'Novo Serviço'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Serviço *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Manicure Simples"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Valor (R$) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                placeholder="50.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Duração (minutos) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                required
                placeholder="45"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor (para agenda)</Label>
            <div className="flex gap-2">
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-20 h-10"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#e91e63"
                className="flex-1"
              />
            </div>
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
