import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      port: process.env.PORT || 3001
    };
  }

  @Get('detailed')
  checkDetailed() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        api: 'running',
        database: 'supabase_configured',
        gemini: process.env.GEMINI_API_KEY ? 'configured' : 'not_configured'
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    };
  }
}
