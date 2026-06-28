import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from 'react'

const USERS_STORAGE_KEY = 'techflow_users'

export interface ManagedUser {
  id: string
  name: string
  email: string
  avatar: string
  role: 'admin' | 'user'
  status: 'active' | 'disabled'
  joinDate: string
  lastLogin: string
  postsCount: number
}

interface UserContextType {
  users: ManagedUser[]
  addUser: (user: Omit<ManagedUser, 'joinDate' | 'lastLogin' | 'postsCount' | 'status'>) => void
  updateUser: (id: string, updates: Partial<ManagedUser>) => void
  deleteUser: (id: string) => void
  toggleUserStatus: (id: string) => void
  changeUserRole: (id: string, role: 'admin' | 'user') => void
  getUserById: (id: string) => ManagedUser | undefined
}

const UserContext = createContext<UserContextType | null>(null)

const initialUsers: ManagedUser[] = []

function loadUsers(): ManagedUser[] {
  try {
    const saved = localStorage.getItem(USERS_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
      }
    }
  } catch (e) {
    console.error('Failed to load users from localStorage:', e)
  }
  return [...initialUsers]
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<ManagedUser[]>(loadUsers)

  useEffect(() => {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users))
  }, [users])

  const addUser = useCallback((userData: Omit<ManagedUser, 'joinDate' | 'lastLogin' | 'postsCount' | 'status'>) => {
    const newUser: ManagedUser = {
      ...userData,
      status: 'active',
      joinDate: new Date().toISOString().split('T')[0],
      lastLogin: new Date().toISOString().split('T')[0],
      postsCount: 0,
    }
    setUsers(prev => [...prev, newUser])
  }, [])

  const updateUser = useCallback((id: string, updates: Partial<ManagedUser>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id))
  }, [])

  const toggleUserStatus = useCallback((id: string) => {
    setUsers(prev => prev.map(u => {
      if (u.id === id) {
        return { ...u, status: u.status === 'active' ? 'disabled' : 'active' }
      }
      return u
    }))
  }, [])

  const changeUserRole = useCallback((id: string, role: 'admin' | 'user') => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
  }, [])

  const getUserById = useCallback((id: string) => {
    return users.find(u => u.id === id)
  }, [users])

  const value = useMemo(() => ({
    users,
    addUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
    changeUserRole,
    getUserById,
  }), [users, addUser, updateUser, deleteUser, toggleUserStatus, changeUserRole, getUserById])

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  )
}

export function useUsers() {
  const context = useContext(UserContext)
  if (!context) throw new Error('useUsers must be used within UserProvider')
  return context
}
