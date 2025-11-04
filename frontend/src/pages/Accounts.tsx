// src/pages/Accounts.tsx - Aggiungi state e handler
import { useState, useEffect } from 'react';
import { accountService } from '../services/accountService';
import type { Account } from '../services/accountService';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { CreateAccountModal } from '../components/CreateAccountModal';
import { EditAccountModal } from '../components/EditAccountModal';  // ← Import

export const Accounts = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);  // ← Nuovo state

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await accountService.list();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this account?')) return;
    
    try {
      await accountService.delete(id);
      setAccounts(accounts.filter(a => a.id !== id));
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account');
    }
  };

  // ← Nuovo handler
  const handleUpdate = (updated: Account) => {
    setAccounts(accounts.map(a => a.id === updated.id ? updated : a));
    setEditingAccount(null);
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Accounts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusCircle size={20} />
          New Account
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600 mb-4">No accounts yet</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            Create your first account
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <div key={account.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">{account.name}</h3>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setEditingAccount(account)} 
                    className="text-gray-600 hover:text-blue-600"
                  >
                    <Edit size={18} />
                  </button>
                  <button 
                    onClick={() => handleDelete(account.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Current Balance</p>
                  <p className="text-2xl font-bold text-green-600">
                    {account.currency} {account.current_balance.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Initial Balance</p>
                  <p className="text-gray-900">
                    {account.currency} {account.initial_balance.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(account) => {
            setAccounts([account, ...accounts]);
            setShowCreateModal(false);
          }}
        />
      )}

      {editingAccount && (
        <EditAccountModal
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onUpdated={handleUpdate}
        />
      )}
    </div>
  );
};