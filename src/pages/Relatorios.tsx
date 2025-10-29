import { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, Users as UsersIcon, Briefcase, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { Service, Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface TopService {
  service: Service;
  count: number;
  totalCents: number;
}

interface TopClient {
  client: Client;
  count: number;
  totalCents: number;
}

interface Revenue {
  totalCents: number;
  count: number;
}

const Relatorios = () => {
  const { toast } = useToast();
  const [period, setPeriod] = useState<string>('month');
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);
  const [revenue, setRevenue] = useState<Revenue>({ totalCents: 0, count: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, [period]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const [revenueData, servicesData, clientsData] = await Promise.all([
        api.reports.revenue({ period }),
        api.reports.topServices(),
        api.reports.topClients(),
      ]);

      setRevenue(revenueData);
      setTopServices(servicesData.topServices.slice(0, 5));
      setTopClients(clientsData.topClients.slice(0, 3));
    } catch (error) {
      toast({
        title: 'Erro ao carregar relatórios',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
            <BarChart3 className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Relatórios</h1>
        </div>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        <Card className="shadow-soft gradient-primary text-white">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Faturamento ({period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-center py-4">Carregando...</p>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl font-bold">{formatCurrency(revenue.totalCents)}</p>
                <p className="text-sm opacity-90">{revenue.count} atendimentos concluídos</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Serviços Mais Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : topServices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum serviço realizado neste período
              </p>
            ) : (
              <div className="space-y-3">
                {topServices.map((item, index) => (
                  <div key={item.service.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{item.service.name}</p>
                        <p className="text-sm text-muted-foreground">{item.count}x realizados</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(item.totalCents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <UsersIcon className="w-4 h-4 text-primary" />
              Top 3 Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : topClients.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhum cliente atendido neste período
              </p>
            ) : (
              <div className="space-y-3">
                {topClients.map((item, index) => (
                  <div key={item.client.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{item.client.name}</p>
                        <p className="text-sm text-muted-foreground">{item.count} atendimentos</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">{formatCurrency(item.totalCents)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
