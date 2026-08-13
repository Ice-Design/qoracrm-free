import { useState, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import { ColorPickerInput } from '../../ui/ColorPickerInput';
import ExtensionSlot from '../../common/ExtensionSlot';
import { ProBanner } from '../../common/ProBadge';

function ItemRow({ item, onUpdate, t, type, index, total }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(item.label);
  const [editColor, setEditColor] = useState(item.color);
  const [isConverted, setIsConverted] = useState(item.is_converted || false);

  useEffect(() => {
    setEditLabel(item.label);
    setEditColor(item.color);
    setIsConverted(item.is_converted || false);
  }, [item.label, item.color, item.is_converted]);

  const handleSave = () => {
    if (editLabel.trim() && (editLabel.trim() !== item.label || editColor !== item.color || isConverted !== (item.is_converted || false))) {
      onUpdate(item.id, editLabel.trim(), editColor, isConverted);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(item.label);
    setEditColor(item.color);
    setIsConverted(item.is_converted || false);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl shadow-sm">
        <div className="flex items-center gap-4 flex-1">
          <ColorPickerInput color={editColor} onChange={setEditColor} />
          <input
            autoFocus
            type="text"
            value={editLabel}
            onChange={e => setEditLabel(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') handleCancel();
            }}
            className="border border-blue-300 rounded-lg px-3 py-1.5 text-sm font-semibold text-gray-800 outline-none min-w-[200px] bg-white focus:ring-2 focus:ring-primary/20"
          />
          {type === 'statuses' && (
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer pl-2">
              <input
                type="checkbox"
                checked={isConverted}
                onChange={e => setIsConverted(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
              />
              {t('is_converted') || 'Is Converted'}
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleSave} className="text-green-600 hover:bg-green-100 p-2 rounded-md transition-colors" title={t('save') || "Save"}>
            ✓
          </button>
          <button onClick={handleCancel} className="text-red-500 hover:bg-red-100 p-2 rounded-md transition-colors" title={t('cancel') || "Cancel"}>
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between bg-white border border-gray-200 p-3 rounded-xl shadow-sm group hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4">
        <span
          className="px-3 py-1 rounded-md text-xs font-bold text-white shadow-sm cursor-pointer hover:scale-105 transition-transform"
          style={{ backgroundColor: item.color }}
          onClick={() => setIsEditing(true)}
          title={t('click_to_edit') || "Click to edit"}
        >
          {item.label}
        </span>
        <span className="text-xs text-gray-400 font-mono bg-gray-50 px-2 py-0.5 rounded border border-gray-100">ID: {item.id}</span>
        {type === 'statuses' && item.is_converted && (
          <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded shadow-sm">{t('is_converted') || 'Converted'}</span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <ExtensionSlot name="ItemRowReorder" index={index} total={total} type={type} />
        <ExtensionSlot
          name="ItemRowActions"
          item={item}
          type={type}
          index={index}
          onEdit={() => setIsEditing(true)}
          fallback={
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-primary hover:bg-blue-50 p-2 rounded-md transition-colors cursor-pointer"
              title={t('edit') || "Edit"}
            >
              <Edit2 size={16} />
            </button>
          }
        />
      </div>
    </div>
  );
}

export function TagsStatusesTab({ type = 'tags', showToast }) {
  const { t } = useI18n();
  const { tags, statuses, setTags, setStatuses, saveSettings } = useSettingsStore();

  const items = type === 'tags' ? tags : statuses;

  const handleUpdateItem = async (id, newLabel, newColor, isConverted) => {
    if (type === 'tags') {
      setTags(tags.map(tag => tag.id === id ? { ...tag, label: newLabel, color: newColor } : tag));
    } else {
      setStatuses(statuses.map(s => s.id === id ? { ...s, label: newLabel, color: newColor, is_converted: isConverted } : s));
    }
    await saveSettings();
    showToast(type === 'tags' ? (t('tag_updated') || 'Tag updated!') : (t('status_updated') || 'Status updated!'), 'success');
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
        {type === 'tags' ? t('tab_tags') : t('tab_statuses')}
      </h2>
      <div className="space-y-3 mb-8">
        {items.map((item, index) => {
          return (
            <ItemRow
              key={item.id}
              item={item}
              index={index}
              total={items.length}
              onUpdate={handleUpdateItem}
              t={t}
              type={type}
            />
          );
        })}
      </div>

      <ExtensionSlot
        name="TagsStatusesAddForm"
        type={type}
        showToast={showToast}
        fallback={
          <ProBanner
            feature="manage_statuses_tags"
            label={type === 'tags' ? (t('tab_tags') || 'Tags') : (t('tab_statuses') || 'Statuses')}
          />
        }
      />
    </div>
  );
}
