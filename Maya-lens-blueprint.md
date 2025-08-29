# 🎨 Produktfotografie-Tool Blueprint
## Das Jena-Prinzip - KI-gestützte Produktfotografie SaaS

---

## 📋 Projektübersicht

### 🎯 Vision & Mission
**Revolutionäres KI-Tool für Produktfotografie**, das aus einfachen Produktbildern professionelle, verkaufsfördernde Fotoshooting-Bilder generiert.

### 🚀 Core Value Proposition
- **Universell einsetzbar:** Von Schlüsselanhängern bis Möbel
- **Sekunden statt Stunden:** Professionelle Bilder in unter 30 Sekunden
- **Kosteneffizient:** $0.039 pro Bild vs. €200+ Fotograf
- **Multi-Format:** Standard + Instagram 9:16 + Custom Formats

### 📊 Business Model
- **Phase 1:** Interne Nutzung (Kosteneinsparung)
- **Phase 2:** B2B SaaS (€29-299/Monat)
- **Phase 3:** White-Label für Agenturen

---

## 🛠️ Technischer Stack

### Frontend (React Ecosystem)
```javascript
- React 18 (mit Hooks & Context)
- TypeScript (Full Type Safety)
- Vite (Build Tool - schneller als CRA)
- Tailwind CSS (Utility-First Styling)
- Framer Motion (Animations)
- React Query (Data Fetching & Caching)
- React Hook Form (Form Management)
- React Router DOM (Routing)
```

### Backend (Node.js Ecosystem)
```javascript
- Node.js 20+ (LTS)
- Express.js (Web Framework)
- TypeScript (Backend Type Safety)
- Prisma (ORM & Database Management)
- Multer (File Upload Handling)
- Sharp (Image Processing)
- JWT (Authentication)
- Bcrypt (Password Hashing)
```

### Database & Storage
```sql
- PostgreSQL (Primary Database)
- Cloudinary (Image Storage & CDN)
- Redis (Session Management & Caching)
```

### External APIs
```javascript
- Gemini 2.5 Flash Image API
- Stripe API (Future SaaS Payments)
- SendGrid (Email Notifications)
```

### Deployment
```yaml
- Railway.com (Primary Hosting)
- Docker (Containerization)
- GitHub Actions (CI/CD)
- Cloudflare (CDN & Security)
```

---

## 🏗️ System-Architektur

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │◄──►│   Express API   │◄──►│   PostgreSQL    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudinary    │    │  Gemini 2.5 API │    │     Redis       │
│  Image Storage  │    │  Image Gen/Edit │    │   Cache/Session │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture (Frontend)
```
src/
├── components/
│   ├── ui/                 # Reusable UI Components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── GlassCard.tsx   # Glassmorphism Cards
│   │   └── GradientButton.tsx
│   ├── layout/             # Layout Components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   ├── features/           # Feature-specific Components
│   │   ├── ProductUpload/
│   │   ├── ImageGeneration/
│   │   ├── ProductLibrary/
│   │   └── UserManagement/
│   └── common/             # Shared Components
├── pages/                  # Route Pages
├── hooks/                  # Custom React Hooks
├── services/              # API Services
├── contexts/              # React Contexts
├── utils/                 # Helper Functions
└── types/                 # TypeScript Definitions
```

### Backend Architecture
```
server/
├── controllers/           # Route Controllers
│   ├── auth.controller.ts
│   ├── product.controller.ts
│   ├── image.controller.ts
│   └── user.controller.ts
├── middleware/           # Express Middleware
│   ├── auth.middleware.ts
│   ├── upload.middleware.ts
│   └── validation.middleware.ts
├── services/            # Business Logic
│   ├── gemini.service.ts
│   ├── image.service.ts
│   └── cloudinary.service.ts
├── models/              # Prisma Models
├── routes/              # API Routes
├── utils/               # Helper Functions
└── types/               # TypeScript Definitions
```

---

## 🗄️ Datenmodell (Prisma Schema)

### Core Entities
```prisma
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  name        String
  avatar      String?
  role        UserRole @default(USER)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  products    Product[]
  generations ImageGeneration[]
  team        Team?    @relation(fields: [teamId], references: [id])
  teamId      String?
  
  @@map("users")
}

model Product {
  id          String   @id @default(cuid())
  name        String
  description String?
  category    String
  tags        String[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  owner       User     @relation(fields: [ownerId], references: [id])
  ownerId     String
  images      ProductImage[]
  generations ImageGeneration[]
  
  @@map("products")
}

model ProductImage {
  id        String   @id @default(cuid())
  url       String
  publicId  String   // Cloudinary Public ID
  fileName  String
  fileSize  Int
  width     Int
  height    Int
  format    String
  isMain    Boolean  @default(false)
  createdAt DateTime @default(now())
  
  // Relations
  product   Product  @relation(fields: [productId], references: [id])
  productId String
  
  @@map("product_images")
}

model ImageGeneration {
  id              String            @id @default(cuid())
  prompt          String
  style           GenerationStyle
  format          ImageFormat
  status          GenerationStatus  @default(PROCESSING)
  resultUrl       String?
  resultPublicId  String?
  geminiCost      Float?
  processingTime  Int?              // milliseconds
  errorMessage    String?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  // Relations
  user      User    @relation(fields: [userId], references: [id])
  userId    String
  product   Product @relation(fields: [productId], references: [id])
  productId String
  
  @@map("image_generations")
}

model Team {
  id        String   @id @default(cuid())
  name      String
  plan      TeamPlan @default(FREE)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  members   User[]
  
  @@map("teams")
}

// Enums
enum UserRole {
  ADMIN
  USER
}

enum GenerationStyle {
  PROFESSIONAL_STUDIO
  LIFESTYLE_SCENE
  MINIMALIST_CLEAN
  LUXURY_PREMIUM
  OUTDOOR_NATURAL
  CUSTOM
}

enum ImageFormat {
  SQUARE_1_1        // 1:1 (Instagram Post)
  STORY_9_16        // 9:16 (Instagram Story)
  LANDSCAPE_16_9    // 16:9 (Website Hero)
  PORTRAIT_4_5      // 4:5 (Instagram Feed)
  ORIGINAL          // Keep original aspect ratio
}

enum GenerationStatus {
  PROCESSING
  COMPLETED
  FAILED
}

enum TeamPlan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}
```

---

## 🔌 API-Design

### Authentication Endpoints
```typescript
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/refresh
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

### Product Management
```typescript
GET    /api/products              # Get user's products
POST   /api/products              # Create new product
GET    /api/products/:id          # Get specific product
PUT    /api/products/:id          # Update product
DELETE /api/products/:id          # Delete product
POST   /api/products/:id/images   # Upload product images
DELETE /api/products/:id/images/:imageId  # Delete product image
```

### Image Generation
```typescript
POST   /api/generate              # Generate new images
GET    /api/generate/history      # Get generation history
GET    /api/generate/:id          # Get specific generation
DELETE /api/generate/:id          # Delete generation
POST   /api/generate/:id/retry    # Retry failed generation
```

### User & Team Management
```typescript
GET    /api/users/profile         # Get user profile
PUT    /api/users/profile         # Update profile
GET    /api/teams                 # Get team info
POST   /api/teams/invite          # Invite team member
POST   /api/teams/join            # Join team
```

### Analytics & Usage
```typescript
GET    /api/analytics/overview    # Usage overview
GET    /api/analytics/costs       # Cost breakdown
GET    /api/analytics/generations # Generation statistics
```

---

## 🎨 UI/UX Design-System

### 🌈 Color Palette (Modern Gradients)
```css
/* Primary Gradients */
--gradient-primary: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--gradient-secondary: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--gradient-success: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
--gradient-warning: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
--gradient-danger: linear-gradient(135deg, #ff8a80 0%, #ea4c89 100%);

/* Background Gradients */
--gradient-bg-main: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
--gradient-bg-card: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
--gradient-bg-glass: linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 100%);

/* Text Colors */
--text-primary: #1a202c;
--text-secondary: #4a5568;
--text-muted: #718096;
--text-inverse: #ffffff;
```

### 🔮 Glassmorphism Effects
```css
.glass-card {
  background: linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.2);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.glass-button {
  background: linear-gradient(145deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.1) 100%);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.3);
  transition: all 0.3s ease;
}

.glass-button:hover {
  background: linear-gradient(145deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.2) 100%);
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(0,0,0,0.2);
}
```

### 📱 Component Design Specs

#### **Header Component**
```typescript
interface HeaderProps {
  user: User;
  onMenuToggle: () => void;
  notifications: Notification[];
}

Features:
- Glassmorphism navbar with backdrop blur
- Animated hamburger menu (mobile)
- Notification dropdown with badge
- User avatar with gradient border
- Real-time generation counter
```

#### **Product Upload Zone**
```typescript
interface UploadZoneProps {
  onFileSelect: (files: File[]) => void;
  maxFiles: number;
  acceptedFormats: string[];
  isUploading: boolean;
}

Features:
- Drag & drop with glassmorphism styling
- Animated file preview cards
- Progress indicators with gradient fills
- Error states with smooth transitions
- Multi-file selection with thumbnails
```

#### **Generation Studio**
```typescript
interface GenerationStudioProps {
  product: Product;
  onGenerate: (params: GenerationParams) => void;
  isGenerating: boolean;
}

Features:
- Split-screen layout (original vs. generated)
- Real-time style preview cards
- Format selector with visual previews
- Advanced options panel (collapsible)
- Generation queue with progress tracking
```

#### **Product Library Grid**
```typescript
interface ProductLibraryProps {
  products: Product[];
  onProductSelect: (product: Product) => void;
  onProductDelete: (id: string) => void;
  filters: LibraryFilter[];
}

Features:
- Masonry grid layout with animations
- Glassmorphism product cards
- Hover effects with image zoom
- Quick action buttons (edit/delete/generate)
- Search & filter with smooth transitions
```

### 🎭 Animation Specifications
```typescript
// Page Transitions
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Card Hover Effects
const cardVariants = {
  rest: { scale: 1, y: 0 },
  hover: { 
    scale: 1.02, 
    y: -5,
    transition: { duration: 0.2 }
  }
};

// Loading States
const pulseVariants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.5, 0.8, 0.5],
    transition: { 
      duration: 2, 
      repeat: Infinity 
    }
  }
};
```

---

## 🔐 Security & Performance

### Security Measures
- **JWT Authentication** mit Refresh Tokens
- **Rate Limiting** für API Endpoints
- **File Type Validation** für Uploads
- **CORS Configuration** für sichere API-Zugriffe
- **Environment Variables** für sensible Daten
- **SQL Injection Prevention** durch Prisma ORM

### Performance Optimierungen
- **Image Optimization** mit Sharp
- **Lazy Loading** für Produktbilder
- **React Query Caching** für API Responses
- **CDN Integration** mit Cloudinary
- **Code Splitting** mit React.lazy
- **Database Indexing** für schnelle Queries

---

## 🚀 Deployment-Strategie

### Railway.com Setup
```yaml
# railway.toml
[build]
  builder = "DOCKERFILE"
  dockerfilePath = "Dockerfile"

[deploy]
  numReplicas = 1
  sleepThreshold = "5m"
  restartPolicyType = "ON_FAILURE"

[env]
  NODE_ENV = "production"
  DATABASE_URL = "${{Postgres.DATABASE_URL}}"
  REDIS_URL = "${{Redis.REDIS_URL}}"
```

### Environment Configuration
```bash
# Production Environment Variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
GEMINI_API_KEY=...
CLOUDINARY_URL=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
SENDGRID_API_KEY=...
NODE_ENV=production
```

---

## 📊 Monitoring & Analytics

### Application Monitoring
- **Error Tracking** mit Sentry
- **Performance Monitoring** mit Railway Analytics
- **API Response Times** Tracking
- **User Behavior Analytics** mit Custom Events

### Business Metrics
- **Generation Success Rate**
- **Average Processing Time**
- **User Engagement Metrics**
- **Cost per Generation**
- **Monthly Active Users**

---

## 🎯 Success Metrics & KPIs

### Technical KPIs
- **API Response Time**: < 2 Sekunden
- **Image Generation Time**: < 30 Sekunden
- **Uptime**: > 99.5%
- **Error Rate**: < 1%

### Business KPIs
- **User Satisfaction**: > 4.5/5
- **Monthly Generations**: 10,000+
- **Cost Efficiency**: < €0.05 per Generation
- **Time Savings**: 95% vs. Traditional Photography

---

## 🔄 Development Phases

### MVP Phase (2-3 Wochen)
1. ✅ Basic Authentication System
2. ✅ Product Upload & Management
3. ✅ Gemini 2.5 Flash Integration
4. ✅ Basic Image Generation
5. ✅ Modern UI mit Glassmorphism

### Enhancement Phase (1-2 Wochen)
1. 🔄 Advanced Generation Options
2. 🔄 Team Management Features
3. 🔄 Usage Analytics Dashboard
4. 🔄 Batch Processing
5. 🔄 Export Funktionen

### Scale Phase (ongoing)
1. 🔄 SaaS Billing Integration
2. 🔄 API für Third-Party Integration
3. 🔄 White-Label Optionen
4. 🔄 Advanced Analytics
5. 🔄 Mobile App

---

**Blueprint Status: ✅ READY FOR DEVELOPMENT**
**Estimated Development Time: 2-3 Wochen MVP**
**Projected Launch: 3-4 Wochen**