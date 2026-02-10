/**
 * Utility functions to map between shadcn/ui Select string values
 * and backend enum/variant types (RoomType, ResidentStatus)
 */

import { RoomType, ResidentStatus } from '../backend';

// ============================================================================
// RoomType Mapping
// ============================================================================

export const ROOM_TYPE_STRING_VALUES = {
  SOLO: 'solo',
  SHARED: 'sharedRoom',
} as const;

export function roomTypeToString(roomType: RoomType): string {
  switch (roomType) {
    case RoomType.solo:
      return ROOM_TYPE_STRING_VALUES.SOLO;
    case RoomType.sharedRoom:
      return ROOM_TYPE_STRING_VALUES.SHARED;
    default:
      return ROOM_TYPE_STRING_VALUES.SOLO;
  }
}

export function stringToRoomType(value: string): RoomType {
  switch (value) {
    case ROOM_TYPE_STRING_VALUES.SOLO:
      return RoomType.solo;
    case ROOM_TYPE_STRING_VALUES.SHARED:
      return RoomType.sharedRoom;
    default:
      return RoomType.solo;
  }
}

/**
 * Alias for stringToRoomType for backward compatibility
 */
export function mapRoomTypeToBackend(value: string): RoomType {
  return stringToRoomType(value);
}

/**
 * Alias for roomTypeToString for backward compatibility
 */
export function mapRoomTypeFromBackend(roomType: RoomType): string {
  return roomTypeToString(roomType);
}

// ============================================================================
// ResidentStatus Mapping
// ============================================================================

export const RESIDENT_STATUS_STRING_VALUES = {
  ACTIVE: 'active',
  DISCHARGED: 'discharged',
} as const;

export function residentStatusToString(status: ResidentStatus): string {
  switch (status) {
    case ResidentStatus.active:
      return RESIDENT_STATUS_STRING_VALUES.ACTIVE;
    case ResidentStatus.discharged:
      return RESIDENT_STATUS_STRING_VALUES.DISCHARGED;
    default:
      return RESIDENT_STATUS_STRING_VALUES.ACTIVE;
  }
}

export function stringToResidentStatus(value: string): ResidentStatus {
  switch (value) {
    case RESIDENT_STATUS_STRING_VALUES.ACTIVE:
      return ResidentStatus.active;
    case RESIDENT_STATUS_STRING_VALUES.DISCHARGED:
      return ResidentStatus.discharged;
    default:
      return ResidentStatus.active;
  }
}

/**
 * Alias for residentStatusToString for backward compatibility
 */
export function mapResidentStatusFromBackend(status: ResidentStatus): string {
  return residentStatusToString(status);
}

/**
 * Alias for stringToResidentStatus for backward compatibility
 */
export function mapResidentStatusToBackend(value: string): ResidentStatus {
  return stringToResidentStatus(value);
}
