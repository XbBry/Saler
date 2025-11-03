#!/bin/bash

# Quick Pre-commit Test Script
# اختبار سريع للـ pre-commit hooks

set -e

echo "🚀 Saler Pre-commit Hooks - اختبار سريع"
echo "=========================================="

# الألوان
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

# فحص وجود Python
if ! command -v python3 &> /dev/null; then
    print_error "Python3 غير مثبت!"
    exit 1
fi

print_success "Python3 متوفر"

# فحص وجود pre-commit
if ! command -v pre-commit &> /dev/null; then
    print_warning "pre-commit غير مثبت. جاري التثبيت..."
    pip install pre-commit
fi

print_success "pre-commit متوفر"

# فحص وجود ملفات الإعدادات
config_files=(".pre-commit-config.yaml" "setup.cfg" "pyproject.toml" ".mypy.ini")

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        print_success "ملف $file موجود"
    else
        print_warning "ملف $file غير موجود"
    fi
done

# تشغيل اختبار سريع
print_info "تشغيل اختبار سريع للـ hooks..."

if pre-commit run --all-files --show-diff-on-failure; then
    print_success "جميع الـ hooks تعمل بنجاح!"
else
    print_error "بعض الـ hooks فشلت. تحقق من الأخطاء أعلاه."
    print_info "لإصلاح المشاكل تلقائياً، استخدم: make pc-fix"
fi

echo ""
print_success "انتهى الاختبار السريع!"
echo ""
echo "الأوامر المفيدة:"
echo "  make pc-setup          - إعداد شامل"
echo "  make pc-run            - تشغيل جميع الـ hooks"
echo "  make pc-fix            - إصلاح تلقائي"
echo "  make pc-check          - فحص دون إصلاح"
echo ""