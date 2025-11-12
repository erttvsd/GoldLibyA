import { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, Send, FileText, Download } from 'lucide-react';
import { Modal, Button, Input, Card } from '../ui';
import { customerService, CustomerInteraction, ChatMessage, CustomerTransaction } from '../../services/customer.service';

interface CustomerDetailModalProps {
  interaction: CustomerInteraction;
  onClose: () => void;
  onUpdate: () => void;
}

export const CustomerDetailModal = ({ interaction, onClose, onUpdate }: CustomerDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'transactions'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [transactions, setTransactions] = useState<CustomerTransaction[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
    loadTransactions();
  }, [interaction.id]);

  useEffect(() => {
    if (activeTab === 'chat') {
      scrollToBottom();
    }
  }, [chatMessages, activeTab]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = async () => {
    try {
      const { data, error } = await customerService.getChatHistory(interaction.id);
      if (error) throw new Error(error);
      setChatMessages(data || []);
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await customerService.getTransactions(interaction.id);
      if (error) throw new Error(error);
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const { data, error } = await customerService.sendChatMessage(interaction.id, newMessage);
      if (error) throw new Error(error);

      if (data) {
        setChatMessages([...chatMessages, data]);
        setNewMessage('');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const downloadStatement = () => {
    const headers = ['Date', 'Type', 'Amount', 'Currency', 'Description'];
    const rows = transactions.map(t => [
      new Date(t.created_at).toLocaleString(),
      t.transaction_type,
      t.amount.toFixed(2),
      t.currency,
      t.description || ''
    ]);

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    rows.push(['', '', '', '', '']);
    rows.push(['Total', '', totalAmount.toFixed(2), transactions[0]?.currency || 'LYD', '']);

    const csv = [
      `Customer Statement - ${interaction.customer_name}`,
      `Email: ${interaction.customer_email}`,
      `Phone: ${interaction.customer_phone || 'N/A'}`,
      `Bar: ${interaction.asset_bar_number || 'N/A'}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement-${interaction.customer_name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusColor = (status: CustomerInteraction['interaction_type']) => {
    const colors = {
      appointment_set: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
      picked_up: 'text-green-600 bg-green-100 dark:bg-green-900/30',
      transferred: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
      pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
      cancelled: 'text-red-600 bg-red-100 dark:bg-red-900/30',
    };
    return colors[status];
  };

  const getTransactionTypeLabel = (type: CustomerTransaction['transaction_type']) => {
    const labels = {
      purchase: 'Purchase',
      transfer: 'Transfer',
      pickup: 'Pickup',
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
    };
    return labels[type];
  };

  return (
    <Modal isOpen onClose={onClose} title="Customer Details">
      <div className="space-y-4">
        <Card className="bg-gray-50 dark:bg-gray-800/50">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-lg">{interaction.customer_name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{interaction.customer_email}</p>
                {interaction.customer_phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">{interaction.customer_phone}</p>
                )}
              </div>
              <span className={`text-xs px-3 py-1 rounded-full ${getStatusColor(interaction.interaction_type)}`}>
                {interaction.interaction_type.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            {interaction.asset_bar_number && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <p className="text-gray-500 text-xs">Bar Number</p>
                    <p className="font-semibold">{interaction.asset_bar_number}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Weight</p>
                    <p className="font-semibold">{interaction.asset_weight}g</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Purity</p>
                    <p className="font-semibold">{interaction.asset_purity}</p>
                  </div>
                </div>
              </div>
            )}

            {interaction.notes && (
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Notes</p>
                <p className="text-sm">{interaction.notes}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition ${
              activeTab === 'chat'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat History
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`flex items-center gap-2 px-4 py-2 font-medium text-sm transition ${
              activeTab === 'transactions'
                ? 'text-yellow-600 border-b-2 border-yellow-600'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            Transactions
          </button>
        </div>

        {activeTab === 'chat' ? (
          <div className="space-y-4">
            <div className="h-80 overflow-y-auto space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
              {chatMessages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No messages yet</p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_type === 'store' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg px-4 py-2 ${
                        msg.sender_type === 'store'
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender_type === 'store' ? 'text-yellow-100' : 'text-gray-400'
                      }`}>
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="flex gap-2">
              <Input
                label=""
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              />
              <Button
                onClick={handleSendMessage}
                variant="primary"
                icon={Send}
                disabled={!newMessage.trim() || loading}
              >
                Send
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
              </p>
              <Button onClick={downloadStatement} variant="outline" icon={Download} size="sm">
                Download Statement
              </Button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2">
              {transactions.length === 0 ? (
                <Card>
                  <p className="text-center text-gray-500 py-8">No transactions yet</p>
                </Card>
              ) : (
                transactions.map((transaction) => (
                  <Card key={transaction.id} className="hover:shadow-md transition">
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{getTransactionTypeLabel(transaction.transaction_type)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {transaction.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {transaction.description}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {transaction.amount.toFixed(2)} {transaction.currency}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {transactions.length > 0 && (
              <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Amount</span>
                  <span className="text-xl font-bold">
                    {transactions.reduce((sum, t) => sum + t.amount, 0).toFixed(2)} {transactions[0].currency}
                  </span>
                </div>
              </Card>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
