import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('fcv_access_token');
  if (!token || request.url.includes('/api/auth/')) return next(request);
  return next(request.clone({setHeaders: {Authorization: `Bearer ${token}`}}));
};
