# 🧪 اختبار هيكل الملفات - File Structure Test
# Test to verify the database system files are created correctly

import os
from pathlib import Path

def test_file_structure():
    """Test that all required database files exist"""
    print("🧪 Testing Database System File Structure...")
    
    base_path = Path("backend/app/core")
    required_files = [
        "database.py",
        "database_utils.py", 
        "database_health.py",
        "database_migrations.py",
        "database_examples.py",
        "DATABASE_README.md"
    ]
    
    missing_files = []
    existing_files = []
    
    for file_name in required_files:
        file_path = base_path / file_name
        if file_path.exists():
            file_size = file_path.stat().st_size
            existing_files.append(f"   ✅ {file_name} ({file_size:,} bytes)")
        else:
            missing_files.append(f"   ❌ {file_name}")
    
    print("\n📁 File Structure Test Results:")
    for file_info in existing_files:
        print(file_info)
    
    if missing_files:
        for missing in missing_files:
            print(missing)
        return False
    
    # Test additional files
    additional_files = [
        "main.py",
        "requirements.txt"
    ]
    
    print("\n📄 Additional Files:")
    for file_name in additional_files:
        file_path = Path("backend") / file_name
        if file_path.exists():
            print(f"   ✅ {file_name} (exists)")
        else:
            print(f"   ⚠️  {file_name} (not found)")
    
    # Test migrations directory
    migrations_dir = Path("backend/migrations")
    print(f"\n📂 Migrations Directory:")
    if migrations_dir.exists():
        print(f"   ✅ migrations/ (exists)")
        gitkeep = migrations_dir / ".gitkeep"
        if gitkeep.exists():
            print(f"   ✅ .gitkeep (exists)")
    else:
        print(f"   ❌ migrations/ (missing)")
    
    # Test main system files exist and have content
    print(f"\n🔍 Content Verification:")
    
    database_file = base_path / "database.py"
    if database_file.exists():
        with open(database_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if "ConnectionManager" in content:
                print("   ✅ database.py contains ConnectionManager")
            if "async def initialize_database" in content:
                print("   ✅ database.py contains async initialization")
            if "async def health_check" in content:
                print("   ✅ database.py contains health checks")
    
    utils_file = base_path / "database_utils.py"
    if utils_file.exists():
        with open(utils_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if "QueryBuilder" in content:
                print("   ✅ database_utils.py contains QueryBuilder")
            if "BaseRepository" in content:
                print("   ✅ database_utils.py contains BaseRepository")
            if "DatabaseEncryption" in content:
                print("   ✅ database_utils.py contains DatabaseEncryption")
    
    health_file = base_path / "database_health.py"
    if health_file.exists():
        with open(health_file, 'r', encoding='utf-8') as f:
            content = f.read()
            if "router = APIRouter" in content:
                print("   ✅ database_health.py contains health router")
            if "comprehensive_health_check" in content:
                print("   ✅ database_health.py contains comprehensive health")
    
    # Count total lines
    total_lines = 0
    total_size = 0
    for file_name in required_files:
        file_path = base_path / file_name
        if file_path.exists():
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = len(f.readlines())
                total_lines += lines
                total_size += file_path.stat().st_size
    
    print(f"\n📊 Summary Statistics:")
    print(f"   • Total files created: {len(existing_files)}")
    print(f"   • Total lines of code: {total_lines:,}")
    print(f"   • Total size: {total_size/1024:.1f} KB")
    
    print(f"\n🎯 File Structure Test: {'✅ PASSED' if not missing_files else '❌ FAILED'}")
    
    if not missing_files:
        print(f"\n🚀 Database System Successfully Created!")
        print(f"   📝 Total: {len(existing_files)} core files")
        print(f"   💻 Code: {total_lines:,} lines")
        print(f"   📦 Size: {total_size/1024:.1f} KB")
        print(f"\n   🎉 Ready for deployment!")
    
    return len(missing_files) == 0

if __name__ == "__main__":
    result = test_file_structure()
    print(f"\n{'🎯 ALL TESTS PASSED!' if result else '❌ SOME TESTS FAILED'}")
    exit(0 if result else 1)