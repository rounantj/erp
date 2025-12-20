import React from "react";
import { Card, Statistic, Typography, Divider, Space } from "antd";
import { SyncOutlined } from "@ant-design/icons";

const { Text } = Typography;

const StatCard = ({
  title,
  value,
  icon,
  color,
  loading,
  precision = 0,
  prefix = "",
  suffix = "",
}) => {
  return (
    <Card
      className="stat-card"
      bordered={false}
      style={{
        height: "100%",
        transition: "all 0.3s ease",
        cursor: "pointer",
      }}
      hoverable
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <Statistic
        title={<Text strong>{title}</Text>}
        value={value}
        valueStyle={{ color }}
        suffix={suffix}
        precision={precision}
        prefix={React.cloneElement(icon, {
          style: { fontSize: 20, marginRight: 8 },
        })}
      />
      <div className="stat-footer">
        <Divider style={{ margin: "12px 0" }} />
        <Space>
          <SyncOutlined spin={loading} />
          <Text type="secondary">Atualizado agora</Text>
        </Space>
      </div>
    </Card>
  );
};

export default StatCard;
