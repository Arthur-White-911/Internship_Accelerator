import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Trash2,
  User,
  Loader2,
} from 'lucide-react';
import { useToast } from '../components/Toast';
import { chatApi } from '../api/chat';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface Message {
  id: string;
  role: 'ai' | 'user';
  content: string;
  timestamp: Date;
  suggestions?: string[];
}

interface ChatHistoryItem {
  id: number;
  role: string;
  content: string;
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/*  Quick questions                                                     */
/* ------------------------------------------------------------------ */
const QUICK_QUESTIONS = [
  '如何制作优秀简历？',
  '面试自我介绍怎么说？',
  '如何规划职业发展？',
  '技术岗面试准备',
];

/* ------------------------------------------------------------------ */
/*  Timestamp formatter                                                */
/* ------------------------------------------------------------------ */
function formatTime(date: Date): string {
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Chat() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  /* Fetch chat history on mount */
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const res = await chatApi.history();
        if (res.success && res.data && res.data.length > 0) {
          const historyMessages: Message[] = res.data.map((item: ChatHistoryItem) => ({
            id: `hist-${item.id}`,
            role: item.role === 'user' ? 'user' : 'ai',
            content: item.content,
            timestamp: new Date(item.createdAt),
          }));
          setMessages(historyMessages);
        } else {
          /* Show welcome message if no history */
          setMessages([
            {
              id: 'welcome',
              role: 'ai',
              content:
                '你好！我是你的AI求职导师，可以回答你关于简历制作、面试技巧、职业规划等问题。有什么可以帮助你的吗？',
              timestamp: new Date(),
            },
          ]);
        }
      } catch (err: any) {
        toast(err?.message || '获取聊天记录失败', 'error');
        /* Show welcome message on error */
        setMessages([
          {
            id: 'welcome',
            role: 'ai',
            content:
              '你好！我是你的AI求职导师，可以回答你关于简历制作、面试技巧、职业规划等问题。有什么可以帮助你的吗？',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, [toast]);

  /* Auto-focus input on mount */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* Scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /* Auto-resize textarea */
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, []);

  useEffect(() => {
    autoResize();
  }, [inputValue, autoResize]);

  /* Send message */
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isTyping) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: trimmed,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputValue('');
      if (inputRef.current) inputRef.current.style.height = 'auto';
      setIsTyping(true);

      try {
        const res = await chatApi.send(trimmed);
        if (res.success && res.data) {
          const aiMsg: Message = {
            id: `ai-${Date.now()}`,
            role: 'ai',
            content: res.data.message,
            timestamp: new Date(res.data.timestamp || Date.now()),
            suggestions: res.data.suggestions,
          };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          toast(res.message || '发送失败，请重试', 'error');
          /* Show error message as AI response */
          const errorMsg: Message = {
            id: `ai-err-${Date.now()}`,
            role: 'ai',
            content: '抱歉，我暂时无法处理你的请求，请稍后再试。',
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMsg]);
        }
      } catch (err: any) {
        toast(err?.message || '网络错误，请检查网络连接', 'error');
        /* Show error message as AI response */
        const errorMsg: Message = {
          id: `ai-err-${Date.now()}`,
          role: 'ai',
          content: '抱歉，网络出现问题，请检查你的网络连接后重试。',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [isTyping, toast]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(inputValue);
    }
  };

  const clearChat = async () => {
    setClearing(true);
    try {
      const res = await chatApi.clear();
      if (res.success) {
        setMessages([
          {
            id: 'welcome-2',
            role: 'ai',
            content:
              '你好！我是你的AI求职导师，可以回答你关于简历制作、面试技巧、职业规划等问题。有什么可以帮助你的吗？',
            timestamp: new Date(),
          },
        ]);
        toast('对话已清空', 'success');
      } else {
        toast(res.message || '清空失败', 'error');
      }
    } catch (err: any) {
      toast(err?.message || '清空对话失败', 'error');
    } finally {
      setClearing(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Render                                                            */
  /* ---------------------------------------------------------------- */
  return (
    <div className="flex flex-col h-[calc(100dvh-72px)] bg-deep-space">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,22,40,0.9)] backdrop-blur-[20px] shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="/chat-avatar-ai.jpg"
              alt="AI导师"
              className="w-9 h-9 rounded-full object-cover"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-deep-space" />
          </div>
          <div>
            <h2 className="text-white text-sm font-semibold leading-tight">AI求职导师</h2>
            <p className="text-[#64748B] text-xs">专业解答求职、面试、职业规划问题</p>
          </div>
        </div>
        <button
          onClick={clearChat}
          disabled={clearing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[rgba(255,255,255,0.05)] transition-all duration-200 text-sm disabled:opacity-40"
          title="清空对话"
        >
          {clearing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">清空对话</span>
        </button>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4 scroll-smooth"
      >
        {loadingHistory ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-[#00D4FF] animate-spin" />
            <span className="text-[#94A3B8] text-sm ml-3">加载聊天记录...</span>
          </div>
        ) : (
          <>
            <AnimatePresence initial={false}>
              {messages.map((msg) =>
                msg.role === 'ai' ? (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    className="flex items-start gap-3"
                  >
                    <img
                      src="/chat-avatar-ai.jpg"
                      alt="AI"
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-1"
                    />
                    <div className="flex flex-col gap-1 max-w-[85%] sm:max-w-[70%]">
                      <div className="glass-card rounded-2xl rounded-tl-[4px] px-4 sm:px-5 py-3 border-l-2 border-energy-cyan">
                        <div className="text-white text-sm sm:text-base leading-relaxed whitespace-pre-line">
                          {msg.content}
                        </div>
                      </div>
                      <span className="text-[#64748B] text-[11px] ml-1">{formatTime(msg.timestamp)}</span>

                      {/* Suggestion chips after AI response */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {msg.suggestions.map((s) => (
                            <button
                              key={s}
                              onClick={() => handleSend(s)}
                              className="px-3 py-1.5 rounded-full text-xs text-energy-cyan bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.15)] hover:bg-[rgba(0,212,255,0.15)] hover:border-energy-cyan/30 transition-all duration-200"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-start justify-end gap-3"
                  >
                    <div className="flex flex-col gap-1 items-end max-w-[85%] sm:max-w-[70%]">
                      <div className="energy-gradient rounded-2xl rounded-tr-[4px] px-4 sm:px-5 py-3">
                        <p className="text-white text-sm sm:text-base leading-relaxed">{msg.content}</p>
                      </div>
                      <span className="text-[#64748B] text-[11px] mr-1">{formatTime(msg.timestamp)}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[rgba(0,212,255,0.15)] flex items-center justify-center shrink-0 mt-1">
                      <User className="w-4 h-4 text-energy-cyan" />
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Typing Indicator */}
            <AnimatePresence>
              {isTyping && (
                <motion.div
                  key="typing"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-start gap-3"
                >
                  <img
                    src="/chat-avatar-ai.jpg"
                    alt="AI"
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="glass-card rounded-2xl rounded-tl-[4px] px-5 py-4 border-l-2 border-energy-cyan">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full bg-energy-cyan animate-bounce"
                        style={{ animationDelay: '0ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-energy-cyan animate-bounce"
                        style={{ animationDelay: '150ms' }}
                      />
                      <span
                        className="w-2 h-2 rounded-full bg-energy-cyan animate-bounce"
                        style={{ animationDelay: '300ms' }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick question chips at bottom of welcome (only show on initial load) */}
            {messages.length === 1 && messages[0].id.startsWith('welcome') && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="flex flex-wrap gap-2 pt-2 pl-11"
              >
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    className="px-4 py-2 rounded-xl text-sm text-[#94A3B8] bg-[rgba(30,58,95,0.4)] border border-[rgba(0,212,255,0.1)] hover:text-energy-cyan hover:border-[rgba(0,212,255,0.3)] hover:bg-[rgba(0,212,255,0.08)] transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </motion.div>
            )}
          </>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="shrink-0 bg-[rgba(10,22,40,0.9)] backdrop-blur-[20px] border-t border-[rgba(255,255,255,0.06)] px-4 sm:px-6 py-3">
        <form onSubmit={handleSubmit} className="flex items-end gap-3 max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="请输入你的问题..."
              rows={1}
              disabled={isTyping || loadingHistory}
              className="w-full bg-[rgba(30,58,95,0.4)] border border-[rgba(255,255,255,0.08)] rounded-2xl px-4 py-3 pr-4 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none transition-colors duration-200 max-h-[160px] disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!inputValue.trim() || isTyping || loadingHistory}
            className={
              'shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ' +
              (inputValue.trim() && !isTyping && !loadingHistory
                ? 'energy-gradient text-white hover:scale-110 hover:shadow-glow'
                : 'bg-[rgba(30,58,95,0.4)] text-[#64748B] cursor-not-allowed')
            }
          >
            {isTyping ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-center text-[#64748B] text-[11px] mt-2">
          AI生成的内容仅供参考，建议结合实际情况判断
        </p>
      </div>
    </div>
  );
}
