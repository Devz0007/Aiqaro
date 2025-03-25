// src/app/dashboard/studies/components/studies-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash/debounce';
import { Search, ArrowUp, ArrowDown, Beaker, Clock, Activity, MapPin, Users, Calendar, List, Download, Bookmark, Settings2 } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { cn } from '@/lib/utils';

import { AgeRangeInput } from '@/components/ui/age-range-input';
import { Button } from '@/components/ui/button';
import { ToggleCheckbox } from '@/components/ui/toggle-checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { InputWithIcon } from '@/components/ui/input-with-icon';
import { MultiSelect } from '@/components/ui/multi-select';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  StudyStatus,
  SortDirection,
  SortField,
  THERAPEUTIC_AREAS,
  phaseDisplayMap,
  statusDisplayMap,
  StudyPhase,
} from '@/types/clinical-trials/filters';
import { SearchFormSchema } from '@/types/common/form';

const StudiesForm = ({
  formData,
  setFormData,
  onToggleBookmarks,
  hasBookmarks,
  onOpenPreferences,
}: {
  formData: z.infer<typeof SearchFormSchema>;
  setFormData: React.Dispatch<
    React.SetStateAction<z.infer<typeof SearchFormSchema>>
  >;
  onToggleBookmarks?: (showBookmarks: boolean) => void;
  hasBookmarks?: boolean;
  onOpenPreferences?: () => void;
}): React.JSX.Element => {
  const form = useForm<z.infer<typeof SearchFormSchema>>({
    resolver: zodResolver(SearchFormSchema),
    defaultValues: formData,
  });

  const debouncedOnSubmit = React.useMemo(() => {
    return debounce(
      (data: z.infer<typeof SearchFormSchema>) => {
        setFormData(data);
      },
      300 // Debounce duration
    ) as (data: z.infer<typeof SearchFormSchema>) => void; // Explicitly type debounce
  }, [setFormData]);

  React.useEffect(() => {
    const subscription = form.watch((updatedValues) => {
      const safeValues = {
        ...form.getValues(),
        ...updatedValues,
      };

      // Filter and clean up the arrays
      const cleanedValues = {
        ...safeValues,
        status: Array.isArray(safeValues.status)
          ? safeValues.status.filter(
              (value): value is StudyStatus => value !== undefined
            )
          : undefined,
        phase: Array.isArray(safeValues.phase)
          ? safeValues.phase.filter(
              (value): value is StudyPhase => value !== undefined
            )
          : undefined,
        therapeuticArea: Array.isArray(safeValues.therapeuticArea)
          ? safeValues.therapeuticArea.filter(
              (value): value is string => value !== undefined
            )
          : undefined,
      };

      debouncedOnSubmit(cleanedValues);
    });

    return () => {
      subscription.unsubscribe(); // Clean up subscription
    };
  }, [form, debouncedOnSubmit]);

  return (
    <Form {...form}>
      <form className="space-y-4">
        {/* Main Filter Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-4 md:gap-3 p-3 md:p-2 bg-gradient-to-br from-background to-muted/20 rounded-lg border shadow-sm">
          {/* Study Phase */}
          <FormField
            control={form.control}
            name="phase"
            render={({ field }) => (
              <FormItem className="mb-1 md:mb-0 col-span-1 md:col-span-3 lg:col-span-3">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <Beaker className="h-3.5 w-3.5 text-primary/70" />
                  Phase
                </FormLabel>
                <div className="relative group transition-all">
                  <MultiSelect
                    options={Object.entries(phaseDisplayMap).map(
                      ([value, label]) => ({
                        label,
                        value,
                      })
                    )}
                    defaultValue={field.value ?? []}
                    onValueChange={field.onChange}
                    placeholder="Select phases"
                    maxCount={2}
                    className="w-full transition-all group-hover:border-primary/50 pr-6"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Study Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem className="mb-1 md:mb-0 col-span-1 md:col-span-3 lg:col-span-3">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-primary/70" />
                  Status
                </FormLabel>
                <div className="relative group transition-all">
                  <MultiSelect
                    options={Object.entries(statusDisplayMap).map(
                      ([value, label]) => ({
                        label,
                        value,
                      })
                    )}
                    defaultValue={field.value ?? []}
                    onValueChange={field.onChange}
                    placeholder="Select statuses"
                    maxCount={2}
                    className="w-full transition-all group-hover:border-primary/50 pr-6"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Therapeutic Area */}
          <FormField
            control={form.control}
            name="therapeuticArea"
            render={({ field }) => (
              <FormItem className="mb-1 md:mb-0 col-span-1 md:col-span-3 lg:col-span-3">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-primary/70" />
                  Therapeutic Area
                </FormLabel>
                <div className="relative group transition-all">
                  <MultiSelect
                    options={THERAPEUTIC_AREAS.map(({ value, label }) => ({
                      label,
                      value,
                    }))}
                    defaultValue={field.value ?? []}
                    onValueChange={field.onChange}
                    placeholder="Select areas"
                    maxCount={2}
                    className="w-full transition-all group-hover:border-primary/50 pr-6"
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location, Gender and Age Column */}
          <div className="col-span-1 md:col-span-3 lg:col-span-3 grid grid-cols-1 gap-2 md:gap-1.5">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="mb-0">
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                    <MapPin className="h-3.5 w-3.5 text-primary/70" />
                    Location
                  </FormLabel>
                  <div className="relative group transition-all">
                    <FormControl>
                      <Input 
                        placeholder="City, State, Country" 
                        {...field} 
                        className="transition-all group-hover:border-primary/50"
                      />
                    </FormControl>
                  </div>
                </FormItem>
              )}
            />

            {/* Gender */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem className="mb-0">
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                    <Users className="h-3.5 w-3.5 text-primary/70" />
                    Gender
                  </FormLabel>
                  <div className="relative group transition-all">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="transition-all group-hover:border-primary/50">
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">All</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />

            {/* Age Range */}
            <FormItem className="mb-0">
              <FormLabel className="text-sm font-medium flex items-center gap-1.5 mb-1">
                <Calendar className="h-3.5 w-3.5 text-primary/70" />
                Age
              </FormLabel>
              <AgeRangeInput
                minValue={form.watch("minAge") ?? ""}
                maxValue={form.watch("maxAge") ?? ""}
                onMinChange={(value) => form.setValue("minAge", value)}
                onMaxChange={(value) => form.setValue("maxAge", value)}
                minPlaceholder="Min"
                maxPlaceholder="Max"
              />
            </FormItem>
          </div>

          {/* Bottom Row: Sort and Action Controls */}
          <div className="col-span-12 flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-border/50">
            {/* Sort By with Direction */}
            <div className="flex items-center gap-1">
              <FormField
                control={form.control}
                name="sortField"
                render={({ field }) => (
                  <FormItem className="flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      <List className="h-3.5 w-3.5 text-primary/70" />
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-[140px]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SortField.LAST_UPDATE_POST_DATE}>
                            Last Updated
                          </SelectItem>
                          <SelectItem value={SortField.ENROLLMENT_COUNT}>
                            Enrollment Count
                          </SelectItem>
                          <SelectItem value={SortField.STUDY_FIRST_POST_DATE}>
                            First Posted
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortDirection"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() =>
                      form.setValue(
                        'sortDirection',
                        field.value === SortDirection.ASC
                          ? SortDirection.DESC
                          : SortDirection.ASC
                      )
                    }
                  >
                    {field.value === SortDirection.ASC ? (
                      <ArrowUp className="h-4 w-4" />
                    ) : (
                      <ArrowDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
              />
            </div>

            {/* Healthy Volunteers Toggle */}
            <FormField
              control={form.control}
              name="healthyVolunteers"
              render={({ field }) => (
                <FormItem className="flex items-center">
                  <FormControl>
                    <ToggleCheckbox
                      checked={field.value}
                      onChange={field.onChange}
                      label="Healthy volunteers only"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex-1" />

            {/* Bookmark Toggle */}
            <FormField
              control={form.control}
              name="showBookmarksOnly"
              render={({ field }) => (
                <FormItem>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={hasBookmarks === false}
                    onClick={() => {
                      const newValue = !field.value;
                      field.onChange(newValue);
                      if (onToggleBookmarks) {
                        onToggleBookmarks(newValue);
                      }
                    }}
                    className={cn(
                      "h-9 gap-2 px-3 transition-all duration-200",
                      field.value && hasBookmarks !== false
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : hasBookmarks === false 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:bg-accent hover:text-accent-foreground hover:shadow-sm"
                    )}
                    size="sm"
                  >
                    <Bookmark
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        field.value && hasBookmarks !== false ? "fill-primary-foreground" : ""
                      )}
                    />
                    {field.value && hasBookmarks !== false ? "Showing Bookmarks" : "Show My Bookmarks"}
                  </Button>
                </FormItem>
              )}
            />
            
            {/* Preferences Button */}
            <Button
              type="button"
              variant="outline"
              onClick={onOpenPreferences}
              className="h-9 gap-2 px-3 hover:bg-accent hover:text-accent-foreground hover:shadow-sm transition-all duration-200"
              size="sm"
            >
              <Settings2 className="h-4 w-4" />
              Update Trial Preferences
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default StudiesForm;
