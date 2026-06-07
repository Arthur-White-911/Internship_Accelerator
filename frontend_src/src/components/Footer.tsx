import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, Mail, MessageCircle } from 'lucide-react';

const footerColumns = [
  {
    title: '产品服务',
    links: [
      { label: '职业能力分析', path: '/assessment' },
      { label: '培养方案', path: '/programs' },
      { label: '面试帮手', path: '/interview' },
      { label: '自主训练', path: '/training' },
      { label: '求职咨询', path: '/chat' },
    ],
  },
  {
    title: '关于我们',
    links: [
      { label: '平台介绍', path: '#' },
      { label: '团队介绍', path: '#' },
      { label: '发展历程', path: '#' },
      { label: '合作伙伴', path: '#' },
    ],
  },
  {
    title: '帮助支持',
    links: [
      { label: '使用指南', path: '#' },
      { label: '常见问题', path: '#' },
      { label: '联系客服', path: '#' },
      { label: '意见反馈', path: '#' },
    ],
  },
  {
    title: '联系我们',
    items: [
      { icon: Mail, label: 'support@shixijsqi.com' },
      { icon: MessageCircle, label: '微信公众号: 实习加速器' },
    ],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export default function Footer() {
  return (
    <footer className="bg-deep-space border-t border-[rgba(0,212,255,0.1)]">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="section-container py-16"
      >
        {/* Upper Area */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand Info */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="relative w-9 h-9 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-energy-cyan to-crystal-blue rounded-lg opacity-80" />
                <Zap className="relative w-5 h-5 text-white" />
              </div>
              <span className="font-outfit font-bold text-lg text-white tracking-tight">
                实习加速器
              </span>
            </Link>
            <p className="text-text-gray text-sm leading-relaxed max-w-xs">
              高校学生实习预训数字平台，AI驱动的职业能力分析与分级培养体系，助你从校园到职场加速成长。
            </p>
          </motion.div>

          {/* Link Columns */}
          {footerColumns.map((col) => (
            <motion.div key={col.title} variants={itemVariants}>
              <h4 className="font-outfit font-semibold text-white text-sm mb-4">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links
                  ? col.links.map((link) => (
                      <li key={link.label}>
                        <Link
                          to={link.path}
                          className="text-text-gray text-sm hover:text-energy-cyan transition-colors duration-200"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))
                  : 'items' in col
                    ? col.items.map((item) => (
                        <li key={item.label} className="flex items-center gap-2 text-text-gray text-sm">
                          <item.icon className="w-4 h-4 text-energy-cyan" />
                          <span>{item.label}</span>
                        </li>
                      ))
                    : null}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[rgba(255,255,255,0.06)] pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-dark-gray text-xs">
              &copy; 2025 实习加速器 版权所有
            </p>
            <div className="flex items-center gap-4 text-dark-gray text-xs">
              <span>京ICP备2025XXXXXX号</span>
              <span className="hidden sm:inline">|</span>
              <div className="flex items-center gap-3">
                <span className="hover:text-energy-cyan cursor-pointer transition-colors">微博</span>
                <span className="hover:text-energy-cyan cursor-pointer transition-colors">微信</span>
                <span className="hover:text-energy-cyan cursor-pointer transition-colors">B站</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
}
