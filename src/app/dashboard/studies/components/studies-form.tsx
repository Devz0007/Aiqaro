// src/app/dashboard/studies/components/studies-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import debounce from 'lodash/debounce';
import { Search, ArrowUp, ArrowDown } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
}: {
  formData: z.infer<typeof SearchFormSchema>;
  setFormData: React.Dispatch<
    React.SetStateAction<z.infer<typeof SearchFormSchema>>
  >;
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
                <div className="flex flex-col gap-2 sm:flex-row">
                  <div className="flex-1">
                    <InputWithIcon
                      placeholder="Search by condition, intervention, or keywords..."
                      className="w-full"
                      icon={<Search className="w-4 h-4" />}
                      {...field}
                    />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto">
                    Search
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
          {/* Study Phase */}
          <FormField
            control={form.control}
            name="phase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study Phase</FormLabel>
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
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Study Status */}
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Study Status</FormLabel>
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
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Therapeutic Area */}
          <FormField
            control={form.control}
            name="therapeuticArea"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Therapeutic Area</FormLabel>
                <MultiSelect
                  options={THERAPEUTIC_AREAS.map(({ value, label }) => ({
                    label,
                    value,
                  }))}
                  defaultValue={field.value ?? []}
                  onValueChange={field.onChange}
                  placeholder="Select therapeutic areas"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Location */}
          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Location</FormLabel>
                <FormControl>
                  <Input placeholder="City, State, or Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Gender */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="MALE">Male</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Age Range */}
          <FormItem>
            <FormLabel>Age Range</FormLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <FormField
                control={form.control}
                name="minAge"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Min" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxAge"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input placeholder="Max" type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </FormItem>

          {/* Sorting */}
          <FormItem className="col-span-2">
            <FormLabel>Sort By</FormLabel>
            <div className="flex flex-col gap-2 sm:flex-row">
              <FormField
                control={form.control}
                name="sortField"
                render={({ field }) => (
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Sort field" />
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
                )}
              />

              <FormField
                control={form.control}
                name="sortDirection"
                render={({ field }) => (
                  <Button
                    type="button"
                    variant="outline"
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
                    <span className="ml-2">
                      {field.value === SortDirection.ASC
                        ? 'Ascending'
                        : 'Descending'}
                    </span>
                  </Button>
                )}
              />
            </div>
          </FormItem>

          {/* Healthy Volunteers */}
          <FormField
            control={form.control}
            name="healthyVolunteers"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  Healthy volunteers only
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Bookmarks Filter Toggle */}
          <FormField
            control={form.control}
            name="showBookmarksOnly"
            render={({ field }) => (
              <FormItem className="col-span-1 sm:col-span-2 lg:col-span-3 mt-4">
                <Button
                  type="button"
                  variant={field.value ? "default" : "outline"}
                  className={`flex items-center space-x-2 ${field.value ? "bg-primary text-primary-foreground" : "border-dashed"}`}
                  onClick={() => field.onChange(!field.value)}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill={field.value ? "currentColor" : "none"}
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                  >
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>
                    {field.value ? "Showing My Bookmarks" : "Show My Bookmarks"}
                  </span>
                </Button>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </form>
    </Form>
  );
};

export default StudiesForm;
