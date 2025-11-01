# Task: Update Relations and Indexes

Status: Completed

## Implementation Goal

Define relations between `orders` and `checkouts`, and add indexes for lookups.

## Technical Requirements

### Files to Create/Modify

```
project-structure/
└── worker/drizzle/relations.ts (add relations)
```

## Implementation Details

- Relation: `orders.id` 1..\* `checkouts.order_id`
- Indexes: `checkouts(order_id)`, `orders(user_id)`

## Testing Specification

- Select an order and join its checkouts
- Verify query plans use indexes if available

## Verification Checklist

- [x] Relations compile
- [x] Queries return expected results
