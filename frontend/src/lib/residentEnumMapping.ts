import { RoomType } from '../backend';

// Local enum for resident status since it's not exported from backend
export type ResidentStatusLocal = 'active' | 'discharged';

// ─── RoomType mapping ─────────────────────────────────────────────────────────

export function mapRoomTypeToBackend(value: string): RoomType {
  switch (value) {
    case 'solo':
      return RoomType.solo;
    case 'sharedRoom':
      return RoomType.sharedRoom;
    default:
      return RoomType.solo;
  }
}

export function mapRoomTypeFromBackend(roomType: RoomType | string): string {
  if (roomType === RoomType.solo || roomType === 'solo') return 'solo';
  if (roomType === RoomType.sharedRoom || roomType === 'sharedRoom') return 'sharedRoom';
  return 'solo';
}

// ─── ResidentStatus mapping ───────────────────────────────────────────────────

export function mapResidentStatusFromBackend(status: string): ResidentStatusLocal {
  if (status === 'active') return 'active';
  if (status === 'discharged') return 'discharged';
  return 'active';
}

// Backward-compatible aliases
export { mapRoomTypeToBackend as mapRoomTypeToSelect };
export { mapRoomTypeFromBackend as mapRoomTypeFromSelect };
