import { NextResponse } from 'next/server';
import crypto from 'crypto';
import type { MultiplayerRoomState, Player } from '../../../../types/multiplayer';
import { broadcastRoomUpdate } from '../stream/route';

// In-memory Global Room Registry for Next.js server instance
interface ParticipantAuth {
  playerId: string;
  isHost: boolean;
}

interface RoomRecord {
  state: MultiplayerRoomState;
  lastUpdated: number;
  participantTokens: Map<string, ParticipantAuth>;
}

// Global declaration for hot reload persistence in dev mode
const globalRooms = global as unknown as {
  __ALGORHYTHMICS_ROOMS__?: Map<string, RoomRecord>;
};

if (!globalRooms.__ALGORHYTHMICS_ROOMS__) {
  globalRooms.__ALGORHYTHMICS_ROOMS__ = new Map<string, RoomRecord>();
}

const rooms = globalRooms.__ALGORHYTHMICS_ROOMS__;
const MAX_CONCURRENT_ROOMS = 200;
const MAX_PAYLOAD_SIZE = 64 * 1024; // 64 KB limit
const ROOM_ID_REGEX = /^[A-Z0-9_-]{3,24}$/i;

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

  if (!roomId || !ROOM_ID_REGEX.test(roomId)) {
    return NextResponse.json({ error: 'Valid Room ID is required' }, { status: 400 });
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
    const rawBody = await request.text();

    // Payload size guard to prevent DoS via huge bodies
    if (rawBody.length > MAX_PAYLOAD_SIZE) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
    }

    const body = JSON.parse(rawBody);
    const { action, roomId, player, roomState } = body;

    const cleanRoomId = (roomId || roomState?.roomId)?.toUpperCase().trim();

    if (!cleanRoomId || !ROOM_ID_REGEX.test(cleanRoomId)) {
      return NextResponse.json(
        { error: 'Valid Room ID is required (3-24 alphanumeric chars)' },
        { status: 400 },
      );
    }

    if (action === 'CREATE_ROOM') {
      if (rooms.size >= MAX_CONCURRENT_ROOMS && !rooms.has(cleanRoomId)) {
        cleanupStaleRooms();
        if (rooms.size >= MAX_CONCURRENT_ROOMS) {
          return NextResponse.json(
            { error: 'Server room capacity reached. Try again shortly.' },
            { status: 429 },
          );
        }
      }

      const hostPlayer: Player | undefined =
        player ||
        (roomState?.players || []).find((p: Player) => p.isHost) ||
        (roomState?.players || [])[0];

      const hostToken = crypto.randomUUID();
      const participantTokens = new Map<string, ParticipantAuth>();
      if (hostPlayer?.id) {
        participantTokens.set(hostToken, { playerId: hostPlayer.id, isHost: true });
      }

      const initialRoom: MultiplayerRoomState = roomState
        ? {
            ...roomState,
            roomId: cleanRoomId,
            players: (roomState.players || []).slice(0, 16),
            array: (roomState.array || []).slice(0, 32),
            version: 1,
          }
        : {
            roomId: cleanRoomId,
            status: 'lobby',
            mode: 'bubble_sort',
            controlStyle: 'physical',
            teamSize: 4,
            players: hostPlayer ? [hostPlayer] : [],
            array: [],
            activeIndices: [0, 1],
            lastActionMessage: 'Szoba készen áll a csatlakozásra!',
            version: 1,
          };

      rooms.set(cleanRoomId, {
        state: initialRoom,
        lastUpdated: Date.now(),
        participantTokens,
      });

      broadcastRoomUpdate(cleanRoomId, initialRoom);
      return NextResponse.json({
        success: true,
        room: initialRoom,
        participantToken: hostToken,
      });
    }

    if (action === 'JOIN_ROOM') {
      let record = rooms.get(cleanRoomId);
      const joiningPlayer = player as Player;

      if (!joiningPlayer || !joiningPlayer.id || !joiningPlayer.name) {
        return NextResponse.json({ error: 'Valid player data is required' }, { status: 400 });
      }

      // If room doesn't exist yet on server, initialize it
      if (!record) {
        if (rooms.size >= MAX_CONCURRENT_ROOMS) {
          return NextResponse.json({ error: 'Server room capacity reached.' }, { status: 429 });
        }
        const guestToken = crypto.randomUUID();
        const participantTokens = new Map<string, ParticipantAuth>();
        participantTokens.set(guestToken, { playerId: joiningPlayer.id, isHost: false });

        const createdRoom: MultiplayerRoomState = {
          roomId: cleanRoomId,
          status: 'lobby',
          mode: 'bubble_sort',
          controlStyle: 'physical',
          teamSize: 4,
          players: [{ ...joiningPlayer, isHost: false, currentSlot: 0 }],
          array: [],
          activeIndices: [0, 1],
          lastActionMessage: `${joiningPlayer.name} csatlakozott!`,
          version: 1,
        };
        record = {
          state: createdRoom,
          lastUpdated: Date.now(),
          participantTokens,
        };
        rooms.set(cleanRoomId, record);
        broadcastRoomUpdate(cleanRoomId, createdRoom);
        return NextResponse.json({
          success: true,
          room: createdRoom,
          participantToken: guestToken,
        });
      }

      if (!record.participantTokens) {
        record.participantTokens = new Map<string, ParticipantAuth>();
      }

      const currentRoom = record.state;

      // Check if player is already in room by unique ID
      const existingPlayerIdx = currentRoom.players.findIndex((p) => p.id === joiningPlayer.id);

      const updatedPlayers = [...currentRoom.players];
      let isHost = false;
      if (existingPlayerIdx >= 0) {
        // Update existing player profile while preserving host status
        isHost = updatedPlayers[existingPlayerIdx].isHost ?? false;
        updatedPlayers[existingPlayerIdx] = {
          ...updatedPlayers[existingPlayerIdx],
          ...joiningPlayer,
          isHost,
          currentSlot: updatedPlayers[existingPlayerIdx].currentSlot ?? existingPlayerIdx,
        };
      } else {
        // Enforce maximum players limit (16)
        if (updatedPlayers.length >= 16) {
          return NextResponse.json({ error: 'Room is full (max 16 players)' }, { status: 400 });
        }

        // If duplicate display name exists in room, disambiguate it
        let uniqueName = joiningPlayer.name;
        const matchingNamesCount = updatedPlayers.filter(
          (p) => p.name === joiningPlayer.name || p.name.startsWith(`${joiningPlayer.name} (`),
        ).length;
        if (matchingNamesCount > 0) {
          uniqueName = `${joiningPlayer.name} (${matchingNamesCount + 1})`;
        }

        // Append new player to next slot
        const newPlayerWithSlot: Player = {
          ...joiningPlayer,
          name: uniqueName,
          isHost: false,
          currentSlot: updatedPlayers.length,
        };
        updatedPlayers.push(newPlayerWithSlot);
      }

      // Reuse existing token if present for this playerId, otherwise generate a new one
      let participantToken: string | undefined;
      for (const [t, auth] of record.participantTokens.entries()) {
        if (auth.playerId === joiningPlayer.id) {
          participantToken = t;
          break;
        }
      }
      if (!participantToken) {
        participantToken = crypto.randomUUID();
      }
      record.participantTokens.set(participantToken, {
        playerId: joiningPlayer.id,
        isHost,
      });

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
      return NextResponse.json({
        success: true,
        room: updatedRoom,
        participantToken,
      });
    }

    if (action === 'UPDATE_ROOM') {
      if (!roomState || typeof roomState !== 'object') {
        return NextResponse.json({ error: 'roomState is required' }, { status: 400 });
      }

      const existingRecord = rooms.get(cleanRoomId);

      if (!existingRecord) {
        return NextResponse.json({ error: 'Room not found' }, { status: 404 });
      }

      // Authenticate the caller using a participant token
      const token =
        request.headers.get('x-participant-token') ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
        body.participantToken;

      if (!token) {
        return NextResponse.json(
          { error: 'Unauthorized: Participant token is required to update room state' },
          { status: 401 },
        );
      }

      if (!existingRecord.participantTokens) {
        existingRecord.participantTokens = new Map<string, ParticipantAuth>();
      }

      const participant = existingRecord.participantTokens.get(token);
      if (!participant) {
        return NextResponse.json(
          { error: 'Forbidden: Invalid or expired participant token' },
          { status: 403 },
        );
      }

      // Ensure caller is an active player in this room
      const callerPlayer = existingRecord.state.players.find((p) => p.id === participant.playerId);
      if (!callerPlayer) {
        return NextResponse.json(
          { error: 'Forbidden: Caller is no longer an active player in this room' },
          { status: 403 },
        );
      }

      const incomingPlayers = Array.isArray(roomState.players) ? roomState.players : [];
      const existingHost = existingRecord.state.players.find((p) => p.isHost);
      const isCallerHost = participant.isHost || callerPlayer.isHost;

      // 1. Host preservation rule: existing host cannot be removed or demoted
      if (
        existingHost &&
        !incomingPlayers.some((p: Player) => p.id === existingHost.id && p.isHost)
      ) {
        return NextResponse.json(
          { error: 'Unauthorized: Cannot remove or demote room host during update' },
          { status: 403 },
        );
      }

      // 2. Non-host participant authorization: cannot remove players from the roster
      if (!isCallerHost) {
        for (const existingPlayer of existingRecord.state.players) {
          if (!incomingPlayers.some((p: Player) => p.id === existingPlayer.id)) {
            return NextResponse.json(
              { error: 'Forbidden: Non-host participants cannot remove players from the room' },
              { status: 403 },
            );
          }
        }
      }

      const nextVersion = (existingRecord.state.version || 0) + 1;
      const sanitizedState: MultiplayerRoomState = {
        ...roomState,
        roomId: cleanRoomId,
        players: (roomState.players || []).slice(0, 16),
        array: (roomState.array || []).slice(0, 32),
        version: nextVersion,
      };

      rooms.set(cleanRoomId, {
        state: sanitizedState,
        lastUpdated: Date.now(),
        participantTokens: existingRecord.participantTokens,
      });

      broadcastRoomUpdate(cleanRoomId, sanitizedState);
      return NextResponse.json({ success: true, room: sanitizedState });
    }

    if (action === 'PLAYER_MOVE') {
      const record = rooms.get(cleanRoomId);
      if (!record || !body.playerId) {
        return NextResponse.json({ error: 'Room or playerId not found' }, { status: 400 });
      }

      // If token provided, verify ownership of playerId
      const token =
        request.headers.get('x-participant-token') ||
        request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
        body.participantToken;
      if (token && record.participantTokens) {
        const participant = record.participantTokens.get(token);
        if (participant && participant.playerId !== body.playerId) {
          return NextResponse.json(
            { error: 'Forbidden: Cannot move other players' },
            { status: 403 },
          );
        }
      }

      const { playerId, x, y } = body;
      record.state.players = record.state.players.map((p) =>
        p.id === playerId ? { ...p, x, y } : p,
      );
      record.lastUpdated = Date.now();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('Multiplayer room API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
