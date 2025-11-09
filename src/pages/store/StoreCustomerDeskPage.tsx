import { useState } from 'react';
import { ArrowLeft, Search, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { storeService } from '../../services/store.service';

interface StoreCustomerDeskPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreCustomerDeskPage = ({ storeId, onBack }: StoreCustomerDeskPageProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await storeService.searchCustomer(storeId, searchQuery);
      if (error) throw error;
      setResults(data || []);
    } catch (error: any) {
      console.error('Search error:', error);
      alert(error.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCustomer = async (customer: any) => {
    setSelectedCustomer(customer);

    // Load notes
    try {
      const { data } = await storeService.getCustomerNotes(storeId, customer.user_id);
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !selectedCustomer) return;

    try {
      await storeService.addCustomerNote(storeId, selectedCustomer.user_id, newNote, true);
      setNewNote('');

      // Reload notes
      const { data } = await storeService.getCustomerNotes(storeId, selectedCustomer.user_id);
      setNotes(data || []);
    } catch (error: any) {
      alert(error.message || 'Failed to add note');
    }
  };

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} variant="ghost" icon={ArrowLeft}>
          Back
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Customer Desk</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Search and manage customer information
        </p>
      </div>

      <Card>
        <div className="flex gap-2">
          <Input
            label=""
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or phone..."
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} variant="primary" icon={Search} disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </Card>

      {results.length > 0 && !selectedCustomer && (
        <div className="space-y-2">
          <h3 className="font-semibold">Search Results</h3>
          {results.map((customer) => (
            <Card
              key={customer.user_id}
              className="cursor-pointer hover:shadow-lg transition"
              onClick={() => handleSelectCustomer(customer)}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-grow">
                  <p className="font-semibold">{customer.full_name}</p>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    {customer.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </span>
                    )}
                    {customer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {customer.phone}
                      </span>
                    )}
                  </div>
                </div>
                {customer.kyc_verified && (
                  <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 px-2 py-1 rounded-full">
                    Verified
                  </span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {selectedCustomer && (
        <>
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">{selectedCustomer.full_name}</p>
                  {selectedCustomer.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.email}</p>
                  )}
                  {selectedCustomer.phone && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{selectedCustomer.phone}</p>
                  )}
                </div>
              </div>
              <Button onClick={() => setSelectedCustomer(null)} variant="outline" size="sm">
                Back to Search
              </Button>
            </div>
          </Card>

          <Card>
            <h3 className="font-bold mb-3 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2" />
              Internal Notes
            </h3>

            {notes.length > 0 && (
              <div className="space-y-2 mb-4">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 dark:bg-gray-800/50 rounded p-3">
                    <p className="text-sm">{note.body}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {note.profiles?.first_name} - {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Input
                label="Add Internal Note"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter note..."
              />
              <Button
                onClick={handleAddNote}
                variant="primary"
                size="sm"
                icon={MessageSquare}
                disabled={!newNote.trim()}
              >
                Add Note
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
