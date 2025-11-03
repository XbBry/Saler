#!/usr/bin/env python3
"""
نظام سجلات الوصول
Access Logs System
"""

import os
import re
import json
import time
import sqlite3
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from pathlib import Path
import logging
from collections import defaultdict, Counter
import ipaddress
import gzip
from concurrent.futures import ThreadPoolExecutor, as_completed

# إعداد نظام السجلات
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@dataclass
class AccessLogEntry:
    """مدخل سجل الوصول"""
    timestamp: datetime
    ip_address: str
    method: str
    url: str
    status_code: int
    response_size: int
    response_time: float
    user_agent: str
    referer: str
    session_id: Optional[str] = None
    user_id: Optional[str] = None
    endpoint: Optional[str] = None
    country: Optional[str] = None
    isp: Optional[str] = None
    bot_detected: bool = False
    threat_level: str = 'low'  # low, medium, high, critical

@dataclass
class LogAnalysis:
    """تحليل السجلات"""
    total_requests: int
    unique_visitors: int
    requests_per_second: float
    average_response_time: float
    status_code_distribution: Dict[str, int]
    top_endpoints: List[tuple]
    top_countries: List[tuple]
    threat_analysis: Dict[str, Any]
    suspicious_activities: List[Dict[str, Any]]

class AccessLogAnalyzer:
    """محلل سجلات الوصول"""
    
    def __init__(self, config_path: str = "access_logs_config.json"):
        self.config = self.load_config(config_path)
        self.db = self.setup_database()
        
        # إعدادات التحليل
        self.log_patterns = self.load_log_patterns()
        self.threat_rules = self.load_threat_rules()
        self.suspicious_ips = set()
        self.blocked_ips = set()
        
        # إحصائيات التحليل
        self.stats = {
            total_requests=0,
            unique_ips=set(),
            response_times=[],
            status_codes=Counter(),
            endpoints=Counter(),
            countries=Counter(),
            threats_detected=0,
            start_time=datetime.now()
        }
        
        # تشغيل مراقب السجلات
        if self.config.get('enable_realtime_monitoring', True):
            self.start_realtime_monitoring()
    
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """تحميل ملف الإعدادات"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return self.get_default_config()
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """إعدادات افتراضية"""
        return {
            'log_files': [
                '/var/log/nginx/access.log',
                '/var/log/nginx/access.log.1',
                '/var/log/apache2/access.log',
                '/var/log/httpd/access_log'
            ],
            'compressed_logs': True,
            'enable_realtime_monitoring': True,
            'monitoring_interval': 5,
            'analysis_interval': 60,
            'max_log_size': 100 * 1024 * 1024,  # 100MB
            'database_path': 'access_logs.db',
            'enable_geoip': True,
            'enable_threat_detection': True,
            'threat_detection_rules': {
                'sql_injection': {
                    'patterns': ['union', 'select', 'drop', 'insert', 'update', 'delete', 'script'],
                    'severity': 'high'
                },
                'xss': {
                    'patterns': ['<script', 'javascript:', 'onload=', 'onerror='],
                    'severity': 'medium'
                },
                'path_traversal': {
                    'patterns': ['../', '..\\', '%2e%2e%2f'],
                    'severity': 'medium'
                },
                'brute_force': {
                    'max_requests_per_ip': 100,
                    'time_window': 300  # 5 minutes
                }
            },
            'geoip_db_path': None,  # Path to GeoIP database
            'suspicious_user_agents': [
                'sqlmap', 'nmap', 'masscan', 'scanner', 'bot', 'crawler'
            ]
        }
    
    def load_log_patterns(self) -> Dict[str, re.Pattern]:
        """تحميل أنماط تحليل السجلات"""
        return {
            # Nginx access log format
            'nginx': re.compile(
                r'(?P<ip>\d+\.\d+\.\d+\.\d+) - (?P<user>\S+) \[(?P<timestamp>[^\]]+)\] '
                r'"(?P<method>\S+) (?P<url>\S+) (?P<protocol>\S+)" '
                r'(?P<status>\d+) (?P<size>\d+) '
                r'"(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)"'
            ),
            
            # Apache combined log format
            'apache': re.compile(
                r'(?P<ip>\d+\.\d+\.\d+\.\d+) - (?P<user>\S+) \[(?P<timestamp>[^\]]+)\] '
                r'"(?P<method>\S+) (?P<url>\S+) (?P<protocol>\S+)" '
                r'(?P<status>\d+) (?P<size>\d+) '
                r'"(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)"'
            ),
            
            # Common log format with response time
            'enhanced': re.compile(
                r'(?P<ip>\d+\.\d+\.\d+\.\d+) - (?P<user>\S+) \[(?P<timestamp>[^\]]+)\] '
                r'"(?P<method>\S+) (?P<url>\S+) (?P<protocol>\S+)" '
                r'(?P<status>\d+) (?P<size>\d+) (?P<response_time>\d+) '
                r'"(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)"'
            )
        }
    
    def load_threat_rules(self) -> Dict[str, Any]:
        """تحميل قواعد كشف التهديدات"""
        return {
            'sql_injection_patterns': [
                r'union\s+select',
                r'drop\s+table',
                r'insert\s+into',
                r'update\s+set',
                r'delete\s+from',
                r'or\s+1\s*=\s*1',
                r'and\s+1\s*=\s*1'
            ],
            'xss_patterns': [
                r'<script[^>]*>.*?</script>',
                r'javascript:',
                r'on\w+\s*='
            ],
            'path_traversal_patterns': [
                r'\.\.\/',
                r'\.\.\\',
                r'%2e%2e%2f'
            ],
            'suspicious_file_extensions': [
                '.php', '.asp', '.aspx', '.jsp', '.cgi', '.pl', '.sh', '.exe', '.bat'
            ],
            'suspicious_methods': [
                'TRACE', 'TRACK', 'DEBUG', 'CONNECT'
            ]
        }
    
    def setup_database(self) -> sqlite3.Connection:
        """إعداد قاعدة البيانات"""
        try:
            conn = sqlite3.connect(self.config['database_path'])
            cursor = conn.cursor()
            
            # جدول سجلات الوصول
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS access_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    ip_address TEXT NOT NULL,
                    method TEXT NOT NULL,
                    url TEXT NOT NULL,
                    status_code INTEGER NOT NULL,
                    response_size INTEGER NOT NULL,
                    response_time REAL,
                    user_agent TEXT,
                    referer TEXT,
                    session_id TEXT,
                    user_id TEXT,
                    endpoint TEXT,
                    country TEXT,
                    isp TEXT,
                    bot_detected BOOLEAN DEFAULT FALSE,
                    threat_level TEXT DEFAULT 'low'
                )
            ''')
            
            # جدول الإحصائيات
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS log_statistics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    analysis_time DATETIME NOT NULL,
                    total_requests INTEGER NOT NULL,
                    unique_visitors INTEGER NOT NULL,
                    requests_per_second REAL NOT NULL,
                    average_response_time REAL NOT NULL,
                    top_endpoints TEXT,
                    top_countries TEXT,
                    threat_analysis TEXT
                )
            ''')
            
            # جدول التهديدات
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS threats (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME NOT NULL,
                    ip_address TEXT NOT NULL,
                    threat_type TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    description TEXT NOT NULL,
                    request_data TEXT,
                    action_taken TEXT
                )
            ''')
            
            conn.commit()
            return conn
            
        except Exception as e:
            logger.error(f"Failed to setup database: {e}")
            return None
    
    def parse_log_file(self, log_file: str) -> List[AccessLogEntry]:
        """تحليل ملف سجل"""
        entries = []
        
        try:
            # فتح الملف (يدعم الملفات المضغوطة)
            if log_file.endswith('.gz'):
                file_handle = gzip.open(log_file, 'rt', encoding='utf-8', errors='ignore')
            else:
                file_handle = open(log_file, 'r', encoding='utf-8', errors='ignore')
            
            with file_handle:
                for line in file_handle:
                    entry = self.parse_log_line(line)
                    if entry:
                        entries.append(entry)
            
            logger.info(f"Parsed {len(entries)} entries from {log_file}")
            
        except Exception as e:
            logger.error(f"Failed to parse log file {log_file}: {e}")
        
        return entries
    
    def parse_log_line(self, line: str) -> Optional[AccessLogEntry]:
        """تحليل سطر واحد من السجل"""
        line = line.strip()
        if not line:
            return None
        
        # محاولة تحليل السطر باستخدام الأنماط المختلفة
        for pattern_name, pattern in self.log_patterns.items():
            match = pattern.match(line)
            if match:
                try:
                    data = match.groupdict()
                    
                    # تحليل الطابع الزمني
                    timestamp = self.parse_timestamp(data['timestamp'])
                    
                    # تحليل URL لاستخراج الـ endpoint
                    endpoint = self.extract_endpoint(data['url'])
                    
                    # تحليل user agent لكشف البوتات
                    bot_detected = self.detect_bot(data['user_agent'])
                    
                    # تحليل مستوى التهديد
                    threat_level = self.assess_threat_level(data['url'], data['user_agent'], data['method'])
                    
                    # إنشاء المدخل
                    entry = AccessLogEntry(
                        timestamp=timestamp,
                        ip_address=data['ip'],
                        method=data['method'],
                        url=data['url'],
                        status_code=int(data['status']),
                        response_size=int(data['size']),
                        response_time=float(data.get('response_time', 0)),
                        user_agent=data['user_agent'],
                        referer=data['referer'],
                        endpoint=endpoint,
                        bot_detected=bot_detected,
                        threat_level=threat_level
                    )
                    
                    return entry
                    
                except Exception as e:
                    logger.debug(f"Error parsing log line: {e}")
                    continue
        
        logger.debug(f"Could not parse log line: {line[:100]}")
        return None
    
    def parse_timestamp(self, timestamp_str: str) -> datetime:
        """تحليل الطابع الزمني"""
        try:
            # تنسيق Nginx/Apache: 10/Oct/2000:13:55:36 -0700
            return datetime.strptime(timestamp_str, '%d/%b/%Y:%H:%M:%S %z')
        except ValueError:
            try:
                # تنسيق آخر
                return datetime.strptime(timestamp_str.split()[0], '%Y-%m-%d %H:%M:%S')
            except ValueError:
                return datetime.now()
    
    def extract_endpoint(self, url: str) -> str:
        """استخراج الـ endpoint من URL"""
        try:
            # إزالة المعاملات والـ query string
            clean_url = url.split('?')[0].split('#')[0]
            
            # الحصول على المسار
            path = clean_url.split('/')[1:]  # إزالة الفارغة الأولى
            
            # تبسيط المسار
            if len(path) > 0:
                return '/' + '/'.join(path[:2])  # أول مستويين
            else:
                return '/'
                
        except Exception:
            return '/'
    
    def detect_bot(self, user_agent: str) -> bool:
        """كشف البوتات من user agent"""
        if not user_agent:
            return False
        
        suspicious_agents = self.config.get('suspicious_user_agents', [])
        user_agent_lower = user_agent.lower()
        
        return any(sus.lower() in user_agent_lower for sus in suspicious_agents)
    
    def assess_threat_level(self, url: str, user_agent: str, method: str) -> str:
        """تقييم مستوى التهديد"""
        url_lower = url.lower()
        
        # فحص حقن SQL
        for pattern in self.threat_rules['sql_injection_patterns']:
            if re.search(pattern, url_lower, re.IGNORECASE):
                return 'high'
        
        # فحص XSS
        for pattern in self.threat_rules['xss_patterns']:
            if re.search(pattern, url_lower, re.IGNORECASE):
                return 'medium'
        
        # فحص traversal
        for pattern in self.threat_rules['path_traversal_patterns']:
            if re.search(pattern, url_lower, re.IGNORECASE):
                return 'medium'
        
        # فحص امتدادات الملفات المشبوهة
        for ext in self.threat_rules['suspicious_file_extensions']:
            if url_lower.endswith(ext):
                return 'medium'
        
        # فحص الطرق المشبوهة
        if method in self.threat_rules['suspicious_methods']:
            return 'high'
        
        # فحص user agents مشبوهة
        if self.detect_bot(user_agent):
            return 'medium'
        
        return 'low'
    
    def analyze_threats(self, entries: List[AccessLogEntry]) -> Dict[str, Any]:
        """تحليل التهديدات"""
        threats = {
            'sql_injection_attempts': 0,
            'xss_attempts': 0,
            'path_traversal_attempts': 0,
            'suspicious_file_accesses': 0,
            'brute_force_attacks': 0,
            'bot_activity': 0,
            'high_risk_ips': [],
            'attack_patterns': []
        }
        
        # جمع الطلبات حسب IP
        ip_requests = defaultdict(list)
        for entry in entries:
            ip_requests[entry.ip_address].append(entry)
        
        # تحليل كل IP
        for ip, requests in ip_requests.items():
            high_threat_requests = [r for r in requests if r.threat_level in ['high', 'critical']]
            medium_threat_requests = [r for r in requests if r.threat_level == 'medium']
            
            # تصنيف أنواع الهجمات
            for entry in requests:
                if 'union' in entry.url.lower() or 'select' in entry.url.lower():
                    threats['sql_injection_attempts'] += 1
                elif '<script' in entry.url.lower() or 'javascript:' in entry.url.lower():
                    threats['xss_attempts'] += 1
                elif '../' in entry.url.lower():
                    threats['path_traversal_attempts'] += 1
                elif any(ext in entry.url.lower() for ext in ['.php', '.asp', '.jsp']):
                    threats['suspicious_file_accesses'] += 1
                if entry.bot_detected:
                    threats['bot_activity'] += 1
            
            # فحص الهجمات القسرية
            if len(high_threat_requests) > 10:
                threats['brute_force_attacks'] += 1
                threats['high_risk_ips'].append({
                    'ip': ip,
                    'threat_level': 'high',
                    'request_count': len(requests),
                    'high_threat_count': len(high_threat_requests)
                })
            elif len(medium_threat_requests) > 20:
                threats['high_risk_ips'].append({
                    'ip': ip,
                    'threat_level': 'medium',
                    'request_count': len(requests),
                    'medium_threat_count': len(medium_threat_requests)
                })
        
        return threats
    
    def analyze_access_patterns(self, entries: List[AccessLogEntry]) -> LogAnalysis:
        """تحليل أنماط الوصول"""
        if not entries:
            return LogAnalysis(0, 0, 0, 0, {}, [], [], {}, [])
        
        # حساب الإحصائيات الأساسية
        total_requests = len(entries)
        unique_visitors = len(set(entry.ip_address for entry in entries))
        
        # حساب الطلبات في الثانية
        time_span = (entries[-1].timestamp - entries[0].timestamp).total_seconds()
        requests_per_second = total_requests / time_span if time_span > 0 else 0
        
        # متوسط زمن الاستجابة
        response_times = [entry.response_time for entry in entries if entry.response_time > 0]
        average_response_time = sum(response_times) / len(response_times) if response_times else 0
        
        # توزيع رموز الحالة
        status_code_distribution = Counter(entry.status_code for entry in entries)
        
        # أفضل endpoints
        endpoint_counts = Counter(entry.endpoint for entry in entries)
        top_endpoints = endpoint_counts.most_common(10)
        
        # أفضل البلدان (إذا كانت متوفرة)
        country_counts = Counter(entry.country for entry in entries if entry.country)
        top_countries = country_counts.most_common(10)
        
        # تحليل التهديدات
        threat_analysis = self.analyze_threats(entries)
        
        # الأنشطة المشبوهة
        suspicious_activities = []
        for ip in set(entry.ip_address for entry in entries):
            ip_entries = [e for e in entries if e.ip_address == ip]
            if len([e for e in ip_entries if e.threat_level != 'low']) > 5:
                suspicious_activities.append({
                    'ip': ip,
                    'suspicious_requests': len([e for e in ip_entries if e.threat_level != 'low']),
                    'total_requests': len(ip_entries),
                    'severity': 'high' if any(e.threat_level == 'high' for e in ip_entries) else 'medium'
                })
        
        return LogAnalysis(
            total_requests=total_requests,
            unique_visitors=unique_visitors,
            requests_per_second=requests_per_second,
            average_response_time=average_response_time,
            status_code_distribution=dict(status_code_distribution),
            top_endpoints=top_endpoints,
            top_countries=top_countries,
            threat_analysis=threat_analysis,
            suspicious_activities=suspicious_activities
        )
    
    def save_analysis_to_db(self, analysis: LogAnalysis):
        """حفظ التحليل في قاعدة البيانات"""
        if not self.db:
            return
        
        try:
            cursor = self.db.cursor()
            
            cursor.execute('''
                INSERT INTO log_statistics (
                    analysis_time, total_requests, unique_visitors, requests_per_second,
                    average_response_time, top_endpoints, top_countries, threat_analysis
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                datetime.now(),
                analysis.total_requests,
                analysis.unique_visitors,
                analysis.requests_per_second,
                analysis.average_response_time,
                json.dumps(analysis.top_endpoints),
                json.dumps(analysis.top_countries),
                json.dumps(analysis.threat_analysis)
            ))
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to save analysis to database: {e}")
    
    def save_entries_to_db(self, entries: List[AccessLogEntry]):
        """حفظ المدخلات في قاعدة البيانات"""
        if not self.db or not entries:
            return
        
        try:
            cursor = self.db.cursor()
            
            for entry in entries:
                cursor.execute('''
                    INSERT INTO access_logs (
                        timestamp, ip_address, method, url, status_code, response_size,
                        response_time, user_agent, referer, endpoint, bot_detected, threat_level
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    entry.timestamp,
                    entry.ip_address,
                    entry.method,
                    entry.url,
                    entry.status_code,
                    entry.response_size,
                    entry.response_time,
                    entry.user_agent,
                    entry.referer,
                    entry.endpoint,
                    entry.bot_detected,
                    entry.threat_level
                ))
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Failed to save entries to database: {e}")
    
    def analyze_logs(self, log_files: List[str] = None) -> LogAnalysis:
        """تحليل السجلات"""
        if log_files is None:
            log_files = self.config.get('log_files', [])
        
        all_entries = []
        
        # تحليل متوازي للملفات
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []
            for log_file in log_files:
                if os.path.exists(log_file):
                    future = executor.submit(self.parse_log_file, log_file)
                    futures.append(future)
            
            for future in as_completed(futures):
                try:
                    entries = future.result()
                    all_entries.extend(entries)
                except Exception as e:
                    logger.error(f"Error analyzing log file: {e}")
        
        # ترتيب المدخلات حسب الوقت
        all_entries.sort(key=lambda x: x.timestamp)
        
        # حفظ في قاعدة البيانات
        self.save_entries_to_db(all_entries)
        
        # تحليل البيانات
        analysis = self.analyze_access_patterns(all_entries)
        
        # حفظ التحليل
        self.save_analysis_to_db(analysis)
        
        # تحديث الإحصائيات
        self.update_stats(all_entries)
        
        logger.info(f"Analysis completed: {analysis.total_requests} requests analyzed")
        
        return analysis
    
    def update_stats(self, entries: List[AccessLogEntry]):
        """تحديث الإحصائيات"""
        self.stats['total_requests'] += len(entries)
        
        for entry in entries:
            self.stats['unique_ips'].add(entry.ip_address)
            self.stats['status_codes'][entry.status_code] += 1
            self.stats['endpoints'][entry.endpoint] += 1
            
            if entry.response_time > 0:
                self.stats['response_times'].append(entry.response_time)
            
            if entry.country:
                self.stats['countries'][entry.country] += 1
            
            if entry.threat_level in ['high', 'critical']:
                self.stats['threats_detected'] += 1
    
    def start_realtime_monitoring(self):
        """بدء المراقبة الفورية"""
        def monitor_logs():
            while True:
                try:
                    for log_file in self.config.get('log_files', []):
                        if os.path.exists(log_file):
                            # تحليل آخر 1000 سطر فقط للسرعة
                            entries = self.parse_log_file(log_file)[-1000:]
                            if entries:
                                analysis = self.analyze_access_patterns(entries)
                                
                                # إرسال تقرير دوري
                                if len(entries) > 0:
                                    self.emit_realtime_report(analysis)
                    
                    time.sleep(self.config.get('monitoring_interval', 5))
                    
                except Exception as e:
                    logger.error(f"Error in realtime monitoring: {e}")
                    time.sleep(5)
        
        monitor_thread = threading.Thread(target=monitor_logs, daemon=True)
        monitor_thread.start()
        
        logger.info("Realtime monitoring started")
    
    def emit_realtime_report(self, analysis: LogAnalysis):
        """إرسال تقرير فوري"""
        # يمكن توسيع هذا لإرسال التقارير عبر WebSocket أو HTTP callbacks
        logger.info(f"Realtime report: {analysis.total_requests} requests, "
                   f"{len(analysis.suspicious_activities)} suspicious activities")
    
    def generate_security_report(self, hours: int = 24) -> Dict[str, Any]:
        """توليد تقرير أمني"""
        if not self.db:
            return {}
        
        try:
            cursor = self.db.cursor()
            
            # جمع بيانات آخر فترة
            since = datetime.now() - timedelta(hours=hours)
            
            cursor.execute('''
                SELECT threat_level, COUNT(*) as count
                FROM access_logs
                WHERE timestamp > ?
                GROUP BY threat_level
            ''', (since,))
            
            threat_distribution = dict(cursor.fetchall())
            
            cursor.execute('''
                SELECT ip_address, COUNT(*) as requests, MAX(threat_level) as max_threat
                FROM access_logs
                WHERE timestamp > ?
                GROUP BY ip_address
                HAVING COUNT(*) > 10 AND max_threat IN ('high', 'critical')
                ORDER BY requests DESC
                LIMIT 20
            ''', (since,))
            
            suspicious_ips = cursor.fetchall()
            
            cursor.execute('''
                SELECT endpoint, COUNT(*) as requests, AVG(response_time) as avg_time
                FROM access_logs
                WHERE timestamp > ? AND status_code >= 400
                GROUP BY endpoint
                ORDER BY requests DESC
                LIMIT 10
            ''', (since,))
            
            error_endpoints = cursor.fetchall()
            
            return {
                'report_period_hours': hours,
                'generated_at': datetime.now().isoformat(),
                'threat_distribution': threat_distribution,
                'suspicious_ips': [
                    {'ip': ip, 'requests': count, 'max_threat': threat}
                    for ip, count, threat in suspicious_ips
                ],
                'error_endpoints': [
                    {'endpoint': ep, 'requests': count, 'avg_response_time': time}
                    for ep, count, time in error_endpoints
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to generate security report: {e}")
            return {}
    
    def get_current_statistics(self) -> Dict[str, Any]:
        """الحصول على الإحصائيات الحالية"""
        avg_response_time = 0
        if self.stats['response_times']:
            avg_response_time = sum(self.stats['response_times']) / len(self.stats['response_times'])
        
        uptime = datetime.now() - self.stats['start_time']
        
        return {
            'uptime_seconds': int(uptime.total_seconds()),
            'total_requests': self.stats['total_requests'],
            'unique_visitors': len(self.stats['unique_ips']),
            'average_response_time': avg_response_time,
            'threats_detected': self.stats['threats_detected'],
            'top_status_codes': dict(self.stats['status_codes'].most_common(5)),
            'top_endpoints': dict(self.stats['endpoints'].most_common(5)),
            'top_countries': dict(self.stats['countries'].most_common(5))
        }

# مثال على الاستخدام
if __name__ == "__main__":
    analyzer = AccessLogAnalyzer()
    
    # تحليل السجلات
    analysis = analyzer.analyze_logs()
    
    # عرض النتائج
    print("Access Log Analysis Report")
    print("=" * 50)
    print(f"Total Requests: {analysis.total_requests}")
    print(f"Unique Visitors: {analysis.unique_visitors}")
    print(f"Requests/Second: {analysis.requests_per_second:.2f}")
    print(f"Average Response Time: {analysis.average_response_time:.2f}ms")
    
    print(f"\nTop Endpoints:")
    for endpoint, count in analysis.top_endpoints[:5]:
        print(f"  {endpoint}: {count} requests")
    
    print(f"\nThreat Analysis:")
    threats = analysis.threat_analysis
    print(f"  SQL Injection Attempts: {threats['sql_injection_attempts']}")
    print(f"  XSS Attempts: {threats['xss_attempts']}")
    print(f"  Path Traversal: {threats['path_traversal_attempts']}")
    print(f"  High Risk IPs: {len(threats['high_risk_ips'])}")
    
    print(f"\nSuspicious Activities:")
    for activity in analysis.suspicious_activities[:5]:
        print(f"  IP: {activity['ip']} - {activity['suspicious_requests']} suspicious requests")
    
    # توليد تقرير أمني
    security_report = analyzer.generate_security_report(24)
    print(f"\nSecurity Report saved to database")
    
    # الإحصائيات الحالية
    current_stats = analyzer.get_current_statistics()
    print(f"\nCurrent Statistics:")
    print(json.dumps(current_stats, indent=2))