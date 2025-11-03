import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import { cn } from "../../lib/utils"

// متغيرات الأنماط (Variants) للمكون
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// واجهة الـ Props للمكون
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  loadingText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  fullWidth?: boolean
}

// المكون الرئيسي
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      loadingText,
      leftIcon,
      rightIcon,
      fullWidth,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // إعدادات RTL للنص العربي
    const isArabic = typeof children === 'string' && /[\u0600-\u06FF]/.test(children)
    
    const Comp = asChild ? Slot : "button"
    
    // حساب الحالة المعطلة (disabled)
    const isDisabled = disabled || loading

    return (
      <Comp
        className={cn(
          buttonVariants({ variant, size, className }),
          {
            "w-full": fullWidth,
            "text-right": isArabic, // دعم RTL للنص العربي
            "cursor-not-allowed opacity-70": isDisabled,
          }
        )}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {/* أيقونة التحميل */}
        {loading && (
          <Loader2 
            className={cn(
              "mr-2 h-4 w-4 animate-spin",
              {
                "mr-0 ml-2": isArabic, // عكس اتجاه الأيقونة في RTL
              }
            )} 
          />
        )}
        
        {/* الأيقونة اليسرى */}
        {!loading && leftIcon && (
          <span 
            className={cn(
              "mr-2",
              {
                "mr-0 ml-2": isArabic, // عكس اتجاه الأيقونة في RTL
              }
            )}
          >
            {leftIcon}
          </span>
        )}
        
        {/* نص الزر أو المحتوى */}
        <span className="truncate">
          {loading && loadingText ? loadingText : children}
        </span>
        
        {/* الأيقونة اليمنى */}
        {!loading && rightIcon && (
          <span 
            className={cn(
              "ml-2",
              {
                "ml-0 mr-2": isArabic, // عكس اتجاه الأيقونة في RTL
              }
            )}
          >
            {rightIcon}
          </span>
        )}
      </Comp>
    )
  }
)

Button.displayName = "Button"

// تصدير المكون ومتغيراته
export { Button, buttonVariants }

// الأنواع المساعدة للاستخدام في TypeScript
export type ButtonVariant = "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
export type ButtonSize = "default" | "sm" | "lg" | "icon"

// قالب سريع للمتغيرات المختلفة
export const buttonTemplates = {
  // زر أساسي
  primary: <Button variant="default">الزر الأساسي</Button>,
  
  // زر خطير (للحذف)
  danger: <Button variant="destructive">حذف</Button>,
  
  // زر بالمخطط
  outline: <Button variant="outline">خيار</Button>,
  
  // زر ثانوي
  secondary: <Button variant="secondary">خيار ثانوي</Button>,
  
  // زر شفاف
  ghost: <Button variant="ghost">نص فقط</Button>,
  
  // رابط
  link: <Button variant="link">رابط</Button>,
  
  // زر صغير
  small: <Button size="sm">صغير</Button>,
  
  // زر كبير
  large: <Button size="lg">كبير</Button>,
  
  // زر أيقونة فقط
  icon: <Button size="icon" aria-label="إعدادات"><span>⚙️</span></Button>,
  
  // زر مع تحميل
  loading: <Button loading loadingText="جاري التحميل...">زر مع تحميل</Button>,
  
  // زر مع أيقونات
  withIcons: (
    <Button 
      leftIcon={<span>📁</span>} 
      rightIcon={<span>→</span>}
    >
      مع أيقونات
    </Button>
  ),
  
  // زر بعرض كامل
  fullWidth: <Button fullWidth>عرض كامل</Button>,
  
  // زر معطّل
  disabled: <Button disabled>معطّل</Button>,
  
  // مثال عربي
  arabic: <Button variant="default">زر عربي</Button>,
  
  // مثال RTL
  rtl: <Button variant="outline" className="text-right">زر RTL</Button>,
}