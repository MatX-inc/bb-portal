import { useQuery } from "@tanstack/react-query";
import { Table } from "antd";
import type React from "react";
import { buildQueueStateClient } from "@/grpc/buildQueueStateClient";
import type { TokenPoolState } from "@/lib/grpc-client/buildbarn/buildqueuestate/buildqueuestate";
import themeStyles from "@/theme/theme.module.css";
import PortalAlert from "../PortalAlert";
import getColumns from "./Columns";

const TokenPoolsTable: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["listTokenPools"],
    queryFn: async (): Promise<TokenPoolState[]> => {
      const queues = await buildQueueStateClient.listPlatformQueues({});
      return queues.tokenPools;
    },
  });

  if (isError) {
    return (
      <PortalAlert
        showIcon
        type="error"
        message="Error fetching token pools"
        description={
          error.message ||
          "Unknown error occurred while fetching data from the server."
        }
      />
    );
  }

  return (
    <Table
      columns={getColumns()}
      loading={isLoading}
      bordered={true}
      style={{ width: "100%" }}
      dataSource={data}
      size="small"
      rowClassName={() => themeStyles.compactTable}
      pagination={false}
      rowKey={(item) =>
        `instanceNamePrefix:${item.instanceNamePrefix}-token:${item.name}`
      }
      locale={{
        emptyText: "No token pools configured on the scheduler.",
      }}
    />
  );
};

export default TokenPoolsTable;
