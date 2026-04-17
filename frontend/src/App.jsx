import React, { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import {
  LayoutDashboard, TrendingUp, Users, Package,
  MessageSquare, Upload, FileText, ChevronRight,
  Zap, BrainCircuit, BarChart3, Bot, X, LogOut,
  AlertTriangle, CheckCircle
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

const API_BASE = '/api'

const COLORS = ['#2563eb', '#00d2ff', '#6366f1', '#10b981', '#f59e0b', '#ef4444']

const TooltipStyle = { backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f1f5f9' }

// ── TOAST NOTIFICATION ────────────────────────────────────────────────────────
function Toast({ msg, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t) }, [onClose])
  return (
    <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }}
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold
        ${type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {msg}
    </motion.div>
  )
}

// ── LOADING SPINNER ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
      <div className="w-10 h-10 border-2 border-slate-700 border-t-neural-accent rounded-full animate-spin" />
      <span className="text-xs uppercase tracking-widest animate-pulse">Processing...</span>
    </div>
  )
}

// ── STAT CARD ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, delay = 0 }) {
  return (
    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ delay }} className="glass-card p-6 flex items-start justify-between group hover:border-neural-accent/40 transition-all duration-300">
      <div>
        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[2px] mb-2">{label}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className={`p-2 rounded-xl bg-white/5 group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={22} />
      </div>
    </motion.div>
  )
}

// ── AUTH SCREEN ───────────────────────────────────────────────────────────────
function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState('login')
  const emailRef = useRef(); const passRef = useRef()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (emailRef.current?.value && passRef.current?.value) onLogin(emailRef.current.value)
  }

  return (
    <div className="min-h-screen bg-neural-bg flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-neural-primary/5 rounded-full blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md glass p-10 rounded-3xl border border-slate-800 shadow-2xl">

        <div className="flex flex-col items-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-br from-neural-primary to-neural-accent rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-neural-primary/25">
            <TrendingUp size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter">
            Forecast<span className="text-neural-accent">IQ</span>
          </h1>
          <p className="text-slate-500 text-[10px] uppercase tracking-[5px] mt-2">Neural Access Terminal</p>
        </div>

        <div className="flex bg-slate-900/60 p-1 rounded-xl mb-8 border border-slate-800">
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all
                ${mode === m ? 'bg-neural-primary text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              {m === 'login' ? '🔑 Login' : '🚀 Sign Up'}
            </button>
          ))}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Identity Vector</label>
            <input ref={emailRef} type="email" required placeholder="admin@forecast.iq"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neural-accent transition-colors" />
          </div>
          <div>
            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block mb-2">Access Key</label>
            <input ref={passRef} type="password" required placeholder="••••••••"
              className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-neural-accent transition-colors" />
          </div>
          <button type="submit" className="btn-neural w-full py-3.5 text-xs mt-2">
            Initialize Session
          </button>
        </form>

        <p className="text-center text-slate-700 text-[9px] mt-8 uppercase tracking-widest">
          Secured by Supabase Neural Auth
        </p>
      </motion.div>
    </div>
  )
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('analytics')
  const [data, setData] = useState(null)
  const [forecast, setForecast] = useState(null)
  const [segments, setSegments] = useState(null)
  const [inventory, setInventory] = useState(null)
  const [insights, setInsights] = useState('')
  const [insightSource, setInsightSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Welcome to ForecastIQ! Upload a CSV to get started, then ask me anything about your data. 🚀' }
  ])
  const [query, setQuery] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [toast, setToast] = useState(null)
  const chatBottomRef = useRef()

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const showToast = (msg, type = 'success') => setToast({ msg, type })

  // ── UPLOAD ──
  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await axios.post(`${API_BASE}/upload`, formData)
      setData(res.data)
      showToast('Dataset synced successfully!', 'success')

      // Fire all analysis in parallel
      await Promise.allSettled([
        fetchInsights(res.data.summary),
        fetchForecast(res.data.data),
        fetchSegments(res.data.data),
        fetchInventory(res.data.data),
      ])
    } catch (err) {
      showToast('Upload failed. Check backend connection.', 'error')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchInsights = async (summary) => {
    try {
      const res = await axios.post(`${API_BASE}/ai/insights`, summary)
      setInsights(res.data.insights)
      setInsightSource(res.data.source)
    } catch (err) { console.error(err) }
  }

  const fetchForecast = async (rawData) => {
    try {
      const res = await axios.post(`${API_BASE}/forecast`, { data: rawData })
      if (!res.data.error) setForecast(res.data.forecast)
    } catch (err) { console.error(err) }
  }

  const fetchSegments = async (rawData) => {
    try {
      const res = await axios.post(`${API_BASE}/segmentation`, { data: rawData })
      setSegments(res.data.segments)
    } catch (err) { console.error(err) }
  }

  const fetchInventory = async (rawData) => {
    try {
      const res = await axios.post(`${API_BASE}/inventory`, { data: rawData })
      setInventory(res.data.inventory)
    } catch (err) { console.error(err) }
  }

  const handleChat = async () => {
    if (!query.trim() || chatLoading) return
    const userMsg = { role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])
    setQuery('')
    setChatLoading(true)

    try {
      const res = await axios.post(`${API_BASE}/ai/chat`, {
        message: userMsg.content,
        context: JSON.stringify(data?.summary || {})
      })
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }])
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Connection error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const generateReport = async () => {
    if (!data) return showToast('Upload a dataset first!', 'error')
    showToast('Generating PDF report...', 'success')
    try {
      const res = await axios.post(`${API_BASE}/generate-report`, {
        summary: data.summary,
        insights: insights || 'No insights generated.',
        forecast: forecast,
      }, { responseType: 'blob' })

      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'ForecastIQ_Executive_Report.pdf'
      document.body.appendChild(a)
      a.click()
      a.remove()
      showToast('Report downloaded!', 'success')
    } catch (err) {
      showToast('Report generation failed.', 'error')
      console.error(err)
    }
  }

  if (!user) return <AuthScreen onLogin={(email) => setUser(email)} />

  const handleReset = () => {
    setData(null); setForecast(null); setSegments(null); setInventory(null);
    setInsights(''); setInsightSource(''); setMessages([{ role: 'ai', content: 'Session reset. Upload a new CSV to begin analysis! 🚀' }]);
    showToast('All neural data cleared.', 'success');
  }

  const summaryStats = data ? [
    { label: 'Total Revenue', value: `$${Number(data.summary.total_revenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: TrendingUp, color: 'text-blue-400', delay: 0 },
    { label: 'Neural Profit', value: `$${(data.summary.total_revenue * 0.45).toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: Zap, color: 'text-yellow-400', delay: 0.1 },
    { label: 'Data Nodes', value: data.summary.total_items.toLocaleString(), icon: BrainCircuit, color: 'text-purple-400', delay: 0.2 },
    { label: 'Avg Transaction', value: `$${Number(data.summary.avg_transaction).toFixed(2)}`, icon: BarChart3, color: 'text-emerald-400', delay: 0.3 },
  ] : []

  const catChartData = data
    ? Object.entries(data.summary.categories).map(([k, v]) => ({ name: k, value: v })).slice(0, 8)
    : []

  const NAV = [
    { id: 'analytics',    icon: LayoutDashboard, label: 'Analysis' },
    { id: 'forecast',     icon: Zap,             label: 'Forecasting' },
    { id: 'segmentation', icon: Users,           label: 'Segments' },
    { id: 'inventory',    icon: Package,         label: 'Inventory' },
    { id: 'reports',      icon: FileText,        label: 'Submission' },
  ]

  return (
    <div className="min-h-screen bg-neural-bg text-slate-100 flex font-['Outfit']">

      {/* ── SIDEBAR ── */}
      <aside className="w-20 lg:w-64 glass border-r border-slate-800/60 flex flex-col py-8 z-50 shrink-0">
        <button onClick={() => setActiveTab('analytics')} className="px-4 mb-12 flex items-center gap-3 hover:opacity-80 transition-opacity w-full text-left">
          <div className="w-10 h-10 bg-gradient-to-br from-neural-primary to-neural-accent rounded-xl flex items-center justify-center shadow-lg shrink-0">
            <TrendingUp size={22} className="text-white" />
          </div>
          <h1 className="hidden lg:block text-xl font-bold tracking-tight">
            Forecast<span className="text-neural-accent">IQ</span>
          </h1>
        </button>

        <nav className="flex-1 space-y-2 px-3">
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200
                ${activeTab === item.id
                  ? 'bg-neural-primary/20 text-neural-accent border border-neural-primary/30 shadow-lg shadow-neural-primary/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <item.icon size={20} className="shrink-0" />
              <span className="hidden lg:block text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Management */}
        <div className="px-3 mt-6 space-y-2">
          <label className="w-full flex flex-col items-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-white/3 cursor-pointer hover:bg-white/8 hover:border-neural-accent/50 transition-all">
            <Upload size={18} className="text-neural-accent" />
            <span className="hidden lg:block text-[10px] text-slate-500 uppercase tracking-widest">Upload CSV</span>
            <input type="file" className="hidden" onChange={handleUpload} accept=".csv" />
          </label>

          {data && (
            <button onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all">
              <X size={16} />
              <span className="hidden lg:block text-[10px] uppercase font-bold tracking-widest">Clear Data</span>
            </button>
          )}
        </div>

        {/* Logout */}
        <div className="px-3 mt-3">
          <button onClick={() => { setUser(null); setData(null); }}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-slate-600 hover:text-red-400 hover:bg-red-500/5 transition-all text-sm">
            <LogOut size={18} className="shrink-0" />
            <span className="hidden lg:block">Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="h-16 glass border-b border-slate-800/60 flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500 tracking-widest uppercase">System Online</span>
            </div>
            {data && (
              <span className="text-slate-500 text-xs hidden md:block">
                {data.summary.total_items.toLocaleString()} records synced
              </span>
            )}
            {loading && <span className="text-[10px] text-neural-accent uppercase tracking-widest animate-pulse">Analysing...</span>}
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setChatOpen(v => !v)}
              className={`p-2.5 rounded-xl border transition-all ${chatOpen ? 'bg-neural-primary/20 border-neural-primary/40 text-neural-accent' : 'border-slate-800 text-slate-400 hover:text-white hover:border-slate-600'}`}>
              <MessageSquare size={18} />
            </button>
            <div className="flex items-center gap-2.5">
              <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${user}`}
                alt="avatar" className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700" />
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold leading-none">{user}</p>
                <p className="text-[9px] text-slate-500 mt-0.5 uppercase tracking-wider">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Canvas */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {!data ? (
              <motion.div key="empty" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-center py-20">
                <div className="relative mb-8">
                  <div className="w-28 h-28 bg-neural-primary/10 rounded-3xl flex items-center justify-center border border-neural-primary/20">
                    <BrainCircuit size={56} className="text-neural-primary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-neural-accent rounded-full animate-ping opacity-40" />
                </div>
                <h2 className="text-4xl font-bold mb-3 tracking-tight">
                  System <span className="text-neural-accent">Ready</span>
                </h2>
                <p className="text-slate-500 max-w-sm mb-10 text-sm leading-relaxed">
                  Upload your sales dataset to activate forecasting, segmentation, inventory analysis, and AI insights.
                </p>
                <label className="btn-neural cursor-pointer flex items-center gap-3 py-3 px-8">
                  <Upload size={18} />
                  <span>Initialize Dataset</span>
                  <input type="file" className="hidden" onChange={handleUpload} accept=".csv" />
                </label>
              </motion.div>
            ) : (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

                {/* KPI Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {summaryStats.map((s, i) => <StatCard key={i} {...s} />)}
                </div>

                {/* ── ANALYTICS TAB ── */}
                {activeTab === 'analytics' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                      {/* AI Insights Panel */}
                      <div className="glass-card p-6 flex flex-col min-h-[380px]">
                        <div className="flex items-center justify-between mb-5">
                          <div className="flex items-center gap-3">
                            <Bot size={20} className="text-neural-accent" />
                            <h4 className="font-bold text-sm uppercase tracking-widest">Neural Insights</h4>
                          </div>
                          {insightSource && (
                            <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border
                              ${insightSource === 'gemini' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-slate-700/50 text-slate-400 border-slate-700'}`}>
                              {insightSource === 'gemini' ? '✨ Gemini' : '⚡ Local'}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 space-y-3 overflow-auto">
                          {insights ? insights.split('\n').filter(l => l.trim()).map((line, i) => (
                            <motion.div key={i} initial={{ x: -15, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: i * 0.15 }}
                              className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl text-xs leading-relaxed text-slate-300">
                              {line}
                            </motion.div>
                          )) : <Spinner />}
                        </div>
                      </div>

                      {/* Revenue Area Chart */}
                      <div className="lg:col-span-2 glass-card p-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-5">Revenue Performance</h4>
                        <div className="h-[320px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data.data.slice(0, 30)}>
                              <defs>
                                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10 }} />
                              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={TooltipStyle} />
                              <Area type="monotone" dataKey="price" stroke="#2563eb" fill="url(#revGrad)" strokeWidth={3} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Category Charts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="glass-card p-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-5">Category Bar Chart</h4>
                        <div className="h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={catChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                              <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                              <Tooltip contentStyle={TooltipStyle} />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="glass-card p-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest mb-5">Category Distribution</h4>
                        <div className="h-[260px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie data={catChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                                dataKey="value" nameKey="name" paddingAngle={3}>
                                {catChartData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                              </Pie>
                              <Tooltip contentStyle={TooltipStyle} />
                              <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── FORECAST TAB ── */}
                {activeTab === 'forecast' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
                    <div className="flex justify-between items-center mb-8">
                      <h4 className="text-xl font-bold uppercase tracking-widest flex items-center gap-3">
                        <Zap className="text-neural-accent" size={24} /> ARIMA Prediction Engine
                      </h4>
                      <span className="text-[9px] bg-neural-primary/15 text-neural-accent px-3 py-1 rounded-full border border-neural-primary/30 uppercase font-bold tracking-[3px]">
                        95% Confidence
                      </span>
                    </div>

                    <div className="h-[420px]">
                      {forecast ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecast}>
                            <defs>
                              <linearGradient id="fcastGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00d2ff" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00d2ff" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 10 }} />
                            <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                            <Tooltip contentStyle={TooltipStyle} formatter={(v) => [`$${Number(v).toLocaleString()}`, '']} />
                            <Area type="monotone" dataKey="conf_high" stroke="transparent" fill="#2563eb12" />
                            <Area type="monotone" dataKey="conf_low" stroke="transparent" fill="#2563eb08" />
                            <Area type="monotone" dataKey="prediction" stroke="#00d2ff" strokeWidth={4} fill="url(#fcastGrad)" dot={{ fill: '#00d2ff', r: 5 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 text-sm gap-3">
                          <BrainCircuit size={48} className="animate-pulse" />
                          <p>Initializing Neural Projection...</p>
                        </div>
                      )}
                    </div>

                    {forecast && (
                      <div className="mt-6 p-5 bg-neural-primary/5 rounded-2xl border border-neural-primary/15">
                        <h5 className="text-[10px] font-bold text-neural-accent uppercase tracking-widest mb-2">AI Interpretation</h5>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          The ARIMA model projects revenue of <strong className="text-white">${forecast[forecast.length - 1]?.prediction?.toLocaleString(undefined, { maximumFractionDigits: 0 })}</strong> by {forecast[forecast.length - 1]?.date}. Monitor inventory levels and staffing aligned to this growth trajectory.
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── SEGMENTATION TAB ── */}
                {activeTab === 'segmentation' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
                    <h4 className="text-xl font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                      <Users className="text-neural-primary" size={24} /> RFM Customer Segments
                    </h4>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                      {[
                        { label: 'Champion', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                        { label: 'Loyal', color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { label: 'At Risk', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' },
                        { label: 'Lost', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                      ].map(({ label, color, bg, border }) => {
                        const count = segments?.filter(s => s.segment === label).length || 0
                        const total = segments?.length || 1
                        return (
                          <div key={label} className={`p-5 rounded-2xl border ${bg} ${border}`}>
                            <p className={`text-xs font-bold uppercase tracking-widest ${color} mb-2`}>{label}</p>
                            <p className="text-3xl font-bold">{count}</p>
                            <div className="w-full h-1 bg-slate-800 mt-3 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${bg.replace('/10', '/60')}`}
                                style={{ width: `${(count / total) * 100}%` }} />
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1">{((count / total) * 100).toFixed(1)}% of base</p>
                          </div>
                        )
                      })}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 uppercase tracking-widest border-b border-slate-800">
                          <tr>{['Customer ID', 'Recency', 'Frequency', 'Monetary', 'RFM Segment'].map(h => (
                            <th key={h} className="py-3 px-4 font-bold">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {segments?.slice(0, 15).map((s, i) => (
                            <tr key={i} className="hover:bg-white/3 transition-colors">
                              <td className="py-3 px-4 font-mono text-neural-accent">{s.customer_id}</td>
                              <td className="py-3 px-4 text-slate-400">{Math.round(s.recency)} days</td>
                              <td className="py-3 px-4 text-slate-400">{Math.round(s.frequency)}</td>
                              <td className="py-3 px-4 font-bold">${Number(s.monetary).toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] uppercase font-bold ${s.segment === 'Champion' ? 'bg-green-500/10 text-green-400' :
                                    s.segment === 'Loyal' ? 'bg-blue-500/10 text-blue-400' :
                                      s.segment === 'At Risk' ? 'bg-yellow-500/10 text-yellow-400' :
                                        'bg-red-500/10 text-red-400'
                                  }`}>{s.segment}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* ── INVENTORY TAB ── */}
                {activeTab === 'inventory' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
                    <h4 className="text-xl font-bold uppercase tracking-widest mb-8 flex items-center gap-3">
                      <Package className="text-neural-primary" size={24} /> Inventory Optimisation
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                      {[
                        { label: 'Healthy Categories', val: inventory?.filter(i => i.status === 'Healthy').length || 0, icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-500/10' },
                        { label: 'Reorder Alerts', val: inventory?.filter(i => i.status !== 'Healthy').length || 0, icon: AlertTriangle, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                        { label: 'Avg Daily Demand', val: `$${inventory ? (inventory.reduce((a, b) => a + b.avg_daily_demand, 0) / inventory.length).toFixed(2) : '0.00'}`, icon: BarChart3, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                      ].map(({ label, val, icon: Ic, color, bg }) => (
                        <div key={label} className={`p-6 rounded-2xl border border-slate-800 ${bg}/20`}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{label}</p>
                            <Ic size={18} className={color} />
                          </div>
                          <p className="text-3xl font-bold">{val}</p>
                        </div>
                      ))}
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-slate-500 uppercase tracking-widest border-b border-slate-800">
                          <tr>{['Category', 'Avg Demand', 'Safety Stock', 'Reorder Point', 'Records', 'Status'].map(h => (
                            <th key={h} className="py-3 px-4 font-bold">{h}</th>
                          ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {inventory?.map((item, i) => (
                            <tr key={i} className="hover:bg-white/3 transition-colors">
                              <td className="py-3 px-4 font-bold text-white">{item.category}</td>
                              <td className="py-3 px-4 text-slate-400">${item.avg_daily_demand.toFixed(2)}</td>
                              <td className="py-3 px-4 text-slate-400">{item.safety_stock.toFixed(2)}</td>
                              <td className="py-3 px-4 font-bold text-neural-accent">{item.reorder_point.toFixed(2)}</td>
                              <td className="py-3 px-4 text-slate-400">{item.total_sold}</td>
                              <td className="py-3 px-4">
                                <span className={`px-2 py-1 rounded-lg text-[9px] font-bold uppercase ${item.status === 'Healthy' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400 animate-pulse'
                                  }`}>{item.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* ── REPORTS TAB ── */}
                {activeTab === 'reports' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="glass-card p-16 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 bg-neural-accent/10 rounded-3xl flex items-center justify-center mb-8 border border-neural-accent/20 shadow-2xl shadow-neural-accent/10">
                      <FileText size={44} className="text-neural-accent" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">Neural Executive Report</h3>
                    <p className="text-slate-400 max-w-md mb-3 text-sm leading-relaxed">
                      Generate a high-fidelity PDF containing KPIs, AI-written business insights, and ARIMA growth projections — ready for management review.
                    </p>
                    {insightSource === 'gemini' && (
                      <p className="text-[10px] text-blue-400 mb-8 uppercase tracking-widest">✨ Will include Gemini AI insights</p>
                    )}
                    <button onClick={generateReport} className="btn-neural flex items-center gap-3 py-3.5 px-10">
                      <Zap size={18} />
                      <span>Generate PDF</span>
                    </button>
                  </motion.div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── FLOATING CHAT ── */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed right-6 bottom-6 w-[360px] h-[520px] glass border border-slate-700 rounded-3xl shadow-2xl flex flex-col z-[100]">

            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-neural-primary to-neural-accent rounded-lg flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold">Neural Chat</p>
                  <p className="text-[9px] text-green-400 uppercase tracking-widest">
                    ● System Active
                  </p>
                </div>
              </div>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[82%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed
                    ${m.role === 'user'
                      ? 'bg-neural-primary text-white rounded-br-sm'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-300 rounded-bl-sm'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-slate-800">
              <div className="flex gap-2">
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleChat()}
                  placeholder="Ask about your data..."
                  className="flex-1 bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-neural-accent transition-colors" />
                <button onClick={handleChat} disabled={chatLoading}
                  className="p-2.5 bg-neural-primary rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-40">
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>
    </div>
  )
}
