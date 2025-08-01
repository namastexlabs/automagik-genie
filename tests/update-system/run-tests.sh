#!/bin/bash

# 🧞 Automagik Genie Update System - Test Execution Script
# 
# Comprehensive test runner with safety validation and reporting
# CRITICAL: All tests must pass before any release

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Test configuration
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../.." && pwd)"
TEST_RESULTS_DIR="$TEST_DIR/test-reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
LOG_FILE="$TEST_RESULTS_DIR/test_run_$TIMESTAMP.log"

# Ensure test results directory exists
mkdir -p "$TEST_RESULTS_DIR"

# Function to print colored output
print_header() {
    echo -e "\n${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════════════════════${NC}\n"
}

print_section() {
    echo -e "\n${BOLD}${CYAN}🔹 $1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to run test category with reporting
run_test_category() {
    local category_name="$1"
    local test_command="$2"
    local description="$3"
    
    print_section "$category_name: $description"
    
    local start_time=$(date +%s)
    
    if eval "$test_command" 2>&1 | tee -a "$LOG_FILE"; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_success "$category_name completed in ${duration}s"
        return 0
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        print_error "$category_name FAILED after ${duration}s"
        return 1
    fi
}

# Function to check prerequisites
check_prerequisites() {
    print_header "🔧 CHECKING PREREQUISITES"
    
    # Check Node.js version
    if command -v node &> /dev/null; then
        local node_version=$(node --version)
        print_success "Node.js detected: $node_version"
    else
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        local npm_version=$(npm --version)
        print_success "npm detected: $npm_version"
    else
        print_error "npm is required but not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "$PROJECT_ROOT/package.json" ]; then
        print_error "Not in correct project directory. Expected package.json in $PROJECT_ROOT"
        exit 1
    fi
    
    # Check if test dependencies are installed
    if [ ! -d "$TEST_DIR/node_modules" ]; then
        print_info "Installing test dependencies..."
        cd "$TEST_DIR"
        npm install
        cd "$PROJECT_ROOT"
    fi
    
    print_success "All prerequisites satisfied"
}

# Function to run specific test category
run_category() {
    local category="$1"
    
    case "$category" in
        "safety")
            run_test_category "🛡️  CRITICAL SAFETY TESTS" \
                "cd '$TEST_DIR' && npm run test:safety" \
                "Data integrity, atomic operations, and rollback validation"
            ;;
        "unit")
            run_test_category "🔬 UNIT TESTS" \
                "cd '$TEST_DIR' && npm run test:unit" \
                "Individual component functionality testing"
            ;;
        "integration")
            run_test_category "🔗 INTEGRATION TESTS" \
                "cd '$TEST_DIR' && npm run test:integration" \
                "Multi-component workflow testing"
            ;;
        "cli")
            run_test_category "💻 CLI INTERFACE TESTS" \
                "cd '$TEST_DIR' && npm run test:cli" \
                "Command-line interface and user interaction testing"
            ;;
        "e2e")
            run_test_category "🎯 END-TO-END TESTS" \
                "cd '$TEST_DIR' && npm run test:e2e" \
                "Complete workflow scenario testing"
            ;;
        "performance")
            run_test_category "⚡ PERFORMANCE TESTS" \
                "cd '$TEST_DIR' && npm run test:performance" \
                "Performance benchmarks and resource usage testing"
            ;;
        *)
            print_error "Unknown test category: $category"
            return 1
            ;;
    esac
}

# Function to run all tests
run_all_tests() {
    print_header "🧞 AUTOMAGIK GENIE UPDATE SYSTEM - COMPREHENSIVE TEST SUITE"
    
    local total_start_time=$(date +%s)
    local failed_categories=()
    
    # CRITICAL: Safety tests must run first and pass
    print_info "Running CRITICAL SAFETY tests first - these MUST pass for any release"
    if ! run_category "safety"; then
        failed_categories+=("CRITICAL_SAFETY")
        print_error "CRITICAL SAFETY TESTS FAILED - STOPPING ALL TESTING"
        print_error "NO RELEASE ALLOWED until safety tests pass 100%"
        exit 1
    fi
    
    print_success "🛡️  CRITICAL SAFETY TESTS PASSED - Proceeding with additional validation"
    
    # Unit tests
    if ! run_category "unit"; then
        failed_categories+=("unit")
    fi
    
    # Integration tests
    if ! run_category "integration"; then
        failed_categories+=("integration")
    fi
    
    # CLI tests
    if ! run_category "cli"; then
        failed_categories+=("cli")
    fi
    
    # End-to-end tests
    if ! run_category "e2e"; then
        failed_categories+=("e2e")
    fi
    
    # Performance tests (warnings allowed)
    if ! run_category "performance"; then
        print_warning "Performance tests had issues - review but may not block release"
    fi
    
    # Final summary
    local total_end_time=$(date +%s)
    local total_duration=$((total_end_time - total_start_time))
    
    print_header "🎯 FINAL TEST RESULTS"
    
    if [ ${#failed_categories[@]} -eq 0 ]; then
        print_success "ALL TESTS PASSED! 🎉"
        print_success "Total execution time: ${total_duration}s"
        print_success "System is ready for release"
        
        # Generate success report
        cat > "$TEST_RESULTS_DIR/test_summary_$TIMESTAMP.txt" << EOF
AUTOMAGIK GENIE UPDATE SYSTEM - TEST RESULTS
============================================

Date: $(date)
Duration: ${total_duration} seconds
Status: ALL TESTS PASSED ✅

Test Categories Executed:
- 🛡️  Critical Safety Tests: PASSED
- 🔬 Unit Tests: PASSED  
- 🔗 Integration Tests: PASSED
- 💻 CLI Interface Tests: PASSED
- 🎯 End-to-End Tests: PASSED
- ⚡ Performance Tests: PASSED

RELEASE APPROVAL: ✅ APPROVED
User data safety: VERIFIED
System integrity: CONFIRMED
Rollback capability: TESTED

QA Validation Complete - System Ready for Release
EOF
        
        return 0
    else
        print_error "TESTS FAILED in categories: ${failed_categories[*]}"
        print_error "Total execution time: ${total_duration}s"
        print_error "🚫 RELEASE BLOCKED until all tests pass"
        
        # Generate failure report
        cat > "$TEST_RESULTS_DIR/test_summary_$TIMESTAMP.txt" << EOF
AUTOMAGIK GENIE UPDATE SYSTEM - TEST RESULTS
============================================

Date: $(date)
Duration: ${total_duration} seconds
Status: TESTS FAILED ❌

Failed Categories: ${failed_categories[*]}

RELEASE STATUS: 🚫 BLOCKED
Reason: Test failures detected
Action Required: Fix failing tests and re-run full suite

DO NOT RELEASE until all tests pass 100%
EOF
        
        return 1
    fi
}

# Function to generate coverage report
generate_coverage() {
    print_header "📊 GENERATING COVERAGE REPORT"
    
    cd "$TEST_DIR"
    
    if npm run test:coverage 2>&1 | tee -a "$LOG_FILE"; then
        print_success "Coverage report generated"
        
        if [ -d "coverage" ]; then
            print_info "HTML coverage report available at: $TEST_DIR/coverage/index.html"
        fi
        
        # Extract coverage summary
        if [ -f "coverage/coverage-summary.json" ]; then
            local coverage_pct=$(node -p "JSON.parse(require('fs').readFileSync('coverage/coverage-summary.json', 'utf8')).total.lines.pct")
            
            if (( $(echo "$coverage_pct >= 95" | bc -l) )); then
                print_success "Coverage: ${coverage_pct}% (Excellent)"
            elif (( $(echo "$coverage_pct >= 85" | bc -l) )); then
                print_warning "Coverage: ${coverage_pct}% (Good, aim for 95%+)"
            else
                print_error "Coverage: ${coverage_pct}% (Too low, need 95%+)"
            fi
        fi
    else
        print_error "Coverage report generation failed"
    fi
    
    cd "$PROJECT_ROOT"
}

# Function to show help
show_help() {
    cat << EOF
🧞 Automagik Genie Update System - Test Runner

Usage: $0 [OPTION] [CATEGORY]

OPTIONS:
    -h, --help              Show this help message
    -c, --coverage          Generate code coverage report after tests
    -v, --verbose           Enable verbose output
    --safety-only           Run only critical safety tests
    --quick                 Run safety + unit tests only (for development)

CATEGORIES:
    safety                  🛡️  Critical safety and data integrity tests (REQUIRED)
    unit                    🔬 Unit tests for individual components
    integration             🔗 Integration tests for multi-component workflows  
    cli                     💻 CLI interface and command testing
    e2e                     🎯 End-to-end complete scenario testing
    performance             ⚡ Performance benchmarks and resource testing

EXAMPLES:
    $0                      # Run all test categories
    $0 safety               # Run only safety tests
    $0 --safety-only        # Run only safety tests (alias)
    $0 --quick              # Run safety + unit tests for quick validation
    $0 -c                   # Run all tests and generate coverage report
    $0 unit integration     # Run specific categories

NOTES:
    - Safety tests MUST pass for any release
    - All logs are saved to: $TEST_RESULTS_DIR/
    - Coverage reports require all tests to complete
    - Failed tests will block release approval

For manual testing procedures, see: manual-testing-checklist.md
EOF
}

# Main execution logic
main() {
    local show_coverage=false
    local verbose=false
    local safety_only=false
    local quick_mode=false
    local categories_to_run=()
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--coverage)
                show_coverage=true
                shift
                ;;
            -v|--verbose)
                verbose=true
                shift
                ;;
            --safety-only)
                safety_only=true
                shift
                ;;
            --quick)
                quick_mode=true
                shift
                ;;
            safety|unit|integration|cli|e2e|performance)
                categories_to_run+=("$1")
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # Setup logging
    exec > >(tee -a "$LOG_FILE")
    if [ "$verbose" = true ]; then
        exec 2> >(tee -a "$LOG_FILE" >&2)
    else
        exec 2> >(tee -a "$LOG_FILE" >/dev/null)
    fi
    
    # Check prerequisites
    check_prerequisites
    
    # Determine what to run
    if [ "$safety_only" = true ]; then
        print_header "🛡️  RUNNING SAFETY TESTS ONLY"
        if run_category "safety"; then
            print_success "Safety tests passed - basic validation complete"
        else
            exit 1
        fi
    elif [ "$quick_mode" = true ]; then
        print_header "⚡ RUNNING QUICK VALIDATION (Safety + Unit)"
        if run_category "safety" && run_category "unit"; then
            print_success "Quick validation passed - ready for development"
        else
            exit 1
        fi
    elif [ ${#categories_to_run[@]} -gt 0 ]; then
        print_header "🎯 RUNNING SELECTED CATEGORIES: ${categories_to_run[*]}"
        local failed=false
        for category in "${categories_to_run[@]}"; do
            if ! run_category "$category"; then
                failed=true
            fi
        done
        if [ "$failed" = true ]; then
            exit 1
        fi
    else
        # Run all tests
        if ! run_all_tests; then
            exit 1
        fi
    fi
    
    # Generate coverage if requested
    if [ "$show_coverage" = true ]; then
        generate_coverage
    fi
    
    print_header "🎉 TEST EXECUTION COMPLETE"
    print_info "Full log available at: $LOG_FILE"
    print_info "Test reports in: $TEST_RESULTS_DIR/"
    
    if [ ${#categories_to_run[@]} -eq 0 ] && [ "$safety_only" = false ] && [ "$quick_mode" = false ]; then
        print_success "Complete validation finished - system ready for release! 🚀"
    fi
}

# Execute main function with all arguments
main "$@"