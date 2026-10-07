import React, { useState, useEffect, useCallback, useContext } from "react";
import {
  Table,
  Container,
  Form,
  Alert,
} from "react-bootstrap";
import {
  Button as AntButton,
  Modal as AntModal,
  Form as AntForm,
  Input,
  Typography,
  Spin,
  Empty,
  FloatButton,
  ConfigProvider,
  notification,
  Popconfirm,
  Tooltip,
  Space,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ReloadOutlined,
  TeamOutlined,
  MenuOutlined,
  UserAddOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  CrownOutlined,
  SettingOutlined,
  ClockCircleOutlined,
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
import { useThemeColor } from "../helpers/theme";
import "./Empresas.css";

const { Text } = Typography;

function EmpTitle({ title, lede }) {
  return (
    <div>
      <div className="emp-dialog__title">{title}</div>
      {lede ? <p className="emp-modal__lede">{lede}</p> : null}
    </div>
  );
}

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
    background: "var(--qui-primary, #667eea)",
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
    color: "#fafaf9",
    fontSize: "18px",
    fontWeight: "600",
    letterSpacing: "-0.03em",
    margin: 0,
  },
  headerSubtitle: {
    color: "rgba(250,250,249,0.55)",
    fontSize: "12px",
  },
  statsRow: {
    display: "flex",
    gap: "12px",
    marginTop: "12px",
  },
  statCard: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    borderRadius: "10px",
    padding: "10px 12px",
    textAlign: "left",
    border: "1px solid rgba(255,255,255,0.08)",
  },
  statValue: {
    color: "#fafaf9",
    fontSize: "20px",
    fontWeight: "600",
    display: "block",
    letterSpacing: "-0.03em",
  },
  statLabel: {
    color: "rgba(250,250,249,0.5)",
    fontSize: "11px",
  },
  content: {
    flex: 1,
    background: "#fafaf9",
    borderTopLeftRadius: "16px",
    borderTopRightRadius: "16px",
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
    borderRadius: "10px",
    padding: "14px",
    marginBottom: "8px",
    border: "1px solid #e7e5e4",
    boxShadow: "none",
  },
  companyName: {
    fontSize: "14px",
    fontWeight: "600",
    marginBottom: "4px",
    color: "#1c1917",
  },
  companyInfo: {
    fontSize: "12px",
    color: "#78716c",
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
  const { primary, theme, pageStyle } = useThemeColor();
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
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [newUserRole, setNewUserRole] = useState("atendente");

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
      return <span className="emp-status emp-status--muted">Sem plano</span>;
    }

    const statusConfig = {
      trial: { cls: "emp-status--trial", text: "Trial" },
      active: { cls: "emp-status--ok", text: "Ativo" },
      past_due: { cls: "emp-status--warn", text: "Atrasado" },
      cancelled: { cls: "emp-status--danger", text: "Cancelado" },
      readonly: { cls: "emp-status--muted", text: "Somente leitura" },
    };

    const config = statusConfig[subscription.status] || statusConfig.readonly;

    return <span className={`emp-status ${config.cls}`}>{config.text}</span>;
  };

  const getPlanDisplayName = (subscription) => {
    if (!subscription || !subscription.plan) return "-";
    return subscription.plan.displayName || subscription.plan.name;
  };

  const formatPlanPrice = (plan) => {
    if (!plan) return "";
    if (plan.neverExpires) return "Nunca expira";
    if (plan.name === "empresarial") return "Sob consulta";
    if (Number(plan.price) > 0) {
      return `R$ ${Number(plan.price).toFixed(2).replace(".", ",")}/mês`;
    }
    return `Grátis · ${plan.trialDays} dias`;
  };

  const formatPlanUsers = (plan) => {
    if (!plan) return "";
    if (plan.maxUsers === -1) return "Usuários ilimitados";
    return plan.maxUsers === 1 ? "1 usuário" : `Até ${plan.maxUsers} usuários`;
  };

  const statusLabel = (status) =>
    ({
      trial: "Trial",
      active: "Ativo",
      past_due: "Atrasado",
      cancelled: "Cancelado",
      readonly: "Somente leitura",
    }[status] || status || "—");

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
    const sub = subscriptions[company.id];
    setSelectedPlanId(sub?.planId || sub?.plan?.id || null);
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
    const planId = values?.planId || selectedPlanId;
    if (!planId) return;
    setPlanLoading(true);

    const subscription = subscriptions[selectedCompany.id];
    const selectedPlanObj = plans.find((p) => p.id === planId);

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
        result = await changeSubscriptionPlanAdmin(subscription.id, planId);
      } else {
        // Criar nova subscription
        if (selectedPlanObj?.name === "free_trial") {
          result = await createTrialSubscription(selectedCompany.id);
        } else {
          result = await createPaidSubscription({
            companyId: selectedCompany.id,
            planId,
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
    setNewUserRole("atendente");
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
      <ConfigProvider theme={theme}>
        <div
          className="emp-page emp-page--mobile"
          style={{ ...mobileStyles.container, background: primary, ...pageStyle }}
        >
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
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: "8px",
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
                  <h1 style={mobileStyles.headerTitle}>Empresas</h1>
                  <Text style={mobileStyles.headerSubtitle}>
                    Gerenciamento de empresas (Super Admin)
                  </Text>
                </div>
              </div>
              <div
                onClick={loadCompanies}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  borderRadius: "8px",
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
                companies.map((company) => {
                  const subscription = subscriptions[company.id];
                  const trialDays = getTrialDaysRemaining(subscription);
                  return (
                    <div key={company.id} className="emp-m-card">
                      <div className="emp-m-card__top">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={mobileStyles.companyName}>
                            {company.name}
                            {currentUser?.companyId === company.id && (
                              <span className="emp-current">Atual</span>
                            )}
                          </div>
                          <div className="emp-m-card__meta">
                            {company.cnpj && <span>{company.cnpj}</span>}
                            {company.phone && <span>{company.phone}</span>}
                          </div>
                          <div className="emp-m-card__meta">
                            <span>
                              {getPlanDisplayName(subscription)}
                              {trialDays !== null ? ` · ${trialDays}d` : ""}
                            </span>
                            {getSubscriptionStatusBadge(subscription)}
                          </div>
                        </div>
                        <span
                          className={`emp-status ${
                            company.is_active
                              ? "emp-status--ok"
                              : "emp-status--muted"
                          }`}
                        >
                          {company.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </div>

                      <div className="emp-m-actions">
                        <AntButton
                          icon={<CrownOutlined />}
                          onClick={() => handleOpenPlanModal(company)}
                        >
                          Plano
                        </AntButton>
                        <AntButton
                          icon={<TeamOutlined />}
                          onClick={() => handleViewUsers(company)}
                        >
                          Equipe
                        </AntButton>
                        <AntButton
                          icon={<EditOutlined />}
                          onClick={() => handleOpenModal(company)}
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
                            disabled={currentUser?.companyId === company.id}
                          >
                            Excluir
                          </AntButton>
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })
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
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{
              right: 20,
              bottom: 20,
              width: 52,
              height: 52,
              background: primary,
              color: "#fafaf9",
            }}
          />

          {/* Modal Criar/Editar */}
          <AntModal
            title={selectedCompany ? "Editar empresa" : "Nova empresa"}
            open={showModal}
            onCancel={handleCloseModal}
            footer={null}
            destroyOnClose
            wrapClassName="emp-sheet"
            classNames={{ mask: "emp-dialog-mask" }}
            width="100%"
            centered={false}
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
                  style={{ height: "44px", borderRadius: "8px" }}
                >
                  {selectedCompany ? "Atualizar" : "Criar empresa"}
                </AntButton>
              </AntForm.Item>
            </AntForm>
          </AntModal>

          {/* Modal Usuários */}
          <AntModal
            title={`Equipe — ${selectedCompany?.name || ""}`}
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
                Criar usuário
              </AntButton>
            }
            destroyOnClose
            wrapClassName="emp-sheet"
            classNames={{ mask: "emp-dialog-mask" }}
            width="100%"
            centered={false}
          >
            {loadingUsers ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <Spin size="large" />
              </div>
            ) : companyUsers.length === 0 ? (
              <Empty description="Nenhum usuário nesta empresa" />
            ) : (
              companyUsers.map((userItem) => (
                <div key={userItem.id} className="emp-m-user">
                  <div className="emp-m-user__name">
                    {userItem.name || userItem.username}
                  </div>
                  <div className="emp-m-user__email">{userItem.email}</div>
                  <div className="emp-m-user__tags">
                    <span className="emp-status emp-status--muted">
                      {userItem.role || "visitante"}
                    </span>
                    <span
                      className={`emp-status ${
                        userItem.is_active
                          ? "emp-status--ok"
                          : "emp-status--danger"
                      }`}
                    >
                      {userItem.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </AntModal>

          {/* Modal Criar Usuário */}
          <AntModal
            title={`Novo usuário — ${selectedCompany?.name || ""}`}
            open={showCreateUserModal}
            onCancel={() => {
              setShowCreateUserModal(false);
              createUserForm.resetFields();
            }}
            footer={null}
            destroyOnClose
            wrapClassName="emp-sheet"
            classNames={{ mask: "emp-dialog-mask" }}
            width="100%"
            centered={false}
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
                <div className="emp-role-pills">
                  {[
                    { value: "admin", label: "Admin" },
                    { value: "atendente", label: "Atendente" },
                    { value: "visitante", label: "Visitante" },
                  ].map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      className={newUserRole === role.value ? "is-on" : ""}
                      onClick={() => {
                        setNewUserRole(role.value);
                        createUserForm.setFieldsValue({ role: role.value });
                      }}
                    >
                      {role.label}
                    </button>
                  ))}
                </div>
              </AntForm.Item>

              <AntForm.Item style={{ marginBottom: 0, marginTop: "16px" }}>
                <AntButton
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={createUserLoading}
                  icon={<UserAddOutlined />}
                  style={{ height: "44px", borderRadius: "8px" }}
                >
                  Criar usuário
                </AntButton>
              </AntForm.Item>
            </AntForm>
          </AntModal>

          <AntModal
            title="Plano"
            open={showPlanModal}
            onCancel={() => setShowPlanModal(false)}
            wrapClassName="emp-sheet"
            classNames={{ mask: "emp-dialog-mask" }}
            width="100%"
            centered={false}
            destroyOnClose
            okText={
              subscriptions[selectedCompany?.id] ? "Alterar plano" : "Atribuir plano"
            }
            cancelText="Cancelar"
            confirmLoading={planLoading}
            onOk={() => handleChangePlan({ planId: selectedPlanId })}
            okButtonProps={{ disabled: !selectedPlanId }}
          >
            {selectedCompany && (
              <p className="emp-modal__lede" style={{ marginBottom: 12 }}>
                {selectedCompany.name}
              </p>
            )}
            {subscriptions[selectedCompany?.id] && (
              <div className="emp-sub-strip">
                <span>
                  <small>Atual</small>
                  <b>{getPlanDisplayName(subscriptions[selectedCompany.id])}</b>
                </span>
                <span>
                  <small>Status</small>
                  <b>{statusLabel(subscriptions[selectedCompany.id]?.status)}</b>
                </span>
              </div>
            )}
            <div className="emp-plan-grid">
              {plans.map((plan) => {
                const isCurrent =
                  subscriptions[selectedCompany?.id]?.planId === plan.id;
                return (
                  <button
                    key={plan.id}
                    type="button"
                    className={`emp-plan-card${
                      selectedPlanId === plan.id ? " is-selected" : ""
                    }`}
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <span className="emp-plan-card__name">{plan.displayName}</span>
                    <span className="emp-plan-card__price">
                      {formatPlanPrice(plan)}
                    </span>
                    <span className="emp-plan-card__meta">
                      <span>{formatPlanUsers(plan)}</span>
                      {plan.isInternal || plan.neverExpires ? (
                        <span className="emp-plan-card__tag">Interno</span>
                      ) : null}
                      {isCurrent ? (
                        <span className="emp-plan-card__tag emp-plan-card__tag--now">
                          Plano atual
                        </span>
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </AntModal>
        </div>
      </ConfigProvider>
    );
  }

  // ========== RENDER DESKTOP ==========
  return (
    <ConfigProvider theme={theme}>
    <Container fluid className="emp-page" style={pageStyle}>
      <div className="emp-header">
        <div className="emp-header__copy">
          <h1>Empresas</h1>
          <p>Cadastro e gestão das empresas do sistema</p>
        </div>
        <div className="emp-header__actions">
          <Tooltip title="Configurar dias de trial gratuito">
            <AntButton icon={<SettingOutlined />} onClick={handleOpenTrialConfig}>
              Trial
            </AntButton>
          </Tooltip>
          <AntButton
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => handleOpenModal()}
            style={{ background: primary, borderColor: primary }}
          >
            Nova empresa
          </AntButton>
        </div>
      </div>

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

      <div className="emp-panel">
        {loading ? (
          <div className="text-center py-5">
            <Spin size="large" tip="Carregando empresas..." />
          </div>
        ) : (
          <Table className="table mb-0">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>CNPJ</th>
                <th>Plano</th>
                <th>Assinatura</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {companies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="emp-empty">
                    Nenhuma empresa cadastrada
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const subscription = subscriptions[company.id];
                  const trialDays = getTrialDaysRemaining(subscription);
                  return (
                    <tr key={company.id}>
                      <td className="emp-id">{company.id}</td>
                      <td>
                        <span className="emp-name">{company.name}</span>
                        {currentUser?.companyId === company.id && (
                          <span className="emp-current">Atual</span>
                        )}
                      </td>
                      <td>{company.cnpj || "—"}</td>
                      <td>
                        <div className="emp-plan">
                          <strong>{getPlanDisplayName(subscription)}</strong>
                          {trialDays !== null && (
                            <small>{trialDays} dias restantes</small>
                          )}
                        </div>
                      </td>
                      <td>{getSubscriptionStatusBadge(subscription)}</td>
                      <td>
                        <span
                          className={`emp-status ${
                            company.is_active
                              ? "emp-status--ok"
                              : "emp-status--muted"
                          }`}
                        >
                          {company.is_active ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td>
                        <Space size={6} wrap>
                          <Tooltip title="Gerenciar plano">
                            <AntButton
                              className="emp-icon-btn"
                              icon={<CrownOutlined />}
                              onClick={() => handleOpenPlanModal(company)}
                            />
                          </Tooltip>
                          {!subscription && (
                            <Tooltip title="Iniciar trial">
                              <AntButton
                                className="emp-icon-btn"
                                icon={<ClockCircleOutlined />}
                                onClick={() => handleCreateTrial(company)}
                                loading={planLoading}
                              />
                            </Tooltip>
                          )}
                          <Tooltip title="Ver usuários">
                            <AntButton
                              className="emp-icon-btn"
                              icon={<TeamOutlined />}
                              onClick={() => handleViewUsers(company)}
                            />
                          </Tooltip>
                          <Tooltip title="Criar usuário">
                            <AntButton
                              className="emp-icon-btn"
                              icon={<UserAddOutlined />}
                              onClick={() =>
                                handleOpenCreateUserModal(company)
                              }
                            />
                          </Tooltip>
                          <Tooltip title="Editar empresa">
                            <AntButton
                              className="emp-icon-btn"
                              icon={<EditOutlined />}
                              onClick={() => handleOpenModal(company)}
                            />
                          </Tooltip>
                          <Tooltip title="Excluir empresa">
                            <AntButton
                              className="emp-icon-btn"
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
      </div>

      <AntModal
        title={
          <EmpTitle
            title={selectedCompany ? "Editar empresa" : "Nova empresa"}
            lede={
              selectedCompany
                ? "Atualize os dados cadastrais."
                : "Cadastre uma empresa para acessar o sistema."
            }
          />
        }
        open={showModal}
        onCancel={handleCloseModal}
        footer={null}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={460}
        centered
        destroyOnClose
      >
        <Form onSubmit={handleSubmit}>
          <div className="emp-field">
            <label className="emp-label">Nome</label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nome da empresa"
              required
            />
          </div>
          <div className="emp-field-row">
            <div className="emp-field">
              <label className="emp-label">CNPJ</label>
              <Form.Control
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                placeholder="00.000.000/0000-00"
              />
            </div>
            <div className="emp-field">
              <label className="emp-label">Telefone</label>
              <Form.Control
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div className="emp-field">
            <label className="emp-label">Endereço</label>
            <Form.Control
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Rua, número, cidade"
            />
          </div>
          <div className="emp-dialog-foot">
            <AntButton onClick={handleCloseModal}>Cancelar</AntButton>
            <AntButton type="primary" htmlType="submit" loading={loading}>
              {selectedCompany ? "Salvar" : "Criar"}
            </AntButton>
          </div>
        </Form>
      </AntModal>

      <AntModal
        title={<EmpTitle title="Excluir empresa" lede={selectedCompany?.name} />}
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={400}
        centered
        footer={[
          <AntButton key="cancel" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </AntButton>,
          <AntButton
            key="ok"
            danger
            type="primary"
            loading={loading}
            onClick={() => handleDelete()}
          >
            Excluir
          </AntButton>,
        ]}
      >
        <p style={{ margin: "4px 0 8px", fontSize: 14, color: "#44403c", lineHeight: 1.5 }}>
          A empresa deixa de aparecer no sistema. Esta ação não pode ser
          desfeita.
        </p>
      </AntModal>

      <AntModal
        title={<EmpTitle title="Equipe" lede={selectedCompany?.name} />}
        open={showUsersModal}
        onCancel={() => setShowUsersModal(false)}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={520}
        centered
        footer={[
          <AntButton key="close" onClick={() => setShowUsersModal(false)}>
            Fechar
          </AntButton>,
          <AntButton
            key="add"
            type="primary"
            onClick={() => {
              setShowUsersModal(false);
              handleOpenCreateUserModal(selectedCompany);
            }}
          >
            Novo usuário
          </AntButton>,
        ]}
      >
        {loadingUsers ? (
          <div className="emp-empty-box">
            <Spin />
          </div>
        ) : companyUsers.length === 0 ? (
          <div className="emp-empty-box">Nenhum usuário nesta empresa</div>
        ) : (
          <div className="emp-user-list">
            {companyUsers.map((userItem) => (
              <div key={userItem.id} className="emp-user-row">
                <div>
                  <div className="emp-user-row__name">
                    {userItem.name || userItem.username}
                  </div>
                  <div className="emp-user-row__email">{userItem.email}</div>
                </div>
                <div className="emp-user-row__side">
                  <span className="emp-status emp-status--muted">
                    {userItem.role || "visitante"}
                  </span>
                  <span
                    className={`emp-status ${
                      userItem.is_active
                        ? "emp-status--ok"
                        : "emp-status--danger"
                    }`}
                  >
                    {userItem.is_active ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </AntModal>

      <AntModal
        title={<EmpTitle title="Novo usuário" lede={selectedCompany?.name} />}
        open={showCreateUserModal}
        onCancel={() => setShowCreateUserModal(false)}
        footer={null}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={460}
        centered
        destroyOnClose
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            handleCreateUser({
              name: data.get("name"),
              email: data.get("email"),
              password: data.get("password"),
              role: newUserRole,
            });
          }}
        >
          <div className="emp-field">
            <label className="emp-label">Nome</label>
            <Form.Control
              type="text"
              name="name"
              placeholder="Nome completo"
              required
            />
          </div>
          <div className="emp-field">
            <label className="emp-label">Email</label>
            <Form.Control
              type="email"
              name="email"
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="emp-field">
            <label className="emp-label">Senha</label>
            <div className="emp-pw">
              <Form.Control
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
              />
              <button
                type="button"
                className="emp-pw__toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
              </button>
            </div>
          </div>
          <div className="emp-field">
            <label className="emp-label">Função</label>
            <div className="emp-role-pills">
              {[
                { value: "admin", label: "Admin" },
                { value: "atendente", label: "Atendente" },
                { value: "visitante", label: "Visitante" },
              ].map((role) => (
                <button
                  key={role.value}
                  type="button"
                  className={newUserRole === role.value ? "is-on" : ""}
                  onClick={() => setNewUserRole(role.value)}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
          <div className="emp-dialog-foot">
            <AntButton onClick={() => setShowCreateUserModal(false)}>
              Cancelar
            </AntButton>
            <AntButton type="primary" htmlType="submit" loading={createUserLoading}>
              Criar usuário
            </AntButton>
          </div>
        </Form>
      </AntModal>

      <AntModal
        title={<EmpTitle title="Plano" lede={selectedCompany?.name} />}
        open={showPlanModal}
        onCancel={() => setShowPlanModal(false)}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={460}
        centered
        destroyOnClose
        okText={
          subscriptions[selectedCompany?.id] ? "Alterar plano" : "Atribuir plano"
        }
        cancelText="Cancelar"
        confirmLoading={planLoading}
        okButtonProps={{ disabled: !selectedPlanId }}
        onOk={() => handleChangePlan({ planId: selectedPlanId })}
      >
        {subscriptions[selectedCompany?.id] && (
          <div className="emp-sub-strip">
            <span>
              <small>Atual</small>
              <b>{getPlanDisplayName(subscriptions[selectedCompany.id])}</b>
            </span>
            <span>
              <small>Status</small>
              <b>{statusLabel(subscriptions[selectedCompany.id]?.status)}</b>
            </span>
            {getTrialDaysRemaining(subscriptions[selectedCompany.id]) !==
              null && (
              <span>
                <small>Trial</small>
                <b>
                  {getTrialDaysRemaining(subscriptions[selectedCompany.id])}{" "}
                  dias
                </b>
              </span>
            )}
          </div>
        )}
        <div className="emp-plan-grid">
          {plans.map((plan) => {
            const isCurrent =
              subscriptions[selectedCompany?.id]?.planId === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                className={`emp-plan-card${
                  selectedPlanId === plan.id ? " is-selected" : ""
                }`}
                onClick={() => setSelectedPlanId(plan.id)}
              >
                <span className="emp-plan-card__name">{plan.displayName}</span>
                <span className="emp-plan-card__price">
                  {formatPlanPrice(plan)}
                </span>
                <span className="emp-plan-card__meta">
                  <span>{formatPlanUsers(plan)}</span>
                  {plan.isInternal || plan.neverExpires ? (
                    <span className="emp-plan-card__tag">Interno</span>
                  ) : null}
                  {isCurrent ? (
                    <span className="emp-plan-card__tag emp-plan-card__tag--now">
                      Plano atual
                    </span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
        <p className="emp-hint">
          Planos internos não aparecem para o cliente. Cobrança via Asaas.
        </p>
      </AntModal>

      <AntModal
        title={
          <EmpTitle
            title="Dias de trial"
            lede="Período gratuito para novas empresas."
          />
        }
        open={showTrialConfigModal}
        onCancel={() => setShowTrialConfigModal(false)}
        footer={null}
        wrapClassName="emp-dialog"
        classNames={{ mask: "emp-dialog-mask" }}
        width={400}
        centered
        destroyOnClose
      >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.target);
            const trialDays = Number(data.get("trialDays"));
            if (trialDays > 0) {
              handleUpdateTrialDays({ trialDays });
            }
          }}
        >
          <div className="emp-field">
            <label className="emp-label">Duração</label>
            <Form.Control
              type="number"
              name="trialDays"
              min={1}
              max={365}
              defaultValue={selectedPlan?.trialDays || 15}
              required
            />
            <p className="emp-hint">
              De 1 a 365 dias. Só vale para cadastros novos.
            </p>
          </div>
          <div className="emp-dialog-foot">
            <AntButton onClick={() => setShowTrialConfigModal(false)}>
              Cancelar
            </AntButton>
            <AntButton type="primary" htmlType="submit" loading={planLoading}>
              Salvar
            </AntButton>
          </div>
        </Form>
      </AntModal>
    </Container>
    </ConfigProvider>
  );
}

export default Empresas;
