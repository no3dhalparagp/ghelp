"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createGPAdminUser } from "@/action/gp-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  gpProfileId: z.string(),
});

type FormValues = z.infer<typeof schema>;

function generatePassword() {
  const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#!";
  return Array.from({ length: 12 }, () =>
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join("");
}

interface CreateGpAdminFormProps {
  gpProfileId: string;
  gpName: string;
}

export default function CreateGpAdminForm({ gpProfileId, gpName }: CreateGpAdminFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [createdUser, setCreatedUser] = useState<{ name: string; email: string; password: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      mobileNumber: "",
      password: "",
      gpProfileId,
    },
  });

  const password = watch("password");

  const handleGeneratePassword = () => {
    const pwd = generatePassword();
    setValue("password", pwd);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const onSubmit = (data: FormValues) => {
    startTransition(async () => {
      try {
        const result = await createGPAdminUser(data);
        if (result.success) {
          toast.success(result.message ?? "Admin created successfully!");
          setCreatedUser({ name: data.name, email: data.email, password: data.password });
        } else {
          const msg = result.message ?? "Failed to create admin user. Check console for details.";
          toast.error(msg);
          console.error("[CreateGpAdminForm] error:", result);
        }
      } catch (err) {
        console.error("[CreateGpAdminForm] unexpected error:", err);
        toast.error("An unexpected error occurred. Please try again.");
      }
    });
  };

  // Success screen
  if (createdUser) {
    return (
      <div className="max-w-xl mx-auto py-8">
        <div className="bg-white rounded-[2rem] border border-emerald-100 shadow-xl shadow-emerald-500/5 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 py-10 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-white/30">
                <ShieldCheck className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white font-black text-3xl tracking-tight">Admin Created!</h2>
              <p className="text-emerald-50/80 text-sm mt-3 max-w-xs mx-auto leading-relaxed">
                Super admin credentials for <span className="font-bold text-white underline underline-offset-4">{gpName}</span> have been generated.
              </p>
            </div>
          </div>

          <div className="p-8 space-y-6">
            <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center shrink-0">
                <span className="text-lg">⚠️</span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed font-medium">
                Please share these credentials securely. For security reasons, the password will not be shown again after you leave this page.
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Full Name", value: createdUser.name, icon: User },
                { label: "Email Address", value: createdUser.email, icon: Mail },
                { label: "Access Password", value: createdUser.password, icon: Lock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="group relative bg-gray-50/50 hover:bg-white border border-gray-100 hover:border-emerald-200 rounded-2xl p-4 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-emerald-500 group-hover:border-emerald-100 transition-colors shadow-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold mb-0.5">{label}</p>
                        <p className="text-sm font-mono font-bold text-gray-900 break-all">{value}</p>
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => copyToClipboard(value)}
                      className="h-10 w-10 rounded-xl text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all active:scale-90"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold"
                onClick={() => router.push(`/superadmindashboard/gp-management`)}
              >
                Exit to GP List
              </Button>
              <Button
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                onClick={() => setCreatedUser(null)}
              >
                Create Another
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-xl mx-auto space-y-6">
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-xl shadow-indigo-500/5 overflow-hidden">
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-8 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          
          <div className="relative z-10 flex items-center gap-5">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/30">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-white font-black text-2xl tracking-tight">Create GP Admin</h2>
              <p className="text-indigo-100/80 text-xs mt-1 font-medium">Setting up access for {gpName}</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-gray-700 ml-1">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="e.g. Rahul Sharma"
                  className="pl-11 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              {errors.name && <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.name.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="admin@gpname.gov.in"
                  className="pl-11 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all"
                />
              </div>
              {errors.email && <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.email.message}</p>}
            </div>

            {/* Mobile */}
            <div className="space-y-2">
              <Label htmlFor="mobileNumber" className="text-sm font-bold text-gray-700 ml-1">
                Mobile Number <span className="text-red-500">*</span>
              </Label>
              <div className="relative group">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <Input
                  id="mobileNumber"
                  {...register("mobileNumber")}
                  placeholder="10-digit mobile number"
                  className="pl-11 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all"
                  maxLength={10}
                />
              </div>
              {errors.mobileNumber && (
                <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.mobileNumber.message}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">
                Access Password <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Min. 6 characters"
                    className="pl-11 pr-12 h-12 rounded-xl border-gray-200 focus:border-indigo-500 focus:ring-indigo-500/10 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-indigo-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleGeneratePassword}
                  className="h-12 w-12 rounded-xl border-gray-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-95"
                  title="Auto-generate"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              {errors.password && (
                <p className="text-[11px] text-red-500 font-semibold ml-1">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
            <h4 className="text-[11px] uppercase tracking-wider text-indigo-900 font-black mb-2 flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin" /> Next Steps
            </h4>
            <ul className="space-y-2">
              {[
                "Account will have full administrative rights",
                "Email verification is bypassed automatically",
                "Access depends on GP subscription status"
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-indigo-700 font-medium">
                  <div className="w-1 h-1 rounded-full bg-indigo-400" />
                  {text}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              className="flex-1 h-12 rounded-xl text-gray-500 font-semibold hover:bg-gray-50"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98]"
            >
              {isPending ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  Create Access Now
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
