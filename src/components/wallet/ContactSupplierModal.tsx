import { useState, useEffect, useRef } from 'react';
import { Send, Phone, MapPin, X, MessageCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Modal, Button, Card } from '../ui';
import { OwnedAsset } from '../../types';

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: 'customer' | 'supplier' | 'admin';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface Conversation {
  id: string;
  user_id: string;
  asset_id: string;
  store_id: string;
  subject: string;
  status: 'open' | 'resolved' | 'closed';
  last_message_at: string;
  created_at: string;
}

interface ContactSupplierModalProps {
  asset: OwnedAsset;
  onClose: () => void;
}

export const ContactSupplierModal = ({ asset, onClose }: ContactSupplierModalProps) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initializeConversation();
  }, [asset.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const initializeConversation = async () => {
    try {
      setLoading(true);

      const subject = `Inquiry about ${asset.product?.name || 'Gold Bar'} - ${asset.serial_number}`;

      const { data: convId, error } = await supabase.rpc('get_or_create_conversation', {
        p_user_id: user!.id,
        p_asset_id: asset.id,
        p_store_id: asset.pickup_store_id,
        p_subject: subject,
      });

      if (error) throw error;

      setConversationId(convId);
      await loadMessages(convId);
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const { data, error } = await supabase
        .from('support_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId || sending) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('support_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user!.id,
          sender_type: 'customer',
          message: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages([...messages, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Contact Supplier" size="lg">
      <div className="space-y-4">
        <Card className="bg-yellow-50 dark:bg-yellow-900/20">
          <div className="space-y-2">
            <h3 className="font-bold">{asset.product?.name}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Serial Number: {asset.serial_number}
            </p>
          </div>
        </Card>

        {asset.store && (
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <div className="space-y-2">
              <h4 className="font-semibold flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Store Information
              </h4>
              <div className="text-sm space-y-1">
                <p className="font-medium">{asset.store.name}</p>
                <p className="text-gray-600 dark:text-gray-400">{asset.store.address}</p>
                <p className="text-gray-600 dark:text-gray-400">{asset.store.city}</p>
                {asset.store.phone && (
                  <a
                    href={`tel:${asset.store.phone}`}
                    className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {asset.store.phone}
                  </a>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h4 className="font-semibold mb-3 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2" />
            In-App Chat
          </h4>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-80 overflow-y-auto mb-3">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No messages yet</p>
                  <p className="text-xs mt-1">Start a conversation with the supplier</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender_id === user!.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        msg.sender_id === user!.id
                          ? 'bg-yellow-500 text-white'
                          : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p
                        className={`text-xs mt-1 ${
                          msg.sender_id === user!.id
                            ? 'text-yellow-100'
                            : 'text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-grow px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent dark:bg-gray-800 resize-none"
              rows={2}
              disabled={loading || sending}
            />
            <Button
              onClick={handleSendMessage}
              variant="primary"
              icon={Send}
              disabled={!newMessage.trim() || loading || sending}
              loading={sending}
            >
              Send
            </Button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="outline">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
