import { useEffect, useState } from 'react';
import { format, startOfDay, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Appointment, Product } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertTriangle, Sparkles } from 'lucide-react';

const Dashboard = () => {
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // TODO: Replace with actual API calls
    // Mock data
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        clientId: '1',
        serviceId: '1',
        startTime: new Date().toISOString(),
        endTime: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        status: 'PENDENTE',
        client: { id: '1', name: 'Maria Silva', phone: '(11) 99999-9999', createdAt: new Date().toISOString() },
        service: { id: '1', name: 'Manicure Completa', priceCents: 5000, durationMinutes: 60, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      },
    ];

    const mockLowStock: Product[] = [
      {
        id: '1',
        name: 'Esmalte Vermelho',
        brand: 'Risqué',
        qty: 2,
        lowStockLimit: 5,
        priceCents: 1200,
        createdAt: new Date().toISOString(),
      },
    ];

    setTodayAppointments(mockAppointments);
    setLowStock(mockLowStock);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      PENDENTE: 'default',
      CONCLUIDO: 'secondary',
      ANTECIPADO: 'destructive',
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              Alertas de Estoque
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {lowStock.map((product) => (
              <div key={product.id} className="flex justify-between items-center text-sm">
                <span className="font-medium">{product.name}</span>
                <Badge variant="destructive">
                  {product.qty} unid. (mín: {product.lowStockLimit})
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-soft">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Agendamentos de Hoje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {todayAppointments.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum agendamento para hoje
            </p>
          ) : (
            todayAppointments.map((apt) => (
              <div key={apt.id} className="flex gap-3 p-3 rounded-lg bg-accent/50">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                  <Clock className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{apt.client?.name}</p>
                      <p className="text-xs text-muted-foreground">{apt.service?.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(apt.startTime), 'HH:mm', { locale: ptBR })} - 
                        {format(addDays(new Date(apt.startTime), 0), 'HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                    {getStatusBadge(apt.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;

