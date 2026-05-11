import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface PresenceUser {
  userId: string;
  name: string;
  lastSeen: string;
  page: string;
}

// Generate/retrieve a stable userId for this browser session
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

export function usePresence() {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const myId = useRef(getOrCreateUserId());

  useEffect(() => {
    const channel = supabase.channel('vally-presence', {
      config: { presence: { key: myId.current } }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
        // Partner is online if there's someone ELSE connected
        const others = users.filter(u => u.userId !== myId.current);
        setPartnerOnline(others.length > 0);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        const isOther = newPresences.some((p: any) => p.userId !== myId.current);
        if (isOther) setPartnerOnline(true);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Re-check after leave
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        const others = users.filter(u => u.userId !== myId.current);
        setPartnerOnline(others.length > 0);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            userId: myId.current,
            name: getMyName(),
            lastSeen: new Date().toISOString(),
            page: 'home',
          });
        }
      });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, []);

  const updatePage = async (page: string) => {
    if (channelRef.current) {
      await channelRef.current.track({
        userId: myId.current,
        name: getMyName(),
        lastSeen: new Date().toISOString(),
        page,
      });
    }
  };

  return { onlineUsers, partnerOnline, updatePage };
}
