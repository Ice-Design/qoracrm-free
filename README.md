# QoraCRM – Sales CRM, Lead Generation & Advanced Form Builder

A powerful WordPress CRM with an advanced drag-and-drop form builder. Generate leads, track sales via Kanban, automate workflows, and chat with customers inside your WordPress dashboard.

[![Watch QoraCRM Video](https://img.youtube.com/vi/PBklrQk69eY/maxresdefault.jpg)](https://www.youtube.com/watch?v=PBklrQk69eY)

> 📺 **[Watch the full QoraCRM Video Walkthrough on YouTube](https://www.youtube.com/watch?v=PBklrQk69eY)**

[Website](https://qoracrm.com) | [Documentation](https://qoracrm.com/docs/) | [Live Demo](https://demo.qoracrm.com) | [Get Support](https://qoracrm.com/contact/)

---

## 🚀 Overview

**QoraCRM** is a complete, self-hosted Customer Relationship Management (CRM) system designed to help you capture leads, manage sales pipelines, automate workflows, and boost conversions. Built entirely for WordPress, it combines a **powerful drag-and-drop form builder** with a full-featured **Kanban board**, a **visual node-based automation engine**, and a **multichannel live chat inbox** — eliminating the need for expensive third-party SaaS solutions.

Whether you need a simple contact form, an advanced multi-step sales funnel, an automated lead routing pipeline, or a comprehensive sales pipeline manager, QoraCRM covers it all. Your data stays 100% on your server with zero external cloud dependencies for lead storage.

---

## ✨ Powerful Features in the Free Version

* **Visual Workflow Automations (Beta):** Build automated lead pipelines using an intuitive node canvas. Auto-assign tags, update Kanban stages, log internal comments, dispatch email notifications with custom templates, and trigger instant Telegram alerts when leads are captured or updated.
* **Visual Email Template Designer:** Design beautiful notification emails with dynamic placeholder merge tags (`{lead.name}`, `{lead.email}`, `{lead.phone}`, `{form.title}`) directly inside the automations builder.
* **One-Click Imports & Migrations:** Easily import forms, fields, and history from Elementor, Fluent Forms, WPForms, Ninja Forms, Gravity Forms, Contact Form 7 (Flamingo), Formidable Forms, Forminator, SureForms, and CSV files.
* **Seamless Form Interceptors:** Intercept incoming submissions from popular plugins (Elementor, CF7, WPForms, Fluent Forms, Formidable, Forminator, Gravity, Ninja, SureForms) and route them straight into your CRM without modifying existing forms.
* **Drag & Drop Form Builder:** Create sales forms, lead capture forms, and contact forms without writing code.
* **Kanban CRM Pipeline:** Visually manage your leads and sales pipeline using an intuitive Kanban board.
* **Filter & Search Data:** Filter data in the Kanban board based on date range, status, tags, source forms, and assigned team members.
* **Lead Capturing & Alerts:** Automatically save form submissions as structured Leads in your CRM with instant email and Telegram notifications.
* **User Activity Log:** Track lead interactions, status transitions, and audit notes.
* **Dashboard Analytics (Lite):** Visual dashboard to track performance with default widgets: Overview Statistics, Leads Over Time, Lead Sources (UTM), Sales Funnel, and Top Performing Forms.
* **Spam Protection:** Multi-layer protection including Honeypot, Google reCAPTCHA (v2/v3), hCaptcha, and Cloudflare Turnstile.
* **Inbound API & Webhooks:** Generate leads from external sources via REST API and forward leads to external services or webhook endpoints.
* **Dynamic Styling & Conditional Logic:** Show or hide fields conditionally, customize typography, colors, borders, and button styles.
* **Popup Trigger Button:** Display your forms inside interactive modal popups triggered by buttons or links.
* **100% Data Privacy:** All leads, forms, and logs remain securely stored in your WordPress database.

---

## ⚡ Pro Version Features (QoraCRM Pro)

* **Multichannel Live Chat & Unified Inbox (Beta):** Manage all customer conversations directly inside WordPress. Communicate via on-site Live Chat, WhatsApp, Telegram, Viber, and Meta (Facebook Messenger & Instagram Direct). Convert chat visitors into CRM leads in 1 click.
* **Advanced Automation Actions:** Extend workflows with sales manager auto-assignment, CRM task creation, outgoing HTTP webhooks, WhatsApp messaging, Meta Conversions API (CAPI), and Google Analytics 4 (GA4) event tracking.
* **WhatsApp Instant Lead Notifications:** Connect via QR code to receive real-time lead alerts directly on WhatsApp.
* **Website Live Chat Widget:** Customizable floating widget with office hours scheduling, online/offline status handling, and offline contact capture.
* **Advanced CRM Workflows:** Unlimited statuses, unlimited tags, tasks, lead assignments, full inline lead editing, and lead payments.
* **Bulk Actions:** Change status, assign users, add tags, and delete entries in bulk.
* **Advanced Dashboard Analytics:** Unlock Pro widgets (Revenue Dynamics, Managers Efficiency, My Tasks, User Tasks, Submissions by Country map) with full drag-and-drop customization.
* **Multi-Step & Quiz Forms:** Multi-step forms with progress bars and dynamic quiz navigation.
* **Calculator & Dynamic Choices:** Create custom calculator formulas and populate dropdowns/radios with Posts, Pages, Categories, or Taxonomies.
* **Stripe Payments:** Accept payments, deposits, and sell products directly within your sales forms.
* **Abandoned Form Recovery:** Capture partial leads and follow up with users who didn't finish filling out the form.
* **Advanced Fields:** File Uploads, Repeaters, Range Sliders, and Pricing/Product fields.
* **Floating Action Button:** Display form trigger popups as a floating button on your website.
* **Role-Based Access Control & CSV Export:** Granular role permissions and full lead CSV exports.

---

## 📋 Included Form Fields

| Free Version Fields | Pro Version Fields |
| :--- | :--- |
| Text Input | Calculator Field |
| Name & Text Area | Dynamic Choice Data (Posts, Taxonomies) |
| Email & Numeric | Pricing & E-Commerce (Product, Quantity, Total) |
| Phone (with GeoIP & Country flags) & Website URL | Stripe Payment Gateway Integration |
| Dropdown, Radio, Checkbox | Multi-Step Quiz Forms & Save-and-Continue |
| Heading/Title, Custom HTML | File & Image Uploads |
| Address, Date, Time | Repeater Fields & Range Sliders |
| Consent / GDPR Agreement | Abandoned Form Recovery |
| Conditional Logic & Custom Tooltips | Full Inline Lead Editing & Task Management |

---

## 🔗 Integrations & Third-Party Services

QoraCRM integrates with external services for security, payment processing, notifications, and analytics:

1. **QoraCRM Service API (`services.qoracrm.com`):** Optional promotion announcements and opt-in feedback/license checks. ([Privacy Policy](https://qoracrm.com/privacy-policy/))
2. **WhatsApp QR Gateway Service (`services.qoracrm.com` / `api.qoracrm.com`):** Relays notifications and pairing to connected WhatsApp. ([Privacy Policy](https://qoracrm.com/privacy-policy/))
3. **Telegram Bot API (`api.telegram.org`):** Real-time lead notifications and live chat messaging. ([Privacy Policy](https://telegram.org/privacy))
4. **Viber Bot API (`chatapi.viber.com`):** Two-way visitor messaging and bot notifications. ([Privacy Policy](https://www.viber.com/terms/viber-privacy-policy/))
5. **Meta Graph & Conversions API (`graph.facebook.com`):** Messenger/Instagram messaging and Meta CAPI conversion tracking. ([Privacy Policy](https://www.facebook.com/privacy/policy/))
6. **Google Analytics 4 Measurement Protocol (`google-analytics.com`):** Server-side lead conversion tracking. ([Privacy Policy](https://policies.google.com/privacy))
7. **Google reCAPTCHA (`google.com`):** Anti-spam protection. ([Privacy & Terms](https://policies.google.com/privacy))
8. **Cloudflare Turnstile (`cloudflare.com`):** Smart privacy-preserving captcha protection. ([Privacy Policy](https://www.cloudflare.com/privacypolicy/))
9. **hCaptcha (`hcaptcha.com`):** Privacy-focused captcha protection. ([Privacy Policy](https://www.hcaptcha.com/privacy))
10. **Stripe.js (`stripe.com`):** Secure payment processing fields (Pro). ([Privacy Policy](https://stripe.com/privacy))
11. **GeoIP Services (`ipapi.co` / `ip-api.com`):** IP geolocation lookup for automatic country code detection in phone inputs. ([ipapi Privacy](https://ipapi.co/privacy/))

---

## 🛠️ Build Instructions & Development

The QoraCRM frontend is built using **React** and **Vite**. The compiled JavaScript assets are generated into `../qoracrm/dist/assets/index.js`.

### Requirements:
- Node.js (v18 or higher)
- npm (v9 or higher)

### Quick Start:
```bash
# 1. Navigate to the free frontend directory
cd qoracrm-free

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Build for production (outputs to ../qoracrm/dist/assets/index.js)
npm run build
```

---

## ❓ Frequently Asked Questions

**Q: Does QoraCRM work with my WordPress theme?**  
*A: Yes! QoraCRM forms inherit your active theme's styling and are responsive out of the box.*

**Q: Is the CRM and Automations functionality completely free?**  
*A: Yes! Core CRM features, including form building, visual automations (email, telegram, status, tags), and Kanban pipeline management, are 100% free.*

**Q: Is my lead data private and safe?**  
*A: Absolutely. QoraCRM is 100% self-hosted. All lead data stays in your local WordPress database—never on external SaaS servers.*

---

## 📄 License

QoraCRM Free is open-source software licensed under [GPLv2 or later](https://www.gnu.org/licenses/gpl-2.0.html).
