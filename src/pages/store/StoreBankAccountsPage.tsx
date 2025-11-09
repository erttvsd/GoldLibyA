import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Plus, Edit, Trash2, Power, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { bankAccountsService, BankAccount } from '../../services/bank-accounts.service';

interface StoreBankAccountsPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreBankAccountsPage = ({ storeId, onBack }: StoreBankAccountsPageProps) => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [processing, setProcessing] = useState(false);

  const [addFormData, setAddFormData] = useState({
    bank_name: '',
    account_number: '',
    iban: '',
    swift_code: '',
    account_holder_name: '',
    branch: '',
  });

  const [editFormData, setEditFormData] = useState({
    bank_name: '',
    account_number: '',
    iban: '',
    swift_code: '',
    account_holder_name: '',
    branch: '',
  });

  const [transactionData, setTransactionData] = useState({
    type: 'bank_deposit' as 'bank_deposit' | 'bank_withdrawal',
    amount: '',
    description: '',
  });

  useEffect(() => {
    loadAccounts();
  }, [storeId]);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const { data, error } = await bankAccountsService.getAccounts(storeId);
      if (error) throw error;
      setAccounts(data || []);
    } catch (err) {
      console.error('Error loading accounts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    if (!addFormData.bank_name || !addFormData.account_number || !addFormData.account_holder_name) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await bankAccountsService.createAccount(storeId, {
        bank_name: addFormData.bank_name,
        account_number: addFormData.account_number,
        iban: addFormData.iban || undefined,
        swift_code: addFormData.swift_code || undefined,
        account_holder_name: addFormData.account_holder_name,
        branch: addFormData.branch || undefined,
      });

      if (error) throw error;

      alert('Bank account added successfully!');
      setShowAddModal(false);
      setAddFormData({
        bank_name: '',
        account_number: '',
        iban: '',
        swift_code: '',
        account_holder_name: '',
        branch: '',
      });
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to add bank account');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!selectedAccount) return;
    if (!editFormData.bank_name || !editFormData.account_number || !editFormData.account_holder_name) {
      alert('Please fill in all required fields');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await bankAccountsService.updateAccount(selectedAccount.id, {
        bank_name: editFormData.bank_name,
        account_number: editFormData.account_number,
        iban: editFormData.iban || undefined,
        swift_code: editFormData.swift_code || undefined,
        account_holder_name: editFormData.account_holder_name,
        branch: editFormData.branch || undefined,
      });

      if (error) throw error;

      alert('Bank account updated successfully!');
      setShowEditModal(false);
      setSelectedAccount(null);
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to update bank account');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (account: BankAccount) => {
    try {
      const { error } = await bankAccountsService.toggleActive(account.id, !account.is_active);
      if (error) throw error;
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle account status');
    }
  };

  const handleVerifyAccount = async (account: BankAccount) => {
    if (!confirm('Confirm that this bank account has been verified?')) return;

    try {
      const { error } = await bankAccountsService.verifyAccount(account.id);
      if (error) throw error;
      alert('Account verified successfully!');
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to verify account');
    }
  };

  const handleDeleteAccount = async (account: BankAccount) => {
    if (!confirm('Are you sure you want to delete this bank account?')) return;

    try {
      const { error } = await bankAccountsService.deleteAccount(account.id);
      if (error) throw error;
      loadAccounts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete account');
    }
  };

  const handleRecordTransaction = async () => {
    if (!selectedAccount || !transactionData.amount) {
      alert('Please enter transaction amount');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await bankAccountsService.recordBankTransaction(
        storeId,
        selectedAccount.id,
        transactionData.type,
        parseFloat(transactionData.amount),
        transactionData.description || undefined
      );

      if (error) throw error;

      alert('Transaction recorded successfully!');
      setShowTransactionModal(false);
      setSelectedAccount(null);
      setTransactionData({ type: 'bank_deposit', amount: '', description: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to record transaction');
    } finally {
      setProcessing(false);
    }
  };

  const openEditModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setEditFormData({
      bank_name: account.bank_name,
      account_number: account.account_number,
      iban: account.iban || '',
      swift_code: account.swift_code || '',
      account_holder_name: account.account_holder_name,
      branch: account.branch || '',
    });
    setShowEditModal(true);
  };

  const openTransactionModal = (account: BankAccount) => {
    setSelectedAccount(account);
    setTransactionData({ type: 'bank_deposit', amount: '', description: '' });
    setShowTransactionModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Building2 className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Bank Accounts</h1>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> Add Account
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {accounts.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Building2 size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No bank accounts found</p>
            <Button onClick={() => setShowAddModal(true)} className="mt-4">
              Add Your First Bank Account
            </Button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {accounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-bold text-lg">{account.bank_name}</div>
                        {account.is_verified && (
                          <CheckCircle size={16} className="text-green-600" title="Verified" />
                        )}
                        {!account.is_verified && (
                          <AlertCircle size={16} className="text-orange-600" title="Not Verified" />
                        )}
                      </div>
                      <div className="text-sm text-gray-500">{account.account_holder_name}</div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleActive(account)}
                        className={`p-2 rounded ${
                          account.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(account)}
                        className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteAccount(account)}
                        className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Account Number</div>
                      <div className="font-mono">{account.account_number}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-semibold">
                        {account.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-gray-600">Inactive</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {account.iban && (
                    <div className="text-sm">
                      <div className="text-xs text-gray-500">IBAN</div>
                      <div className="font-mono">{account.iban}</div>
                    </div>
                  )}

                  {account.swift_code && (
                    <div className="text-sm">
                      <div className="text-xs text-gray-500">SWIFT Code</div>
                      <div className="font-mono">{account.swift_code}</div>
                    </div>
                  )}

                  {account.branch && (
                    <div className="text-sm">
                      <div className="text-xs text-gray-500">Branch</div>
                      <div>{account.branch}</div>
                    </div>
                  )}

                  <div className="flex gap-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                    {!account.is_verified && (
                      <Button onClick={() => handleVerifyAccount(account)} size="sm" variant="secondary">
                        Verify Account
                      </Button>
                    )}
                    <Button
                      onClick={() => openTransactionModal(account)}
                      size="sm"
                      className="flex-1"
                      disabled={!account.is_active}
                    >
                      Record Transaction
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Bank Account">
          <div className="space-y-4">
            <Input
              label="Bank Name *"
              value={addFormData.bank_name}
              onChange={(e) => setAddFormData({ ...addFormData, bank_name: e.target.value })}
              placeholder="National Bank of Libya"
            />

            <Input
              label="Account Holder Name *"
              value={addFormData.account_holder_name}
              onChange={(e) => setAddFormData({ ...addFormData, account_holder_name: e.target.value })}
              placeholder="Store Legal Name"
            />

            <Input
              label="Account Number *"
              value={addFormData.account_number}
              onChange={(e) => setAddFormData({ ...addFormData, account_number: e.target.value })}
              placeholder="1234567890"
            />

            <Input
              label="IBAN (Optional)"
              value={addFormData.iban}
              onChange={(e) => setAddFormData({ ...addFormData, iban: e.target.value })}
              placeholder="LY38 021 1234567890123"
            />

            <Input
              label="SWIFT Code (Optional)"
              value={addFormData.swift_code}
              onChange={(e) => setAddFormData({ ...addFormData, swift_code: e.target.value })}
              placeholder="NBLYLYTR"
            />

            <Input
              label="Branch (Optional)"
              value={addFormData.branch}
              onChange={(e) => setAddFormData({ ...addFormData, branch: e.target.value })}
              placeholder="Main Branch, Tripoli"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleAddAccount}
                disabled={
                  processing ||
                  !addFormData.bank_name ||
                  !addFormData.account_number ||
                  !addFormData.account_holder_name
                }
                className="flex-1"
              >
                {processing ? 'Adding...' : 'Add Bank Account'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && selectedAccount && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Bank Account">
          <div className="space-y-4">
            <Input
              label="Bank Name *"
              value={editFormData.bank_name}
              onChange={(e) => setEditFormData({ ...editFormData, bank_name: e.target.value })}
              placeholder="National Bank of Libya"
            />

            <Input
              label="Account Holder Name *"
              value={editFormData.account_holder_name}
              onChange={(e) => setEditFormData({ ...editFormData, account_holder_name: e.target.value })}
              placeholder="Store Legal Name"
            />

            <Input
              label="Account Number *"
              value={editFormData.account_number}
              onChange={(e) => setEditFormData({ ...editFormData, account_number: e.target.value })}
              placeholder="1234567890"
            />

            <Input
              label="IBAN (Optional)"
              value={editFormData.iban}
              onChange={(e) => setEditFormData({ ...editFormData, iban: e.target.value })}
              placeholder="LY38 021 1234567890123"
            />

            <Input
              label="SWIFT Code (Optional)"
              value={editFormData.swift_code}
              onChange={(e) => setEditFormData({ ...editFormData, swift_code: e.target.value })}
              placeholder="NBLYLYTR"
            />

            <Input
              label="Branch (Optional)"
              value={editFormData.branch}
              onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value })}
              placeholder="Main Branch, Tripoli"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateAccount}
                disabled={
                  processing ||
                  !editFormData.bank_name ||
                  !editFormData.account_number ||
                  !editFormData.account_holder_name
                }
                className="flex-1"
              >
                {processing ? 'Updating...' : 'Update Bank Account'}
              </Button>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showTransactionModal && selectedAccount && (
        <Modal
          isOpen={showTransactionModal}
          onClose={() => setShowTransactionModal(false)}
          title="Record Bank Transaction"
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="font-medium">{selectedAccount.bank_name}</div>
              <div className="text-sm text-gray-500">{selectedAccount.account_number}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTransactionData({ ...transactionData, type: 'bank_deposit' })}
                  className={`p-3 rounded border-2 transition ${
                    transactionData.type === 'bank_deposit'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="font-medium">Deposit</div>
                  <div className="text-xs text-gray-500">Money in</div>
                </button>
                <button
                  onClick={() => setTransactionData({ ...transactionData, type: 'bank_withdrawal' })}
                  className={`p-3 rounded border-2 transition ${
                    transactionData.type === 'bank_withdrawal'
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="font-medium">Withdrawal</div>
                  <div className="text-xs text-gray-500">Money out</div>
                </button>
              </div>
            </div>

            <Input
              label="Amount (LYD) *"
              type="number"
              value={transactionData.amount}
              onChange={(e) => setTransactionData({ ...transactionData, amount: e.target.value })}
              placeholder="0.00"
              step="0.01"
              min="0"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Description (Optional)</label>
              <textarea
                value={transactionData.description}
                onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                placeholder="Add transaction notes..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleRecordTransaction}
                disabled={processing || !transactionData.amount}
                className="flex-1"
              >
                {processing ? 'Recording...' : 'Record Transaction'}
              </Button>
              <Button variant="secondary" onClick={() => setShowTransactionModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
