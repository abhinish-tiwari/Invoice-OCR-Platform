# 🎨 Invoice OCR Platform - HTML/CSS Prototypes

Interactive, production-ready HTML/CSS prototypes for the Invoice OCR Platform.

## 📦 What's Included

### **6 Complete Prototypes**
1. **Login Page** (`login.html`) - User authentication
2. **Register Page** (`register.html`) - New user registration
3. **Dashboard** (`dashboard.html`) - Main analytics dashboard
4. **Invoices List** (`invoices.html`) - Invoice management
5. **Upload Invoice** (`upload.html`) - Drag & drop upload
6. **Admin Review** (`admin-review.html`) - OCR data review & correction

### **Design System**
- `css/design-system.css` - Design tokens (colors, spacing, typography)
- `css/components.css` - Reusable components (buttons, cards, forms, badges)
- `css/layout.css` - Layout components (navbar, sidebar, grid)

## 🚀 Quick Start

### **View Prototypes**

1. **Open in Browser:**
   ```bash
   # Navigate to prototypes folder
   cd Invoice-OCR-Platform/prototypes
   
   # Open index page
   open index.html
   # or
   python3 -m http.server 8000
   # Then visit: http://localhost:8000
   ```

2. **Browse All Prototypes:**
   - Start at `index.html` for an overview
   - Click any prototype card to view
   - Navigate between pages using the sidebar

### **For Designers**

Use these prototypes as reference for Figma:
1. Open any HTML file in browser
2. Inspect elements to see exact measurements
3. Copy color codes from `css/design-system.css`
4. Use the same spacing system (8px grid)

## 🎨 Design System

### **Colors**

```css
/* Primary */
--primary-600: #0284c7  /* Main brand color */
--primary-700: #0369a1  /* Hover states */

/* Semantic */
--success: #10b981      /* Success states */
--warning: #f59e0b      /* Warning states */
--error: #ef4444        /* Error states */
--info: #3b82f6         /* Info states */

/* Neutral */
--gray-50: #f9fafb      /* Backgrounds */
--gray-900: #111827     /* Text */
```

### **Typography**

```css
Font Family: Inter, -apple-system, sans-serif

Font Sizes:
- xs: 12px
- sm: 14px
- base: 16px
- lg: 18px
- xl: 20px
- 2xl: 24px
- 3xl: 30px
- 4xl: 36px
```

### **Spacing (8px Grid)**

```css
--space-1: 4px
--space-2: 8px
--space-3: 12px
--space-4: 16px
--space-6: 24px
--space-8: 32px
--space-10: 40px
--space-12: 48px
--space-16: 64px
```

### **Border Radius**

```css
--radius-sm: 4px
--radius-md: 8px
--radius-lg: 12px
--radius-xl: 16px
--radius-full: 9999px
```

## 🧩 Components

### **Buttons**

```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-success">Success Button</button>
<button class="btn btn-danger">Danger Button</button>

<!-- Sizes -->
<button class="btn btn-primary btn-sm">Small</button>
<button class="btn btn-primary">Default</button>
<button class="btn btn-primary btn-lg">Large</button>
```

### **Cards**

```html
<div class="card">
  <div class="card-header">
    <h3 class="card-title">Card Title</h3>
  </div>
  <div class="card-body">
    Card content goes here
  </div>
</div>
```

### **Forms**

```html
<div class="form-group">
  <label class="form-label" for="input">Label</label>
  <input type="text" id="input" class="form-input" placeholder="Placeholder">
</div>
```

### **Badges**

```html
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
```

## 📐 Layout System

### **Sidebar Layout**

```html
<div class="app-layout">
  <aside class="sidebar">
    <!-- Sidebar content -->
  </aside>
  <main class="main-content">
    <!-- Page content -->
  </main>
</div>
```

### **Grid System**

```html
<div class="grid grid-cols-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- Available: grid-cols-1, grid-cols-2, grid-cols-3, grid-cols-4 -->
```

## 🎯 Screen Specifications

### **1. Login Page**
- **Purpose:** User authentication
- **Key Features:**
  - Email/password form
  - Remember me checkbox
  - Forgot password link
  - Sign up link
- **Dimensions:** Centered card (440px max-width)

### **2. Register Page**
- **Purpose:** New user registration
- **Key Features:**
  - Full name, email, company, password fields
  - Terms & conditions checkbox
  - Sign in link
- **Dimensions:** Centered card (440px max-width)

### **3. Dashboard**
- **Purpose:** Main analytics overview
- **Key Features:**
  - 4 stat cards (spend, savings, invoices, reviews)
  - 2 chart placeholders
  - Recent invoices list
  - Sidebar navigation
- **Layout:** Sidebar + main content

### **4. Invoices List**
- **Purpose:** Browse and manage invoices
- **Key Features:**
  - Search bar
  - Status and supplier filters
  - Sortable table
  - Pagination
  - Action buttons (view, download, edit)
- **Layout:** Sidebar + main content

### **5. Upload Invoice**
- **Purpose:** Upload invoices for OCR processing
- **Key Features:**
  - Drag & drop zone
  - File browser
  - Upload progress
  - Processing status
- **Layout:** Sidebar + centered content

### **6. Admin Review**
- **Purpose:** Review and correct OCR data
- **Key Features:**
  - Split view (preview + form)
  - Confidence indicators
  - Editable line items
  - Approve/reject actions
- **Layout:** Sidebar + 2-column grid

## 📱 Responsive Design

All prototypes are designed for desktop (1280px+). For mobile:
- Sidebar collapses to hamburger menu
- Grid columns stack vertically
- Tables become scrollable
- Forms remain full-width

## 🔄 Converting to Figma

### **Method 1: Manual Recreation**
1. Create artboards matching screen dimensions
2. Use color codes from design system
3. Follow spacing system (8px grid)
4. Recreate components as Figma components

### **Method 2: HTML to Figma Plugin**
1. Install "HTML to Figma" plugin
2. Copy HTML from prototype
3. Import into Figma
4. Clean up and organize layers

### **Method 3: Screenshot + Trace**
1. Take screenshots of prototypes
2. Import to Figma
3. Trace over with Figma elements
4. Use exact measurements from CSS

## 📝 Next Steps

1. ✅ Review all prototypes in browser
2. ✅ Note any design changes needed
3. ✅ Create Figma file with same structure
4. ✅ Build component library in Figma
5. ✅ Create all screens in Figma
6. ✅ Add interactions and prototyping
7. ✅ Share with development team

## 🆘 Need Help?

- **View source code:** Right-click → View Page Source
- **Inspect elements:** Right-click → Inspect Element
- **Copy styles:** Use browser DevTools to see exact CSS

## 📞 Questions?

See the main project documentation:
- **Main README:** `../README.md`
- **Frontend Architecture:** `../documentation/architecture/FRONTEND_ARCHITECTURE.md`
- **Implementation Guide:** `../documentation/development/IMPLEMENTATION_GUIDE.md`

---

**🎉 Happy Designing!**

