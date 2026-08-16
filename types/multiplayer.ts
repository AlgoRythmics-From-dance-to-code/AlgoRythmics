export type MultiplayerGameMode =
  | 'bubble_sort'
  | 'quick_sort'
  | 'binary_search'
  | 'merge_sort'
  | 'selection_sort';

export type MultiplayerControlStyle = 'spatial' | 'discrete' | 'physical';

export type RoomStatus = 'lobby' | 'countdown' | 'playing' | 'completed';

export type CyberRole = 'scanner' | 'operator' | 'overclocker' | 'conductor';

export interface TacticalPing {
  id: string;
  senderId: string;
  senderName: string;
  type: 'scan_request' | 'swap_request' | 'ok_request' | 'hurry' | 'cheer';
  message: string;
  targetIndices?: number[];
  timestamp: number;
}

export interface ScannerLock {
  lockedIndices: [number, number];
  isLocked: boolean;
  scannerPlayerId: string;
  scannerPlayerName: string;
  conditionMet: boolean; // true if left > right
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  color: string; // Hex color (e.g. #06b6d4, #10b981, #a855f7, #f59e0b, #f43f5e, #6366f1)
  value: number; // Value held by this player's circle
  targetIndex?: number; // Desired target slot
  currentSlot: number; // Current logical slot index in the array
  isHost: boolean;
  isBot: boolean;
  cyberRole?: CyberRole;
  role?: 'pointer_left' | 'pointer_right' | 'pivot' | 'standard';
  // Physical 2D coordinates for Spatial mode
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  trail: Array<{ x: number; y: number; alpha: number }>;
  // Statistics
  swapsCount: number;
  comparisonsCount: number;
  errorsCount: number;
  score: number;
}

export type StepActionType =
  | 'compare'
  | 'swap'
  | 'move_pointer'
  | 'partition'
  | 'invalid_swap'
  | 'invalid_compare'
  | 'sync_bonus'
  | 'pivot_selected';

export interface StepActionLog {
  id: string;
  timestamp: number; // ms from match start
  playerId: string;
  playerName: string;
  actionType: StepActionType;
  indices: number[];
  values: number[];
  isSuccess: boolean;
  message: string;
  codeSnippet?: string;
}

export interface PlayerStatSummary {
  playerId: string;
  playerName: string;
  color: string;
  isBot: boolean;
  swapsCount: number;
  comparisonsCount: number;
  errorsCount: number;
  contributionScore: number;
  accuracy: number;
}

export interface MatchStatistics {
  matchId: string;
  roomId: string;
  mode: MultiplayerGameMode;
  controlStyle: MultiplayerControlStyle;
  teamSize: number;
  startTime: number;
  endTime: number;
  durationMs: number;
  totalComparisons: number;
  totalSwaps: number;
  totalErrors: number;
  accuracyPercentage: number;
  choreographyScore: number; // 0-100% based on smooth spatial swaps & rhythm
  initialArray: number[];
  finalArray: number[];
  isSortedCorrectly: boolean;
  theoreticalComplexity: string; // e.g. "O(N²)", "O(N log N)", "O(log N)"
  actualSteps: number;
  playerStats: PlayerStatSummary[];
  stepLogs: StepActionLog[];
}

export interface PendingHandshake {
  action: 'swap' | 'compare';
  indices: [number, number];
  readyPlayerIds: string[]; // IDs of players who have confirmed this action
  timestamp: number;
}

export interface ReactionEvent {
  id: string;
  playerId: string;
  playerName: string;
  emoji: string;
  timestamp: number;
}

export interface PositionVerification {
  swappedPair: {
    playerA: { id: string; name: string; oldSlot: number; targetSlot: number; confirmed: boolean };
    playerB: { id: string; name: string; oldSlot: number; targetSlot: number; confirmed: boolean };
  };
  indices: [number, number];
  timestamp: number;
}

export interface MultiplayerRoomState {
  roomId: string;
  status: RoomStatus;
  mode: MultiplayerGameMode;
  controlStyle: MultiplayerControlStyle;
  teamSize: number;
  players: Player[];
  array: number[];
  targetValue?: number; // For binary search
  searchRange?: { left: number; right: number; mid?: number }; // For binary search
  pivotIndex?: number; // For quicksort
  leftPartition?: number[];
  rightPartition?: number[];
  activeIndices: number[]; // Indices currently being compared/swapped
  scannerLock?: ScannerLock | null; // Asymmetric Scanner targeting state
  tacticalPings?: TacticalPing[]; // Fast Co-Op Tactical Communication Pings
  firewallHeat?: number; // 0-100% core temperature
  firewallTimeRemaining?: number; // Countdown seconds before breach
  pendingHandshake?: PendingHandshake | null; // For synchronous dual-handshake confirmation
  positionVerification?: PositionVerification | null; // Post-swap classroom position verification
  reactions?: ReactionEvent[]; // Live floating emote reactions
  teamSynergy?: number; // 0-100% based on synchronous team coordination
  lastActionMessage?: string;
  currentCodeLine?: string;
  startTime?: number;
  endTime?: number;
  stats?: MatchStatistics;
  version?: number; // Monotonic revision number to prevent redundant re-renders
}
