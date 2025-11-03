#!/usr/bin/env python3
"""
System Health Checks - فحوصات صحة النظام
يتحقق من حالة مختلف مكونات النظام
"""

import requests
import psutil
import redis
import sqlite3
import json
import time
import logging
from datetime import datetime
from typing import Dict, List, Any
import subprocess
import socket

class SystemHealthChecker:
    """فحص صحة النظام الشامل"""
    
    def __init__(self, config_path: str = 'config.json'):
        self.config = self.load_config(config_path)
        self.logger = logging.getLogger(__name__)
        self.setup_logging()
        
    def load_config(self, config_path: str) -> Dict:
        """تحميل ملف الإعدادات"""
        try:
            with open(config_path, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return self.get_default_config()
    
    def get_default_config(self) -> Dict:
        """الإعدادات الافتراضية"""
        return {
            "thresholds": {
                "cpu_usage": 80,
                "memory_usage": 85,
                "disk_usage": 90,
                "response_time": 5.0
            },
            "services": {
                "backend": "http://localhost:8000/health",
                "frontend": "http://localhost:3000/api/health",
                "database": "postgresql://localhost:5432/saler",
                "redis": "redis://localhost:6379"
            }
        }
    
    def setup_logging(self):
        """إعداد نظام السجلات"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('health_checks.log'),
                logging.StreamHandler()
            ]
        )
    
    def check_system_resources(self) -> Dict[str, Any]:
        """فحص موارد النظام"""
        results = {
            "timestamp": datetime.now().isoformat(),
            "checks": {}
        }
        
        # فحص المعالج
        try:
            cpu_usage = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            load_avg = psutil.getloadavg() if hasattr(psutil, 'getloadavg') else [0, 0, 0]
            
            results["checks"]["cpu"] = {
                "status": "healthy" if cpu_usage < self.config["thresholds"]["cpu_usage"] else "warning",
                "usage_percent": cpu_usage,
                "count": cpu_count,
                "load_average": load_avg,
                "threshold": self.config["thresholds"]["cpu_usage"]
            }
        except Exception as e:
            results["checks"]["cpu"] = {"status": "error", "error": str(e)}
        
        # فحص الذاكرة
        try:
            memory = psutil.virtual_memory()
            results["checks"]["memory"] = {
                "status": "healthy" if memory.percent < self.config["thresholds"]["memory_usage"] else "warning",
                "usage_percent": memory.percent,
                "total_gb": round(memory.total / (1024**3), 2),
                "available_gb": round(memory.available / (1024**3), 2),
                "used_gb": round(memory.used / (1024**3), 2),
                "threshold": self.config["thresholds"]["memory_usage"]
            }
        except Exception as e:
            results["checks"]["memory"] = {"status": "error", "error": str(e)}
        
        # فحص القرص
        try:
            disk_usage = {}
            for partition in psutil.disk_partitions():
                try:
                    usage = psutil.disk_usage(partition.mountpoint)
                    disk_usage[partition.mountpoint] = {
                        "status": "healthy" if usage.percent < self.config["thresholds"]["disk_usage"] else "warning",
                        "usage_percent": usage.percent,
                        "total_gb": round(usage.total / (1024**3), 2),
                        "free_gb": round(usage.free / (1024**3), 2),
                        "used_gb": round(usage.used / (1024**3), 2),
                        "threshold": self.config["thresholds"]["disk_usage"]
                    }
                except PermissionError:
                    continue
            
            results["checks"]["disk"] = disk_usage
        except Exception as e:
            results["checks"]["disk"] = {"status": "error", "error": str(e)}
        
        # فحص الشبكة
        try:
            network_io = psutil.net_io_counters()
            results["checks"]["network"] = {
                "status": "healthy",
                "bytes_sent": network_io.bytes_sent,
                "bytes_recv": network_io.bytes_recv,
                "packets_sent": network_io.packets_sent,
                "packets_recv": network_io.packets_recv
            }
        except Exception as e:
            results["checks"]["network"] = {"status": "error", "error": str(e)}
        
        return results
    
    def check_service_health(self, service_name: str, url: str) -> Dict[str, Any]:
        """فحص صحة خدمة"""
        try:
            start_time = time.time()
            response = requests.get(url, timeout=10)
            response_time = time.time() - start_time
            
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "response_code": response.status_code,
                "response_time": round(response_time, 3),
                "threshold": self.config["thresholds"]["response_time"],
                "message": response.text if response.status_code == 200 else f"HTTP {response.status_code}"
            }
        except requests.exceptions.Timeout:
            return {"status": "timeout", "error": "Request timeout"}
        except requests.exceptions.ConnectionError:
            return {"status": "connection_error", "error": "Cannot connect to service"}
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def check_database_connection(self, connection_string: str) -> Dict[str, Any]:
        """فحص اتصال قاعدة البيانات"""
        try:
            # PostgreSQL
            if "postgresql" in connection_string:
                import psycopg2
                conn = psycopg2.connect(connection_string)
                cursor = conn.cursor()
                cursor.execute("SELECT version();")
                version = cursor.fetchone()
                cursor.execute("SELECT count(*) FROM information_schema.tables;")
                table_count = cursor.fetchone()[0]
                conn.close()
                
                return {
                    "status": "healthy",
                    "type": "postgresql",
                    "version": version[0] if version else "Unknown",
                    "table_count": table_count
                }
        except Exception as e:
            return {"status": "error", "error": str(e)}
        
        return {"status": "unsupported", "error": "Unsupported database type"}
    
    def check_redis_connection(self, redis_url: str) -> Dict[str, Any]:
        """فحص اتصال Redis"""
        try:
            r = redis.from_url(redis_url)
            info = r.info()
            
            return {
                "status": "healthy",
                "version": info.get("redis_version", "Unknown"),
                "connected_clients": info.get("connected_clients", 0),
                "used_memory": info.get("used_memory", 0),
                "used_memory_human": info.get("used_memory_human", "0B")
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    def check_port_connectivity(self, host: str, port: int, timeout: int = 5) -> bool:
        """فحص اتصال منفذ معين"""
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            return result == 0
        except Exception:
            return False
    
    def run_comprehensive_health_check(self) -> Dict[str, Any]:
        """تشغيل فحص صحة شامل"""
        self.logger.info("بدء الفحص الشامل لصحة النظام...")
        
        results = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "healthy",
            "checks": {}
        }
        
        # فحص موارد النظام
        results["checks"]["system_resources"] = self.check_system_resources()
        
        # فحص الخدمات
        for service_name, url in self.config["services"].items():
            if service_name == "database":
                results["checks"]["services"] = results["checks"].get("services", {})
                results["checks"]["services"][service_name] = self.check_database_connection(url)
            elif service_name == "redis":
                results["checks"]["services"] = results["checks"].get("services", {})
                results["checks"]["services"][service_name] = self.check_redis_connection(url)
            else:
                results["checks"]["services"] = results["checks"].get("services", {})
                results["checks"]["services"][service_name] = self.check_service_health(service_name, url)
        
        # فحص المنافذ المهمة
        ports_to_check = [80, 443, 8000, 3000, 5432, 6379]
        port_status = {}
        for port in ports_to_check:
            host = "localhost" if port in [8000, 3000] else "0.0.0.0"
            port_status[f"port_{port}"] = self.check_port_connectivity(host, port)
        
        results["checks"]["port_connectivity"] = port_status
        
        # تحديد الحالة العامة
        all_checks = []
        for category, check_results in results["checks"].items():
            if isinstance(check_results, dict):
                for check_name, check_result in check_results.items():
                    if isinstance(check_result, dict) and "status" in check_result:
                        all_checks.append(check_result["status"])
                    elif isinstance(check_result, dict) and "usage_percent" in check_result:
                        all_checks.append(check_result["status"])
        
        if "error" in all_checks:
            results["overall_status"] = "error"
        elif "unhealthy" in all_checks or "warning" in all_checks:
            results["overall_status"] = "unhealthy"
        else:
            results["overall_status"] = "healthy"
        
        self.logger.info(f"انتهاء الفحص - الحالة العامة: {results['overall_status']}")
        
        return results
    
    def save_health_report(self, results: Dict[str, Any], filepath: str = "health_report.json"):
        """حفظ تقرير الفحص"""
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        self.logger.info(f"تم حفظ تقرير الفحص في: {filepath}")
    
    def export_metrics_prometheus(self, results: Dict[str, Any]) -> str:
        """تصدير الميتريكس بصيغة Prometheus"""
        metrics = []
        
        # معلومات النظام
        if "system_resources" in results and "checks" in results["system_resources"]:
            checks = results["system_resources"]["checks"]
            
            if "cpu" in checks:
                metrics.append(f'system_cpu_usage_percent {checks["cpu"]["usage_percent"]}')
            
            if "memory" in checks:
                metrics.append(f'system_memory_usage_percent {checks["memory"]["usage_percent"]}')
            
            if "disk" in checks:
                for mountpoint, disk_info in checks["disk"].items():
                    if isinstance(disk_info, dict):
                        metrics.append(f'system_disk_usage_percent{{mountpoint="{mountpoint}"}} {disk_info["usage_percent"]}')
        
        # حالة الخدمات
        if "services" in results:
            for service, service_result in results["services"].items():
                if isinstance(service_result, dict):
                    status_value = 1 if service_result.get("status") == "healthy" else 0
                    metrics.append(f'service_health_status{{service="{service}"}} {status_value}')
        
        return "\n".join(metrics)

def main():
    """الدالة الرئيسية"""
    checker = SystemHealthChecker()
    
    try:
        # تشغيل الفحص الشامل
        health_results = checker.run_comprehensive_health_check()
        
        # عرض النتائج
        print("\n=== تقرير فحص صحة النظام ===")
        print(f"الوقت: {health_results['timestamp']}")
        print(f"الحالة العامة: {health_results['overall_status']}")
        
        # عرض تفاصيل الفحوصات
        for category, results in health_results["checks"].items():
            print(f"\n--- {category} ---")
            if isinstance(results, dict):
                for key, value in results.items():
                    if isinstance(value, dict):
                        print(f"{key}: {value.get('status', 'unknown')}")
                        if "usage_percent" in value:
                            print(f"  استخدام: {value['usage_percent']}%")
                    else:
                        print(f"{key}: {value}")
        
        # حفظ التقرير
        checker.save_health_report(health_results)
        
        # تصدير الميتريكس
        prometheus_metrics = checker.export_metrics_prometheus(health_results)
        with open("health_metrics.prometheus", "w") as f:
            f.write(prometheus_metrics)
        
        print(f"\nتم حفظ الميتريكس في: health_metrics.prometheus")
        
        # إرجاع كود مناسب
        return 0 if health_results["overall_status"] == "healthy" else 1
        
    except Exception as e:
        print(f"خطأ في فحص صحة النظام: {e}")
        return 2

if __name__ == "__main__":
    exit(main())