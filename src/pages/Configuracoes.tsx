import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Palette, Download, Mail, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePWA } from '@/hooks/usePWA';
import { getStoredTheme, setStoredTheme, Theme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Configuracoes = () => {
  const { user, logout } = useAuth();
  const { isInstallable, isInstalled, installPWA } = usePWA();
  const navigate = useNavigate();
  
  const [notif24h, setNotif24h] = useState(true);
  const [notif3h, setNotif3h] = useState(true);
  const [notif1h, setNotif1h] = useState(true);
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  useEffect(() => {
    // Load settings from API
    // TODO: Replace with actual API call
  }, []);

  const handleThemeChange = (value: Theme) => {
    setTheme(value);
    setStoredTheme(value);
    toast.success('Tema atualizado');
  };

  const handleInstall = async () => {
    const success = await installPWA();
    if (success) {
      toast.success('App instalado com sucesso!');
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logout realizado');
    navigate('/auth');
  };

  return (
    <div className="p-4 space-y-4 pb-20">
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-soft">
          <SettingsIcon className="w-5 h-5 text-white" />
        </div>
        <h1 className="text-2xl font-bold">Configurações</h1>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </CardTitle>
          <CardDescription>Configure os lembretes de agendamentos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-24h">Lembrete 24 horas antes</Label>
            <Switch
              id="notif-24h"
              checked={notif24h}
              onCheckedChange={setNotif24h}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-3h">Lembrete 3 horas antes</Label>
            <Switch
              id="notif-3h"
              checked={notif3h}
              onCheckedChange={setNotif3h}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="notif-1h">Lembrete 1 hora antes</Label>
            <Switch
              id="notif-1h"
              checked={notif1h}
              onCheckedChange={setNotif1h}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </CardTitle>
          <CardDescription>Escolha o tema do aplicativo</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={theme} onValueChange={handleThemeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">Claro</SelectItem>
              <SelectItem value="dark">Escuro</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {(isInstallable || !isInstalled) && (
        <Card className="shadow-soft border-primary/50 bg-gradient-to-br from-primary/5 to-transparent">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Download className="w-4 h-4" />
              Instalar App
            </CardTitle>
            <CardDescription>Adicione à tela inicial para acesso rápido</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleInstall} className="w-full gradient-primary text-white shadow-soft">
              <Download className="w-4 h-4 mr-2" />
              Instalar Aplicativo
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Suporte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            manicurestudiolite@gmail.com
          </p>
        </CardContent>
      </Card>

      <Separator />

      <Card className="shadow-soft">
        <CardContent className="pt-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Conectado como: <span className="font-medium text-foreground">{user?.email}</span>
            </p>
            <Button onClick={handleLogout} variant="destructive" className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Configuracoes;
