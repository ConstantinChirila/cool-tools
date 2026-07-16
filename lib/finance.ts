export interface AmortizationYear {
  year: number;
  interestPaid: number;
  principalPaid: number;
  balance: number;
}

export interface MortgageResult {
  monthlyPayment: number;
  totalPaid: number;
  totalInterest: number;
  years: AmortizationYear[];
  /** Remaining balance at the end of each year, starting with year 0 (loan amount). */
  balanceSeries: number[];
  /** Cumulative interest paid at the end of each year, starting with year 0. */
  interestSeries: number[];
}

export function calculateMortgage(
  principal: number,
  annualRatePct: number,
  termYears: number,
): MortgageResult {
  const months = Math.round(termYears * 12);
  const r = annualRatePct / 100 / 12;
  const monthlyPayment =
    r === 0 ? principal / months : (principal * r) / (1 - (1 + r) ** -months);

  const years: AmortizationYear[] = [];
  const balanceSeries: number[] = [principal];
  const interestSeries: number[] = [0];

  let balance = principal;
  let cumulativeInterest = 0;
  let yearInterest = 0;
  let yearPrincipal = 0;

  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    const principalPart = Math.min(monthlyPayment - interest, balance);
    balance -= principalPart;
    cumulativeInterest += interest;
    yearInterest += interest;
    yearPrincipal += principalPart;

    if (m % 12 === 0 || m === months) {
      years.push({
        year: Math.ceil(m / 12),
        interestPaid: yearInterest,
        principalPaid: yearPrincipal,
        balance: Math.max(balance, 0),
      });
      balanceSeries.push(Math.max(balance, 0));
      interestSeries.push(cumulativeInterest);
      yearInterest = 0;
      yearPrincipal = 0;
    }
  }

  return {
    monthlyPayment,
    totalPaid: monthlyPayment * months,
    totalInterest: monthlyPayment * months - principal,
    years,
    balanceSeries,
    interestSeries,
  };
}

export interface CompoundYear {
  year: number;
  contributed: number;
  interestEarned: number;
  balance: number;
}

export interface CompoundResult {
  finalBalance: number;
  totalContributed: number;
  totalInterest: number;
  years: CompoundYear[];
  /** Balance at the end of each year, starting with year 0 (initial deposit). */
  balanceSeries: number[];
  /** Total contributed at the end of each year, starting with year 0. */
  contributedSeries: number[];
}

export function calculateCompound(
  initial: number,
  monthlyContribution: number,
  annualRatePct: number,
  compoundsPerYear: number,
  termYears: number,
): CompoundResult {
  const rate = annualRatePct / 100;
  const years: CompoundYear[] = [];
  const balanceSeries: number[] = [initial];
  const contributedSeries: number[] = [initial];

  let balance = initial;
  let contributed = initial;

  // Iterate monthly; apply compounding at the configured frequency.
  const monthsPerCompound = 12 / compoundsPerYear;
  const periodRate = rate / compoundsPerYear;

  for (let year = 1; year <= termYears; year++) {
    for (let m = 1; m <= 12; m++) {
      balance += monthlyContribution;
      contributed += monthlyContribution;
      if (m % monthsPerCompound === 0) {
        balance *= 1 + periodRate;
      }
    }
    years.push({
      year,
      contributed,
      interestEarned: balance - contributed,
      balance,
    });
    balanceSeries.push(balance);
    contributedSeries.push(contributed);
  }

  return {
    finalBalance: balance,
    totalContributed: contributed,
    totalInterest: balance - contributed,
    years,
    balanceSeries,
    contributedSeries,
  };
}
