#!/usr/bin/env python3
"""
نظام اختبار التنبيهات - Alert Testing System
Tests and validates alert configurations and notifications
اختبار والتحقق من تكوينات التنبيهات والإشعارات
"""

import json
import time
import logging
import requests
import smtplib
import threading
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, as_completed
import random
import string
import yaml
import jsonschema
from pathlib import Path
import subprocess
import sys

# إعداد السجلات
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('alert_testing.log', encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class TestAlert:
    """تنبيه اختبار"""
    id: str
    title: str
    description: str
    severity: str
    service: str
    component: str
    metrics: Dict[str, Any]
    status: str = "open"
    created_at: str = None
    test_type: str = "manual"
    
    def __post_init__(self):
        if not self.created_at:
            self.created_at = datetime.now().isoformat()

@dataclass
class TestResult:
    """نتيجة اختبار"""
    test_id: str
    alert: TestAlert
    channel: str
    success: bool
    response_time: float
    error_message: Optional[str] = None
    timestamp: str = None
    
    def __post_init__(self):
        if not self.timestamp:
            self.timestamp = datetime.now().isoformat()

class AlertTester:
    """فئة اختبار التنبيهات"""
    
    def __init__(self, config_path: str = "alert_testing_config.yaml"):
        self.config_path = config_path
        self.config = self.load_config()
        self.test_history = []
        self.failure_count = {}
        self.success_count = {}
        self.setup_logging()
        
    def setup_logging(self):
        """إعداد نظام السجلات"""
        self.logger = logging.getLogger(f"{__name__}.{self.__class__.__name__}")
        
    def load_config(self) -> Dict[str, Any]:
        """تحميل ملف التكوين"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                return yaml.safe_load(file)
        except FileNotFoundError:
            return self.create_default_config()
        except yaml.YAMLError as e:
            self.logger.error(f"خطأ في قراءة ملف التكوين: {e}")
            return self.create_default_config()
    
    def create_default_config(self) -> Dict[str, Any]:
        """إنشاء تكوين افتراضي"""
        default_config = {
            'email': {
                'enabled': True,
                'test_recipients': ['test@example.com'],
                'smtp_server': 'localhost',
                'smtp_port': 587,
                'username': '',
                'password': '',
                'from_address': 'monitoring@saler.com'
            },
            'slack': {
                'enabled': False,
                'webhook_url': '',
                'test_channel': '#alerts'
            },
            'discord': {
                'enabled': False,
                'webhook_url': '',
                'test_channel': 'alerts'
            },
            'sms': {
                'enabled': False,
                'twilio_account_sid': '',
                'twilio_auth_token': '',
                'test_numbers': []
            },
            'webhook': {
                'enabled': False,
                'test_urls': [],
                'timeout': 30
            },
            'pagerduty': {
                'enabled': False,
                'integration_key': '',
                'test_service': 'saler-monitoring'
            },
            'testing': {
                'concurrent_tests': 5,
                'default_timeout': 60,
                'retry_attempts': 3,
                'test_delay_seconds': 2
            }
        }
        
        # حفظ التكوين الافتراضي
        try:
            with open(self.config_path, 'w', encoding='utf-8') as file:
                yaml.dump(default_config, file, default_flow_style=False, allow_unicode=True)
        except Exception as e:
            self.logger.error(f"خطأ في حفظ التكوين الافتراضي: {e}")
            
        return default_config
    
    def create_test_alert(self, severity: str = "warning", service: str = "test-service") -> TestAlert:
        """إنشاء تنبيه اختبار"""
        alert_id = self.generate_alert_id()
        
        return TestAlert(
            id=alert_id,
            title=f"Test Alert - {severity.upper()}",
            description=f"This is a test alert for {service} at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            severity=severity,
            service=service,
            component="test-component",
            metrics={
                "response_time_ms": random.randint(100, 5000),
                "cpu_usage_percent": random.randint(10, 95),
                "memory_usage_percent": random.randint(20, 90),
                "error_rate": round(random.uniform(0, 0.1), 4),
                "throughput_rps": random.randint(100, 1000)
            }
        )
    
    def generate_alert_id(self) -> str:
        """إنشاء معرف تنبيه فريد"""
        timestamp = int(time.time())
        random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        return f"test-{timestamp}-{random_str}"
    
    async def test_email_channel(self, alert: TestAlert) -> TestResult:
        """اختبار قناة البريد الإلكتروني"""
        if not self.config['email']['enabled']:
            return TestResult(
                test_id=f"{alert.id}-email",
                alert=alert,
                channel="email",
                success=True,
                response_time=0,
                error_message="Email channel disabled"
            )
        
        start_time = time.time()
        
        try:
            # إعداد الرسالة
            msg = MIMEMultipart()
            msg['From'] = self.config['email']['from_address']
            msg['To'] = ', '.join(self.config['email']['test_recipients'])
            msg['Subject'] = f"[TEST] {alert.title}"
            
            # محتوى الرسالة
            body = f"""
تنبيه اختبار من نظام مراقبة سالير

تفاصيل التنبيه:
- المعرف: {alert.id}
- الشدة: {alert.severity}
- الوقت: {alert.created_at}
- الخدمة: {alert.service}
- المكون: {alert.component}

الوصف:
{alert.description}

المقاييس:
{json.dumps(alert.metrics, indent=2, ensure_ascii=False)}

---
هذا اختبار آلي، يرجى تجاهله.
            """
            
            msg.attach(MIMEText(body, 'plain', 'utf-8'))
            
            # إرسال البريد
            with smtplib.SMTP(self.config['email']['smtp_server'], 
                             self.config['email']['smtp_port']) as server:
                if self.config['email']['username']:
                    server.starttls()
                    server.login(self.config['email']['username'], 
                               self.config['email']['password'])
                
                server.send_message(msg)
            
            response_time = time.time() - start_time
            self.increment_success('email')
            
            return TestResult(
                test_id=f"{alert.id}-email",
                alert=alert,
                channel="email",
                success=True,
                response_time=response_time
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.increment_failure('email')
            
            return TestResult(
                test_id=f"{alert.id}-email",
                alert=alert,
                channel="email",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_slack_channel(self, alert: TestAlert) -> TestResult:
        """اختبار قناة Slack"""
        if not self.config['slack']['enabled']:
            return TestResult(
                test_id=f"{alert.id}-slack",
                alert=alert,
                channel="slack",
                success=True,
                response_time=0,
                error_message="Slack channel disabled"
            )
        
        start_time = time.time()
        
        try:
            webhook_url = self.config['slack']['webhook_url']
            if not webhook_url:
                raise ValueError("Slack webhook URL not configured")
            
            # تحضير البيانات
            severity_colors = {
                'critical': '#FF0000',
                'warning': '#FFFF00',
                'info': '#00FFFF'
            }
            
            payload = {
                "text": f"🚨 Test Alert: {alert.title}",
                "attachments": [
                    {
                        "color": severity_colors.get(alert.severity, '#00FFFF'),
                        "fields": [
                            {
                                "title": "Severity",
                                "value": alert.severity.upper(),
                                "short": True
                            },
                            {
                                "title": "Service",
                                "value": alert.service,
                                "short": True
                            },
                            {
                                "title": "ID",
                                "value": alert.id,
                                "short": True
                            },
                            {
                                "title": "Time",
                                "value": alert.created_at,
                                "short": True
                            }
                        ],
                        "footer": "Saler Monitoring Test",
                        "ts": int(time.time())
                    }
                ]
            }
            
            # إرسال الطلب
            response = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=self.config['testing']['default_timeout']
            )
            
            response.raise_for_status()
            
            response_time = time.time() - start_time
            self.increment_success('slack')
            
            return TestResult(
                test_id=f"{alert.id}-slack",
                alert=alert,
                channel="slack",
                success=True,
                response_time=response_time
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.increment_failure('slack')
            
            return TestResult(
                test_id=f"{alert.id}-slack",
                alert=alert,
                channel="slack",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_discord_channel(self, alert: TestAlert) -> TestResult:
        """اختبار قناة Discord"""
        if not self.config['discord']['enabled']:
            return TestResult(
                test_id=f"{alert.id}-discord",
                alert=alert,
                channel="discord",
                success=True,
                response_time=0,
                error_message="Discord channel disabled"
            )
        
        start_time = time.time()
        
        try:
            webhook_url = self.config['discord']['webhook_url']
            if not webhook_url:
                raise ValueError("Discord webhook URL not configured")
            
            severity_colors = {
                'critical': 0xFF0000,
                'warning': 0xFFFF00,
                'info': 0x00FFFF
            }
            
            payload = {
                "embeds": [
                    {
                        "title": f"🚨 Test Alert: {alert.title}",
                        "color": severity_colors.get(alert.severity, 0x00FFFF),
                        "fields": [
                            {
                                "name": "Severity",
                                "value": alert.severity.upper(),
                                "inline": True
                            },
                            {
                                "name": "Service",
                                "value": alert.service,
                                "inline": True
                            },
                            {
                                "name": "ID",
                                "value": alert.id,
                                "inline": True
                            },
                            {
                                "name": "Time",
                                "value": alert.created_at,
                                "inline": True
                            }
                        ],
                        "description": alert.description,
                        "footer": {
                            "text": "Saler Monitoring Test"
                        },
                        "timestamp": datetime.now().isoformat()
                    }
                ]
            }
            
            response = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=self.config['testing']['default_timeout']
            )
            
            response.raise_for_status()
            
            response_time = time.time() - start_time
            self.increment_success('discord')
            
            return TestResult(
                test_id=f"{alert.id}-discord",
                alert=alert,
                channel="discord",
                success=True,
                response_time=response_time
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.increment_failure('discord')
            
            return TestResult(
                test_id=f"{alert.id}-discord",
                alert=alert,
                channel="discord",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_webhook_channel(self, alert: TestAlert) -> TestResult:
        """اختبار قناة Webhook"""
        if not self.config['webhook']['enabled']:
            return TestResult(
                test_id=f"{alert.id}-webhook",
                alert=alert,
                channel="webhook",
                success=True,
                response_time=0,
                error_message="Webhook channel disabled"
            )
        
        start_time = time.time()
        
        try:
            test_urls = self.config['webhook']['test_urls']
            if not test_urls:
                raise ValueError("No test webhook URLs configured")
            
            # اختبار أول URL فقط للتبسيط
            test_url = test_urls[0]
            timeout = self.config['webhook']['timeout']
            
            payload = {
                "alert": asdict(alert),
                "test": True,
                "timestamp": datetime.now().isoformat(),
                "source": "alert_testing_system"
            }
            
            response = requests.post(
                test_url,
                json=payload,
                headers={
                    'Content-Type': 'application/json',
                    'User-Agent': 'Saler-Alert-Tester/1.0'
                },
                timeout=timeout
            )
            
            response.raise_for_status()
            
            response_time = time.time() - start_time
            self.increment_success('webhook')
            
            return TestResult(
                test_id=f"{alert.id}-webhook",
                alert=alert,
                channel="webhook",
                success=True,
                response_time=response_time,
                error_message=f"Response: {response.status_code}"
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.increment_failure('webhook')
            
            return TestResult(
                test_id=f"{alert.id}-webhook",
                alert=alert,
                channel="webhook",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    async def test_pagerduty_channel(self, alert: TestAlert) -> TestResult:
        """اختبار قناة PagerDuty"""
        if not self.config['pagerduty']['enabled']:
            return TestResult(
                test_id=f"{alert.id}-pagerduty",
                alert=alert,
                channel="pagerduty",
                success=True,
                response_time=0,
                error_message="PagerDuty channel disabled"
            )
        
        start_time = time.time()
        
        try:
            integration_key = self.config['pagerduty']['integration_key']
            if not integration_key:
                raise ValueError("PagerDuty integration key not configured")
            
            payload = {
                "routing_key": integration_key,
                "event_action": "trigger",
                "dedup_key": alert.id,
                "payload": {
                    "summary": f"Test Alert: {alert.title}",
                    "severity": alert.severity,
                    "source": alert.service,
                    "component": alert.component,
                    "group": "saler-monitoring",
                    "class": "test-alert",
                    "custom_details": {
                        "alert_id": alert.id,
                        "test": True,
                        "metrics": alert.metrics
                    }
                }
            }
            
            response = requests.post(
                "https://events.pagerduty.com/v2/enqueue",
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=self.config['testing']['default_timeout']
            )
            
            response.raise_for_status()
            
            response_time = time.time() - start_time
            self.increment_success('pagerduty')
            
            return TestResult(
                test_id=f"{alert.id}-pagerduty",
                alert=alert,
                channel="pagerduty",
                success=True,
                response_time=response_time
            )
            
        except Exception as e:
            response_time = time.time() - start_time
            self.increment_failure('pagerduty')
            
            return TestResult(
                test_id=f"{alert.id}-pagerduty",
                alert=alert,
                channel="pagerduty",
                success=False,
                response_time=response_time,
                error_message=str(e)
            )
    
    def increment_success(self, channel: str):
        """زيادة عدد النجاحات"""
        self.success_count[channel] = self.success_count.get(channel, 0) + 1
    
    def increment_failure(self, channel: str):
        """زيادة عدد الفشل"""
        self.failure_count[channel] = self.failure_count.get(channel, 0) + 1
    
    async def run_channel_test(self, channel: str, alert: TestAlert) -> TestResult:
        """تشغيل اختبار قناة محددة"""
        test_methods = {
            'email': self.test_email_channel,
            'slack': self.test_slack_channel,
            'discord': self.test_discord_channel,
            'webhook': self.test_webhook_channel,
            'pagerduty': self.test_pagerduty_channel
        }
        
        if channel not in test_methods:
            raise ValueError(f"Unknown channel: {channel}")
        
        self.logger.info(f"بدء اختبار قناة {channel} للتنبيه {alert.id}")
        
        try:
            result = await test_methods[channel](alert)
            self.test_history.append(result)
            
            if result.success:
                self.logger.info(f"✅ نجح اختبار {channel} للتنبيه {alert.id}")
            else:
                self.logger.error(f"❌ فشل اختبار {channel} للتنبيه {alert.id}: {result.error_message}")
            
            return result
            
        except Exception as e:
            result = TestResult(
                test_id=f"{alert.id}-{channel}",
                alert=alert,
                channel=channel,
                success=False,
                response_time=0,
                error_message=str(e)
            )
            self.test_history.append(result)
            
            self.logger.error(f"❌ خطأ في اختبار {channel} للتنبيه {alert.id}: {e}")
            return result
    
    async def run_parallel_tests(self, channels: List[str], alert: TestAlert, 
                               max_workers: int = None) -> List[TestResult]:
        """تشغيل اختبارات متوازية للقنوات"""
        if not max_workers:
            max_workers = self.config['testing']['concurrent_tests']
        
        tasks = [self.run_channel_test(channel, alert) for channel in channels]
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            results = await asyncio.gather(*tasks, return_exceptions=True)
        
        return [r for r in results if not isinstance(r, Exception)]
    
    async def run_comprehensive_test(self, channels: List[str] = None, 
                                   severity_levels: List[str] = None,
                                   services: List[str] = None) -> Dict[str, Any]:
        """تشغيل اختبار شامل"""
        if not channels:
            channels = [ch for ch, enabled in self.config.items() 
                       if ch != 'testing' and enabled.get('enabled', False)]
        
        if not severity_levels:
            severity_levels = ['info', 'warning', 'critical']
        
        if not services:
            services = ['web-service', 'api-service', 'database', 'cache']
        
        self.logger.info(f"بدء اختبار شامل للقنوات: {channels}")
        
        all_results = {}
        test_delay = self.config['testing']['test_delay_seconds']
        
        for channel in channels:
            self.logger.info(f"اختبار قناة: {channel}")
            channel_results = []
            
            for severity in severity_levels:
                for service in services:
                    alert = self.create_test_alert(severity, service)
                    alert.test_type = f"{channel}-{severity}-{service}"
                    
                    result = await self.run_channel_test(channel, alert)
                    channel_results.append(result)
                    
                    # تأخير بين الاختبارات
                    await asyncio.sleep(test_delay)
            
            all_results[channel] = channel_results
        
        # إنشاء تقرير
        report = self.generate_test_report(all_results)
        await self.save_test_report(report)
        
        return {
            'success': True,
            'total_tests': sum(len(results) for results in all_results.values()),
            'successful_tests': sum(1 for results in all_results.values() 
                                  for r in results if r.success),
            'results': all_results,
            'report': report
        }
    
    def generate_test_report(self, results: Dict[str, List[TestResult]]) -> Dict[str, Any]:
        """إنشاء تقرير الاختبار"""
        report = {
            'test_summary': {
                'total_channels': len(results),
                'total_tests': sum(len(r) for r in results.values()),
                'successful_tests': 0,
                'failed_tests': 0,
                'success_rate': 0,
                'average_response_time': 0
            },
            'channel_stats': {},
            'severity_analysis': {},
            'response_time_analysis': {},
            'recommendations': [],
            'test_timestamp': datetime.now().isoformat()
        }
        
        total_response_time = 0
        response_time_count = 0
        
        for channel, channel_results in results.items():
            channel_success = sum(1 for r in channel_results if r.success)
            channel_total = len(channel_results)
            
            channel_stats = {
                'total_tests': channel_total,
                'successful_tests': channel_success,
                'failed_tests': channel_total - channel_success,
                'success_rate': (channel_success / channel_total * 100) if channel_total > 0 else 0,
                'average_response_time': 0
            }
            
            # حساب متوسط وقت الاستجابة
            response_times = [r.response_time for r in channel_results if r.success]
            if response_times:
                channel_stats['average_response_time'] = sum(response_times) / len(response_times)
                total_response_time += sum(response_times)
                response_time_count += len(response_times)
            
            report['channel_stats'][channel] = channel_stats
            
            # تحديث الإجمالي
            report['test_summary']['successful_tests'] += channel_success
            report['test_summary']['failed_tests'] += (channel_total - channel_success)
            
            # تحليل الشدة
            for result in channel_results:
                severity = result.alert.severity
                if severity not in report['severity_analysis']:
                    report['severity_analysis'][severity] = {
                        'total': 0,
                        'successful': 0,
                        'success_rate': 0
                    }
                
                report['severity_analysis'][severity]['total'] += 1
                if result.success:
                    report['severity_analysis'][severity]['successful'] += 1
        
        # حساب المعدلات النهائية
        total_tests = report['test_summary']['total_tests']
        if total_tests > 0:
            report['test_summary']['success_rate'] = (
                report['test_summary']['successful_tests'] / total_tests * 100
            )
        
        if response_time_count > 0:
            report['test_summary']['average_response_time'] = total_response_time / response_time_count
        
        # حساب معدلات النجاح حسب الشدة
        for severity, stats in report['severity_analysis'].items():
            if stats['total'] > 0:
                stats['success_rate'] = stats['successful'] / stats['total'] * 100
        
        # إضافة التوصيات
        report['recommendations'] = self.generate_recommendations(report)
        
        return report
    
    def generate_recommendations(self, report: Dict[str, Any]) -> List[str]:
        """إنتاج توصيات بناءً على نتائج الاختبار"""
        recommendations = []
        
        # تحليل نجاح القنوات
        for channel, stats in report['channel_stats'].items():
            if stats['success_rate'] < 90:
                recommendations.append(
                    f"قناة {channel} تحتاج تحسين - معدل النجاح: {stats['success_rate']:.1f}%"
                )
            
            if stats['average_response_time'] > 30:
                recommendations.append(
                    f"قناة {channel} بطيئة في الاستجابة - متوسط الوقت: {stats['average_response_time']:.2f} ثانية"
                )
        
        # تحليل الأداء حسب الشدة
        for severity, stats in report['severity_analysis'].items():
            if stats['success_rate'] < 95:
                recommendations.append(
                    f"اختبارات الشدة {severity} تحتاج مراجعة - معدل النجاح: {stats['success_rate']:.1f}%"
                )
        
        # توصيات عامة
        if report['test_summary']['success_rate'] < 95:
            recommendations.append(
                "معدل النجاح الإجمالي منخفض، يرجى مراجعة تكوينات القنوات"
            )
        
        if not recommendations:
            recommendations.append("جميع الاختبارات تعمل بشكل جيد! 🎉")
        
        return recommendations
    
    async def save_test_report(self, report: Dict[str, Any]) -> str:
        """حفظ تقرير الاختبار"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"alert_test_report_{timestamp}.json"
        filepath = Path("reports") / filename
        
        # إنشاء مجلد التقارير إذا لم يكن موجوداً
        filepath.parent.mkdir(exist_ok=True)
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"تم حفظ تقرير الاختبار: {filepath}")
            return str(filepath)
            
        except Exception as e:
            self.logger.error(f"خطأ في حفظ تقرير الاختبار: {e}")
            raise
    
    def get_test_statistics(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الاختبار"""
        return {
            'total_tests_run': len(self.test_history),
            'successful_tests': sum(1 for r in self.test_history if r.success),
            'failed_tests': sum(1 for r in self.test_history if not r.success),
            'success_rate': (sum(1 for r in self.test_history if r.success) / 
                           len(self.test_history) * 100) if self.test_history else 0,
            'channels_tested': list(set(r.channel for r in self.test_history)),
            'success_by_channel': dict(self.success_count),
            'failures_by_channel': dict(self.failure_count),
            'last_test': max((r.timestamp for r in self.test_history), default=None)
        }
    
    async def run_load_test(self, channel: str, duration_seconds: int = 60,
                          requests_per_second: int = 1) -> Dict[str, Any]:
        """اختبار حمل لقناة إشعار"""
        self.logger.info(f"بدء اختبار الحمل لقناة {channel} لمدة {duration_seconds} ثانية")
        
        start_time = time.time()
        end_time = start_time + duration_seconds
        request_interval = 1 / requests_per_second
        results = []
        
        async def send_request():
            alert = self.create_test_alert(
                severity=random.choice(['info', 'warning', 'critical']),
                service=f"load-test-{int(time.time())}"
            )
            
            return await self.run_channel_test(channel, alert)
        
        # إرسال الطلبات بالتتابع
        while time.time() < end_time:
            tasks = []
            current_time = time.time()
            
            # إرسال عدد من الطلبات حسب المعدل المطلوب
            requests_this_second = 0
            next_request_time = current_time + request_interval
            
            while current_time < next_request_time and requests_this_second < requests_per_second:
                task = asyncio.create_task(send_request())
                tasks.append(task)
                requests_this_second += 1
                
                if requests_this_second < requests_per_second:
                    await asyncio.sleep(request_interval)
                    current_time = time.time()
            
            # انتظار اكتمال الطلبات
            completed_tasks = await asyncio.gather(*tasks, return_exceptions=True)
            
            for task in completed_tasks:
                if not isinstance(task, Exception):
                    results.append(task)
            
            # انتظار للثانية التالية
            time.sleep(max(0, end_time - time.time()))
        
        # تحليل النتائج
        load_test_results = {
            'channel': channel,
            'duration_seconds': duration_seconds,
            'total_requests': len(results),
            'successful_requests': sum(1 for r in results if r.success),
            'failed_requests': sum(1 for r in results if not r.success),
            'success_rate': (sum(1 for r in results if r.success) / len(results) * 100) if results else 0,
            'average_response_time': sum(r.response_time for r in results if r.success) / len([r for r in results if r.success]) if results else 0,
            'requests_per_second_achieved': len(results) / duration_seconds,
            'errors': [r.error_message for r in results if not r.success]
        }
        
        self.logger.info(f"انتهى اختبار الحمل - النجاح: {load_test_results['success_rate']:.1f}%")
        
        return load_test_results
    
    def export_test_history(self, filename: str = None) -> str:
        """تصدير تاريخ الاختبارات"""
        if not filename:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"alert_test_history_{timestamp}.json"
        
        filepath = Path("exports") / filename
        filepath.parent.mkdir(exist_ok=True)
        
        export_data = {
            'export_timestamp': datetime.now().isoformat(),
            'total_tests': len(self.test_history),
            'test_results': [asdict(result) for result in self.test_history],
            'statistics': self.get_test_statistics()
        }
        
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
            
            self.logger.info(f"تم تصدير تاريخ الاختبارات: {filepath}")
            return str(filepath)
            
        except Exception as e:
            self.logger.error(f"خطأ في تصدير تاريخ الاختبارات: {e}")
            raise

# دالة رئيسية للاختبار
async def main():
    """الدالة الرئيسية"""
    import asyncio
    
    tester = AlertTester()
    
    print("🚀 بدء نظام اختبار التنبيهات")
    print("=" * 50)
    
    # اختبار سريع لقنوات مفعلة
    enabled_channels = []
    for channel, config in tester.config.items():
        if isinstance(config, dict) and config.get('enabled', False):
            enabled_channels.append(channel)
    
    if not enabled_channels:
        print("❌ لا توجد قنوات مفعلة للاختبار")
        return
    
    print(f"📡 القنوات المفعلة: {', '.join(enabled_channels)}")
    
    # اختبار شامل
    try:
        comprehensive_results = await tester.run_comprehensive_test(
            channels=enabled_channels,
            severity_levels=['info', 'warning'],
            services=['test-service']
        )
        
        print(f"\n✅ اكتمل الاختبار الشامل")
        print(f"📊 إجمالي الاختبارات: {comprehensive_results['total_tests']}")
        print(f"✅ الاختبارات الناجحة: {comprehensive_results['successful_tests']}")
        print(f"📈 معدل النجاح: {(comprehensive_results['successful_tests']/comprehensive_results['total_tests']*100):.1f}%")
        
        # عرض التوصيات
        recommendations = comprehensive_results['report']['recommendations']
        if recommendations:
            print("\n💡 التوصيات:")
            for i, rec in enumerate(recommendations, 1):
                print(f"  {i}. {rec}")
        
        # حفظ التقرير
        report_path = await tester.save_test_report(comprehensive_results['report'])
        print(f"\n💾 تم حفظ التقرير: {report_path}")
        
    except Exception as e:
        print(f"❌ خطأ في الاختبار الشامل: {e}")
        logger.exception("خطأ في الاختبار الشامل")

if __name__ == "__main__":
    asyncio.run(main())