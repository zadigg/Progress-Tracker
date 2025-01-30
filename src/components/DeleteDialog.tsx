import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { Question, Category } from '../types';

interface DeleteDialogProps {
  type: 'question' | 'category';
  item: Question | Category;
  affectedQuestions?: Question[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteDialog({ type, item, affectedQuestions, onConfirm, onCancel }: DeleteDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold">Confirm Deletion</h3>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          {type === 'category' ? (
            <>
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete the category <strong>{item.name}</strong>?
              </p>
              {affectedQuestions && affectedQuestions.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-700 font-medium mb-2">
                    Warning: This will also delete the following questions:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-red-600">
                    {affectedQuestions.map(question => (
                      <li key={question.id} className="text-sm">
                        {question.title}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete this question?
              </p>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-900">{item.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Added on {new Date(item.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}