#!/usr/bin/env python3
"""
نظام تقرير الأداء الشامل - Comprehensive Performance Report System
إنتاج تقارير تفصيلية عن أداء النظام والتطبيقات
"""

import json
import time
import logging
import requests
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from datetime import datetime, timedelta
from dataclasses import dataclass, asdict
from typing import List, Dict, Any, Optional
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import argparse
import os
import sys
from pathlib import Path

# إعداد Flask للإنشاء التفاعلي
plt.style.use('seaborn-v0_8')
sns.set_palette("husl")

# إعداد السجلات
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetrics:
    """مقاييس الأداء"""
    service_name: str
    response_time_p50: float
    response_time_p95: float
    response_time_p99: float
    throughput_rps: float
    error_rate: float
    cpu_usage: float
    memory_usage: float
    disk_usage: float
    network_io: float
    timestamp: str

@dataclass
class BusinessMetrics:
    """مقاييس الأعمال"""
    total_users: int
    active_users: int
    new_signups: int
    conversion_rate: float
    revenue: float
    orders_count: int
    average_order_value: float
    customer_satisfaction: float
    timestamp: str

class PerformanceReporter:
    """فئة تقرير الأداء"""
    
    def __init__(self, config_file: str = "performance_config.json"):
        self.config_file = config_file
        self.config = self.load_config()
        self.prometheus_url = self.config.get('prometheus_url', 'http://localhost:9090')
        self.output_dir = Path("reports")
        self.output_dir.mkdir(exist_ok=True)
        
    def load_config(self) -> Dict[str, Any]:
        """تحميل ملف التكوين"""
        try:
            with open(self.config_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            return self.create_default_config()
    
    def create_default_config(self) -> Dict[str, Any]:
        """إنشاء تكوين افتراضي"""
        default_config = {
            'prometheus_url': 'http://localhost:9090',
            'services': [
                {'name': 'saler-api', 'port': 8080},
                {'name': 'saler-frontend', 'port': 3000},
                {'name': 'redis', 'port': 6379},
                {'name': 'postgres', 'port': 5432}
            ],
            'thresholds': {
                'response_time_p95': 500,  # milliseconds
                'error_rate': 5,  # percent
                'cpu_usage': 80,  # percent
                'memory_usage': 85,  # percent
                'disk_usage': 90  # percent
            },
            'email': {
                'smtp_server': 'localhost',
                'smtp_port': 587,
                'username': '',
                'password': '',
                'to_addresses': [],
                'from_address': 'reports@saler.com'
            }
        }
        
        with open(self.config_file, 'w', encoding='utf-8') as f:
            json.dump(default_config, f, indent=2, ensure_ascii=False)
        
        return default_config
    
    def collect_metrics(self, duration_hours: int = 24) -> List[PerformanceMetrics]:
        """جمع المقاييس من Prometheus"""
        logger.info(f"جمع المقاييس للـ {duration_hours} ساعة الماضية")
        
        end_time = datetime.now()
        start_time = end_time - timedelta(hours=duration_hours)
        
        metrics = []
        
        for service in self.config['services']:
            service_name = service['name']
            
            try:
                # جمع مقاييس الوقت
                response_times = self.query_prometheus(
                    f"histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{{job=\"{service_name}\"}}[{duration_hours}h])) by (le)) * 1000",
                    start_time, end_time
                )
                
                # جمع مقاييس الإنتاجية
                throughput = self.query_prometheus(
                    f"sum(rate(http_requests_total{{job=\"{service_name}\"}}[{duration_hours}h]))",
                    start_time, end_time
                )
                
                # جمع معدل الأخطاء
                error_rate = self.query_prometheus(
                    f"sum(rate(http_requests_total{{job=\"{service_name}\",status=~\"5..\"}}[{duration_hours}h])) / sum(rate(http_requests_total{{job=\"{service_name}\"}}[{duration_hours}h])) * 100",
                    start_time, end_time
                )
                
                # جمع مقاييس الموارد
                cpu_usage = self.query_prometheus(
                    f"avg by (instance) (rate(process_cpu_seconds_total{{job=\"{service_name}\"}}[{duration_hours}h])) * 100",
                    start_time, end_time
                )
                
                memory_usage = self.query_prometheus(
                    f"avg by (instance) (process_resident_memory_bytes{{job=\"{service_name}\"}}) / (1024*1024*1024)",
                    start_time, end_time
                )
                
                # إنشاء كائن المقاييس
                metric = PerformanceMetrics(
                    service_name=service_name,
                    response_time_p50=response_times.get('p50', 0),
                    response_time_p95=response_times.get('p95', 0),
                    response_time_p99=response_times.get('p99', 0),
                    throughput_rps=throughput.get('avg', 0),
                    error_rate=error_rate.get('avg', 0),
                    cpu_usage=cpu_usage.get('avg', 0),
                    memory_usage=memory_usage.get('avg', 0),
                    disk_usage=0,  # يتم جمعه من مصدر آخر
                    network_io=0,  # يتم جمعه من مصدر آخر
                    timestamp=datetime.now().isoformat()
                )
                
                metrics.append(metric)
                logger.info(f"تم جمع مقاييس {service_name}")
                
            except Exception as e:
                logger.error(f"خطأ في جمع مقاييس {service_name}: {e}")
        
        return metrics
    
    def query_prometheus(self, query: str, start_time: datetime, end_time: datetime) -> Dict[str, float]:
        """تنفيذ استعلام Prometheus"""
        url = f"{self.prometheus_url}/api/v1/query_range"
        
        params = {
            'query': query,
            'start': start_time.isoformat(),
            'end': end_time.isoformat(),
            'step': '300s'  # 5 دقائق
        }
        
        response = requests.get(url, params=params, timeout=30)
        response.raise_for_status()
        
        data = response.json()
        
        if data['status'] == 'success' and data['data']['result']:
            values = [float(v[1]) for v in data['data']['result'][0]['values'] if v[1] != 'NaN']
            
            if values:
                return {
                    'avg': sum(values) / len(values),
                    'min': min(values),
                    'max': max(values),
                    'p50': sorted(values)[len(values)//2],
                    'p95': sorted(values)[int(len(values) * 0.95)],
                    'p99': sorted(values)[int(len(values) * 0.99)]
                }
        
        return {}
    
    def generate_performance_charts(self, metrics: List[PerformanceMetrics]) -> Dict[str, str]:
        """إنشاء رسوم بيانية للأداء"""
        logger.info("إنشاء الرسوم البيانية للأداء")
        
        chart_files = {}
        
        # رسم بياني لاستجابة الخدمات
        fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
        fig.suptitle('تقرير الأداء الشامل - شركة سالير', fontsize=16, fontweight='bold')
        
        services = [m.service_name for m in metrics]
        
        # أوقات الاستجابة
        ax1.bar(services, [m.response_time_p95 for m in metrics], color='skyblue')
        ax1.set_title('أوقات الاستجابة P95')
        ax1.set_ylabel('الوقت (ms)')
        ax1.tick_params(axis='x', rotation=45)
        
        # معدلات الأخطاء
        ax2.bar(services, [m.error_rate for m in metrics], color='salmon')
        ax2.set_title('معدلات الأخطاء')
        ax2.set_ylabel('النسبة (%)')
        ax2.tick_params(axis='x', rotation=45)
        
        # استخدام المعالج
        ax3.bar(services, [m.cpu_usage for m in metrics], color='lightgreen')
        ax3.set_title('استخدام المعالج')
        ax3.set_ylabel('النسبة (%)')
        ax3.tick_params(axis='x', rotation=45)
        
        # استخدام الذاكرة
        ax4.bar(services, [m.memory_usage for m in metrics], color='orange')
        ax4.set_title('استخدام الذاكرة')
        ax4.set_ylabel('GB')
        ax4.tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        chart_file = self.output_dir / 'performance_overview.png'
        plt.savefig(chart_file, dpi=300, bbox_inches='tight')
        plt.close()
        
        chart_files['overview'] = str(chart_file)
        
        # رسم بياني للإتجاهات الزمنية
        self.create_trend_chart(metrics)
        chart_files['trends'] = str(self.output_dir / 'performance_trends.png')
        
        return chart_files
    
    def create_trend_chart(self, metrics: List[PerformanceMetrics]):
        """إنشاء رسم بياني للإتجاهات الزمنية"""
        fig, axes = plt.subplots(2, 2, figsize=(15, 10))
        fig.suptitle('إتجاهات الأداء الزمنية', fontsize=16, fontweight='bold')
        
        # بيانات تجريبية للعرض
        time_range = pd.date_range(start='2024-01-01', periods=24, freq='H')
        
        for i, (ax, metric_name) in enumerate(zip(axes.flat, ['response_time_p95', 'error_rate', 'cpu_usage', 'memory_usage'])):
            for metric in metrics:
                values = pd.Series(
                    [getattr(metric, metric_name) + (hash(metric.service_name) % 50) / 10 for _ in range(24)],
                    index=time_range
                )
                ax.plot(values.index, values.values, label=metric.service_name, marker='o', markersize=3)
            
            ax.set_title(metric_name.replace('_', ' ').title())
            ax.set_xlabel('الوقت')
            ax.set_ylabel('القيمة')
            ax.legend()
            ax.grid(True, alpha=0.3)
        
        plt.tight_layout()
        chart_file = self.output_dir / 'performance_trends.png'
        plt.savefig(chart_file, dpi=300, bbox_inches='tight')
        plt.close()
    
    def generate_html_report(self, metrics: List[PerformanceMetrics], 
                           business_metrics: Optional[BusinessMetrics],
                           chart_files: Dict[str, str]) -> str:
        """إنشاء تقرير HTML"""
        logger.info("إنشاء تقرير HTML")
        
        html_content = f"""
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تقرير الأداء - شركة سالير</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }}
        .content {{ padding: 30px; }}
        .metrics-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .metric-card {{ background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff; }}
        .metric-title {{ font-size: 14px; color: #666; margin-bottom: 5px; }}
        .metric-value {{ font-size: 24px; font-weight: bold; color: #333; }}
        .chart-container {{ text-align: center; margin: 30px 0; }}
        .chart-container img {{ max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }}
        .summary {{ background: #e9ecef; padding: 20px; border-radius: 8px; margin: 20px 0; }}
        .status-good {{ color: #28a745; }}
        .status-warning {{ color: #ffc107; }}
        .status-critical {{ color: #dc3545; }}
        .table-container {{ overflow-x: auto; margin: 20px 0; }}
        table {{ width: 100%; border-collapse: collapse; }}
        th, td {{ padding: 12px; text-align: right; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #f8f9fa; font-weight: bold; }}
        .footer {{ background: #343a40; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>تقرير الأداء الشامل</h1>
            <h2>شركة سالير</h2>
            <p>تاريخ التقرير: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <h3>ملخص تنفيذي</h3>
                <p>يعرض هذا التقرير حالة الأداء الشاملة لخدمات شركة سالير خلال الفترة الزمنية المحددة.</p>
            </div>
            
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-title">عدد الخدمات المراقبة</div>
                    <div class="metric-value">{len(metrics)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">متوسط أوقات الاستجابة</div>
                    <div class="metric-value">{sum(m.response_time_p95 for m in metrics) / len(metrics):.1f} ms</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">متوسط معدل الأخطاء</div>
                    <div class="metric-value">{sum(m.error_rate for m in metrics) / len(metrics):.2f}%</div>
                </div>
                <div class="metric-card">
                    <div class="metric-title">إجمالي الإنتاجية</div>
                    <div class="metric-value">{sum(m.throughput_rps for m in metrics):.1f} RPS</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>نظرة عامة على الأداء</h3>
                <img src="{chart_files.get('overview', '')}" alt="نظرة عامة على الأداء">
            </div>
            
            <div class="chart-container">
                <h3>إتجاهات الأداء الزمنية</h3>
                <img src="{chart_files.get('trends', '')}" alt="إتجاهات الأداء الزمنية">
            </div>
            
            <div class="table-container">
                <h3>تفاصيل المقاييس حسب الخدمة</h3>
                <table>
                    <thead>
                        <tr>
                            <th>الخدمة</th>
                            <th>استجابة P95 (ms)</th>
                            <th>الإنتاجية (RPS)</th>
                            <th>معدل الأخطاء (%)</th>
                            <th>استخدام المعالج (%)</th>
                            <th>استخدام الذاكرة (GB)</th>
                            <th>الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
"""
        
        for metric in metrics:
            status_class = "status-good"
            status_text = "ممتاز"
            
            if metric.response_time_p95 > self.config['thresholds']['response_time_p95']:
                status_class = "status-warning"
                status_text = "يحتاج تحسين"
            
            if metric.error_rate > self.config['thresholds']['error_rate']:
                status_class = "status-critical"
                status_text = "حرج"
            
            html_content += f"""
                        <tr>
                            <td>{metric.service_name}</td>
                            <td>{metric.response_time_p95:.1f}</td>
                            <td>{metric.throughput_rps:.1f}</td>
                            <td>{metric.error_rate:.2f}</td>
                            <td>{metric.cpu_usage:.1f}</td>
                            <td>{metric.memory_usage:.2f}</td>
                            <td class="{status_class}">{status_text}</td>
                        </tr>
            """
        
        html_content += """
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="footer">
            <p>تم إنشاء هذا التقرير بواسطة نظام مراقبة سالير</p>
            <p>للاستفسارات: monitoring@saler.com</p>
        </div>
    </div>
</body>
</html>
        """
        
        report_file = self.output_dir / f"performance_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        with open(report_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return str(report_file)
    
    def send_email_report(self, html_report_path: str, chart_files: Dict[str, str]):
        """إرسال التقرير بالبريد الإلكتروني"""
        if not self.config['email']['to_addresses']:
            logger.warning("لم يتم تحديد عناوين بريد إلكتروني للإرسال")
            return
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = f"تقرير الأداء - شركة سالير - {datetime.now().strftime('%Y-%m-%d')}"
            msg['From'] = self.config['email']['from_address']
            msg['To'] = ', '.join(self.config['email']['to_addresses'])
            
            # إضافة محتوى HTML
            with open(html_report_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
            
            msg.attach(MIMEText(html_content, 'html', 'utf-8'))
            
            # إضافة الرسوم البيانية
            for chart_name, chart_path in chart_files.items():
                if os.path.exists(chart_path):
                    with open(chart_path, 'rb') as f:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(f.read())
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {chart_name}.png'
                        )
                        msg.attach(part)
            
            # إرسال البريد
            with smtplib.SMTP(self.config['email']['smtp_server'], self.config['email']['smtp_port']) as server:
                if self.config['email']['username']:
                    server.starttls()
                    server.login(self.config['email']['username'], self.config['email']['password'])
                
                server.send_message(msg)
            
            logger.info("تم إرسال التقرير بنجاح")
            
        except Exception as e:
            logger.error(f"خطأ في إرسال التقرير: {e}")
    
    def generate_json_report(self, metrics: List[PerformanceMetrics], 
                           business_metrics: Optional[BusinessMetrics]) -> str:
        """إنشاء تقرير JSON"""
        report_data = {
            'timestamp': datetime.now().isoformat(),
            'report_type': 'performance_report',
            'performance_metrics': [asdict(m) for m in metrics],
            'business_metrics': asdict(business_metrics) if business_metrics else None,
            'summary': {
                'total_services': len(metrics),
                'avg_response_time': sum(m.response_time_p95 for m in metrics) / len(metrics),
                'avg_error_rate': sum(m.error_rate for m in metrics) / len(metrics),
                'total_throughput': sum(m.throughput_rps for m in metrics)
            },
            'thresholds': self.config['thresholds'],
            'generated_by': 'saler-monitoring-system'
        }
        
        json_file = self.output_dir / f"performance_data_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False, default=str)
        
        return str(json_file)
    
    def run_report_generation(self, duration_hours: int = 24, send_email: bool = False):
        """تشغيل عملية إنتاج التقرير"""
        logger.info("بدء إنتاج تقرير الأداء")
        
        try:
            # جمع المقاييس
            performance_metrics = self.collect_metrics(duration_hours)
            
            # إنشاء مقاييس الأعمال التجريبية
            business_metrics = BusinessMetrics(
                total_users=10000,
                active_users=2500,
                new_signups=150,
                conversion_rate=3.2,
                revenue=150000.0,
                orders_count=450,
                average_order_value=333.33,
                customer_satisfaction=4.2,
                timestamp=datetime.now().isoformat()
            )
            
            # إنشاء الرسوم البيانية
            chart_files = self.generate_performance_charts(performance_metrics)
            
            # إنشاء تقرير HTML
            html_report = self.generate_html_report(performance_metrics, business_metrics, chart_files)
            
            # إنشاء تقرير JSON
            json_report = self.generate_json_report(performance_metrics, business_metrics)
            
            # إرسال البريد الإلكتروني إذا كان مطلوباً
            if send_email:
                self.send_email_report(html_report, chart_files)
            
            logger.info("تم إنتاج التقرير بنجاح")
            logger.info(f"تقرير HTML: {html_report}")
            logger.info(f"تقرير JSON: {json_report}")
            
            return {
                'success': True,
                'html_report': html_report,
                'json_report': json_report,
                'charts': chart_files,
                'metrics_count': len(performance_metrics)
            }
            
        except Exception as e:
            logger.error(f"خطأ في إنتاج التقرير: {e}")
            return {'success': False, 'error': str(e)}

def main():
    parser = argparse.ArgumentParser(description='إنتاج تقرير الأداء الشامل لشركة سالير')
    parser.add_argument('--duration', type=int, default=24, help='مدة جمع البيانات بالساعات')
    parser.add_argument('--email', action='store_true', help='إرسال التقرير بالبريد الإلكتروني')
    parser.add_argument('--config', type=str, default='performance_config.json', help='ملف التكوين')
    parser.add_argument('--output', type=str, help='مجلد الإخراج')
    
    args = parser.parse_args()
    
    reporter = PerformanceReporter(args.config)
    
    if args.output:
        reporter.output_dir = Path(args.output)
        reporter.output_dir.mkdir(exist_ok=True)
    
    result = reporter.run_report_generation(args.duration, args.email)
    
    if result['success']:
        print("✅ تم إنتاج التقرير بنجاح!")
        print(f"📊 تقرير HTML: {result['html_report']}")
        print(f"📄 تقرير JSON: {result['json_report']}")
        print(f"📈 عدد المقاييس: {result['metrics_count']}")
    else:
        print(f"❌ فشل في إنتاج التقرير: {result['error']}")
        sys.exit(1)

if __name__ == "__main__":
    main()