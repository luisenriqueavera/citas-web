import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FcvDataService } from '../services/fcv-data.service';
import { UserRole } from '../models/fcv.models';

export const roleGuard = (allowed: UserRole[]): CanActivateFn => () => {
  const fcvService = inject(FcvDataService);
  const router = inject(Router);
  if (allowed.includes(fcvService.currentUser().role)) return true;
  return router.createUrlTree(['/paciente/inicio']);
};
