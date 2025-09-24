import { Component, OnInit, OnDestroy } from '@angular/core'; // Added OnDestroy
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, combineLatest, filter, tap, takeUntil } from 'rxjs'; // Added Subject, combineLatest, filter, map, takeUntil
import { selectUser } from 'src/app/auth/store/auth.selectors';

import { selectCurrentTerm } from 'src/app/enrolment/store/enrolment.selectors';

import { ROLES } from 'src/app/registration/models/roles.enum';

import { currentTermActions } from '../../enrolment/store/enrolment.actions';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>(); // Used for unsubscribing from observables

  user$ = this.store.select(selectUser);

  currentTerm$ = this.store.select(selectCurrentTerm);

  role!: ROLES; // Role is now directly used, but could be an observable if needed

  currentTermNum!: number;
  currentTermYear!: number;

  today = new Date();

  constructor(
    private store: Store,
    public title: Title,
    private router: Router
  ) {
    // Initial dispatches based on user role when user data is available
    this.user$
      .pipe(
        filter((user) => !!user), // Ensure user is not null/undefined
        tap((user) => {
          this.role = user!.role; // Assign role here

          // Dispatch actions for admin/hod/reception/teacher roles
          if (
            [
              ROLES.admin,
              ROLES.hod,
              ROLES.reception,
              ROLES.teacher,
              ROLES.reception,
            ].includes(user!.role)
          ) {
          }
        }),
        takeUntil(this.destroy$) // Unsubscribe when component is destroyed
      )
      .subscribe();

    // Always fetch terms regardless of role
    this.store.dispatch(currentTermActions.fetchCurrentTerm());
  }

  ngOnInit(): void {
    // Determine current term and dispatch total enrols/student invoice
    // dashboard.component.ts (within ngOnInit)
    combineLatest([this.user$, this.currentTerm$]) // Assuming currentTerm$ is implemented now for backend call
      .pipe(
        filter(([user, term]) => {
          // Ensure user exists, term exists, AND term.num AND term.year are valid numbers.
          // This is the crucial change to prevent the initial undefined dispatch.
          const isValid =
            !!user &&
            !!term &&
            typeof term.num === 'number' && // <-- ADD THIS CHECK
            typeof term.year === 'number'; // <-- ADD THIS CHECK

          return isValid;
        }),
        tap(([user, term]) => {
          // At this point, we are GUARANTEED that user, term, term.num, and term.year are defined and correct
          this.currentTermNum = term.num; // No need for ! as it's guaranteed by the filter
          this.currentTermYear = term.year; // No need for ! as it's guaranteed by the filter
        }),
        takeUntil(this.destroy$)
      )
      .subscribe();
  }

  // Centralized navigation method for role-based access

  ngOnDestroy(): void {
    this.destroy$.next(); // Emit a value to complete all subscriptions
    this.destroy$.complete(); // Complete the subject
  }
}
