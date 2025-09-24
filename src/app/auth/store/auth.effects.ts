import { Injectable } from '@angular/core';
import { Actions, ofType, createEffect } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, exhaustMap, map, tap } from 'rxjs/operators';
import {
  signinActions,
  signupActions,
  accountStatsActions,
  userDetailsActions,
  logout,
  checkAuthStatus,
  // No need to import signinFailure directly now, it's part of signinActions
} from './auth.actions';
import { AuthService } from '../auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import jwt_decode from 'jwt-decode';
import { User } from '../models/user.model';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  signinEffect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signinActions.signin), // Use grouped action
      exhaustMap((credentials) =>
        this.authService.signin(credentials.signinData).pipe(
          map((resp) => {
            const user: User = jwt_decode(resp.accessToken);

            localStorage.setItem('token', resp.accessToken);

            const payload = {
              ...resp,
              user,
            };

            this.router.navigateByUrl('/dashboard');
            return signinActions.signinSuccess(payload); // Use grouped action
          }),
          catchError(
            (error: HttpErrorResponse) =>
              of(signinActions.signinFailure({ ...error })) // Use grouped action
          )
        )
      )
    )
  );

  signupEffect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(signupActions.signup), // Use grouped action
      exhaustMap((credentials) =>
        this.authService.signup(credentials.signupData).pipe(
          tap(() =>
            this.snackBar.open('Account created successfully', 'Close', {
              duration: 3000,
            })
          ),
          map((resp) => {
            return signupActions.signupSuccess(resp); // Use grouped action
          }),
          catchError(
            (error: HttpErrorResponse) =>
              of(signupActions.signupFailure({ ...error })) // Use grouped action
          )
        )
      )
    )
  );

  fetchAccountsStatsEffect$ = createEffect(() =>
    this.actions$.pipe(
      ofType(accountStatsActions.fetchAccountStats), // Use grouped action
      exhaustMap(() =>
        this.authService.getAccountsStats().pipe(
          map((stats) => {
            return accountStatsActions.fetchAccountStatsSuccess({ stats }); // Use grouped action
          }),
          catchError(
            (error: HttpErrorResponse) =>
              of(accountStatsActions.fetchAccountStatsFailure({ ...error })) // Use grouped action
          )
        )
      )
    )
  );

  fetchUserDetails$ = createEffect(() =>
    this.actions$.pipe(
      ofType(userDetailsActions.fetchUser), // Use grouped action
      exhaustMap((data) =>
        this.authService.fetchUserDetails(data.id, data.role).pipe(
          map((user) => {
            return userDetailsActions.fetchUserSuccess({
              user,
            }); // Use grouped action
          }),
          catchError(
            (error: HttpErrorResponse) =>
              of(
                userDetailsActions.fetchUserFail({
                  ...error,
                })
              ) // Use grouped action
          )
        )
      )
    )
  );

  logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(logout), // Still an individual action
        tap(() => {
          localStorage.removeItem('token');
          this.router.navigateByUrl('/signin');
        })
      ),
    { dispatch: false }
  );

  checkAuthStatus$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(checkAuthStatus), // Still an individual action
        map(() => {
          const authStatus = this.authService.getAuthStatus();

          if (
            authStatus.isLoggedIn &&
            authStatus.user &&
            authStatus.accessToken
          ) {
            this.router.navigateByUrl('/dashboard');
            return signinActions.signinSuccess({
              // Use grouped action for dispatch
              user: authStatus.user,
              accessToken: authStatus.accessToken,
            });
          } else {
            localStorage.removeItem('token');
            this.router.navigateByUrl('/signin');
            return logout(); // Still an individual action
          }
        })
      )
    // No `dispatch: false` because this effect explicitly dispatches `signinSuccess` or `logout`.
  );
}
