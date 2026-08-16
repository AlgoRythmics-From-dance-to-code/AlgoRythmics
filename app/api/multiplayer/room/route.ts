import { NextResponse } from 'next/server';
import type { MultiplayerRoomState, Player } from '../../../../types/multiplayer';
import { broadcastRoomUpdate } from '../stream/route';

// In-memory Global Room Registry for Next.js server instance
interface RoomRecord {
  state: MultiplayerRoomState;
  lastUpdated: number;
}

// Global declaration for hot reload persistence in dev mode
const globalRooms = global as unknown as {
  __ALGORHYTHMICS_ROOMS__?: Map<string, RoomRecord>;
};

if (!globalRooms.__ALGORHYTHMICS_ROOMS__) {
  globalRooms.__ALGORHYTHMICS_ROOMS__ = new Map<string, RoomRecord>();
}

const rooms = globalRooms.__ALGORHYTHMICS_ROOMS__;

// Helper: Clean up expired rooms (> 4 hours inactive)
function cleanupStaleRooms() {
  const fourHoursAgo = Date.now() - 4 * 60 * 60 * 1000;
  for (const [roomId, record] of rooms.entries()) {
    if (record.lastUpdated < fourHoursAgo) {
      rooms.delete(roomId);
    }
  }
}

export async function GET(request: Request) {
  cleanupStaleRooms();
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId')?.toUpperCase().trim();

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  const record = rooms.get(roomId);
  if (!record) {
    return NextResponse.json({ error: 'Room not found', roomId }, { status: 404 });
  }

  return NextResponse.json({ room: record.state, version: record.state.version || 1 });
}

export async function POST(request: Request) {
  cleanupStaleRooms();
  try {
    const body = await request.json();
    const { action, roomId, player, roomState } = body;

    const cleanRoomId = (roomId || roomState?.roomId)?.toUpperCase().trim();

    if (!cleanRoomId) {
      return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
    }

    if (action === 'CREATE_ROOM') {
      const initialRoom: MultiplayerRoomState = roomState
        ? { ...roomState, version: 1 }
        : {
            roomId: cleanRoomId,
            status: 'lobby',
            mode: 'bubble_sort',
            controlStyle: 'spatial',
            teamSize: 4,
            players: player ? [player] : [],
            array: [],
            activeIndices: [0, 1],
            lastActionMessage: 'Szoba készen áll a csatlakozásra!',
            version: 1,
          };

      rooms.set(cleanRoomId, {
        state: initialRoom,
        lastUpdated: Date.now(),
      });

      broadcastRoomUpdate(cleanRoomId, initialRoom);
      return NextResponse.json({ success: true, room: initialRoom });
    }

    if (action === 'JOIN_ROOM') {
      let record = rooms.get(cleanRoomId);

      // If room doesn't exist yet on server, initialize it
      if (!record) {
        const createdRoom: MultiplayerRoomState = {
          roomId: cleanRoomId,
          status: 'lobby',
          mode: 'bubble_sort',
          controlStyle: 'spatial',
          teamSize: 4,
          players: player ? [{ ...player, isHost: false, currentSlot: 0 }] : [],
          array: [],
          activeIndices: [0, 1],
          lastActionMessage: `${player?.name || 'Egy új játékos'} csatlakozott!`,
          version: 1,
        };
        record = { state: createdRoom, lastUpdated: Date.now() };
        rooms.set(cleanRoomId, record);
        broadcastRoomUpdate(cleanRoomId, createdRoom);
        return NextResponse.json({ success: true, room: createdRoom });
      }

      const currentRoom = record.state;
      const joiningPlayer = player as Player;

      if (!joiningPlayer) {
        return NextResponse.json({ error: 'Player data is required' }, { status: 400 });
      }

      // Check if player is already in room
      const existingPlayerIdx = currentRoom.players.findIndex(
        (p) => p.id === joiningPlayer.id || (p.name === joiningPlayer.name && !p.isHost),
      );

      const updatedPlayers = [...currentRoom.players];
      if (existingPlayerIdx >= 0) {
        // Update existing player profile
        updatedPlayers[existingPlayerIdx] = {
          ...updatedPlayers[existingPlayerIdx],
          ...joiningPlayer,
        };
      } else {
        // Append new player to next slot
        const newPlayerWithSlot: Player = {
          ...joiningPlayer,
          isHost: false,
          currentSlot: updatedPlayers.length,
        };
        updatedPlayers.push(newPlayerWithSlot);
      }

      const nextVersion = (currentRoom.version || 1) + 1;
      const updatedRoom: MultiplayerRoomState = {
        ...currentRoom,
        players: updatedPlayers,
        lastActionMessage: `${joiningPlayer.name} csatlakozott a szobához!`,
        version: nextVersion,
      };

      record.state = updatedRoom;
      record.lastUpdated = Date.now();

      broadcastRoomUpdate(cleanRoomId, updatedRoom);
      return NextResponse.json({ success: true, room: updatedRoom });
    }

    if (action === 'UPDATE_ROOM') {
      if (!roomState) {
        return NextResponse.json({ error: 'roomState is required' }, { status: 400 });
      }

      const prevVersion = rooms.get(cleanRoomId)?.state.version || 0;
      const updatedRoom: MultiplayerRoomState = {
        ...roomState,
        version: prevVersion + 1,
      };

      rooms.set(cleanRoomId, {
        state: updatedRoom,
        lastUpdated: Date.now(),
      });

      broadcastRoomUpdate(cleanRoomId, updatedRoom);
      return NextResponse.json({ success: true, room: updatedRoom });
    }

    if (action === 'PLAYER_MOVE') {
      const record = rooms.get(cleanRoomId);
      if (record && body.playerId) {
        const { playerId, x, y } = body;
        record.state.players = record.state.players.map((p) =>
          p.id === playerId ? { ...p, x, y } : p,
        );
        record.lastUpdated = Date.now();
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Multiplayer room API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
