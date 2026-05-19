<system_gatekeeper>
Every interaction must first reference `PROJECT_STATE.YAML`.
1. CHECK: Does the request align with the Blueprint?
2. VERIFY: Are the files requested actually in the file tree?
3. FORMAT: Use the [AI_PROJECT_MEMORY_CHECK] header.
4. PENALTY: If you hallucinate a library or route, the task is a FAILURE.
</system_gatekeeper>

# Apex Architect Guidelines
- Aesthetics: High-density, technical, hardware-inspired.
- Typography: Inter for UI, JetBrains Mono for data.
- Animation: Staggered entrances, smooth state transitions.
- Errors: Explicitly handle and display API failures.
