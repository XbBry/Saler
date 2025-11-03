#!/usr/bin/env python3
"""
نظام تدقيق الأمان
Security Audit System
"""

import os
import sys
import hashlib
import json
import logging
import subprocess
import time
import socket
import requests
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import sqlite3
import re
import psutil
from concurrent.futures import ThreadPoolExecutor, as_completed
import yaml

# إعداد نظام السجلات
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('security_audit.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class SecurityIssue:
    """مشكل أمني مكتشف"""
    id: str
    severity: str  # critical, high, medium, low
    category: str
    title: str
    description: str
    file_path: Optional[str] = None
    line_number: Optional[int] = None
    recommendation: str = ""
    cve_references: List[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()
        if self.cve_references is None:
            self.cve_references = []

@dataclass
class AuditResult:
    """نتيجة التدقيق"""
    audit_id: str
    timestamp: datetime
    scope: str
    total_issues: int
    critical_issues: int
    high_issues: int
    medium_issues: int
    low_issues: int
    issues: List[SecurityIssue]
    duration_seconds: float
    recommendations: List[str]

class SecurityAuditor:
    """مدقق الأمان"""
    
    def __init__(self, config_path: str = "security_config.yaml"):
        self.config = self.load_config(config_path)
        self.audit_db = self.setup_audit_database()
        self.current_audit = None
        
        # إعداد الفحوصات
        self.security_patterns = self.load_security_patterns()
        self.file_extensions = self.config.get('file_extensions', [
            '.py', '.js', '.php', '.java', '.cpp', '.c', '.h', 
            '.sql', '.xml', '.json', '.yaml', '.yml'
        ])
        
        # إعداد قواعد التدقيق
        self.audit_rules = self.load_audit_rules()
        
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """تحميل ملف الإعدادات"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f) or {}
        except FileNotFoundError:
            logger.warning(f"Config file {config_path} not found, using defaults")
            return self.get_default_config()
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """إعدادات افتراضية"""
        return {
            'scan_paths': ['.'],
            'exclude_paths': ['.git', '__pycache__', 'node_modules', 'venv', '.env'],
            'file_extensions': ['.py', '.js', '.php', '.java', '.cpp', '.c', '.h', '.sql'],
            'max_file_size': 10485760,  # 10MB
            'check_suspicious_patterns': True,
            'check_file_permissions': True,
            'check_directory_permissions': True,
            'check_user_privileges': True,
            'check_processes': True,
            'check_network_connections': True,
            'check_environment_variables': True,
            'check_ssl_certificates': True,
            'parallel_scanning': True,
            'max_workers': 4
        }
    
    def load_security_patterns(self) -> Dict[str, List[Dict]]:
        """تحميل أنماط الأمان المشبوهة"""
        return {
            'sql_injection': [
                {
                    'pattern': r'[\'"][^\'"]*(?:union|select|insert|update|delete|drop|create|alter)[^\'"]*[\'"]',
                    'description': 'SQL injection pattern detected',
                    'severity': 'high',
                    'recommendation': 'Use parameterized queries to prevent SQL injection'
                },
                {
                    'pattern': r'(?:mysql_query|pg_query|sqlite_query)\s*\(\s*["\'].*["\']',
                    'description': 'Direct SQL query without parameterization',
                    'severity': 'high',
                    'recommendation': 'Replace with prepared statements'
                }
            ],
            'command_injection': [
                {
                    'pattern': r'(?:os\.system|subprocess\.call|subprocess\.run|subprocess\.Popen)\s*\(\s*["\'].*%.*["\']',
                    'description': 'Command injection vulnerability',
                    'severity': 'critical',
                    'recommendation': 'Use subprocess with shell=False and proper input validation'
                },
                {
                    'pattern': r'eval\s*\(\s*.*["\']',
                    'description': 'Use of eval() function',
                    'severity': 'high',
                    'recommendation': 'Avoid using eval() or ensure input is strictly validated'
                }
            ],
            'path_traversal': [
                {
                    'pattern': r'(?:\.\./|\.\.\||\\\\|\\)',
                    'description': 'Potential path traversal vulnerability',
                    'severity': 'medium',
                    'recommendation': 'Validate and sanitize file paths'
                }
            ],
            'weak_hashing': [
                {
                    'pattern': r'md5|sha1(?!\w)',
                    'description': 'Weak cryptographic hash detected',
                    'severity': 'medium',
                    'recommendation': 'Use SHA-256 or stronger hashing algorithms'
                },
                {
                    'pattern': r'(?:Crypto\.md5|hashlib\.md5)\s*\(',
                    'description': 'MD5 hashing detected',
                    'severity': 'medium',
                    'recommendation': 'Use SHA-256 or stronger hashing algorithms'
                }
            ],
            'hardcoded_secrets': [
                {
                    'pattern': r'(?:api[_-]?key|secret[_-]?key|password|pwd)\s*[:=]\s*["\'][^"\']{16,}["\']',
                    'description': 'Potential hardcoded secret',
                    'severity': 'high',
                    'recommendation': 'Move secrets to environment variables or secure configuration'
                },
                {
                    'pattern': r'(?:AWS_ACCESS_KEY_ID|AWS_SECRET_ACCESS_KEY|PRIVATE_KEY|DATABASE_PASSWORD)',
                    'description': 'Hardcoded sensitive variable',
                    'severity': 'high',
                    'recommendation': 'Use environment variables or secure vaults'
                }
            ]
        }
    
    def load_audit_rules(self) -> Dict[str, Any]:
        """تحميل قواعد التدقيق"""
        return {
            'file_permissions': {
                'executable_files': 0o755,
                'config_files': 0o600,
                'private_files': 0o600,
                'public_files': 0o644
            },
            'environment_checks': {
                'dangerous_vars': ['PATH', 'LD_PRELOAD', 'LD_LIBRARY_PATH'],
                'sensitive_vars': ['API_KEY', 'SECRET_KEY', 'PASSWORD', 'DATABASE_URL']
            },
            'network_checks': {
                'suspicious_ports': [22, 23, 135, 139, 445, 1433, 3389],
                'external_ips': True
            }
        }
    
    def setup_audit_database(self) -> sqlite3.Connection:
        """إعداد قاعدة بيانات التدقيق"""
        try:
            conn = sqlite3.connect('security_audit.db')
            cursor = conn.cursor()
            
            # جدول التدقيقات
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS audits (
                    id TEXT PRIMARY KEY,
                    timestamp DATETIME NOT NULL,
                    scope TEXT NOT NULL,
                    duration_seconds REAL,
                    total_issues INTEGER,
                    critical_issues INTEGER,
                    high_issues INTEGER,
                    medium_issues INTEGER,
                    low_issues INTEGER,
                    status TEXT DEFAULT 'completed'
                )
            ''')
            
            # جدول المشاكل الأمنية
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS security_issues (
                    id TEXT PRIMARY KEY,
                    audit_id TEXT,
                    severity TEXT NOT NULL,
                    category TEXT NOT NULL,
                    title TEXT NOT NULL,
                    description TEXT NOT NULL,
                    file_path TEXT,
                    line_number INTEGER,
                    recommendation TEXT,
                    cve_references TEXT,
                    timestamp DATETIME NOT NULL,
                    FOREIGN KEY (audit_id) REFERENCES audits (id)
                )
            ''')
            
            conn.commit()
            return conn
            
        except Exception as e:
            logger.error(f"Failed to setup audit database: {e}")
            return None
    
    def scan_file_content(self, file_path: str) -> List[SecurityIssue]:
        """فحص محتوى الملف"""
        issues = []
        
        try:
            if os.path.getsize(file_path) > self.config['max_file_size']:
                return issues
            
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')
            
            # فحص الأنماط الأمنية
            for category, patterns in self.security_patterns.items():
                for pattern_info in patterns:
                    for line_num, line in enumerate(lines, 1):
                        if re.search(pattern_info['pattern'], line, re.IGNORECASE):
                            issue = SecurityIssue(
                                id=f"{hashlib.md5(f'{file_path}:{line_num}:{category}'.encode()).hexdigest()[:16]}",
                                severity=pattern_info['severity'],
                                category=category,
                                title=f"{category.replace('_', ' ').title()} Issue",
                                description=pattern_info['description'],
                                file_path=file_path,
                                line_number=line_num,
                                recommendation=pattern_info['recommendation']
                            )
                            issues.append(issue)
                            
        except Exception as e:
            logger.debug(f"Error scanning file {file_path}: {e}")
        
        return issues
    
    def scan_file_permissions(self, file_path: str) -> List[SecurityIssue]:
        """فحص صلاحيات الملفات"""
        issues = []
        
        try:
            stat = os.stat(file_path)
            mode = stat.st_mode
            
            # فحص صلاحيات خطيرة
            if mode & 0o002:  # world-writable
                issue = SecurityIssue(
                    id=f"perm_writable_{hashlib.md5(file_path.encode()).hexdigest()[:16]}",
                    severity='medium',
                    category='file_permissions',
                    title='World-writable file',
                    description=f'File {file_path} is world-writable',
                    file_path=file_path,
                    recommendation='Remove write permissions for others'
                )
                issues.append(issue)
            
            if mode & 0o004:  # world-readable (for sensitive files)
                sensitive_extensions = ['.key', '.pem', '.p12', '.pfx', '.env']
                if any(file_path.endswith(ext) for ext in sensitive_extensions):
                    issue = SecurityIssue(
                        id=f"perm_sensitive_{hashlib.md5(file_path.encode()).hexdigest()[:16]}",
                        severity='high',
                        category='file_permissions',
                        title='Sensitive file is world-readable',
                        description=f'Sensitive file {file_path} is readable by others',
                        file_path=file_path,
                        recommendation='Restrict read permissions to owner only'
                    )
                    issues.append(issue)
                    
        except Exception as e:
            logger.debug(f"Error checking file permissions for {file_path}: {e}")
        
        return issues
    
    def scan_directory(self, path: str) -> List[SecurityIssue]:
        """فحص مجلد"""
        issues = []
        
        try:
            for root, dirs, files in os.walk(path):
                # تخطي المجلدات المستبعدة
                dirs[:] = [d for d in dirs if not any(exclude in d for exclude in self.config['exclude_paths'])]
                
                for file in files:
                    file_path = os.path.join(root, file)
                    
                    # فحص امتداد الملف
                    if not any(file_path.endswith(ext) for ext in self.file_extensions):
                        continue
                    
                    # فحص محتوى الملف
                    if self.config['check_suspicious_patterns']:
                        issues.extend(self.scan_file_content(file_path))
                    
                    # فحص صلاحيات الملف
                    if self.config['check_file_permissions']:
                        issues.extend(self.scan_file_permissions(file_path))
                        
        except Exception as e:
            logger.error(f"Error scanning directory {path}: {e}")
        
        return issues
    
    def check_system_security(self) -> List[SecurityIssue]:
        """فحص أمان النظام"""
        issues = []
        
        try:
            # فحص العمليات الجارية
            if self.config.get('check_processes', True):
                issues.extend(self.check_running_processes())
            
            # فحص الاتصالات الشبكية
            if self.config.get('check_network_connections', True):
                issues.extend(self.check_network_connections())
            
            # فحص متغيرات البيئة
            if self.config.get('check_environment_variables', True):
                issues.extend(self.check_environment_variables())
            
            # فحص صلاحيات المستخدم
            if self.config.get('check_user_privileges', True):
                issues.extend(self.check_user_privileges())
                
        except Exception as e:
            logger.error(f"Error checking system security: {e}")
        
        return issues
    
    def check_running_processes(self) -> List[SecurityIssue]:
        """فحص العمليات الجارية"""
        issues = []
        
        suspicious_processes = ['nc', 'netcat', 'ncat', 'tcpdump', 'wireshark', 'nmap']
        
        try:
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    proc_info = proc.info
                    proc_name = proc_info['name'].lower()
                    
                    # فحص العمليات المشبوهة
                    if any(sus in proc_name for sus in suspicious_processes):
                        issue = SecurityIssue(
                            id=f"proc_{proc_info['pid']}",
                            severity='medium',
                            category='suspicious_process',
                            title=f'Suspicious process running: {proc_info["name"]}',
                            description=f'Process {proc_info["name"]} (PID: {proc_info["pid"]}) may indicate security risk',
                            recommendation='Investigate if this process is necessary'
                        )
                        issues.append(issue)
                        
                    # فحص العمليات التي تعمل بصلاحيات عالية
                    if hasattr(proc, 'username') and proc.username() == 'root':
                        # تحقق من العمليات التي ليست ضرورية للنظام
                        non_system_processes = ['python', 'node', 'java', 'php', 'apache', 'nginx']
                        if not any(sys_proc in proc_name for sys_proc in non_system_processes):
                            issue = SecurityIssue(
                                id=f"root_proc_{proc_info['pid']}",
                                severity='low',
                                category='privilege_escalation',
                                title=f'Non-system process running as root: {proc_info["name"]}',
                                description=f'Process {proc_info["name"]} (PID: {proc_info["pid"]}) running as root',
                                recommendation='Consider running with lower privileges'
                            )
                            issues.append(issue)
                            
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    continue
                    
        except Exception as e:
            logger.error(f"Error checking running processes: {e}")
        
        return issues
    
    def check_network_connections(self) -> List[SecurityIssue]:
        """فحص الاتصالات الشبكية"""
        issues = []
        
        try:
            for conn in psutil.net_connections(kind='inet'):
                if conn.status == 'LISTEN':
                    # فحص المنافذ المشبوهة
                    suspicious_ports = self.audit_rules['network_checks']['suspicious_ports']
                    if conn.laddr.port in suspicious_ports:
                        issue = SecurityIssue(
                            id=f"net_{conn.laddr.port}",
                            severity='medium',
                            category='suspicious_network',
                            title=f'Suspicious port listening: {conn.laddr.port}',
                            description=f'Port {conn.laddr.port} is listening and may indicate security risk',
                            recommendation='Verify if this port should be open and protected'
                        )
                        issues.append(issue)
                    
                    # فحص الاتصالات الخارجية المفتوحة
                    if conn.raddr and conn.raddr.ip != '127.0.0.1':
                        if self.audit_rules['network_checks'].get('external_ips', True):
                            issue = SecurityIssue(
                                id=f"ext_conn_{conn.laddr.port}",
                                severity='low',
                                category='external_connection',
                                title=f'External connection on port {conn.laddr.port}',
                                description=f'Connection to {conn.raddr.ip}:{conn.raddr.port} detected',
                                recommendation='Verify external connections are necessary and secured'
                            )
                            issues.append(issue)
                            
        except Exception as e:
            logger.error(f"Error checking network connections: {e}")
        
        return issues
    
    def check_environment_variables(self) -> List[SecurityIssue]:
        """فحص متغيرات البيئة"""
        issues = []
        
        try:
            for var_name, value in os.environ.items():
                var_upper = var_name.upper()
                
                # فحص المتغيرات الخطيرة
                dangerous_vars = self.audit_rules['environment_checks']['dangerous_vars']
                if any(danger in var_upper for danger in dangerous_vars):
                    issue = SecurityIssue(
                        id=f"env_danger_{var_name}",
                        severity='high',
                        category='environment_variable',
                        title=f'Dangerous environment variable: {var_name}',
                        description=f'Environment variable {var_name} may be exploited',
                        recommendation='Review and secure dangerous environment variables'
                    )
                    issues.append(issue)
                
                # فحص المتغيرات الحساسة
                sensitive_vars = self.audit_rules['environment_checks']['sensitive_vars']
                if any(sensitive in var_upper for sensitive in sensitive_vars):
                    if len(value) > 8:  # تجنب false positives
                        issue = SecurityIssue(
                            id=f"env_sensitive_{var_name}",
                            severity='medium',
                            category='sensitive_variable',
                            title=f'Sensitive environment variable: {var_name}',
                            description=f'Environment variable {var_name} may contain sensitive data',
                            recommendation='Ensure sensitive environment variables are properly secured'
                        )
                        issues.append(issue)
                        
        except Exception as e:
            logger.error(f"Error checking environment variables: {e}")
        
        return issues
    
    def check_user_privileges(self) -> List[SecurityIssue]:
        """فحص صلاحيات المستخدم"""
        issues = []
        
        try:
            import pwd
            import grp
            
            # فحص المستخدم الحالي
            current_uid = os.getuid()
            current_user = pwd.getpwuid(current_uid).pw_name
            
            # فحص إذا كان المستخدم root
            if current_uid == 0:
                issue = SecurityIssue(
                    id="root_user",
                    severity='medium',
                    category='privilege_escalation',
                    title='Running as root user',
                    description='Application is running with root privileges',
                    recommendation='Consider running as non-root user for security'
                )
                issues.append(issue)
            
            # فحص مجموعات المستخدمين
            user_groups = [g.gr_name for g in grp.getgrgid(os.getgid()).gr_mem]
            
            # فحص إذا كان المستخدم في مجموعات عالية الصلاحيات
            privileged_groups = ['wheel', 'sudo', 'admin']
            if any(g in user_groups for g in privileged_groups):
                issue = SecurityIssue(
                    id="privileged_group",
                    severity='low',
                    category='privilege_escalation',
                    title='User in privileged group',
                    description=f'User {current_user} is member of privileged group',
                    recommendation='Review group memberships for security compliance'
                )
                issues.append(issue)
                
        except Exception as e:
            logger.error(f"Error checking user privileges: {e}")
        
        return issues
    
    def run_audit(self, scope: str = "full") -> AuditResult:
        """تشغيل تدقيق أمني شامل"""
        start_time = time.time()
        audit_id = f"audit_{int(time.time())}_{hash(os.urandom(4)).hexdigest()[:8]}"
        
        logger.info(f"Starting security audit: {audit_id} (scope: {scope})")
        
        all_issues = []
        
        try:
            if scope in ["full", "code"]:
                # فحص الكود
                if self.config.get('parallel_scanning', True):
                    all_issues.extend(self.run_parallel_file_scan())
                else:
                    all_issues.extend(self.run_sequential_file_scan())
            
            if scope in ["full", "system"]:
                # فحص النظام
                all_issues.extend(self.check_system_security())
            
            # حساب الإحصائيات
            duration = time.time() - start_time
            severity_counts = self.count_issues_by_severity(all_issues)
            
            # إنشاء النتيجة
            result = AuditResult(
                audit_id=audit_id,
                timestamp=datetime.now(),
                scope=scope,
                total_issues=len(all_issues),
                critical_issues=severity_counts['critical'],
                high_issues=severity_counts['high'],
                medium_issues=severity_counts['medium'],
                low_issues=severity_counts['low'],
                issues=all_issues,
                duration_seconds=duration,
                recommendations=self.generate_recommendations(all_issues)
            )
            
            # حفظ النتيجة
            self.save_audit_result(result)
            
            self.current_audit = result
            logger.info(f"Security audit completed: {audit_id} - {len(all_issues)} issues found")
            
            return result
            
        except Exception as e:
            logger.error(f"Security audit failed: {e}")
            raise
    
    def run_parallel_file_scan(self) -> List[SecurityIssue]:
        """تشغيل فحص الملفات بشكل متوازي"""
        all_issues = []
        
        with ThreadPoolExecutor(max_workers=self.config.get('max_workers', 4)) as executor:
            futures = []
            
            for scan_path in self.config.get('scan_paths', ['.']):
                future = executor.submit(self.scan_directory, scan_path)
                futures.append(future)
            
            for future in as_completed(futures):
                try:
                    issues = future.result()
                    all_issues.extend(issues)
                except Exception as e:
                    logger.error(f"Error in parallel file scan: {e}")
        
        return all_issues
    
    def run_sequential_file_scan(self) -> List[SecurityIssue]:
        """تشغيل فحص الملفات بشكل متسلسل"""
        all_issues = []
        
        for scan_path in self.config.get('scan_paths', ['.']):
            issues = self.scan_directory(scan_path)
            all_issues.extend(issues)
        
        return all_issues
    
    def count_issues_by_severity(self, issues: List[SecurityIssue]) -> Dict[str, int]:
        """عد المشاكل حسب الخطورة"""
        counts = {'critical': 0, 'high': 0, 'medium': 0, 'low': 0}
        
        for issue in issues:
            if issue.severity in counts:
                counts[issue.severity] += 1
        
        return counts
    
    def generate_recommendations(self, issues: List[SecurityIssue]) -> List[str]:
        """توليد التوصيات"""
        recommendations = []
        
        # إحصائيات المشاكل
        severity_counts = self.count_issues_by_severity(issues)
        
        if severity_counts['critical'] > 0:
            recommendations.append(f"Address {severity_counts['critical']} critical security issues immediately")
        
        if severity_counts['high'] > 0:
            recommendations.append(f"Fix {severity_counts['high']} high-priority security issues")
        
        if severity_counts['medium'] > 0:
            recommendations.append(f"Review {severity_counts['medium']} medium-priority security issues")
        
        if severity_counts['low'] > 0:
            recommendations.append(f"Monitor {severity_counts['low']} low-priority security issues")
        
        # توصيات عامة
        if any(issue.category == 'sql_injection' for issue in issues):
            recommendations.append("Implement parameterized queries to prevent SQL injection")
        
        if any(issue.category == 'hardcoded_secrets' for issue in issues):
            recommendations.append("Move hardcoded secrets to secure configuration or environment variables")
        
        if any(issue.category == 'file_permissions' for issue in issues):
            recommendations.append("Review and fix file permissions to follow principle of least privilege")
        
        return recommendations
    
    def save_audit_result(self, result: AuditResult):
        """حفظ نتيجة التدقيق"""
        if not self.audit_db:
            return
        
        try:
            cursor = self.audit_db.cursor()
            
            # حفظ معلومات التدقيق
            cursor.execute('''
                INSERT INTO audits 
                (id, timestamp, scope, duration_seconds, total_issues, 
                 critical_issues, high_issues, medium_issues, low_issues)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                result.audit_id, result.timestamp, result.scope, result.duration_seconds,
                result.total_issues, result.critical_issues, result.high_issues,
                result.medium_issues, result.low_issues
            ))
            
            # حفظ المشاكل
            for issue in result.issues:
                cursor.execute('''
                    INSERT INTO security_issues 
                    (id, audit_id, severity, category, title, description, file_path,
                     line_number, recommendation, cve_references, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ''', (
                    issue.id, result.audit_id, issue.severity, issue.category,
                    issue.title, issue.description, issue.file_path,
                    issue.line_number, issue.recommendation,
                    json.dumps(issue.cve_references), issue.timestamp
                ))
            
            self.audit_db.commit()
            
        except Exception as e:
            logger.error(f"Failed to save audit result: {e}")
    
    def generate_report(self, result: AuditResult, output_format: str = "json") -> str:
        """توليد تقرير التدقيق"""
        if output_format == "json":
            return json.dumps(asdict(result), indent=2, default=str)
        
        elif output_format == "text":
            report = f"""
Security Audit Report
====================
Audit ID: {result.audit_id}
Timestamp: {result.timestamp}
Scope: {result.scope}
Duration: {result.duration_seconds:.2f} seconds

Summary
-------
Total Issues: {result.total_issues}
Critical: {result.critical_issues}
High: {result.high_issues}
Medium: {result.medium_issues}
Low: {result.low_issues}

Detailed Issues
--------------
"""
            for issue in result.issues:
                report += f"""
[{issue.severity.upper()}] {issue.title}
File: {issue.file_path or 'N/A'}
Line: {issue.line_number or 'N/A'}
Description: {issue.description}
Recommendation: {issue.recommendation}
"""
            
            report += "\n\nRecommendations\n--------------\n"
            for rec in result.recommendations:
                report += f"- {rec}\n"
            
            return report
        
        else:
            raise ValueError(f"Unsupported output format: {output_format}")

# مثال على الاستخدام
if __name__ == "__main__":
    auditor = SecurityAuditor()
    
    # تشغيل تدقيق شامل
    result = auditor.run_audit("full")
    
    # توليد وتقرير
    report = auditor.generate_report(result, "text")
    print(report)
    
    # حفظ التقرير
    with open(f"security_report_{result.audit_id}.txt", "w") as f:
        f.write(report)
    
    print(f"\nReport saved to: security_report_{result.audit_id}.txt")