// Event Types Constants
export const EVENT_TYPES = [
  'Workshop',
  'Conference',
  'Meetup',
  'Seminar',
  'Training',
  'Webinar',
  'Hackathon',
  'Competition',
  'Exhibition',
  'Concert',
  'Sports Event',
  'Charity Event',
  'Networking Event',
  'Other',
] as const;

export type EventType = typeof EVENT_TYPES[number];

// Event Types with "All Events" option for filters
export const EVENT_TYPES_WITH_ALL = ['All Events', ...EVENT_TYPES] as const;
