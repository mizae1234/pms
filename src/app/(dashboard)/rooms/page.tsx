"use client";

import { Header } from "@/components/layout/header";
import { RoomTable } from "@/components/rooms/room-table";
import { RoomFilters } from "@/components/rooms/room-filters";
import { RoomFormDialog } from "@/components/rooms/room-form-dialog";
import { Plus, Loader2 } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { getRoomsData, type RoomWithBranch, type BranchOption } from "@/app/actions/rooms";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithBranch[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomWithBranch | null>(null);
  const [search, setSearch] = useState("");
  const [filterFloor, setFilterFloor] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterBranch, setFilterBranch] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRoomsData({
        search: search || undefined,
        branchId: filterBranch || undefined,
        floor: filterFloor ? parseInt(filterFloor) : undefined,
        type: filterType || undefined,
        status: filterStatus || undefined,
        page: currentPage,
        limit: itemsPerPage,
      });
      setRooms(data.rooms);
      setBranches(data.branches);
      setTotalCount(data.totalCount);
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  }, [search, filterBranch, filterFloor, filterType, filterStatus, currentPage]);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const floors = [...new Set(rooms.map((r) => r.floor))].sort();

  const handleEdit = (room: RoomWithBranch) => {
    setEditingRoom(room);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingRoom(null);
    fetchRooms(); // Refresh after form close
  };

  const handleClearFilters = () => {
    setSearch("");
    setFilterFloor("");
    setFilterType("");
    setFilterStatus("");
    setFilterBranch("");
    setCurrentPage(1);
  };

  return (
    <div className="animate-fade-in">
      <Header
        title="จัดการห้อง"
        subtitle="รายการห้องทั้งหมดในระบบ"
      />

      <div className="p-6 space-y-4">
        {/* Top action bar */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-text-muted">
              ทั้งหมด <span className="font-semibold text-text-primary">{totalCount}</span> ห้อง
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            เพิ่มห้อง
          </button>
        </div>

        {/* Filters */}
        <RoomFilters
          search={search}
          onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
          filterFloor={filterFloor}
          onFloorChange={(v) => { setFilterFloor(v); setCurrentPage(1); }}
          filterType={filterType}
          onTypeChange={(v) => { setFilterType(v); setCurrentPage(1); }}
          filterStatus={filterStatus}
          onStatusChange={(v) => { setFilterStatus(v); setCurrentPage(1); }}
          filterBranch={filterBranch}
          onBranchChange={(v) => { setFilterBranch(v); setCurrentPage(1); }}
          branches={branches}
          floors={floors}
          onClear={handleClearFilters}
        />

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <RoomTable
            rooms={rooms}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
            onPageChange={setCurrentPage}
            onEdit={handleEdit}
          />
        )}

        {/* Form Dialog */}
        {showForm && (
          <RoomFormDialog
            room={editingRoom}
            branches={branches}
            onClose={handleCloseForm}
          />
        )}
      </div>
    </div>
  );
}
