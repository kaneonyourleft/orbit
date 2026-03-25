# ARCHITECTURE

This project is structured as a Turborepo monorepo using pnpm workspaces.

## Monorepo Structure

- **apps/web**: The main user interface application built with Next.js 16.
- **packages/core**: The core logic engine including table, field, row, view, and plugin management.
- **packages/ui**: Shared React component library using Tailwind CSS.
- **packages/database**: Drizzle ORM schema definitions and migration scripts.
- **packages/shared**: Common utility functions, shared types, and constants.
- **plugins/**: Directory for external or internal plugins intended to extend the Work OS functionality.

## Plugin System Overview

The ORBIT ecosystem is designed around a microkernel architecture where most features are implemented as plugins.

### OrbitPlugin Interface

To develop a plugin, you must implement the `OrbitPlugin` interface:

- `id`: Unique identifier for the plugin.
- `version`: Version of the plugin.
- `init()`: Initialization function executed during plugin loading.
- `hooks`: Definition of hook points the plugin wants to intercept.

### List of Hooks

- `onDataLoad`: Fired when data is retrieved from the engine.
- `onViewRender`: Fired when a view is being displayed.
- `onUserInactivity`: Fired for background cleanup.
- `onPluginMount`: Lifecycle event for plugin mounting.
