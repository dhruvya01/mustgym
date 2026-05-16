export interface Member {
  id?: string;
  gymId: string;
  fullName: string;
  phone: string;
  membershipPlan: string;
  expiryDate: string; // ISO date string
  branch: string;
  authLinked: boolean;
  uid?: string; // Firebase Auth UID if authLinked is true
  createdAt: string;
}

export type UserRole = 'admin' | 'owner' | 'member';
export type MembershipType = 'elite' | 'standard' | 'basic';
export type MembershipStatus = 'active' | 'expired' | 'pending' | 'halted';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  gymId?: string;
  membershipType?: MembershipType;
  membershipStatus?: MembershipStatus;
  membershipExpiry?: string;
  phoneNumber?: string;
  currentWeight?: number;
  height?: string;
  goal?: string;
  createdAt: string;
  xp?: number;
  attendanceStreak?: number;
}

export interface Gym {
  id: string;
  name: string;
  ownerId: string;
  logoUrl?: string;
  branchName?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  capacity?: number;
  openTimings?: string;
  closeTimings?: string;
  weeklyTimings?: Record<string, {
    isOpen: boolean;
    open: string;
    close: string;
  }>;
  brandingColor?: string;
  customBannerUrl?: string;
  welcomeMessage?: string;
  createdAt: string;
  branches?: number;
  expectedMembers?: number;
  subscriptionTier?: 'starter' | 'professional' | 'elite';
  subscriptionStatus?: 'active' | 'trial' | 'inactive';
}

export interface AttendanceRecord {
  id?: string;
  userId: string;
  userName?: string;
  timestamp: string;
  checkOutTime?: string;
  terminalId?: string;
  isDuplicate?: boolean;
  entryCount?: number;
  gymId?: string;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  notes?: string;
}

export interface WorkoutDay {
  dayName: string;
  focus?: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  exercises?: Exercise[]; // Legacy format
  days?: WorkoutDay[]; // Weekly plan format
  aiInsights?: string[];
  createdAt: string;
}

export interface Equipment {
  id: string;
  name: string;
  status: 'available' | 'reserved' | 'maintenance';
  reservedBy?: string;
  reservationExpiry?: string;
  gymId?: string;
}

export interface EquipmentUsage {
  id?: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  timestamp: string;
  gymId: string;
}

export interface PaymentRecord {
  id?: string;
  userId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  date: string;
}

export interface Meal {
  time: string;
  name: string;
  items: string[];
  calories?: number;
  protein?: string;
  notes?: string;
}

export interface DietPlan {
  id?: string;
  userId: string;
  title: string;
  description?: string;
  meals: Meal[];
  aiInsights?: string[];
  createdAt: string;
}

export interface PersonalRecord {
  id?: string;
  userId: string;
  lift: 'bench' | 'deadlift' | 'squat' | 'overhead_press' | 'body_weight' | string;
  weight: number;
  date: string;
  notes?: string;
  gymId?: string;
}

export interface Announcement {
  id?: string;
  gymId: string;
  title: string;
  message: string;
  imageUrl?: string;
  type: 'info' | 'alert' | 'event' | 'maintenance';
  priority: 'low' | 'normal' | 'high';
  createdAt: string;
  expiryDate?: string;
  createdBy: string;
}

export interface Challenge {
  id?: string;
  title: string;
  description?: string;
  type: 'attendance' | 'steps' | 'weight' | 'sets';
  target: number;
  startDate: string;
  endDate: string;
  badgeId?: string;
  gymId?: string;
}

export interface PaymentVerificationRequest {
  id?: string;
  gymId: string;
  userId: string;
  userName: string;
  amountPaid: number;
  paymentMethod: string;
  transactionNote?: string;
  screenshotUrl?: string; // Optional if you have storage logic elsewhere
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  planDurationMonths?: number;
}

export interface Machine {
  id?: string;
  gymId: string;
  name: string;
  type: string;
  brand: string;
  setupDate: string;
  condition: 'Excellent' | 'Good' | 'Needs Maintenance' | 'Out of Order';
  notes?: string;
  imageUrl?: string;
  lastServiceDate?: string;
}

export interface ChallengeParticipant {
  id?: string;
  challengeId: string;
  userId: string;
  userName?: string;
  progress: number;
  completed: boolean;
  joinedAt: string;
  updatedAt?: string;
}

export interface MembershipTier {
  id: string;
  name: string;
  price: number;
  benefits: string[];
  accessLevel?: number;
}
