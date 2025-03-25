// src/app/dashboard/studies/components/study-card.tsx
import {
  MapPin,
  Activity,
  Building2,
  Users,
  Link2,
  Bookmark,
  Mail,
  Phone,
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Study } from '@/types/clinical-trials/study';

interface StudyCardProps {
  study: Study;
  onViewDetails: (nctId: string) => void;
  userId: string;
  _isBookmarksLoading: boolean;
  _isBookmarked?: boolean;
  onBookmarkToggle: (nctId: string, title: string, url: string) => void;
}

const StudyCard = ({
  study,
  onViewDetails,
  _isBookmarked,
  onBookmarkToggle,
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
  
  // Extract contact information
  const centralContacts = protocol?.contactsLocationsModule?.centralContacts || [];
  const contactEmail = centralContacts[0]?.email;
  const contactPhone = centralContacts[0]?.phone;
  const hasContactInfo = contactEmail || contactPhone;

  if (!nctId || !briefTitle) {
    return null;
  }

  return (
    <Card className="p-2 md:p-3 flex flex-col gap-2">
      <CardHeader className="p-2 md:p-4 space-y-1">
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
      <CardContent className="p-2 md:p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
          <div key={idx} className="flex items-start md:items-center gap-2">
            <Icon className="w-3 h-3 text-muted-foreground mt-0.5 md:mt-0" />
            <div>
              <div className="font-medium">{label}</div>
              <div className="text-muted-foreground truncate max-w-[180px]">{value}</div>
            </div>
          </div>
        ))}
        
        {/* Contact Information */}
        {hasContactInfo && (
          <div className="col-span-1 sm:col-span-2 flex flex-col gap-2 border-t pt-2 mt-1">
            <div className="font-medium text-xs">Contact Information</div>
            <div className="flex flex-wrap gap-x-4 gap-y-2">
              {contactEmail && (
                <a 
                  href={`mailto:${contactEmail}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                  title="Send email"
                >
                  <Mail className="w-3 h-3" />
                  <span className="text-xs">{contactEmail}</span>
                </a>
              )}
              {contactPhone && (
                <a 
                  href={`tel:${contactPhone}`}
                  className="flex items-center gap-1 text-primary hover:underline"
                  title="Call phone number"
                >
                  <Phone className="w-3 h-3" />
                  <span className="text-xs">{contactPhone}</span>
                </a>
              )}
            </div>
          </div>
        )}
      </CardContent>
      <div className="px-2 md:px-4 flex justify-between items-center mt-1">
        <Badge
          variant={status === 'RECRUITING' ? 'success' : 'default'}
          className="text-[10px] px-2 py-0.5 h-5"
        >
          {status}
        </Badge>
        {lastUpdatePostDate && (
          <span className="text-[10px] md:text-xs text-muted-foreground">
            Last Updated {new Date(lastUpdatePostDate).toLocaleDateString()}
          </span>
        )}
      </div>
      <div className="px-2 md:px-4 pb-2 md:pb-3 flex justify-between items-center mt-1">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-8"
          onClick={() => onViewDetails(nctId)}
        >
          View Details
        </Button>
        <button 
          onClick={() => onBookmarkToggle(nctId, briefTitle, studyUrl)}
          className={`p-2 flex items-center justify-center h-8 w-8 rounded-md border ${
            _isBookmarked ? 'bg-primary/10 border-primary' : ''
          }`}
        >
          <Bookmark className={`h-4 w-4 ${
            _isBookmarked ? 'fill-primary text-primary' : 'text-muted-foreground'
          }`} />
        </button>
      </div>
    </Card>
  );
};

export default StudyCard;
