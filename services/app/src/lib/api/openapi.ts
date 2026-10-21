import { WEBHOOK_EVENTS } from "@/lib/webhooks/security";

const id = { type: "string" };
const errorResponse = { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
const projectId = { name: "projectId", in: "path", required: true, schema: id };
const itemId = { name: "itemId", in: "path", required: true, schema: id };
const ok = (schema: object, description = "OK") => ({ description, content: { "application/json": { schema } } });
const item = { $ref: "#/components/schemas/Item" };

/** The REST API described for tools that read OpenAPI (Postman, code generators, AI agents). */
export function openApiDocument(baseUrl: string) {
  return {
    openapi: "3.0.3",
    info: { title: "Quick Planner API", version: "1.0.0", description: "Create a personal API token on your Account page. It acts as you: it can see and change what you can. Read-only tokens can only use GET." },
    servers: [{ url: `${baseUrl}/api/v1` }],
    security: [{ bearer: [] }],
    components: {
      securitySchemes: { bearer: { type: "http", scheme: "bearer", description: "qp_… personal API token" } },
      schemas: {
        Error: { type: "object", properties: { error: { type: "object", properties: { code: { type: "string" }, message: { type: "string" } } } } },
        Item: {
          type: "object",
          properties: {
            id, projectId: id, title: { type: "string" }, description: { type: "string", nullable: true },
            type: { type: "object", properties: { id, name: { type: "string" } } },
            status: { type: "string", enum: ["TODO", "IN_PROGRESS", "REVIEW", "DONE"] }, archived: { type: "boolean" },
            parentId: { type: "string", nullable: true }, sprintId: { type: "string", nullable: true },
            assignee: { type: "object", nullable: true, properties: { id, name: { type: "string", nullable: true }, email: { type: "string", nullable: true } } },
            startDate: { type: "string", format: "date", nullable: true }, endDate: { type: "string", format: "date", nullable: true },
            completedAt: { type: "string", format: "date-time", nullable: true },
            fields: { type: "object", additionalProperties: true }, blockedBy: { type: "array", items: id },
            createdAt: { type: "string", format: "date-time" }, updatedAt: { type: "string", format: "date-time" }, url: { type: "string" },
          },
        },
      },
    },
    paths: {
      "/projects": { get: { summary: "List your projects", responses: { 200: ok({ type: "object" }), 401: errorResponse } } },
      "/projects/{projectId}": { get: { summary: "A project with its item types and sprints", parameters: [projectId], responses: { 200: ok({ type: "object" }), 404: errorResponse } } },
      "/projects/{projectId}/items": {
        get: {
          summary: "List items", description: "Paged: pass the returned nextCursor as cursor.",
          parameters: [projectId,
            { name: "status", in: "query", schema: { type: "string" }, description: "Comma separated: TODO,IN_PROGRESS,REVIEW,DONE" },
            { name: "assignee", in: "query", schema: { type: "string" }, description: "A user id, me, or none" },
            { name: "sprint", in: "query", schema: { type: "string" }, description: "A sprint id or none" },
            { name: "type", in: "query", schema: { type: "string" }, description: "Item type name or id" },
            { name: "q", in: "query", schema: { type: "string" }, description: "Title contains" },
            { name: "archived", in: "query", schema: { type: "boolean" } },
            { name: "updatedSince", in: "query", schema: { type: "string", format: "date-time" } },
            { name: "limit", in: "query", schema: { type: "integer", maximum: 500, default: 100 } },
            { name: "cursor", in: "query", schema: { type: "string" } }],
          responses: { 200: ok({ type: "object", properties: { items: { type: "array", items: item }, nextCursor: { type: "string", nullable: true } } }) },
        },
        post: {
          summary: "Create an item",
          parameters: [projectId],
          requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["title", "type"], properties: { title: { type: "string" }, type: { type: "string", description: "Item type name or id" }, parentId: id, description: { type: "string" }, status: { type: "string" }, sprintId: id, assigneeId: id, startDate: { type: "string", format: "date" }, endDate: { type: "string", format: "date" }, fields: { type: "object" } } } } } },
          responses: { 201: ok(item, "Created"), 400: errorResponse, 403: errorResponse },
        },
      },
      "/projects/{projectId}/items/{itemId}": {
        get: { summary: "One item, with its children and what it blocks", parameters: [projectId, itemId], responses: { 200: ok(item), 404: errorResponse } },
        patch: { summary: "Change an item", parameters: [projectId, itemId], requestBody: { content: { "application/json": { schema: { type: "object", properties: { title: { type: "string" }, description: { type: "string" }, fields: { type: "object" }, status: { type: "string" }, archived: { type: "boolean" }, startDate: { type: "string", nullable: true }, endDate: { type: "string", nullable: true }, assigneeId: { type: "string", nullable: true }, sprintId: { type: "string", nullable: true }, parentId: { type: "string", nullable: true } } } } } }, responses: { 200: ok(item), 400: errorResponse } },
        delete: { summary: "Delete an item", parameters: [projectId, itemId], responses: { 204: { description: "Deleted" }, 404: errorResponse } },
      },
      "/projects/{projectId}/items/{itemId}/comments": {
        get: { summary: "Comments on an item", parameters: [projectId, itemId], responses: { 200: ok({ type: "object" }) } },
        post: { summary: "Add a comment", parameters: [projectId, itemId], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["body"], properties: { body: { type: "string" } } } } } }, responses: { 201: ok({ type: "object" }, "Created") } },
      },
      "/projects/{projectId}/sprints": { get: { summary: "Sprints with progress", parameters: [projectId], responses: { 200: ok({ type: "object" }) } } },
    },
    "x-webhooks": {
      description: "Project owners register webhooks under Settings → Integrations. Each delivery is a POST with a JSON body and the headers X-QuickPlanner-Event, X-QuickPlanner-Delivery, X-QuickPlanner-Timestamp and X-QuickPlanner-Signature (sha256=HMAC_SHA256(secret, `${timestamp}.${body}`)).",
      events: [...WEBHOOK_EVENTS, "ping"],
    },
  };
}
