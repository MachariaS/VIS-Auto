import { IoAdapter } from '@nestjs/platform-socket.io';
import { INestApplicationContext } from '@nestjs/common';
import type { ServerOptions } from 'socket.io';

export class SocketIOAdapter extends IoAdapter {
  private readonly allowedOrigins: string[];

  constructor(app: INestApplicationContext, allowedOrigins: string[]) {
    super(app);
    this.allowedOrigins = allowedOrigins;
  }

  createIOServer(port: number, options?: ServerOptions) {
    return super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.allowedOrigins,
        credentials: true,
      },
    });
  }
}
