// Socket message types for better type safety
export interface SocketMessage {
  text: string;
  sender: string;
  timestamp: string | Date;
  playerName?: string;
}

export interface SocketUser {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin: string;
}

export interface SocketSession {
  sessionId: string;
  participantCount: number;
  isActive: boolean;
  lastActivity: number;
}

export interface SocketConnection {
  connectedAt: number;
  lastActivity: number;
}
