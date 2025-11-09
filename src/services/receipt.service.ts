import { TransactionReceiptData } from '../components/invoice/TransactionReceipt';

export const receiptService = {
  generateDigitalPurchaseReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    metalType: 'gold' | 'silver';
    grams: number;
    pricePerGram: number;
    totalAmount: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    transactionId: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'digital_purchase',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      digitalGrams: {
        metal: data.metalType,
        grams: data.grams,
        pricePerGram: data.pricePerGram,
      },
      amounts: {
        subtotal: data.totalAmount,
        commission: 0,
        total: data.totalAmount,
        currency: data.currency,
      },
      payment: {
        method: data.currency === 'LYD' ? 'wallet_lyd' : 'wallet_usd',
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      notes: `No commission charged on digital ${data.metalType} purchases. Your digital balance has been updated instantly.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generatePhysicalPurchaseReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    product: {
      name: string;
      type: 'gold' | 'silver';
      weight: number;
      carat?: number;
      serialNumber: string;
    };
    basePrice: number;
    commission: number;
    totalAmount: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    pickupStore: string;
    pickupAddress?: string;
    pickupDeadline: string;
    transactionId: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'physical_purchase',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      product: data.product,
      amounts: {
        subtotal: data.basePrice,
        commission: data.commission,
        total: data.totalAmount,
        currency: data.currency,
      },
      payment: {
        method: data.currency === 'LYD' ? 'wallet_lyd' : 'wallet_usd',
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      pickup: {
        store: data.pickupStore,
        address: data.pickupAddress,
        deadline: data.pickupDeadline,
      },
      notes: `Commission of 1.5% applied to physical purchases. Please collect your ${data.product.type} within 3 days to avoid storage fees.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateOwnershipTransferReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    product: {
      name: string;
      type: 'gold' | 'silver';
      weight: number;
      serialNumber: string;
    };
    transactionId: string;
    riskScore?: number;
  }): TransactionReceiptData {
    const status = data.riskScore && data.riskScore > 0.8 ? 'pending' : 'success';

    return {
      transactionId: data.transactionId,
      type: 'ownership_transfer',
      timestamp: new Date().toISOString(),
      status,
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      recipient: {
        name: data.recipientName,
        email: data.recipientEmail,
        phone: data.recipientPhone,
      },
      product: data.product,
      amounts: {
        total: 0,
        currency: 'LYD',
      },
      notes: status === 'pending'
        ? 'This transfer has been flagged for manual review due to security checks. Our team will verify within 24 hours.'
        : `Ownership successfully transferred to ${data.recipientName}. The recipient can now manage this asset.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateLocationChangeReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    product: {
      name: string;
      type: 'gold' | 'silver';
      weight: number;
      oldSerialNumber: string;
      newSerialNumber: string;
    };
    fromStore: string;
    toStore: string;
    locationChangeFee: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    transactionId: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'location_change',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      product: {
        name: data.product.name,
        type: data.product.type,
        weight: data.product.weight,
        serialNumber: data.product.newSerialNumber,
      },
      location: {
        from: data.fromStore,
        to: data.toStore,
      },
      amounts: {
        fees: data.locationChangeFee,
        total: data.locationChangeFee,
        currency: data.currency,
      },
      payment: {
        method: data.currency === 'LYD' ? 'wallet_lyd' : 'wallet_usd',
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      notes: `Your pickup location has been changed. A new serial number (${data.product.newSerialNumber}) has been assigned. Old serial: ${data.product.oldSerialNumber}. New 3-day pickup deadline starts now.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateDigitalTransferReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    recipientName: string;
    recipientEmail?: string;
    recipientPhone?: string;
    metalType: 'gold' | 'silver';
    grams: number;
    transactionId: string;
    sharedBarSerial?: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'digital_transfer',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      recipient: {
        name: data.recipientName,
        email: data.recipientEmail,
        phone: data.recipientPhone,
      },
      digitalGrams: {
        metal: data.metalType,
        grams: data.grams,
        pricePerGram: 0,
      },
      amounts: {
        total: 0,
        currency: 'LYD',
      },
      notes: data.sharedBarSerial
        ? `Digital ${data.metalType} transferred successfully. Both parties share ownership of bar: ${data.sharedBarSerial}`
        : `${data.grams}g of digital ${data.metalType} transferred to ${data.recipientName}. Transaction completed instantly with no fees.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateReceivePhysicalReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    metalType: 'gold' | 'silver';
    grams: number;
    fabricationFee: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    pickupStore: string;
    pickupAddress?: string;
    pickupDeadline: string;
    serialNumber: string;
    transactionId: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'receive_physical',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      product: {
        name: `${data.grams}g ${data.metalType.toUpperCase()} Bar`,
        type: data.metalType,
        weight: data.grams,
        serialNumber: data.serialNumber,
      },
      digitalGrams: {
        metal: data.metalType,
        grams: data.grams,
        pricePerGram: 0,
      },
      amounts: {
        fabricationFee: data.fabricationFee,
        total: data.fabricationFee,
        currency: data.currency,
      },
      payment: {
        method: data.currency === 'LYD' ? 'wallet_lyd' : 'wallet_usd',
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      pickup: {
        store: data.pickupStore,
        address: data.pickupAddress,
        deadline: data.pickupDeadline,
      },
      notes: `Your digital ${data.metalType} has been converted to a physical bar. Fabrication and cutting fee applied. Digital balance deducted: ${data.grams}g. Collect within 3 days.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateWalletDepositReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    amount: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    transactionId: string;
    depositMethod: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'wallet_deposit',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      amounts: {
        total: data.amount,
        currency: data.currency,
      },
      payment: {
        method: data.depositMethod as any,
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      notes: `Funds deposited successfully to your ${data.currency} wallet. Available balance updated.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },

  generateWalletWithdrawalReceipt(data: {
    userId: string;
    userName: string;
    userEmail?: string;
    amount: number;
    currency: 'LYD' | 'USD';
    walletBalanceBefore: number;
    walletBalanceAfter: number;
    transactionId: string;
    withdrawalMethod: string;
  }): TransactionReceiptData {
    return {
      transactionId: data.transactionId,
      type: 'wallet_withdrawal',
      timestamp: new Date().toISOString(),
      status: 'success',
      user: {
        name: data.userName,
        email: data.userEmail,
      },
      amounts: {
        total: data.amount,
        currency: data.currency,
      },
      payment: {
        method: data.withdrawalMethod as any,
        walletBalanceBefore: data.walletBalanceBefore,
        walletBalanceAfter: data.walletBalanceAfter,
      },
      notes: `Funds withdrawn successfully from your ${data.currency} wallet. Available balance updated.`,
      txHash: `TXH-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };
  },
};
