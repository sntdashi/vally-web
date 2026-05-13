import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  userId: string;
  name: string;
  lastSeen: string;
  page: string;
}

function getOrCreateUserId(): string {
  let id = localStorage.getItem('vally_user_id');
  if (!id) {
    id = 'user_' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('vally_user_id', id);
  }
  return id;
}

function getMyName(): string {
  try {
    const config = JSON.parse(localStorage.getItem('vally_config') || '{}');
    return config?.names?.person1 || 'Someone special';
  } catch { return 'Someone special'; }
}

async function sendPresenceNotification(name: string) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { senderName: name, title: `${name} is here 💙`, message: `${name} just opened Vally` },
    });
  } catch (e) { console.warn('Push notify failed:', e); }
}

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myId = useRef(getOrCreateUserId());
  const notifiedRef = useRef(false);

  useEffect(() => {
    // IMPORTANT: all .on() must be chained BEFORE .subscribe()
    // Never add callbacks after subscribe() — causes the crash
    const channel = supabase
      .channel('vally-presence', { config: { presence: { key: myId.current } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
        setPartnerOnline(users.some(u => u.userId !== myId.current));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (newPresences.some((p: any) => p.userId !== myId.current)) {
          setPartnerOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        setPartnerOnline(users.some(u => u.userId !== myId.current));
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        const myName = getMyName();
        try {
          await channel.track({
            userId: myId.current,
            name: myName,
            lastSeen: new Date().toISOString(),
            page: 'home',
          });
        } catch (e) { console.warn('Presence track failed:', e); }

        // Notify partner once per day
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          const sessionKey = 'vally_notified_' + new Date().toDateString();
          if (!sessionStorage.getItem(sessionKey)) {
            sessionStorage.setItem(sessionKey, '1');
            await sendPresenceNotification(myName);
          }
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  const updatePage = async (page: string) => {
    if (!channelRef.current) return;
    try {
      await channelRef.current.track({
        userId: myId.current,
        name: getMyName(),
        lastSeen: new Date().toISOString(),
        page,
      });
    } catch (e) { console.warn('updatePage failed:', e); }
  };

  return { onlineUsers, partnerOnline, updatePage };
}
