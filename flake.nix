{
  description = "Fullstack feedback application development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        
        pythonEnv = pkgs.python3.withPackages (ps: with ps; [
          flask
          flask-cors
          pytest
          pytest-flask
          pytest-cov
          pytest-xdist
          requests
          coverage
          black
          flake8
          mypy
        ]);
      in
      {
        devShells.default = pkgs.mkShell {
          buildInputs = with pkgs; [
            # Python environment
            pythonEnv
            
            # Node.js environment
            nodejs_20
            npm
            yarn
            
            # Database
            sqlite
            
            # Development tools
            curl
            jq
            httpie
            
            # Testing and CI tools
            gnumake
            git
            
            # Shell utilities
            which
            ps
            tree
            
            # Optional: code formatting and linting
            nodePackages.prettier
            nodePackages.eslint
          ];

          shellHook = ''
            echo "🚀 Fullstack Test Environment Ready (Nix Flake)!"
            echo ""
            echo "Development Environment:"
            echo "  Python: $(python --version)"
            echo "  Node.js: $(node --version)"
            echo "  npm: $(npm --version)"
            echo ""
            echo "Available commands:"
            echo ""
            echo "  🧪 Testing:"
            echo "    ./run_tests.sh                    # Run all tests"
            echo "    ./run_tests.sh -c                 # Run with coverage"
            echo "    ./run_tests.sh -b -v              # Backend tests (verbose)"
            echo "    ./run_tests.sh -f -i              # Frontend integration tests"
            echo ""
            echo "  🐍 Backend (Python/Flask):"
            echo "    cd backend && python app.py       # Start backend server"
            echo "    cd backend && pytest              # Run backend tests"
            echo "    cd backend && pytest --cov=app    # Run with coverage"
            echo "    cd backend && pytest -v           # Verbose output"
            echo "    cd backend && pytest -k 'test_get'  # Run specific tests"
            echo ""
            echo "  ⚛️  Frontend (React):"
            echo "    cd frontend && npm start          # Start frontend dev server"
            echo "    cd frontend && npm test           # Run frontend tests"
            echo "    cd frontend && npm run test:coverage  # Run with coverage"
            echo "    cd frontend && npm run test:ci    # Run in CI mode"
            echo ""
            echo "  🔧 Development Tools:"
            echo "    cd backend && black .             # Format Python code"
            echo "    cd backend && flake8 .            # Lint Python code"
            echo "    cd backend && mypy .              # Type check Python code"
            echo "    cd frontend && npm run build      # Build frontend"
            echo "    cd frontend && npx prettier --write .  # Format JS/React code"
            echo ""
            echo "  📊 Coverage Reports:"
            echo "    Backend: backend/htmlcov/index.html"
            echo "    Frontend: frontend/coverage/lcov-report/index.html"
            echo ""
            
            # Install frontend dependencies if not present
            if [ ! -d "frontend/node_modules" ]; then
              echo "📦 Installing frontend dependencies..."
              (cd frontend && npm install)
              echo "✅ Frontend dependencies installed"
              echo ""
            fi
            
            # Create necessary directories
            mkdir -p backend/htmlcov
            mkdir -p frontend/coverage
            
            # Set up environment variables
            export FLASK_ENV=development
            export FLASK_DEBUG=1
            export NODE_ENV=development
            export PYTHONPATH="$PWD/backend:$PYTHONPATH"
            
            # Add project scripts to PATH
            export PATH="$PWD:$PATH"
            
            echo "🎯 Ready to start development and testing!"
            echo "   Run './run_tests.sh --help' for testing options"
            echo ""
          '';

          # Environment variables
          FLASK_ENV = "development";
          FLASK_DEBUG = "1";
          NODE_ENV = "development";
          
          # Python environment
          PYTHONPATH = ".";
          PYTHONUNBUFFERED = "1";
          
          # Testing environment
          PYTEST_CURRENT_TEST = "";
          
          # Locale
          LANG = "en_US.UTF-8";
          LC_ALL = "en_US.UTF-8";
          
          # Node.js environment
          NODE_OPTIONS = "--max-old-space-size=4096";
        };

        # Optional: Define packages that can be built
        packages = {
          backend-tests = pkgs.writeShellScriptBin "backend-tests" ''
            cd backend
            ${pythonEnv}/bin/python -m pytest "$@"
          '';
          
          frontend-tests = pkgs.writeShellScriptBin "frontend-tests" ''
            cd frontend
            ${pkgs.nodejs_20}/bin/npm test "$@"
          '';
          
          all-tests = pkgs.writeShellScriptBin "all-tests" ''
            ./run_tests.sh "$@"
          '';
        };

        # Optional: Define apps that can be run with 'nix run'
        apps = {
          backend-tests = flake-utils.lib.mkApp {
            drv = self.packages.${system}.backend-tests;
          };
          
          frontend-tests = flake-utils.lib.mkApp {
            drv = self.packages.${system}.frontend-tests;
          };
          
          all-tests = flake-utils.lib.mkApp {
            drv = self.packages.${system}.all-tests;
          };
        };
      });
}