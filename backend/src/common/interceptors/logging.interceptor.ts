import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || '';
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const elapsed = Date.now() - startTime;
          this.logger.log(
            `${method} ${url} ${statusCode} ${elapsed}ms - ${ip} ${userAgent}`,
          );
        },
        error: (error) => {
          const elapsed = Date.now() - startTime;
          this.logger.error(
            `${method} ${url} ${error.status || 500} ${elapsed}ms - ${ip} ${userAgent}`,
          );
        },
      }),
    );
  }
}
