import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = "password123";

async function main() {
  console.log("🌱 Seeding PMS database...\n");

  // Hash the default password
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // ============================================
  // 1. USERS
  // ============================================
  console.log("👤 Creating users...");

  const owner = await prisma.user.create({
    data: {
      email: "owner@pms.com",
      password: hashedPassword,
      name: "สมศักดิ์ เจ้าของกิจการ",
      phone: "081-111-1111",
      role: "OWNER",
    },
  });

  const manager1 = await prisma.user.create({
    data: {
      email: "manager@pms.com",
      password: hashedPassword,
      name: "วิภาดา ผู้จัดการ",
      phone: "082-222-2222",
      role: "BRANCH_MANAGER",
    },
  });

  const manager2 = await prisma.user.create({
    data: {
      email: "manager2@pms.com",
      password: hashedPassword,
      name: "ประยุทธ์ ผู้จัดการ",
      phone: "082-333-3333",
      role: "BRANCH_MANAGER",
    },
  });

  const staff1 = await prisma.user.create({
    data: {
      email: "staff@pms.com",
      password: hashedPassword,
      name: "กนกวรรณ พนักงาน",
      phone: "083-444-4444",
      role: "STAFF",
    },
  });

  const staff2 = await prisma.user.create({
    data: {
      email: "staff2@pms.com",
      password: hashedPassword,
      name: "ธนากร พนักงาน",
      phone: "083-555-5555",
      role: "STAFF",
    },
  });

  const housekeeper1 = await prisma.user.create({
    data: {
      email: "housekeeper@pms.com",
      password: hashedPassword,
      name: "นิดา แม่บ้าน",
      phone: "084-666-6666",
      role: "HOUSEKEEPER",
    },
  });

  const housekeeper2 = await prisma.user.create({
    data: {
      email: "housekeeper2@pms.com",
      password: hashedPassword,
      name: "สุดา แม่บ้าน",
      phone: "084-777-7777",
      role: "HOUSEKEEPER",
    },
  });

  // ============================================
  // 2. PROPERTIES
  // ============================================
  console.log("🏢 Creating properties...");

  const hotel = await prisma.property.create({
    data: {
      name: "Blue Horizon Hotel",
      type: "HOTEL",
      description: "โรงแรมริมทะเลระดับ 4 ดาว",
    },
  });

  const apartment = await prisma.property.create({
    data: {
      name: "Azure Living Apartment",
      type: "APARTMENT",
      description: "อพาร์ทเมนท์ใจกลางเมือง",
    },
  });

  // ============================================
  // 3. BRANCHES
  // ============================================
  console.log("🏠 Creating branches...");

  const branchPattaya = await prisma.branch.create({
    data: {
      propertyId: hotel.id,
      name: "สาขาพัทยา",
      address: "123 ถ.พัทยาสาย 2 อ.บางละมุง จ.ชลบุรี 20150",
      phone: "038-123-456",
      email: "pattaya@bluehorizon.co.th",
    },
  });

  const branchHuahin = await prisma.branch.create({
    data: {
      propertyId: hotel.id,
      name: "สาขาหัวหิน",
      address: "456 ถ.เพชรเกษม อ.หัวหิน จ.ประจวบคีรีขันธ์ 77110",
      phone: "032-456-789",
      email: "huahin@bluehorizon.co.th",
    },
  });

  const branchBangkok = await prisma.branch.create({
    data: {
      propertyId: apartment.id,
      name: "สาขากรุงเทพ",
      address: "789 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพ 10110",
      phone: "02-789-1234",
      email: "bkk@azureliving.co.th",
    },
  });

  // ============================================
  // 4. USER-BRANCH ASSIGNMENTS
  // ============================================
  console.log("🔗 Assigning users to branches...");

  // Owner sees all branches
  await prisma.userBranch.createMany({
    data: [
      { userId: owner.id, branchId: branchPattaya.id },
      { userId: owner.id, branchId: branchHuahin.id },
      { userId: owner.id, branchId: branchBangkok.id },
      { userId: manager1.id, branchId: branchPattaya.id },
      { userId: manager2.id, branchId: branchHuahin.id },
      { userId: staff1.id, branchId: branchPattaya.id },
      { userId: staff2.id, branchId: branchBangkok.id },
      { userId: housekeeper1.id, branchId: branchPattaya.id },
      { userId: housekeeper2.id, branchId: branchHuahin.id },
    ],
  });

  // ============================================
  // 5. ROOMS - Hotel Pattaya (10 rooms)
  // ============================================
  console.log("🛏️ Creating rooms...");

  const hotelPattayaRooms = await Promise.all([
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "101", floor: 1, type: "STANDARD", status: "AVAILABLE", basePrice: 1500, size: 28 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "102", floor: 1, type: "STANDARD", status: "OCCUPIED", basePrice: 1500, size: 28 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "103", floor: 1, type: "DELUXE", status: "AVAILABLE", basePrice: 2500, size: 35 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "201", floor: 2, type: "DELUXE", status: "CLEANING", basePrice: 2500, size: 35 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "202", floor: 2, type: "DELUXE", status: "OCCUPIED", basePrice: 2800, size: 38 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "203", floor: 2, type: "SUITE", status: "AVAILABLE", basePrice: 4500, size: 55 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "301", floor: 3, type: "SUITE", status: "OCCUPIED", basePrice: 5000, size: 60 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "302", floor: 3, type: "SUITE", status: "MAINTENANCE", basePrice: 5000, size: 60 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "401", floor: 4, type: "PENTHOUSE", status: "AVAILABLE", basePrice: 8000, size: 85 } }),
    prisma.room.create({ data: { branchId: branchPattaya.id, number: "402", floor: 4, type: "PENTHOUSE", status: "OCCUPIED", basePrice: 9500, size: 100 } }),
  ]);

  // Rooms - Hotel Hua Hin (8 rooms)
  const hotelHuahinRooms = await Promise.all([
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "101", floor: 1, type: "STANDARD", status: "AVAILABLE", basePrice: 1800, size: 30 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "102", floor: 1, type: "STANDARD", status: "OCCUPIED", basePrice: 1800, size: 30 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "201", floor: 2, type: "DELUXE", status: "AVAILABLE", basePrice: 3000, size: 38 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "202", floor: 2, type: "DELUXE", status: "OCCUPIED", basePrice: 3000, size: 38 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "301", floor: 3, type: "SUITE", status: "CLEANING", basePrice: 5500, size: 65 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "302", floor: 3, type: "SUITE", status: "AVAILABLE", basePrice: 5500, size: 65 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "401", floor: 4, type: "PENTHOUSE", status: "AVAILABLE", basePrice: 9500, size: 100 } }),
    prisma.room.create({ data: { branchId: branchHuahin.id, number: "402", floor: 4, type: "PENTHOUSE", status: "OCCUPIED", basePrice: 12000, size: 120 } }),
  ]);

  // Rooms - Apartment Bangkok (7 rooms)
  const aptRooms = await Promise.all([
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A101", floor: 1, type: "STUDIO", status: "OCCUPIED", basePrice: 8000, size: 28 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A102", floor: 1, type: "STUDIO", status: "AVAILABLE", basePrice: 8000, size: 28 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A201", floor: 2, type: "ONE_BED", status: "OCCUPIED", basePrice: 12000, size: 35 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A202", floor: 2, type: "ONE_BED", status: "OCCUPIED", basePrice: 12000, size: 35 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A301", floor: 3, type: "TWO_BED", status: "AVAILABLE", basePrice: 18000, size: 55 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A302", floor: 3, type: "TWO_BED", status: "CLEANING", basePrice: 18000, size: 55 } }),
    prisma.room.create({ data: { branchId: branchBangkok.id, number: "A401", floor: 4, type: "PENTHOUSE", status: "AVAILABLE", basePrice: 35000, size: 90 } }),
  ]);

  // ============================================
  // 6. CUSTOMERS
  // ============================================
  console.log("👥 Creating customers...");

  const customers = await Promise.all([
    prisma.customer.create({ data: { name: "สมชาย มั่นคง", idCard: "1100100100101", phone: "089-111-1111", email: "somchai@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "วิภา สุขใจ", idCard: "1100100100102", phone: "089-222-2222", email: "vipa@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "John Smith", passport: "AB1234567", phone: "+1-555-0123", email: "john@email.com", nationality: "US" } }),
    prisma.customer.create({ data: { name: "อรอนงค์ ภักดี", idCard: "1100100100103", phone: "089-333-3333", email: "onanong@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "田中太郎", passport: "TK9876543", phone: "+81-90-1234-5678", email: "tanaka@email.com", nationality: "JP" } }),
    prisma.customer.create({ data: { name: "ธนพล รุ่งเรือง", idCard: "1100100100104", phone: "089-444-4444", email: "thanaphon@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "Maria Garcia", passport: "ES5551234", phone: "+34-612-345-678", email: "maria@email.com", nationality: "ES" } }),
    prisma.customer.create({ data: { name: "กานต์ ใจดี", idCard: "1100100100105", phone: "089-555-5555", email: "karn@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "พิมพ์ใจ สว่าง", idCard: "1100100100106", phone: "089-666-6666", email: "pimjai@email.com", nationality: "TH" } }),
    prisma.customer.create({ data: { name: "อภิชาติ เก่งกาจ", idCard: "1100100100107", phone: "089-777-7777", email: "apichat@email.com", nationality: "TH" } }),
  ]);

  // ============================================
  // 7. BOOKINGS (Hotel)
  // ============================================
  console.log("📅 Creating bookings...");

  const now = new Date();
  await Promise.all([
    prisma.booking.create({
      data: {
        roomId: hotelPattayaRooms[1].id, customerId: customers[0].id,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2),
        status: "CHECKED_IN", source: "WALK_IN", adults: 2, totalAmount: 4500,
      },
    }),
    prisma.booking.create({
      data: {
        roomId: hotelPattayaRooms[6].id, customerId: customers[2].id,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3),
        status: "CHECKED_IN", source: "BOOKING_COM", adults: 2, children: 1, totalAmount: 15000, otaRef: "BK-20260425-001",
      },
    }),
    prisma.booking.create({
      data: {
        roomId: hotelPattayaRooms[9].id, customerId: customers[4].id,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 2),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        status: "CHECKED_IN", source: "AGODA", adults: 2, totalAmount: 19000, otaRef: "AG-20260423-042",
      },
    }),
    prisma.booking.create({
      data: {
        roomId: hotelHuahinRooms[1].id, customerId: customers[6].id,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 4),
        status: "CONFIRMED", source: "WEBSITE", adults: 1, totalAmount: 5400,
      },
    }),
    prisma.booking.create({
      data: {
        roomId: hotelHuahinRooms[7].id, customerId: customers[1].id,
        checkIn: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        checkOut: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5),
        status: "CHECKED_IN", source: "PHONE", adults: 2, totalAmount: 60000,
      },
    }),
  ]);

  // ============================================
  // 8. CONTRACTS (Apartment)
  // ============================================
  console.log("📄 Creating contracts...");

  const contracts = await Promise.all([
    prisma.contract.create({
      data: {
        roomId: aptRooms[0].id, customerId: customers[3].id,
        startDate: new Date(2026, 0, 1), endDate: new Date(2026, 11, 31),
        monthlyRent: 8000, status: "ACTIVE",
      },
    }),
    prisma.contract.create({
      data: {
        roomId: aptRooms[2].id, customerId: customers[5].id,
        startDate: new Date(2026, 2, 1), endDate: new Date(2027, 1, 28),
        monthlyRent: 12000, status: "ACTIVE",
      },
    }),
    prisma.contract.create({
      data: {
        roomId: aptRooms[3].id, customerId: customers[8].id,
        startDate: new Date(2025, 6, 1), endDate: new Date(2026, 5, 30),
        monthlyRent: 12000, status: "ACTIVE",
      },
    }),
  ]);

  // ============================================
  // 9. DEPOSITS (Apartment)
  // ============================================
  console.log("💰 Creating deposits...");

  await Promise.all([
    prisma.deposit.create({ data: { contractId: contracts[0].id, type: "SECURITY", amount: 16000, status: "HELD" } }),
    prisma.deposit.create({ data: { contractId: contracts[0].id, type: "KEY", amount: 500, status: "HELD" } }),
    prisma.deposit.create({ data: { contractId: contracts[1].id, type: "SECURITY", amount: 24000, status: "HELD" } }),
    prisma.deposit.create({ data: { contractId: contracts[2].id, type: "SECURITY", amount: 24000, status: "HELD" } }),
  ]);

  // ============================================
  // 10. HOUSEKEEPING TASKS
  // ============================================
  console.log("🧹 Creating housekeeping tasks...");

  await Promise.all([
    prisma.housekeepingTask.create({
      data: {
        roomId: hotelPattayaRooms[3].id, assignedToId: housekeeper1.id,
        status: "IN_PROGRESS", priority: "HIGH",
        scheduledDate: new Date(),
        checklist: JSON.stringify([
          { item: "ทำความสะอาดห้องน้ำ", done: true },
          { item: "เปลี่ยนผ้าปูที่นอน", done: true },
          { item: "ดูดฝุ่น", done: false },
          { item: "เช็ดกระจก", done: false },
        ]),
      },
    }),
    prisma.housekeepingTask.create({
      data: {
        roomId: hotelHuahinRooms[4].id, assignedToId: housekeeper2.id,
        status: "PENDING", priority: "MEDIUM",
        scheduledDate: new Date(),
      },
    }),
    prisma.housekeepingTask.create({
      data: {
        roomId: aptRooms[5].id, assignedToId: null,
        status: "PENDING", priority: "LOW",
        scheduledDate: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
      },
    }),
  ]);

  // ============================================
  // 11. INVENTORY ITEMS
  // ============================================
  console.log("📦 Creating inventory...");

  await prisma.inventoryItem.createMany({
    data: [
      { branchId: branchPattaya.id, name: "ผ้าเช็ดตัว", category: "ผ้า", quantity: 50, unit: "ผืน", minStock: 20 },
      { branchId: branchPattaya.id, name: "แชมพู", category: "อุปกรณ์อาบน้ำ", quantity: 100, unit: "ขวด", minStock: 30 },
      { branchId: branchPattaya.id, name: "สบู่", category: "อุปกรณ์อาบน้ำ", quantity: 80, unit: "ก้อน", minStock: 25 },
      { branchId: branchHuahin.id, name: "ผ้าเช็ดตัว", category: "ผ้า", quantity: 40, unit: "ผืน", minStock: 15 },
      { branchId: branchHuahin.id, name: "น้ำดื่ม", category: "เครื่องดื่ม", quantity: 200, unit: "ขวด", minStock: 50 },
      { branchId: branchBangkok.id, name: "น้ำยาทำความสะอาด", category: "ทำความสะอาด", quantity: 15, unit: "ขวด", minStock: 5 },
    ],
  });

  console.log("\n✅ Seed completed!");
  console.log(`   - ${7} users (password: ${DEFAULT_PASSWORD})`);
  console.log(`   - ${2} properties (1 Hotel, 1 Apartment)`);
  console.log(`   - ${3} branches`);
  console.log(`   - ${25} rooms`);
  console.log(`   - ${10} customers`);
  console.log(`   - ${5} bookings`);
  console.log(`   - ${3} contracts`);
  console.log(`   - ${4} deposits`);
  console.log("\n📧 Demo accounts:");
  console.log("   owner@pms.com / password123");
  console.log("   manager@pms.com / password123");
  console.log("   staff@pms.com / password123");
  console.log("   housekeeper@pms.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
