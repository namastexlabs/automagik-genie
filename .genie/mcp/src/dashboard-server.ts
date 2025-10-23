/**
 * Dashboard Server - HTTP + WebSocket server for real-time stats
 *
 * Provides REST API and WebSocket streaming for engagement statistics.
 * Runs alongside the MCP server on a separate port (default: 8886).
 *
 * Features:
 * - HTTP REST API for stats queries (/api/stats/*)
 * - WebSocket streaming for real-time updates (/api/stats/stream)
 * - CORS enabled for frontend development
 * - Event-driven architecture for stats updates
 */

import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { StatsService } from './services/stats-service.js';

// ============================================================================
// Types
// ============================================================================

export interface DashboardServerConfig {
  port: number;
  statsService: StatsService;
  enableCors?: boolean;
}

interface StatsEventData {
  type: 'token_update' | 'task_completed' | 'milestone_reached' | 'session_started' | 'session_ended';
  sessionId: string;
  data: any;
}

// ============================================================================
// Dashboard Server
// ============================================================================

export class DashboardServer {
  private httpServer: http.Server;
  private wss: WebSocketServer;
  private statsService: StatsService;
  private port: number;
  private enableCors: boolean;

  // Connected WebSocket clients
  private clients: Set<WebSocket> = new Set();

  constructor(config: DashboardServerConfig) {
    this.statsService = config.statsService;
    this.port = config.port;
    this.enableCors = config.enableCors !== false; // Default true

    // Create HTTP server
    this.httpServer = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    // Create WebSocket server (attached to HTTP server)
    this.wss = new WebSocketServer({
      server: this.httpServer,
      path: '/api/stats/stream'
    });

    this.setupWebSocketHandlers();
  }

  /**
   * Start the dashboard server
   */
  start(): void {
    this.httpServer.listen(this.port, () => {
      console.error(`📊 Dashboard server started on port ${this.port}`);
      console.error(`   HTTP API: http://localhost:${this.port}/api/stats`);
      console.error(`   WebSocket: ws://localhost:${this.port}/api/stats/stream`);
    });
  }

  /**
   * Stop the dashboard server
   */
  stop(): void {
    // Close all WebSocket connections
    this.clients.forEach(client => {
      client.close();
    });

    // Close WebSocket server
    this.wss.close();

    // Close HTTP server
    this.httpServer.close(() => {
      console.error('📊 Dashboard server stopped');
    });
  }

  /**
   * Emit stats event to all connected WebSocket clients
   */
  emitStatsEvent(event: StatsEventData): void {
    const message = JSON.stringify(event);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // ============================================================================
  // HTTP Request Handling
  // ============================================================================

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    // CORS headers
    if (this.enableCors) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
    }

    const url = req.url || '/';

    // Route handling
    if (url.startsWith('/api/stats/session/current')) {
      this.handleGetCurrentSession(req, res);
    } else if (url.startsWith('/api/stats/session/')) {
      const sessionId = url.split('/').pop() || '';
      this.handleGetSession(sessionId, req, res);
    } else if (url.startsWith('/api/stats/monthly/')) {
      const month = url.split('/').pop() || '';
      this.handleGetMonthlyStats(month, req, res);
    } else if (url === '/api/stats/all-time') {
      this.handleGetAllTimeStats(req, res);
    } else if (url === '/api/stats/streak') {
      this.handleGetStreak(req, res);
    } else if (url === '/api/stats/today') {
      this.handleGetTodayStats(req, res);
    } else if (url === '/health') {
      this.handleHealth(req, res);
    } else {
      this.send404(res);
    }
  }

  private handleGetCurrentSession(req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const session = this.statsService.getCurrentSession();
      this.sendJson(res, session || { error: 'No active session' });
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleGetSession(sessionId: string, req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const session = this.statsService.getCurrentSession(sessionId);
      this.sendJson(res, session || { error: 'Session not found' });
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleGetMonthlyStats(month: string, req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const stats = this.statsService.getMonthlyStats(month);
      this.sendJson(res, stats);
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleGetAllTimeStats(req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const stats = this.statsService.getAllTimeStats();
      this.sendJson(res, stats);
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleGetStreak(req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const streak = this.statsService.calculateStreak();
      this.sendJson(res, streak);
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleGetTodayStats(req: http.IncomingMessage, res: http.ServerResponse): void {
    try {
      const stats = this.statsService.getTodayStats();
      this.sendJson(res, stats);
    } catch (error: any) {
      this.sendError(res, 500, error.message);
    }
  }

  private handleHealth(req: http.IncomingMessage, res: http.ServerResponse): void {
    this.sendJson(res, {
      status: 'ok',
      service: 'genie-dashboard',
      timestamp: new Date().toISOString(),
      websocket: {
        connected_clients: this.clients.size
      }
    });
  }

  // ============================================================================
  // WebSocket Handling
  // ============================================================================

  private setupWebSocketHandlers(): void {
    this.wss.on('connection', (ws: WebSocket) => {
      console.error('📊 WebSocket client connected');
      this.clients.add(ws);

      // Send initial session state
      const currentSession = this.statsService.getCurrentSession();
      if (currentSession) {
        ws.send(JSON.stringify({
          type: 'session_started',
          sessionId: currentSession.id,
          data: currentSession
        }));
      }

      // Handle client disconnection
      ws.on('close', () => {
        console.error('📊 WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('📊 WebSocket error:', error);
        this.clients.delete(ws);
      });
    });
  }

  // ============================================================================
  // Response Helpers
  // ============================================================================

  private sendJson(res: http.ServerResponse, data: any): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  }

  private sendError(res: http.ServerResponse, status: number, message: string): void {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: message }));
  }

  private send404(res: http.ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
}

// ============================================================================
// Event Emitter Helpers (for integration with StatsService)
// ============================================================================

/**
 * Stats event emitter singleton
 * Used by StatsService to broadcast events to dashboard server
 */
class StatsEventEmitter {
  private dashboardServer: DashboardServer | null = null;

  setDashboardServer(server: DashboardServer): void {
    this.dashboardServer = server;
  }

  emitTokenUpdate(sessionId: string, tokens: number): void {
    if (this.dashboardServer) {
      this.dashboardServer.emitStatsEvent({
        type: 'token_update',
        sessionId,
        data: { tokens }
      });
    }
  }

  emitTaskCompleted(sessionId: string, taskId: string): void {
    if (this.dashboardServer) {
      this.dashboardServer.emitStatsEvent({
        type: 'task_completed',
        sessionId,
        data: { taskId }
      });
    }
  }

  emitMilestoneReached(sessionId: string, milestone: { type: string; value: number; title: string }): void {
    if (this.dashboardServer) {
      this.dashboardServer.emitStatsEvent({
        type: 'milestone_reached',
        sessionId,
        data: milestone
      });
    }
  }

  emitSessionStarted(sessionId: string, projectId: string): void {
    if (this.dashboardServer) {
      this.dashboardServer.emitStatsEvent({
        type: 'session_started',
        sessionId,
        data: { projectId }
      });
    }
  }

  emitSessionEnded(sessionId: string): void {
    if (this.dashboardServer) {
      this.dashboardServer.emitStatsEvent({
        type: 'session_ended',
        sessionId,
        data: {}
      });
    }
  }
}

export const statsEventEmitter = new StatsEventEmitter();
