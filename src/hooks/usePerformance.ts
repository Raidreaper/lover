import { useEffect, useRef } from 'react';
import logger from '../lib/logger';

interface PerformanceMetrics {
  componentMountTime: number;
  renderCount: number;
  lastRenderTime: number;
}

export const usePerformance = (componentName: string) => {
  const metrics = useRef<PerformanceMetrics>({
    componentMountTime: Date.now(),
    renderCount: 0,
    lastRenderTime: Date.now()
  });

  useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (duration > 16) { // 16ms = 60fps threshold
        logger.warn(`${componentName} took ${duration.toFixed(2)}ms to render`);
      }
    };
  });

  useEffect(() => {
    metrics.current.renderCount++;
    metrics.current.lastRenderTime = Date.now();
    
    // Log performance metrics every 10 renders
    if (metrics.current.renderCount % 10 === 0) {
      const mountTime = Date.now() - metrics.current.componentMountTime;
      logger.info(`${componentName} performance: ${metrics.current.renderCount} renders, ${mountTime}ms since mount`);
    }
  });

  return metrics.current;
};

export const useRenderTime = (componentName: string) => {
  const renderStart = useRef(performance.now());
  
  useEffect(() => {
    const renderTime = performance.now() - renderStart.current;
    if (renderTime > 16) {
      logger.warn(`${componentName} render time: ${renderTime.toFixed(2)}ms`);
    }
    renderStart.current = performance.now();
  });
};
