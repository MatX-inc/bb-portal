import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Table } from "antd";
import type React from "react";
import { useState } from "react";
import { buildQueueStateClient } from "@/grpc/buildQueueStateClient";
import {
  ExecutionStage_Value,
  RequestMetadata,
} from "@/lib/grpc-client/build/bazel/remote/execution/v2/remote_execution";
import type {
  OperationsFilterParams,
  OperationsTokenFilterParams,
} from "@/routes/operations.index";
import themeStyles from "@/theme/theme.module.css";
import {
  OperationFilterSelector,
  OperationStatus,
} from "../OperationFilterSelector";
import OperationsInvocationFilter from "../OperationsInvocationFilter";
import OperationsTokenFilter from "../OperationsTokenFilter";
import PortalAlert from "../PortalAlert";
import getColumns from "./Columns";

const PAGE_SIZE = 1000;

interface Props {
  filter: OperationsFilterParams;
  tokenFilter?: OperationsTokenFilterParams;
  initialStatus?: OperationStatus;
}

const OperationsTable: React.FC<Props> = ({
  filter,
  tokenFilter,
  initialStatus,
}) => {
  const [statusFilter, setStatusFilter] = useState(
    initialStatus ?? OperationStatus.ALL,
  );

  const executionStageByStatus: Record<
    OperationStatus,
    ExecutionStage_Value | undefined
  > = {
    [OperationStatus.ALL]: undefined,
    [OperationStatus.QUEUED]: ExecutionStage_Value.QUEUED,
    [OperationStatus.EXECUTING]: ExecutionStage_Value.EXECUTING,
    [OperationStatus.COMPLETED]: ExecutionStage_Value.COMPLETED,
  };
  const executionStage = executionStageByStatus[statusFilter];

  const queryClient = useQueryClient();

  const handleFilterChange = (value: OperationStatus) => {
    setStatusFilter(value);

    // Invalidate query to allow the query to refetch the operations
    queryClient.invalidateQueries({
      queryKey: ["operationsTable"],
    });
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["operationsTable", filter, tokenFilter, statusFilter],
    queryFn: buildQueueStateClient.listOperations.bind(window, {
      pageSize: PAGE_SIZE,
      filterInvocationId: filter
        ? {
            typeUrl: filter?.["@type"],
            value: RequestMetadata.encode(
              RequestMetadata.fromPartial(filter),
            ).finish(),
          }
        : undefined,
      filterStage: executionStage,
      filterTokenName: tokenFilter?.name,
      filterTokenInstanceNamePrefix: tokenFilter?.instanceNamePrefix,
      filterTokenBlockedOnly: tokenFilter?.blockedOnly,
    }),
    staleTime: Number.POSITIVE_INFINITY,
    refetchOnMount: "always",
  });
  if (isError) {
    return (
      <PortalAlert
        showIcon
        type="error"
        message="Error fetching operation"
        description={
          error.message ||
          "Unknown error occurred while fetching data from the server."
        }
      />
    );
  }

  return (
    <>
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}
      >
        <OperationFilterSelector
          value={statusFilter}
          onChange={handleFilterChange}
        />
      </div>
      <OperationsInvocationFilter filter={filter} />
      <OperationsTokenFilter tokenFilter={tokenFilter} />
      <Table
        loading={isLoading}
        dataSource={data?.operations}
        columns={getColumns()}
        pagination={{ pageSize: PAGE_SIZE }}
        size="small"
        rowClassName={() => themeStyles.compactTable}
        rowKey={(item) => item.name}
        locale={{
          emptyText: "No active operations found (that you have access to).",
        }}
      />
    </>
  );
};

export default OperationsTable;
