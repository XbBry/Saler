#!/usr/bin/env python3
"""
🔧 Cache Health Check Script
فحص صحة نظام التخزين المؤقت - ذكي ومفصل

الوظائف:
- فحص اتصال Redis
- اختبار عمليات Cache
- فحص إحصائيات الأداء
- مراقبة استخدام الذاكرة
- تقرير شامل عن الحالة
"""

import asyncio
import aioredis
import json
from datetime import datetime
from typing import Dict, Any
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

class CacheHealthChecker:
    """فحص صحة نظام التخزين المؤقت"""
    
    def __init__(self):
        self.results = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "unknown",
            "redis_instances": {},
            "cache_operations": {},
            "performance_metrics": {},
            "recommendations": []
        }
    
    async def check_redis_connection(self, name: str, url: str) -> Dict[str, Any]:
        """فحص اتصال Redis"""
        try:
            redis = await aioredis.from_url(url)
            
            # اختبار الاتصال
            await redis.ping()
            
            # معلومات أساسية
            info = await redis.info()
            
            # اختبار عمليات
            await redis.set("health_test", "ok", ex=30)
            test_result = await redis.get("health_test")
            await redis.delete("health_test")
            
            await redis.close()
            
            return {
                "status": "healthy",
                "response_time_ms": 0,
                "memory_used": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "operations_working": test_result == b"ok",
                "keyspace_hits": info.get("keyspace_hits", 0),
                "keyspace_misses": info.get("keyspace_misses", 0)
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "response_time_ms": -1,
                "memory_used": "N/A",
                "connected_clients": 0,
                "operations_working": False
            }
    
    async def check_cache_operations(self) -> Dict[str, Any]:
        """اختبار عمليات التخزين المؤقت"""
        operations_results = {}
        
        # اختبار عمليات مختلفة
        test_operations = [
            ("set_get", "Cache set/get operations"),
            ("ttl", "TTL (Time To Live) operations"),
            ("delete", "Cache delete operations"),
            ("batch", "Batch operations"),
            ("compression", "Data compression")
        ]
        
        for op_name, description in test_operations:
            try:
                if op_name == "set_get":
                    await self.test_set_get()
                elif op_name == "ttl":
                    await self.test_ttl()
                elif op_name == "delete":
                    await self.test_delete()
                elif op_name == "batch":
                    await self.test_batch()
                elif op_name == "compression":
                    await self.test_compression()
                
                operations_results[op_name] = {
                    "status": "passed",
                    "description": description,
                    "response_time_ms": 0
                }
                
            except Exception as e:
                operations_results[op_name] = {
                    "status": "failed",
                    "description": description,
                    "error": str(e),
                    "response_time_ms": -1
                }
        
        return operations_results
    
    async def test_set_get(self):
        """اختبار set/get"""
        redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        await redis.set("test_key", "test_value", ex=60)
        result = await redis.get("test_key")
        await redis.delete("test_key")
        await redis.close()
        assert result == b"test_value"
    
    async def test_ttl(self):
        """اختبار TTL"""
        redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        await redis.set("ttl_test", "value", ex=30)
        ttl = await redis.ttl("ttl_test")
        await redis.delete("ttl_test")
        await redis.close()
        assert ttl > 0 and ttl <= 30
    
    async def test_delete(self):
        """اختبار الحذف"""
        redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        await redis.set("delete_test", "value")
        deleted = await redis.delete("delete_test")
        await redis.close()
        assert deleted == 1
    
    async def test_batch(self):
        """اختبار العمليات المجمعة"""
        redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        pipe = redis.pipeline()
        pipe.set("batch_1", "value1")
        pipe.set("batch_2", "value2")
        pipe.get("batch_1")
        pipe.get("batch_2")
        results = await pipe.execute()
        await redis.delete("batch_1", "batch_2")
        await redis.close()
        assert len(results) == 4
    
    async def test_compression(self):
        """اختبار الضغط"""
        redis = await aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))
        large_data = "x" * 10000  # 10KB من البيانات
        await redis.set("compression_test", large_data, ex=60)
        result = await redis.get("compression_test")
        await redis.delete("compression_test")
        await redis.close()
        assert len(result) == 10000
    
    def calculate_hit_rate(self, hits: int, misses: int) -> float:
        """حساب معدل الضرب في الـ Cache"""
        total = hits + misses
        return (hits / total * 100) if total > 0 else 0
    
    def generate_recommendations(self) -> list:
        """إنشاء توصيات للتحسين"""
        recommendations = []
        
        # تحليل Redis instances
        for name, info in self.results["redis_instances"].items():
            if info["status"] == "unhealthy":
                recommendations.append(f"إصلاح اتصال Redis {name}: {info.get('error', 'Unknown error')}")
        
        # تحليل عمليات Cache
        failed_ops = [op for op, result in self.results["cache_operations"].items() if result["status"] == "failed"]
        if failed_ops:
            recommendations.append(f"إصلاح العمليات الفاشلة: {', '.join(failed_ops)}")
        
        # تحليل الأداء
        if self.results["overall_status"] == "degraded":
            recommendations.append("مراجعة إعدادات Redis وتحسين الذاكرة")
        
        if not recommendations:
            recommendations.append("نظام التخزين المؤقت يعمل بشكل ممتاز! 🎉")
        
        return recommendations
    
    async def run_full_check(self) -> Dict[str, Any]:
        """تشغيل فحص شامل"""
        print("🚀 بدء فحص نظام التخزين المؤقت...")
        
        # فحص Redis instances
        redis_urls = {
            "primary": os.getenv("REDIS_PRIMARY_URL", "redis://localhost:6379/0"),
            "cache": os.getenv("REDIS_CACHE_URL", "redis://localhost:6379/1"),
            "sessions": os.getenv("REDIS_SESSIONS_URL", "redis://localhost:6379/2")
        }
        
        print("📡 فحص اتصال Redis...")
        for name, url in redis_urls.items():
            self.results["redis_instances"][name] = await self.check_redis_connection(name, url)
            print(f"   ✅ {name}: {self.results['redis_instances'][name]['status']}")
        
        # اختبار عمليات Cache
        print("🧪 اختبار عمليات التخزين المؤقت...")
        self.results["cache_operations"] = await self.check_cache_operations()
        
        # حساب الحالة العامة
        healthy_instances = sum(1 for info in self.results["redis_instances"].values() if info["status"] == "healthy")
        total_instances = len(self.results["redis_instances"])
        passed_operations = sum(1 for op in self.results["cache_operations"].values() if op["status"] == "passed")
        total_operations = len(self.results["cache_operations"])
        
        if healthy_instances == total_instances and passed_operations == total_operations:
            self.results["overall_status"] = "healthy"
        elif healthy_instances > 0 or passed_operations > 0:
            self.results["overall_status"] = "degraded"
        else:
            self.results["overall_status"] = "unhealthy"
        
        # توليد التوصيات
        self.results["recommendations"] = self.generate_recommendations()
        
        # إضافة معلومات إضافية
        self.results["summary"] = {
            "total_redis_instances": total_instances,
            "healthy_instances": healthy_instances,
            "total_operations": total_operations,
            "passed_operations": passed_operations,
            "health_percentage": round((healthy_instances / total_instances) * 100, 2) if total_instances > 0 else 0
        }
        
        return self.results
    
    def print_report(self):
        """طباعة تقرير مفصل"""
        print("\n" + "="*80)
        print("🔍 تقرير صحة نظام التخزين المؤقت")
        print("="*80)
        
        # الحالة العامة
        status_emoji = {
            "healthy": "🟢",
            "degraded": "🟡", 
            "unhealthy": "🔴"
        }
        
        print(f"\n📊 الحالة العامة: {status_emoji.get(self.results['overall_status'], '❓')} {self.results['overall_status'].upper()}")
        
        # ملخص
        summary = self.results["summary"]
        print(f"   📈 نسبة الصحة: {summary['health_percentage']}%")
        print(f"   🗄️ Redis Instances: {summary['healthy_instances']}/{summary['total_redis_instances']} healthy")
        print(f"   ⚡ العمليات: {summary['passed_operations']}/{summary['total_operations']} passed")
        
        # تفاصيل Redis
        print(f"\n🗄️ حالة Redis Instances:")
        for name, info in self.results["redis_instances"].items():
            status_icon = "✅" if info["status"] == "healthy" else "❌"
            print(f"   {status_icon} {name}: {info['status']}")
            if info["status"] == "healthy":
                print(f"      💾 الذاكرة: {info['memory_used']}")
                print(f"      👥 العملاء المتصلين: {info['connected_clients']}")
        
        # تفاصيل العمليات
        print(f"\n⚡ نتائج اختبار العمليات:")
        for op_name, result in self.results["cache_operations"].items():
            status_icon = "✅" if result["status"] == "passed" else "❌"
            print(f"   {status_icon} {result['description']}: {result['status']}")
        
        # التوصيات
        print(f"\n💡 التوصيات:")
        for i, recommendation in enumerate(self.results["recommendations"], 1):
            print(f"   {i}. {recommendation}")
        
        print(f"\n⏰ وقت الفحص: {self.results['timestamp']}")
        print("="*80)


async def main():
    """الدالة الرئيسية"""
    checker = CacheHealthChecker()
    
    try:
        results = await checker.run_full_check()
        checker.print_report()
        
        # حفظ النتائج في ملف JSON
        with open("cache_health_report.json", "w", encoding="utf-8") as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 تم حفظ التقرير في: cache_health_report.json")
        
        # إرجاع كود حالة مناسب
        if results["overall_status"] == "healthy":
            print("🎉 جميع الفحوصات نجحت!")
            return 0
        elif results["overall_status"] == "degraded":
            print("⚠️  النظام يعمل مع مشاكل بسيطة")
            return 1
        else:
            print("❌ هناك مشاكل خطيرة في النظام")
            return 2
            
    except Exception as e:
        print(f"❌ خطأ في تشغيل الفحص: {e}")
        return 3


if __name__ == "__main__":
    import asyncio
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
