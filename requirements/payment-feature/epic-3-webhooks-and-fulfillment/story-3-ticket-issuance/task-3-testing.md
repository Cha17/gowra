# Task: Testing Ticket Issuance

Status: Pending

## Implementation Goal

Validate that tickets are issued once on payment success and not duplicated.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/debugging/test-organizer-endpoints.js (extend) or new test file
```

## Testing Specification

- Simulate success webhook -> tickets created, order paid
- Send duplicate event -> no new tickets

## Verification Checklist

- [ ] Ticket count correct and stable across duplicates
