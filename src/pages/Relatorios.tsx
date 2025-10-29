import { BarChart3, TrendingUp, Users as UsersIcon, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Relatorios = () => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
          <BarChart3 className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Relatórios</h1>
      </div>

      <div className="grid gap-4">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              Serviços Mais Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Dados insuficientes para gerar relatório
            </p>
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
            <p className="text-sm text-muted-foreground text-center py-4">
              Dados insuficientes para gerar relatório
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-primary" />
              Serviços Mais Lucrativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-4">
              Dados insuficientes para gerar relatório
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Relatorios;
