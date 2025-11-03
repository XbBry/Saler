/**
 * أمثلة الاستخدام لمكون Button
 * 
 * هذا الملف يحتوي على أمثلة شاملة لاستخدام مكون Button مع جميع المتغيرات والأحجام
 * والحالات المختلفة بما في ذلك دعم RTL والنص العربي
 */

import React from 'react'
import { Button, buttonTemplates } from './ui/button'
import { 
  Home, 
  Settings, 
  User, 
  Download, 
  Heart, 
  Share2, 
  ArrowRight,
  Plus,
  Edit,
  Trash2,
  Save,
  Search
} from 'lucide-react'

// مثال بسيط على الاستخدام
export const BasicButtonExample = () => {
  return (
    <div className="p-4 space-y-4">
      <Button>زر أساسي</Button>
      <Button variant="destructive">حذف</Button>
      <Button variant="outline">خيار</Button>
      <Button variant="secondary">ثانوي</Button>
      <Button variant="ghost">شفاف</Button>
      <Button variant="link">رابط</Button>
    </div>
  )
}

// أمثلة الأحجام
export const SizeButtonExample = () => {
  return (
    <div className="p-4 space-x-2 flex items-center">
      <Button size="sm">صغير</Button>
      <Button size="default">متوسط</Button>
      <Button size="lg">كبير</Button>
      <Button size="icon"><Settings className="h-4 w-4" /></Button>
    </div>
  )
}

// أمثلة التحميل والحالات
export const StateButtonExample = () => {
  const [loading, setLoading] = React.useState(false)
  const [disabled, setDisabled] = React.useState(false)

  const handleClick = async () => {
    setLoading(true)
    // محاكاة عملية تحميل
    await new Promise(resolve => setTimeout(resolve, 2000))
    setLoading(false)
  }

  return (
    <div className="p-4 space-y-4">
      <Button loading loadingText="جاري الحفظ..." onClick={handleClick}>
        حفظ البيانات
      </Button>
      
      <Button disabled={disabled}>
        {disabled ? 'معطل' : 'مفعل'}
      </Button>
      
      <Button 
        variant="outline"
        loading={loading}
        onClick={() => setLoading(!loading)}
      >
        تبديل حالة التحميل
      </Button>
    </div>
  )
}

// أمثلة مع الأيقونات
export const IconButtonExample = () => {
  return (
    <div className="p-4 space-x-2">
      <Button leftIcon={<Home className="h-4 w-4" />}>
        الرئيسية
      </Button>
      
      <Button 
        rightIcon={<ArrowRight className="h-4 w-4" />}
        variant="outline"
      >
        التالي
      </Button>
      
      <Button 
        leftIcon={<Download className="h-4 w-4" />}
        rightIcon={<Heart className="h-4 w-4" />}
        variant="secondary"
      >
        تحميل مع إعجاب
      </Button>
      
      <Button 
        leftIcon={<Share2 className="h-4 w-4" />}
        variant="ghost"
      >
        مشاركة
      </Button>
    </div>
  )
}

// أمثلة RTL والبحث العربي
export const ArabicButtonExample = () => {
  return (
    <div className="p-4 space-x-2 text-right" dir="rtl">
      <Button>حفظ</Button>
      <Button variant="destructive">حذف</Button>
      <Button variant="outline">إلغاء</Button>
      <Button variant="secondary">تعديل</Button>
      <Button variant="ghost">عرض</Button>
      
      <div className="mt-4 space-x-2" dir="rtl">
        <Button 
          leftIcon={<Search className="h-4 w-4" />}
          rightIcon={<ArrowRight className="h-4 w-4" />}
        >
          البحث المتقدم
        </Button>
      </div>
    </div>
  )
}

// أمثلة العرض الكامل
export const FullWidthButtonExample = () => {
  return (
    <div className="p-4 space-y-2">
      <Button fullWidth>زر بعرض كامل</Button>
      <Button fullWidth variant="outline">زر مخطط بعرض كامل</Button>
      <Button 
        fullWidth 
        variant="secondary"
        leftIcon={<Save className="h-4 w-4" />}
      >
        حفظ جميع التغييرات
      </Button>
    </div>
  )
}

// أمثلة الاستخدام في نماذج
export const FormButtonExample = () => {
  return (
    <form className="p-4 space-y-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          البريد الإلكتروني
        </label>
        <input 
          id="email"
          type="email" 
          className="w-full px-3 py-2 border rounded-md"
          placeholder="example@email.com"
        />
      </div>
      
      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          إرسال
        </Button>
        <Button type="button" variant="outline" className="flex-1">
          إلغاء
        </Button>
      </div>
    </form>
  )
}

// أمثلة مختلفة للأنشطة
export const ActivityButtonExample = () => {
  return (
    <div className="p-4 space-x-2">
      <Button 
        variant="default"
        leftIcon={<Plus className="h-4 w-4" />}
      >
        إضافة جديد
      </Button>
      
      <Button 
        variant="outline"
        leftIcon={<Edit className="h-4 w-4" />}
      >
        تعديل
      </Button>
      
      <Button 
        variant="destructive"
        leftIcon={<Trash2 className="h-4 w-4" />}
      >
        حذف
      </Button>
      
      <Button 
        variant="ghost"
        leftIcon={<User className="h-4 w-4" />}
      >
        الملف الشخصي
      </Button>
      
      <Button 
        variant="link"
        rightIcon={<ArrowRight className="h-4 w-4" />}
      >
        اقرأ المزيد
      </Button>
    </div>
  )
}

// مثال زر متعدد الحالات
export const ComplexButtonExample = () => {
  const [state, setState] = React.useState<'idle' | 'loading' | 'success'>('idle')

  const handleComplexAction = async () => {
    setState('loading')
    
    try {
      // محاكاة عملية API
      await new Promise(resolve => setTimeout(resolve, 2000))
      setState('success')
      
      // العودة للحالة الأولى بعد 2 ثانية
      setTimeout(() => setState('idle'), 2000)
    } catch (error) {
      setState('idle')
    }
  }

  return (
    <div className="p-4">
      <Button 
        loading={state === 'loading'}
        loadingText={state === 'loading' ? 'جاري المعالجة...' : undefined}
        disabled={state !== 'idle'}
        onClick={handleComplexAction}
        leftIcon={
          state === 'success' ? '✅' : 
          state === 'loading' ? '⏳' : '🚀'
        }
        className={
          state === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
        }
      >
        {state === 'idle' && 'ابدأ العملية'}
        {state === 'loading' && 'جاري المعالجة...'}
        {state === 'success' && 'تمت العملية بنجاح!'}
      </Button>
    </div>
  )
}

// قائمة جميع القوالب الجاهزة
export const AllTemplatesExample = () => {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">الأزرار الأساسية</h3>
        <div className="flex flex-wrap gap-2">
          {buttonTemplates.primary}
          {buttonTemplates.secondary}
          {buttonTemplates.outline}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">أحجام مختلفة</h3>
        <div className="flex items-center gap-2">
          {buttonTemplates.small}
          {buttonTemplates.large}
          {buttonTemplates.icon}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">حالات خاصة</h3>
        <div className="flex flex-wrap gap-2">
          {buttonTemplates.danger}
          {buttonTemplates.ghost}
          {buttonTemplates.link}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-2">ميزات متقدمة</h3>
        <div className="space-y-2">
          {buttonTemplates.loading}
          {buttonTemplates.withIcons}
          {buttonTemplates.fullWidth}
          {buttonTemplates.disabled}
        </div>
      </div>
      
      <div dir="rtl">
        <h3 className="text-lg font-semibold mb-2">أمثلة عربية</h3>
        <div className="flex flex-wrap gap-2">
          {buttonTemplates.arabic}
          {buttonTemplates.rtl}
        </div>
      </div>
    </div>
  )
}

// تصدير جميع الأمثلة
export const ButtonExamples = {
  basic: BasicButtonExample,
  sizes: SizeButtonExample,
  states: StateButtonExample,
  icons: IconButtonExample,
  arabic: ArabicButtonExample,
  fullWidth: FullWidthButtonExample,
  form: FormButtonExample,
  activities: ActivityButtonExample,
  complex: ComplexButtonExample,
  all: AllTemplatesExample,
}