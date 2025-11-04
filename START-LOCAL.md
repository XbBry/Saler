# 🚀 دليل التشغيل المحلي - Saler CRM Platform

## طرق التشغيل المتاحة:

### 1️⃣ **طريقة npm (الأسهل) - Frontend فقط**
```bash
cd frontend
npm install
npm run dev
```
**يعمل على:** http://localhost:3000

### 2️⃣ **طريقة Docker (الأقوى) - كامل النظام**

#### التشغيل:
```bash
docker-compose up -d
```

#### الوصول للتطبيقات:
- 🌐 **Frontend:** http://localhost:3000
- 🔧 **Backend API:** http://localhost:8000
- 📊 **pgAdmin (قاعدة البيانات):** http://localhost:8080
- ⚡ **Redis Commander:** http://localhost:8081

#### إيقاف النظام:
```bash
docker-compose down
```

### 3️⃣ **تشغيل الخدمات بشكل منفصل:**

#### Backend فقط:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

#### Frontend فقط:
```bash
cd frontend
npm install
npm run dev
```

## 📋 **متطلبات النظام:**
- Node.js 18+ (لـ Frontend)
- Python 3.9+ (لـ Backend)  
- Docker & Docker Compose
- 4GB RAM على الأقل
- 10GB مساحة تخزين

## 🔍 **فحص الحالة:**
```bash
# فحص حالة الخدمات
docker-compose ps

# فحص السجلات
docker-compose logs -f frontend
docker-compose logs -f backend
```

## ⚠️ **ملاحظات:**
- تأكد من وجود Docker Desktop مثبت
- For Windows: استخدم Docker Desktop for Windows
- For Mac: استخدم Docker Desktop for Mac
- For Linux: تأكد من Docker daemon يعمل

## 🎯 **التوصية:**
للاستخدام اليومي: **Docker الطريقة الأفضل**
- لا حاجة لتثبيت Node/Python محلياً
- إدارة سهلة للخدمات
- بيئة معزولة ومتسقة
