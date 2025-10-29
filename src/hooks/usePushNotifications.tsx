import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export const usePushNotifications = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setIsSupported('serviceWorker' in navigator && 'PushManager' in window);
  }, []);

  const subscribe = async () => {
    try {
      if (!isSupported) {
        toast({
          title: 'Não suportado',
          description: 'Seu navegador não suporta notificações push',
          variant: 'destructive',
        });
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: 'Permissão negada',
          description: 'Você precisa permitir notificações',
          variant: 'destructive',
        });
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const { publicKey } = await api.push.vapidKey();

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await api.push.subscribe({
        endpoint: sub.endpoint,
        keys: {
          p256dh: arrayBufferToBase64(sub.getKey('p256dh')),
          auth: arrayBufferToBase64(sub.getKey('auth')),
        },
      });

      setSubscription(sub);
      setIsSubscribed(true);

      toast({
        title: 'Notificações ativadas',
        description: 'Você receberá lembretes de agendamentos',
      });
    } catch (error) {
      console.error('Erro ao ativar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível ativar notificações',
        variant: 'destructive',
      });
    }
  };

  const unsubscribe = async () => {
    try {
      if (subscription) {
        await subscription.unsubscribe();
        await api.push.unsubscribe(subscription.endpoint);
        setSubscription(null);
        setIsSubscribed(false);

        toast({
          title: 'Notificações desativadas',
          description: 'Você não receberá mais lembretes',
        });
      }
    } catch (error) {
      console.error('Erro ao desativar notificações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível desativar notificações',
        variant: 'destructive',
      });
    }
  };

  return {
    isSupported,
    isSubscribed,
    subscribe,
    unsubscribe,
  };
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return '';
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
