import cron from 'node-cron';
import webpush from 'web-push';
import { config } from '../config/env.js';
import { subHours, addMinutes } from 'date-fns';

webpush.setVapidDetails(
  `mailto:${config.supportEmail}`,
  config.vapidPublicKey,
  config.vapidPrivateKey
);

export function setupCron(prisma) {
  // Run every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    console.log('🔔 Checking for appointment reminders...');

    const now = new Date();
    const windows = [
      { hours: 24, key: 'notif24h' },
      { hours: 3, key: 'notif3h' },
      { hours: 1, key: 'notif1h' },
    ];

    for (const window of windows) {
      const targetTime = subHours(now, window.hours);
      const rangeStart = addMinutes(targetTime, -10);
      const rangeEnd = addMinutes(targetTime, 10);

      const appointments = await prisma.appointment.findMany({
        where: {
          status: 'PENDENTE',
          startTime: {
            gte: rangeStart,
            lte: rangeEnd,
          },
        },
        include: {
          client: true,
          service: true,
          user: {
            include: {
              settings: true,
              pushSubscriptions: true,
            },
          },
        },
      });

      for (const apt of appointments) {
        if (!apt.user?.settings?.[window.key]) continue;

        const subscriptions = apt.user.pushSubscriptions || [];

        const payload = JSON.stringify({
          title: 'Lembrete de Agendamento',
          body: `${apt.client.name} - ${apt.service.name} às ${apt.startTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          data: { url: '/agenda' },
        });

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payload
            );
          } catch (error) {
            if (error?.statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { id: sub.id } });
            } else {
              console.error('Push error:', error);
            }
          }
        }
      }
    }
  });

  console.log('✅ Cron jobs initialized');
}
