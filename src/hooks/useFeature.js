/**
 * useFeature — React hook for QoraCRM Lite / Pro feature gating.
 *
 * Reads the plan data injected by PHP via wp_localize_script into
 * window.qoraCrmData and exposes helper functions / values.
 *
 * Usage:
 *   const { isPro, isAvailable, getLimit, plan, trialDaysLeft } = useFeature();
 *
 *   // Check a boolean feature flag:
 *   if (!isAvailable('form_quiz_mode')) { show lock; }
 *
 *   // Check a numeric limit:
 *   if (formsCount >= getLimit('forms')) { block creation; }
 */

/**
 * Helper to get current active plan, respecting security downgrade flag
 */
export function getCurrentPlan() {
  if (typeof localStorage !== 'undefined' && localStorage.getItem('qora_sec_downgrade') === '1') {
    return 'lite';
  }
  return window.qoraCrmData?.plan || 'lite';
}

export function checkIsPro() {
  const p = getCurrentPlan();
  return p === 'pro' || p === 'trial';
}

const data = window.qoraCrmData || {};

/** Current plan: 'lite' | 'trial' | 'pro' */
export const plan = getCurrentPlan();

/** Trial days remaining (0 if not on trial) */
export const trialDaysLeft = data.trialDaysLeft || 0;

/** Whether the trial has already been used on this domain */
export const hasUsedTrial = data.hasUsedTrial || false;

/** Full features map from the server */
export const features = data.features || {};

/**
 * Returns true if the current plan is Pro or Trial.
 */
export const isPro = checkIsPro();

/**
 * Returns true if the given feature is available in the current plan.
 */
export function isAvailable(featureKey) {
  if (featureKey === 'limits') return true;
  if (!checkIsPro()) return false;
  return !!features[featureKey];
}

/**
 * Returns the numeric limit for a resource in the current plan.
 * Default returns Infinity (unlimited) for Free.
 */
export function getLimit(resource) {
  if (window.QoraCRM?.getLimit) {
    return window.QoraCRM.getLimit(resource);
  }
  return Infinity;
}

/**
 * Returns true if the given count has reached (or exceeded) the limit.
 * Default returns false (no limit) for Free.
 */
export function isLimitReached(resource, currentCount) {
  if (window.QoraCRM?.isLimitReached) {
    return window.QoraCRM.isLimitReached(resource, currentCount);
  }
  return false;
}

/**
 * Hook version — same values available as a hook for component usage.
 */
export function useFeature() {
  const currentPlan = getCurrentPlan();
  const currentIsPro = currentPlan === 'pro' || currentPlan === 'trial';

  return {
    plan: currentPlan,
    isPro: currentIsPro,
    trialDaysLeft,
    hasUsedTrial,
    features,
    isAvailable,
    getLimit,
    isLimitReached,
  };
}

export default useFeature;
