import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Shield, Activity, TrendingUp, Power, Trash2, Edit } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { staffService, StaffMember } from '../../services/staff.service';

interface StoreStaffPageProps {
  storeId: string;
  onBack: () => void;
}

const ROLE_OPTIONS = [
  { value: 'manager', label: 'Manager', color: 'purple' },
  { value: 'cashier', label: 'Cashier', color: 'blue' },
  { value: 'clerk', label: 'Clerk', color: 'green' },
  { value: 'security', label: 'Security', color: 'orange' },
];

const PERMISSION_OPTIONS = [
  { key: 'view_inventory', label: 'View Inventory' },
  { key: 'manage_inventory', label: 'Manage Inventory' },
  { key: 'view_sales', label: 'View Sales' },
  { key: 'process_sales', label: 'Process Sales' },
  { key: 'view_customers', label: 'View Customers' },
  { key: 'manage_customers', label: 'Manage Customers' },
  { key: 'view_reports', label: 'View Reports' },
  { key: 'manage_staff', label: 'Manage Staff' },
  { key: 'manage_cash', label: 'Manage Cash Drawer' },
  { key: 'process_handovers', label: 'Process Handovers' },
  { key: 'process_returns', label: 'Process Returns' },
  { key: 'view_financials', label: 'View Financials' },
];

export const StoreStaffPage = ({ storeId, onBack }: StoreStaffPageProps) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('active');

  const [addFormData, setAddFormData] = useState({
    email: '',
    role: 'cashier',
    permissions: {} as Record<string, boolean>,
  });

  const [editFormData, setEditFormData] = useState({
    role: '',
    permissions: {} as Record<string, boolean>,
  });

  useEffect(() => {
    loadStaff();
  }, [storeId, filter]);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const { data, error } = await staffService.getStaffMembers(storeId);
      if (error) throw error;

      let filtered = data || [];
      if (filter === 'active') {
        filtered = filtered.filter(s => s.is_active);
      } else if (filter === 'inactive') {
        filtered = filtered.filter(s => !s.is_active);
      }

      setStaff(filtered);
    } catch (err) {
      console.error('Error loading staff:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    if (!addFormData.email) {
      alert('Please enter email address');
      return;
    }

    setProcessing(true);
    try {
      const { error } = await staffService.addStaffMember(
        storeId,
        addFormData.email,
        addFormData.role,
        addFormData.permissions
      );

      if (error) throw error;

      alert('Staff member added successfully!');
      setShowAddModal(false);
      setAddFormData({ email: '', role: 'cashier', permissions: {} });
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to add staff member');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpdateStaff = async () => {
    if (!selectedMember) return;

    setProcessing(true);
    try {
      const { error } = await staffService.updateStaffRole(
        selectedMember.id,
        editFormData.role,
        editFormData.permissions
      );

      if (error) throw error;

      alert('Staff member updated successfully!');
      setShowEditModal(false);
      setSelectedMember(null);
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to update staff member');
    } finally {
      setProcessing(false);
    }
  };

  const handleToggleActive = async (member: StaffMember) => {
    try {
      const { error } = await staffService.toggleStaffActive(member.id, !member.is_active);
      if (error) throw error;
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle staff status');
    }
  };

  const handleRemoveStaff = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to remove ${member.profiles?.first_name || 'this staff member'}?`)) return;

    try {
      const { error } = await staffService.removeStaffMember(member.id);
      if (error) throw error;
      loadStaff();
    } catch (err: any) {
      alert(err.message || 'Failed to remove staff member');
    }
  };

  const handleViewPerformance = async (member: StaffMember) => {
    setSelectedMember(member);
    setShowPerformanceModal(true);
    try {
      const { data, error } = await staffService.getStaffPerformance(member.user_id, storeId);
      if (error) throw error;
      setPerformance(data);
    } catch (err) {
      console.error('Error loading performance:', err);
      setPerformance(null);
    }
  };

  const openEditModal = (member: StaffMember) => {
    setSelectedMember(member);
    setEditFormData({
      role: member.role,
      permissions: member.permissions || {},
    });
    setShowEditModal(true);
  };

  const getRoleColor = (role: string) => {
    const option = ROLE_OPTIONS.find(r => r.value === role);
    return option?.color || 'gray';
  };

  const handlePermissionToggle = (key: string, isAdd: boolean) => {
    if (isAdd) {
      setAddFormData({
        ...addFormData,
        permissions: {
          ...addFormData.permissions,
          [key]: !addFormData.permissions[key],
        },
      });
    } else {
      setEditFormData({
        ...editFormData,
        permissions: {
          ...editFormData.permissions,
          [key]: !editFormData.permissions[key],
        },
      });
    }
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
              <Users className="text-yellow-500" size={24} />
              <h1 className="text-xl font-bold">Staff Management</h1>
            </div>
          </div>
          <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
            <Plus size={16} /> Add Staff
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['active', 'all', 'inactive'].map((f) => (
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.length === 0 ? (
            <Card className="col-span-full p-8 text-center text-gray-500">
              <Users size={48} className="mx-auto mb-4 text-gray-400" />
              <p>No {filter !== 'all' ? filter : ''} staff members found</p>
              <Button onClick={() => setShowAddModal(true)} className="mt-4">
                Add Your First Staff Member
              </Button>
            </Card>
          ) : (
            staff.map((member) => (
              <Card key={member.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-bold text-lg">
                        {member.profiles?.first_name} {member.profiles?.last_name}
                      </div>
                      <div className="text-sm text-gray-500">{member.profiles?.email}</div>
                      <div className={`inline-flex items-center gap-1 mt-2 px-2 py-1 rounded text-xs font-medium bg-${getRoleColor(member.role)}-100 text-${getRoleColor(member.role)}-700`}>
                        <Shield size={12} />
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleToggleActive(member)}
                        className={`p-2 rounded ${
                          member.is_active
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        <Power size={14} />
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-2 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleRemoveStaff(member)}
                        className="p-2 rounded bg-red-100 text-red-600 hover:bg-red-200"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-semibold">
                        {member.is_active ? (
                          <span className="text-green-600">Active</span>
                        ) : (
                          <span className="text-gray-600">Inactive</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Phone</div>
                      <div className="font-semibold">{member.profiles?.phone || 'N/A'}</div>
                    </div>
                  </div>

                  {member.permissions && Object.keys(member.permissions).length > 0 && (
                    <div className="text-xs">
                      <div className="text-gray-500 mb-1">Permissions:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(member.permissions)
                          .filter(([_, value]) => value)
                          .slice(0, 3)
                          .map(([key]) => (
                            <span
                              key={key}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs"
                            >
                              {key.replace(/_/g, ' ')}
                            </span>
                          ))}
                        {Object.entries(member.permissions).filter(([_, value]) => value).length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                            +{Object.entries(member.permissions).filter(([_, value]) => value).length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={() => handleViewPerformance(member)}
                    variant="secondary"
                    size="sm"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Activity size={14} />
                    View Performance
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {showAddModal && (
        <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Staff Member">
          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={addFormData.email}
              onChange={(e) => setAddFormData({ ...addFormData, email: e.target.value })}
              placeholder="staff@example.com"
            />

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setAddFormData({ ...addFormData, role: role.value })}
                    className={`p-3 rounded border-2 transition ${
                      addFormData.role === role.value
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!addFormData.permissions[perm.key]}
                      onChange={() => handlePermissionToggle(perm.key, true)}
                      className="rounded"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddStaff} disabled={processing || !addFormData.email} className="flex-1">
                {processing ? 'Adding...' : 'Add Staff Member'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAddModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showEditModal && selectedMember && (
        <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Staff Member">
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium">
                {selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}
              </div>
              <div className="text-sm text-gray-500">{selectedMember.profiles?.email}</div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Role</label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role.value}
                    onClick={() => setEditFormData({ ...editFormData, role: role.value })}
                    className={`p-3 rounded border-2 transition ${
                      editFormData.role === role.value
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{role.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Permissions</label>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                {PERMISSION_OPTIONS.map((perm) => (
                  <label key={perm.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={!!editFormData.permissions[perm.key]}
                      onChange={() => handlePermissionToggle(perm.key, false)}
                      className="rounded"
                    />
                    <span className="text-sm">{perm.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleUpdateStaff} disabled={processing} className="flex-1">
                {processing ? 'Updating...' : 'Update Staff Member'}
              </Button>
              <Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={processing}>
                Cancel
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {showPerformanceModal && selectedMember && (
        <Modal
          isOpen={showPerformanceModal}
          onClose={() => {
            setShowPerformanceModal(false);
            setSelectedMember(null);
            setPerformance(null);
          }}
          title="Staff Performance"
        >
          <div className="space-y-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="font-medium">
                {selectedMember.profiles?.first_name} {selectedMember.profiles?.last_name}
              </div>
              <div className="text-sm text-gray-500">{selectedMember.role}</div>
            </div>

            {performance ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <div className="text-xs text-blue-600 dark:text-blue-400">Total Sales</div>
                    <div className="text-2xl font-bold">{performance.total_sales || 0}</div>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded">
                    <div className="text-xs text-green-600 dark:text-green-400">Revenue</div>
                    <div className="text-2xl font-bold">{performance.total_revenue?.toFixed(2) || '0.00'}</div>
                  </div>
                </div>
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">Average Order Value</div>
                  <div className="text-2xl font-bold">{performance.avg_order_value?.toFixed(2) || '0.00'} LYD</div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Activity size={48} className="mx-auto mb-4 text-gray-400" />
                <p>Performance data will be available after database RPC functions are created</p>
              </div>
            )}

            <Button variant="secondary" onClick={() => setShowPerformanceModal(false)} className="w-full">
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};
