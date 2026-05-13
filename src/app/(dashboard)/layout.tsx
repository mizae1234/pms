import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/layout/sidebar";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Check if onboarding is complete
  const property = await prisma.property.findFirst({
    orderBy: { createdAt: "asc" },
    select: { isSetupComplete: true },
  });

  if (!property || !property.isSetupComplete) {
    redirect("/onboarding");
  }

  return (
    <AuthProvider
      user={{
        userId: session.userId,
        name: session.name,
        email: session.email,
        role: session.role,
        branchIds: session.branchIds,
      }}
    >
      <div className="flex h-full">
        <Sidebar />
        <main className="ml-[260px] flex-1 min-h-screen bg-background">
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
