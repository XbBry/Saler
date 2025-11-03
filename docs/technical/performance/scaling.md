# توسعة النظام - System Scaling

## نظرة عامة

يقدم هذا الدليل استراتيجيات توسعة شاملة لتطبيق Saler، من التوسعة الأفقية والعمودية إلى إدارة الحمل والتوازن بين الخوادم، مع التركيز على بناء نظام قابل للتوسع والنمو مع ازدياد المستخدمين والبيانات.

## محتويات الدليل

1. [تصميم النظام القابل للتوسع](#تصميم-النظام-القابل-للتوسع)
2. [التوسعة العمودية (Vertical Scaling)](#التوسعة-العمودية-vertical-scaling)
3. [التوسعة الأفقية (Horizontal Scaling)](#التوسعة-الأفقية-horizontal-scaling)
4. [توزيع الأحمال (Load Balancing)](#توزيع-الأحمال-load-balancing)
5. [قاعدة البيانات القابلة للتوسع](#قاعدة-البيانات-القابلة-للتوسع)
6. [التخزين والتوزيع](#التخزين-والتوزيع)
7. [Caching المتقدم](#caching-المتقدم)
8. [إدارة البنية التحتية](#إدارة-البنية-التحتية)
9. [مراقبة الأداء والتوسعة](#مراقبة-الأداء-والتوسعة)
10. [استراتيجيات التوسعة التدريجية](#استراتيجيات-التوسعة-التدريجية)

## تصميم النظام القابل للتوسع

### هندسة النظام القابل للتوسع

```mermaid
graph TB
    subgraph "طبقة العرض"
        A[CDN/Cloudflare] --> B[Load Balancer]
        B --> C[Web Servers]
    end
    
    subgraph "طبقة التطبيق"
        C --> D[API Gateway]
        D --> E[Application Servers]
        E --> F[Message Queue]
    end
    
    subgraph "طبقة البيانات"
        F --> G[Database Primary]
        F --> H[Database Replicas]
        G --> I[Redis Cluster]
        H --> I
    end
    
    subgraph "طبقة التخزين"
        I --> J[Object Storage]
        J --> K[File Storage]
    end
    
    subgraph "المراقبة"
        L[Monitoring] --> M[Metrics]
        L --> N[Logs]
        L --> O[Alerts]
    end
    
    style A fill:#e1f5fe
    style G fill:#f3e5f5
    style I fill:#e8f5e8
    style L fill:#fff3e0
```

### مبادئ التصميم القابل للتوسع

```python
# scalable_design.py - مبادئ التصميم القابل للتوسع

from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from enum import Enum
import asyncio
import logging

logger = logging.getLogger(__name__)

class ScalingStrategy(Enum):
    """استراتيجيات التوسعة"""
    VERTICAL = "vertical"
    HORIZONTAL = "horizontal"
    AUTO_SCALING = "auto_scaling"
    HYBRID = "hybrid"

class ServiceType(Enum):
    """أنواع الخدمات"""
    WEB_SERVER = "web_server"
    API_SERVER = "api_server"
    DATABASE = "database"
    CACHE = "cache"
    QUEUE = "queue"
    STORAGE = "storage"

class ScalableComponent(ABC):
    """مكون قابل للتوسع"""
    
    def __init__(self, service_type: ServiceType, config: Dict[str, Any]):
        self.service_type = service_type
        self.config = config
        self.current_capacity = config.get('initial_capacity', 1)
        self.max_capacity = config.get('max_capacity', 10)
        self.min_capacity = config.get('min_capacity', 1)
        self.scaling_threshold = config.get('scaling_threshold', 0.8)
        self.cooldown_period = config.get('cooldown_period', 300)  # 5 دقائق
        
        self.metrics = {
            'cpu_usage': 0,
            'memory_usage': 0,
            'request_rate': 0,
            'response_time': 0,
            'error_rate': 0
        }
        
        self.last_scaling_action = 0
        self.scaling_history = []
    
    @abstractmethod
    async def get_current_metrics(self) -> Dict[str, float]:
        """جلب المقاييس الحالية"""
        pass
    
    @abstractmethod
    async def scale_up(self, additional_instances: int = 1) -> bool:
        """زيادة السعة"""
        pass
    
    @abstractmethod
    async def scale_down(self, instances_to_remove: int = 1) -> bool:
        """تقليل السعة"""
        pass
    
    def get_scaling_decision(self) -> Dict[str, Any]:
        """اتخاذ قرار التوسعة"""
        current_metrics = asyncio.create_task(self.get_current_metrics())
        
        # تقييم حالة النظام
        should_scale_up = self._should_scale_up(current_metrics)
        should_scale_down = self._should_scale_down(current_metrics)
        
        if should_scale_up and self._can_scale_up():
            return {
                'action': 'scale_up',
                'instances': 1,
                'reason': 'high_load',
                'confidence': self._calculate_confidence(current_metrics, 'up')
            }
        elif should_scale_down and self._can_scale_down():
            return {
                'action': 'scale_down',
                'instances': 1,
                'reason': 'low_load',
                'confidence': self._calculate_confidence(current_metrics, 'down')
            }
        
        return {
            'action': 'maintain',
            'reason': 'normal_load'
        }
    
    def _should_scale_up(self, metrics: Dict[str, float]) -> bool:
        """فحص ما إذا كان يجب زيادة السعة"""
        threshold_exceeded = (
            metrics['cpu_usage'] > self.scaling_threshold or
            metrics['memory_usage'] > self.scaling_threshold or
            metrics['request_rate'] > self.config.get('request_threshold', 100) or
            metrics['response_time'] > self.config.get('response_time_threshold', 2.0)
        )
        
        # التأكد من فترة التهدئة
        time_since_last_action = asyncio.get_event_loop().time() - self.last_scaling_action
        
        return threshold_exceeded and time_since_last_action > self.cooldown_period
    
    def _should_scale_down(self, metrics: Dict[str, float]) -> bool:
        """فحص ما إذا كان يجب تقليل السعة"""
        under_utilization = (
            metrics['cpu_usage'] < (self.scaling_threshold * 0.5) and
            metrics['memory_usage'] < (self.scaling_threshold * 0.5) and
            metrics['request_rate'] < (self.config.get('request_threshold', 100) * 0.5)
        )
        
        # التأكد من عدم وجود أخطاء عالية
        if metrics['error_rate'] > self.config.get('error_threshold', 0.01):
            return False
        
        time_since_last_action = asyncio.get_event_loop().time() - self.last_scaling_action
        
        return under_utilization and time_since_last_action > self.cooldown_period
    
    def _can_scale_up(self) -> bool:
        """فحص ما إذا كان يمكن زيادة السعة"""
        return self.current_capacity < self.max_capacity
    
    def _can_scale_down(self) -> bool:
        """فحص ما إذا كان يمكن تقليل السعة"""
        return self.current_capacity > self.min_capacity
    
    def _calculate_confidence(self, metrics: Dict[str, float], direction: str) -> float:
        """حساب مستوى الثقة في قرار التوسعة"""
        if direction == 'up':
            # حساب مستوى الثقة في الزيادة
            cpu_confidence = min(metrics['cpu_usage'] / self.scaling_threshold, 2.0)
            memory_confidence = min(metrics['memory_usage'] / self.scaling_threshold, 2.0)
            response_confidence = min(metrics['response_time'] / self.config.get('response_time_threshold', 2.0), 2.0)
            
            return (cpu_confidence + memory_confidence + response_confidence) / 3.0
        
        elif direction == 'down':
            # حساب مستوى الثقة في التخفيض
            cpu_confidence = max(0, (self.scaling_threshold * 0.5 - metrics['cpu_usage']) / (self.scaling_threshold * 0.5))
            memory_confidence = max(0, (self.scaling_threshold * 0.5 - metrics['memory_usage']) / (self.scaling_threshold * 0.5))
            error_confidence = 1.0 - min(metrics['error_rate'] / self.config.get('error_threshold', 0.01), 1.0)
            
            return (cpu_confidence + memory_confidence + error_confidence) / 3.0
        
        return 0.0

class ScalableWebServer(ScalableComponent):
    """خادم ويب قابل للتوسع"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(ServiceType.WEB_SERVER, config)
        self.servers = []
        self.load_balancer = config.get('load_balancer')
    
    async def get_current_metrics(self) -> Dict[str, float]:
        """جلب مقاييس خوادم الويب"""
        if not self.servers:
            return {
                'cpu_usage': 0,
                'memory_usage': 0,
                'request_rate': 0,
                'response_time': 0,
                'error_rate': 0
            }
        
        total_metrics = {
            'cpu_usage': 0,
            'memory_usage': 0,
            'request_rate': 0,
            'response_time': 0,
            'error_rate': 0
        }
        
        # جمع المقاييس من جميع الخوادم
        for server in self.servers:
            server_metrics = await self._get_server_metrics(server)
            for key, value in server_metrics.items():
                total_metrics[key] += value
        
        # حساب المتوسط
        num_servers = len(self.servers)
        for key in total_metrics:
            total_metrics[key] /= num_servers
        
        return total_metrics
    
    async def _get_server_metrics(self, server: Dict[str, Any]) -> Dict[str, float]:
        """جلب مقاييس خادم واحد"""
        # محاكاة جلب المقاييس
        return {
            'cpu_usage': server.get('cpu_usage', 0),
            'memory_usage': server.get('memory_usage', 0),
            'request_rate': server.get('request_rate', 0),
            'response_time': server.get('response_time', 0),
            'error_rate': server.get('error_rate', 0)
        }
    
    async def scale_up(self, additional_instances: int = 1) -> bool:
        """زيادة عدد خوادم الويب"""
        try:
            logger.info(f"زيادة عدد خوادم الويب من {self.current_capacity} إلى {self.current_capacity + additional_instances}")
            
            # إنشاء خوادم جديدة
            for i in range(additional_instances):
                new_server = await self._create_server()
                self.servers.append(new_server)
            
            # تحديث Load Balancer
            if self.load_balancer:
                await self.load_balancer.add_servers([s['id'] for s in self.servers[-additional_instances:]])
            
            self.current_capacity += additional_instances
            self.last_scaling_action = asyncio.get_event_loop().time()
            
            # تسجيل في التاريخ
            self.scaling_history.append({
                'timestamp': self.last_scaling_action,
                'action': 'scale_up',
                'instances': additional_instances,
                'new_capacity': self.current_capacity
            })
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في زيادة خوادم الويب: {e}")
            return False
    
    async def scale_down(self, instances_to_remove: int = 1) -> bool:
        """تقليل عدد خوادم الويب"""
        try:
            if self.current_capacity - instances_to_remove < self.min_capacity:
                logger.warning("لا يمكن تقليل العدد أقل من الحد الأدنى")
                return False
            
            logger.info(f"تقليل عدد خوادم الويب من {self.current_capacity} إلى {self.current_capacity - instances_to_remove}")
            
            # تحديد الخوادم للإزالة (آخر خوادم تم إنشاؤها)
            servers_to_remove = self.servers[-instances_to_remove:]
            
            # إزالة من Load Balancer أولاً
            if self.load_balancer:
                await self.load_balancer.remove_servers([s['id'] for s in servers_to_remove])
            
            # إيقاف الخوادم
            for server in servers_to_remove:
                await self._stop_server(server)
            
            # إزالة من القائمة
            self.servers = self.servers[:-instances_to_remove]
            
            self.current_capacity -= instances_to_remove
            self.last_scaling_action = asyncio.get_event_loop().time()
            
            # تسجيل في التاريخ
            self.scaling_history.append({
                'timestamp': self.last_scaling_action,
                'action': 'scale_down',
                'instances': instances_to_remove,
                'new_capacity': self.current_capacity
            })
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في تقليل خوادم الويب: {e}")
            return False
    
    async def _create_server(self) -> Dict[str, Any]:
        """إنشاء خادم جديد"""
        # محاكاة إنشاء خادم
        server_id = f"web_{len(self.servers)}"
        
        server = {
            'id': server_id,
            'status': 'running',
            'cpu_usage': 10,  # استخدام CPU منخفض في البداية
            'memory_usage': 20,  # استخدام الذاكرة منخفض
            'request_rate': 0,
            'response_time': 0.1,
            'error_rate': 0,
            'created_at': asyncio.get_event_loop().time()
        }
        
        logger.info(f"تم إنشاء خادم ويب: {server_id}")
        return server
    
    async def _stop_server(self, server: Dict[str, Any]) -> None:
        """إيقاف خادم"""
        # محاكاة إيقاف خادم
        logger.info(f"تم إيقاف خادم ويب: {server['id']}")

class ScalableDatabase(ScalableComponent):
    """قاعدة بيانات قابلة للتوسع"""
    
    def __init__(self, config: Dict[str, Any]):
        super().__init__(ServiceType.DATABASE, config)
        self.primary_node = None
        self.replica_nodes = []
        self.connection_pool_size = config.get('connection_pool_size', 10)
    
    async def get_current_metrics(self) -> Dict[str, float]:
        """جلب مقاييس قاعدة البيانات"""
        # جلب مقاييس من العقدة الأساسية
        primary_metrics = await self._get_node_metrics(self.primary_node)
        
        # جلب مقاييس من النسخ المتطابقة
        replica_metrics = []
        for replica in self.replica_nodes:
            metrics = await self._get_node_metrics(replica)
            replica_metrics.append(metrics)
        
        # حساب المتوسطات
        total_metrics = primary_metrics.copy()
        
        if replica_metrics:
            for key in total_metrics:
                replica_sum = sum(r[key] for r in replica_metrics)
                total_metrics[key] = (total_metrics[key] + replica_sum) / (len(replica_metrics) + 1)
        
        return total_metrics
    
    async def _get_node_metrics(self, node: Dict[str, Any]) -> Dict[str, float]:
        """جلب مقاييس عقدة قاعدة بيانات"""
        return {
            'cpu_usage': node.get('cpu_usage', 0),
            'memory_usage': node.get('memory_usage', 0),
            'disk_usage': node.get('disk_usage', 0),
            'connection_count': node.get('active_connections', 0),
            'query_time': node.get('avg_query_time', 0),
            'cache_hit_ratio': node.get('cache_hit_ratio', 0)
        }
    
    async def scale_up(self, additional_instances: int = 1) -> bool:
        """زيادة سعة قاعدة البيانات"""
        try:
            logger.info(f"إضافة {additional_instances} نسخ متطابقة لقاعدة البيانات")
            
            # إضافة نسخ متطابقة جديدة
            for i in range(additional_instances):
                new_replica = await self._create_replica_node()
                self.replica_nodes.append(new_replica)
                
                # تكوين النسخ المتطابقة
                await self._setup_replication(new_replica)
            
            self.current_capacity += additional_instances
            self.last_scaling_action = asyncio.get_event_loop().time()
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إضافة نسخ قاعدة البيانات: {e}")
            return False
    
    async def scale_down(self, instances_to_remove: int = 1) -> bool:
        """تقليل سعة قاعدة البيانات"""
        try:
            if len(self.replica_nodes) - instances_to_remove < 0:
                logger.warning("لا يمكن تقليل النسخ المتطابقة أكثر")
                return False
            
            logger.info(f"إزالة {instances_to_remove} نسخ متطابقة من قاعدة البيانات")
            
            # تحديد النسخ للإزالة
            replicas_to_remove = self.replica_nodes[-instances_to_remove:]
            
            # إيقاف النسخ
            for replica in replicas_to_remove:
                await self._stop_replica_node(replica)
            
            # إزالة من القائمة
            self.replica_nodes = self.replica_nodes[:-instances_to_remove]
            
            self.current_capacity -= instances_to_remove
            self.last_scaling_action = asyncio.get_event_loop().time()
            
            return True
            
        except Exception as e:
            logger.error(f"خطأ في إزالة نسخ قاعدة البيانات: {e}")
            return False
    
    async def _create_replica_node(self) -> Dict[str, Any]:
        """إنشاء عقدة نسخ متطابقة جديدة"""
        replica_id = f"replica_{len(self.replica_nodes)}"
        
        replica = {
            'id': replica_id,
            'status': 'syncing',
            'cpu_usage': 15,
            'memory_usage': 30,
            'disk_usage': 20,
            'active_connections': 0,
            'avg_query_time': 0.1,
            'cache_hit_ratio': 0.8,
            'lag_behind_primary': 0,
            'created_at': asyncio.get_event_loop().time()
        }
        
        logger.info(f"تم إنشاء عقدة نسخ متطابقة: {replica_id}")
        return replica
    
    async def _stop_replica_node(self, replica: Dict[str, Any]) -> None:
        """إيقاف عقدة نسخ متطابقة"""
        logger.info(f"تم إيقاف عقدة نسخ متطابقة: {replica['id']}")
    
    async def _setup_replication(self, replica: Dict[str, Any]) -> None:
        """إعداد النسخ المتطابقة"""
        # محاكاة إعداد النسخ
        logger.info(f"تم إعداد النسخ المتطابقة: {replica['id']}")

# مدير التوسعة الشامل
class ScalingOrchestrator:
    """منسق التوسعة الشامل"""
    
    def __init__(self, config: Dict[str, Any]):
        self.components = {}
        self.config = config
        self.scaling_policies = self._define_scaling_policies()
        self.monitoring_interval = config.get('monitoring_interval', 60)  # دقيقة واحدة
        self.running = False
        
        # ربط المكونات
        self._initialize_components()
    
    def _define_scaling_policies(self) -> Dict[ServiceType, Dict]:
        """تعريف سياسات التوسعة"""
        return {
            ServiceType.WEB_SERVER: {
                'strategy': ScalingStrategy.AUTO_SCALING,
                'min_instances': 2,
                'max_instances': 10,
                'scale_up_threshold': 0.7,
                'scale_down_threshold': 0.3,
                'cooldown_period': 300
            },
            ServiceType.API_SERVER: {
                'strategy': ScalingStrategy.AUTO_SCALING,
                'min_instances': 2,
                'max_instances': 8,
                'scale_up_threshold': 0.8,
                'scale_down_threshold': 0.2,
                'cooldown_period': 180
            },
            ServiceType.DATABASE: {
                'strategy': ScalingStrategy.HYBRID,
                'min_replicas': 1,
                'max_replicas': 5,
                'scale_up_threshold': 0.9,
                'scale_down_threshold': 0.4,
                'cooldown_period': 600
            },
            ServiceType.CACHE: {
                'strategy': ScalingStrategy.HORIZONTAL,
                'min_instances': 1,
                'max_instances': 3,
                'scale_up_threshold': 0.85,
                'scale_down_threshold': 0.35,
                'cooldown_period': 300
            }
        }
    
    def _initialize_components(self):
        """تهيئة المكونات القابلة للتوسع"""
        # خوادم الويب
        web_config = {
            'initial_capacity': 2,
            'max_capacity': 10,
            'min_capacity': 2,
            'scaling_threshold': 0.7,
            'cooldown_period': 300
        }
        self.components[ServiceType.WEB_SERVER] = ScalableWebServer(web_config)
        
        # خوادم API
        api_config = {
            'initial_capacity': 2,
            'max_capacity': 8,
            'min_capacity': 2,
            'scaling_threshold': 0.8,
            'cooldown_period': 180
        }
        self.components[ServiceType.API_SERVER] = ScalableWebServer(api_config)
        
        # قاعدة البيانات
        db_config = {
            'initial_capacity': 1,
            'max_capacity': 5,
            'min_capacity': 1,
            'scaling_threshold': 0.9,
            'cooldown_period': 600
        }
        self.components[ServiceType.DATABASE] = ScalableDatabase(db_config)
    
    async def start_monitoring(self):
        """بدء مراقبة التوسعة"""
        self.running = True
        logger.info("بدء مراقبة التوسعة")
        
        while self.running:
            try:
                await self._monitor_and_scale()
                await asyncio.sleep(self.monitoring_interval)
            except Exception as e:
                logger.error(f"خطأ في مراقبة التوسعة: {e}")
                await asyncio.sleep(30)
    
    async def _monitor_and_scale(self):
        """مراقبة وتوسيع النظام"""
        scaling_decisions = []
        
        # فحص جميع المكونات
        for service_type, component in self.components.items():
            try:
                decision = component.get_scaling_decision()
                if decision['action'] in ['scale_up', 'scale_down']:
                    scaling_decisions.append({
                        'service_type': service_type,
                        'decision': decision
                    })
                    
                    # تنفيذ قرار التوسعة
                    await self._execute_scaling_action(service_type, component, decision)
                    
            except Exception as e:
                logger.error(f"خطأ في فحص مكون {service_type}: {e}")
        
        # تسجيل القرارات
        if scaling_decisions:
            logger.info(f"تم اتخاذ {len(scaling_decisions)} قرارات توسعة")
            for decision in scaling_decisions:
                logger.info(f"قرار التوسعة: {decision['service_type'].value} - {decision['decision']['action']}")
    
    async def _execute_scaling_action(self, service_type: ServiceType, component: ScalableComponent, decision: Dict[str, Any]):
        """تنفيذ قرار التوسعة"""
        try:
            if decision['action'] == 'scale_up':
                success = await component.scale_up(decision['instances'])
                if success:
                    logger.info(f"تم زيادة السعة بنجاح لـ {service_type.value}")
                else:
                    logger.error(f"فشل في زيادة السعة لـ {service_type.value}")
            
            elif decision['action'] == 'scale_down':
                success = await component.scale_down(decision['instances'])
                if success:
                    logger.info(f"تم تقليل السعة بنجاح لـ {service_type.value}")
                else:
                    logger.error(f"فشل في تقليل السعة لـ {service_type.value}")
                    
        except Exception as e:
            logger.error(f"خطأ في تنفيذ قرار التوسعة {service_type.value}: {e}")
    
    async def get_system_status(self) -> Dict[str, Any]:
        """الحصول على حالة النظام"""
        status = {
            'timestamp': asyncio.get_event_loop().time(),
            'components': {},
            'overall_health': 'healthy',
            'scaling_history': []
        }
        
        # جمع حالة جميع المكونات
        for service_type, component in self.components.items():
            try:
                metrics = await component.get_current_metrics()
                
                status['components'][service_type.value] = {
                    'current_capacity': component.current_capacity,
                    'max_capacity': component.max_capacity,
                    'min_capacity': component.min_capacity,
                    'metrics': metrics,
                    'last_scaling_action': component.last_scaling_action,
                    'scaling_history': component.scaling_history[-5:]  # آخر 5 عمليات
                }
                
            except Exception as e:
                logger.error(f"خطأ في جمع حالة {service_type.value}: {e}")
                status['overall_health'] = 'degraded'
        
        return status
    
    def stop_monitoring(self):
        """إيقاف مراقبة التوسعة"""
        self.running = False
        logger.info("تم إيقاف مراقبة التوسعة")

# استخدام مدير التوسعة
async def main():
    """تشغيل مدير التوسعة"""
    config = {
        'monitoring_interval': 30,  # فحص كل 30 ثانية
        'scaling_policies': {
            'web_server': {
                'min_instances': 2,
                'max_instances': 10,
                'scale_up_threshold': 0.7,
                'scale_down_threshold': 0.3
            }
        }
    }
    
    orchestrator = ScalingOrchestrator(config)
    
    try:
        # بدء مراقبة التوسعة
        await orchestrator.start_monitoring()
    except KeyboardInterrupt:
        logger.info("تم إيقاف مراقبة التوسعة")
        orchestrator.stop_monitoring()

if __name__ == "__main__":
    asyncio.run(main())
```

## التوسعة الأفقية (Horizontal Scaling)

### Docker Swarm Configuration

```yaml
# docker-stack.yml - تكوين Docker Swarm

version: '3.8'

services:
  app:
    image: saler-app:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/saler
      - REDIS_URL=redis://redis:6379
    volumes:
      - app-logs:/app/logs
      - app-uploads:/app/uploads
    networks:
      - backend
    deploy:
      replicas: 3
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
        monitor: 60s
        max_failure_ratio: 0.3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
      placement:
        constraints:
          - node.role == worker
      labels:
        - "com.saler.service=web"

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=saler
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
      labels:
        - "com.saler.service=database-primary"

  postgres-replica:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=saler
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_replica_data:/var/lib/postgresql/data
    networks:
      - backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
      resources:
        limits:
          cpus: '1'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
      labels:
        - "com.saler.service=database-replica"

  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
      labels:
        - "com.saler.service=cache"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl/certs
      - ./uploads:/var/www/uploads
    networks:
      - backend
    deploy:
      replicas: 2
      placement:
        constraints:
          - node.role == worker
      labels:
        - "com.saler.service=load-balancer"

  redis-exporter:
    image: oliver006/redis_exporter:latest
    environment:
      - REDIS_ADDR=redis://redis:6379
    networks:
      - backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "com.saler.service=monitoring"

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
    networks:
      - backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "com.saler.service=monitoring"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    networks:
      - backend
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.role == manager
      labels:
        - "com.saler.service=monitoring"

volumes:
  app-logs:
  app-uploads:
  postgres_data:
  postgres_replica_data:
  redis_data:
  prometheus_data:
  grafana_data:

networks:
  backend:
    driver: overlay
    attachable: true
```

### Kubernetes Deployment

```yaml
# k8s-scaling.yaml - نشر Kubernetes قابل للتوسع

apiVersion: apps/v1
kind: Deployment
metadata:
  name: saler-app
  namespace: saler
  labels:
    app: saler-app
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: saler-app
  template:
    metadata:
      labels:
        app: saler-app
    spec:
      containers:
      - name: app
        image: saler-app:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 60
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        volumeMounts:
        - name: app-logs
          mountPath: /app/logs
        - name: app-uploads
          mountPath: /app/uploads
      volumes:
      - name: app-logs
        persistentVolumeClaim:
          claimName: app-logs-pvc
      - name: app-uploads
        persistentVolumeClaim:
          claimName: app-uploads-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: saler-app-service
  namespace: saler
spec:
  selector:
    app: saler-app
  ports:
  - port: 80
    targetPort: 3000
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: saler-app-hpa
  namespace: saler
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: saler-app
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  - type: Pods
    pods:
      metric:
        name: http_requests_per_second
      target:
        type: AverageValue
        averageValue: "100"
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 100
        periodSeconds: 60
      - type: Pods
        value: 2
        periodSeconds: 60
      selectPolicy: Max
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres-primary
  namespace: saler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres-primary
  template:
    metadata:
      labels:
        app: postgres-primary
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: saler
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        ports:
        - containerPort: 5432
        resources:
          requests:
            memory: "2Gi"
            cpu: "1"
          limits:
            memory: "4Gi"
            cpu: "2"
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        - name: postgres-backups
          mountPath: /backups
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-storage-pvc
      - name: postgres-backups
        persistentVolumeClaim:
          claimName: postgres-backups-pvc
      nodeSelector:
        node-role.kubernetes.io/master: ""
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres-replica
  namespace: saler
spec:
  serviceName: postgres-service
  replicas: 2
  selector:
    matchLabels:
      app: postgres-replica
  template:
    metadata:
      labels:
        app: postgres-replica
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: saler
        - name: POSTGRES_USER
          value: postgres
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: password
        ports:
        - containerPort: 5432
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1"
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        persistentVolumeClaim:
          claimName: postgres-replica-storage-pvc
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 10Gi
      storageClassName: ssd
---
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: saler
spec:
  selector:
    app: postgres-primary
  ports:
  - port: 5432
    targetPort: 5432
  clusterIP: None
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: saler
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "--appendonly", "yes"]
        ports:
        - containerPort: 6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        volumeMounts:
        - name: redis-storage
          mountPath: /data
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-storage-pvc
      nodeSelector:
        node-role.kubernetes.io/master: ""
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: saler
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
```

### AWS Auto Scaling Configuration

```bash
#!/bin/bash
# aws-autoscaling.sh - تكوين التوسعة التلقائية في AWS

echo "🚀 إعداد التوسعة التلقائية في AWS"

# إعداد Launch Template
aws ec2 create-launch-template \
    --launch-template-name saler-app-template \
    --launch-template-data '{
        "ImageId": "ami-0abcdef1234567890",
        "InstanceType": "t3.medium",
        "KeyName": "saler-keypair",
        "SecurityGroupIds": ["sg-12345678"],
        "UserData": "'$(base64 -i user-data.sh)'",
        "IamInstanceProfile": {
            "Name": "saler-ec2-role"
        },
        "BlockDeviceMappings": [
            {
                "DeviceName": "/dev/xvda",
                "Ebs": {
                    "VolumeSize": 20,
                    "VolumeType": "gp3",
                    "DeleteOnTermination": true
                }
            }
        ],
        "TagSpecifications": [
            {
                "ResourceType": "instance",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": "salar-app-instance"
                    },
                    {
                        "Key": "Environment",
                        "Value": "production"
                    }
                ]
            }
        ]
    }'

# إنشاء Auto Scaling Group
aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name saler-app-asg \
    --launch-template LaunchTemplateName=salar-app-template,Version=1 \
    --min-size 2 \
    --max-size 10 \
    --desired-capacity 3 \
    --vpc-zone-identifier "subnet-12345678,subnet-87654321" \
    --health-check-type EC2 \
    --health-check-grace-period 300 \
    --target-group-arns arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/saler-tg/1234567890abcdef \
    --termination-policies "OldestInstance"

# إعداد Scaling Policies
aws autoscaling put-scaling-policy \
    --policy-name saler-scale-up-policy \
    --auto-scaling-group-name saler-app-asg \
    --policy-type TargetTrackingScaling \
    --target-tracking-configuration '{
        "TargetValue": 70.0,
        "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
        },
        "ScaleOutCooldown": 300,
        "ScaleInCooldown": 300
    }'

aws autoscaling put-scaling-policy \
    --policy-name saler-scale-out-policy \
    --auto-scaling-group-name saler-app-asg \
    --policy-type SimpleScaling \
    --adjustment-type ChangeInCapacity \
    --scaling-adjustment 1 \
    --cooldown 300

aws autoscaling put-scaling-policy \
    --policy-name saler-scale-in-policy \
    --auto-scaling-group-name saler-app-asg \
    --policy-type SimpleScaling \
    --adjustment-type ChangeInCapacity \
    --scaling-adjustment -1 \
    --cooldown 600

# إعداد CloudWatch Alerts
aws cloudwatch put-metric-alarm \
    --alarm-name "salar-app-high-cpu" \
    --alarm-description "تنبيه ارتفاع CPU" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2 \
    --alarm-actions arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:abcdef/saler-scale-out-policy

aws cloudwatch put-metric-alarm \
    --alarm-name "salar-app-low-cpu" \
    --alarm-description "تنبيه انخفاض CPU" \
    --metric-name CPUUtilization \
    --namespace AWS/EC2 \
    --statistic Average \
    --period 600 \
    --threshold 20 \
    --comparison-operator LessThanThreshold \
    --evaluation-periods 3 \
    --alarm-actions arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:ghijkl/saler-scale-in-policy

echo "✅ تم إعداد التوسعة التلقائية بنجاح!"
```

## توزيع الأحمال (Load Balancing)

### Nginx Load Balancer Configuration

```nginx
# nginx-load-balancer.conf
upstream saler_backend {
    # Round Robin (افتراضي)
    server app1.internal:3000 weight=3 max_fails=3 fail_timeout=30s;
    server app2.internal:3000 weight=2 max_fails=3 fail_timeout=30s;
    server app3.internal:3000 weight=2 max_fails=3 fail_timeout=30s;
    
    # إعداد keepalive
    keepalive 32;
}

upstream saler_api {
    server api1.internal:3001 weight=2 max_fails=3 fail_timeout=30s;
    server api2.internal:3001 weight=2 max_fails=3 fail_timeout=30s;
    server api3.internal:3001 weight=2 max_fails=3 fail_timeout=30s;
    
    # إعداد keepalive
    keepalive 32;
}

upstream saler_websocket {
    server ws1.internal:3002;
    server ws2.internal:3002;
}

# توزيع الأحمال المتقدم مع Least Connections
upstream saler_least_conn {
    least_conn;
    server app1.internal:3000 max_fails=3 fail_timeout=30s;
    server app2.internal:3000 max_fails=3 fail_timeout=30s;
    server app3.internal:3000 max_fails=3 fail_timeout=30s;
}

# توزيع الأحمال مع IP Hash
upstream saler_sticky {
    ip_hash;
    server app1.internal:3000;
    server app2.internal:3000;
    server app3.internal:3000;
}

server {
    listen 80;
    server_name saler.app;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name saler.app;

    # إعدادات SSL
    ssl_certificate /etc/ssl/certs/saler.crt;
    ssl_certificate_key /etc/ssl/private/saler.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # ضغط البيانات
    gzip on;
    gzip_vary on;
    gzip_min_length 10240;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # إعدادات الأداء
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 100M;

    # معدل الطلبات
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;

    # إعدادات الأمان
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' wss: https:;" always;

    # توزيع أحمال التطبيق الرئيسي
    location / {
        limit_req zone=general burst=20 nodelay;
        
        proxy_pass http://saler_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # إعدادات المهلة
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # إعدادات توزيع الأحمال
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
        proxy_next_upstream_tries 3;
        proxy_next_upstream_timeout 10s;
        
        # إعدادات Connection Pooling
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
    }

    # توزيع أحمال API
    location /api/ {
        limit_req zone=api burst=50 nodelay;
        
        proxy_pass http://saler_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # إعدادات خاصة بالـ API
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
        
        # إعدادات cache
        proxy_cache api_cache;
        proxy_cache_valid 200 5m;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_cache_lock on;
    }

    # Authentication endpoints
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://saler_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket connections
    location /socket.io/ {
        proxy_pass http://saler_websocket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # إعدادات WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Static files مع Cache
    location /static/ {
        alias /var/www/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        
        # ضغط الملفات الثابتة
        gzip_static on;
        
        # إعدادات الأمان للملفات الثابتة
        location ~* \.(js|css)$ {
            add_header X-Content-Type-Options nosniff;
        }
    }

    # تحميل الملفات
    location /uploads/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public";
        
        # تحديد أنواع الملفات المسموحة
        location ~* \.(jpg|jpeg|png|gif|pdf|doc|docx)$ {
            expires 1y;
            add_header Cache-Control "public";
        }
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
        
        # لا تطبيق معدل الطلبات
        limit_req zone=none;
    }

    # API documentation
    location /docs {
        proxy_pass http://saler_api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Logging
    access_log /var/log/nginx/access.log combined;
    error_log /var/log/nginx/error.log warn;
}

# إعدادات للـ Blue-Green Deployment
upstream saler_green {
    server green-app1.internal:3000;
    server green-app2.internal:3000;
    server green-app3.internal:3000;
}

upstream saler_blue {
    server blue-app1.internal:3000;
    server blue-app2.internal:3000;
    server blue-app3.internal:3000;
}

# تحديد النسخة النشطة
map $cookie_deployment_version $active_upstream {
    default saler_backend;
    "green" saler_green;
    "blue" saler_blue;
}

server {
    listen 443 ssl http2;
    server_name deploy.saler.app;

    location / {
        proxy_pass http://$active_upstream;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

هذا جزء من دليل توسعة النظام، ويشمل:

1. **تصميم النظام القابل للتوسع**: مبادئ التصميم والتطبيق
2. **التوسعة الأفقية**: Docker Swarm وKubernetes وAWS Auto Scaling
3. **توزيع الأحمال**: Nginx مع إعدادات متقدمة للتوازن
4. **مراقبة الأداء**: نظام شامل لمراقبة التوسعة
5. **استراتيجيات التوسع التدريجية**: Blue-Green وCanary Deployment

الممارسات المطلوبة:
- تصميم قابل للتوسع من البداية
- مراقبة مستمرة للأداء
- خطط طوارئ للتوسعة
- اختبارات تحميل منتظمة
- تحسين مستمر للكود والبنية التحتية