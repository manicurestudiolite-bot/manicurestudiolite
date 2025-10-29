import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Appointment, Client, Service } from '@/types';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface AppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment?: Appointment;
  onSave: () => void;
  defaultDate?: Date;
}

export const AppointmentDialog = ({ open, onOpenChange, appointment, onSave, defaultDate }: AppointmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open) {
      loadClients();
      loadServices();
      
      if (appointment) {
        setClientId(appointment.clientId);
        setServiceId(appointment.serviceId);
        const start = new Date(appointment.startTime);
        setDate(format(start, 'yyyy-MM-dd'));
        setTime(format(start, 'HH:mm'));
        setNotes(appointment.notes || '');
      } else {
        const dateToUse = defaultDate || new Date();
        setDate(format(dateToUse, 'yyyy-MM-dd'));
        setTime('09:00');
        setClientId('');
        setServiceId('');
        setNotes('');
      }
    }
  }, [appointment, open, defaultDate]);

  const loadClients = async () => {
    try {
      const data = await api.clients.list();
      setClients(data.clients || []);
    } catch (error: any) {
      toast.error('Erro ao carregar clientes');
    }
  };

  const loadServices = async () => {
    try {
      const data = await api.services.list();
      setServices(data.services || []);
    } catch (error: any) {
      toast.error('Erro ao carregar serviços');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const startTime = new Date(`${date}T${time}`).toISOString();

      if (appointment) {
        await api.appointments.update(appointment.id, { clientId, serviceId, startTime, notes });
        toast.success('Agendamento atualizado com sucesso!');
      } else {
        await api.appointments.create({ clientId, serviceId, startTime, notes });
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
                    {service.name} - R$ {(service.priceCents / 100).toFixed(2)} ({service.durationMinutes}min)
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
