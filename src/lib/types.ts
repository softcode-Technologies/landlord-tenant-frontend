// ============================================================
// Core Types for NaijaRental API
// ============================================================

export interface User {
  id: string
  phone: string
  email?: string
  firstName?: string
  lastName?: string
  avatarUrl?: string
  isAdmin: boolean
  isVerified: boolean
  isBanned: boolean
  createdAt: string
  landlordProfile?: LandlordProfile
  tenantProfile?: TenantProfile
  agentProfile?: AgentProfile
  // KYC fields
  kycStatus?: "none" | "pending" | "approved" | "rejected"
  kycMethod?: "nin" | "bvn" | "document" | null
  kycRejectReason?: string | null
  whatsappOptIn?: boolean
  referralCode?: string | null
  // Backend alternate field names (tolerated after normalizeUser)
  roles?: string[]
  isPhoneVerified?: boolean
  isEmailVerified?: boolean
}

export interface LandlordProfile {
  id: string
  userId: string
  companyName?: string | null
  bio?: string | null
  bankName?: string | null
  bankCode?: string | null
  bankAccountNumber?: string | null
  isVerified?: boolean
}

export interface TenantProfile {
  id: string
  userId: string
  occupation?: string
  bio?: string
  kycStatus: "pending" | "approved" | "rejected"
  creditScore?: number
}

export interface AgentProfile {
  id: string
  userId: string
  licenseNumber?: string
  bio?: string
  rating?: number
  totalProperties?: number
  isVerified: boolean
}

export type UserRole = "tenant" | "landlord" | "agent" | "admin"

// Auth
export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

export interface AuthResponse extends AuthTokens {
  user?: User
  isNew?: boolean
}

// Listings
export interface Listing {
  id: string
  title: string
  description: string
  rentPerAnnum: number
  city: string
  state: string
  lga?: string
  area?: string
  address: string
  bedrooms: number
  bathrooms: number
  toilets?: number
  isFurnished: boolean
  isServiced: boolean
  propertyType: string
  images: string[]
  status?: "draft" | "active" | "paused" | "closed"
  isFeatured: boolean
  isActive: boolean
  viewCount?: number
  createdAt: string
  updatedAt: string
  unitId?: string
  propertyId?: string
  landlordUserId?: string
  lister?: {
    id: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    phone?: string
  }
  reviews?: Review[]
  averageRating?: number
  reviewCount?: number
  isSaved?: boolean
  property?: Pick<Property, "city" | "state" | "lga" | "area" | "address" | "name">
}

export interface ListingFilters {
  page?: number
  limit?: number
  city?: string
  state?: string
  lga?: string
  area?: string
  minRent?: number
  maxRent?: number
  featured?: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

// Properties
export interface Property {
  id: string
  name: string
  address: string
  city: string
  state: string
  lga?: string
  area?: string
  description?: string
  landlordUserId: string
  units: Unit[]
  images?: string[]
  assignedAgent?: {
    firstName?: string
    lastName?: string
  }
  createdAt: string
  updatedAt: string
}

export interface Unit {
  id: string
  propertyId: string
  unitNumber: string
  bedrooms: number
  bathrooms: number
  toilets?: number
  rentPerAnnum: number
  isActive: boolean
  listing?: Listing
  tenancy?: Tenancy
  property?: Property
  createdAt: string
}

// Tenancies
export interface Tenancy {
  id: string
  unitId: string
  landlordUserId: string
  tenantUserId: string
  startDate: string
  endDate: string
  rentAmount: number
  status: "active" | "terminated" | "expired"
  depositAmount?: number
  depositPaidAt?: string
  depositReturnedAt?: string
  depositNote?: string
  unit?: Unit
  tenant?: User
  landlord?: User
  property?: Property
  createdAt: string
  updatedAt: string
}

export interface CreditScore {
  score: number
  label: string
  breakdown: {
    paymentHistory: number
    tenancyLength: number
    maintenanceBehavior: number
  }
}

// Invites
export interface Invite {
  id: string
  inviteCode: string
  unitId: string
  landlordUserId: string
  invitedPhone: string
  firstName: string
  rentAmount: number
  startDate: string
  endDate: string
  status: "pending" | "accepted" | "cancelled"
  unit?: Unit
  createdAt: string
  expiresAt?: string
}

// Maintenance
export interface MaintenanceRequest {
  id: string
  tenancyId: string
  tenantUserId: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  landlordNote?: string
  costKobo?: number
  contractorName?: string
  contractorPhone?: string
  rating?: number
  ratingNote?: string
  tenancy?: Tenancy
  tenant?: User
  createdAt: string
  updatedAt: string
}

// Inspections
export interface InspectionSchedule {
  id: string
  listingId: string
  tenantUserId: string
  scheduledAt: string
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show"
  note?: string
  listerNote?: string
  listing?: Listing
  tenant?: User
  createdAt: string
}

// Conversations & Messages
export interface Conversation {
  id: string
  participantIds: string[]
  propertyId?: string
  lastMessage?: Message
  participants?: User[]
  property?: Property
  unreadCount?: number
  updatedAt: string
}

export interface Message {
  id: string
  conversationId: string
  senderUserId: string
  body: string
  sender?: User
  createdAt: string
}

// Notifications
export type NotificationType =
  | "rent_reminder"
  | "payment_confirmed"
  | "tenancy_expiring"
  | "invite_received"
  | "inspection_unlocked"
  | "inspection_scheduled"
  | "inspection_confirmed"
  | "inspection_cancelled"
  | "inspection_completed"
  | "maintenance_update"
  | "broadcast"

export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  type: NotificationType
  isRead: boolean
  metadata?: Record<string, unknown>
  data?: Record<string, unknown>
  createdAt: string
}

// Wallet & Payments
export interface Wallet {
  balance: number
}

export interface Payment {
  id: string
  userId: string
  reference: string
  tenancyId?: string
  type: "rent" | "wallet_topup" | "inspection_fee" | "listing_boost"
  amount: number
  status: "pending" | "success" | "failed" | "refunded"
  receiptUrl?: string | null
  paidAt?: string | null
  createdAt: string
  tenancy?: Tenancy
}

// Reviews
export interface Review {
  id: string
  tenancyId: string
  authorUserId: string
  subjectType: "landlord" | "tenant" | "property"
  subjectId: string
  rating: number
  comment?: string
  reply?: string
  author?: User
  createdAt: string
}

// Analytics
export interface TenantAnalytics {
  totalRentPaidKobo: number
  activetenancies: number
  upcomingPayments: { dueDate: string; amountKobo: number; tenancyId: string }[]
  recentPayments: Payment[]
}

export interface LandlordAnalytics {
  totalRevenue: number
  totalProperties: number
  activetenancies: number
  pendingMaintenance: number
  monthlyRevenue: { month: string; amountKobo: number }[]
  recentPayments: Payment[]
}

export interface AgentAnalytics {
  managedProperties: number
  totalCommissions: number
  rating: number
  recentActivity: unknown[]
}

// Agent Commissions
export interface AgentCommission {
  id: string
  agentProfileId: string
  tenancyId: string
  propertyId: string
  commissionType: "percentage" | "flat"
  commissionValue: number
  amountEarnedKobo: number
  status: "pending" | "paid" | "waived"
  paidAt?: string | null
  tenancy?: Tenancy
  property?: Property
  createdAt: string
  updatedAt: string
}

// Bank Accounts
export interface BankAccount {
  id: string
  userId: string
  bankCode: string
  bankName: string
  accountNumber: string
  accountName: string
  recipientCode?: string | null
  isDefault: boolean
  isVerified: boolean
  createdAt: string
  updatedAt: string
}

// Wallet Transactions
export interface WalletTransaction {
  id: string
  walletId: string
  userId: string
  type: "credit" | "debit"
  amount: number
  description: string
  reference: string
  relatedPaymentId?: string | null
  status: "completed" | "pending" | "failed"
  createdAt: string
}

// Tenancy Agreement
export interface TenancyAgreement {
  id: string
  tenancyId: string
  documentUrl: string
  status: "draft" | "sent" | "signed_tenant" | "signed_both" | "rejected"
  tenantSignedAt?: string | null
  landlordSignedAt?: string | null
  createdAt: string
  updatedAt: string
}

// Admin
export interface AdminStats {
  totalUsers: number
  totalProperties: number
  totalRevenue: number
  newUsersThisMonth: number
  activetenancies: number
  pendingKyc: number
}

export interface KycRecord {
  id: string
  phone: string
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  kycStatus: "pending" | "approved" | "rejected"
  kycMethod?: "nin" | "bvn" | "document" | null
  kycDocumentUrl?: string | null
  kycIdentifier?: string | null
  kycRejectReason?: string | null
  kycSubmittedAt?: string | null
  createdAt: string
  updatedAt: string
}

// Agent Directory
export interface AgentDirectoryItem {
  id: string
  userId: string
  licenseNumber?: string
  bio?: string
  rating: number
  totalProperties: number
  isVerified: boolean
  user: {
    id: string
    firstName?: string
    lastName?: string
    avatarUrl?: string
    phone?: string
  }
  city?: string
  state?: string
}
