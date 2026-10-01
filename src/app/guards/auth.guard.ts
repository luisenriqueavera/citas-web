import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return true;
  const router = inject(Router);
  if (localStorage.getItem('fcv_access_token')) return true;
  return router.createUrlTree(['/login']);
};
