"""
إدارة البيانات الاختبارية المتقدمة - Advanced Test Data Management
يوفر:
1. توليد البيانات الاختبارية
2. إدارة قاعدة البيانات الاختبارية
3. Mock Services للخدمات الخارجية
4. إدارة الجلسات والبيئات
5. تنظيف البيانات التلقائي
"""

import json
import asyncio
import random
import string
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional, Union
from dataclasses import dataclass, field
from faker import Faker
import uuid
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


@dataclass
class TestUser:
    """Test user data structure"""
    id: str
    email: str
    name: str
    role: str
    company: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    preferences: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestLead:
    """Test lead data structure"""
    id: str
    name: str
    email: str
    phone: Optional[str]
    company: str
    source: str
    score: int
    status: str
    assigned_to: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    last_contact: Optional[datetime] = None
    tags: List[str] = field(default_factory=list)
    custom_fields: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestMessage:
    """Test message data structure"""
    id: str
    sender_id: str
    recipient_id: str
    content: str
    message_type: str
    status: str
    sent_at: datetime = field(default_factory=datetime.now)
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class TestIntegration:
    """Test integration data structure"""
    id: str
    name: str
    integration_type: str
    config: Dict[str, Any]
    is_active: bool = True
    created_at: datetime = field(default_factory=datetime.now)
    last_sync: Optional[datetime] = None
    sync_status: str = "pending"
    error_message: Optional[str] = None


class TestDataGenerator:
    """Advanced test data generator"""
    
    def __init__(self, locale: str = 'ar_SA'):
        self.fake = Faker(locale)
        self._data_cache = {}
        
    def generate_users(self, count: int = 10) -> List[TestUser]:
        """Generate test users"""
        users = []
        roles = ['admin', 'manager', 'user', 'viewer']
        companies = [
            'شركة التقنية المتقدمة', 'مؤسسة الابتكار', 'شركة النجاح',
            'مجمع الأعمال الذكي', 'شركة الريادة', 'مجموعة التطوير'
        ]
        
        for i in range(count):
            user = TestUser(
                id=str(uuid.uuid4()),
                email=self.fake.email(),
                name=self.fake.name(),
                role=random.choice(roles),
                company=random.choice(companies) if random.random() > 0.3 else None,
                phone=self.fake.phone_number(),
                preferences={
                    'language': random.choice(['ar', 'en']),
                    'theme': random.choice(['light', 'dark']),
                    'notifications': random.choice([True, False]),
                    'timezone': self.fake.timezone()
                }
            )
            users.append(user)
        
        logger.info(f"✅ تم إنشاء {count} مستخدم اختباري")
        return users
    
    def generate_leads(self, count: int = 50) -> List[TestLead]:
        """Generate test leads"""
        leads = []
        sources = ['website', 'facebook', 'instagram', 'google_ads', 'referral', 'cold_call']
        statuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost']
        
        for i in range(count):
            lead = TestLead(
                id=str(uuid.uuid4()),
                name=self.fake.name(),
                email=self.fake.email(),
                phone=self.fake.phone_number(),
                company=self.fake.company(),
                source=random.choice(sources),
                score=random.randint(0, 100),
                status=random.choice(statuses),
                tags=[self.fake.word() for _ in range(random.randint(0, 3))],
                custom_fields={
                    'budget': random.randint(1000, 50000),
                    'timeline': random.choice(['immediate', '1_month', '3_months', '6_months']),
                    'priority': random.choice(['low', 'medium', 'high'])
                }
            )
            leads.append(lead)
        
        logger.info(f"✅ تم إنشاء {count} عميل محتمل اختباري")
        return leads
    
    def generate_messages(self, count: int = 100) -> List[TestMessage]:
        """Generate test messages"""
        messages = []
        message_types = ['text', 'image', 'file', 'audio', 'video']
        statuses = ['sent', 'delivered', 'read', 'failed']
        
        for i in range(count):
            message = TestMessage(
                id=str(uuid.uuid4()),
                sender_id=str(uuid.uuid4()),
                recipient_id=str(uuid.uuid4()),
                content=self.fake.text(max_nb_chars=200),
                message_type=random.choice(message_types),
                status=random.choice(statuses),
                metadata={
                    'platform': random.choice(['whatsapp', 'email', 'sms', 'facebook']),
                    'attachments': random.randint(0, 5) if random.random() > 0.7 else 0,
                    'priority': random.choice(['low', 'normal', 'high'])
                }
            )
            messages.append(message)
        
        logger.info(f"✅ تم إنشاء {count} رسالة اختبارية")
        return messages
    
    def generate_integrations(self, count: int = 5) -> List[TestIntegration]:
        """Generate test integrations"""
        integrations = []
        integration_types = ['shopify', 'meta_ads', 'google_ads', 'whatsapp', 'email', 'sms']
        
        integration_configs = {
            'shopify': {
                'shop_domain': 'test-store.myshopify.com',
                'api_version': '2023-10',
                'access_token': 'shpat_test_token'
            },
            'meta_ads': {
                'app_id': 'test_app_id',
                'app_secret': 'test_app_secret',
                'ad_account_id': 'act_test_account'
            },
            'google_ads': {
                'client_id': 'test_client_id',
                'client_secret': 'test_client_secret',
                'developer_token': 'test_dev_token'
            },
            'whatsapp': {
                'phone_number_id': 'test_phone_id',
                'webhook_verify_token': 'test_verify_token'
            }
        }
        
        for i in range(count):
            integration_type = random.choice(integration_types)
            integration = TestIntegration(
                id=str(uuid.uuid4()),
                name=f"Test {integration_type.title()} Integration",
                integration_type=integration_type,
                config=integration_configs.get(integration_type, {}),
                sync_status=random.choice(['pending', 'syncing', 'completed', 'failed']),
                error_message=None if random.random() > 0.1 else "Test error message"
            )
            integrations.append(integration)
        
        logger.info(f"✅ تم إنشاء {count} تكامل اختباري")
        return integrations
    
    def generate_analytics_data(self, days: int = 30) -> Dict[str, Any]:
        """Generate test analytics data"""
        analytics = {
            'date_range': f"{days} days",
            'generated_at': datetime.now().isoformat(),
            'metrics': {},
            'timeseries': []
        }
        
        # Generate daily metrics
        for i in range(days):
            date = datetime.now() - timedelta(days=i)
            daily_data = {
                'date': date.strftime('%Y-%m-%d'),
                'leads': random.randint(10, 100),
                'messages': random.randint(50, 500),
                'conversions': random.randint(2, 20),
                'revenue': random.randint(1000, 50000),
                'active_users': random.randint(20, 200),
                'page_views': random.randint(100, 1000)
            }
            analytics['timeseries'].append(daily_data)
        
        # Calculate summary metrics
        analytics['metrics'] = {
            'total_leads': sum(d['leads'] for d in analytics['timeseries']),
            'total_messages': sum(d['messages'] for d in analytics['timeseries']),
            'total_conversions': sum(d['conversions'] for d in analytics['timeseries']),
            'total_revenue': sum(d['revenue'] for d in analytics['timeseries']),
            'avg_daily_leads': sum(d['leads'] for d in analytics['timeseries']) / len(analytics['timeseries']),
            'conversion_rate': sum(d['conversions'] for d in analytics['timeseries']) / 
                              sum(d['leads'] for d in analytics['timeseries']) * 100 if 
                              sum(d['leads'] for d in analytics['timeseries']) > 0 else 0
        }
        
        logger.info(f"✅ تم إنشاء بيانات تحليلية لـ {days} يوم")
        return analytics


class TestDataManager:
    """Advanced test data management"""
    
    def __init__(self, base_dir: str = "/workspace/saler/test-data"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        self.data_store = {}
        self.generators = TestDataGenerator()
        
    async def seed_database(self, reset_existing: bool = False) -> Dict[str, Any]:
        """Seed database with test data"""
        logger.info("🌱 بدء زرع البيانات الاختبارية...")
        
        if reset_existing:
            await self._reset_database()
        
        # Generate and save all test data
        seed_results = {
            'users': await self._seed_users(),
            'leads': await self._seed_leads(),
            'messages': await self._seed_messages(),
            'integrations': await self._seed_integrations(),
            'analytics': await self._seed_analytics()
        }
        
        logger.info("✅ تم زرع جميع البيانات الاختبارية بنجاح")
        return seed_results
    
    async def _reset_database(self):
        """Reset database"""
        logger.info("🗑️ إعادة تعيين قاعدة البيانات...")
        # Add database reset logic here
        logger.info("✅ تم إعادة تعيين قاعدة البيانات")
    
    async def _seed_users(self) -> List[TestUser]:
        """Seed users"""
        users = self.generators.generate_users(15)
        
        # Save to file
        users_file = self.base_dir / "users.json"
        with open(users_file, 'w', encoding='utf-8') as f:
            json.dump([user.__dict__ for user in users], f, indent=2, ensure_ascii=False, default=str)
        
        return users
    
    async def _seed_leads(self) -> List[TestLead]:
        """Seed leads"""
        leads = self.generators.generate_leads(75)
        
        # Save to file
        leads_file = self.base_dir / "leads.json"
        with open(leads_file, 'w', encoding='utf-8') as f:
            json.dump([lead.__dict__ for lead in leads], f, indent=2, ensure_ascii=False, default=str)
        
        return leads
    
    async def _seed_messages(self) -> List[TestMessage]:
        """Seed messages"""
        messages = self.generators.generate_messages(150)
        
        # Save to file
        messages_file = self.base_dir / "messages.json"
        with open(messages_file, 'w', encoding='utf-8') as f:
            json.dump([msg.__dict__ for msg in messages], f, indent=2, ensure_ascii=False, default=str)
        
        return messages
    
    async def _seed_integrations(self) -> List[TestIntegration]:
        """Seed integrations"""
        integrations = self.generators.generate_integrations(8)
        
        # Save to file
        integrations_file = self.base_dir / "integrations.json"
        with open(integrations_file, 'w', encoding='utf-8') as f:
            json.dump([integration.__dict__ for integration in integrations], f, indent=2, ensure_ascii=False, default=str)
        
        return integrations
    
    async def _seed_analytics(self) -> Dict[str, Any]:
        """Seed analytics data"""
        analytics = self.generators.generate_analytics_data(30)
        
        # Save to file
        analytics_file = self.base_dir / "analytics.json"
        with open(analytics_file, 'w', encoding='utf-8') as f:
            json.dump(analytics, f, indent=2, ensure_ascii=False, default=str)
        
        return analytics
    
    async def get_test_data(self, data_type: str) -> Optional[List[Dict]]:
        """Get test data by type"""
        data_file = self.base_dir / f"{data_type}.json"
        
        if not data_file.exists():
            logger.warning(f"⚠️ ملف البيانات غير موجود: {data_file}")
            return None
        
        with open(data_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    
    async def cleanup_test_data(self):
        """Cleanup all test data"""
        logger.info("🧹 تنظيف البيانات الاختبارية...")
        
        # Remove all files in test-data directory
        for file in self.base_dir.glob("*.json"):
            file.unlink()
            logger.info(f"🗑️ تم حذف: {file.name}")
        
        # Clear data store
        self.data_store.clear()
        
        logger.info("✅ تم تنظيف جميع البيانات الاختبارية")
    
    def create_test_scenarios(self) -> Dict[str, Dict[str, Any]]:
        """Create predefined test scenarios"""
        scenarios = {
            'new_user_onboarding': {
                'name': 'تجربة المستخدم الجديد',
                'description': 'اختبار رحلة المستخدم الجديد من التسجيل إلى أول استخدام',
                'steps': [
                    'إنشاء حساب جديد',
                    'تأكيد البريد الإلكتروني',
                    'إعداد الملف الشخصي',
                    'الانضمام للفريق',
                    'أول عملية CRM'
                ],
                'expected_outcomes': {
                    'signup_success': True,
                    'email_confirmed': True,
                    'profile_completed': True,
                    'team_joined': True,
                    'first_action_completed': True
                }
            },
            'lead_conversion_funnel': {
                'name': 'قمع تحويل العملاء المحتملين',
                'description': 'اختبار رحلة تحويل العميل المحتمل من الظهور إلى الإغلاق',
                'steps': [
                    'عميل محتمل جديد',
                    'اتصال أولي',
                    'تأهيل العميل',
                    'عرض سعر',
                    'تفاوض',
                    'إغلاق الصفقة'
                ],
                'expected_outcomes': {
                    'lead_created': True,
                    'contact_attempted': True,
                    'lead_qualified': True,
                    'proposal_sent': True,
                    'negotiation_started': True,
                    'deal_closed': True
                }
            },
            'integration_sync_test': {
                'name': 'اختبار مزامنة التكاملات',
                'description': 'اختبار مزامنة البيانات مع الخدمات الخارجية',
                'steps': [
                    'تفعيل تكامل',
                    'أول مزامنة',
                    'مزامنة دورية',
                    'حل التعارضات',
                    'مزامنة نهائية'
                ],
                'expected_outcomes': {
                    'integration_active': True,
                    'initial_sync_success': True,
                    'periodic_sync_working': True,
                    'conflicts_resolved': True,
                    'final_sync_complete': True
                }
            },
            'high_volume_processing': {
                'name': 'معالجة الأحجام العالية',
                'description': 'اختبار النظام تحت أحجام بيانات عالية',
                'data_volume': {
                    'users': 1000,
                    'leads': 10000,
                    'messages': 50000,
                    'analytics_records': 100000
                },
                'expected_performance': {
                    'response_time': '< 2 seconds',
                    'memory_usage': '< 1GB',
                    'success_rate': '> 99%'
                }
            }
        }
        
        # Save scenarios
        scenarios_file = self.base_dir / "test_scenarios.json"
        with open(scenarios_file, 'w', encoding='utf-8') as f:
            json.dump(scenarios, f, indent=2, ensure_ascii=False, default=str)
        
        logger.info("📋 تم إنشاء السيناريوهات الاختبارية")
        return scenarios


class MockExternalService:
    """Mock external services for testing"""
    
    def __init__(self):
        self.mock_data = {
            'shopify': {
                'products': [
                    {'id': 1, 'title': 'منتج تجريبي 1', 'price': 99.99},
                    {'id': 2, 'title': 'منتج تجريبي 2', 'price': 149.99}
                ],
                'orders': [
                    {'id': 1, 'total': 99.99, 'status': 'pending'},
                    {'id': 2, 'total': 149.99, 'status': 'completed'}
                ]
            },
            'meta_ads': {
                'campaigns': [
                    {'id': 1, 'name': 'حملة تجريبية', 'status': 'active'},
                    {'id': 2, 'name': 'حملة ترويجية', 'status': 'paused'}
                ],
                'insights': [
                    {'campaign_id': 1, 'impressions': 1000, 'clicks': 50, 'spend': 25.50}
                ]
            },
            'whatsapp': {
                'messages': [
                    {'id': 1, 'from': '1234567890', 'body': 'مرحباً', 'timestamp': 1234567890},
                    {'id': 2, 'from': '0987654321', 'body': 'أهلا وسهلا', 'timestamp': 1234567891}
                ],
                'templates': [
                    {'name': 'welcome', 'language': 'ar', 'status': 'approved'}
                ]
            }
        }
    
    async def get_shopify_products(self) -> List[Dict]:
        """Mock Shopify products API"""
        await asyncio.sleep(0.1)  # Simulate API delay
        return self.mock_data['shopify']['products']
    
    async def get_shopify_orders(self) -> List[Dict]:
        """Mock Shopify orders API"""
        await asyncio.sleep(0.15)
        return self.mock_data['shopify']['orders']
    
    async def get_meta_ads_campaigns(self) -> List[Dict]:
        """Mock Meta Ads campaigns API"""
        await asyncio.sleep(0.2)
        return self.mock_data['meta_ads']['campaigns']
    
    async def get_whatsapp_messages(self) -> List[Dict]:
        """Mock WhatsApp messages API"""
        await asyncio.sleep(0.1)
        return self.mock_data['whatsapp']['messages']


class TestEnvironmentManager:
    """Manage test environments and configurations"""
    
    def __init__(self):
        self.environments = {
            'local': {
                'database_url': 'postgresql://test:test@localhost:5432/saler_test',
                'redis_url': 'redis://localhost:6379/1',
                'api_base_url': 'http://localhost:8000',
                'frontend_url': 'http://localhost:3000',
                'external_services': {
                    'shopify': 'http://localhost:8081/mock/shopify',
                    'meta_ads': 'http://localhost:8082/mock/meta',
                    'whatsapp': 'http://localhost:8083/mock/whatsapp'
                }
            },
            'ci': {
                'database_url': 'postgresql://test:test@postgres:5432/saler_test',
                'redis_url': 'redis://redis:6379/1',
                'api_base_url': 'http://api:8000',
                'frontend_url': 'http://frontend:3000',
                'external_services': {
                    'shopify': 'http://mock-services:8081/shopify',
                    'meta_ads': 'http://mock-services:8082/meta',
                    'whatsapp': 'http://mock-services:8083/whatsapp'
                }
            }
        }
    
    def get_environment_config(self, env: str = 'local') -> Dict[str, Any]:
        """Get environment configuration"""
        return self.environments.get(env, self.environments['local'])
    
    def setup_test_environment(self, env: str = 'local') -> Dict[str, Any]:
        """Setup test environment variables"""
        config = self.get_environment_config(env)
        
        # Set environment variables
        import os
        for key, value in config.items():
            if isinstance(value, dict):
                for sub_key, sub_value in value.items():
                    os.environ[f"{key.upper()}_{sub_key.upper()}"] = str(sub_value)
            else:
                os.environ[key.upper()] = str(value)
        
        logger.info(f"🌍 تم إعداد بيئة الاختبار: {env}")
        return config


# CLI Interface
async def main():
    """Main CLI interface"""
    import argparse
    
    parser = argparse.ArgumentParser(description="إدارة البيانات الاختبارية المتقدمة")
    subparsers = parser.add_subparsers(dest='command', help='الأوامر المتاحة')
    
    # Seed command
    seed_parser = subparsers.add_parser('seed', help='زرع البيانات الاختبارية')
    seed_parser.add_argument('--reset', action='store_true', help='إعادة تعيين البيانات الموجودة')
    
    # Generate command
    gen_parser = subparsers.add_parser('generate', help='توليد بيانات محددة')
    gen_parser.add_argument('--type', required=True, choices=['users', 'leads', 'messages', 'integrations', 'analytics'])
    gen_parser.add_argument('--count', type=int, default=10, help='عدد العناصر')
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='تنظيف البيانات')
    
    # Scenarios command
    scenarios_parser = subparsers.add_parser('scenarios', help='إنشاء سيناريوهات اختبارية')
    
    # Mock command
    mock_parser = subparsers.add_parser('mock', help='تشغيل الخدمات المحاكاة')
    mock_parser.add_argument('--service', required=True, choices=['shopify', 'meta_ads', 'whatsapp', 'all'])
    
    args = parser.parse_args()
    
    data_manager = TestDataManager()
    
    if args.command == 'seed':
        results = await data_manager.seed_database(reset_existing=args.reset)
        print(f"✅ تم زرع البيانات بنجاح: {len(results)} نوع بيانات")
    
    elif args.command == 'generate':
        generator = TestDataGenerator()
        
        if args.type == 'users':
            data = generator.generate_users(args.count)
        elif args.type == 'leads':
            data = generator.generate_leads(args.count)
        elif args.type == 'messages':
            data = generator.generate_messages(args.count)
        elif args.type == 'integrations':
            data = generator.generate_integrations(args.count)
        elif args.type == 'analytics':
            data = generator.generate_analytics_data(args.count)
        
        # Save generated data
        output_file = f"/workspace/saler/test-data/generated_{args.type}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump([item.__dict__ for item in (data if args.type != 'analytics' else [data])], 
                     f, indent=2, ensure_ascii=False, default=str)
        
        print(f"✅ تم توليد {args.count} عنصر من {args.type}")
    
    elif args.command == 'cleanup':
        await data_manager.cleanup_test_data()
        print("🧹 تم تنظيف البيانات الاختبارية")
    
    elif args.command == 'scenarios':
        scenarios = data_manager.create_test_scenarios()
        print(f"📋 تم إنشاء {len(scenarios)} سيناريو اختباري")
    
    elif args.command == 'mock':
        mock_service = MockExternalService()
        
        if args.service == 'shopify':
            products = await mock_service.get_shopify_products()
            print(f"🏪 منتجات Shopify المحاكاة: {len(products)}")
        elif args.service == 'meta_ads':
            campaigns = await mock_service.get_meta_ads_campaigns()
            print(f"📱 حملات Meta Ads المحاكاة: {len(campaigns)}")
        elif args.service == 'whatsapp':
            messages = await mock_service.get_whatsapp_messages()
            print(f"💬 رسائل WhatsApp المحاكاة: {len(messages)}")
        elif args.service == 'all':
            print("🔧 تشغيل جميع الخدمات المحاكاة...")
            # Run all mock services
    
    else:
        parser.print_help()


if __name__ == "__main__":
    asyncio.run(main())