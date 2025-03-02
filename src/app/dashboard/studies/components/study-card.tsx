// src/app/dashboard/studies/components/study-card.tsx
import {
  MapPin,
  Activity,
  Building2,
  Users,
  Link2,
  Bookmark,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useCreateBookmarkStudy,
  useDeleteBookmarkStudy,
} from '@/hooks/bookmarks/use-bookmarks';
import { Study } from '@/types/clinical-trials/study';

interface StudyCardProps {
  study: Study;
  onViewDetails: (nctId: string) => void;
  userId: string; // Pass the userId to handle bookmarks
  _isBookmarksLoading: boolean; // Optional prop to handle loading state
  _isBookmarked?: boolean; // Optional prop to handle bookmark state
}

const StudyCard = ({
  study,
  onViewDetails,
  userId,
  _isBookmarksLoading,
  _isBookmarked,
}: StudyCardProps): React.JSX.Element | null => {
  const protocol = study.protocolSection;
  const nctId = protocol?.identificationModule?.nctId ?? '';
  const briefTitle =
    protocol?.identificationModule?.briefTitle?.slice(0, 60) + '...';
  const officialTitle =
    protocol?.identificationModule?.officialTitle?.slice(0, 120) + '...';
  const status = protocol?.statusModule?.overallStatus ?? '';
  const lastUpdatePostDate =
    protocol?.statusModule?.lastUpdatePostDateStruct?.date ?? '';
  const phase =
    protocol?.designModule?.phases?.[0]?.replace('PHASE', '') ??
    'Not Specified';
  const enrollmentCount = protocol?.designModule?.enrollmentInfo?.count ?? 0;
  const locations = protocol?.contactsLocationsModule?.locations ?? [];
  const locationDisplay = `${locations[0]?.city ?? 'Unknown'}, ${locations[0]?.country ?? ''}`;
  const sponsorName =
    protocol?.sponsorCollaboratorsModule?.leadSponsor?.name ?? 'Not Specified';
  const studyUrl = `https://clinicaltrials.gov/study/${nctId}`;
  const [isBookmarked, setIsBookmarked] = useState(_isBookmarked);

  const { mutate: createBookmark } = useCreateBookmarkStudy();
  const { mutate: deleteBookmark } = useDeleteBookmarkStudy();

  const toggleBookmark = (): void => {
    if (Boolean(isBookmarked)) {
      deleteBookmark(
        { nctId, userId },
        {
          onSuccess: () => {
            setIsBookmarked(false);
          },
          onError: () => {
            setIsBookmarked(true);
          },
        }
      );
    } else {
      createBookmark(
        { nctId, userId, title: briefTitle, url: studyUrl },
        {
          onSuccess: () => {
            setIsBookmarked(true);
          },
          onError: () => {
            setIsBookmarked(false);
          },
        }
      );
    }
  };

  useEffect(() => {
    setIsBookmarked(_isBookmarked);
  }, [_isBookmarked]);

  if (!nctId || !briefTitle) {
    return null;
  }

  return (
    <Card className="p-3 flex flex-col gap-2">
      <CardHeader className="space-y-1">
        <CardTitle className="text-sm font-semibold">
          <a
            href={studyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary inline-flex items-center gap-1"
          >
            {briefTitle}
            <Link2 className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          {officialTitle}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2 text-xs">
        {[
          { icon: Activity, label: 'Phase', value: phase },
          {
            icon: Users,
            label: 'Enrollment',
            value: `${enrollmentCount} • ${locations.length} sites`,
          },
          { icon: MapPin, label: 'Location', value: locationDisplay },
          { icon: Building2, label: 'Sponsor', value: sponsorName },
        ].map(({ icon: Icon, label, value }, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <Icon className="w-3 h-3 text-muted-foreground" />
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-muted-foreground">{value}</div>
            </div>
          </div>
        ))}
      </CardContent>
      <div className="flex justify-between items-center mt-2">
        <Badge
          variant={status === 'RECRUITING' ? 'success' : 'default'}
          className="text-[10px]"
        >
          {status}
        </Badge>
        {lastUpdatePostDate && (
          <span className="text-xs text-muted-foreground">
            Last Updated {new Date(lastUpdatePostDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="flex justify-between items-center mt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs"
          onClick={() => onViewDetails(nctId)}
        >
          View Details
        </Button>
        <button onClick={toggleBookmark} className="p-2">
          {_isBookmarksLoading ? (
            <Skeleton className="size-5" />
          ) : (
            <Bookmark
              className={`w-5 h-5 ${
                typeof isBookmarked === 'boolean' && isBookmarked
                  ? 'text-primary fill-primary'
                  : 'text-muted-foreground'
              }`}
            />
          )}
        </button>
      </div>
    </Card>
  );
};

export default StudyCard;
