import jsPDF from 'jspdf';
import { TransactionReceiptData } from '../components/invoice/TransactionReceipt';
import { formatCurrency, formatGrams, formatDate } from './format';

export const generateReceiptPDF = (data: TransactionReceiptData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION RECEIPT', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gold Trading Platform', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 10;

  const getTransactionTitle = () => {
    switch (data.type) {
      case 'digital_purchase': return 'Digital Gold Purchase';
      case 'physical_purchase': return 'Physical Gold Purchase';
      case 'ownership_transfer': return 'Ownership Transfer';
      case 'location_change': return 'Location Change';
      case 'digital_transfer': return 'Digital Gold Transfer';
      case 'receive_physical': return 'Convert to Physical';
      case 'wallet_deposit': return 'Wallet Deposit';
      case 'wallet_withdrawal': return 'Wallet Withdrawal';
      default: return 'Transaction';
    }
  };

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(getTransactionTitle(), 20, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Status: ${data.status.toUpperCase()}`, 20, yPos);
  yPos += 15;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Transaction Details', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  addKeyValue(doc, 'Transaction ID:', data.transactionId, 20, yPos);
  yPos += 6;
  addKeyValue(doc, 'Date & Time:', formatDate(data.timestamp), 20, yPos);
  yPos += 6;
  if (data.txHash) {
    addKeyValue(doc, 'TX Hash:', data.txHash, 20, yPos);
    yPos += 6;
  }
  yPos += 5;

  if (data.user) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Customer Information', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Name:', data.user.name, 20, yPos);
    yPos += 6;
    if (data.user.email) {
      addKeyValue(doc, 'Email:', data.user.email, 20, yPos);
      yPos += 6;
    }
    if (data.user.phone) {
      addKeyValue(doc, 'Phone:', data.user.phone, 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  if (data.recipient) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Recipient Information', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Name:', data.recipient.name, 20, yPos);
    yPos += 6;
    if (data.recipient.email) {
      addKeyValue(doc, 'Email:', data.recipient.email, 20, yPos);
      yPos += 6;
    }
    if (data.recipient.phone) {
      addKeyValue(doc, 'Phone:', data.recipient.phone, 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  if (data.product) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Product Details', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Product:', data.product.name, 20, yPos);
    yPos += 6;
    addKeyValue(doc, 'Type:', data.product.type.toUpperCase(), 20, yPos);
    yPos += 6;
    addKeyValue(doc, 'Weight:', formatGrams(data.product.weight), 20, yPos);
    yPos += 6;
    if (data.product.carat) {
      addKeyValue(doc, 'Karat:', `${data.product.carat}K`, 20, yPos);
      yPos += 6;
    }
    if (data.product.serialNumber) {
      addKeyValue(doc, 'Serial Number:', data.product.serialNumber, 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  if (data.digitalGrams) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(`Digital ${data.digitalGrams.metal.toUpperCase()}`, 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Amount:', formatGrams(data.digitalGrams.grams), 20, yPos);
    yPos += 6;
    if (data.digitalGrams.pricePerGram > 0) {
      addKeyValue(doc, 'Price per Gram:', formatCurrency(data.digitalGrams.pricePerGram, data.amounts.currency), 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  if (data.location) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Location Change', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (data.location.from) {
      addKeyValue(doc, 'From:', data.location.from, 20, yPos);
      yPos += 6;
    }
    if (data.location.to) {
      addKeyValue(doc, 'To:', data.location.to, 20, yPos);
      yPos += 6;
    }
    yPos += 5;
  }

  doc.setFillColor(240, 240, 240);
  doc.rect(20, yPos, pageWidth - 40, 2, 'F');
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Payment Summary', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  if (data.amounts.subtotal !== undefined) {
    addKeyValue(doc, 'Subtotal:', formatCurrency(data.amounts.subtotal, data.amounts.currency), 20, yPos);
    yPos += 6;
  }
  if (data.amounts.commission !== undefined && data.amounts.commission > 0) {
    addKeyValue(doc, 'Commission (1.5%):', formatCurrency(data.amounts.commission, data.amounts.currency), 20, yPos);
    yPos += 6;
  }
  if (data.amounts.fees !== undefined && data.amounts.fees > 0) {
    addKeyValue(doc, 'Service Fees:', formatCurrency(data.amounts.fees, data.amounts.currency), 20, yPos);
    yPos += 6;
  }
  if (data.amounts.fabricationFee !== undefined && data.amounts.fabricationFee > 0) {
    addKeyValue(doc, 'Fabrication Fee:', formatCurrency(data.amounts.fabricationFee, data.amounts.currency), 20, yPos);
    yPos += 6;
  }
  if (data.amounts.storageFee !== undefined && data.amounts.storageFee > 0) {
    addKeyValue(doc, 'Storage Fee:', formatCurrency(data.amounts.storageFee, data.amounts.currency), 20, yPos);
    yPos += 6;
  }

  yPos += 3;
  doc.setDrawColor(50, 50, 50);
  doc.line(20, yPos, pageWidth - 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  addKeyValue(doc, 'TOTAL AMOUNT:', formatCurrency(data.amounts.total, data.amounts.currency), 20, yPos);
  yPos += 10;

  if (data.payment) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Payment Method', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Method:', data.payment.method.replace('_', ' ').toUpperCase(), 20, yPos);
    yPos += 6;
    if (data.payment.walletBalanceBefore !== undefined) {
      addKeyValue(doc, 'Balance Before:', formatCurrency(data.payment.walletBalanceBefore, data.amounts.currency), 20, yPos);
      yPos += 6;
      addKeyValue(doc, 'Balance After:', formatCurrency(data.payment.walletBalanceAfter || 0, data.amounts.currency), 20, yPos);
      yPos += 6;
    }
  }

  if (data.pickup) {
    yPos += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Pickup Information', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addKeyValue(doc, 'Store:', data.pickup.store, 20, yPos);
    yPos += 6;
    addKeyValue(doc, 'Deadline:', formatDate(data.pickup.deadline), 20, yPos);
    yPos += 6;
    if (data.pickup.address) {
      addKeyValue(doc, 'Address:', data.pickup.address, 20, yPos);
      yPos += 6;
    }

    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(200, 100, 0);
    const warningText = '⚠ Please collect within 3 days to avoid storage fees (30 LYD/day)';
    doc.text(warningText, 20, yPos);
    doc.setTextColor(0, 0, 0);
  }

  if (data.notes) {
    yPos += 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Notes', 20, yPos);
    yPos += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPos);
    yPos += splitNotes.length * 5 + 5;
  }

  const footerY = doc.internal.pageSize.getHeight() - 30;
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY, pageWidth - 20, footerY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text('This receipt is your proof of transaction', pageWidth / 2, footerY + 8, { align: 'center' });
  doc.text('Keep it for your records', pageWidth / 2, footerY + 13, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.text('Gold Trading Platform', pageWidth / 2, footerY + 20, { align: 'center' });

  return doc;
};

const addKeyValue = (doc: jsPDF, key: string, value: string, x: number, y: number) => {
  doc.setFont('helvetica', 'normal');
  doc.text(key, x, y);
  doc.setFont('helvetica', 'bold');
  const keyWidth = doc.getTextWidth(key);
  doc.text(value, x + keyWidth + 5, y);
};

export const downloadReceiptPDF = (data: TransactionReceiptData) => {
  const doc = generateReceiptPDF(data);
  const fileName = `receipt-${data.transactionId}.pdf`;
  doc.save(fileName);
};

export const shareReceipt = async (data: TransactionReceiptData) => {
  if (navigator.share) {
    const doc = generateReceiptPDF(data);
    const pdfBlob = doc.output('blob');
    const file = new File([pdfBlob], `receipt-${data.transactionId}.pdf`, { type: 'application/pdf' });

    try {
      await navigator.share({
        title: 'Transaction Receipt',
        text: `Receipt for transaction ${data.transactionId}`,
        files: [file]
      });
      return true;
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return false;
      }
      console.error('Share failed:', error);
      return false;
    }
  } else {
    const shareText = generateShareText(data);

    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('Receipt details copied to clipboard! You can now paste and share.');
        return true;
      } catch (error) {
        console.error('Clipboard copy failed:', error);
      }
    }

    const tempTextArea = document.createElement('textarea');
    tempTextArea.value = shareText;
    tempTextArea.style.position = 'fixed';
    tempTextArea.style.left = '-999999px';
    document.body.appendChild(tempTextArea);
    tempTextArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(tempTextArea);

      if (successful) {
        alert('Receipt details copied to clipboard! You can now paste and share.');
        return true;
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }

    document.body.removeChild(tempTextArea);
    alert('Sharing not supported on this device. Please download the PDF instead.');
    return false;
  }
};

const generateShareText = (data: TransactionReceiptData): string => {
  const getTransactionTitle = () => {
    switch (data.type) {
      case 'digital_purchase': return 'Digital Gold Purchase';
      case 'physical_purchase': return 'Physical Gold Purchase';
      case 'ownership_transfer': return 'Ownership Transfer';
      case 'location_change': return 'Location Change';
      case 'digital_transfer': return 'Digital Gold Transfer';
      case 'receive_physical': return 'Convert to Physical';
      case 'wallet_deposit': return 'Wallet Deposit';
      case 'wallet_withdrawal': return 'Wallet Withdrawal';
      default: return 'Transaction';
    }
  };

  let text = `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📄 TRANSACTION RECEIPT\n`;
  text += `Gold Trading Platform\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  text += `${getTransactionTitle()}\n`;
  text += `Status: ${data.status.toUpperCase()}\n\n`;
  text += `Transaction ID: ${data.transactionId}\n`;
  text += `Date: ${formatDate(data.timestamp)}\n`;
  if (data.txHash) text += `TX Hash: ${data.txHash}\n`;
  text += `\n`;

  if (data.user) {
    text += `Customer: ${data.user.name}\n`;
    if (data.user.email) text += `Email: ${data.user.email}\n`;
    text += `\n`;
  }

  if (data.product) {
    text += `Product: ${data.product.name}\n`;
    text += `Weight: ${formatGrams(data.product.weight)}\n`;
    if (data.product.serialNumber) text += `Serial: ${data.product.serialNumber}\n`;
    text += `\n`;
  }

  if (data.digitalGrams) {
    text += `Digital ${data.digitalGrams.metal.toUpperCase()}: ${formatGrams(data.digitalGrams.grams)}\n\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 PAYMENT SUMMARY\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n`;
  if (data.amounts.subtotal !== undefined) {
    text += `Subtotal: ${formatCurrency(data.amounts.subtotal, data.amounts.currency)}\n`;
  }
  if (data.amounts.commission !== undefined && data.amounts.commission > 0) {
    text += `Commission: ${formatCurrency(data.amounts.commission, data.amounts.currency)}\n`;
  }
  text += `TOTAL: ${formatCurrency(data.amounts.total, data.amounts.currency)}\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (data.pickup) {
    text += `📍 Pickup: ${data.pickup.store}\n`;
    text += `Deadline: ${formatDate(data.pickup.deadline)}\n\n`;
  }

  text += `This receipt is your proof of transaction.\n`;
  text += `Gold Trading Platform\n`;

  return text;
};
