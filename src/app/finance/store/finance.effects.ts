import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { FinanceService } from '../services/finance.service';
import { catchError, map, mergeMap, of, switchMap, tap } from 'rxjs';
import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import {
  balancesActions,
  billingActions,
  billStudentActions,
  exemptionActions,
  feesActions,
  invoiceActions,
  isNewComerActions,
  receiptActions,
} from './finance.actions';
import { PaymentsService } from '../services/payments.service';
import { EnrolService } from 'src/app/enrolment/services/enrol.service';
import { ExemptionService } from '../services/exemption.service';
@Injectable()
export class FinanceEffects {
  constructor(
    private actions$: Actions,
    private financeService: FinanceService,
    private paymentsService: PaymentsService,
    private enrolService: EnrolService,
    private exemptionService: ExemptionService,
    private snackBar: MatSnackBar
  ) {}

  fetchFees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feesActions.fetchFees),
      switchMap(() =>
        this.financeService.getAllFees().pipe(
          map((fees) => {
            // Sort the fees array here
            const sortedFees = [...fees].sort((a, b) => {
              // Replace 'name' with the property you want to sort by
              // and adjust the sorting logic as needed.
              if (a.name < b.name) {
                return -1;
              }
              if (a.name > b.name) {
                return 1;
              }
              return 0; // Equal
            });

            return feesActions.fetchFeesSuccess({
              fees: sortedFees,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(feesActions.fetchFeesFail({ ...error }))
          )
        )
      )
    )
  );

  addFees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feesActions.addFee),
      switchMap((data) =>
        this.financeService.createFee(data.fee).pipe(
          tap(() =>
            this.snackBar.open('Fees Added Successfully', 'OK', {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            })
          ),
          map((fee) => {
            return feesActions.addFeeSuccess({ fee });
          }),
          catchError((error: HttpErrorResponse) =>
            of(feesActions.addFeeFail({ ...error })).pipe(
              tap(() =>
                this.snackBar.open(error.message, 'OK', {
                  duration: 3000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                })
              )
            )
          )
        )
      )
    )
  );

  editFees$ = createEffect(() =>
    this.actions$.pipe(
      ofType(feesActions.editFee),
      switchMap((data) =>
        this.financeService.editFees(data.id, data.fee).pipe(
          tap((data) =>
            this.snackBar.open('Fees Edited Successfully', 'OK', {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            })
          ),
          map((fee) => {
            return feesActions.editFeeSuccess({
              fee,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(feesActions.editFeeFail({ ...error })).pipe(
              tap(() =>
                this.snackBar.open(error.message, 'OK', {
                  duration: 3000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                })
              )
            )
          )
        )
      )
    )
  );

  fetchStudentsToBill$ = createEffect(() =>
    this.actions$.pipe(
      ofType(billingActions.fetchStudentsToBill),
      switchMap((data) =>
        this.financeService
          .getStudentsNotYetBilledForTerm(data.num, data.year)
          .pipe(
            map((studentsToBill) => {
              return billingActions.fetchStudentsToBillSuccess({
                studentsToBill,
              });
            }),
            catchError((error: HttpErrorResponse) =>
              of(billingActions.fetchStudentsToBillFail({ ...error }))
            )
          )
      )
    )
  );

  fetchInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.fetchInvoice),
      switchMap((data) =>
        this.paymentsService
          .getInvoice(data.studentNumber, data.num, data.year)
          .pipe(
            map((invoice) => {
              return invoiceActions.fetchInvoiceSuccess({
                invoice,
              });
            }),
            catchError((error: HttpErrorResponse) =>
              of(invoiceActions.fetchInvoiceFail({ ...error }))
            )
          )
      )
    )
  );

  fetchTermInvoices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.fetchTermInvoices),
      switchMap((data) =>
        this.paymentsService.getTermInvoices(data.num, data.year).pipe(
          map((invoices) => {
            return invoiceActions.fetchTermInvoicesSuccess({
              invoices,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(invoiceActions.fetchTermInvoicesFail({ ...error }))
          )
        )
      )
    )
  );

  fetchAllInvoices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.fetchAllInvoices),
      switchMap((data) =>
        this.paymentsService.getAllInvoices().pipe(
          map((allInvoices) => {
            return invoiceActions.fetchAllInvoicesSuccess({
              allInvoices,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(invoiceActions.fetchAllInvoicesFail({ ...error }))
          )
        )
      )
    )
  );

  fetchStudentInvoices$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.fetchStudentInvoices),
      switchMap((data) =>
        this.paymentsService.getStudentInvoices(data.studentNumber).pipe(
          map((studentInvoices) => {
            return invoiceActions.fetchStudentInvoicesSuccess({
              studentInvoices,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(invoiceActions.fetchStudentInvoicesFail({ ...error }))
          )
        )
      )
    )
  );

  fetchStudentReceipts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.fetchStudentReceipts),
      switchMap((data) =>
        this.paymentsService.getStudentReceipts(data.studentNumber).pipe(
          map((studentReceipts) => {
            return receiptActions.fetchStudentReceiptsSuccess({
              studentReceipts,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(receiptActions.fetchStudentReceiptsFail({ ...error }))
          )
        )
      )
    )
  );

  fetchInvoiceStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.fetchInvoiceStats),
      switchMap((data) =>
        this.paymentsService.getInvoiceStats(data.num, data.year).pipe(
          map((invoiceStats) => {
            return invoiceActions.fetchInvoiceStatsSuccess({
              invoiceStats,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(invoiceActions.fetchInvoiceStatsFail({ ...error }))
          )
        )
      )
    )
  );

  addBalance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(balancesActions.saveBalance),
      switchMap((data) =>
        this.financeService.createFeesBalance(data.balance).pipe(
          tap(() =>
            this.snackBar.open('Balance Added Successfully', 'OK', {
              duration: 3000,
              verticalPosition: 'top',
              horizontalPosition: 'center',
            })
          ),
          map((balance) => {
            return balancesActions.saveBalanceSuccess({ balance });
          }),
          catchError((error: HttpErrorResponse) =>
            of(balancesActions.saveBalanceFail({ ...error })).pipe(
              tap(() =>
                this.snackBar.open(error.error.message, 'OK', {
                  duration: 3000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                })
              )
            )
          )
        )
      )
    )
  );

  isNewComer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(isNewComerActions.checkIsNewComer),
      switchMap((data) =>
        this.enrolService.isNewComer(data.studentNumber).pipe(
          map((isNewComer) => {
            return isNewComerActions.checkIsNewComerSuccess({
              isNewComer,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(isNewComerActions.checkIsNewComerFail({ ...error }))
          )
        )
      )
    )
  );

  // AMENDED downloadInvoice$ effect
  downloadInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.downloadInvoice),
      switchMap(({ invoiceNumber }) =>
        this.paymentsService.downloadInvoice(invoiceNumber).pipe(
          tap((response: HttpResponse<Blob>) => {
            // <--- Receive HttpResponse
            const blob = response.body; // Extract the Blob
            let filename = `Invoice_${invoiceNumber}.pdf`; // Default filename

            // Extract filename from Content-Disposition header, like your old function
            const contentDisposition = response.headers.get(
              'Content-Disposition'
            );
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename\*?=['"]?(.*?)['"]?(;|$)/i
              );
              if (filenameMatch && filenameMatch[1]) {
                try {
                  // Decode URI component to handle non-ASCII characters properly
                  filename = decodeURIComponent(
                    filenameMatch[1].replace(/^utf-8''/, '')
                  );
                } catch (e) {
                  filename = filenameMatch[1].replace(/"/g, ''); // Fallback for simple cases
                }
              }
            }

            if (blob) {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              document.body.appendChild(a);
              a.href = url;
              a.download = filename; // Use the extracted filename
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              this.snackBar.open('Invoice downloaded successfully', 'OK', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              });
            } else {
              this.snackBar.open(
                'Error: No file data received for invoice download.',
                'OK',
                {
                  duration: 5000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                }
              );
            }
          }),
          map(({ headers }) => {
            // Map returns filename from headers
            let filename = `Invoice_${invoiceNumber}.pdf`;
            const contentDisposition = headers.get('Content-Disposition');
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename\*?=['"]?(.*?)['"]?(;|$)/i
              );
              if (filenameMatch && filenameMatch[1]) {
                try {
                  filename = decodeURIComponent(
                    filenameMatch[1].replace(/^utf-8''/, '')
                  );
                } catch (e) {
                  filename = filenameMatch[1].replace(/"/g, '');
                }
              }
            }
            return invoiceActions.downloadInvoiceSuccess({
              fileName: filename,
            });
          }),
          catchError((error: HttpErrorResponse) => {
            this.snackBar.open(
              `Error downloading invoice: ${error.message}`,
              'OK',
              {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              }
            );
            return of(invoiceActions.downloadInvoiceFail({ ...error }));
          })
        )
      )
    )
  );

  saveInvoice$ = createEffect(() =>
    this.actions$.pipe(
      ofType(invoiceActions.saveInvoice),
      switchMap((data) =>
        this.paymentsService.saveInvoice(data.invoice).pipe(
          tap((invoice) =>
            this.snackBar.open(
              'Invoice saved successfully' + invoice.invoiceNumber,
              'OK',
              {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              }
            )
          ), // Log service success
          map((invoice) => invoiceActions.saveInvoiceSuccess({ invoice })),
          catchError((error: HttpErrorResponse) => {
            return of(
              invoiceActions.saveInvoiceFail({
                ...error,
              })
            );
          })
        )
      )
    )
  );

  fetchStudentOutstandingBalance$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.fetchStudentOutstandingBalance),
      switchMap((data) =>
        this.paymentsService
          .getStudentOutstandingBalance(data.studentNumber)
          .pipe(
            map(({ amountDue }) => {
              return receiptActions.fetchStudentOutstandingBalanceSuccess({
                amountDue,
              });
            }),
            catchError((error: HttpErrorResponse) =>
              of(
                receiptActions.fetchStudentOutstandingBalanceFail({ ...error })
              )
            )
          )
      )
    )
  );

  fetchAllReceipts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.fetchAllReceipts),
      switchMap(() =>
        this.paymentsService.getAllReceipts().pipe(
          map((allReceipts) => {
            return receiptActions.fetchAllReceiptsSuccess({
              allReceipts,
            });
          }),
          catchError((error: HttpErrorResponse) =>
            of(receiptActions.fetchAllReceiptsFail({ ...error }))
          )
        )
      )
    )
  );

  saveReceipt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.saveReceipt),
      switchMap((data) =>
        this.paymentsService
          .saveReceipt(
            data.studentNumber,
            data.amountPaid,
            data.paymentMethod,
            data.description
          )
          .pipe(
            tap((receipt) =>
              this.snackBar.open(
                'Receipt saved successfully' + receipt.receiptNumber,
                'OK',
                {
                  duration: 3000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                }
              )
            ), // Log service success
            map((receipt) => receiptActions.saveReceiptSuccess({ receipt })),
            catchError((error: HttpErrorResponse) => {
              return of(
                receiptActions.saveReceiptFail({
                  ...error,
                })
              );
            })
          )
      )
    )
  );

  downloadReceipt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.downloadReceiptPdf),
      switchMap(({ receiptNumber }) =>
        this.paymentsService.downloadReceipt(receiptNumber).pipe(
          tap((response: HttpResponse<Blob>) => {
            // <--- Receive HttpResponse
            const blob = response.body; // Extract the Blob
            let filename = `Receipt_${receiptNumber}.pdf`; // Default filename

            // Extract filename from Content-Disposition header, like your old function
            const contentDisposition = response.headers.get(
              'Content-Disposition'
            );
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename\*?=['"]?(.*?)['"]?(;|$)/i
              );
              if (filenameMatch && filenameMatch[1]) {
                try {
                  filename = decodeURIComponent(
                    filenameMatch[1].replace(/^utf-8''/, '')
                  );
                } catch (e) {
                  filename = filenameMatch[1].replace(/"/g, '');
                }
              }
            }

            if (blob) {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              document.body.appendChild(a);
              a.href = url;
              a.download = filename; // Use the extracted filename
              a.click();
              window.URL.revokeObjectURL(url);
              document.body.removeChild(a);
              this.snackBar.open('Receipt downloaded successfully', 'OK', {
                duration: 3000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              });
            } else {
              this.snackBar.open(
                'Error: No file data received for receipt download.',
                'OK',
                {
                  duration: 5000,
                  verticalPosition: 'top',
                  horizontalPosition: 'center',
                }
              );
            }
          }),
          map(({ headers }) => {
            // Map returns filename from headers
            let filename = `Receipt_${receiptNumber}.pdf`;
            const contentDisposition = headers.get('Content-Disposition');
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(
                /filename\*?=['"]?(.*?)['"]?(;|$)/i
              );
              if (filenameMatch && filenameMatch[1]) {
                try {
                  filename = decodeURIComponent(
                    filenameMatch[1].replace(/^utf-8''/, '')
                  );
                } catch (e) {
                  filename = filenameMatch[1].replace(/"/g, '');
                }
              }
            }
            return receiptActions.downloadReceiptPdfSuccess({
              fileName: filename,
            });
          }),
          catchError((error: HttpErrorResponse) => {
            this.snackBar.open(
              `Error downloading receipt: ${error.message}`,
              'OK',
              {
                duration: 5000,
                verticalPosition: 'top',
                horizontalPosition: 'center',
              }
            );
            return of(receiptActions.downloadReceiptPdfFail({ ...error }));
          })
        )
      )
    )
  );

  createExemption$ = createEffect(() =>
    this.actions$.pipe(
      ofType(exemptionActions.createExemption), // Listen for the createExemption action
      switchMap(({ exemption }) =>
        this.exemptionService.createExemption(exemption).pipe(
          map((createdExemption) => {
            // Show success message
            this.snackBar.open('Exemption created successfully!', 'Close', {
              duration: 3000,
              panelClass: ['success-snackbar'], // Optional: for custom styling
            });
            // Dispatch success action with the created exemption
            return exemptionActions.createExemptionSuccess({
              exemption: createdExemption,
            });
          }),
          catchError((error: HttpErrorResponse) => {
            let errorMessage = 'An unknown error occurred.';
            if (error.error && error.error.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            // Show error message
            this.snackBar.open(`Error: ${errorMessage}`, 'Close', {
              duration: 5000,
              panelClass: ['error-snackbar'], // Optional: for custom styling
            });
            // Dispatch failure action with the error message
            return of(
              exemptionActions.createExemptionFailure({ error: errorMessage })
            );
          })
        )
      )
    )
  );

  voidReceipt$ = createEffect(() =>
    this.actions$.pipe(
      ofType(receiptActions.voidReceipt),
      mergeMap(({ receiptId }) =>
        this.paymentsService.voidReceipt(receiptId).pipe(
          // Call the new voidReceipt method in your service
          map((receipt) => {
            this.snackBar.open('Receipt voided successfully!', 'Close', {
              duration: 3000,
            });
            return receiptActions.voidReceiptSuccess({ receipt });
          }),
          catchError((error) => {
            console.error('Error voiding receipt:', error);
            const errorMessage =
              error.error?.message || 'Failed to void receipt.';
            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
            return of(receiptActions.voidReceiptFailure({ error }));
          })
        )
      )
    )
  );
}
