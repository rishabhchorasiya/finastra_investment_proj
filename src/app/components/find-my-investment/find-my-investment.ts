import { Component, computed, inject, signal, } from '@angular/core';
import { InvestmentService } from '../../services/investment-service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { catchError, debounce, debounceTime, distinctUntilChanged, finalize, of, switchMap } from 'rxjs';
import { Investment } from '../../models/investment.model';

@Component({
  selector: 'app-find-my-investment',
  imports: [],
  templateUrl: './find-my-investment.html',
  styleUrl: './find-my-investment.css',
})
export class FindMyInvestment {
private srv = inject(InvestmentService);

id = signal<number | null>(null);
loading = signal<boolean>(false);
error = signal('');
value = signal<number| string | null>(null);

private id$ = toObservable(this.id).pipe(debounceTime(150),distinctUntilChanged());

investment = toSignal<Investment | null>(
  this.id$.pipe(
    switchMap(id => {
      this.error.set('');
      if (id === null || Number.isNaN(id)) {
        return of(null);
      }
      this.loading.set(true);
      return this.srv.getInvestmentById(id).pipe(
        finalize(() => this.loading.set(false)),
        catchError(err => {
          console.error("GetInvestmentById error:", err);
          this.error.set('Investment not found or an error occurred.');
          return of(null);
        })
      );
    })
  ),
  { initialValue: null }
);

fields = computed(() => {
  const inv = this.investment();
  if (!inv) {
    return [];
  }
  const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(n);

  return [
    { label: 'Investment ID', value: inv.id },
    { label: 'Investment Type', value: inv.type },
    { label: 'Amount Invested', value: inr(inv.amount) },
    { label: 'Purchases Date', value: new Date(inv.purchaseDate).toLocaleDateString('en-IN') },
    { label: 'Current Values', value: inr(inv.currentValue) },
  ];
});

onIdInput(event: Event) {
  const row = (event.target as HTMLInputElement).value;
  const num = row === '' ? null : Number(row);
  this.id.set(Number.isNaN(num) ? null : num);
}
fetchInvestment(){
  const currentId = this.value();
  this.id.set(null);
  this.id.set(Number(currentId));
}
}
