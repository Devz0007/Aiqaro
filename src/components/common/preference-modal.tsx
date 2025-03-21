'use client';

import { useUser } from '@clerk/nextjs';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge'; // Import Badge component
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newPreferences: Partial<SearchForm>) => void;
}): React.JSX.Element | null {
  const { user } = useUser();

  const form = useForm<Partial<SearchForm>>({
    resolver: zodResolver(PreferenceSchema),
    defaultValues: { phase: [], status: [], therapeuticArea: [] },
  });

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
    onSave(data);
    onClose();
  };

  if (!user) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Your Preferences</DialogTitle>
          <DialogDescription>
            Choose your preferred study phases, statuses, and therapeutic areas. These preferences will be used to filter your study searches.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Phase */}
            <FormField
              control={form.control}
              name="phase"
              render={({ field }) => (
                <FormItem>
                  <label>Preferred Phases</label>
                  <FormControl>
                    <div>
                      <div className="flex items-center mb-2">
                        <Checkbox
                          checked={
                            field.value?.length ===
                            Object.keys(phaseDisplayMap).length
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(
                              'phase',
                              Object.entries(phaseDisplayMap),
                              Boolean(checked)
                            )
                          }
                        />
                        <span className="ml-2">Select All</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(phaseDisplayMap).map(
                          ([value, label]) => (
                            <div key={value} className="flex items-center">
                              <Checkbox
                                checked={field.value?.includes(
                                  value as StudyPhase
                                )}
                                onCheckedChange={(checked) =>
                                  Boolean(checked)
                                    ? field.onChange([
                                        ...(field.value ?? []),
                                        value as StudyPhase,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (v) => v !== (value as StudyPhase)
                                        )
                                      )
                                }
                              />
                              <span className="ml-2">{label}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value?.map((selectedValue) => (
                      <Badge
                        key={selectedValue}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {phaseDisplayMap[selectedValue]}
                        <button
                          type="button"
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

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <label>Study Status</label>
                  <FormControl>
                    <div>
                      <div className="flex items-center mb-2">
                        <Checkbox
                          checked={
                            field.value?.length ===
                            Object.keys(statusDisplayMap).length
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(
                              'status',
                              Object.entries(statusDisplayMap),
                              Boolean(checked)
                            )
                          }
                        />
                        <span className="ml-2">Select All</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(statusDisplayMap).map(
                          ([value, label]) => (
                            <div key={value} className="flex items-center">
                              <Checkbox
                                checked={field.value?.includes(
                                  value as StudyStatus
                                )}
                                onCheckedChange={(checked) =>
                                  Boolean(checked)
                                    ? field.onChange([
                                        ...(field.value ?? []),
                                        value as StudyStatus,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (v) => v !== (value as StudyStatus)
                                        )
                                      )
                                }
                              />
                              <span className="ml-2">{label}</span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </FormControl>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value?.map((selectedValue) => (
                      <Badge
                        key={selectedValue}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {statusDisplayMap[selectedValue]}
                        <button
                          type="button"
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

            <FormField
              control={form.control}
              name="therapeuticArea"
              render={({ field }) => (
                <FormItem>
                  <label>Therapeutic Area</label>
                  <FormControl>
                    <div>
                      <div className="flex items-center mb-2">
                        <Checkbox
                          checked={
                            field.value?.length === THERAPEUTIC_AREAS.length
                          }
                          onCheckedChange={(checked) =>
                            handleSelectAll(
                              'therapeuticArea',
                              THERAPEUTIC_AREAS,
                              Boolean(checked)
                            )
                          }
                        />
                        <span className="ml-2">Select All</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {THERAPEUTIC_AREAS.map(({ value, label }) => (
                          <div key={value} className="flex items-center">
                            <Checkbox
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
                            <span className="ml-2">{label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </FormControl>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {field.value?.map((selectedValue) => (
                      <Badge
                        key={selectedValue}
                        variant="outline"
                        className="flex items-center gap-1"
                      >
                        {
                          THERAPEUTIC_AREAS.find(
                            (area) => area.value === selectedValue
                          )?.label
                        }
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveSelected(
                              'therapeuticArea',
                              selectedValue
                            )
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

            <Button type="submit">Save Preferences</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
