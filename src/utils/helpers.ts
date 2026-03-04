/**
 * Helper functions for BagiBerkah
 */

/**
 * Format currency to Indonesian Rupiah
 */
export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Calculate total from recipients
 */
export function calculateTotal(recipients: Array<{ allocatedAmount: number }>): number {
  return recipients.reduce((sum, r) => sum + r.allocatedAmount, 0);
}

/**
 * Validate budget allocation
 */
export function validateBudgetAllocation(
  totalBudget: number,
  recipients: Array<{ allocatedAmount: number }>
): { valid: boolean; totalAllocated: number; difference: number; message: string } {
  const totalAllocated = calculateTotal(recipients);
  const difference = totalBudget - totalAllocated;
  const valid = difference === 0;

  let message = '';
  if (!valid) {
    message = `Total alokasi ${formatCurrency(totalAllocated)} ${
      difference > 0 ? 'kurang' : 'lebih'
    } ${formatCurrency(Math.abs(difference))} dari budget ${formatCurrency(totalBudget)}`;
  }

  return {
    valid,
    totalAllocated,
    difference,
    message,
  };
}

/**
 * Auto-adjust allocation to match budget
 * Distributes the difference to recipients proportionally
 */
export function autoAdjustAllocation(
  totalBudget: number,
  recipients: Array<{ allocatedAmount: number; [key: string]: any }>
): Array<{ allocatedAmount: number; [key: string]: any }> {
  const totalAllocated = calculateTotal(recipients);
  const difference = totalBudget - totalAllocated;

  if (difference === 0) {
    return recipients;
  }

  // Distribute difference proportionally
  const adjusted = recipients.map((r, index) => {
    const proportion = r.allocatedAmount / totalAllocated;
    let newAmount = Math.round(r.allocatedAmount + difference * proportion);
    
    // Ensure minimum 10000
    if (newAmount < 10000) {
      newAmount = 10000;
    }
    
    return {
      ...r,
      allocatedAmount: newAmount,
    };
  });

  // Final adjustment to match exact budget
  const adjustedTotal = calculateTotal(adjusted);
  const finalDiff = totalBudget - adjustedTotal;
  
  if (finalDiff !== 0) {
    // Add/subtract from first recipient
    adjusted[0].allocatedAmount += finalDiff;
  }

  return adjusted;
}

/**
 * Generate random token
 */
export function generateToken(length: number = 32): string {
  const crypto = require('crypto');
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Mask sensitive data
 */
export function maskString(str: string, visibleChars: number = 4): string {
  if (str.length <= visibleChars) {
    return str;
  }
  return str.slice(0, visibleChars) + '*'.repeat(str.length - visibleChars);
}

/**
 * Mask bank account number
 */
export function maskBankAccount(account: string): string {
  if (account.length <= 4) {
    return account;
  }
  return '*'.repeat(account.length - 4) + account.slice(-4);
}
