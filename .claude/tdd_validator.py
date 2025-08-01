#!/usr/bin/env python3
"""
Custom TDD Validator for Claude Code hooks
Validates that code changes follow Test-Driven Development principles
"""
import json
import sys
import os
import subprocess
from pathlib import Path

def run_tests():
    """Run pytest and return results"""
    try:
        result = subprocess.run(
            ["uv", "run", "pytest", "--tb=short", "-q"],
            capture_output=True,
            text=True,
            cwd=Path.cwd()
        )
        return {
            "success": result.returncode == 0,
            "output": result.stdout + result.stderr,
            "has_failures": "FAILED" in result.stdout
        }
    except Exception as e:
        return {"success": False, "output": str(e), "has_failures": False}

def validate_tdd_cycle(tool, file_path, content):
    """Validate TDD cycle based on file changes"""
    
    # Allow non-Python files to pass through
    if not file_path.endswith('.py'):
        return {"allowed": True, "reason": "Non-Python file"}
    
    # Allow test files - they should be created first in RED phase
    if 'test_' in os.path.basename(file_path) or file_path.endswith('_test.py'):
        return {"allowed": True, "reason": "Test file creation/modification allowed"}
    
    # Check if this is a new file or modification
    file_exists = os.path.exists(file_path)
    
    # For new implementation files, ensure we have tests
    if not file_exists:
        # Look for corresponding test files
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        test_patterns = [
            f"test_{base_name}.py",
            f"{base_name}_test.py",
            f"tests/test_{base_name}.py",
            f"tests/{base_name}_test.py"
        ]
        
        has_tests = any(os.path.exists(pattern) for pattern in test_patterns)
        
        if not has_tests:
            return {
                "allowed": False,
                "reason": f"RED PHASE VIOLATION: Creating implementation file '{file_path}' without corresponding tests. Create tests first!"
            }
    
    # Run tests to check current state
    test_results = run_tests()
    
    # If tests are failing, we're in RED phase - implementation changes are allowed
    if test_results["has_failures"]:
        return {"allowed": True, "reason": "GREEN PHASE: Tests failing, implementation changes allowed"}
    
    # If all tests pass, new implementation should be accompanied by new failing tests
    # This is a simplified check - in practice, you might want more sophisticated logic
    if 'def ' in content and not test_results["has_failures"]:
        return {
            "allowed": True,  # Allow but warn
            "reason": "REFACTOR PHASE: All tests passing, ensure new functionality has corresponding failing tests first"
        }
    
    return {"allowed": True, "reason": "Change approved"}

def main():
    """Main hook entry point"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        tool = input_data.get("tool", "Unknown")
        tool_input = input_data.get("tool_input", {})
        
        # Extract file path and content based on tool type
        if tool in ["Write", "Edit", "MultiEdit"]:
            if tool == "MultiEdit":
                # Handle multiple edits - check each one
                edits = tool_input.get("edits", [])
                file_path = tool_input.get("file_path", "")
                
                for edit in edits:
                    result = validate_tdd_cycle(tool, file_path, edit.get("new_string", ""))
                    if not result["allowed"]:
                        print(json.dumps({
                            "reason": result["reason"]
                        }))
                        sys.exit(1)
            else:
                file_path = tool_input.get("file_path", "")
                content = tool_input.get("content", "") or tool_input.get("new_string", "")
                
                result = validate_tdd_cycle(tool, file_path, content)
                if not result["allowed"]:
                    print(json.dumps({
                        "reason": result["reason"]
                    }))
                    sys.exit(1)
        
        # If we get here, the change is allowed
        print(json.dumps({"reason": ""}))
        sys.exit(0)
        
    except Exception as e:
        # On any error, allow the operation but log the error
        print(json.dumps({
            "reason": f"TDD Validator Error: {str(e)} - Operation allowed"
        }))
        sys.exit(0)

if __name__ == "__main__":
    main()