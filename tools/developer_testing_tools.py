"""
أدوات اختبار المطورين المتقدمة - Advanced Developer Testing Tools
يوفر:
1. أدوات المراقبة المباشرة
2. أدوات التحليل والإحصائيات
3. أدوات التصحيح المتقدمة
4. أدوات تحسين الأداء
5. أدوات توليد التقارير
"""

import json
import time
import asyncio
import psutil
import threading
from typing import Dict, List, Any, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from collections import defaultdict, deque
import logging
from pathlib import Path
import statistics
from contextlib import contextmanager

logger = logging.getLogger(__name__)


@dataclass
class TestMetrics:
    """Test execution metrics"""
    test_name: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "running"  # running, passed, failed, skipped
    duration: float = 0.0
    memory_usage: List[float] = field(default_factory=list)
    cpu_usage: List[float] = field(default_factory=list)
    assertions: int = 0
    failures: List[str] = field(default_factory=list)


@dataclass
class CoverageData:
    """Test coverage data"""
    file_path: str
    lines_total: int = 0
    lines_covered: int = 0
    branches_total: int = 0
    branches_covered: int = 0
    functions_total: int = 0
    functions_covered: int = 0


class TestWatcher:
    """Real-time test watcher and monitor"""
    
    def __init__(self, watch_patterns: List[str] = None, exclude_patterns: List[str] = None):
        self.watch_patterns = watch_patterns or ["**/*.py", "**/*.ts", "**/*.tsx"]
        self.exclude_patterns = exclude_patterns or [
            "**/node_modules/**",
            "**/.git/**",
            "**/venv/**",
            "**/__pycache__/**"
        ]
        self.watching = False
        self.test_runs: List[TestMetrics] = []
        self.coverage_data: List[CoverageData] = []
        self.performance_metrics = defaultdict(list)
        
    def start_watching(self, on_test_change: Optional[Callable] = None):
        """Start watching file changes and test execution"""
        self.watching = True
        
        # Watch for file changes
        self._start_file_watcher(on_test_change)
        
        # Monitor test execution in real-time
        self._start_test_monitor()
        
        logger.info("🔍 بدء مراقبة الاختبارات المباشرة")
    
    def stop_watching(self):
        """Stop watching"""
        self.watching = False
        logger.info("⏹️ تم إيقاف مراقبة الاختبارات")
    
    def _start_file_watcher(self, callback: Optional[Callable]):
        """Start file system watcher"""
        import watchdog.observers
        import watchdog.events
        
        class TestFileHandler(watchdog.events.FileSystemEventHandler):
            def __init__(self, watcher):
                self.watcher = watcher
                
            def on_modified(self, event):
                if not event.is_directory:
                    self.watcher._on_file_changed(event.src_path, callback)
        
        observer = watchdog.observers.Observer()
        observer.schedule(
            TestFileHandler(self),
            path=".",
            recursive=True
        )
        observer.start()
        
        self._observer = observer
    
    def _on_file_changed(self, file_path: str, callback: Optional[Callable]):
        """Handle file change"""
        if self._should_watch_file(file_path):
            logger.info(f"📁 تم تعديل الملف: {file_path}")
            
            if callback:
                callback(file_path)
            
            # Auto-run relevant tests
            self._run_related_tests(file_path)
    
    def _should_watch_file(self, file_path: str) -> bool:
        """Check if file should be watched"""
        import fnmatch
        
        # Check exclude patterns
        for pattern in self.exclude_patterns:
            if fnmatch.fnmatch(file_path, pattern):
                return False
        
        # Check include patterns
        for pattern in self.watch_patterns:
            if fnmatch.fnmatch(file_path, pattern):
                return True
        
        return False
    
    def _run_related_tests(self, changed_file: str):
        """Run tests related to changed file"""
        test_file = changed_file.replace('.py', '_test.py')
        test_file = test_file.replace('.ts', '.test.ts')
        test_file = test_file.replace('.tsx', '.test.tsx')
        
        if Path(test_file).exists():
            logger.info(f"🧪 تشغيل اختبار مرتبط: {test_file}")
            # Run the related test
            self._execute_test(test_file)
    
    def _execute_test(self, test_file: str):
        """Execute a test file"""
        start_time = datetime.now()
        
        metrics = TestMetrics(
            test_name=test_file,
            start_time=start_time
        )
        
        self.test_runs.append(metrics)
        
        # Monitor system resources during test
        self._monitor_test_execution(metrics)
    
    def _monitor_test_execution(self, metrics: TestMetrics):
        """Monitor test execution in real-time"""
        def monitor():
            process = psutil.Process()
            
            while metrics.status == "running":
                try:
                    # Get memory and CPU usage
                    memory_info = process.memory_info()
                    cpu_percent = process.cpu_percent()
                    
                    metrics.memory_usage.append(memory_info.rss / 1024 / 1024)  # MB
                    metrics.cpu_usage.append(cpu_percent)
                    
                    time.sleep(0.5)  # Sample every 500ms
                    
                except Exception as e:
                    logger.error(f"خطأ في مراقبة النظام: {e}")
                    break
        
        monitor_thread = threading.Thread(target=monitor)
        monitor_thread.daemon = True
        monitor_thread.start()
    
    def get_test_summary(self) -> Dict[str, Any]:
        """Get test execution summary"""
        if not self.test_runs:
            return {"message": "لا توجد اختبارات مشغلة"}
        
        total_tests = len(self.test_runs)
        passed_tests = sum(1 for t in self.test_runs if t.status == "passed")
        failed_tests = sum(1 for t in self.test_runs if t.status == "failed")
        
        # Calculate average duration
        durations = [t.duration for t in self.test_runs if t.duration > 0]
        avg_duration = statistics.mean(durations) if durations else 0
        
        # Calculate average resource usage
        all_memory = []
        all_cpu = []
        for test in self.test_runs:
            all_memory.extend(test.memory_usage)
            all_cpu.extend(test.cpu_usage)
        
        avg_memory = statistics.mean(all_memory) if all_memory else 0
        avg_cpu = statistics.mean(all_cpu) if all_cpu else 0
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": (passed_tests / total_tests * 100) if total_tests > 0 else 0,
            "average_duration": avg_duration,
            "average_memory_usage_mb": avg_memory,
            "average_cpu_usage": avg_cpu,
            "test_runs": [
                {
                    "name": test.test_name,
                    "status": test.status,
                    "duration": test.duration,
                    "assertions": test.assertions,
                    "failures": test.failures
                }
                for test in self.test_runs
            ]
        }


class CoverageAnalyzer:
    """Advanced coverage analysis and reporting"""
    
    def __init__(self, coverage_data: Dict[str, Any]):
        self.coverage_data = coverage_data
    
    def analyze_coverage_gaps(self) -> List[Dict[str, Any]]:
        """Analyze coverage gaps and provide recommendations"""
        gaps = []
        
        for file_path, data in self.coverage_data.items():
            file_gaps = {
                "file": file_path,
                "total_lines": data.get("summary", {}).get("totals", {}).get("num_statements", 0),
                "covered_lines": data.get("summary", {}).get("totals", {}).get("covered_lines", 0),
                "missing_lines": [],
                "coverage_percentage": 0,
                "priority": "low",
                "recommendations": []
            }
            
            # Calculate coverage percentage
            if file_gaps["total_lines"] > 0:
                file_gaps["coverage_percentage"] = (
                    file_gaps["covered_lines"] / file_gaps["total_lines"] * 100
                )
            
            # Identify missing lines
            missing_lines_data = data.get("missing_lines", [])
            for line_info in missing_lines_data:
                if isinstance(line_info, dict):
                    file_gaps["missing_lines"].append(line_info)
            
            # Determine priority
            if file_gaps["coverage_percentage"] < 50:
                file_gaps["priority"] = "high"
                file_gaps["recommendations"].append("🚨 أولوية عالية: مطلوب إضافة اختبارات عاجلة")
            elif file_gaps["coverage_percentage"] < 80:
                file_gaps["priority"] = "medium"
                file_gaps["recommendations"].append("⚠️ أولوية متوسطة: تحسين تغطية الاختبارات")
            else:
                file_gaps["priority"] = "low"
                file_gaps["recommendations"].append("✅ أولوية منخفضة: التغطية جيدة")
            
            # File-specific recommendations
            if "models" in file_path:
                file_gaps["recommendations"].append("📊 إضافة اختبارات قاعدة البيانات")
            elif "services" in file_path:
                file_gaps["recommendations"].append("🔧 إضافة اختبارات التكامل")
            elif "utils" in file_path:
                file_gaps["recommendations"].append("🛠️ إضافة اختبارات الوحدة")
            
            gaps.append(file_gaps)
        
        return gaps
    
    def generate_coverage_report(self, output_file: str):
        """Generate detailed coverage report"""
        gaps = self.analyze_coverage_gaps()
        
        # Sort by coverage percentage (lowest first)
        gaps.sort(key=lambda x: x["coverage_percentage"])
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_files": len(gaps),
            "overall_coverage": self._calculate_overall_coverage(),
            "coverage_gaps": gaps,
            "recommendations": self._generate_global_recommendations(gaps),
            "priority_files": [gap for gap in gaps if gap["priority"] == "high"]
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 تم إنشاء تقرير التغطية: {output_file}")
        return report
    
    def _calculate_overall_coverage(self) -> float:
        """Calculate overall coverage percentage"""
        total_statements = 0
        covered_statements = 0
        
        for data in self.coverage_data.values():
            summary = data.get("summary", {}).get("totals", {})
            total_statements += summary.get("num_statements", 0)
            covered_statements += summary.get("covered_lines", 0)
        
        return (covered_statements / total_statements * 100) if total_statements > 0 else 0
    
    def _generate_global_recommendations(self, gaps: List[Dict]) -> List[str]:
        """Generate global recommendations"""
        recommendations = []
        
        high_priority_count = sum(1 for gap in gaps if gap["priority"] == "high")
        medium_priority_count = sum(1 for gap in gaps if gap["priority"] == "medium")
        
        if high_priority_count > 5:
            recommendations.append(
                f"🚨 {high_priority_count} ملفات تحتاج اهتمام عاجل - فكر في إضافة المزيد من المطورين"
            )
        
        if medium_priority_count > 10:
            recommendations.append(
                f"⚠️ {medium_priority_count} ملفات تحتاج تحسين - خصص وقت منتظم لتحسين الاختبارات"
            )
        
        if len(gaps) < 5:
            recommendations.append("🎉 ممتاز! التغطية العامة جيدة")
        
        return recommendations


class TestPerformanceProfiler:
    """Test performance profiling and optimization"""
    
    def __init__(self):
        self.profile_data = defaultdict(dict)
        self.slow_tests = []
        
    @contextmanager
    def profile_test(self, test_name: str):
        """Profile a test execution"""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        try:
            yield
        finally:
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            duration = end_time - start_time
            memory_delta = end_memory - start_memory
            
            self.profile_data[test_name] = {
                "duration": duration,
                "memory_start": start_memory,
                "memory_end": end_memory,
                "memory_delta": memory_delta,
                "timestamp": datetime.now().isoformat()
            }
            
            # Track slow tests
            if duration > 5.0:  # Tests longer than 5 seconds
                self.slow_tests.append({
                    "test_name": test_name,
                    "duration": duration,
                    "memory_delta": memory_delta
                })
    
    def analyze_performance_issues(self) -> Dict[str, Any]:
        """Analyze performance issues"""
        if not self.profile_data:
            return {"message": "لا توجد بيانات أداء"}
        
        # Calculate statistics
        durations = [data["duration"] for data in self.profile_data.values()]
        memory_deltas = [data["memory_delta"] for data in self.profile_data.values()]
        
        analysis = {
            "total_tests": len(self.profile_data),
            "average_duration": statistics.mean(durations),
            "max_duration": max(durations),
            "min_duration": min(durations),
            "average_memory_delta": statistics.mean(memory_deltas),
            "max_memory_delta": max(memory_deltas),
            "slow_tests_count": len(self.slow_tests),
            "performance_issues": []
        }
        
        # Identify performance issues
        if analysis["average_duration"] > 2.0:
            analysis["performance_issues"].append(
                "🐌 متوسط وقت الاختبار مرتفع - فكر في تحسين الاختبارات"
            )
        
        if analysis["max_duration"] > 10.0:
            analysis["performance_issues"].append(
                "⏰ بعض الاختبارات تستغرق وقتاً طويلاً - راجع هذه الاختبارات"
            )
        
        if analysis["average_memory_delta"] > 50:
            analysis["performance_issues"].append(
                "💾 استخدام ذاكرة مرتفع في الاختبارات - تجنب memory leaks"
            )
        
        return analysis
    
    def generate_performance_report(self, output_file: str):
        """Generate performance analysis report"""
        analysis = self.analyze_performance_issues()
        
        # Sort slow tests by duration
        self.slow_tests.sort(key=lambda x: x["duration"], reverse=True)
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "analysis": analysis,
            "slow_tests": self.slow_tests[:10],  # Top 10 slowest tests
            "recommendations": self._generate_performance_recommendations(analysis)
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"⚡ تم إنشاء تقرير الأداء: {output_file}")
        return report
    
    def _generate_performance_recommendations(self, analysis: Dict) -> List[str]:
        """Generate performance recommendations"""
        recommendations = []
        
        if analysis["average_duration"] > 2.0:
            recommendations.append(
                "🚀 تقليل وقت الاختبارات: استخدم mocks بدلاً من خدمات حقيقية"
            )
        
        if analysis["slow_tests_count"] > 3:
            recommendations.append(
                f"⚡ مراجعة {analysis['slow_tests_count']} اختبار بطيء - فكر في تقسيمها"
            )
        
        if analysis["max_memory_delta"] > 100:
            recommendations.append(
                "🧠 تحسين إدارة الذاكرة - تأكد من تنظيف الموارد بعد كل اختبار"
            )
        
        if analysis["total_tests"] > 100:
            recommendations.append(
                "📊 تشغيل اختبارات متوازية لتحسين السرعة"
            )
        
        return recommendations


class TestReporter:
    """Generate comprehensive test reports"""
    
    @staticmethod
    def generate_html_dashboard(
        test_summary: Dict,
        coverage_data: Dict,
        performance_data: Dict,
        output_file: str
    ):
        """Generate interactive HTML dashboard"""
        
        html_content = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>لوحة تحكم نتائج الاختبارات - Saler</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    direction: rtl;
                }}
                .dashboard {{
                    max-width: 1400px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 20px;
                    padding: 30px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }}
                .header {{
                    text-align: center;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #3498db;
                }}
                .header h1 {{
                    color: #2c3e50;
                    margin: 0;
                    font-size: 2.5em;
                }}
                .stats-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 25px;
                    margin-bottom: 40px;
                }}
                .stat-card {{
                    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                    padding: 25px;
                    border-radius: 15px;
                    text-align: center;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
                    transition: transform 0.3s ease;
                }}
                .stat-card:hover {{
                    transform: translateY(-5px);
                }}
                .stat-value {{
                    font-size: 2.5em;
                    font-weight: bold;
                    color: #2c3e50;
                    margin-bottom: 10px;
                }}
                .stat-label {{
                    color: #7f8c8d;
                    font-size: 1.1em;
                }}
                .section {{
                    margin: 40px 0;
                    padding: 25px;
                    background: #f8f9fa;
                    border-radius: 15px;
                    border-left: 5px solid #3498db;
                }}
                .section h2 {{
                    color: #2c3e50;
                    margin-top: 0;
                    font-size: 1.8em;
                }}
                .progress-bar {{
                    background: #ecf0f1;
                    border-radius: 25px;
                    overflow: hidden;
                    height: 30px;
                    margin: 15px 0;
                    position: relative;
                }}
                .progress-fill {{
                    height: 100%;
                    background: linear-gradient(90deg, #3498db, #2ecc71);
                    border-radius: 25px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    transition: width 0.5s ease;
                }}
                .test-list {{
                    max-height: 400px;
                    overflow-y: auto;
                    background: white;
                    border-radius: 10px;
                    padding: 20px;
                }}
                .test-item {{
                    padding: 15px;
                    margin: 10px 0;
                    border-radius: 8px;
                    border-right: 4px solid #3498db;
                    background: #f8f9fa;
                }}
                .test-success {{ border-right-color: #27ae60; }}
                .test-failure {{ border-right-color: #e74c3c; }}
                .test-pending {{ border-right-color: #f39c12; }}
                .chart-container {{
                    background: white;
                    border-radius: 15px;
                    padding: 20px;
                    margin: 20px 0;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                }}
                .footer {{
                    text-align: center;
                    margin-top: 50px;
                    padding: 20px;
                    background: #34495e;
                    color: white;
                    border-radius: 10px;
                }}
            </style>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        </head>
        <body>
            <div class="dashboard">
                <div class="header">
                    <h1>🧪 لوحة تحكم نتائج الاختبارات</h1>
                    <p>تقرير شامل لأداء الاختبارات وجودة الكود</p>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">{test_summary.get('total_tests', 0)}</div>
                        <div class="stat-label">إجمالي الاختبارات</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{test_summary.get('passed_tests', 0)}</div>
                        <div class="stat-label">اختبارات ناجحة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{test_summary.get('failed_tests', 0)}</div>
                        <div class="stat-label">اختبارات فاشلة</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">{test_summary.get('success_rate', 0):.1f}%</div>
                        <div class="stat-label">معدل النجاح</div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>📊 تغطية الكود</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">{coverage_data.get('overall_coverage', 0):.1f}%</div>
                            <div class="stat-label">التغطية الإجمالية</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{coverage_data.get('total_files', 0)}</div>
                            <div class="stat-label">الملفات المفحوصة</div>
                        </div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: {coverage_data.get('overall_coverage', 0)}%">
                            {coverage_data.get('overall_coverage', 0):.1f}%
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>⚡ تحليل الأداء</h2>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">{performance_data.get('average_duration', 0):.2f}s</div>
                            <div class="stat-label">متوسط وقت الاختبار</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">{performance_data.get('slow_tests_count', 0)}</div>
                            <div class="stat-label">اختبارات بطيئة</div>
                        </div>
                    </div>
                </div>
                
                <div class="section">
                    <h2>📋 قائمة الاختبارات الأخيرة</h2>
                    <div class="test-list">
                        {generate_test_items_html(test_summary.get('test_runs', []))}
                    </div>
                </div>
                
                <div class="footer">
                    <p>تم إنشاء هذا التقرير في: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p>نظام اختبار متقدم - Saler Platform</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"📊 تم إنشاء لوحة التحكم: {output_file}")


def generate_test_items_html(test_runs: List[Dict]) -> str:
    """Generate HTML for test items"""
    html_items = []
    
    for test in test_runs:
        status_class = f"test-{test.get('status', 'pending')}"
        status_icon = "✅" if test.get('status') == 'passed' else "❌" if test.get('status') == 'failed' else "⏳"
        
        html_items.append(f"""
            <div class="test-item {status_class}">
                <strong>{status_icon} {test.get('name', 'Unknown Test')}</strong><br>
                <small>الوقت: {test.get('duration', 0):.2f}s | 
                التقييمات: {test.get('assertions', 0)} | 
                الحالة: {test.get('status', 'pending')}</small>
            </div>
        """)
    
    return "".join(html_items) if html_items else "<p>لا توجد اختبارات</p>"


# CLI Tools
def main():
    """Main CLI interface for developer tools"""
    import argparse
    
    parser = argparse.ArgumentParser(description="أدوات اختبار المطورين المتقدمة")
    subparsers = parser.add_subparsers(dest='command', help='الأوامر المتاحة')
    
    # Watch command
    watch_parser = subparsers.add_parser('watch', help='مراقبة الاختبارات المباشرة')
    watch_parser.add_argument('--patterns', nargs='+', default=['**/*.py'], help='أنماط الملفات للمراقبة')
    
    # Coverage command
    coverage_parser = subparsers.add_parser('coverage', help='تحليل تغطية الاختبارات')
    coverage_parser.add_argument('--input', required=True, help='ملف بيانات التغطية')
    coverage_parser.add_argument('--output', default='coverage-report.json', help='ملف التقرير')
    
    # Performance command
    perf_parser = subparsers.add_parser('performance', help='تحليل أداء الاختبارات')
    perf_parser.add_argument('--input', help='ملف بيانات الأداء')
    perf_parser.add_argument('--output', default='performance-report.json', help='ملف التقرير')
    
    # Report command
    report_parser = subparsers.add_parser('report', help='إنشاء تقرير شامل')
    report_parser.add_argument('--test-summary', required=True, help='ملف ملخص الاختبارات')
    report_parser.add_argument('--coverage', required=True, help='ملف بيانات التغطية')
    report_parser.add_argument('--performance', required=True, help='ملف بيانات الأداء')
    report_parser.add_argument('--output', default='test-dashboard.html', help='ملف التقرير')
    
    args = parser.parse_args()
    
    if args.command == 'watch':
        watcher = TestWatcher(args.patterns)
        watcher.start_watching()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            watcher.stop_watching()
    
    elif args.command == 'coverage':
        with open(args.input) as f:
            coverage_data = json.load(f)
        
        analyzer = CoverageAnalyzer(coverage_data)
        analyzer.generate_coverage_report(args.output)
    
    elif args.command == 'performance':
        profiler = TestPerformanceProfiler()
        if args.input:
            with open(args.input) as f:
                profile_data = json.load(f)
            # Load profile data
        profiler.generate_performance_report(args.output)
    
    elif args.command == 'report':
        # Load all data and generate report
        with open(args.test_summary) as f:
            test_summary = json.load(f)
        with open(args.coverage) as f:
            coverage_data = json.load(f)
        with open(args.performance) as f:
            performance_data = json.load(f)
        
        TestReporter.generate_html_dashboard(
            test_summary, coverage_data, performance_data, args.output
        )
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()