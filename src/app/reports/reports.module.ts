import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StoreModule } from '@ngrx/store';
import { EffectsModule } from '@ngrx/effects';
import { ReportsComponent } from './reports/reports.component';
import { reportsReducer } from './store/reports.reducer';
import { ReportsEffects } from './store/reports.effects';
import { ReportComponent } from './report/report.component';
import { FinanceModule } from '../finance/finance.module';
import { StudentReportCardsComponent } from './student-report-cards/student-report-cards.component';
// import { PaymentModule } from '../';

@NgModule({
  declarations: [
    ReportsComponent,
    ReportComponent,
    StudentReportCardsComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    FinanceModule,
    StoreModule.forFeature('reports', reportsReducer),
    EffectsModule.forFeature([ReportsEffects]),
  ],
  exports: [ReportComponent],
})
export class ReportsModule {}
