// src/app/study/[nctId]/page.tsx
import { Calendar, Building2, MapPin, Activity } from 'lucide-react';
import { Metadata } from 'next';
import React, { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/api/clinical-trials';

import { BackButton } from './components/back-button';
import Fallback from './components/fallback';
import { StudyDetailsSkeleton } from './components/skeleton';

interface PageProps {
  params: Promise<{ nctId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { nctId } = await params;
  const study = await api.getStudy(nctId);

  return {
    title:
      study.protocolSection?.identificationModule?.briefTitle ??
      'Study Details',
    description:
      study.protocolSection?.descriptionModule?.briefSummary ?? undefined,
  };
}

// Component to handle the async data fetching
async function StudyDetailsContent({
  nctId,
}: {
  nctId: string;
}): Promise<React.JSX.Element | null> {
  try {
    // Use a fully qualified URL for the fetch call
    const study = await api.getStudy(nctId);
    const protocolSection = study.protocolSection;
    if (!protocolSection) {
      console.warn('No protocol section found for study:', study);
      return null;
    }

    const {
      identificationModule,
      statusModule,
      designModule,
      descriptionModule,
      sponsorCollaboratorsModule,
      contactsLocationsModule,
    } = protocolSection;

    const briefTitle =
      identificationModule?.briefTitle ?? 'Title not available';
    const phase = designModule?.phases?.[0] ?? 'Phase not specified';
    const status = statusModule?.overallStatus ?? 'Status not specified';
    const sponsor =
      sponsorCollaboratorsModule?.leadSponsor?.name ?? 'Sponsor not specified';
    const location =
      contactsLocationsModule?.locations?.[0]?.country ??
      'Location not specified';
    const briefSummary =
      descriptionModule?.briefSummary ?? 'No summary available';
    const hasDetailedDescription =
      typeof descriptionModule?.detailedDescription === 'string' &&
      descriptionModule.detailedDescription.length > 0;

    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <CardTitle className="text-2xl">{briefTitle}</CardTitle>
            <CardDescription>NCT ID: {nctId}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{phase}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{status}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{sponsor}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">{location}</span>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Brief Summary</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {briefSummary}
            </p>
          </div>

          {hasDetailedDescription && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Detailed Description</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {descriptionModule?.detailedDescription}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch (error) {
    console.error('Error fetching study details:', error);
    return null;
  }
}

// Main page component
export default async function StudyDetails({
  params,
}: PageProps): Promise<React.JSX.Element> {
  const { nctId } = await params;

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="space-y-6">
        <BackButton />
        <Suspense fallback={<StudyDetailsSkeleton />}>
          <ErrorBoundary FallbackComponent={Fallback}>
            <StudyDetailsContent nctId={nctId} />
          </ErrorBoundary>
        </Suspense>
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;
