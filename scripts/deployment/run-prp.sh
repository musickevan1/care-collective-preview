#!/bin/bash

# Care Collective PRP Runner Wrapper Script
# Makes it easier to run PRPs with common configurations

set -e

# Default values
INTERACTIVE=false
FOLDER="active"
OUTPUT_FORMAT="text"
PRP_NAME=""
PRP_PATH=""

# Help function
show_help() {
    cat << EOF
Care Collective PRP Runner

Usage: $0 [OPTIONS] PRP_NAME

Run a Product Requirement Prompt (PRP) using Claude Code.

ARGUMENTS:
    PRP_NAME                Name of the PRP file (without .md extension)

OPTIONS:
    -i, --interactive       Run in interactive mode (recommended)
    -f, --folder FOLDER     Folder to search: active, backlog, completed (default: active)
    -p, --path PATH         Direct path to PRP file (overrides PRP_NAME and --folder)
    -o, --output FORMAT     Output format: text, json, stream-json (default: text)
    -h, --help              Show this help message

EXAMPLES:
    # Run PRP interactively (recommended)
    $0 -i my-feature

    # Run PRP from backlog
    $0 -i -f backlog feature-name

    # Run with specific path
    $0 -i -p PRPs/active/feature.md

    # Run headless with JSON output
    $0 -o json my-feature

    # List available PRPs
    $0 --list

DIRECTORY STRUCTURE:
    PRPs/active/            Currently being worked on
    PRPs/backlog/           Waiting to be implemented  
    PRPs/completed/         Finished PRPs
    PRPs/templates/         PRP templates

For more information, see PRPs/PRP_SYSTEM_README.md
EOF
}

# List available PRPs
list_prps() {
    echo "Available PRPs:"
    echo
    echo "=== ACTIVE ==="
    if ls PRPs/active/*.md >/dev/null 2>&1; then
        for file in PRPs/active/*.md; do
            basename "$file" .md
        done
    else
        echo "No active PRPs found"
    fi
    
    echo
    echo "=== BACKLOG ==="
    if ls PRPs/backlog/*.md >/dev/null 2>&1; then
        for file in PRPs/backlog/*.md; do
            basename "$file" .md
        done
    else
        echo "No backlog PRPs found"
    fi
    
    echo
    echo "=== COMPLETED ==="
    if ls PRPs/completed/*.md >/dev/null 2>&1; then
        for file in PRPs/completed/*.md; do
            basename "$file" .md
        done
    else
        echo "No completed PRPs found"
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -i|--interactive)
            INTERACTIVE=true
            shift
            ;;
        -f|--folder)
            FOLDER="$2"
            shift 2
            ;;
        -p|--path)
            PRP_PATH="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FORMAT="$2"
            shift 2
            ;;
        --list)
            list_prps
            exit 0
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "Unknown option $1"
            show_help
            exit 1
            ;;
        *)
            if [[ -z "$PRP_NAME" ]]; then
                PRP_NAME="$1"
            else
                echo "Unexpected argument: $1"
                show_help
                exit 1
            fi
            shift
            ;;
    esac
done

# Validate arguments
if [[ -z "$PRP_NAME" && -z "$PRP_PATH" ]]; then
    echo "Error: Must provide PRP_NAME or --path"
    echo
    show_help
    exit 1
fi

# Check if we're in the right directory
if [[ ! -d "PRPs" ]]; then
    echo "Error: PRPs directory not found. Make sure you're in the project root."
    exit 1
fi

# Build the command
CMD=(uv run PRPs/scripts/prp_runner.py)

if [[ -n "$PRP_PATH" ]]; then
    CMD+=(--prp-path "$PRP_PATH")
else
    CMD+=(--prp "$PRP_NAME")
    CMD+=(--folder "$FOLDER")
fi

if [[ "$INTERACTIVE" == "true" ]]; then
    CMD+=(--interactive)
fi

CMD+=(--output-format "$OUTPUT_FORMAT")

# Show what we're about to run
echo "Running: ${CMD[*]}"
echo

# Execute the command
exec "${CMD[@]}"