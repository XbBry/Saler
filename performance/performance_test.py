"""
نظام اختبار الأداء المتقدم - Advanced Performance Testing
يدعم:
1. اختبار الحمولة (Load Testing)
2. اختبار الإجهاد (Stress Testing)
3. اختبار التحمل (Endurance Testing)
4. اختبار الذروة (Spike Testing)
5. قياس الأداء في الوقت الفعلي
6. مراقبة الموارد
"""

import json
import asyncio
import time
import statistics
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
import logging
from concurrent.futures import ThreadPoolExecutor
import threading
import psutil
import os

logger = logging.getLogger(__name__)


@dataclass
class PerformanceMetric:
    """Performance metric data point"""
    timestamp: datetime
    response_time: float
    status_code: int
    throughput: float = 0.0
    cpu_usage: float = 0.0
    memory_usage: float = 0.0
    active_connections: int = 0


@dataclass
class PerformanceTestConfig:
    """Performance test configuration"""
    name: str
    target_url: str
    test_type: str  # load, stress, endurance, spike
    duration: int  # seconds
    ramp_up_time: int  # seconds
    target_rps: int
    concurrent_users: int
    timeout: int = 30
    think_time: float = 1.0  # seconds between requests
    data_file: Optional[str] = None
    endpoints: List[str] = field(default_factory=list)
    headers: Dict[str, str] = field(default_factory=dict)


@dataclass
class PerformanceTestResult:
    """Performance test result"""
    config: PerformanceTestConfig
    start_time: datetime
    end_time: datetime
    total_requests: int
    successful_requests: int
    failed_requests: int
    response_times: List[float]
    throughput_data: List[float]
    error_rates: List[float]
    resource_usage: List[PerformanceMetric]
    summary: Dict[str, Any]


class SystemResourceMonitor:
    """Monitor system resources during performance tests"""
    
    def __init__(self):
        self.monitoring = False
        self.data: List[PerformanceMetric] = []
        self.monitor_thread: Optional[threading.Thread] = None
        
    def start_monitoring(self):
        """Start resource monitoring"""
        self.monitoring = True
        self.data.clear()
        self.monitor_thread = threading.Thread(target=self._monitor_loop)
        self.monitor_thread.start()
        logger.info("🖥️ Started system resource monitoring")
    
    def stop_monitoring(self):
        """Stop resource monitoring"""
        self.monitoring = False
        if self.monitor_thread:
            self.monitor_thread.join()
        logger.info("🖥️ Stopped system resource monitoring")
    
    def _monitor_loop(self):
        """Monitor system resources continuously"""
        while self.monitoring:
            try:
                # Get system metrics
                cpu_percent = psutil.cpu_percent(interval=1)
                memory = psutil.virtual_memory()
                memory_percent = memory.percent
                
                # Get network connections (approximation)
                connections = len(psutil.net_connections())
                
                # Create metric
                metric = PerformanceMetric(
                    timestamp=datetime.now(),
                    response_time=0.0,  # Will be updated separately
                    status_code=200,
                    cpu_usage=cpu_percent,
                    memory_usage=memory_percent,
                    active_connections=connections
                )
                
                self.data.append(metric)
                
            except Exception as e:
                logger.error(f"Error monitoring resources: {e}")
                time.sleep(1)
    
    def get_latest_metrics(self) -> Optional[PerformanceMetric]:
        """Get latest resource metrics"""
        return self.data[-1] if self.data else None
    
    def get_average_metrics(self) -> Dict[str, float]:
        """Get average resource metrics"""
        if not self.data:
            return {}
        
        cpu_values = [m.cpu_usage for m in self.data]
        memory_values = [m.memory_usage for m in self.data]
        connection_values = [m.active_connections for m in self.data]
        
        return {
            "avg_cpu_usage": statistics.mean(cpu_values),
            "max_cpu_usage": max(cpu_values),
            "avg_memory_usage": statistics.mean(memory_values),
            "max_memory_usage": max(memory_values),
            "avg_connections": statistics.mean(connection_values),
            "max_connections": max(connection_values)
        }


class LoadTestExecutor:
    """Execute load tests with different patterns"""
    
    def __init__(self, config: PerformanceTestConfig):
        self.config = config
        self.results: List[PerformanceMetric] = []
        self.monitor = SystemResourceMonitor()
        self.test_running = False
        
    async def run_load_test(self) -> PerformanceTestResult:
        """Run load test"""
        logger.info(f"🚀 Starting load test: {self.config.name}")
        
        self.test_running = True
        start_time = datetime.now()
        
        # Start monitoring
        self.monitor.start_monitoring()
        
        try:
            # Run the test based on type
            if self.config.test_type == "load":
                await self._run_load_test()
            elif self.config.test_type == "stress":
                await self._run_stress_test()
            elif self.config.test_type == "endurance":
                await self._run_endurance_test()
            elif self.config.test_type == "spike":
                await self._run_spike_test()
            else:
                raise ValueError(f"Unknown test type: {self.config.test_type}")
                
        finally:
            self.test_running = False
            self.monitor.stop_monitoring()
        
        end_time = datetime.now()
        
        # Calculate results
        result = self._calculate_results(start_time, end_time)
        
        logger.info(f"✅ Load test completed: {result.successful_requests}/{result.total_requests} successful")
        
        return result
    
    async def _run_load_test(self):
        """Run standard load test"""
        ramp_up_duration = self.config.ramp_up_time
        total_duration = self.config.duration
        target_rps = self.config.target_rps
        
        # Ramp up
        if ramp_up_duration > 0:
            await self._ramp_up(ramp_up_duration, target_rps)
        
        # Steady load
        await self._steady_load(total_duration - ramp_up_duration, target_rps)
    
    async def _run_stress_test(self):
        """Run stress test - progressively increase load"""
        current_rps = 10
        step_increase = self.config.target_rps // 5
        step_duration = self.config.duration // 5
        
        for i in range(5):
            logger.info(f"🧪 Stress test step {i+1}: {current_rps} RPS")
            await self._steady_load(step_duration, current_rps)
            current_rps += step_increase
    
    async def _run_endurance_test(self):
        """Run endurance test - long duration with moderate load"""
        moderate_rps = self.config.target_rps // 2
        await self._steady_load(self.config.duration, moderate_rps)
    
    async def _run_spike_test(self):
        """Run spike test - sudden increase in load"""
        # Low baseline
        await self._steady_load(30, 10)
        
        # Spike to high load
        await self._steady_load(60, self.config.target_rps)
        
        # Return to baseline
        await self._steady_load(30, 10)
    
    async def _ramp_up(self, duration: int, target_rps: int):
        """Gradually increase load"""
        steps = 10
        step_duration = duration / steps
        step_rps = target_rps / steps
        
        for i in range(steps):
            if not self.test_running:
                break
                
            current_rps = int(step_rps * (i + 1))
            logger.info(f"📈 Ramp up step {i+1}: {current_rps} RPS")
            
            await self._steady_load(int(step_duration), current_rps)
    
    async def _steady_load(self, duration: int, target_rps: int):
        """Maintain steady load for duration"""
        interval = 1.0 / target_rps
        end_time = time.time() + duration
        
        while time.time() < end_time and self.test_running:
            # Start batch of requests
            batch_start = time.time()
            
            # Execute requests for this second
            await self._execute_request_batch(target_rps)
            
            # Wait for next second
            elapsed = time.time() - batch_start
            if elapsed < 1.0:
                await asyncio.sleep(1.0 - elapsed)
    
    async def _execute_request_batch(self, batch_size: int):
        """Execute a batch of requests"""
        tasks = []
        
        for _ in range(batch_size):
            if not self.test_running:
                break
                
            task = self._execute_single_request()
            tasks.append(task)
        
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
    
    async def _execute_single_request(self):
        """Execute a single request"""
        try:
            # Random endpoint selection
            endpoint = self._select_endpoint()
            
            # Add think time
            await asyncio.sleep(self.config.think_time)
            
            # Make request (simplified - in real implementation use aiohttp)
            start_time = time.time()
            
            # Simulate request
            await asyncio.sleep(0.1)  # Simulate network delay
            
            response_time = time.time() - start_time
            
            # Create metric
            metric = PerformanceMetric(
                timestamp=datetime.now(),
                response_time=response_time,
                status_code=200
            )
            
            # Get system metrics
            latest_system = self.monitor.get_latest_metrics()
            if latest_system:
                metric.cpu_usage = latest_system.cpu_usage
                metric.memory_usage = latest_system.memory_usage
            
            self.results.append(metric)
            
        except Exception as e:
            # Handle request failure
            metric = PerformanceMetric(
                timestamp=datetime.now(),
                response_time=self.config.timeout,
                status_code=500
            )
            self.results.append(metric)
            logger.warning(f"Request failed: {e}")
    
    def _select_endpoint(self) -> str:
        """Select random endpoint from configuration"""
        if not self.config.endpoints:
            return "/"
        return self.config.endpoints[hash(str(time.time())) % len(self.config.endpoints)]
    
    def _calculate_results(self, start_time: datetime, end_time: datetime) -> PerformanceTestResult:
        """Calculate test results"""
        total_duration = (end_time - start_time).total_seconds()
        
        # Filter successful requests
        successful_results = [r for r in self.results if r.status_code < 400]
        failed_results = [r for r in self.results if r.status_code >= 400]
        
        response_times = [r.response_time for r in successful_results]
        
        # Calculate throughput over time
        throughput_data = []
        error_rates = []
        
        # Group results by second
        second_groups = {}
        for result in self.results:
            second_key = int(result.timestamp.timestamp())
            if second_key not in second_groups:
                second_groups[second_key] = []
            second_groups[second_key].append(result)
        
        for second in sorted(second_groups.keys()):
            group = second_groups[second]
            throughput = len(group)
            errors = len([r for r in group if r.status_code >= 400])
            error_rate = errors / len(group) * 100 if group else 0
            
            throughput_data.append(throughput)
            error_rates.append(error_rate)
        
        # Get system resource summary
        resource_summary = self.monitor.get_average_metrics()
        
        return PerformanceTestResult(
            config=self.config,
            start_time=start_time,
            end_time=end_time,
            total_requests=len(self.results),
            successful_requests=len(successful_results),
            failed_requests=len(failed_results),
            response_times=response_times,
            throughput_data=throughput_data,
            error_rates=error_rates,
            resource_usage=self.results,
            summary={
                "total_duration": total_duration,
                "avg_response_time": statistics.mean(response_times) if response_times else 0,
                "median_response_time": statistics.median(response_times) if response_times else 0,
                "p95_response_time": statistics.quantiles(response_times, n=20)[18] if len(response_times) > 10 else 0,
                "p99_response_time": statistics.quantiles(response_times, n=100)[98] if len(response_times) > 50 else 0,
                "max_response_time": max(response_times) if response_times else 0,
                "min_response_time": min(response_times) if response_times else 0,
                "avg_throughput": statistics.mean(throughput_data) if throughput_data else 0,
                "max_throughput": max(throughput_data) if throughput_data else 0,
                "avg_error_rate": statistics.mean(error_rates) if error_rates else 0,
                "max_error_rate": max(error_rates) if error_rates else 0,
                "success_rate": len(successful_results) / len(self.results) * 100 if self.results else 0,
                **resource_summary
            }
        )


class PerformanceTestReporter:
    """Generate performance test reports"""
    
    @staticmethod
    def generate_html_report(result: PerformanceTestResult, output_file: str):
        """Generate HTML performance report"""
        summary = result.summary
        
        html_content = f"""
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>تقرير اختبار الأداء - {result.config.name}</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: #f5f5f5;
                    direction: rtl;
                }}
                .container {{
                    max-width: 1200px;
                    margin: 0 auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                }}
                h1 {{
                    color: #2c3e50;
                    text-align: center;
                    border-bottom: 3px solid #3498db;
                    padding-bottom: 10px;
                }}
                h2 {{
                    color: #34495e;
                    margin-top: 30px;
                }}
                .metric-grid {{
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 20px;
                    margin: 20px 0;
                }}
                .metric-card {{
                    background: #ecf0f1;
                    padding: 20px;
                    border-radius: 8px;
                    border-left: 4px solid #3498db;
                }}
                .metric-value {{
                    font-size: 2em;
                    font-weight: bold;
                    color: #2c3e50;
                }}
                .metric-label {{
                    color: #7f8c8d;
                    margin-top: 5px;
                }}
                .success {{
                    border-left-color: #27ae60;
                }}
                .warning {{
                    border-left-color: #f39c12;
                }}
                .error {{
                    border-left-color: #e74c3c;
                }}
                .status-pass {{ color: #27ae60; }}
                .status-fail {{ color: #e74c3c; }}
                .chart-placeholder {{
                    background: #bdc3c7;
                    height: 300px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #7f8c8d;
                    margin: 20px 0;
                }}
                table {{
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }}
                th, td {{
                    padding: 12px;
                    text-align: right;
                    border-bottom: 1px solid #ddd;
                }}
                th {{
                    background-color: #34495e;
                    color: white;
                }}
                .progress-bar {{
                    background: #ecf0f1;
                    border-radius: 10px;
                    overflow: hidden;
                    height: 20px;
                    margin: 10px 0;
                }}
                .progress-fill {{
                    height: 100%;
                    background: linear-gradient(90deg, #3498db, #2ecc71);
                    transition: width 0.3s ease;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 تقرير اختبار الأداء المتقدم</h1>
                
                <h2>📊 معلومات الاختبار</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">{result.config.name}</div>
                        <div class="metric-label">اسم الاختبار</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{result.config.test_type}</div>
                        <div class="metric-label">نوع الاختبار</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{result.config.duration}s</div>
                        <div class="metric-label">مدة الاختبار</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{result.config.target_rps} RPS</div>
                        <div class="metric-label">الهدف المطلوب</div>
                    </div>
                </div>
                
                <h2>📈 نتائج الأداء</h2>
                <div class="metric-grid">
                    <div class="metric-card {'success' if summary['success_rate'] > 95 else 'warning' if summary['success_rate'] > 90 else 'error'}">
                        <div class="metric-value">{summary['success_rate']:.1f}%</div>
                        <div class="metric-label">معدل النجاح</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary['avg_response_time']:.3f}s</div>
                        <div class="metric-label">متوسط زمن الاستجابة</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary['p95_response_time']:.3f}s</div>
                        <div class="metric-label">زمن الاستجابة P95</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary['avg_throughput']:.1f}</div>
                        <div class="metric-label">متوسط throughput (طلب/ثانية)</div>
                    </div>
                </div>
                
                <h2>💻 استخدام الموارد</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">{summary.get('avg_cpu_usage', 0):.1f}%</div>
                        <div class="metric-label">متوسط استخدام المعالج</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary.get('max_cpu_usage', 0):.1f}%</div>
                        <div class="metric-label">أقصى استخدام للمعالج</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary.get('avg_memory_usage', 0):.1f}%</div>
                        <div class="metric-label">متوسط استخدام الذاكرة</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">{summary.get('max_connections', 0)}</div>
                        <div class="metric-label">أقصى اتصالات نشطة</div>
                    </div>
                </div>
                
                <h2>📊 إحصائيات مفصلة</h2>
                <table>
                    <thead>
                        <tr>
                            <th>المقياس</th>
                            <th>القيمة</th>
                            <th>التقييم</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>إجمالي الطلبات</td>
                            <td>{result.total_requests:,}</td>
                            <td>-</td>
                        </tr>
                        <tr>
                            <td>الطلبات الناجحة</td>
                            <td>{result.successful_requests:,}</td>
                            <td><span class="status-pass">✅ جيد</span></td>
                        </tr>
                        <tr>
                            <td>الطلبات الفاشلة</td>
                            <td>{result.failed_requests:,}</td>
                            <td>{'<span class="status-fail">❌ يحتاج مراجعة</span>' if result.failed_requests > result.total_requests * 0.05 else '<span class="status-pass">✅ مقبول</span>'}</td>
                        </tr>
                        <tr>
                            <td>زمن الاستجابة الأدنى</td>
                            <td>{summary.get('min_response_time', 0):.3f}s</td>
                            <td><span class="status-pass">✅ ممتاز</span></td>
                        </tr>
                        <tr>
                            <td>زمن الاستجابة الأقصى</td>
                            <td>{summary.get('max_response_time', 0):.3f}s</td>
                            <td>{'<span class="status-fail">❌ بطيء</span>' if summary.get('max_response_time', 0) > 5 else '<span class="status-pass">✅ مقبول</span>'}</td>
                        </tr>
                        <tr>
                            <td>زمن الاستجابة المتوسط</td>
                            <td>{summary['avg_response_time']:.3f}s</td>
                            <td>{'<span class="status-pass">✅ ممتاز</span>' if summary['avg_response_time'] < 0.5 else '<span class="status-fail">❌ بطيء</span>' if summary['avg_response_time'] > 2 else '<span class="status-pass">✅ جيد</span>'}</td>
                        </tr>
                        <tr>
                            <td>متوسط معدل الأخطاء</td>
                            <td>{summary.get('avg_error_rate', 0):.2f}%</td>
                            <td>{'<span class="status-pass">✅ ممتاز</span>' if summary.get('avg_error_rate', 0) < 1 else '<span class="status-fail">❌ عالي</span>'}</td>
                        </tr>
                    </tbody>
                </table>
                
                <h2>🎯 التوصيات</h2>
                <div class="metric-card">
                    <h3>التحسينات المقترحة:</h3>
                    <ul>
                        {'<li>🎯 الأداء ممتاز - لا توجد تحسينات مطلوبة</li>' if summary['success_rate'] > 95 and summary['avg_response_time'] < 0.5 else ''}
                        {'<li>⚡ تحسين وقت الاستجابة - فكر في تحسين الخادم أو إضافة caching</li>' if summary['avg_response_time'] > 0.5 else ''}
                        {'<li>🛠️ مراجعة معدل الأخطاء - تحقق من صحة الخدمات</li>' if summary.get('avg_error_rate', 0) > 1 else ''}
                        {'<li>📈 زيادة الحمولة تدريجياً - النظام يبدو مستقراً</li>' if summary['success_rate'] > 90 and summary['avg_response_time'] < 1 else ''}
                        {'<li>💾 مراقبة استخدام الذاكرة - قد تحتاج تحسين في استهلاك الذاكرة</li>' if summary.get('avg_memory_usage', 0) > 80 else ''}
                    </ul>
                </div>
                
                <div style="margin-top: 40px; padding: 20px; background: #ecf0f1; border-radius: 8px; text-align: center;">
                    <p><strong>تم إنشاء التقرير في:</strong> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                    <p><strong>مدة الاختبار:</strong> {result.start_time.strftime('%H:%M:%S')} - {result.end_time.strftime('%H:%M:%S')}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"📊 تم إنشاء تقرير الأداء: {output_file}")
    
    @staticmethod
    def generate_json_report(result: PerformanceTestResult, output_file: str):
        """Generate JSON performance report"""
        report_data = {
            "test_info": {
                "name": result.config.name,
                "type": result.config.test_type,
                "start_time": result.start_time.isoformat(),
                "end_time": result.end_time.isoformat(),
                "duration_seconds": (result.end_time - result.start_time).total_seconds()
            },
            "summary": result.summary,
            "metrics": {
                "total_requests": result.total_requests,
                "successful_requests": result.successful_requests,
                "failed_requests": result.failed_requests,
                "response_times": result.response_times,
                "throughput_data": result.throughput_data,
                "error_rates": result.error_rates
            }
        }
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"📊 تم إنشاء تقرير JSON: {output_file}")


# Performance test configurations
LOAD_TEST_CONFIG = PerformanceTestConfig(
    name="اختبار الحمولة الأساسي",
    target_url="http://localhost:8000",
    test_type="load",
    duration=120,  # 2 minutes
    ramp_up_time=30,  # 30 seconds
    target_rps=50,
    concurrent_users=20,
    endpoints=[
        "/api/health",
        "/api/leads",
        "/api/messages",
        "/api/analytics"
    ],
    headers={
        "User-Agent": "Saler-PerformanceTest/1.0"
    }
)

STRESS_TEST_CONFIG = PerformanceTestConfig(
    name="اختبار الإجهاد",
    target_url="http://localhost:8000",
    test_type="stress",
    duration=180,  # 3 minutes
    ramp_up_time=60,
    target_rps=100,
    concurrent_users=50,
    endpoints=[
        "/api/health",
        "/api/leads",
        "/api/messages",
        "/api/analytics",
        "/api/auth/login"
    ]
)

ENDURANCE_TEST_CONFIG = PerformanceTestConfig(
    name="اختبار التحمل",
    target_url="http://localhost:8000",
    test_type="endurance",
    duration=600,  # 10 minutes
    ramp_up_time=60,
    target_rps=20,
    concurrent_users=10,
    endpoints=[
        "/api/health",
        "/api/leads"
    ]
)


async def run_performance_tests():
    """Run all performance tests"""
    logger.info("🚀 بدء اختبارات الأداء الشاملة")
    
    tests = [LOAD_TEST_CONFIG, STRESS_TEST_CONFIG]
    
    for config in tests:
        try:
            executor = LoadTestExecutor(config)
            result = await executor.run_load_test()
            
            # Generate reports
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            
            PerformanceTestReporter.generate_html_report(
                result, 
                f"/workspace/saler/test-results/performance-{config.test_type}-{timestamp}.html"
            )
            
            PerformanceTestReporter.generate_json_report(
                result,
                f"/workspace/saler/test-results/performance-{config.test_type}-{timestamp}.json"
            )
            
        except Exception as e:
            logger.error(f"❌ خطأ في اختبار {config.name}: {e}")
    
    logger.info("✅ انتهت اختبارات الأداء")


if __name__ == "__main__":
    asyncio.run(run_performance_tests())