"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  toggleGPSubscriptionStatus,
  deleteGPProfile,
} from "@/action/gp-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Building2,
  Users,
  Pencil,
  ShieldCheck,
  Power,
  Trash2,
  Plus,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";

type GPProfile = {
  id: string;
  gpname: string;
  blockname: string;
  gpcode: string;
  subscriptionStatus: "ACTIVE" | "DEACTIVE";
  staffLimit: number;
  createdAt: Date;
  _count?: { users: number };
};

interface GpProfileListProps {
  initialProfiles: GPProfile[];
}

function StatusBadge({ status }: { status: "ACTIVE" | "DEACTIVE" }) {
  if (status === "ACTIVE") {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 gap-1">
        <CheckCircle className="w-3 h-3" />
        Active
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-700 border-red-200 hover:bg-red-100 gap-1">
      <XCircle className="w-3 h-3" />
      Deactive
    </Badge>
  );
}

function GpRow({ gp }: { gp: GPProfile }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleGPSubscriptionStatus(gp.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteGPProfile(gp.id);
      if (result.success) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <TableRow className="hover:bg-blue-50/30 transition-colors">
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">{gp.gpname}</p>
            <p className="text-xs text-gray-500">{gp.gpcode}</p>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-600">{gp.blockname}</TableCell>
      <TableCell>
        <StatusBadge status={gp.subscriptionStatus} />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5 text-sm text-gray-600">
          <Users className="w-3.5 h-3.5 text-gray-400" />
          <span>{gp._count?.users ?? 0}</span>
          <span className="text-gray-400">/</span>
          <span>{gp.staffLimit}</span>
        </div>
      </TableCell>
      <TableCell className="text-sm text-gray-500">
        {new Date(gp.createdAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1.5">
          {/* Edit */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-blue-200 text-blue-600 hover:bg-blue-50"
          >
            <Link href={`/superadmindashboard/gp-management/${gp.id}/edit`}>
              <Pencil className="w-3 h-3 mr-1" />
              Edit
            </Link>
          </Button>

          {/* Create Admin */}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
          >
            <Link
              href={`/superadmindashboard/gp-management/${gp.id}/create-admin`}
            >
              <ShieldCheck className="w-3 h-3 mr-1" />
              Admin
            </Link>
          </Button>

          {/* Toggle Status */}
          <Button
            size="sm"
            variant="outline"
            disabled={isPending}
            onClick={handleToggle}
            className={`h-7 px-2 text-xs ${
              gp.subscriptionStatus === "ACTIVE"
                ? "border-red-200 text-red-600 hover:bg-red-50"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            }`}
          >
            {isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Power className="w-3 h-3" />
            )}
          </Button>

          {/* Delete */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs border-gray-200 text-gray-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                disabled={isPending}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete GP Profile?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete <strong>{gp.gpname}</strong> and
                  all associated data. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function GpProfileList({ initialProfiles }: GpProfileListProps) {
  const [search, setSearch] = useState("");

  const filtered = initialProfiles.filter(
    (gp) =>
      gp.gpname.toLowerCase().includes(search.toLowerCase()) ||
      gp.gpcode.toLowerCase().includes(search.toLowerCase()) ||
      gp.blockname.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Search & Add */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Loader2
              className={cn(
                "w-4 h-4 text-gray-400 animate-spin",
                !search && "hidden",
              )}
            />
            {!search && (
              <Building2 className="w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            )}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search GP name, code, or block..."
            className="block w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 bg-white transition-all placeholder:text-gray-400 shadow-sm"
          />
        </div>
        <Button
          asChild
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white gap-2 h-11 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          <Link href="/superadmindashboard/gp-management/register">
            <Plus className="w-4 h-4" />
            <span className="font-semibold text-sm">Register New GP</span>
          </Link>
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow className="hover:bg-transparent border-b border-gray-100">
                  <TableHead className="w-[300px] text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Gram Panchayat
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Block
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Status
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Users / Limit
                  </TableHead>
                  <TableHead className="text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Registered
                  </TableHead>
                  <TableHead className="text-right text-[11px] uppercase tracking-wider font-bold text-gray-500 h-12 px-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((gp) => (
                  <GpRow key={gp.id} gp={gp} />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="py-24 flex flex-col items-center justify-center text-center px-4">
            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6 border border-gray-100 shadow-inner">
              <Building2 className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              No GP Profiles Found
            </h3>
            <p className="text-sm text-gray-500 max-w-xs mx-auto mb-8 leading-relaxed">
              {search
                ? `We couldn't find any results matching "${search}". Try checking for typos or using different keywords.`
                : "It looks like you haven't registered any Gram Panchayats yet. Get started by registering your first GP."}
            </p>
            {search && (
              <Button
                variant="outline"
                onClick={() => setSearch("")}
                className="rounded-xl px-6 border-gray-200 hover:bg-gray-50"
              >
                Clear Search
              </Button>
            )}
            {!search && (
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 h-11 shadow-lg shadow-blue-600/20"
              >
                <Link href="/superadmindashboard/gp-management/register">
                  Register First GP
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
