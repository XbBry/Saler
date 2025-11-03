import React from 'react';
import { 
  Mail, 
  User, 
  MessageSquare, 
  DollarSign, 
  Settings, 
  AlertCircle,
  CheckCircle,
  ExternalLink,
  Calendar,
  Phone,
  MapPin
} from 'lucide-react';
import { NotificationData, NotificationType } from './NotificationTypes';

interface EmailNotificationProps {
  notification: NotificationData;
  recipientEmail: string;
  recipientName?: string;
  unsubscribeUrl?: string;
  logoUrl?: string;
  companyName?: string;
  theme?: 'light' | 'dark';
}

// مكون قالب الإيميل الأساسي
function EmailTemplate({ 
  children, 
  logoUrl, 
  companyName = 'نظام إدارة المبيعات',
  theme = 'light'
}: {
  children: React.ReactNode;
  logoUrl?: string;
  companyName?: string;
  theme?: 'light' | 'dark';
}) {
  const backgroundColor = theme === 'dark' ? '#1f2937' : '#f9fafb';
  const textColor = theme === 'dark' ? '#f9fafb' : '#111827';
  const cardBg = theme === 'dark' ? '#374151' : '#ffffff';
  const cardBorder = theme === 'dark' ? '#4b5563' : '#e5e7eb';

  return (
    <div style={{ 
      backgroundColor, 
      color: textColor, 
      fontFamily: 'Arial, sans-serif',
      direction: 'rtl',
      textAlign: 'right'
    }}>
      <div style={{ 
        maxWidth: '600px', 
        margin: '0 auto', 
        padding: '20px',
        backgroundColor: cardBg,
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        {/* رأس الإيميل */}
        <div style={{ 
          borderBottom: `1px solid ${cardBorder}`, 
          paddingBottom: '20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={companyName}
                style={{ width: '40px', height: '40px', borderRadius: '50%' }}
              />
            ) : (
              <div style={{
                width: '40px',
                height: '40px',
                backgroundColor: '#3b82f6',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                {companyName.charAt(0)}
              </div>
            )}
            <div>
              <h2 style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                {companyName}
              </h2>
              <p style={{ margin: '0', fontSize: '12px', color: '#6b7280' }}>
                نظام إدارة المبيعات والعملاء المحتملين
              </p>
            </div>
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            {new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>

        {/* المحتوى الرئيسي */}
        <div style={{ padding: '0 10px' }}>
          {children}
        </div>

        {/* ذيل الإيميل */}
        <div style={{ 
          borderTop: `1px solid ${cardBorder}`, 
          paddingTop: '20px', 
          marginTop: '20px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p style={{ margin: '5px 0' }}>
            هذا الإيميل تم إرساله تلقائياً من {companyName}
          </p>
          <p style={{ margin: '5px 0' }}>
            <a 
              href="#" 
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              إدارة إعدادات التنبيهات
            </a>
            {' • '}
            <a 
              href="#" 
              style={{ color: '#3b82f6', textDecoration: 'none' }}
            >
              إلغاء الاشتراك
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

// أيقونة نوع التنبيه
function getNotificationIcon(type: NotificationType) {
  const iconStyle = { width: '24px', height: '24px' };
  
  switch (type) {
    case 'lead':
      return <User style={iconStyle} />;
    case 'message':
      return <MessageSquare style={iconStyle} />;
    case 'sale':
      return <DollarSign style={iconStyle} />;
    case 'system':
      return <Settings style={iconStyle} />;
    case 'error':
      return <AlertCircle style={iconStyle} />;
    case 'success':
      return <CheckCircle style={iconStyle} />;
    default:
      return <Mail style={iconStyle} />;
  }
}

// لون نوع التنبيه
function getNotificationColor(type: NotificationType) {
  switch (type) {
    case 'lead':
      return '#3b82f6'; // blue
    case 'message':
      return '#10b981'; // green
    case 'sale':
      return '#059669'; // emerald
    case 'system':
      return '#6b7280'; // gray
    case 'error':
      return '#ef4444'; // red
    case 'warning':
      return '#f59e0b'; // yellow
    case 'success':
      return '#059669'; // emerald
    default:
      return '#3b82f6'; // blue
  }
}

// قالب إشعار عميل محتمل
function LeadEmailTemplate({ notification, recipientName }: { notification: NotificationData; recipientName?: string; }) {
  const { metadata } = notification as any;
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px',
        color: getNotificationColor(notification.type)
      }}>
        {getNotificationIcon(notification.type)}
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
          {notification.title}
        </h1>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
          مرحباً {recipientName || 'عزيزي المستخدم'},
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {notification.message}
        </p>
      </div>

      {/* تفاصيل العميل المحتمل */}
      <div style={{ 
        backgroundColor: '#f3f4f6', 
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold' }}>
          تفاصيل العميل المحتمل
        </h3>
        
        <div style={{ display: 'grid', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '16px', height: '16px', color: '#6b7280' }} />
            <span style={{ fontWeight: 'bold' }}>الاسم:</span>
            <span>{metadata?.leadName}</span>
          </div>
          
          {metadata?.leadEmail && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Mail style={{ width: '16px', height: '16px', color: '#6b7280' }} />
              <span style={{ fontWeight: 'bold' }}>البريد الإلكتروني:</span>
              <span>{metadata.leadEmail}</span>
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar style={{ width: '16px', height: '16px', color: '#6b7280' }} />
            <span style={{ fontWeight: 'bold' }}>الإجراء:</span>
            <span style={{ color: getNotificationColor(notification.type) }}>
              {metadata?.action === 'new_lead' ? 'عميل محتمل جديد' :
               metadata?.action === 'lead_updated' ? 'تم التحديث' :
               metadata?.action === 'lead_assigned' ? 'تم الإسناد' :
               metadata?.action === 'lead_responded' ? 'تم الرد' :
               metadata?.action === 'lead_converted' ? 'تم التحويل' :
               metadata?.action}
            </span>
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <a 
          href="#" 
          style={{ 
            backgroundColor: getNotificationColor(notification.type),
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          <ExternalLink style={{ width: '16px', height: '16px' }} />
          عرض العميل المحتمل
        </a>
      </div>
    </div>
  );
}

// قالب إشعار رسالة
function MessageEmailTemplate({ notification, recipientName }: { notification: NotificationData; recipientName?: string; }) {
  const { metadata } = notification as any;
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px',
        color: getNotificationColor(notification.type)
      }}>
        {getNotificationIcon(notification.type)}
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
          {notification.title}
        </h1>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
          مرحباً {recipientName || 'عزيزي المستخدم'},
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {notification.message}
        </p>
      </div>

      {/* معاينة الرسالة */}
      <div style={{ 
        backgroundColor: '#f9fafb', 
        border: '1px solid #e5e7eb',
        borderRadius: '8px', 
        padding: '20px', 
        marginBottom: '20px',
        position: 'relative'
      }}>
        <div style={{ 
          position: 'absolute', 
          top: '-10px', 
          left: '20px',
          backgroundColor: '#f9fafb',
          padding: '0 10px',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          آخر رسالة
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          {metadata?.senderAvatar ? (
            <img 
              src={metadata.senderAvatar} 
              alt={metadata.senderName}
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          ) : (
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold'
            }}>
              {metadata?.senderName?.charAt(0) || 'U'}
            </div>
          )}
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <h4 style={{ margin: '0', fontWeight: 'bold' }}>
                {metadata?.senderName || 'مرسل غير معروف'}
              </h4>
              <span style={{ 
                fontSize: '12px', 
                color: '#6b7280',
                backgroundColor: '#f3f4f6',
                padding: '2px 8px',
                borderRadius: '12px'
              }}>
                {metadata?.unreadCount > 1 ? `${metadata.unreadCount} رسائل` : 'رسالة جديدة'}
              </span>
            </div>
            <p style={{ 
              margin: '0', 
              color: '#374151',
              fontSize: '14px',
              lineHeight: '1.5',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}>
              {metadata?.messagePreview || notification.message}
            </p>
          </div>
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <a 
          href="#" 
          style={{ 
            backgroundColor: getNotificationColor(notification.type),
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          <MessageSquare style={{ width: '16px', height: '16px' }} />
          الرد على الرسالة
        </a>
      </div>
    </div>
  );
}

// قالب إشعار المبيعات
function SaleEmailTemplate({ notification, recipientName }: { notification: NotificationData; recipientName?: string; }) {
  const { metadata } = notification as any;
  
  return (
    <div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px', 
        marginBottom: '20px',
        color: getNotificationColor(notification.type)
      }}>
        {getNotificationIcon(notification.type)}
        <h1 style={{ margin: '0', fontSize: '20px', fontWeight: 'bold' }}>
          {notification.title}
        </h1>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 10px 0' }}>
          مرحباً {recipientName || 'عزيزي المستخدم'},
        </p>
        <p style={{ fontSize: '16px', lineHeight: '1.6', margin: '0 0 20px 0' }}>
          {notification.message}
        </p>
      </div>

      {/* تفاصيل الصفقة */}
      <div style={{ 
        backgroundColor: '#f0fdf4', 
        border: '1px solid #bbf7d0',
        padding: '20px', 
        borderRadius: '8px', 
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '16px', fontWeight: 'bold', color: '#065f46' }}>
          تفاصيل الإنجاز
        </h3>
        
        <div style={{ display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign style={{ width: '20px', height: '20px', color: '#059669' }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{metadata?.dealName}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                القيمة: {metadata?.dealValue?.toLocaleString()} ريال
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <User style={{ width: '20px', height: '20px', color: '#059669' }} />
            <div>
              <div style={{ fontWeight: 'bold' }}>{metadata?.customerName}</div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>العميل</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle style={{ width: '20px', height: '20px', color: '#059669' }} />
            <div>
              <div style={{ fontWeight: 'bold', color: '#059669' }}>
                {metadata?.milestone === 'deal_won' ? 'تم إغلاق الصفقة' :
                 metadata?.milestone === 'payment_received' ? 'تم استلام الدفعة' :
                 metadata?.milestone === 'milestone_achieved' ? 'تم تحقيق الإنجاز' :
                 'إنجاز جديد'}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>المرحلة الحالية</div>
            </div>
          </div>
        </div>
      </div>

      {/* إحصائيات */}
      <div style={{ 
        backgroundColor: '#fef3c7', 
        border: '1px solid #fde68a',
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '5px' }}>
          تهانينا! لقد حققت إنجازاً رائعاً في المبيعات 🎉
        </div>
        <div style={{ fontSize: '12px', color: '#a16207' }}>
          استمر في العمل الممتاز
        </div>
      </div>

      {/* أزرار الإجراءات */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <a 
          href="#" 
          style={{ 
            backgroundColor: getNotificationColor(notification.type),
            color: 'white',
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold',
            marginLeft: '10px'
          }}
        >
          <ExternalLink style={{ width: '16px', height: '16px' }} />
          عرض الصفقة
        </a>
        
        <a 
          href="#" 
          style={{ 
            backgroundColor: 'transparent',
            color: getNotificationColor(notification.type),
            padding: '12px 24px',
            textDecoration: 'none',
            borderRadius: '6px',
            border: `1px solid ${getNotificationColor(notification.type)}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 'bold'
          }}
        >
          <DollarSign style={{ width: '16px', height: '16px' }} />
          تقرير المبيعات
        </a>
      </div>
    </div>
  );
}

// المكون الرئيسي
export function EmailNotification({
  notification,
  recipientEmail,
  recipientName,
  unsubscribeUrl,
  logoUrl,
  companyName,
  theme = 'light'
}: EmailNotificationProps) {
  // تحديد نوع القالب حسب نوع التنبيه
  const renderContent = () => {
    switch (notification.type) {
      case 'lead':
        return <LeadEmailTemplate notification={notification} recipientName={recipientName} />;
      case 'message':
        return <MessageEmailTemplate notification={notification} recipientName={recipientName} />;
      case 'sale':
        return <SaleEmailTemplate notification={notification} recipientName={recipientName} />;
      default:
        return (
          <div>
            <h1 style={{ margin: '0 0 20px 0', fontSize: '20px', fontWeight: 'bold' }}>
              {notification.title}
            </h1>
            <p style={{ fontSize: '16px', lineHeight: '1.6' }}>
              {notification.message}
            </p>
          </div>
        );
    }
  };

  return (
    <EmailTemplate logoUrl={logoUrl} companyName={companyName} theme={theme}>
      {renderContent()}
    </EmailTemplate>
  );
}

// مولد قوالب الإيميل
export function generateEmailHTML(notification: NotificationData, options: {
  recipientName?: string;
  companyName?: string;
  logoUrl?: string;
  theme?: 'light' | 'dark';
}) {
  // تحويل JSX إلى HTML (مبسط)
  // في التطبيق الحقيقي، ستحتاج إلى مكتبة مثل React Email أو Puppeteer
  
  const template = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>إشعار من ${options.companyName || 'نظام إدارة المبيعات'}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #f9fafb;
          direction: rtl;
          text-align: right;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background-color: white; 
          padding: 30px; 
          border-radius: 8px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header { 
          border-bottom: 1px solid #e5e7eb; 
          padding-bottom: 20px; 
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .content { 
          line-height: 1.6; 
          color: #374151; 
        }
        .footer { 
          border-top: 1px solid #e5e7eb; 
          padding-top: 20px; 
          margin-top: 20px;
          text-align: center; 
          font-size: 12px; 
          color: #6b7280;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #3b82f6;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            ${options.logoUrl ? 
              `<img src="${options.logoUrl}" alt="${options.companyName}" style="width: 40px; height: 40px; border-radius: 50%;">` : 
              `<div style="width: 40px; height: 40px; background-color: #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">${(options.companyName || 'S').charAt(0)}</div>`
            }
            <div>
              <h2 style="margin: 0; font-size: 18px;">${options.companyName || 'نظام إدارة المبيعات'}</h2>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">نظام إدارة المبيعات والعملاء المحتملين</p>
            </div>
          </div>
          <div style="font-size: 12px; color: #6b7280;">
            ${new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>
        
        <div class="content">
          <h1 style="font-size: 20px; margin: 0 0 20px 0;">${notification.title}</h1>
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            مرحباً ${options.recipientName || 'عزيزي المستخدم'},
          </p>
          <p style="font-size: 16px; margin: 0 0 20px 0;">
            ${notification.message}
          </p>
          
          ${notification.actionUrl ? 
            `<div style="text-align: center; margin: 30px 0;">
              <a href="${notification.actionUrl}" class="button">${notification.actionText || 'عرض التفاصيل'}</a>
            </div>` : 
            ''
          }
        </div>
        
        <div class="footer">
          <p style="margin: 5px 0;">
            هذا الإيميل تم إرساله تلقائياً من ${options.companyName || 'نظام إدارة المبيعات'}
          </p>
          <p style="margin: 5px 0;">
            <a href="#" style="color: #3b82f6; text-decoration: none;">إدارة إعدادات التنبيهات</a> • 
            <a href="#" style="color: #3b82f6; text-decoration: none;">إلغاء الاشتراك</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return template;
}