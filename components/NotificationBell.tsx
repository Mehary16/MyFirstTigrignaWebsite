'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import type { InAppNotification } from '../lib/inAppNotifications';
import { formatNotificationTime, notificationTypeLabel } from '../lib/inAppNotifications';
import { cn } from '../lib/cn';

type NotificationBellProps = {
  initialNotifications?: InAppNotification[];
  initialUnreadCount?: number;
};

export default function NotificationBell({
  initialNotifications = [],
  initialUnreadCount = 0
}: NotificationBellProps) {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const hasUnread = unreadCount > 0;

  const refreshNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) return;
      const payload = (await response.json()) as {
        notifications?: InAppNotification[];
        unreadCount?: number;
      };
      setNotifications(payload.notifications ?? []);
      setUnreadCount(payload.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshNotifications();
    }, 60000);
    return () => window.clearInterval(interval);
  }, [refreshNotifications]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const markRead = async (notification: InAppNotification) => {
    if (!notification.read_at) {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notification.id })
      });
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item
        )
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    }

    setOpen(false);
    router.push(notification.link_path || '/');
  };

  const markAllRead = async () => {
    if (!hasUnread) return;
    setMarkingAll(true);
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true })
      });
      const now = new Date().toISOString();
      setNotifications((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  };

  const emptyMessage = useMemo(() => {
    if (loading) return 'Loading notifications...';
    return 'No notifications yet.';
  }, [loading]);

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const nextOpen = !open;
          setOpen(nextOpen);
          if (nextOpen) void refreshNotifications();
        }}
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/80 text-slate-700 shadow-sm transition hover:bg-white"
        aria-label={`Notifications${hasUnread ? `, ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Notifications</p>
            {hasUnread ? (
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={markingAll}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 disabled:opacity-50"
              >
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? (
              <ul className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <button
                      type="button"
                      onClick={() => void markRead(notification)}
                      className={cn(
                        'block w-full px-4 py-3 text-left transition hover:bg-slate-50',
                        !notification.read_at && 'bg-emerald-50/50'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                            {notificationTypeLabel(notification.type)}
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{notification.title}</p>
                          {notification.body ? (
                            <p className="mt-1 line-clamp-2 text-sm text-slate-600">{notification.body}</p>
                          ) : null}
                        </div>
                        {!notification.read_at ? (
                          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-600" aria-hidden />
                        ) : null}
                      </div>
                      <p className="mt-2 text-xs text-slate-500">{formatNotificationTime(notification.created_at)}</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-4 py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
