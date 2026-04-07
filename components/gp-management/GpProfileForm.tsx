"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { saveGPProfile, updateGPProfile } from "@/action/gp-profile";
import { adminMenuItems, employeeMenuItems } from "@/constants/protected-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Building2,
  MapPin,
  User,
  Hash,
  FileText,
  Users,
  CheckCircle2,
  Loader2,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

const formSchema = z.object({
  gpname: z.string().min(2, "Name must be at least 2 characters"),
  gpaddress: z.string().min(5, "Address must be at least 5 characters"),
  nameinprodhan: z
    .string()
    .min(2, "Prodhan name must be at least 2 characters"),
  gpcode: z.string().min(2, "GP code must be at least 2 characters"),
  gpnameinshort: z.string().min(2, "Short name must be at least 2 characters"),
  blockname: z.string().min(2, "Block name must be at least 2 characters"),
  gpshortname: z.string().min(2, "Short name must be at least 2 characters"),
  subscriptionStatus: z.enum(["ACTIVE", "DEACTIVE"]).default("ACTIVE"),
  staffLimit: z.coerce.number().int().min(1).default(10),
  menuControls: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

interface GpProfileFormProps {
  defaultValues?: Partial<FormValues>;
  gpId?: string; // if editing
}



// Combine top-level menus from Admin and Staff portals so SuperAdmin can allow them
const adminTop = adminMenuItems.map(m => m.menuItemText);
const staffTop = employeeMenuItems.map(m => m.menuItemText);

const menuOptions = Array.from(new Set([...adminTop, ...staffTop]));

export default function GpProfileForm({
  defaultValues,
  gpId,
}: GpProfileFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMenus, setSelectedMenus] = useState<string[]>(
    defaultValues?.menuControls ?? [],
  );

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gpname: defaultValues?.gpname ?? "",
      gpaddress: defaultValues?.gpaddress ?? "",
      nameinprodhan: defaultValues?.nameinprodhan ?? "",
      gpcode: defaultValues?.gpcode ?? "",
      gpnameinshort: defaultValues?.gpnameinshort ?? "",
      blockname: defaultValues?.blockname ?? "",
      gpshortname: defaultValues?.gpshortname ?? "",
      subscriptionStatus: defaultValues?.subscriptionStatus ?? "ACTIVE",
      staffLimit: defaultValues?.staffLimit ?? 10,
      menuControls: defaultValues?.menuControls ?? [],
    },
  });

  const subscriptionStatus = watch("subscriptionStatus");

  const toggleMenu = (menuText: string) => {
    const updated = selectedMenus.includes(menuText)
      ? selectedMenus.filter((m) => m !== menuText)
      : [...selectedMenus, menuText];
    setSelectedMenus(updated);
    setValue("menuControls", updated);
  };

  const selectAll = () => {
    setSelectedMenus(menuOptions);
    setValue("menuControls", menuOptions);
  };

  const clearAll = () => {
    setSelectedMenus([]);
    setValue("menuControls", []);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    try {
      let result;
      if (gpId) {
        result = await updateGPProfile(gpId, data);
      } else {
        result = await saveGPProfile(data);
      }

      if (result.success) {
        toast.success(result.message);
        router.push("/superadmindashboard/gp-management");
        router.refresh();
      } else {
        toast.error(result.message ?? "Something went wrong");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Basic Info */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center gap-3">
          <Building2 className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold text-base">GP Information</h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* GP Name */}
          <div className="space-y-2">
            <Label
              htmlFor="gpname"
              className="text-sm font-semibold text-gray-700"
            >
              GP Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                id="gpname"
                {...register("gpname")}
                placeholder="e.g. Rampur Gram Panchayat"
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
              />
            </div>
            {errors.gpname && (
              <p className="text-xs text-red-500 font-medium">
                {errors.gpname.message}
              </p>
            )}
          </div>

          {/* Block Name */}
          <div className="space-y-2">
            <Label
              htmlFor="blockname"
              className="text-sm font-semibold text-gray-700"
            >
              Block Name <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                id="blockname"
                {...register("blockname")}
                placeholder="e.g. Barrackpore Block"
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
              />
            </div>
            {errors.blockname && (
              <p className="text-xs text-red-500 font-medium">
                {errors.blockname.message}
              </p>
            )}
          </div>

          {/* Prodhan Name */}
          <div className="space-y-2">
            <Label
              htmlFor="nameinprodhan"
              className="text-sm font-semibold text-gray-700"
            >
              Name of Pradhan <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                id="nameinprodhan"
                {...register("nameinprodhan")}
                placeholder="e.g. Suresh Kumar"
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
              />
            </div>
            {errors.nameinprodhan && (
              <p className="text-xs text-red-500 font-medium">
                {errors.nameinprodhan.message}
              </p>
            )}
          </div>

          {/* GP Code */}
          <div className="space-y-2">
            <Label
              htmlFor="gpcode"
              className="text-sm font-semibold text-gray-700"
            >
              GP Code <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                id="gpcode"
                {...register("gpcode")}
                placeholder="e.g. WB-GP-001"
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
              />
            </div>
            {errors.gpcode && (
              <p className="text-xs text-red-500 font-medium">
                {errors.gpcode.message}
              </p>
            )}
          </div>

          {/* GP Name in Short */}
          <div className="space-y-2">
            <Label
              htmlFor="gpnameinshort"
              className="text-sm font-semibold text-gray-700"
            >
              GP Name (Short) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gpnameinshort"
              {...register("gpnameinshort")}
              placeholder="e.g. RPG"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
            />
            {errors.gpnameinshort && (
              <p className="text-xs text-red-500 font-medium">
                {errors.gpnameinshort.message}
              </p>
            )}
          </div>

          {/* GP Short Name */}
          <div className="space-y-2">
            <Label
              htmlFor="gpshortname"
              className="text-sm font-semibold text-gray-700"
            >
              GP Short Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="gpshortname"
              {...register("gpshortname")}
              placeholder="e.g. Rampur GP"
              className="h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
            />
            {errors.gpshortname && (
              <p className="text-xs text-red-500 font-medium">
                {errors.gpshortname.message}
              </p>
            )}
          </div>

          {/* Address */}
          <div className="space-y-2 md:col-span-2">
            <Label
              htmlFor="gpaddress"
              className="text-sm font-semibold text-gray-700"
            >
              GP Address <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <textarea
                id="gpaddress"
                {...register("gpaddress")}
                placeholder="Full address of the Gram Panchayat office..."
                rows={3}
                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500 resize-none transition-all"
              />
            </div>
            {errors.gpaddress && (
              <p className="text-xs text-red-500 font-medium">
                {errors.gpaddress.message}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Subscription & Limits */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-white" />
          <h2 className="text-white font-semibold text-base">
            Subscription & Limits
          </h2>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Subscription Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">
              Subscription Status <span className="text-red-500">*</span>
            </Label>
            <Select
              value={subscriptionStatus}
              onValueChange={(val) =>
                setValue("subscriptionStatus", val as "ACTIVE" | "DEACTIVE")
              }
            >
              <SelectTrigger className="w-full h-11 border-gray-200 focus:ring-blue-500/10">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    <span className="font-medium text-emerald-700">ACTIVE</span>
                  </span>
                </SelectItem>
                <SelectItem value="DEACTIVE">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                    <span className="font-medium text-red-700">DEACTIVE</span>
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[11px] text-gray-500 italic">
              {subscriptionStatus === "ACTIVE"
                ? "GP Admins and staff can log in"
                : "All GP users will be blocked from logging in"}
            </p>
          </div>

          {/* Staff Limit */}
          <div className="space-y-2">
            <Label
              htmlFor="staffLimit"
              className="text-sm font-semibold text-gray-700"
            >
              Staff Limit <span className="text-red-500">*</span>
            </Label>
            <div className="relative group">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
              <Input
                id="staffLimit"
                type="number"
                min={1}
                max={500}
                {...register("staffLimit", { valueAsNumber: true })}
                className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500/10"
                placeholder="10"
              />
            </div>
            {errors.staffLimit && (
              <p className="text-xs text-red-500 font-medium">
                {errors.staffLimit.message}
              </p>
            )}
            <p className="text-[11px] text-gray-500 italic">
              Maximum number of staff users for this GP
            </p>
          </div>
        </div>
      </div>

      {/* Menu Access Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold text-base">
              Menu Access Controls
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-white/20 text-white border-white/30 text-[10px] uppercase tracking-wider px-2"
            >
              {selectedMenus.length} / {menuOptions.length} Selected
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={selectAll}
              className="text-xs h-8 border-gray-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs h-8 border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
            >
              Clear All
            </Button>
          </div>

          <div className="bg-gray-50/50 rounded-xl border border-gray-100 p-4">
            <p className="text-xs text-gray-500 mb-4 font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
              Select sections accessible to GP Admin and Staff
            </p>
            <ScrollArea className="h-[280px] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {menuOptions.map((menuText) => {
                  const isSelected = selectedMenus.includes(menuText);
                  return (
                    <label
                      key={menuText}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                        isSelected
                          ? "bg-white border-indigo-200 shadow-sm ring-1 ring-indigo-50"
                          : "bg-white/50 border-gray-100 hover:border-gray-200 grayscale-[0.5] opacity-70 hover:opacity-100",
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleMenu(menuText)}
                        id={`menu-${menuText}`}
                        className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          isSelected
                            ? "font-semibold text-indigo-900"
                            : "text-gray-600",
                        )}
                      >
                        {menuText}
                      </span>
                    </label>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/superadmindashboard/gp-management")}
          disabled={isLoading}
          className="text-gray-500 hover:text-gray-700"
        >
          Discard Changes
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[160px] h-11 rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Processing...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              {gpId ? (
                <RefreshCw className="w-4 h-4" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              {gpId ? "Update Profile" : "Register GP Now"}
            </span>
          )}
        </Button>
      </div>
    </form>
  );
}
