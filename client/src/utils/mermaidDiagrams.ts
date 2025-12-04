/**
 * Mermaid Diagram Content
 * Raw Mermaid syntax for all diagrams
 */

export const MERMAID_DIAGRAMS = {
  hld: `graph TB
    subgraph Client["Client Layer (React/Vite)"]
        UI["🖥️ User Interface"]
        Home["📄 Home Page"]
        RepoVal["🔍 Repo Validator Page"]
        Header["🔗 Header/Navigation"]
        Footer["📍 Footer"]
        UI --> Home
        UI --> RepoVal
        UI --> Header
        UI --> Footer
    end

    subgraph Server["Application Layer (Express/Node)"]
        API["API Gateway"]
        HealthCheck["Health Route<br/>GET /health"]
        ValidateRoute["Validation Route<br/>POST /api/validate-repo"]
        DB_Layer["Database Layer<br/>Mongoose ODM"]
        
        API --> HealthCheck
        API --> ValidateRoute
        ValidateRoute --> DB_Layer
    end

    subgraph ML["AI/ML Layer (FastAPI/Python)"]
        MLHealth["Health Endpoint<br/>GET /health"]
        Embedding["Embedding Service<br/>POST /embed"]
        Transformer["Sentence Transformers<br/>+ PyTorch"]
        
        MLHealth --> Transformer
        Embedding --> Transformer
    end

    subgraph External["External Services"]
        GitHub["GitHub REST API<br/>Repository Data"]
        MongoDB["MongoDB Database<br/>Data Persistence"]
    end

    Client -->|HTTP/REST<br/>5173| Server
    Server -->|Query/Store Data| MongoDB
    Server -->|Fetch Repo Data| GitHub
    Client -->|HTTP/REST<br/>8000| ML
    
    style Client fill:#1e40af,stroke:#0c4a6e,stroke-width:2px,color:#fff
    style Server fill:#16a34a,stroke:#15803d,stroke-width:2px,color:#fff
    style ML fill:#9333ea,stroke:#7c3aed,stroke-width:2px,color:#fff
    style External fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff`,

  lld: `graph TD
    subgraph Frontend["Frontend Components"]
        RepoValidator["RepoValidator Component"]
        InputForm["Input Form<br/>URL + Branch"]
        ValidationUI["Validation Result Display"]
        MetricsDisplay["Code Metrics Display<br/>Languages, Quality Score"]
        
        RepoValidator --> InputForm
        RepoValidator --> ValidationUI
        ValidationUI --> MetricsDisplay
    end

    subgraph BackendLogic["Backend Request Handler"]
        RequestHandler["POST Handler<br/>/api/validate-repo"]
        URLParser["Parse GitHub URL<br/>Extract owner/repo"]
        RepoMetadata["Fetch Repo Metadata<br/>Branches, Default Branch"]
        CodeAnalysis["Analyze Repository<br/>Language Detection<br/>File Type Detection<br/>Quality Metrics"]
        Validation["Validation Logic<br/>Check existence<br/>Check accessibility<br/>Check code presence"]
        Response["Build Response<br/>Return metrics & metadata"]
        
        RequestHandler --> URLParser
        URLParser --> RepoMetadata
        RepoMetadata --> CodeAnalysis
        CodeAnalysis --> Validation
        Validation --> Response
    end

    subgraph APIInteraction["API Interactions"]
        GHRepoAPI["GitHub API<br/>GET /repos/:owner/:repo"]
        GHBranchAPI["GitHub API<br/>GET /repos/:owner/:repo/branches"]
        GHTreeAPI["GitHub API<br/>GET /repos/:owner/:repo/git/trees"]
        
        RepoMetadata --> GHRepoAPI
        RepoMetadata --> GHBranchAPI
        CodeAnalysis --> GHTreeAPI
    end

    subgraph Database["Database Layer"]
        ValidationModel["ValidationResult Model<br/>_id, url, owner, repo,<br/>branch, metrics, timestamp"]
        DocumentModel["Document Model<br/>_id, validationId,<br/>type, content, format"]
        
        Validation --> ValidationModel
    end

    subgraph MLIntegration["ML Service Integration"]
        EmbeddingService["Embedding Service<br/>POST /embed"]
        CodeEmbedding["Generate Code Embeddings<br/>Sentence Transformers"]
        VectorStorage["Store Embeddings<br/>in Document Model"]
        
        CodeAnalysis -.->|Future| EmbeddingService
        EmbeddingService --> CodeEmbedding
        CodeEmbedding --> VectorStorage
    end

    InputForm -->|API Call| RequestHandler
    Response --> ValidationUI

    style Frontend fill:#1e40af,stroke:#0c4a6e,stroke-width:2px,color:#fff
    style BackendLogic fill:#16a34a,stroke:#15803d,stroke-width:2px,color:#fff
    style APIInteraction fill:#d97706,stroke:#b45309,stroke-width:2px,color:#fff
    style Database fill:#7c3aed,stroke:#6d28d9,stroke-width:2px,color:#fff
    style MLIntegration fill:#c2410c,stroke:#9a3412,stroke-width:2px,color:#fff`,

  databaseSchema: `erDiagram
    VALIDATION_RESULT ||--o{ GENERATED_DOCUMENT : generates
    VALIDATION_RESULT ||--o{ CODE_EMBEDDING : contains
    GENERATED_DOCUMENT ||--o{ CODE_EMBEDDING : references

    VALIDATION_RESULT {
        string _id PK
        string repositoryUrl UK
        string owner
        string repo
        string branch
        string defaultBranch
        array branches
        object codeMetrics
        boolean hasCode
        boolean accessible
        boolean exists
        string primaryLanguage
        object languagePercentages
        boolean hasTests
        boolean hasReadme
        boolean hasLicense
        boolean hasCI
        boolean hasDockerfile
        array configFiles
        number qualityScore
        string projectType
        datetime createdAt
        datetime updatedAt
    }

    GENERATED_DOCUMENT {
        string _id PK
        string validationResultId FK
        string documentType "SRS|HLD|LLD|etc"
        string content
        string format "PDF|Markdown|Word|HTML"
        number fileSize
        string language
        string status "pending|completed|failed"
        string errorMessage
        datetime createdAt
        datetime updatedAt
    }

    CODE_EMBEDDING {
        string _id PK
        string validationResultId FK
        string fileContent
        array embeddingVector "1024-dim vector"
        string language
        string fileType
        number similarity_score
        datetime createdAt
    }`,

  sequenceDiagram: `sequenceDiagram
    participant User
    participant Browser as Browser<br/>React
    participant Backend as Backend<br/>Express
    participant GitHub as GitHub API
    participant Database as MongoDB
    participant ML as ML Service

    User->>Browser: Enter repo URL & branch
    Browser->>Browser: Form validation
    Browser->>Backend: POST /api/validate-repo<br/>{url, branch}
    
    Backend->>Backend: Parse GitHub URL
    alt URL Invalid
        Backend-->>Browser: 400 Bad Request
    end

    Backend->>GitHub: GET /repos/:owner/:repo
    alt Repo Not Found
        GitHub-->>Backend: 404 Not Found
        Backend-->>Browser: 404 + error message
    else Repo Found
        GitHub-->>Backend: Repo metadata
    end

    Backend->>GitHub: GET /repos/:owner/:repo/branches?per_page=100
    GitHub-->>Backend: List of branches
    
    alt Branch Validation
        Backend->>Backend: Check branch exists
    end

    Backend->>GitHub: GET /repos/:owner/:repo/git/trees/:branch?recursive=1
    GitHub-->>Backend: Repository tree structure
    
    Backend->>Backend: Analyze code files<br/>- Detect languages<br/>- Count file types<br/>- Calculate metrics<br/>- Determine project type
    
    Backend->>Database: Store ValidationResult
    Database-->>Backend: ValidationResult created
    
    Backend->>ML: POST /embed<br/>Code content
    ML->>ML: Generate embeddings<br/>Sentence Transformers
    ML-->>Backend: Embedding vectors
    
    Backend->>Database: Store Code Embeddings
    Database-->>Backend: Embeddings stored
    
    Backend-->>Browser: 200 OK<br/>Validation results
    Browser->>Browser: Display metrics<br/>- Languages<br/>- File count<br/>- Quality score<br/>- Branch info
    
    Browser-->>User: Show validation results`,
};

export const getMermaidDiagram = (type: keyof typeof MERMAID_DIAGRAMS): string => {
  return MERMAID_DIAGRAMS[type];
};
