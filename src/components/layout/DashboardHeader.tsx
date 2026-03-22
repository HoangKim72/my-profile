// src/components/layout/DashboardHeader.tsx

"use client";

import { AuthUser } from "@/types";
import { Menu } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  user: AuthUser;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium">
              {user.profile?.fullName || "User"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {user.role}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {user.profile?.fullName?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}
