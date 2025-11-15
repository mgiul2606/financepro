// src/pages/ComponentsDemo.tsx
import { useState } from 'react';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { FormField, TextareaField, SelectField } from '../components/ui/FormField';
import { Alert, ToastAlert, BannerAlert, InlineAlert } from '../components/ui/Alert';
import { EntityCard, EntityCardGrid, EntityCardList } from '../components/ui/EntityCard';
import { useConfirm, useDeleteConfirm, useDiscardConfirm, useSaveConfirm } from '../hooks/useConfirm';
import { useCrud } from '../hooks/useCrud';
import { 
  User, 
  Mail, 
  Lock, 
  CreditCard, 
  AlertTriangle,
  CheckCircle,
  Info,
  X
} from 'lucide-react';

// Demo data
interface DemoItem {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'pending' | 'inactive';
  value: number;
}

const demoItems: DemoItem[] = [
  { id: 1, name: 'Item 1', description: 'Description for item 1', status: 'active', value: 100 },
  { id: 2, name: 'Item 2', description: 'Description for item 2', status: 'pending', value: 200 },
  { id: 3, name: 'Item 3', description: 'Description for item 3', status: 'inactive', value: 300 },
];

export const ComponentsDemo = () => {
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | 'xl'>('md');
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    description: '',
    category: '',
    acceptTerms: false,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  
  // Alert states
  const [showToast, setShowToast] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [alertVariant, setAlertVariant] = useState<'info' | 'success' | 'warning' | 'error'>('info');
  
  // Confirm hooks
  const confirm = useConfirm();
  const deleteConfirm = useDeleteConfirm();
  const discardConfirm = useDiscardConfirm();
  const saveConfirm = useSaveConfirm();
  
  // CRUD demo
  const [crudState, crudActions] = useCrud<DemoItem>({
    service: {
      list: async () => demoItems,
      create: async (data) => ({ ...data, id: Date.now() } as DemoItem),
      update: async (id, data) => ({ ...demoItems.find(i => i.id === id), ...data } as DemoItem),
      delete: async (id) => {},
    },
    initialItems: demoItems,
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleConfirmExamples = async () => {
    // Basic confirm
    const result1 = await confirm({
      title: 'Confirm Action',
      message: 'Are you sure you want to proceed?',
      variant: 'info',
    });
    console.log('Basic confirm:', result1);

    // Delete confirm
    const result2 = await deleteConfirm('Demo Item');
    console.log('Delete confirm:', result2);

    // Discard confirm
    const result3 = await discardConfirm();
    console.log('Discard confirm:', result3);

    // Save confirm
    const result4 = await saveConfirm('Would you like to save your progress?');
    console.log('Save confirm:', result4);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Banner Alert */}
      {showBanner && (
        <BannerAlert
          variant="info"
          title="Components Demo"
          closable
          onClose={() => setShowBanner(false)}
          action={{
            label: 'Learn More',
            onClick: () => alert('Learn more clicked!')
          }}
        >
          This page demonstrates all the reusable components available in the system.
        </BannerAlert>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Components Demo</h1>

        {/* Modals Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Modals</h2>
          <div className="flex gap-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map(size => (
              <button
                key={size}
                onClick={() => {
                  setModalSize(size);
                  setShowModal(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Open {size.toUpperCase()} Modal
              </button>
            ))}
          </div>
        </section>

        {/* Forms Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Form Fields</h2>
          <form onSubmit={handleFormSubmit} className="space-y-4 max-w-2xl">
            <FormField
              label="Name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              icon={<User className="h-5 w-5 text-gray-400" />}
              validation={{
                required: true,
                minLength: 2,
                maxLength: 50,
              }}
              onValidationChange={(isValid, errors) => {
                setFieldErrors(prev => ({ ...prev, name: errors }));
              }}
              showValidation
            />

            <FormField
              label="Email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              icon={<Mail className="h-5 w-5 text-gray-400" />}
              validation={{
                required: true,
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Please enter a valid email address'
                }
              }}
              onValidationChange={(isValid, errors) => {
                setFieldErrors(prev => ({ ...prev, email: errors }));
              }}
              showValidation
            />

            <FormField
              label="Password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter password"
              icon={<Lock className="h-5 w-5 text-gray-400" />}
              validation={{
                required: true,
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                custom: [
                  {
                    validate: (value) => /[A-Z]/.test(value),
                    message: 'Password must contain at least one uppercase letter'
                  },
                  {
                    validate: (value) => /[0-9]/.test(value),
                    message: 'Password must contain at least one number'
                  }
                ]
              }}
              onValidationChange={(isValid, errors) => {
                setFieldErrors(prev => ({ ...prev, password: errors }));
              }}
              showValidation
            />

            <TextareaField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tell us more..."
              rows={4}
              validation={{
                maxLength: 500,
              }}
              hint="Maximum 500 characters"
            />

            <SelectField
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              options={[
                { value: '', label: 'Select a category' },
                { value: 'personal', label: 'Personal' },
                { value: 'business', label: 'Business' },
                { value: 'other', label: 'Other' },
              ]}
              validation={{
                required: true,
              }}
            />

            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Submit Form
            </button>
          </form>
        </section>

        {/* Alerts Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Alerts</h2>
          <div className="space-y-4">
            {(['info', 'success', 'warning', 'error', 'default'] as const).map(variant => (
              <Alert
                key={variant}
                variant={variant}
                title={`${variant.charAt(0).toUpperCase()}${variant.slice(1)} Alert`}
                closable
                action={variant === 'info' ? {
                  label: 'Take Action',
                  onClick: () => alert('Action clicked!')
                } : undefined}
              >
                This is a {variant} alert message with closable option and optional action.
              </Alert>
            ))}
            
            <div className="pt-4">
              <h3 className="text-lg font-medium mb-2">Inline Alerts</h3>
              <InlineAlert variant="error">This is an inline error message</InlineAlert>
              <InlineAlert variant="success">This is an inline success message</InlineAlert>
            </div>
            
            <button
              onClick={() => {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
              }}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Show Toast Alert
            </button>
          </div>
        </section>

        {/* Entity Cards Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Entity Cards</h2>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Grid Layout</h3>
            <EntityCardGrid columns={3}>
              {crudState.items.map(item => (
                <EntityCard
                  key={item.id}
                  title={item.name}
                  description={item.description}
                  headerIcon={<CreditCard className="h-5 w-5" />}
                  status={{
                    label: item.status.charAt(0).toUpperCase() + item.status.slice(1),
                    variant: item.status === 'active' ? 'success' : item.status === 'pending' ? 'warning' : 'error'
                  }}
                  badge={{
                    label: `$${item.value}`,
                    variant: 'primary'
                  }}
                  metadata={[
                    { label: 'ID', value: `#${item.id}` },
                    { label: 'Value', value: `$${item.value}`, highlight: true },
                  ]}
                  actions={{
                    onEdit: () => alert(`Edit ${item.name}`),
                    onDelete: async () => {
                      const confirmed = await deleteConfirm(item.name);
                      if (confirmed) {
                        crudActions.removeItem(item.id);
                      }
                    },
                  }}
                />
              ))}
            </EntityCardGrid>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-3">List Layout</h3>
            <EntityCardList>
              {crudState.items.slice(0, 2).map(item => (
                <EntityCard
                  key={item.id}
                  title={item.name}
                  description={item.description}
                  variant="compact"
                  metadata={[
                    { label: 'Status', value: item.status },
                    { label: 'Value', value: `$${item.value}` },
                  ]}
                  actions={{
                    onEdit: () => alert(`Edit ${item.name}`),
                    onDelete: () => alert(`Delete ${item.name}`),
                  }}
                />
              ))}
            </EntityCardList>
          </div>
        </section>

        {/* Confirm Dialogs Section */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Confirm Dialogs</h2>
          <button
            onClick={handleConfirmExamples}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Test All Confirm Dialogs
          </button>
        </section>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={`${modalSize.toUpperCase()} Modal Example`}
        size={modalSize}
        footer={
          <ModalFooter>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Confirm
            </button>
          </ModalFooter>
        }
      >
        <p>This is a {modalSize} modal with customizable size and footer actions.</p>
        <p className="mt-2 text-gray-600">
          You can add any content here, including forms, lists, or other components.
        </p>
      </Modal>

      {/* Toast Alert */}
      {showToast && (
        <ToastAlert
          variant="success"
          title="Success!"
          onClose={() => setShowToast(false)}
          position="top-right"
        >
          Form submitted successfully!
        </ToastAlert>
      )}
    </div>
  );
};
