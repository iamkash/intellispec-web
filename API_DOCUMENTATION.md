# IntelliSpec Web - AI Agentic Wizard API Documentation

## Overview

The IntelliSpec Web API provides a complete metadata-driven workflow execution system with AI agent orchestration capabilities. All endpoints are RESTful and support JSON payloads.

## Base URL
```
http://localhost:4000/api
```

## Authentication
Currently, authentication is not implemented for development. All endpoints are open.

---

## Workflow Endpoints

### 1. List Workflows
**GET** `/api/`

List all workflows with optional filtering and pagination.

**Query Parameters:**
- `status` (string): Filter by status (active, inactive, deprecated) - default: 'active'
- `category` (string): Filter by category
- `tags` (string): Filter by tags (comma-separated)
- `limit` (number): Number of results per page - default: 50
- `offset` (number): Pagination offset - default: 0
- `search` (string): Search in name and description

**Response:**
```json
{
  "workflows": [
    {
      "id": "workflow-id",
      "name": "Workflow Name",
      "description": "Workflow description",
      "version": 1,
      "status": "active",
      "tags": [],
      "executionCount": 0,
      "averageExecutionTime": 0,
      "createdAt": "2025-09-05T16:06:48.702Z",
      "updatedAt": "2025-09-05T16:06:48.702Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### 2. Create Workflow
**POST** `/api/`

Create a new workflow with metadata-driven configuration.

**Request Body:**
```json
{
  "id": "unique-workflow-id",
  "name": "Workflow Name",
  "description": "Workflow description",
  "category": "inspection",
  "status": "active",
  "metadata": {
    "id": "unique-workflow-id",
    "agents": [
      {
        "id": "agent-id",
        "type": "DataAggregatorAgent",
        "config": {
          "collection": "documents",
          "filter": {"type": "piping_inspection"}
        }
      }
    ],
    "connections": []
  }
}
```

**Response:**
```json
{
  "id": "unique-workflow-id",
  "name": "Workflow Name",
  "description": "Workflow description",
  "metadata": {
    "id": "unique-workflow-id",
    "agents": [
      {
        "id": "agent-id",
        "type": "DataAggregatorAgent",
        "config": {
          "collection": "documents",
          "filter": {"type": "piping_inspection"}
        }
      }
    ],
    "connections": []
  },
  "version": 1,
  "status": "active",
  "executionConfig": {
    "timeout": 300000,
    "maxRetries": 3,
    "enableCheckpoints": true
  },
  "executionCount": 0,
  "averageExecutionTime": 0,
  "successRate": 0,
  "tags": [],
  "createdBy": "system",
  "updatedBy": "system",
  "deleted": false,
  "_id": "mongodb-object-id",
  "createdAt": "2025-09-05T16:06:48.702Z",
  "updatedAt": "2025-09-05T16:06:48.702Z",
  "__v": 0
}
```

### 3. Get Workflow by ID
**GET** `/api/:id`

Retrieve a specific workflow by its ID.

**Response:** Same as create workflow response

### 4. Update Workflow
**PUT** `/api/:id`

Update an existing workflow.

**Request Body:** Same as create workflow, but `id` is in URL parameter

### 5. Delete Workflow
**DELETE** `/api/:id`

Delete a workflow and its related executions.

**Response:**
```json
{
  "message": "Workflow deleted successfully",
  "workflowId": "workflow-id"
}
```

### 6. Execute Workflow
**POST** `/api/:id/execute`

Execute a workflow with the specified initial state.

**Request Body:**
```json
{
  "initialState": {},
  "context": {}
}
```

**Response:**
```json
{
  "executionId": "exec_timestamp_randomstring",
  "status": "running",
  "message": "Workflow execution started"
}
```

### 7. Get Workflow Executions
**GET** `/api/:id/executions`

Get execution history for a specific workflow.

**Query Parameters:**
- `limit` (number): Number of results - default: 20
- `offset` (number): Pagination offset - default: 0
- `status` (string): Filter by execution status

**Response:**
```json
{
  "executions": [
    {
      "metrics": {
        "totalNodes": 0,
        "completedNodes": 0,
        "failedNodes": 0,
        "agentCalls": 0,
        "apiCalls": 0
      },
      "_id": "mongodb-object-id",
      "executionId": "exec_timestamp_randomstring",
      "status": "completed",
      "completedAt": "2025-09-05T16:16:31.752Z",
      "duration": 35
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### 8. Validate Workflow
**POST** `/api/:id/validate`

Validate workflow metadata without executing.

**Response:**
```json
{
  "workflowId": "workflow-id",
  "isValid": true,
  "errors": [],
  "summary": {
    "agentCount": 1,
    "connectionCount": 0
  }
}
```

### 9. Get Workflow Statistics
**GET** `/api/stats`

Get overall workflow and execution statistics.

**Response:**
```json
{
  "workflows": {
    "total": 3,
    "active": 3,
    "inactive": 0,
    "deprecated": 0
  },
  "executions": {
    "total": 4,
    "completed": 2,
    "failed": 2,
    "running": 0,
    "averageDuration": 35
  }
}
```

### 10. Test Route
**GET** `/api/test`

Simple test endpoint to verify API connectivity.

**Response:**
```json
{
  "message": "Workflow routes registered successfully",
  "timestamp": "2025-09-05T16:05:11.184Z",
  "status": "OK"
}
```

---

## Workflow Metadata Structure

### Agent Configuration
```json
{
  "id": "unique-agent-id",
  "type": "DataAggregatorAgent",
  "config": {
    "collection": "documents",
    "filter": {"type": "piping_inspection"}
  }
}
```

### Connection Configuration
```json
{
  "from": "START",
  "to": "agent-id",
  "condition": null
}
```

### Supported Agent Types
- `DataAggregatorAgent` - Aggregates data from MongoDB collections

---

## Error Handling

All endpoints return appropriate HTTP status codes:

- `200` - Success
- `201` - Created
- `202` - Accepted (async operation started)
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

Error responses include:
```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

---

## Examples

### Create a Simple Workflow
```bash
curl -X POST http://localhost:4000/api/ \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sample-workflow",
    "name": "Sample Workflow",
    "description": "A sample workflow",
    "metadata": {
      "id": "sample-workflow",
      "agents": [
        {
          "id": "data-agent",
          "type": "DataAggregatorAgent",
          "config": {
            "collection": "documents",
            "filter": {"type": "piping_inspection"}
          }
        }
      ],
      "connections": []
    }
  }'
```

### Execute a Workflow
```bash
curl -X POST http://localhost:4000/api/sample-workflow/execute \
  -H "Content-Type: application/json" \
  -d '{"initialState": {}}'
```

### Check Execution Status
```bash
curl http://localhost:4000/api/sample-workflow/executions
```

---

## System Architecture

The API is built with:
- **Fastify** - High-performance web framework
- **MongoDB** - Document database for persistence
- **LangGraph** - AI agent orchestration
- **Metadata-driven** - All business logic defined in JSON

All components are designed to be:
- **Scalable** - Modular architecture
- **Extensible** - Plugin-based agent system
- **Testable** - Isolated components
- **Production-ready** - Comprehensive error handling

---

## Development Notes

- Server runs on port 4000 by default
- Environment variables loaded from `.env` file
- MongoDB Atlas connection required
- Vector service auto-updates embeddings
- All routes are prefixed with `/api`

---

*Last updated: September 5, 2025*

