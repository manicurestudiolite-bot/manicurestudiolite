import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, Plus, Edit, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppointmentDialog } from '@/components/AppointmentDialog';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { openWhatsApp, getAppointmentMessage, isValidWhatsAppNumber } from '@/lib/whatsapp';
import { useAppointments, useDeleteAppointment, useUpdateAppointmentStatus } from '@/lib/queries/appointments';

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<any | undefined>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<any | null>(null);
  
  const startWeek = startOfWeek(selectedDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startWeek, i));

  const startDate = format(selectedDate, 'yyyy-MM-dd') + 'T00:00:00.000Z';
  const endDate = format(selectedDate, 'yyyy-MM-dd') + 'T23:59:59.999Z';
  const { data: appointments = [], isLoading: loading } = useAppointments({ startDate, endDate });
  const deleteAppointment = useDeleteAppointment();
  const updateStatus = useUpdateAppointmentStatus();

  const handleEdit = (appointment: any) => {
    setSelectedAppointment(appointment);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!appointmentToDelete) return;

    try {
      await deleteAppointment.mutateAsync(appointmentToDelete.id);
      toast.success('Agendamento excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir agendamento');
    } finally {
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
    }
  };

  const handleStatusChange = async (appointmentId: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id: appointmentId, status: newStatus as any });
      toast.success('Status atualizado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'PREPAGO':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'CONCLUIDO':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'CANCELADO':
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
      case 'FALTOU':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-600 border-gray-500/20';
    }
  };

  const handleWhatsApp = (apt: Appointment) => {
    if (!apt.client?.phone) {
      toast.error('Cliente não possui telefone cadastrado');
      return;
    }

    if (!isValidWhatsAppNumber(apt.client.phone)) {
      toast.error('Número de telefone inválido');
      return;
    }

    const message = getAppointmentMessage(
      apt.client?.name,
      format(new Date((apt as any).start_time || (apt as any).startTime), "dd/MM/yyyy", { locale: ptBR }),
      format(new Date((apt as any).start_time || (apt as any).startTime), "HH:mm", { locale: ptBR }),
      apt.service?.name || 'Serviço'
    );

    openWhatsApp(apt.client.phone, message);
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Floating Action Button */}
      <Button
        size="icon"
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
        onClick={() => {
          setSelectedAppointment(undefined);
          setDialogOpen(true);
        }}
      >
        <Plus className="w-6 h-6" />
      </Button>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Agenda</h1>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => {
          const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
          
          return (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`p-3 rounded-lg text-center transition-all ${
                isSelected
                  ? 'gradient-primary text-white shadow-soft'
                  : isToday
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-card hover:bg-accent'
              }`}
            >
              <div className="text-xs font-medium">
                {format(day, 'EEE', { locale: ptBR })}
              </div>
              <div className="text-lg font-bold mt-1">
                {format(day, 'd')}
              </div>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground py-8">
              <p>Carregando agendamentos...</p>
            </div>
          </CardContent>
        </Card>
      ) : appointments.length === 0 ? (
        <Card className="shadow-soft">
          <CardContent className="pt-6 space-y-3">
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Nenhum agendamento para este dia</p>
              <Button className="mt-4" size="sm" onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Agendamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {appointments.map((apt) => (
            <Card 
              key={apt.id} 
              className="shadow-soft"
              style={{ borderLeft: `4px solid ${apt.service?.color || '#e91e63'}` }}
            >
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-base">{apt.client?.name}</h3>
                      <p className="text-sm text-muted-foreground">{apt.service?.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date((apt as any).start_time || (apt as any).startTime), 'HH:mm')} - {format(new Date((apt as any).end_time || (apt as any).endTime), 'HH:mm')}
                      </p>
                      {apt.notes && (
                        <p className="text-xs text-muted-foreground mt-2 italic">{apt.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {apt.client?.phone && isValidWhatsAppNumber(apt.client.phone) && (
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleWhatsApp(apt)}
                          title="Enviar mensagem no WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => handleEdit(apt)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          setAppointmentToDelete(apt);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Status:</span>
                    <Select 
                      value={apt.status} 
                      onValueChange={(value) => handleStatusChange(apt.id, value)}
                    >
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PENDENTE">Pendente</SelectItem>
                        <SelectItem value="PREPAGO">Pré-pago</SelectItem>
                        <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                        <SelectItem value="CANCELADO">Cancelado</SelectItem>
                        <SelectItem value="FALTOU">Faltou</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AppointmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointment={selectedAppointment}
        onSave={loadAppointments}
        defaultDate={selectedDate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Agendamento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Agenda;
