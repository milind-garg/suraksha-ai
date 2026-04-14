"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "@/components/layout/dashboard-nav";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { getCurrentUserInfo } from "@/lib/auth";
import { useAuthStore } from "@/store/auth-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // Check demo token first
      const demoToken = sessionStorage.getItem("auth_token");
      if (demoToken === "demo-token") {
        const demoUser = JSON.parse(sessionStorage.getItem("auth_user") || "{}");
        setUser(demoUser, demoToken);
        setChecking(false);
        return;
      }

      // Check real Cognito session
      try {
        const userInfo = await getCurrentUserInfo();
        if (userInfo && userInfo.token) {
          setUser(
            {
              userId: userInfo.user.userId,
              email: userInfo.user.email,
              name: userInfo.user.name,
              phone: userInfo.user.phone,
            },
            userInfo.token,
          );
          setChecking(false);
        } else {
          setChecking(false);
          router.push("/login");
        }
      } catch {
        setChecking(false);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, setUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading Suraksha AI..." />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardNav />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
