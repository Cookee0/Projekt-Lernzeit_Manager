import { HttpInterceptorFn } from '@angular/common/http';
import { readToken } from '../token-storage';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = readToken();
  if (token) {
    const cloned = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
    return next(cloned);
  }
  return next(req);
};
