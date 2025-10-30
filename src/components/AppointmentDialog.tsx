import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useClients } from '@/lib/queries/clients';
import { useServices } from '@/lib/queries/services';
import { useCreateAppointment, useUpdateAppointment } from '@/lib/queries/appointments';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: any;
  onSave: () => void;
  defaultDate?: Date;
}

export const AppointmentDialog = ({ open, onOpenChange, appointment, onSave, defaultDate }: AppointmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const { data: clients = [] } = useClients();
  const { data: services = [] } = useServices();
  const createAppointment = useCreateAppointment();
  const updateAppointment = useUpdateAppointment();

  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [paidAmount, setPaidAmount] = useState('0');

  useEffect(() => {
    if (open) {
      if (appointment) {
        // Map old fields to local state
        // @ts-ignore
        setClientId((appointment as any).clientId || (appointment as any).client_id || '');
        // @ts-ignore
        setServiceId((appointment as any).serviceId || (appointment as any).service_id || '');
        // @ts-ignore
        const start = new Date((appointment as any).startTime || (appointment as any).start_time);
        setDate(format(start, 'yyyy-MM-dd'));
        setTime(format(start, 'HH:mm'));
        // @ts-ignore
        setNotes((appointment as any).notes || '');
        // @ts-ignore
        setPrice(((appointment as any).price ?? '')?.toString());
        // @ts-ignore
        setPaidAmount(((appointment as any).paidAmount ?? (appointment as any).paid_amount ?? 0).toString());
      } else {
        const dateToUse = defaultDate || new Date();
        setDate(format(dateToUse, 'yyyy-MM-dd'));
        setTime('09:00');
        setClientId('');
        setServiceId('');
        setNotes('');
        setPrice('');
        setPaidAmount('0');
      }
    }
  }, [appointment, open, defaultDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const start_time = new Date(`${date}T${time}`).toISOString();
      const svc = services.find((s: any) => s.id === serviceId);
      const duration = svc?.duration_minutes || 30;
      const end_time = new Date(new Date(start_time).getTime() + duration * 60000).toISOString();

      const base = {
        client_id: clientId,
        service_id: serviceId,
        start_time,
        end_time,
        status: 'PENDENTE',
        notes: notes || undefined,
        price: price ? parseFloat(price) : null,
        paid_amount: paidAmount ? parseFloat(paidAmount) : 0,
      };

      if (appointment?.id) {
        await updateAppointment.mutateAsync({ id: appointment.id, ...base } as any);
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        await createAppointment.mutateAsync(base as any);
        toast.success('Agendamento criado com sucesso!');
      }
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{appointment ? 'Editar Agendamento' : 'Novo Agendamento'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Cliente *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger id="client">
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Serviço *</Label>
            <Select value={serviceId} onValueChange={setServiceId} required>
              <SelectTrigger id="service">
                <SelectValue placeholder="Selecione um serviço" />
              </SelectTrigger>
              <SelectContent>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name} - R$ {((service.price_cents || 0) / 100).toFixed(2)} ({service.duration_minutes}min)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Horário *</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Preço (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Preço do serviço"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Valor Pago (R$)</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações opcionais"
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            * O horário de término será calculado automaticamente com base na duração do serviço
          </p>

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
