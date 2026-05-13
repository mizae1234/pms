import { z } from "zod";

export const roomSchema = z.object({
  number: z.string().min(1, "กรุณาระบุเลขห้อง"),
  floor: z.coerce.number().min(1, "กรุณาระบุชั้น"),
  type: z.enum(["STANDARD", "DELUXE", "SUITE", "STUDIO", "ONE_BED", "TWO_BED", "PENTHOUSE"]),
  status: z.enum(["AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE", "OUT_OF_ORDER"]).optional(),
  basePrice: z.coerce.number().min(0, "ราคาต้องมากกว่า 0"),
  size: z.coerce.number().min(0).optional().nullable(),
  notes: z.string().optional().nullable(),
  branchId: z.string().min(1, "กรุณาเลือกสาขา"),
});

export type RoomFormData = z.infer<typeof roomSchema>;
