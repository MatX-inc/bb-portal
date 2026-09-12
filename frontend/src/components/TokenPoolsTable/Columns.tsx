import { Link } from "@tanstack/react-router";
import { type TableColumnsType, Typography } from "antd";
import type { ColumnType } from "antd/lib/table";
import type { TokenPoolState } from "@/lib/grpc-client/buildbarn/buildqueuestate/buildqueuestate";
import { OperationStatus } from "../OperationFilterSelector";

const instanceNamePrefixColumn: ColumnType<TokenPoolState> = {
  key: "instanceNamePrefix",
  title: "Instance name prefix",
  render: (_, record) => (
    <Typography.Text>{record.instanceNamePrefix}</Typography.Text>
  ),
};

const tokenColumn: ColumnType<TokenPoolState> = {
  key: "token",
  title: "Token",
  render: (_, record) => <Typography.Text code>{record.name}</Typography.Text>,
};

const capacityColumn: ColumnType<TokenPoolState> = {
  key: "capacity",
  title: "Capacity",
  render: (_, record) => <Typography.Text>{record.capacity}</Typography.Text>,
};

// Holders: executing operations that require the token.
const inUseColumn: ColumnType<TokenPoolState> = {
  key: "inUse",
  title: "In use",
  render: (_, record) => {
    const percentage =
      record.capacity === 0
        ? "0.00"
        : ((record.inUse / record.capacity) * 100).toFixed(2);
    return (
      <Link
        to="/operations"
        search={{
          tokenFilter: {
            instanceNamePrefix: record.instanceNamePrefix,
            name: record.name,
          },
          status: OperationStatus.EXECUTING,
        }}
      >
        {record.inUse} ({percentage}%)
      </Link>
    );
  },
};

const reservedColumn: ColumnType<TokenPoolState> = {
  key: "reserved",
  title: "Reserved",
  render: (_, record) => <Typography.Text>{record.reserved}</Typography.Text>,
};

// Waiters: queued operations parked in the pool's FIFO.
const blockedColumn: ColumnType<TokenPoolState> = {
  key: "blocked",
  title: "Blocked operations",
  render: (_, record) => (
    <Link
      to="/operations"
      search={{
        tokenFilter: {
          instanceNamePrefix: record.instanceNamePrefix,
          name: record.name,
          blockedOnly: true,
        },
        status: OperationStatus.QUEUED,
      }}
    >
      {record.blockedTasksCount}
    </Link>
  ),
};

const getColumns = (): TableColumnsType<TokenPoolState> => {
  return [
    instanceNamePrefixColumn,
    tokenColumn,
    capacityColumn,
    inUseColumn,
    reservedColumn,
    blockedColumn,
  ];
};

export default getColumns;
