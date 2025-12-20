import React, { useMemo, useCallback } from "react";
import { Table, Spin } from "antd";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";

// Componente de tabela otimizada para grandes listas
const OptimizedTable = ({
  dataSource,
  columns,
  loading = false,
  rowHeight = 54,
  maxHeight = 400,
  ...tableProps
}) => {
  // Memoizar as colunas para evitar re-renders
  const memoizedColumns = useMemo(() => columns, [columns]);

  // Memoizar o dataSource
  const memoizedDataSource = useMemo(() => dataSource, [dataSource]);

  // Função para renderizar linha virtualizada
  const renderRow = useCallback(
    ({ index, style }) => {
      const record = memoizedDataSource[index];
      return (
        <div style={style} className="virtual-row">
          {memoizedColumns.map((column, colIndex) => (
            <div
              key={colIndex}
              className="virtual-cell"
              style={{
                width: column.width || "auto",
                padding: "8px 12px",
                borderBottom: "1px solid #f0f0f0",
                display: "flex",
                alignItems: "center",
                justifyContent: column.align || "left",
              }}
            >
              {column.render
                ? column.render(record[column.dataIndex], record, index)
                : record[column.dataIndex]}
            </div>
          ))}
        </div>
      );
    },
    [memoizedColumns, memoizedDataSource]
  );

  // Se a lista for pequena, usar tabela normal
  if (memoizedDataSource.length < 100) {
    return (
      <Table
        dataSource={memoizedDataSource}
        columns={memoizedColumns}
        loading={loading}
        pagination={false}
        scroll={{ y: maxHeight }}
        {...tableProps}
      />
    );
  }

  // Para listas grandes, usar virtualização
  return (
    <div style={{ height: maxHeight, width: "100%" }}>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* Header da tabela */}
          <div
            className="virtual-header"
            style={{
              display: "flex",
              borderBottom: "2px solid #f0f0f0",
              backgroundColor: "#fafafa",
              fontWeight: "bold",
            }}
          >
            {memoizedColumns.map((column, index) => (
              <div
                key={index}
                style={{
                  width: column.width || "auto",
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: column.align || "left",
                }}
              >
                {column.title}
              </div>
            ))}
          </div>

          {/* Lista virtualizada */}
          <AutoSizer>
            {({ height, width }) => (
              <List
                height={height - 50} // Subtrair altura do header
                itemCount={memoizedDataSource.length}
                itemSize={rowHeight}
                width={width}
              >
                {renderRow}
              </List>
            )}
          </AutoSizer>
        </>
      )}
    </div>
  );
};

// Componente de busca otimizada com debounce
const OptimizedSearch = ({
  onSearch,
  placeholder = "Buscar...",
  delay = 300,
}) => {
  const [searchValue, setSearchValue] = React.useState("");
  const debouncedSearch = React.useCallback(
    React.useMemo(() => {
      let timeoutId;
      return (value) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          onSearch(value);
        }, delay);
      };
    }, [onSearch, delay]),
    [onSearch, delay]
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setSearchValue(value);
    debouncedSearch(value);
  };

  return (
    <input
      type="text"
      value={searchValue}
      onChange={handleChange}
      placeholder={placeholder}
      style={{
        padding: "8px 12px",
        border: "1px solid #d9d9d9",
        borderRadius: "6px",
        width: "100%",
        marginBottom: "16px",
      }}
    />
  );
};

// Hook para otimizar filtros
export const useOptimizedFilter = (data, filterFn, dependencies = []) => {
  return React.useMemo(() => {
    if (!filterFn) return data;
    return data.filter(filterFn);
  }, [data, filterFn, ...dependencies]);
};

// Hook para otimizar ordenação
export const useOptimizedSort = (data, sortFn, dependencies = []) => {
  return React.useMemo(() => {
    if (!sortFn) return data;
    return [...data].sort(sortFn);
  }, [data, sortFn, ...dependencies]);
};

export default OptimizedTable;
export { OptimizedSearch };
