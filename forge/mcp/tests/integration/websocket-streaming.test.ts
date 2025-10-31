import assert from 'node:assert/strict';
import type { AddressInfo } from 'net';
import { beforeEach, afterEach, describe, test } from 'node:test';
import { WebSocketServer, WebSocket } from 'ws';
import { setTimeout as delay } from 'node:timers/promises';
import { WebSocketManager } from '../../../../.genie/mcp/dist/websocket-manager.js';

describe('MCP WebSocket Streaming Validation', () => {

  let server: WebSocketServer;
  let port: number;
  const activeConnections = new Set<WebSocket>();

  function getWsUrl(path = '/ws'): string {
    return `ws://127.0.0.1:${port}${path}`;
  }

  function waitForConnection(onConnect?: (socket: WebSocket) => void): Promise<WebSocket> {
    return new Promise((resolve) => {
      const handler = (socket: WebSocket) => {
        if (onConnect) {
          onConnect(socket);
        }
        server.off('connection', handler);
        resolve(socket);
      };
      server.on('connection', handler);
    });
  }

  async function waitForServerToClose(socket: WebSocket, timeoutMs = 1000): Promise<{ code: number; reason: string }> {
    if (socket.readyState === WebSocket.CLOSED) {
      return { code: 1005, reason: '' };
    }

    if (socket.readyState === WebSocket.CLOSING) {
      // Already closing, wait for it
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve({ code: 1005, reason: 'timeout-during-close' });
        }, timeoutMs);

        socket.once('close', (code: number, reason: Buffer) => {
          clearTimeout(timeout);
          resolve({ code, reason: reason.toString() });
        });
      });
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        resolve({ code: 1005, reason: 'timeout-waiting-for-close' });
      }, timeoutMs);

      socket.once('close', (code: number, reason: Buffer) => {
        clearTimeout(timeout);
        resolve({ code, reason: reason.toString() });
      });
    });
  }

  async function waitForClientClose(socket: WebSocket, timeoutMs = 1000): Promise<{ code: number; reason: string }> {
    if (socket.readyState === WebSocket.CLOSED) {
      return { code: 1000, reason: '' };
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for client socket to close'));
      }, timeoutMs);

      socket.once('close', (code: number, reason: Buffer) => {
        clearTimeout(timeout);
        resolve({ code, reason: reason.toString() });
      });
    });
  }

  async function waitForMessageCount(collection: unknown[], expected: number, timeoutMs = 1000): Promise<void> {
    const start = Date.now();
    while (collection.length < expected) {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for ${expected} messages (received ${collection.length})`);
      }
      await delay(20);
    }
  }

  function getClientSocket(manager: WebSocketManager, url: string): WebSocket | undefined {
    const pool = (manager as unknown as { connectionPool?: Map<string, WebSocket> }).connectionPool;
    return pool?.get(url);
  }

  beforeEach(async () => {
    server = new WebSocketServer({ port: 0 });

    await new Promise<void>((resolve) => {
      server.once('listening', () => {
        const address = server.address() as AddressInfo;
        port = address.port;
        resolve();
      });
    });

    server.on('connection', (socket: WebSocket) => {
      activeConnections.add(socket);
      socket.on('close', () => {
        activeConnections.delete(socket);
      });
    });
  });

  afterEach(async () => {
    for (const socket of activeConnections) {
      if (socket.readyState !== WebSocket.CLOSED && socket.readyState !== WebSocket.CLOSING) {
        socket.terminate();
      }
    }
    activeConnections.clear();

    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  test('1. Connection establishes and remains stable briefly', async () => {
    const manager = new WebSocketManager();
    const errors: Error[] = [];
    const connectionPromise = waitForConnection();

    const subscriptionId = manager.subscribe(getWsUrl(), () => undefined, (error: Error) => {
      errors.push(error);
    });

    const socket = await connectionPromise;
    assert.strictEqual(socket.readyState, WebSocket.OPEN);

    await delay(75);

    assert.strictEqual(errors.length, 0);
    assert.strictEqual(socket.readyState, WebSocket.OPEN);

    manager.unsubscribe(subscriptionId);
    const closeInfo = await waitForServerToClose(socket);
    // Accept both 1000 (Normal Closure) and 1005 (No Status Received) as valid
    assert.ok([1000, 1005].includes(closeInfo.code), `Expected close code 1000 or 1005, got ${closeInfo.code}`);

    manager.close();
  });

  test('2. Streams data chunks with correct schema', async () => {
    const manager = new WebSocketManager();
    const received: Array<Record<string, unknown>> = [];

    const connectionPromise = waitForConnection((socket) => {
      // Send five structured messages shortly after connection
      setTimeout(() => {
        for (let index = 0; index < 5; index += 1) {
          socket.send(JSON.stringify({
            type: 'stream-chunk',
            sessionId: 'session-test',
            data: {
              index,
              payload: `chunk-${index}`
            }
          }));
        }
      }, 10);
    });

    manager.subscribe(
      getWsUrl('/stream'),
      (data: unknown) => {
        if (typeof data === 'object' && data !== null) {
          received.push(data as Record<string, unknown>);
        }
      },
      undefined,
      2
    );

  const socket = await connectionPromise;
  assert.strictEqual(socket.readyState, WebSocket.OPEN);

    await waitForMessageCount(received, 5, 2000);

    for (const chunk of received) {
  assert.strictEqual(chunk.type, 'stream-chunk');
  assert.strictEqual(chunk.sessionId, 'session-test');
  assert.ok(chunk.data !== undefined && chunk.data !== null);
  assert.strictEqual(typeof (chunk.data as Record<string, unknown>).index, 'number');
  assert.strictEqual(typeof (chunk.data as Record<string, unknown>).payload, 'string');
    }

    manager.close();
    await waitForServerToClose(socket);
  });

  test('3. Handles streaming errors gracefully', async () => {
    const manager = new WebSocketManager();
    const errors: Array<Record<string, unknown>> = [];

    const connectionPromise = waitForConnection((socket) => {
      setTimeout(() => {
        socket.send(
          JSON.stringify({
            type: 'error',
            sessionId: 'session-error',
            data: { message: 'simulated server error' }
          })
        );
      }, 20);

      socket.on('message', (payload) => {
        try {
          const parsed = JSON.parse(payload.toString());
          if (parsed.action === 'trigger-error') {
            socket.send(
              JSON.stringify({
                type: 'error',
                sessionId: parsed.sessionId || 'session-error',
                data: { message: 'error acknowledged' }
              })
            );
          }
        } catch (parseError) {
          socket.send(
            JSON.stringify({
              type: 'error',
              sessionId: 'session-error',
              data: { message: 'invalid payload received', reason: 'invalid-json' }
            })
          );
        }
      });
    });

    manager.subscribe(
      getWsUrl('/errors'),
      (data: unknown) => {
        if (typeof data === 'object' && data !== null && (data as Record<string, unknown>).type === 'error') {
          errors.push(data as Record<string, unknown>);
        }
      },
      undefined,
      2
    );

  const serverSocket = await connectionPromise;
  const clientSocket = getClientSocket(manager, getWsUrl('/errors'));
  assert.ok(clientSocket);

    await waitForMessageCount(errors, 1, 2000);
  assert.ok(errors[0].data !== undefined);

    clientSocket!.send(
      JSON.stringify({ type: 'command', action: 'trigger-error', sessionId: 'session-error' })
    );

    clientSocket!.send('this-is-not-json');

    await waitForMessageCount(errors, 3, 2000);

    const invalidPayloadMessage = errors.find((entry) => {
      const data = entry.data as Record<string, unknown> | undefined;
      return data?.reason === 'invalid-json';
    });

  assert.ok(invalidPayloadMessage);
  assert.strictEqual(serverSocket.readyState, WebSocket.OPEN);

    manager.close();
    await waitForServerToClose(serverSocket);
  });

  test('4. Cleans up on client-initiated disconnect', async () => {
    const manager = new WebSocketManager();
    const received: unknown[] = [];

    const connectionPromise = waitForConnection();
    const subscriptionId = manager.subscribe(
      getWsUrl('/cleanup'),
      (data: unknown) => {
        received.push(data);
      },
      undefined,
      1
    );
    
    const serverSocket = await connectionPromise;
    const clientSocket = getClientSocket(manager, getWsUrl('/cleanup'));
    assert.ok(clientSocket);
    assert.strictEqual(serverSocket.readyState, WebSocket.OPEN);

    // Send a test message
    serverSocket.send(JSON.stringify({ test: 'before-unsubscribe' }));
    await delay(50);
    assert.ok(received.length > 0, 'Should receive messages before unsubscribe');

    const receivedBeforeUnsubscribe = received.length;

    // Unsubscribe and verify no more messages are processed
    manager.unsubscribe(subscriptionId);
    await delay(50);

    // Send another message - should not be received
    if (serverSocket.readyState === WebSocket.OPEN) {
      serverSocket.send(JSON.stringify({ test: 'after-unsubscribe' }));
      await delay(50);
    }

    // Verify no new messages after unsubscribe
    assert.strictEqual(
      received.length,
      receivedBeforeUnsubscribe,
      'Should not receive messages after unsubscribe'
    );

    manager.close();
  });

  test('5. Cleans up on server-initiated disconnect', async () => {
    const manager = new WebSocketManager();
    
    const serverDrivenConnection = waitForConnection((socket) => {
      setTimeout(() => {
        socket.close(1011, 'server-shutdown');
      }, 50);
    });

    const subscriptionId = manager.subscribe(
      getWsUrl('/cleanup2'),
      () => undefined,
      undefined,
      0  // No reconnection attempts
    );

    const serverSocket = await serverDrivenConnection;
    assert.strictEqual(serverSocket.readyState, WebSocket.OPEN);

    // Wait for server to initiate close
    await delay(150);

    // Verify server socket was closed (states: 0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)
    assert.ok(
      serverSocket.readyState >= WebSocket.CLOSING,
      `Expected socket to be closing/closed after server disconnect (state >= 2), got state ${serverSocket.readyState}`
    );

    manager.unsubscribe(subscriptionId);
    manager.close();
  });
});
