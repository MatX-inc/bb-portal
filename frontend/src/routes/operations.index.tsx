import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { OperationStatus } from "@/components/OperationFilterSelector";
import { OperationsPage } from "@/components/pages/Operations";
import { generatePageTitle } from "@/utils/generatePageTitle";

const OperationsFilterSchema = z
  .object({
    "@type": z.string(),
    toolInvocationId: z.uuid().optional(),
    correlatedInvocationsId: z.uuid().optional(),
  })
  .optional()
  .refine(
    (data) =>
      (data?.toolInvocationId && !data?.correlatedInvocationsId) ||
      (!data?.toolInvocationId && data?.correlatedInvocationsId),
    "Either toolInvocationId or correlatedInvocationsId must be provided, but not both",
  );

export type OperationsFilterParams = z.infer<typeof OperationsFilterSchema>;

// Token pools are keyed by instance name prefix and token name. With
// blockedOnly set, only operations parked on the pool are listed.
const OperationsTokenFilterSchema = z
  .object({
    instanceNamePrefix: z.string(),
    name: z.string(),
    blockedOnly: z.boolean().optional(),
  })
  .optional();

export type OperationsTokenFilterParams = z.infer<
  typeof OperationsTokenFilterSchema
>;

const OperationsSearchSchema = z.object({
  filter: OperationsFilterSchema,
  tokenFilter: OperationsTokenFilterSchema,
  status: z.enum(OperationStatus).optional(),
});

export type OperationsSearchParams = z.infer<typeof OperationsSearchSchema>;

export const Route = createFileRoute("/operations/")({
  component: RouteComponent,
  validateSearch: (search) => OperationsSearchSchema.parse(search),
  head: (_ctx) => ({ meta: [{ title: generatePageTitle(["Operations"]) }] }),
});

function RouteComponent() {
  const { filter, tokenFilter, status } = Route.useSearch();
  return (
    <OperationsPage filter={filter} tokenFilter={tokenFilter} status={status} />
  );
}
