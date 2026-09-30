import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  X, Maximize2, Minimize2, Eye, Code,
  Sparkles, Smartphone, Monitor, Bold, Italic,
  Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link2, Unlink, Minus, Check,
  Mail, Image as ImageIcon, Table as TableIcon, Plus, Trash2, ChevronDown,
  Rows
} from 'lucide-react';
import { useI18n } from '../../utils/I18nContext';

const TEMPLATE_VARS = [
  { label: 'Lead Name', tag: '{lead.name}' },
  { label: 'Lead Email', tag: '{lead.email}' },
  { label: 'Lead Phone', tag: '{lead.phone}' },
  { label: 'Lead Status', tag: '{lead.status}' },
  { label: 'Lead Data Table', tag: '{lead_data}' },
  { label: 'Form ID', tag: '{form_id}' },
  { label: 'Site Name', tag: '{site.name}' },
  { label: 'Site URL', tag: '{site.url}' },
  { label: 'Date', tag: '{date}' },
  { label: 'Time', tag: '{time}' },
];

export function EmailModalEditor({
  initialId = '',
  initialName = '',
  showNameField = false,
  initialSubject = '',
  initialBody = '',
  variables = TEMPLATE_VARS,
  onSave,
  onClose,
}) {
  const { t } = useI18n();

  const [name, setName] = useState(initialName);
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody || '<p></p>');
  const [activeTab, setActiveTab] = useState('visual'); // 'visual' | 'html' | 'preview'
  const [previewDevice, setPreviewDevice] = useState('desktop'); // 'desktop' | 'mobile'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);
  const [tableMenuOpen, setTableMenuOpen] = useState(false);

  const subjectInputRef = useRef(null);
  const nameInputRef = useRef(null);
  const subjectFocusedRef = useRef(false);
  const htmlTextareaRef = useRef(null);
  const tableMenuRef = useRef(null);

  // Close table menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (tableMenuRef.current && !tableMenuRef.current.contains(e.target)) {
        setTableMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize Tiptap
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline font-medium',
        },
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'max-w-full rounded-lg my-2 border border-gray-200',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'qoracrm-email-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialBody || '<p></p>',
    onUpdate: ({ editor: ed }) => {
      setBody(ed.getHTML());
    },
  });

  // Keep editor content in sync when switching back from HTML code view
  useEffect(() => {
    if (activeTab === 'visual' && editor) {
      if (editor.getHTML() !== body) {
        editor.commands.setContent(body || '<p></p>', false);
      }
    }
  }, [activeTab, editor, body]);

  const handleInsertVar = (tag) => {
    if (subjectFocusedRef.current) {
      setSubject((prev) => {
        const input = subjectInputRef.current;
        if (!input) return (prev || '') + tag;
        const start = input.selectionStart ?? prev.length;
        const end = input.selectionEnd ?? prev.length;
        const next = prev.substring(0, start) + tag + prev.substring(end);
        setTimeout(() => {
          input.focus();
          input.selectionStart = input.selectionEnd = start + tag.length;
        }, 0);
        return next;
      });
      return;
    }

    if (activeTab === 'visual' && editor) {
      editor.chain().focus().insertContent(tag + ' ').run();
    } else if (activeTab === 'html') {
      const textarea = htmlTextareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart || 0;
        const end = textarea.selectionEnd || 0;
        const next = (body || '').substring(0, start) + tag + (body || '').substring(end);
        setBody(next);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + tag.length;
          textarea.focus();
        }, 0);
      } else {
        setBody((prev) => (prev || '') + tag);
      }
    } else {
      setBody((prev) => (prev || '') + tag);
    }
  };

  const handleSetLink = () => {
    if (!editor) return;
    const prevUrl = editor.getAttributes('link').href || '';
    const url = window.prompt('Enter link URL (e.g. https://example.com or {site.url}):', prevUrl);
    if (url === null) return;
    if (url.trim() === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
  };

  const handleInsertImage = () => {
    if (window.wp && window.wp.media) {
      const mediaFrame = window.wp.media({
        title: t('select_or_upload_image') || 'Select or Upload Image',
        button: { text: t('insert_into_email') || 'Insert into email' },
        multiple: false,
        library: { type: 'image' },
      });
      mediaFrame.on('select', () => {
        const attachment = mediaFrame.state().get('selection').first().toJSON();
        if (attachment && attachment.url) {
          editor.chain().focus().setImage({
            src: attachment.url,
            alt: attachment.alt || attachment.title || '',
            title: attachment.title || '',
          }).run();
        }
      });
      mediaFrame.open();
      // Ensure WP media modal is layered above our modal dialog and remove WP backdrop
      setTimeout(() => {
        document.querySelectorAll('.media-modal-backdrop').forEach((el) => el.remove());
        document.querySelectorAll('.media-modal').forEach((el) => {
          el.style.zIndex = '10000000';
        });
      }, 0);
    } else {
      const url = window.prompt(t('enter_image_url') || 'Enter image URL:', 'https://');
      if (url && url.trim()) {
        editor.chain().focus().setImage({ src: url.trim() }).run();
      }
    }
  };

  const handleSave = () => {
    if (showNameField && !name.trim()) {
      alert(t('please_enter_template_name') || 'Please enter a template name');
      nameInputRef.current?.focus();
      return;
    }

    const finalBody = activeTab === 'visual' && editor ? editor.getHTML() : body;
    onSave({
      id: initialId || undefined,
      name: name.trim(),
      subject: subject.trim(),
      body: finalBody,
    });
    setSavedBadge(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const getSubstitutedHtml = (raw) => {
    if (!raw) return '<p class="text-gray-400 italic">No content</p>';
    return raw
      .replace(/\{lead_data\}/g, '<table style="width:100%;border-collapse:collapse;margin:12px 0;font-size:13px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;"><tbody><tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Full Name:</td><td style="padding:8px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;">John Doe</td></tr><tr><td style="padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Email:</td><td style="padding:8px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;">john@example.com</td></tr><tr style="background:#f8fafc;"><td style="padding:8px 12px;font-weight:600;color:#475569;border-bottom:1px solid #e2e8f0;">Phone:</td><td style="padding:8px 12px;color:#1e293b;border-bottom:1px solid #e2e8f0;">+1 (555) 234-5678</td></tr><tr><td style="padding:8px 12px;font-weight:600;color:#475569;">Message:</td><td style="padding:8px 12px;color:#1e293b;">Interested in your services.</td></tr></tbody></table>')
      .replace(/\{form_id\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">#1</span>')
      .replace(/\{form\.id\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">#1</span>')
      .replace(/\{lead\.id\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">#1042</span>')
      .replace(/\{lead\.name\}/g, '<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">John Doe</span>')
      .replace(/\{lead\.email\}/g, '<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">john@example.com</span>')
      .replace(/\{lead\.phone\}/g, '<span class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs">+1 (555) 234-5678</span>')
      .replace(/\{lead\.status\}/g, '<span class="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-semibold text-xs">New Lead</span>')
      .replace(/\{site\.name\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">QoraCRM Site</span>')
      .replace(/\{site\.url\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">https://example.com</span>')
      .replace(/\{date\}/g, '<span class="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-xs">' + new Date().toLocaleDateString() + '</span>')
      .replace(/\{time\}/g, '<span class="px-1.5 py-0.5 bg-gray-100 text-gray-800 rounded font-semibold text-xs">' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</span>')
      .replace(/\{resume_link\}/g, '<a href="#" style="color:#d97706;font-weight:600;text-decoration:underline;">https://example.com/form?resume=abc123xyz</a>')
      .replace(/\{site_name\}/g, '<span class="px-1.5 py-0.5 bg-indigo-100 text-indigo-800 rounded font-semibold text-xs">QoraCRM Site</span>');
  };

  const getSubstitutedSubject = (raw) => {
    if (!raw) return 'No Subject';
    return raw
      .replace(/\{lead\.id\}/g, '#1042')
      .replace(/\{lead\.name\}/g, 'John Doe')
      .replace(/\{lead\.email\}/g, 'john@example.com')
      .replace(/\{lead\.phone\}/g, '+1 (555) 234-5678')
      .replace(/\{lead\.status\}/g, 'New Lead')
      .replace(/\{form_id\}/g, '#1')
      .replace(/\{form\.id\}/g, '#1')
      .replace(/\{site\.name\}/g, 'QoraCRM Site')
      .replace(/\{site\.url\}/g, 'https://example.com')
      .replace(/\{date\}/g, new Date().toLocaleDateString())
      .replace(/\{time\}/g, new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      .replace(/\{resume_link\}/g, 'https://example.com/form?resume=abc123xyz')
      .replace(/\{site_name\}/g, 'QoraCRM Site');
  };

  return (
    <div className="fixed inset-0 z-[100050] flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <style>{`
        .tiptap-email-editor .tiptap {
          outline: none;
          min-height: 420px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          font-size: 15px;
          line-height: 1.6;
          color: #374151;
        }
        .tiptap-email-editor .tiptap p {
          margin: 0 0 1em;
        }
        .tiptap-email-editor .tiptap h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #111827;
          margin: 1.25em 0 0.5em;
        }
        .tiptap-email-editor .tiptap h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #1f2937;
          margin: 1.1em 0 0.4em;
        }
        .tiptap-email-editor .tiptap h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #374151;
          margin: 1em 0 0.3em;
        }
        .tiptap-email-editor .tiptap ul {
          list-style-type: disc;
          padding-left: 1.5em;
          margin: 0.5em 0 1em;
        }
        .tiptap-email-editor .tiptap ol {
          list-style-type: decimal;
          padding-left: 1.5em;
          margin: 0.5em 0 1em;
        }
        .tiptap-email-editor .tiptap blockquote {
          border-left: 4px solid #6366f1;
          padding-left: 1em;
          margin: 1em 0;
          color: #4b5563;
          font-style: italic;
          background: #f8fafc;
          padding-top: 0.5em;
          padding-bottom: 0.5em;
          border-radius: 0 8px 8px 0;
        }
        .tiptap-email-editor .tiptap a {
          color: #4f46e5;
          text-decoration: underline;
          font-weight: 500;
        }
        .tiptap-email-editor .tiptap hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 1.5em 0;
        }
        .tiptap-email-editor .tiptap code {
          background: #f1f5f9;
          color: #0f172a;
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-family: monospace;
          font-size: 0.9em;
        }
        .tiptap-email-editor .tiptap img {
          max-width: 100%;
          height: auto;
          display: block;
          border-radius: 8px;
          margin: 1em 0;
        }
        .tiptap-email-editor .tiptap table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1.25em 0;
          overflow: hidden;
          border-radius: 8px;
          border: 1px solid #cbd5e1;
        }
        .tiptap-email-editor .tiptap table td,
        .tiptap-email-editor .tiptap table th {
          min-width: 1em;
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
        }
        .tiptap-email-editor .tiptap table th {
          font-weight: 700;
          text-align: left;
          background-color: #f8fafc;
          color: #1e293b;
        }
        .tiptap-email-editor .tiptap table .selectedCell:after {
          z-index: 2;
          position: absolute;
          content: "";
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(212, 175, 55, 0.15);
          pointer-events: none;
        }
        .tiptap-email-editor .tiptap table .column-resize-handle {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: -2px;
          width: 4px;
          background-color: #D4AF37;
          pointer-events: none;
        }
      `}</style>

      <div
        className={`bg-white shadow-2xl flex flex-col overflow-hidden transition-all duration-200 border border-gray-200 ${
          isFullscreen
            ? 'fixed inset-0 w-screen h-screen rounded-none z-[100060]'
            : 'fixed inset-0 sm:relative sm:inset-auto w-full max-w-5xl h-full sm:h-[92vh] max-h-[900px] rounded-none sm:rounded-2xl'
        }`}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-0 sm:h-14 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between shrink-0 z-10 gap-2 sm:gap-0">
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold shrink-0">
                <Mail size={17} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-gray-800 leading-tight truncate">
                  {showNameField && name ? name : (t('email_content_editor') || 'Email Content Editor')}
                </div>
                <div className="text-[10px] sm:text-[11px] text-gray-400 truncate hidden sm:block">
                  {t('email_editor_hint') || 'Compose HTML or visual email with dynamic lead tags'}
                </div>
              </div>
            </div>

            {/* Mobile close & apply button in top row */}
            <div className="flex sm:hidden items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleSave}
                className="flex items-center gap-1 px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs active:scale-95"
              >
                <Check size={14} />
                <span>{savedBadge ? (t('applied') || 'Applied!') : (t('save_and_apply') || 'Apply')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setActiveTab('visual')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'visual'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Sparkles size={13} />
              <span>{t('visual_editor') || 'Visual'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'html'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Code size={13} />
              <span>{t('html_code') || 'HTML Code'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${activeTab === 'preview'
                  ? 'bg-white text-primary shadow-xs'
                  : 'text-gray-500 hover:text-gray-800'
                }`}
            >
              <Eye size={13} />
              <span>{t('preview_email') || 'Preview'}</span>
            </button>
          </div>

          {/* Desktop Controls */}
          <div className="hidden sm:flex items-center gap-2">
            {activeTab === 'preview' && (
              <div className="flex items-center bg-gray-100 p-0.5 rounded-lg mr-1 text-xs">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'desktop' ? 'bg-white text-primary shadow-xs' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  title="Desktop preview"
                >
                  <Monitor size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-md transition-all ${previewDevice === 'mobile' ? 'bg-white text-primary shadow-xs' : 'text-gray-400 hover:text-gray-700'
                    }`}
                  title="Mobile preview"
                >
                  <Smartphone size={15} />
                </button>
              </div>
            )}

            {/* Fullscreen Expand/Collapse */}
            <button
              type="button"
              onClick={() => setIsFullscreen(prev => !prev)}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title={isFullscreen ? (t('exit_fullscreen') || 'Exit Fullscreen') : (t('expand_fullscreen') || 'Fullscreen')}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>

            {/* Save & Apply */}
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-xs hover:shadow transition-all cursor-pointer active:scale-95"
            >
              <Check size={14} />
              <span>{savedBadge ? (t('applied') || 'Applied!') : (t('save_and_apply') || 'Apply')}</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Name, Subject & Variable Insertion Bar ──────────────────────── */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:py-3 bg-gray-50/80 border-b border-gray-200 shrink-0 space-y-2">
          {showNameField && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span className="text-xs font-bold text-gray-600 shrink-0 sm:w-24">
                {t('template_name') || 'Name'}:
              </span>
              <input
                ref={nameInputRef}
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Customer Welcome Email"
                className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs font-bold"
              />
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="text-xs font-bold text-gray-600 shrink-0 sm:w-24">
              {t('subject_label') || 'Subject'}:
            </span>
            <input
              ref={subjectInputRef}
              type="text"
              value={subject}
              onFocus={() => { subjectFocusedRef.current = true; }}
              onBlur={() => { subjectFocusedRef.current = false; }}
              onChange={e => setSubject(e.target.value)}
              placeholder="e.g. Thank you for reaching out, {lead.name}!"
              className="flex-1 text-xs bg-white border border-gray-200 rounded-xl px-3.5 py-2 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-2xs font-medium"
            />
          </div>

          {/* Dynamic Tags Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs no-scrollbar">
            <span className="text-[11px] font-semibold text-gray-400 shrink-0 mr-1">
              {t('insert_variable') || 'Insert Tag'}:
            </span>
            {variables.map(v => (
              <button
                key={v.tag}
                type="button"
                onClick={() => handleInsertVar(v.tag)}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-primary/10 border border-gray-200 hover:border-primary/30 text-gray-700 hover:text-primary text-[11px] font-mono transition-all shrink-0 cursor-pointer shadow-2xs hover:scale-102"
                title={`Insert ${v.tag}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Visual Editor Toolbar (only in visual mode) ──────────────────── */}
        {activeTab === 'visual' && editor && (
          <div className="px-4 sm:px-6 py-2 bg-white border-b border-gray-200 flex flex-wrap items-center gap-1 shrink-0 text-xs">
            {/* Headings */}
            <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200/80 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().setParagraph().run()}
                className={`px-2 py-1 rounded text-xs font-semibold transition-all ${editor.isActive('paragraph') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Normal text"
              >
                P
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1 rounded transition-all ${editor.isActive('heading', { level: 1 }) ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Heading 1"
              >
                <Heading1 size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1 rounded transition-all ${editor.isActive('heading', { level: 2 }) ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Heading 2"
              >
                <Heading2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`p-1 rounded transition-all ${editor.isActive('heading', { level: 3 }) ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Heading 3"
              >
                <Heading3 size={15} />
              </button>
            </div>

            {/* Basic Formatting */}
            <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200/80 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1 rounded transition-all ${editor.isActive('bold') ? 'bg-white text-primary shadow-xs font-bold' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Bold (Ctrl+B)"
              >
                <Bold size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1 rounded transition-all ${editor.isActive('italic') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Italic (Ctrl+I)"
              >
                <Italic size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleUnderline().run()}
                className={`p-1 rounded transition-all ${editor.isActive('underline') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Underline (Ctrl+U)"
              >
                <UnderlineIcon size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                className={`p-1 rounded transition-all ${editor.isActive('strike') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Strikethrough"
              >
                <Strikethrough size={15} />
              </button>
            </div>

            {/* Lists & Quotes */}
            <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200/80 mr-1">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1 rounded transition-all ${editor.isActive('bulletList') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Bullet List"
              >
                <List size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-1 rounded transition-all ${editor.isActive('orderedList') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Numbered List"
              >
                <ListOrdered size={15} />
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={`p-1 rounded transition-all ${editor.isActive('blockquote') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Blockquote"
              >
                <Quote size={15} />
              </button>
            </div>

            {/* Links & Dividers */}
            <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200/80 mr-1">
              <button
                type="button"
                onClick={handleSetLink}
                className={`p-1 rounded transition-all ${editor.isActive('link') ? 'bg-white text-primary shadow-xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                title="Add / Edit Link"
              >
                <Link2 size={15} />
              </button>
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={() => editor.chain().focus().unsetLink().run()}
                  className="p-1 rounded text-red-500 hover:bg-red-50 transition-all"
                  title="Remove Link"
                >
                  <Unlink size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="p-1 rounded text-gray-600 hover:text-gray-900 transition-all"
                title="Divider line"
              >
                <Minus size={15} />
              </button>
            </div>

            {/* Media & Table */}
            <div className="flex items-center gap-0.5 bg-gray-50 p-0.5 rounded-lg border border-gray-200/80 mr-1">
              {/* Insert Image from WP Media */}
              <button
                type="button"
                onClick={handleInsertImage}
                className="flex items-center gap-1 px-2 py-1 rounded text-gray-700 hover:text-primary hover:bg-white transition-all text-xs font-semibold cursor-pointer"
                title={t('insert_image_wp') || 'Insert Photo (WP Media)'}
              >
                <ImageIcon size={14} className="text-gray-500" />
                <span className="hidden sm:inline">{t('photo_media') || 'Photo'}</span>
              </button>

              {/* Table Dropdown Menu */}
              <div className="relative" ref={tableMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (!editor.isActive('table')) {
                      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
                    } else {
                      setTableMenuOpen(prev => !prev);
                    }
                  }}
                  className={`flex items-center gap-1 px-2 py-1 rounded transition-all text-xs font-semibold cursor-pointer ${editor.isActive('table')
                      ? 'bg-white text-primary shadow-xs ring-1 ring-primary/30 font-bold'
                      : 'text-gray-700 hover:text-primary hover:bg-white'
                    }`}
                  title={editor.isActive('table') ? (t('table_menu') || 'Table Options') : (t('insert_table') || 'Insert Table (3x3)')}
                >
                  <TableIcon size={14} className={editor.isActive('table') ? 'text-primary' : 'text-gray-500'} />
                  <span className="hidden sm:inline">{t('table_menu') || 'Table'}</span>
                  {editor.isActive('table') && <ChevronDown size={12} className="text-primary ml-0.5" />}
                </button>

                {/* Table Context Menu Popup */}
                {tableMenuOpen && editor.isActive('table') && (
                  <div className="absolute top-full left-0 mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 text-xs text-gray-700 animate-in fade-in slide-in-from-top-1">
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('rows') || 'Rows'}
                    </div>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addRowBefore().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={13} className="text-gray-400" />
                      <span>{t('add_row_before') || 'Row Above'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addRowAfter().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={13} className="text-gray-400" />
                      <span>{t('add_row_after') || 'Row Below'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteRow().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{t('delete_row') || 'Delete Row'}</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>
                    <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {t('columns') || 'Columns'}
                    </div>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addColumnBefore().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={13} className="text-gray-400" />
                      <span>{t('add_col_before') || 'Column Left'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().addColumnAfter().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Plus size={13} className="text-gray-400" />
                      <span>{t('add_col_after') || 'Column Right'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteColumn().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{t('delete_col') || 'Delete Column'}</span>
                    </button>

                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().toggleHeaderRow().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Rows size={13} className="text-gray-400" />
                      <span>{t('toggle_header_row') || 'Header Row'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => { editor.chain().focus().deleteTable().run(); setTableMenuOpen(false); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{t('delete_table') || 'Delete Table'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Quick table actions when cursor inside table */}
            {editor.isActive('table') && (
              <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-lg border border-primary/20 text-[11px] font-medium text-primary-dark mr-1 animate-in fade-in">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Add Row Below"
                >
                  <Plus size={11} />
                  <span>{t('row') || 'Row'}</span>
                </button>
                <span className="text-primary/40">•</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="hover:underline flex items-center gap-0.5 cursor-pointer"
                  title="Add Column After"
                >
                  <Plus size={11} />
                  <span>{t('col') || 'Col'}</span>
                </button>
                <span className="text-primary/40">•</span>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="hover:text-red-600 flex items-center gap-0.5 cursor-pointer text-red-500 font-semibold ml-0.5"
                  title="Delete Table"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            )}

            {/* Clear Formatting */}
            <button
              type="button"
              onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
              className="px-2 py-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded text-xs transition-colors cursor-pointer ml-auto"
              title={t('clear_formatting') || 'Clear formatting'}
            >
              {t('clear_formatting') || 'Clear formatting'}
            </button>
          </div>
        )}

        {/* ── Main Content Area ───────────────────────────────────────────── */}
        <div className="flex-1 bg-gray-100/60 overflow-y-auto p-4 sm:p-6 flex justify-center">
          {/* VISUAL MODE */}
          {activeTab === 'visual' && (
            <div className="w-full max-w-[760px] bg-white rounded-2xl shadow-sm border border-gray-200/90 p-6 sm:p-10 min-h-[460px] flex flex-col focus-within:ring-2 focus-within:ring-primary/20 transition-all">
              <div className="tiptap-email-editor flex-1 cursor-text" onClick={() => editor?.commands.focus()}>
                <EditorContent editor={editor} />
              </div>
            </div>
          )}

          {/* HTML CODE MODE */}
          {activeTab === 'html' && (
            <div className="w-full max-w-4xl flex flex-col bg-gray-900 rounded-2xl overflow-hidden shadow-md border border-gray-800">
              <div className="px-4 py-2 bg-gray-950 border-b border-gray-800 flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono text-[11px]">Raw HTML Source</span>
                <span className="text-[11px]">You can paste custom responsive email HTML here</span>
              </div>
              <textarea
                ref={htmlTextareaRef}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="<p>Write your custom HTML here...</p>"
                className="flex-1 w-full bg-gray-900 text-gray-200 font-mono text-xs leading-relaxed p-5 focus:outline-none resize-none min-h-[400px]"
                spellCheck={false}
              />
            </div>
          )}

          {/* PREVIEW MODE */}
          {activeTab === 'preview' && (
            <div
              className={`flex flex-col transition-all duration-200 ${previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-[680px]'
                }`}
            >
              {/* Fake Email Client Chrome */}
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/90 overflow-hidden">
                <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-200 space-y-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500 w-14 shrink-0">Subject:</span>
                    <span className="font-bold text-gray-800 text-sm truncate">
                      {getSubstitutedSubject(subject)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500 text-[11px]">
                    <span className="font-semibold w-14 shrink-0">To:</span>
                    <span className="font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                      john@example.com
                    </span>
                  </div>
                </div>

                {/* Email Body Preview */}
                <div className="p-6 sm:p-8 bg-white min-h-[380px] overflow-x-auto">
                  <div
                    className="tiptap-email-editor prose max-w-none text-gray-800"
                    dangerouslySetInnerHTML={{
                      __html: getSubstitutedHtml(body),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Footer ──────────────────────────────────────────────────────── */}
        <div className="px-3.5 sm:px-6 py-2.5 sm:h-12 bg-white border-t border-gray-200 flex items-center justify-between shrink-0 text-xs gap-2">
          <p className="text-gray-400 text-[11px] truncate hidden sm:block">
            💡 {t('variables_hint') || 'Variables like {lead.name} are dynamically replaced when the email is sent.'}
          </p>
          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer text-center"
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Check size={14} />
              <span>{savedBadge ? (t('applied') || 'Applied!') : (t('save_and_apply') || 'Apply')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
