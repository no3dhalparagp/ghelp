"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { populationSchema } from "@/schema/village-validation";
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
import { Calendar, MapPin } from "lucide-react";
import { useEffect } from "react";

type PopulationFormValues = z.infer<typeof populationSchema>;

interface PopulationFormProps {
  onSubmit: (values: PopulationFormValues) => Promise<void>;
  mouzas: any[];
  defaultValues?: Partial<PopulationFormValues>;
  isSubmitting?: boolean;
  financialYear?: string;
  onFinancialYearChange?: (value: string) => void;
  isEditing?: boolean;
}

export function PopulationForm({
  onSubmit,
  mouzas,
  defaultValues,
  isSubmitting,
  financialYear,
  onFinancialYearChange,
  isEditing = false,
}: PopulationFormProps) {
  const form = useForm<PopulationFormValues>({
    resolver: zodResolver(populationSchema),
    defaultValues: {
      financialYear: financialYear ?? "2024-25",
      mouzaId: "",
      male: 0,
      female: 0,
      st: 0,
      sc: 0,
      obc: 0,
      other: 0,
      hindu: 0,
      muslim: 0,
      christian: 0,
      otherReligion: 0,
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
  }, [defaultValues, financialYear, form]);

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
        <div className="grid md:grid-cols-2 gap-6 p-4 bg-emerald-50 border rounded-xl">
          <FormField
            control={form.control}
            name="financialYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
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
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  Mouza
                </FormLabel>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
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

        {/* GENDER */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-bold text-gray-700">Gender Distribution</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="male"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Male</FormLabel>
                  <FormControl>{numberInput(field)}</FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="female"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Female</FormLabel>
                  <FormControl>{numberInput(field)}</FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* CASTE */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-bold text-gray-700">Caste Category</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["sc", "st", "obc", "other"].map((c) => (
              <FormField
                key={c}
                control={form.control}
                name={c as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="uppercase">{c}</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* RELIGION */}
        <div className="p-4 border rounded-lg space-y-4">
          <h3 className="font-bold text-gray-700">Religious Distribution</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {["hindu", "muslim", "christian", "otherReligion"].map((r) => (
              <FormField
                key={r}
                control={form.control}
                name={r as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{r}</FormLabel>
                    <FormControl>{numberInput(field)}</FormControl>
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
        >
          {isSubmitting ? "Saving..." : "Save Population"}
        </Button>
      </form>
    </Form>
  );
}
