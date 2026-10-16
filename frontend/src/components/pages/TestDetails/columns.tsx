import { Link } from "@tanstack/react-router";
import type { TableColumnsType } from "antd";
import {
  type CacheLocation,
  CacheLocationTag,
} from "@/components/CacheLocationTag";
import type { TestRunRowFragment } from "@/graphql/__generated__/graphql";
import styles from "@/theme/theme.module.css";
import { readableDurationFromMilliseconds } from "@/utils/time";
import { TestStatusTag } from "../../TestStatusTag";

// A row is one test summary, flattened back onto the invocation target it
// came from, because the page paginates invocation targets.
export type TestDetailsRowType = NonNullable<
  TestRunRowFragment["testSummary"]
>[number] & {
  invocationTarget: Pick<TestRunRowFragment, "id" | "bazelInvocation">;
  cacheLocation: CacheLocation;
};

export const columns: TableColumnsType<TestDetailsRowType> = [
  {
    key: "status",
    title: "Status",
    render: (_, record) => <TestStatusTag status={record.overallStatus} />,
  },
  {
    key: "invocationID",
    title: "Invocation ID",
    render: (_, record) => (
      <Link
        to="/bazel-invocations/$invocationID"
        params={{
          invocationID: record.invocationTarget.bazelInvocation.invocationID,
        }}
      >
        {record.invocationTarget.bazelInvocation.invocationID}
      </Link>
    ),
  },
  {
    key: "cacheLocation",
    title: "Cache Location",
    render: (_, record) => (
      <CacheLocationTag cacheLocation={record.cacheLocation} />
    ),
  },
  {
    key: "duration",
    title: "Duration",
    render: (_, record) => (
      <span className={styles.numberFormat}>
        {readableDurationFromMilliseconds(record.totalRunDurationInMs, {
          smallestUnit: "ms",
        })}
      </span>
    ),
    align: "right",
  },
];
