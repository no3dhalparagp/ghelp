"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { voterSummarySchema } from "@/schema/village-validation";
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

type VoterSummaryFormValues = z.infer<typeof voterSummarySchema>;

interface VoterSummaryFormProps {
  onSubmit: (values: VoterSummaryFormValues) => Promise<void>;
  mouzas: any[];
  defaultValues?: Partial<VoterSummaryFormValues>;
  isSubmitting?: boolean;
  financialYear?: string;
  onFinancialYearChange?: (value: string) => void;
  onMouzaChange?: (value: string) => void;
  isEditing?: boolean;
}

export function VoterSummaryForm({
  onSubmit,
  mouzas,
  defaultValues,
  isSubmitting,
  financialYear,
  onFinancialYearChange,
  onMouzaChange,
  isEditing = false,
}: VoterSummaryFormProps) {
  const form = useForm<VoterSummaryFormValues>({
    resolver: zodResolver(voterSummarySchema),
    defaultValues: {
      financialYear: financialYear ?? "2024-25",
      mouzaId: "",
      totalMaleVoter: 0,
      totalFemaleVoter: 0,
      scMaleVoter: 0,
      scFemaleVoter: 0,
      stMaleVoter: 0,
      stFemaleVoter: 0,
      obcMaleVoter: 0,
      obcFemaleVoter: 0,
      genMaleVoter: 0,
      genFemaleVoter: 0,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        financialYear,
        ...defaultValues,
      });
    }
  }, [defaultValues, financialYear]);

  const values = form.watch();

  useEffect(() => {
    const maleTotal =
      (values.scMaleVoter || 0) +
      (values.stMaleVoter || 0) +
      (values.obcMaleVoter || 0) +
      (values.genMaleVoter || 0);

    const femaleTotal =
      (values.scFemaleVoter || 0) +
      (values.stFemaleVoter || 0) +
      (values.obcFemaleVoter || 0) +
      (values.genFemaleVoter || 0);

    form.setValue("totalMaleVoter", maleTotal);
    form.setValue("totalFemaleVoter", femaleTotal);
  }, [
    values.scMaleVoter,
    values.stMaleVoter,
    values.obcMaleVoter,
    values.genMaleVoter,
    values.scFemaleVoter,
    values.stFemaleVoter,
    values.obcFemaleVoter,
    values.genFemaleVoter,
  ]);

  const numberInput = (field: any) => (
    <Input
      type="number"
      value={field.value}
      onChange={(e) => field.onChange(Number(e.target.value))}
      className="bg-white"
    />
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

        {/* HEADER */}
        <div className="grid md:grid-cols-2 gap-6 p-4 bg-blue-50 border rounded-xl">
          <FormField
            control={form.control}
            name="financialYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
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
                      <SelectValue placeholder="Select year" />
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
                <FormLabel className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
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
                      <SelectValue placeholder="Select mouza" />
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
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b pb-2">
            <Users className="w-5 h-5 text-gray-500" />
            <h3 className="font-bold text-gray-700 uppercase text-sm">
              Overall Totals (Auto Calculated)
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="totalMaleVoter"
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
              name="totalFemaleVoter"
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
          { label: "SC", male: "scMaleVoter", female: "scFemaleVoter" },
          { label: "ST", male: "stMaleVoter", female: "stFemaleVoter" },
          { label: "OBC", male: "obcMaleVoter", female: "obcFemaleVoter" },
          { label: "GENERAL", male: "genMaleVoter", female: "genFemaleVoter" },
        ].map((c) => (
          <div key={c.label} className="p-4 border rounded-lg space-y-4">
            <h3 className="font-bold text-gray-600">{c.label} Voters</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name={c.male as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Male</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={c.female as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Female</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        ))}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
        >
          {isSubmitting ? "Saving..." : "Save Voter Summary"}
        </Button>
      </form>
    </Form>
  );
}
