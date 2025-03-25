// src/app/dashboard/studies/components/studies-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash/debounce';
import { Search, ArrowUp, ArrowDown, Beaker, Clock, Activity, MapPin, Users, Calendar, List, Download, Bookmark } from 'lucide-react';
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
}: {
  formData: z.infer<typeof SearchFormSchema>;
  setFormData: React.Dispatch<
    React.SetStateAction<z.infer<typeof SearchFormSchema>>
  >;
  onToggleBookmarks?: (showBookmarks: boolean) => void;
  hasBookmarks?: boolean;
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
      <form className="space-y-6">
        {/* Search Bar */}
        <FormField
          control={form.control}
          name="searchTerm"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 group">
                    <InputWithIcon
                      placeholder="Search conditions, interventions, keywords..."
                      className="w-full h-10 transition-all group-hover:border-primary/50 focus-within:border-primary"
                      icon={<Search className="w-4 h-4" />}
                      {...field}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="h-10 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:shadow-md group"
                  >
                    <Search className="mr-1.5 h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
                    Search
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-4 md:gap-5 p-3 bg-gradient-to-br from-background to-muted/20 rounded-lg border shadow-sm">
          {/* Study Phase */}
          <FormField
            control={form.control}
            name="phase"
            render={({ field }) => (
              <FormItem className="mb-2 col-span-1 md:col-span-3 lg:col-span-3">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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
              <FormItem className="mb-2 col-span-1 md:col-span-3 lg:col-span-3 relative">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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

          {/* Therapeutic Area - wider */}
          <FormField
            control={form.control}
            name="therapeuticArea"
            render={({ field }) => (
              <FormItem className="mb-2 col-span-1 md:col-span-4 lg:col-span-4">
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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
          <div className="col-span-1 md:col-span-2 lg:col-span-2 grid grid-cols-2 md:grid-cols-1 gap-2.5">
            {/* Location */}
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="mb-0">
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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

            {/* Gender and Age in a row on mobile */}
            <div className="grid grid-cols-1">
              {/* Gender */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="mb-1.5">
                    <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
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
          </div>
          
          {/* Sort Options and Toggles Row */}
          <div className="col-span-1 md:col-span-12 lg:col-span-12 grid grid-cols-12 gap-2 mt-1">
            {/* Sort By */}
            <FormField
              control={form.control}
              name="sortField"
              render={({ field }) => (
                <FormItem className="col-span-8 md:col-span-3">
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <List className="h-3.5 w-3.5 text-primary/70" />
                    Sort By
                  </FormLabel>
                  <div className="relative group transition-all">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="transition-all group-hover:border-primary/50">
                          <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SortField.LAST_UPDATE_POST_DATE}>
                          Last Updated
                        </SelectItem>
                        <SelectItem value={SortField.ENROLLMENT_COUNT}>
                          Enrollment
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

            {/* Sort Direction - Icon Only */}
            <FormField
              control={form.control}
              name="sortDirection"
              render={({ field }) => (
                <FormItem className="col-span-4 md:col-span-1">
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5 opacity-0">
                    Dir
                  </FormLabel>
                  <div className="relative group transition-all">
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="transition-all group-hover:border-primary/50 px-2">
                          {field.value === SortDirection.DESC ? (
                            <ArrowDown className="h-4 w-4" />
                          ) : (
                            <ArrowUp className="h-4 w-4" />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SortDirection.DESC}>
                          <div className="flex items-center">
                            <ArrowDown className="mr-2 h-3.5 w-3.5" />
                            Descending
                          </div>
                        </SelectItem>
                        <SelectItem value={SortDirection.ASC}>
                          <div className="flex items-center">
                            <ArrowUp className="mr-2 h-3.5 w-3.5" />
                            Ascending
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </FormItem>
              )}
            />

            {/* Healthy Volunteers */}
            <FormField
              control={form.control}
              name="healthyVolunteers"
              render={({ field }) => (
                <FormItem className="col-span-7 md:col-span-3 flex items-end mt-1 md:mt-0">
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

            {/* Bookmark Toggle */}
            <FormField
              control={form.control}
              name="showBookmarksOnly"
              render={({ field }) => (
                <FormItem className="col-span-12 md:col-span-5 flex justify-center md:justify-end items-end mt-2 md:mt-0">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={hasBookmarks === false}
                    onClick={() => {
                      const newValue = !field.value;
                      // Update the form field value
                      field.onChange(newValue);
                      // Call the parent handler if provided
                      if (onToggleBookmarks) {
                        onToggleBookmarks(newValue);
                      }
                    }}
                    className={cn(
                      "w-full md:w-auto h-9 gap-2 transition-all duration-200",
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
                    {field.value && hasBookmarks !== false ? "Showing My Bookmarks" : "Show My Bookmarks"}
                  </Button>
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};

export default StudiesForm;
