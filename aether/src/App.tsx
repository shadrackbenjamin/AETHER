import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom'

function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initialValue
    } catch {
      return initialValue
    }
  })
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
  }, [key, value])
  return [value, setValue] as const
}

// Data loader with graceful fallback
async function fetchJson<T>(path: string, fallback: T): Promise<T> {
  try {
    const res = await fetch(path)
    if (!res.ok) throw new Error('not ok')
    return (await res.json()) as T
  } catch {
    return fallback
  }
}

// Types
type FaqItem = { question: string; answer: string }

// Pages
function SignUpPage({ onComplete }: { onComplete: (name: string) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()
  const canSubmit = name.trim() && email.includes('@') && password.length >= 6
  return (
    <div className="app-card" aria-label="Sign up card">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <img src="/assets/aether-logo.png" alt="AETHER" width={48} height={48} style={{ borderRadius: 8 }} />
        <div>
          <div style={{ fontWeight: 800, fontSize: 20 }}>Join AETHER</div>
          <div style={{ opacity: 0.85 }}>Build, learn, and thrive with Achievers</div>
        </div>
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password (min 6)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button className="btn" disabled={!canSubmit} onClick={() => { onComplete(name.trim()); navigate('/chat') }}>Create account</button>
        <div style={{ fontSize: 12, opacity: 0.8 }}>By joining, you agree to our community guidelines.</div>
      </div>
    </div>
  )
}

function ChatPage({ profileName }: { profileName: string }) {
  type Message = { role: 'assistant' | 'user'; text: string }
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: `Hi ${profileName || 'Achiever'}! I am Achievers AI. I can help with events, mentorship, mental health, and training. What would you like to explore?` },
  ])
  const [input, setInput] = useState('')

  const quickChips = [
    'Upcoming events',
    'Show mentorship',
    'Mental health help',
    'Learn Python',
    'Cybersecurity',
    'Scholarships',
  ]

  function respondTo(text: string): string {
    const t = text.toLowerCase()
    if (t.includes('event')) return 'Check the Events page for upcoming workshops and mixers. I can RSVP you when you pick one.'
    if (t.includes('mentor')) return 'Mentorship is core here. I can connect you with a mentor or you can browse mentors on the Talent page.'
    if (t.includes('mental') || t.includes('stress') || t.includes('anxious')) return 'You are not alone. Try the Mental Health tab for supportive check-ins and to speak with a mentor.'
    if (t.includes('python')) return 'Great choice! There is an intro to Python program on the Talent page. Want me to bookmark it?'
    if (t.includes('cyber')) return 'Cybersecurity bootcamps are listed on the Talent page. Entry-level friendly options available.'
    if (t.includes('faq')) return 'Open the FAQs section to search common questions about membership, leadership, and support.'
    return 'Got it! You can also use the bottom tabs: Events, Talent, Mental Health, and FAQs.'
  }

  function send(text: string) {
    if (!text.trim()) return
    setMessages((m) => [...m, { role: 'user', text }, { role: 'assistant', text: respondTo(text) }])
    setInput('')
  }

  return (
    <div className="app-card" aria-label="Chat card">
      <div className="chat-wrapper">
        <div className="chat-stream">
          {messages.map((m, i) => (
            <div className="msg" key={i}>
              {m.role === 'assistant' ? (
                <div className="avatar"><img src="/assets/aether-logo.png" alt="Achievers AI" /></div>
              ) : (
                <div className="avatar" style={{ background: 'linear-gradient(135deg,#ff2ea1,#ff9800)' }}><span>😊</span></div>
              )}
              <div className={`bubble ${m.role === 'user' ? 'me' : ''}`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="quick-actions">
          {quickChips.map((c) => (
            <button key={c} className="chip" onClick={() => send(c)}>{c}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input className="input" placeholder="Ask Achievers AI..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send(input)} />
          <button className="btn" onClick={() => send(input)}>Send</button>
        </div>
      </div>
    </div>
  )
}

function EventsPage() {
  const [data, setData] = useState<{ events: { title: string; date: string; location: string; description: string }[] }>({ events: [] })
  useEffect(() => {
    fetchJson('/data/aether-data.json', { events: [] }).then((d: any) => setData({ events: d.events || [] }))
  }, [])
  return (
    <div className="app-card">
      <h3 style={{ marginTop: 0 }}>Upcoming Events</h3>
      <div className="grid">
        {(data.events.length ? data.events : [
          { title: 'Tech Career Mixer', date: 'Apr 30', location: 'Online', description: 'Network with mentors and peers.' },
          { title: 'Intro to Python', date: 'May 05', location: 'Hybrid', description: 'Hands-on coding for beginners.' },
        ]).map((e, idx) => (
          <div className="card" key={idx}>
            <h4>{e.title}</h4>
            <div className="badge">{e.date} • {e.location}</div>
            <p>{e.description}</p>
            <button className="btn">RSVP</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function TalentPage() {
  const [data, setData] = useState<{ courses: { title: string; area: string; level: string; description: string }[] }>({ courses: [] })
  useEffect(() => {
    fetchJson('/data/aether-data.json', { courses: [] }).then((d: any) => setData({ courses: d.courses || [] }))
  }, [])
  const list = data.courses.length ? data.courses : [
    { title: 'Python Foundations', area: 'Tech', level: 'Beginner', description: 'Start from zero to build basics.' },
    { title: 'Cloud Essentials', area: 'Tech', level: 'Beginner', description: 'Intro to AWS/Azure and DevOps mindset.' },
    { title: 'Cybersecurity 101', area: 'Tech', level: 'Beginner', description: 'Threats, tools, and safe practices.' },
    { title: 'Communication Mastery', area: 'Soft Skills', level: 'All', description: 'Public speaking and teamwork.' },
  ]
  return (
    <div className="app-card">
      <h3 style={{ marginTop: 0 }}>Talent Programs</h3>
      <div className="grid">
        {list.map((c, idx) => (
          <div className="card" key={idx}>
            <h4>{c.title}</h4>
            <div className="badge">{c.area} • {c.level}</div>
            <p>{c.description}</p>
            <button className="btn secondary">Details</button>
          </div>
        ))}
      </div>
    </div>
  )
}

function MentalHealthPage() {
  const [mood, setMood] = useState<string>('')
  const suggestions = useMemo(() => ({
    stressed: 'Take a deep breath. You matter. Consider talking to a mentor today—tap Speak to a Mentor.',
    anxious: 'You are stronger than you think. Try a short walk and a check-in with our mentors.',
    unmotivated: 'Small steps count. Choose one tiny task and celebrate it. I am cheering for you!',
    okay: 'Great! Keep going and share your energy with others in the community.',
  }), [])
  const response = mood ? (suggestions as any)[mood] : ''
  return (
    <div className="app-card">
      <h3 style={{ marginTop: 0 }}>Mental Health Check-in</h3>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        {['stressed','anxious','unmotivated','okay'].map((m) => (
          <button key={m} className="chip" onClick={() => setMood(m)}>{m}</button>
        ))}
      </div>
      {response && <div className="card"><p>{response}</p><Link className="btn" to="/chat">Speak to a Mentor</Link></div>}
      {!response && <p className="card">How are you feeling today? Your wellbeing comes first here.</p>}
    </div>
  )
}

function FaqsPage() {
  const [items, setItems] = useState<FaqItem[]>([])
  const [q, setQ] = useState('')
  useEffect(() => {
    fetchJson<{ faq: FaqItem[] }>(
      '/data/aether-data.json',
      { faq: [
        { question: 'How do I become a member?', answer: 'Sign up and you are in! Join events and programs to level up.' },
        { question: 'Do I need prior tech experience?', answer: 'No. We support total beginners through guided programs.' },
      ] }
    ).then((d) => setItems(d.faq))
  }, [])
  const filtered = items.filter((i) => i.question.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="app-card">
      <h3 style={{ marginTop: 0 }}>FAQs</h3>
      <input className="input" placeholder="Search FAQs" value={q} onChange={(e) => setQ(e.target.value)} />
      <div style={{ marginTop: 10 }}>
        {(filtered.length ? filtered : items).map((i, idx) => (
          <details className="faq-item" key={idx}>
            <summary>{i.question}</summary>
            <p>{i.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="header">
      <img src="/assets/aether-logo.png" alt="AETHER" className="logo" />
      <div className="title">
        <span className="name">AETHER</span>
        <span className="tag">Achievers • Community • Mentorship</span>
      </div>
    </div>
  )
}

function BottomNav({ show }: { show: boolean }) {
  const nav = [
    { to: '/signup', label: 'Sign Up', icon: '📝' },
    { to: '/chat', label: 'Chat', icon: '💬' },
    { to: '/events', label: 'Events', icon: '📅' },
    { to: '/talent', label: 'Talent', icon: '🎯' },
    { to: '/mental', label: 'Wellbeing', icon: '💚' },
    { to: '/faqs', label: 'FAQs', icon: '❓' },
  ]
  if (!show) return null
  return (
    <nav className="bottom-nav">
      <div className="rail">
        {nav.map((n) => (
          <NavLink key={n.to} to={n.to} className={({ isActive }) => isActive ? 'active' : ''}>
            <span aria-hidden>{n.icon}</span>
            <small>{n.label}</small>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

export default function App() {
  const location = useLocation()
  const [profile, setProfile] = useLocalStorage('aether_profile', { name: '' })
  const hasSignedUp = Boolean(profile.name)

  useEffect(() => {
    // Redirect new users to sign-up if they try to access other routes
    if (!hasSignedUp && !location.pathname.startsWith('/signup')) {
      // only redirect once app mounted
    }
  }, [hasSignedUp, location.pathname])

  return (
    <div className="app-container">
      <Header />
      <main className="app-content">
        <Routes>
          <Route path="/" element={hasSignedUp ? <ChatPage profileName={profile.name} /> : <SignUpPage onComplete={(n) => setProfile({ name: n })} />} />
          <Route path="/signup" element={<SignUpPage onComplete={(n) => setProfile({ name: n })} />} />
          <Route path="/chat" element={<ChatPage profileName={profile.name} />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/talent" element={<TalentPage />} />
          <Route path="/mental" element={<MentalHealthPage />} />
          <Route path="/faqs" element={<FaqsPage />} />
        </Routes>
      </main>
      <BottomNav show={hasSignedUp} />
    </div>
  )
}
