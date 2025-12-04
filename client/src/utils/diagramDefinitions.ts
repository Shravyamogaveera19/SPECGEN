/**
 * Diagram Definitions
 * Contains Mermaid diagram configurations for HLD, LLD, Database Schema, and Sequences
 */

export const DIAGRAM_DEFINITIONS = {
  hld: {
    id: 'hld',
    title: 'High-Level Architecture Design',
    description: 'Overall system architecture showing frontend, backend, ML service, and external integrations',
    category: 'Architecture',
    mermaidConfig: {
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        padding: 15,
        htmlLabels: true,
      },
    },
  },
  lld: {
    id: 'lld',
    title: 'Low-Level Design',
    description: 'Detailed component interactions, validation pipeline, and data flow',
    category: 'Design',
    mermaidConfig: {
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        padding: 15,
        htmlLabels: true,
      },
    },
  },
  databaseSchema: {
    id: 'databaseSchema',
    title: 'Database Schema & Entity Relationships',
    description: 'MongoDB collections, fields, relationships, and cardinality',
    category: 'Database',
    mermaidConfig: {
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      er: {
        useMaxWidth: true,
        padding: 15,
      },
    },
  },
  sequenceDiagram: {
    id: 'sequenceDiagram',
    title: 'Repository Validation Sequence Flow',
    description: 'Step-by-step interaction between user, frontend, backend, GitHub API, and ML service',
    category: 'Flow',
    mermaidConfig: {
      startOnLoad: true,
      theme: 'dark',
      securityLevel: 'loose',
      sequence: {
        useMaxWidth: true,
        mirrorActors: true,
      },
    },
  },
};

export type DiagramType = keyof typeof DIAGRAM_DEFINITIONS;

export const DIAGRAM_CATEGORIES = ['Architecture', 'Design', 'Database', 'Flow'];

export const getDiagramDefinition = (type: DiagramType) => {
  return DIAGRAM_DEFINITIONS[type];
};

export const getAllDiagrams = () => {
  return Object.values(DIAGRAM_DEFINITIONS);
};

export const getDiagramsByCategory = (category: string) => {
  return Object.values(DIAGRAM_DEFINITIONS).filter(
    (diagram) => diagram.category === category
  );
};
