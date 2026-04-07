import GpProfileForm from "@/components/gp-management/GpProfileForm";
import { Building2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Register GP | Super Admin",
  description: "Register a new Gram Panchayat profile",
};

export default function RegisterGPPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
      {/* Header */}
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
          <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Register New GP</h1>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Fill in the details below to register a new Gram Panchayat profile. This will create a workspace for their staff.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <GpProfileForm />
      </div>
    </div>
  );
}
