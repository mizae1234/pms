import type {
  Room,
  Branch,
  Property,
  Booking,
  Customer,
  RoomStatus,
  RoomType,
  PropertyType,
} from "@/generated/prisma/client";

// Extended types with relations
export type RoomWithBranch = Room & {
  branch: Branch & {
    property: Property;
  };
};

export type BranchWithProperty = Branch & {
  property: Property;
  _count?: {
    rooms: number;
  };
};

// Filter types
export interface RoomFilters {
  search?: string;
  floor?: number;
  type?: RoomType;
  status?: RoomStatus;
  branchId?: string;
  page?: number;
  limit?: number;
}

// API response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Dashboard types
export interface DashboardStats {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  todayCheckIns: number;
  todayCheckOuts: number;
  monthlyRevenue: number;
  revenueChange: number;
  pendingTasks: number;
}

// Re-export prisma types
export type {
  Room,
  Branch,
  Property,
  Booking,
  Customer,
  RoomStatus,
  RoomType,
  PropertyType,
};
