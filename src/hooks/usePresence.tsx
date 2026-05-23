import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

export interface PresenceUser {
  userId: string;
  name: string;
  page: string;
  lastSeen: string;
}

interface PresenceContextType {
  onlineUsers: PresenceUser[];
  partnerOnline: boolean;
  partnerPage: string;
  updatePage: (page: string) => void;
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: [],
  partnerOnline: false,
  partnerPage: '',
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

// Online = last_seen within 60 seconds
const ONLINE_THRESHOLD = 60 * 1000;

function isOnline(lastSeen: string): boolean {
  return Date.now() - new Date(lastSeen).getTime() < ONLINE_THRESHOLD;
}

async function sendPresenceNotification(name: string) {
  try {
    await supabase.functions.invoke('send-push', {
      body: { senderName: name, title: `${name} is here 💙`, message: `${name} just opened Vally` },
    });
  } catch (e) { console.warn('Push notify failed:', e); }
}

export function PresenceProvider({ children }: { children: ReactNode }) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [partnerOnline, setPartnerOnline] = useState(false);
  const [partnerPage, setPartnerPage] = useState('');
  const myId = useRef(getOrCreateUserId());
  const notifiedRef = useRef(false);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const upsertPresence = async (page: string = 'home') => {
    const myName = getMyName();
    await supabase.from('presence').upsert({
      user_id: myId.current,
      user_name: myName,
      page,
      last_seen: new Date().toISOString(),
    }, { onConflict: 'user_id' });
  };

  const fetchPresence = async () => {
    const { data } = await supabase.from('presence').select('*');
    if (!data) return;

    const users: PresenceUser[] = data
      .filter(row => isOnline(row.last_seen))
      .map(row => ({
        userId: row.user_id,
        name: row.user_name,
        page: row.page,
        lastSeen: row.last_seen,
      }));

    setOnlineUsers(users);
    const others = users.filter(u => u.userId !== myId.current);
    const partnerIsOnline = others.length > 0;
    setPartnerOnline(partnerIsOnline);
    setPartnerPage(others[0]?.page || '');

    // Notify partner when we first come online
    if (!notifiedRef.current) {
      notifiedRef.current = true;
      const key = 'vally_notified_' + new Date().toDateString();
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        await sendPresenceNotification(getMyName());
      }
    }
  };

  const updatePage = async (page: string) => {
    await upsertPresence(page);
  };

  useEffect(() => {
    // Initial presence upsert
    upsertPresence('home');
    fetchPresence();

    // Heartbeat every 20 seconds to stay "online"
    heartbeatRef.current = setInterval(() => {
      upsertPresence();
    }, 20_000);

    // Real-time subscription to presence table
    const channel = supabase
      .channel('presence-db')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'presence',
      }, () => {
        fetchPresence();
      })
      .subscribe();

    // Cleanup on page hide/close
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        upsertPresence();
        fetchPresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Mark as offline on unmount
      supabase.from('presence').update({
        last_seen: new Date(Date.now() - ONLINE_THRESHOLD - 1000).toISOString()
      }).eq('user_id', myId.current);
    };
  }, []);

  return (
    <PresenceContext.Provider value={{ onlineUsers, partnerOnline, partnerPage, updatePage }}>
      {children}
    </PresenceContext.Provider>
  );
}

export function usePresence() {
  return useContext(PresenceContext);
}
