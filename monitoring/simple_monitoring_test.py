#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
اختبار مبسط لنظام المراقبة - Simplified Monitoring System Test
اختبار المكونات الأساسية دون الحاجة لتشغيل الخدمات الخارجية
"""

import os
import sys
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any

# إعداد نظام التسجيل
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class SimpleMonitoringTest:
    """اختبار مبسط لنظام المراقبة"""
    
    def __init__(self):
        self.start_time = datetime.now()
        self.results = []
        
    def check_python_environment(self):
        """فحص بيئة Python والمكتبات"""
        print("🔍 فحص بيئة Python...")
        
        result = {
            'test': 'بيئة Python',
            'status': 'success',
            'message': 'جميع المتطلبات الأساسية مثبتة'
        }
        
        # فحص المكتبات الأساسية
        basic_packages = [
            'psutil', 'prometheus_client', 'redis', 'requests',
            'fastapi', 'uvicorn', 'sqlalchemy', 'schedule',
            'twilio'
        ]
        
        missing = []
        for package in basic_packages:
            try:
                __import__(package)
            except ImportError:
                if package == 'redis':
                    # redis-py
                    try:
                        __import__('redis')
                    except ImportError:
                        missing.append(package)
                else:
                    missing.append(package)
        
        if missing:
            result['status'] = 'warning'
            result['message'] = f'مكتبات مفقودة: {", ".join(missing)}'
        else:
            print("  ✅ جميع المكتبات الأساسية متوفرة")
        
        self.results.append(result)
        return result
    
    def check_environment_config(self):
        """فحص ملف الإعدادات"""
        print("⚙️ فحص ملف الإعدادات...")
        
        env_file = '/workspace/saler/.env'
        result = {
            'test': 'ملف الإعدادات',
            'status': 'success',
            'message': 'ملف .env موجود ومكون'
        }
        
        if not os.path.exists(env_file):
            result['status'] = 'error'
            result['message'] = 'ملف .env غير موجود'
            self.results.append(result)
            return result
        
        # قراءة متغيرات البيئة
        env_vars = {}
        with open(env_file, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    env_vars[key] = value
        
        # فحص المتغيرات الأساسية
        essential_vars = [
            'VITE_SENTRY_DSN', 'VITE_BACKEND_URL', 'DATABASE_URL',
            'SMTP_HOST', 'SLACK_WEBHOOK_URL', 'TWILIO_ACCOUNT_SID'
        ]
        
        configured_count = 0
        for var in essential_vars:
            if var in env_vars and env_vars[var] and env_vars[var] != '':
                configured_count += 1
        
        if configured_count < len(essential_vars):
            result['status'] = 'warning'
            result['message'] = f'بعض المتغيرات غير مكونة ({configured_count}/{len(essential_vars)})'
        else:
            print("  ✅ جميع المتغيرات الأساسية مكونة")
        
        result['details'] = {
            'total_essential': len(essential_vars),
            'configured': configured_count,
            'configuration_rate': round(configured_count / len(essential_vars) * 100, 1)
        }
        
        self.results.append(result)
        return result
    
    def check_monitoring_files(self):
        """فحص ملفات نظام المراقبة"""
        print("📁 فحص ملفات نظام المراقبة...")
        
        monitoring_files = [
            ('/workspace/saler/monitoring/sentry-config.js', 'تكوين Sentry'),
            ('/workspace/saler/monitoring/advanced-logging-system.js', 'نظام السجلات المتقدم'),
            ('/workspace/saler/monitoring/advanced-health-check-system.py', 'نظام فحص الصحة'),
            ('/workspace/saler/monitoring/advanced-performance-monitoring.py', 'مراقبة الأداء'),
            ('/workspace/saler/monitoring/advanced-alerting-system.py', 'نظام التنبيهات'),
            ('/workspace/saler/monitoring/monitoring-config.yaml', 'ملف التكوين'),
            ('/workspace/saler/monitoring/requirements-essential.txt', 'المتطلبات الأساسية')
        ]
        
        result = {
            'test': 'ملفات المراقبة',
            'status': 'success',
            'message': 'جميع ملفات النظام موجودة'
        }
        
        existing_files = []
        missing_files = []
        total_size = 0
        
        for file_path, description in monitoring_files:
            if os.path.exists(file_path):
                size = os.path.getsize(file_path)
                existing_files.append({'path': file_path, 'size': size, 'description': description})
                total_size += size
            else:
                missing_files.append({'path': file_path, 'description': description})
        
        if missing_files:
            result['status'] = 'error'
            result['message'] = f'ملفات مفقودة: {len(missing_files)}'
        else:
            print(f"  ✅ جميع الملفات موجودة ({len(existing_files)} ملف)")
        
        result['details'] = {
            'existing_files': len(existing_files),
            'missing_files': len(missing_files),
            'total_files': len(monitoring_files),
            'total_size_mb': round(total_size / 1024 / 1024, 2),
            'missing_details': missing_files
        }
        
        self.results.append(result)
        return result
    
    def test_basic_functionality(self):
        """اختبار الوظائف الأساسية"""
        print("🔧 اختبار الوظائف الأساسية...")
        
        result = {
            'test': 'الوظائف الأساسية',
            'status': 'success',
            'message': 'جميع الوظائف تعمل',
            'details': {}
        }
        
        tests = {}
        
        # اختبار 1: نظام السجلات
        try:
            import logging
            test_logger = logging.getLogger('test')
            test_logger.info("اختبار السجلات")
            tests['نظام السجلات'] = 'نجح'
        except Exception as e:
            tests['نظام السجلات'] = f'فشل: {str(e)}'
        
        # اختبار 2: مراقبة النظام
        try:
            import psutil
            cpu = psutil.cpu_percent()
            memory = psutil.virtual_memory()
            tests['مراقبة النظام'] = f'نجح (CPU: {cpu}%, Memory: {memory.percent}%)'
        except Exception as e:
            tests['مراقبة النظام'] = f'فشل: {str(e)}'
        
        # اختبار 3: Prometheus Metrics
        try:
            from prometheus_client import Counter, Gauge
            counter = Counter('test', 'Test counter')
            counter.inc()
            gauge = Gauge('test_gauge', 'Test gauge')
            gauge.set(42)
            tests['Prometheus Metrics'] = 'نجح'
        except Exception as e:
            tests['Prometheus Metrics'] = f'فشل: {str(e)}'
        
        # اختبار 4: FastAPI
        try:
            from fastapi import FastAPI
            app = FastAPI()
            tests['FastAPI Framework'] = 'نجح'
        except Exception as e:
            tests['FastAPI Framework'] = f'فشل: {str(e)}'
        
        # اختبار 5: SQLAlchemy
        try:
            from sqlalchemy import create_engine, text
            engine = create_engine('sqlite:///:memory:')
            with engine.connect() as conn:
                db_result = conn.execute(text('SELECT 1')).scalar()
            tests['SQLAlchemy Database'] = 'نجح'
        except Exception as e:
            tests['SQLAlchemy Database'] = f'فشل: {str(e)}'
        
        # تحليل النتائج
        successful_tests = sum(1 for status in tests.values() if status == 'نجح' or 'نجح (' in status)
        total_tests = len(tests)
        
        if successful_tests < total_tests:
            result['status'] = 'warning'
            failed_tests = [name for name, status in tests.items() if not (status == 'نجح' or 'نجح (' in status)]
            result['message'] = f'بعض الاختبارات فشلت: {", ".join(failed_tests)}'
        else:
            print(f"  ✅ جميع الوظائف تعمل ({successful_tests}/{total_tests})")
        
        result['details'] = {
            'tests': tests,
            'successful': successful_tests,
            'total': total_tests,
            'success_rate': round(successful_tests / total_tests * 100, 1)
        }
        
        self.results.append(result)
        return result
    
    def check_system_resources(self):
        """فحص موارد النظام"""
        print("💻 فحص موارد النظام...")
        
        result = {
            'test': 'موارد النظام',
            'status': 'success',
            'message': 'موارد النظام جيدة',
            'details': {}
        }
        
        try:
            import psutil
            
            # معلومات المعالج
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # الذاكرة
            memory = psutil.virtual_memory()
            
            # القرص الصلب
            disk = psutil.disk_usage('/')
            
            # تحميل النظام
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else (0, 0, 0)
            
            resource_info = {
                'cpu': {
                    'usage_percent': cpu_percent,
                    'cores': cpu_count,
                    'load_average': load_avg
                },
                'memory': {
                    'total_gb': round(memory.total / 1024**3, 2),
                    'available_gb': round(memory.available / 1024**3, 2),
                    'used_percent': memory.percent
                },
                'disk': {
                    'total_gb': round(disk.total / 1024**3, 2),
                    'free_gb': round(disk.free / 1024**3, 2),
                    'used_percent': disk.percent
                }
            }
            
            # تحديد التحذيرات
            warnings = []
            if cpu_percent > 80:
                warnings.append(f'استخدام المعالج عالي: {cpu_percent}%')
            if memory.percent > 85:
                warnings.append(f'استخدام الذاكرة عالي: {memory.percent}%')
            if disk.percent > 90:
                warnings.append(f'استخدام القرص عالي: {disk.percent}%')
            
            if warnings:
                result['status'] = 'warning'
                result['message'] = '; '.join(warnings)
            else:
                print("  ✅ موارد النظام جيدة")
            
            result['details'] = resource_info
            
        except Exception as e:
            result['status'] = 'error'
            result['message'] = f'خطأ في فحص الموارد: {str(e)}'
        
        self.results.append(result)
        return result
    
    def generate_report(self):
        """إنشاء تقرير شامل"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()
        
        # حساب الإحصائيات
        total_tests = len(self.results)
        successful_tests = sum(1 for r in self.results if r['status'] == 'success')
        warning_tests = sum(1 for r in self.results if r['status'] == 'warning')
        error_tests = sum(1 for r in self.results if r['status'] == 'error')
        
        # إنشاء التقرير
        report = {
            'timestamp': {
                'start': self.start_time.isoformat(),
                'end': end_time.isoformat(),
                'duration_seconds': duration
            },
            'summary': {
                'total_tests': total_tests,
                'successful': successful_tests,
                'warnings': warning_tests,
                'errors': error_tests,
                'success_rate': round(successful_tests / total_tests * 100, 1)
            },
            'results': self.results,
            'recommendations': []
        }
        
        # إضافة التوصيات
        if error_tests > 0:
            report['recommendations'].append('إصلاح الأخطاء الحرجة قبل النشر')
        if warning_tests > 0:
            report['recommendations'].append('مراجعة التحذيرات وإكمال الإعدادات')
        if successful_tests == total_tests:
            report['recommendations'].extend([
                'تهيئة مفاتيح API للخدمات الخارجية',
                'تشغيل خدمات المراقبة (Prometheus, Grafana)',
                'اختبار نظام التنبيهات',
                'نشر النظام في البيئة الإنتاجية'
            ])
        
        # حفظ التقرير
        report_file = f"simple_monitoring_test_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        return report, report_file
    
    def print_summary(self, report):
        """طباعة ملخص النتائج"""
        print("\n" + "="*70)
        print("📊 ملخص نتائج اختبار نظام المراقبة")
        print("="*70)
        
        summary = report['summary']
        print(f"⏱️  مدة الاختبار: {report['timestamp']['duration_seconds']:.1f} ثانية")
        print(f"✅ نجح: {summary['successful']}")
        print(f"⚠️  تحذيرات: {summary['warnings']}")
        print(f"❌ أخطاء: {summary['errors']}")
        print(f"📊 إجمالي: {summary['total_tests']}")
        print(f"🎯 معدل النجاح: {summary['success_rate']}%")
        
        print("\n📋 تفاصيل الاختبارات:")
        print("-"*50)
        for result in self.results:
            status_icon = "✅" if result['status'] == 'success' else "⚠️" if result['status'] == 'warning' else "❌"
            print(f"{status_icon} {result['test']}: {result['message']}")
        
        if report['recommendations']:
            print("\n💡 التوصيات:")
            print("-"*50)
            for i, rec in enumerate(report['recommendations'], 1):
                print(f"{i}. {rec}")
        
        print("\n" + "="*70)
        
        # النتيجة الإجمالية
        if summary['success_rate'] >= 80:
            print("🎉 النظام جاهز للاستخدام!")
            status = "ready"
        elif summary['success_rate'] >= 60:
            print("⚠️ النظام يحتاج إعدادات إضافية")
            status = "needs_setup"
        else:
            print("❌ النظام يحتاج إصلاحات أساسية")
            status = "needs_fixes"
        
        print("="*70 + "\n")
        
        return status
    
    def run(self):
        """تشغيل جميع الاختبارات"""
        print("🚀 بدء اختبار نظام المراقبة المبسط...")
        print("="*50)
        
        # تشغيل الاختبارات
        self.check_python_environment()
        self.check_environment_config()
        self.check_monitoring_files()
        self.test_basic_functionality()
        self.check_system_resources()
        
        # إنشاء وطباعة التقرير
        report, report_file = self.generate_report()
        status = self.print_summary(report)
        
        print(f"📄 تم حفظ التقرير في: {report_file}")
        
        return status, report

def main():
    """الدالة الرئيسية"""
    tester = SimpleMonitoringTest()
    status, report = tester.run()
    
    # تحديد كود الخروج
    if status == "ready":
        print("✅ النظام جاهز للاستخدام")
        return 0
    elif status == "needs_setup":
        print("⚠️ النظام يحتاج إعدادات إضافية")
        return 1
    else:
        print("❌ النظام يحتاج إصلاحات")
        return 2

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)