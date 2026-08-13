/**
 * Displays a temporary toast notification at the bottom-right of the screen.
 * @param {string} message - The message to display.
 * @param {'success'|'error'} type - The type of toast.
 */
export const showGlobalToast = (message, type = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed bottom-4 right-4 px-4 py-3 rounded shadow-lg text-sm font-bold z-50 transition-opacity ${type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`;
  toast.innerText = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

/**
 * Formats any lead field value safely, handling objects (e.g. address, name), arrays, and JSON strings.
 */
export const formatLeadValue = (val) => {
  if (val === null || val === undefined || val === '') return '';
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      return val.map(v => typeof v === 'object' ? formatLeadValue(v) : String(v)).filter(Boolean).join(', ');
    }
    const parts = [];
    if (val.first_name || val.last_name) {
      parts.push(`${val.first_name || ''} ${val.last_name || ''}`.trim());
    }
    if (val.address_1 || val.address_line_1 || val.street || val.address) {
      parts.push(val.address_1 || val.address_line_1 || val.street || val.address);
    }
    if (val.address_2 || val.address_line_2) parts.push(val.address_2 || val.address_line_2);
    if (val.city) parts.push(val.city);
    if (val.state || val.province || val.region) parts.push(val.state || val.province || val.region);
    if (val.postal_code || val.zip || val.zipcode) parts.push(val.postal_code || val.zip || val.zipcode);
    if (val.country) parts.push(val.country);

    if (parts.length > 0) {
      return parts.filter(Boolean).join(', ');
    }
    return Object.values(val).filter(v => v && typeof v !== 'object').join(', ');
  }
  
  if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
    try {
      const parsed = JSON.parse(val);
      return formatLeadValue(parsed);
    } catch {
      // not JSON
    }
  }

  return String(val).trim();
};

/**
 * Formats a lead name safely, handling object values (e.g. {first_name: "John", last_name: "Doe"}).
 * @param {string|object} name - The name to format.
 * @returns {string}
 */
export const formatLeadName = (name) => {
  return formatLeadValue(name);
};

export const getLeadDisplayName = (lead, t) => {
  if (!lead) return t ? (t('unnamed_lead') || 'Unnamed Lead') : 'Unnamed Lead';
  
  const entry = lead.entry_data || lead.lead_entry_data || {};
  const meta = lead.meta_data || lead.lead_meta_data || {};
  
  if (entry.name) return formatLeadName(entry.name);
  if (entry.first_name) return formatLeadName(entry.first_name);
  if (entry['your-name']) return formatLeadName(entry['your-name']);
  
  if (meta.field_labels) {
    for (const [key, label] of Object.entries(meta.field_labels)) {
      if (label && (label.toLowerCase().includes('name') || label.toLowerCase().includes('имя'))) {
        if (entry[key]) return formatLeadName(entry[key]);
      }
    }
  }
  
  if (entry.email) return entry.email;
  if (entry['your-email']) return entry['your-email'];
  if (entry.phone) return entry.phone;
  if (entry['your-phone']) return entry['your-phone'];
  if (entry['tel']) return entry['tel'];
  
  return t ? (t('unnamed_lead') || 'Unnamed Lead') : 'Unnamed Lead';
};

export const getLeadTotalValue = (lead) => {
  if (!lead) return 0;
  const entry = lead.entry_data || lead.lead_entry_data || {};
  const val = entry.value ?? entry.total ?? entry.qoracrm_form_total;
  if (val !== undefined && val !== null && val !== '') {
    const num = parseFloat(val);
    if (!isNaN(num)) return num;
  }
  return 0;
};

export const getLeadEmail = (lead) => {
  if (!lead) return '';
  const entry = lead.entry_data || lead.lead_entry_data || {};
  const meta = lead.meta_data || lead.lead_meta_data || {};
  
  if (entry.email) return String(entry.email).trim();
  if (entry['your-email']) return String(entry['your-email']).trim();
  
  if (meta.field_labels) {
    for (const [key, label] of Object.entries(meta.field_labels)) {
      const l = String(label || '').toLowerCase();
      if (l.includes('email') || l.includes('e-mail') || l.includes('почта') || l.includes('электрон')) {
        if (entry[key]) return String(entry[key]).trim();
      }
    }
  }

  for (const [key, val] of Object.entries(entry)) {
    if (typeof val === 'string' && val.includes('@') && val.includes('.')) {
      return val.trim();
    }
  }
  
  return '';
};

export const getLeadPhone = (lead) => {
  if (!lead) return '';
  const entry = lead.entry_data || lead.lead_entry_data || {};
  const meta = lead.meta_data || lead.lead_meta_data || {};
  
  if (entry.phone) return String(entry.phone).trim();
  if (entry['your-phone']) return String(entry['your-phone']).trim();
  if (entry['tel']) return String(entry['tel']).trim();
  
  if (meta.field_labels) {
    for (const [key, label] of Object.entries(meta.field_labels)) {
      const l = String(label || '').toLowerCase();
      if (l.includes('phone') || l.includes('tel') || l.includes('телефон') || l.includes('моб')) {
        if (entry[key]) return String(entry[key]).trim();
      }
    }
  }

  for (const [key, val] of Object.entries(entry)) {
    const k = key.toLowerCase();
    if (k.includes('phone') || k.includes('tel')) {
      if (val) return String(val).trim();
    }
  }
  
  return '';
};

/**
 * Copies the QoraCRM shortcode for a given form ID to the clipboard.
 * @param {number|string} id - The form ID.
 * @param {Event} [e] - Optional event to stop propagation.
 */
export const copyShortcode = (id, e, successMessage = 'Shortcode copied to clipboard!') => {
  if (e) e.stopPropagation();
  const shortcode = `[qoracrm_form id="${id}"]`;
  navigator.clipboard.writeText(shortcode);
  showGlobalToast(successMessage);
};

export const formatCrmDate = (dateString, t) => {
  if (!dateString) return '';
  const str = String(dateString).trim();
  
  let date;
  if (str.includes('Z') || str.includes('+') || (str.includes('T') && str.length > 19)) {
    date = new Date(str);
  } else if (str.includes(' ') || str.includes('T')) {
    // Try UTC parsing first (MySQL datetime 'YYYY-MM-DD HH:MM:SS' stored in UTC)
    const utcStr = str.replace(' ', 'T') + 'Z';
    const utcDate = new Date(utcStr);
    const now = new Date();
    const diffSecUtc = (now.getTime() - utcDate.getTime()) / 1000;

    // If UTC parsing produces a reasonable timestamp (between -60s and 30 days), use UTC date.
    // Otherwise fallback to local date parsing
    if (!isNaN(utcDate.getTime()) && diffSecUtc >= -300 && diffSecUtc <= 86400 * 30) {
      date = utcDate;
    } else {
      date = new Date(str.replace(/-/g, '/'));
    }
  } else {
    date = new Date(str);
  }

  if (!date || isNaN(date.getTime())) return dateString;

  const format = window.qoraCrmData?.general?.datetime_format || 'relative';

  if (format === 'relative') {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return t ? t('just_now') || 'Just now' : 'Just now';
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} ${t ? t('minutes_ago') || 'm ago' : 'm ago'}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ${t ? t('hours_ago') || 'h ago' : 'h ago'}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} ${t ? t('days_ago') || 'd ago' : 'd ago'}`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} ${t ? t('months_ago') || 'mo ago' : 'mo ago'}`;
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears} ${t ? t('years_ago') || 'y ago' : 'y ago'}`;
  }

  const options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric'
  };
  
  if (displayTz) {
    try {
      options.timeZone = displayTz;
    } catch (e) {
      // invalid timezone string
    }
  }
  const lang = window.qoraCrmData?.general?.language || 'en';
  const locale = lang === 'en' ? 'en-US' : lang;
  if (lang !== 'en') {
    options.hour12 = false;
  }
  
  const dateStr = date.toLocaleString(locale, options);
  return dateStr;
};

/**
 * Parses and formats complex values (JSON strings, arrays, objects) into readable strings.
 */
export const parseComplexFieldValue = (value) => {
  if (!value) return '';
  if (typeof value === 'string') {
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        const parsed = JSON.parse(value);
        return formatParsedValue(parsed);
      } catch (e) {
        return value;
      }
    }
    return value;
  }
  return formatParsedValue(value);
};

const formatParsedValue = (val) => {
  if (Array.isArray(val)) {
    // If it's an array of arrays (like a repeater)
    if (val.length > 0 && Array.isArray(val[0])) {
      return val.map(row => row.filter(item => item).join(', ')).join(' | ');
    }
    // If it's an array of objects
    if (val.length > 0 && typeof val[0] === 'object' && val[0] !== null) {
      return val.map(obj => Object.values(obj).filter(v => v).join(', ')).join(' | ');
    }
    return val.filter(v => v).join(', ');
  }
  if (typeof val === 'object' && val !== null) {
    return Object.values(val).filter(v => v).join(', ');
  }
  return String(val);
};
