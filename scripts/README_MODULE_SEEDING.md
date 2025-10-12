# Module Management System Setup

## Overview
Complete Module Management system for B2B SaaS admin panel with APIs, seeding, and left navigation integration.

## 🚀 Quick Setup

### 1. Seed the Database
Run the module seed script to populate MongoDB with initial data:

```bash
node scripts/seed-modules.js
```

This will create:
- ✅ **11 pre-defined modules** (including System Admin)
- ✅ **Reference data** for module status and categories
- ✅ **Database indexes** for optimal performance

### 2. Verify API Endpoints
The following endpoints are now available:

**Module Operations:**
- `GET /api/admin/modules/stats` - Module overview statistics
- `GET /api/admin/modules` - List modules with pagination/filtering
- `POST /api/admin/modules` - Create new module
- `PUT /api/admin/modules/:id` - Update existing module
- `POST /api/admin/modules/:id/archive` - Archive module (soft delete)
- `POST /api/admin/modules/:id/activate` - Activate archived module
- `DELETE /api/admin/modules/:id` - Hard delete module (non-system only)

**Reference Data:**
- `POST /api/reference-data/seed` - Now includes module_status and module_category

### 3. Access the UI
Navigate to **System Admin** → **Module Management** in the left navigation.

## 📊 Pre-seeded Modules

| Key | Name | Category | Default in Flex | Icon |
|-----|------|----------|-----------------|------|
| system | System Admin | Admin | ✅ | Settings |
| inspect | IntelliInspect | Inspection | ❌ | Search |
| ndt | IntelliNDT | Inspection | ❌ | Radio |
| integrity | IntelliIntegrity | Compliance | ❌ | Shield |
| track | IntelliTrack | Operations | ✅ | MapPin |
| comply | IntelliComply | Compliance | ❌ | ShieldCheck |
| command | IntelliCommand | Operations | ❌ | LayoutDashboard |
| work | IntelliWork | Operations | ❌ | ClipboardList |
| turn | IntelliTurn | Operations | ❌ | Timer |
| vault | IntelliVault | Documents | ❌ | Archive |
| vision | IntelliVision | AI | ❌ | Camera |

## 🔐 Security Features

- **System Admin Protection**: Cannot be edited, archived, or deleted
- **Super Admin Only**: All endpoints require super admin permissions
- **Key Immutability**: Module keys cannot be changed after creation
- **Validation**: Comprehensive input validation and conflict detection

## 🎯 Left-Nav Ready

Each module includes:
- ✅ **Key**: For routing/identification
- ✅ **Icon**: Lucide icon for navigation display
- ✅ **Category**: For grouping in menus
- ✅ **Status**: Active/Hidden control

## 📝 Usage Examples

### Create Module via API
```bash
curl -X POST /api/admin/modules \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "custom",
    "name": "Custom Module",
    "category": "Operations",
    "icon": "Package",
    "defaultIncludedInFlex": false
  }'
```

### Get Module Statistics
```bash
curl -X GET /api/admin/modules/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔧 Database Collections

- **modules**: Main module definitions
- **referenceListTypes**: Module status and category types
- **referenceListOptions**: Status/category option values

## 🎨 Framework Integration

Fully integrated with the existing metadata-driven framework:
- ✅ **Generic gadgets** (sgrid-search-gadget, stats-gadget, action-panel-gadget)
- ✅ **No hardcoded logic** - all configuration via workspace definition
- ✅ **Reference data integration** - dropdowns populated from database
- ✅ **Professional styling** - follows established design patterns

## 🔄 Future Extensions

Ready for:
- **Plan Integration**: Module selection during tenant provisioning
- **Left Navigation**: Use key + icon to render tenant navigation
- **Permission Integration**: Module-based feature flags
- **License Tracking**: Module usage and billing integration

