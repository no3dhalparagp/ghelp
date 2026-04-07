import { getGPProfileById } from "@/action/gp-profile";
import CreateGpAdminForm from "@/components/gp-management/CreateGpAdminForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ShieldCheck,
  Building2,
  Users,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data } = await getGPProfileById(id);
  return {
    title: data
      ? `Create Admin — ${data.gpname}`
      : "Create Admin | Super Admin",
  };
}

export default async function CreateAdminPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: gp } = await getGPProfileById(id);

  if (!gp) return notFound();

  const adminUsers = gp.users ?? [];

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      {/* Header & Navigation */}
      <div className="flex flex-col gap-6">
        <Link
          href="/superadmindashboard/gp-management"
          className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group w-fit"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to GP List
        </Link>

        <div className="flex items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">
              Admin Management
            </h1>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Create and manage administrative access for{" "}
              <span className="font-bold text-indigo-600">{gp.gpname}</span>.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: GP Details & Existing Admins */}
        <div className="lg:col-span-5 space-y-6">
          {/* GP Info Card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Profile Details
              </h3>
              {gp.subscriptionStatus === "ACTIVE" ? (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight">
                  Active
                </Badge>
              ) : (
                <Badge className="bg-red-50 text-red-700 border-red-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-tight">
                  Deactive
                </Badge>
              )}
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 leading-tight">
                    {gp.gpname}
                  </h2>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">
                    {gp.blockname}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    GP Code
                  </p>
                  <p className="text-sm font-mono font-bold text-gray-700">
                    {gp.gpcode}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Short Name
                  </p>
                  <p className="text-sm font-bold text-gray-700">
                    {gp.gpshortname}
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  Office Address
                </p>
                <p className="text-xs text-gray-600 leading-relaxed italic">
                  {gp.gpaddress}
                </p>
              </div>
            </div>
          </div>

          {/* Existing Admins List */}
          {adminUsers.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                    Existing Admins
                  </h3>
                </div>
                <span className="bg-white border border-gray-100 text-indigo-600 text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                  {adminUsers.length}
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {adminUsers.map((user: any) => (
                  <div
                    key={user.id}
                    className="px-6 py-4 hover:bg-gray-50/50 transition-colors group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        {user.emailVerified ? (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                            <CheckCircle className="w-3 h-3" /> Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 uppercase">
                            Unverified
                          </span>
                        )}
                        <Badge
                          className={cn(
                            "text-[9px] font-black uppercase px-1.5 py-0 h-4 border-none shadow-none",
                            user.userStatus === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500",
                          )}
                        >
                          {user.userStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Creation Form */}
        <div className="lg:col-span-7">
          <CreateGpAdminForm gpProfileId={gp.id} gpName={gp.gpname} />
        </div>
      </div>
    </div>
  );
}
