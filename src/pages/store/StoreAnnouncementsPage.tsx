import { useState, useEffect } from 'react';
import { ArrowLeft, Megaphone, Plus, Edit, Trash2, Power, Calendar, Eye, EyeOff } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { announcementsService, Announcement } from '../../services/announcements.service';

interface StoreAnnouncementsPageProps {
  storeId: string;
  onBack: () => void;
}

export const StoreAnnouncementsPage = ({ storeId, onBack }: StoreAnnouncementsPageProps) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'expired'>('active');

  const [createFormData, setCreateFormData] = useState({
    title: '',
    body: '',
    visible_from: '',
    visible_to: '',
  });

  const [editFormData, setEditFormData] = useState({
    title: '',
    body: '',
    visible_from: '',
    visible_to: '',
  });

  useEffect(() => {
    loadAnnouncements();
  }, [storeId, filter]);

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const { data, error } = await announcementsService.getAnnouncements(storeId, false);
      if (error) throw error;

      let filtered = data || [];
      const now = new Date();

      if (filter === 'active') {
        filtered = filtered.filter((a) => {
          const isActive = a.is_active;
          const afterStart = !a.visible_from || new Date(a.visible_from) <= now;
          const beforeEnd = !a.visible_to || new Date(a.visible_to) >= now;
          return isActive && afterStart && beforeEnd;
        });
      } else if (filter === 'scheduled') {
        filtered = filtered.filter((a) => a.visible_from && new Date(a.visible_from) > now);
      } else if (filter === 'expired') {
        filtered = filtered.filter((a) => !a.is_active || (a.visible_to && new Date(a.visible_to) < now));
      }

      setAnnouncements(filtered);
    } catch (err) {
      console.error('Error loading announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async () => {
    if (!createFormData.title || !createFormData.body) {
      alert('Please enter title and message');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await announcementsService.createAnnouncement(storeId, {
        title: createFormData.title,
        body: createFormData.body,
        visible_from: createFormData.visible_from || undefined,
        visible_to: createFormData.visible_to || undefined,
      });

      if (error) throw error;

      alert('Announcement created successfully!');
      setShowCreateModal(false);
      setCreateFormData({ title: '', body: '', visible_from: '', visible_to: '' });
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to create announcement');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateAnnouncement = async () => {
    if (!selectedAnnouncement) return;
    if (!editFormData.title || !editFormData.body) {
      alert('Please enter title and message');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await announcementsService.updateAnnouncement(selectedAnnouncement.id, {
        title: editFormData.title,
        body: editFormData.body,
        visible_from: editFormData.visible_from || undefined,
        visible_to: editFormData.visible_to || undefined,
      });

      if (error) throw error;

      alert('Announcement updated successfully!');
      setShowEditModal(false);
      setSelectedAnnouncement(null);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to update announcement');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (announcement: Announcement) => {
    try {
      const { error } = await announcementsService.toggleActive(announcement.id, !announcement.is_active);
      if (error) throw error;
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle announcement');
    }
  };

  const handleDeleteAnnouncement = async (announcement: Announcement) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await announcementsService.deleteAnnouncement(announcement.id);
      if (error) throw error;
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Failed to delete announcement');
    }
  };

  const openEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditFormData({
      title: announcement.title,
      body: announcement.body,
      visible_from: announcement.visible_from || '',
      visible_to: announcement.visible_to || '',
    });
    setShowEditModal(true);
  };

  const getAnnouncementStatus = (announcement: Announcement) => {
    const now = new Date();
    if (!announcement.is_active) return { label: 'Inactive', color: 'gray' };
    if (announcement.visible_from && new Date(announcement.visible_from) > now) {
      return { label: 'Scheduled', color: 'blue' };
    }
    if (announcement.visible_to && new Date(announcement.visible_to) < now) {
      return { label: 'Expired', color: 'orange' };
    }
    return { label: 'Active', color: 'green' };
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
              <Megaphone className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Announcements</h1>
            </div>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> Create Announcement
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['active', 'all', 'scheduled', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition ${
                filter === f
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {announcements.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            <Megaphone size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No {filter !== 'all' ? filter : ''} announcements found</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Create Your First Announcement
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement) => {
              const status = getAnnouncementStatus(announcement);
              return (
                <Card key={announcement.id} className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-lg">{announcement.title}</h3>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium bg-${status.color}-100 text-${status.color}-700`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{announcement.body}</p>
                      </div>
                      <div className="flex gap-1 ml-4">
                        <button
                          onClick={() => handleToggleActive(announcement)}
                          className={`p-2 rounded ${
                            announcement.is_active
                              ? 'bg-green-100 text-green-600 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {announcement.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                        </button>
                        <button
                          onClick={() => openEditModal(announcement)}
                          className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteAnnouncement(announcement)}
                          className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-4 text-sm text-gray-500">
                      {announcement.visible_from && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>From: {new Date(announcement.visible_from).toLocaleString()}</span>
                        </div>
                      )}
                      {announcement.visible_to && (
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>To: {new Date(announcement.visible_to).toLocaleString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700 pt-2">
                      Created {new Date(announcement.created_at).toLocaleString()}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Announcement">
          <div className="space-y-4">
            <Input
              label="Title"
              value={createFormData.title}
              onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
              placeholder="Important Store Update"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={createFormData.body}
                onChange={(e) => setCreateFormData({ ...createFormData, body: e.target.value })}
                placeholder="Enter your announcement message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Visible From (Optional)"
                type="datetime-local"
                value={createFormData.visible_from}
                onChange={(e) => setCreateFormData({ ...createFormData, visible_from: e.target.value })}
              />
              <Input
                label="Visible To (Optional)"
                type="datetime-local"
                value={createFormData.visible_to}
                onChange={(e) => setCreateFormData({ ...createFormData, visible_to: e.target.value })}
              />
            </div>

            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-blue-800 dark:text-blue-200">
              <strong>Tip:</strong> Leave dates blank for the announcement to be immediately visible without expiration.
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateAnnouncement}
                disabled={processing || !createFormData.title || !createFormData.body}
                className="flex-1"
              >
                {processing ? 'Creating...' : 'Create Announcement'}
              </Button>
              <Button variant="secondary" onClick={() => setShowCreateModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && selectedAnnouncement && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Announcement">
          <div className="space-y-4">
            <Input
              label="Title"
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              placeholder="Important Store Update"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea
                value={editFormData.body}
                onChange={(e) => setEditFormData({ ...editFormData, body: e.target.value })}
                placeholder="Enter your announcement message here..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Visible From (Optional)"
                type="datetime-local"
                value={editFormData.visible_from}
                onChange={(e) => setEditFormData({ ...editFormData, visible_from: e.target.value })}
              />
              <Input
                label="Visible To (Optional)"
                type="datetime-local"
                value={editFormData.visible_to}
                onChange={(e) => setEditFormData({ ...editFormData, visible_to: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleUpdateAnnouncement}
                disabled={processing || !editFormData.title || !editFormData.body}
                className="flex-1"
              >
                {processing ? 'Updating...' : 'Update Announcement'}
              </Button>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
