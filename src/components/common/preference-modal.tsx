'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import React, { useState, useEffect, useRef } from 'react';
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
  { id: 'phase', label: 'Study Phases' },
  { id: 'status', label: 'Study Status' },
  { id: 'therapeuticArea', label: 'Therapeutic Areas' }
];

function ProgressBar({ currentStep, completedSteps }: { currentStep: string; completedSteps: Set<string> }) {
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
  const [currentStep, setCurrentStep] = useState('phase');
  const [therapeuticAreaSearch, setTherapeuticAreaSearch] = useState('');
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  // Create a stable ref to track if modal closing should be prevented
  const preventCloseRef = useRef(false);
  // Track if modal is currently in a transition
  const isTransitioningRef = useRef(false);
  // Used to force remounting the tabs component
  const [tabsKey, setTabsKey] = useState(0);

  const form = useForm<Partial<SearchForm>>({
    resolver: zodResolver(PreferenceSchema),
    defaultValues: {
      phase: initialPreferences?.phase || [],
      status: initialPreferences?.status || [],
      therapeuticArea: initialPreferences?.therapeuticArea || [],
    },
  });

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to first step
      setCurrentStep('phase');
      
      // Initialize completed steps based on what already has values
      const initialCompletedSteps = new Set<string>();
      if (initialPreferences?.phase?.length) initialCompletedSteps.add('phase');
      if (initialPreferences?.status?.length) initialCompletedSteps.add('status');
      if (initialPreferences?.therapeuticArea?.length) initialCompletedSteps.add('therapeuticArea');
      setCompletedSteps(initialCompletedSteps);
      
      // Reset form values
      form.reset({
        phase: initialPreferences?.phase || [],
        status: initialPreferences?.status || [],
        therapeuticArea: initialPreferences?.therapeuticArea || [],
      });
      
      // Force remount tabs
      setTabsKey(prev => prev + 1);
    }
  }, [isOpen, initialPreferences, form]);

  // Handle close attempts - only allow closing when explicitly permitted
  const handleClose = () => {
    // If we're in a transition, or forceOpen is true, prevent closing
    if (preventCloseRef.current || isTransitioningRef.current || forceOpen) {
      return;
    }
    onClose();
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

  const manuallyChangeStep = (newStep: string) => {
    // Set transition flag to prevent closing
    isTransitioningRef.current = true;
    
    // Update the completed steps set if current step is complete
    if (isStepComplete(currentStep)) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
    
    // Set the current step
    setCurrentStep(newStep);
    
    // Clear transition flag after a delay
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 300);
  };

  const handleNext = (e?: React.MouseEvent) => {
    // If an event was provided, prevent default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    
    // Only proceed if there is a next step
    if (currentIndex < STEPS.length - 1) {
      manuallyChangeStep(STEPS[currentIndex + 1].id);
    }
  };

  const handleBack = (e?: React.MouseEvent) => {
    // If an event was provided, prevent default behavior
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    
    // Only go back if not on the first step
    if (currentIndex > 0) {
      manuallyChangeStep(STEPS[currentIndex - 1].id);
    }
  };

  const onSubmit = (data: Partial<SearchForm>): void => {
    if (!user) {
      return;
    }
    
    // Make sure we're sending non-empty preferences
    const hasSelections = 
      (data.phase && data.phase.length > 0) || 
      (data.status && data.status.length > 0) || 
      (data.therapeuticArea && data.therapeuticArea.length > 0);
    
    // For new users with forced modal, ensure they select at least one preference
    if (forceOpen && !hasSelections) {
      console.log("[PREFERENCES MODAL] Adding default preferences for new user");
      data.phase = ['PHASE1', 'PHASE2', 'PHASE3'] as StudyPhase[];
      data.status = ['RECRUITING', 'NOT_YET_RECRUITING'] as StudyStatus[];
      
      // Add default therapeutic areas if none selected
      if (!data.therapeuticArea || data.therapeuticArea.length === 0) {
        data.therapeuticArea = ['oncology', 'cardiology'];
      }
    }
    
    console.log("[PREFERENCES MODAL] Saving preferences:", data);
    onSave(data);
    
    // Close the modal
    onClose();
  };

  const filteredTherapeuticAreas = therapeuticAreaSearch
    ? THERAPEUTIC_AREAS.filter(area => 
        area.label.toLowerCase().includes(therapeuticAreaSearch.toLowerCase()))
    : THERAPEUTIC_AREAS;

  if (!user) {
    return null;
  }

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  // Render the step content based on currentStep
  const renderStepContent = () => {
    switch (currentStep) {
      case 'phase':
        return (
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
        );
      
      case 'status':
        return (
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
        );
      
      case 'therapeuticArea':
        return (
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
                
                {/* No pill display to avoid issues */}
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // If we're trying to close the dialog
        if (!open) {
          handleClose();
        }
      }}
    >
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] flex flex-col bg-white dark:bg-gray-950"
        // Always prevent escape key from closing unexpectedly
        onEscapeKeyDown={(e) => e.preventDefault()}
        // Always prevent clicks outside from closing unexpectedly 
        onPointerDownOutside={(e) => e.preventDefault()}
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
            <ProgressBar currentStep={currentStep} completedSteps={completedSteps} />
            
            {/* Render current step content */}
            {renderStepContent()}

            <DialogFooter className="flex justify-between items-center">
              <div className="flex gap-2">
                {!isFirstStep && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={(e) => {
                      preventCloseRef.current = true;
                      handleBack(e);
                      setTimeout(() => {
                        preventCloseRef.current = false;
                      }, 300);
                    }}
                  >
                    Back
                  </Button>
                )}
                {!isLastStep ? (
                  <Button
                    type="button"
                    onClick={(e) => {
                      preventCloseRef.current = true;
                      handleNext(e);
                      setTimeout(() => {
                        preventCloseRef.current = false;
                      }, 300);
                    }}
                    disabled={!isStepComplete(currentStep)}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={false}
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
