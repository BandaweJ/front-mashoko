import { Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TeachersService } from 'src/app/registration/services/teachers.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Observable, first, map, of, switchMap } from 'rxjs';
import { selectAddSuccess } from 'src/app/registration/store/registration.selectors';
import { CanLeaveBootstrapRegister } from '../auth-guard.service';

@Component({
  selector: 'app-bootstrap-register',
  templateUrl: './bootstrap-register.component.html',
  styleUrls: ['./bootstrap-register.component.css'],
})
export class BootstrapRegisterComponent implements CanLeaveBootstrapRegister {
  constructor(
    private fb: FormBuilder,
    private teachersService: TeachersService,
    private router: Router,
    private store: Store,
    private snackBar: MatSnackBar
  ) {}

  isSubmitting = false;
  submissionSucceeded = false;
  errorMessage: string | null = null;

  form = this.fb.group({
    id: [
      '',
      [Validators.required, Validators.pattern(/^\d{8}[A-Za-z]\d{2}$/)],
    ],
    name: ['', [Validators.required]],
    surname: ['', [Validators.required]],
    gender: ['', [Validators.required]],
    title: ['', [Validators.required]],
    cell: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    address: ['', [Validators.required]],
    qualifications: [''],
    role: ['admin'],
  });

  submit() {
    if (this.form.invalid || this.isSubmitting) {
      return;
    }
    this.isSubmitting = true;
    this.errorMessage = null;

    const payload: any = {
      ...this.form.value,
      qualifications: (this.form.value.qualifications || '')
        .split(',')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 0),
      active: true,
    };

    this.teachersService.addTeacher(payload).subscribe({
      next: () => {
        this.submissionSucceeded = true;
        this.snackBar.open(
          'Profile saved. Please sign up with your new credentials.',
          'Close',
          { duration: 4000 }
        );
        localStorage.removeItem('token');
        this.router.navigate(['/signup']);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.errorMessage = 'Failed to save profile. Please try again.';
      },
    });
  }

  canLeave(): Observable<boolean> | boolean {
    // If already submitted successfully, allow leaving
    if (this.submissionSucceeded) {
      return true;
    }

    // If the user is logged out, allow leaving (e.g., after pressing Logout)
    return this.store.select((state: any) => state.auth?.isLoggedin === true).pipe(
      first(),
      switchMap((isLoggedIn) => {
        if (!isLoggedIn) {
          return of(true);
        }
        // Otherwise, fall back to existing success condition from registration store
        return this.store.select(selectAddSuccess).pipe(
          first(),
          map((success) => !!success)
        );
      })
    );
  }
}


