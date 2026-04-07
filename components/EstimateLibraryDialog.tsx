"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Loader2, LayoutGrid, List, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// --- Types and constants (unchanged) ---
interface EstimateType {
  id: string;
  name: string;
  code: string;
}

interface ScheduleRate {
  id: string;
  code: string;
  description: string;
  unit: string;
  rate: number;
  category: string;
  subItems?: any[];
}

interface EstimateLibraryDialogProps {
  onAddItems: (items: any[]) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

interface NewItemFormData {
  code: string;
  description: string;
  unit: string;
  rate: string;
  category: string;
}

const UNIT_OPTIONS = [
  { value: "m", label: "Meter (m)" },
  { value: "sqm", label: "Square Meter (sqm)" },
  { value: "cum", label: "Cubic Meter (cum)" },
  { value: "no", label: "Number (no)" },
  { value: "each", label: "Each" },
  { value: "kg", label: "Kilogram (kg)" },
  { value: "l", label: "Liter (l)" },
  { value: "hr", label: "Hour (hr)" },
  { value: "day", label: "Day" },
];

const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`;

// --- Skeleton loaders (unchanged) ---
const TableSkeleton = () => (
  <>
    {[...Array(5)].map((_, i) => (
      <TableRow key={i}>
        <TableCell><div className="h-4 w-4 bg-muted animate-pulse rounded" /></TableCell>
        <TableCell><div className="h-4 w-16 bg-muted animate-pulse rounded" /></TableCell>
        <TableCell><div className="h-4 w-48 bg-muted animate-pulse rounded" /></TableCell>
        <TableCell><div className="h-4 w-12 bg-muted animate-pulse rounded" /></TableCell>
        <TableCell><div className="h-4 w-20 bg-muted animate-pulse rounded ml-auto" /></TableCell>
        <TableCell><div className="h-8 w-8 bg-muted animate-pulse rounded" /></TableCell>
      </TableRow>
    ))}
  </>
);

const CardSkeleton = () => (
  <div className="flex flex-col space-y-3 p-4 border rounded-xl bg-card">
    <div className="h-5 w-24 bg-muted animate-pulse rounded" />
    <div className="h-4 w-32 bg-muted animate-pulse rounded" />
    <div className="h-4 w-20 bg-muted animate-pulse rounded" />
    <div className="flex justify-between items-center mt-2">
      <div className="h-6 w-16 bg-muted animate-pulse rounded" />
      <div className="h-8 w-8 bg-muted animate-pulse rounded" />
    </div>
  </div>
);

// --- Empty state (unchanged) ---
const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="bg-muted/50 rounded-full p-4 mb-4">
      <Search className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium">No items found</h3>
    <p className="text-sm text-muted-foreground mt-1">
      Try adjusting your search or filter, or create a new item.
    </p>
    <Button variant="outline" className="mt-4" onClick={onCreate}>
      <Plus className="h-4 w-4 mr-2" />
      Create new item
    </Button>
  </div>
);

export default function EstimateLibraryDialog({
  onAddItems,
  open: controlledOpen,
  onOpenChange: setControlledOpen,
  trigger,
}: EstimateLibraryDialogProps) {
  // --- State (unchanged) ---
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? setControlledOpen! : setInternalOpen;

  const [types, setTypes] = useState<EstimateType[]>([]);
  const [selectedType, setSelectedType] = useState<string>("");
  const [rates, setRates] = useState<ScheduleRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");

  const [activeTab, setActiveTab] = useState<"library" | "create">("library");

  const [newItem, setNewItem] = useState<NewItemFormData>({
    code: "",
    description: "",
    unit: "m",
    rate: "",
    category: "General",
  });

  const [formErrors, setFormErrors] = useState<
    Partial<Record<keyof NewItemFormData, string>>
  >({});

  const { toast } = useToast();

  // --- Data fetching (unchanged) ---
  const fetchTypes = useCallback(async () => {
    try {
      const res = await fetch("/api/development-works/estimate-types");
      if (res.ok) {
        const data = await res.json();
        const typesData = Array.isArray(data) ? data : [];
        setTypes(typesData);
        if (typesData.length > 0 && !selectedType) {
          setSelectedType(typesData[0].id);
        }
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load estimate types",
        variant: "destructive",
      });
    }
  }, [selectedType, toast]);

  const fetchRates = useCallback(async () => {
    if (!selectedType) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        estimateTypeId: selectedType,
      });

      if (search.trim()) params.append("search", search.trim());
      if (categoryFilter !== "all") params.append("category", categoryFilter);

      const res = await fetch(
        `/api/development-works/schedule-rates?${params.toString()}`
      );

      if (res.ok) {
        const data = await res.json();
        setRates(data);
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to load schedule rates",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedType, search, categoryFilter, toast]);

  useEffect(() => {
    if (open) fetchTypes();
  }, [open, fetchTypes]);

  useEffect(() => {
    const timer = setTimeout(fetchRates, 300);
    return () => clearTimeout(timer);
  }, [fetchRates]);

  const categories = useMemo(() => {
    const cats = new Set(rates.map((r) => r.category).filter(Boolean));
    return Array.from(cats);
  }, [rates]);

  // --- Selection handlers (unchanged) ---
  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const set = new Set(prev);
      set.has(id) ? set.delete(id) : set.add(id);
      return set;
    });
  };

  const toggleSelectAll = () => {
    if (selectedItems.size === rates.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(rates.map((r) => r.id)));
    }
  };

  const handleAddSelected = () => {
    const items = rates
      .filter((r) => selectedItems.has(r.id))
      .map((r) => ({
        schedulePageNo: r.code,
        description: r.description,
        unit: r.unit,
        rate: r.rate,
        quantity: 0,
        amount: 0,
        measurements: [],
        subItems: r.subItems || [],
        nos: 1,
        length: 0,
        breadth: 0,
        depth: 0,
      }));

    onAddItems(items);
    toast({
      title: "Items Added",
      description: `${items.length} item(s) added`,
    });
    setOpen(false);
    setSelectedItems(new Set());
  };

  const handleAddSingle = (rate: ScheduleRate) => {
    onAddItems([
      {
        schedulePageNo: rate.code,
        description: rate.description,
        unit: rate.unit,
        rate: rate.rate,
        quantity: 0,
        amount: 0,
        measurements: [],
        subItems: rate.subItems || [],
        nos: 1,
        length: 0,
        breadth: 0,
        depth: 0,
      },
    ]);

    toast({
      title: "Item Added",
      description: `${rate.code} added`,
    });
  };

  // --- Form validation and creation (unchanged) ---
  const validateForm = () => {
    const errors: any = {};
    if (!newItem.code.trim()) errors.code = "Required";
    if (!newItem.description.trim()) errors.description = "Required";
    if (!newItem.rate || parseFloat(newItem.rate) < 0) errors.rate = "Invalid rate";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateItem = async () => {
    if (!validateForm()) return;

    try {
      const res = await fetch("/api/development-works/schedule-rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estimateTypeId: selectedType,
          ...newItem,
          rate: parseFloat(newItem.rate),
        }),
      });

      if (res.ok) {
        toast({ title: "Success", description: "Item created" });
        setActiveTab("library");
        setNewItem({
          code: "",
          description: "",
          unit: "m",
          rate: "",
          category: "General",
        });
        fetchRates();
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to create item",
        variant: "destructive",
      });
    }
  };

  // --- Responsive sidebar: hide on mobile, show select ---
  const currentTypeName = types.find(t => t.id === selectedType)?.name || "Select type";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Select from Library
            </Button>
          )}
        </DialogTrigger>
      )}

      <DialogContent className="max-w-7xl h-[92vh] p-0 overflow-hidden rounded-2xl sm:max-w-[95vw] md:max-w-7xl">
        <div className="flex flex-col md:flex-row h-full">

          {/* Sidebar - hidden on mobile, visible from md up */}
          <div className="hidden md:block w-64 lg:w-72 border-r bg-muted/30 p-5 flex-shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-muted-foreground">
                ESTIMATE TYPES
              </h3>
              <Badge variant="outline" className="text-xs">
                {types.length}
              </Badge>
            </div>
            <ScrollArea className="h-[calc(100%-2rem)]">
              <div className="space-y-1">
                {types.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl transition-all duration-200",
                      selectedType === type.id
                        ? "bg-primary/10 border border-primary/40 shadow-sm"
                        : "hover:bg-muted/80"
                    )}
                  >
                    <div className="font-medium text-sm flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        selectedType === type.id ? "bg-primary" : "bg-muted-foreground/30"
                      )} />
                      {type.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {type.code}
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* Header */}
            <div className="px-4 sm:px-6 py-4 border-b bg-white sticky top-0 z-10">
              <h2 className="text-xl font-semibold tracking-tight">
                Estimate Item Library
              </h2>
              <p className="text-sm text-muted-foreground">
                Browse, search, and add schedule items
              </p>
            </div>

            {/* Mobile type selector */}
            <div className="md:hidden px-4 pt-4">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select estimate type" />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name} ({type.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "library" | "create")}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 sm:px-6 pt-4 border-b">
                <TabsList className="grid w-[200px] grid-cols-2">
                  <TabsTrigger value="library">Library</TabsTrigger>
                  <TabsTrigger value="create">Create New</TabsTrigger>
                </TabsList>
              </div>

              {/* Library Tab */}
              <TabsContent value="library" className="flex-1 flex flex-col overflow-hidden mt-0">
                {/* Toolbar - responsive wrap */}
                <div className="px-4 sm:px-6 py-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center border-b bg-muted/5">
                  <div className="relative flex-1 w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by code or description..."
                      className="pl-9 w-full"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center gap-1 border rounded-md p-1">
                      <Button
                        variant={viewMode === "table" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setViewMode("table")}
                      >
                        <List className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "cards" ? "default" : "ghost"}
                        size="sm"
                        className="h-8 px-2"
                        onClick={() => setViewMode("cards")}
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Items Display */}
                <div className="flex-1 px-4 sm:px-6 py-4 overflow-hidden">
                  <ScrollArea className="h-full">
                    {loading ? (
                      viewMode === "table" ? (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-12"><Checkbox disabled /></TableHead>
                                <TableHead>Code</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right">Rate (₹)</TableHead>
                                <TableHead className="w-12" />
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              <TableSkeleton />
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {[...Array(6)].map((_, i) => (
                            <CardSkeleton key={i} />
                          ))}
                        </div>
                      )
                    ) : rates.length === 0 ? (
                      <EmptyState onCreate={() => setActiveTab("create")} />
                    ) : viewMode === "table" ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead className="w-12">
                                <Checkbox
                                  checked={rates.length > 0 && selectedItems.size === rates.length}
                                  onCheckedChange={toggleSelectAll}
                                />
                              </TableHead>
                              <TableHead>Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Unit</TableHead>
                              <TableHead className="text-right">Rate (₹)</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {rates.map((rate) => (
                              <TableRow
                                key={rate.id}
                                className={cn(
                                  "group transition-colors",
                                  selectedItems.has(rate.id) && "bg-primary/5"
                                )}
                              >
                                <TableCell>
                                  <Checkbox
                                    checked={selectedItems.has(rate.id)}
                                    onCheckedChange={() => toggleSelection(rate.id)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="font-mono text-xs">
                                    {rate.code}
                                  </Badge>
                                </TableCell>
                                <TableCell className="max-w-md truncate">
                                  {rate.description}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="font-mono">
                                    {rate.unit}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium">
                                  {formatCurrency(rate.rate)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleAddSingle(rate)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rates.map((rate) => (
                          <Card
                            key={rate.id}
                            className={cn(
                              "transition-all hover:shadow-md cursor-pointer",
                              selectedItems.has(rate.id) && "border-primary bg-primary/5"
                            )}
                            onClick={() => toggleSelection(rate.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <Badge variant="outline" className="font-mono">
                                    {rate.code}
                                  </Badge>
                                  <h3 className="font-medium mt-2 line-clamp-2">
                                    {rate.description}
                                  </h3>
                                </div>
                                <Checkbox
                                  checked={selectedItems.has(rate.id)}
                                  onCheckedChange={() => toggleSelection(rate.id)}
                                />
                              </div>
                              <div className="flex justify-between items-center mt-4">
                                <Badge variant="secondary">{rate.unit}</Badge>
                                <span className="font-mono font-bold text-primary">
                                  {formatCurrency(rate.rate)}
                                </span>
                              </div>
                            </CardContent>
                            <CardFooter className="p-4 pt-0 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddSingle(rate);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </div>

                {/* Footer */}
                <div className="px-4 sm:px-6 py-4 border-t flex justify-between items-center bg-muted/10">
                  <span className="text-sm text-muted-foreground">
                    {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} selected
                  </span>
                  <Button
                    disabled={selectedItems.size === 0}
                    onClick={handleAddSelected}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Selected ({selectedItems.size})
                  </Button>
                </div>
              </TabsContent>

              {/* Create New Tab */}
              <TabsContent value="create" className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
                <div className="max-w-2xl mx-auto space-y-6">
                  <div>
                    <h3 className="text-lg font-medium">Create New Schedule Item</h3>
                    <p className="text-sm text-muted-foreground">
                      Fill in the details to add a new rate to the library.
                    </p>
                  </div>
                  <Separator />
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="code">Item Code *</Label>
                      <Input
                        id="code"
                        value={newItem.code}
                        onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                        className={cn(formErrors.code && "border-destructive")}
                      />
                      {formErrors.code && (
                        <p className="text-xs text-destructive mt-1">{formErrors.code}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Input
                        id="description"
                        value={newItem.description}
                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                        className={cn(formErrors.description && "border-destructive")}
                      />
                      {formErrors.description && (
                        <p className="text-xs text-destructive mt-1">{formErrors.description}</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="unit">Unit *</Label>
                        <Select
                          value={newItem.unit}
                          onValueChange={(val) => setNewItem({ ...newItem, unit: val })}
                        >
                          <SelectTrigger id="unit">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {UNIT_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="rate">Rate (₹) *</Label>
                        <Input
                          id="rate"
                          type="number"
                          step="0.01"
                          value={newItem.rate}
                          onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
                          className={cn(formErrors.rate && "border-destructive")}
                        />
                        {formErrors.rate && (
                          <p className="text-xs text-destructive mt-1">{formErrors.rate}</p>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={newItem.category}
                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                        placeholder="e.g., Excavation, Concrete, Finishing"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={() => setActiveTab("library")}>
                      Cancel
                    </Button>
                    <Button onClick={handleCreateItem}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Item
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
