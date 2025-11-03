#!/usr/bin/env python3
"""
نظام التنبيهات والإشعارات المتقدم - Advanced Alerting & Notification System
نظام شامل لإدارة التنبيهات مع قنوات إشعار متعددة وسياسات تصعيد ذكية
Comprehensive system for managing alerts with multiple notification channels and intelligent escalation policies
"""

import asyncio
import aiohttp
import smtplib
import ssl
import json
import time
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Callable, Union
from dataclasses import dataclass, asdict
from enum import Enum
import uuid
import threading
import queue
from concurrent.futures import ThreadPoolExecutor
import redis
import sqlite3
from email.mime.text import MimeText
from email.mime.multipart import MimeMultipart
from email.mime.base import MimeBase
from email import encoders
import telepot
import discord
import requests
import yaml

class AlertSeverity(Enum):
    """مستويات خطورة التنبيه"""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

class NotificationChannel(Enum):
    """قنوات الإشعار"""
    EMAIL = "email"
    SLACK = "slack"
    DISCORD = "discord"
    SMS = "sms"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"
    WEBHOOK = "webhook"
    PUSH_NOTIFICATION = "push"
    IN_APP = "in_app"
    SLACK_BOT = "slack_bot"

class EscalationAction(Enum):
    """إجراءات التصعيد"""
    NOTIFY_NEXT_LEVEL = "notify_next_level"
    ESCALATE_MANAGER = "escalate_manager"
    CALL_ONDUTY = "call_onduty"
    PAGING_SYSTEM = "paging_system"
    SMS_BROADCAST = "sms_broadcast"
    AUTO_RESOLUTION = "auto_resolution"

class AlertStatus(Enum):
    """حالات التنبيه"""
    NEW = "new"
    ACKNOWLEDGED = "acknowledged"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"
    ESCALATED = "escalated"
    SUPPRESSED = "suppressed"

@dataclass
class Alert:
    """معلومات التنبيه"""
    id: str
    title: str
    message: str
    severity: AlertSeverity
    category: str
    source: str
    timestamp: datetime
    status: AlertStatus
    metadata: Dict[str, Any]
    assigned_to: Optional[str] = None
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    escalation_level: int = 0
    suppression_rules: List[str] = None
    dedup_key: str = None
    tags: List[str] = None

@dataclass
class EscalationPolicy:
    """سياسة التصعيد"""
    name: str
    severity_levels: List[AlertSeverity]
    time_thresholds: Dict[AlertSeverity, int]  # seconds
    notification_channels: Dict[int, List[NotificationChannel]]  # level -> channels
    escalation_rules: Dict[int, EscalationAction]
    max_escalation_level: int = 5
    auto_resolve_after: Optional[int] = None  # seconds

@dataclass
class NotificationContact:
    """معلومات جهة الاتصال"""
    id: str
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    slack_user: Optional[str] = None
    discord_user: Optional[str] = None
    telegram_user: Optional[str] = None
    on_call_rotation: Optional[str] = None
    timezone: str = "UTC"
    preferences: Dict[NotificationChannel, Dict[str, Any]] = None

class AdvancedNotificationManager:
    """مدير الإشعارات المتقدم"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = self.setup_logging()
        self.alert_queue = queue.Queue()
        self.active_alerts: Dict[str, Alert] = {}
        self.escalation_policies: Dict[str, EscalationPolicy] = {}
        self.notification_channels = {}
        self.suppression_rules = {}
        self.alert_history = []
        
        # إعداد قنوات الإشعار
        self.setup_notification_channels()
        
        # إعداد سياسات التصعيد
        self.setup_escalation_policies()
        
        # إعداد قاعدة البيانات
        self.setup_database()
        
        # بدء معالجات الإشعار
        self.start_notification_workers()
        
        # بدء معالج التصعيد
        self.start_escalation_processor()
    
    def setup_logging(self) -> logging.Logger:
        """إعداد نظام السجلات"""
        logger = logging.getLogger('AdvancedNotificationManager')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def setup_database(self):
        """إعداد قاعدة البيانات"""
        self.db_path = self.config.get('database', {}).get('path', 'alerts.db')
        
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # جدول التنبيهات
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alerts (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                message TEXT NOT NULL,
                severity TEXT NOT NULL,
                category TEXT NOT NULL,
                source TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                status TEXT NOT NULL,
                metadata TEXT,
                assigned_to TEXT,
                acknowledged_by TEXT,
                acknowledged_at TEXT,
                resolved_by TEXT,
                resolved_at TEXT,
                escalation_level INTEGER DEFAULT 0,
                suppression_rules TEXT,
                dedup_key TEXT,
                tags TEXT
            )
        ''')
        
        # جدول جهات الاتصال
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS contacts (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT,
                phone TEXT,
                slack_user TEXT,
                discord_user TEXT,
                telegram_user TEXT,
                on_call_rotation TEXT,
                timezone TEXT DEFAULT 'UTC',
                preferences TEXT
            )
        ''')
        
        # جدول الإشعارات
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                alert_id TEXT NOT NULL,
                channel TEXT NOT NULL,
                recipient TEXT NOT NULL,
                status TEXT NOT NULL,
                sent_at TEXT NOT NULL,
                delivered_at TEXT,
                error_message TEXT,
                FOREIGN KEY (alert_id) REFERENCES alerts (id)
            )
        ''')
        
        conn.commit()
        conn.close()
    
    def setup_notification_channels(self):
        """إعداد قنوات الإشعار"""
        # البريد الإلكتروني
        if self.config.get('channels', {}).get('email', {}).get('enabled'):
            self.notification_channels[NotificationChannel.EMAIL] = EmailChannel(
                self.config['channels']['email']
            )
        
        # Slack
        if self.config.get('channels', {}).get('slack', {}).get('enabled'):
            self.notification_channels[NotificationChannel.SLACK] = SlackChannel(
                self.config['channels']['slack']
            )
        
        # Discord
        if self.config.get('channels', {}).get('discord', {}).get('enabled'):
            self.notification_channels[NotificationChannel.DISCORD] = DiscordChannel(
                self.config['channels']['discord']
            )
        
        # Telegram
        if self.config.get('channels', {}).get('telegram', {}).get('enabled'):
            self.notification_channels[NotificationChannel.TELEGRAM] = TelegramChannel(
                self.config['channels']['telegram']
            )
        
        # Webhook
        if self.config.get('channels', {}).get('webhook', {}).get('enabled'):
            self.notification_channels[NotificationChannel.WEBHOOK] = WebhookChannel(
                self.config['channels']['webhook']
            )
        
        # إشعارات فورية (Push)
        if self.config.get('channels', {}).get('push', {}).get('enabled'):
            self.notification_channels[NotificationChannel.PUSH_NOTIFICATION] = PushChannel(
                self.config['channels']['push']
            )
    
    def setup_escalation_policies(self):
        """إعداد سياسات التصعيد"""
        # سياسة التصعيد القياسية
        standard_policy = EscalationPolicy(
            name="standard",
            severity_levels=[
                AlertSeverity.CRITICAL,
                AlertSeverity.HIGH,
                AlertSeverity.MEDIUM,
                AlertSeverity.LOW
            ],
            time_thresholds={
                AlertSeverity.CRITICAL: 300,    # 5 دقائق
                AlertSeverity.HIGH: 900,        # 15 دقيقة
                AlertSeverity.MEDIUM: 1800,     # 30 دقيقة
                AlertSeverity.LOOD: 3600        # 1 ساعة
            },
            notification_channels={
                0: [NotificationChannel.EMAIL],
                1: [NotificationChannel.SLACK, NotificationChannel.EMAIL],
                2: [NotificationChannel.DISCORD, NotificationChannel.SMS],
                3: [NotificationChannel.TELEGRAM, NotificationChannel.WEBHOOK],
                4: [NotificationChannel.PUSH_NOTIFICATION, NotificationChannel.SMS]
            },
            escalation_rules={
                1: EscalationAction.NOTIFY_NEXT_LEVEL,
                2: EscalationAction.ESCALATE_MANAGER,
                3: EscalationAction.CALL_ONDUTY,
                4: EscalationAction.PAGING_SYSTEM
            },
            max_escalation_level=4,
            auto_resolve_after=86400  # 24 ساعة
        )
        
        self.escalation_policies['standard'] = standard_policy
        
        # سياسة التصعيد للطوارئ
        emergency_policy = EscalationPolicy(
            name="emergency",
            severity_levels=[AlertSeverity.EMERGENCY, AlertSeverity.CRITICAL],
            time_thresholds={
                AlertSeverity.EMERGENCY: 60,    # 1 دقيقة
                AlertSeverity.CRITICAL: 180     # 3 دقائق
            },
            notification_channels={
                0: [NotificationChannel.SMS, NotificationChannel.TELEGRAM, NotificationChannel.PUSH_NOTIFICATION],
                1: [NotificationChannel.SLACK, NotificationChannel.DISCORD],
                2: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK]
            },
            escalation_rules={
                1: EscalationAction.CALL_ONDUTY,
                2: EscalationAction.PAGING_SYSTEM,
                3: EscalationAction.SMS_BROADCAST
            },
            max_escalation_level=3,
            auto_resolve_after=43200  # 12 ساعة
        )
        
        self.escalation_policies['emergency'] = emergency_policy
    
    def start_notification_workers(self):
        """بدء معالجات الإشعار"""
        worker_count = self.config.get('workers', {}).get('notification_workers', 5)
        
        for i in range(worker_count):
            thread = threading.Thread(target=self.notification_worker, daemon=True)
            thread.start()
    
    def start_escalation_processor(self):
        """بدء معالج التصعيد"""
        def process_escalations():
            while True:
                try:
                    self.process_escalations()
                    time.sleep(60)  # فحص كل دقيقة
                except Exception as e:
                    self.logger.error(f"خطأ في معالجة التصعيد: {e}")
                    time.sleep(60)
        
        thread = threading.Thread(target=process_escalations, daemon=True)
        thread.start()
    
    def create_alert(self, title: str, message: str, severity: AlertSeverity,
                    category: str, source: str, metadata: Dict[str, Any] = None,
                    dedup_key: str = None, tags: List[str] = None) -> str:
        """إنشاء تنبيه جديد"""
        
        alert_id = str(uuid.uuid4())
        alert = Alert(
            id=alert_id,
            title=title,
            message=message,
            severity=severity,
            category=category,
            source=source,
            timestamp=datetime.now(),
            status=AlertStatus.NEW,
            metadata=metadata or {},
            escalation_level=0,
            suppression_rules=[],
            dedup_key=dedup_key,
            tags=tags or []
        )
        
        # فحص قواعد التقييد
        if self.is_suppressed(alert):
            alert.status = AlertStatus.SUPPRESSED
            self.logger.info(f"تم تقييد التنبيه: {title}")
            return alert_id
        
        # فحص التنبيهات المكررة
        if self.is_duplicate(alert):
            self.logger.info(f"تم تجاهل التنبيه المكرر: {title}")
            return alert_id
        
        # حفظ التنبيه
        self.active_alerts[alert_id] = alert
        self.save_alert(alert)
        
        # إضافة لطابور المعالجة
        self.alert_queue.put(alert)
        
        self.logger.info(f"تم إنشاء تنبيه جديد: {title} (المستوى: {severity.value})")
        
        return alert_id
    
    def is_suppressed(self, alert: Alert) -> bool:
        """فحص قواعد التقييد"""
        for rule_name, rule_config in self.suppression_rules.items():
            try:
                # فحص الوقت
                start_time = datetime.strptime(rule_config.get('start_time', '00:00'), '%H:%M').time()
                end_time = datetime.strptime(rule_config.get('end_time', '23:59'), '%H:%M').time()
                current_time = alert.timestamp.time()
                
                if rule_config.get('time_based', True):
                    if not (start_time <= current_time <= end_time):
                        continue
                
                # فحص الفئات
                if 'categories' in rule_config:
                    if alert.category not in rule_config['categories']:
                        continue
                
                # فحص المصادر
                if 'sources' in rule_config:
                    if alert.source not in rule_config['sources']:
                        continue
                
                # فحص الشدة
                if 'severities' in rule_config:
                    if alert.severity.value not in rule_config['severities']:
                        continue
                
                self.logger.info(f"التنبيه مقيد بواسطة القاعدة: {rule_name}")
                return True
                
            except Exception as e:
                self.logger.error(f"خطأ في فحص قاعدة التقييد {rule_name}: {e}")
        
        return False
    
    def is_duplicate(self, alert: Alert) -> bool:
        """فحص التنبيهات المكررة"""
        if not alert.dedup_key:
            return False
        
        # البحث في التنبيهات النشطة
        for existing_alert in self.active_alerts.values():
            if (existing_alert.dedup_key == alert.dedup_key and 
                existing_alert.status in [AlertStatus.NEW, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS]):
                return True
        
        return False
    
    def process_alert(self, alert: Alert):
        """معالجة التنبيه"""
        try:
            # إرسال الإشعار الأولي
            self.send_initial_notifications(alert)
            
            # معالجة التصعيد
            self.schedule_escalation(alert)
            
            self.logger.info(f"تم معالجة التنبيه: {alert.title}")
            
        except Exception as e:
            self.logger.error(f"خطأ في معالجة التنبيه {alert.id}: {e}")
    
    def send_initial_notifications(self, alert: Alert):
        """إرسال الإشعارات الأولية"""
        policy = self.get_escalation_policy(alert.severity)
        if not policy:
            return
        
        channels = policy.notification_channels.get(0, [])
        for channel in channels:
            if channel in self.notification_channels:
                try:
                    self.notification_channels[channel].send(alert)
                    self.save_notification(alert.id, channel, "sent")
                except Exception as e:
                    self.logger.error(f"خطأ في إرسال الإشعار عبر {channel}: {e}")
                    self.save_notification(alert.id, channel, "failed", str(e))
    
    def schedule_escalation(self, alert: Alert):
        """جدولة التصعيد"""
        policy = self.get_escalation_policy(alert.severity)
        if not policy:
            return
        
        for level in range(1, policy.max_escalation_level + 1):
            if level in policy.time_thresholds:
                escalation_time = alert.timestamp + timedelta(seconds=policy.time_thresholds[level])
                threading.Timer(
                    escalation_time.timestamp() - time.time(),
                    lambda al=alert, lvl=level: self.escalate_alert(al, lvl)
                ).start()
    
    def escalate_alert(self, alert: Alert, level: int):
        """تصعيد التنبيه"""
        if alert.status in [AlertStatus.RESOLVED, AlertStatus.CLOSED]:
            return
        
        policy = self.get_escalation_policy(alert.severity)
        if not policy or level not in policy.notification_channels:
            return
        
        alert.escalation_level = level
        alert.status = AlertStatus.ESCALATED
        
        # إرسال إشعارات التصعيد
        channels = policy.notification_channels[level]
        for channel in channels:
            if channel in self.notification_channels:
                try:
                    self.notification_channels[channel].send(alert, is_escalation=True)
                    self.save_notification(alert.id, channel, "escalated")
                except Exception as e:
                    self.logger.error(f"خطأ في تصعيد التنبيه عبر {channel}: {e}")
        
        # تنفيذ إجراءات التصعيد
        if level in policy.escalation_rules:
            self.execute_escalation_action(alert, policy.escalation_rules[level])
        
        self.logger.warning(f"تم تصعيد التنبيه {alert.title} إلى المستوى {level}")
    
    def execute_escalation_action(self, alert: Alert, action: EscalationAction):
        """تنفيذ إجراء التصعيد"""
        try:
            if action == EscalationAction.ESCALATE_MANAGER:
                self.escalate_to_manager(alert)
            elif action == EscalationAction.CALL_ONDUTY:
                self.call_on_duty(alert)
            elif action == EscalationAction.PAGING_SYSTEM:
                self.trigger_paging(alert)
            elif action == EscalationAction.SMS_BROADCAST:
                self.send_sms_broadcast(alert)
            elif action == EscalationAction.AUTO_RESOLUTION:
                self.auto_resolve_alert(alert)
            
        except Exception as e:
            self.logger.error(f"خطأ في تنفيذ إجراء التصعيد {action}: {e}")
    
    def escalate_to_manager(self, alert: Alert):
        """تصعيد للمدير"""
        # تنفيذ منطق التصعيد للمدير
        self.logger.info(f"تصعيد التنبيه {alert.title} للمدير")
    
    def call_on_duty(self, alert: Alert):
        """اتصال بالفريق المسؤول"""
        # تنفيذ منطق الاتصال بالفريق
        self.logger.info(f"اتصال بالفريق المسؤول للتنبيه {alert.title}")
    
    def trigger_paging(self, alert: Alert):
        """تشغيل نظام التنبيه"""
        # تنفيذ منطق نظام التنبيه
        self.logger.info(f"تشغيل نظام التنبيه للتنبيه {alert.title}")
    
    def send_sms_broadcast(self, alert: Alert):
        """إرسال رسالة SMS جماعية"""
        # تنفيذ منطق الرسائل الجماعية
        self.logger.info(f"إرسال رسالة جماعية للتنبيه {alert.title}")
    
    def auto_resolve_alert(self, alert: Alert):
        """حل التنبيه تلقائياً"""
        # تنفيذ منطق الحل التلقائي
        self.logger.info(f"حل التنبيه تلقائياً: {alert.title}")
    
    def acknowledge_alert(self, alert_id: str, acknowledged_by: str) -> bool:
        """الاعتراف بالتنبيه"""
        if alert_id not in self.active_alerts:
            return False
        
        alert = self.active_alerts[alert_id]
        alert.status = AlertStatus.ACKNOWLEDGED
        alert.acknowledged_by = acknowledged_by
        alert.acknowledged_at = datetime.now()
        
        self.save_alert(alert)
        
        self.logger.info(f"تم الاعتراف بالتنبيه {alert.title} بواسطة {acknowledged_by}")
        return True
    
    def resolve_alert(self, alert_id: str, resolved_by: str, notes: str = None) -> bool:
        """حل التنبيه"""
        if alert_id not in self.active_alerts:
            return False
        
        alert = self.active_alerts[alert_id]
        alert.status = AlertStatus.RESOLVED
        alert.resolved_by = resolved_by
        alert.resolved_at = datetime.now()
        
        if notes:
            alert.metadata['resolution_notes'] = notes
        
        self.save_alert(alert)
        
        self.logger.info(f"تم حل التنبيه {alert.title} بواسطة {resolved_by}")
        return True
    
    def get_escalation_policy(self, severity: AlertSeverity) -> Optional[EscalationPolicy]:
        """الحصول على سياسة التصعيد المناسبة"""
        for policy in self.escalation_policies.values():
            if severity in policy.severity_levels:
                return policy
        return None
    
    def notification_worker(self):
        """عامل معالجة الإشعارات"""
        while True:
            try:
                alert = self.alert_queue.get(timeout=30)
                if alert is not None:
                    self.process_alert(alert)
                    self.alert_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                self.logger.error(f"خطأ في عامل الإشعارات: {e}")
    
    def process_escalations(self):
        """معالجة التصعيد"""
        current_time = datetime.now()
        
        for alert in list(self.active_alerts.values()):
            if alert.status in [AlertStatus.RESOLVED, AlertStatus.CLOSED]:
                continue
            
            policy = self.get_escalation_policy(alert.severity)
            if not policy:
                continue
            
            # فحص التصعيد التلقائي
            time_elapsed = (current_time - alert.timestamp).total_seconds()
            max_escalation_time = policy.time_thresholds.get(
                max(policy.severity_levels, key=lambda s: policy.time_thresholds.get(s, 0))
            )
            
            if max_escalation_time and time_elapsed > max_escalation_time:
                # تنفيذ الإجراء الأخير
                last_action = policy.escalation_rules.get(policy.max_escalation_level)
                if last_action:
                    self.execute_escalation_action(alert, last_action)
    
    def save_alert(self, alert: Alert):
        """حفظ التنبيه في قاعدة البيانات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT OR REPLACE INTO alerts 
            (id, title, message, severity, category, source, timestamp, status, metadata,
             assigned_to, acknowledged_by, acknowledged_at, resolved_by, resolved_at,
             escalation_level, suppression_rules, dedup_key, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            alert.id, alert.title, alert.message, alert.severity.value,
            alert.category, alert.source, alert.timestamp.isoformat(), alert.status.value,
            json.dumps(alert.metadata), alert.assigned_to, alert.acknowledged_by,
            alert.acknowledged_at.isoformat() if alert.acknowledged_at else None,
            alert.resolved_by, alert.resolved_at.isoformat() if alert.resolved_at else None,
            alert.escalation_level, json.dumps(alert.suppression_rules or []),
            alert.dedup_key, json.dumps(alert.tags or [])
        ))
        
        conn.commit()
        conn.close()
    
    def save_notification(self, alert_id: str, channel: NotificationChannel, 
                         status: str, error_message: str = None):
        """حفظ إشعار في قاعدة البيانات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        notification_id = str(uuid.uuid4())
        sent_at = datetime.now().isoformat()
        
        cursor.execute('''
            INSERT INTO notifications 
            (id, alert_id, channel, recipient, status, sent_at, delivered_at, error_message)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            notification_id, alert_id, channel.value, "system", status, sent_at,
            datetime.now().isoformat() if status == "delivered" else None, error_message
        ))
        
        conn.commit()
        conn.close()
    
    def get_alert_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات التنبيهات"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # إجمالي التنبيهات
        cursor.execute("SELECT COUNT(*) FROM alerts")
        total_alerts = cursor.fetchone()[0]
        
        # التنبيهات حسب الشدة
        cursor.execute('''
            SELECT severity, COUNT(*) 
            FROM alerts 
            GROUP BY severity
        ''')
        severity_stats = dict(cursor.fetchall())
        
        # التنبيهات حسب الحالة
        cursor.execute('''
            SELECT status, COUNT(*) 
            FROM alerts 
            GROUP BY status
        ''')
        status_stats = dict(cursor.fetchall())
        
        conn.close()
        
        return {
            'total_alerts': total_alerts,
            'by_severity': severity_stats,
            'by_status': status_stats,
            'active_alerts': len(self.active_alerts)
        }


# قنوات الإشعار

class EmailChannel:
    """قناة البريد الإلكتروني"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.smtp_server = config['smtp_server']
        self.smtp_port = config['smtp_port']
        self.username = config['username']
        self.password = config['password']
        self.from_email = config['from_email']
        self.to_emails = config['to_emails']
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار البريد الإلكتروني"""
        try:
            msg = MimeMultipart()
            msg['From'] = self.from_email
            msg['To'] = ', '.join(recipients or self.to_emails)
            
            escalation_prefix = "[تصعيد] " if is_escalation else ""
            msg['Subject'] = f"{escalation_prefix}تنبيه - {alert.severity.value.upper()} - {alert.title}"
            
            # محتوى الرسالة
            body = self.format_email_body(alert, is_escalation)
            msg.attach(MimeText(body, 'plain', 'utf-8'))
            
            # إرسال
            context = ssl.create_default_context()
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls(context=context)
                server.login(self.username, self.password)
                server.send_message(msg)
            
            return True
            
        except Exception as e:
            raise Exception(f"فشل إرسال البريد الإلكتروني: {e}")
    
    def format_email_body(self, alert: Alert, is_escalation: bool) -> str:
        """تنسيق نص البريد الإلكتروني"""
        escalation_text = "\n⚠️ هذا تنبيه مُصعد من المستويات السابقة" if is_escalation else ""
        
        body = f"""
تنبيه من نظام المراقبة

العنوان: {alert.title}
المستوى: {alert.severity.value.upper()}
الفئة: {alert.category}
المصدر: {alert.source}
الوقت: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}
الحالة: {alert.status.value}

الرسالة:
{alert.message}

التفاصيل:
{json.dumps(alert.metadata, indent=2, ensure_ascii=False, default=str)}
{escalation_text}

---
تم إرسال هذا التنبيه بواسطة نظام المراقبة المتقدم
        """
        
        return body.strip()


class SlackChannel:
    """قناة Slack"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_url = config['webhook_url']
        self.bot_token = config.get('bot_token')
        self.channel = config.get('channel', '#alerts')
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار Slack"""
        try:
            payload = {
                "text": f"تنبيه من نظام المراقبة",
                "username": "نظام المراقبة",
                "icon_emoji": ":warning:",
                "attachments": [
                    {
                        "color": self.get_color_for_severity(alert.severity),
                        "title": alert.title,
                        "text": alert.message,
                        "fields": [
                            {
                                "title": "المستوى",
                                "value": alert.severity.value.upper(),
                                "short": True
                            },
                            {
                                "title": "الفئة",
                                "value": alert.category,
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
                            }
                        ],
                        "actions": [
                            {
                                "type": "button",
                                "text": "الاعتراف",
                                "url": f"acknowledge/{alert.id}",
                                "style": "primary"
                            },
                            {
                                "type": "button",
                                "text": "الحل",
                                "url": f"resolve/{alert.id}",
                                "style": "danger"
                            }
                        ] if not is_escalation else []
                    }
                ]
            }
            
            if is_escalation:
                payload["attachments"][0]["title"] = f"⚠️ {alert.title}"
            
            response = requests.post(self.webhook_url, json=payload)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            raise Exception(f"فشل إرسال Slack: {e}")
    
    def get_color_for_severity(self, severity: AlertSeverity) -> str:
        """الحصول على لون للتنبيه حسب الشدة"""
        colors = {
            AlertSeverity.INFO: "good",
            AlertSeverity.LOW: "good",
            AlertSeverity.MEDIUM: "warning",
            AlertSeverity.HIGH: "warning",
            AlertSeverity.CRITICAL: "danger",
            AlertSeverity.EMERGENCY: "danger"
        }
        return colors.get(severity, "good")


class DiscordChannel:
    """قناة Discord"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_url = config['webhook_url']
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار Discord"""
        try:
            embed = {
                "title": f"تنبيه من نظام المراقبة - {alert.title}",
                "description": alert.message,
                "color": self.get_color_for_severity(alert.severity),
                "fields": [
                    {
                        "name": "المستوى",
                        "value": alert.severity.value.upper(),
                        "inline": True
                    },
                    {
                        "name": "الفئة",
                        "value": alert.category,
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
                "timestamp": alert.timestamp.isoformat(),
                "footer": {
                    "text": "نظام المراقبة المتقدم"
                }
            }
            
            if is_escalation:
                embed["title"] = f"⚠️ تنبيه مُصعد - {alert.title}"
            
            payload = {"embeds": [embed]}
            
            response = requests.post(self.webhook_url, json=payload)
            response.raise_for_status()
            
            return True
            
        except Exception as e:
            raise Exception(f"فشل إرسال Discord: {e}")
    
    def get_color_for_severity(self, severity: AlertSeverity) -> int:
        """الحصول على لون للتنبيه حسب الشدة"""
        colors = {
            AlertSeverity.INFO: 0x00FF00,      # أخضر
            AlertSeverity.LOW: 0x00FF00,       # أخضر
            AlertSeverity.MEDIUM: 0xFFFF00,    # أصفر
            AlertSeverity.HIGH: 0xFF8000,      # برتقالي
            AlertSeverity.CRITICAL: 0xFF0000,  # أحمر
            AlertSeverity.EMERGENCY: 0xFF0000  # أحمر
        }
        return colors.get(severity, 0x00FF00)


class TelegramChannel:
    """قناة Telegram"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.bot_token = config['bot_token']
        self.chat_ids = config['chat_ids']
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار Telegram"""
        try:
            escalation_text = "\n⚠️ هذا تنبيه مُصعد من المستويات السابقة" if is_escalation else ""
            
            message = f"""
🚨 تنبيه من نظام المراقبة

📋 العنوان: {alert.title}
🔴 المستوى: {alert.severity.value.upper()}
📁 الفئة: {alert.category}
🌐 المصدر: {alert.source}
🕐 الوقت: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}

📝 التفاصيل:
{alert.message}
{escalation_text}

---
معرف التنبيه: {alert.id}
            """
            
            for chat_id in recipients or self.chat_ids:
                url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
                data = {
                    "chat_id": chat_id,
                    "text": message,
                    "parse_mode": "HTML"
                }
                
                response = requests.post(url, data=data)
                response.raise_for_status()
            
            return True
            
        except Exception as e:
            raise Exception(f"فشل إرسال Telegram: {e}")


class WebhookChannel:
    """قناة Webhook"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.webhook_urls = config['webhook_urls']
        self.headers = config.get('headers', {'Content-Type': 'application/json'})
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار Webhook"""
        try:
            payload = {
                "alert": {
                    "id": alert.id,
                    "title": alert.title,
                    "message": alert.message,
                    "severity": alert.severity.value,
                    "category": alert.category,
                    "source": alert.source,
                    "timestamp": alert.timestamp.isoformat(),
                    "status": alert.status.value,
                    "metadata": alert.metadata
                },
                "escalation": is_escalation,
                "sent_at": datetime.now().isoformat()
            }
            
            for url in recipients or self.webhook_urls:
                response = requests.post(url, json=payload, headers=self.headers)
                response.raise_for_status()
            
            return True
            
        except Exception as e:
            raise Exception(f"فشل إرسال Webhook: {e}")


class PushChannel:
    """قناة الإشعارات الفورية"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.server_key = config['server_key']
        self.app_id = config['app_id']
    
    def send(self, alert: Alert, recipients: List[str] = None, is_escalation: bool = False):
        """إرسال إشعار فوري"""
        try:
            # تنفيذ منطق الإشعارات الفورية
            # يمكن استخدام Firebase Cloud Messaging أو خدمة مشابهة
            pass
            
        except Exception as e:
            raise Exception(f"فشل إرسال الإشعار الفوري: {e}")


# مثال على الاستخدام
async def main():
    """مثال على الاستخدام"""
    config = {
        "channels": {
            "email": {
                "enabled": True,
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 587,
                "username": "your-email@gmail.com",
                "password": "your-password",
                "from_email": "alerts@yourcompany.com",
                "to_emails": ["admin@yourcompany.com", "ops@yourcompany.com"]
            },
            "slack": {
                "enabled": True,
                "webhook_url": "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
            },
            "discord": {
                "enabled": True,
                "webhook_url": "https://discord.com/api/webhooks/YOUR/DISCORD/WEBHOOK"
            },
            "telegram": {
                "enabled": True,
                "bot_token": "YOUR_BOT_TOKEN",
                "chat_ids": ["YOUR_CHAT_ID"]
            },
            "webhook": {
                "enabled": True,
                "webhook_urls": ["https://your-webhook-endpoint.com/alerts"]
            }
        },
        "database": {
            "path": "alerts.db"
        },
        "workers": {
            "notification_workers": 5
        }
    }
    
    # إنشاء مدير الإشعارات
    notification_manager = AdvancedNotificationManager(config)
    
    # إنشاء تنبيهات تجريبية
    alert_id1 = notification_manager.create_alert(
        title="خطأ في قاعدة البيانات",
        message="فشل في الاتصال بقاعدة البيانات الرئيسية",
        severity=AlertSeverity.CRITICAL,
        category="database",
        source="postgres-primary",
        metadata={"connection_string": "postgresql://...", "error_code": "CONNECTION_TIMEOUT"}
    )
    
    alert_id2 = notification_manager.create_alert(
        title="استخدام عالي للذاكرة",
        message="استخدام الذاكرة تجاوز 85%",
        severity=AlertSeverity.HIGH,
        category="system",
        source="server-01",
        metadata={"memory_usage": 87.5, "threshold": 85}
    )
    
    # الحصول على الإحصائيات
    stats = notification_manager.get_alert_stats()
    print(f"إحصائيات التنبيهات: {json.dumps(stats, indent=2, ensure_ascii=False)}")
    
    # محاكاة الاعتراف والحل
    await asyncio.sleep(2)  # انتظار لإرسال الإشعارات
    
    notification_manager.acknowledge_alert(alert_id1, "admin")
    notification_manager.resolve_alert(alert_id1, "dba", "تم إصلاح مشكلة الاتصال")
    
    print("تم تشغيل نظام التنبيهات بنجاح!")


if __name__ == "__main__":
    asyncio.run(main())
