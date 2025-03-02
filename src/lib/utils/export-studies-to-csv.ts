'use client';

import { saveAs } from 'file-saver';

import { Study } from '@/types/clinical-trials/study';

export const exportStudiesToCSV = (studies: Study[]): void => {
  // Define the CSV headers
  const headers = [
    'Area',
    'Condition',
    'Country',
    'Sponsor',
    'Type',
    'Status',
    'Phase',
    'Size',
    'Sites (Y/N)',
    'Local Age Min-Max',
    'Contact Info',
    'contactPhone',
  ];

  // Escape a field to handle commas, quotes, or newlines
  const escapeField = (field: string | number | undefined): string => {
    const str = String(field ?? ''); // Ensure the field is a string
    return `"${str.replace(/"/g, '""')}"`; // Escape double quotes
  };
  // Extract and format the data
  const rows = studies.map((study) => {
    const protocol = study.protocolSection;

    // Area (derived from conditionBrowseModule)
    const areas =
      study.derivedSection?.conditionBrowseModule?.browseBranches?.map(
        (branch) => branch?.name ?? 'Unknown'
      ) ?? ['Unknown'];

    // Conditions (join multiple conditions with '; ')
    const conditions =
      protocol?.conditionsModule?.conditions?.join('; ') ?? 'Unknown';

    // Country (from the first location in contactsLocationsModule)
    const country =
      protocol?.contactsLocationsModule?.locations?.[0]?.country ?? 'Unknown';

    // Sponsor name (leadSponsor)
    const sponsor =
      protocol?.sponsorCollaboratorsModule?.leadSponsor?.name ?? 'Unknown';

    // Study type
    const type = protocol?.designModule?.studyType ?? 'Unknown';

    // Recruitment status
    const status = protocol?.statusModule?.overallStatus ?? 'Unknown';

    // Study phase (take the first phase if available)
    const phase = protocol?.designModule?.phases?.[0] ?? 'Not Specified';

    // Enrollment size
    const size =
      protocol?.designModule?.enrollmentInfo?.count ?? 'Not Specified';

    // Sites availability (Y/N based on the presence of locations)
    const sitesAvailable =
      (protocol?.contactsLocationsModule?.locations?.length ?? 0) > 0
        ? 'Y'
        : 'N';

    // Age range (Min-Max)
    const ageMin = protocol?.eligibilityModule?.minimumAge ?? 'Not Specified';
    const ageMax = protocol?.eligibilityModule?.maximumAge ?? 'Not Specified';
    const ageRange = `${ageMin}-${ageMax}`;

    // Contact information (email of the first contact in the first location)
    const contactInfo = protocol?.contactsLocationsModule?.centralContacts?.map(
      (contact) => contact.email
    )[0];

    const contactPhone =
      protocol?.contactsLocationsModule?.centralContacts?.map(
        (contact) => contact?.phoneExt ?? '' + contact?.phone ?? ''
      )[0];

    // Return the row of escaped fields
    return [
      escapeField(areas.join('; ')),
      escapeField(conditions),
      escapeField(country),
      escapeField(sponsor),
      escapeField(type),
      escapeField(status),
      escapeField(phase),
      escapeField(size),
      escapeField(sitesAvailable),
      escapeField(ageRange),
      escapeField(contactInfo),
      escapeField(contactPhone),
    ];
  });

  // Construct CSV content
  const csvContent = [
    headers.map(escapeField).join(','), // Escape headers
    ...rows.map((row) => row.join(',')), // Join each row with commas
  ].join('\n'); // Join all rows with newlines

  // Create a Blob and trigger the download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, 'studies.csv');
};
