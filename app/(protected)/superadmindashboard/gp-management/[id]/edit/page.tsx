import { getGPProfileById } from "@/action/gp-profile";
import GpProfileForm from "@/components/gp-management/GpProfileForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2 } from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await getGPProfileById(id);
  return {
    title: data ? `Edit ${data.gpname}` : "Edit GP Profile",
  };
}

export default async function EditGPPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: gp } = await getGPProfileById(id);

  if (!gp) return notFound();

  return (
    <div className="max-w-5xl mx-auto space-y-8 py-2">
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
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Edit GP Profile</h1>
            <p className="text-sm text-gray-500 max-w-md leading-relaxed">
              Update existing profile for <span className="font-bold text-indigo-600">{gp.gpname}</span>. 
              Changes will take effect immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <GpProfileForm
          gpId={gp.id}
          defaultValues={{
            gpname: gp.gpname,
            gpaddress: gp.gpaddress,
            nameinprodhan: gp.nameinprodhan,
            gpcode: gp.gpcode,
            gpnameinshort: gp.gpnameinshort,
            blockname: gp.blockname,
            gpshortname: gp.gpshortname,
            subscriptionStatus: gp.subscriptionStatus,
            staffLimit: gp.staffLimit,
            menuControls: gp.menuControls,
          }}
        />
      </div>
    </div>
  );
}
