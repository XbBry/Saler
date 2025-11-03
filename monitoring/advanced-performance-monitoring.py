#!/usr/bin/env python3
"""
نظام مراقبة الأداء المتقدم - Advanced Performance Monitoring System
نظام شامل لمراقبة أداء التطبيق مع التحليل الذكي والتنبؤات والتحسينات التلقائية
Advanced and comprehensive system for monitoring application performance with intelligent analytics, predictions, and auto-optimization
"""

import asyncio
import aiohttp
import psutil
import time
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
from enum import Enum
import numpy as np
from scipy import stats
import threading
import queue
import sqlite3
import redis
import prometheus_client
from prometheus_client import Gauge, Counter, Histogram, Summary
import matplotlib.pyplot as plt
import seaborn as sns
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

class PerformanceMetric(Enum):
    """مقاييس الأداء المختلفة"""
    RESPONSE_TIME = "response_time"
    THROUGHPUT = "throughput"
    ERROR_RATE = "error_rate"
    CPU_USAGE = "cpu_usage"
    MEMORY_USAGE = "memory_usage"
    DISK_IO = "disk_io"
    NETWORK_IO = "network_io"
    DATABASE_CONNECTIONS = "db_connections"
    CACHE_HIT_RATE = "cache_hit_rate"
    PAGE_LOAD_TIME = "page_load_time"
    TIME_TO_FIRST_BYTE = "ttfb"
    DOM_READY_TIME = "dom_ready_time"

class AlertThreshold(Enum):
    """حدود التنبيهات"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

@dataclass
class PerformanceDataPoint:
    """نقطة بيانات الأداء"""
    timestamp: datetime
    metric: PerformanceMetric
    value: float
    unit: str
    labels: Dict[str, str]
    metadata: Dict[str, Any] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

@dataclass
class PerformanceAlert:
    """تنبيه أداء"""
    id: str
    metric: PerformanceMetric
    severity: AlertThreshold
    message: str
    current_value: float
    threshold: float
    timestamp: datetime
    trend: str  # "increasing", "decreasing", "stable"
    recommendations: List[str]

@dataclass
class OptimizationRecommendation:
    """توصية تحسين"""
    id: str
    category: str
    title: str
    description: str
    impact: str  # "high", "medium", "low"
    effort: str  # "high", "medium", "low"
    expected_improvement: float
    implementation_steps: List[str]
    automation_possible: bool

class PerformanceAnalyzer:
    """محلل الأداء الذكي"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.data_buffer = defaultdict(lambda: deque(maxlen=1000))
        self.metrics = self.setup_metrics()
        self.alert_thresholds = self.get_default_thresholds()
        self.ml_models = self.setup_ml_models()
        self.logger = self.setup_logging()
        
        # إعداد التحليل الدوري
        self.analysis_interval = config.get('analysis_interval', 60)  # ثانية
        self.prediction_window = config.get('prediction_window', 3600)  # ثانية (1 ساعة)
        
    def setup_logging(self) -> logging.Logger:
        """إعداد نظام السجلات"""
        logger = logging.getLogger('PerformanceAnalyzer')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    def setup_metrics(self) -> Dict[str, Any]:
        """إعداد مقاييس Prometheus"""
        metrics = {
            'response_time': Histogram(
                'app_response_time_seconds',
                'Application response time',
                ['endpoint', 'method'],
                buckets=[0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 30.0]
            ),
            'throughput': Gauge(
                'app_throughput_requests_per_second',
                'Application throughput (requests per second)',
                ['endpoint']
            ),
            'error_rate': Gauge(
                'app_error_rate_percent',
                'Application error rate (%)',
                ['endpoint', 'status_code']
            ),
            'cpu_usage': Gauge(
                'system_cpu_usage_percent',
                'System CPU usage (%)'
            ),
            'memory_usage': Gauge(
                'system_memory_usage_percent',
                'System memory usage (%)'
            ),
            'disk_io': Gauge(
                'system_disk_io_bytes_per_second',
                'System disk I/O (bytes/sec)'
            ),
            'network_io': Gauge(
                'system_network_io_bytes_per_second',
                'System network I/O (bytes/sec)'
            ),
            'db_connections': Gauge(
                'database_connections_active',
                'Active database connections',
                ['database']
            ),
            'cache_hit_rate': Gauge(
                'cache_hit_rate_percent',
                'Cache hit rate (%)',
                ['cache_type']
            )
        }
        
        return metrics
    
    def get_default_thresholds(self) -> Dict[PerformanceMetric, Dict[str, float]]:
        """الحصول على الحدود الافتراضية للتنبيهات"""
        return {
            PerformanceMetric.RESPONSE_TIME: {
                'low': 1.0,      # 1 ثانية
                'medium': 2.0,   # 2 ثانية
                'high': 5.0,     # 5 ثوان
                'critical': 10.0  # 10 ثوان
            },
            PerformanceMetric.CPU_USAGE: {
                'low': 50.0,     # 50%
                'medium': 70.0,  # 70%
                'high': 85.0,    # 85%
                'critical': 95.0  # 95%
            },
            PerformanceMetric.MEMORY_USAGE: {
                'low': 60.0,     # 60%
                'medium': 75.0,  # 75%
                'high': 85.0,    # 85%
                'critical': 95.0  # 95%
            },
            PerformanceMetric.ERROR_RATE: {
                'low': 1.0,      # 1%
                'medium': 3.0,   # 3%
                'high': 5.0,     # 5%
                'critical': 10.0  # 10%
            },
            PerformanceMetric.DISK_IO: {
                'low': 1000000,      # 1 MB/s
                'medium': 10000000,  # 10 MB/s
                'high': 50000000,    # 50 MB/s
                'critical': 100000000  # 100 MB/s
            },
            PerformanceMetric.NETWORK_IO: {
                'low': 1000000,      # 1 MB/s
                'medium': 10000000,  # 10 MB/s
                'high': 50000000,    # 50 MB/s
                'critical': 100000000  # 100 MB/s
            }
        }
    
    def setup_ml_models(self) -> Dict[str, Any]:
        """إعداد نماذج التعلم الآلي"""
        models = {
            'anomaly_detector': IsolationForest(
                contamination=0.1,
                random_state=42
            ),
            'trend_predictor': StandardScaler(),
            'threshold_optimizer': None  # سيتم إعداده لاحقاً
        }
        
        return models
    
    def collect_performance_data(self) -> List[PerformanceDataPoint]:
        """جمع بيانات الأداء"""
        data_points = []
        timestamp = datetime.now()
        
        # جمع بيانات النظام
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            data_points.append(PerformanceDataPoint(
                timestamp=timestamp,
                metric=PerformanceMetric.CPU_USAGE,
                value=cpu_percent,
                unit="percent",
                labels={}
            ))
            
            # الذاكرة
            memory = psutil.virtual_memory()
            data_points.append(PerformanceDataPoint(
                timestamp=timestamp,
                metric=PerformanceMetric.MEMORY_USAGE,
                value=memory.percent,
                unit="percent",
                labels={}
            ))
            
            # القرص
            disk_io = psutil.disk_io_counters()
            if disk_io:
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.DISK_IO,
                    value=disk_io.read_bytes + disk_io.write_bytes,
                    unit="bytes",
                    labels={}
                ))
            
            # الشبكة
            network_io = psutil.net_io_counters()
            if network_io:
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.NETWORK_IO,
                    value=network_io.bytes_sent + network_io.bytes_recv,
                    unit="bytes",
                    labels={}
                ))
        
        except Exception as e:
            self.logger.error(f"خطأ في جمع بيانات النظام: {e}")
        
        # جمع بيانات التطبيق (من Redis/قاعدة البيانات)
        try:
            app_metrics = self.collect_application_metrics()
            data_points.extend(app_metrics)
        except Exception as e:
            self.logger.error(f"خطأ في جمع بيانات التطبيق: {e}")
        
        return data_points
    
    def collect_application_metrics(self) -> List[PerformanceDataPoint]:
        """جمع مقاييس التطبيق"""
        data_points = []
        timestamp = datetime.now()
        
        try:
            # من Redis
            if hasattr(self, 'redis_client') and self.redis_client:
                redis_info = self.redis_client.info()
                
                # الاتصالات النشطة
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.DATABASE_CONNECTIONS,
                    value=redis_info.get('connected_clients', 0),
                    unit="count",
                    labels={'database': 'redis'}
                ))
                
                # معدل الضرب (Hit Rate)
                hits = redis_info.get('keyspace_hits', 0)
                misses = redis_info.get('keyspace_misses', 0)
                total_requests = hits + misses
                hit_rate = (hits / total_requests * 100) if total_requests > 0 else 0
                
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.CACHE_HIT_RATE,
                    value=hit_rate,
                    unit="percent",
                    labels={'cache_type': 'redis'}
                ))
        
        except Exception as e:
            self.logger.error(f"خطأ في جمع مقاييس التطبيق: {e}")
        
        return data_points
    
    def add_data_point(self, data_point: PerformanceDataPoint):
        """إضافة نقطة بيانات"""
        # إضافة للذاكرة المؤقتة
        self.data_buffer[data_point.metric].append(data_point)
        
        # تحديث مقاييس Prometheus
        if data_point.metric in self.metrics:
            if hasattr(self.metrics[data_point.metric], 'set'):
                self.metrics[data_point.metric].set(data_point.value)
            elif hasattr(self.metrics[data_point.metric], 'observe'):
                # للـ Histogram
                self.metrics[data_point.metric].observe(data_point.value)
        
        # تحليل فوري للتنبيهات
        self.check_immediate_alerts(data_point)
    
    def check_immediate_alerts(self, data_point: PerformanceDataPoint):
        """فحص التنبيهات الفورية"""
        if data_point.metric not in self.alert_thresholds:
            return
        
        thresholds = self.alert_thresholds[data_point.metric]
        current_value = data_point.value
        
        severity = None
        if current_value >= thresholds['critical']:
            severity = AlertThreshold.CRITICAL
        elif current_value >= thresholds['high']:
            severity = AlertThreshold.HIGH
        elif current_value >= thresholds['medium']:
            severity = AlertThreshold.MEDIUM
        elif current_value >= thresholds['low']:
            severity = AlertThreshold.LOW
        
        if severity:
            alert = PerformanceAlert(
                id=f"alert_{int(time.time())}_{data_point.metric.value}",
                metric=data_point.metric,
                severity=severity,
                message=f"{data_point.metric.value} قيمة {current_value} تجاوزت الحد {severity.value}",
                current_value=current_value,
                threshold=thresholds[severity.value],
                timestamp=data_point.timestamp,
                trend=self.analyze_trend(data_point.metric),
                recommendations=self.generate_recommendations(data_point.metric, current_value)
            )
            
            self.handle_alert(alert)
    
    def analyze_trend(self, metric: PerformanceMetric) -> str:
        """تحليل الاتجاه"""
        if len(self.data_buffer[metric]) < 10:
            return "unknown"
        
        # أخذ آخر 10 نقاط
        recent_data = [dp.value for dp in list(self.data_buffer[metric])[-10:]]
        
        # حساب الاتجاه باستخدام الانحدار الخطي
        x = list(range(len(recent_data)))
        slope, _, r_value, p_value, _ = stats.linregress(x, recent_data)
        
        if abs(slope) < 0.1:  # تغيير طفيف
            return "stable"
        elif slope > 0:
            return "increasing"
        else:
            return "decreasing"
    
    def generate_recommendations(self, metric: PerformanceMetric, current_value: float) -> List[str]:
        """توليد توصيات التحسين"""
        recommendations = []
        
        if metric == PerformanceMetric.CPU_USAGE:
            if current_value > 80:
                recommendations.extend([
                    "تحسين خوارزميات التطبيق لتقليل استهلاك CPU",
                    "إضافة horizontal scaling",
                    "استخدام caching للتقليل من الحسابات المتكررة"
                ])
        
        elif metric == PerformanceMetric.MEMORY_USAGE:
            if current_value > 80:
                recommendations.extend([
                    "تحسين إدارة الذاكرة في التطبيق",
                    "إضافة garbage collection tuning",
                    "تقليل حجم البيانات المحتفظ بها في الذاكرة"
                ])
        
        elif metric == PerformanceMetric.RESPONSE_TIME:
            if current_value > 5:
                recommendations.extend([
                    "تحسين استعلامات قاعدة البيانات",
                    "إضافة database indexing",
                    "استخدام CDN للملفات الثابتة",
                    "تحسين caching strategy"
                ])
        
        elif metric == PerformanceMetric.ERROR_RATE:
            if current_value > 5:
                recommendations.extend([
                    "فحص logs التطبيق للأخطاء",
                    "تحسين error handling",
                    "إضافة retries للـ API calls",
                    "فحص dependencies والتحديثات"
                ])
        
        return recommendations
    
    def handle_alert(self, alert: PerformanceAlert):
        """معالجة التنبيه"""
        self.logger.warning(f"تنبيه أداء: {alert.message}")
        
        # حفظ التنبيه
        self.save_alert(alert)
        
        # إرسال إشعار (يمكن ربطه بنظام التنبيهات)
        self.send_alert_notification(alert)
    
    def save_alert(self, alert: PerformanceAlert):
        """حفظ التنبيه"""
        # يمكن حفظه في قاعدة بيانات أو Redis
        alert_data = asdict(alert)
        # مثال: redis_client.set(f"alert:{alert.id}", json.dumps(alert_data))
    
    def send_alert_notification(self, alert: PerformanceAlert):
        """إرسال إشعار التنبيه"""
        # يمكن ربطه بنظام التنبيهات الموجود
        # مثل إرسال email، Slack، Discord، etc.
        pass
    
    def detect_anomalies(self) -> List[PerformanceAlert]:
        """كشف الشذوذ باستخدام نماذج التعلم الآلي"""
        anomalies = []
        
        for metric, data_points in self.data_buffer.items():
            if len(data_points) < 50:  # بيانات كافية للتحليل
                continue
            
            # تحضير البيانات
            values = [dp.value for dp in data_points[-100:]]  # آخر 100 نقطة
            
            try:
                # كشف الشذوذ
                anomalies_detected = self.ml_models['anomaly_detector'].fit_predict(
                    np.array(values).reshape(-1, 1)
                )
                
                # تحليل النتائج
                for i, is_anomaly in enumerate(anomalies_detected):
                    if is_anomaly == -1:  # شذوذ
                        recent_value = values[i]
                        trend = self.analyze_trend(metric)
                        
                        alert = PerformanceAlert(
                            id=f"anomaly_{int(time.time())}_{metric.value}_{i}",
                            metric=metric,
                            severity=AlertThreshold.HIGH,
                            message=f"تم اكتشاف شذوذ في {metric.value}: {recent_value}",
                            current_value=recent_value,
                            threshold=0,  # غير محدد للشذوذ
                            timestamp=data_points[-100 + i].timestamp,
                            trend=trend,
                            recommendations=self.generate_anomaly_recommendations(metric, recent_value)
                        )
                        
                        anomalies.append(alert)
            
            except Exception as e:
                self.logger.error(f"خطأ في كشف الشذوذ لـ {metric}: {e}")
        
        return anomalies
    
    def generate_anomaly_recommendations(self, metric: PerformanceMetric, value: float) -> List[str]:
        """توليد توصيات للشذوذ"""
        recommendations = [
            "تحقق من logs النظام للتفاصيل",
            "فحص usage patterns في آخر 24 ساعة",
            "راجع recent deployments أو changes",
            "فحص external dependencies"
        ]
        
        if metric in [PerformanceMetric.CPU_USAGE, PerformanceMetric.MEMORY_USAGE]:
            recommendations.append("تحقق من running processes و memory leaks")
        
        if metric == PerformanceMetric.ERROR_RATE:
            recommendations.append("فحص application errors والـ stack traces")
        
        return recommendations
    
    def predict_future_performance(self) -> Dict[str, Any]:
        """توقع الأداء المستقبلي"""
        predictions = {}
        
        for metric, data_points in self.data_buffer.items():
            if len(data_points) < 20:
                continue
            
            try:
                # تحضير البيانات
                values = [dp.value for dp in data_points[-50:]]  # آخر 50 نقطة
                timestamps = [dp.timestamp for dp in data_points[-50:]]
                
                # تحويل التواريخ إلى أرقام
                time_numeric = [(t - timestamps[0]).total_seconds() for t in timestamps]
                
                # توقع الاتجاه
                slope, intercept, r_value, p_value, std_err = stats.linregress(time_numeric, values)
                
                # توقع القيمة المستقبلية
                future_time = time_numeric[-1] + 3600  # ساعة واحدة في المستقبل
                predicted_value = slope * future_time + intercept
                
                # حساب الثقة
                confidence = r_value ** 2
                
                # تحديد الاتجاه المتوقع
                if abs(slope) < 0.001:
                    trend = "stable"
                elif slope > 0:
                    trend = "increasing"
                else:
                    trend = "decreasing"
                
                predictions[metric.value] = {
                    "predicted_value": predicted_value,
                    "trend": trend,
                    "confidence": confidence,
                    "slope": slope,
                    "current_value": values[-1],
                    "change_percentage": ((predicted_value - values[-1]) / values[-1]) * 100
                }
            
            except Exception as e:
                self.logger.error(f"خطأ في توقع {metric}: {e}")
        
        return predictions
    
    def generate_optimization_recommendations(self) -> List[OptimizationRecommendation]:
        """توليد توصيات تحسين شاملة"""
        recommendations = []
        
        # تحليل شامل للبيانات
        current_stats = self.get_current_performance_stats()
        trend_analysis = self.analyze_all_trends()
        predictions = self.predict_future_performance()
        
        # توصيات على أساس CPU
        cpu_usage = current_stats.get('cpu_usage', {}).get('current', 0)
        if cpu_usage > 70:
            recommendations.append(OptimizationRecommendation(
                id="opt_cpu_001",
                category="performance",
                title="تحسين استخدام CPU",
                description="استخدام CPU أعلى من 70%، يوصى بتحسين الأداء",
                impact="high",
                effort="medium",
                expected_improvement=25.0,
                implementation_steps=[
                    "تحليل bottlenecks في الكود",
                    "تحسين خوارزميات heavy computation",
                    "استخدام async/await للعمليات الطويلة",
                    "إضافة caching للتقليل من الحسابات المتكررة"
                ],
                automation_possible=True
            ))
        
        # توصيات على أساس الذاكرة
        memory_usage = current_stats.get('memory_usage', {}).get('current', 0)
        if memory_usage > 75:
            recommendations.append(OptimizationRecommendation(
                id="opt_memory_001",
                category="performance",
                title="تحسين استخدام الذاكرة",
                description="استخدام الذاكرة أعلى من 75%، يوصى بتحسين إدارة الذاكرة",
                impact="high",
                effort="medium",
                expected_improvement=30.0,
                implementation_steps=[
                    "تحليل memory leaks",
                    "تحسين data structures",
                    "إضافة garbage collection tuning",
                    "تقليل حجم objects المحتفظ بها في الذاكرة"
                ],
                automation_possible=True
            ))
        
        # توصيات على أساس استجابة التطبيق
        response_times = trend_analysis.get('response_time', {})
        if response_times.get('average', 0) > 2.0:
            recommendations.append(OptimizationRecommendation(
                id="opt_response_001",
                category="user_experience",
                title="تحسين زمن استجابة التطبيق",
                description="متوسط زمن الاستجابة أعلى من 2 ثانية، يضر بتجربة المستخدم",
                impact="high",
                effort="high",
                expected_improvement=40.0,
                implementation_steps=[
                    "تحسين database queries وإضافة indexes",
                    "استخدام connection pooling",
                    "إضافة Redis caching",
                    "تحسين static assets مع CDN",
                    "تحسين frontend loading strategy"
                ],
                automation_possible=False
            ))
        
        # توصيات على أساس معدل الخطأ
        error_rate = current_stats.get('error_rate', {}).get('current', 0)
        if error_rate > 3:
            recommendations.append(OptimizationRecommendation(
                id="opt_error_001",
                category="reliability",
                title="تحسين معدل الخطأ",
                description=f"معدل الخطأ {error_rate}% أعلى من المقبول، يؤثر على موثوقية التطبيق",
                impact="medium",
                effort="high",
                expected_improvement=80.0,
                implementation_steps=[
                    "تحليل application logs للأخطاء المتكررة",
                    "تحسين error handling وretry logic",
                    "إضافة monitoring للexternal dependencies",
                    "تحسين input validation",
                    "إضافة fallback mechanisms"
                ],
                automation_possible=False
            ))
        
        # توصيات预测ية
        if 'cpu_usage' in predictions:
            cpu_prediction = predictions['cpu_usage']
            if cpu_prediction['trend'] == 'increasing' and cpu_prediction['change_percentage'] > 20:
                recommendations.append(OptimizationRecommendation(
                    id="opt_predictive_001",
                    category="scalability",
                    title="استعداد للتوسع المستقبلي",
                    description=f"متوقع زيادة CPU بنسبة {cpu_prediction['change_percentage']:.1f}% في الساعة القادمة",
                    impact="high",
                    effort="high",
                    expected_improvement=100.0,
                    implementation_steps=[
                        "إعداد auto-scaling",
                        "تحسين load balancing",
                        "تحضير additional server resources",
                        "تحسين application architecture للتوسع"
                    ],
                    automation_possible=True
                ))
        
        return recommendations
    
    def get_current_performance_stats(self) -> Dict[str, Any]:
        """الحصول على إحصائيات الأداء الحالية"""
        stats = {}
        
        for metric, data_points in self.data_buffer.items():
            if not data_points:
                continue
            
            values = [dp.value for dp in data_points[-100:]]  # آخر 100 قيمة
            
            stats[metric.value] = {
                'current': values[-1] if values else 0,
                'average': np.mean(values) if values else 0,
                'median': np.median(values) if values else 0,
                'std_dev': np.std(values) if values else 0,
                'min': np.min(values) if values else 0,
                'max': np.max(values) if values else 0,
                'percentile_95': np.percentile(values, 95) if values else 0,
                'percentile_99': np.percentile(values, 99) if values else 0
            }
        
        return stats
    
    def analyze_all_trends(self) -> Dict[str, Any]:
        """تحليل جميع الاتجاهات"""
        trends = {}
        
        for metric in self.data_buffer.keys():
            trend_data = self.analyze_trend(metric)
            
            # حساب معدل التغيير
            data_points = list(self.data_buffer[metric])
            if len(data_points) >= 10:
                recent_values = [dp.value for dp in data_points[-10:]]
                older_values = [dp.value for dp in data_points[-20:-10]]
                
                if older_values:
                    recent_avg = np.mean(recent_values)
                    older_avg = np.mean(older_values)
                    change_rate = ((recent_avg - older_avg) / older_avg) * 100 if older_avg > 0 else 0
                else:
                    change_rate = 0
            else:
                change_rate = 0
            
            trends[metric.value] = {
                'trend': trend_data,
                'change_rate': change_rate,
                'data_points': len(data_points)
            }
        
        return trends
    
    def generate_performance_report(self) -> Dict[str, Any]:
        """إنتاج تقرير أداء شامل"""
        report = {
            'timestamp': datetime.now().isoformat(),
            'summary': {},
            'current_metrics': self.get_current_performance_stats(),
            'trends': self.analyze_all_trends(),
            'predictions': self.predict_future_performance(),
            'anomalies': [asdict(alert) for alert in self.detect_anomalies()],
            'recommendations': [asdict(rec) for rec in self.generate_optimization_recommendations()],
            'health_score': self.calculate_health_score()
        }
        
        # حساب الملخص
        total_metrics = len(report['current_metrics'])
        healthy_metrics = 0
        
        for metric_name, stats in report['current_metrics'].items():
            metric_enum = PerformanceMetric(metric_name)
            if metric_enum in self.alert_thresholds:
                thresholds = self.alert_thresholds[metric_enum]
                current_value = stats['current']
                
                if current_value < thresholds['low']:
                    healthy_metrics += 1
        
        report['summary'] = {
            'total_metrics': total_metrics,
            'healthy_metrics': healthy_metrics,
            'health_percentage': (healthy_metrics / total_metrics * 100) if total_metrics > 0 else 100,
            'critical_issues': len([rec for rec in report['recommendations'] if rec['impact'] == 'high']),
            'needs_attention': len([rec for rec in report['recommendations']])
        }
        
        return report
    
    def calculate_health_score(self) -> float:
        """حساب درجة الصحة العامة"""
        score = 100.0
        
        for metric_name, stats in self.get_current_performance_stats().items():
            try:
                metric_enum = PerformanceMetric(metric_name)
                current_value = stats['current']
                thresholds = self.alert_thresholds.get(metric_enum, {})
                
                if not thresholds:
                    continue
                
                # حساب الخصم بناءً على الانحراف عن الحدود
                if current_value >= thresholds['critical']:
                    score -= 30
                elif current_value >= thresholds['high']:
                    score -= 20
                elif current_value >= thresholds['medium']:
                    score -= 10
                elif current_value >= thresholds['low']:
                    score -= 5
            
            except Exception as e:
                self.logger.warning(f"خطأ في حساب درجة الصحة لـ {metric_name}: {e}")
        
        return max(0.0, score)
    
    def export_metrics_prometheus(self) -> str:
        """تصدير المقاييس بصيغة Prometheus"""
        metrics_text = ""
        timestamp = datetime.now().timestamp()
        
        for metric_name, stats in self.get_current_performance_stats().items():
            if stats['current'] is not None:
                metrics_text += f"{metric_name}_current {stats['current']} {timestamp}\n"
                metrics_text += f"{metric_name}_average {stats['average']} {timestamp}\n"
                metrics_text += f"{metric_name}_percentile_95 {stats['percentile_95']} {timestamp}\n"
        
        return metrics_text
    
    def visualize_performance_data(self, save_path: str = None):
        """تصور بيانات الأداء"""
        if not save_path:
            save_path = f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        
        # تحضير البيانات
        data = {}
        for metric, data_points in self.data_buffer.items():
            if len(data_points) >= 10:
                data[metric.value] = {
                    'timestamps': [dp.timestamp for dp in data_points[-100:]],
                    'values': [dp.value for dp in data_points[-100:]]
                }
        
        if not data:
            print("لا توجد بيانات كافية للتصور")
            return
        
        # إنشاء المخططات
        fig, axes = plt.subplots(len(data), 1, figsize=(12, 4 * len(data)))
        if len(data) == 1:
            axes = [axes]
        
        for i, (metric_name, metric_data) in enumerate(data.items()):
            ax = axes[i]
            timestamps = metric_data['timestamps']
            values = metric_data['values']
            
            ax.plot(timestamps, values, marker='o', markersize=3, alpha=0.7)
            ax.set_title(f'{metric_name} - آخر 100 نقطة')
            ax.set_ylabel('القيمة')
            ax.grid(True, alpha=0.3)
            
            # تدوير التواريخ للأفضل
            plt.setp(ax.xaxis.get_majorticklabels(), rotation=45)
        
        plt.tight_layout()
        plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.close()
        
        print(f"تم حفظ التقرير البصري في: {save_path}")
    
    async def start_monitoring(self):
        """بدء المراقبة المستمرة"""
        self.logger.info("بدء مراقبة الأداء...")
        
        while True:
            try:
                # جمع البيانات
                data_points = self.collect_performance_data()
                
                # إضافة البيانات
                for data_point in data_points:
                    self.add_data_point(data_point)
                
                # انتظار فترة التجميع
                await asyncio.sleep(self.analysis_interval)
                
            except KeyboardInterrupt:
                self.logger.info("تم إيقاف مراقبة الأداء")
                break
            except Exception as e:
                self.logger.error(f"خطأ في مراقبة الأداء: {e}")
                await asyncio.sleep(10)  # انتظار 10 ثوان قبل المحاولة مرة أخرى


class AdvancedPerformanceMonitor:
    """مراقب الأداء المتقدم الرئيسي"""
    
    def __init__(self, config_path: str = None):
        self.config = self.load_config(config_path)
        self.analyzer = PerformanceAnalyzer(self.config.get('analyzer', {}))
        self.data_collector = DataCollector(self.config.get('collector', {}))
        self.alert_manager = AlertManager(self.config.get('alerts', {}))
        self.optimization_engine = OptimizationEngine(self.config.get('optimization', {}))
        
        self.logger = self.setup_logging()
        
    def load_config(self, config_path: str) -> Dict[str, Any]:
        """تحميل ملف الإعدادات"""
        if config_path and os.path.exists(config_path):
            with open(config_path, 'r', encoding='utf-8') as f:
                return yaml.safe_load(f)
        return self.get_default_config()
    
    def get_default_config(self) -> Dict[str, Any]:
        """الإعدادات الافتراضية"""
        return {
            "analyzer": {
                "analysis_interval": 30,
                "prediction_window": 3600
            },
            "collector": {
                "data_sources": {
                    "application": {
                        "enabled": True,
                        "endpoints": ["/health", "/metrics", "/status"]
                    },
                    "system": {
                        "enabled": True,
                        "metrics": ["cpu", "memory", "disk", "network"]
                    },
                    "database": {
                        "enabled": True,
                        "connections": ["postgresql://localhost:5432"]
                    },
                    "cache": {
                        "enabled": True,
                        "redis_url": "redis://localhost:6379"
                    }
                }
            },
            "alerts": {
                "enabled": True,
                "channels": ["email", "slack"],
                "thresholds": {
                    "response_time": 5.0,
                    "error_rate": 5.0,
                    "cpu_usage": 80.0,
                    "memory_usage": 85.0
                }
            },
            "optimization": {
                "auto_optimization": False,
                "recommendations_enabled": True,
                "machine_learning": {
                    "anomaly_detection": True,
                    "trend_prediction": True
                }
            }
        }
    
    def setup_logging(self) -> logging.Logger:
        """إعداد نظام السجلات"""
        logger = logging.getLogger('AdvancedPerformanceMonitor')
        logger.setLevel(logging.INFO)
        
        if not logger.handlers:
            handler = logging.StreamHandler()
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)
        
        return logger
    
    async def run_comprehensive_analysis(self) -> Dict[str, Any]:
        """تشغيل تحليل شامل للأداء"""
        self.logger.info("بدء التحليل الشامل للأداء...")
        
        # جمع البيانات
        data_points = await self.data_collector.collect_all_metrics()
        
        # إضافة البيانات للمحلل
        for data_point in data_points:
            self.analyzer.add_data_point(data_point)
        
        # تحليل الأداء
        report = self.analyzer.generate_performance_report()
        
        # كشف الشذوذ
        anomalies = self.analyzer.detect_anomalies()
        report['detected_anomalies'] = anomalies
        
        # التوقعات
        predictions = self.analyzer.predict_future_performance()
        report['performance_predictions'] = predictions
        
        # التوصيات
        recommendations = self.analyzer.generate_optimization_recommendations()
        report['optimization_recommendations'] = recommendations
        
        # التحسين التلقائي (إذا كان مفعلاً)
        if self.config.get('optimization', {}).get('auto_optimization'):
            await self.apply_automatic_optimizations(recommendations)
        
        self.logger.info(f"انتهاء التحليل - درجة الصحة: {report['health_score']:.1f}")
        
        return report
    
    async def apply_automatic_optimizations(self, recommendations: List[OptimizationRecommendation]):
        """تطبيق التحسينات التلقائية"""
        self.logger.info("بدء تطبيق التحسينات التلقائية...")
        
        for recommendation in recommendations:
            if not recommendation.automation_possible:
                continue
            
            try:
                self.logger.info(f"تطبيق تحسين: {recommendation.title}")
                
                # تنفيذ التوصية بناءً على الفئة
                if recommendation.category == "performance":
                    await self.apply_performance_optimization(recommendation)
                elif recommendation.category == "scalability":
                    await self.apply_scaling_optimization(recommendation)
                elif recommendation.category == "reliability":
                    await self.apply_reliability_optimization(recommendation)
                
                self.logger.info(f"تم تطبيق التوصية: {recommendation.title}")
                
            except Exception as e:
                self.logger.error(f"فشل في تطبيق التوصية {recommendation.title}: {e}")
    
    async def apply_performance_optimization(self, recommendation: OptimizationRecommendation):
        """تطبيق تحسينات الأداء"""
        if recommendation.id == "opt_cpu_001":
            # تحسين CPU
            await self.optimize_cpu_usage()
        elif recommendation.id == "opt_memory_001":
            # تحسين الذاكرة
            await self.optimize_memory_usage()
    
    async def apply_scaling_optimization(self, recommendation: OptimizationRecommendation):
        """تطبيق تحسينات التوسع"""
        if recommendation.id == "opt_predictive_001":
            # تحضير للتوسع
            await self.prepare_for_scaling()
    
    async def apply_reliability_optimization(self, recommendation: OptimizationRecommendation):
        """تطبيق تحسينات الموثوقية"""
        if recommendation.id == "opt_error_001":
            # تحسين معدل الخطأ
            await self.improve_error_handling()
    
    async def optimize_cpu_usage(self):
        """تحسين استخدام CPU"""
        # تنفيذ تحسينات CPU
        # مثل تحسين garbage collection، تحسين threads، etc.
        pass
    
    async def optimize_memory_usage(self):
        """تحسين استخدام الذاكرة"""
        # تنفيذ تحسينات الذاكرة
        pass
    
    async def prepare_for_scaling(self):
        """تحضير للتوسع"""
        # تنفيذ إجراءات تحضير للتوسع
        pass
    
    async def improve_error_handling(self):
        """تحسين معالجة الأخطاء"""
        # تنفيذ تحسينات معالجة الأخطاء
        pass
    
    def start_monitoring_dashboard(self):
        """بدء لوحة المراقبة"""
        self.logger.info("بدء لوحة مراقبة الأداء...")
        
        # يمكن تنفيذ dashboard باستخدام Streamlit أو React
        # أو تصدير البيانات للـ Grafana
        
        try:
            import streamlit as st
            
            # إعداد صفحة Streamlit
            st.set_page_config(page_title="مراقب الأداء المتقدم", layout="wide")
            st.title("📊 مراقب الأداء المتقدم")
            
            # معلومات عامة
            col1, col2, col3, col4 = st.columns(4)
            
            # تحديث البيانات
            report = self.analyzer.generate_performance_report()
            
            # عرض المقاييس
            with col1:
                st.metric("درجة الصحة", f"{report['health_score']:.1f}%")
            
            with col2:
                st.metric("استخدام CPU", f"{report['current_metrics'].get('cpu_usage', {}).get('current', 0):.1f}%")
            
            with col3:
                st.metric("استخدام الذاكرة", f"{report['current_metrics'].get('memory_usage', {}).get('current', 0):.1f}%")
            
            with col4:
                st.metric("زمن الاستجابة", f"{report['current_metrics'].get('response_time', {}).get('current', 0):.2f}s")
            
            # التوصيات
            st.subheader("🎯 التوصيات")
            for rec in report['optimization_recommendations'][:5]:
                with st.expander(f"{rec['title']} (تأثير: {rec['impact']})"):
                    st.write(rec['description'])
                    st.write(f"التحسين المتوقع: {rec['expected_improvement']:.1f}%")
            
            # الشذوذ المكتشف
            if report['anomalies']:
                st.subheader("⚠️ الشذوذ المكتشف")
                for anomaly in report['anomalies']:
                    st.warning(f"{anomaly['metric']}: {anomaly['message']}")
            
            # التنبيه للتحديث التلقائي
            if st.button("تحديث البيانات"):
                st.rerun()
            
            st.info("سيتم تحديث البيانات تلقائياً كل 30 ثانية")
            
        except ImportError:
            st.warning("Streamlit غير متوفر. سيتم تصدير التقرير بدلاً من ذلك.")
            self.export_report_to_json()
    
    def export_report_to_json(self, filepath: str = None):
        """تصدير التقرير إلى JSON"""
        if not filepath:
            filepath = f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        report = self.analyzer.generate_performance_report()
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False, default=str)
        
        self.logger.info(f"تم تصدير التقرير إلى: {filepath}")


class DataCollector:
    """جامع البيانات"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('DataCollector')
    
    async def collect_all_metrics(self) -> List[PerformanceDataPoint]:
        """جمع جميع المقاييس"""
        data_points = []
        
        # جمع مقاييس النظام
        if self.config.get('data_sources', {}).get('system', {}).get('enabled'):
            system_metrics = await self.collect_system_metrics()
            data_points.extend(system_metrics)
        
        # جمع مقاييس التطبيق
        if self.config.get('data_sources', {}).get('application', {}).get('enabled'):
            app_metrics = await self.collect_application_metrics()
            data_points.extend(app_metrics)
        
        # جمع مقاييس قاعدة البيانات
        if self.config.get('data_sources', {}).get('database', {}).get('enabled'):
            db_metrics = await self.collect_database_metrics()
            data_points.extend(db_metrics)
        
        # جمع مقاييس الذاكرة المؤقتة
        if self.config.get('data_sources', {}).get('cache', {}).get('enabled'):
            cache_metrics = await self.collect_cache_metrics()
            data_points.extend(cache_metrics)
        
        return data_points
    
    async def collect_system_metrics(self) -> List[PerformanceDataPoint]:
        """جمع مقاييس النظام"""
        data_points = []
        timestamp = datetime.now()
        
        try:
            # CPU
            cpu_percent = psutil.cpu_percent(interval=1)
            data_points.append(PerformanceDataPoint(
                timestamp=timestamp,
                metric=PerformanceMetric.CPU_USAGE,
                value=cpu_percent,
                unit="percent",
                labels={}
            ))
            
            # الذاكرة
            memory = psutil.virtual_memory()
            data_points.append(PerformanceDataPoint(
                timestamp=timestamp,
                metric=PerformanceMetric.MEMORY_USAGE,
                value=memory.percent,
                unit="percent",
                labels={}
            ))
            
            # القرص
            disk_io = psutil.disk_io_counters()
            if disk_io:
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.DISK_IO,
                    value=disk_io.read_bytes + disk_io.write_bytes,
                    unit="bytes",
                    labels={}
                ))
            
            # الشبكة
            network_io = psutil.net_io_counters()
            if network_io:
                data_points.append(PerformanceDataPoint(
                    timestamp=timestamp,
                    metric=PerformanceMetric.NETWORK_IO,
                    value=network_io.bytes_sent + network_io.bytes_recv,
                    unit="bytes",
                    labels={}
                ))
        
        except Exception as e:
            self.logger.error(f"خطأ في جمع مقاييس النظام: {e}")
        
        return data_points
    
    async def collect_application_metrics(self) -> List[PerformanceDataPoint]:
        """جمع مقاييس التطبيق"""
        # يمكن تنفيذ جمع مقاييس التطبيق من endpoints مختلفة
        return []
    
    async def collect_database_metrics(self) -> List[PerformanceDataPoint]:
        """جمع مقاييس قاعدة البيانات"""
        # يمكن تنفيذ جمع مقاييس قاعدة البيانات من الاتصال
        return []
    
    async def collect_cache_metrics(self) -> List[PerformanceDataPoint]:
        """جمع مقاييس الذاكرة المؤقتة"""
        # يمكن تنفيذ جمع مقاييس Redis أو Memcached
        return []


class AlertManager:
    """مدير التنبيهات"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('AlertManager')
    
    def send_alert(self, alert: PerformanceAlert):
        """إرسال تنبيه"""
        self.logger.warning(f"تنبيه: {alert.message}")
        # يمكن ربطه بنظام التنبيهات الموجود


class OptimizationEngine:
    """محرك التحسين"""
    
    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger('OptimizationEngine')
    
    async def apply_optimization(self, recommendation: OptimizationRecommendation):
        """تطبيق تحسين"""
        self.logger.info(f"تطبيق تحسين: {recommendation.title}")
        # تنفيذ التحسين


# دالة مساعدة لتشغيل النظام
async def main():
    """الدالة الرئيسية"""
    print("🚀 بدء نظام مراقبة الأداء المتقدم...")
    
    # إنشاء مراقب الأداء
    monitor = AdvancedPerformanceMonitor()
    
    try:
        # تشغيل تحليل شامل
        print("\n📊 تشغيل التحليل الشامل...")
        report = await monitor.run_comprehensive_analysis()
        
        print(f"\n=== تقرير الأداء ===")
        print(f"الوقت: {report['timestamp']}")
        print(f"درجة الصحة: {report['health_score']:.1f}%")
        print(f"إجمالي المقاييس: {report['summary']['total_metrics']}")
        print(f"المقاييس الصحية: {report['summary']['healthy_metrics']}")
        print(f"التحسينات المطلوبة: {report['summary']['needs_attention']}")
        
        # عرض التوصيات
        if report['optimization_recommendations']:
            print(f"\n🎯 التوصيات ({len(report['optimization_recommendations'])}):")
            for rec in report['optimization_recommendations'][:3]:
                print(f"- {rec['title']} (تأثير: {rec['impact']}, تحسين متوقع: {rec['expected_improvement']:.1f}%)")
        
        # حفظ التقرير
        monitor.export_report_to_json()
        
        # إنشاء تصور
        monitor.analyzer.visualize_performance_data()
        
        # بدء مراقبة dashboard
        print(f"\n🌐 بدء dashboard المراقبة...")
        print("اضغط Ctrl+C للإيقاف")
        
        # تشغيل dashboard
        monitor.start_monitoring_dashboard()
        
    except KeyboardInterrupt:
        print(f"\n✅ تم إيقاف النظام بواسطة المستخدم")
    except Exception as e:
        print(f"❌ خطأ في تشغيل النظام: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # تشغيل النظام
    asyncio.run(main())
