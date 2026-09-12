import { CodeFilled } from "@ant-design/icons";
import type React from "react";
import OperationsGrid from "@/components/OperationsGrid";
import PortalCard from "@/components/PortalCard";
import type { OperationsSearchParams } from "@/routes/operations.index";

export const OperationsPage: React.FC<OperationsSearchParams> = ({
  filter,
  tokenFilter,
  status,
}) => {
  return (
    <PortalCard
      icon={<CodeFilled />}
      titleBits={[<span key="title">Operations</span>]}
    >
      <OperationsGrid
        // Remount when a link changes the initial status so the stage
        // selector picks it up.
        key={status}
        filter={filter}
        tokenFilter={tokenFilter}
        initialStatus={status}
      />
    </PortalCard>
  );
};
