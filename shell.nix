{ pkgs ? import <nixpkgs> {} }:

pkgs.mkShell {
  buildInputs = with pkgs; [
    # Python environment with testing dependencies
    (python3.withPackages (ps: with ps; [
      flask
      flask-cors
      pytest
      pytest-flask
      pytest-cov
      requests
    ]))
    
    # Node.js environment for frontend testing (npm comes with nodejs)
    nodejs_20
    
    # Development tools
    sqlite
    curl
    jq
    
    # Optional: useful development tools
    git
    gnumake
    
    # Shell utilities
    which
    ps
  ];

  shellHook = ''
    echo "🚀 Fullstack Test Environment Ready!"
    echo ""
    echo "Available commands:"
    echo "  Backend:"
    echo "    cd backend && python -m pytest          # Run backend tests"
    echo "    cd backend && python -m pytest -v      # Run with verbose output"
    echo "    cd backend && python -m pytest --cov=app  # Run with coverage"
    echo ""
    echo "  Frontend:"
    echo "    cd frontend && npm test                 # Run frontend tests"
    echo "    cd frontend && npm run test:coverage    # Run with coverage"
    echo "    cd frontend && npm run test:ci          # Run in CI mode"
    echo ""
    echo "  Unified:"
    echo "    ./run_tests.sh                          # Run all tests"
    echo "    ./run_tests.sh -c                       # Run with coverage"
    echo "    ./run_tests.sh -b                       # Backend only"
    echo "    ./run_tests.sh -f                       # Frontend only"
    echo ""
    echo "Python version: $(python --version)"
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
    
    # Ensure frontend dependencies are installed
    if [ ! -d "frontend/node_modules" ]; then
      echo "📦 Installing frontend dependencies..."
      cd frontend && npm install && cd ..
    fi
    
    # Set environment variables for testing
    export FLASK_ENV=testing
    export NODE_ENV=test
    
    # Add current directory to PATH so run_tests.sh can be run from anywhere
    export PATH="$PWD:$PATH"
  '';
  
  # Environment variables
  FLASK_ENV = "testing";
  NODE_ENV = "test";
  PYTHONPATH = ".";
  
  # Ensure UTF-8 encoding
  LANG = "en_US.UTF-8";
  LC_ALL = "en_US.UTF-8";
}