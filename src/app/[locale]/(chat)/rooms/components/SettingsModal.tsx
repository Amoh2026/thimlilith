'use client';

import React, { useState, useEffect } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDoc: any;
  onSave: (data: any) => Promise<void>;
}

export default function SettingsModal({ isOpen, onClose, userDoc, onSave }: SettingsModalProps) {
  const [privacy, setPrivacy] = useState<string>('public');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (userDoc?.privacySearch) {
      setPrivacy(userDoc.privacySearch);
    } else {
      setPrivacy('public');
    }
  }, [userDoc, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setSaving(true);
    await onSave({ privacySearch: privacy });
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="w-full max-w-md mx-4 rounded-2xl bg-[#1e293b] border border-white/10 p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl">✕</button>
        
        <h2 className="text-2xl font-bold text-white mb-6">⚙️ Privacy Settings</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Who can find me in Search?
            </label>
            <select 
              value={privacy} 
              onChange={(e) => setPrivacy(e.target.value)}
              className="w-full bg-[#0f172a] text-white border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-teal-500"
            >
              <option value="public">🌍 Public (Everyone can find me)</option>
              <option value="private">🔒 Private (Hide me from user search)</option>
            </select>
            <p className="text-xs text-gray-500 mt-2">
              If set to Private, people can still message you if they already know your email or share a room with you.
            </p>
          </div>

          <div className="border-t border-slate-700 my-4 pt-4">
            <button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold transition disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
