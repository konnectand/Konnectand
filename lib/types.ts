// ─── Auth / RBAC ─────────────────────────────────────────────────────────────

export type RoleName =
  | 'super_admin'
  | 'admin_konnectand'
  | 'admin_client'
  | 'operator_konnectand'
  | 'operator_client'
  | 'viewer_client'

export interface Role {
  id: string
  name: RoleName
  level: number
  permissions: Record<string, boolean>
}

export interface AuthUser {
  id: string
  email: string
  full_name: string
  role: RoleName
  role_level: number
  client_id: string | null
  permissions: Record<string, boolean>
}

// ─── Panel entities ──────────────────────────────────────────────────────────

export interface Client {
  id: string
  name: string
  contact_name: string
  contact_email: string
  country: string
  active: boolean
  created_at: string
}

export interface PortalStatus {
  id: string
  portal_id: string
  status: 'online' | 'offline' | 'alert'
  cpu_usage: number
  memory_usage: number
  network_ok: boolean
  app_running: boolean
  last_heartbeat: string
  updated_at: string
}

export interface Portal {
  id: string
  portal_id: string
  name: string
  client_id: string
  location: string
  country: string
  status: 'online' | 'offline' | 'alert'
  app_mode: string
  paired_with: string | null
  hardware_info: Record<string, unknown>
  last_seen: string
  created_at: string
  clients?: Client
  portal_status?: PortalStatus[]
}

export interface User {
  id: string
  email: string
  full_name: string
  role_id: string
  client_id: string | null
  active: boolean
  created_at: string
  roles?: Role
  clients?: Client
}

export interface Pairing {
  id: string
  portal_a: string
  portal_b: string
  app_mode: string
  schedule: Record<string, unknown>
  active: boolean
  created_at: string
  portal_a_info?: Portal
  portal_b_info?: Portal
}

export interface PortalLog {
  id: string
  portal_id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  message: string
  data: Record<string, unknown>
  created_at: string
}

export interface Analytics {
  id: string
  portal_id: string
  event_type: string
  duration_seconds: number
  data: Record<string, unknown>
  created_at: string
}

export interface DashboardStats {
  total: number
  online: number
  offline: number
  alert: number
}

// ─── Kiosk / Portal ──────────────────────────────────────────────────────────

export type KioskState = 'IDLE' | 'PRESENCE' | 'ACTIVE' | 'STANDBY'

export type PortalCommand =
  | { type: 'set_standby' }
  | { type: 'resume' }
  | { type: 'initiate_call'; peerId: string }
  | { type: 'end_call' }

export interface WebRTCSignal {
  type: 'offer' | 'answer' | 'candidate' | 'hangup'
  from: string
  to: string
  sdp?: string
  candidate?: RTCIceCandidateInit
}

export interface PortalStatusRow {
  portal_id: string
  status: 'online' | 'offline' | 'alert'
  last_seen: string
  cpu_usage: number
  memory_usage: number
}
