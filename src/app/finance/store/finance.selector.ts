// finance.selector.ts
import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromFinanceReducer from './finance.reducer';
import { InvoiceModel } from '../models/invoice.model';
import { ReceiptModel } from '../models/payment.model';
import { PaymentHistoryItem } from '../models/payment-history.model';
import { PaymentMethods } from '../enums/payment-methods.enum';
import {
  selectClasses,
  selectTermEnrols,
  selectTerms,
} from 'src/app/enrolment/store/enrolment.selectors';
import { TermsModel } from 'src/app/enrolment/models/terms.model';
import { FinanceDataModel } from '../models/finance-data.model';
import {
  OutstandingFeesReportData,
  OutstandingFeesReportFilters,
  OutstandingStudentDetail,
} from '../models/outstanding-fees.model';
import { selectStudents } from 'src/app/registration/store/registration.selectors';
import { StudentsModel } from 'src/app/registration/models/students.model';
import { EnrolsModel } from 'src/app/enrolment/models/enrols.model';
import {
  AgedDebtorsReportData,
  AgedDebtorsReportFilters,
  AgedInvoiceSummary,
} from '../models/aged-debtors-report.model';
import { ClassesModel } from 'src/app/enrolment/models/classes.model';
import {
  RevenueRecognitionReportData,
  RevenueRecognitionReportFilters,
  RevenueRecognitionSummary,
} from '../models/revenue-recognition-report.model';
import {
  EnrollmentBillingReportData,
  EnrollmentBillingReportDetail,
  EnrollmentBillingReportFilters,
  EnrollmentBillingReportSummary,
} from '../models/enrollment-billing-reconciliation-report.model';

export const financeState =
  createFeatureSelector<fromFinanceReducer.State>('finance');

// --- Existing Selectors (No changes needed for these initial ones) ---
export const selectCurrentExemption = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.exemption
);

export const selectExemptionsLoading = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.exemptionLoading
);

export const selectExemptionsError = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.exemptionError
);

export const selectFees = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.fees
);

export const selectIsLoading = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.isLoading
);

export const selectErrorMsg = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.errorMessage
);

export const selectStudentsToBill = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.studentsToBill
);

export const selectedStudentInvoice = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.selectedStudentInvoice
);

export const selectIsNewComer = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.isNewComer
);

export const selectInVoiceStats = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.invoiceStats
);

export const selectTermInvoices = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.termInvoices
);

export const selectAllInvoices = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.allInvoices
);

export const selectCreatedReceipt = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.createdReceipt
);

export const selectAmountDue = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.studentOutstandingBalance
);

// --- MODIFICATION START: New base selector for non-voided receipts ---
// Create a new selector that filters out voided receipts from the main collection
export const selectAllNonVoidedReceipts = createSelector(
  financeState,
  (state: fromFinanceReducer.State) =>
    (state.allReceipts || []).filter((receipt) => !receipt.isVoided)
);
// --- MODIFICATION END ---

// This one needs to use the non-voided receipts now
export const selectAllReceipts = createSelector(
  // This selector still exists but will now call the filtered version
  financeState,
  (state: fromFinanceReducer.State) => state.allReceipts // We will now update any usages of this selector to use selectAllNonVoidedReceipts
);

export const selectIsLoadingFinancials = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.isLoadingStudentBalance
);

export const selectFechInvoiceError = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.fetchInvoiceError
);

export const selectStudentInvoices = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.studentInvoices
);

// --- MODIFICATION START: Use selectAllNonVoidedReceipts for student receipts as well ---
export const selectStudentReceipts = createSelector(
  financeState,
  (state: fromFinanceReducer.State) =>
    (state.studentReceipts || []).filter((receipt) => !receipt.isVoided)
);
// --- MODIFICATION END ---

export const selectLoadingStudentInvoices = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.loadingStudentInvoices
);

export const selectLoadingStudentReceipts = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.loadingStudentReceipts
);

export const selectLoadStudentInvoicesErr = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.loadStudentInvoicesErr
);

export const selectLoadStudentReceiptsErr = createSelector(
  financeState,
  (state: fromFinanceReducer.State) => state.loadStudentReceiptsErr
);

// NEW: Selector to combine invoices and receipts into a chronological payment history
// --- MODIFICATION START: Remove 'approved' check from here as well ---
export const selectCombinedPaymentHistory = createSelector(
  selectStudentInvoices,
  selectStudentReceipts, // This now automatically provides non-voided receipts
  (
    invoices: InvoiceModel[] | null,
    receipts: ReceiptModel[] | null // These will be non-voided
  ): PaymentHistoryItem[] => {
    const history: PaymentHistoryItem[] = [];

    // 1. Add Invoices as 'debits' or 'charges'
    if (invoices) {
      invoices.forEach((invoice) => {
        history.push({
          id: `INV-${invoice.invoiceNumber}`, // Unique ID for this history item
          type: 'Invoice',
          date: new Date(invoice.invoiceDate),
          description: `Invoice #${invoice.invoiceNumber} for ${invoice.enrol.name} (${invoice.enrol.year})`,
          amount: invoice.totalBill,
          direction: 'out', // Outgoing financial obligation
          relatedDocNumber: invoice.invoiceNumber,
          status: invoice.status,
        });
      });
    }

    // 2. Add Receipts as 'payments received'
    if (receipts) {
      receipts.forEach((receipt) => {
        // No longer checking receipt.approved here, as all non-voided are considered valid
        history.push({
          id: `REC-${receipt.receiptNumber}`, // Unique ID for this history item
          type: 'Payment',
          date: new Date(receipt.paymentDate),
          description: `Payment by ${receipt.paymentMethod}`,
          amount: receipt.amountPaid,
          direction: 'in', // Incoming payment
          relatedDocNumber: receipt.receiptNumber,
          paymentMethod: receipt.paymentMethod,
          status: 'Processed', // Can set a generic 'Processed' status if approved is always true now
        });

        // 3. Add Allocations from Receipts as separate events if desired
        if (receipt.allocations) {
          receipt.allocations.forEach((allocation) => {
            history.push({
              id: `ALLOC-${allocation.receiptId}-${allocation.invoice.invoiceNumber}`, // Unique ID
              type: 'Allocation',
              date: new Date(allocation.allocationDate),
              description: `Payment of ${allocation.amountApplied} 'applied to Invoice #'${allocation.invoice.invoiceNumber} from Receipt #${receipt.receiptNumber}`,
              amount: allocation.amountApplied,
              direction: 'in', // This allocation reduced an outgoing debt
              relatedDocNumber: allocation.invoice.invoiceNumber,
            });
          });
        }
      });
    }

    // Sort the history chronologically (newest first for a "history" view, or oldest first)
    // Let's sort oldest first (ascending date) for a historical timeline
    history.sort((a, b) => a.date.getTime() - b.date.getTime());

    return history;
  }
);
// --- MODIFICATION END ---

// --- Student Ledger Report Specific Selectors ---
export interface LedgerEntry extends PaymentHistoryItem {
  runningBalance: number; // Add running balance to each entry
}

export const getStudentLedger = (studentNumber: string) =>
  createSelector(
    selectAllInvoices,
    selectAllNonVoidedReceipts, // --- MODIFICATION: Use selectAllNonVoidedReceipts ---
    (
      allInvoices: InvoiceModel[] | null,
      allReceipts: ReceiptModel[] | null // These will now be non-voided
    ): LedgerEntry[] => {
      if (!studentNumber || (!allInvoices && !allReceipts)) {
        return [];
      }

      const ledgerEntries: PaymentHistoryItem[] = [];

      // Filter invoices for the specific student
      const studentInvoices = (allInvoices || []).filter(
        (inv) => inv.student?.studentNumber === studentNumber
      );

      // Filter receipts for the specific student (already non-voided from upstream selector)
      const studentReceipts = (allReceipts || []).filter(
        (rec) => rec.student?.studentNumber === studentNumber
      );

      // 1. Process Invoices (Debit entries)
      studentInvoices.forEach((invoice) => {
        let termInfo = '';
        if (invoice.enrol?.num && invoice.enrol?.year) {
          termInfo = ` (Term ${invoice.enrol.num}, ${invoice.enrol.year})`;
        } else if (invoice.enrol?.year) {
          termInfo = ` (${invoice.enrol.year})`;
        }

        ledgerEntries.push({
          id: `INV-${invoice.id}`,
          type: 'Invoice',
          date: new Date(invoice.invoiceDate),
          description: `Invoice #${invoice.invoiceNumber} for ${invoice.enrol?.name}${termInfo}`,
          amount: +invoice.totalBill,
          direction: 'out',
          relatedDocNumber: invoice.invoiceNumber,
          status: invoice.status,
        });
      });

      // 2. Process Receipts and their Allocations
      studentReceipts.forEach((receipt) => {
        // These are already filtered for non-voided
        // No longer checking receipt.approved here, as all non-voided are considered valid for ledger
        ledgerEntries.push({
          id: `REC-${receipt.id}`,
          type: 'Payment',
          date: new Date(receipt.paymentDate),
          description: `Payment received by ${receipt.paymentMethod}`,
          amount: +receipt.amountPaid,
          direction: 'in',
          relatedDocNumber: receipt.receiptNumber,
          paymentMethod: receipt.paymentMethod,
          status: 'Processed', // Set status to 'Processed'
        });

        // Add allocations as separate entries for detailed history
        receipt.allocations.forEach((allocation) => {
          ledgerEntries.push({
            id: `ALLOC-${allocation.id}`,
            type: 'Allocation',
            date: new Date(allocation.allocationDate),
            description: `Allocated from Receipt #${receipt.receiptNumber} to Invoice #${allocation.invoice.invoiceNumber}`,
            amount: +allocation.amountApplied,
            direction: 'in',
            relatedDocNumber: allocation.invoice.invoiceNumber,
          });
        });
      });

      // 3. Sort all entries chronologically
      ledgerEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

      // 4. Calculate running balance
      let currentRunningBalance = 0;
      const ledgerWithRunningBalance: LedgerEntry[] = ledgerEntries.map(
        (entry) => {
          if (entry.type === 'Invoice') {
            currentRunningBalance += entry.amount;
          } else if (entry.type === 'Payment') {
            currentRunningBalance -= entry.amount;
          }
          return { ...entry, runningBalance: currentRunningBalance };
        }
      );

      return ledgerWithRunningBalance;
    }
  );

// --- Fees Collection Report Specific Models (no changes here) ---
export interface PaymentMethodBreakdown {
  method: PaymentMethods;
  total: number;
}

export interface EnrolmentCollectionBreakdown {
  enrolName: string;
  total: number;
}

export interface FeeTypeCollectionBreakdown {
  feeName: string;
  total: number;
}

export interface FeesCollectionReportFilters {
  startDate?: Date | null;
  endDate?: Date | null;
  termId?: number | null;
  year?: number | null;
}

// This factory function will return a memoized selector based on the provided filters.
export const getFeesCollectionReport = (filters: FeesCollectionReportFilters) =>
  createSelector(
    selectAllNonVoidedReceipts, // --- MODIFICATION: Use selectAllNonVoidedReceipts ---
    selectAllInvoices,
    selectTerms,
    (
      allReceipts: ReceiptModel[] | null, // These will be non-voided
      allInvoices: InvoiceModel[] | null,
      allTerms: TermsModel[] | null
    ) => {
      // No change needed here, `allReceipts` is already filtered to exclude voided ones.
      // Removed the explicit `receipt.approved` filter here
      const nonVoidedReceipts = allReceipts || [];

      if (!nonVoidedReceipts || nonVoidedReceipts.length === 0) {
        return {
          summaryByMethod: new Map<PaymentMethods, number>(),
          summaryByEnrol: new Map<string, number>(),
          summaryByFeeType: new Map<string, number>(),
          totalCollection: 0,
        };
      }

      let reportStartDate: Date | null = filters.startDate || null;
      let reportEndDate: Date | null = filters.endDate || null;

      // If a term is selected, override start/end dates
      if (
        filters.termId !== undefined &&
        filters.termId !== null &&
        allTerms &&
        allTerms.length > 0
      ) {
        const selectedTerm = allTerms.find(
          (t) => Number(t.num) === Number(filters.termId)
        );
        if (selectedTerm) {
          reportStartDate = selectedTerm.startDate
            ? new Date(selectedTerm.startDate)
            : null;
          reportEndDate = selectedTerm.endDate
            ? new Date(selectedTerm.endDate)
            : null;
          if (reportStartDate) reportStartDate.setHours(0, 0, 0, 0);
          if (reportEndDate) reportEndDate.setHours(23, 59, 59, 999);
        }
      }

      // Validate dates
      if (reportStartDate && isNaN(reportStartDate.getTime())) {
        reportStartDate = null;
      }
      if (reportEndDate && isNaN(reportEndDate.getTime())) {
        reportEndDate = null;
      }

      let filteredReceipts = [...nonVoidedReceipts]; // Start with non-voided receipts

      // Apply date filtering if dates are set
      if (reportStartDate && reportEndDate) {
        const startTimestamp = reportStartDate.getTime();
        const endTimestamp = reportEndDate.getTime();

        filteredReceipts = filteredReceipts.filter((receipt) => {
          const paymentDate = new Date(receipt.paymentDate);
          if (isNaN(paymentDate.getTime())) {
            return false;
          }
          const paymentTime = paymentDate.getTime();
          const isInDateRange =
            paymentTime >= startTimestamp && paymentTime <= endTimestamp;
          return isInDateRange;
        });
      }

      const summaryByMethod = new Map<PaymentMethods, number>();
      const summaryByEnrol = new Map<string, number>();
      const summaryByFeeType = new Map<string, number>();
      let totalCollection = 0;

      filteredReceipts.forEach((receipt) => {
        const amountForCollection = Number(receipt.amountPaid);
        if (
          typeof amountForCollection !== 'number' ||
          amountForCollection <= 0
        ) {
          return;
        }

        // Aggregate by Payment Method
        const currentMethodTotal =
          summaryByMethod.get(receipt.paymentMethod) || 0;
        summaryByMethod.set(
          receipt.paymentMethod,
          currentMethodTotal + amountForCollection
        );
        totalCollection += amountForCollection;

        // Aggregate by Enrolment and Fee Type via allocations
        receipt.allocations.forEach((allocation) => {
          if (!allocation.invoice || !allocation.invoice.id) {
            return;
          }
          const invoice = (allInvoices || []).find(
            (inv) => inv.id === allocation.invoice.id
          );

          if (invoice) {
            // Aggregate by Enrolment
            const enrolName = invoice.enrol?.name;
            if (enrolName) {
              const currentEnrolTotal = Number(
                summaryByEnrol.get(enrolName) || 0
              );
              const amountToApply = Number(allocation.amountApplied);
              if (!isNaN(amountToApply)) {
                summaryByEnrol.set(
                  enrolName,
                  currentEnrolTotal + amountToApply
                );
              }
            }

            // Aggregate by Fee Type (more robust proportional allocation)
            if (invoice.bills && invoice.bills.length > 0) {
              const totalBillAmountInInvoice = invoice.totalBill;
              if (totalBillAmountInInvoice && totalBillAmountInInvoice > 0) {
                invoice.bills.forEach((bill) => {
                  const feeName = bill.fees?.name;
                  if (
                    feeName &&
                    bill.fees?.amount !== undefined &&
                    bill.fees.amount !== null
                  ) {
                    const proportionalAllocation =
                      (bill.fees.amount / totalBillAmountInInvoice) *
                      allocation.amountApplied;
                    const currentFeeTotal = summaryByFeeType.get(feeName) || 0;
                    summaryByFeeType.set(
                      feeName,
                      currentFeeTotal + proportionalAllocation
                    );
                  }
                });
              }
            }
          }
        });
      });

      return {
        summaryByMethod,
        summaryByEnrol,
        summaryByFeeType,
        totalCollection,
      };
    }
  );

// -------End Fees Collection Report -------------------//

// === NEW: Selector to combine Invoices and Receipts into FinanceDataModel[] ===
export const selectAllCombinedFinanceData = createSelector(
  selectAllInvoices,
  selectAllNonVoidedReceipts,
  (invoices: InvoiceModel[], receipts: ReceiptModel[]): FinanceDataModel[] => {
    const combined: FinanceDataModel[] = [];

    // Map Invoices to FinanceDataModel
    if (invoices) {
      invoices.forEach((invoice) => {
        combined.push({
          id: invoice.invoiceNumber,
          transactionDate: invoice.invoiceDate,
          amount: invoice.totalBill,
          type: 'Invoice',
          description: `Term ${invoice.enrol.num} ${invoice.enrol.year} Invoice For ${invoice.student.surname} ${invoice.student.name} Enrolled in ${invoice.enrol.name} as a ${invoice.enrol.residence}`,
          date: invoice.invoiceDate,
          studentId: invoice.student.studentNumber,
          studentName: invoice.student.surname + invoice.student.name,
          status: invoice.status,
          invoiceNumber: invoice.invoiceNumber,
          invoiceDate: invoice.invoiceDate,
          invoiceDueDate: invoice.invoiceDueDate,
          invoiceTotalBill: invoice.totalBill,
          invoiceBalance: invoice.balance,
          enrolId: invoice.enrol.id,
          enrolAcademicYear: invoice.enrol.year,
          enrolTerm: invoice.enrol.num + ' ' + invoice.enrol.year,
          enrolClass: invoice.enrol.name,
        });
      });
    }

    // Map Receipts to FinanceDataModel (now including all non-voided receipts)
    if (receipts) {
      receipts.forEach((receipt) => {
        combined.push({
          id: receipt.receiptNumber,
          transactionDate: receipt.paymentDate,
          amount: receipt.amountPaid,
          type: 'Payment',
          description: receipt.description,
          date: receipt.paymentDate,
          studentId: receipt.student.studentNumber,
          studentName: receipt.student.surname + ' ' + receipt.student.name,
          status: 'Processed', // Can set a generic 'Processed' status
          receiptNumber: receipt.receiptNumber,
          paymentMethod: receipt.paymentMethod,
          receiptAmountPaid: receipt.amountPaid,
          receiptApproved: receipt.approved,
          receiptServedBy: receipt.servedBy,
        });
      });
    }

    // Sort the combined array by date (newest first) by default
    return combined.sort(
      (a, b) =>
        new Date(b.transactionDate).getTime() -
        new Date(a.transactionDate).getTime()
    );
  }
);

// Helper function to calculate a student's total outstanding balance (no change needed here, it uses the combined data)
export const calculateStudentOverallBalance = (
  studentNumber: string,
  allCombinedTransactions: FinanceDataModel[]
): number => {
  let balance = 0;
  const studentTransactions = allCombinedTransactions
    .filter((t) => t.studentId === studentNumber)
    .sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime()
    );

  studentTransactions.forEach((t) => {
    const amount = parseFloat(String(t.amount)) || 0;

    if (t.type === 'Invoice') {
      balance += amount;
    } else if (t.type === 'Payment') {
      balance -= amount;
    }
  });
  return balance;
};

// === NEW: Selector to get ALL student overall outstanding balances === (no change needed here, it uses the combined data)
export const selectAllStudentsOverallBalances = createSelector(
  selectAllCombinedFinanceData,
  (combinedData: FinanceDataModel[]) => {
    const studentBalances = new Map<string, number>();

    const sortedCombinedData = combinedData.sort(
      (a, b) =>
        new Date(a.transactionDate).getTime() -
        new Date(b.transactionDate).getTime()
    );

    sortedCombinedData.forEach((t) => {
      const studentId = t.studentId;
      if (!studentId) return;

      let currentBalance = studentBalances.get(studentId) || 0;
      const amount = parseFloat(String(t.amount)) || 0;

      if (t.type === 'Invoice') {
        currentBalance += amount;
      } else if (t.type === 'Payment') {
        currentBalance -= amount;
      }

      studentBalances.set(studentId, currentBalance);
    });

    return studentBalances;
  }
);

// === UPDATED: Outstanding Fees Report Selector Factory === (no changes needed for this selector directly, as it relies on `selectAllStudentsOverallBalances` which now uses filtered data)
export const getOutstandingFeesReport = (
  filters: OutstandingFeesReportFilters
) =>
  createSelector(
    selectAllInvoices,
    selectStudents,
    selectTerms,
    selectAllStudentsOverallBalances,
    (
      allInvoices: InvoiceModel[] | null,
      allStudents: StudentsModel[] | null,
      allTerms: TermsModel[] | null,
      studentOverallBalances: Map<string, number>
    ): OutstandingFeesReportData => {
      const studentsMap = new Map<string, StudentsModel>();
      (allStudents || []).forEach((s) => studentsMap.set(s.studentNumber, s));

      let totalOverallOutstanding = 0;
      const outstandingByClass = new Map<string, number>();
      const outstandingByResidence = new Map<string, number>();

      const allStudentBalancesAggregated: {
        [studentNumber: string]: {
          overallOutstanding: number;
          student: StudentsModel | undefined;
          enrolName: string | undefined;
          residence: string | undefined;
        };
      } = {};

      studentOverallBalances.forEach((balance, studentNumber) => {
        if (balance > 0) {
          const student = studentsMap.get(studentNumber);
          const relevantInvoice = (allInvoices || []).find(
            (inv) =>
              inv.student?.studentNumber === studentNumber && inv.balance > 0
          );

          if (student) {
            allStudentBalancesAggregated[studentNumber] = {
              overallOutstanding: balance,
              student: student,
              enrolName: relevantInvoice?.enrol?.name || 'N/A',
              residence: relevantInvoice?.enrol?.residence || 'N/A',
            };
            totalOverallOutstanding += balance;
          }
        }
      });

      Object.values(allStudentBalancesAggregated).forEach((data) => {
        if (data.overallOutstanding > 0) {
          if (data.enrolName) {
            const currentClassTotal =
              outstandingByClass.get(data.enrolName) || 0;
            outstandingByClass.set(
              data.enrolName,
              currentClassTotal + data.overallOutstanding
            );
          }

          if (data.residence && data.residence.trim() !== '') {
            const currentResidenceTotal =
              outstandingByResidence.get(data.residence) || 0;
            outstandingByResidence.set(
              data.residence,
              currentResidenceTotal + data.overallOutstanding
            );
          }
        }
      });

      let studentDetails: OutstandingStudentDetail[] = Object.values(
        allStudentBalancesAggregated
      )
        .map((data) => ({
          studentNumber: data.student?.studentNumber || '',
          studentName: `${data.student?.name || ''} ${
            data.student?.surname || ''
          }`.trim(),
          enrolName: data.enrolName || '',
          residence: data.residence || '',
          totalOutstanding: data.overallOutstanding,
        }))
        .filter((s) => s.totalOutstanding > 0);

      if (filters.enrolmentName) {
        studentDetails = studentDetails.filter(
          (s) => s.enrolName === filters.enrolmentName
        );
      }
      if (filters.residence) {
        studentDetails = studentDetails.filter(
          (s) => s.residence === filters.residence
        );
      }
      if (filters.searchQuery && filters.searchQuery.trim() !== '') {
        const searchTerm = filters.searchQuery.toLowerCase().trim();
        studentDetails = studentDetails.filter(
          (student) =>
            student.studentName.toLowerCase().includes(searchTerm) ||
            student.studentNumber.toLowerCase().includes(searchTerm)
        );
      }

      if (
        filters.termId !== undefined &&
        filters.termId !== null &&
        allTerms &&
        allTerms.length > 0
      ) {
        const [filterNumStr, filterYearStr] = filters.termId.split('-');
        const filterNum = parseInt(filterNumStr, 10);
        const filterYear = parseInt(filterYearStr, 10);

        const selectedTerm = allTerms.find(
          (t) => t.num === filterNum && t.year === filterYear
        );

        if (selectedTerm) {
          const studentsInvoicesInTerm = new Set<string>();
          (allInvoices || []).forEach((invoice) => {
            if (
              invoice.enrol?.num === selectedTerm.num &&
              invoice.enrol?.year === selectedTerm.year
            ) {
              studentsInvoicesInTerm.add(invoice.student?.studentNumber || '');
            }
          });
          studentDetails = studentDetails.filter((s) =>
            studentsInvoicesInTerm.has(s.studentNumber)
          );
        }
      }

      studentDetails.sort((a, b) => a.studentName.localeCompare(b.studentName));

      totalOverallOutstanding = studentDetails.reduce(
        (sum, s) => sum + s.totalOutstanding,
        0
      );

      const summaryByEnrolmentMap = new Map<string, number>();
      const summaryByResidenceMap = new Map<string, number>();

      studentDetails.forEach((s) => {
        if (s.enrolName) {
          summaryByEnrolmentMap.set(
            s.enrolName,
            (summaryByEnrolmentMap.get(s.enrolName) || 0) + s.totalOutstanding
          );
        }
        if (s.residence) {
          summaryByResidenceMap.set(
            s.residence,
            (summaryByResidenceMap.get(s.residence) || 0) + s.totalOutstanding
          );
        }
      });

      return {
        totalOverallOutstanding: totalOverallOutstanding,
        summaryByEnrolment: summaryByEnrolmentMap,
        summaryByResidence: summaryByResidenceMap,
        studentDetails,
      };
    }
  );

// -----------Aged debts report selector -------------------------//
function getDaysDifference(date1: Date, date2: Date): number {
  const d1 = new Date(date1).setHours(0, 0, 0, 0);
  const d2 = new Date(date2).setHours(0, 0, 0, 0);
  const diffTime = d1 - d2;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

const getSelectedTermForAgedReport = (filters: AgedDebtorsReportFilters) =>
  createSelector(selectTerms, (allTerms: TermsModel[] | null) => {
    if (!filters.termId || !allTerms || allTerms.length === 0) {
      return null;
    }
    const [numStr, yearStr] = filters.termId.split('-');
    const num = parseInt(numStr, 10);
    const year = parseInt(yearStr, 10);
    return allTerms.find((t) => t.num === num && t.year === year) || null;
  });

export const getAgedDebtorsReport = (filters: AgedDebtorsReportFilters) =>
  createSelector(
    selectAllInvoices,
    getSelectedTermForAgedReport(filters),
    (
      allInvoices: InvoiceModel[] | null,
      selectedTerm: TermsModel | null
    ): AgedDebtorsReportData => {
      const asOfDate = filters.asOfDate || new Date();
      let filteredInvoices: InvoiceModel[] = [];

      let invoicesWithBalance = (allInvoices || []).filter(
        (inv) => inv.balance > 0
      );

      if (selectedTerm) {
        filteredInvoices = invoicesWithBalance.filter(
          (invoice) =>
            invoice.enrol?.num === selectedTerm.num &&
            invoice.enrol?.year === selectedTerm.year
        );
      } else {
        filteredInvoices = invoicesWithBalance;
      }

      if (filters.enrolmentName) {
        filteredInvoices = filteredInvoices.filter(
          (invoice) =>
            invoice.enrol?.name?.toLowerCase() ===
            filters.enrolmentName!.toLowerCase()
        );
      }

      if (filters.studentNumber) {
        filteredInvoices = filteredInvoices.filter(
          (invoice) => invoice.student?.studentNumber === filters.studentNumber
        );
      }

      let current = 0;
      let due1_30Days = 0;
      let due31_60Days = 0;
      let due61_90Days = 0;
      let due90PlusDays = 0;
      let totalOutstanding = 0;

      const detailedInvoices: AgedInvoiceSummary[] = [];

      filteredInvoices.forEach((invoice) => {
        if (!invoice.student || !invoice.enrol) {
          return;
        }

        const parsedBalance = parseFloat(String(invoice.balance));

        if (isNaN(parsedBalance)) {
          return;
        }

        const parsedOriginalAmount = parseFloat(String(invoice.totalBill));
        if (isNaN(parsedOriginalAmount)) {
        }

        const dueDate = invoice.invoiceDueDate
          ? new Date(invoice.invoiceDueDate)
          : new Date(invoice.invoiceDate);
        const daysOverdue = Math.floor(
          (asOfDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let statusBucket:
          | 'Current'
          | '1-30 Days'
          | '31-60 Days'
          | '61-90 Days'
          | '90+ Days';

        if (daysOverdue < 0) {
          statusBucket = 'Current';
          current += parsedBalance;
        } else if (daysOverdue >= 0 && daysOverdue <= 30) {
          statusBucket = '1-30 Days';
          due1_30Days += parsedBalance;
        } else if (daysOverdue >= 31 && daysOverdue <= 60) {
          statusBucket = '31-60 Days';
          due31_60Days += parsedBalance;
        } else if (daysOverdue >= 61 && daysOverdue <= 90) {
          statusBucket = '61-90 Days';
          due61_90Days += parsedBalance;
        } else {
          statusBucket = '90+ Days';
          due90PlusDays += parsedBalance;
        }

        totalOutstanding += parsedBalance;

        const studentFullName =
          `${invoice.student.name || ''} ${
            invoice.student.surname || ''
          }`.trim() || 'Unknown Student';
        const className = invoice.enrol.name || 'N/A';
        const termName = `Term ${invoice.enrol.num} (${invoice.enrol.year})`;

        detailedInvoices.push({
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          studentName: studentFullName,
          studentNumber: invoice.student.studentNumber,
          className: className,
          termName: termName,
          invoiceDate: new Date(invoice.invoiceDate),
          dueDate: new Date(invoice.invoiceDueDate),
          originalAmount: parsedOriginalAmount,
          currentBalance: parsedBalance,
          daysOverdue: Math.max(0, daysOverdue),
          statusBucket: statusBucket,
        });
      });

      detailedInvoices.sort((a, b) => {
        const order = [
          'Current',
          '1-30 Days',
          '31-60 Days',
          '61-90 Days',
          '90+ Days',
        ];
        const statusOrderA = order.indexOf(a.statusBucket);
        const statusOrderB = order.indexOf(b.statusBucket);

        if (statusOrderA !== statusOrderB) {
          return statusOrderA - statusOrderB;
        }
        return a.studentName.localeCompare(b.studentName);
      });

      return {
        asOfDate: asOfDate,
        totalOutstanding: totalOutstanding,
        current: current,
        due1_30Days: due1_30Days,
        due31_60Days: due31_60Days,
        due61_90Days: due61_90Days,
        due90PlusDays: due90PlusDays,
        detailedInvoices: detailedInvoices,
      };
    }
  );

// --------------revenue recognition report --------------------------//
const getSelectedTermForRevenueRecognition = (
  filters: RevenueRecognitionReportFilters
) =>
  createSelector(selectTerms, (allTerms: TermsModel[] | null) => {
    if (!filters.termId || !allTerms || allTerms.length === 0) {
      return null;
    }
    const [numStr, yearStr] = filters.termId.split('-');
    const num = parseInt(numStr, 10);
    const year = parseInt(yearStr, 10);
    return allTerms.find((t) => t.num === num && t.year === year) || null;
  });

export const getRevenueRecognitionReport = (
  filters: RevenueRecognitionReportFilters
) =>
  createSelector(
    selectAllInvoices,
    getSelectedTermForRevenueRecognition(filters),
    selectClasses,
    (
      allInvoices: InvoiceModel[] | null,
      selectedTerm: TermsModel | null,
      allClasses: ClassesModel[] | null
    ): RevenueRecognitionReportData => {
      if (!allInvoices || !selectedTerm) {
        return { asOfDate: new Date(), reportData: [] };
      }

      const termInvoices = allInvoices.filter((invoice) => {
        return (
          invoice.enrol?.num === selectedTerm.num &&
          invoice.enrol?.year === selectedTerm.year
        );
      });

      const reportData: RevenueRecognitionSummary[] = [];

      let classesToProcess: (ClassesModel | undefined)[] = [];

      if (filters.classId) {
        const selectedClass = allClasses?.find((c) => c.id === filters.classId);
        if (selectedClass) {
          classesToProcess = [selectedClass];
        } else {
          return { asOfDate: new Date(), reportData: [] };
        }
      } else {
        const uniqueClassNamesInTerm = new Set(
          termInvoices.map((inv) => inv.enrol?.name).filter(Boolean)
        );

        const classesFromInvoices =
          allClasses?.filter((c) => uniqueClassNamesInTerm.has(c.name)) || [];

        if (classesFromInvoices.length > 0) {
          classesToProcess = classesFromInvoices;
        } else if (termInvoices.length > 0) {
          classesToProcess = [undefined];
        } else {
          return { asOfDate: new Date(), reportData: [] };
        }
      }

      if (classesToProcess.length > 0) {
        classesToProcess.forEach((currentClass) => {
          let classInvoices: InvoiceModel[];

          if (currentClass) {
            classInvoices = termInvoices.filter(
              (invoice) => invoice.enrol?.name === currentClass.name
            );
          } else {
            classInvoices = termInvoices;
          }

          const totalInvoiced = classInvoices.reduce(
            (sum, invoice) =>
              sum + (parseFloat(String(invoice.totalBill)) || 0),
            0
          );
          const totalOutstanding = classInvoices.reduce(
            (sum, invoice) => sum + (parseFloat(String(invoice.balance)) || 0),
            0
          );
          const studentCount = new Set(
            classInvoices.map((invoice) => invoice.student?.studentNumber)
          ).size;

          if (classInvoices.length > 0) {
            reportData.push({
              termName: `Term ${selectedTerm.num} (${selectedTerm.year})`,
              className: currentClass?.name,
              totalInvoiced: totalInvoiced,
              totalOutstanding: totalOutstanding,
              studentCount: studentCount,
            });
          }
        });
      }

      if (reportData.length === 0 && termInvoices.length > 0) {
        const totalInvoiced = termInvoices.reduce(
          (sum, invoice) => sum + (parseFloat(String(invoice.totalBill)) || 0),
          0
        );
        const totalOutstanding = termInvoices.reduce(
          (sum, invoice) => sum + (parseFloat(String(invoice.balance)) || 0),
          0
        );
        const studentCount = new Set(
          termInvoices.map((invoice) => invoice.student?.studentNumber)
        ).size;

        reportData.push({
          termName: `Term ${selectedTerm.num} (${selectedTerm.year})`,
          className: undefined,
          totalInvoiced: totalInvoiced,
          totalOutstanding: totalOutstanding,
          studentCount: studentCount,
        });
      }

      reportData.sort((a, b) =>
        (a.className || 'ZZZ').localeCompare(b.className || 'ZZZ')
      );

      return {
        asOfDate: new Date(),
        reportData: reportData,
      };
    }
  );

// --------------- Enrollment vs Billing Reconcilliation Report Selector ---------- //
const getSelectedTermForEnrollmentBilling = (
  filters: EnrollmentBillingReportFilters
) =>
  createSelector(selectTerms, (allTerms: TermsModel[] | null) => {
    if (!filters.termId || !allTerms || allTerms.length === 0) {
      return null;
    }
    const [numStr, yearStr] = filters.termId.split('-');
    const num = parseInt(numStr, 10);
    const year = parseInt(yearStr, 10);
    return allTerms.find((t) => t.num === num && t.year === year) || null;
  });

export const getEnrollmentBillingReconciliationReport = (
  filters: EnrollmentBillingReportFilters
) =>
  createSelector(
    selectTermEnrols,
    selectAllInvoices,
    selectStudents,
    getSelectedTermForEnrollmentBilling(filters),
    selectClasses,
    (
      allEnrols: EnrolsModel[] | null,
      allInvoices: InvoiceModel[] | null,
      allStudents: StudentsModel[] | null,
      selectedTerm: TermsModel | null,
      allClasses: ClassesModel[] | null
    ): EnrollmentBillingReportData => {
      if (
        !allEnrols ||
        !allInvoices ||
        !allStudents ||
        !selectedTerm ||
        !allClasses
      ) {
        return {
          asOfDate: new Date(),
          summary: {
            termName: '',
            totalStudentsEnrolled: 0,
            totalStudentsInvoiced: 0,
            totalDiscrepancies: 0,
          },
          details: [],
        };
      }

      const reportDetails: EnrollmentBillingReportDetail[] = [];
      let totalStudentsEnrolled = 0;
      let totalStudentsInvoiced = 0;
      let totalDiscrepancies = 0;

      let filteredEnrolments = allEnrols.filter(
        (enrol) =>
          enrol.num === selectedTerm.num && enrol.year === selectedTerm.year
      );

      if (filters.classId) {
        const selectedClass = allClasses.find((c) => c.id === filters.classId);
        if (selectedClass) {
          filteredEnrolments = filteredEnrolments.filter(
            (enrol) => enrol.name === selectedClass.name
          );
        } else {
          return {
            asOfDate: new Date(),
            summary: {
              termName: `Term ${selectedTerm.num} (${selectedTerm.year})`,
              className: filters.classId,
              totalStudentsEnrolled: 0,
              totalStudentsInvoiced: 0,
              totalDiscrepancies: 0,
            },
            details: [],
          };
        }
      }

      const invoicedStudentKeys = new Set<string>();

      for (const enrol of filteredEnrolments) {
        totalStudentsEnrolled++;
        const student = allStudents.find(
          (s) => s.studentNumber === enrol.student?.studentNumber
        );

        if (!student) {
          continue;
        }

        const relevantInvoice = allInvoices.find(
          (invoice) =>
            invoice.student?.studentNumber === student.studentNumber &&
            invoice.enrol?.num === enrol.num &&
            invoice.enrol?.year === enrol.year &&
            invoice.enrol?.name === enrol.name
        );

        const isDiscrepancy = !relevantInvoice;
        if (!relevantInvoice) {
          totalDiscrepancies++;
        } else {
          const key = `${student.studentNumber}-${enrol.name}`;
          if (!invoicedStudentKeys.has(key)) {
            totalStudentsInvoiced++;
            invoicedStudentKeys.add(key);
          }
        }

        reportDetails.push({
          studentNumber: student.studentNumber,
          studentName: `${student.name} ${student.surname}`,
          className: enrol.name,
          enrolledStatus: 'Enrolled',
          invoicedStatus: relevantInvoice ? 'Invoiced' : 'Not Invoiced',
          invoiceNumber: relevantInvoice?.invoiceNumber,
          balance: relevantInvoice?.balance,
          discrepancy: isDiscrepancy,
          discrepancyMessage: isDiscrepancy
            ? 'Enrolled but Not Invoiced'
            : undefined,
        });
      }

      reportDetails.sort((a, b) => {
        const classCompare = (a.className || '').localeCompare(
          b.className || ''
        );
        if (classCompare !== 0) return classCompare;
        return (a.studentName || '').localeCompare(b.studentName || '');
      });

      const summary: EnrollmentBillingReportSummary = {
        termName: `Term ${selectedTerm.num} (${selectedTerm.year})`,
        className: filters.classId
          ? allClasses.find((c) => c.id === filters.classId)?.name ||
            'Unknown Class'
          : 'All Classes',
        totalStudentsEnrolled: totalStudentsEnrolled,
        totalStudentsInvoiced: totalStudentsInvoiced,
        totalDiscrepancies: totalDiscrepancies,
      };

      return {
        asOfDate: new Date(),
        summary: summary,
        details: reportDetails,
      };
    }
  );
