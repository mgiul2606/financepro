// src/components/showcase/ComponentsShowcase.tsx
import { useState } from 'react';
import { Modal, ModalFooter } from '../ui/Modal';
import { FormField, TextareaField, SelectField } from '../ui/FormField';
import { Alert, ToastAlert, BannerAlert, InlineAlert } from '../ui/Alert';
import { EntityCard, EntityCardGrid, EntityCardList } from '../ui/EntityCard';
import { useConfirm, useDeleteConfirm, useDiscardConfirm, useSaveConfirm, ConfirmProvider } from '../../hooks/useConfirm';
import { useCrud } from '../../hooks/useCrud';
import { 
  Wallet, 
  CreditCard, 
  DollarSign, 
  Copy,
  Share2} from 'lucide-react';

// Mock data for demonstration
interface MockEntity {
  id: number;
  name: string;
  amount: number;
  status: 'active' | 'pending' | 'inactive';
  created_at: string;
}

const mockService = {
  list: async (): Promise<MockEntity[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([
          { id: 1, name: 'Entity 1', amount: 1000, status: 'active', created_at: '2024-01-01' },
          { id: 2, name: 'Entity 2', amount: 2000, status: 'pending', created_at: '2024-01-02' },
          { id: 3, name: 'Entity 3', amount: 3000, status: 'inactive', created_at: '2024-01-03' },
        ]);
      }, 1000);
    });
  },
  create: async (data: Partial<MockEntity>): Promise<MockEntity> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ 
          ...data, 
          id: Date.now(), 
          created_at: new Date().toISOString() 
        } as MockEntity);
      }, 500);
    });
  },
  update: async (id: number, data: Partial<MockEntity>): Promise<MockEntity> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ ...data, id, created_at: new Date().toISOString() } as MockEntity);
      }, 500);
    });
  },
  delete: async (id: number): Promise<void> => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  }
};

const ComponentsShowcaseContent = () => {
  // State for demonstrations
  const [showModal, setShowModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    amount: 0,
    description: '',
    category: '',
    password: ''
  });

  // Hooks demonstrations
  const confirm = useConfirm();
  const deleteConfirm = useDeleteConfirm();
  const discardConfirm = useDiscardConfirm();
  const saveConfirm = useSaveConfirm();

  const [crudState, crudActions] = useCrud<MockEntity>({
    service: mockService,
    autoLoad: true
  });

  // Alert examples
  const alertExamples = [
    { id: 1, variant: 'info' as const, title: 'Information', message: 'This is an info alert' },
    { id: 2, variant: 'success' as const, title: 'Success', message: 'Operation completed successfully' },
    { id: 3, variant: 'warning' as const, title: 'Warning', message: 'Please review before proceeding' },
    { id: 4, variant: 'error' as const, title: 'Error', message: 'Something went wrong' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">FinancePro UI Components Showcase</h1>
        <p className="text-gray-600">Demonstration of all reusable components and hooks</p>
      </div>

      {/* Modals Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Modals</h2>
        <div className="space-y-4">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Open Modal Demo
          </button>

          <Modal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            title="Example Modal"
            size="md"
            footer={
              <ModalFooter>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Confirm
                </button>
              </ModalFooter>
            }
          >
            <p>This is a modal content example with footer actions.</p>
          </Modal>
        </div>
      </section>

      {/* Form Fields Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Form Fields</h2>
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <FormField
            label="Account Name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter account name"
            icon={<Wallet className="h-5 w-5 text-gray-400" />}
            validation={{
              required: true,
              minLength: 2,
              maxLength: 50
            }}
            showValidation
            hint="This field has validation"
          />

          <FormField
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            validation={{
              required: true,
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            }}
            showValidation
          />

          <FormField
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            validation={{
              required: true,
              minLength: { value: 8, message: 'Password must be at least 8 characters' }
            }}
            showValidation
          />

          <FormField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            icon={<DollarSign className="h-5 w-5 text-gray-400" />}
            validation={{
              min: 0,
              max: 1000000
            }}
          />

          <TextareaField
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description..."
            rows={3}
            validation={{
              maxLength: 500
            }}
            hint="Maximum 500 characters"
          />

          <SelectField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            options={[
              { value: 'income', label: 'Income' },
              { value: 'expense', label: 'Expense' },
              { value: 'transfer', label: 'Transfer' },
            ]}
            placeholder="Select a category"
            required
          />
        </div>
      </section>

      {/* Alerts Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Standard Alerts</h3>
            <div className="space-y-3">
              {alertExamples.map((alert) => (
                <Alert
                  key={alert.id}
                  variant={alert.variant}
                  title={alert.title}
                  closable
                  action={{
                    label: 'Learn more',
                    onClick: () => console.log('Action clicked')
                  }}
                >
                  {alert.message}
                </Alert>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Banner Alert</h3>
            <BannerAlert
              variant="info"
              title="System Maintenance"
              action={{
                label: 'View Details',
                onClick: () => console.log('View details')
              }}
            >
              Scheduled maintenance on Sunday, 2:00 AM - 4:00 AM
            </BannerAlert>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Inline Alerts</h3>
            <div className="space-y-2">
              <InlineAlert variant="error">
                Password must be at least 8 characters
              </InlineAlert>
              <InlineAlert variant="success">
                Email verified successfully
              </InlineAlert>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">Toast Alert</h3>
            <button
              onClick={() => setShowToast(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Show Toast Notification
            </button>
            {showToast && (
              <ToastAlert
                variant="success"
                title="Success"
                onClose={() => setShowToast(false)}
                autoClose={5000}
              >
                Your changes have been saved successfully
              </ToastAlert>
            )}
          </div>
        </div>
      </section>

      {/* Entity Cards Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Entity Cards</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-3">Grid Layout</h3>
            <EntityCardGrid columns={3}>
              {crudState.items.map((entity) => (
                <EntityCard
                  key={entity.id}
                  title={entity.name}
                  subtitle={`ID: ${entity.id}`}
                  description="This is a sample entity card with various features"
                  headerIcon={<CreditCard className="h-5 w-5" />}
                  status={{
                    label: entity.status,
                    variant: entity.status === 'active' ? 'success' : 
                            entity.status === 'pending' ? 'warning' : 'error'
                  }}
                  badge={{
                    label: 'Premium',
                    variant: 'primary'
                  }}
                  metadata={[
                    {
                      label: 'Amount',
                      value: `$${entity.amount.toFixed(2)}`,
                      highlight: true
                    },
                    {
                      label: 'Created',
                      value: new Date(entity.created_at).toLocaleDateString()
                    }
                  ]}
                  actions={{
                    onEdit: () => console.log('Edit', entity),
                    onDelete: async () => {
                      const confirmed = await deleteConfirm(entity.name);
                      if (confirmed) {
                        await crudActions.delete(entity.id);
                      }
                    },
                    customActions: [
                      {
                        label: 'Copy',
                        icon: <Copy size={16} />,
                        onClick: () => console.log('Copy', entity)
                      },
                      {
                        label: 'Share',
                        icon: <Share2 size={16} />,
                        onClick: () => console.log('Share', entity)
                      }
                    ],
                    showMoreMenu: true
                  }}
                />
              ))}
            </EntityCardGrid>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">List Layout (Compact)</h3>
            <EntityCardList>
              {crudState.items.slice(0, 2).map((entity) => (
                <EntityCard
                  key={entity.id}
                  title={entity.name}
                  subtitle={`Amount: $${entity.amount}`}
                  variant="compact"
                  metadata={[
                    {
                      label: 'Status',
                      value: entity.status,
                      className: entity.status === 'active' ? 'text-green-600' : 'text-gray-600'
                    }
                  ]}
                  actions={{
                    onEdit: () => console.log('Edit', entity),
                    onDelete: () => console.log('Delete', entity),
                  }}
                />
              ))}
            </EntityCardList>
          </div>
        </div>
      </section>

      {/* Confirmation Dialogs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Confirmation Dialogs</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={async () => {
              const confirmed = await confirm({
                title: 'Custom Confirmation',
                message: 'Are you sure you want to proceed with this action?',
                confirmText: 'Yes, Proceed',
                cancelText: 'No, Cancel',
                variant: 'info'
              });
              console.log('Confirmed:', confirmed);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Custom Confirm
          </button>

          <button
            onClick={async () => {
              const confirmed = await deleteConfirm('this item');
              console.log('Delete confirmed:', confirmed);
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Confirm
          </button>

          <button
            onClick={async () => {
              const confirmed = await discardConfirm();
              console.log('Discard confirmed:', confirmed);
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Discard Confirm
          </button>

          <button
            onClick={async () => {
              const confirmed = await saveConfirm('Save your progress?');
              console.log('Save confirmed:', confirmed);
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save Confirm
          </button>
        </div>
      </section>

      {/* CRUD Hook Demo Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">CRUD Hook Demo</h2>
        <div className="bg-white rounded-lg border p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              State: {crudState.loading ? 'Loading...' : 
                     crudState.creating ? 'Creating...' :
                     crudState.updating ? 'Updating...' :
                     crudState.deleting ? 'Deleting...' : 'Ready'}
            </p>
            {crudState.error && (
              <Alert variant="error" closable onClose={crudActions.clearError}>
                {crudState.error}
              </Alert>
            )}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => crudActions.load()}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              disabled={crudState.loading}
            >
              Reload Data
            </button>
            
            <button
              onClick={async () => {
                await crudActions.create({
                  name: `New Entity ${Date.now()}`,
                  amount: Math.random() * 1000,
                  status: 'active'
                });
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              disabled={crudState.creating}
            >
              Create Item
            </button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Items count: {crudState.items.length}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export const ComponentsShowcase = () => (
  <ConfirmProvider>
    <ComponentsShowcaseContent />
  </ConfirmProvider>
);
