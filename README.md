# QoraCRM – Sales CRM, Lead Generation & Advanced Form Builder

A powerful WordPress CRM with an advanced drag-and-drop form builder. Generate leads, track sales via Kanban, and close deals inside your WordPress dashboard.

[Website](https://qoracrm.com) | [Documentation](https://qoracrm.com/docs/) | [Live Demo](https://demo.qoracrm.com) | [Get Support](https://qoracrm.com/contact/)

---

## 🚀 Overview

**QoraCRM** is a complete, self-hosted Customer Relationship Management (CRM) system designed to help you capture leads, manage sales pipelines, and boost conversions. Built entirely for WordPress, it combines a **powerful drag-and-drop form builder** with a full-featured **Kanban board**, eliminating the need for expensive third-party SaaS solutions.

Whether you need a simple contact form, an advanced multi-step sales funnel, or a comprehensive sales pipeline manager, QoraCRM covers it all. Your data stays 100% on your server.

---

## ✨ Powerful Features in the Free Version

* **One-Click Imports & Migrations:** Easily import forms and leads from Elementor, Fluent Forms, WPForms, Ninja Forms, Gravity Forms, Contact Form 7 (Flamingo), Formidable Forms, Forminator, SureForms, and CSV files.
* **Drag & Drop Form Builder:** Create sales forms, lead capture forms, and contact forms without writing code.
* **Kanban CRM:** Visually manage your leads and sales pipeline using an intuitive Kanban board.
* **Filter Data:** Filter data in the Kanban board based on date range, status, tags, form, and users.
* **Lead Capturing:** Automatically save form submissions as Leads in your CRM.
* **Lead Notification:** Instant alerts for you and your sales team when a new lead is captured.
* **User Activity Log:** Track user activity in the CRM.
* **Dashboard Analytics (Lite):** Visual dashboard to track your performance with default widgets like Overview Statistics, Leads Over Time, Lead Sources (UTM), Sales Funnel, and Top Performing Forms.
* **Spam Protection:** Built-in support for Honeypot, Google reCAPTCHA, hCaptcha, and Cloudflare Turnstile.
* **Inbound API & Webhooks:** Generate leads from external sources via API and send notifications to external services like Telegram, Make, etc.
* **Email/SMTP Notification:** Send notifications to admin/user using email templates.
* **Form Logic & Icons:** Show/hide fields dynamically and enhance fields and buttons with custom icons directly from builder settings.
* **Popup Trigger Button:** Display your form inside a popup triggered by a click.

---

## ⚡ Pro Version Features (QoraCRM Pro)

* **Advanced CRM Workflows:** Unlimited statuses, unlimited tags, tasks, lead assignments, full inline lead data editing, and lead payments.
* **Bulk Actions:** Change status, assign users, add tags, and delete entries in bulk.
* **Advanced Dashboard Analytics:** Unlock Pro widgets (Revenue Dynamics, Managers Efficiency, My Tasks, User Tasks) with full drag-and-drop widget customization.
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
| Phone & Website URL | Stripe Payment Gateway Integration |
| Dropdown, Radio, Checkbox | Multi-Step Quiz Forms & Save-and-Continue |
| Heading/Title, Custom HTML | File & Image Uploads |
| Address, Date, Time | Repeater Fields & Range Sliders |
| Consent / GDPR Agreement | Abandoned Form Recovery |
| Conditional Logic & Custom Tooltips | Full Inline Lead Editing & Task Management |

---

## 🔗 Integrations & Third-Party Services

QoraCRM integrates seamlessly with external services for enhanced security, payment processing, and notification routing:

1. **QoraCRM Service API (`services.qoracrm.com`):** Optional promotion announcements and opt-in feedback/license checks. ([Privacy Policy](https://qoracrm.com/privacy-policy/))
2. **Google reCAPTCHA (`google.com`):** Anti-spam protection. ([Privacy & Terms](https://policies.google.com/privacy))
3. **Cloudflare Turnstile (`cloudflare.com`):** Smart privacy-preserving captcha protection. ([Privacy Policy](https://www.cloudflare.com/privacypolicy/))
4. **hCaptcha (`hcaptcha.com`):** Privacy-focused captcha protection. ([Privacy Policy](https://www.hcaptcha.com/privacy))
5. **Telegram Bot API (`api.telegram.org`):** Real-time lead notifications sent directly to your Telegram chat. ([Privacy Policy](https://telegram.org/privacy))
6. **Stripe.js (`stripe.com`):** Secure payment processing fields (Pro). ([Privacy Policy](https://stripe.com/privacy))
7. **GeoIP Services (`ipapi.co` / `ip-api.com`):** IP geolocation lookup for automatic country code detection in phone inputs. ([ipapi Privacy](https://ipapi.co/privacy/))

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

**Q: Is the CRM functionality completely free?**  
*A: Yes! Core CRM features, including form building and lead management on the Kanban board, are 100% free.*

**Q: Is my lead data private and safe?**  
*A: Absolutely. QoraCRM is 100% self-hosted. All lead data stays in your local WordPress database—never on external SaaS servers.*

---

## 📄 License

QoraCRM Free is open-source software licensed under [GPLv2 or later](https://www.gnu.org/licenses/gpl-2.0.html).
