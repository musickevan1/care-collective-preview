# Care Collective Project Cleanup & Organization Plan

## 🎯 Objectives
- Create clear, logical directory structure
- Eliminate duplicate files and nested directories  
- Organize documentation into proper folders
- Separate legacy projects from active development
- Consolidate migration files and scripts
- Improve project maintainability and navigation

## 📁 Proposed New Structure
```
care-collective-preview/
├── 📱 app/                    # Next.js app (moved from nested location)
├── 📦 components/             # React components
├── 🔧 lib/                    # Utilities and configurations
├── 🗄️  supabase/              # Database schemas and migrations
├── 🧪 tests/                  # Test files
├── 📚 docs/                   # All documentation (NEW)
│   ├── deployment/           # Deployment guides
│   ├── development/          # Development guides  
│   ├── security/             # Security documentation
│   ├── client/               # Client communications
│   └── legacy/               # Old documentation
├── 📜 scripts/                # Build and utility scripts
├── 🗃️  archive/                # Legacy projects (NEW)
│   ├── wix-integration/       # care-collective-wix moved here
│   └── prps/                  # PRP templates moved here
└── 🗑️  temp/                   # Temporary cleanup staging
```

## 🔄 Migration Steps

### Phase 1: Structure Preparation (Safe)
1. **Create new directory structure**
   - `docs/` with subdirectories
   - `archive/` for legacy code
   - `temp/` for staging

### Phase 2: Documentation Organization
2. **Categorize and move 60+ markdown files**:
   - Deployment docs → `docs/deployment/`
   - Security docs → `docs/security/` 
   - Development guides → `docs/development/`
   - Client communications → `docs/client/`
   - Outdated files → `docs/legacy/`

3. **Consolidate duplicates**:
   - Compare similar files (README variants, deployment guides)
   - Keep most recent/complete versions
   - Document what was removed

### Phase 3: Project Structure Fix
4. **Flatten nested project structure**:
   - Move contents from `care-collective-preview-v1/care-collective-preview-v1/` up one level
   - Remove empty nested directory
   - Update any hardcoded paths

5. **Archive legacy projects**:
   - Move `care-collective-wix/` → `archive/wix-integration/`
   - Move PRP templates → `archive/prps/`
   - Preserve but separate from active development

### Phase 4: Database & Scripts Cleanup  
6. **Consolidate migration files**:
   - Review duplicate migration files
   - Keep only necessary/latest versions
   - Document migration history

7. **Organize scripts and utilities**:
   - Group related scripts in `scripts/` subdirectories
   - Remove obsolete development artifacts
   - Update script documentation

### Phase 5: Root Directory Cleanup
8. **Clean root directory**:
   - Move scattered config files to proper locations
   - Remove temporary/obsolete files
   - Keep only essential project files (package.json, README.md, etc.)

### Phase 6: Update Dependencies
9. **Review and update paths**:
   - Update import statements if needed
   - Check configuration files for path references
   - Update documentation links

## ⚠️ Safety Measures
- **Git tracking**: All moves tracked in git for rollback capability
- **Backup verification**: Verify critical files aren't lost during moves
- **Path validation**: Test that application still builds after reorganization
- **Documentation**: Document all changes made

## 📊 Expected Results
- **Reduced complexity**: Clear separation of active code vs legacy/docs
- **Improved navigation**: Logical organization of files and folders  
- **Better maintainability**: Easier to find and update files
- **Cleaner root**: Focused project root with essential files only
- **Space savings**: Removal of duplicate files and obsolete artifacts

## 🕒 Estimated Time
- **Planning & Backup**: 30 minutes
- **File organization**: 1-2 hours  
- **Testing & verification**: 30 minutes
- **Documentation updates**: 30 minutes
- **Total**: ~3 hours

## 📋 Current State Analysis

### Major Issues Identified:

1. **Nested Directory Structure**: Problematic nested structure with `care-collective-preview-v1/` containing another `care-collective-preview-v1/` directory inside it.

2. **Duplicate/Legacy Projects**: 
   - `care-collective-wix/` (45M) - Legacy Wix integration project
   - `care-collective-preview-v1/` (1.1G) - Main Next.js project but improperly nested

3. **Documentation Scattered**: 60+ markdown files scattered across root and subdirectories, many duplicates

4. **Mixed Project Files**: Root directory contains both project files and documentation, creating confusion

5. **Migration Files**: Multiple SQL migration files with potential duplicates and outdated versions

6. **Legacy Artifacts**: Old scripts, test files, and development artifacts in root

## 🔍 Files to be Organized

### Documentation Files Found:
- Authentication/Security: `AUTHENTICATION_AUDIT_REPORT.md`, `SECURITY*.md`
- Deployment: `DEPLOYMENT_*.md`, `VERCEL_DEPLOYMENT.md`
- Development: `DEVELOPMENT_PLAN.md`, `IMPLEMENTATION_*.md`
- Client Communications: `CLIENT_*.md`, `DEMO_*.md`
- Database: `DATABASE_*.md`, `SUPABASE_*.md`
- Testing: `TESTING_*.md`
- And 40+ additional markdown files

### Project Structure Issues:
- Main project nested in `care-collective-preview-v1/care-collective-preview-v1/`
- Mixed file types in root directory
- Legacy Wix project taking 45M of space
- Duplicate PRP directories

## 📝 Notes
This plan prioritizes safety, clear organization, and maintainability while preserving all important files and project history. All changes will be tracked in git to enable rollback if needed.

*Created: September 2025*
*Status: Planning Phase - Ready for Implementation*