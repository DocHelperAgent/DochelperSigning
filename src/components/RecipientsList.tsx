import React from 'react';
import { UserPlus, X, Mail, Check, AlertCircle } from 'lucide-react';

export interface Recipient {
  id: string;
  email: string;
  status: 'pending' | 'signed' | 'declined';
  signaturePosition?: { x: number; y: number };
}

interface RecipientsListProps {
  recipients: Recipient[];
  onAddRecipient: (email: string) => void;
  onRemoveRecipient: (id: string) => void;
}

const RecipientsList: React.FC<RecipientsListProps> = ({
  recipients,
  onAddRecipient,
  onRemoveRecipient,
}) => {
  const [newEmail, setNewEmail] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic email validation
    if (!newEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check for duplicate email
    if (recipients.some(r => r.email.toLowerCase() === newEmail.toLowerCase())) {
      setError('This email has already been added');
      return;
    }

    setError(null);
    onAddRecipient(newEmail);
    setNewEmail('');
  };

  const getStatusIcon = (status: Recipient['status']) => {
    switch (status) {
      case 'signed':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'declined':
        return <X className="w-4 h-4 text-red-500" />;
      default:
        return <Mail className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusText = (status: Recipient['status']) => {
    switch (status) {
      case 'signed':
        return 'Signed';
      case 'declined':
        return 'Declined';
      default:
        return 'Pending';
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Add Co-signer
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="email"
              name="email"
              id="email"
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError(null);
              }}
              className="block w-full rounded-l-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white sm:text-sm"
              placeholder="Enter email address"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          </div>
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      </form>

      <div className="space-y-2">
        {recipients.map((recipient) => (
          <div
            key={recipient.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getStatusIcon(recipient.status)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {recipient.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {getStatusText(recipient.status)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemoveRecipient(recipient.id)}
              className="p-1 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecipientsList;