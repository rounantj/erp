import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Card,
  Table,
  Container,
  Row,
  Col,
  Button,
  Form,
  Modal,
  Spinner,
  Badge,
  Alert,
} from "react-bootstrap";
import {
  Button as AntButton,
  Modal as AntModal,
  Form as AntForm,
  Input,
  Tag,
  Typography,
  Spin,
  Empty,
  FloatButton,
  ConfigProvider,
  notification,
  Popconfirm,
  List,
  Select,
  Tooltip,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BankOutlined,
  ReloadOutlined,
  TeamOutlined,
  MenuOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserAddOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  CrownOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { Redirect } from "react-router-dom";
import {
  getCompanies,
  createCompany,
  updateCompany,
  deleteCompany,
  getCompanyUsers,
  getCurrentUser,
  createUserForCompany,
  getPlans,
  getCompanySubscription,
  createTrialSubscription,
  createPaidSubscription,
  changeSubscriptionPlanAdmin,
  updatePlanTrialDays,
} from "../helpers/api-integrator";
import { UserContext } from "../context/UserContext";

const { Text } = Typography;

// Email do Super Admin - único usuário com acesso
const SUPER_ADMIN_EMAIL = "rounantj@hotmail.com";

// Estilos para mobile
const mobileStyles = {
  container: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    maxWidth: "100vw",
    overflow: "hidden",
    background: "linear-gradient(135deg, #2c3e50 0%, #3498db 100%)",
    display: "flex",
    flexDirection: "column",
    boxSizing: "border-box",
    zIndex: 100,
  },
  header: {
    background: "transparent",
    padding: "16px",
    flexShrink: 0,
  },
  headerTitle: {
    color: "#fff",
    fontSize: "20px",
    fontWeight: "700",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.9)",
    fontSize: "12px",
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  statCard: {
    flex: 1,
    background: "rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "12px",
    textAlign: "center",
    backdropFilter: "blur(10px)",
  },
  statValue: {
    color: "#fff",
    fontSize: "24px",
    fontWeight: "700",
    display: "block",
  },
  statLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: "11px",
  },
  content: {
    flex: 1,
    background: "#f8f9fa",
    borderTopLeftRadius: "24px",
    borderTopRightRadius: "24px",
    padding: "16px",
    paddingBottom: "20px",
    overflow: "auto",
    display: "flex",
    flexDirection: "column",
    maxWidth: "100vw",
    boxSizing: "border-box",
    minHeight: 0,
  },
  companyCard: {
    background: "#fff",
    borderRadius: "12px",
    padding: "12px",
    marginBottom: "8px",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
  },
  companyName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
  },
  companyInfo: {
    fontSize: "11px",
    color: "#666",
    marginTop: "2px",
  },
  companyActions: {
    display: "flex",
    gap: "6px",
    marginTop: "8px",
  },
};

function Empresas() {
  const { user } = useContext(UserContext);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [companyUsers, setCompanyUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    cnpj: "",
  });
  const [antForm] = AntForm.useForm();
  const [createUserForm] = AntForm.useForm();

  // Estados para criar usuário
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [createUserLoading, setCreateUserLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados para planos e subscriptions
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState({});
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showTrialConfigModal, setShowTrialConfigModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Verificar se é super admin
  const userEmail = user?.user?.email;
  const isSuperAdmin =
    userEmail && userEmail.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();

  const currentUser = getCurrentUser();

  // Detectar mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCompanies();
      if (result.success) {
        setCompanies(result.data || []);
        // Carregar subscriptions de cada empresa
        const subsMap = {};
        for (const company of result.data || []) {
          try {
            const subResult = await getCompanySubscription(company.id);
            if (subResult.success && subResult.data) {
              subsMap[company.id] = subResult.data;
            }
          } catch (e) {
            console.log(
              `Subscription não encontrada para empresa ${company.id}`
            );
          }
        }
        setSubscriptions(subsMap);
      } else {
        setError(result.message);
        if (isMobile) {
          notification.error({
            message: result.message || "Erro ao carregar empresas",
          });
        }
      }
    } catch (err) {
      setError("Erro ao carregar empresas");
      if (isMobile) {
        notification.error({ message: "Erro ao carregar empresas" });
      }
    }
    setLoading(false);
  }, [isMobile]);

  const loadPlans = useCallback(async () => {
    try {
      const result = await getPlans();
      if (result.success) {
        setPlans(result.data || []);
      }
    } catch (err) {
      console.error("Erro ao carregar planos:", err);
    }
  }, []);

  useEffect(() => {
    if (isSuperAdmin) {
      loadCompanies();
      loadPlans();
    }
  }, [loadCompanies, loadPlans, isSuperAdmin]);

  // Helpers para subscription
  const getSubscriptionStatusBadge = (subscription) => {
    if (!subscription) {
      return <Tag color="default">Sem plano</Tag>;
    }

    const statusConfig = {
      trial: { color: "blue", icon: <ClockCircleOutlined />, text: "Trial" },
      active: { color: "green", icon: <CheckCircleOutlined />, text: "Ativo" },
      past_due: {
        color: "orange",
        icon: <ExclamationCircleOutlined />,
        text: "Atrasado",
      },
      cancelled: {
        color: "red",
        icon: <CloseCircleOutlined />,
        text: "Cancelado",
      },
      readonly: {
        color: "default",
        icon: <EyeOutlined />,
        text: "Somente Leitura",
      },
    };

    const config = statusConfig[subscription.status] || statusConfig.readonly;

    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    );
  };

  const getPlanDisplayName = (subscription) => {
    if (!subscription || !subscription.plan) return "-";
    return subscription.plan.displayName || subscription.plan.name;
  };

  const getTrialDaysRemaining = (subscription) => {
    if (
      !subscription ||
      subscription.status !== "trial" ||
      !subscription.trialEndsAt
    ) {
      return null;
    }
    const now = new Date();
    const trialEnd = new Date(subscription.trialEndsAt);
    const diffTime = trialEnd - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Gerenciamento de planos
  const handleOpenPlanModal = (company) => {
    setSelectedCompany(company);
    setShowPlanModal(true);
  };

  const handleCreateTrial = async (company) => {
    setPlanLoading(true);
    try {
      const result = await createTrialSubscription(company.id);
      if (result.success) {
        notification.success({ message: "Trial iniciado com sucesso!" });
        loadCompanies();
      } else {
        notification.error({
          message: result.message || "Erro ao criar trial",
        });
      }
    } catch (err) {
      notification.error({ message: "Erro ao criar trial" });
    }
    setPlanLoading(false);
  };

  const handleChangePlan = async (values) => {
    if (!selectedCompany) return;
    setPlanLoading(true);

    const subscription = subscriptions[selectedCompany.id];
    const selectedPlanObj = plans.find((p) => p.id === values.planId);

    try {
      if (selectedPlanObj?.name === "empresarial") {
        notification.info({
          message: "Plano Empresarial",
          description: `Entre em contato para negociar: ${
            selectedPlanObj.contactPhone || "27996011204"
          }`,
          duration: 10,
        });
        setPlanLoading(false);
        return;
      }

      let result;
      if (subscription) {
        // Trocar plano existente
        result = await changeSubscriptionPlanAdmin(subscription.id, values.planId);
      } else {
        // Criar nova subscription
        if (selectedPlanObj?.name === "free_trial") {
          result = await createTrialSubscription(selectedCompany.id);
        } else {
          result = await createPaidSubscription({
            companyId: selectedCompany.id,
            planId: values.planId,
            customerEmail:
              selectedCompany.email || `empresa${selectedCompany.id}@erp.com`,
            customerName: selectedCompany.name,
            customerCpfCnpj: selectedCompany.cnpj || "00000000000",
            customerPhone: selectedCompany.phone,
          });
        }
      }

      if (result.success) {
        notification.success({ message: "Plano atualizado com sucesso!" });
        setShowPlanModal(false);
        loadCompanies();
      } else {
        notification.error({
          message: result.message || "Erro ao atualizar plano",
        });
      }
    } catch (err) {
      notification.error({ message: "Erro ao atualizar plano" });
    }
    setPlanLoading(false);
  };

  const handleOpenTrialConfig = () => {
    const freePlan = plans.find((p) => p.name === "free_trial");
    if (freePlan) {
      setSelectedPlan(freePlan);
      setShowTrialConfigModal(true);
    }
  };

  const handleUpdateTrialDays = async (values) => {
    if (!selectedPlan) return;
    setPlanLoading(true);

    try {
      const result = await updatePlanTrialDays(
        selectedPlan.id,
        values.trialDays
      );
      if (result.success) {
        notification.success({
          message: `Dias de trial atualizados para ${values.trialDays}`,
        });
        setShowTrialConfigModal(false);
        loadPlans();
      } else {
        notification.error({ message: result.message || "Erro ao atualizar" });
      }
    } catch (err) {
      notification.error({ message: "Erro ao atualizar dias de trial" });
    }
    setPlanLoading(false);
  };

  // Se não for super admin, redirecionar para dashboard
  if (!isSuperAdmin) {
    return <Redirect to="/admin/dashboard" />;
  }

  const handleOpenModal = (company = null) => {
    if (company) {
      setSelectedCompany(company);
      setFormData({
        name: company.name || "",
        address: company.address || "",
        phone: company.phone || "",
        cnpj: company.cnpj || "",
      });
      if (isMobile) {
        antForm.setFieldsValue({
          name: company.name || "",
          address: company.address || "",
          phone: company.phone || "",
          cnpj: company.cnpj || "",
        });
      }
    } else {
      setSelectedCompany(null);
      setFormData({ name: "", address: "", phone: "", cnpj: "" });
      if (isMobile) {
        antForm.resetFields();
      }
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setFormData({ name: "", address: "", phone: "", cnpj: "" });
    if (isMobile) {
      antForm.resetFields();
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (selectedCompany) {
        result = await updateCompany(selectedCompany.id, formData);
      } else {
        result = await createCompany(formData);
      }

      if (result.success) {
        const msg = selectedCompany ? "Empresa atualizada!" : "Empresa criada!";
        setSuccess(msg);
        if (isMobile) notification.success({ message: msg });
        handleCloseModal();
        loadCompanies();
      } else {
        setError(result.message);
        if (isMobile) notification.error({ message: result.message });
      }
    } catch (err) {
      setError("Erro ao salvar empresa");
      if (isMobile) notification.error({ message: "Erro ao salvar empresa" });
    }
    setLoading(false);
  };

  const handleMobileSubmit = async (values) => {
    setFormData(values);
    setLoading(true);

    try {
      let result;
      if (selectedCompany) {
        result = await updateCompany(selectedCompany.id, values);
      } else {
        result = await createCompany(values);
      }

      if (result.success) {
        notification.success({
          message: selectedCompany ? "Empresa atualizada!" : "Empresa criada!",
        });
        handleCloseModal();
        loadCompanies();
      } else {
        notification.error({ message: result.message || "Erro ao salvar" });
      }
    } catch (err) {
      notification.error({ message: "Erro ao salvar empresa" });
    }
    setLoading(false);
  };

  const handleDelete = async (companyToDelete = selectedCompany) => {
    if (!companyToDelete) return;

    setLoading(true);
    try {
      const result = await deleteCompany(companyToDelete.id);
      if (result.success) {
        const msg = "Empresa excluída!";
        setSuccess(msg);
        if (isMobile) notification.success({ message: msg });
        setShowDeleteModal(false);
        setSelectedCompany(null);
        loadCompanies();
      } else {
        setError(result.message);
        if (isMobile) notification.error({ message: result.message });
      }
    } catch (err) {
      setError("Erro ao excluir empresa");
      if (isMobile) notification.error({ message: "Erro ao excluir empresa" });
    }
    setLoading(false);
  };

  const handleViewUsers = async (company) => {
    setSelectedCompany(company);
    setLoadingUsers(true);
    setShowUsersModal(true);

    try {
      const result = await getCompanyUsers(company.id);
      if (result.success) {
        setCompanyUsers(result.data || []);
      } else {
        setError(result.message);
        if (isMobile) notification.error({ message: result.message });
      }
    } catch (err) {
      setError("Erro ao carregar usuários");
      if (isMobile)
        notification.error({ message: "Erro ao carregar usuários" });
    }
    setLoadingUsers(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Abrir modal para criar usuário
  const handleOpenCreateUserModal = (company) => {
    setSelectedCompany(company);
    setShowCreateUserModal(true);
    createUserForm.resetFields();
    setShowPassword(false);
  };

  // Criar usuário para empresa
  const handleCreateUser = async (values) => {
    if (!selectedCompany) return;

    setCreateUserLoading(true);
    try {
      const result = await createUserForCompany(selectedCompany.id, {
        email: values.email,
        password: values.password,
        name: values.name,
        role: values.role || "atendente",
      });

      if (result.success) {
        const msg = "Usuário criado com sucesso!";
        setSuccess(msg);
        if (isMobile) notification.success({ message: msg });
        setShowCreateUserModal(false);
        createUserForm.resetFields();
        // Atualizar lista de usuários se o modal de usuários estiver aberto
        if (showUsersModal) {
          handleViewUsers(selectedCompany);
        }
      } else {
        setError(result.message);
        if (isMobile) notification.error({ message: result.message });
      }
    } catch (err) {
      const msg = "Erro ao criar usuário";
      setError(msg);
      if (isMobile) notification.error({ message: msg });
    }
    setCreateUserLoading(false);
  };

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  // ========== RENDER MOBILE ==========
  if (isMobile) {
    return (
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#3498db",
            borderRadius: 12,
          },
        }}
      >
        <div style={mobileStyles.container}>
          {/* Header Mobile */}
          <div style={mobileStyles.header}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {/* Botão Menu */}
                <div
                  onClick={() => {
                    const isOpen =
                      document.documentElement.classList.contains("nav-open");
                    if (isOpen) {
                      document.documentElement.classList.remove("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                    } else {
                      document.documentElement.classList.add("nav-open");
                      const existingBodyClick =
                        document.getElementById("bodyClick");
                      if (existingBodyClick)
                        existingBodyClick.parentElement.removeChild(
                          existingBodyClick
                        );
                      var node = document.createElement("div");
                      node.id = "bodyClick";
                      node.style.cssText =
                        "position:fixed;top:0;left:0;right:250px;bottom:0;z-index:9999;";
                      node.onclick = function () {
                        this.parentElement.removeChild(this);
                        document.documentElement.classList.remove("nav-open");
                      };
                      document.body.appendChild(node);
                    }
                  }}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "10px",
                    padding: "8px 10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MenuOutlined style={{ color: "#fff", fontSize: "18px" }} />
                </div>
                <div>
                  <h1 style={mobileStyles.headerTitle}>
                    <BankOutlined style={{ marginRight: "8px" }} />
                    Empresas
                  </h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    Gerenciamento de empresas (Super Admin)
                  </Text>
                </div>
              </div>
              <div
                onClick={loadCompanies}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  padding: "8px 12px",
                  cursor: "pointer",
                }}
              >
                <ReloadOutlined spin={loading} style={{ color: "#fff" }} />
              </div>
            </div>

            {/* Stats */}
            <div style={mobileStyles.statsRow}>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>{companies.length}</span>
                <span style={mobileStyles.statLabel}>Total de Empresas</span>
              </div>
              <div style={mobileStyles.statCard}>
                <span style={mobileStyles.statValue}>
                  {companies.filter((c) => c.is_active).length}
                </span>
                <span style={mobileStyles.statLabel}>Ativas</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={mobileStyles.content}>
            {/* Companies List */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                minHeight: 0,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {loading ? (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <Spin size="large" />
                  <div style={{ marginTop: "12px" }}>
                    <Text type="secondary">Carregando empresas...</Text>
                  </div>
                </div>
              ) : companies.length === 0 ? (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="Nenhuma empresa cadastrada"
                  style={{ marginTop: "40px" }}
                />
              ) : (
                companies.map((company) => (
                  <div key={company.id} style={mobileStyles.companyCard}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={mobileStyles.companyName}>
                          {company.name}
                          {currentUser?.companyId === company.id && (
                            <Tag
                              color="blue"
                              style={{ marginLeft: "8px", fontSize: "10px" }}
                            >
                              Atual
                            </Tag>
                          )}
                        </div>
                        {company.cnpj && (
                          <div style={mobileStyles.companyInfo}>
                            CNPJ: {company.cnpj}
                          </div>
                        )}
                        {company.phone && (
                          <div style={mobileStyles.companyInfo}>
                            Tel: {company.phone}
                          </div>
                        )}
                        {company.address && (
                          <div style={mobileStyles.companyInfo}>
                            {company.address}
                          </div>
                        )}
                      </div>
                      <Tag
                        color={company.is_active ? "green" : "default"}
                        icon={
                          company.is_active ? (
                            <CheckCircleOutlined />
                          ) : (
                            <CloseCircleOutlined />
                          )
                        }
                      >
                        {company.is_active ? "Ativa" : "Inativa"}
                      </Tag>
                    </div>

                    <div style={mobileStyles.companyActions}>
                      <AntButton
                        type="default"
                        icon={<TeamOutlined />}
                        size="small"
                        onClick={() => handleViewUsers(company)}
                        style={{ flex: 1, borderRadius: "8px" }}
                      >
                        Usuários
                      </AntButton>
                      <AntButton
                        type="primary"
                        icon={<UserAddOutlined />}
                        size="small"
                        onClick={() => handleOpenCreateUserModal(company)}
                        style={{
                          flex: 1,
                          borderRadius: "8px",
                          background: "#52c41a",
                          borderColor: "#52c41a",
                        }}
                      >
                        + Usuário
                      </AntButton>
                    </div>
                    <div
                      style={{
                        ...mobileStyles.companyActions,
                        marginTop: "4px",
                      }}
                    >
                      <AntButton
                        type="primary"
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => handleOpenModal(company)}
                        style={{ flex: 1, borderRadius: "8px" }}
                      >
                        Editar
                      </AntButton>
                      <Popconfirm
                        title="Excluir empresa?"
                        description="Esta ação não pode ser desfeita"
                        onConfirm={() => handleDelete(company)}
                        okText="Sim"
                        cancelText="Não"
                        disabled={currentUser?.companyId === company.id}
                      >
                        <AntButton
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          disabled={currentUser?.companyId === company.id}
                          style={{ flex: 1, borderRadius: "8px" }}
                        >
                          Excluir
                        </AntButton>
                      </Popconfirm>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Results count */}
            {!loading && companies.length > 0 && (
              <div
                style={{ textAlign: "center", padding: "8px 0", flexShrink: 0 }}
              >
                <Text type="secondary" style={{ fontSize: "12px" }}>
                  {companies.length}{" "}
                  {companies.length === 1 ? "empresa" : "empresas"}
                </Text>
              </div>
            )}
          </div>

          {/* Floating Add Button */}
          <FloatButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{ right: 20, bottom: 20, width: 56, height: 56 }}
          />

          {/* Modal Criar/Editar */}
          <AntModal
            title={selectedCompany ? "Editar Empresa" : "Nova Empresa"}
            open={showModal}
            onCancel={handleCloseModal}
            footer={null}
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            styles={{ body: { padding: "16px" } }}
          >
            <AntForm
              form={antForm}
              layout="vertical"
              onFinish={handleMobileSubmit}
              initialValues={selectedCompany || {}}
            >
              <AntForm.Item
                name="name"
                label="Nome da Empresa"
                rules={[{ required: true, message: "Nome é obrigatório" }]}
              >
                <Input placeholder="Nome da empresa" size="large" />
              </AntForm.Item>

              <AntForm.Item name="cnpj" label="CNPJ">
                <Input placeholder="00.000.000/0000-00" size="large" />
              </AntForm.Item>

              <AntForm.Item name="phone" label="Telefone">
                <Input placeholder="(00) 00000-0000" size="large" />
              </AntForm.Item>

              <AntForm.Item name="address" label="Endereço">
                <Input placeholder="Endereço completo" size="large" />
              </AntForm.Item>

              <AntForm.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <AntButton
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  {selectedCompany ? "Atualizar" : "Criar Empresa"}
                </AntButton>
              </AntForm.Item>
            </AntForm>
          </AntModal>

          {/* Modal Usuários */}
          <AntModal
            title={`Usuários: ${selectedCompany?.name || ""}`}
            open={showUsersModal}
            onCancel={() => setShowUsersModal(false)}
            footer={
              <AntButton
                type="primary"
                icon={<UserAddOutlined />}
                onClick={() => {
                  setShowUsersModal(false);
                  handleOpenCreateUserModal(selectedCompany);
                }}
                block
                style={{ height: "44px", borderRadius: "8px" }}
              >
                Criar Novo Usuário
              </AntButton>
            }
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            styles={{
              body: { padding: "16px", maxHeight: "60vh", overflow: "auto" },
            }}
          >
            {loadingUsers ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : companyUsers.length === 0 ? (
              <Empty description="Nenhum usuário nesta empresa" />
            ) : (
              <List
                dataSource={companyUsers}
                renderItem={(userItem) => (
                  <List.Item>
                    <List.Item.Meta
                      title={userItem.name || userItem.username}
                      description={userItem.email}
                    />
                    <div style={{ display: "flex", gap: "8px" }}>
                      <Tag
                        color={userItem.role === "admin" ? "blue" : "default"}
                      >
                        {userItem.role || "visitante"}
                      </Tag>
                      <Tag color={userItem.is_active ? "green" : "red"}>
                        {userItem.is_active ? "Ativo" : "Inativo"}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            )}
          </AntModal>

          {/* Modal Criar Usuário */}
          <AntModal
            title={`Novo Usuário: ${selectedCompany?.name || ""}`}
            open={showCreateUserModal}
            onCancel={() => {
              setShowCreateUserModal(false);
              createUserForm.resetFields();
            }}
            footer={null}
            destroyOnClose
            width="100%"
            style={{ top: 0, maxWidth: "100vw", margin: 0, padding: 0 }}
            styles={{ body: { padding: "16px" } }}
          >
            <AntForm
              form={createUserForm}
              layout="vertical"
              onFinish={handleCreateUser}
            >
              <AntForm.Item
                name="name"
                label="Nome Completo"
                rules={[{ required: true, message: "Nome é obrigatório" }]}
              >
                <Input placeholder="Nome do usuário" size="large" />
              </AntForm.Item>

              <AntForm.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: "Email é obrigatório" },
                  { type: "email", message: "Email inválido" },
                ]}
              >
                <Input placeholder="email@exemplo.com" size="large" />
              </AntForm.Item>

              <AntForm.Item
                name="password"
                label="Senha"
                rules={[
                  { required: true, message: "Senha é obrigatória" },
                  { min: 6, message: "Mínimo 6 caracteres" },
                ]}
              >
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  size="large"
                  suffix={
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ cursor: "pointer" }}
                    >
                      {showPassword ? (
                        <EyeInvisibleOutlined />
                      ) : (
                        <EyeOutlined />
                      )}
                    </span>
                  }
                />
              </AntForm.Item>

              <AntForm.Item name="role" label="Função" initialValue="atendente">
                <Select
                  size="large"
                  placeholder="Selecione a função"
                  options={[
                    { value: "admin", label: "Admin" },
                    { value: "atendente", label: "Atendente" },
                    { value: "visitante", label: "Visitante" },
                  ]}
                />
              </AntForm.Item>

              <AntForm.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <AntButton
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={createUserLoading}
                  icon={<UserAddOutlined />}
                  style={{ height: "48px", borderRadius: "12px" }}
                >
                  Criar Usuário
                </AntButton>
              </AntForm.Item>
            </AntForm>
          </AntModal>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <Container fluid>
      <Row>
        <Col md="12">
          {success && (
            <Alert
              variant="success"
              dismissible
              onClose={() => setSuccess(null)}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Card className="strpied-tabled-with-hover">
            <Card.Header>
              <Card.Title as="h4">
                <BankOutlined style={{ marginRight: "8px" }} />
                Gerenciamento de Empresas
              </Card.Title>
              <p className="card-category">
                Cadastre e gerencie as empresas do sistema (Acesso exclusivo
                Super Admin)
              </p>
              <div
                style={{
                  float: "right",
                  marginTop: "-40px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <Tooltip title="Configurar dias de trial gratuito">
                  <AntButton
                    icon={<SettingOutlined />}
                    onClick={handleOpenTrialConfig}
                    size="large"
                  >
                    Config Trial
                  </AntButton>
                </Tooltip>
                <AntButton
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenModal()}
                  size="large"
                >
                  Nova Empresa
                </AntButton>
              </div>
            </Card.Header>
            <Card.Body className="table-full-width table-responsive px-0">
              {loading ? (
                <div className="text-center py-5">
                  <Spin size="large" tip="Carregando empresas..." />
                </div>
              ) : (
                <Table className="table-hover table-striped">
                  <thead>
                    <tr>
                      <th className="border-0">ID</th>
                      <th className="border-0">Nome</th>
                      <th className="border-0">CNPJ</th>
                      <th className="border-0">Plano</th>
                      <th className="border-0">Status Plano</th>
                      <th className="border-0">Status</th>
                      <th className="border-0">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center">
                          Nenhuma empresa cadastrada
                        </td>
                      </tr>
                    ) : (
                      companies.map((company) => {
                        const subscription = subscriptions[company.id];
                        const trialDays = getTrialDaysRemaining(subscription);
                        return (
                          <tr key={company.id}>
                            <td>{company.id}</td>
                            <td>
                              <strong>{company.name}</strong>
                              {currentUser?.companyId === company.id && (
                                <Badge bg="info" className="ms-2">
                                  Atual
                                </Badge>
                              )}
                            </td>
                            <td>{company.cnpj || "-"}</td>
                            <td>
                              <Space direction="vertical" size="small">
                                <Text strong>
                                  <CrownOutlined style={{ marginRight: 4 }} />
                                  {getPlanDisplayName(subscription)}
                                </Text>
                                {trialDays !== null && (
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: 11 }}
                                  >
                                    {trialDays} dias restantes
                                  </Text>
                                )}
                              </Space>
                            </td>
                            <td>{getSubscriptionStatusBadge(subscription)}</td>
                            <td>
                              <Badge
                                bg={company.is_active ? "success" : "secondary"}
                              >
                                {company.is_active ? "Ativa" : "Inativa"}
                              </Badge>
                            </td>
                            <td>
                              <Space size="small" wrap>
                                <Tooltip title="Gerenciar Plano">
                                  <AntButton
                                    type="primary"
                                    icon={<CrownOutlined />}
                                    onClick={() => handleOpenPlanModal(company)}
                                    style={{
                                      background: "#722ed1",
                                      borderColor: "#722ed1",
                                    }}
                                  />
                                </Tooltip>
                                {!subscription && (
                                  <Tooltip title="Iniciar Trial">
                                    <AntButton
                                      type="primary"
                                      icon={<ClockCircleOutlined />}
                                      onClick={() => handleCreateTrial(company)}
                                      loading={planLoading}
                                      style={{
                                        background: "#13c2c2",
                                        borderColor: "#13c2c2",
                                      }}
                                    />
                                  </Tooltip>
                                )}
                                <Tooltip title="Ver usuários">
                                  <AntButton
                                    type="primary"
                                    icon={<TeamOutlined />}
                                    onClick={() => handleViewUsers(company)}
                                    style={{
                                      background: "#17a2b8",
                                      borderColor: "#17a2b8",
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="Criar usuário">
                                  <AntButton
                                    type="primary"
                                    icon={<UserAddOutlined />}
                                    onClick={() =>
                                      handleOpenCreateUserModal(company)
                                    }
                                    style={{
                                      background: "#28a745",
                                      borderColor: "#28a745",
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="Editar empresa">
                                  <AntButton
                                    type="primary"
                                    icon={<EditOutlined />}
                                    onClick={() => handleOpenModal(company)}
                                    style={{
                                      background: "#ffc107",
                                      borderColor: "#ffc107",
                                      color: "#000",
                                    }}
                                  />
                                </Tooltip>
                                <Tooltip title="Excluir empresa">
                                  <AntButton
                                    type="primary"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => {
                                      setSelectedCompany(company);
                                      setShowDeleteModal(true);
                                    }}
                                    disabled={
                                      currentUser?.companyId === company.id
                                    }
                                  />
                                </Tooltip>
                              </Space>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </Table>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal de Criar/Editar Empresa */}
      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {selectedCompany ? "Editar Empresa" : "Nova Empresa"}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome da Empresa *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Digite o nome da empresa"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>CNPJ</Form.Label>
              <Form.Control
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Telefone</Form.Label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Endereço</Form.Label>
              <Form.Control
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Digite o endereço"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <Spinner animation="border" size="sm" />
              ) : selectedCompany ? (
                "Salvar"
              ) : (
                "Criar"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Tem certeza que deseja excluir a empresa{" "}
            <strong>{selectedCompany?.name}</strong>?
          </p>
          <p className="text-danger">Esta ação não pode ser desfeita.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            onClick={() => handleDelete()}
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : "Excluir"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Usuários da Empresa */}
      <Modal
        show={showUsersModal}
        onHide={() => setShowUsersModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Usuários da Empresa: {selectedCompany?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {loadingUsers ? (
            <div className="text-center py-4">
              <Spinner animation="border" role="status" />
            </div>
          ) : companyUsers.length === 0 ? (
            <p className="text-center text-muted">
              Nenhum usuário nesta empresa
            </p>
          ) : (
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Função</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {companyUsers.map((userItem) => (
                  <tr key={userItem.id}>
                    <td>{userItem.id}</td>
                    <td>{userItem.name || userItem.username}</td>
                    <td>{userItem.email}</td>
                    <td>
                      <Badge
                        bg={userItem.role === "admin" ? "primary" : "secondary"}
                      >
                        {userItem.role || "visitante"}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={userItem.is_active ? "success" : "danger"}>
                        {userItem.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="success"
            onClick={() => {
              setShowUsersModal(false);
              handleOpenCreateUserModal(selectedCompany);
            }}
          >
            <i className="nc-icon nc-simple-add"></i> Criar Novo Usuário
          </Button>
          <Button variant="secondary" onClick={() => setShowUsersModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal de Criar Usuário */}
      <Modal
        show={showCreateUserModal}
        onHide={() => setShowCreateUserModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Criar Usuário para: {selectedCompany?.name}</Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            handleCreateUser({
              name: formData.get("name"),
              email: formData.get("email"),
              password: formData.get("password"),
              role: formData.get("role"),
            });
          }}
        >
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Nome Completo *</Form.Label>
              <Form.Control
                type="text"
                name="name"
                placeholder="Nome do usuário"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Email *</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="email@exemplo.com"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Senha *</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Função</Form.Label>
              <Form.Select name="role" defaultValue="atendente">
                <option value="admin">Admin</option>
                <option value="atendente">Atendente</option>
                <option value="visitante">Visitante</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowCreateUserModal(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              type="submit"
              disabled={createUserLoading}
            >
              {createUserLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Criar Usuário"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Gerenciar Plano */}
      <Modal
        show={showPlanModal}
        onHide={() => setShowPlanModal(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <CrownOutlined style={{ color: "#722ed1", marginRight: 8 }} />
            Gerenciar Plano: {selectedCompany?.name}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const planId = Number(formData.get("planId"));
            if (planId) {
              handleChangePlan({ planId });
            }
          }}
        >
          <Modal.Body>
            <p className="text-muted mb-3">
              Selecione o plano para esta empresa. A cobrança será feita
              automaticamente via Asaas.
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Plano *</Form.Label>
              <Form.Select
                name="planId"
                size="lg"
                required
                defaultValue={subscriptions[selectedCompany?.id]?.planId || ""}
              >
                <option value="">Selecione um plano...</option>
                {plans.map((plan) => (
                  <option 
                    key={plan.id} 
                    value={plan.id}
                    style={plan.neverExpires ? { fontWeight: 'bold', color: '#722ed1' } : {}}
                  >
                    {plan.neverExpires ? "⭐ " : ""}
                    {plan.displayName} -{" "}
                    {plan.neverExpires 
                      ? "NUNCA EXPIRA"
                      : plan.price > 0
                        ? `R$ ${Number(plan.price).toFixed(2)}/mês`
                        : plan.name === "empresarial"
                          ? "Sob consulta"
                          : `Grátis (${plan.trialDays} dias)`}{" "}
                    - {plan.maxUsers === -1 ? "Usuários ilimitados" : `Até ${plan.maxUsers} usuários`}
                  </option>
                ))}
              </Form.Select>
              <Form.Text className="text-muted">
                ⭐ Planos com estrela são internos e não aparecem para clientes
              </Form.Text>
            </Form.Group>

            {subscriptions[selectedCompany?.id] && (
              <Alert variant="info" className="mt-3">
                <strong>Plano Atual:</strong>{" "}
                {getPlanDisplayName(subscriptions[selectedCompany?.id])}
                <br />
                <strong>Status:</strong>{" "}
                {subscriptions[selectedCompany?.id]?.status}
                {getTrialDaysRemaining(subscriptions[selectedCompany?.id]) !==
                  null && (
                  <>
                    <br />
                    <strong>Trial restante:</strong>{" "}
                    {getTrialDaysRemaining(subscriptions[selectedCompany?.id])}{" "}
                    dias
                  </>
                )}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={planLoading}
              style={{ background: "#722ed1", borderColor: "#722ed1" }}
            >
              {planLoading ? (
                <Spinner animation="border" size="sm" />
              ) : subscriptions[selectedCompany?.id] ? (
                "Alterar Plano"
              ) : (
                "Atribuir Plano"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal de Configurar Trial */}
      <Modal
        show={showTrialConfigModal}
        onHide={() => setShowTrialConfigModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <SettingOutlined style={{ marginRight: 8 }} />
            Configurar Dias de Trial
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const trialDays = Number(formData.get("trialDays"));
            if (trialDays > 0) {
              handleUpdateTrialDays({ trialDays });
            }
          }}
        >
          <Modal.Body>
            <p className="text-muted mb-3">
              Configure quantos dias de teste gratuito as novas empresas terão
              ao se cadastrar.
            </p>

            <Form.Group className="mb-3">
              <Form.Label>Dias de Trial *</Form.Label>
              <Form.Control
                type="number"
                name="trialDays"
                min={1}
                max={365}
                defaultValue={selectedPlan?.trialDays || 15}
                required
              />
              <Form.Text className="text-muted">Entre 1 e 365 dias</Form.Text>
            </Form.Group>

            <Alert variant="warning">
              <strong>Atenção:</strong> Esta alteração afetará apenas novas
              empresas. Empresas existentes manterão o período de trial
              original.
            </Alert>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => setShowTrialConfigModal(false)}
            >
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={planLoading}>
              {planLoading ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Salvar Configuração"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}

export default Empresas;
