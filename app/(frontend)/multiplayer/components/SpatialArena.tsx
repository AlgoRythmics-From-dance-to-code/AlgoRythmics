'use client';

import React from 'react';
import type { MultiplayerRoomState, TacticalPing } from '../../../../types/multiplayer';
import CyberMatrixArena from './CyberMatrixArena';

interface SpatialArenaProps {
  room: MultiplayerRoomState;
  localPlayerId: string;
  onSwap: (idxA: number, idxB: number) => void;
  onCompare: (idxA: number, idxB: number) => void;
  onSetScannerLock?: (indices: [number, number], isLocked: boolean) => void;
  onExecuteOperatorAction?: (action: 'swap' | 'confirm_ok') => void;
  onSendTacticalPing?: (
    type: TacticalPing['type'],
    message: string,
    targetIndices?: number[],
  ) => void;
  onSendReaction?: (emoji: string) => void;
  onMove?: (x: number, y: number) => void;
}

export default function SpatialArena(props: SpatialArenaProps) {
  return <CyberMatrixArena {...props} />;
}
