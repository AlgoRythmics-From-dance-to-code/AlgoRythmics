import { NextResponse } from 'next/server';
import type { MultiplayerRoomState } from '../../../../types/multiplayer';

// Global room stream registry
type StreamController = ReadableStreamDefaultController;

const globalStreamRegistry = global as unknown as {
  __ALGORHYTHMICS_STREAM_SUBSCRIBERS__?: Map<string, Set<StreamController>>;
  __ALGORHYTHMICS_ROOMS__?: Map<string, { state: MultiplayerRoomState; lastUpdated: number }>;
};

if (!globalStreamRegistry.__ALGORHYTHMICS_STREAM_SUBSCRIBERS__) {
  globalStreamRegistry.__ALGORHYTHMICS_STREAM_SUBSCRIBERS__ = new Map<
    string,
    Set<StreamController>
  >();
}

const subscribers = globalStreamRegistry.__ALGORHYTHMICS_STREAM_SUBSCRIBERS__;

// Helper to broadcast to all open SSE connections in a room
export function broadcastRoomUpdate(roomId: string, roomState: MultiplayerRoomState) {
  const cleanId = roomId.toUpperCase().trim();
  const roomSubscribers = subscribers.get(cleanId);
  if (!roomSubscribers || roomSubscribers.size === 0) return;

  const payload = `data: ${JSON.stringify({ type: 'ROOM_UPDATE', room: roomState })}\n\n`;
  const encoder = new TextEncoder();
  const encoded = encoder.encode(payload);

  const deadControllers: StreamController[] = [];

  for (const controller of roomSubscribers) {
    try {
      controller.enqueue(encoded);
    } catch {
      deadControllers.push(controller);
    }
  }

  // Cleanup disconnected streams
  for (const dead of deadControllers) {
    roomSubscribers.delete(dead);
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get('roomId')?.toUpperCase().trim();

  if (!roomId) {
    return NextResponse.json({ error: 'Room ID is required' }, { status: 400 });
  }

  const encoder = new TextEncoder();
  let streamController: StreamController;

  const stream = new ReadableStream({
    start(controller) {
      streamController = controller;

      // Register subscriber
      let roomSubscribers = subscribers.get(roomId);
      if (!roomSubscribers) {
        roomSubscribers = new Set<StreamController>();
        subscribers.set(roomId, roomSubscribers);
      }
      roomSubscribers.add(controller);

      // Send initial room state if room exists in global memory
      const existingRoom = globalStreamRegistry.__ALGORHYTHMICS_ROOMS__?.get(roomId);
      if (existingRoom?.state) {
        const initialPayload = `data: ${JSON.stringify({
          type: 'ROOM_UPDATE',
          room: existingRoom.state,
        })}\n\n`;
        controller.enqueue(encoder.encode(initialPayload));
      }

      // Send initial keepalive and set up periodic keepalive (every 15s) to prevent proxy timeouts
      controller.enqueue(encoder.encode(': keepalive\n\n'));
      const keepAliveTimer = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keepalive\n\n'));
        } catch {
          clearInterval(keepAliveTimer);
        }
      }, 15000);

      // Store timer for cleanup
      (controller as unknown as { _keepAliveTimer?: NodeJS.Timeout })._keepAliveTimer =
        keepAliveTimer;
    },
    cancel() {
      if (streamController) {
        const timer = (streamController as unknown as { _keepAliveTimer?: NodeJS.Timeout })
          ._keepAliveTimer;
        if (timer) clearInterval(timer);
      }
      const roomSubscribers = subscribers.get(roomId);
      if (roomSubscribers && streamController) {
        roomSubscribers.delete(streamController);
        if (roomSubscribers.size === 0) {
          subscribers.delete(roomId);
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
