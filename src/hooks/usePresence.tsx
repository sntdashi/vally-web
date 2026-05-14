import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface PresenceUser {
  userId: string;
  name: string;
  lastSeen: string;
  page: string;
}

interface PresenceContextType {
  onlineUsers: PresenceUser[];
  partnerOnline: boolean;
  updatePage: (page: string) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  partnerOnline: false,
  updatePage: () => {},
});

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

// Single provider at app root — only ONE channel ever created
export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const channelRef = useRef<any>(null);
  const myId = useRef(getOrCreateUserId());
  const notifiedRef = useRef(false);

  const updatePage = (page: string) => {
    if (!channelRef.current) return;
    channelRef.current.track({
      userId: myId.current,
      name: getMyName(),
      lastSeen: new Date().toISOString(),
      page,
    }).catch(() => {});
  };

  useEffect(() => {
    const channel = supabase
      .channel('vally-presence', { config: { presence: { key: myId.current } } })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<PresenceUser>();
        const users = Object.values(state).flat();
        setOnlineUsers(users);
        setPartnerOnline(users.some(u => u.userId !== myId.current));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if ((newPresences as any[]).some((p) => p.userId !== myId.current)) {
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
        } catch (e) { console.warn('track failed:', e); }

        if (!notifiedRef.current) {
          notifiedRef.current = true;
          const key = 'vally_notified_' + new Date().toDateString();
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            await sendPresenceNotification(myName);
          }
        }
      });

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, partnerOnline, updatePage }}>
      {children}
    </PresenceContext.Provider>
  );
}

// All components call this — no duplicate channels
export function usePresence() {
  return useContext(PresenceContext);
}
