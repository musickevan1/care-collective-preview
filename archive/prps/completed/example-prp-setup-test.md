name: "Example PRP - Test PRP System Setup"
description: |
  This is a test PRP to verify the PRP system is working correctly

---

## Goal

**Feature Goal**: Verify that the PRP system infrastructure is properly set up and functional

**Deliverable**: Confirmation that all PRP components are working (directory structure, runner script, templates)

**Success Definition**: PRP runner can successfully load and parse this test PRP

## User Persona

**Target User**: Developer setting up the PRP system

**Use Case**: Testing the PRP infrastructure before creating real feature PRPs

**User Journey**: Run test PRP to verify system functionality

**Pain Points Addressed**: Ensures PRP system is properly configured before use

## Why

- Validate PRP system setup is complete and functional
- Test runner script with organized directory structure
- Verify template system is accessible
- Ensure ai_docs are properly copied and available

## What

Test the PRP system by running this simple validation PRP that:
- Confirms runner script works with new directory structure
- Tests file discovery in active/backlog/completed folders
- Validates template access and usage
- Checks ai_docs availability for context injection

### Success Criteria

- [ ] PRP runner successfully finds and loads this test PRP
- [ ] Runner script can search across active/backlog/completed folders
- [ ] Templates are accessible and properly formatted
- [ ] ai_docs directory contains context documentation
- [ ] Wrapper script (run-prp.sh) functions correctly

## All Needed Context

### PRP System Files

```yaml
- file: PRPs/scripts/prp_runner.py
  why: Core PRP execution script with multi-folder support
  pattern: Updated to search active/backlog/completed directories

- file: PRPs/PRP_SYSTEM_README.md
  why: Complete system documentation and usage guide
  pattern: Comprehensive setup and usage instructions

- file: PRPs/templates/prp_care_collective_feature.md
  why: Care Collective specific PRP template
  pattern: Next.js/Supabase/React patterns for the platform

- file: run-prp.sh
  why: Convenient wrapper script for running PRPs
  pattern: Simplified command interface
```

### Current Setup Status

```bash
PRPs/
├── active/                    # ✅ Created - for current work
├── backlog/                   # ✅ Created - with example PRPs
├── completed/                 # ✅ Created - for finished PRPs
├── ai_docs/                   # ✅ Populated with context docs
├── scripts/prp_runner.py      # ✅ Updated for new structure
├── templates/                 # ✅ Populated with templates
└── PRP_SYSTEM_README.md      # ✅ Created with full documentation
```

## Implementation Blueprint

### Simple Validation Tasks

```yaml
Task 1: VERIFY directory structure exists
  - CHECK: All required directories (active, backlog, completed, ai_docs, scripts, templates)
  - VERIFY: Files copied from PRPs-agentic-eng successfully
  - CONFIRM: Permissions are correct on script files

Task 2: TEST prp_runner.py functionality
  - RUN: python PRPs/scripts/prp_runner.py --help
  - VERIFY: Help text shows updated folder options
  - CONFIRM: Script can find PRPs in different folders

Task 3: TEST wrapper script functionality  
  - RUN: ./run-prp.sh --help
  - RUN: ./run-prp.sh --list
  - VERIFY: Lists show PRPs in different folders correctly

Task 4: VALIDATE template access
  - CHECK: Templates exist and are readable
  - VERIFY: Care Collective template has proper structure
  - CONFIRM: Templates reference correct file paths

Task 5: CONFIRM ai_docs availability
  - CHECK: Context documentation copied successfully
  - VERIFY: Files are readable and contain expected content
  - CONFIRM: Documentation matches Care Collective tech stack
```

## Validation Loop

### Level 1: System Validation

```bash
# Test PRP runner help
python PRPs/scripts/prp_runner.py --help

# Test wrapper script
./run-prp.sh --help
./run-prp.sh --list

# Verify file permissions
ls -la PRPs/scripts/prp_runner.py
ls -la run-prp.sh

# Expected: All commands work without errors, files are executable
```

### Level 2: Directory Structure Validation

```bash
# Check all directories exist
ls -la PRPs/

# Verify templates
ls -la PRPs/templates/

# Check ai_docs
ls -la PRPs/ai_docs/

# Verify backlog has example PRPs
ls -la PRPs/backlog/

# Expected: All directories exist with expected content
```

### Level 3: Functional Testing

```bash
# Test finding this PRP
python PRPs/scripts/prp_runner.py --prp example-prp-setup-test --folder active

# Test wrapper script with this PRP
./run-prp.sh example-prp-setup-test

# Expected: Scripts successfully find and attempt to process this PRP
```

## Final Validation Checklist

### Infrastructure Validation

- [ ] All directories created: active, backlog, completed, ai_docs, scripts, templates
- [ ] PRP runner script updated and executable
- [ ] Wrapper script created and executable  
- [ ] Templates copied and accessible
- [ ] ai_docs populated with context documentation
- [ ] Example PRPs moved to backlog folder

### Functionality Validation

- [ ] PRP runner help command works
- [ ] Wrapper script help and list commands work
- [ ] Scripts can find PRPs in different folders
- [ ] File permissions are correct
- [ ] Documentation is complete and accurate

### Ready for Use

- [ ] System can run existing PRPs from backlog
- [ ] Templates available for new PRP creation
- [ ] Documentation provides clear usage instructions
- [ ] Examples demonstrate proper usage patterns

---

## Next Steps After Validation

1. Move this test PRP to completed folder: `mv PRPs/active/example-prp-setup-test.md PRPs/completed/`
2. Create your first real PRP using `PRPs/templates/prp_care_collective_feature.md`
3. Reference `PRPs/PRP_SYSTEM_README.md` for detailed usage instructions
4. Use `./run-prp.sh -i your-prp-name` for interactive development

The PRP system is now ready for productive feature development!