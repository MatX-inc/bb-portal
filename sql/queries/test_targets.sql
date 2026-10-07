-- name: CreateTestTargetsBulk :exec
INSERT INTO test_targets (target_id)
SELECT unnest(@target_ids::bigint[]) as target_id
ORDER BY target_id
ON CONFLICT (target_id) DO NOTHING;

-- name: DeleteOrphanedTestTargetsFromPages :execrows
DELETE FROM test_targets
WHERE ctid IN (
    SELECT ctid
    FROM test_targets
    WHERE
        ctid >= format('(%s,0)', sqlc.arg(from_page)::bigint)::tid
        AND ctid < format('(%s,0)', sqlc.arg(from_page)::bigint + sqlc.arg(pages)::bigint)::tid
        AND NOT EXISTS (
            SELECT 1
            FROM invocation_targets it
            WHERE it.target_invocation_targets = test_targets.target_id
                AND EXISTS (
                    -- OFFSET 0 keeps the summary check a per-row test. Joined
                    -- instead, invocation_targets and test_summaries form their
                    -- own relation, planned on total cost, where the anti-join's
                    -- early exit is invisible: the planner takes a bitmap scan,
                    -- which materialises every invocation_target of the target
                    -- before yielding any. A target has tens of thousands of
                    -- them and the anti-join consumes a handful.
                    SELECT 1
                    FROM test_summaries ts
                    WHERE ts.invocation_target_test_summary = it.id
                    OFFSET 0
                )
        )
    FOR UPDATE SKIP LOCKED
    LIMIT sqlc.arg(batch_limit)::bigint
);
