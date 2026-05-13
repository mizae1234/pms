import { Header } from "@/components/layout/header";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { OccupancyChart } from "@/components/dashboard/occupancy-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { RoomStatusChart } from "@/components/dashboard/room-status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { getDashboardStats } from "@/app/actions/dashboard";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="animate-fade-in">
      <Header
        title="แดชบอร์ด"
        subtitle="ภาพรวมระบบบริหารอสังหาริมทรัพย์"
      />
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <StatsCards
          totalRooms={stats.totalRooms}
          occupiedRooms={stats.occupiedRooms}
          occupancyRate={stats.occupancyRate}
          todayBookings={stats.todayBookings}
          todayCheckIn={stats.todayCheckIn}
          todayCheckOut={stats.todayCheckOut}
          monthlyRevenue={stats.monthlyRevenue}
          housekeepingTasks={stats.housekeepingTasks}
          urgentTasks={stats.urgentTasks}
          normalTasks={stats.normalTasks}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RevenueChart />
          </div>
          <div>
            <RoomStatusChart data={stats.roomStatuses} />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <OccupancyChart />
          <RecentActivity bookings={stats.recentBookings} />
        </div>
      </div>
    </div>
  );
}
