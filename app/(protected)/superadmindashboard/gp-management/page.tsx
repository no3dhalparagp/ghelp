import { getGPProfiles } from "@/action/gp-profile";
import GpProfileList from "@/components/gp-management/GpProfileList";
import { Building2, CheckCircle, XCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "GP Management | Super Admin",
  description: "Manage all registered Gram Panchayat profiles",
};

export default async function GpManagementPage() {
  const { data: profiles = [] } = await getGPProfiles();

  const activeCount = profiles.filter(
    (p) => p.subscriptionStatus === "ACTIVE",
  ).length;
  const deactiveCount = profiles.filter(
    (p) => p.subscriptionStatus === "DEACTIVE",
  ).length;
  const totalUsers = profiles.reduce(
    (sum, p) => sum + (p._count?.users ?? 0),
    0,
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 py-2">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              Super Admin
            </span>
          </div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            GP Management
          </h1>
          <p className="text-sm text-gray-500 max-w-md leading-relaxed">
            Centralized control for Gram Panchayat profiles, subscription
            status, and administrative access.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total GPs",
            value: profiles.length,
            icon: Building2,
            color: "blue",
          },
          {
            label: "Active",
            value: activeCount,
            icon: CheckCircle,
            color: "emerald",
          },
          {
            label: "Deactive",
            value: deactiveCount,
            icon: XCircle,
            color: "red",
          },
          {
            label: "Total Users",
            value: totalUsers,
            icon: Users,
            color: "indigo",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-[1.5rem] border border-gray-100 p-5 flex items-center gap-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                stat.color === "blue" && "bg-blue-50 text-blue-600",
                stat.color === "emerald" && "bg-emerald-50 text-emerald-600",
                stat.color === "red" && "bg-red-50 text-red-600",
                stat.color === "indigo" && "bg-indigo-50 text-indigo-600",
              )}
            >
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* GP List */}
      <div className="pt-2">
        <GpProfileList initialProfiles={profiles} />
      </div>
    </div>
  );
}
