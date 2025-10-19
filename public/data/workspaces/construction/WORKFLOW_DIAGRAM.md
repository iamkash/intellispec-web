# Scaffolding Project Status Workflow - Visual Diagram

## Complete Workflow Visualization

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SCAFFOLDING PROJECT LIFECYCLE                             │
└─────────────────────────────────────────────────────────────────────────────┘

                            START HERE
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   📝 REQUESTED  │  🔵 Blue
                        │                 │
                        │  Initial Request│
                        │  Basic Info     │
                        └────────┬────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
          ┌─────────────────┐      ┌─────────────────┐
          │   📋 PLANNED    │      │   📦 CLOSED     │
          │                 │      │                 │
          │  Scope Defined  │      │  Cancelled      │
          │  PM Assigned    │      │  Early Exit     │
          └────────┬────────┘      └─────────────────┘
                   │
                   │ Requirements:
                   │ • Project name
                   │ • Client info
                   │ • Site details
                   │
                   ▼
          ┌─────────────────┐
          │   📐 DESIGN     │  💜 Purple
          │                 │
          │  Engineering    │
          │  Drawings       │
          │  Load Calcs     │
          └────────┬────────┘
                   │
                   │ Requirements:
                   │ • Work description
                   │ • Height & specs
                   │ • Load capacity
                   │
                   ▼
          ┌─────────────────┐
          │  ✅ APPROVED    │  💚 Green
          │                 │
          │ ⭐ APPROVAL GATE│
          │  PE Stamp       │
          │  Permits ID'd   │
          └────────┬────────┘
                   │
                   │ Requirements:
                   │ • Engineering docs
                   │ • Permits listed
                   │ • Manager approval
                   │
                   ▼
          ┌─────────────────┐
          │ 🚧 IN PROGRESS  │  🟠 Orange
          │                 │
          │  Active Work    │
          │  Crew On-Site   │
          │  Daily Logs     │
          └────────┬────────┘
                   │
                   │ Requirements:
                   │ • Start date set
                   │ • Crew assigned
                   │ • Daily inspections
                   │
                   ▼
          ┌─────────────────┐
          │  🔍 INSPECTION  │  🟡 Gold
          │                 │
          │  Work Complete  │
          │  Awaiting Check │
          │  Tag-Out        │
          └────────┬────────┘
                   │
                   │ Requirements:
                   │ • Completion date
                   │ • Inspector notified
                   │ • Safety checklist
                   │
                   ▼
          ┌─────────────────┐
          │  ✨ IN SERVICE  │  🔵 Cyan
          │                 │
          │ ⭐ APPROVAL GATE│
          │  Passed Inspect │
          │  Client Sign-Off│
          └────────┬────────┘
                   │
                   │ Requirements:
                   │ • Inspection passed
                   │ • Client acceptance
                   │ • Tag attached
                   │
                   ▼
          ┌─────────────────┐
          │   📦 CLOSED     │  ⚫ Gray
          │                 │
          │ ⭐ APPROVAL GATE│
          │  Project Archive│
          │  Final Billing  │
          └─────────────────┘
                   │
                   ▼
                  END


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

                        LEGEND

    ⭐ = Approval Gate (Requires Manager Sign-Off)
    🔵 = Informational Status
    🟢 = Ready for Action
    🟠 = Active Work
    🟡 = Pending Verification
    🔵 = Operational
    ⚫ = Completed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Detailed Status Breakdown

### 📝 REQUESTED (Initial)

**Color**: Blue (#1890ff)  
**Description**: New project request received  
**Duration**: 1-3 days  
**Actions**:

- Create project record
- Assign project manager
- Initial assessment

**Can Transition To**:

- ✅ PLANNED (normal flow)
- ✅ CLOSED (cancelled before planning)

**Notifications**: Project Manager

---

### 📋 PLANNED

**Color**: Purple (#722ed1)  
**Description**: Project scope defined and planned  
**Duration**: 3-7 days  
**Actions**:

- Define complete scope
- Identify resources
- Preliminary timeline
- Site survey

**Required Fields**:

- ✅ project_name
- ✅ project_type
- ✅ client_name
- ✅ site_address

**Can Transition To**:

- ✅ DESIGN (normal flow)
- ✅ APPROVED (if standard design)
- ✅ CLOSED (cancelled during planning)

**Notifications**: Engineer

---

### 📐 DESIGN

**Color**: Magenta (#eb2f96)  
**Description**: Engineering and technical design phase  
**Duration**: 5-14 days  
**Actions**:

- Create drawings
- Load calculations
- Material specifications
- Engineering review

**Required Fields**:

- ✅ work_description
- ✅ estimated_height
- ✅ load_capacity
- ✅ technical_specifications

**Can Transition To**:

- ✅ APPROVED (design complete)
- ✅ PLANNED (revisions needed)
- ✅ CLOSED (project cancelled)

**Notifications**: Project Manager, Engineer

---

### ✅ APPROVED ⭐

**Color**: Green (#52c41a)  
**Description**: Design approved, ready for construction  
**Duration**: 1-2 days  
**Actions**:

- PE stamp obtained
- Permits identified
- Final client approval
- Resource allocation

**Required Fields**:

- ✅ engineering_required (status)
- ✅ permits_required (list)
- ✅ approver_signature

**Approval Required**: YES  
**Approvers**: Project Manager, Engineering Manager

**Can Transition To**:

- ✅ IN PROGRESS (start work)
- ✅ CLOSED (cancelled after approval)

**Notifications**: Project Manager, Client, Crew Lead

---

### 🚧 IN PROGRESS

**Color**: Orange (#fa8c16)  
**Description**: Active construction/installation work  
**Duration**: 1-30 days (varies)  
**Actions**:

- Mobilization
- Material delivery
- Scaffold erection/dismantling
- Daily safety inspections
- Progress tracking

**Required Fields**:

- ✅ start_date
- ✅ crew_size
- ✅ crew_lead_assigned
- ✅ daily_inspection_logs

**Can Transition To**:

- ✅ INSPECTION (work complete)
- ✅ CLOSED (emergency closure)

**Notifications**: Crew Lead, Site Supervisor, Project Manager

---

### 🔍 INSPECTION

**Color**: Gold (#faad14)  
**Description**: Work complete, awaiting inspection  
**Duration**: 1-5 days  
**Actions**:

- Final safety check
- Competent person inspection
- Tag/label attachment
- Documentation review
- Client walkthrough

**Required Fields**:

- ✅ completion_date
- ✅ inspection_requested_date
- ✅ safety_checklist_complete

**Can Transition To**:

- ✅ IN SERVICE (passed inspection)
- ✅ IN PROGRESS (issues found, rework needed)
- ✅ CLOSED (failed, project terminated)

**Notifications**: Inspector, Project Manager, Client

---

### ✨ IN SERVICE ⭐

**Color**: Cyan (#13c2c2)  
**Description**: Inspected, approved, operational  
**Duration**: 1-365 days (until dismantling)  
**Actions**:

- Final client acceptance
- Tag issued
- Handover complete
- Billing initiated
- Periodic re-inspection

**Required Fields**:

- ✅ inspection_passed
- ✅ inspector_signature
- ✅ client_acceptance
- ✅ tag_number

**Approval Required**: YES  
**Approvers**: Competent Person, Client

**Can Transition To**:

- ✅ CLOSED (decommission)

**Notifications**: Client, Project Manager, Accounting

---

### 📦 CLOSED ⭐

**Color**: Gray (#8c8c8c)  
**Description**: Project completed and archived  
**Duration**: Permanent  
**Actions**:

- Final billing
- Material recovery
- Documentation archive
- Project review
- Lessons learned

**Required Fields**:

- ✅ final_approval
- ✅ billing_complete
- ✅ materials_returned
- ✅ close_out_notes

**Approval Required**: YES  
**Approvers**: Project Manager, Accounting Manager

**Can Transition To**:

- ❌ None (terminal state)

**Notifications**: Project Manager, Accounting, Client

---

## Transition Matrix

| From        | To          | Auto? | Approval? | Typical Duration       |
| ----------- | ----------- | ----- | --------- | ---------------------- |
| REQUESTED   | PLANNED     | No    | No        | 1-3 days               |
| REQUESTED   | CLOSED      | No    | No        | Immediate              |
| PLANNED     | DESIGN      | No    | No        | 3-7 days               |
| PLANNED     | APPROVED    | No    | No        | 3-7 days (if standard) |
| PLANNED     | CLOSED      | No    | No        | Immediate              |
| DESIGN      | APPROVED    | No    | ⭐ Yes    | 5-14 days              |
| DESIGN      | PLANNED     | No    | No        | Immediate              |
| DESIGN      | CLOSED      | No    | No        | Immediate              |
| APPROVED    | IN PROGRESS | No    | No        | 1-2 days               |
| APPROVED    | CLOSED      | No    | No        | Immediate              |
| IN PROGRESS | INSPECTION  | No    | No        | 1-30 days              |
| IN PROGRESS | CLOSED      | No    | Yes       | Emergency only         |
| INSPECTION  | IN SERVICE  | No    | ⭐ Yes    | 1-5 days               |
| INSPECTION  | IN PROGRESS | No    | No        | Immediate (rework)     |
| INSPECTION  | CLOSED      | No    | Yes       | Failed inspection      |
| IN SERVICE  | CLOSED      | No    | ⭐ Yes    | Variable               |

## Approval Gates Detail

### Gate 1: DESIGN → APPROVED ⭐

**Approvers**: Engineering Manager, Project Manager  
**Requirements**:

- Complete engineering drawings
- Load calculations verified
- PE stamp obtained (if required)
- Client review complete
- Safety analysis done

**Approval Time**: 1-3 business days

---

### Gate 2: INSPECTION → IN SERVICE ⭐

**Approvers**: Competent Person, Client Representative  
**Requirements**:

- All inspection points passed
- Safety checklist 100% complete
- Tags/labels attached
- Client walkthrough done
- Documentation signed

**Approval Time**: Same day to 2 business days

---

### Gate 3: IN SERVICE → CLOSED ⭐

**Approvers**: Project Manager, Accounting Manager  
**Requirements**:

- All work invoiced
- Final payment received
- Materials recovered/returned
- Client satisfaction survey
- Close-out documentation

**Approval Time**: 5-10 business days

---

## Notification Flow

```
Status Change Event
       ↓
  Notification Engine
       ↓
   ┌───┴───┬───────┬──────────┐
   ▼       ▼       ▼          ▼
 Email   SMS    In-App   Dashboard
```

### Notification Recipients by Status

| Status      | Who Gets Notified     | When          | Method        |
| ----------- | --------------------- | ------------- | ------------- |
| REQUESTED   | Project Manager       | Immediately   | Email, In-App |
| PLANNED     | Engineer              | On transition | Email         |
| DESIGN      | PM, Engineer          | On transition | Email         |
| APPROVED    | PM, Client, Crew      | On approval   | Email, SMS    |
| IN PROGRESS | Crew Lead, Supervisor | On start      | SMS, In-App   |
| INSPECTION  | Inspector, PM         | On request    | Email, SMS    |
| IN SERVICE  | Client, PM            | On approval   | Email         |
| CLOSED      | PM, Accounting        | On closure    | Email         |

---

## Error Handling

### Blocked Transitions

When a transition is blocked, the system shows:

```
❌ Cannot change status to IN PROGRESS

Missing Required Fields:
  • Start Date
  • Crew Size
  • Crew Lead Assignment

Action Required:
  1. Complete missing fields
  2. Save project
  3. Try status change again
```

### Failed Approvals

```
⚠️ Approval Request DENIED

Status: DESIGN → APPROVED
Approver: John Smith (Engineering Manager)
Reason: "Load calculations need revision for wind loading"
Date: 2025-10-15 14:32

Action Required:
  1. Review approver comments
  2. Make requested changes
  3. Re-submit for approval
```

---

## Best Practices

### ✅ DO:

- Follow the workflow sequence
- Complete all required fields before transitioning
- Document reasons for status changes
- Get approvals before critical gates
- Keep stakeholders informed
- Update regularly

### ❌ DON'T:

- Skip workflow stages
- Force status changes without approvals
- Leave required fields empty
- Ignore validation errors
- Rush through approval gates
- Close projects prematurely

---

## Metrics & KPIs

Track these metrics per status:

| Status      | Key Metric          | Target       |
| ----------- | ------------------- | ------------ |
| REQUESTED   | Time to PLANNED     | < 3 days     |
| PLANNED     | Time to DESIGN      | < 7 days     |
| DESIGN      | Time to APPROVED    | < 14 days    |
| APPROVED    | Time to IN PROGRESS | < 2 days     |
| IN PROGRESS | Time to INSPECTION  | Per estimate |
| INSPECTION  | Time to IN SERVICE  | < 5 days     |
| IN SERVICE  | Time to CLOSED      | Per contract |

---

## Workflow Automation

### Auto-Transitions (Future)

- INSPECTION → IN SERVICE (if inspection passes, no issues)
- IN SERVICE → CLOSED (if rental period expires, auto-trigger)

### Auto-Notifications (Current)

- All status transitions
- Approval requests
- Overdue inspections
- Milestone completions

### Auto-Validations (Current)

- Required fields check
- Date logic validation
- Approval permissions
- Workflow rules enforcement

---

## Summary Statistics

**Total Stages**: 8  
**Approval Gates**: 3  
**Possible Transitions**: 14  
**Terminal States**: 1 (CLOSED)  
**Average Project Duration**: 15-45 days  
**Notification Types**: 8  
**Auto-Validations**: 15+

---

_Workflow Version: 1.0.0_  
_Last Updated: October 17, 2025_  
_Status: Production Ready ✅_
