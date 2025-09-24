import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { SignupComponent } from './signup/signup.component';
import { StoreModule } from '@ngrx/store';
import { authReducer } from './store/auth.reducer';
import { SigninComponent } from './signin/signin.component';
import { ReactiveFormsModule } from '@angular/forms';
import { EffectsModule } from '@ngrx/effects';
import { AuthEffects } from './store/auth.effects';
import { AuthGuardService } from './auth-guard.service';
import { AuthService } from './auth.service';
import { ProfileComponent } from './profile/profile.component';
import { AppRoutingModule } from '../app-routing.module';
import { PersonalDetailsComponent } from './profile/personal-details/personal-details.component';
import { ContactDetailsComponent } from './profile/contact-details/contact-details.component';
import { AcademicDetailsComponent } from './profile/academic-details/academic-details.component';
import { AccountDetailsComponent } from './profile/account-details/account-details.component';

@NgModule({
  declarations: [
    SignupComponent,
    SigninComponent,
    ProfileComponent,
    PersonalDetailsComponent,
    ContactDetailsComponent,
    AcademicDetailsComponent,
    AccountDetailsComponent,
  ],
  imports: [
    ReactiveFormsModule,
    CommonModule,
    MaterialModule,
    StoreModule.forFeature('auth', authReducer),
    EffectsModule.forFeature([AuthEffects]),
    AppRoutingModule,
  ],
  providers: [AuthGuardService, AuthService],
})
export class AuthModule {}
