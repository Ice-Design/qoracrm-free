import { useState } from 'react';
import {
  X, Save, Eye, Smartphone, Monitor, Plus, Trash2,
  MoveUp, MoveDown, Type, Image, Link, Layout,
  Share2, Minus, Sparkles, Send, Loader2
} from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

const BLOCK_TYPES = [
  { type: 'header',  label: 'Header / Title',  icon: <Type size={15}/>,    defaultContent: { text: 'Welcome to Our Service!', level: 'h1', align: 'center', color: '#111827' } },
  { type: 'text',    label: 'Paragraph Text',  icon: <Layout size={15}/>,  defaultContent: { text: 'Hi {lead.name},\n\nThank you for reaching out to us. We have received your request and will contact you shortly.', align: 'left', color: '#374151' } },
  { type: 'button',  label: 'Call to Action',  icon: <Link size={15}/>,    defaultContent: { text: 'View Details', url: '{site.url}', bgColor: '#6366f1', textColor: '#ffffff', align: 'center', radius: 8 } },
  { type: 'image',   label: 'Image Banner',    icon: <Image size={15}/>,   defaultContent: { url: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&auto=format&fit=crop', alt: 'Banner', width: '100%' } },
  { type: 'divider', label: 'Divider Line',    icon: <Minus size={15}/>,   defaultContent: { color: '#e5e7eb', thickness: 1 } },
  { type: 'social',  label: 'Social Links',    icon: <Share2 size={15}/>,  defaultContent: { align: 'center', facebook: '#', instagram: '#', telegram: '#' } },
];

const TEMPLATE_VARS = [
  '{lead.name}', '{lead.email}', '{lead.phone}', '{lead.status}', '{form.title}', '{site.name}', '{site.url}', '{date}'
];

export function EmailTemplateEditor({ template, onSave, onClose }) {
  const { t } = useI18n();

  const [name, setName]               = useState(template?.name || 'New Email Template');
  const [subject, setSubject]         = useState(template?.subject || 'Thank you for your submission, {lead.name}!');
  const [viewMode, setViewMode]       = useState('desktop'); // 'desktop' | 'mobile'
  const [activeBlockIdx, setActiveBlockIdx] = useState(0);
  const [isSendingTest, setIsSendingTest]   = useState(false);
  const [testEmail, setTestEmail]           = useState('');
  const [testStatus, setTestStatus]         = useState(null);

  // Initialize blocks from JSON design or default blocks
  const [blocks, setBlocks] = useState(() => {
    if (template?.json_design) {
      try {
        const parsed = typeof template.json_design === 'string' ? JSON.parse(template.json_design) : template.json_design;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* fallback */ }
    }
    return [
      { id: 'b_1', type: 'header', content: { text: 'Hello, {lead.name}!', level: 'h1', align: 'center', color: '#111827' } },
      { id: 'b_2', type: 'text',   content: { text: 'We received your inquiry from form #{form.id}. Our team is reviewing it and will get in touch with you shortly.\n\nBest regards,\nThe {site.name} Team', align: 'left', color: '#374151' } },
      { id: 'b_3', type: 'button', content: { text: 'Visit Website', url: '{site.url}', bgColor: '#6366f1', textColor: '#ffffff', align: 'center', radius: 8 } },
      { id: 'b_4', type: 'divider', content: { color: '#e5e7eb', thickness: 1 } },
    ];
  });

  const addBlock = (type) => {
    const def = BLOCK_TYPES.find(b => b.type === type);
    if (!def) return;
    const newBlock = {
      id: 'b_' + Date.now(),
      type,
      content: { ...def.defaultContent },
    };
    setBlocks(prev => [...prev, newBlock]);
    setActiveBlockIdx(blocks.length);
  };

  const updateBlockContent = (idx, newContent) => {
    setBlocks(prev => prev.map((b, i) => i === idx ? { ...b, content: { ...b.content, ...newContent } } : b));
  };

  const deleteBlock = (idx) => {
    setBlocks(prev => prev.filter((_, i) => i !== idx));
    setActiveBlockIdx(null);
  };

  const moveBlock = (idx, dir) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    setBlocks(prev => {
      const arr = [...prev];
      const temp = arr[idx];
      arr[idx] = arr[targetIdx];
      arr[targetIdx] = temp;
      return arr;
    });
    setActiveBlockIdx(targetIdx);
  };

  // Generate HTML from blocks
  const generateHtml = () => {
    const innerHtml = blocks.map(b => {
      const { type, content } = b;
      switch (type) {
        case 'header':
          return `<h1 style="color:${content.color || '#111827'};text-align:${content.align || 'center'};font-family:sans-serif;margin:0 0 16px;font-size:24px;">${content.text || ''}</h1>`;
        case 'text':
          const formatted = (content.text || '').replace(/\n/g, '<br/>');
          return `<p style="color:${content.color || '#374151'};text-align:${content.align || 'left'};font-family:sans-serif;line-height:1.6;font-size:15px;margin:0 0 16px;">${formatted}</p>`;
        case 'button':
          return `<div style="text-align:${content.align || 'center'};margin:20px 0;"><a href="${content.url || '#'}" style="display:inline-block;padding:12px 28px;background-color:${content.bgColor || '#6366f1'};color:${content.textColor || '#ffffff'};text-decoration:none;border-radius:${content.radius || 8}px;font-weight:bold;font-family:sans-serif;font-size:15px;">${content.text || 'Button'}</a></div>`;
        case 'image':
          return `<div style="text-align:center;margin:16px 0;"><img src="${content.url || ''}" alt="${content.alt || ''}" style="max-width:100%;height:auto;border-radius:8px;display:inline-block;" /></div>`;
        case 'divider':
          return `<hr style="border:none;border-top:${content.thickness || 1}px solid ${content.color || '#e5e7eb'};margin:24px 0;" />`;
        case 'social':
          return `<div style="text-align:${content.align || 'center'};margin:16px 0;font-size:13px;color:#9ca3af;font-family:sans-serif;">Follow us on social media</div>`;
        default:
          return '';
      }
    }).join('\n');

    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head><body style="margin:0;padding:24px;background-color:#f3f4f6;font-family:sans-serif;"><div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">${innerHtml}</div></body></html>`;
  };

  const handleSave = () => {
    const html = generateHtml();
    onSave({
      id:          template?.id || ('tpl_' + Math.random().toString(36).substring(2, 10)),
      name:        name.trim(),
      subject:     subject.trim(),
      body:        html,
      json_design: blocks,
    });
    onClose();
  };

  const handleSendTest = async () => {
    if (!testEmail) return;
    setIsSendingTest(true);
    setTestStatus(null);
    try {
      await window.wp?.apiFetch?.({
        path: '/qoracrm/v1/settings/test-email',
        method: 'POST',
        data: {
          to:      testEmail,
          subject: '[Test] ' + subject,
          body:    generateHtml(),
        }
      });
      setTestStatus('sent');
    } catch {
      setTestStatus('error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const activeBlock = activeBlockIdx !== null ? blocks[activeBlockIdx] : null;

  return (
    <div className="fixed inset-0 z-[999999] flex bg-gray-900/60 backdrop-blur-sm">
      <div className="relative z-10 flex w-full h-full bg-[#f8fafc]">

        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div className="absolute top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 flex items-center justify-between px-5 z-20 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700">
              <X size={18} />
            </button>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="text-sm font-bold text-gray-800 bg-transparent border-b border-dashed border-gray-300 focus:border-indigo-500 focus:outline-none px-1 py-0.5"
              placeholder="Template Name"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1 mr-3">
              <button
                onClick={() => setViewMode('desktop')}
                className={`p-1.5 rounded text-xs font-semibold ${viewMode === 'desktop' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
              >
                <Monitor size={14} />
              </button>
              <button
                onClick={() => setViewMode('mobile')}
                className={`p-1.5 rounded text-xs font-semibold ${viewMode === 'mobile' ? 'bg-white shadow text-gray-800' : 'text-gray-400'}`}
              >
                <Smartphone size={14} />
              </button>
            </div>

            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-xs font-semibold shadow hover:opacity-90 transition-all"
            >
              <Save size={14} /> Save Template
            </button>
          </div>
        </div>

        {/* ── Left: Blocks Palette ───────────────────────────── */}
        <div className="w-64 bg-white border-r border-gray-200 pt-16 flex flex-col shrink-0 shadow-sm">
          <div className="p-4 border-b border-gray-100">
            <label className="block text-xs font-bold text-gray-500 mb-1">Subject Line</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Email subject..."
              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
            {/* Template tags */}
            <div className="flex flex-wrap gap-1 mt-2">
              {TEMPLATE_VARS.slice(0, 4).map(tag => (
                <button
                  key={tag}
                  onClick={() => setSubject(p => p + ' ' + tag)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 font-mono"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Add Blocks</p>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_TYPES.map(b => (
                <button
                  key={b.type}
                  onClick={() => addBlock(b.type)}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-gray-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all text-gray-700 hover:text-indigo-600 text-center gap-1.5 group"
                >
                  <span className="text-indigo-500 group-hover:scale-110 transition-transform">{b.icon}</span>
                  <span className="text-[11px] font-semibold">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Center: Visual Canvas ──────────────────────────── */}
        <div className="flex-1 pt-16 pb-6 overflow-y-auto flex justify-center items-start px-6 bg-[#f1f5f9]">
          <div
            className={`bg-white rounded-2xl shadow-xl border border-gray-200 p-8 min-h-[500px] my-6 transition-all ${
              viewMode === 'mobile' ? 'w-[360px]' : 'w-[580px]'
            }`}
          >
            {blocks.map((block, idx) => (
              <div
                key={block.id}
                onClick={() => setActiveBlockIdx(idx)}
                className={`relative group rounded-xl p-3 my-2 border-2 transition-all cursor-pointer ${
                  activeBlockIdx === idx
                    ? 'border-indigo-500 bg-indigo-50/20 shadow-sm'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                {/* Block Controls */}
                <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm z-10">
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                    <MoveUp size={11} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-700">
                    <MoveDown size={11} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); deleteBlock(idx); }} className="p-1 hover:bg-red-50 rounded text-red-400 hover:text-red-600">
                    <Trash2 size={11} />
                  </button>
                </div>

                {/* Block Render */}
                <BlockPreview block={block} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Block Settings ──────────────────────────── */}
        <div className="w-72 bg-white border-l border-gray-200 pt-16 flex flex-col shrink-0 shadow-sm">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">Block Properties</span>
            {activeBlock && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">{activeBlock.type}</span>}
          </div>

          <div className="p-4 flex-1 overflow-y-auto space-y-4">
            {activeBlock ? (
              <BlockSettingsPanel
                block={activeBlock}
                idx={activeBlockIdx}
                onChange={updateBlockContent}
              />
            ) : (
              <p className="text-xs text-gray-400 text-center py-12">Click a block on the canvas to edit its properties.</p>
            )}
          </div>

          {/* Test Email Section */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <p className="text-xs font-bold text-gray-700 mb-2">Send Test Email</p>
            <div className="flex gap-1.5">
              <input
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
              />
              <button
                onClick={handleSendTest}
                disabled={isSendingTest || !testEmail}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-white text-xs font-semibold hover:bg-black transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                {isSendingTest ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              </button>
            </div>
            {testStatus === 'sent' && <p className="text-[11px] text-emerald-600 mt-1.5 font-medium">✓ Test email sent!</p>}
            {testStatus === 'error' && <p className="text-[11px] text-red-500 mt-1.5 font-medium">Failed to send.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Preview Renderers ────────────────────────────────────────────────

function BlockPreview({ block }) {
  const { type, content } = block;
  switch (type) {
    case 'header':
      return <h1 style={{ color: content.color, textAlign: content.align }} className="text-2xl font-bold">{content.text}</h1>;
    case 'text':
      return <p style={{ color: content.color, textAlign: content.align }} className="text-sm leading-relaxed whitespace-pre-wrap">{content.text}</p>;
    case 'button':
      return (
        <div style={{ textAlign: content.align }}>
          <span style={{ backgroundColor: content.bgColor, color: content.textColor, borderRadius: content.radius }} className="inline-block px-6 py-2.5 text-sm font-semibold shadow-sm">
            {content.text}
          </span>
        </div>
      );
    case 'image':
      return <div className="text-center"><img src={content.url} alt={content.alt} className="max-w-full rounded-xl mx-auto max-h-48 object-cover" /></div>;
    case 'divider':
      return <hr style={{ borderColor: content.color, borderWidth: content.thickness }} className="my-2" />;
    case 'social':
      return <div style={{ textAlign: content.align }} className="text-xs text-gray-400 py-1">🌐 Social Links</div>;
    default:
      return null;
  }
}

// ── Block Settings Panels ────────────────────────────────────────────

function BlockSettingsPanel({ block, idx, onChange }) {
  const { type, content } = block;
  const set = (key, val) => onChange(idx, { [key]: val });

  return (
    <div className="space-y-3">
      {type === 'header' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Text</label>
            <input value={content.text || ''} onChange={e => set('text', e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Alignment</label>
            <select value={content.align || 'center'} onChange={e => set('align', e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Color</label>
            <input type="color" value={content.color || '#111827'} onChange={e => set('color', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
          </div>
        </>
      )}

      {type === 'text' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Paragraph Text</label>
            <textarea value={content.text || ''} onChange={e => set('text', e.target.value)} rows={6} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none resize-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Alignment</label>
            <select value={content.align || 'left'} onChange={e => set('align', e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50">
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </div>
        </>
      )}

      {type === 'button' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Button Label</label>
            <input value={content.text || ''} onChange={e => set('text', e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">URL / Link</label>
            <input value={content.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Button Color</label>
              <input type="color" value={content.bgColor || '#6366f1'} onChange={e => set('bgColor', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Text Color</label>
              <input type="color" value={content.textColor || '#ffffff'} onChange={e => set('textColor', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
            </div>
          </div>
        </>
      )}

      {type === 'image' && (
        <>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Image URL</label>
            <input value={content.url || ''} onChange={e => set('url', e.target.value)} placeholder="https://..." className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Alt Text</label>
            <input value={content.alt || ''} onChange={e => set('alt', e.target.value)} className="w-full text-xs border border-gray-200 rounded-lg p-2 bg-gray-50 focus:outline-none" />
          </div>
        </>
      )}

      {type === 'divider' && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Line Color</label>
          <input type="color" value={content.color || '#e5e7eb'} onChange={e => set('color', e.target.value)} className="w-full h-8 rounded-lg cursor-pointer border border-gray-200" />
        </div>
      )}
    </div>
  );
}
