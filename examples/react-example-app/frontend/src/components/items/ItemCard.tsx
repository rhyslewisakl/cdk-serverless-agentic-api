/**
 * ItemCard component for displaying individual user items
 */

import React from 'react';
import { UserItem } from '../../types/user-item';
import { ITEM_STATUSES, PRIORITY_LEVELS } from '../../utils/constants';

interface ItemCardProps {
  item: UserItem;
  onEdit?: (item: UserItem) => void;
  onDelete?: (item: UserItem) => void;
  onView?: (item: UserItem) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  onEdit,
  onDelete,
  onView,
}) => {
  const statusConfig = ITEM_STATUSES.find(s => s.value === item.status);
  const priorityConfig = item.metadata?.priority 
    ? PRIORITY_LEVELS.find(p => p.value === item.metadata!.priority)
    : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-blue-100 text-blue-800';
      case 2:
        return 'bg-yellow-100 text-yellow-800';
      case 3:
        return 'bg-orange-100 text-orange-800';
      case 4:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {item.title}
          </h3>
          <p className="text-sm text-gray-600">{item.category}</p>
        </div>
        <div className="flex space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
            {statusConfig?.label || item.status}
          </span>
          {priorityConfig && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(priorityConfig.value)}`}>
              {priorityConfig.label}
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-700 mb-4 line-clamp-3">
        {item.description}
      </p>

      {/* Tags */}
      {item.metadata?.tags && item.metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.metadata.tags.map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Due Date */}
      {item.metadata?.dueDate && (
        <div className="mb-4">
          <span className="text-sm text-gray-600">
            Due: {formatDate(item.metadata.dueDate)}
          </span>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <div>Created: {formatDate(item.createdAt)}</div>
          {item.updatedAt !== item.createdAt && (
            <div>Updated: {formatDate(item.updatedAt)}</div>
          )}
        </div>
        
        <div className="flex space-x-2">
          {onView && (
            <button
              onClick={() => onView(item)}
              className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors"
            >
              View
            </button>
          )}
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-md transition-colors"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="px-3 py-1 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};