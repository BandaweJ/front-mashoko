import { Component, OnInit, OnDestroy } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { BehaviorSubject, combineLatest, map, Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';

// Import your models and actions
import { ReceiptModel } from '../models/payment.model';
import { ReceiptFilter } from '../models/receipt-filter.model';
import { FilterReceiptsDialogComponent } from './filter-receipts-dialog/filter-receipts-dialog.component';

// Import your NgRx selectors and actions
import { receiptActions } from '../store/finance.actions';
import { AddReceiptDialogComponent } from './add-receipt-dialog/add-receipt-dialog.component';
import { selectAllReceipts } from '../store/finance.selector';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css'],
})
export class PaymentsComponent implements OnInit, OnDestroy {
  // UI State
  isSearchBarVisible: boolean = false;
  selectedReceipt: ReceiptModel | null = null;

  // Sorting Options
  sortOptions = [
    { label: 'Date (Newest First)', value: 'paymentDateDesc' },
    { label: 'Date (Oldest First)', value: 'paymentDateAsc' },
    { label: 'Amount (Highest First)', value: 'amountPaidDesc' },
    { label: 'Amount (Lowest First)', value: 'amountPaidAsc' },
    { label: 'Student Name (A-Z)', value: 'studentNameAsc' },
  ];

  // Reactive Streams for Filtering and Sorting
  private currentFiltersSubject = new BehaviorSubject<ReceiptFilter>({});
  currentFilters$ = this.currentFiltersSubject.asObservable();

  private currentSortSubject = new BehaviorSubject<string>('paymentDateDesc');
  currentSort$ = this.currentSortSubject.asObservable();

  // Stream of all receipts from the NgRx store
  allReceipts$: Observable<ReceiptModel[]> = this.store.pipe(
    select(selectAllReceipts)
  );

  // The final observable that combines all receipts, current filters, and current sort
  filteredAndSortedReceipts$: Observable<ReceiptModel[]>;

  private ngUnsubscribe = new Subject<void>();

  // Define the limit for the number of displayed receipts
  private readonly DISPLAY_LIMIT = 50; // You can make this configurable if needed

  constructor(private dialog: MatDialog, private store: Store) {
    this.filteredAndSortedReceipts$ = combineLatest([
      this.allReceipts$,
      this.currentFilters$,
      this.currentSort$,
    ]).pipe(
      map(([receipts, filters, sort]) => {
        let processedReceipts = [...receipts];

        // 1. Apply Filters
        processedReceipts = this.applyFilters(processedReceipts, filters);

        // 2. Apply Sorting
        processedReceipts = this.applySorting(processedReceipts, sort);

        // 3. Apply the display limit after filtering and sorting
        processedReceipts = processedReceipts.slice(0, this.DISPLAY_LIMIT);

        return processedReceipts;
      })
    );
  }

  ngOnInit(): void {
    this.store.dispatch(receiptActions.fetchAllReceipts());
  }

  ngOnDestroy(): void {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  toggleSearchBar(): void {
    this.isSearchBarVisible = !this.isSearchBarVisible;
    if (!this.isSearchBarVisible) {
      this.selectedReceipt = null;
    }
  }

  onFilter(): void {
    const dialogRef = this.dialog.open(FilterReceiptsDialogComponent, {
      width: '400px',
      data: { currentFilters: { ...this.currentFiltersSubject.value } },
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((result) => {
        if (result !== undefined) {
          this.currentFiltersSubject.next(result);
          console.log('Filters applied:', result);
        } else {
          console.log('Filter dialog closed without applying changes.');
        }
      });
  }

  onSortChange(sortValue: string): void {
    this.currentSortSubject.next(sortValue);
    console.log('Sort changed to:', sortValue);
  }

  onViewReceiptDetails(receipt: ReceiptModel): void {
    console.log('Viewing details for receipt:', receipt);
    this.selectedReceipt = receipt;
  }

  onReceiptSelectedFromSearch(receipt: ReceiptModel): void {
    this.selectedReceipt = receipt;
    this.isSearchBarVisible = false;
  }

  private applyFilters(
    receipts: ReceiptModel[],
    filters: ReceiptFilter
  ): ReceiptModel[] {
    return receipts.filter((receipt) => {
      // Date Range
      if (
        filters.startDate &&
        new Date(receipt.paymentDate) < new Date(filters.startDate)
      )
        return false;
      if (
        filters.endDate &&
        new Date(receipt.paymentDate) > new Date(filters.endDate)
      )
        return false;

      // Student ID
      if (
        filters.studentNumber &&
        receipt.student.studentNumber !== filters.studentNumber
      )
        return false;

      // Amount Range
      if (
        filters.minAmount !== null &&
        filters.minAmount !== undefined &&
        receipt.amountPaid < filters.minAmount
      )
        return false;
      if (
        filters.maxAmount !== null &&
        filters.maxAmount !== undefined &&
        receipt.amountPaid > filters.maxAmount
      )
        return false;

      // Payment Methods (multi-select)
      if (
        filters.paymentMethods &&
        filters.paymentMethods.length > 0 &&
        !filters.paymentMethods.includes(receipt.paymentMethod)
      )
        return false;

      // Approved Status
      if (
        filters.approved !== null &&
        filters.approved !== undefined &&
        receipt.approved !== filters.approved
      )
        return false;

      // Served By
      if (
        filters.servedBy &&
        !receipt.servedBy
          ?.toLowerCase()
          .includes(filters.servedBy.toLowerCase())
      )
        return false;

      return true;
    });
  }

  private applySorting(receipts: ReceiptModel[], sort: string): ReceiptModel[] {
    const sortedReceipts = [...receipts];

    switch (sort) {
      case 'paymentDateDesc':
        return sortedReceipts.sort(
          (a, b) =>
            new Date(b.paymentDate).getTime() -
            new Date(a.paymentDate).getTime()
        );
      case 'paymentDateAsc':
        return sortedReceipts.sort(
          (a, b) =>
            new Date(a.paymentDate).getTime() -
            new Date(b.paymentDate).getTime()
        );
      case 'amountPaidDesc':
        return sortedReceipts.sort((a, b) => b.amountPaid - a.amountPaid);
      case 'amountPaidAsc':
        return sortedReceipts.sort((a, b) => a.amountPaid - b.amountPaid);
      case 'studentNameAsc':
        return sortedReceipts.sort((a, b) => {
          const nameA = `${a.student.name} ${a.student.surname}`.toLowerCase();
          const nameB = `${b.student.name} ${b.student.surname}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      default:
        return sortedReceipts;
    }
  }

  onAddReceipt(): void {
    console.log('FAB clicked: Opening Add New Receipt dialog');
    const dialogRef = this.dialog.open(AddReceiptDialogComponent, {
      width: '600px',
      disableClose: true,
    });

    dialogRef
      .afterClosed()
      .pipe(takeUntil(this.ngUnsubscribe))
      .subscribe((newReceipt: ReceiptModel | undefined) => {
        if (newReceipt) {
          console.log(
            'New receipt created and received from dialog:',
            newReceipt
          );
          this.selectedReceipt = newReceipt;
        } else {
          console.log(
            'Add Receipt dialog closed without a new receipt (cancelled or failed)'
          );
        }
      });
  }
}
