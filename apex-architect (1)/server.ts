import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";
import fs from "fs/promises";
import yaml from "js-yaml";

dotenv.config();

let heartConfigCache = { content: "", mtimeMs: 0 };
async function getHeartConfig() {
  const statePath = path.join(process.cwd(), "PROJECT_STATE.YAML");
  try {
    const stat = await fs.stat(statePath);
    if (heartConfigCache.mtimeMs !== Math.floor(stat.mtimeMs)) {
      heartConfigCache.content = await fs.readFile(statePath, "utf-8");
      heartConfigCache.mtimeMs = Math.floor(stat.mtimeMs);
    }
    return heartConfigCache.content;
  } catch (e) {
    return "";
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Routes
  app.get("/api/state", async (req, res) => {
    try {
      const content = await fs.readFile(path.join(process.cwd(), "PROJECT_STATE.YAML"), "utf-8");
      const data = yaml.load(content);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to read state" });
    }
  });

  app.post("/api/generate-blueprint", async (req, res) => {
    const { concept } = req.body;
    if (!concept) return res.status(400).json({ error: "Concept is required" });

    try {
      const heartConfig = await getHeartConfig();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monologue: {
                type: Type.OBJECT,
                properties: {
                  plan: { type: Type.STRING },
                  verify: { type: Type.STRING },
                  error_prediction: { type: Type.STRING },
                  optimize: { type: Type.STRING }
                },
                required: ["plan", "verify", "error_prediction", "optimize"]
              },
              blueprint: { type: Type.STRING },
              consistency_score: { type: Type.INTEGER }
            },
            required: ["monologue", "blueprint", "consistency_score"]
          }
        },
        contents: `
          <apex_controller_config>
          [TASK]: Transform [USER_CONCEPT] into a Rigid Technical Blueprint.
          [MODEL_OUTPUT]: JSON format following the schema.
          
          [HEART_CONFIG]:
          ${heartConfig}
          
          <internal_monologue_schema>
          [PLAN]: Step-by-step logic map.
          [VERIFY]: Check against Blueprint + Memory Heart.
          [ERROR_PREDICTION]: Identify 3 potential failure points.
          [OPTIMIZE]: Refine for token efficiency and performance.
          </internal_monologue_schema>

          <execution_flow>
          1. Extract constraint definitions from HEART_CONFIG.
          2. Apply Heart-driven transformations to the IR.
          3. Perform consistency check via Heart Axioms.
          4. Calculate consistency_score relative to baseline.
          </execution_flow>

          [USER_CONCEPT]: "${concept}"
          </apex_controller_config>
        `,
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/meta-compile", async (req, res) => {
    const { payload, format } = req.body;
    if (!payload) return res.status(400).json({ error: "Payload is required" });

    try {
      const heartConfig = await getHeartConfig();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              monologue: {
                type: Type.OBJECT,
                properties: {
                  plan: { type: Type.STRING },
                  verify: { type: Type.STRING },
                  error_prediction: { type: Type.STRING },
                  optimize: { type: Type.STRING }
                },
                required: ["plan", "verify", "error_prediction", "optimize"]
              },
              blueprint: { type: Type.STRING },
              consistency_score: { type: Type.INTEGER }
            },
            required: ["monologue", "blueprint", "consistency_score"]
          }
        },
        contents: `
          <apex_controller_config>
          [TASK]: Transform Orchestrator Payload into a Rigid Technical Blueprint.
          [MODEL_OUTPUT]: JSON format following the schema.
          
          [HEART_CONFIG]:
          ${heartConfig}

          <internal_monologue_schema>
          [PLAN]: Step-by-step logic map.
          [VERIFY]: Check against Blueprint + Memory Heart.
          [ERROR_PREDICTION]: Identify 3 potential failure points.
          [OPTIMIZE]: Refine for token efficiency and performance.
          </internal_monologue_schema>

          <execution_flow>
          1. Extract constraint definitions from HEART_CONFIG.
          2. Apply Heart-driven transformations to the IR.
          3. Perform consistency check via Heart Axioms.
          4. Calculate consistency_score relative to baseline.
          </execution_flow>

          [ORCHESTRATOR_PAYLOAD]:
          FORMAT: ${format}
          CONTENT: ${JSON.stringify(payload)}
          </apex_controller_config>
        `,
      });

      const data = JSON.parse(response.text || "{}");
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/update-state", async (req, res) => {
    const { goal, output } = req.body;
    try {
      const statePath = path.join(process.cwd(), "PROJECT_STATE.YAML");
      const content = await fs.readFile(statePath, "utf-8");
      
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: `
          <task_update_state>
          [CURRENT_STATE]:
          ${content}
          
          [RECENT_EXECUTION_GOAL]: ${goal}
          [EXECUTION_OUTPUT]: ${output}
          
          You are a COMPILER_MODULE. Your task is to filter the log and extract 'COMPLETED_FEATURES' and 'RESIDUAL_GAPS' (technical debt/active gaps).
          Update the given YAML state tree to incorporate these new features and gaps, preserving other keys.
          Ensure the final output contains a node like:
          state_tree:
            features: [list]
            technical_debt: [list]
            metadata:
              last_updated: "timestamp"
              session_id: "uuid"
          
          Return ONLY the raw updated YAML content without markdown blocks.
          </task_update_state>
        `
      });

      let updatedYaml = response.text || "";
      updatedYaml = updatedYaml.replace(/```yaml/g, "").replace(/```/g, "").trim();
      
      await fs.writeFile(statePath, updatedYaml, "utf-8");
      const data = yaml.load(updatedYaml);
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/generate-executor", async (req, res) => {
    const { blueprint, goal, context } = req.body;
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          <atomic_execution_module>
          [INPUT_DATA]: ${blueprint}
          [STATE_CONTEXT]: ${context}
          [CURRENT_GOAL]: ${goal}

          <execution_constraints>
          - Match the exact folder structure in [STATE_CONTEXT].
          - Use the [BLUEPRINT] for naming conventions.
          - Implement "Defensive Programming" (Try-Catch, Error Logging, Type-Checking).
          </execution_constraints>

          <verification_loop>
          Perform a "Chain of Verification" (CoVe):
          1. Does this code introduce a breaking change to the existing state?
          2. Is the code 100% compliant with the security specs in the blueprint?
          </verification_loop>

          [OUTPUT_FORMAT]:
          - FILE_PATH: example/path
          - CODE_BLOCK: implementation
          - INTEGRATION_NOTES: how it connects
          </atomic_execution_module>
        `,
      });

      res.json({ output: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
