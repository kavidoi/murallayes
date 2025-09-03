import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/public.decorator';

@Controller()
export class AppController {
  @Public()
  @Get()
  getRoot(): string {
    return 'Muralla Backend API is running';
  }

  @Public()
  @Get('api/health')
  getApiHealth() {
    return {
      status: 'healthy',
      timestamp: new Date(),
      container: 'claude-code-2',
      message: 'Backend API from Instance 2',
      version: '4.0'
    };
  }

  @Public()
  @Get('api/test')
  getTestData() {
    return {
      message: 'Backend API from Instance 2',
      data: { 
        version: '4.0', 
        status: 'active',
        container: 'claude-code-2',
        port: 4000
      }
    };
  }
}
