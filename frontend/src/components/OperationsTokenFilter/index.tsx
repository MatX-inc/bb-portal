import { useNavigate } from "@tanstack/react-router";
import { Button, Col, Divider, Row } from "antd";
import type { OperationsTokenFilterParams } from "@/routes/operations.index";
import styles from "../OperationsInvocationFilter/index.module.css";

interface Props {
  tokenFilter: OperationsTokenFilterParams;
}

const OperationsTokenFilter: React.FC<Props> = ({ tokenFilter }) => {
  const navigate = useNavigate();
  if (tokenFilter) {
    return (
      <Row>
        <Col span={4} className={styles.alignLeft}>
          <h3>Token pool:</h3>
        </Col>
        <Col span={16} className={styles.alignLeft}>
          <pre>{JSON.stringify(tokenFilter, null, 2)}</pre>
        </Col>
        <Col span={4} className={styles.alignRight}>
          <Button
            type="primary"
            onClick={() =>
              navigate({
                to: "/operations",
                search: (prev) => ({
                  ...prev,
                  tokenFilter: undefined,
                  status: undefined,
                }),
              })
            }
          >
            Clear Token Pool Filter
          </Button>
        </Col>
        <Divider />
      </Row>
    );
  }
};

export default OperationsTokenFilter;
