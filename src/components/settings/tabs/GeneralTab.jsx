import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, AlertCircle, Search } from 'lucide-react';
import { useSettingsStore } from '../../../store/useSettingsStore';
import { useI18n } from '../../../utils/I18nContext';
import { CURRENCIES } from '../../../utils/currencies';
import { ProLockIcon } from '../../common/ProBadge';
import ExtensionSlot from '../../common/ExtensionSlot';

export function CurrencySelect({ value, onChange, t }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = useMemo(() => {
    if (!search) return CURRENCIES;
    const lower = search.toLowerCase();
    return CURRENCIES.filter(c => c.label.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower));
  }, [search]);

  const selected = CURRENCIES.find(c => c.code === value) || CURRENCIES.find(c => c.code === 'USD');

  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border border-gray-300 px-4 py-2.5 text-sm font-medium bg-white flex justify-between items-center cursor-pointer hover:border-primary transition-colors"
      >
        <span className="truncate">{selected ? selected.label : value}</span>
        <ChevronDown size={18} className="text-gray-400 shrink-0 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg overflow-hidden flex flex-col max-h-[300px]">
          <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50">
            <Search size={16} className="text-gray-400 shrink-0 ml-1" />
            <input
              autoFocus
              type="text"
              className="w-full bg-transparent border-none outline-none text-sm px-1 py-1"
              placeholder={t('search_currency') || 'Search currency...'}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="overflow-y-auto flex-1 p-1 custom-scrollbar">
            {filtered.length > 0 ? filtered.map(c => (
              <div
                key={c.code}
                onClick={() => { onChange(c.code); setIsOpen(false); setSearch(''); }}
                className={`px-3 py-2 text-sm rounded cursor-pointer ${value === c.code ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
              >
                {c.label}
              </div>
            )) : (
              <div className="p-3 text-center text-sm text-gray-500">No results found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function GeneralTab() {
  const { t, setLanguage } = useI18n();
  const {
    generalLang,
    generalCurrency,
    generalCurrencyPos,
    generalHoneypot,
    generalTokenSpam,
    generalDisplayTimezone,
    generalGeoIpService,
    generalGeoIpCustomUrl,
    generalDefaultCountry,
    generalAutosave,
    generalAutosaveInterval,
    generalBoardAutorefresh,
    generalBoardAutorefreshInterval,
    generalAutoDeleteSpam,
    generalAutoDeleteSpamDays,
    generalAutoDeleteArchive,
    generalAutoDeleteArchiveDays,
    generalAutoDeleteTasks,
    generalAutoDeleteTasksDays,
    setGeneral
  } = useSettingsStore();

  const handleLanguageChange = (e) => {
    const val = e.target.value;
    setGeneral({ generalLang: val });
  };

  return (
    <div className="p-8 space-y-6 h-full overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">{t('tab_general')}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="max-w-sm">
          <label className="block text-sm font-semibold text-gray-700 mb-2">{t('general_language') || 'Language'}</label>
          <p className="text-xs text-gray-400 mb-3">{t('general_language_desc') || 'Select the interface language.'}</p>
          <div className="relative">
            <select
              value={generalLang}
              onChange={handleLanguageChange}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white pr-10"
            >
              <option value="en">🇬🇧 English</option>
              <option value="uk">🇺🇦 Ukrainian</option>
              <option value="de">🇩🇪 German</option>
              <option value="ro">🇲🇩 Moldovan/Romanian</option>
              <option value="es">🇪🇸 Spanish</option>
              <option value="pl">🇵🇱 Polish</option>
              <option value="fr">🇫🇷 French</option>
              <option value="it">🇮🇹 Italian</option>
              <option value="ru">Russian</option>
            </select>
          </div>
        </div>

        <ExtensionSlot
          name="ProCurrencySetting"
          generalCurrency={generalCurrency}
          generalCurrencyPos={generalCurrencyPos}
          setGeneral={setGeneral}
          t={t}
          fallback={
            <div className="max-w-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('general_currency') || 'Currency'}</label>
                  <p className="text-xs text-gray-400 mb-3">{t('general_currency_desc') || 'Select the currency symbol used for budget and payments.'}</p>
                </div>
                <div onClick={() => window.qoraOpenUpgradeModal?.(t('general_currency') || 'Currency')} className="cursor-pointer mt-1"><ProLockIcon /></div>
              </div>
              <div className="opacity-50 pointer-events-none">
                <CurrencySelect value="USD" onChange={() => {}} t={t} />
              </div>
            </div>
          }
        />
      </div>

      <hr className="border-gray-100" />

      {/* Date format & Autosave */}
      <div className="space-y-6">
        <div>
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">{t('display_timezone') || 'Display Timezone'}</label>
            <div className="relative max-w-sm">
              <select
                value={generalDisplayTimezone}
                onChange={(e) => setGeneral({ generalDisplayTimezone: e.target.value })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white pr-10"
              >
                <option value="">{t('wp_default_timezone') || 'WordPress Default'}</option>
                <option disabled>──────────</option>
                {Intl.supportedValuesOf('timeZone').map(tz => (
                  <option key={tz} value={tz}>{tz.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('display_timezone_desc') || 'Select the timezone to use when displaying lead creation and editing dates.'}</p>
          </div>
        </div>

        <div>
          <div className="mt-4 flex flex-col sm:flex-row gap-6 items-start">

            {/* GeoIP Service */}
            <div className="flex-1 max-w-sm w-full">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('general_geoip_service') || 'GeoIP Service (Phone fields)'}</label>
              <div className="relative w-full">
                <select
                  value={generalGeoIpService || 'disabled'}
                  onChange={(e) => setGeneral({ generalGeoIpService: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium appearance-none outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white pr-10"
                >
                  <option value="disabled">{t('disabled') || 'Disabled'}</option>
                  <option value="ipapi.co">ipapi.co (Free, no key required)</option>
                  <option value="ip-api.com">{t('geoip_ip_api') || 'ip-api.com (Free, HTTP only)'}</option>
                  <option value="custom">{t('geoip_custom_url') || 'Custom URL'}</option>
                </select>
              </div>
              {generalGeoIpService === 'custom' && (
                <div className="mt-3 w-full">
                  <input
                    type="text"
                    placeholder="https://api.example.com/geoip"
                    value={generalGeoIpCustomUrl || ''}
                    onChange={(e) => setGeneral({ generalGeoIpCustomUrl: e.target.value })}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">{t('geoip_custom_url_desc') || 'API must return JSON with a `country_code` or `country` string property.'}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-2">{t('general_geoip_service_desc') || 'Automatically detect visitor country for phone numbers. If disabled, defaults to site locale or US.'}</p>
            </div>

            {/* Default Country */}
            <div className="w-56 shrink-0">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{t('default_country') || 'Default Country (Phone fields)'}</label>
              <input
                type="text"
                placeholder="US, UA, GB"
                maxLength={2}
                value={generalDefaultCountry || ''}
                onChange={(e) => setGeneral({ generalDefaultCountry: e.target.value.toUpperCase() })}
                className="w-full border border-gray-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary uppercase"
              />
              <p className="text-[11px] text-gray-400 mt-1">{t('default_country_desc') || 'If empty, we will try to use the WordPress site language.'}</p>
            </div>

          </div>
        </div>

        <div className=" pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5" title={t('form_editor_autosave_desc') || "Automatically saves your form progress every few seconds."}>
              {t('form_editor_autosave') || 'Form Editor Autosave'} <AlertCircle size={14} className="text-primary" />
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={generalAutosave} onChange={(e) => setGeneral({ generalAutosave: e.target.checked })} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {generalAutosave && (
            <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-600 font-medium">{t('autosave_interval') || 'Autosave Interval'}</span>
                <span className="text-primary font-bold">{generalAutosaveInterval / 1000}s</span>
              </div>
              <input
                type="range"
                min="30"
                max="300"
                step="30"
                value={generalAutosaveInterval / 1000}
                onChange={(e) => setGeneral({ generalAutosaveInterval: parseInt(e.target.value) * 1000 })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold">
                <span>30s</span>
                <span>5m</span>
              </div>
            </div>
          )}
        </div>

        <div className=" pt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5" title={t('board_autorefresh_desc') || "Automatically refresh lists and Kanban board."}>
              {t('board_autorefresh') || 'Board Auto-Refresh'} <AlertCircle size={14} className="text-primary" />
            </label>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={generalBoardAutorefresh} onChange={(e) => setGeneral({ generalBoardAutorefresh: e.target.checked })} />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          {generalBoardAutorefresh && (
            <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="text-gray-600 font-medium">{t('board_autorefresh_interval') || 'Board Refresh Interval'}</span>
                <span className="text-primary font-bold">{generalBoardAutorefreshInterval}s</span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={generalBoardAutorefreshInterval}
                onChange={(e) => setGeneral({ generalBoardAutorefreshInterval: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-semibold">
                <span>10s</span>
                <span>2m</span>
              </div>
            </div>
          )}
        </div>

        <ExtensionSlot
          name="ProAutoDeleteSettings"
          generalAutoDeleteSpam={generalAutoDeleteSpam}
          generalAutoDeleteSpamDays={generalAutoDeleteSpamDays}
          generalAutoDeleteArchive={generalAutoDeleteArchive}
          generalAutoDeleteArchiveDays={generalAutoDeleteArchiveDays}
          generalAutoDeleteTasks={generalAutoDeleteTasks}
          generalAutoDeleteTasksDays={generalAutoDeleteTasksDays}
          setGeneral={setGeneral}
          t={t}
          fallback={
            <>
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5" title={t('auto_delete_spam_desc') || "Automatically delete leads from Spam after a specified number of days."}>
                    {t('auto_delete_spam') || 'Auto-Delete Spam'} <ProLockIcon /> <AlertCircle size={14} className="text-red-500" />
                  </label>
                  <div onClick={() => window.qoraOpenUpgradeModal?.(t('auto_delete_spam') || 'Auto-Delete Spam')}>
                    <label className="relative inline-flex items-center pointer-events-none opacity-60">
                      <input type="checkbox" className="sr-only peer" checked={false} readOnly />
                      <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5" title={t('auto_delete_archive_desc') || "Automatically delete leads from Archive after a specified number of days."}>
                    {t('auto_delete_archive') || 'Auto-Delete Archive'} <ProLockIcon /> <AlertCircle size={14} className="text-gray-500" />
                  </label>
                  <div onClick={() => window.qoraOpenUpgradeModal?.(t('auto_delete_archive') || 'Auto-Delete Archive')}>
                    <label className="relative inline-flex items-center pointer-events-none opacity-60">
                      <input type="checkbox" className="sr-only peer" checked={false} readOnly />
                      <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>
                </div>
              </div>
              <div className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-900 flex items-center gap-1.5" title={t('auto_delete_tasks_desc') || "Automatically delete completed tasks after a specified number of days."}>
                    {t('auto_delete_tasks') || 'Auto-Delete Completed Tasks'} <ProLockIcon /> <AlertCircle size={14} className="text-gray-500" />
                  </label>
                  <div onClick={() => window.qoraOpenUpgradeModal?.(t('auto_delete_tasks') || 'Auto-Delete Completed Tasks')}>
                    <label className="relative inline-flex items-center pointer-events-none opacity-60">
                      <input type="checkbox" className="sr-only peer" checked={false} readOnly />
                      <div className="w-11 h-6 bg-gray-200 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5"></div>
                    </label>
                  </div>
                </div>
              </div>
            </>
          }
        />
      </div>
    </div>
  );
}
