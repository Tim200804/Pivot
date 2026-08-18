import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Settings, Sun, Moon, Clock, User, Bell, Shield, LogOut, Edit3, Save, X, CheckCircle2 } from 'lucide-react'
import Sidebar from '../ui/Sidebar'
import { useTheme } from '../../context/ThemeContext'
import { useUser } from '../../context/UserContext'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { isMockMode } from '../../config/api.js'
import { apiUpdatePreferences, apiUpdateProfile } from '../../config/api.js'

function Toast({ message, visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 text-white shadow-xl text-sm font-medium"
        >
          <CheckCircle2 size={18} />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function SettingsPage({ role }) {
  const { theme, setTheme } = useTheme()
  const { user, login, logout, setUser } = useUser()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [toast, setToast] = useState({ visible: false, message: '' })
  // Notification preferences — sourced from server (real mode) or local state (mock mode)
  const [notifications, setNotifications] = useState(() => user?.preferences?.alertNotifications ?? true)
  const [weeklyReport, setWeeklyReport] = useState(() => user?.preferences?.weeklyReport ?? true)
  const [prefSaving, setPrefSaving] = useState(false)

  // Editable profile state
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    school: user?.school || '',
    teamName: user?.teamName || '',
    position: user?.position || '',
    coachRole: user?.coachRole || '',
    height: user?.height || '',
    weight: user?.weight || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)

  const showToast = (msg) => {
    setToast({ visible: true, message: msg })
    setTimeout(() => setToast({ visible: false, message: '' }), 2500)
  }

  const handleSaveProfile = async () => {
    if (isMockMode()) {
      login({ ...user, ...editForm }, true)
      setEditing(false)
      showToast('Profile updated and saved!')
      return
    }

    setProfileSaving(true)
    try {
      const data = await apiUpdateProfile(editForm)
      if (data?.user) {
        setUser({ ...user, ...data.user })
      }
      setEditing(false)
      showToast('Profile updated and saved!')
    } catch {
      showToast('Failed to update profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditForm({
      name: user?.name || '',
      school: user?.school || '',
      teamName: user?.teamName || '',
      position: user?.position || '',
      coachRole: user?.coachRole || '',
      height: user?.height || '',
      weight: user?.weight || '',
    })
    setEditing(false)
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Persist preference toggle. In real mode, PATCH the server; the response
  // gives us the canonical user record which we write back to the local
  // context so a refresh shows the same state.
  const persistPreference = async (patch) => {
    if (isMockMode()) return
    setPrefSaving(true)
    try {
      const data = await apiUpdatePreferences(patch)
      if (data?.user) {
        setUser({ ...user, ...data.user, preferences: data.user.preferences })
      }
    } catch (err) {
      showToast('Failed to save preference')
    } finally {
      setPrefSaving(false)
    }
  }

  const handleToggleNotifications = (next) => {
    setNotifications(next)
    persistPreference({ alertNotifications: next })
  }

  const handleToggleWeekly = (next) => {
    setWeeklyReport(next)
    persistPreference({ weeklyReport: next })
  }

  const themeLabel = theme === 'dark' ? 'Dark Mode' : theme === 'light' ? 'Light Mode' : 'Auto (Time-based)'

  return (
    <div className="min-h-[100dvh] flex bg-surface-light dark:bg-surface-dark transition-colors duration-300">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col min-h-[100dvh] overflow-auto">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-[800px] mx-auto w-full space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-pivot-900 dark:text-white tracking-tight">Settings</h2>
              <p className="text-sm text-pivot-500 dark:text-slate-400 mt-1">Customize your Pivot experience</p>
            </div>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 text-sm font-medium text-pivot-600 dark:text-slate-300 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
              >
                <Edit3 size={14} /> Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-pivot-200 dark:border-slate-600 text-sm text-pivot-400 hover:bg-pivot-50 dark:hover:bg-slate-700/50 transition-colors active:scale-95"
                >
                  <X size={14} /> Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent-teal text-white text-sm font-medium hover:bg-teal-600 transition-colors active:scale-95"
                >
                  <Save size={14} /> Save
                </button>
              </div>
            )}
          </motion.div>

          {/* Profile Info — editable */}
          {user && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <User size={14} className="text-pivot-400" />
                <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Profile</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <EditableField label="Name" value={editing ? undefined : user.name}>
                  {editing && (
                    <input
                      value={editForm.name}
                      onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                      placeholder="Your name"
                    />
                  )}
                </EditableField>
                <EditableField label="Role" value={editing ? undefined : user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}>
                  {editing && (
                    <input
                      value={user.role?.charAt(0)?.toUpperCase() + user.role?.slice(1)}
                      className="w-full bg-pivot-50 dark:bg-slate-800/50 border border-pivot-100 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm text-pivot-400 cursor-not-allowed"
                      disabled
                      placeholder="Cannot change role"
                    />
                  )}
                </EditableField>
                <EditableField label="School" value={editing ? undefined : (user.school || '—')}>
                  {editing && (
                    <input
                      value={editForm.school}
                      onChange={e => setEditForm(prev => ({ ...prev, school: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                      placeholder="School name"
                    />
                  )}
                </EditableField>
                <EditableField label="Team" value={editing ? undefined : (user.teamName || '—')}>
                  {editing && (
                    <input
                      value={editForm.teamName}
                      onChange={e => setEditForm(prev => ({ ...prev, teamName: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                      placeholder="Team name"
                    />
                  )}
                </EditableField>
                {user.role === 'athlete' && (
                  <EditableField label="Position" value={editing ? undefined : (user.position || '—')}>
                    {editing && (
                      <input
                        value={editForm.position}
                        onChange={e => setEditForm(prev => ({ ...prev, position: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                        placeholder="Position"
                      />
                    )}
                  </EditableField>
                )}
                {user.role === 'coach' && (
                  <EditableField label="Coach Role" value={editing ? undefined : (user.coachRole || '—')}>
                    {editing && (
                      <input
                        value={editForm.coachRole}
                        onChange={e => setEditForm(prev => ({ ...prev, coachRole: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                        placeholder="Coach role"
                      />
                    )}
                  </EditableField>
                )}
                {user.role === 'athlete' && (
                  <>
                    <EditableField label="Height" value={editing ? undefined : `${user.height || '—'} cm`}>
                      {editing && (
                        <input
                          value={editForm.height}
                          onChange={e => setEditForm(prev => ({ ...prev, height: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                          placeholder="cm"
                        />
                      )}
                    </EditableField>
                    <EditableField label="Weight" value={editing ? undefined : `${user.weight || '—'} kg`}>
                      {editing && (
                        <input
                          value={editForm.weight}
                          onChange={e => setEditForm(prev => ({ ...prev, weight: e.target.value }))}
                          className="w-full bg-white dark:bg-slate-800 border border-pivot-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm text-pivot-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-teal/40"
                          placeholder="kg"
                        />
                      )}
                    </EditableField>
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Appearance */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              {theme === 'dark' ? <Moon size={14} className="text-pivot-400" /> : <Sun size={14} className="text-pivot-400" />}
              <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Appearance</h3>
            </div>
            <div className="flex gap-2">
              {[
                { value: 'light', icon: Sun, label: 'Light' },
                { value: 'dark', icon: Moon, label: 'Dark' },
                { value: 'auto', icon: Clock, label: 'Auto' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 p-3 rounded-2xl border transition-all text-center active:scale-95 ${
                    theme === value
                      ? 'border-accent-teal bg-accent-teal/5 text-accent-teal shadow-lg shadow-teal-500/10'
                      : 'border-pivot-200 dark:border-slate-600 text-pivot-400 hover:border-accent-teal/40 hover:text-pivot-600 dark:hover:text-slate-300'
                  }`}
                >
                  <Icon size={18} className="mx-auto mb-1" />
                  <p className="text-xs font-medium">{label}</p>
                  {value === 'auto' && <p className="text-[10px] opacity-60 mt-0.5">6AM-6PM light</p>}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Notifications */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={14} className="text-pivot-400" />
              <h3 className="text-sm font-semibold text-pivot-700 dark:text-slate-300">Notifications</h3>
            </div>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 cursor-pointer hover:bg-pivot-100 dark:hover:bg-slate-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-pivot-900 dark:text-white">Alert Notifications</p>
                  <p className="text-xs text-pivot-400">Get notified when your metrics trigger an alert</p>
                </div>
                <button
                  onClick={() => handleToggleNotifications(!notifications)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${notifications ? 'bg-accent-teal' : 'bg-pivot-200 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${notifications ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50 cursor-pointer hover:bg-pivot-100 dark:hover:bg-slate-700/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-pivot-900 dark:text-white">Weekly Reports</p>
                  <p className="text-xs text-pivot-400">Receive a weekly summary of your wellness data</p>
                </div>
                <button
                  onClick={() => handleToggleWeekly(!weeklyReport)}
                  className={`w-10 h-6 rounded-full relative transition-colors ${weeklyReport ? 'bg-accent-teal' : 'bg-pivot-200 dark:bg-slate-600'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${weeklyReport ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </button>
              </label>
            </div>
          </motion.div>

          {/* Account */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-5 border border-rose-200 dark:border-rose-800/30">
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-rose-400" />
              <h3 className="text-sm font-semibold text-rose-500">Account</h3>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-900/10 text-rose-600 dark:text-rose-400 text-sm font-medium hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-colors active:scale-[0.98]"
            >
              <LogOut size={16} />
              Sign Out & Return to Login
            </button>
          </motion.div>

          <div className="h-20 md:h-4" />
        </main>
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </div>
  )
}

function EditableField({ label, value, children }) {
  return (
    <div className="p-3 rounded-xl bg-pivot-50 dark:bg-slate-800/50">
      <p className="text-[11px] text-pivot-400 uppercase mb-0.5">{label}</p>
      {children || <p className="text-sm font-medium text-pivot-900 dark:text-white">{value}</p>}
    </div>
  )
}
