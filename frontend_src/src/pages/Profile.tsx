import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Edit3, Camera, BookOpen, Award, Settings,
  Code2, Languages, Brain, Timer, CheckCircle2,
  Lock, Bell, Smartphone, Mail, Shield,
  GraduationCap, Building2, TrendingUp, Zap, ChevronRight,
  BarChart3, FileText, Loader2, Clock
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';
import { profileApi } from '../api/profile';
import { authApi } from '../api/auth';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
interface TrainingRecord {
  id: number;
  topic: string;
  category: string;
  difficulty: string;
  duration: number;
  status: '已完成' | '进行中';
  createdAt: string;
}

interface Certificate {
  id: number;
  title: string;
  issuer: string;
  certDate: string;
  certNo: string;
  image?: string;
}

interface ProfileData {
  id: number;
  name: string;
  school: string;
  major: string;
  phone: string;
  email: string;
  skillProfessional?: string;
  skillLanguage?: string;
  skillSoft?: string;
}

interface NotificationSetting {
  id: string;
  label: string;
  enabled: boolean;
}

/* ------------------------------------------------------------------ */
/*  Animation Variants                                                  */
/* ------------------------------------------------------------------ */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: easeOutExpo },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const tabContentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easeOutExpo } },
  exit: { opacity: 0, y: -12, transition: { duration: 0.25 } },
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
/* ------------------------------------------------------------------ */
function GlassCard({ children, className = '', hover = true }: { children: React.ReactNode; className?: string; hover?: boolean }) {
  return (
    <div className={`glass-card rounded-2xl p-6 ${hover ? 'glass-card-hover transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
}

function SkillBar({ label, level, value, color = '#00D4FF' }: { label: string; level: string; value: number; color?: string }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm text-[#94A3B8]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white font-medium">{level}</span>
        </div>
      </div>
      <div className="h-1.5 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.3 }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
      </div>
    </div>
  );
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${enabled ? 'bg-energy-cyan' : 'bg-[#CBD5E1] dark:bg-[#334155]'}`}
    >
      <motion.div
        animate={{ x: enabled ? 20 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 28 }}
        className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow"
      />
    </button>
  );
}

function StatusBadge({ status }: { status: '已完成' | '进行中' }) {
  const isCompleted = status === '已完成';
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isCompleted ? 'bg-[rgba(16,185,129,0.15)] text-success' : 'bg-[rgba(0,212,255,0.15)] text-energy-cyan'}`}>
      {isCompleted && <CheckCircle2 className="w-3 h-3" />}
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: string }) {
  const colorMap: Record<string, string> = {
    '技能训练': 'bg-[rgba(0,212,255,0.15)] text-energy-cyan',
    '语言训练': 'bg-[rgba(139,92,246,0.15)] text-neon-purple',
    '软技能训练': 'bg-[rgba(245,158,11,0.15)] text-warning',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${colorMap[type] || colorMap['技能训练']}`}>
      {type}
    </span>
  );
}

function Spinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`animate-spin ${className}`} />;
}

/* ------------------------------------------------------------------ */
/*  Tab 1: 个人信息                                                      */
/* ------------------------------------------------------------------ */
function PersonalInfoTab({ profile, onProfileUpdate }: { profile: ProfileData | null; onProfileUpdate: (p: ProfileData) => void }) {
  const toast = useToast();
  const [form, setForm] = useState({
    name: '',
    school: '',
    major: '',
    phone: '',
    email: '',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        school: profile.school || '',
        major: profile.major || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
  }, [profile]);

  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await profileApi.update(form);
      if (res.success) {
        setSaved(true);
        toast('保存成功', 'success');
        if (profile) onProfileUpdate({ ...profile, ...form });
        setTimeout(() => setSaved(false), 2000);
      } else {
        toast(res.message || '保存失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '保存失败，请稍后重试', 'error');
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { key: 'name', label: '姓名', icon: User },
    { key: 'school', label: '学校', icon: GraduationCap },
    { key: 'major', label: '专业', icon: BookOpen },
    { key: 'phone', label: '手机号', icon: Smartphone },
    { key: 'email', label: '邮箱', icon: Mail },
  ];

  const skillProf = parseInt(profile?.skillProfessional || '0', 10) || 45;
  const skillLang = parseInt(profile?.skillLanguage || '0', 10) || 65;
  const skillSoft = parseInt(profile?.skillSoft || '0', 10) || 85;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left: Form */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-3">
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-outfit text-lg font-semibold text-white">基本信息</h3>
            <Edit3 className="w-4 h-4 text-energy-cyan" />
          </div>
          <div className="space-y-4">
            {fields.map((field, i) => {
              const Icon = field.icon;
              return (
                <motion.div key={field.key} custom={i} variants={fadeInUp}>
                  <label className="flex items-center gap-2 text-sm text-[#94A3B8] mb-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    {field.label}
                  </label>
                  <input
                    type={field.key === 'email' ? 'email' : 'text'}
                    value={form[field.key as keyof typeof form]}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    className="w-full h-11 px-4 rounded-xl bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)] transition-all duration-200"
                  />
                </motion.div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-3 mt-6">
            {saved && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-success text-sm">
                保存成功
              </motion.span>
            )}
            <motion.button
              whileHover={{ y: -2, boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 rounded-xl energy-gradient text-white text-sm font-medium transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
            >
              {saving && <Spinner className="w-4 h-4" />}
              保存
            </motion.button>
          </div>
        </GlassCard>
      </motion.div>

      {/* Right: Overview Panel */}
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="lg:col-span-2 space-y-6">
        <motion.div variants={fadeInUp} custom={0}>
          <GlassCard>
            <h4 className="font-outfit text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-energy-cyan" />
              个人概览
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">姓名</span>
                <span className="text-white">{profile?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">学校</span>
                <span className="text-white">{profile?.school || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#94A3B8]">专业</span>
                <span className="text-white">{profile?.major || '-'}</span>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div variants={fadeInUp} custom={1}>
          <GlassCard>
            <h4 className="font-outfit text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-energy-cyan" />
              技能水平
            </h4>
            <SkillBar label="专业技能" level={skillProf >= 80 ? '高级' : skillProf >= 60 ? '中级' : '初级'} value={skillProf} color="#00D4FF" />
            <SkillBar label="语言能力" level={skillLang >= 80 ? '高级' : skillLang >= 60 ? '中级' : '初级'} value={skillLang} color="#8B5CF6" />
            <SkillBar label="软技能" level={skillSoft >= 80 ? '高级' : skillSoft >= 60 ? '中级' : '初级'} value={skillSoft} color="#10B981" />
          </GlassCard>
        </motion.div>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 2: 训练记录                                                      */
/* ------------------------------------------------------------------ */
function TrainingRecordsTab({ records, loading }: { records: TrainingRecord[]; loading: boolean }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-energy-cyan" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center mb-4">
          <TrendingUp className="w-8 h-8 text-[#64748B]" />
        </div>
        <p className="text-[#64748B] text-sm">暂无训练记录</p>
      </div>
    );
  }

  const iconMap: Record<string, typeof Code2> = {
    '技能训练': Code2,
    '语言训练': Languages,
    '软技能训练': Brain,
  };
  const colorMap: Record<string, string> = {
    '技能训练': '#00D4FF',
    '语言训练': '#8B5CF6',
    '软技能训练': '#F59E0B',
  };

  return (
    <div className="max-w-4xl">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-4">
        {records.map((record, i) => {
          const Icon = iconMap[record.category] || Code2;
          const color = colorMap[record.category] || '#00D4FF';
          const displayType = (record.category as '技能训练' | '语言训练' | '软技能训练') || '技能训练';
          return (
            <motion.div
              key={record.id}
              custom={i}
              variants={fadeInUp}
              whileHover={{ x: 4, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
              className="glass-card rounded-xl p-5 flex items-center gap-4 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-white font-medium text-sm truncate">{record.topic}</h4>
                  <TypeBadge type={displayType} />
                </div>
                <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    {record.createdAt?.split('T')[0] || '-'}
                  </span>
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    {record.difficulty || '中等'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {record.duration}分钟
                  </span>
                </div>
              </div>
              <StatusBadge status={record.status === '已完成' ? '已完成' : '进行中'} />
              <ChevronRight className="w-4 h-4 text-[#64748B] shrink-0" />
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 3: 证书管理                                                      */
/* ------------------------------------------------------------------ */
function CertificatesTab({ certificates, loading }: { certificates: Certificate[]; loading: boolean }) {
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner className="w-8 h-8 text-energy-cyan" />
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(0,212,255,0.08)] flex items-center justify-center mb-4">
          <Award className="w-8 h-8 text-[#64748B]" />
        </div>
        <p className="text-[#64748B] text-sm">暂无证书</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">
        {certificates.map((cert, i) => (
          <motion.div
            key={cert.id}
            custom={i}
            variants={fadeInUp}
            whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
            className="glass-card rounded-2xl overflow-hidden transition-all duration-300"
          >
            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="md:col-span-1 bg-[rgba(0,212,255,0.05)] flex items-center justify-center p-4 border-r border-[rgba(0,212,255,0.08)]">
                <img
                  src={cert.image || '/cert-template.png'}
                  alt={cert.title}
                  className="w-full max-w-[180px] rounded-lg border border-[rgba(0,212,255,0.15)] shadow-lg"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/cert-template.png'; }}
                />
              </div>
              <div className="md:col-span-2 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-outfit text-lg font-semibold text-white mb-2">{cert.title}</h4>
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-energy-cyan" />
                      <span className="text-xs text-energy-cyan bg-[rgba(0,212,255,0.1)] px-2 py-0.5 rounded-full">已认证</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <Building2 className="w-3.5 h-3.5" />
                    颁发机构：<span className="text-white">{cert.issuer}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <FileText className="w-3.5 h-3.5" />
                    证书编号：<span className="text-white">{cert.certNo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#94A3B8]">
                    <Timer className="w-3.5 h-3.5" />
                    颁发时间：<span className="text-white">{cert.certDate}</span>
                  </div>
                </div>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCert(cert)}
                  className="px-5 py-2 rounded-lg border border-energy-cyan text-energy-cyan text-sm font-medium hover:bg-[rgba(0,212,255,0.1)] transition-colors duration-200"
                >
                  查看证书
                </motion.button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Certificate Detail Modal */}
      <AnimatePresence>
        {selectedCert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(0,0,0,0.7)]"
            onClick={() => setSelectedCert(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo }}
              className="bg-[#1E3A5F] rounded-2xl p-6 max-w-lg w-full border border-[rgba(0,212,255,0.15)]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-outfit text-xl font-bold text-white">{selectedCert.title}</h3>
                <button onClick={() => setSelectedCert(null)} className="p-1 rounded-lg hover:bg-[rgba(255,255,255,0.1)] transition-colors">
                  <span className="text-white text-xl">&times;</span>
                </button>
              </div>
              <img
                src={selectedCert.image || '/cert-template.png'}
                alt={selectedCert.title}
                className="w-full rounded-xl border border-[rgba(0,212,255,0.15)] mb-4"
                onError={(e) => { (e.target as HTMLImageElement).src = '/cert-template.png'; }}
              />
              <div className="text-sm text-[#94A3B8] space-y-1 mb-5">
                <p>颁发机构：{selectedCert.issuer}</p>
                <p>证书编号：{selectedCert.certNo}</p>
                <p>颁发时间：{selectedCert.certDate}</p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 py-2.5 rounded-xl energy-gradient text-white text-sm font-medium"
                >
                  下载PDF
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCert(null)}
                  className="flex-1 py-2.5 rounded-xl border border-[rgba(255,255,255,0.15)] text-white text-sm font-medium hover:bg-[rgba(255,255,255,0.05)] transition-colors"
                >
                  关闭
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Tab 4: 账号设置                                                      */
/* ------------------------------------------------------------------ */
function AccountSettingsTab() {
  const { logout } = useAuth();
  const toast = useToast();
  const [passwordForm, setPasswordForm] = useState({ old: '', new: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSetting[]>([
    { id: 'platform', label: '接收平台通知', enabled: true },
    { id: 'email', label: '接收邮件通知', enabled: true },
    { id: 'sms', label: '接收短信通知', enabled: false },
  ]);

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  const handlePasswordSave = async () => {
    setPwError('');
    setPwSuccess(false);
    if (!passwordForm.old || !passwordForm.new || !passwordForm.confirm) {
      setPwError('请填写所有密码字段');
      return;
    }
    if (passwordForm.new.length < 6) {
      setPwError('新密码长度至少6位');
      return;
    }
    if (passwordForm.new !== passwordForm.confirm) {
      setPwError('两次输入的新密码不一致');
      return;
    }
    setPwSaving(true);
    try {
      const res = await authApi.updatePassword({ oldPassword: passwordForm.old, newPassword: passwordForm.new });
      if (res.success) {
        setPwSuccess(true);
        toast('密码修改成功', 'success');
        setPasswordForm({ old: '', new: '', confirm: '' });
        setTimeout(() => setPwSuccess(false), 3000);
      } else {
        setPwError(res.message || '密码修改失败');
        toast(res.message || '密码修改失败', 'error');
      }
    } catch (err: any) {
      const msg = err?.message || '密码修改失败，请稍后重试';
      setPwError(msg);
      toast(msg, 'error');
    } finally {
      setPwSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="max-w-2xl space-y-6">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <GlassCard>
          <motion.div custom={0} variants={fadeInUp}>
            <h3 className="font-outfit text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Lock className="w-5 h-5 text-energy-cyan" />
              修改密码
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-[#94A3B8] mb-1.5 block">原密码</label>
                <input
                  type="password"
                  value={passwordForm.old}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, old: e.target.value }))}
                  placeholder="请输入原密码"
                  className="w-full h-11 px-4 rounded-xl bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)] transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-sm text-[#94A3B8] mb-1.5 block">新密码</label>
                <input
                  type="password"
                  value={passwordForm.new}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, new: e.target.value }))}
                  placeholder="请输入新密码（至少6位）"
                  className="w-full h-11 px-4 rounded-xl bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)] transition-all duration-200"
                />
              </div>
              <div>
                <label className="text-sm text-[#94A3B8] mb-1.5 block">确认密码</label>
                <input
                  type="password"
                  value={passwordForm.confirm}
                  onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm: e.target.value }))}
                  placeholder="请再次输入新密码"
                  className="w-full h-11 px-4 rounded-xl bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)] transition-all duration-200"
                />
              </div>
              {pwError && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-error text-sm">{pwError}</motion.p>
              )}
              {pwSuccess && (
                <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-success text-sm">密码修改成功</motion.p>
              )}
              <div className="flex justify-end">
                <motion.button
                  whileHover={{ y: -2, boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handlePasswordSave}
                  disabled={pwSaving}
                  className="px-6 py-2.5 rounded-xl energy-gradient text-white text-sm font-medium transition-all duration-200 disabled:opacity-60 flex items-center gap-2"
                >
                  {pwSaving && <Spinner className="w-4 h-4" />}
                  保存
                </motion.button>
              </div>
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <GlassCard>
          <motion.div custom={0} variants={fadeInUp}>
            <h3 className="font-outfit text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-energy-cyan" />
              通知设置
            </h3>
            <div className="space-y-4">
              {notifications.map(n => (
                <div key={n.id} className="flex items-center justify-between py-1">
                  <span className="text-sm text-white">{n.label}</span>
                  <Toggle enabled={n.enabled} onChange={() => toggleNotification(n.id)} />
                </div>
              ))}
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>

      <motion.div variants={staggerContainer} initial="hidden" animate="visible">
        <GlassCard>
          <motion.div custom={0} variants={fadeInUp}>
            <h3 className="font-outfit text-lg font-semibold text-white mb-5 flex items-center gap-2">
              <Shield className="w-5 h-5 text-energy-cyan" />
              账号安全
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white">退出登录</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">退出当前账号，返回登录页</p>
              </div>
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleLogout}
                className="px-5 py-2 rounded-lg border border-error text-error text-sm font-medium hover:bg-[rgba(239,68,68,0.1)] transition-colors duration-200"
              >
                退出登录
              </motion.button>
            </div>
          </motion.div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Profile Page                                                   */
/* ------------------------------------------------------------------ */
const tabs = [
  { key: 'info', label: '个人信息', icon: User },
  { key: 'training', label: '训练记录', icon: TrendingUp },
  { key: 'certificates', label: '证书管理', icon: Award },
  { key: 'settings', label: '账号设置', icon: Settings },
];

export default function Profile() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingTraining, setLoadingTraining] = useState(true);
  const [loadingCerts, setLoadingCerts] = useState(true);
  const toast = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      setLoadingProfile(true);
      setLoadingTraining(true);
      setLoadingCerts(true);

      try {
        const [profileRes, trainingRes, certsRes] = await Promise.all([
          profileApi.get(),
          profileApi.trainingRecords(),
          profileApi.certificates(),
        ]);

        if (profileRes.success && profileRes.data) {
          setProfile(profileRes.data);
        }
        if (trainingRes.success && trainingRes.data) {
          setTrainingRecords(trainingRes.data);
        }
        if (certsRes.success && certsRes.data) {
          setCertificates(certsRes.data);
        }
      } catch (err: any) {
        toast(err?.message || '获取数据失败', 'error');
      } finally {
        setLoadingProfile(false);
        setLoadingTraining(false);
        setLoadingCerts(false);
      }
    };

    fetchAll();
  }, [toast]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'info': return <PersonalInfoTab profile={profile} onProfileUpdate={setProfile} />;
      case 'training': return <TrainingRecordsTab records={trainingRecords} loading={loadingTraining} />;
      case 'certificates': return <CertificatesTab certificates={certificates} loading={loadingCerts} />;
      case 'settings': return <AccountSettingsTab />;
      default: return <PersonalInfoTab profile={profile} onProfileUpdate={setProfile} />;
    }
  };

  const displayName = profile?.name || user?.name || '加载中...';
  const displayMajor = profile?.major || user?.major || '';
  const displaySchool = profile?.school || user?.school || '';

  return (
    <div className="min-h-[100dvh] bg-deep-space">
      <section className="relative pt-[72px]">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628] via-[#0F2440] to-[#0A1628] opacity-80" />

        <div className="section-container relative py-12 md:py-16">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: easeOutExpo }}
              className="relative shrink-0"
            >
              <div className="w-[120px] h-[120px] rounded-full bg-gradient-to-br from-energy-cyan to-crystal-blue p-[3px] shadow-glow">
                <div className="w-full h-full rounded-full bg-[#1E3A5F] flex items-center justify-center overflow-hidden">
                  <User className="w-14 h-14 text-[#94A3B8]" />
                </div>
              </div>
              <button className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-deep-space border border-[rgba(0,212,255,0.2)] flex items-center justify-center text-energy-cyan hover:bg-[rgba(0,212,255,0.1)] transition-colors">
                <Camera className="w-4 h-4" />
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.15 }}
              className="flex-1 text-center md:text-left"
            >
              <h1 className="font-outfit text-2xl md:text-3xl font-bold text-white mb-1.5">
                {loadingProfile ? '加载中...' : displayName}
              </h1>
              <p className="text-[#94A3B8] text-base mb-3">
                {displaySchool && displayMajor ? `${displaySchool} / ${displayMajor}` : '高校学生'}
              </p>
              <div className="flex items-center gap-2 justify-center md:justify-start">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(0,212,255,0.1)] text-energy-cyan">
                  <Zap className="w-3 h-3" />
                  进阶级
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[rgba(16,185,129,0.1)] text-success">
                  <CheckCircle2 className="w-3 h-3" />
                  已认证
                </span>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, ease: easeOutExpo, delay: 0.3 }}
              className="shrink-0"
            >
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab('info')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[rgba(0,212,255,0.2)] text-energy-cyan text-sm font-medium hover:bg-[rgba(0,212,255,0.08)] transition-all duration-200"
              >
                <Edit3 className="w-4 h-4" />
                编辑资料
              </motion.button>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-30 bg-[rgba(10,22,40,0.9)] backdrop-blur-[20px] border-b border-[rgba(255,255,255,0.06)]">
        <div className="section-container">
          <div className="flex gap-1 overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    isActive ? 'text-energy-cyan' : 'text-[#64748B] hover:text-[#94A3B8]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="profile-tab-indicator"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-energy-cyan"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section-container py-8 md:py-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={tabContentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}


