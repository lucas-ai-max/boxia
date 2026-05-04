import type { Request, Response, NextFunction, RequestHandler } from 'express';

// Express 4 não propaga rejections de handlers async — sem isto, qualquer throw
// vira unhandledRejection e mata o processo no Node 18+. Envolva com asyncHandler.
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
