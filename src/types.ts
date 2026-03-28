// Cal.com API v2 types

export interface CalApiResponse<T = unknown> {
  status: string;
  data: T;
  error?: {
    message: string;
    code?: string;
  };
}

export interface Booking {
  uid: string;
  title: string;
  description?: string;
  start: string;
  end: string;
  status: string;
  eventType?: EventType;
  attendees?: Attendee[];
  location?: string;
  cancellationReason?: string;
  reschedulingReason?: string;
  metadata?: Record<string, unknown>;
}

export interface Attendee {
  name: string;
  email: string;
  timeZone: string;
  phoneNumber?: string;
}

export interface EventType {
  id: number;
  title: string;
  slug: string;
  description?: string;
  length: number;
  hidden: boolean;
  position: number;
  teamId?: number;
  userId?: number;
  locations?: Location[];
  metadata?: Record<string, unknown>;
}

export interface Location {
  type: string;
  address?: string;
  link?: string;
}

export interface Schedule {
  id: number;
  name: string;
  timeZone: string;
  isDefault: boolean;
  availability?: AvailabilityWindow[];
}

export interface AvailabilityWindow {
  id?: number;
  days: number[];
  startTime: string;
  endTime: string;
  date?: string;
}

export interface Slot {
  time: string;
  duration?: number;
  attendees?: number;
  bookingUid?: string;
}

export interface SlotsResponse {
  [date: string]: Slot[];
}
