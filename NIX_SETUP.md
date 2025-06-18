# Nix Environment Setup Guide

This guide will help you set up a Nix development environment with all the dependencies needed to run the comprehensive test suite for the fullstack feedback application.

## Prerequisites

- Nix package manager installed on your system
- Basic familiarity with Nix (optional but helpful)

## Quick Start

### Option 1: Using Nix Shell (Classic)

1. **Enter the development environment:**
   ```bash
   cd fullstack_test
   nix-shell
   ```

2. **Run tests:**
   ```bash
   # Run all tests with coverage
   ./run_tests.sh -c
   
   # Run only backend tests
   ./run_tests.sh -b -v
   
   # Run only frontend tests
   ./run_tests.sh -f
   ```

### Option 2: Using Nix Flakes (Modern)

1. **Enable flakes** (if not already enabled):
   ```bash
   mkdir -p ~/.config/nix
   echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
   ```

2. **Enter the development environment:**
   ```bash
   cd fullstack_test
   nix develop
   ```

3. **Run tests:**
   ```bash
   # Using the unified test runner
   ./run_tests.sh --help
   
   # Or using nix run commands
   nix run .#all-tests -- -c
   nix run .#backend-tests
   nix run .#frontend-tests
   ```

## What's Included

The Nix environment provides:

### Backend Dependencies
- **Python 3.12** with the following packages:
  - `flask` - Web framework
  - `flask-cors` - CORS support
  - `pytest` - Testing framework
  - `pytest-flask` - Flask testing utilities
  - `pytest-cov` - Coverage reporting
  - `requests` - HTTP library for testing
  - Development tools: `black`, `flake8`, `mypy` (flake only)

### Frontend Dependencies
- **Node.js 20** - JavaScript runtime
- **npm** - Package manager
- **yarn** - Alternative package manager (flake only)

### Development Tools
- **sqlite** - Database for testing
- **curl** - HTTP client for API testing
- **jq** - JSON processor
- **httpie** - User-friendly HTTP client (flake only)
- **git** - Version control
- **make** - Build automation
- Standard shell utilities

## Environment Details

### Environment Variables
The Nix shell automatically sets up:
- `FLASK_ENV=development` (or `testing` for shell.nix)
- `NODE_ENV=development` (or `test` for shell.nix)
- `PYTHONPATH` - Includes current directory
- `PATH` - Includes project scripts

### Automatic Setup
When you enter the Nix shell:
1. Frontend dependencies (`node_modules`) are automatically installed
2. Coverage report directories are created
3. Environment variables are configured
4. Helpful commands are displayed

## Testing Commands

### Unified Test Runner
```bash
# Run all tests
./run_tests.sh

# Run with coverage reports
./run_tests.sh -c

# Run only backend tests with verbose output
./run_tests.sh -b -v

# Run only frontend tests
./run_tests.sh -f

# Run integration tests only
./run_tests.sh -i

# Run in CI mode (no interactive prompts)
./run_tests.sh --ci -c

# Get help
./run_tests.sh --help
```

### Backend Testing
```bash
cd backend

# Run all backend tests
python -m pytest

# Run with coverage
python -m pytest --cov=app

# Run specific test file
python -m pytest test_app.py

# Run specific test class
python -m pytest test_app.py::TestGetFeedback

# Run tests matching pattern
python -m pytest -k "test_post_feedback"

# Verbose output
python -m pytest -v

# Stop on first failure
python -m pytest -x
```

### Frontend Testing
```bash
cd frontend

# Run tests in watch mode
npm test

# Run all tests once
npm run test:ci

# Run with coverage
npm run test:coverage

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit

# Debug tests
npm run test:debug
```

## Coverage Reports

After running tests with coverage (`-c` flag), view reports at:
- **Backend**: `backend/htmlcov/index.html`
- **Frontend**: `frontend/coverage/lcov-report/index.html`

## Development Workflow

### 1. Start Development Environment
```bash
cd fullstack_test
nix-shell  # or 'nix develop' for flakes
```

### 2. Run Tests During Development
```bash
# Watch mode for quick feedback
cd frontend && npm test

# Or run specific backend tests
cd backend && python -m pytest -k "test_name" -v
```

### 3. Full Test Suite Before Commit
```bash
./run_tests.sh -c
```

### 4. Code Quality (Flake Environment)
```bash
# Format Python code
cd backend && black .

# Lint Python code
cd backend && flake8 .

# Type check Python code
cd backend && mypy .

# Format JavaScript/React code
cd frontend && npx prettier --write .
```

## Troubleshooting

### Common Issues

1. **"nix-shell command not found"**
   - Install Nix: https://nixos.org/download.html

2. **Flakes not working**
   - Enable experimental features:
     ```bash
     mkdir -p ~/.config/nix
     echo "experimental-features = nix-command flakes" >> ~/.config/nix/nix.conf
     ```

3. **Python import errors**
   - Make sure you're inside the nix-shell
   - Check `PYTHONPATH` is set correctly

4. **Frontend tests failing**
   - Ensure `node_modules` exists: `cd frontend && npm install`
   - Check Node.js version: `node --version`

5. **Permission errors**
   - Make sure test runner is executable: `chmod +x run_tests.sh`

6. **Database errors in tests**
   - Tests use temporary databases, they should clean up automatically
   - If persistent issues, manually remove `test_feedback.db`

### Getting Help

1. **Check environment setup:**
   ```bash
   which python
   which node
   python --version
   node --version
   ```

2. **Verify dependencies:**
   ```bash
   python -c "import flask, pytest; print('Backend deps OK')"
   npm --version
   ```

3. **Test script permissions:**
   ```bash
   ls -la run_tests.sh
   # Should show executable permissions
   ```

## CI/CD Integration

For continuous integration, use:
```bash
nix-shell --run "./run_tests.sh --ci -c"
```

Or with flakes:
```bash
nix develop --command ./run_tests.sh --ci -c
```

## Customization

### Adding Dependencies

**Backend (Python):**
Edit `shell.nix` or `flake.nix` and add packages to the Python environment:
```nix
python3.withPackages (ps: with ps; [
  flask
  # ... existing packages ...
  your-new-package
])
```

**Frontend (Node.js):**
Dependencies are managed through `package.json`:
```bash
cd frontend
npm install your-new-package --save-dev
```

### Environment Variables
Add custom environment variables in the `shellHook` section of your Nix configuration.

## Best Practices

1. **Always run tests before committing:**
   ```bash
   ./run_tests.sh -c
   ```

2. **Use watch mode during development:**
   ```bash
   cd frontend && npm test  # Watches for changes
   ```

3. **Run specific tests when debugging:**
   ```bash
   cd backend && python -m pytest test_app.py::TestPostFeedback::test_post_valid_feedback -v
   ```

4. **Check coverage regularly:**
   ```bash
   ./run_tests.sh -c
   open backend/htmlcov/index.html
   open frontend/coverage/lcov-report/index.html
   ```

5. **Use different test types appropriately:**
   - Unit tests: `./run_tests.sh -u`
   - Integration tests: `./run_tests.sh -i`
   - Full suite: `./run_tests.sh -c`

---

**Happy Testing! 🚀**

For more information about the test suite, see `TESTING.md`.