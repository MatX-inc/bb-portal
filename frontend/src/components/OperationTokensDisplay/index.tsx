import { PauseCircleFilled } from "@ant-design/icons";
import { Flex, Tag } from "antd";
import type React from "react";
import type { OperationState } from "@/lib/grpc-client/buildbarn/buildqueuestate/buildqueuestate";
import themeStyles from "@/theme/theme.module.css";

interface Props {
  operation: OperationState;
}

// The tokens an operation holds while executing, and the pool it is parked
// on while queued, as reported by the scheduler.
const OperationTokensDisplay: React.FC<Props> = ({ operation }) => {
  return (
    <Flex gap="4px 0" wrap>
      {operation.tokenRequirements.map((requirement) => (
        <Tag
          color="purple"
          key={requirement.name}
          style={{ fontWeight: "bold" }}
        >
          {requirement.name}: {requirement.amount}
        </Tag>
      ))}
      {operation.blockedOnToken && (
        <Tag
          icon={<PauseCircleFilled />}
          color="orange"
          className={themeStyles.tag}
        >
          <span className={themeStyles.tagContent}>
            blocked on {operation.blockedOnToken}
          </span>
        </Tag>
      )}
    </Flex>
  );
};

export default OperationTokensDisplay;
