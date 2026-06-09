import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Building2, Mail, Lock, Eye, EyeOff,
  User, Shield, Zap, Smartphone, School, LogIn, Loader2
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { useAuth } from '../hooks/useAuth';

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */
type AuthMode = 'login' | 'register';
type UserIdentity = 'student' | 'enterprise';

interface FormErrors {
  [key: string]: string;
}

/* ------------------------------------------------------------------ */
/*  Animation helpers                                                   */
/* ------------------------------------------------------------------ */
const easeOutExpo = [0.16, 1, 0.3, 1] as [number, number, number, number];

const slideFromRight = {
  hidden: { opacity: 0, x: 30 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: easeOutExpo } },
};

/* ------------------------------------------------------------------ */
/*  Input Component                                                     */
/* ------------------------------------------------------------------ */
interface AuthInputProps {
  type?: string;
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  icon: typeof Mail;
  error?: string;
  rightElement?: React.ReactNode;
}

function AuthInput({ type = 'text', placeholder, value, onChange, icon: Icon, error, rightElement }: AuthInputProps) {
  return (
    <div>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[#94A3B8]" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-12 pl-11 pr-${rightElement ? '12' : '4'} py-3 rounded-xl bg-white border text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none transition-all duration-200 ${
            error
              ? 'border-error focus:shadow-[0_0_0_3px_rgba(239,68,68,0.12)]'
              : 'border-[#E2E8F0] focus:border-energy-cyan focus:shadow-[0_0_0_3px_rgba(0,212,255,0.12)]'
          }`}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-error text-xs mt-1.5 ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Left Side — Brand Illustration Panel                                */
/* ------------------------------------------------------------------ */
function BrandPanel() {
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    { name: '李同学', school: '清华大学', text: '通过实习加速器，我成功拿到了字节跳动的实习offer！' },
    { name: '王同学', school: '复旦大学', text: '系统的训练让我的面试通过率提高了很多，强烈推荐！' },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hidden lg:flex flex-col justify-between w-[45%] xl:w-[40%] min-h-[100dvh] bg-deep-space relative overflow-hidden p-10">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A1628] via-[#0F2440] to-[#0A1628]" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-energy-cyan rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-crystal-blue rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: easeOutExpo, delay: 0.2 }}
          className="flex items-center gap-3"
        >
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-energy-cyan to-crystal-blue rounded-lg opacity-80" />
            <GraduationCap className="relative w-5 h-5 text-white" />
          </div>
          <span className="font-outfit font-bold text-xl text-white tracking-tight">实习加速器</span>
        </motion.div>

        {/* Illustration */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: easeOutExpo, delay: 0.4 }}
          className="flex-1 flex flex-col items-center justify-center my-8"
        >
          <motion.img
            src="/auth-illustration.png"
            alt="职业加速之旅"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[80%] max-w-[420px] rounded-2xl shadow-2xl border border-[rgba(0,212,255,0.1)]"
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease: easeOutExpo }}
            className="font-outfit text-2xl xl:text-3xl font-bold text-white mt-8 text-center"
          >
            开启你的职业加速之旅
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            className="text-[#94A3B8] text-sm mt-3 text-center max-w-xs"
          >
            已有 50,000+ 学生通过实习加速器获得理想实习
          </motion.p>
        </motion.div>

        {/* Rotating Testimonials */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="min-h-[80px]"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={quoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="bg-[rgba(255,255,255,0.05)] backdrop-blur-sm rounded-xl p-4 border border-[rgba(255,255,255,0.06)]"
            >
              <p className="text-[#CBD5E1] text-sm leading-relaxed mb-2">&ldquo;{quotes[quoteIndex].text}&rdquo;</p>
              <p className="text-energy-cyan text-xs">— {quotes[quoteIndex].name} · {quotes[quoteIndex].school}</p>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Feature Tags */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4, ease: easeOutExpo }}
          className="flex items-center gap-3 mt-6"
        >
          {[
            { icon: Shield, label: '安全可信' },
            { icon: Zap, label: 'AI驱动' },
            { icon: User, label: '50,000+学员' },
          ].map((tag) => (
            <span
              key={tag.label}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#94A3B8] bg-[rgba(255,255,255,0.05)]"
            >
              <tag.icon className="w-3.5 h-3.5 text-energy-cyan" />
              {tag.label}
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Right Side — Form Panel                                             */
/* ------------------------------------------------------------------ */
interface FormPanelProps {
  mode: AuthMode;
  onChangeMode: (m: AuthMode) => void;
}

function FormPanel({ mode, onChangeMode }: FormPanelProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const { login, register } = useAuth();
  const [identity, setIdentity] = useState<UserIdentity>('student');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState({ account: '', password: '', remember: false });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    name: '', school: '', account: '', password: '', confirm: '', code: '',
  });
  const [codeCountdown, setCodeCountdown] = useState(0);

  // Countdown timer for verification code
  useEffect(() => {
    if (codeCountdown <= 0) return;
    const timer = setTimeout(() => setCodeCountdown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  // Clear errors when switching mode
  useEffect(() => {
    setErrors({});
  }, [mode]);

  const getCode = () => {
    if (codeCountdown > 0) return;
    if (!registerForm.account) {
      setErrors({ account: '请先输入手机号' });
      return;
    }
    setCodeCountdown(60);
    toast('验证码已发送', 'success');
  };

  const validateLogin = (): boolean => {
    const errs: FormErrors = {};
    if (!loginForm.account.trim()) errs.loginAccount = '请输入账号或手机号';
    if (!loginForm.password) errs.loginPassword = '请输入密码';
    if (loginForm.password && loginForm.password.length < 4) errs.loginPassword = '密码至少4位';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = (): boolean => {
    const errs: FormErrors = {};
    if (!registerForm.name.trim()) errs.regName = '请输入姓名';
    if (!registerForm.school.trim()) errs.regSchool = '请输入学校';
    if (!registerForm.account.trim()) errs.regAccount = '请输入手机号';
    else if (!/^1\d{10}$/.test(registerForm.account)) errs.regAccount = '请输入有效的11位手机号';
    if (!registerForm.password) errs.regPassword = '请设置密码';
    else if (registerForm.password.length < 6) errs.regPassword = '密码至少6位';
    if (registerForm.password !== registerForm.confirm) errs.regConfirm = '两次输入的密码不一致';
    if (!registerForm.code) errs.regCode = '请输入验证码';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setIsSubmitting(true);
    try {
      await login(loginForm.account, loginForm.password, identity);
      toast('登录成功', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '登录失败，请检查账号密码';
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (!validateRegister()) return;
    setIsSubmitting(true);
    try {
      await register({
        account: registerForm.account,
        password: registerForm.password,
        confirmPassword: registerForm.confirm,
        name: registerForm.name,
        school: registerForm.school,
        major: '',
      });
      toast('注册成功', 'success');
      setTimeout(() => navigate('/'), 800);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || '注册失败，请稍后重试';
      toast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Login Form ── */
  const renderLoginForm = () => (
    <motion.div
      key="login"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: easeOutExpo }}
      className="space-y-4"
    >
      <AuthInput
        placeholder="请输入账号或手机号"
        value={loginForm.account}
        onChange={(v) => setLoginForm(prev => ({ ...prev, account: v }))}
        icon={Smartphone}
        error={errors.loginAccount}
      />
      <AuthInput
        type={showPassword ? 'text' : 'password'}
        placeholder="请输入密码"
        value={loginForm.password}
        onChange={(v) => setLoginForm(prev => ({ ...prev, password: v }))}
        icon={Lock}
        error={errors.loginPassword}
        rightElement={
          <button onClick={() => setShowPassword(!showPassword)} className="text-[#94A3B8] hover:text-[#64748B]">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={loginForm.remember}
            onChange={(e) => setLoginForm(prev => ({ ...prev, remember: e.target.checked }))}
            className="w-4 h-4 rounded border-[#E2E8F0] text-energy-cyan focus:ring-energy-cyan"
          />
          <span className="text-[#64748B]">记住密码</span>
        </label>
        <button className="text-energy-cyan hover:underline text-sm">忘记密码？</button>
      </div>

      {/* Login Button */}
      <motion.button
        whileHover={{ y: -2, boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
        whileTap={{ scale: 0.98 }}
        onClick={handleLogin}
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl energy-gradient text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <LogIn className="w-4 h-4" />
            立即登录
          </>
        )}
      </motion.button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-4">
        <div className="flex-1 h-px bg-[#E2E8F0]" />
        <span className="text-xs text-[#94A3B8]">或</span>
        <div className="flex-1 h-px bg-[#E2E8F0]" />
      </div>

      {/* Switch to register */}
      <p className="text-center text-sm text-[#64748B]">
        还没有账号？
        <button onClick={() => onChangeMode('register')} className="text-energy-cyan font-medium hover:underline ml-1">
          注册账号
        </button>
      </p>
    </motion.div>
  );

  /* ── Register Form ── */
  const renderRegisterForm = () => (
    <motion.div
      key="register"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3, ease: easeOutExpo }}
      className="space-y-4"
    >
      {/* Identity Selector */}
      <div className="space-y-2">
        <label className="text-sm text-[#64748B]">选择身份</label>
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIdentity('student')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
              identity === 'student'
                ? 'border-energy-cyan bg-[rgba(0,212,255,0.05)]'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <GraduationCap className={`w-6 h-6 ${identity === 'student' ? 'text-energy-cyan' : 'text-[#94A3B8]'}`} />
            <div className="text-center">
              <p className={`text-sm font-medium ${identity === 'student' ? 'text-[#0A1628]' : 'text-[#64748B]'}`}>高校学生</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">寻找实习机会</p>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIdentity('enterprise')}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
              identity === 'enterprise'
                ? 'border-energy-cyan bg-[rgba(0,212,255,0.05)]'
                : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1]'
            }`}
          >
            <Building2 className={`w-6 h-6 ${identity === 'enterprise' ? 'text-energy-cyan' : 'text-[#94A3B8]'}`} />
            <div className="text-center">
              <p className={`text-sm font-medium ${identity === 'enterprise' ? 'text-[#0A1628]' : 'text-[#64748B]'}`}>合作企业</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">发布实习岗位</p>
            </div>
          </motion.button>
        </div>
      </div>

      <AuthInput
        placeholder="请输入真实姓名"
        value={registerForm.name}
        onChange={(v) => setRegisterForm(prev => ({ ...prev, name: v }))}
        icon={User}
        error={errors.regName}
      />
      <AuthInput
        placeholder="请输入你的学校"
        value={registerForm.school}
        onChange={(v) => setRegisterForm(prev => ({ ...prev, school: v }))}
        icon={School}
        error={errors.regSchool}
      />
      <AuthInput
        placeholder="请输入手机号"
        value={registerForm.account}
        onChange={(v) => setRegisterForm(prev => ({ ...prev, account: v }))}
        icon={Smartphone}
        error={errors.regAccount}
      />
      <AuthInput
        type={showPassword ? 'text' : 'password'}
        placeholder="请设置密码（6-20位）"
        value={registerForm.password}
        onChange={(v) => setRegisterForm(prev => ({ ...prev, password: v }))}
        icon={Lock}
        error={errors.regPassword}
        rightElement={
          <button onClick={() => setShowPassword(!showPassword)} className="text-[#94A3B8] hover:text-[#64748B]">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <AuthInput
        type={showConfirmPassword ? 'text' : 'password'}
        placeholder="请再次输入密码"
        value={registerForm.confirm}
        onChange={(v) => setRegisterForm(prev => ({ ...prev, confirm: v }))}
        icon={Lock}
        error={errors.regConfirm}
        rightElement={
          <button onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-[#94A3B8] hover:text-[#64748B]">
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />

      {/* Verification Code */}
      <div>
        <div className="flex gap-3">
          <div className="flex-1">
            <AuthInput
              placeholder="请输入验证码"
              value={registerForm.code}
              onChange={(v) => setRegisterForm(prev => ({ ...prev, code: v }))}
              icon={Shield}
              error={errors.regCode}
            />
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={getCode}
            disabled={codeCountdown > 0}
            className={`h-12 px-4 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              codeCountdown > 0
                ? 'bg-[#E2E8F0] text-[#94A3B8]'
                : 'energy-gradient text-white hover:shadow-glow'
            }`}
          >
            {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
          </motion.button>
        </div>
      </div>

      {/* Register Button */}
      <motion.button
        whileHover={{ y: -2, boxShadow: '0 0 40px rgba(0,212,255,0.3)' }}
        whileTap={{ scale: 0.98 }}
        onClick={handleRegister}
        disabled={isSubmitting}
        className="w-full h-12 rounded-xl energy-gradient text-white font-medium text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-60"
      >
        {isSubmitting ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <User className="w-4 h-4" />
            注册
          </>
        )}
      </motion.button>

      {/* Switch to login */}
      <p className="text-center text-sm text-[#64748B]">
        已有账号？
        <button onClick={() => onChangeMode('login')} className="text-energy-cyan font-medium hover:underline ml-1">
          立即登录
        </button>
      </p>
    </motion.div>
  );

  return (
    <motion.div
      variants={slideFromRight}
      initial="hidden"
      animate="visible"
      className="flex-1 flex flex-col items-center justify-center min-h-[100dvh] bg-light-bg px-6 py-10"
    >
      <div className="w-full max-w-[420px]">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-energy-cyan to-crystal-blue rounded-lg opacity-80" />
            <GraduationCap className="relative w-5 h-5 text-white" />
          </div>
          <span className="font-outfit font-bold text-xl text-[#0A1628]">实习加速器</span>
        </div>

        {/* Tab Switch */}
        <div className="flex gap-1 mb-8 border-b border-[#E2E8F0]">
          {([['login', '登录'], ['register', '注册']] as const).map(([m, label]) => (
            <button
              key={m}
              onClick={() => onChangeMode(m)}
              className={`relative flex-1 pb-3 text-base font-medium text-center transition-colors duration-200 ${
                mode === m ? 'text-[#0A1628]' : 'text-[#64748B] hover:text-[#94A3B8]'
              }`}
            >
              {label}
              {mode === m && (
                <motion.div
                  layoutId="auth-tab-indicator"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-energy-cyan"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Form Title */}
        <div className="mb-6">
          <h2 className="font-outfit text-xl font-bold text-[#0A1628]">
            {mode === 'login' ? '欢迎回来' : '创建新账号'}
          </h2>
          <p className="text-sm text-[#94A3B8] mt-1">
            {mode === 'login' ? '登录你的实习加速器账号' : '填写以下信息完成注册'}
          </p>
        </div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          {mode === 'login' ? renderLoginForm() : renderRegisterForm()}
        </AnimatePresence>

        {/* Security Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 flex items-start gap-2.5 p-3 rounded-xl bg-[rgba(0,212,255,0.05)] border border-[rgba(0,212,255,0.1)]"
        >
          <Shield className="w-4 h-4 text-energy-cyan shrink-0 mt-0.5" />
          <p className="text-xs text-[#64748B] leading-relaxed">
            请确保在安全环境下登录，不要向他人透露账号密码
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Auth Page                                                      */
/* ------------------------------------------------------------------ */
export default function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-[100dvh]">
      <BrandPanel />
      <FormPanel mode={mode} onChangeMode={setMode} />
    </div>
  );
}
