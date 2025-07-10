import { Suspense } from "react";
import DashboardContent from "@/components/dashboard/dashboard-content";

export const metadata = {
  title: "Dashboard | FlowBoardAI",
};

export default function DashboardPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
} 