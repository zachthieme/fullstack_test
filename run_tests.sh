#!/bin/bash

# Unified test runner for fullstack feedback application
# This script runs both backend and frontend tests with various options

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default options
RUN_BACKEND=true
RUN_FRONTEND=true
COVERAGE=false
VERBOSE=false
INTEGRATION_ONLY=false
UNIT_ONLY=false
WATCH=false
CI_MODE=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -h, --help              Show this help message
    -b, --backend-only      Run only backend tests
    -f, --frontend-only     Run only frontend tests
    -c, --coverage          Generate coverage reports
    -v, --verbose           Run tests in verbose mode
    -i, --integration       Run only integration tests
    -u, --unit             Run only unit tests
    -w, --watch            Run tests in watch mode (frontend only)
    --ci                   Run in CI mode (no interactive prompts)

Examples:
    $0                     # Run all tests
    $0 -c                  # Run all tests with coverage
    $0 -b -v               # Run backend tests in verbose mode
    $0 -f -i               # Run frontend integration tests only
    $0 --ci -c             # Run all tests with coverage in CI mode

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -b|--backend-only)
            RUN_BACKEND=true
            RUN_FRONTEND=false
            shift
            ;;
        -f|--frontend-only)
            RUN_BACKEND=false
            RUN_FRONTEND=true
            shift
            ;;
        -c|--coverage)
            COVERAGE=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -i|--integration)
            INTEGRATION_ONLY=true
            UNIT_ONLY=false
            shift
            ;;
        -u|--unit)
            UNIT_ONLY=true
            INTEGRATION_ONLY=false
            shift
            ;;
        -w|--watch)
            WATCH=true
            shift
            ;;
        --ci)
            CI_MODE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Validate combinations
if [[ "$INTEGRATION_ONLY" == true && "$UNIT_ONLY" == true ]]; then
    print_error "Cannot specify both --integration and --unit"
    exit 1
fi

if [[ "$WATCH" == true && "$CI_MODE" == true ]]; then
    print_error "Cannot use --watch in CI mode"
    exit 1
fi

if [[ "$WATCH" == true && "$RUN_BACKEND" == true && "$RUN_FRONTEND" == false ]]; then
    print_error "Watch mode is only available for frontend tests"
    exit 1
fi

# Check if we're in the correct directory
if [[ ! -d "backend" || ! -d "frontend" ]]; then
    print_error "This script must be run from the fullstack_test directory"
    exit 1
fi

# Check if we're in a Nix environment
if [[ -n "$IN_NIX_SHELL" ]]; then
    print_status "Running in Nix environment"
elif [[ -f "shell.nix" || -f "flake.nix" ]]; then
    print_warning "Nix configuration found but not in nix-shell"
    print_warning "For best results, run: nix-shell (or nix develop for flakes)"
fi

# Function to check dependencies
check_dependencies() {
    print_status "Checking dependencies..."
    
    if [[ "$RUN_BACKEND" == true ]]; then
        if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
            print_error "Python 3 is required but not installed"
            exit 1
        fi
        
        # Use python or python3, whichever is available
        PYTHON_CMD="python3"
        if ! command -v python3 &> /dev/null && command -v python &> /dev/null; then
            PYTHON_CMD="python"
        fi
        
        if ! $PYTHON_CMD -c "import pytest" 2>/dev/null; then
            if [[ -n "$IN_NIX_SHELL" ]]; then
                print_error "pytest not available in Nix environment. Check your shell.nix or flake.nix configuration"
                exit 1
            else
                print_warning "pytest not found, attempting to install backend dependencies..."
                if command -v pip3 &> /dev/null; then
                    cd backend && pip3 install -r requirements.txt && cd ..
                elif command -v pip &> /dev/null; then
                    cd backend && pip install -r requirements.txt && cd ..
                else
                    print_error "pip is required but not installed"
                    exit 1
                fi
            fi
        fi
    fi
    
    if [[ "$RUN_FRONTEND" == true ]]; then
        if ! command -v npm &> /dev/null; then
            print_error "npm is required but not installed"
            exit 1
        fi
        
        if [[ ! -d "frontend/node_modules" ]]; then
            print_warning "node_modules not found, installing frontend dependencies..."
            cd frontend
            npm install
            cd ..
        fi
    fi
    
    print_success "Dependencies check completed"
}

# Function to run backend tests
run_backend_tests() {
    print_status "Running backend tests..."
    
    cd backend
    
    # Build pytest command - use python or python3
    PYTHON_CMD="python3"
    if ! command -v python3 &> /dev/null && command -v python &> /dev/null; then
        PYTHON_CMD="python"
    fi
    
    PYTEST_CMD="$PYTHON_CMD -m pytest"
    
    if [[ "$VERBOSE" == true ]]; then
        PYTEST_CMD="$PYTEST_CMD -v"
    fi
    
    if [[ "$COVERAGE" == true ]]; then
        PYTEST_CMD="$PYTEST_CMD --cov=app --cov-report=html --cov-report=term-missing"
        if [[ "$CI_MODE" == true ]]; then
            PYTEST_CMD="$PYTEST_CMD --cov-report=xml --cov-fail-under=80"
        fi
    fi
    
    if [[ "$INTEGRATION_ONLY" == true ]]; then
        PYTEST_CMD="$PYTEST_CMD -m integration"
    elif [[ "$UNIT_ONLY" == true ]]; then
        PYTEST_CMD="$PYTEST_CMD -m 'not integration'"
    fi
    
    print_status "Executing: $PYTEST_CMD"
    
    if eval "$PYTEST_CMD"; then
        print_success "Backend tests passed"
        if [[ "$COVERAGE" == true && "$CI_MODE" == false ]]; then
            print_status "Backend coverage report generated in backend/htmlcov/"
        fi
    else
        print_error "Backend tests failed"
        cd ..
        exit 1
    fi
    
    cd ..
}

# Function to run frontend tests
run_frontend_tests() {
    print_status "Running frontend tests..."
    
    cd frontend
    
    # Build npm test command
    if [[ "$WATCH" == true ]]; then
        NPM_CMD="npm run test:watch"
    elif [[ "$COVERAGE" == true ]]; then
        NPM_CMD="npm run test:coverage"
    elif [[ "$CI_MODE" == true ]]; then
        NPM_CMD="npm run test:ci"
    elif [[ "$INTEGRATION_ONLY" == true ]]; then
        NPM_CMD="npm run test:integration"
    elif [[ "$UNIT_ONLY" == true ]]; then
        NPM_CMD="npm run test:unit"
    else
        # Default: run once without watch
        NPM_CMD="npm test -- --watchAll=false"
    fi
    
    if [[ "$VERBOSE" == true && "$WATCH" == false ]]; then
        NPM_CMD="$NPM_CMD -- --verbose"
    fi
    
    print_status "Executing: $NPM_CMD"
    
    if [[ "$WATCH" == true ]]; then
        print_status "Starting frontend tests in watch mode (Press Ctrl+C to exit)"
        eval "$NPM_CMD"
    else
        # Set CI environment variable to avoid interactive prompts
        if [[ "$CI_MODE" == true ]]; then
            export CI=true
        fi
        
        if eval "$NPM_CMD"; then
            print_success "Frontend tests passed"
            if [[ "$COVERAGE" == true && "$CI_MODE" == false ]]; then
                print_status "Frontend coverage report generated in frontend/coverage/"
            fi
        else
            print_error "Frontend tests failed"
            cd ..
            exit 1
        fi
    fi
    
    cd ..
}

# Function to generate summary
generate_summary() {
    if [[ "$CI_MODE" == false && "$WATCH" == false ]]; then
        echo
        print_status "=== TEST SUMMARY ==="
        
        if [[ "$RUN_BACKEND" == true ]]; then
            echo "✓ Backend tests completed"
        fi
        
        if [[ "$RUN_FRONTEND" == true ]]; then
            echo "✓ Frontend tests completed"
        fi
        
        if [[ "$COVERAGE" == true ]]; then
            echo
            print_status "Coverage reports:"
            if [[ "$RUN_BACKEND" == true ]]; then
                echo "  Backend: backend/htmlcov/index.html"
            fi
            if [[ "$RUN_FRONTEND" == true ]]; then
                echo "  Frontend: frontend/coverage/lcov-report/index.html"
            fi
        fi
        
        echo
        print_success "All tests completed successfully!"
    fi
}

# Main execution
main() {
    echo
    print_status "Starting fullstack test suite..."
    echo
    
    # Show configuration
    if [[ "$CI_MODE" == false ]]; then
        print_status "Configuration:"
        echo "  Backend tests: $RUN_BACKEND"
        echo "  Frontend tests: $RUN_FRONTEND"
        echo "  Coverage: $COVERAGE"
        echo "  Verbose: $VERBOSE"
        if [[ "$INTEGRATION_ONLY" == true ]]; then
            echo "  Test type: Integration only"
        elif [[ "$UNIT_ONLY" == true ]]; then
            echo "  Test type: Unit only"
        else
            echo "  Test type: All tests"
        fi
        echo "  Watch mode: $WATCH"
        echo "  CI mode: $CI_MODE"
        if [[ -n "$IN_NIX_SHELL" ]]; then
            echo "  Nix environment: Yes"
        fi
        echo
    fi
    
    check_dependencies
    
    # Run tests
    if [[ "$RUN_BACKEND" == true ]]; then
        run_backend_tests
    fi
    
    if [[ "$RUN_FRONTEND" == true ]]; then
        run_frontend_tests
    fi
    
    generate_summary
}

# Run main function
main "$@"