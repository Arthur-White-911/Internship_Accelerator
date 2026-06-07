import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, User, Menu, X, Zap, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { notificationsApi } from '../api/notifications';

const navLinks = [
  { label: '首页', path: '/' },
  { label: '能力分析', path: '/assessment' },
  { label: '培养方案', path: '/programs' },
  { label: '面试帮手', path: '/interview' },
  { label: '自主训练', path: '/training' },
  { label: '求职咨询', path: '/chat' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 100);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Fetch unread notification count
  useEffect(() => {
    if (!user) { setUnreadCount(0); return; }
    notificationsApi.stats().then(res => {
      if (res.success) setUnreadCount(res.data.unread);
    }).catch(() => {});
    // Poll every 30s
    const interval = setInterval(() => {
      notificationsApi.stats().then(res => {
        if (res.success) setUnreadCount(res.data.unread);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <>
      <motion.nav
        initial={{ y: '-100%' }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
        className={'fixed top-0 left-0 right-0 z-50 h-[72px] flex items-center transition-all duration-300 ' +
          (scrolled ? 'bg-[rgba(10,22,40,0.95)] backdrop-blur-[20px] shadow-md border-b border-[rgba(255,255,255,0.06)]'
            : 'bg-[rgba(10,22,40,0.85)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.06)]')}
      >
        <div className="section-container w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-energy-cyan to-crystal-blue rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
              <Zap className="relative w-5 h-5 text-white" />
            </div>
            <span className="font-outfit font-bold text-lg text-white tracking-tight">实习加速器</span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => {
              const isActive = location.pathname === link.path;
              return (
                <Link key={link.path} to={link.path}
                  className={'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ' +
                    (isActive ? 'text-energy-cyan bg-[rgba(0,212,255,0.1)]' : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]')}>
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <Link to="/notifications"
              className="relative p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-error rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/profile"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-energy-cyan to-crystal-blue flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="max-w-[80px] truncate">{user.name || user.account}</span>
                </Link>
                <button onClick={logout}
                  className="p-2 rounded-lg text-[#94A3B8] hover:text-error hover:bg-[rgba(239,68,68,0.1)] transition-all duration-200"
                  title="退出登录">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link to="/auth"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
                <User className="w-4 h-4" />
                <span>登录</span>
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 lg:hidden">
            <div className="absolute inset-0 bg-[rgba(10,22,40,0.95)] backdrop-blur-[20px]" />
            <div className="relative pt-[80px] px-6 pb-8 flex flex-col h-full">
              <div className="flex flex-col gap-2">
                {navLinks.map((link, index) => {
                  const isActive = location.pathname === link.path;
                  return (
                    <motion.div key={link.path} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 + 0.1 }}>
                      <Link to={link.path}
                        className={'flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ' +
                          (isActive ? 'text-energy-cyan bg-[rgba(0,212,255,0.1)]' : 'text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]')}>
                        <span>{link.label}</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              <div className="mt-auto pt-6 border-t border-[rgba(255,255,255,0.06)]">
                {user ? (
                  <div className="flex items-center justify-between">
                    <Link to="/profile" className="flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-energy-cyan to-crystal-blue flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <span className="font-medium">{user.name || user.account}</span>
                    </Link>
                    <button onClick={logout} className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm text-error hover:bg-[rgba(239,68,68,0.1)] transition-all">
                      <LogOut className="w-4 h-4" /> 退出
                    </button>
                  </div>
                ) : (
                  <Link to="/auth"
                    className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-base font-medium text-white energy-gradient transition-all duration-200 hover:shadow-glow">
                    <User className="w-5 h-5" />
                    <span>登录 / 注册</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
