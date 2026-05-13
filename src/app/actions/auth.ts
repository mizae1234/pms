"use server";

import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { z } from "zod";

const LoginSchema = z.object({
  email: z.string().email("อีเมลไม่ถูกต้อง"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export type LoginState = {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
} | undefined;

export async function login(
  state: LoginState,
  formData: FormData
): Promise<LoginState> {
  // 1. Validate
  const result = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors };
  }

  const { email, password } = result.data;

  try {
    // 2. Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        branches: {
          select: { branchId: true },
        },
      },
    });

    if (!user || !user.isActive) {
      return { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // 3. Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return { message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" };
    }

    // 4. Create session
    await createSession({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branchIds: user.branches.map((b) => b.branchId),
    });
  } catch (error) {
    console.error("Login error:", error);
    return { message: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
  }

  // 5. Redirect (must be outside try-catch)
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
