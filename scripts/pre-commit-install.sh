#!/bin/bash

# Pre-commit Installation Script
# This script installs and configures pre-commit hooks for the Saler project

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check Python version
check_python_version() {
    if command_exists python3; then
        PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
        print_status "Found Python version: $PYTHON_VERSION"
        
        # Check if Python version is 3.12 or higher
        if python3 -c "import sys; exit(0 if sys.version_info >= (3, 12) else 1)"; then
            print_success "Python version is compatible (>= 3.12)"
            PYTHON_CMD="python3"
        else
            print_error "Python 3.12+ is required. Found: $PYTHON_VERSION"
            exit 1
        fi
    else
        print_error "Python 3 not found. Please install Python 3.12+"
        exit 1
    fi
}

# Function to install Python dependencies
install_python_deps() {
    print_status "Installing Python development dependencies..."
    
    # Create requirements-dev.txt if it doesn't exist
    if [ ! -f "requirements-dev.txt" ]; then
        print_status "Creating requirements-dev.txt..."
        cat > requirements-dev.txt << 'EOF'
# Development Dependencies
pre-commit>=3.6.0
black>=23.12.0
isort>=5.13.0
flake8>=7.0.0
mypy>=1.8.0
bandit[toml]>=1.7.5
pytest>=7.4.0
pytest-asyncio>=0.21.0
pytest-cov>=4.1.0
coverage>=7.3.0
faker>=20.1.0
factory-boy>=3.3.0
bandit[toml]>=1.7.5
flake8-docstrings>=1.7.0
flake8-bugbear>=23.12.0
flake8-comprehensions>=3.14.0
flake8-simplify>=0.21.0
mypy-extensions>=1.0.0
types-requests>=2.31.0
types-redis>=4.6.0
types-PyYAML>=6.0.0
types-setuptools>=69.0.0
types-aiofiles>=23.2.0
EOF
        print_success "Created requirements-dev.txt"
    fi
    
    # Upgrade pip first
    $PYTHON_CMD -m pip install --upgrade pip
    
    # Install development dependencies
    if [ -f "requirements-dev.txt" ]; then
        $PYTHON_CMD -m pip install -r requirements-dev.txt
        print_success "Python development dependencies installed"
    else
        print_error "requirements-dev.txt not found"
        exit 1
    fi
}

# Function to install Node.js dependencies (for frontend hooks)
install_node_deps() {
    if [ -d "frontend" ]; then
        print_status "Installing Node.js dependencies for frontend..."
        
        # Check if npm is available
        if command_exists npm; then
            cd frontend
            if [ -f "package.json" ]; then
                npm install
                print_success "Node.js dependencies installed"
            else
                print_warning "package.json not found in frontend directory"
            fi
            cd ..
        else
            print_warning "npm not found. Skipping Node.js dependencies installation"
        fi
    fi
}

# Function to install pre-commit
install_pre_commit() {
    print_status "Installing pre-commit..."
    
    if command_exists pre-commit; then
        print_success "pre-commit is already installed"
    else
        $PYTHON_CMD -m pip install pre-commit
        print_success "pre-commit installed successfully"
    fi
}

# Function to install pre-commit hooks
install_hooks() {
    print_status "Installing pre-commit hooks..."
    
    if [ -f ".pre-commit-config.yaml" ]; then
        pre-commit install
        pre-commit install --hook-type commit-msg
        print_success "pre-commit hooks installed"
    else
        print_error ".pre-commit-config.yaml not found"
        exit 1
    fi
}

# Function to verify installation
verify_installation() {
    print_status "Verifying installation..."
    
    # Check if hooks are installed
    if [ -f ".git/hooks/pre-commit" ]; then
        print_success "Pre-commit hooks are installed"
    else
        print_error "Pre-commit hooks installation failed"
        exit 1
    fi
    
    # Run a test
    print_status "Running pre-commit test..."
    if pre-commit run --all-files; then
        print_success "Pre-commit test completed successfully"
    else
        print_warning "Some pre-commit checks failed. This is normal for first run."
    fi
}

# Function to create useful aliases
create_aliases() {
    print_status "Creating useful aliases..."
    
    cat > scripts/pre-commit-commands.sh << 'EOF'
#!/bin/bash

# Pre-commit commands for easy use

# Run all hooks on all files
alias pc-all="pre-commit run --all-files"

# Run specific hooks
alias pc-black="pre-commit run black"
alias pc-isort="pre-commit run isort"
alias pc-flake8="pre-commit run flake8"
alias pc-mypy="pre-commit run mypy"
alias pc-bandit="pre-commit run bandit"
alias pc-eslint="pre-commit run eslint"
alias pc-prettier="pre-commit run prettier"

# Update hooks
alias pc-update="pre-commit autoupdate"

# Install hooks
alias pc-install="pre-commit install"

# Run on staged files only
alias pc-staged="pre-commit run"

# Skip hooks for this commit (emergency use only)
alias pc-skip="git commit --no-verify"

# Show pre-commit status
alias pc-status="pre-commit run --help"

echo "Pre-commit aliases loaded:"
echo "  pc-all     - Run all hooks on all files"
echo "  pc-black   - Run Black formatter only"
echo "  pc-isort   - Run isort only"
echo "  pc-flake8  - Run flake8 linter only"
echo "  pc-mypy    - Run MyPy type checker only"
echo "  pc-eslint  - Run ESLint only"
echo "  pc-prettier - Run Prettier only"
echo "  pc-update  - Update all hooks"
echo "  pc-install - Install hooks"
echo "  pc-staged  - Run on staged files"
echo "  pc-skip    - Skip hooks (emergency only)"
echo "  pc-status  - Show help"
EOF
    
    chmod +x scripts/pre-commit-commands.sh
    print_success "Created scripts/pre-commit-commands.sh"
}

# Function to display usage information
show_usage() {
    echo ""
    print_success "Pre-commit installation completed!"
    echo ""
    echo "Available commands:"
    echo "  source scripts/pre-commit-commands.sh   # Load aliases"
    echo "  pre-commit run --all-files              # Run all hooks"
    echo "  pre-commit run                          # Run on staged files"
    echo "  pre-commit autoupdate                   # Update hooks"
    echo "  git commit -m 'your message'            # Normal commit with hooks"
    echo "  git commit --no-verify -m 'message'     # Skip hooks (emergency)"
    echo ""
    echo "Configuration files created:"
    echo "  - .pre-commit-config.yaml    # Main configuration"
    echo "  - setup.cfg                  # Flake8 configuration"
    echo "  - pyproject.toml             # Black and isort settings"
    echo "  - .mypy.ini                  # MyPy configuration"
    echo "  - requirements-dev.txt       # Development dependencies"
    echo "  - scripts/pre-commit-commands.sh # Helper aliases"
    echo ""
    echo "To get started:"
    echo "  1. Source the aliases: source scripts/pre-commit-commands.sh"
    echo "  2. Make a test commit to see hooks in action"
    echo ""
}

# Main installation process
main() {
    print_status "Starting pre-commit installation for Saler project..."
    echo ""
    
    # Check prerequisites
    check_python_version
    
    # Install dependencies
    install_python_deps
    install_node_deps
    
    # Install and configure pre-commit
    install_pre_commit
    install_hooks
    
    # Create helper scripts
    create_aliases
    
    # Verify installation
    verify_installation
    
    # Show usage information
    show_usage
}

# Run main function
main "$@"