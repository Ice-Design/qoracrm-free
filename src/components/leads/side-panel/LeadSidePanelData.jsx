import { useState } from 'react';
import { Database } from 'lucide-react';
import { CURRENCIES } from '../../../utils/currencies';
import { useSettingsStore } from '../../../store/useSettingsStore';
import ExtensionSlot from '../../common/ExtensionSlot';

export function LeadSidePanelData({
  lead,
  editingFields,
  handleFieldChange,
  schema,
  permissions,
  isLoadingSchema,
  t,
  isSaving,
  handleSaveFields,
  getFieldLabel
}) {
  const generalCurrency = useSettingsStore(state => state.generalCurrency) || 'USD';
  const generalCurrencyPos = useSettingsStore(state => state.generalCurrencyPos) || 'left';

  const formatPriceLocally = (amount) => {
    const currencyObj = CURRENCIES.find(c => c.code === generalCurrency) || { symbol: '$' };
    const sym = currencyObj.symbol;
    let formatted = Number(amount || 0).toFixed(2);
    if (generalCurrencyPos === 'left') return `${sym}${formatted}`;
    if (generalCurrencyPos === 'left_space') return `${sym} ${formatted}`;
    if (generalCurrencyPos === 'right') return `${formatted}${sym}`;
    if (generalCurrencyPos === 'right_space') return `${formatted} ${sym}`;
    return `${sym}${formatted}`;
  };

  return (
    <>
      {/* Form Fields Section */}
      <section className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] p-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
            <Database size={14} className="text-primary" /> {t('submitted_data') || 'Submitted Data'}
          </div>
          <ExtensionSlot
            name="LeadFieldsSaveButton"
            editingFields={editingFields}
            lead={lead}
            isSaving={isSaving}
            handleSaveFields={handleSaveFields}
            t={t}
            fallback={null}
          />
        </div>

        <div className="space-y-4">
          {isLoadingSchema ? (
            <div className="text-sm text-gray-400">{t('loading_form_schema') || 'Loading form schema...'}</div>
          ) : Object.keys(editingFields).length === 0 ? (
            <div className="text-sm text-gray-500">{t('no_form_data') || 'No form data.'}</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              {(() => {
                let entries = [];
                Object.entries(editingFields).forEach(([k, v]) => {
                  if (k === 'custom_fields') {
                    let parsedCf = v;
                    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                      try { parsedCf = JSON.parse(v); } catch (e) { }
                    }
                    if (typeof parsedCf === 'object' && parsedCf !== null && !Array.isArray(parsedCf)) {
                      Object.entries(parsedCf).forEach(([cfK, cfV]) => entries.push([cfK, cfV]));
                    } else {
                      entries.push([k, v]);
                    }
                  } else {
                    entries.push([k, v]);
                  }
                });

                const normalEntries = [];
                const repeaterGroups = {};
                const objectGroups = {};

                entries.forEach(([k, v]) => {
                  const deepRepeaterMatch = k.match(/^([a-zA-Z0-9_-]+)\s*\[(\d+)\]\s*\[([a-zA-Z0-9_-]+)\]\s*\[([a-zA-Z0-9_-]+)\]$/);
                  const repeaterMatch = !deepRepeaterMatch && k.match(/^([a-zA-Z0-9_-]+)\s*\[(\d+)\]\s*\[([a-zA-Z0-9_-]+)\]$/);
                  const objectMatch = !deepRepeaterMatch && !repeaterMatch && k.match(/^([a-zA-Z0-9_-]+)\s*\[([a-zA-Z0-9_-]+)\]$/);

                  if (deepRepeaterMatch) {
                    const parentId = deepRepeaterMatch[1];
                    const rowIdx = Math.max(0, parseInt(deepRepeaterMatch[2], 10) - 1);
                    const subKey = deepRepeaterMatch[3];
                    const addrKey = deepRepeaterMatch[4];

                    if (!repeaterGroups[parentId]) repeaterGroups[parentId] = [];
                    if (!repeaterGroups[parentId][rowIdx]) repeaterGroups[parentId][rowIdx] = {};
                    if (typeof repeaterGroups[parentId][rowIdx][subKey] !== 'object' || repeaterGroups[parentId][rowIdx][subKey] === null) {
                      repeaterGroups[parentId][rowIdx][subKey] = {};
                    }
                    repeaterGroups[parentId][rowIdx][subKey][addrKey] = v;
                  } else if (repeaterMatch) {
                    const parentId = repeaterMatch[1];
                    const rowIdx = Math.max(0, parseInt(repeaterMatch[2], 10) - 1);
                    const subKey = repeaterMatch[3];

                    if (!repeaterGroups[parentId]) repeaterGroups[parentId] = [];
                    if (!repeaterGroups[parentId][rowIdx]) repeaterGroups[parentId][rowIdx] = {};

                    let parsedV = v;
                    if (typeof v === 'string' && (v.startsWith('{') || v.startsWith('['))) {
                      try { parsedV = JSON.parse(v); } catch (e) { }
                    }
                    repeaterGroups[parentId][rowIdx][subKey] = parsedV;
                  } else if (objectMatch) {
                    const parentId = objectMatch[1];
                    const subKey = objectMatch[2];

                    if (!objectGroups[parentId]) objectGroups[parentId] = {};
                    objectGroups[parentId][subKey] = v;
                  } else {
                    normalEntries.push([k, v]);
                  }
                });

                Object.entries(repeaterGroups).forEach(([parentId, rows]) => {
                  const cleanRows = rows.filter(r => r && Object.keys(r).length > 0);
                  if (cleanRows.length > 0) {
                    normalEntries.push([parentId, cleanRows]);
                  }
                });

                Object.entries(objectGroups).forEach(([parentId, obj]) => {
                  if (Object.keys(obj).length > 0) {
                    normalEntries.push([parentId, obj]);
                  }
                });

                entries = normalEntries;

                const topFieldsName = [];
                const topFieldsPhone = [];
                const topFieldsEmail = [];
                const normalFields = [];
                const addressFields = [];
                const repeaterFields = [];
                const fileFields = [];

                const productDataMap = {};
                let totalFieldData = null;
                let calculatorFieldData = null;

                const flattenSchema = (nodes) => {
                  let flat = [];
                  if (!Array.isArray(nodes)) return flat;
                  nodes.forEach(node => {
                    if (['step', 'row', 'column'].includes(node.type) && Array.isArray(node.fields)) {
                      flat = flat.concat(flattenSchema(node.fields));
                    } else {
                      flat.push(node);
                    }
                  });
                  return flat;
                };

                const flatSchema = flattenSchema(schema);

                const formulaFields = new Set();
                flatSchema.forEach(f => {
                  if ((f.type === 'total' || (f.type === 'product' && f.productFieldType === 'calculation')) && f.formula) {
                    const matches = f.formula.match(/\{([^}]+)\}/g);
                    if (matches) {
                      matches.forEach(match => {
                        const inner = match.slice(1, -1);
                        const parts = inner.split(':');
                        const fKey = parts[parts.length - 1].trim();
                        formulaFields.add(fKey.replace('field_', ''));
                      });
                    }
                  }
                });

                const productFieldIds = new Set();
                flatSchema.forEach(s => {
                  const sId = String(s.id || '');
                  const sCustom = s.customName ? String(s.customName).replace(/[^a-zA-Z0-9_-]/g, '') : sId;
                  if (s.type === 'product') {
                    productFieldIds.add(`field_${sId}`);
                    if (sCustom) productFieldIds.add(`field_${sCustom}`);
                  }
                });

                entries.forEach(([key, value]) => {
                  if (key === 'qoracrm-consent-checkbox') return;
                  if (['session_id', 'qora_token', 'abandoned_type', 'qoracrm_tracking_data', 'value'].includes(key)) return;
                  if (key.startsWith('_')) return;

                  let isTrulyEmpty = false;
                  if (value === null || value === undefined) {
                    isTrulyEmpty = true;
                  } else if (typeof value === 'string') {
                    const trimmed = value.trim();
                    if (trimmed === '' || trimmed === '[]' || trimmed === '{}' || trimmed === 'null' || trimmed === 'undefined') {
                      isTrulyEmpty = true;
                    }
                  } else if (Array.isArray(value)) {
                    isTrulyEmpty = value.length === 0 || value.every(v => v === null || v === undefined || String(v).trim() === '');
                  } else if (typeof value === 'object') {
                    isTrulyEmpty = Object.keys(value).length === 0 || Object.values(value).every(v => v === null || v === undefined || String(v).trim() === '');
                  }
                  if (isTrulyEmpty) return;

                  const id = key.replace('field_', '');

                  const fieldDef = flatSchema.find(s => {
                    const sId = String(s.id || '');
                    const sCustom = s.customName ? String(s.customName).replace(/[^a-zA-Z0-9_-]/g, '') : sId;
                    return key === `field_${sCustom}` || key === `field_${sId}` || id === sId || id === sCustom;
                  });

                  if (fieldDef && fieldDef.type === 'consent') return;

                  const lowerKey = key.toLowerCase();
                  const isAddressField = (fieldDef && fieldDef.type === 'address') || (!fieldDef && lowerKey.includes('address'));

                  let processedValue = value;
                  if (isAddressField && typeof value === 'string' && value.includes('\n')) {
                    const lines = value.split('\n').map(l => l.trim()).filter(l => l);
                    if (lines.length >= 2) {
                      const cityStateZip = lines.length > 2 ? lines[2].split(/[,]+/) : [];
                      processedValue = {
                        street: lines[0] || '',
                        address2: lines[1] || '',
                        city: cityStateZip[0] ? cityStateZip[0].trim() : '',
                        state: cityStateZip[1] ? cityStateZip[1].trim() : '',
                        zip: lines[3] || '',
                        country: lines[4] || ''
                      };
                    }
                  }

                  let parsedValueForEval = processedValue;
                  if (typeof processedValue === 'string' && (processedValue.startsWith('[') || processedValue.startsWith('{'))) {
                    try { parsedValueForEval = JSON.parse(processedValue); } catch (e) { }
                  }

                  const isFieldRepeater = (fieldDef && fieldDef.type === 'repeater') ||
                    key.toLowerCase().includes('repeater') ||
                    (Array.isArray(parsedValueForEval) && parsedValueForEval.length > 0 && typeof parsedValueForEval[0] === 'object' && parsedValueForEval[0] !== null);
                  const isAddress = isAddressField;
                  const isTextarea = fieldDef && fieldDef.type === 'textarea';
                  const isFile = fieldDef && fieldDef.type === 'file';

                  let parsedValForFile = value;
                  if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    try { parsedValForFile = JSON.parse(value); } catch (e) { }
                  }

                  let isFileStr = false;
                  if (typeof parsedValForFile === 'string') {
                    isFileStr = !!parsedValForFile.trim().match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|pdf|doc|docx|xls|xlsx|zip)(\?.*)?$/i);
                  } else if (Array.isArray(parsedValForFile) && parsedValForFile.length > 0) {
                    isFileStr = parsedValForFile.every(v => typeof v === 'string' && v.trim().match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|pdf|doc|docx|xls|xlsx|zip)(\?.*)?$/i));
                  }
                  const looksLikeFile = isFileStr;
                  const effectivelyIsFile = isFile || looksLikeFile;

                  const isUrl = (typeof processedValue === 'string' && processedValue.trim().startsWith('http')) ||
                    fieldDef?.type === 'url' || fieldDef?.type === 'website' || lowerKey.includes('url') || lowerKey.includes('website');

                  const isLongString = !isUrl && typeof processedValue === 'string' && (processedValue.length > 50 || processedValue.includes('\n'));
                  const isFullWidth = isFieldRepeater || isAddress || isTextarea || isLongString || effectivelyIsFile || isUrl;

                  const fType = fieldDef?.type;
                  const isName = fType === 'name' || lowerKey.includes('name');
                  const isEmail = fType === 'email' || lowerKey.includes('email');
                  const isPhone = fType === 'phone' || lowerKey.includes('phone');

                  const fieldData = [key, processedValue, isFieldRepeater, isFullWidth, isTextarea || isLongString, effectivelyIsFile, isAddress, fieldDef];

                  if (fType === 'total' || (!fieldDef && (key === 'total' || key === 'total_amount' || lowerKey.includes('total_price') || lowerKey.includes('total_amount')))) {
                    totalFieldData = fieldData;
                    return;
                  }
                  if (fType === 'calculator') {
                    calculatorFieldData = fieldData;
                    return;
                  }
                  if (fType === 'product' || formulaFields.has(id) || (!fieldDef && (key.startsWith('product_') || key.startsWith('field_product_')) && !key.endsWith('_quantity'))) {
                    if (!productDataMap[id]) productDataMap[id] = {};
                    productDataMap[id].product = fieldData;
                    if (fieldDef && fType !== 'product') return;
                    return;
                  }
                  if (fType === 'quantity' && fieldDef?.mappedProduct) {
                    const pId = fieldDef.mappedProduct;
                    if (!productDataMap[pId]) productDataMap[pId] = {};
                    productDataMap[pId].quantity = fieldData;
                    return;
                  }
                  if (key.endsWith('_quantity') || (!fieldDef && (key.startsWith('quantity_') || key.startsWith('field_quantity_')))) {
                    let pId = id.replace('_quantity', '');
                    if (!fieldDef) {
                      if (key.startsWith('quantity_')) {
                        pId = id.replace('quantity_', 'product_');
                      } else if (key.startsWith('field_quantity_')) {
                        pId = id.replace('field_quantity_', 'field_product_');
                      }
                    }
                    if (!productDataMap[pId]) productDataMap[pId] = {};
                    productDataMap[pId].quantity = fieldData;
                    return;
                  }

                  if (isName) {
                    topFieldsName.push(fieldData);
                  } else if (isPhone) {
                    topFieldsPhone.push(fieldData);
                  } else if (isEmail) {
                    topFieldsEmail.push(fieldData);
                  } else if (isFieldRepeater) {
                    repeaterFields.push(fieldData);
                  } else if (isAddress) {
                    addressFields.push(fieldData);
                  } else if (effectivelyIsFile) {
                    fileFields.push(fieldData);
                  } else {
                    normalFields.push(fieldData);
                  }
                });

                const finalFieldsList = [
                  ...topFieldsName,
                  ...topFieldsPhone,
                  ...topFieldsEmail,
                  ...normalFields,
                  ...addressFields,
                  ...fileFields,
                  ...repeaterFields
                ];

                const renderedFields = finalFieldsList.map(([key, value, isFieldRepeater, isFullWidth, shouldBeTextarea, isFile, isAddress, fieldDef]) => {
                  let parsedValue = value;
                  if (typeof value === 'string' && (value.startsWith('[') || value.startsWith('{'))) {
                    try { parsedValue = JSON.parse(value); } catch (e) { }
                  }
                  let isArrayLike = Array.isArray(parsedValue);

                  if (isAddress && typeof parsedValue === 'object' && parsedValue !== null) {
                    const addrKeys = ['street', 'line2', 'city', 'state', 'zip', 'country'];
                    const newAddrObj = {};

                    let idToFind = key.replace('field_', '');
                    let fDef = flatSchema.find(f => String(f.id) === String(idToFind)) || flatSchema.find(f => f.label === key) || flatSchema.find(f => f.label === key.replace(/\s\(\d+\)$/, ''));

                    if (isArrayLike) {
                      parsedValue.forEach((v, i) => {
                        const k = addrKeys[i] || `part_${i}`;
                        if (fDef && fDef[`show_${k}`] === false) return;
                        if (v && String(v).trim() !== '') {
                          newAddrObj[k] = v;
                        }
                      });
                    } else {
                      addrKeys.forEach(k => {
                        if (fDef && fDef[`show_${k}`] === false) return;
                        if (parsedValue[k] && String(parsedValue[k]).trim() !== '') {
                          newAddrObj[k] = parsedValue[k];
                        }
                      });
                      Object.keys(parsedValue).forEach(k => {
                        if (!addrKeys.includes(k) && parsedValue[k] && String(parsedValue[k]).trim() !== '') {
                          newAddrObj[k] = parsedValue[k];
                        }
                      });
                    }

                    parsedValue = newAddrObj;
                    isArrayLike = false;
                  }

                  const valuesArray = isArrayLike ? parsedValue : (typeof parsedValue === 'object' && parsedValue !== null ? Object.values(parsedValue) : []);

                  const isActuallyRepeater = isFieldRepeater ||
                    (fieldDef && fieldDef.type === 'repeater') ||
                    key.toLowerCase().includes('repeater') ||
                    (valuesArray.length > 0 && typeof valuesArray[0] === 'object' && valuesArray[0] !== null);

                  const containerIsFullWidth = isFullWidth || isActuallyRepeater;

                  if (isActuallyRepeater) {
                    const isEmpty = !valuesArray || valuesArray.length === 0 || valuesArray.every(item => {
                      if (typeof item === 'object' && item !== null) {
                        return Object.values(item).every(val => !val || String(val).trim() === '');
                      }
                      return !item || String(item).trim() === '';
                    });
                    if (isEmpty) return null;
                  }

                  return (
                    <div key={key} className={containerIsFullWidth ? "col-span-2" : "col-span-2 sm:col-span-1"}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                        {getFieldLabel(key)}
                      </label>
                      <div className="flex items-center gap-2">
                        {isFile ? (
                          <div className="flex flex-wrap gap-2">
                            {(Array.isArray(parsedValue) ? parsedValue : [parsedValue]).map((url, idx) => {
                              if (typeof url !== 'string' || !url.trim()) return null;
                              const cleanUrl = url.trim();
                              const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null;
                              return isImage ? (
                                <a key={idx} href={cleanUrl} target="_blank" rel="noreferrer" className="block max-w-sm rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:opacity-90 transition-all">
                                  <img src={cleanUrl} alt="File" className="w-full h-auto object-contain max-h-[100px]" />
                                </a>
                              ) : (
                                <a key={idx} href={cleanUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-primary transition-colors !text-primary font-semibold text-sm">
                                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                  {t('view_document') || 'View Document'}
                                </a>
                              );
                            })}
                          </div>
                        ) : typeof parsedValue === 'object' && parsedValue !== null ? (
                          <div className="w-full">
                            {(() => {
                              const isRepeater = isActuallyRepeater;

                              if (isRepeater) {
                                return (
                                  <div className="space-y-3 w-full bg-gray-50 border border-gray-200 p-3">
                                    {valuesArray.map((item, idx) => (
                                      <div key={idx} className="bg-white border border-gray-200 p-3 text-sm">
                                        <div className="font-bold text-gray-500 mb-2 border-b border-gray-100 pb-1 text-xs">Entry #{idx + 1}</div>
                                        <div className="space-y-2">
                                          {Object.entries(item).map(([subKey, subVal]) => {
                                            let subFieldDef = null;
                                            if (fieldDef && fieldDef.fields) {
                                              subFieldDef = fieldDef.fields.find(f => f.name === subKey || String(f.id) === String(subKey.replace('field_', '')));
                                            }
                                            const subLowerKey = subKey.toLowerCase();
                                            const isSubAddressField = (subFieldDef && subFieldDef.type === 'address') || (!subFieldDef && subLowerKey.includes('address'));

                                            let parsedSubVal = subVal;
                                            if (isSubAddressField && typeof subVal === 'string' && subVal.includes('\n')) {
                                              const lines = subVal.split('\n').map(l => l.trim()).filter(l => l);
                                              if (lines.length >= 2) {
                                                const cityStateZip = lines.length > 2 ? lines[2].split(/[,]+/) : [];
                                                parsedSubVal = {
                                                  street: lines[0] || '',
                                                  address2: lines[1] || '',
                                                  city: cityStateZip[0] ? cityStateZip[0].trim() : '',
                                                  state: cityStateZip[1] ? cityStateZip[1].trim() : '',
                                                  zip: lines[3] || '',
                                                  country: lines[4] || ''
                                                };
                                              }
                                            }

                                            if (typeof parsedSubVal === 'object' && parsedSubVal !== null && !Array.isArray(parsedSubVal)) {
                                              const validEntries = Object.entries(parsedSubVal).filter(([k, v]) => v && String(v).trim() !== '');
                                              if (validEntries.length === 0) return null;
                                              return (
                                                <div key={subKey} className="flex flex-col mt-3 first:mt-0">
                                                  <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">{getFieldLabel(subKey)}</span>
                                                  <div className="bg-gray-50 rounded p-2">
                                                    {validEntries.map(([k, v]) => {
                                                      if (subFieldDef && subFieldDef[`show_${k}`] === false) return null;
                                                      return (
                                                        <div key={k} className="flex justify-between border-b border-gray-100 last:border-0 py-1">
                                                          <span className="text-gray-400 text-xs mr-4">{getFieldLabel(k)}</span>
                                                          <span className="text-gray-800 text-sm font-medium text-right">{String(v)}</span>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            }

                                            if (!parsedSubVal || String(parsedSubVal).trim() === '') return null;

                                            let stringSubVal = parsedSubVal;
                                            if (typeof parsedSubVal === 'string' && (parsedSubVal.startsWith('[') || parsedSubVal.startsWith('{'))) {
                                              try { stringSubVal = JSON.parse(parsedSubVal); } catch (e) { }
                                            }

                                            let isSubFile = false;
                                            if (subFieldDef && subFieldDef.type === 'file') {
                                              isSubFile = true;
                                            } else {
                                              const arr = Array.isArray(stringSubVal) ? stringSubVal : [stringSubVal];
                                              if (arr.length > 0 && arr.every(v => typeof v === 'string' && v.trim().match(/^https?:\/\/.*\.(png|jpg|jpeg|gif|webp|pdf|doc|docx|xls|xlsx|zip)(\?.*)?$/i))) {
                                                isSubFile = true;
                                              }
                                            }

                                            if (isSubFile) {
                                              return (
                                                <div key={subKey} className="flex flex-col mt-2 first:mt-0">
                                                  <span className="text-[10px] uppercase font-bold text-gray-400 mb-1">{getFieldLabel(subKey)}</span>
                                                  <div className="flex flex-wrap gap-2">
                                                    {(Array.isArray(stringSubVal) ? stringSubVal : [stringSubVal]).map((url, idx) => {
                                                      if (typeof url !== 'string' || !url.trim()) return null;
                                                      const cleanUrl = url.trim();
                                                      const isImage = cleanUrl.match(/\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i) != null;
                                                      return isImage ? (
                                                        <a key={idx} href={cleanUrl} target="_blank" rel="noreferrer" className="block max-w-sm rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md hover:opacity-90 transition-all">
                                                          <img src={cleanUrl} alt="File" className="w-full h-auto object-contain max-h-[60px]" />
                                                        </a>
                                                      ) : (
                                                        <a key={idx} href={cleanUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-primary transition-colors !text-primary font-semibold text-xs">
                                                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                                          {t('view_document') || 'View Document'}
                                                        </a>
                                                      );
                                                    })}
                                                  </div>
                                                </div>
                                              );
                                            }

                                            let displayVal = parsedSubVal;
                                            if (Array.isArray(parsedSubVal)) {
                                              displayVal = parsedSubVal.join(', ');
                                            } else if (typeof parsedSubVal === 'object' && parsedSubVal !== null) {
                                              displayVal = Object.values(parsedSubVal).filter(v => v).join(' ');
                                            }
                                            if (displayVal === '1' || displayVal === 'on') displayVal = 'Yes (Checked)';
                                            if (displayVal === 'save_and_continue') displayVal = t('save_and_continue') || 'Save and Continue';
                                            if (displayVal === 'convert_to_lead') displayVal = t('convert_to_lead') || 'Convert to Lead';
                                            if (displayVal === 'background') displayVal = t('background_tracking') || 'Background Tracking';

                                            return (
                                              <div key={subKey} className="flex flex-col mt-2 first:mt-0">
                                                <span className="text-[10px] uppercase font-bold text-gray-400">{getFieldLabel(subKey)}</span>
                                                <span className="text-gray-800 font-medium break-all">
                                                  {displayVal}
                                                </span>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                );
                              } else if (isArrayLike) {
                                return (
                                  <div className="w-full text-sm font-medium text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100 px-4 py-2.5">
                                    {valuesArray.join(', ')}
                                  </div>
                                );
                              } else {
                                const validEntries = Object.entries(parsedValue).filter(([k, v]) => v && String(v).trim() !== '');
                                if (validEntries.length === 0) return <div className="text-gray-300 text-sm italic">Not provided</div>;

                                return (
                                  <div className="w-full text-sm font-medium text-gray-900 bg-gray-50/50 rounded-xl border border-gray-100 p-4">
                                    {validEntries.map(([k, v]) => {
                                      let displayVal = String(v);
                                      if (displayVal === '1' || displayVal === 'on') displayVal = 'Yes (Checked)';
                                      if (displayVal === 'save_and_continue') displayVal = t('save_and_continue') || 'Save and Continue';
                                      if (displayVal === 'convert_to_lead') displayVal = t('convert_to_lead') || 'Convert to Lead';
                                      if (displayVal === 'background') displayVal = t('background_tracking') || 'Background Tracking';
                                      return (
                                        <div key={k} className="flex justify-between border-b border-gray-100 last:border-0 py-1.5">
                                          <span className="text-gray-400 text-xs mr-4">{getFieldLabel(k)}</span>
                                          <span className="text-right">{displayVal}</span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                );
                              }
                            })()}
                          </div>
                        ) : (
                          <ExtensionSlot
                            name="LeadFieldInput"
                            fieldKey={key}
                            value={value}
                            shouldBeTextarea={shouldBeTextarea}
                            handleFieldChange={handleFieldChange}
                            permissions={permissions}
                            fallback={
                              <div className="w-full text-[13px] font-medium text-gray-900 bg-gray-50/50 border border-gray-100 rounded-xl px-4 py-2.5 break-all">
                                {value === 'on' ? 'Yes (Checked)' : value}
                              </div>
                            }
                          />
                        )}
                      </div>
                    </div>
                  );
                });

                // Render products block
                const productsArray = Object.values(productDataMap).filter(p => p.product);
                let productsBlock = null;
                if (productsArray.length > 0 || totalFieldData) {
                  productsBlock = (
                    <div key="products_block" className="col-span-2 mt-4 bg-gray-50/50 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
                          <span className="font-bold text-sm text-gray-700">{t('products') || 'Products'}</span>
                        </div>
                      </div>
                      <div className="p-0">
                        {productsArray.map((p, idx) => {
                          const [pKey, pVal, , , , , , pDef] = p.product;
                          const qVal = p.quantity ? p.quantity[1] : 1;

                          let optName = pVal;
                          let optPrice = pVal;
                          let optImage = null;
                          if (pDef && pDef.options) {
                            const opt = pDef.options.find(o => String(o.value) === String(pVal));
                            if (opt) {
                              optName = opt.label || pVal;
                              if (opt.imageUrl) optImage = opt.imageUrl;
                            }
                          } else if (!pDef && typeof pVal === 'string' && pVal.includes(' - ')) {
                            const parts = pVal.split(' - ');
                            optName = parts[0];
                            optPrice = parts[1];
                          }

                          return (
                            <div key={idx} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-0 bg-white">
                              {optImage && (
                                <div className="w-16 h-16 rounded-lg border border-gray-200 overflow-hidden shrink-0 bg-gray-50">
                                  <img src={optImage} alt="" className="w-full h-full object-cover" />
                                </div>
                              )}
                              <div className="flex-1">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{getFieldLabel(pKey)}</div>
                                <div className="font-semibold text-gray-800">{optName}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{p.quantity ? getFieldLabel(p.quantity[0]) : t('quantity') || 'Quantity'}</div>
                                <div className="font-medium text-gray-700">x{qVal}</div>
                              </div>
                              <div className="text-right w-24">
                                <div className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">{t('price') || 'Price'}</div>
                                <div className="font-bold text-gray-900">{formatPriceLocally(optPrice)}</div>
                              </div>
                            </div>
                          );
                        })}
                        {totalFieldData && (
                          <div className="bg-gray-100/50 p-4 flex justify-between items-center border-t border-gray-200">
                            <span className="font-bold text-gray-600 uppercase text-xs">{getFieldLabel(totalFieldData[0]) || t('total') || 'Total'}</span>
                            <span className="text-lg font-bold text-primary font-mono">{formatPriceLocally(totalFieldData[1])}</span>
                          </div>
                        )}
                        {calculatorFieldData && (
                          <div className="bg-purple-50/50 p-4 flex justify-between items-center border-t border-purple-100">
                            <span className="font-bold text-purple-600 uppercase text-xs flex items-center gap-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-calculator"><rect width="16" height="20" x="4" y="2" rx="2" /><line x1="8" x2="16" y1="6" y2="6" /><line x1="16" x2="16" y1="14" y2="18" /><path d="M16 10h.01" /><path d="M12 10h.01" /><path d="M8 10h.01" /><path d="M12 14h.01" /><path d="M8 14h.01" /><path d="M12 18h.01" /><path d="M8 18h.01" /></svg>
                              {getFieldLabel(calculatorFieldData[0]) || t('calculator') || 'Calculator'}
                            </span>
                            <span className="text-lg font-bold text-purple-700 font-mono">
                              {(calculatorFieldData[7]?.prefix || '') + calculatorFieldData[1] + (calculatorFieldData[7]?.suffix || '')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <>
                    {renderedFields}
                    {productsBlock}
                  </>
                );
              })()}
            </div>
          )}

        </div>
      </section>
    </>
  );
}
