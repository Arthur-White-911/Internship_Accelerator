import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Calendar,
  Video,
  Trophy,
  Settings,
  Check,
  Trash2,
  ChevronRight,
  Bell,
  X,
  CheckCheck,
  Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { notificationsApi } from '../api/notifications';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Filter tabs                                                        */
/* ------------------------------------------------------------------ */
const TABS: { label: string; value: string }[] = [
  { label: '全部', value: 'all' },
  { label: '实习推荐', value: '实习推荐' },
  { label: '训练计划', value: '训练计划' },
  { label: '面试邀请', value: '面试邀请' },
  { label: '测评结果', value: '测评结果' },
];

/* ------------------------------------------------------------------ */
/*  Type config                                                        */
/* ------------------------------------------------------------------ */
const TYPE_CONFIG: Record<string, { icon: typeof Briefcase; color: string; bg: string }> = {
  '实习推荐': { icon: Briefcase, color: 'text-energy-cyan', bg: 'bg-[rgba(0,212,255,0.1)]' },
  '训练计划': { icon: Calendar, color: 'text-success', bg: 'bg-[rgba(16,185,129,0.1)]' },
  '面试邀请': { icon: Video, color: 'text-warning', bg: 'bg-[rgba(245,158,11,0.1)]' },
  '测评结果': { icon: Trophy, color: 'text-neon-purple', bg: 'bg-[rgba(139,92,246,0.1)]' },
  '系统': { icon: Settings, color: 'text-text-gray', bg: 'bg-[rgba(148,163,184,0.1)]' },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHour < 24) return `${diffHour}小时前`;
  if (diffDay < 2) return '昨天';
  if (diffDay < 3) return '3天前';
  if (diffDay < 7) return `${diffDay}天前`;
  if (diffDay < 14) return '1周前';
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}周前`;
  if (diffDay < 60) return '1个月前';
  return `${Math.floor(diffDay / 30)}个月前`;
}

function getActions(type: string): { label: string; variant: 'primary' | 'secondary' | 'danger' }[] {
  switch (type) {
    case '实习推荐': return [{ label: '查看详情', variant: 'primary' }];
    case '训练计划': return [{ label: '查看详情', variant: 'primary' }];
    case '面试邀请': return [{ label: '确认参加', variant: 'primary' }, { label: '暂不参加', variant: 'secondary' }];
    case '测评结果': return [{ label: '查看报告', variant: 'primary' }];
    default: return [];
  }
}

function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Notifications() {
  const toast = useToast();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [stats, setStats] = useState({ total: 0, unread: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [showBatchBar, setShowBatchBar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
  const [batchProcessing, setBatchProcessing] = useState(false);

  /* Fetch data on mount */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listRes, statsRes] = await Promise.all([
          notificationsApi.list(),
          notificationsApi.stats(),
        ]);
        if (listRes.success && listRes.data) {
          setNotifications(listRes.data);
        }
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data);
        }
      } catch (err: any) {
        toast(err?.message || '获取通知失败', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [toast]);

  /* Derived state */
  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return notifications;
    return notifications.filter((n) => n.type === activeTab);
  }, [notifications, activeTab]);

  const unreadCount = stats.unread;

  const allSelected =
    filteredNotifications.length > 0 &&
    filteredNotifications.every((n) => selectedIds.has(n.id));

  /* Handlers */
  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
      setShowBatchBar(false);
    } else {
      setSelectedIds(new Set(filteredNotifications.map((n) => n.id)));
      setShowBatchBar(true);
    }
  };

  const markAsRead = async (ids?: number[]) => {
    const targetIds = ids || Array.from(selectedIds);
    if (targetIds.length === 0) return;

    setProcessingIds(prev => new Set([...prev, ...targetIds]));
    try {
      await Promise.all(
        targetIds.map(async (id) => {
          const res = await notificationsApi.markRead(id);
          if (!res.success) throw new Error(`Failed to mark ${id} as read`);
        })
      );
      setNotifications((prev) =>
        prev.map((n) => (targetIds.includes(n.id) ? { ...n, isRead: true } : n))
      );
      setStats((prev) => ({
        ...prev,
        unread: Math.max(0, prev.unread - targetIds.filter(id => notifications.find(n => n.id === id && !n.isRead)).length),
      }));
      toast('标记已读成功', 'success');
      if (!ids) {
        setSelectedIds(new Set());
        setShowBatchBar(false);
      }
    } catch (err: any) {
      toast(err?.message || '标记已读失败', 'error');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        targetIds.forEach(id => next.delete(id));
        return next;
      });
    }
  };

  const markAllAsRead = async () => {
    setBatchProcessing(true);
    try {
      const res = await notificationsApi.markAllRead();
      if (res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setStats((prev) => ({ ...prev, unread: 0 }));
        toast('全部标为已读', 'success');
      } else {
        toast(res.message || '操作失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '操作失败', 'error');
    } finally {
      setBatchProcessing(false);
    }
  };

  const deleteSelected = async () => {
    const targetIds = Array.from(selectedIds);
    if (targetIds.length === 0) return;

    setBatchProcessing(true);
    try {
      await Promise.all(
        targetIds.map(async (id) => {
          await notificationsApi.delete(id);
        })
      );
      const deletedUnread = notifications.filter(n => targetIds.includes(n.id) && !n.isRead).length;
      setNotifications((prev) => prev.filter((n) => !targetIds.includes(n.id)));
      setStats((prev) => ({
        total: prev.total - targetIds.length,
        unread: Math.max(0, prev.unread - deletedUnread),
      }));
      setSelectedIds(new Set());
      setShowBatchBar(false);
      toast('删除成功', 'success');
    } catch (err: any) {
      toast(err?.message || '删除失败', 'error');
    } finally {
      setBatchProcessing(false);
    }
  };

  const deleteNotification = async (id: number) => {
    setProcessingIds(prev => new Set(prev).add(id));
    try {
      const res = await notificationsApi.delete(id);
      if (res.success) {
        const n = notifications.find(item => item.id === id);
        setNotifications((prev) => prev.filter((item) => item.id !== id));
        setStats((prev) => ({
          total: prev.total - 1,
          unread: n && !n.isRead ? Math.max(0, prev.unread - 1) : prev.unread,
        }));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
        toast('删除成功', 'success');
      } else {
        toast(res.message || '删除失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '删除失败', 'error');
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleActionClick = (notif: NotificationItem, actionLabel: string) => {
    toast(`${actionLabel}: ${notif.title}`, 'success');
    if (!notif.isRead) {
      markAsRead([notif.id]);
    }
  };

  const toggleBatchMode = () => {
    setShowBatchBar((prev) => !prev);
    if (showBatchBar) {
      setSelectedIds(new Set());
    }
  };

  return (
    <div className="min-h-[calc(100dvh-72px)] bg-deep-space pb-16">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.06)]">
        <div className="section-container py-8 sm:py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          >
            <div className="flex items-center gap-3 mb-4">
              <h1 className="font-outfit text-3xl sm:text-4xl font-bold text-white">信息通知</h1>
              {unreadCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-energy-cyan/15 text-energy-cyan border border-energy-cyan/20">
                  {unreadCount} 未读
                </span>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="flex flex-wrap items-center gap-4 sm:gap-6"
          >
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-white font-semibold">全部 {stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-energy-cyan" />
              <span className="text-energy-cyan font-semibold">未读 {unreadCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <span className="text-text-gray font-semibold">
                已读 {stats.total - unreadCount}
              </span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  disabled={batchProcessing}
                  className="text-sm text-energy-cyan hover:text-white transition-colors duration-200 disabled:opacity-50 flex items-center gap-1"
                >
                  {batchProcessing && <Spinner className="w-3.5 h-3.5" />}
                  全部标为已读
                </button>
              )}
              <button
                onClick={toggleBatchMode}
                className={
                  'text-sm transition-colors duration-200 ' +
                  (showBatchBar ? 'text-white' : 'text-text-gray hover:text-white')
                }
              >
                {showBatchBar ? '取消' : '批量管理'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="section-container pt-6 pb-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="flex flex-wrap gap-2"
        >
          {TABS.map((tab) => {
            const count =
              tab.value === 'all'
                ? notifications.length
                : notifications.filter((n) => n.type === tab.value).length;
            return (
              <button
                key={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  setSelectedIds(new Set());
                }}
                className={
                  'px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ' +
                  (activeTab === tab.value
                    ? 'bg-[rgba(0,212,255,0.12)] text-energy-cyan border border-[rgba(0,212,255,0.25)]'
                    : 'bg-transparent text-[#64748B] border border-transparent hover:text-white hover:bg-[rgba(255,255,255,0.03)]')
                }
              >
                {tab.label}
                <span
                  className={
                    'ml-1.5 text-xs ' +
                    (activeTab === tab.value ? 'text-energy-cyan/70' : 'text-[#64748B]/60')
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </motion.div>
      </div>

      {/* Batch Operations Bar */}
      <AnimatePresence>
        {showBatchBar && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="section-container pb-4">
              <div className="flex items-center gap-3 glass-card rounded-xl px-4 py-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <button
                    onClick={toggleSelectAll}
                    className={
                      'w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ' +
                      (allSelected
                        ? 'bg-energy-cyan border-energy-cyan'
                        : 'border-[rgba(255,255,255,0.2)] bg-transparent hover:border-energy-cyan/50')
                    }
                  >
                    {allSelected && <Check className="w-3.5 h-3.5 text-deep-space" />}
                  </button>
                  <span className="text-sm text-white">全选</span>
                </label>
                <span className="text-[#64748B] text-sm">
                  {selectedIds.size > 0 ? `已选 ${selectedIds.size} 项` : ''}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <button
                    onClick={() => markAsRead()}
                    disabled={selectedIds.size === 0 || batchProcessing}
                    className={
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ' +
                      (selectedIds.size > 0
                        ? 'text-energy-cyan hover:bg-[rgba(0,212,255,0.08)]'
                        : 'text-[#64748B] cursor-not-allowed')
                    }
                  >
                    {batchProcessing && <Spinner className="w-3.5 h-3.5" />}
                    <CheckCheck className="w-4 h-4" />
                    标记已读
                  </button>
                  <button
                    onClick={deleteSelected}
                    disabled={selectedIds.size === 0 || batchProcessing}
                    className={
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-200 ' +
                      (selectedIds.size > 0
                        ? 'text-error hover:bg-[rgba(239,68,68,0.08)]'
                        : 'text-[#64748B] cursor-not-allowed')
                    }
                  >
                    {batchProcessing && <Spinner className="w-3.5 h-3.5" />}
                    <Trash2 className="w-4 h-4" />
                    删除
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <div className="section-container">
          <div className="flex flex-col items-center justify-center py-20">
            <Spinner className="w-8 h-8 text-energy-cyan" />
            <p className="text-[#64748B] text-sm mt-3">加载中...</p>
          </div>
        </div>
      )}

      {/* Notification List */}
      {!loading && (
        <div className="section-container space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredNotifications.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20"
              >
                <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-[#64748B]" />
                </div>
                <p className="text-[#64748B] text-sm">暂无通知</p>
              </motion.div>
            ) : (
              filteredNotifications.map((notif, index) => {
                const typeConfig = TYPE_CONFIG[notif.type] || TYPE_CONFIG['系统'];
                const TypeIcon = typeConfig.icon;
                const isSelected = selectedIds.has(notif.id);
                const isProcessing = processingIds.has(notif.id);
                const actions = getActions(notif.type);

                return (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, transition: { duration: 0.2 } }}
                    transition={{
                      delay: index * 0.06,
                      duration: 0.5,
                      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
                    }}
                    className={
                      'relative glass-card rounded-xl p-4 sm:p-5 transition-all duration-200 group ' +
                      (!notif.isRead ? 'border-l-[3px] border-l-energy-cyan' : 'border-l-[3px] border-l-transparent')
                    }
                  >
                    {isProcessing && (
                      <div className="absolute inset-0 bg-deep-space/50 rounded-xl flex items-center justify-center z-10">
                        <Spinner className="w-5 h-5 text-energy-cyan" />
                      </div>
                    )}
                    <div className="flex items-start gap-3 sm:gap-4">
                      {/* Checkbox (batch mode) */}
                      <AnimatePresence>
                        {showBatchBar && (
                          <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={() => toggleSelect(notif.id)}
                            className={
                              'shrink-0 mt-1 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 ' +
                              (isSelected
                                ? 'bg-energy-cyan border-energy-cyan'
                                : 'border-[rgba(255,255,255,0.2)] bg-transparent hover:border-energy-cyan/50')
                            }
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 text-deep-space" />}
                          </motion.button>
                        )}
                      </AnimatePresence>

                      {/* Type icon */}
                      <div
                        className={
                          'shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ' + typeConfig.bg
                        }
                      >
                        <TypeIcon className={'w-5 h-5 ' + typeConfig.color} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3
                            className={
                              'text-sm sm:text-base ' +
                              (!notif.isRead ? 'font-semibold text-white' : 'font-medium text-[#E2E8F0]')
                            }
                          >
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <motion.span
                              animate={{ opacity: [0.5, 1, 0.5] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="shrink-0 w-2 h-2 rounded-full bg-energy-cyan"
                            />
                          )}
                          <span className="ml-auto shrink-0 text-[11px] text-[#64748B]">{formatTime(notif.createdAt)}</span>
                        </div>

                        <p className="text-[#94A3B8] text-sm leading-relaxed line-clamp-2 mb-3">
                          {notif.content}
                        </p>

                        {/* Actions */}
                        {actions.length > 0 && (
                          <div className="flex flex-wrap items-center gap-2">
                            {actions.map((action) => (
                              <button
                                key={action.label}
                                onClick={() => handleActionClick(notif, action.label)}
                                className={
                                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ' +
                                  (action.variant === 'primary'
                                    ? 'text-energy-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.15)] hover:border-energy-cyan/30'
                                    : action.variant === 'danger'
                                      ? 'text-error bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.15)]'
                                      : 'text-[#94A3B8] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] hover:text-white hover:bg-[rgba(255,255,255,0.05)]')
                                }
                              >
                                {action.label}
                              </button>
                            ))}
                            {!notif.isRead && (
                              <button
                                onClick={() => markAsRead([notif.id])}
                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-success bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] hover:bg-[rgba(16,185,129,0.15)] transition-all duration-200"
                              >
                                标记已读
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Delete button (hover) */}
                      {!showBatchBar && (
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 rounded hover:bg-[rgba(239,68,68,0.1)] text-[#64748B] hover:text-error"
                          title="删除"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Notification Settings Card */}
      <div className="section-container mt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="glass-card rounded-xl p-4 sm:p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-[rgba(0,212,255,0.08)] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-energy-cyan" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white text-sm font-medium">通知偏好设置</h4>
            <p className="text-[#64748B] text-xs mt-0.5">自定义你想接收的通知类型和方式</p>
          </div>
          <button className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-energy-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.15)] transition-all duration-200">
            去设置
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
