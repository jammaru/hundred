import type { ClientMessage, ServerMessage } from '@hundred/protocol';
import { clientMessageSchema } from '@hundred/protocol';

type SocketLike = {
  send: (data: string) => void;
  close: () => void;
};

export class Hub {
  private readonly clients = new Set<SocketLike>();

  add(socket: SocketLike): void {
    this.clients.add(socket);
  }

  remove(socket: SocketLike): void {
    this.clients.delete(socket);
  }

  send(socket: SocketLike, message: ServerMessage): void {
    socket.send(JSON.stringify(message));
  }

  broadcast(message: ServerMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      client.send(payload);
    }
  }

  parse(raw: string): ClientMessage | undefined {
    try {
      return clientMessageSchema.parse(JSON.parse(raw));
    } catch {
      return undefined;
    }
  }
}
