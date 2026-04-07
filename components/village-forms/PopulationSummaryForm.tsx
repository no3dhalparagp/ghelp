/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { populationSummarySchema } from "@/schema/village-validation";
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
import { Calendar, MapPin, Users } from "lucide-react";
import { useEffect } from "react";

type PopulationSummaryFormValues = z.infer<typeof populationSummarySchema>;

interface PopulationSummaryFormProps {
  onSubmit: (values: PopulationSummaryFormValues) => Promise<void>;
  mouzas: any[];
  defaultValues?: Partial<PopulationSummaryFormValues>;
  isSubmitting?: boolean;
  financialYear?: string;
  onFinancialYearChange?: (value: string) => void;
  onMouzaChange?: (value: string) => void;
  isEditing?: boolean;
}

export function PopulationSummaryForm({
  onSubmit,
  mouzas,
  defaultValues,
  isSubmitting,
  financialYear,
  onFinancialYearChange,
  onMouzaChange,
  isEditing = false,
}: PopulationSummaryFormProps) {
  const form = useForm<PopulationSummaryFormValues>({
    resolver: zodResolver(populationSummarySchema),
    defaultValues: {
      financialYear: financialYear ?? "2024-25",
      mouzaId: "",
      totalMale: 0,
      totalFemale: 0,
      scMale: 0,
      scFemale: 0,
      stMale: 0,
      stFemale: 0,
      obcMale: 0,
      obcFemale: 0,
      genMale: 0,
      genFemale: 0,
      ...defaultValues,
    },
  });

  // RESET FIX
  useEffect(() => {
    if (defaultValues) {
      form.reset({
        financialYear,
        ...defaultValues,
      });
    }
  }, [defaultValues, financialYear, form]);

  const values = form.watch();

  // AUTO TOTAL CALCULATION (Govt mandatory)
  useEffect(() => {
    const maleTotal =
      (values.scMale || 0) +
      (values.stMale || 0) +
      (values.obcMale || 0) +
      (values.genMale || 0);

    const femaleTotal =
      (values.scFemale || 0) +
      (values.stFemale || 0) +
      (values.obcFemale || 0) +
      (values.genFemale || 0);

    form.setValue("totalMale", maleTotal);
    form.setValue("totalFemale", femaleTotal);
  }, [
    values.scMale,
    values.stMale,
    values.obcMale,
    values.genMale,
    values.scFemale,
    values.stFemale,
    values.obcFemale,
    values.genFemale,
  ]);

  const numberInput = (field: any) => (
    <Input
      type="number"
      value={field.value}
      onChange={(e) => field.onChange(Number(e.target.value))}
      className="bg-gray-50/30"
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* HEADER */}
        <div className="grid md:grid-cols-2 gap-8 p-6 bg-indigo-50/20 rounded-2xl border border-indigo-100 shadow-sm">
          <FormField
            control={form.control}
            name="financialYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex gap-2 items-center">
                  <Calendar className="h-4 w-4 text-indigo-500" />
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
                <FormLabel className="flex gap-2 items-center">
                  <MapPin className="h-4 w-4 text-indigo-500" />
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

        {/* TOTAL */}
        <div className="space-y-6">
          <div className="flex items-center gap-2 border-b pb-2">
            <Users className="h-5 w-5 text-gray-400" />
            <h3 className="font-bold text-gray-700 uppercase text-xs tracking-widest">
              Aggregate Totals (Auto Calculated)
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="totalMale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Male</FormLabel>
                  <FormControl>
                    <Input disabled value={field.value} />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="totalFemale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Female</FormLabel>
                  <FormControl>
                    <Input disabled value={field.value} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* CATEGORY */}
        {[
          { label: "SC Population", male: "scMale", female: "scFemale" },
          { label: "ST Population", male: "stMale", female: "stFemale" },
          { label: "OBC Population", male: "obcMale", female: "obcFemale" },
          { label: "General Population", male: "genMale", female: "genFemale" },
        ].map((cat) => (
          <div key={cat.label} className="p-5 border rounded-xl space-y-4">
            <h4 className="font-bold text-indigo-600">{cat.label}</h4>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={cat.male as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Male</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={cat.female as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Female</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {isSubmitting ? "Saving..." : "Save Summary"}
        </Button>
      </form>
    </Form>
  );
}
