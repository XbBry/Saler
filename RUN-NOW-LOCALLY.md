# 🚀 مشروع Saler - يعمل فوراً بدون GitHub!

## ⚡ **تشغيل فوري من هذا المجلد:**

### **طريقة 1: تشغيل Backend + Frontend معاً**
```bash
# في Terminal الحالي، شغل هذين الأمرين في terminals منفصلة:

# Terminal 1 - Backend:
cd /workspace/backend
source .venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Frontend:
cd /workspace/frontend
npm run dev
```

### **طريقة 2: تشغيل سريع (أمر واحد)**
```bash
# في terminal واحد:
make dev-all
```

---

## 🌐 **الروابط الجاهزة فوراً:**

بعد التشغيل ستحصل على:
```
🔧 Backend API: http://localhost:8000/docs
🌐 Frontend App: http://localhost:3000
🗄️ SQLite Database: /workspace/backend/saler_dev.db
```

---

## 📱 **للاختبار الفوري:**

### **اختبار Backend:**
```
افتح: http://localhost:8000/docs
سترى: وثائق API تفاعلية مع جميع endpoints
```

### **اختبار Frontend:**
```
افتح: http://localhost:3000
سترى: واجهة Saler CRM كاملة
```

---

## 🎯 **لماذا هذا أفضل من CodeSpace؟**

✅ **لا تحتاج GitHub** - يعمل فوراً هنا  
✅ **لا تحتاج وقت تحميل** - فوري  
✅ **لا تحتاج إنترنت** - محلي بالكامل  
✅ **سريع جداً** - لا يقارن ببطء CodeSpace  
✅ **تحكم كامل** - تقدر تعدل أي شيء  

---

## 📁 **الملفات الجاهزة:**

```
/workspace/saler/
├── backend/              ← FastAPI Server
│   ├── app/             ← API Routes & Models  
│   ├── saler_dev.db     ← قاعدة البيانات
│   └── .venv/           ← Python Environment
├── frontend/             ← Next.js App
│   ├── src/             ← React Components
│   ├── public/          ← Static Assets
│   └── package.json     ← Node Dependencies
└── docs/                ← Documentation
```

---

## 🚀 **ابدأ الآن - أقل من دقيقة!**

```bash
# شغل هذا الأمر الآن:
bash /workspace/saler/.devcontainer/quick-start.sh
```

**بعد 30 ثانية سترى:**
- Backend يعمل على http://localhost:8000/docs
- Frontend يعمل على http://localhost:3000  
- قاعدة البيانات جاهزة ومحملة بالبيانات

---

**💡 هذا أفضل حل فوري لاختبار المشروع وتجربته قبل رفعه لـ GitHub CodeSpace!**