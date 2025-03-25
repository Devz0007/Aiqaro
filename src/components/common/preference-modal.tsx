'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Search, ChevronRight, Check } from 'lucide-react';

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

const STEPS = [
  { id: 'phase' as const, label: 'Study Phases' },
  { id: 'status' as const, label: 'Study Status' },
  { id: 'therapeuticArea' as const, label: 'Therapeutic Areas' }
] as const;

type StepId = (typeof STEPS)[number]['id'];

function ProgressBar({ currentStep, completedSteps }: { currentStep: StepId; completedSteps: Set<string> }) {
  return (
    <div className="w-full mb-8">
      <div className="flex justify-between mb-2">
        {STEPS.map((step, index) => {
          const isActive = step.id === currentStep;
          const isCompleted = completedSteps.has(step.id);
          
          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className={`
                flex items-center justify-center w-8 h-8 rounded-full 
                ${isActive ? 'bg-purple-600 text-white' : 
                  isCompleted ? 'bg-green-500 text-white' : 
                  'bg-gray-200 text-gray-600'}
                mb-2
              `}>
                {isCompleted ? <Check size={16} /> : index + 1}
              </div>
              <span className={`text-sm ${isActive ? 'text-purple-600 font-medium' : 'text-gray-600'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full">
        <div 
          className="absolute h-full bg-purple-600 rounded-full transition-all duration-300"
          style={{ 
            width: `${((STEPS.findIndex(s => s.id === currentStep) + 1) / STEPS.length) * 100}%`
          }}
        />
      </div>
    </div>
  );
}

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
  const [activeTab, setActiveTab] = useState<StepId>('phase');
  const [therapeuticAreaSearch, setTherapeuticAreaSearch] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

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

  const isStepComplete = (stepId: string): boolean => {
    const values = form.getValues(stepId as keyof Partial<SearchForm>);
    return Array.isArray(values) && values.length > 0;
  };

  const handleNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === activeTab);
    if (isStepComplete(activeTab)) {
      setCompletedSteps(prev => new Set([...prev, activeTab]));
    }
    if (currentIndex < STEPS.length - 1) {
      setActiveTab(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.findIndex(s => s.id === activeTab);
    if (currentIndex > 0) {
      setActiveTab(STEPS[currentIndex - 1].id);
    }
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

  const currentStepIndex = STEPS.findIndex(s => s.id === activeTab);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <ProgressBar currentStep={activeTab} completedSteps={completedSteps} />
            
            <Tabs value={activeTab} onValueChange={setActiveTab as (value: string) => void} className="w-full">
              <TabsContent value="phase" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Study Phases</CardTitle>
                    <CardDescription>
                      Choose the clinical trial phases you're interested in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="phase"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSelectAll(
                                  'phase',
                                  Object.entries(phaseDisplayMap),
                                  !Object.keys(phaseDisplayMap).every((phase) =>
                                    form.getValues('phase')?.includes(phase as StudyPhase)
                                  )
                                )
                              }
                            >
                              Select All
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {(Object.entries(phaseDisplayMap) as Array<[StudyPhase, string]>).map(([value, label]) => (
                              <FormField
                                key={value}
                                control={form.control}
                                name="phase"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(value)}
                                          onCheckedChange={(checked) => {
                                            const values = field.value || [];
                                            return checked
                                              ? field.onChange([...values, value])
                                              : field.onChange(
                                                  values.filter((val) => val !== value)
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <label className="font-normal cursor-pointer">
                                        {label}
                                      </label>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="status" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Study Status</CardTitle>
                    <CardDescription>
                      Choose the status of clinical trials you want to follow.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="status"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleSelectAll(
                                  'status',
                                  Object.entries(statusDisplayMap),
                                  !Object.keys(statusDisplayMap).every((status) =>
                                    form.getValues('status')?.includes(status as StudyStatus)
                                  )
                                )
                              }
                            >
                              Select All
                            </Button>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            {(Object.entries(statusDisplayMap) as Array<[StudyStatus, string]>).map(([value, label]) => (
                              <FormField
                                key={value}
                                control={form.control}
                                name="status"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={value}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(value)}
                                          onCheckedChange={(checked) => {
                                            const values = field.value || [];
                                            return checked
                                              ? field.onChange([...values, value])
                                              : field.onChange(
                                                  values.filter((val) => val !== value)
                                                );
                                          }}
                                        />
                                      </FormControl>
                                      <label className="font-normal cursor-pointer">
                                        {label}
                                      </label>
                                    </FormItem>
                                  );
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="therapeuticArea" className="m-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Select Therapeutic Areas</CardTitle>
                    <CardDescription>
                      Choose the therapeutic areas you're interested in.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Search className="w-4 h-4 text-gray-500" />
                        <Input
                          type="text"
                          placeholder="Search therapeutic areas..."
                          value={therapeuticAreaSearch}
                          onChange={(e) => setTherapeuticAreaSearch(e.target.value)}
                          className="flex-1"
                        />
                      </div>

                      <div className="mb-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleSelectAll(
                              'therapeuticArea',
                              THERAPEUTIC_AREAS,
                              !THERAPEUTIC_AREAS.every((area) =>
                                form
                                  .getValues('therapeuticArea')
                                  ?.includes(area.value)
                              )
                            )
                          }
                        >
                          Select All
                        </Button>
                      </div>

                      <ScrollArea className="h-[300px] rounded-md border p-4">
                        <FormField
                          control={form.control}
                          name="therapeuticArea"
                          render={() => (
                            <FormItem>
                              <div className="grid grid-cols-2 gap-4">
                                {filteredTherapeuticAreas.map((area) => (
                                  <FormField
                                    key={area.value}
                                    control={form.control}
                                    name="therapeuticArea"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={area.value}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(
                                                area.value
                                              )}
                                              onCheckedChange={(checked) => {
                                                const values = field.value || [];
                                                return checked
                                                  ? field.onChange([
                                                      ...values,
                                                      area.value,
                                                    ])
                                                  : field.onChange(
                                                      values.filter(
                                                        (val) => val !== area.value
                                                      )
                                                    );
                                              }}
                                            />
                                          </FormControl>
                                          <label className="font-normal cursor-pointer">
                                            {area.label}
                                          </label>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </ScrollArea>

                      <div className="flex flex-wrap gap-2 mt-4">
                        {form.getValues('therapeuticArea')?.map((value) => {
                          const area = THERAPEUTIC_AREAS.find(
                            (a) => a.value === value
                          );
                          return (
                            <Badge
                              key={value}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() =>
                                handleRemoveSelected('therapeuticArea', value)
                              }
                            >
                              {area?.label}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                  >
                    Back
                  </Button>
                )}
                {!isLastStep ? (
                  <Button
                    type="button"
                    onClick={handleNext}
                    disabled={!isStepComplete(activeTab)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={!isStepComplete(activeTab)}
                  >
                    Save Preferences
                  </Button>
                )}
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
