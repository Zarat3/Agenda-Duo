import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(duoId) {
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const supported = typeof window !== 'undefined' && 'PushManager' in window && 'serviceWorker' in navigator;

  useEffect(() => {
    if (!supported) return;
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription().then(sub => setSubscribed(!!sub))
    );
  }, [supported]);

  const subscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
      });
      const { endpoint, keys } = sub.toJSON();
      await supabase.from('push_subscriptions').upsert(
        { duo_id: duoId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
        { onConflict: 'endpoint' }
      );
      setSubscribed(true);
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { subscribed, loading, supported, subscribe, unsubscribe };
}
