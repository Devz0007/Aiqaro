'use client';

import {
  AudioWaveform,
  // BookOpen,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  // Send,
  // Settings2,
  SquareTerminal,
} from 'lucide-react';
import Link from 'next/link';
import * as React from 'react';

import { NavMain } from '@/components/sidebar/nav-main';
// import { NavProjects } from '@/components/sidebar/nav-projects';
import { NavUser } from '@/components/sidebar/nav-user';
// import { TeamSwitcher } from '@/components/sidebar/team-switcher';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

import { BrandLogo } from '../common/brand-logo';

// This is sample data.
const data = {
  teams: [
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Studies',
      url: '/dashboard/studies',
      icon: SquareTerminal,
      isActive: true,
      items: [
        {
          title: 'Search',
          url: '/dashboard/studies',
        },
        // {
        //   title: 'Bookmarked',
        //   url: '/dashboard/studies/bookmarks',
        // },
        // {
        //   title: 'Settings',
        //   url: '#',
        // },
      ],
    },
    // {
    //   title: 'Outreach',
    //   url: '/dashboard/outreach',
    //   icon: Send,
    //   items: [
    //     {
    //       title: 'Campaigns',
    //       url: '/dashboard/outreach/campaigns',
    //     },
    //     {
    //       title: 'Templates',
    //       url: ' /dashboard/outreach/templates',
    //     },
    //     {
    //       title: 'Settings',
    //       url: '#',
    //     },
    //   ],
    // },
    // {
    //   title: 'Documentation',
    //   url: '/dashboard/docs',
    //   icon: BookOpen,
    //   items: [
    //     {
    //       title: 'Introduction',
    //       url: '/dashboard/docs',
    //     },
    //     {
    //       title: 'Get Started',
    //       url: '/dashboard/docs/get-started',
    //     },
    //     {
    //       title: 'Tutorials',
    //       url: '/dashboard/docs/tutorials',
    //     },
    //     {
    //       title: 'Changelog',
    //       url: '/dashboard/docs/changelog',
    //     },
    //   ],
    // },
    // {
    //   title: 'Settings',
    //   url: '/dashboard/settings',
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: 'General',
    //       url: '/dashboard/settings',
    //     },
    //     {
    //       title: 'Team',
    //       url: '/dashboard/settings/team',
    //     },
    //     {
    //       title: 'Billing',
    //       url: '/dashboard/settings/billing',
    //     },
    //     {
    //       title: 'Limits',
    //       url: '/dashboard/settings/limits',
    //     },
    //   ],
    // },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '#',
      icon: Frame,
    },
    {
      name: 'Sales & Marketing',
      url: '#',
      icon: PieChart,
    },
    {
      name: 'Travel',
      url: '#',
      icon: Map,
    },
  ],
};

export function AppSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>): React.JSX.Element {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className="flex items-center justify-center h-16">
          <Link href="/">
            <BrandLogo />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {/* <NavProjects projects={data.projects} /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
