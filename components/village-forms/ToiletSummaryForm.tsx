"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toiletSummarySchema } from "@/schema/village-validation";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, Home, CheckCircle2, XCircle } from "lucide-react";
import { useEffect } from "react";

type ToiletSummaryFormValues = z.infer<typeof toiletSummarySchema>;

interface ToiletSummaryFormProps {
  onSubmit: (values: ToiletSummaryFormValues) => Promise<void>;
  mouzas: any[];
  defaultValues?: Partial<ToiletSummaryFormValues>;
  isSubmitting?: boolean;
  financialYear?: string;
  onFinancialYearChange?: (value: string) => void;
  onMouzaChange?: (value: string) => void;
  isEditing?: boolean;
}

export function ToiletSummaryForm({
  onSubmit,
  mouzas,
  defaultValues,
  isSubmitting,
  financialYear,
  onFinancialYearChange,
  onMouzaChange,
  isEditing = false,
}: ToiletSummaryFormProps) {
  const form = useForm<ToiletSummaryFormValues>({
    resolver: zodResolver(toiletSummarySchema),
    defaultValues: {
      financialYear: financialYear ?? "2024-25",
      mouzaId: "",
      totalHousehold: 0,
      toiletAvailable: 0,
      toiletNotAvailable: 0,
      ...defaultValues,
    },
  });

  // reset fix
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        financialYear,
        ...defaultValues,
      });
    }
  }, [defaultValues, financialYear, form]);

  const values = form.watch();

  // auto total calculation
  useEffect(() => {
    const total =
      (values.toiletAvailable || 0) + (values.toiletNotAvailable || 0);

    form.setValue("totalHousehold", total);
  }, [form, values.toiletAvailable, values.toiletNotAvailable]);

  const numberInput = (field: any) => (
    <Input
      type="number"
      value={field.value}
      onChange={(e) => field.onChange(Number(e.target.value))}
      className="h-14 text-2xl font-bold border-none bg-gray-50 focus:bg-white transition-all"
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* HEADER */}
        <div className="grid md:grid-cols-2 gap-8 p-6 bg-white rounded-2xl border border-rose-100 shadow-sm">
          <FormField
            control={form.control}
            name="financialYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex gap-2 items-center font-bold">
                  <Calendar className="h-4 w-4 text-rose-500" />
                  Financial Year
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    onFinancialYearChange?.(v);
                  }}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Year" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="2023-24">2023-24</SelectItem>
                    <SelectItem value="2024-25">2024-25</SelectItem>
                    <SelectItem value="2025-26">2025-26</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="mouzaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex gap-2 items-center font-bold">
                  <MapPin className="h-4 w-4 text-rose-500" />
                  Mouza
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(v) => {
                    field.onChange(v);
                    onMouzaChange?.(v);
                  }}
                  disabled={isEditing}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Mouza" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mouzas.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>

        {/* CARDS */}
        <div className="grid md:grid-cols-3 gap-8">
          <FormField
            control={form.control}
            name="totalHousehold"
            render={({ field }) => (
              <FormItem className="p-6 border rounded-xl">
                <FormLabel className="flex items-center gap-2 font-bold">
                  <Home className="h-5 w-5 text-rose-600" />
                  Total Household (Auto)
                </FormLabel>
                <FormControl>
                  <Input disabled value={field.value} />
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toiletAvailable"
            render={({ field }) => (
              <FormItem className="p-6 border rounded-xl">
                <FormLabel className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  Toilet Available
                </FormLabel>
                <FormControl>{numberInput(field)}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="toiletNotAvailable"
            render={({ field }) => (
              <FormItem className="p-6 border rounded-xl">
                <FormLabel className="flex items-center gap-2 font-bold">
                  <XCircle className="h-5 w-5 text-amber-600" />
                  Toilet Not Available
                </FormLabel>
                <FormControl>{numberInput(field)}</FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-rose-600 hover:bg-rose-700 text-white h-14 text-lg font-bold"
        >
          {isSubmitting ? "Saving..." : "Save Sanitation Record"}
        </Button>
      </form>
    </Form>
  );
}
