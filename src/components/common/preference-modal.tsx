'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Search, ChevronRight } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  phaseDisplayMap,
  statusDisplayMap,
  StudyPhase,
  StudyStatus,
  THERAPEUTIC_AREAS,
} from '@/types/clinical-trials/filters';
import { SearchForm } from '@/types/common/form';

// Define preference schema
const PreferenceSchema = z.object({
  phase: z
    .array(z.enum(Object.keys(phaseDisplayMap) as [string, ...string[]]))
    .optional(),
  status: z
    .array(z.enum(Object.keys(statusDisplayMap) as [string, ...string[]]))
    .optional(),
  therapeuticArea: z.array(z.string()).optional(),
});

export default function PreferenceModal({
  isOpen,
  onClose,
  onSave,
  forceOpen = false,
  initialPreferences
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPreferences: Partial<SearchForm>) => void;
  forceOpen?: boolean;
  initialPreferences?: Partial<SearchForm>;
}): React.JSX.Element | null {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('phase');
  const [therapeuticAreaSearch, setTherapeuticAreaSearch] = useState('');

  const form = useForm<Partial<SearchForm>>({
    resolver: zodResolver(PreferenceSchema),
    defaultValues: {
      phase: initialPreferences?.phase || [],
      status: initialPreferences?.status || [],
      therapeuticArea: initialPreferences?.therapeuticArea || [],
    },
  });

  // Update form values when initialPreferences changes
  React.useEffect(() => {
    if (initialPreferences) {
      form.reset({
        phase: initialPreferences.phase || [],
        status: initialPreferences.status || [],
        therapeuticArea: initialPreferences.therapeuticArea || [],
      });
    }
  }, [initialPreferences, form]);

  // Handle close attempts - if forceOpen is true, don't allow closing
  const handleClose = () => {
    if (!forceOpen) {
      onClose();
    }
  };

  const handleSelectAll = (
    fieldName: keyof Partial<SearchForm>,
    options: Array<[string, string]> | Array<{ value: string; label: string }>,
    checked: boolean
  ): void => {
    form.setValue(
      fieldName,
      checked
        ? options.map((opt) => (Array.isArray(opt) ? opt[0] : opt.value))
        : []
    );
  };

  const handleRemoveSelected = (
    fieldName: keyof Partial<SearchForm>,
    value: string
  ): void => {
    const currentValues = form.getValues(fieldName);
    const valueArray = Array.isArray(currentValues) ? currentValues : [];
    form.setValue(
      fieldName,
      valueArray.filter((v: string) => v !== value)
    );
  };

  const onSubmit = (data: Partial<SearchForm>): void => {
    if (!user) {
      return;
    }
    
    // Make sure we're sending non-empty preferences for new users
    const hasSelections = 
      (data.phase && data.phase.length > 0) || 
      (data.status && data.status.length > 0) || 
      (data.therapeuticArea && data.therapeuticArea.length > 0);
    
    if (forceOpen && !hasSelections) {
      // For new users with forced modal, ensure they select at least one preference
      // Add default selections for new users
      console.log("[PREFERENCES MODAL] Adding default preferences for new user");
      data.phase = ['PHASE1', 'PHASE2', 'PHASE3'] as StudyPhase[];
      data.status = ['RECRUITING', 'NOT_YET_RECRUITING'] as StudyStatus[];
    }
    
    console.log("[PREFERENCES MODAL] Saving preferences:", data);
    onSave(data);
    
    // Only allow closing if not forceOpen or if user has made selections
    if (!forceOpen || hasSelections) {
      onClose();
    }
  };

  const getSelectionCountText = (fieldName: keyof Partial<SearchForm>, totalCount: number): string => {
    const currentValues = form.getValues(fieldName);
    const valueArray = Array.isArray(currentValues) ? currentValues : [];
    return valueArray.length ? `${valueArray.length} selected` : 'None selected';
  };

  const filteredTherapeuticAreas = therapeuticAreaSearch
    ? THERAPEUTIC_AREAS.filter(area => 
        area.label.toLowerCase().includes(therapeuticAreaSearch.toLowerCase()))
    : THERAPEUTIC_AREAS;

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] flex flex-col bg-white dark:bg-gray-950"
        onEscapeKeyDown={(e) => forceOpen && e.preventDefault()} 
        onPointerDownOutside={(e) => forceOpen && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-purple-600">
            Study Preferences
          </DialogTitle>
          <DialogDescription className="text-gray-600 dark:text-gray-400 text-base">
            Customize your preferences to find the most relevant clinical studies for your needs.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-4">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-lg mb-6">
            {[
              { id: 'phase', label: 'Study Phases', color: 'text-purple-600' },
              { id: 'status', label: 'Study Status', color: 'text-gray-600' },
              { id: 'therapeuticArea', label: 'Therapeutic Areas', color: 'text-gray-600' }
            ].map((tab, index, array) => (
              <React.Fragment key={tab.id}>
                <div className="relative group">
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-start space-y-1 ${
                      activeTab === tab.id ? tab.color : 'text-gray-600'
                    }`}
                  >
                    <span className={`text-base font-medium ${
                      activeTab === tab.id ? 'text-purple-600' : 'text-gray-900'
                    }`}>
                      {tab.label}
                    </span>
                    <Badge 
                      variant="secondary" 
                      className={`
                        text-xs px-2 py-0.5 
                        ${activeTab === tab.id 
                          ? 'bg-purple-100 text-purple-600' 
                          : 'bg-gray-200 text-gray-600'
                        }
                      `}
                    >
                      {getSelectionCountText(tab.id as keyof Partial<SearchForm>, 
                        tab.id === 'therapeuticArea' 
                          ? THERAPEUTIC_AREAS.length 
                          : Object.keys(tab.id === 'phase' ? phaseDisplayMap : statusDisplayMap).length
                      )}
                    </Badge>
                  </button>
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-purple-600" />
                  )}
                </div>
                {index < array.length - 1 && (
                  <ChevronRight className="h-6 w-6 text-gray-400 flex-shrink-0" />
                )}
              </React.Fragment>
            ))}
          </div>

          <Form {...form}>
            {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <ScrollArea className="h-[350px] pr-4">
                <TabsContent value="phase" className="mt-0 space-y-4">
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Study Phases
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Select the clinical trial phases you're interested in.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="phase"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSelectAll(
                                  'phase',
                                  Object.entries(phaseDisplayMap),
                                  field.value?.length !== Object.keys(phaseDisplayMap).length
                                )}
                              >
                                {field.value?.length === Object.keys(phaseDisplayMap).length
                                  ? "Deselect All"
                                  : "Select All"}
                              </Button>
                            </div>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(phaseDisplayMap).map(
                                  ([value, label]) => (
                                    <div key={value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-muted/50 transition-colors">
                                      <Checkbox
                                        id={`phase-${value}`}
                                        checked={field.value?.includes(value as StudyPhase)}
                                        onCheckedChange={(checked) =>
                                          Boolean(checked)
                                            ? field.onChange([
                                                ...(field.value ?? []),
                                                value as StudyPhase,
                                              ])
                                            : field.onChange(
                                                field.value?.filter((v) => v !== (value as StudyPhase))
                                              )
                                        }
                                      />
                                      <label 
                                        htmlFor={`phase-${value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {label}
                                      </label>
                                    </div>
                                  )
                                )}
                              </div>
                            </FormControl>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {field.value?.map((selectedValue) => (
                                <Badge
                                  key={selectedValue}
                                  variant="secondary"
                                  className="flex items-center gap-1 py-1"
                                >
                                  {phaseDisplayMap[selectedValue]}
                                  <button
                                    type="button"
                                    className="ml-1 hover:bg-muted rounded-full h-4 w-4 inline-flex items-center justify-center"
                                    onClick={() =>
                                      handleRemoveSelected('phase', selectedValue)
                                    }
                                  >
                                    ✕
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="status" className="mt-0 space-y-4">
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Study Status
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Select the study statuses you're interested in.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSelectAll(
                                  'status',
                                  Object.entries(statusDisplayMap),
                                  field.value?.length !== Object.keys(statusDisplayMap).length
                                )}
                              >
                                {field.value?.length === Object.keys(statusDisplayMap).length
                                  ? "Deselect All"
                                  : "Select All"}
                              </Button>
                            </div>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(statusDisplayMap).map(
                                  ([value, label]) => (
                                    <div key={value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-muted/50 transition-colors">
                                      <Checkbox
                                        id={`status-${value}`}
                                        checked={field.value?.includes(value as StudyStatus)}
                                        onCheckedChange={(checked) =>
                                          Boolean(checked)
                                            ? field.onChange([
                                                ...(field.value ?? []),
                                                value as StudyStatus,
                                              ])
                                            : field.onChange(
                                                field.value?.filter((v) => v !== (value as StudyStatus))
                                              )
                                        }
                                      />
                                      <label 
                                        htmlFor={`status-${value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {label}
                                      </label>
                                    </div>
                                  )
                                )}
                              </div>
                            </FormControl>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {field.value?.map((selectedValue) => (
                                <Badge
                                  key={selectedValue}
                                  variant="secondary"
                                  className="flex items-center gap-1 py-1"
                                >
                                  {statusDisplayMap[selectedValue]}
                                  <button
                                    type="button"
                                    className="ml-1 hover:bg-muted rounded-full h-4 w-4 inline-flex items-center justify-center"
                                    onClick={() =>
                                      handleRemoveSelected('status', selectedValue)
                                    }
                                  >
                                    ✕
                                  </button>
                                </Badge>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="therapeuticArea" className="mt-0 space-y-4">
                  <Card className="border border-gray-200 dark:border-gray-800 shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                        Therapeutic Areas
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Select the therapeutic areas you're interested in.
                      </CardDescription>
                      <div className="relative mt-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search therapeutic areas..."
                          className="pl-8"
                          value={therapeuticAreaSearch}
                          onChange={(e) => setTherapeuticAreaSearch(e.target.value)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="therapeuticArea"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center justify-between mb-4">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleSelectAll(
                                  'therapeuticArea',
                                  THERAPEUTIC_AREAS,
                                  field.value?.length !== THERAPEUTIC_AREAS.length
                                )}
                              >
                                {field.value?.length === THERAPEUTIC_AREAS.length
                                  ? "Deselect All"
                                  : "Select All"}
                              </Button>
                            </div>
                            <FormControl>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filteredTherapeuticAreas.map(
                                  ({ value, label }) => (
                                    <div key={value} className="flex items-center space-x-2 border p-2 rounded-md hover:bg-muted/50 transition-colors">
                                      <Checkbox
                                        id={`ta-${value}`}
                                        checked={field.value?.includes(value)}
                                        onCheckedChange={(checked) =>
                                          Boolean(checked)
                                            ? field.onChange([
                                                ...(field.value ?? []),
                                                value,
                                              ])
                                            : field.onChange(
                                                field.value?.filter((v) => v !== value)
                                              )
                                        }
                                      />
                                      <label 
                                        htmlFor={`ta-${value}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {label}
                                      </label>
                                    </div>
                                  )
                                )}
                                {filteredTherapeuticAreas.length === 0 && (
                                  <div className="col-span-2 text-center py-4 text-muted-foreground">
                                    No therapeutic areas found matching your search.
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <div className="mt-4 flex flex-wrap gap-2">
                              {field.value?.map((selectedValue) => {
                                const areaLabel = THERAPEUTIC_AREAS.find(
                                  (area) => area.value === selectedValue
                                )?.label || selectedValue;
                                return (
                                  <Badge
                                    key={selectedValue}
                                    variant="secondary"
                                    className="flex items-center gap-1 py-1"
                                  >
                                    {areaLabel}
                                    <button
                                      type="button"
                                      className="ml-1 hover:bg-muted rounded-full h-4 w-4 inline-flex items-center justify-center"
                                      onClick={() =>
                                        handleRemoveSelected('therapeuticArea', selectedValue)
                                      }
                                    >
                                      ✕
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </ScrollArea>

              <DialogFooter className="flex justify-between sm:justify-between pt-4 border-t">
                {!forceOpen && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClose}
                    className="border hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                )}
                <Button 
                  type="submit" 
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  Save Preferences
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
