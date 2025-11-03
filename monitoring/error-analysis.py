"""
Advanced Error Analysis System
 * نظام تحليل الأخطاء المتقدم

يحلل الأخطاء ويستخرج الأنماط والاتجاهات والرؤى القيمة
"""

import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Tuple, Union
from pathlib import Path
from collections import defaultdict, Counter
from dataclasses import dataclass, asdict
import re
import statistics
import warnings
from sklearn.cluster import KMeans
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import LatentDirichletAllocation
import networkx as nx

from .error_capture import ErrorEvent, error_capture

@dataclass
class ErrorPattern:
    """نمط خطأ"""
    id: str
    name: str
    pattern_type: str  # frequency, time-based, correlation, clustering
    description: str
    severity: str
    frequency: int
    confidence: float
    related_errors: List[str]
    insights: List[str]
    recommendations: List[str]
    detected_at: datetime
    
@dataclass
class ErrorTrend:
    """اتجاه خطأ"""
    error_type: str
    trend_direction: str  # increasing, decreasing, stable
    trend_strength: float
    period: str  # hourly, daily, weekly, monthly
    change_rate: float
    projected_peak: Optional[datetime]
    confidence: float
    
@dataclass
class ErrorCorrelation:
    """ترابط الأخطاء"""
    error1: str
    error2: str
    correlation_type: str  # temporal, causal, shared_cause
    correlation_strength: float
    time_lag: Optional[int]  # in minutes
    confidence: float
    description: str

class ErrorAnalysis:
    """محلل الأخطاء الرئيسي"""
    
    def __init__(self, config: Dict[str, Any] = None):
        self.config = config or self._get_default_config()
        self.logger = logging.getLogger('error_analysis')
        
        # البيانات
        self.errors_data = []
        self.patterns = []
        self.trends = []
        self.correlations = []
        
        # إعدادات التحليل
        self.analysis_config = {
            'min_error_frequency': 3,
            'correlation_threshold': 0.3,
            'trend_window_days': 7,
            'clustering_min_samples': 5,
            'text_analysis_min_length': 10
        }
        
        # إعداد نماذج التحليل
        self._setup_analysis_models()
        
    def _get_default_config(self) -> Dict[str, Any]:
        """الإعدادات الافتراضية"""
        return {
            'analysis_types': {
                'frequency_analysis': True,
                'pattern_detection': True,
                'trend_analysis': True,
                'correlation_analysis': True,
                'anomaly_detection': True,
                'text_analysis': True,
                'time_series_analysis': True,
                'root_cause_analysis': True
            },
            'thresholds': {
                'anomaly_threshold': 2.0,  # standard deviations
                'pattern_min_frequency': 3,
                'correlation_min_correlation': 0.3,
                'trend_significance': 0.05
            },
            'windows': {
                'trend_analysis': 24,  # hours
                'anomaly_detection': 24,  # hours
                'correlation_analysis': 168  # hours (week)
            },
            'models': {
                'clustering': {
                    'algorithm': 'kmeans',
                    'n_clusters': 5,
                    'max_iter': 300
                },
                'text_analysis': {
                    'max_features': 1000,
                    'min_df': 2,
                    'max_df': 0.8
                },
                'time_series': {
                    'seasonality': True,
                    'trend': True,
                    'confidence_level': 0.95
                }
            }
        }
    
    def _setup_analysis_models(self):
        """إعداد نماذج التحليل"""
        try:
            # نموذج TF-IDF للنص
            self.tfidf_vectorizer = TfidfVectorizer(
                max_features=self.config['models']['text_analysis']['max_features'],
                min_df=self.config['models']['text_analysis']['min_df'],
                max_df=self.config['models']['text_analysis']['max_df'],
                stop_words='english'
            )
            
            # نموذج Clustering
            self.clustering_model = KMeans(
                n_clusters=self.config['models']['clustering']['n_clusters'],
                max_iter=self.config['models']['clustering']['max_iter'],
                random_state=42
            )
            
            # نموذج LDA للموضوعات
            self.lda_model = LatentDirichletAllocation(
                n_components=10,
                random_state=42,
                max_iter=100
            )
            
            self.logger.info("تم إعداد نماذج التحليل بنجاح")
            
        except Exception as e:
            self.logger.warning(f"فشل في إعداد بعض نماذج التحليل: {e}")
    
    def load_errors(self, errors_data: List[Dict[str, Any]]) -> 'ErrorAnalysis':
        """تحميل بيانات الأخطاء"""
        self.errors_data = []
        
        for error_dict in errors_data:
            try:
                error = self._dict_to_error_event(error_dict)
                if error:
                    self.errors_data.append(error)
            except Exception as e:
                self.logger.warning(f"خطأ في تحويل بيانات الخطأ: {e}")
        
        self.logger.info(f"تم تحميل {len(self.errors_data)} خطأ للتحليل")
        return self
    
    def _dict_to_error_event(self, error_dict: Dict[str, Any]) -> Optional[ErrorEvent]:
        """تحويل dictionary إلى ErrorEvent"""
        try:
            # تحويل timestamps
            for timestamp_field in ['timestamp', 'first_occurrence', 'last_occurrence']:
                if timestamp_field in error_dict and isinstance(error_dict[timestamp_field], str):
                    error_dict[timestamp_field] = datetime.fromisoformat(error_dict[timestamp_field])
            
            # إنشاء ErrorEvent
            return ErrorEvent(**error_dict)
        except Exception as e:
            self.logger.warning(f"خطأ في إنشاء ErrorEvent: {e}")
            return None
    
    def analyze_errors(self) -> Dict[str, Any]:
        """تحليل شامل للأخطاء"""
        if not self.errors_data:
            return {'error': 'لا توجد بيانات أخطاء للتحليل'}
        
        analysis_results = {}
        
        # تحليل التكرار
        if self.config['analysis_types']['frequency_analysis']:
            analysis_results['frequency'] = self.analyze_frequency()
        
        # كشف الأنماط
        if self.config['analysis_types']['pattern_detection']:
            analysis_results['patterns'] = self.detect_patterns()
        
        # تحليل الاتجاهات
        if self.config['analysis_types']['trend_analysis']:
            analysis_results['trends'] = self.analyze_trends()
        
        # تحليل الترابط
        if self.config['analysis_types']['correlation_analysis']:
            analysis_results['correlations'] = self.analyze_correlations()
        
        # كشف الشذوذات
        if self.config['analysis_types']['anomaly_detection']:
            analysis_results['anomalies'] = self.detect_anomalies()
        
        # تحليل النص
        if self.config['analysis_types']['text_analysis']:
            analysis_results['text_analysis'] = self.analyze_text_patterns()
        
        # تحليل السلاسل الزمنية
        if self.config['analysis_types']['time_series_analysis']:
            analysis_results['time_series'] = self.analyze_time_series()
        
        # تحليل السبب الجذري
        if self.config['analysis_types']['root_cause_analysis']:
            analysis_results['root_causes'] = self.analyze_root_causes()
        
        # ملخص التحليل
        analysis_results['summary'] = self.generate_analysis_summary(analysis_results)
        
        return analysis_results
    
    def analyze_frequency(self) -> Dict[str, Any]:
        """تحليل تكرار الأخطاء"""
        error_counts = Counter()
        severity_counts = Counter()
        source_counts = Counter()
        hourly_counts = defaultdict(int)
        daily_counts = defaultdict(int)
        
        for error in self.errors_data:
            # عد الأنواع
            error_counts[error.error_type] += 1
            severity_counts[error.severity] += 1
            source_counts[error.source] += 1
            
            # عد حسب الوقت
            hour = error.timestamp.hour
            day = error.timestamp.strftime('%Y-%m-%d')
            
            hourly_counts[hour] += 1
            daily_counts[day] += 1
        
        # العثور على الأنماط الزمنية
        peak_hours = sorted(hourly_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        peak_days = sorted(daily_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        
        return {
            'error_type_distribution': dict(error_counts),
            'severity_distribution': dict(severity_counts),
            'source_distribution': dict(source_counts),
            'hourly_distribution': dict(hourly_counts),
            'daily_distribution': dict(daily_counts),
            'peak_hours': peak_hours,
            'peak_days': peak_days,
            'total_errors': len(self.errors_data),
            'unique_error_types': len(error_counts),
            'diversity_index': len(error_counts) / len(self.errors_data) if self.errors_data else 0
        }
    
    def detect_patterns(self) -> List[ErrorPattern]:
        """كشف الأنماط في الأخطاء"""
        patterns = []
        
        # أنماط التكرار
        freq_patterns = self._detect_frequency_patterns()
        patterns.extend(freq_patterns)
        
        # أنماط زمنية
        time_patterns = self._detect_time_patterns()
        patterns.extend(time_patterns)
        
        # أنماط المحتوى
        content_patterns = self._detect_content_patterns()
        patterns.extend(content_patterns)
        
        # أنماط السلوك
        behavior_patterns = self._detect_behavior_patterns()
        patterns.extend(behavior_patterns)
        
        self.patterns = patterns
        return patterns
    
    def _detect_frequency_patterns(self) -> List[ErrorPattern]:
        """كشف أنماط التكرار"""
        patterns = []
        
        # تحليل التكرار لكل نوع خطأ
        error_frequency = Counter(error.error_type for error in self.errors_data)
        
        for error_type, frequency in error_frequency.items():
            if frequency >= self.config['thresholds']['pattern_min_frequency']:
                # تحديد نوع النمط
                if frequency >= 100:
                    pattern_type = "very_high_frequency"
                    severity = "high"
                elif frequency >= 50:
                    pattern_type = "high_frequency"
                    severity = "medium"
                elif frequency >= 10:
                    pattern_type = "moderate_frequency"
                    severity = "low"
                else:
                    pattern_type = "recurring"
                    severity = "low"
                
                pattern = ErrorPattern(
                    id=self._generate_pattern_id(),
                    name=f"نمط تكرار عالي: {error_type}",
                    pattern_type=pattern_type,
                    description=f"خطأ {error_type} يحدث بشكل متكرر ({frequency} مرة)",
                    severity=severity,
                    frequency=frequency,
                    confidence=0.9,
                    related_errors=[error_type],
                    insights=[
                        f"هذا النوع من الأخطاء يتكرر بشكل غير طبيعي",
                        f"متوسط التكرار: {frequency} مرة خلال فترة المراقبة"
                    ],
                    recommendations=[
                        "مراجعة كود الخطأ والتحسين",
                        "إضافة مراقبة إضافية لهذا النوع",
                        "فحص الأسباب الجذرية المحتملة"
                    ],
                    detected_at=datetime.now()
                )
                
                patterns.append(pattern)
        
        return patterns
    
    def _detect_time_patterns(self) -> List[ErrorPattern]:
        """كشف الأنماط الزمنية"""
        patterns = []
        
        # تجميع الأخطاء حسب الساعة
        hourly_errors = defaultdict(list)
        for error in self.errors_data:
            hourly_errors[error.timestamp.hour].append(error)
        
        # كشف ساعات الذروة
        peak_hours = []
        for hour, errors in hourly_errors.items():
            if len(errors) >= len(self.errors_data) * 0.1:  # أكثر من 10% من الإجمالي
                peak_hours.append((hour, len(errors)))
        
        if peak_hours:
            pattern = ErrorPattern(
                id=self._generate_pattern_id(),
                name="نمط زمني - ساعات الذروة",
                pattern_type="temporal",
                description=f"الأخطاء تحدث بكثرة في ساعات: {', '.join(map(str, [h[0] for h in peak_hours]))}",
                severity="medium",
                frequency=sum(count for _, count in peak_hours),
                confidence=0.8,
                related_errors=list(set(error.error_type for hour_data in hourly_errors.values() for error in hour_data)),
                insights=[
                    "هناك نمط زمني واضح لحدوث الأخطاء",
                    "ساعات الذروة قد تشير إلى أوقات الضغط العالي"
                ],
                recommendations=[
                    "مراقبة إضافية خلال ساعات الذروة",
                    "توزيع الأحمال لتجنب الضغط العالي",
                    "جدولة الصيانة خارج ساعات الذروة"
                ],
                detected_at=datetime.now()
            )
            patterns.append(pattern)
        
        return patterns
    
    def _detect_content_patterns(self) -> List[ErrorPattern]:
        """كشف أنماط المحتوى"""
        patterns = []
        
        try:
            # تحليل النصوص باستخدام TF-IDF
            messages = [error.message for error in self.errors_data if len(error.message) >= self.analysis_config['text_analysis_min_length']]
            
            if len(messages) < 2:
                return patterns
            
            # تطبيق TF-IDF
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(messages)
            
            # إيجاد أهم الكلمات
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            feature_scores = np.array(tfidf_matrix.sum(axis=0)).flatten()
            
            # أعلى الكلمات تكراراً
            top_word_indices = feature_scores.argsort()[-10:][::-1]
            top_words = [(feature_names[i], feature_scores[i]) for i in top_word_indices]
            
            # كشف موضوعات شائعة
            lda_matrix = self.lda_model.fit_transform(tfidf_matrix)
            
            for topic_idx, topic in enumerate(self.lda_model.components_):
                top_word_indices = topic.argsort()[-5:][::-1]
                topic_words = [feature_names[i] for i in top_word_indices]
                
                # عدد الأخطاء في هذا الموضوع
                topic_error_count = np.sum(lda_matrix[:, topic_idx] > 0.3)
                
                if topic_error_count >= self.config['thresholds']['pattern_min_frequency']:
                    pattern = ErrorPattern(
                        id=self._generate_pattern_id(),
                        name=f"نمط محتوى - موضوع {topic_idx + 1}",
                        pattern_type="content",
                        description=f"مجموعة من الأخطاء تتشارك كلمات مفتاحية: {', '.join(topic_words)}",
                        severity="medium",
                        frequency=topic_error_count,
                        confidence=0.7,
                        related_errors=[],
                        insights=[
                            f"هناك {topic_error_count} أخطاء تتشارك موضوع مشابه",
                            f"الكلمات المفتاحية الشائعة: {', '.join(topic_words[:3])}"
                        ],
                        recommendations=[
                            "مراجعة الوظائف المرتبطة بهذه الكلمات المفتاحية",
                            "فحص قاعدة البيانات للكود المسؤول",
                            "إضافة اختبارات إضافية للموضوع"
                        ],
                        detected_at=datetime.now()
                    )
                    patterns.append(pattern)
        
        except Exception as e:
            self.logger.warning(f"خطأ في كشف أنماط المحتوى: {e}")
        
        return patterns
    
    def _detect_behavior_patterns(self) -> List[ErrorPattern]:
        """كشف أنماط السلوك"""
        patterns = []
        
        # تحليل انتشار الأخطاء
        error_propagation = self._analyze_error_propagation()
        
        if error_propagation:
            pattern = ErrorPattern(
                id=self._generate_pattern_id(),
                name="نمط انتشار الأخطاء",
                pattern_type="propagation",
                description=f"الأخطاء تنتشر بين المكونات: {' -> '.join(error_propagation['sequence'])}",
                severity="high",
                frequency=error_propagation['frequency'],
                confidence=error_propagation['confidence'],
                related_errors=error_propagation['related_errors'],
                insights=[
                    "الأخطاء لا تحدث بشكل مستقل",
                    "هناك سلسلة منطقية لانتشار الأخطاء"
                ],
                recommendations=[
                    "فحص نقطة انتشار الأخطاء",
                    "تحسين معالجة الأخطاء لمنع الانتشار",
                    "إضافة circuit breaker patterns"
                ],
                detected_at=datetime.now()
            )
            patterns.append(pattern)
        
        return patterns
    
    def _analyze_error_propagation(self) -> Optional[Dict[str, Any]]:
        """تحليل انتشار الأخطاء"""
        # تجميع الأخطاء حسب الوقت
        time_windows = []
        window_size = timedelta(minutes=5)  # نافذة 5 دقائق
        
        sorted_errors = sorted(self.errors_data, key=lambda: lambda e: e.timestamp)
        
        current_window = []
        for error in sorted_errors:
            if not current_window or error.timestamp - current_window[0].timestamp <= window_size:
                current_window.append(error)
            else:
                if len(current_window) >= 3:  # نافذة تحتوي على 3+ أخطاء
                    time_windows.append(current_window)
                current_window = [error]
        
        # تحليل تسلسل الأخطاء في كل نافذة
        propagation_sequences = []
        for window in time_windows:
            error_types = [error.error_type for error in window]
            error_sources = [error.source for error in window]
            
            # البحث عن تسلسل متكرر
            for i in range(len(error_types) - 1):
                sequence = f"{error_types[i]} -> {error_types[i + 1]}"
                propagation_sequences.append(sequence)
        
        # عد التسلسلات
        sequence_counts = Counter(propagation_sequences)
        most_common_sequence = sequence_counts.most_common(1)
        
        if most_common_sequence and most_common_sequence[0][1] >= 3:
            sequence, count = most_common_sequence[0]
            
            return {
                'sequence': sequence.split(' -> '),
                'frequency': count,
                'confidence': min(count / len(time_windows), 1.0),
                'related_errors': list(set(sequence.split(' -> ')))
            }
        
        return None
    
    def analyze_trends(self) -> List[ErrorTrend]:
        """تحليل اتجاهات الأخطاء"""
        trends = []
        
        # تحليل الاتجاه لكل نوع خطأ
        error_types = set(error.error_type for error in self.errors_data)
        
        for error_type in error_types:
            error_data = [error for error in self.errors_data if error.error_type == error_type]
            
            if len(error_data) < 3:
                continue
            
            # تحليل الاتجاه الزمني
            trend = self._analyze_single_trend(error_type, error_data)
            if trend:
                trends.append(trend)
        
        self.trends = trends
        return trends
    
    def _analyze_single_trend(self, error_type: str, error_data: List[ErrorEvent]) -> Optional[ErrorTrend]:
        """تحليل اتجاه خطأ واحد"""
        # تجميع البيانات حسب اليوم
        daily_counts = defaultdict(int)
        for error in error_data:
            day = error.timestamp.strftime('%Y-%m-%d')
            daily_counts[day] += 1
        
        # تحويل إلى تسلسل زمني
        dates = sorted(daily_counts.keys())
        counts = [daily_counts[date] for date in dates]
        
        if len(counts) < 3:
            return None
        
        # حساب الاتجاه باستخدام الانحدار الخطي البسيط
        x = np.arange(len(counts))
        y = np.array(counts)
        
        # حساب معامل الانحدار
        correlation_matrix = np.corrcoef(x, y)
        correlation = correlation_matrix[0, 1]
        
        # تحديد اتجاه
        if abs(correlation) < 0.1:
            trend_direction = "stable"
            trend_strength = 0.0
        elif correlation > 0:
            trend_direction = "increasing"
            trend_strength = correlation
        else:
            trend_direction = "decreasing"
            trend_strength = abs(correlation)
        
        # حساب معدل التغيير
        first_half = statistics.mean(counts[:len(counts)//2]) if len(counts) > 1 else counts[0]
        second_half = statistics.mean(counts[len(counts)//2:]) if len(counts) > 1 else counts[0]
        
        change_rate = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0
        
        # توقع الذروة إذا كان الاتجاه صاعد
        projected_peak = None
        if trend_direction == "increasing" and len(counts) >= 5:
            # توقع بسيط للذروة بناء على الاتجاه
            future_x = len(counts) + 7  # توقع لآخر 7 أيام
            slope = correlation * (np.std(y) / np.std(x)) if np.std(x) > 0 else 0
            predicted_peak_count = max(counts) + (slope * 7)
            
            if predicted_peak_count > max(counts) * 1.5:  # توقع زيادة كبيرة
                projected_peak = datetime.now() + timedelta(days=7)
        
        return ErrorTrend(
            error_type=error_type,
            trend_direction=trend_direction,
            trend_strength=trend_strength,
            period="daily",
            change_rate=change_rate,
            projected_peak=projected_peak,
            confidence=abs(correlation)
        )
    
    def analyze_correlations(self) -> List[ErrorCorrelation]:
        """تحليل ترابط الأخطاء"""
        correlations = []
        
        # تحليل الترابط الزمني
        temporal_correlations = self._analyze_temporal_correlations()
        correlations.extend(temporal_correlations)
        
        # تحليل الترابط السببي
        causal_correlations = self._analyze_causal_correlations()
        correlations.extend(causal_correlations)
        
        self.correlations = correlations
        return correlations
    
    def _analyze_temporal_correlations(self) -> List[ErrorCorrelation]:
        """تحليل الترابط الزمني"""
        correlations = []
        
        # تجميع الأخطاء حسب الساعة
        hourly_groups = defaultdict(list)
        for error in self.errors_data:
            hour_key = error.timestamp.strftime('%Y-%m-%d %H')
            hourly_groups[hour_key].append(error)
        
        # حساب الترابط بين أنواع الأخطاء
        error_types = set(error.error_type for error in self.errors_data)
        error_type_pairs = [(t1, t2) for i, t1 in enumerate(error_types) for t2 in list(error_types)[i+1:]]
        
        for error_type1, error_type2 in error_type_pairs:
            correlation = self._calculate_temporal_correlation(error_type1, error_type2)
            
            if correlation >= self.config['thresholds']['correlation_min_correlation']:
                correlation_obj = ErrorCorrelation(
                    error1=error_type1,
                    error2=error_type2,
                    correlation_type="temporal",
                    correlation_strength=correlation,
                    time_lag=None,  # يمكن حساب التأخير الزمني
                    confidence=min(correlation * 1.2, 1.0),
                    description=f"أخطاء {error_type1} و {error_type2} تحدث معاً بشكل متكرر"
                )
                correlations.append(correlation_obj)
        
        return correlations
    
    def _calculate_temporal_correlation(self, error_type1: str, error_type2: str) -> float:
        """حساب الترابط الزمني"""
        # جمع الأخطاء لكل نوع
        timestamps1 = [error.timestamp for error in self.errors_data if error.error_type == error_type1]
        timestamps2 = [error.timestamp for error in self.errors_data if error.error_type == error_type2]
        
        if not timestamps1 or not timestamps2:
            return 0.0
        
        # حساب النافذة الزمنية (30 دقيقة)
        window_size = timedelta(minutes=30)
        
        # عد مرات التواجد المتقارب
        matches = 0
        total_checks = 0
        
        for t1 in timestamps1:
            for t2 in timestamps2:
                total_checks += 1
                if abs(t1 - t2) <= window_size:
                    matches += 1
        
        # حساب معامل الترابط
        if total_checks > 0:
            correlation = matches / total_checks
            return min(correlation, 1.0)
        
        return 0.0
    
    def _analyze_causal_correlations(self) -> List[ErrorCorrelation]:
        """تحليل الترابط السببي"""
        correlations = []
        
        # البحث عن أنماط سببية
        causal_patterns = {
            'database_error': ['connection_error', 'timeout', 'lock_error'],
            'memory_error': ['out_of_memory', 'memory_leak', 'performance_degradation'],
            'network_error': ['timeout', 'connection_refused', 'dns_error']
        }
        
        for main_error, caused_errors in causal_patterns.items():
            for caused_error in caused_errors:
                if self._has_causal_relationship(main_error, caused_error):
                    correlation = self._calculate_causal_strength(main_error, caused_error)
                    
                    if correlation >= self.config['thresholds']['correlation_min_correlation']:
                        correlation_obj = ErrorCorrelation(
                            error1=main_error,
                            error2=caused_error,
                            correlation_type="causal",
                            correlation_strength=correlation,
                            time_lag=self._calculate_average_lag(main_error, caused_error),
                            confidence=0.8,
                            description=f"خطأ {main_error} يؤدي غالباً إلى {caused_error}"
                        )
                        correlations.append(correlation_obj)
        
        return correlations
    
    def _has_causal_relationship(self, error1: str, error2: str) -> bool:
        """التحقق من وجود علاقة سببية"""
        error1_times = [error.timestamp for error in self.errors_data if error.error_type == error1]
        error2_times = [error.timestamp for error in self.errors_data if error.error_type == error2]
        
        if not error1_times or not error2_times:
            return False
        
        # البحث عن تسلسل زمني
        causal_sequence = 0
        for t1 in error1_times:
            for t2 in error2_times:
                if t2 > t1 and (t2 - t1).total_seconds() <= 300:  # خلال 5 دقائق
                    causal_sequence += 1
        
        return causal_sequence >= 3  # على الأقل 3 تسلسلات
    
    def _calculate_causal_strength(self, error1: str, error2: str) -> float:
        """حساب قوة العلاقة السببية"""
        error1_count = len([e for e in self.errors_data if e.error_type == error1])
        causal_sequence = 0
        
        for error in self.errors_data:
            if error.error_type == error1:
                # البحث عن خطأ من النوع الثاني خلال 5 دقائق
                time_window = timedelta(minutes=5)
                related_errors = [
                    e for e in self.errors_data
                    if e.error_type == error2 and
                       e.timestamp > error.timestamp and
                       e.timestamp <= error.timestamp + time_window
                ]
                
                if related_errors:
                    causal_sequence += 1
        
        return causal_sequence / error1_count if error1_count > 0 else 0.0
    
    def _calculate_average_lag(self, error1: str, error2: str) -> int:
        """حساب التأخير الزمني المتوسط بالدقائق"""
        lags = []
        
        for error in self.errors_data:
            if error.error_type == error1:
                time_window = timedelta(minutes=30)
                related_errors = [
                    e for e in self.errors_data
                    if e.error_type == error2 and
                       e.timestamp > error.timestamp and
                       e.timestamp <= error.timestamp + time_window
                ]
                
                for related_error in related_errors:
                    lag = (related_error.timestamp - error.timestamp).total_seconds() / 60
                    lags.append(lag)
        
        return int(statistics.mean(lags)) if lags else 0
    
    def detect_anomalies(self) -> List[Dict[str, Any]]:
        """كشف الشذوذات في الأخطاء"""
        anomalies = []
        
        # كشف شذوذات التكرار
        frequency_anomalies = self._detect_frequency_anomalies()
        anomalies.extend(frequency_anomalies)
        
        # كشف شذوذات زمنية
        temporal_anomalies = self._detect_temporal_anomalies()
        anomalies.extend(temporal_anomalies)
        
        # كشف شذوذات المحتوى
        content_anomalies = self._detect_content_anomalies()
        anomalies.extend(content_anomalies)
        
        return anomalies
    
    def _detect_frequency_anomalies(self) -> List[Dict[str, Any]]:
        """كشف شذوذات التكرار"""
        anomalies = []
        
        # تحليل التكرار اليومي لكل نوع خطأ
        daily_counts = defaultdict(lambda: defaultdict(int))
        
        for error in self.errors_data:
            day = error.timestamp.strftime('%Y-%m-%d')
            daily_counts[error.error_type][day] += 1
        
        # حساب الإحصائيات لكل نوع خطأ
        for error_type, day_counts in daily_counts.items():
            counts = list(day_counts.values())
            
            if len(counts) < 3:
                continue
            
            # حساب الانحراف المعياري
            mean_count = statistics.mean(counts)
            std_count = statistics.stdev(counts) if len(counts) > 1 else 0
            
            if std_count == 0:
                continue
            
            # كشف الشذوذات
            threshold = mean_count + self.config['thresholds']['anomaly_threshold'] * std_count
            
            for day, count in day_counts.items():
                if count > threshold:
                    anomaly = {
                        'type': 'frequency_anomaly',
                        'error_type': error_type,
                        'day': day,
                        'actual_count': count,
                        'expected_count': mean_count,
                        'deviation': (count - mean_count) / std_count,
                        'severity': 'high' if count > threshold * 2 else 'medium',
                        'description': f"عدد غير طبيعي من أخطاء {error_type} في {day}: {count} (متوقع: {mean_count:.1f})"
                    }
                    anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_temporal_anomalies(self) -> List[Dict[str, Any]]:
        """كشف الشذوذات الزمنية"""
        anomalies = []
        
        # تحليل التوزيع الزمني للأخطاء
        hourly_errors = defaultdict(list)
        for error in self.errors_data:
            hourly_errors[error.timestamp.hour].append(error)
        
        # حساب المتوسط والانحراف المعياري
        hourly_counts = {hour: len(errors) for hour, errors in hourly_errors.items()}
        
        if len(hourly_counts) < 3:
            return anomalies
        
        counts = list(hourly_counts.values())
        mean_count = statistics.mean(counts)
        std_count = statistics.stdev(counts) if len(counts) > 1 else 0
        
        if std_count == 0:
            return anomalies
        
        # كشف الساعات الشاذة
        threshold = mean_count + self.config['thresholds']['anomaly_threshold'] * std_count
        
        for hour, count in hourly_counts.items():
            if count > threshold:
                anomaly = {
                    'type': 'temporal_anomaly',
                    'hour': hour,
                    'actual_count': count,
                    'expected_count': mean_count,
                    'deviation': (count - mean_count) / std_count,
                    'severity': 'high' if count > threshold * 1.5 else 'medium',
                    'description': f"عدد غير طبيعي من الأخطاء في الساعة {hour}:00 ({count} أخطاء)"
                }
                anomalies.append(anomaly)
        
        return anomalies
    
    def _detect_content_anomalies(self) -> List[Dict[str, Any]]:
        """كشف شذوذات المحتوى"""
        anomalies = []
        
        try:
            # تحليل الرسائل باستخدام TF-IDF
            messages = [error.message for error in self.errors_data if len(error.message) >= 10]
            
            if len(messages) < 10:
                return anomalies
            
            # تطبيق TF-IDF
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(messages)
            
            # كشف النقاط الشاذة باستخدام Isolation Forest
            from sklearn.ensemble import IsolationForest
            
            iso_forest = IsolationForest(contamination=0.1, random_state=42)
            outlier_labels = iso_forest.fit_predict(tfidf_matrix.toarray())
            
            # العثور على الرسائل الشاذة
            for i, (message, label) in enumerate(zip(messages, outlier_labels)):
                if label == -1:  # نقطة شاذة
                    error = self.errors_data[i] if i < len(self.errors_data) else None
                    
                    anomaly = {
                        'type': 'content_anomaly',
                        'error_type': error.error_type if error else 'unknown',
                        'message': message[:100] + '...' if len(message) > 100 else message,
                        'severity': 'low',
                        'description': f"رسالة خطأ غير مألوفة: {message[:50]}..."
                    }
                    anomalies.append(anomaly)
        
        except Exception as e:
            self.logger.warning(f"خطأ في كشف شذوذات المحتوى: {e}")
        
        return anomalies
    
    def analyze_text_patterns(self) -> Dict[str, Any]:
        """تحليل أنماط النص في الأخطاء"""
        try:
            messages = [error.message for error in self.errors_data if len(error.message) >= 10]
            
            if len(messages) < 2:
                return {'error': 'رسائل قليلة جداً للتحليل'}
            
            # تحليل TF-IDF
            tfidf_matrix = self.tfidf_vectorizer.fit_transform(messages)
            feature_names = self.tfidf_vectorizer.get_feature_names_out()
            
            # أعلى الكلمات تكراراً
            scores = np.array(tfidf_matrix.sum(axis=0)).flatten()
            top_word_indices = scores.argsort()[-20:][::-1]
            top_words = [(feature_names[i], scores[i]) for i in top_word_indices]
            
            # تحليل الموضوعات
            lda_matrix = self.lda_model.fit_transform(tfidf_matrix)
            topics = []
            
            for topic_idx, topic in enumerate(self.lda_model.components_):
                top_word_indices = topic.argsort()[-10:][::-1]
                topic_words = [feature_names[i] for i in top_word_indices]
                topic_score = np.sum(topic)
                
                topics.append({
                    'topic_id': topic_idx,
                    'words': topic_words,
                    'score': topic_score,
                    'error_count': np.sum(lda_matrix[:, topic_idx] > 0.3)
                })
            
            # تجميع الأخطاء المشابهة
            similarity_matrix = cosine_similarity(tfidf_matrix)
            similar_groups = self._find_similar_messages(similarity_matrix, messages)
            
            return {
                'top_words': top_words,
                'topics': topics,
                'similar_groups': similar_groups,
                'total_messages_analyzed': len(messages),
                'vocabulary_size': len(feature_names)
            }
        
        except Exception as e:
            self.logger.error(f"خطأ في تحليل النص: {e}")
            return {'error': str(e)}
    
    def _find_similar_messages(self, similarity_matrix: np.ndarray, messages: List[str]) -> List[Dict[str, Any]]:
        """العثور على رسائل مشابهة"""
        similar_groups = []
        threshold = 0.7
        
        # العثور على أزواج مشابهة
        for i in range(len(messages)):
            for j in range(i + 1, len(messages)):
                if similarity_matrix[i][j] > threshold:
                    similar_groups.append({
                        'message1': messages[i][:100] + '...' if len(messages[i]) > 100 else messages[i],
                        'message2': messages[j][:100] + '...' if len(messages[j]) > 100 else messages[j],
                        'similarity': similarity_matrix[i][j],
                        'group_type': 'similar_messages'
                    })
        
        return similar_groups[:10]  # أول 10 مجموعات فقط
    
    def analyze_time_series(self) -> Dict[str, Any]:
        """تحليل السلاسل الزمنية للأخطاء"""
        try:
            # تجميع البيانات يومياً
            daily_counts = defaultdict(int)
            daily_by_type = defaultdict(lambda: defaultdict(int))
            
            for error in self.errors_data:
                day = error.timestamp.strftime('%Y-%m-%d')
                daily_counts[day] += 1
                daily_by_type[error.error_type][day] += 1
            
            # تحويل إلى DataFrame
            dates = sorted(daily_counts.keys())
            total_counts = [daily_counts[date] for date in dates]
            
            if len(dates) < 3:
                return {'error': 'بيانات قليلة جداً لتحليل السلاسل الزمنية'}
            
            # تحليل الاتجاه العام
            x = np.arange(len(dates))
            y = np.array(total_counts)
            
            # حساب الاتجاه
            correlation_matrix = np.corrcoef(x, y)
            trend_correlation = correlation_matrix[0, 1]
            
            # حساب التذبذب
            moving_avg = pd.Series(y).rolling(window=min(7, len(y)//2)).mean()
            volatility = pd.Series(y).rolling(window=min(7, len(y)//2)).std()
            
            # توقع الاتجاه المستقبلي
            if len(y) >= 7:
                # توقع بسيط باستخدام الانحدار الخطي
                slope = np.polyfit(x, y, 1)[0]
                
                # توقع آخر 7 أيام
                future_x = np.arange(len(dates), len(dates) + 7)
                predicted_counts = np.polyval(np.polyfit(x, y, 1), future_x)
                
                # التأكد من عدم وجود قيم سالبة
                predicted_counts = np.maximum(predicted_counts, 0)
                
                future_predictions = [
                    {'date': dates[-1] if len(future_x) == 0 else (datetime.strptime(dates[-1], '%Y-%m-%d') + timedelta(days=i+1)).strftime('%Y-%m-%d'),
                     'predicted_count': float(count)}
                    for i, count in enumerate(predicted_counts)
                ]
            else:
                future_predictions = []
            
            return {
                'daily_counts': dict(daily_counts),
                'trend_analysis': {
                    'correlation': float(trend_correlation),
                    'direction': 'increasing' if trend_correlation > 0 else 'decreasing' if trend_correlation < 0 else 'stable',
                    'strength': abs(trend_correlation)
                },
                'volatility_analysis': {
                    'average_daily_change': float(pd.Series(y).diff().abs().mean()),
                    'volatility_score': float(volatility.mean()) if not pd.isna(volatility.mean()) else 0.0
                },
                'predictions': future_predictions,
                'time_series_summary': {
                    'total_days': len(dates),
                    'average_daily_errors': float(np.mean(y)),
                    'max_daily_errors': int(np.max(y)),
                    'min_daily_errors': int(np.min(y))
                }
            }
        
        except Exception as e:
            self.logger.error(f"خطأ في تحليل السلاسل الزمنية: {e}")
            return {'error': str(e)}
    
    def analyze_root_causes(self) -> List[Dict[str, Any]]:
        """تحليل الأسباب الجذرية للأخطاء"""
        root_causes = []
        
        # تحليل الأسباب الجذرية حسب المصدر
        source_analysis = self._analyze_root_causes_by_source()
        root_causes.extend(source_analysis)
        
        # تحليل الأسباب الجذرية حسب نوع الخطأ
        error_type_analysis = self._analyze_root_causes_by_error_type()
        root_causes.extend(error_type_analysis)
        
        # تحليل الأسباب الجذرية حسب الوقت
        temporal_analysis = self._analyze_root_causes_by_time()
        root_causes.extend(temporal_analysis)
        
        return root_causes
    
    def _analyze_root_causes_by_source(self) -> List[Dict[str, Any]]:
        """تحليل الأسباب الجذرية حسب المصدر"""
        source_errors = defaultdict(list)
        
        for error in self.errors_data:
            source_errors[error.source].append(error)
        
        root_causes = []
        
        for source, errors in source_errors.items():
            if len(errors) < 3:
                continue
            
            # تحليل أنماط الأخطاء في هذا المصدر
            error_types = Counter(error.error_type for error in errors)
            
            # العثور على الأنماط الشائعة
            common_errors = error_types.most_common(3)
            
            root_cause = {
                'category': 'source_based',
                'source': source,
                'affected_errors': len(errors),
                'common_error_types': common_errors,
                'likely_causes': self._identify_source_causes(source, common_errors),
                'confidence': min(len(errors) / 20, 1.0),
                'recommendations': self._generate_source_recommendations(source, common_errors)
            }
            
            root_causes.append(root_cause)
        
        return root_causes
    
    def _analyze_root_causes_by_error_type(self) -> List[Dict[str, Any]]:
        """تحليل الأسباب الجذرية حسب نوع الخطأ"""
        root_causes = []
        
        # تحليل أخطاء قواعد البيانات
        db_errors = [error for error in self.errors_data if 'database' in error.source or 'sql' in error.message.lower()]
        if len(db_errors) >= 5:
            root_cause = {
                'category': 'error_type_based',
                'error_category': 'database_errors',
                'affected_errors': len(db_errors),
                'common_patterns': self._analyze_database_error_patterns(db_errors),
                'likely_causes': [
                    'مشاكل في اتصال قاعدة البيانات',
                    'استعلامات غير محسنة',
                    'قفل قواعد البيانات',
                    'نقص في الموارد'
                ],
                'confidence': 0.8,
                'recommendations': [
                    'مراجعة اتصال قاعدة البيانات',
                    'تحسين الاستعلامات',
                    'إضافة monitoring لقاعدة البيانات',
                    'فحص الموارد المتاحة'
                ]
            }
            root_causes.append(root_cause)
        
        # تحليل أخطاء الشبكة
        network_errors = [error for error in self.errors_data if 'network' in error.source or any(word in error.message.lower() for word in ['timeout', 'connection', 'network'])]
        if len(network_errors) >= 5:
            root_cause = {
                'category': 'error_type_based',
                'error_category': 'network_errors',
                'affected_errors': len(network_errors),
                'common_patterns': self._analyze_network_error_patterns(network_errors),
                'likely_causes': [
                    'مشاكل في الشبكة',
                    'Timeouts',
                    'مشاكل DNS',
                    'Overload'
                ],
                'confidence': 0.7,
                'recommendations': [
                    'مراجعة إعدادات الشبكة',
                    'زيادة timeout values',
                    'إضافة retry logic',
                    'تحسين error handling'
                ]
            }
            root_causes.append(root_cause)
        
        return root_causes
    
    def _analyze_root_causes_by_time(self) -> List[Dict[str, Any]]:
        """تحليل الأسباب الجذرية حسب الوقت"""
        root_causes = []
        
        # تجميع الأخطاء حسب الساعة
        hourly_errors = defaultdict(list)
        for error in self.errors_data:
            hourly_errors[error.timestamp.hour].append(error)
        
        # العثور على ساعات المشكلة
        problematic_hours = []
        for hour, errors in hourly_errors.items():
            if len(errors) >= len(self.errors_data) * 0.15:  # أكثر من 15% من الإجمالي
                problematic_hours.append((hour, len(errors)))
        
        if problematic_hours:
            root_cause = {
                'category': 'time_based',
                'problem_hours': [hour for hour, count in problematic_hours],
                'affected_errors': sum(count for hour, count in problematic_hours),
                'likely_causes': [
                    'أوقات الضغط العالي',
                    'أوقات الصيانة المجدولة',
                    'تغييرات في النظام',
                    'أحمال متوقعة'
                ],
                'confidence': 0.6,
                'recommendations': [
                    'مراجعة schedule للصيانة',
                    'تحسين load balancing',
                    'جدولة المهام الثقيلة خارج ساعات الذروة',
                    'مراقبة إضافية خلال ساعات المشكلة'
                ]
            }
            root_causes.append(root_cause)
        
        return root_causes
    
    def _identify_source_causes(self, source: str, common_errors: List[Tuple[str, int]]) -> List[str]:
        """تحديد الأسباب المحتملة حسب المصدر"""
        causes_map = {
            'database': [
                'مشاكل في connection pool',
                'استعلامات غير محسنة',
                'database locks',
                'نقص في indexes'
            ],
            'api': [
                'rate limiting',
                'authentication issues',
                'validation errors',
                'service unavailability'
            ],
            'frontend': [
                'JavaScript errors',
                'DOM manipulation issues',
                'API integration problems',
                'browser compatibility'
            ],
            'network': [
                'timeout issues',
                'connection problems',
                'DNS resolution',
                'firewall restrictions'
            ],
            'filesystem': [
                'permission errors',
                'disk space issues',
                'file corruption',
                'I/O bottlenecks'
            ]
        }
        
        return causes_map.get(source, ['أسباب غير معروفة'])
    
    def _generate_source_recommendations(self, source: str, common_errors: List[Tuple[str, int]]) -> List[str]:
        """توليد توصيات حسب المصدر"""
        recommendations_map = {
            'database': [
                'مراجعة connection settings',
                'تحسين indexes',
                'إضافة monitoring',
                'فحص query performance'
            ],
            'api': [
                'تطبيق rate limiting',
                'تحسين error handling',
                'إضافة validation',
                'مراجعة authentication'
            ],
            'frontend': [
                'إضافة error boundaries',
                'تحسين error reporting',
                'إضافة fallback UI',
                'تحسين browser testing'
            ],
            'network': [
                'تحسين timeout handling',
                'إضافة retry logic',
                'مراجعة network config',
                'إضافة circuit breaker'
            ],
            'filesystem': [
                'مراجعة permissions',
                'إضافة disk monitoring',
                'تحسين file handling',
                'إضافة backup strategy'
            ]
        }
        
        return recommendations_map.get(source, ['مراجعة عامة للمصدر'])
    
    def _analyze_database_error_patterns(self, errors: List[ErrorEvent]) -> List[str]:
        """تحليل أنماط أخطاء قاعدة البيانات"""
        patterns = []
        
        # تحليل الرسائل
        messages = [error.message.lower() for error in errors]
        
        if any('connection' in msg for msg in messages):
            patterns.append('connection_errors')
        
        if any('timeout' in msg for msg in messages):
            patterns.append('timeout_errors')
        
        if any('lock' in msg for msg in messages):
            patterns.append('locking_errors')
        
        if any('constraint' in msg for msg in messages):
            patterns.append('constraint_violations')
        
        return patterns
    
    def _analyze_network_error_patterns(self, errors: List[ErrorEvent]) -> List[str]:
        """تحليل أنماط أخطاء الشبكة"""
        patterns = []
        
        messages = [error.message.lower() for error in errors]
        
        if any('timeout' in msg for msg in messages):
            patterns.append('timeout_issues')
        
        if any('connection refused' in msg for msg in messages):
            patterns.append('connection_refused')
        
        if any('dns' in msg for msg in messages):
            patterns.append('dns_issues')
        
        return patterns
    
    def generate_analysis_summary(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """توليد ملخص التحليل"""
        summary = {
            'analysis_timestamp': datetime.now().isoformat(),
            'total_errors_analyzed': len(self.errors_data),
            'analysis_duration': 'N/A',  # يمكن حسابه إذا لزم الأمر
            'key_findings': [],
            'critical_insights': [],
            'top_recommendations': []
        }
        
        # جمع النتائج الرئيسية
        if 'frequency' in analysis_results:
            freq = analysis_results['frequency']
            
            # أخطاء أكثر تكراراً
            if freq['error_type_distribution']:
                most_common_error = max(freq['error_type_distribution'].items(), key=lambda x: x[1])
                summary['key_findings'].append(f"أكثر أخطاء تكراراً: {most_common_error[0]} ({most_common_error[1]} مرة)")
            
            # توزيع الخطورة
            if freq['severity_distribution']:
                critical_count = freq['severity_distribution'].get('critical', 0)
                if critical_count > 0:
                    summary['critical_insights'].append(f"عدد الأخطاء الحرجة: {critical_count}")
        
        # الاتجاهات
        if 'trends' in analysis_results:
            increasing_trends = [t for t in analysis_results['trends'] if t.trend_direction == 'increasing']
            if increasing_trends:
                summary['critical_insights'].append(f"{len(increasing_trends)} أنواع أخطاء تظهر اتجاهاً صاعداً")
        
        # الأنماط
        if 'patterns' in analysis_results:
            high_frequency_patterns = [p for p in analysis_results['patterns'] if p.severity in ['high', 'critical']]
            if high_frequency_patterns:
                summary['key_findings'].append(f"تم اكتشاف {len(high_frequency_patterns)} أنماط عالية الخطورة")
        
        # التوصيات العامة
        summary['top_recommendations'] = [
            "مراقبة الأخطاء الحرجة بشكل مستمر",
            "تحسين معالجة الأخطاء في الكود",
            "إضافة اختبارات إضافية للأنماط المكتشفة",
            "مراجعة العمليات المرتبطة بالاتجاهات الصاعدة"
        ]
        
        return summary
    
    def _generate_pattern_id(self) -> str:
        """توليد معرف نمط"""
        import uuid
        return f"pattern_{uuid.uuid4().hex[:8]}"
    
    def export_analysis(self, analysis_results: Dict[str, Any], format: str = 'json', output_path: str = None) -> str:
        """تصدير نتائج التحليل"""
        if not output_path:
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            output_path = f'error_analysis_{timestamp}.{format}'
        
        # تحويل البيانات للتسلسل
        export_data = self._prepare_export_data(analysis_results)
        
        if format == 'json':
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(export_data, f, indent=2, ensure_ascii=False, default=str)
        elif format == 'csv':
            self._export_csv(export_data, output_path)
        elif format == 'xlsx':
            self._export_excel(export_data, output_path)
        
        return output_path
    
    def _prepare_export_data(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """تحضير البيانات للتصدير"""
        export_data = {
            'metadata': {
                'export_timestamp': datetime.now().isoformat(),
                'total_errors': len(self.errors_data),
                'analysis_version': '1.0'
            },
            'raw_analysis': analysis_results,
            'summary': analysis_results.get('summary', {})
        }
        
        # تحويل ErrorEvents إلى dict
        if self.errors_data:
            export_data['error_events'] = [asdict(error) for error in self.errors_data]
        
        return export_data
    
    def _export_csv(self, data: Dict[str, Any], output_path: str):
        """تصدير CSV"""
        import csv
        
        # تصدير الأخطاء الأساسية
        if 'error_events' in data:
            with open(output_path.replace('.csv', '_errors.csv'), 'w', newline='', encoding='utf-8') as f:
                if data['error_events']:
                    fieldnames = data['error_events'][0].keys()
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    writer.writerows(data['error_events'])
    
    def _export_excel(self, data: Dict[str, Any], output_path: str):
        """تصدير Excel"""
        import openpyxl
        from openpyxl.utils.dataframe import dataframe_to_rows
        
        wb = openpyxl.Workbook()
        
        # ورقة الملخص
        ws_summary = wb.active
        ws_summary.title = "Summary"
        
        summary_data = [
            ['تحليل الأخطاء - ملخص'],
            [''],
            ['إجمالي الأخطاء', data['metadata']['total_errors']],
            ['وقت التصدير', data['metadata']['export_timestamp']],
            [''],
            ['النتائج الرئيسية']
        ]
        
        if 'key_findings' in data.get('summary', {}):
            for finding in data['summary']['key_findings']:
                summary_data.append([finding])
        
        for row in summary_data:
            ws_summary.append(row)
        
        # ورقة الأخطاء
        if 'error_events' in data:
            ws_errors = wb.create_sheet("Errors")
            if data['error_events']:
                for row in dataframe_to_rows(pd.DataFrame(data['error_events']), index=False, header=True):
                    ws_errors.append(row)
        
        wb.save(output_path)
    
    def get_analysis_config(self) -> Dict[str, Any]:
        """الحصول على إعدادات التحليل"""
        return {
            'config': self.config,
            'analysis_config': self.analysis_config,
            'data_summary': {
                'total_errors': len(self.errors_data),
                'date_range': {
                    'start': min(error.timestamp for error in self.errors_data).isoformat() if self.errors_data else None,
                    'end': max(error.timestamp for error in self.errors_data).isoformat() if self.errors_data else None
                },
                'error_types': list(set(error.error_type for error in self.errors_data)) if self.errors_data else [],
                'sources': list(set(error.source for error in self.errors_data)) if self.errors_data else []
            }
        }

# إنشاء instance عام
error_analysis = ErrorAnalysis()

# تصدير
__all__ = ['ErrorAnalysis', 'ErrorPattern', 'ErrorTrend', 'ErrorCorrelation', 'error_analysis']