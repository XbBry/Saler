#!/usr/bin/env python3
"""
نظام فحوصات الصحة المتقدم - Advanced Health Check System
نظام شامل ومتقدم لفحص صحة التطبيق والبنية التحتية مع التنبيهات والتقرير الذكي
Advanced and comprehensive system for checking application and infrastructure health with alerts and intelligent reporting
"""

import asyncio
import aiohttp
import psutil
import redis
import sqlite3
import json
import time
import logging
import smtplib
import ssl
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, asdict
from enum import Enum
import subprocess
import socket
import ssl
import smtplib
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
import yaml
import prometheus_client
from prometheus_client import Gauge, Counter, Histogram
import threading
import schedule
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
import traceback
import sys
import os

class HealthStatus(Enum):
    """حالات الصحة المختلفة"""
    HEALTHY = "healthy"
    WARNING = "warning"
    CRITICAL = "critical"
    UNKNOWN = "unknown"
    DOWN = "down"

class AlertSeverity(Enum):
    """مستويات التنبيه"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class HealthCheckResult:
    """نتيجة فحص الصحة"""
    name: str
    status: HealthStatus
    message: str
    details: Dict[str, Any]
    timestamp: datetime
    duration: float
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class AlertRule:
    """قاعدة التنبيه"""
    name: str
    condition: str
    severity: AlertSeverity
    threshold: float
    duration: int  # بالثواني
    channels: List[str]
    enabled: bool = True
    description: str = ""

@dataclass
class Alert:
    """تنبيه"""
    id: str
    rule_name: str
    severity: AlertSeverity
    message: str
    timestamp: datetime
    source: str
    metadata: Dict[str, Any] = None
    acknowledged: bool = False
    resolved: bool = False

class AdvancedHealthChecker:
    """نظام فحوصات الصحة المتقدم"""
    
    def __init__(self, config_path: str = None):
        self.config = self.load_config(config_path)
        self.logger = self.setup_logging()
        self.results: Dict[str, HealthCheckResult] = {}
        self.alerts: List[Alert] = []
        self.alert_rules: List[AlertRule] = []
        self.metrics = self.setup_metrics()
        self.alert_manager = AlertManager(self.config.get('alerts', {}))
        
        # إعداد المراقبة الدورية
        self.setup_scheduled_checks()
        
        # تحميل قواعد التنبيهات
        self.load_alert_rules()
        
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """تحميل ملف الإعدادات"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """الإعدادات الافتراضية"""
        return {
            "health_checks": {
                "system": {
                    "enabled": True,
                    "interval": 30,  # ثانية
                    "thresholds": {
                        "cpu_usage": 80,
                        "memory_usage": 85,
                        "disk_usage": 90,
                        "network_io": 100000000  # بايت/ثانية
                    }
                },
                "database": {
                    "enabled": True,
                    "interval": 60,
                    "connections": {
                        "primary": {
                            "connection_string": os.getenv('DATABASE_URL', 'postgresql://localhost:5432/saler'),
                            "query": "SELECT 1",
                            "timeout": 10
                        }
                    }
                },
                "redis": {
                    "enabled": True,
                    "interval": 30,
                    "connections": {
                        "cache": {
                            "url": os.getenv('REDIS_URL', 'redis://localhost:6379'),
                            "timeout": 5
                        }
                    }
                },
                "external_services": {
                    "enabled": True,
                    "interval": 120,
                    "services": {
                        "api_gateway": {
                            "url": "https://api.saler.com/health",
                            "timeout": 10,
                            "expected_status": 200
                        },
                        "payment_gateway": {
                            "url": "https://payments.saler.com/status",
                            "timeout": 10,
                            "expected_status": 200
                        }
                    }
                }
            },
            "alerts": {
                "enabled": True,
                "channels": {
                    "email": {
                        "enabled": True,
                        "smtp_server": os.getenv('SMTP_SERVER', 'smtp.gmail.com'),
                        "smtp_port": 587,
                        "username": os.getenv('SMTP_USERNAME'),
                        "password": os.getenv('SMTP_PASSWORD'),
                        "from_email": os.getenv('ALERT_FROM_EMAIL', 'alerts@saler.com'),
                        "to_emails": os.getenv('ALERT_TO_EMAILS', '').split(',')
                    },
                    "slack": {
                        "enabled": False,
                        "webhook_url": os.getenv('SLACK_WEBHOOK_URL')
                    },
                    "discord": {
                        "enabled": False,
                        "webhook_url": os.getenv('DISCORD_WEBHOOK_URL')
                    }
                }
            },
            "monitoring": {
                "enable_metrics": True,
                "metrics_port": 8001,
                "enable_prometheus": True,
                "enable_grafana": True
            },
            "retention": {
                "health_data_days": 30,
                "alerts_days": 90
            }
        }
    
    def setup_logging(self) -> logging.Logger:
        """إعداد نظام السجلات"""
        logger = logging.getLogger('HealthChecker')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            # معالج الملف
            file_handler = logging.FileHandler('health_checks.log', encoding='utf-8')
            file_formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(file_formatter)
            logger.addHandler(file_handler)
            
            # معالج وحدة التحكم
            console_handler = logging.StreamHandler()
            console_formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
            console_handler.setFormatter(console_formatter)
            logger.addHandler(console_handler)
        
        return logger
    
    def setup_metrics(self) -> Dict[str, Any]:
        """إعداد مقاييس Prometheus"""
        if not self.config.get('monitoring', {}).get('enable_metrics'):
            return {}
        
        metrics = {
            'health_check_duration': Histogram(
                'health_check_duration_seconds',
                'Duration of health checks',
                ['check_name', 'status']
            ),
            'health_check_status': Counter(
                'health_check_status_total',
                'Health check status counts',
                ['check_name', 'status']
            ),
            'system_cpu_usage': Gauge(
                'system_cpu_usage_percent',
                'System CPU usage percentage'
            ),
            'system_memory_usage': Gauge(
                'system_memory_usage_percent',
                'System memory usage percentage'
            ),
            'system_disk_usage': Gauge(
                'system_disk_usage_percent',
                'System disk usage percentage'
            ),
            'database_connections': Gauge(
                'database_connections_active',
                'Active database connections',
                ['database']
            ),
            'redis_connected_clients': Gauge(
                'redis_connected_clients',
                'Connected Redis clients'
            ),
            'alert_count': Counter(
                'alerts_total',
                'Total alert count',
                ['severity']
            ),
            'service_response_time': Histogram(
                'service_response_time_seconds',
                'Service response time',
                ['service']
            )
        }
        
        # تشغيل خادم Prometheus
        if self.config.get('monitoring', {}).get('enable_prometheus'):
            prometheus_client.start_http_server(
                self.config.get('monitoring', {}).get('metrics_port', 8001)
            )
        
        return metrics
    
    def setup_scheduled_checks(self):
        """إعداد الفحوصات الدورية"""
        # فحص النظام
        if self.config['health_checks']['system']['enabled']:
            schedule.every(
                self.config['health_checks']['system']['interval']
            ).seconds.do(self.check_system_health)
        
        # فحص قاعدة البيانات
        if self.config['health_checks']['database']['enabled']:
            schedule.every(
                self.config['health_checks']['database']['interval']
            ).seconds.do(self.check_database_health)
        
        # فحص Redis
        if self.config['health_checks']['redis']['enabled']:
            schedule.every(
                self.config['health_checks']['redis']['interval']
            ).seconds.do(self.check_redis_health)
        
        # فحص الخدمات الخارجية
        if self.config['health_checks']['external_services']['enabled']:
            schedule.every(
                self.config['health_checks']['external_services']['interval']
            ).seconds.do(self.check_external_services_health)
        
        # تقرير يومي
        schedule.every().day.at("00:00").do(self.generate_daily_report)
        
        # تنظيف البيانات القديمة
        schedule.every().day.at("01:00").do(self.cleanup_old_data)
    
    def load_alert_rules(self):
        """تحميل قواعد التنبيهات"""
        self.alert_rules = [
            AlertRule(
                name="HighCPUUsage",
                condition="system.cpu_usage > 80",
                severity=AlertSeverity.HIGH,
                threshold=80,
                duration=300,  # 5 دقائق
                channels=["email", "slack"],
                description="استخدام المعالج عالي جداً"
            ),
            AlertRule(
                name="HighMemoryUsage",
                condition="system.memory_usage > 85",
                severity=AlertSeverity.HIGH,
                threshold=85,
                duration=300,
                channels=["email"],
                description="استخدام الذاكرة عالي جداً"
            ),
            AlertRule(
                name="DiskSpaceLow",
                condition="system.disk_usage > 90",
                severity=AlertSeverity.CRITICAL,
                threshold=90,
                duration=60,  # دقيقة واحدة
                channels=["email", "slack"],
                description="مساحة القرص منخفضة جداً"
            ),
            AlertRule(
                name="DatabaseDown",
                condition="database.status == 'down'",
                severity=AlertSeverity.CRITICAL,
                threshold=1,
                duration=30,
                channels=["email", "slack"],
                description="قاعدة البيانات غير متاحة"
            ),
            AlertRule(
                name="RedisDown",
                condition="redis.status == 'down'",
                severity=AlertSeverity.HIGH,
                threshold=1,
                duration=60,
                channels=["email"],
                description="Redis غير متاح"
            ),
            AlertRule(
                name="ExternalServiceDown",
                condition="external_service.status == 'down'",
                severity=AlertSeverity.MEDIUM,
                threshold=1,
                duration=120,
                channels=["email"],
                description="خدمة خارجية غير متاحة"
            )
        ]
    
    async def check_system_health(self) -> HealthCheckResult:
        """فحص صحة النظام"""
        start_time = time.time()
        
        try:
            details = {}
            warnings = []
            
            # فحص استخدام المعالج
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
            
            details['cpu'] = {
                'usage_percent': cpu_percent,
                'count': cpu_count,
                'load_average': load_avg
            }
            
            cpu_threshold = self.config['health_checks']['system']['thresholds']['cpu_usage']
            if cpu_percent > cpu_threshold:
                warnings.append(f"استخدام المعالج عالي: {cpu_percent}%")
            
            # فحص الذاكرة
            memory = psutil.virtual_memory()
            details['memory'] = {
                'usage_percent': memory.percent,
                'total_gb': round(memory.total / (1024**3), 2),
                'available_gb': round(memory.available / (1024**3), 2),
                'used_gb': round(memory.used / (1024**3), 2)
            }
            
            memory_threshold = self.config['health_checks']['system']['thresholds']['memory_usage']
            if memory.percent > memory_threshold:
                warnings.append(f"استخدام الذاكرة عالي: {memory.percent}%")
            
            # فحص القرص
            disk_details = {}
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_details[partition.mountpoint] = {
                        'usage_percent': usage.percent,
                        'total_gb': round(usage.total / (1024**3), 2),
                        'free_gb': round(usage.free / (1024**3), 2),
                        'used_gb': round(usage.used / (1024**3), 2)
                    }
                    
                    disk_threshold = self.config['health_checks']['system']['thresholds']['disk_usage']
                    if usage.percent > disk_threshold:
                        warnings.append(f"مساحة القرص منخفضة: {partition.mountpoint} - {usage.percent}%")
                        
                except PermissionError:
                    continue
            
            details['disk'] = disk_details
            
            # فحص الشبكة
            network_io = psutil.net_io_counters()
            details['network'] = {
                'bytes_sent': network_io.bytes_sent,
                'bytes_recv': network_io.bytes_recv,
                'packets_sent': network_io.packets_sent,
                'packets_recv': network_io.packets_recv
            }
            
            # فحص العمليات
            process_count = len(psutil.pids())
            details['processes'] = {
                'count': process_count
            }
            
            # تحديد الحالة العامة
            if warnings:
                if any('critical' in w.lower() for w in warnings):
                    status = HealthStatus.CRITICAL
                else:
                    status = HealthStatus.WARNING
            else:
                status = HealthStatus.HEALTHY
            
            message = "النظام يعمل بشكل طبيعي"
            if warnings:
                message = "تحذيرات النظام: " + "; ".join(warnings)
            
            # تحديث المقاييس
            if self.metrics:
                self.metrics['system_cpu_usage'].set(cpu_percent)
                self.metrics['system_memory_usage'].set(memory.percent)
                
                for mountpoint, disk_info in disk_details.items():
                    # يمكن إضافة مقاييس منفصلة لكل نقطة mounting
                    pass
            
            duration = time.time() - start_time
            
            result = HealthCheckResult(
                name="system",
                status=status,
                message=message,
                details=details,
                timestamp=datetime.now(),
                duration=duration
            )
            
            self.results['system'] = result
            self.logger.info(f"فحص صحة النظام: {status.value} ({duration:.2f}s)")
            
            # فحص التنبيهات
            await self.check_alert_rules('system', result)
            
            return result
            
        except Exception as e:
            self.logger.error(f"خطأ في فحص صحة النظام: {e}")
            return HealthCheckResult(
                name="system",
                status=HealthStatus.CRITICAL,
                message=f"خطأ في فحص النظام: {str(e)}",
                details={'error': str(e)},
                timestamp=datetime.now(),
                duration=time.time() - start_time
            )
    
    async def check_database_health(self) -> Dict[str, HealthCheckResult]:
        """فحص صحة قاعدة البيانات"""
        results = {}
        
        for db_name, db_config in self.config['health_checks']['database']['connections'].items():
            start_time = time.time()
            
            try:
                connection_string = db_config['connection_string']
                query = db_config.get('query', 'SELECT 1')
                timeout = db_config.get('timeout', 10)
                
                # الاتصال بقاعدة البيانات
                conn = psycopg2.connect(connection_string, connect_timeout=timeout)
                cursor = conn.cursor()
                
                # تنفيذ الاستعلام
                start_query_time = time.time()
                cursor.execute(query)
                cursor.fetchone()
                query_time = time.time() - start_query_time
                
                # معلومات إضافية
                cursor.execute("SELECT version();")
                version = cursor.fetchone()[0]
                
                cursor.execute("SELECT count(*) FROM information_schema.tables;")
                table_count = cursor.fetchone()[0]
                
                # إحصائيات الاتصال
                cursor.execute("SELECT count(*) FROM pg_stat_activity;")
                active_connections = cursor.fetchone()[0]
                
                cursor.execute("SELECT setting FROM pg_settings WHERE name = 'max_connections';")
                max_connections = int(cursor.fetchone()[0])
                
                conn.close()
                
                # تحديد الحالة
                status = HealthStatus.HEALTHY
                message = f"قاعدة البيانات {db_name} تعمل بشكل طبيعي"
                
                if active_connections > max_connections * 0.8:
                    status = HealthStatus.WARNING
                    message = f"عدد الاتصالات قريب من الحد الأقصى: {active_connections}/{max_connections}"
                
                details = {
                    'connection_status': 'connected',
                    'query_time': round(query_time, 3),
                    'version': version,
                    'table_count': table_count,
                    'active_connections': active_connections,
                    'max_connections': max_connections,
                    'connection_utilization': round((active_connections / max_connections) * 100, 2)
                }
                
                duration = time.time() - start_time
                
                result = HealthCheckResult(
                    name=f"database_{db_name}",
                    status=status,
                    message=message,
                    details=details,
                    timestamp=datetime.now(),
                    duration=duration
                )
                
                # تحديث المقاييس
                if self.metrics:
                    self.metrics['database_connections'].labels(database=db_name).set(active_connections)
                    self.metrics['health_check_duration'].labels(check_name=f"database_{db_name}", status=status.value).observe(duration)
                    self.metrics['health_check_status'].labels(check_name=f"database_{db_name}", status=status.value).inc()
                
                results[db_name] = result
                self.logger.info(f"فحص قاعدة البيانات {db_name}: {status.value}")
                
                # فحص التنبيهات
                await self.check_alert_rules(f'database_{db_name}', result)
                
            except Exception as e:
                error_msg = f"خطأ في فحص قاعدة البيانات {db_name}: {str(e)}"
                self.logger.error(error_msg)
                
                result = HealthCheckResult(
                    name=f"database_{db_name}",
                    status=HealthStatus.DOWN,
                    message=error_msg,
                    details={'error': str(e)},
                    timestamp=datetime.now(),
                    duration=time.time() - start_time
                )
                
                results[db_name] = result
                await self.check_alert_rules(f'database_{db_name}', result)
        
        self.results.update(results)
        return results
    
    async def check_redis_health(self) -> Dict[str, HealthCheckResult]:
        """فحص صحة Redis"""
        results = {}
        
        for redis_name, redis_config in self.config['health_checks']['redis']['connections'].items():
            start_time = time.time()
            
            try:
                redis_url = redis_config['url']
                timeout = redis_config.get('timeout', 5)
                
                # الاتصال بـ Redis
                r = redis.from_url(redis_url, socket_timeout=timeout)
                
                # اختبار الاتصال
                r.ping()
                
                # جمع معلومات
                info = r.info()
                
                details = {
                    'connection_status': 'connected',
                    'version': info.get('redis_version', 'Unknown'),
                    'connected_clients': info.get('connected_clients', 0),
                    'used_memory': info.get('used_memory', 0),
                    'used_memory_human': info.get('used_memory_human', '0B'),
                    'used_memory_peak': info.get('used_memory_peak', 0),
                    'used_memory_peak_human': info.get('used_memory_peak_human', '0B'),
                    'total_commands_processed': info.get('total_commands_processed', 0),
                    'keyspace_hits': info.get('keyspace_hits', 0),
                    'keyspace_misses': info.get('keyspace_misses', 0),
                    'hit_rate': 0  # سيتم حسابها
                }
                
                # حساب معدل الضرب (Hit Rate)
                hits = info.get('keyspace_hits', 0)
                misses = info.get('keyspace_misses', 0)
                total_requests = hits + misses
                if total_requests > 0:
                    details['hit_rate'] = round((hits / total_requests) * 100, 2)
                
                # تحديد الحالة
                status = HealthStatus.HEALTHY
                message = f"Redis {redis_name} يعمل بشكل طبيعي"
                
                connected_clients = info.get('connected_clients', 0)
                if connected_clients > 100:  # حد افتراضي
                    status = HealthStatus.WARNING
                    message = f"عدد الاتصالات المرتفع: {connected_clients}"
                
                if details['hit_rate'] < 80:
                    if status == HealthStatus.HEALTHY:
                        status = HealthStatus.WARNING
                    message += f"، معدل الضرب منخفض: {details['hit_rate']}%"
                
                duration = time.time() - start_time
                
                result = HealthCheckResult(
                    name=f"redis_{redis_name}",
                    status=status,
                    message=message,
                    details=details,
                    timestamp=datetime.now(),
                    duration=duration
                )
                
                # تحديث المقاييس
                if self.metrics:
                    self.metrics['redis_connected_clients'].set(connected_clients)
                    self.metrics['health_check_duration'].labels(check_name=f"redis_{redis_name}", status=status.value).observe(duration)
                    self.metrics['health_check_status'].labels(check_name=f"redis_{redis_name}", status=status.value).inc()
                
                results[redis_name] = result
                self.logger.info(f"فحص Redis {redis_name}: {status.value}")
                
                # فحص التنبيهات
                await self.check_alert_rules(f'redis_{redis_name}', result)
                
            except Exception as e:
                error_msg = f"خطأ في فحص Redis {redis_name}: {str(e)}"
                self.logger.error(error_msg)
                
                result = HealthCheckResult(
                    name=f"redis_{redis_name}",
                    status=HealthStatus.DOWN,
                    message=error_msg,
                    details={'error': str(e)},
                    timestamp=datetime.now(),
                    duration=time.time() - start_time
                )
                
                results[redis_name] = result
                await self.check_alert_rules(f'redis_{redis_name}', result)
        
        self.results.update(results)
        return results
    
    async def check_external_services_health(self) -> Dict[str, HealthCheckResult]:
        """فحص صحة الخدمات الخارجية"""
        results = {}
        
        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            
            for service_name, service_config in self.config['health_checks']['external_services']['services'].items():
                start_time = time.time()
                
                try:
                    url = service_config['url']
                    timeout = service_config.get('timeout', 10)
                    expected_status = service_config.get('expected_status', 200)
                    
                    # إرسال طلب HTTP
                    async with session.get(url, timeout=timeout) as response:
                        response_time = time.time() - start_time
                        status_code = response.status
                        content = await response.text()
                        
                        # تحديد الحالة
                        if status_code == expected_status:
                            status = HealthStatus.HEALTHY
                            message = f"الخدمة {service_name} تعمل بشكل طبيعي"
                        elif 400 <= status_code < 500:
                            status = HealthStatus.WARNING
                            message = f"الخدمة {service_name} ترجع خطأ العميل: {status_code}"
                        else:
                            status = HealthStatus.CRITICAL
                            message = f"الخدمة {service_name} غير متاحة: {status_code}"
                        
                        details = {
                            'url': url,
                            'status_code': status_code,
                            'expected_status': expected_status,
                            'response_time': round(response_time, 3),
                            'content_length': len(content),
                            'response_headers': dict(response.headers)
                        }
                        
                        result = HealthCheckResult(
                            name=f"external_service_{service_name}",
                            status=status,
                            message=message,
                            details=details,
                            timestamp=datetime.now(),
                            duration=response_time
                        )
                        
                        # تحديث المقاييس
                        if self.metrics:
                            self.metrics['service_response_time'].labels(service=service_name).observe(response_time)
                            self.metrics['health_check_duration'].labels(check_name=f"external_service_{service_name}", status=status.value).observe(response_time)
                            self.metrics['health_check_status'].labels(check_name=f"external_service_{service_name}", status=status.value).inc()
                        
                        results[service_name] = result
                        self.logger.info(f"فحص الخدمة الخارجية {service_name}: {status.value}")
                        
                        # فحص التنبيهات
                        await self.check_alert_rules(f'external_service_{service_name}', result)
                        
                except asyncio.TimeoutError:
                    error_msg = f"انتهت المهلة الزمنية للوصول إلى الخدمة {service_name}"
                    result = HealthCheckResult(
                        name=f"external_service_{service_name}",
                        status=HealthStatus.DOWN,
                        message=error_msg,
                        details={'timeout': True},
                        timestamp=datetime.now(),
                        duration=time.time() - start_time
                    )
                    results[service_name] = result
                    await self.check_alert_rules(f'external_service_{service_name}', result)
                    
                except Exception as e:
                    error_msg = f"خطأ في فحص الخدمة الخارجية {service_name}: {str(e)}"
                    self.logger.error(error_msg)
                    
                    result = HealthCheckResult(
                        name=f"external_service_{service_name}",
                        status=HealthStatus.DOWN,
                        message=error_msg,
                        details={'error': str(e)},
                        timestamp=datetime.now(),
                        duration=time.time() - start_time
                    )
                    results[service_name] = result
                    await self.check_alert_rules(f'external_service_{service_name}', result)
        
        self.results.update(results)
        return results
    
    async def check_alert_rules(self, check_name: str, result: HealthCheckResult):
        """فحص قواعد التنبيهات"""
        if not self.config.get('alerts', {}).get('enabled'):
            return
        
        current_time = datetime.now()
        
        for rule in self.alert_rules:
            if not rule.enabled:
                continue
            
            # التحقق من الشروط
            if self.evaluate_alert_condition(rule, check_name, result):
                # التحقق من المدة الزمنية
                alert_key = f"{rule.name}_{check_name}"
                existing_alert = next(
                    (a for a in self.alerts if a.rule_name == rule.name and a.source == check_name and not a.resolved),
                    None
                )
                
                if not existing_alert:
                    # إنشاء تنبيه جديد
                    alert = Alert(
                        id=f"alert_{int(current_time.timestamp())}_{rule.name}_{check_name}",
                        rule_name=rule.name,
                        severity=rule.severity,
                        message=rule.description,
                        timestamp=current_time,
                        source=check_name,
                        metadata={
                            'result': result.to_dict(),
                            'threshold': rule.threshold,
                            'condition': rule.condition
                        }
                    )
                    
                    self.alerts.append(alert)
                    
                    # إرسال التنبيه
                    await self.alert_manager.send_alert(alert)
                    
                    # تحديث المقاييس
                    if self.metrics:
                        self.metrics['alert_count'].labels(severity=rule.severity.value).inc()
                    
                    self.logger.warning(f"تم إنشاء تنبيه: {rule.name} - {rule.description}")
    
    def evaluate_alert_condition(self, rule: AlertRule, check_name: str, result: HealthCheckResult) -> bool:
        """تقييم شرط التنبيه"""
        try:
            # تحليل الشروط البسيطة
            if rule.condition == "system.cpu_usage > 80" and check_name == "system":
                return result.details.get('cpu', {}).get('usage_percent', 0) > 80
            
            elif rule.condition == "system.memory_usage > 85" and check_name == "system":
                return result.details.get('memory', {}).get('usage_percent', 0) > 85
            
            elif rule.condition == "system.disk_usage > 90" and check_name == "system":
                for mountpoint, disk_info in result.details.get('disk', {}).items():
                    if disk_info.get('usage_percent', 0) > 90:
                        return True
                return False
            
            elif rule.condition == "database.status == 'down'" and check_name.startswith("database_"):
                return result.status == HealthStatus.DOWN
            
            elif rule.condition == "redis.status == 'down'" and check_name.startswith("redis_"):
                return result.status == HealthStatus.DOWN
            
            elif rule.condition == "external_service.status == 'down'" and check_name.startswith("external_service_"):
                return result.status == HealthStatus.DOWN
            
            return False
            
        except Exception as e:
            self.logger.error(f"خطأ في تقييم شرط التنبيه {rule.name}: {e}")
            return False
    
    async def run_comprehensive_health_check(self) -> Dict[str, Any]:
        """تشغيل فحص صحة شامل"""
        self.logger.info("بدء الفحص الشامل لصحة النظام...")
        
        start_time = time.time()
        results = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': HealthStatus.HEALTHY,
            'checks': {}
        }
        
        # تشغيل جميع الفحوصات بالتزامن
        tasks = []
        
        if self.config['health_checks']['system']['enabled']:
            tasks.append(self.check_system_health())
        
        if self.config['health_checks']['database']['enabled']:
            tasks.append(self.check_database_health())
        
        if self.config['health_checks']['redis']['enabled']:
            tasks.append(self.check_redis_health())
        
        if self.config['health_checks']['external_services']['enabled']:
            tasks.append(self.check_external_services_health())
        
        # انتظار انتهاء جميع الفحوصات
        check_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # تجميع النتائج
        for result in check_results:
            if isinstance(result, Exception):
                self.logger.error(f"خطأ في أحد الفحوصات: {result}")
                continue
            
            if isinstance(result, HealthCheckResult):
                results['checks'][result.name] = result.to_dict()
            elif isinstance(result, dict):
                for name, res in result.items():
                    if isinstance(res, HealthCheckResult):
                        results['checks'][res.name] = res.to_dict()
        
        # تحديد الحالة العامة
        statuses = [check['status'] for check in results['checks'].values()]
        if HealthStatus.CRITICAL in statuses or HealthStatus.DOWN in statuses:
            results['overall_status'] = HealthStatus.CRITICAL
        elif HealthStatus.WARNING in statuses:
            results['overall_status'] = HealthStatus.WARNING
        else:
            results['overall_status'] = HealthStatus.HEALTHY
        
        # إضافة التنبيهات النشطة
        active_alerts = [a for a in self.alerts if not a.resolved]
        results['active_alerts'] = [asdict(alert) for alert in active_alerts]
        results['alert_count'] = len(active_alerts)
        
        results['duration'] = time.time() - start_time
        
        self.logger.info(f"انتهاء الفحص الشامل - الحالة العامة: {results['overall_status'].value}")
        
        return results
    
    def generate_daily_report(self):
        """إنتاج تقرير يومي"""
        today = datetime.now().date()
        
        # جمع إحصائيات اليوم
        today_checks = [
            result for result in self.results.values() 
            if result.timestamp.date() == today
        ]
        
        if not today_checks:
            self.logger.info("لا توجد فحوصات اليوم لإنتاج التقرير")
            return
        
        # إحصائيات
        stats = {
            'total_checks': len(today_checks),
            'healthy_count': len([r for r in today_checks if r.status == HealthStatus.HEALTHY]),
            'warning_count': len([r for r in today_checks if r.status == HealthStatus.WARNING]),
            'critical_count': len([r for r in today_checks if r.status == HealthStatus.CRITICAL]),
            'down_count': len([r for r in today_checks if r.status == HealthStatus.DOWN]),
            'average_duration': sum(r.duration for r in today_checks) / len(today_checks),
            'checks_by_service': {}
        }
        
        # تجميع حسب الخدمة
        for result in today_checks:
            service = result.name.split('_')[0]
            if service not in stats['checks_by_service']:
                stats['checks_by_service'][service] = {'total': 0, 'errors': 0}
            
            stats['checks_by_service'][service]['total'] += 1
            if result.status in [HealthStatus.WARNING, HealthStatus.CRITICAL, HealthStatus.DOWN]:
                stats['checks_by_service'][service]['errors'] += 1
        
        # حفظ التقرير
        report_path = f"health_report_{today.isoformat()}.json"
        report_data = {
            'date': today.isoformat(),
            'statistics': stats,
            'alerts': [asdict(alert) for alert in self.alerts if alert.timestamp.date() == today],
            'generated_at': datetime.now().isoformat()
        }
        
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
        
        self.logger.info(f"تم إنتاج التقرير اليومي: {report_path}")
    
    def cleanup_old_data(self):
        """تنظيف البيانات القديمة"""
        retention_days = self.config.get('retention', {}).get('health_data_days', 30)
        cutoff_date = datetime.now() - timedelta(days=retention_days)
        
        # تنظيف نتائج الفحوصات القديمة
        old_results = [
            name for name, result in self.results.items() 
            if result.timestamp < cutoff_date
        ]
        
        for name in old_results:
            del self.results[name]
        
        # تنظيف التنبيهات القديمة
        old_alerts = [
            alert for alert in self.alerts 
            if alert.timestamp < cutoff_date
        ]
        
        for alert in old_alerts:
            self.alerts.remove(alert)
        
        self.logger.info(f"تم تنظيف البيانات الأقدم من {retention_days} يوم")
    
    def start_monitoring_loop(self):
        """بدء حلقة المراقبة"""
        self.logger.info("بدء حلقة المراقبة...")
        
        while True:
            try:
                schedule.run_pending()
                time.sleep(1)
            except KeyboardInterrupt:
                self.logger.info("تم إيقاف المراقبة بواسطة المستخدم")
                break
            except Exception as e:
                self.logger.error(f"خطأ في حلقة المراقبة: {e}")
                time.sleep(5)  # انتظار 5 ثوان قبل المحاولة مرة أخرى
    
    def get_health_summary(self) -> Dict[str, Any]:
        """الحصول على ملخص صحة النظام"""
        active_alerts = [a for a in self.alerts if not a.resolved]
        
        summary = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': HealthStatus.HEALTHY,
            'last_check': None,
            'service_status': {},
            'active_alerts': len(active_alerts),
            'critical_alerts': len([a for a in active_alerts if a.severity == AlertSeverity.CRITICAL]),
            'system_health': {}
        }
        
        # آخر فحص
        if self.results:
            latest_result = max(self.results.values(), key=lambda r: r.timestamp)
            summary['last_check'] = latest_result.timestamp.isoformat()
            
            # حالة الخدمات
            for name, result in self.results.items():
                summary['service_status'][name] = {
                    'status': result.status.value,
                    'message': result.message,
                    'last_check': result.timestamp.isoformat()
                }
            
            # الحالة العامة
            statuses = [r.status for r in self.results.values()]
            if HealthStatus.CRITICAL in statuses or HealthStatus.DOWN in statuses:
                summary['overall_status'] = HealthStatus.CRITICAL
            elif HealthStatus.WARNING in statuses:
                summary['overall_status'] = HealthStatus.WARNING
            
            # صحة النظام
            system_result = self.results.get('system')
            if system_result:
                summary['system_health'] = {
                    'cpu_usage': system_result.details.get('cpu', {}).get('usage_percent'),
                    'memory_usage': system_result.details.get('memory', {}).get('usage_percent'),
                    'disk_usage': {
                        mountpoint: info['usage_percent'] 
                        for mountpoint, info in system_result.details.get('disk', {}).items()
                    }
                }
        
        return summary


class AlertManager:
    """مدير التنبيهات"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('AlertManager')
        self.notification_handlers = self.setup_notification_handlers()
    
    def setup_notification_handlers(self) -> Dict[str, Any]:
        """إعداد معالجات الإشعارات"""
        handlers = {}
        
        # البريد الإلكتروني
        if self.config.get('channels', {}).get('email', {}).get('enabled'):
            handlers['email'] = EmailNotificationHandler(
                self.config['channels']['email']
            )
        
        # Slack
        if self.config.get('channels', {}).get('slack', {}).get('enabled'):
            handlers['slack'] = SlackNotificationHandler(
                self.config['channels']['slack']
            )
        
        # Discord
        if self.config.get('channels', {}).get('discord', {}).get('enabled'):
            handlers['discord'] = DiscordNotificationHandler(
                self.config['channels']['discord']
            )
        
        return handlers
    
    async def send_alert(self, alert: Alert):
        """إرسال تنبيه"""
        try:
            # إعداد محتوى التنبيه
            message = self.format_alert_message(alert)
            
            # إرسال عبر جميع القنوات المتاحة
            for channel in self.get_channels_for_alert(alert):
                if channel in self.notification_handlers:
                    await self.notification_handlers[channel].send(alert, message)
                    self.logger.info(f"تم إرسال التنبيه عبر {channel}")
                else:
                    self.logger.warning(f"معالج القناة {channel} غير متوفر")
            
        except Exception as e:
            self.logger.error(f"خطأ في إرسال التنبيه: {e}")
    
    def format_alert_message(self, alert: Alert) -> str:
        """تنسيق رسالة التنبيه"""
        severity_icons = {
            AlertSeverity.LOW: "🟢",
            AlertSeverity.MEDIUM: "🟡",
            AlertSeverity.HIGH: "🟠",
            AlertSeverity.CRITICAL: "🔴"
        }
        
        icon = severity_icons.get(alert.severity, "⚪")
        
        message = f"""
{icon} تنبيه - {alert.severity.value.upper()}

القاعدة: {alert.rule_name}
المصدر: {alert.source}
الوقت: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
الرسالة: {alert.message}

التفاصيل:
{json.dumps(alert.metadata, indent=2, ensure_ascii=False, default=str)}
        """.strip()
        
        return message
    
    def get_channels_for_alert(self, alert: Alert) -> List[str]:
        """الحصول على القنوات المناسبة للتنبيه"""
        # يمكن تطبيق منطق معقد هنا لتحديد القنوات
        # بناءً على مستوى الخطورة والمصدر
        channels = []
        
        if alert.severity == AlertSeverity.CRITICAL:
            channels.extend(['email', 'slack'])
        elif alert.severity == AlertSeverity.HIGH:
            channels.append('email')
        elif alert.severity == AlertSeverity.MEDIUM:
            if random.random() > 0.5:  # 50% chance
                channels.append('email')
        elif alert.severity == AlertSeverity.LOW:
            # التنبيهات المنخفضة يمكن إرسالها عبر Slack فقط
            channels.append('slack')
        
        return channels


class EmailNotificationHandler:
    """معالج إشعارات البريد الإلكتروني"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.smtp_server = config['smtp_server']
        self.smtp_port = config['smtp_port']
        self.username = config['username']
        self.password = config['password']
        self.from_email = config['from_email']
        self.to_emails = config['to_emails']
    
    async def send(self, alert: Alert, message: str):
        """إرسال إشعار البريد الإلكتروني"""
        try:
            # إنشاء الرسالة
            msg = MimeMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(self.to_emails)
            msg['Subject'] = f"تنبيه - {alert.severity.value.upper()} - {alert.rule_name}"
            
            # إضافة المحتوى
            msg.attach(MimeText(message, 'plain', 'utf-8'))
            
            # إرسال الرسالة
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(msg)
            
        except Exception as e:
            raise Exception(f"فشل إرسال البريد الإلكتروني: {e}")


class SlackNotificationHandler:
    """معالج إشعارات Slack"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_url = config['webhook_url']
    
    async def send(self, alert: Alert, message: str):
        """إرسال إشعار Slack"""
        try:
            payload = {
                "text": f"تنبيه من نظام المراقبة",
                "attachments": [
                    {
                        "color": self.get_color_for_severity(alert.severity),
                        "fields": [
                            {
                                "title": "القاعدة",
                                "value": alert.rule_name,
                                "short": True
                            },
                            {
                                "title": "المستوى",
                                "value": alert.severity.value,
                                "short": True
                            },
                            {
                                "title": "المصدر",
                                "value": alert.source,
                                "short": True
                            },
                            {
                                "title": "الوقت",
                                "value": alert.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                                "short": True
                            },
                            {
                                "title": "الرسالة",
                                "value": alert.message,
                                "short": False
                            }
                        ]
                    }
                ]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status != 200:
                        raise Exception(f"Slack API returned {response.status}")
            
        except Exception as e:
            raise Exception(f"فشل إرسال Slack: {e}")
    
    def get_color_for_severity(self, severity: AlertSeverity) -> str:
        """الحصول على لون للتنبيه حسب مستوى الخطورة"""
        colors = {
            AlertSeverity.LOW: "good",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "warning",
            AlertSeverity.CRITICAL: "danger"
        }
        return colors.get(severity, "good")


class DiscordNotificationHandler:
    """معالج إشعارات Discord"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_url = config['webhook_url']
    
    async def send(self, alert: Alert, message: str):
        """إرسال إشعار Discord"""
        try:
            embed = {
                "title": f"تنبيه - {alert.rule_name}",
                "description": alert.message,
                "color": self.get_color_for_severity(alert.severity),
                "fields": [
                    {
                        "name": "المستوى",
                        "value": alert.severity.value,
                        "inline": True
                    },
                    {
                        "name": "المصدر",
                        "value": alert.source,
                        "inline": True
                    },
                    {
                        "name": "الوقت",
                        "value": alert.timestamp.strftime('%Y-%m-%d %H:%M:%S'),
                        "inline": True
                    }
                ],
                "timestamp": alert.timestamp.isoformat()
            }
            
            payload = {
                "embeds": [embed]
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(self.webhook_url, json=payload) as response:
                    if response.status not in [200, 204]:
                        raise Exception(f"Discord API returned {response.status}")
            
        except Exception as e:
            raise Exception(f"فشل إرسال Discord: {e}")
    
    def get_color_for_severity(self, severity: AlertSeverity) -> int:
        """الحصول على لون للتنبيه حسب مستوى الخطورة"""
        colors = {
            AlertSeverity.LOW: 0x00FF00,      # أخضر
            AlertSeverity.MEDIUM: 0xFFFF00,   # أصفر
            AlertSeverity.HIGH: 0xFF8000,     # برتقالي
            AlertSeverity.CRITICAL: 0xFF0000  # أحمر
        }
        return colors.get(severity, 0x00FF00)


# دالة مساعدة لتشغيل النظام
async def main():
    """الدالة الرئيسية لتشغيل نظام المراقبة"""
    
    # إنشاء فاحص الصحة المتقدم
    health_checker = AdvancedHealthChecker()
    
    try:
        # تشغيل فحص شامل فوري
        print("تشغيل فحص صحة شامل...")
        result = await health_checker.run_comprehensive_health_check()
        
        print(f"\n=== تقرير فحص صحة النظام ===")
        print(f"الوقت: {result['timestamp']}")
        print(f"الحالة العامة: {result['overall_status'].value}")
        print(f"عدد الفحوصات: {len(result['checks'])}")
        print(f"عدد التنبيهات النشطة: {result['active_alerts']}")
        print(f"مدة الفحص: {result['duration']:.2f} ثانية")
        
        # عرض تفاصيل الفحوصات
        print(f"\n=== تفاصيل الفحوصات ===")
        for check_name, check_data in result['checks'].items():
            print(f"{check_name}: {check_data['status']} - {check_data['message']}")
            if check_data['details']:
                for key, value in check_data['details'].items():
                    if isinstance(value, dict):
                        print(f"  {key}: {json.dumps(value, ensure_ascii=False)}")
                    else:
                        print(f"  {key}: {value}")
        
        # عرض التنبيهات النشطة
        if result['active_alerts']:
            print(f"\n=== التنبيهات النشطة ===")
            for alert in result['active_alerts']:
                print(f"- {alert['severity']}: {alert['rule_name']} - {alert['message']}")
        
        # حفظ التقرير
        with open('health_check_result.json', 'w', encoding='utf-8') as f:
            json.dump(result, f, indent=2, ensure_ascii=False, default=str)
        
        print(f"\nتم حفظ التقرير في: health_check_result.json")
        
        # تشغيل نظام المراقبة الدورية
        print(f"\nبدء نظام المراقبة الدورية... (اضغط Ctrl+C للإيقاف)")
        health_checker.start_monitoring_loop()
        
    except KeyboardInterrupt:
        print(f"\nتم إيقاف المراقبة بواسطة المستخدم")
    except Exception as e:
        print(f"خطأ في تشغيل النظام: {e}")
        traceback.print_exc()
    finally:
        print(f"انتهاء تشغيل نظام المراقبة")


if __name__ == "__main__":
    # تشغيل النظام
    asyncio.run(main())
