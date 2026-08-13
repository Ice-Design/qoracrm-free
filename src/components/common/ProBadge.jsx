import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Star, Clock, Zap, X, Check, ArrowRight, Sparkles, Info } from 'lucide-react';
import { plan, trialDaysLeft, isPro, hasUsedTrial, features } from '../../hooks/useFeature';
import { useI18n } from '../../utils/I18nContext';

/**
 * PlanBadge — shown in the top right corner of the navbar.
 *
 * Lite  → "Try Pro" button (with pulse animation)
 * Trial → Countdown badge "Trial: Xd"
 * Pro   → "PRO" badge
 */
export function PlanBadge({ onUpgradeClick }) {
  const { t } = useI18n();

  // Pro — just a static badge
  if (plan === 'pro') {
    return (
      <div className="flex items-center gap-2">
        <button
          className="plan-badge plan-badge--pro hover:opacity-80 transition-opacity cursor-pointer"
          title={t('tab_subscription') || "License"}
          onClick={() => window.location.hash = '#/settings/subscription'}
        >
          <Star size={13} strokeWidth={2.5} />
          PRO
        </button>
      </div>
    );
  }

  // Trial — countdown badge (clickable to upgrade)
  if (plan === 'trial') {
    const labelDays = trialDaysLeft <= 0 ? '<1d' : `${trialDaysLeft}d`;
    return (
      <div className="flex items-center gap-2">
        <button
          className="plan-badge plan-badge--trial hover:opacity-80 transition-opacity cursor-pointer"
          title={t('tab_subscription') || "License"}
          onClick={() => window.location.hash = '#/settings/subscription'}
        >
          <Clock size={13} strokeWidth={2.5} />
          {t('trial_active') || 'Trial:'} {labelDays}
        </button>
      </div>
    );
  }

  // Lite — call-to-action button
  return (
    <div className="flex items-center gap-2">
      <button
        id="qoracrm-plan-badge-upgrade"
        className="plan-badge plan-badge--lite"
        onClick={onUpgradeClick}
        title={t('upgrade_to_pro_title') || "Upgrade to Pro"}
      >
        <Sparkles size={13} strokeWidth={2.5} />
        {t('try_pro') || 'Get PRO'}
      </button>
    </div>
  );
}

/**
 * ProLockIcon — small lock icon 🔒 placed on locked elements.
 *
 * @param {object}  props
 * @param {string}  [props.className] - Additional classes
 * @param {string}  [props.feature]   - Feature key (for tooltip)
 * @param {function}[props.onClick]   - Open UpgradeModal
 */
export function ProLockIcon({ className = '', feature, onClick }) {
  const { t } = useI18n();
  return (
    <span
      className={`pro-lock-icon ${className}`}
      title={t('available_in_pro') || 'Available in Pro version'}
      onClick={onClick}
      role="button"
      aria-label="Pro feature"
    >
      🔒
    </span>
  );
}

/**
 * UpgradeModal — pop-up modal dialog for upgrading to Pro.
 */
export function UpgradeModal({ isOpen, onClose, feature, promoText: customPromoText }) {
  const { t } = useI18n();
  const [requestingTrial, setRequestingTrial] = useState(false);
  const [requestingCheckout, setRequestingCheckout] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);
  const [promoText, setPromoText] = useState('');

  // Fetch promo text from WP API proxy
  useEffect(() => {
    if (isOpen && !customPromoText) {
      const fetchPromo = async () => {
        try {
          const promoUrl = (window.qoraCrmData?.apiUrl || '/wp-json/qoracrm/v1/') + 'settings/promo';
          const promoRes = await fetch(promoUrl, {
            headers: {
              'X-WP-Nonce': window.qoraCrmData?.nonce || ''
            }
          }).catch(() => null);

          if (promoRes && promoRes.ok) {
            const promoData = await promoRes.json();
            if (promoData && promoData.active !== false && promoData.text) {
              let fullText = promoData.text;
              if (promoData.code) {
                fullText += ` | ${t('promo_code') || 'Promo code'}: ${promoData.code}`;
              }
              setPromoText(fullText);
            }
          }
        } catch (e) {
          // ignore
        }
      };
      fetchPromo();
    }
  }, [isOpen, customPromoText, t]);

  if (!isOpen) return null;

  const displayPromo = customPromoText || promoText;

  const handleUpgrade = () => {
    const d = encodeURIComponent(window.qoraCrmData?.homeUrl || '');
    const e = encodeURIComponent(window.qoraCrmData?.currentUser?.email || '');
    window.open(`https://qoracrm.com/#pricing?domain=${d}&email=${e}`, '_blank', 'noopener,noreferrer');
  };

  const handleTrialRequest = () => {
    const d = encodeURIComponent(window.qoraCrmData?.homeUrl || '');
    const e = encodeURIComponent(window.qoraCrmData?.currentUser?.email || '');
    window.open(`https://qoracrm.com/#pricing?trial=yes&utm_source=qoracrm_plugin&domain=${d}&email=${e}`, '_blank', 'noopener,noreferrer');
  };

  const handleAlreadyPurchased = async (e) => {
    e.preventDefault();
    if (requestingCheckout || requestingTrial) return;

    setRequestingCheckout(true);
    try {
      const formData = new URLSearchParams();
      formData.append('action', 'qoracrm_install_pro');
      formData.append('nonce', window.qoraCrmData?.adminNonce || '');

      const res = await fetch(window.qoraCrmData?.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString()
      });
      const response = await res.json();

      if (response.success && response.data && response.data.download_url) {
        window.open(response.data.download_url, '_blank');
        setAlertMessage(t('install_pro_instruction') || 'Please install the downloaded PRO plugin ZIP file via Plugins -> Add New -> Upload Plugin.');
      } else {
        setAlertMessage(response.data?.message || 'Verification failed. Please make sure you have an active PRO subscription for this domain.');
      }
    } catch (err) {
      setAlertMessage('Server error during verification.');
    } finally {
      setRequestingCheckout(false);
    }
  };

  return createPortal(
    <div className="upgrade-modal-overlay" onClick={onClose}>
      <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
        {/* Close */}
        <button className="upgrade-modal__close" onClick={onClose} aria-label="Close">
          <X size={18} />
        </button>

        {/* Header */}
        <div className="upgrade-modal__header">
          <div className="upgrade-modal__icon">
            <Star size={28} strokeWidth={1.5} />
          </div>
          <h2 className="upgrade-modal__title">{t('upgrade_to_pro_title') || 'Upgrade to Pro'}</h2>
          <p className="upgrade-modal__subtitle">
            {feature
              ? (t('upgrade_feature_desc')?.replace('{feature}', feature) || `"${feature}" is available only in the Pro version of QoraCRM.`)
              : (t('upgrade_all_desc') || 'Unlock all features of QoraCRM.')}
          </p>
        </div>

        {displayPromo && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4 mx-6 text-sm font-medium text-primary text-center">
            {displayPromo}
          </div>
        )}

        {/* Features list */}
        <ul className="upgrade-modal__features">
          {[
            t('upgrade_feature_1') || 'Repeater fields & Image Upload Fields',
            t('upgrade_feature_2') || 'Quiz & Multi-step Forms',
            t('upgrade_feature_3') || 'Unlimited Kanban Columns & Tags',
            t('upgrade_feature_4') || 'Edit Entries, Products & Repeater Fields',
            t('upgrade_feature_5') || 'Bulk Editing & Dashboard Widgets',
            t('upgrade_feature_6') || 'Lead Payments via Stripe',
            t('upgrade_feature_7') || 'Managers & Flexible Access Rights',
            t('upgrade_feature_8') || 'Save & Continue + Abandoned Forms',
            t('upgrade_feature_9') || 'Floating Action Button',
            t('upgrade_feature_10') || 'Export Leads & Premium Support',
          ].map(item => (
            <li key={item} className="upgrade-modal__feature-item">
              <Check size={14} strokeWidth={2.5} className="upgrade-modal__check" />
              {item}
            </li>
          ))}
        </ul>

        {/* Pricing */}
        <div className="upgrade-modal__pricing">
          <span className="upgrade-modal__price">$10</span>
          <span className="upgrade-modal__period">{t('upgrade_price_month') || '/ month'}</span>
        </div>

        {/* Actions */}
        <div className="upgrade-modal__actions">
          {!hasUsedTrial && (
            <button
              id="qoracrm-upgrade-trial-btn"
              className="upgrade-modal__btn upgrade-modal__btn--primary"
              onClick={handleTrialRequest}
              disabled={requestingTrial || requestingCheckout}
            >
              <Zap size={16} strokeWidth={2.5} />
              {requestingTrial ? (t('activating') || 'Activating...') : (t('upgrade_trial_btn') || 'Try 7 Days for Free')}
            </button>
          )}
          <button
            id="qoracrm-upgrade-sub-btn"
            className="upgrade-modal__btn upgrade-modal__btn--secondary"
            onClick={handleUpgrade}
            disabled={requestingCheckout || requestingTrial}
          >
            {requestingCheckout ? (t('loading') || 'Loading...') : (t('upgrade_sub_btn') || 'Subscribe for $10/mo')}
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="upgrade-modal__footer" style={{ marginTop: '16px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={handleAlreadyPurchased}
            disabled={requestingCheckout || requestingTrial}
            style={{ background: 'none', border: 'none', color: '#8c8f94', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}
          >
            {t('i_already_purchased') || 'I already purchased'}
          </button>
          <p style={{ marginTop: '10px', fontSize: '10px', color: '#b0b0b0', lineHeight: '1.4' }}>
            {t('upgrade_privacy_notice') || 'By clicking the buttons above, your site URL and email will be sent to our server to verify your license or activate a trial.'}
          </p>
        </div>
      </div>

      {alertMessage && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { e.stopPropagation(); setAlertMessage(null); }}>
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-amber-500/15 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                📦
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{t('notification') || 'Pro Installation'}</h3>
              <p className="text-gray-600 text-sm leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: alertMessage.replace(/-&gt;/g, '→').replace(/->/g, '→') }} />
              <button
                onClick={() => setAlertMessage(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-900 rounded-xl font-bold transition-all shadow-md shadow-amber-500/20 cursor-pointer"
              >
                {t('ok') || 'Got it'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

/**
 * ProGate — wrapper component. Shows banner if feature is locked.
 *
 * Example:
 *   <ProGate feature="form_quiz_mode" label="Quiz / Multi-step Mode">
 *     <QuizSettings />
 *   </ProGate>
 */
export function ProGate({ feature, label, children, showBanner = true }) {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);
  const available = isPro;

  // If feature-level check is needed (for non-binary scenarios):
  const featureEnabled = features?.[feature] ?? available;

  if (featureEnabled) {
    return children;
  }

  if (!showBanner) {
    return null;
  }

  const resolvedLabel = label || (t(feature) !== feature ? t(feature) : '');

  return (
    <>
      <div className="pro-gate-banner" onClick={() => setModalOpen(true)}>
        <span className="pro-gate-banner__icon">🔒</span>
        <span className="pro-gate-banner__text">
          <strong>{t('pro_gate_available') || 'Available in Pro version.'}</strong>
          {resolvedLabel && ` «${resolvedLabel}» — `}
          <button className="pro-gate-banner__link">{t('pro_gate_link') || 'Upgrade to Pro →'}</button>
        </span>
      </div>
      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature={resolvedLabel}
      />
    </>
  );
}

export function ProBanner({ feature, label }) {
  const { t } = useI18n();
  const [modalOpen, setModalOpen] = useState(false);

  const resolvedLabel = label || (t(feature) !== feature ? t(feature) : '');

  return (
    <>
      <div className="pro-gate-banner" onClick={() => setModalOpen(true)}>
        <span className="pro-gate-banner__icon">🔒</span>
        <span className="pro-gate-banner__text">
          <strong>{t('pro_gate_available') || 'Available in Pro version.'}</strong>
          {resolvedLabel && ` «${resolvedLabel}» — `}
          <button className="pro-gate-banner__link">{t('pro_gate_link') || 'Upgrade to Pro →'}</button>
        </span>
      </div>
      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        feature={resolvedLabel}
      />
    </>
  );
}
