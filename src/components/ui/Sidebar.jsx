import { useState, useEffect } from 'react'
import { useMemo, memo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Activity, ClipboardCheck, TrendingUp,
  Bell, Settings, LogOut, ChevronLeft, ChevronRight,
  GraduationCap
} from 'lucide-react'
import { useUser } from '../../context/UserContext'
import { useAlerts } from '../../context/AlertContext'
import { isMockMode } from '../../config/api'
import { apiGetUnreadCount } from '../../config/api'

const athleteLinks = [
  { path: '/athlete', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/athlete/checkin', icon: ClipboardCheck, label: 'Daily Check-in' },
  { path: '/athlete/trends', icon: TrendingUp, label: 'Trends' },
  { path: '/athlete/alerts', icon: Bell, label: 'Alerts' },
]

const coachLinks = [
  { path: '/coach', icon: LayoutDashboard, label: 'Team Overview', exact: true },
  { path: '/coach/alerts', icon: Bell, label: 'Alerts' },
  { path: '/coach/roster', icon: Activity, label: 'Roster' },
]

const Sidebar = memo(function Sidebar({ role }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useUser()
  const { totalAlerts, alertCount } = useAlerts()
  const [collapsed, setCollapsed] = useState(false)
  // Unread coach messages (athletes only)
  const [unreadMessages, setUnreadMessages] = useState(0)

  useEffect(() => {
    if (role !== 'athlete' || isMockMode()) return
    let cancelled = false
    const fetch = async () => {
      try {
        const data = await apiGetUnreadCount()
        if (!cancelled) setUnreadMessages(data.unreadCount || 0)
      } catch {
        // ignore
      }
    }
    fetch()
    const t = setInterval(fetch, 30000)
    return () => { cancelled = true; clearInterval(t) }
  }, [role])

  const links = useMemo(() => role === 'athlete' ? athleteLinks : coachLinks, [role])

  const isActive = (link) => {
    if (link.exact) return location.pathname === link.path
    return location.pathname.startsWith(link.path)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside
      className={`hidden md:flex flex-col h-full glass-card rounded-none border-r border-pivot-100/60 dark:border-slate-700/40 shrink-0 transition-[width] duration-300 ease-out ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
    >
      {/* Logo */}
      <div className={`flex items-center gap-2.5 p-5 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 rounded-md bg-[#0a1050]/90 flex items-center justify-center shrink-0 overflow-hidden">
          <img src="/pivot-logo.png" alt="Pivot Logo" className="w-5 h-5 object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <h1 className="font-bold text-pivot-900 dark:text-white text-lg tracking-tight">Pivot</h1>
            <p className="text-[11px] text-pivot-400 dark:text-slate-500 font-medium uppercase tracking-wider">
              {role === 'athlete' ? 'Athlete' : 'Coach'}
            </p>
          </div>
        )}
      </div>

      {/* User Profile Card (when not collapsed) */}
      {!collapsed && user && (
        <div className="mx-3 mb-3 p-3 rounded-2xl bg-pivot-50 dark:bg-slate-800/50 border border-pivot-100 dark:border-slate-700/30 space-y-1.5">
          <p className="text-xs font-semibold text-pivot-900 dark:text-white truncate">{user.name}</p>
          {user.school && (
            <p className="text-[11px] text-pivot-500 dark:text-slate-400 flex items-center gap-1 truncate">
              <GraduationCap size={11} className="shrink-0" />
              {user.school}
            </p>
          )}
          {user.teamName && (
            <p className="text-[11px] text-pivot-400 dark:text-slate-500 truncate">{user.teamName}</p>
          )}
          {role === 'athlete' && user.position && (
            <p className="text-[11px] text-accent-blue dark:text-blue-400 font-medium truncate">{user.position}</p>
          )}
          {role === 'coach' && user.coachRole && (
            <p className="text-[11px] text-accent-teal dark:text-teal-400 font-medium truncate">{user.coachRole}</p>
          )}
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map((link) => {
          const Icon = link.icon
          const active = isActive(link)
          const isAlertLink = link.label === 'Alerts'
          const alertBadge = isAlertLink ? totalAlerts : 0
          const msgBadge = isAlertLink && role === 'athlete' ? unreadMessages : 0

          return (
            <button
              key={link.path}
              onClick={() => navigate(link.path)}
              className={`sidebar-link w-full ${active ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${collapsed ? 'justify-center' : ''} relative`}
              title={collapsed ? link.label : undefined}
            >
              <div className="relative">
                <Icon size={20} />
                {alertBadge > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-[8px] font-bold min-w-[16px] h-4 px-1 ${
                    alertCount.black > 0 ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900' :
                    alertCount.red > 0 ? 'bg-red-500 text-white' :
                    'bg-amber-500 text-white'
                  }`}>
                    {alertBadge}
                  </span>
                )}
                {msgBadge > 0 && !alertBadge && (
                  <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center rounded-full text-[8px] font-bold min-w-[16px] h-4 px-1 bg-accent-blue text-white">
                    {msgBadge}
                  </span>
                )}
              </div>
              {!collapsed && (
                <>
                  <span className="truncate">{link.label}</span>
                  {alertBadge > 0 && (
                    <span className={`ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                      alertCount.black > 0 ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300' :
                      alertCount.red > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600' :
                      'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
                    }`}>
                      {alertBadge}
                    </span>
                  )}
                  {msgBadge > 0 && !alertBadge && (
                    <span className="ml-auto text-[11px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-accent-blue">
                      {msgBadge}
                    </span>
                  )}
                  {active && !alertBadge && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-blue" />
                  )}
                </>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom actions */}
      <div className="p-3 space-y-2 border-t border-pivot-100/60 dark:border-slate-700/40">
        <button
          onClick={() => navigate(`/${role}/settings`)}
          className={`sidebar-link sidebar-link-inactive w-full ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span>Settings</span>}
        </button>

        <button
          onClick={handleLogout}
          className={`sidebar-link sidebar-link-inactive w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-link sidebar-link-inactive w-full justify-center mt-2"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
})

export default Sidebar
