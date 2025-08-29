import { Router, Request, Response } from 'express';
import { checkDatabaseHealth } from '@/utils/database';
import { HealthCheckResponse } from '@/types';
import { asyncHandler } from '@/middleware/errorHandler';

const router = Router();

// Basic health check endpoint
router.get('/', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database health
    const databaseStatus = await checkDatabaseHealth();
    
    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryUsed = memoryUsage.heapUsed;
    const memoryTotal = memoryUsage.heapTotal;
    const memoryPercentage = Math.round((memoryUsed / memoryTotal) * 100);
    
    // Calculate uptime
    const uptime = Math.floor(process.uptime());
    
    // Determine overall health status
    const isHealthy = databaseStatus.connected;
    
    const healthResponse: HealthCheckResponse = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime,
      database: databaseStatus,
      memory: {
        used: memoryUsed,
        total: memoryTotal,
        percentage: memoryPercentage,
      },
    };
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json({
      success: isHealthy,
      data: healthResponse,
      responseTime: Date.now() - startTime,
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Health check failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });
  }
}));

// Detailed health check with system information
router.get('/detailed', asyncHandler(async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    // Check database health
    const databaseStatus = await checkDatabaseHealth();
    
    // Get system information
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Environment information
    const environment = {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    
    // Service information
    const service = {
      name: 'MayaLens API',
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      pid: process.pid,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
    };
    
    // Memory information
    const memory = {
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal,
      external: memoryUsage.external,
      rss: memoryUsage.rss,
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };
    
    // CPU information
    const cpu = {
      user: cpuUsage.user,
      system: cpuUsage.system,
    };
    
    const isHealthy = databaseStatus.connected;
    
    const detailedHealth = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      service,
      environment,
      database: databaseStatus,
      memory,
      cpu,
      checks: {
        database: databaseStatus.connected ? 'pass' : 'fail',
        memory: memory.percentage < 90 ? 'pass' : 'warn',
      },
    };
    
    const statusCode = isHealthy ? 200 : 503;
    res.status(statusCode).json({
      success: isHealthy,
      data: detailedHealth,
      responseTime: Date.now() - startTime,
    });
    
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      error: 'Detailed health check failed',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
    });
  }
}));

// Readiness probe for Kubernetes/Railway
router.get('/ready', asyncHandler(async (req: Request, res: Response) => {
  try {
    const databaseStatus = await checkDatabaseHealth();
    
    if (databaseStatus.connected) {
      res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString(),
      });
    } else {
      res.status(503).json({
        success: false,
        status: 'not ready',
        error: 'Database not available',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'not ready',
      error: 'Readiness check failed',
      timestamp: new Date().toISOString(),
    });
  }
}));

// Liveness probe for Kubernetes/Railway
router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
  });
});

export default router;