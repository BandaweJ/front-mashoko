import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
  CanDeactivateFn,
} from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { selectIsLoggedIn, selectIsBootstrapAdmin } from './store/auth.selectors';

@Injectable({
  providedIn: 'root',
})
export class AuthGuardService {
  constructor(private store: Store, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return (
      this.store.select(selectIsLoggedIn) || this.router.parseUrl('/signin')
    );
  }
}

@Injectable({
  providedIn: 'root',
})
export class BootstrapGuardService {
  constructor(private store: Store, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ):
    | boolean
    | UrlTree
    | Observable<boolean | UrlTree>
    | Promise<boolean | UrlTree> {
    return (
      this.store.select(selectIsBootstrapAdmin) || this.router.parseUrl('/dashboard')
    );
  }
}

export interface CanLeaveBootstrapRegister {
  canLeave: () => Observable<boolean> | Promise<boolean> | boolean;
}

export const canLeaveBootstrapRegisterGuard: CanDeactivateFn<CanLeaveBootstrapRegister> = (
  component: CanLeaveBootstrapRegister
) => {
  return component.canLeave();
};
