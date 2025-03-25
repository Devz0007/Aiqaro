'use client';

import { capitalize } from 'lodash';
import { usePathname } from 'next/navigation';
import React, { useState } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { LogOut, Settings } from 'lucide-react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import PreferenceModal from '@/components/common/preference-modal';
import { useFetchUserPreferences, useSaveUserPreferences } from '@/hooks/studies/use-user-preferences';

const AppHeader: React.FC = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isPreferenceModalOpen, setIsPreferenceModalOpen] = useState(false);
  const segments = pathname.split('/').filter(Boolean);

  // Fetch user preferences
  const { data: userPreferences } = useFetchUserPreferences({
    userId: user?.id || '',
  });

  // Save user preferences
  const { mutate: savePreferences } = useSaveUserPreferences();

  const handleSavePreferences = (preferences: any) => {
    if (!user?.id) return;
    
    savePreferences({
      userId: user.id,
      preferences: {
        phase: preferences.phase,
        status: preferences.status,
        therapeuticArea: preferences.therapeuticArea,
      },
    });
    
    setIsPreferenceModalOpen(false);
  };

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2 px-4">
        {/* Sidebar Trigger */}
        <SidebarTrigger className="-ml-1" />
        {/* Separator */}
        <Separator orientation="vertical" className="mr-2 h-4" />
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            {segments.map((segment, index) => {
              const isLast = index === segments.length - 1;
              const href = `/${segments.slice(0, index + 1).join('/')}`;

              return (
                <React.Fragment key={href}>
                  <BreadcrumbItem>
                    {isLast ? (
                      <BreadcrumbPage>
                        {capitalize(decodeURIComponent(segment))}
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={href}>
                        {capitalize(decodeURIComponent(segment))}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {!isLast && <BreadcrumbSeparator />}
                </React.Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Accounts Section */}
      <div className="flex items-center px-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || ''} />
                <AvatarFallback>
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsPreferenceModalOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Update Preferences</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Preferences Modal */}
      <PreferenceModal
        isOpen={isPreferenceModalOpen}
        onClose={() => setIsPreferenceModalOpen(false)}
        onSave={handleSavePreferences}
        initialPreferences={userPreferences}
      />
    </header>
  );
};

export default AppHeader;
