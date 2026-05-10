export function sanitizeAIContext(context: any): any {
  if (!context) return null;

  const simplify = (obj: any): any => {
    if (Array.isArray(obj)) return obj.map(simplify);
    if (obj !== null && typeof obj === 'object') {
      if (obj.title && (obj.nodeType || obj.type)) {
          return {
              id: obj.id,
              title: obj.title,
              type: obj.nodeType?.name || obj.type?.name || obj.type,
              status: obj.status,
              sprint: obj.sprint?.name || obj.sprint,
              startDate: obj.startDate,
              endDate: obj.endDate,
              children: obj.childLinks?.map((l: any) => l.childNode?.id || l.childNode?.title) || 
                        obj.children?.map((c: any) => typeof c === 'string' ? c : (c.id || c.title)) || [],
              content: obj.content
          };
      }
      if (obj.name && obj.fields) {
          return {
              id: obj.id,
              name: obj.name,
              color: obj.color,
              isSprintEligible: obj.isSprintEligible,
              fields: obj.fields.map((f: any) => ({
                  name: typeof f === 'string' ? f : f.name,
                  type: typeof f === 'string' ? 'TEXT' : f.type
              }))
          };
      }
      if (obj.name && (obj.startDate !== undefined || obj.endDate !== undefined)) {
          return {
              id: obj.id,
              name: obj.name,
              startDate: obj.startDate,
              endDate: obj.endDate,
              status: obj.status
          };
      }
      const newObj: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (['createdAt', 'updatedAt', 'userId', 'projectId', 'nodeTypeId', 'sprintId', 'nodeId'].includes(key)) continue;
        if (key === 'childLinks' || key === 'parentLinks') continue;
        newObj[key] = simplify(value);
      }
      return newObj;
    }
    return obj;
  };

  return simplify(context);
}

export function generatePromptText(context: any, sanitizedContext: any): string {
  if (!context) return "No context available.";

  let text = "# PROMPT INSTRUCTIONS\n";
  text += "Use existing 'id' fields to reference or update items. Do NOT generate new IDs for new items.\n";
  text += "When creating new items, simply omit the 'id' field.\n";
  text += "You can link nodes by their existing ID or their Title.\n\n";

  text += "## 🏗️ AVAILABLE NODE TYPES\n";
  if (context.allNodeTypes) {
      context.allNodeTypes.forEach((t: any) => {
          text += `- ${t.name}: [Fields: ${t.fields.map((f: any) => `${f.name} (${f.type})`).join(", ")}]\n`;
      });
  } else if (context.nodeTypes) {
      context.nodeTypes.forEach((t: any) => {
          text += `- ${t.name}\n`;
      });
  } else {
      text += "No node types defined.\n";
  }
  text += "\n";

  text += "## 🔄 VALID RELATIONS\n";
  if (context.allRelations || context.relations) {
      const rels = context.allRelations || context.relations;
      rels.forEach((r: any) => {
          text += `- ${r.parent} -> ${r.child}\n`;
      });
  } else {
      text += "No relations defined.\n";
  }
  text += "\n";

  text += "## 📂 JSON STRUCTURE EXAMPLES\n";
  text += "### New Nodes Example:\n";
  text += "{\n  \"nodes\": [\n    { \"title\": \"Task A\", \"type\": \"Task\", \"children\": [\"Child Task\"] },\n    { \"title\": \"Child Task\", \"type\": \"Subtask\" }\n  ]\n}\n\n";
  text += "### New Sprint Example:\n";
  text += "{\n  \"sprints\": [\n    { \"name\": \"Phase 2\", \"startDate\": \"2024-02-01\", \"endDate\": \"2024-02-14\" }\n  ]\n}\n\n";

  text += "## 📊 CURRENT PROJECT DATA\n";
  text += JSON.stringify(sanitizedContext, null, 2);

  return text;
}
