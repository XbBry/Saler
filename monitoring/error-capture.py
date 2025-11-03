"""
Advanced Error Capture and Analysis System
نظام التقاط وتحليل الأخطاء المتقدم

يتتبع ويلتقط الأخطاء من مصادر متعددة مع تحليل متقدم
"""

import asyncio
import logging
import json
import traceback
import sys
import os
import hashlib
import re
import time
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union, Callable
from pathlib import Path
from dataclasses import dataclass, asdict
from functools import wraps
import inspect
import psutil
import threading
from collections import defaultdict, Counter
import sqlite3
import functools

@dataclass
class ErrorEvent:
    """حدث خطأ واحد"""
    id: str
    timestamp: datetime
    error_type: str
    message: str
    stack_trace: str
    severity: str  # low, medium, high, critical
    source: str    # python, javascript, network, database, etc.
    context: Dict[str, Any]
    occurrence_count: int = 1
    first_occurrence: Optional[datetime] = None
    last_occurrence: Optional[datetime] = None
    resolved: bool = False
    fingerprint: Optional[str] = None
    tags: List[str] = None
    
    def __post_init__(self):
        if self.first_occurrence is None:
            self.first_occurrence = self.timestamp
        if self.last_occurrence is None:
            self.last_occurrence = self.timestamp
        if self.tags is None:
            self.tags = []
        if self.fingerprint is None:
            self.fingerprint = self.generate_fingerprint()
    
    def generate_fingerprint(self) -> str:
        """إنشاء بصمة فريدة للخطأ"""
        content = f"{self.error_type}:{self.message}:{self.source}"
        return hashlib.md5(content.encode()).hexdigest()[:12]
    
    def to_dict(self) -> Dict[str, Any]:
        """تحويل إلى dictionary"""
        result = asdict(self)
        result['timestamp'] = self.timestamp.isoformat()
        result['first_occurrence'] = self.first_occurrence.isoformat()
        result['last_occurrence'] = self.last_occurrence.isoformat()
        return result

class ErrorCapture:
    """مقاطط الأخطاء الرئيسي"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._get_default_config()
        self.logger = logging.getLogger('error_capture')
        self.errors: Dict[str, ErrorEvent] = {}
        self.error_counts = defaultdict(int)
        self.patterns = {}
        self.filters = []
        self.hooks = []
        
        self._setup_handlers()
        self._load_patterns()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """الإعدادات الافتراضية"""
        return {
            'capture_exceptions': True,
            'capture_warnings': True,
            'capture_deprecations': True,
            'capture_performance_issues': True,
            'max_errors_per_type': 1000,
            'retention_days': 30,
            'enable_categorization': True,
            'enable_grouping': True,
            'enable_alerting': True,
            'severity_thresholds': {
                'low': 0,
                'medium': 5,
                'high': 10,
                'critical': 1
            },
            'ignore_patterns': [
                'KeyboardInterrupt',
                'SystemExit',
                'GeneratorExit'
            ],
            'capture_context': {
                'include_locals': False,
                'include_globals': True,
                'include_environment': True,
                'max_depth': 3
            },
            'storage': {
                'type': 'memory',  # memory, sqlite, json
                'path': 'errors.db'
            },
            'notifications': {
                'webhook_url': None,
                'email_recipients': [],
                'slack_webhook': None
            }
        }
    
    def _setup_handlers(self):
        """إعداد معالجات الأخطاء"""
        if self.config['capture_exceptions']:
            self._setup_exception_handling()
        
        if self.config['capture_warnings']:
            self._setup_warning_handling()
        
        if self.config['capture_deprecations']:
            self._setup_deprecation_handling()
        
        # إعداد معالج الإشارة
        self._setup_signal_handling()
        
        # إعداد معالج Threading
        self._setup_thread_handling()
    
    def _setup_exception_handling(self):
        """إعداد معالجة الاستثناءات"""
        # معالج الاستثناءات العام
        def handle_exception(exc_type, exc_value, exc_traceback):
            if issubclass(exc_type, KeyboardInterrupt):
                sys.__excepthook__(exc_type, exc_value, exc_traceback)
                return
            
            error_event = self._create_error_event(
                error_type=exc_type.__name__,
                message=str(exc_value),
                stack_trace=''.join(traceback.format_exception(exc_type, exc_value, exc_traceback)),
                source='python_exception',
                severity='high' if 'critical' in str(exc_value).lower() else 'medium'
            )
            
            self.capture_error(error_event)
        
        sys.excepthook = handle_exception
    
    def _setup_warning_handling(self):
        """إعداد معالجة التحذيرات"""
        def warning_handler(message, category, filename, lineno, file=None, line=None):
            # تجاهل بعض التحذيرات غير المهمة
            if any(pattern in str(message).lower() for pattern in ['deprecation', 'futurewarning']):
                return
            
            error_event = self._create_error_event(
                error_type=category.__name__,
                message=str(message),
                stack_trace=f"Warning in {filename}:{lineno}",
                source='warning',
                severity='low'
            )
            
            self.capture_error(error_event)
        
        # تثبيت معالج التحذيرات
        warnings.showwarning = warning_handler
    
    def _setup_deprecation_handling(self):
        """إعداد معالجة التحذيرات المتقادمة"""
        warnings.filterwarnings('default', category=DeprecationWarning)
        warnings.filterwarnings('default', category=FutureWarning)
    
    def _setup_signal_handling(self):
        """إعداد معالج الإشارات"""
        import signal
        
        def signal_handler(signum, frame):
            error_event = self._create_error_event(
                error_type='Signal',
                message=f'Received signal {signum}',
                stack_trace=''.join(traceback.format_stack(frame)),
                source='signal',
                severity='critical'
            )
            
            self.capture_error(error_event)
        
        # تثبيت معالجات الإشارات
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
    
    def _setup_thread_handling(self):
        """إعداد معالجة Threading"""
        def thread_excepthook(args):
            error_event = self._create_error_event(
                error_type=args.exc_type.__name__,
                message=str(args.exc_value),
                stack_trace=''.join(traceback.format_exception(args.exc_type, args.exc_value, args.exc_traceback)),
                source='threading',
                severity='high'
            )
            
            self.capture_error(error_event)
        
        threading.excepthook = thread_excepthook
    
    def _load_patterns(self):
        """تحميل أنماط الأخطاء"""
        self.patterns = {
            'database_errors': [
                'database', 'sql', 'query', 'connection', 'rollback',
                'integrity', 'foreign key', 'unique constraint'
            ],
            'network_errors': [
                'network', 'timeout', 'connection', 'socket', 'dns',
                'connection refused', 'host unreachable'
            ],
            'file_errors': [
                'file', 'io', 'permission', 'not found', 'no such file',
                'disk', 'space', 'access denied'
            ],
            'authentication_errors': [
                'auth', 'login', 'unauthorized', 'forbidden', 'token',
                'credential', 'permission denied'
            ],
            'performance_errors': [
                'timeout', 'slow', 'performance', 'memory', 'cpu',
                'resource', 'deadlock', 'hang'
            ],
            'security_errors': [
                'security', 'injection', 'xss', 'csrf', 'validation',
                'sanitize', 'encrypt'
            ]
        }
    
    def _create_error_event(self, error_type: str, message: str, stack_trace: str, 
                          source: str, severity: str, context: Dict[str, Any] = None) -> ErrorEvent:
        """إنشاء حدث خطأ"""
        # تنظيف الرسالة
        message = self._sanitize_message(message)
        
        # تحديد السياق
        context = context or {}
        context.update(self._get_current_context())
        
        # تحديد المصدر
        if source == 'python_exception':
            source = self._determine_error_source(stack_trace)
        
        # إنشاء الحدث
        event = ErrorEvent(
            id=self._generate_event_id(),
            timestamp=datetime.now(),
            error_type=error_type,
            message=message,
            stack_trace=stack_trace,
            severity=severity,
            source=source,
            context=context
        )
        
        # تحديد الفئة
        event.tags = self._categorize_error(event)
        
        return event
    
    def _sanitize_message(self, message: str) -> str:
        """تنظيف رسالة الخطأ"""
        # إزالة المعلومات الحساسة
        sensitive_patterns = [
            (r'\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b', '****-****-****-****'),  # أرقام البطاقات
            (r'\b\d{3}-\d{2}-\d{4}\b', '***-**-****'),  # أرقام الضمان الاجتماعي
            (r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '***@***.***'),  # الإيميل
            (r'password=["\'][^"\']*["\']', 'password="***"'),  # كلمات المرور
            (r'token=["\'][^"\']*["\']', 'token="***"'),  # التوكنز
            (r'key=["\'][^"\']*["\']', 'key="***"'),  # المفاتيح
        ]
        
        sanitized = message
        for pattern, replacement in sensitive_patterns:
            sanitized = re.sub(pattern, replacement, sanitized, flags=re.IGNORECASE)
        
        return sanitized
    
    def _get_current_context(self) -> Dict[str, Any]:
        """الحصول على السياق الحالي"""
        context = {}
        
        # معلومات النظام
        context['system'] = {
            'python_version': sys.version,
            'platform': sys.platform,
            'architecture': os.name,
            'cpu_count': psutil.cpu_count(),
            'memory_info': psutil.virtual_memory()._asdict()
        }
        
        # معلومات البيئة
        if self.config['capture_context']['include_environment']:
            context['environment'] = {
                key: value for key, value in os.environ.items()
                if not any(sensitive in key.lower() for sensitive in ['password', 'token', 'key', 'secret'])
            }
        
        # معلومات العملية
        try:
            process = psutil.Process()
            context['process'] = {
                'pid': process.pid,
                'name': process.name(),
                'cmdline': process.cmdline(),
                'cpu_percent': process.cpu_percent(),
                'memory_info': process.memory_info()._asdict()
            }
        except:
            pass
        
        # معلومات المكدس
        if self.config['capture_context']['include_locals']:
            frame = inspect.currentframe()
            if frame and frame.f_back:
                context['locals'] = self._safe_get_locals(frame.f_back.f_back)
        
        return context
    
    def _safe_get_locals(self, frame) -> Dict[str, Any]:
        """الحصول على المتغيرات المحلية بشكل آمن"""
        try:
            return {
                key: self._safe_value_repr(value)
                for key, value in frame.f_locals.items()
                if not key.startswith('_')
            }
        except:
            return {}
    
    def _safe_value_repr(self, value, max_depth: int = 3) -> str:
        """تمثيل آمن للقيمة"""
        try:
            if isinstance(value, (str, int, float, bool, type(None))):
                return repr(value)
            elif isinstance(value, (list, tuple)):
                return f"{type(value).__name__}({len(value)} items)"
            elif isinstance(value, dict):
                return f"dict({len(value)} items)"
            elif isinstance(value, (set, frozenset)):
                return f"{type(value).__name__}({len(value)} items)"
            else:
                return f"{type(value).__name__} object"
        except:
            return "<unable to represent>"
    
    def _determine_error_source(self, stack_trace: str) -> str:
        """تحديد مصدر الخطأ من المكدس"""
        stack_lines = stack_trace.split('\n')
        
        for line in stack_lines:
            if 'File "' in line:
                file_path = line.split('"')[1]
                
                if any(keyword in file_path for keyword in ['database', 'sql', 'sqlite']):
                    return 'database'
                elif any(keyword in file_path for keyword in ['requests', 'urllib', 'http']):
                    return 'network'
                elif any(keyword in file_path for keyword in ['django', 'flask', 'fastapi']):
                    return 'web_framework'
                elif any(keyword in file_path for keyword in ['pytest', 'test']):
                    return 'testing'
        
        return 'application'
    
    def _categorize_error(self, event: ErrorEvent) -> List[str]:
        """تصنيف الخطأ"""
        categories = []
        message_lower = event.message.lower()
        
        for category, keywords in self.patterns.items():
            if any(keyword in message_lower for keyword in keywords):
                categories.append(category)
        
        # إضافة تصنيفات حسب المصدر
        categories.append(event.source)
        
        # إضافة تصنيفات حسب النوع
        if 'error' in event.error_type.lower():
            categories.append('error')
        elif 'warning' in event.error_type.lower():
            categories.append('warning')
        elif 'exception' in event.error_type.lower():
            categories.append('exception')
        
        return list(set(categories))
    
    def _generate_event_id(self) -> str:
        """إنشاء معرف فريد للحدث"""
        timestamp = str(int(time.time() * 1000))
        random_part = hashlib.md5(os.urandom(16)).hexdigest()[:6]
        return f"err_{timestamp}_{random_part}"
    
    def capture_error(self, event: ErrorEvent):
        """التقاط الخطأ"""
        # تطبيق المرشحات
        if self._should_filter_error(event):
            return
        
        # تحديث الإحصائيات
        self.error_counts[event.fingerprint] += 1
        
        # التحقق من وجود خطأ مشابه
        if event.fingerprint in self.errors:
            existing_event = self.errors[event.fingerprint]
            existing_event.occurrence_count += 1
            existing_event.last_occurrence = event.timestamp
            
            # تحديث الخطورة إذا زاد العدد
            new_severity = self._update_severity(existing_event)
            if new_severity != existing_event.severity:
                existing_event.severity = new_severity
        else:
            # خطأ جديد
            self.errors[event.fingerprint] = event
            
            # تطبيق أنماط التجميع
            if self.config['enable_grouping']:
                self._group_similar_errors(event)
        
        # التحقق من حدود الإنذار
        if self.config['enable_alerting']:
            self._check_alert_thresholds(event)
        
        # تشغيل الـ hooks
        self._run_hooks(event)
        
        # تسجيل الخطأ
        self._log_error(event)
        
        # إرسال الإشعارات
        if event.severity in ['high', 'critical']:
            self._send_notifications(event)
        
        self.logger.debug(f"تم التقاط خطأ: {event.error_type} - {event.message[:100]}")
    
    def _should_filter_error(self, event: ErrorEvent) -> bool:
        """التحقق من ضرورة تصفية الخطأ"""
        # فحص أنماط التجاهل
        for pattern in self.config['ignore_patterns']:
            if pattern in event.error_type or pattern in event.message:
                return True
        
        # فحص المرشحات المخصصة
        for error_filter in self.filters:
            if error_filter(event):
                return True
        
        return False
    
    def _update_severity(self, event: ErrorEvent) -> str:
        """تحديث خطورة الخطأ"""
        count = event.occurrence_count
        thresholds = self.config['severity_thresholds']
        
        if count >= thresholds['critical']:
            return 'critical'
        elif count >= thresholds['high']:
            return 'high'
        elif count >= thresholds['medium']:
            return 'medium'
        else:
            return 'low'
    
    def _group_similar_errors(self, event: ErrorEvent):
        """تجميع الأخطاء المشابهة"""
        # البحث عن أخطاء مشابهة
        similar_fingerprints = []
        
        for fingerprint, existing_event in self.errors.items():
            if fingerprint != event.fingerprint:
                similarity = self._calculate_similarity(event, existing_event)
                if similarity > 0.8:  # تشابه عالي
                    similar_fingerprints.append(fingerprint)
        
        # دمج الأخطاء المشابهة
        for similar_fingerprint in similar_fingerprints:
            if similar_fingerprint in self.errors:
                similar_event = self.errors[similar_fingerprint]
                event.occurrence_count += similar_event.occurrence_count
                del self.errors[similar_fingerprint]
    
    def _calculate_similarity(self, event1: ErrorEvent, event2: ErrorEvent) -> float:
        """حساب التشابه بين خطأين"""
        # تشابه نوع الخطأ
        type_similarity = 1.0 if event1.error_type == event2.error_type else 0.0
        
        # تشابه الرسالة
        msg_similarity = self._string_similarity(event1.message, event2.message)
        
        # تشابه المصدر
        source_similarity = 1.0 if event1.source == event2.source else 0.5
        
        return (type_similarity + msg_similarity + source_similarity) / 3
    
    def _string_similarity(self, str1: str, str2: str) -> float:
        """حساب التشابه بين سطرين"""
        if not str1 or not str2:
            return 0.0
        
        set1 = set(str1.lower().split())
        set2 = set(str2.lower().split())
        
        if not set1 or not set2:
            return 0.0
        
        intersection = set1.intersection(set2)
        union = set1.union(set2)
        
        return len(intersection) / len(union) if union else 0.0
    
    def _check_alert_thresholds(self, event: ErrorEvent):
        """فحص حدود الإنذار"""
        count = event.occurrence_count
        
        # إنذار للخطأ الأول
        if count == 1 and event.severity == 'critical':
            self._trigger_alert('critical_first_occurrence', event)
        
        # إنذار للزيادة المفاجئة
        if count > 1:
            recent_errors = [e for e in self.errors.values() 
                           if e.last_occurrence > datetime.now() - timedelta(minutes=5)]
            if len(recent_errors) > 50:
                self._trigger_alert('high_error_rate', event)
    
    def _trigger_alert(self, alert_type: str, event: ErrorEvent):
        """تشغيل إنذار"""
        self.logger.warning(f"إنذار {alert_type}: {event.error_type}")
        
        # يمكن إضافة منطق الإنذار هنا
    
    def _run_hooks(self, event: ErrorEvent):
        """تشغيل الـ hooks المخصصة"""
        for hook in self.hooks:
            try:
                hook(event)
            except Exception as e:
                self.logger.error(f"خطأ في تشغيل hook: {e}")
    
    def _log_error(self, event: ErrorEvent):
        """تسجيل الخطأ"""
        log_level = {
            'low': logging.INFO,
            'medium': logging.WARNING,
            'high': logging.ERROR,
            'critical': logging.CRITICAL
        }.get(event.severity, logging.ERROR)
        
        self.logger.log(
            log_level,
            f"Error captured: {event.error_type} - {event.message} (Count: {event.occurrence_count})",
            extra={
                'error_fingerprint': event.fingerprint,
                'error_source': event.source,
                'error_tags': event.tags,
                'context': event.context
            }
        )
    
    def _send_notifications(self, event: ErrorEvent):
        """إرسال الإشعارات"""
        # يمكن إضافة منطق الإشعارات هنا
        pass
    
    def capture_exception(self, exc_type=None, exc_value=None, exc_traceback=None):
        """التقاط استثناء"""
        if exc_type is None:
            exc_type, exc_value, exc_traceback = sys.exc_info()
        
        if exc_type is None:
            return
        
        stack_trace = ''.join(traceback.format_exception(exc_type, exc_value, exc_traceback))
        
        error_event = self._create_error_event(
            error_type=exc_type.__name__,
            message=str(exc_value),
            stack_trace=stack_trace,
            source='exception',
            severity='high'
        )
        
        self.capture_error(error_event)
    
    def capture_warning(self, message, category=None, filename=None, lineno=None):
        """التقاط تحذير"""
        error_event = self._create_error_event(
            error_type=category.__name__ if category else 'Warning',
            message=str(message),
            stack_trace=f"Warning in {filename}:{lineno}",
            source='warning',
            severity='low'
        )
        
        self.capture_error(error_event)
    
    def add_filter(self, error_filter: Callable[[ErrorEvent], bool]):
        """إضافة مرشح أخطاء"""
        self.filters.append(error_filter)
    
    def add_hook(self, hook: Callable[[ErrorEvent], None]):
        """إضافة hook مخصص"""
        self.hooks.append(hook)
    
    def get_error_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الأخطاء"""
        total_errors = len(self.errors)
        total_occurrences = sum(event.occurrence_count for event in self.errors.values())
        
        # إحصائيات حسب الخطورة
        severity_stats = Counter(event.severity for event in self.errors.values())
        
        # إحصائيات حسب المصدر
        source_stats = Counter(event.source for event in self.errors.values())
        
        # إحصائيات حسب التصنيف
        tag_stats = Counter()
        for event in self.errors.values():
            tag_stats.update(event.tags)
        
        # الأخطاء الأكثر تكراراً
        top_errors = sorted(
            self.errors.values(), 
            key=lambda e: e.occurrence_count, 
            reverse=True
        )[:10]
        
        return {
            'total_errors': total_errors,
            'total_occurrences': total_occurrences,
            'unique_fingerprints': total_errors,
            'severity_distribution': dict(severity_stats),
            'source_distribution': dict(source_stats),
            'tag_distribution': dict(tag_stats.most_common(20)),
            'top_errors': [
                {
                    'error_type': event.error_type,
                    'message': event.message[:100] + '...' if len(event.message) > 100 else event.message,
                    'occurrence_count': event.occurrence_count,
                    'last_occurrence': event.last_occurrence.isoformat(),
                    'severity': event.severity
                }
                for event in top_errors
            ]
        }
    
    def get_errors(self, filters: Dict[str, Any] = None) -> List[ErrorEvent]:
        """الحصول على الأخطاء مع فلاتر"""
        errors = list(self.errors.values())
        
        if filters:
            if 'severity' in filters:
                errors = [e for e in errors if e.severity == filters['severity']]
            
            if 'source' in filters:
                errors = [e for e in errors if e.source == filters['source']]
            
            if 'tags' in filters:
                errors = [e for e in errors if any(tag in e.tags for tag in filters['tags'])]
            
            if 'since' in filters:
                since_date = datetime.fromisoformat(filters['since'])
                errors = [e for e in errors if e.timestamp >= since_date]
            
            if 'until' in filters:
                until_date = datetime.fromisoformat(filters['until'])
                errors = [e for e in errors if e.timestamp <= until_date]
        
        return sorted(errors, key=lambda e: e.last_occurrence, reverse=True)
    
    def export_errors(self, format: str = 'json', output_path: str = None) -> str:
        """تصدير الأخطاء"""
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f'errors_export_{timestamp}.{format}'
        
        errors_data = [event.to_dict() for event in self.errors.values()]
        
        if format == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(errors_data, f, indent=2, ensure_ascii=False, default=str)
        elif format == 'csv':
            import csv
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                if errors_data:
                    fieldnames = errors_data[0].keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(errors_data)
        
        return output_path
    
    def clear_resolved_errors(self):
        """مسح الأخطاء المحلولة"""
        resolved_fingerprints = [
            fp for fp, event in self.errors.items() 
            if event.resolved
        ]
        
        for fp in resolved_fingerprints:
            del self.errors[fp]
    
    def resolve_error(self, fingerprint: str):
        """حل خطأ"""
        if fingerprint in self.errors:
            self.errors[fingerprint].resolved = True
    
    def cleanup_old_errors(self, days: int = None):
        """تنظيف الأخطاء القديمة"""
        if days is None:
            days = self.config['retention_days']
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        old_fingerprints = [
            fp for fp, event in self.errors.items()
            if event.last_occurrence < cutoff_date and event.resolved
        ]
        
        for fp in old_fingerprints:
            del self.errors[fp]

# decorator لتسهيل التقاط الأخطاء
def capture_errors(capture_instance: ErrorCapture = None):
    """decorator لتسهيل التقاط الأخطاء"""
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if capture_instance:
                    capture_instance.capture_exception()
                raise
        return wrapper
    return decorator

# إنشاء instance عام
error_capture = ErrorCapture()

# تصدير
__all__ = ['ErrorCapture', 'ErrorEvent', 'error_capture', 'capture_errors']