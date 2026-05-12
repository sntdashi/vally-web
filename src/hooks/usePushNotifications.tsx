import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const VAPID_PUBLIC_KEY = 'BJq0bOr25x0iQYAwGhQY7BMYQc9Tsda3HGuOosTAhmFYSBvd1Mkt527aT9OjNa3FJWn56vo1qPX9yhL4_fs1Ros';

function getMyName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person1 || 'Someone special';
  } catch { return 'Someone special'; }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'prompt' | 'loading';

export function usePushNotifications() {
  const [status, setStatus] = useState<PushStatus>('loading');
  const [isSubscribed, setIsSubscribed] = useState(false);

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;

  useEffect(() => {
    if (!isSupported) { setStatus('unsupported'); return; }
    checkPermission();
  }, []);

  const checkPermission = async () => {
    const perm = Notification.permission;
    if (perm === 'denied') { setStatus('denied'); return; }
    if (perm === 'granted') {
      setStatus('granted');
      await checkExistingSubscription();
    } else {
      setStatus('prompt');
    }
  };

  const checkExistingSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch { setIsSubscribed(false); }
  };

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported) return false;
    try {
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setStatus('denied'); return false; }
      setStatus('granted');

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const subJson = sub.toJSON();
      const { endpoint, keys } = subJson;

      await supabase.from('push_subscriptions').upsert({
        endpoint,
        p256dh: keys!.p256dh,
        auth: keys!.auth,
        user_name: getMyName(),
      }, { onConflict: 'endpoint' });

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error('Push subscribe failed:', err);
      return false;
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Unsubscribe failed:', err);
    }
  };

  // Trigger a push to ALL subscribers (partner will get notified)
  const notifyPartner = async (message?: string) => {
    try {
      await supabase.functions.invoke('send-push', {
        body: {
          senderName: getMyName(),
          message: message || `${getMyName()} just opened Vally`,
          title: `${getMyName()} is here 💙`,
        },
      });
    } catch (err) {
      console.error('Notify partner failed:', err);
    }
  };

  return { status, isSubscribed, isSupported, subscribe, unsubscribe, notifyPartner };
}
