#!/usr/bin/env python3
"""
نظام مراقبة أداء قاعدة البيانات
Database Performance Monitoring System
"""

import time
import psutil
import logging
import asyncio
import json
import sqlite3
import psycopg2
from datetime import datetime, timedelta
from prometheus_client import Counter, Histogram, Gauge, start_http_server
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import threading
from concurrent.futures import ThreadPoolExecutor
import mysql.connector
from sqlalchemy import create_engine, text
import redis

# إعداد Prometheus Metrics
db_query_duration = Histogram(
    'db_query_duration_seconds',
    'Time spent executing database queries',
    ['db_type', 'query_type', 'table']
)

db_query_total = Counter(
    'db_queries_total',
    'Total number of database queries executed',
    ['db_type', 'query_type', 'status']
)

db_connections_active = Gauge(
    'db_connections_active',
    'Number of active database connections',
    ['db_type', 'host']
)

db_slow_queries = Counter(
    'db_slow_queries_total',
    'Total number of slow queries',
    ['db_type', 'threshold']
)

@dataclass
class QueryMetrics:
    """مقاييس الاستعلام"""
    query: str
    duration: float
    query_type: str
    table: str
    timestamp: datetime
    status: str
    rows_affected: int
    error_message: Optional[str] = None

@dataclass
class ConnectionMetrics:
    """مقاييس الاتصال"""
    active_connections: int
    max_connections: int
    connection_usage_percent: float
    host: str
    timestamp: datetime

@dataclass
class LockMetrics:
    """مقاييس الأقفال"""
    table: str
    lock_type: str
    waiting_queries: int
    duration: float
    timestamp: datetime

class DatabasePerformanceMonitor:
    """مراقب أداء قاعدة البيانات"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = self._setup_logging()
        
        # إعداد قاعدة البيانات
        self.databases = self._setup_databases()
        
        # تخزين المقاييس
        self.query_metrics: List[QueryMetrics] = []
        self.connection_metrics: List[ConnectionMetrics] = []
        self.lock_metrics: List[LockMetrics] = []
        
        # إعداد Prometheus
        self._setup_prometheus_metrics()
        
        # خيط المراقبة
        self.monitoring_active = False
        self.monitor_thread = None
        
        # إعداد التخزين
        self.metrics_db = self._setup_metrics_database()
        
    def _setup_logging(self):
        """إعداد نظام السجلات"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('database_performance.log'),
                logging.StreamHandler()
            ]
        )
        return logging.getLogger(__name__)
    
    def _setup_databases(self):
        """إعداد اتصالات قواعد البيانات"""
        databases = {}
        
        for db_config in self.config.get('databases', []):
            db_type = db_config['type']
            
            try:
                if db_type == 'postgresql':
                    databases[db_config['name']] = {
                        'connection': psycopg2.connect(
                            host=db_config['host'],
                            port=db_config.get('port', 5432),
                            database=db_config['database'],
                            user=db_config['user'],
                            password=db_config['password']
                        ),
                        'type': 'postgresql',
                        'config': db_config
                    }
                elif db_type == 'mysql':
                    databases[db_config['name']] = {
                        'connection': mysql.connector.connect(
                            host=db_config['host'],
                            port=db_config.get('port', 3306),
                            database=db_config['database'],
                            user=db_config['user'],
                            password=db_config['password']
                        ),
                        'type': 'mysql',
                        'config': db_config
                    }
                elif db_type == 'redis':
                    databases[db_config['name']] = {
                        'connection': redis.Redis(
                            host=db_config['host'],
                            port=db_config.get('port', 6379),
                            password=db_config.get('password'),
                            decode_responses=True
                        ),
                        'type': 'redis',
                        'config': db_config
                    }
                    
                self.logger.info(f"Connected to {db_type} database: {db_config['name']}")
                
            except Exception as e:
                self.logger.error(f"Failed to connect to {db_type} database: {e}")
        
        return databases
    
    def _setup_metrics_database(self):
        """إعداد قاعدة بيانات لحفظ المقاييس"""
        try:
            conn = sqlite3.connect('database_metrics.db')
            cursor = conn.cursor()
            
            # جدول مقاييس الاستعلامات
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS query_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    query TEXT NOT NULL,
                    duration REAL NOT NULL,
                    query_type TEXT NOT NULL,
                    table_name TEXT,
                    timestamp DATETIME NOT NULL,
                    status TEXT NOT NULL,
                    rows_affected INTEGER,
                    error_message TEXT,
                    database_name TEXT
                )
            ''')
            
            # جدول مقاييس الاتصالات
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS connection_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    active_connections INTEGER NOT NULL,
                    max_connections INTEGER NOT NULL,
                    connection_usage_percent REAL NOT NULL,
                    host TEXT NOT NULL,
                    database_name TEXT NOT NULL,
                    timestamp DATETIME NOT NULL
                )
            ''')
            
            # جدول مقاييس الأقفال
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS lock_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    lock_type TEXT NOT NULL,
                    waiting_queries INTEGER NOT NULL,
                    duration REAL NOT NULL,
                    timestamp DATETIME NOT NULL,
                    database_name TEXT NOT NULL
                )
            ''')
            
            conn.commit()
            return conn
            
        except Exception as e:
            self.logger.error(f"Failed to setup metrics database: {e}")
            return None
    
    def _setup_prometheus_metrics(self):
        """إعداد مقاييس Prometheus"""
        # بدء خادم Prometheus في منفذ منفصل
        if self.config.get('prometheus_port'):
            start_http_server(self.config['prometheus_port'])
    
    def execute_query_with_monitoring(self, db_name: str, query: str, 
                                    query_type: str = 'unknown', 
                                    table: str = None):
        """تنفيذ استعلام مع مراقبة الأداء"""
        if db_name not in self.databases:
            raise ValueError(f"Database {db_name} not found")
        
        db_info = self.databases[db_name]
        start_time = time.time()
        
        try:
            cursor = db_info['connection'].cursor()
            
            if db_info['type'] == 'redis':
                # تنفيذ استعلام Redis
                result = cursor.execute(query)
                rows_affected = cursor.rowcount if hasattr(cursor, 'rowcount') else 0
            else:
                # تنفيذ استعلام SQL عادي
                cursor.execute(query)
                rows_affected = cursor.rowcount if hasattr(cursor, 'rowcount') else 0
            
            db_info['connection'].commit()
            
            duration = time.time() - start_time
            status = 'success'
            error_message = None
            
            # تسجيل المقاييس
            self._record_query_metrics(
                db_name, query, duration, query_type, table, 
                'success', rows_affected, error_message
            )
            
            return {
                'success': True,
                'duration': duration,
                'rows_affected': rows_affected,
                'result': cursor.fetchall() if db_info['type'] != 'redis' else None
            }
            
        except Exception as e:
            duration = time.time() - start_time
            status = 'error'
            error_message = str(e)
            
            # تسجيل المقاييس
            self._record_query_metrics(
                db_name, query, duration, query_type, table, 
                'error', 0, error_message
            )
            
            self.logger.error(f"Query execution failed: {e}")
            raise
        
        finally:
            if 'cursor' in locals():
                cursor.close()
    
    def _record_query_metrics(self, db_name: str, query: str, duration: float,
                            query_type: str, table: str, status: str, 
                            rows_affected: int, error_message: Optional[str]):
        """تسجيل مقاييس الاستعلام"""
        
        # إضافة إلى القائمة المحلية
        metrics = QueryMetrics(
            query=query[:100],  # اقتطاع للاستعلامات الطويلة
            duration=duration,
            query_type=query_type,
            table=table or 'unknown',
            timestamp=datetime.now(),
            status=status,
            rows_affected=rows_affected,
            error_message=error_message
        )
        
        self.query_metrics.append(metrics)
        
        # تسجيل في قاعدة البيانات
        if self.metrics_db:
            cursor = self.metrics_db.cursor()
            cursor.execute('''
                INSERT INTO query_metrics 
                (query, duration, query_type, table_name, timestamp, status, 
                 rows_affected, error_message, database_name)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                metrics.query, metrics.duration, metrics.query_type,
                metrics.table, metrics.timestamp, metrics.status,
                metrics.rows_affected, metrics.error_message, db_name
            ))
            self.metrics_db.commit()
        
        # تسجيل Prometheus metrics
        db_type = self.databases[db_name]['type']
        db_query_duration.labels(
            db_type=db_type, 
            query_type=query_type, 
            table=table or 'unknown'
        ).observe(duration)
        
        db_query_total.labels(
            db_type=db_type, 
            query_type=query_type, 
            status=status
        ).inc()
        
        # فحص الاستعلامات البطيئة
        slow_threshold = self.config.get('slow_query_threshold', 1.0)
        if duration > slow_threshold:
            db_slow_queries.labels(
                db_type=db_type,
                threshold=str(slow_threshold)
            ).inc()
    
    def get_connection_metrics(self, db_name: str) -> Optional[ConnectionMetrics]:
        """الحصول على مقاييس الاتصال"""
        if db_name not in self.databases:
            return None
        
        db_info = self.databases[db_name]
        
        try:
            if db_info['type'] == 'postgresql':
                cursor = db_info['connection'].cursor()
                cursor.execute('''
                    SELECT count(*) as active_connections,
                           setting::int as max_connections
                    FROM pg_stat_activity, pg_settings 
                    WHERE pg_settings.name = 'max_connections'
                ''')
                result = cursor.fetchone()
                active_connections = result[0]
                max_connections = result[1]
                
            elif db_info['type'] == 'mysql':
                cursor = db_info['connection'].cursor()
                cursor.execute('SHOW STATUS LIKE "Threads_connected"')
                active_connections = int(cursor.fetchone()[1])
                
                cursor.execute('SHOW VARIABLES LIKE "max_connections"')
                max_connections = int(cursor.fetchone()[1])
                
            else:
                # Redis أو قواعد بيانات أخرى
                active_connections = 1  # Redis typically single connection
                max_connections = 1000
            
            connection_usage_percent = (active_connections / max_connections) * 100
            
            metrics = ConnectionMetrics(
                active_connections=active_connections,
                max_connections=max_connections,
                connection_usage_percent=connection_usage_percent,
                host=db_info['config']['host'],
                timestamp=datetime.now()
            )
            
            # تسجيل المقاييس
            self.connection_metrics.append(metrics)
            
            # تسجيل في قاعدة البيانات
            if self.metrics_db:
                cursor = self.metrics_db.cursor()
                cursor.execute('''
                    INSERT INTO connection_metrics 
                    (active_connections, max_connections, connection_usage_percent, 
                     host, database_name, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?)
                ''', (
                    metrics.active_connections, metrics.max_connections,
                    metrics.connection_usage_percent, metrics.host,
                    db_name, metrics.timestamp
                ))
                self.metrics_db.commit()
            
            # تسجيل Prometheus metrics
            db_connections_active.labels(
                db_type=db_info['type'],
                host=db_info['config']['host']
            ).set(active_connections)
            
            return metrics
            
        except Exception as e:
            self.logger.error(f"Failed to get connection metrics for {db_name}: {e}")
            return None
    
    def get_lock_metrics(self, db_name: str) -> List[LockMetrics]:
        """الحصول على مقاييس الأقفال"""
        if db_name not in self.databases:
            return []
        
        db_info = self.databases[db_name]
        locks = []
        
        try:
            if db_info['type'] == 'postgresql':
                cursor = db_info['connection'].cursor()
                cursor.execute('''
                    SELECT schemaname, tablename, mode, granted,
                           query, query_start
                    FROM pg_locks 
                    JOIN pg_stat_activity ON pg_locks.pid = pg_stat_activity.pid
                    WHERE NOT granted
                ''')
                
                for row in cursor.fetchall():
                    lock_metrics = LockMetrics(
                        table=row[1],
                        lock_type=row[2],
                        waiting_queries=1,
                        duration=0,  # سيتم حسابها
                        timestamp=datetime.now()
                    )
                    locks.append(lock_metrics)
            
            # إضافة إلى القائمة المحلية
            self.lock_metrics.extend(locks)
            
            return locks
            
        except Exception as e:
            self.logger.error(f"Failed to get lock metrics for {db_name}: {e}")
            return []
    
    def analyze_query_performance(self, db_name: str, hours: int = 24) -> Dict[str, Any]:
        """تحليل أداء الاستعلامات"""
        if not self.metrics_db:
            return {}
        
        cursor = self.metrics_db.cursor()
        
        # الاستعلامات البطيئة
        cursor.execute('''
            SELECT query_type, table_name, 
                   AVG(duration) as avg_duration,
                   COUNT(*) as query_count,
                   MAX(duration) as max_duration
            FROM query_metrics 
            WHERE database_name = ? AND timestamp > ? 
            GROUP BY query_type, table_name
            ORDER BY avg_duration DESC
        ''', (db_name, datetime.now() - timedelta(hours=hours)))
        
        slow_queries = cursor.fetchall()
        
        # أنماط الأخطاء
        cursor.execute('''
            SELECT query_type, error_message, COUNT(*) as error_count
            FROM query_metrics 
            WHERE database_name = ? AND status = 'error' AND timestamp > ?
            GROUP BY query_type, error_message
            ORDER BY error_count DESC
        ''', (db_name, datetime.now() - timedelta(hours=hours)))
        
        error_patterns = cursor.fetchall()
        
        # اتجاهات الأداء
        cursor.execute('''
            SELECT DATE(timestamp) as date,
                   AVG(duration) as avg_duration,
                   COUNT(*) as query_count
            FROM query_metrics 
            WHERE database_name = ? AND timestamp > ?
            GROUP BY DATE(timestamp)
            ORDER BY date
        ''', (db_name, datetime.now() - timedelta(hours=hours)))
        
        performance_trends = cursor.fetchall()
        
        return {
            'slow_queries': [
                {
                    'query_type': row[0],
                    'table': row[1],
                    'avg_duration': row[2],
                    'query_count': row[3],
                    'max_duration': row[4]
                }
                for row in slow_queries
            ],
            'error_patterns': [
                {
                    'query_type': row[0],
                    'error_message': row[1],
                    'error_count': row[2]
                }
                for row in error_patterns
            ],
            'performance_trends': [
                {
                    'date': row[0],
                    'avg_duration': row[1],
                    'query_count': row[2]
                }
                for row in performance_trends
            ]
        }
    
    def start_monitoring(self, interval: int = 60):
        """بدء مراقبة مستمرة"""
        self.monitoring_active = True
        
        def monitor_loop():
            while self.monitoring_active:
                try:
                    for db_name in self.databases.keys():
                        # جمع مقاييس الاتصال
                        self.get_connection_metrics(db_name)
                        
                        # جمع مقاييس الأقفال
                        self.get_lock_metrics(db_name)
                        
                        # فحص التنبيهات
                        self.check_performance_alerts(db_name)
                    
                    # تنظيف البيانات القديمة
                    self.cleanup_old_metrics()
                    
                    time.sleep(interval)
                    
                except Exception as e:
                    self.logger.error(f"Error in monitoring loop: {e}")
                    time.sleep(interval)
        
        self.monitor_thread = threading.Thread(target=monitor_loop)
        self.monitor_thread.start()
        
        self.logger.info("Database performance monitoring started")
    
    def stop_monitoring(self):
        """إيقاف المراقبة"""
        self.monitoring_active = False
        if self.monitor_thread:
            self.monitor_thread.join()
        
        # إغلاق الاتصالات
        for db_info in self.databases.values():
            try:
                db_info['connection'].close()
            except:
                pass
        
        if self.metrics_db:
            self.metrics_db.close()
        
        self.logger.info("Database performance monitoring stopped")
    
    def check_performance_alerts(self, db_name: str):
        """فحص تنبيهات الأداء"""
        # فحص الاتصالات العالية
        connection_metrics = self.get_connection_metrics(db_name)
        if connection_metrics and connection_metrics.connection_usage_percent > 80:
            self.logger.warning(f"High connection usage for {db_name}: {connection_metrics.connection_usage_percent}%")
        
        # فحص الاستعلامات البطيئة
        recent_queries = [m for m in self.query_metrics 
                         if m.timestamp > datetime.now() - timedelta(minutes=5)]
        
        slow_count = sum(1 for q in recent_queries 
                        if q.duration > self.config.get('slow_query_threshold', 1.0))
        
        if slow_count > 10:  # أكثر من 10 استعلامات بطيئة في آخر 5 دقائق
            self.logger.warning(f"High number of slow queries for {db_name}: {slow_count}")
    
    def cleanup_old_metrics(self, days: int = 7):
        """تنظيف المقاييس القديمة"""
        if not self.metrics_db:
            return
        
        cutoff_date = datetime.now() - timedelta(days=days)
        cursor = self.metrics_db.cursor()
        
        # حذف المقاييس القديمة
        for table in ['query_metrics', 'connection_metrics', 'lock_metrics']:
            cursor.execute(f'DELETE FROM {table} WHERE timestamp < ?', (cutoff_date,))
        
        self.metrics_db.commit()
        self.logger.info("Cleaned up old metrics data")
    
    def get_performance_report(self, db_name: str, hours: int = 24) -> Dict[str, Any]:
        """إنشاء تقرير أداء شامل"""
        analysis = self.analyze_query_performance(db_name, hours)
        
        # إحصائيات عامة
        total_queries = len([m for m in self.query_metrics 
                           if m.timestamp > datetime.now() - timedelta(hours=hours)])
        
        avg_response_time = 0
        if total_queries > 0:
            avg_response_time = sum(m.duration for m in self.query_metrics 
                                  if m.timestamp > datetime.now() - timedelta(hours=hours)) / total_queries
        
        error_rate = 0
        if total_queries > 0:
            error_count = len([m for m in self.query_metrics 
                             if m.timestamp > datetime.now() - timedelta(hours=hours) and m.status == 'error'])
            error_rate = (error_count / total_queries) * 100
        
        return {
            'database': db_name,
            'time_range_hours': hours,
            'total_queries': total_queries,
            'average_response_time': avg_response_time,
            'error_rate_percent': error_rate,
            'analysis': analysis,
            'timestamp': datetime.now().isoformat()
        }

# مثال على الاستخدام
if __name__ == "__main__":
    config = {
        'databases': [
            {
                'name': 'main_db',
                'type': 'postgresql',
                'host': 'localhost',
                'port': 5432,
                'database': 'mydb',
                'user': 'user',
                'password': 'password'
            }
        ],
        'slow_query_threshold': 1.0,
        'prometheus_port': 8001
    }
    
    monitor = DatabasePerformanceMonitor(config)
    
    try:
        # بدء المراقبة
        monitor.start_monitoring(interval=30)
        
        # تنفيذ استعلامات تجريبية
        time.sleep(2)
        monitor.execute_query_with_monitoring('main_db', 'SELECT 1', 'select')
        
        # الحصول على تقرير
        report = monitor.get_performance_report('main_db', 1)
        print(json.dumps(report, indent=2, default=str))
        
        # انتظار للإنهاء
        time.sleep(10)
        
    except KeyboardInterrupt:
        monitor.stop_monitoring()