# LLM Instructions: Generate Spec-Driven Feature Implementation Structure

Generate a complete directory structure with documentation files for implementing a feature based on the <user_instruction></user_instruction>. Create self-contained specifications that developers can execute independently.

## Required Output Structure

```
/requirements/feature-name/
├── README.md                          # Feature overview and technical architecture
├── epic-1-descriptive-name/
│   ├── README.md                      # Epic scope, dependencies, integration points
│   ├── story-1-specific-deliverable/
│   │   ├── README.md                  # Story requirements and acceptance criteria
│   │   ├── task-1-concrete-action.md  # Implementation specification
│   │   ├── task-2-concrete-action.md  # Implementation specification
│   │   └── task-3-testing.md          # Testing specification
│   └── story-2-specific-deliverable/
│       ├── README.md
│       ├── task-1-concrete-action.md
│       └── task-2-testing.md
├── epic-2-descriptive-name/
│   └── [same structure]
└── epic-3-descriptive-name/
    └── [same structure]
```

## File Content Generation Templates

### Root README.md Structure

```markdown
# [Feature Name] Implementation

## Feature Overview

[2-3 sentence description of business value and user impact]

## System Architecture

### Components

- **Component 1**: [Technical responsibility]
- **Component 2**: [Technical responsibility]

### Data Flow

[Describe how data moves through the system]

### Technology Stack

- **Backend**: [Frameworks, languages, databases]
- **Frontend**: [Frameworks, libraries, tools]
- **Infrastructure**: [Deployment, monitoring, external services]

### Integration Points

- **External APIs**: [List with authentication methods]
- **Internal Services**: [Dependencies on existing systems]
- **Database Changes**: [Schema modifications required]

## Prerequisites

- [Specific environment setup requirements]
- [Required permissions or access]
- [Dependencies that must be installed]

## Implementation Sequence

1. Epic 1: [Brief description]
2. Epic 2: [Brief description]
3. Epic 3: [Brief description]

## Success Criteria

- [ ] [Measurable technical outcome]
- [ ] [Performance benchmark]
- [ ] [Integration requirement]
```

### Epic README.md Structure

```markdown
# Epic: [Descriptive Epic Name]

## Epic Scope

[What this epic accomplishes technically and why it's necessary for the feature]

## Architecture Impact

[How this epic affects the overall system design]

## Stories in This Epic

| Story   | Technical Focus              | Dependencies    |
| ------- | ---------------------------- | --------------- |
| Story 1 | [Core technical deliverable] | [Prerequisites] |
| Story 2 | [Core technical deliverable] | [Prerequisites] |

## Technical Dependencies

### Prerequisites

- [What must exist before starting this epic]
- [External system requirements]

### Provides For

- [What other epics depend on this epic's completion]

## Integration Requirements

- [How this epic connects to other epics]
- [API contracts or interfaces this epic must implement]
- [Data formats this epic must support]

## Technical Risks

- **Risk**: [Specific technical challenge]
  - **Impact**: [What breaks if this happens]
  - **Mitigation**: [Prevention strategy]

## Definition of Done

- [ ] [Technical milestone 1]
- [ ] [Technical milestone 2]
- [ ] [Integration verified]
```

### Story README.md Structure

````markdown
# Story: [Specific Technical Deliverable]

## Story Purpose

[What this story delivers in technical terms]

## Acceptance Criteria

- [ ] [Specific, testable technical requirement]
- [ ] [API endpoint behavior or UI component function]
- [ ] [Error handling requirement]
- [ ] [Performance or security requirement]

## Technical Specifications

### Data Requirements

```sql
-- Database schema changes
CREATE TABLE example (
    id SERIAL PRIMARY KEY,
    field_name TYPE CONSTRAINTS
);
```
````

### API Contracts

```yaml
# OpenAPI specification
paths:
  /api/endpoint:
    method:
      parameters: []
      responses: {}
```

### Component Interfaces

```typescript
// Frontend component props/interfaces
interface ComponentProps {
  prop: type;
}
```

## Implementation Tasks

[List of task files in this story directory]

- task-1-[action].md: [Brief description]
- task-2-[action].md: [Brief description]
- task-3-testing.md: [Testing requirements]

## Testing Requirements

### Unit Test Coverage

- [Specific functions/methods to test]
- [Edge cases to validate]

### Integration Points

- [External system interactions to test]
- [API endpoint validations]

## Dependencies

- **Requires**: [Other stories/tasks that must complete first]
- **Enables**: [What becomes possible after this story]

````

### Task [action].md Structure
```markdown
# Task: [Specific Implementation Action]

## Implementation Goal
[Concrete deliverable this task produces]

## Technical Requirements
### Files to Create/Modify
````

project-structure/
├── path/to/new-file.ext
├── path/to/modified-file.ext (modify lines X-Y)
└── path/to/test-file.ext

````

### Code Specifications
#### Database Operations
```sql
-- Exact SQL to implement
[Specific queries, migrations, or schema changes]
````

#### API Implementation

```javascript
// Exact endpoint implementation requirements
[Request/response handling, validation, error cases]
```

#### Frontend Components

```jsx
// Component structure and behavior
[Props, state, event handlers, styling requirements]
```

### Configuration Changes

```bash
# Environment variables to add/modify
VARIABLE_NAME=value_format

# Config file modifications
[Specific configuration additions or changes]
```

## Implementation Details

### Core Logic

[Step-by-step algorithm or business logic to implement]

### Error Handling

[Specific error conditions and required responses]

### Validation Rules

[Input validation, data constraints, business rules]

### Security Considerations

[Authentication, authorization, data protection requirements]

## Testing Specification

### Test Cases to Implement

```javascript
// Test structure template
describe("[Component/Function]", () => {
  test("[Specific scenario]", () => {
    // Test implementation guidance
  });
});
```

### Test Data Requirements

[Sample data, mock objects, test database states]

## Verification Checklist

- [ ] [Specific functionality works as specified]
- [ ] [Error conditions handled correctly]
- [ ] [Integration points function properly]
- [ ] [Tests pass with required coverage]

## Implementation Notes

[Technical gotchas, performance considerations, alternative approaches]

```

## Content Generation Rules

### Structure Requirements
1. **Epic Breakdown**: 3-5 epics per feature
2. **Story Granularity**: 2-4 stories per epic
3. **Task Decomposition**: 3-6 tasks per story, always include one testing task

### Naming Conventions
- **Directories**: kebab-case with descriptive names
- **Files**: kebab-case with action-oriented names
- **Prefixes**: epic-1-, story-1-, task-1- for ordering

### Technical Depth Requirements
- **Database**: Include actual SQL with proper field types and constraints
- **APIs**: Provide complete request/response schemas
- **Frontend**: Specify exact component structures and props
- **Testing**: Include test code templates and coverage expectations
- **Configuration**: List specific environment variables and values

### Content Quality Standards
- **Specificity**: Use exact file names, function names, variable names
- **Completeness**: Each task should be implementable without additional context
- **Consistency**: Maintain consistent technical patterns across all files
- **Actionability**: Every requirement should be verifiable and testable

## Generation Process

1. **MANDATORY: Complete Step 1 Clarification Process**
   - Analyze user's initial request for gaps and ambiguities
   - Generate specific clarifying questions based on the feature type
   - Wait for user responses before proceeding

2. **Validate Understanding**: Confirm you have sufficient technical context
   - Review all clarification responses
   - Identify any remaining ambiguities
   - Ask follow-up questions if needed

3. **Analyze Input**: Break user's feature request into logical technical components using their specific technology stack

4. **Create Structure**: Generate directory tree with proper naming conventions

5. **Generate Content**: Fill all templates with feature-specific technical details based on user's environment

6. **Validate Dependencies**: Ensure all cross-references are accurate and match user's existing systems

7. **Technical Review**: Verify all code snippets and specifications are complete and compatible with stated tech stack

## Important: Never Skip Step 1

If a user provides a feature request without sufficient technical details, you MUST ask clarifying questions before generating any implementation structure. Do not make assumptions about technology choices, architecture patterns, or implementation details.

## Output Quality Checklist
- [ ] All directories follow naming convention
- [ ] Every README is complete and self-contained
- [ ] All task files include specific implementation details
- [ ] Database schemas include proper constraints and indexes
- [ ] API specifications include authentication and error handling
- [ ] Frontend components specify props, state, and styling
- [ ] Testing requirements include unit and integration tests
- [ ] Dependencies between tasks are clearly documented
- [ ] Configuration changes are specific and complete

Generate the complete directory structure and file contents based on the user's feature requirements.
```
