#!/bin/bash

set -e

echo "=========================================="
echo "Haven for Start9 - Prerequisites Installer"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running on Linux
if [[ "$OSTYPE" != "linux-gnu"* ]]; then
    echo -e "${RED}ERROR: This script is designed for Linux systems only.${NC}"
    echo "For macOS, please install prerequisites manually."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print status
print_status() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
    fi
}

echo "Checking existing installations..."
echo ""

# Check what's already installed
START9_INSTALLED=false
DENO_INSTALLED=false
YQ_INSTALLED=false
DOCKER_INSTALLED=false
BUILDX_INSTALLED=false

# Build tools
if command_exists git; then
    echo -e "${GREEN}✓${NC} Git already installed"
else
    echo -e "${YELLOW}○${NC} Git not found (required for building Start9 SDK)"
fi

if command_exists make; then
    echo -e "${GREEN}✓${NC} Make already installed"
else
    echo -e "${YELLOW}○${NC} Make not found (required for building Start9 SDK)"
fi

if command_exists cargo; then
    echo -e "${GREEN}✓${NC} Rust/Cargo already installed"
else
    echo -e "${YELLOW}○${NC} Rust/Cargo not found (required for building Start9 SDK)"
fi

echo ""

# Development tools
if command_exists start-sdk; then
    echo -e "${GREEN}✓${NC} Start9 SDK already installed ($(start-sdk --version 2>/dev/null || echo 'version unknown'))"
    START9_INSTALLED=true
else
    echo -e "${YELLOW}○${NC} Start9 SDK not found"
fi

if command_exists deno; then
    echo -e "${GREEN}✓${NC} Deno already installed ($(deno --version 2>/dev/null | head -n1))"
    DENO_INSTALLED=true
else
    echo -e "${YELLOW}○${NC} Deno not found"
fi

if command_exists yq; then
    # Check if it's the correct yq (mikefarah/yq, not python-yq)
    if yq --version 2>&1 | grep -q "mikefarah"; then
        echo -e "${GREEN}✓${NC} yq (Go version) already installed ($(yq --version 2>/dev/null | head -n1))"
        YQ_INSTALLED=true
    else
        echo -e "${YELLOW}○${NC} yq found but it's the Python version (need Go version)"
        YQ_INSTALLED=false
    fi
else
    echo -e "${YELLOW}○${NC} yq not found"
fi

if command_exists docker; then
    echo -e "${GREEN}✓${NC} Docker already installed ($(docker --version))"
    DOCKER_INSTALLED=true

    if docker buildx version >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker buildx already installed"
        BUILDX_INSTALLED=true
    else
        echo -e "${YELLOW}○${NC} Docker buildx not found"
    fi
else
    echo -e "${YELLOW}○${NC} Docker not found"
fi

echo ""
echo "=========================================="
echo "Installing missing prerequisites..."
echo "=========================================="
echo ""

# Install Start9 SDK
if [ "$START9_INSTALLED" = false ]; then
    echo "Installing Start9 SDK..."
    echo "This will clone and build from source (may take a few minutes)..."
    echo ""

    # Check if rust is installed (required for building)
    if ! command_exists cargo; then
        echo -e "${YELLOW}Rust is required to build Start9 SDK${NC}"
        echo "Installing Rust..."
        if curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y; then
            source "$HOME/.cargo/env"
            print_status "Rust installed"
        else
            echo -e "${RED}Failed to install Rust${NC}"
            echo "Please install Rust manually from: https://rustup.rs"
            echo "Then run: git clone -b sdk --recursive https://github.com/Start9Labs/start-os.git && cd start-os && make sdk"
            START9_FAILED=true
        fi
        echo ""
    fi

    if [ "$START9_FAILED" != true ]; then
        # Clone and build Start9 SDK
        SDK_BUILD_DIR="/tmp/start-os-sdk-build"
        rm -rf "$SDK_BUILD_DIR"

        if git clone -b sdk --recursive https://github.com/Start9Labs/start-os.git "$SDK_BUILD_DIR"; then
            cd "$SDK_BUILD_DIR"
            if make sdk; then
                print_status "Start9 SDK built and installed"
                # Initialize SDK
                if start-sdk init 2>/dev/null || true; then
                    print_status "Start9 SDK initialized"
                fi
                cd - >/dev/null
                rm -rf "$SDK_BUILD_DIR"
            else
                echo -e "${RED}Failed to build Start9 SDK${NC}"
                echo "Please try manually:"
                echo "  git clone -b sdk --recursive https://github.com/Start9Labs/start-os.git"
                echo "  cd start-os && make sdk"
                cd - >/dev/null
            fi
        else
            echo -e "${RED}Failed to clone Start9 SDK repository${NC}"
        fi
    fi
    echo ""
fi

# Install Deno
if [ "$DENO_INSTALLED" = false ]; then
    echo "Installing Deno..."
    if curl -fsSL https://deno.land/install.sh | sh; then
        print_status "Deno installed"
        # Add to PATH for current session
        export DENO_INSTALL="$HOME/.deno"
        export PATH="$DENO_INSTALL/bin:$PATH"
    else
        echo -e "${RED}Failed to install Deno${NC}"
        echo "Please install manually from: https://deno.land"
    fi
    echo ""
fi

# Install yq (Go version by mikefarah)
if [ "$YQ_INSTALLED" = false ]; then
    echo "Installing yq (Go version)..."
    YQ_VERSION="v4.35.1"
    YQ_BINARY="yq_linux_amd64"
    YQ_URL="https://github.com/mikefarah/yq/releases/download/${YQ_VERSION}/${YQ_BINARY}"

    mkdir -p "$HOME/.local/bin"
    if curl -fsSL "$YQ_URL" -o "$HOME/.local/bin/yq"; then
        chmod +x "$HOME/.local/bin/yq"
        print_status "yq (Go version) installed"
        export PATH="$HOME/.local/bin:$PATH"
    else
        echo -e "${RED}Failed to install yq${NC}"
        echo "Please install manually from: https://github.com/mikefarah/yq"
    fi
    echo ""
fi

# Detect package manager
PKG_MANAGER=""
if command_exists xbps-install; then
    PKG_MANAGER="xbps"
elif command_exists apt-get; then
    PKG_MANAGER="apt"
else
    echo -e "${RED}ERROR: No supported package manager found${NC}"
    echo "Supported: xbps-install (Void Linux), apt-get (Debian/Ubuntu)"
    exit 1
fi

# Check for build tools needed for Start9 SDK
GIT_INSTALLED=false
MAKE_INSTALLED=false

if command_exists git; then
    GIT_INSTALLED=true
fi

if command_exists make; then
    MAKE_INSTALLED=true
fi

# Install build tools, yq, and Docker (require sudo)
NEEDS_INSTALL=false

if [ "$GIT_INSTALLED" = false ]; then
    NEEDS_INSTALL=true
fi

if [ "$MAKE_INSTALLED" = false ]; then
    NEEDS_INSTALL=true
fi

if [ "$YQ_INSTALLED" = false ]; then
    NEEDS_INSTALL=true
fi

if [ "$DOCKER_INSTALLED" = false ]; then
    NEEDS_INSTALL=true
fi

if [ "$NEEDS_INSTALL" = true ]; then
    echo "Installing system packages (requires sudo)..."
    echo "Detected package manager: $PKG_MANAGER"
    echo ""

    # Update package cache based on package manager
    if [ "$PKG_MANAGER" = "xbps" ]; then
        if sudo xbps-install -S; then
            print_status "Package cache synchronized"
        else
            echo -e "${RED}Failed to synchronize package cache${NC}"
        fi
    elif [ "$PKG_MANAGER" = "apt" ]; then
        if sudo apt-get update; then
            print_status "APT cache updated"
        else
            echo -e "${RED}Failed to update APT cache${NC}"
        fi
    fi

    # Build list of packages to install
    PACKAGES=""

    # On Void Linux, install base-devel for common build tools
    if [ "$PKG_MANAGER" = "xbps" ]; then
        if [ "$GIT_INSTALLED" = false ] || [ "$MAKE_INSTALLED" = false ]; then
            PACKAGES="$PACKAGES base-devel"
        fi
    else
        if [ "$GIT_INSTALLED" = false ]; then
            PACKAGES="$PACKAGES git"
        fi

        if [ "$MAKE_INSTALLED" = false ]; then
            PACKAGES="$PACKAGES make build-essential"
        fi
    fi

    # Don't install yq from package manager - it's the wrong version (Python)
    # We'll install the Go version manually later

    if [ "$DOCKER_INSTALLED" = false ]; then
        if [ "$PKG_MANAGER" = "xbps" ]; then
            PACKAGES="$PACKAGES docker"
        elif [ "$PKG_MANAGER" = "apt" ]; then
            PACKAGES="$PACKAGES docker.io"
        fi
    fi

    # Install packages based on package manager
    if [ -n "$PACKAGES" ]; then
        echo "Installing:$PACKAGES"
        if [ "$PKG_MANAGER" = "xbps" ]; then
            if sudo xbps-install -y $PACKAGES; then
                print_status "System packages installed"
            else
                echo -e "${RED}Failed to install some packages${NC}"
            fi
        elif [ "$PKG_MANAGER" = "apt" ]; then
            if sudo apt-get install -y $PACKAGES; then
                print_status "System packages installed"
            else
                echo -e "${RED}Failed to install some packages${NC}"
            fi
        fi
    fi

    echo ""
fi

# Set up Docker buildx if Docker is installed but buildx isn't
if [ "$DOCKER_INSTALLED" = true ] && [ "$BUILDX_INSTALLED" = false ]; then
    echo "Setting up Docker buildx..."

    # On Void Linux, buildx might not be available in the default docker package
    if [ "$PKG_MANAGER" = "xbps" ]; then
        echo -e "${YELLOW}Note: Docker buildx is not available in Void Linux's docker package${NC}"
        echo "Attempting to install docker-buildx plugin manually..."

        # Try to download docker-buildx binary
        BUILDX_VERSION="v0.12.1"
        BUILDX_URL="https://github.com/docker/buildx/releases/download/${BUILDX_VERSION}/buildx-${BUILDX_VERSION}.linux-amd64"

        mkdir -p "$HOME/.docker/cli-plugins"
        if curl -fsSL "$BUILDX_URL" -o "$HOME/.docker/cli-plugins/docker-buildx"; then
            chmod +x "$HOME/.docker/cli-plugins/docker-buildx"
            # Verify it works
            if docker buildx version >/dev/null 2>&1; then
                print_status "Docker buildx plugin installed"
                BUILDX_INSTALLED=true
            else
                echo -e "${YELLOW}Warning: Docker buildx plugin downloaded but not working${NC}"
            fi
        else
            echo -e "${YELLOW}Warning: Could not download Docker buildx${NC}"
        fi
    else
        # On other systems, try to set up buildx builder
        if docker buildx create --name haven-builder --use 2>/dev/null || docker buildx use haven-builder; then
            print_status "Docker buildx configured"
        else
            echo -e "${YELLOW}Warning: Could not configure Docker buildx${NC}"
            echo "You may need to install it manually"
        fi
    fi
    echo ""
fi

# Add user to docker group if not already
if [ "$DOCKER_INSTALLED" = true ]; then
    if ! groups | grep -q docker; then
        echo "Adding current user to docker group..."
        if sudo usermod -aG docker $USER; then
            print_status "User added to docker group"
            echo -e "${YELLOW}NOTE: You need to log out and back in for docker group to take effect${NC}"
        else
            echo -e "${YELLOW}Warning: Could not add user to docker group${NC}"
        fi
        echo ""
    fi
fi

echo "=========================================="
echo "Installation Summary"
echo "=========================================="
echo ""

# Final verification
ALL_GOOD=true

echo "Build Tools:"
if command_exists git; then
    echo -e "${GREEN}✓${NC} Git"
else
    echo -e "${RED}✗${NC} Git - MISSING"
    ALL_GOOD=false
fi

if command_exists make; then
    echo -e "${GREEN}✓${NC} Make"
else
    echo -e "${RED}✗${NC} Make - MISSING"
    ALL_GOOD=false
fi

if command_exists cargo; then
    echo -e "${GREEN}✓${NC} Rust/Cargo"
else
    echo -e "${RED}✗${NC} Rust/Cargo - MISSING"
    ALL_GOOD=false
fi

echo ""
echo "Development Tools:"
if command_exists start-sdk || command_exists start-cli; then
    echo -e "${GREEN}✓${NC} Start9 SDK"
else
    echo -e "${RED}✗${NC} Start9 SDK - MISSING"
    ALL_GOOD=false
fi

if command_exists deno; then
    echo -e "${GREEN}✓${NC} Deno"
else
    echo -e "${RED}✗${NC} Deno - MISSING"
    ALL_GOOD=false
fi

if command_exists yq; then
    echo -e "${GREEN}✓${NC} yq"
else
    echo -e "${RED}✗${NC} yq - MISSING"
    ALL_GOOD=false
fi

if command_exists docker; then
    echo -e "${GREEN}✓${NC} Docker"

    if docker buildx version >/dev/null 2>&1; then
        echo -e "${GREEN}✓${NC} Docker buildx"
    else
        echo -e "${RED}✗${NC} Docker buildx - MISSING"
        ALL_GOOD=false
    fi
else
    echo -e "${RED}✗${NC} Docker - MISSING"
    ALL_GOOD=false
fi

echo ""

if [ "$ALL_GOOD" = true ]; then
    echo -e "${GREEN}=========================================="
    echo "✓ All prerequisites installed successfully!"
    echo "==========================================${NC}"
    echo ""
    echo "You can now build the package:"
    echo "  make"
    echo ""
    echo "To verify the package:"
    echo "  make verify"
    echo ""
    echo "To install on your Start9 server:"
    echo "  make install"
else
    echo -e "${YELLOW}=========================================="
    echo "⚠ Some prerequisites are missing"
    echo "==========================================${NC}"
    echo ""
    echo "Please install missing items manually and try again."
    echo ""
    echo "Resources:"
    echo "  Start9 SDK: https://docs.start9.com"
    echo "  Deno: https://deno.land"
    echo "  Docker: https://docs.docker.com/engine/install/"
fi

echo ""
echo "NOTE: If you just installed Docker, you may need to:"
echo "  1. Log out and log back in (for group permissions)"
if [ "$PKG_MANAGER" = "xbps" ]; then
    echo "  2. Enable and start Docker service (Void Linux):"
    echo "     sudo ln -s /etc/sv/docker /var/service/"
    echo "     sudo sv up docker"
elif [ "$PKG_MANAGER" = "apt" ]; then
    echo "  2. Restart the Docker service: sudo systemctl restart docker"
fi
echo ""

# Check if we installed Start9 SDK, Deno, or yq (need to add to PATH)
INSTALLED_START9=false
INSTALLED_DENO=false
INSTALLED_YQ=false

if ! command_exists start-sdk && [ -f "$HOME/.local/bin/start-sdk" ]; then
    INSTALLED_START9=true
fi

if ! command_exists deno && [ -d "$HOME/.deno" ]; then
    INSTALLED_DENO=true
fi

if ! command_exists yq && [ -f "$HOME/.local/bin/yq" ]; then
    INSTALLED_YQ=true
fi

if [ "$INSTALLED_START9" = true ] || [ "$INSTALLED_DENO" = true ] || [ "$INSTALLED_YQ" = true ]; then
    echo "IMPORTANT: Add the following to your shell configuration (~/.bashrc or ~/.zshrc):"
    if [ "$INSTALLED_START9" = true ] || [ "$INSTALLED_YQ" = true ]; then
        echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
    if [ "$INSTALLED_DENO" = true ]; then
        echo "  export DENO_INSTALL=\"\$HOME/.deno\""
        echo "  export PATH=\"\$DENO_INSTALL/bin:\$PATH\""
    fi
    echo ""
    echo "Then reload your shell:"
    echo "  source ~/.bashrc"
    echo ""
fi
