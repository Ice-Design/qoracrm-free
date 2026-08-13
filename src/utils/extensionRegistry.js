/**
 * QoraCRM Extension Registry
 * 
 * Provides a global registry for Pro add-ons to inject their components
 * into the Lite core at runtime.
 */

import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactDOM from 'react-dom';
import * as LucideReact from 'lucide-react';

window.QoraCRM = window.QoraCRM || {};
window.QoraCRM.Extensions = window.QoraCRM.Extensions || {};
window.QoraCRM.React = React;
window.QoraCRM.ReactDOM = ReactDOM;
window.QoraCRM.ReactDOMClient = ReactDOMClient;
window.QoraCRM.LucideReact = LucideReact;

import { useI18n } from './I18nContext';
import { useSettingsStore } from '../store/useSettingsStore';

window.QoraCRM.useI18n = useI18n;
window.QoraCRM.useSettingsStore = useSettingsStore;

window.QoraCRM.registerExtension = (name, component) => {
    window.QoraCRM.Extensions[name] = component;
    
    // Dispatch an event so React components can re-render if needed
    const event = new CustomEvent('qoracrm:extension_registered', { 
        detail: { name, component } 
    });
    window.dispatchEvent(event);
};

window.QoraCRM.getExtension = (name) => {
    return window.QoraCRM.Extensions[name] || null;
};
