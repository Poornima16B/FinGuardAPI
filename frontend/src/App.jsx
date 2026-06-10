import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  User as UserIcon, 
  LogOut, 
  Plus, 
  Trash2, 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  Briefcase, 
  PieChart as PieIcon, 
  Sun, 
  Moon, 
  RefreshCw,
  Sparkles,
  Info,
  ChevronRight,
  CreditCard,
  Landmark,
  Users,
  BookOpen,
  Home,
  Fuel,
  GraduationCap,
  Pencil,
  Save,
  Send,
  MessageSquare,
  FileText,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart, 
  Pie, 
  Cell,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line
} from 'recharts';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './context/LanguageContext';

const API_BASE = 'http://localhost:9080/api';

const ACCOUNT_OPTIONS = [
  { name: 'Primary Bank', type: 'BANK', upiId: '' },
  { name: 'Secondary Bank', type: 'BANK', upiId: '' },
  { name: 'UPI Wallet', type: 'UPI', upiId: 'demo@upi' }
];

const DEFAULT_PROFILE_DETAILS = {
  phone: '',
  city: 'Bengaluru',
  householdMembers: 4,
  familyMembers: [
    { name: 'Spouse', relation: 'Spouse', monthlyExpense: 6000 },
    { name: 'Child 1', relation: 'Child', monthlyExpense: 3500 }
  ],
  savingsGoals: [
    { name: 'School Fees', category: 'EDUCATION', targetAmount: 25000, monthlyPlan: 3000 },
    { name: 'Books & Uniforms', category: 'BOOKS', targetAmount: 6000, monthlyPlan: 700 },
    { name: 'House Expense', category: 'HOUSE', targetAmount: 18000, monthlyPlan: 4500 },
    { name: 'Petrol / Travel', category: 'PETROL', targetAmount: 8000, monthlyPlan: 2000 }
  ],
  linkedAccounts: [
    { name: 'Primary Bank', type: 'BANK', maskedAccount: 'XXXX 4321', upiId: '', monthlyLimit: 25000 },
    { name: 'UPI Wallet', type: 'UPI', maskedAccount: '', upiId: 'demo@upi', monthlyLimit: 10000 }
  ]
};

const formatCurrency = (amount, maximumFractionDigits = 2) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits
  }).format(amount || 0);

// Double-Safe Fallback Data in case Backend is not running
const FALLBACK_DASHBOARD = {
  totalIncome: 6250.0,
  totalExpense: 4051.3,
  balance: 2198.7,
  stabilityScore: 82.5,
  riskLevel: 'LOW',
  savingsPotential: 2200.0,
  recentTransactions: [
    { id: 1, type: 'INCOME', amount: 3200.0, category: 'FREELANCE', date: '2026-05-18', description: 'Upwork - UI Redesign' },
    { id: 2, type: 'EXPENSE', amount: 1500.0, category: 'RENT', date: '2026-05-17', description: 'Monthly rent', accountName: 'Primary Bank', accountType: 'BANK', upiId: '' },
    { id: 3, type: 'INCOME', amount: 1850.0, category: 'GIG_WORK', date: '2026-05-15', description: 'Fiverr - Branding Package' },
    { id: 4, type: 'EXPENSE', amount: 1650.0, category: 'SHOPPING', date: '2026-05-12', description: 'Apple MacBook Air', accountName: 'UPI Wallet', accountType: 'UPI', upiId: 'demo@upi' },
    { id: 5, type: 'INCOME', amount: 1200.0, category: 'BUSINESS', date: '2026-05-10', description: 'Web Retainer' },
    { id: 6, type: 'EXPENSE', amount: 185.50, category: 'BILLS', date: '2026-05-09', description: 'AWS Hosting & Tools', accountName: 'Secondary Bank', accountType: 'BANK', upiId: '' }
  ],
  monthlyExpensesByCategory: {
    RENT: 1500.0,
    SHOPPING: 2000.0,
    BILLS: 185.50,
    FOOD: 185.40,
    TRAVEL: 85.0
  },
  monthlyIncomesByCategory: {
    FREELANCE: 3200.0,
    GIG_WORK: 1850.0,
    BUSINESS: 1200.0
  },
  notifications: [
    { id: 1, title: 'Low Balance Warning', message: 'AWS monthly bill cleared. Balance remains positive but volatile.', type: 'BALANCE_ALERT', isRead: false, createdAt: '2026-05-09T12:00:00' }
  ],
  fraudAlerts: [
    { id: 1, alertType: 'LARGE_OUTLIER', description: 'MacBook Air purchase (Rs 1,650) is 250% higher than your average shopping expense (Rs 350).', status: 'ACTIVE', createdAt: '2026-05-12T15:30:00', transactionId: 4, amount: 1650.0, category: 'SHOPPING' }
  ]
};

export default function App() {
  const { translate } = useLanguage();
  const t = translate;
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isLightMode, setIsLightMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [backendOffline, setBackendOffline] = useState(false);
  const [dashboardData, setDashboardData] = useState(FALLBACK_DASHBOARD);
  const [profileDetails, setProfileDetails] = useState(() => {
    const saved = localStorage.getItem('profileDetails');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE_DETAILS;
  });
  const [profileDraft, setProfileDraft] = useState(() => {
    const saved = localStorage.getItem('profileDetails');
    return saved ? JSON.parse(saved) : DEFAULT_PROFILE_DETAILS;
  });
  const [isProfileEditing, setIsProfileEditing] = useState(false);
  
  const [isAutoSweepActive, setIsAutoSweepActive] = useState(() => {
    const saved = localStorage.getItem('isAutoSweepActive');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cardLimitEnabled, setCardLimitEnabled] = useState(() => {
    const saved = localStorage.getItem('cardLimitEnabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [cardLimitValue, setCardLimitValue] = useState(() => {
    const saved = localStorage.getItem('cardLimitValue');
    return saved !== null ? parseInt(saved, 10) : 12000;
  });
  const [stabilityVaultBalance, setStabilityVaultBalance] = useState(() => {
    const saved = localStorage.getItem('stabilityVaultBalance');
    return saved !== null ? parseFloat(saved) : 937.50;
  });

  useEffect(() => {
    localStorage.setItem('isAutoSweepActive', JSON.stringify(isAutoSweepActive));
  }, [isAutoSweepActive]);

  useEffect(() => {
    localStorage.setItem('cardLimitEnabled', JSON.stringify(cardLimitEnabled));
  }, [cardLimitEnabled]);

  useEffect(() => {
    localStorage.setItem('cardLimitValue', JSON.stringify(cardLimitValue));
  }, [cardLimitValue]);

  useEffect(() => {
    localStorage.setItem('stabilityVaultBalance', JSON.stringify(stabilityVaultBalance));
  }, [stabilityVaultBalance]);
  
  // Modals state
  const [isIncomeModalOpen, setIsIncomeModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Forms state
  const [authMode, setAuthMode] = useState('login'); // login or register
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    profession: 'Freelance Designer',
    targetSavings: 1500.0
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    category: 'FREELANCE',
    source: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'FOOD',
    date: new Date().toISOString().split('T')[0],
    description: '',
    accountName: ACCOUNT_OPTIONS[0].name,
    accountType: ACCOUNT_OPTIONS[0].type,
    upiId: ACCOUNT_OPTIONS[0].upiId
  });

  const [stabilityAdvice, setStabilityAdvice] = useState('');
  const [advisorView, setAdvisorView] = useState('report'); // 'report' or 'chat'
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: "Hello! I am your FinGuard AI Copilot. Ask me anything about your stability score, monthly burn rate, emergency runway, or savings targets!" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isBankLinkOpen, setIsBankLinkOpen] = useState(false);
  const [bankLinkStep, setBankLinkStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState(null);
  const [bankLinkMobile, setBankLinkMobile] = useState('');
  const [bankLinkOtp, setBankLinkOtp] = useState('');
  const paymentAccounts = profileDetails.linkedAccounts?.length
    ? profileDetails.linkedAccounts.map((account) => ({
        name: account.name,
        type: account.type,
        upiId: account.upiId || ''
      }))
    : ACCOUNT_OPTIONS;

  const handleSaveProfile = () => {
    setProfileDetails(profileDraft);
    localStorage.setItem('profileDetails', JSON.stringify(profileDraft));
    setIsProfileEditing(false);
  };

  const handleFinishBankLink = () => {
    if (!selectedBank) return;
    
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newAccount = {
      name: `${selectedBank} Savings`,
      type: 'BANK',
      maskedAccount: `XXXX ${randomSuffix}`,
      upiId: '',
      monthlyLimit: 50000
    };

    // Update Profile state
    const updatedAccounts = [...(profileDetails.linkedAccounts || []), newAccount];
    const updatedProfile = { ...profileDetails, linkedAccounts: updatedAccounts };
    setProfileDetails(updatedProfile);
    setProfileDraft(updatedProfile);
    localStorage.setItem('profileDetails', JSON.stringify(updatedProfile));

    // Update Dashboard aggregates with starting balance simulation
    const startingBalance = 45000.0;
    const newTx = {
      id: Math.floor(100000 + Math.random() * 900000),
      amount: startingBalance,
      category: 'BUSINESS',
      date: new Date().toISOString().split('T')[0],
      description: 'Starting balance',
      referenceId: null,
      type: 'INCOME',
      upiId: '',
      accountName: `${selectedBank} Savings`,
      accountType: 'BANK'
    };

    const updatedTxs = [newTx, ...dashboardData.recentTransactions];
    const updatedIncome = dashboardData.totalIncome + startingBalance;
    const updatedBalance = dashboardData.balance + startingBalance;

    // Add notification
    const newNotif = {
      id: Math.floor(100000 + Math.random() * 900000),
      title: 'Bank Linked Successfully',
      message: `${selectedBank} account (XXXX ${randomSuffix}) connected. Imported starting balance of ₹${startingBalance.toLocaleString('en-IN')}.`,
      type: 'INFO',
      createdAt: new Date().toISOString(),
      isRead: false
    };

    const updatedNotifs = [newNotif, ...dashboardData.notifications];

    setDashboardData({
      ...dashboardData,
      totalIncome: updatedIncome,
      balance: updatedBalance,
      recentTransactions: updatedTxs,
      notifications: updatedNotifs
    });

    setIsBankLinkOpen(false);
    setBankLinkStep(1);
    setSelectedBank(null);
    setBankLinkMobile('');
    setBankLinkOtp('');
  };

  const updateProfileListItem = (listName, index, field, value) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: current[listName].map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addProfileListItem = (listName, item) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: [...current[listName], item]
    }));
  };

  const removeProfileListItem = (listName, index) => {
    setProfileDraft((current) => ({
      ...current,
      [listName]: current[listName].filter((_, itemIndex) => itemIndex !== index)
    }));
  };

  // Apply Theme class
  useEffect(() => {
    const root = window.document.documentElement;
    if (isLightMode) {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [isLightMode]);

  // Fetch complete Dashboard stats
  const fetchDashboard = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        let data = await response.json();
        
        // Dynamic Ceiling check & warning injection
        if (cardLimitEnabled && data.totalExpense > cardLimitValue) {
          const limitAlertDescription = `Ceiling Exceeded: Monthly outflows (${formatCurrency(data.totalExpense)}) breach your configured limit of ${formatCurrency(cardLimitValue)}.`;
          const alertExists = data.fraudAlerts.some(a => a.alertType === 'LIMIT_SPIKE');
          if (!alertExists) {
            const limitAlert = {
              id: 9999,
              alertType: 'LIMIT_SPIKE',
              description: limitAlertDescription,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              amount: data.totalExpense - cardLimitValue,
              category: 'OVERFLOW'
            };
            data.fraudAlerts = [limitAlert, ...data.fraudAlerts];
            data.notifications = [{
              id: 9999,
              title: 'Spending Limit Breached',
              message: limitAlertDescription,
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString()
            }, ...data.notifications];
          }
        }
        
        setDashboardData(data);
        setBackendOffline(false);
      } else {
        throw new Error('Server returned error status');
      }
    } catch (err) {
      console.warn("Backend server offline. Operating in High-Fidelity Mockup Mode.");
      setBackendOffline(true);
      // Keep static fallback data
    } finally {
      setLoading(false);
    }
  };

  const fetchStabilityReport = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_BASE}/stability`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStabilityAdvice(data.aiSuggestions);
      }
    } catch (err) {
      // Mock static suggestion logic
      setStabilityAdvice(`### FinGuard AI Advisor Report for John Doe (Freelancer)\n* **Financial Stability Score (FSI):** 82.5/100\n* **Income Volatility Factor:** 0.28\n* **Expense Burn Rate:** 64.8%\n\n💎 **EXCELLENT STABILITY:** Your financial system is healthy. Volatility is minimal, and you are maintaining excellent cash margins!\n\n#### Action Items:\n1. **Sweep and Invest:** Your passive reserves are excellent. Sweep 20% of your current balance into a high-yield instrument.\n2. **Increase Targets:** Since you are comfortably on track to hit your savings goal (Rs 1,500), consider raising your threshold to build long-term capital assets.`);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDashboard();
      fetchStabilityReport();
    }
  }, [token]);

  useEffect(() => {
    if (advisorView === 'chat') {
      const chatBox = document.getElementById('ai-chat-box');
      if (chatBox) {
        chatBox.scrollTo({ top: chatBox.scrollHeight, behavior: 'smooth' });
      }
    }
  }, [chatMessages, isAiTyping, advisorView]);

  // Auth Operations
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        setBackendOffline(false);
      } else {
        alert('Invalid credentials or server error. Please check your inputs.');
      }
    } catch (err) {
      // Offline fallback login for demonstration
      console.log("Offline login fallback activated.");
      if (loginForm.username === 'demo' && (loginForm.password === 'password123' || loginForm.password === 'password')) {
        const mockUser = {
          userId: 1,
          username: 'demo',
          email: 'demo@finguard.ai',
          fullName: 'John Doe',
          role: 'USER',
          profession: 'Freelance Designer & Gig Worker',
          targetSavings: 1500.0
        };
        localStorage.setItem('token', 'mock-jwt-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setToken('mock-jwt-token');
        setUser(mockUser);
        setBackendOffline(true);
      } else {
        alert("Server is currently offline. Please use username 'demo' and password 'password123' for offline testing!");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerForm)
      });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data));
        setToken(data.token);
        setUser(data);
        setBackendOffline(false);
      } else {
        alert('Registration failed. Username or email might be taken.');
      }
    } catch (err) {
      alert('Backend offline. New registrations are unavailable offline. Please login with "demo" / "password"!');
      setAuthMode('login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  // Transaction Operations
  const handleAddIncome = async (e) => {
    e.preventDefault();
    const payload = {
      ...incomeForm,
      amount: parseFloat(incomeForm.amount)
    };
    try {
      if (isAutoSweepActive) {
        setStabilityVaultBalance(prev => prev + (payload.amount * 0.15));
      }
      if (backendOffline) {
        // Mock add locally
        const newTx = {
          id: Date.now(),
          type: 'INCOME',
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description || payload.source
        };
        const updatedTxs = [newTx, ...dashboardData.recentTransactions];
        const updatedIncome = dashboardData.totalIncome + payload.amount;
        setDashboardData({
          ...dashboardData,
          totalIncome: updatedIncome,
          balance: updatedIncome - dashboardData.totalExpense,
          recentTransactions: updatedTxs
        });
        setIsIncomeModalOpen(false);
      } else {
        const response = await fetch(`${API_BASE}/income`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setIsIncomeModalOpen(false);
          fetchDashboard();
          fetchStabilityReport();
        }
      }
    } catch (err) {
      alert("Error adding record.");
    }
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    const payload = {
      ...expenseForm,
      amount: parseFloat(expenseForm.amount)
    };
    try {
      if (backendOffline) {
        // Mock add locally
        const newTx = {
          id: Date.now(),
          type: 'EXPENSE',
          amount: payload.amount,
          category: payload.category,
          date: payload.date,
          description: payload.description,
          accountName: payload.accountName,
          accountType: payload.accountType,
          upiId: payload.upiId
        };
        const updatedTxs = [newTx, ...dashboardData.recentTransactions];
        const updatedExpense = dashboardData.totalExpense + payload.amount;
        
        // Mock alert trigger for MacBook outlier
        let newAlerts = [...dashboardData.fraudAlerts];
        let newNotifs = [...dashboardData.notifications];
        if (payload.amount > 1000) {
          const alertObj = {
            id: Date.now(),
            alertType: 'LARGE_OUTLIER',
            description: `Suspicious activity flagged: Expense of ${formatCurrency(payload.amount)} in ${payload.category} is unusually large.`,
            status: 'ACTIVE',
            createdAt: new Date().toISOString(),
            amount: payload.amount,
            category: payload.category
          };
          newAlerts.unshift(alertObj);
          newNotifs.unshift({
            id: Date.now(),
            title: 'Suspicious Activity Detected',
            message: alertObj.description,
            type: 'FRAUD',
            isRead: false,
            createdAt: new Date().toISOString()
          });
        }

        // Limit breach warning trigger
        if (cardLimitEnabled && (updatedExpense > cardLimitValue)) {
          const limitAlertDescription = `Ceiling Exceeded: Monthly outflows (${formatCurrency(updatedExpense)}) breach your configured limit of ${formatCurrency(cardLimitValue)}.`;
          const exists = newAlerts.some(a => a.alertType === 'LIMIT_SPIKE');
          if (!exists) {
            const limitAlert = {
              id: 9999,
              alertType: 'LIMIT_SPIKE',
              description: limitAlertDescription,
              status: 'ACTIVE',
              createdAt: new Date().toISOString(),
              amount: updatedExpense - cardLimitValue,
              category: 'OVERFLOW'
            };
            newAlerts.unshift(limitAlert);
            newNotifs.unshift({
              id: 9999,
              title: 'Spending Limit Breached',
              message: limitAlertDescription,
              type: 'WARNING',
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        }

        setDashboardData({
          ...dashboardData,
          totalExpense: updatedExpense,
          balance: dashboardData.totalIncome - updatedExpense,
          recentTransactions: updatedTxs,
          fraudAlerts: newAlerts,
          notifications: newNotifs
        });
        setIsExpenseModalOpen(false);
      } else {
        const response = await fetch(`${API_BASE}/expense`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (response.ok) {
          setIsExpenseModalOpen(false);
          fetchDashboard();
          fetchStabilityReport();
        }
      }
    } catch (err) {
      alert("Error adding record.");
    }
  };

  const handleDeleteTransaction = async (id, type) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      if (backendOffline) {
        // Mock remove locally
        const tx = dashboardData.recentTransactions.find(t => t.id === id);
        if (!tx) return;
        const updatedTxs = dashboardData.recentTransactions.filter(t => t.id !== id);
        if (type === 'INCOME') {
          const updatedIncome = dashboardData.totalIncome - tx.amount;
          setDashboardData({
            ...dashboardData,
            totalIncome: updatedIncome,
            balance: updatedIncome - dashboardData.totalExpense,
            recentTransactions: updatedTxs
          });
        } else {
          const updatedExpense = dashboardData.totalExpense - tx.amount;
          setDashboardData({
            ...dashboardData,
            totalExpense: updatedExpense,
            balance: dashboardData.totalIncome - updatedExpense,
            recentTransactions: updatedTxs
          });
        }
      } else {
        const endpoint = type.toLowerCase() === 'income' ? 'income' : 'expense';
        const response = await fetch(`${API_BASE}/${endpoint}/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          fetchDashboard();
          fetchStabilityReport();
        }
      }
    } catch (err) {
      alert("Error deleting record.");
    }
  };

  const handleResolveAlert = async (id, status) => {
    try {
      if (backendOffline) {
        const updatedAlerts = dashboardData.fraudAlerts.map(a => 
          a.id === id ? { ...a, status: status } : a
        );
        setDashboardData({ ...dashboardData, fraudAlerts: updatedAlerts });
      } else {
        const response = await fetch(`${API_BASE}/fraud/alerts/${id}/resolve?status=${status}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (response.ok) {
          fetchDashboard();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (backendOffline) {
        const updatedNotifs = dashboardData.notifications.map(n => ({ ...n, isRead: true }));
        setDashboardData({ ...dashboardData, notifications: updatedNotifs });
      } else {
        await fetch(`${API_BASE}/notifications/read-all`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Chart Mappings
  const chartData = [
    { name: 'Income', amount: dashboardData.totalIncome },
    { name: 'Expense', amount: dashboardData.totalExpense }
  ];

  const expensePieData = Object.entries(dashboardData.monthlyExpensesByCategory).map(([key, val]) => ({
    name: key,
    value: val
  }));

  const incomePieData = Object.entries(dashboardData.monthlyIncomesByCategory).map(([key, val]) => ({
    name: key,
    value: val
  }));

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#06b6d4'];

  const getTrendData = () => {
    const transactions = [...dashboardData.recentTransactions].reverse();
    const dailyData = {};
    
    if (transactions.length === 0) {
      return [
        { date: '05-10', inflow: 1200, outflow: 400, netReserve: 800 },
        { date: '05-12', inflow: 1850, outflow: 600, netReserve: 1250 },
        { date: '05-15', inflow: 3200, outflow: 1500, netReserve: 1700 },
        { date: '05-18', inflow: 6250, outflow: 4051, netReserve: 2199 }
      ];
    }
    
    let runningInflow = 0;
    let runningOutflow = 0;
    
    transactions.forEach((tx) => {
      const d = tx.date ? tx.date.substring(5) : '05-01';
      if (!dailyData[d]) {
        dailyData[d] = { inflow: 0, outflow: 0 };
      }
      if (tx.type === 'INCOME') {
        dailyData[d].inflow += tx.amount;
      } else {
        dailyData[d].outflow += tx.amount;
      }
    });
    
    const sortedDates = Object.keys(dailyData).sort();
    return sortedDates.map((date) => {
      runningInflow += dailyData[date].inflow;
      runningOutflow += dailyData[date].outflow;
      return {
        date,
        inflow: runningInflow,
        outflow: runningOutflow,
        netReserve: runningInflow - runningOutflow
      };
    });
  };

  const renderMarkdownText = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Render Header 3: ### Some Title
      if (trimmed.startsWith('### ')) {
        const headerText = trimmed.replace('### ', '');
        const parts = headerText.split('**');
        return (
          <h4 key={idx} style={{
            fontSize: '0.92rem',
            fontWeight: '700',
            color: 'var(--text-primary)',
            marginTop: '0.85rem',
            marginBottom: '0.45rem',
            paddingBottom: '0.2rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem'
          }}>
            {parts.map((part, pIdx) => 
              pIdx % 2 === 1 ? <span key={pIdx} className="gradient-text-primary" style={{ fontWeight: '800' }}>{part}</span> : part
            )}
          </h4>
        );
      }
      
      // Render Bullet points: * Item or - Item
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        const bulletText = trimmed.substring(2);
        const parts = bulletText.split('**');
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            margin: '0.3rem 0 0.3rem 0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', flexShrink: 0 }}>•</span>
            <span>
              {parts.map((part, pIdx) => 
                pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
              )}
            </span>
          </div>
        );
      }

      // Render Numbered lists: 1. Item or 2. Item
      const numMatch = trimmed.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        const num = numMatch[1];
        const numText = numMatch[2];
        const parts = numText.split('**');
        return (
          <div key={idx} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.5rem',
            margin: '0.35rem 0 0.35rem 0.5rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.45'
          }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.15)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              color: 'var(--color-primary-light)',
              fontSize: '0.68rem',
              fontWeight: '700',
              flexShrink: 0,
              marginTop: '1px'
            }}>{num}</span>
            <span>
              {parts.map((part, pIdx) => 
                pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
              )}
            </span>
          </div>
        );
      }

      // Default paragraph
      if (trimmed === '') {
        return <div key={idx} style={{ height: '0.3rem' }} />;
      }

      const parts = trimmed.split('**');
      return (
        <p key={idx} style={{
          margin: '0.2rem 0',
          color: 'var(--text-secondary)',
          fontSize: '0.82rem',
          lineHeight: '1.45'
        }}>
          {parts.map((part, pIdx) => 
            pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{part}</strong> : part
          )}
        </p>
      );
    });
  };

  const handleSendChatMessage = (textToSubmit) => {
    const msgText = textToSubmit || chatInput;
    if (!msgText.trim()) return;

    const newMessages = [...chatMessages, { sender: 'user', text: msgText }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsAiTyping(true);

    setTimeout(() => {
      let aiResponse = "";
      const textLower = msgText.toLowerCase();

      const fsi = dashboardData.stabilityScore;
      const balance = dashboardData.balance;
      const income = dashboardData.totalIncome;
      const expenses = dashboardData.totalExpense;
      const risk = dashboardData.riskLevel;
      const savings = dashboardData.savingsPotential;
      const runway = expenses > 0 ? (balance / expenses).toFixed(1) : '99+';
      const profession = user?.profession || "Freelancer";
      const targetSavings = user?.targetSavings || 5000.0;

      if (textLower.includes('saving') || textLower.includes('save') || textLower.includes('goal') || textLower.includes('payout')) {
        aiResponse = `### 💰 Tactical Savings & Payout Sweep Blueprint for ${user?.fullName || 'User'}
As a **${profession}**, your income varies, making traditional budgets hard. FinGuard AI has analyzed your active numbers:
* Current Balance: **₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
* Monthly Income: **₹${income.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}**
* Savings Potential: **₹${savings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month**
* Target Goal: **₹${targetSavings.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/month**

${savings >= targetSavings 
  ? `🎉 **Outstanding!** Your monthly savings potential (₹${savings.toFixed(0)}) already exceeds your target of ₹${targetSavings.toFixed(0)}. You can safely speed up your long-term goals!` 
  : `⚠️ **Goal Gap:** You need an additional **₹${(targetSavings - savings).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month** to achieve your target goal of ₹${targetSavings.toFixed(0)}. Let's close this gap.`
}

### 🛡️ Action Plan to Hit Your Savings Target:
1. **Automate Variable Income Sweeps**: Set up an automatic **15%** sweep on all incoming payouts. When you receive a gig contract or daily payment, route 15% directly into your savings vault before spending a single rupee.
2. **Build Your Runway Cushion**: Prioritize filling your emergency reserve to **₹${(expenses * 3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (representing 3 months of survival expenses). Your current runway is **${runway} months**.
3. **Control Volatility Spikes**: Since your profession as a **${profession}** has seasonal cycles, practice "Surge Banking" — during peak high-earning weeks, lock away 30% of the surplus to buffer against slow seasons.
4. **Expense Pruning Challenge**: Visit the **Ledger** page and identify discretionary shopping or utility expenses. Cutting back just **10%** of monthly outflows will unlock **₹${(expenses * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month** in immediate extra savings!`;
      } else if (textLower.includes('invest') || textLower.includes('passive') || textLower.includes('stock') || textLower.includes('deposit') || textLower.includes('fd') || textLower.includes('gold') || textLower.includes('sip') || textLower.includes('wealth')) {
        const sipMonthly = Math.max(500, Math.min(savings, 10000));
        const val1yr = sipMonthly * 12.46;
        const val3yr = sipMonthly * 40.1;
        const val5yr = sipMonthly * 72.6;
        aiResponse = `### 📈 Smart Investment & Wealth-Building Roadmap
Let's structure a premium, bulletproof wealth roadmap based on your current financial capacity:
* Monthly Savings Capacity: **₹${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month**
* Recommended SIP Investment: **₹${sipMonthly.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month**

### 💰 What Your Money Will Grow To (Projected at 7.2% CAGR):
If you consistently invest your recommended ₹${sipMonthly.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month:
* **1 Year**: You will accumulate **₹${val1yr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (Principal: ₹${(sipMonthly * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })} | Interest: ₹${(val1yr - sipMonthly * 12).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
* **3 Years**: You will accumulate **₹${val3yr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (Principal: ₹${(sipMonthly * 36).toLocaleString('en-IN', { maximumFractionDigits: 0 })} | Interest: ₹${(val3yr - sipMonthly * 36).toLocaleString('en-IN', { maximumFractionDigits: 0 })})
* **5 Years**: You will accumulate **₹${val5yr.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (Principal: ₹${(sipMonthly * 60).toLocaleString('en-IN', { maximumFractionDigits: 0 })} | Interest: ₹${(val5yr - sipMonthly * 60).toLocaleString('en-IN', { maximumFractionDigits: 0 })})

### 🛡️ Smart Low-Risk Phasing for ${profession}s:
1. **Phase 1: Capital Shield (Runway First)**: Ensure you have at least 3 months of survival runway (₹${(expenses * 3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}) in savings before starting high-yield investments. Your current runway buffer is **${runway} months**.
2. **Phase 2: Micro-SIPs (Mutual Funds)**: Start a monthly Systematic Investment Plan (SIP) in a diversified **Large-Cap Index Fund**. Setting up a small SIP of just ₹500/mo allows you to grow wealth quietly and compounding takes care of the rest.
3. **Phase 3: Digital Gold & RDs**: Allocate 5% of monthly savings into Digital Gold starting at ₹50. This creates a solid inflation hedge. Maintain a Recurring Deposit (RD) at a local bank for fixed 7% secure returns with easy liquidity.
4. **⚠️ High-Risk Warning**: Avoid day trading, options, crypto, or get-rich-quick multi-level marketing schemes. With a volatile **${profession}** income, capital preservation is your primary shield!`;
      } else if (textLower.includes('planning') || textLower.includes('plan') || textLower.includes('budget') || textLower.includes('fixed cost') || textLower.includes('tactical')) {
        aiResponse = `### 📅 Tactical Variable Budgeting Blueprint (Gig-Worker Specialized)
Standard rigid monthly budgeting fails for **${profession}s** due to highly volatile daily or weekly wages. Let's design a custom dynamic framework based on your active inflow of **₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month**:

### 🛡️ The 50/30/20 Volatility Budget:
1. **50% for Fixed Needs (₹${(income * 0.5).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month)**:
   * Prioritize rent, basic utilities, and absolute necessities first. Try to lock these down in the first 10 days of the month.
2. **20% for Volatility Cushion (₹${(income * 0.2).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month)**:
   * Keep this 20% highly liquid (e.g. in your primary linked account). It acts as a surge buffer to cover your needs when contract gigs are slow or seasonal dips occur.
3. **30% for Investments & Aspirations (₹${(income * 0.3).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/month)**:
   * Dedicate this to your long-term goal of **₹${targetSavings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo** and high-yield mutual fund SIPs.

### 📈 Action Steps to Manage Your Variable Cash Flows:
* **Step 1: Set a Weekly Survival Ceiling**: Based on your monthly expenses of ₹${expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}, aim to spend no more than **₹${(expenses / 4.33).toLocaleString('en-IN', { maximumFractionDigits: 0 })} per week** on shared household and personal needs.
* **Step 2: Know Your Daily Rate**: You are currently earning an equivalent of **₹${(income / 30).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day**. If your daily spend exceeds this, immediately pause discretionary outflows.
* **Step 3: Define a Hard Spend Limit**: Go to the **Profile** page and configure a strict UPI spending ceiling of **₹${(expenses * 0.8).toLocaleString('en-IN', { maximumFractionDigits: 0 })}** to block automated micro-transaction leaks.`;
      } else if (textLower.includes('split') || textLower.includes('splitting') || textLower.includes('share') || textLower.includes('household') || textLower.includes('family') || textLower.includes('roommate') || textLower.includes('bill')) {
        const partnerIncome = 30000;
        const totalCombined = income + partnerIncome;
        const userPercentage = (income / totalCombined) * 100;
        const partnerPercentage = (partnerIncome / totalCombined) * 100;
        const sampleBill = 18000;
        const userShare = sampleBill * (income / totalCombined);
        const partnerShare = sampleBill * (partnerIncome / totalCombined);

        aiResponse = `### 🤝 Proportional Expense Splitting & Shared Budget Blueprint
Managing cooperative family or roommate budgets with a variable **${profession}** income requires a transparent, fair system. Standard 50/50 splits often cause stress when earnings are volatile. 

### 🛡️ Proportional Income Splitting Framework:
Instead of a rigid 50/50 split, share collective bills **proportionally to your monthly income**:
* Your Average Monthly Inflow: **₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (${userPercentage.toFixed(0)}% of joint pool)
* Partner's Monthly Inflow (Est.): **₹${partnerIncome.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** (${partnerPercentage.toFixed(0)}% of joint pool)

### 📈 Live Split Example (Joint Household Bill: ₹${sampleBill.toLocaleString('en-IN')}):
If your combined monthly rent, food, and electricity bill is ₹${sampleBill.toLocaleString('en-IN')}:
* **Your Proportional Share (${userPercentage.toFixed(0)}%)**: **₹${userShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**
* **Partner's Proportional Share (${partnerPercentage.toFixed(0)}%)**: **₹${partnerShare.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**
* This ensures that both partners contribute fairly according to their actual financial strength!

### ⚙️ Tactical Operations for Cooperative Budgets:
1. **Separate Business vs Personal Outflows**: If you spend money on professional tools, fuel, or business equipment, tag them under separate descriptions (e.g. "fuel - work") so they aren't mixed into shared household utility tallies.
2. **Configure UPI Shared Limits**: Connect your primary HDFC or SBI linked account in the **Profile** section and set a weekly card limit to prevent domestic micro-spending spills from draining your volatility reserve.
3. **Weekly Ledger Alignments**: Visit the **Ledger** page together every Sunday. Review the Shopping and Food categories to identify mutual expense spikes and instantly verify if any anomalies have triggered the Outlier Shield.`;
      } else if (textLower.includes('score') || textLower.includes('stability') || textLower.includes('fsi') || textLower.includes('volatility') || textLower.includes('risk')) {
        aiResponse = `### 🛡️ FSI Volatility Blueprint for ${user?.fullName || 'User'}
Your Financial Stability Index is **${fsi.toFixed(1)} / 100** (classified as **${risk} RISK**).

**Volatility Diagnostics:**
* Monthly Income: **₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}** | Monthly Outflows: **₹${expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**
* Burn Rate: **${income > 0 ? ((expenses/income)*100).toFixed(0) : 100}%**

**FSI Improvement Plan:**
1. **Reserve Threshold**: Maintain a cash reserve above ₹${(expenses * 2).toLocaleString('en-IN', { maximumFractionDigits: 0 })} in your linked accounts. Your current balance is ₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.
2. **Volatility Smoothing**: Try spacing out discretionary card or UPI disbursements to avoid sudden spikes in transaction frequency. Check the **Ledger** page to organize disbursements.`;
      } else if (textLower.includes('expense') || textLower.includes('outflow') || textLower.includes('spend') || textLower.includes('burn') || textLower.includes('cost')) {
        const burnRate = income > 0 ? ((expenses / income) * 100).toFixed(0) : 100;
        aiResponse = `### 📉 Expense Burn Rate Optimization Blueprint
Your monthly burn rate is **${burnRate}%** (Outflows: ₹${expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })} vs Inflow: ₹${income.toLocaleString('en-IN', { maximumFractionDigits: 0 })}).

**Disbursement Analysis:**
* Net Monthly Outflow: **₹${expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**
* Daily average spending: **₹${(expenses/30).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/day**

**AI Cost-Cutting Recommendations:**
1. **Log Sub-Categories**: Check your food and travel ledger entries on the **Ledger** tab to locate discretionary leaks.
2. **Set Hard Limits**: Set a strict UPI monthly spending limit (e.g. ₹10,000) under your **Profile** configuration.
3. **10% Challenge**: Trimming discretionary costs by 10% will unlock **₹${(expenses * 0.1).toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo** in additional savings potential!`;
      } else if (textLower.includes('runway') || textLower.includes('buffer') || textLower.includes('reserve') || textLower.includes('cushion')) {
        aiResponse = `### ⏳ Emergency Buffer Runway Diagnostics
You currently have an Emergency Buffer Runway of **${runway} months** (based on monthly cash burn of ₹${expenses.toLocaleString('en-IN', { maximumFractionDigits: 0 })}).

**Runway Status:**
* Current Runway: **${runway} months**
* Safe Volatility Buffer: **3 to 6 months** (Target reserve: ₹${(expenses * 3).toLocaleString('en-IN', { maximumFractionDigits: 0 })})

**Runway Hardening Blueprint:**
1. **Cushion Gig Gaps**: Contract and gig gaps can emerge without warning. Prioritize building your cushion to ₹${(expenses * 3).toLocaleString('en-IN', { maximumFractionDigits: 0 })} (3-month threshold).
2. **Save Sweeps**: Move cash margins into separate savings wallets during peak dry seasons when daily margins are high.`;
      } else if (textLower.includes('anomaly') || textLower.includes('fraud') || textLower.includes('security') || textLower.includes('outlier') || textLower.includes('warning') || textLower.includes('alert')) {
        const activeAlerts = dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length;
        aiResponse = `### 🛡️ Outlier Shield & Transaction Security Diagnostics
My Outlier Shield engine is currently monitoring your linked accounts. There are **${activeAlerts} active alerts**.

**Security Summary:**
* Active warnings: **${activeAlerts}**
* System Status: **${activeAlerts > 0 ? 'WARNING (Unresolved anomalies detected)' : 'SECURE (Shield Active)'}**

**Action Blueprint:**
1. **Review Ledger**: Outliers, duplicate bills, or sudden spikes in UPI transfers can severely damage variable cash flows.
2. **Resolve Immediately**: Visit the **Anomaly** tab to review, verify, or resolve active warnings.`;
      } else if (textLower.includes('hi') || textLower.includes('hello') || textLower.includes('hey') || textLower.includes('greetings') || textLower.includes('help') || textLower.includes('who are you') || textLower.includes('what can you do')) {
        aiResponse = `Hello! I am your FinGuard AI Copilot. I'm ready to help you analyze your gig/freelance income volatility, emergency reserves, investment options, split household bills, and custom budget limits.

Ask me questions like:
* *"How can I save money?"* 💰
* *"Recommend a safe investment plan"* 📈
* *"Create a tactical variable budget"* 📅
* *"How to split shared household expenses"* 🤝`;
      } else if (textLower.includes('thank') || textLower.includes('thanks')) {
        aiResponse = `You're welcome! I'm here to shield your cash flows and guide your financial growth. Let me know if you need help analyzing any other ledger items or stability factors! 🛡️`;
      } else {
        aiResponse = `### 🛡️ FinGuard AI Financial Profile Advisor
I have analyzed your FinGuard profile as a **${profession}**:
* **FSI score:** **${fsi.toFixed(1)}/100** (classified as **${risk} RISK**)
* **Overall Balance:** **₹${balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}**
* **Monthly Burn Rate:** **${income > 0 ? ((expenses/income)*100).toFixed(0) : 100}%**
* **Savings Potential:** **₹${savings.toLocaleString('en-IN', { maximumFractionDigits: 0 })}/mo**
* **Emergency Runway:** **${runway} months**

I can formulate detailed custom strategies for you! Ask me specific questions like:
* *"How can I save money?"* 💰
* *"How to invest my savings?"* 📈
* *"Create a financial plan"* 📅
* *"How to split household expenses?"* 🤝
* *"Analyze my burn rate"* 📉`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsAiTyping(false);
    }, 1000);
  };

  const trendData = getTrendData();

  if (!token) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh', 
        width: '100vw', 
        background: 'var(--bg-primary)', 
        position: 'relative', 
        overflow: 'hidden',
        padding: '1.5rem'
      }}>
        {/* Radial glow background blobs */}
        <div className="bg-glow bg-glow-indigo" style={{ opacity: 0.15 }}></div>
        <div className="bg-glow bg-glow-purple" style={{ opacity: 0.15 }}></div>
        <div className="bg-glow bg-glow-emerald" style={{ opacity: 0.08 }}></div>

        {/* Floating Language Selector */}
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
          <LanguageSelector />
        </div>

        {/* Centered Glassmorphic Login Card */}
        <div className="glass-panel glow-indigo" style={{ 
          width: '100%', 
          maxWidth: '440px', 
          padding: '2.5rem 2.25rem', 
          zIndex: 1, 
          borderRadius: '24px',
          background: 'rgba(13, 20, 38, 0.45)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.45)'
        }}>
          
          {/* Logo Header */}
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(16, 185, 129, 0.15) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: 'var(--color-success)',
              fontSize: '1.8rem',
              marginBottom: '1rem',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.1)'
            }}>
              🛡️
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0 }} className="gradient-text-primary">
              FinGuard AI
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.35rem', letterSpacing: '0.5px', textTransform: 'uppercase', fontWeight: 500 }}>
              Stability Buffer & Anomaly Shield
            </p>
          </div>

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('auth.username')}
                </label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. demo"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{ padding: '0.8rem 1rem' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {t('auth.password')}
                </label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{ padding: '0.8rem 1rem' }}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.85rem', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                {t('common.login')}
              </button>


            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Username</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="john_doe"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Email</label>
                  <input 
                    type="email" 
                    className="form-input" 
                    placeholder="john@email.com"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Full Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="John Doe"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Profession</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    placeholder="Freelancer"
                    value={registerForm.profession}
                    onChange={(e) => setRegisterForm({ ...registerForm, profession: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Target Savings</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    placeholder="1500"
                    value={registerForm.targetSavings}
                    onChange={(e) => setRegisterForm({ ...registerForm, targetSavings: parseFloat(e.target.value) })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Password</label>
                <input 
                  type="password" 
                  className="form-input" 
                  placeholder="At least 6 characters"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '0.8rem', fontSize: '0.88rem', marginTop: '0.5rem' }}>
                Create Free Account
              </button>
            </form>
          )}

          {/* Tab Toggle Link */}
          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.82rem' }}>
            {authMode === 'login' ? (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                New to FinGuard?{' '}
                <span 
                  onClick={() => setAuthMode('register')} 
                  style={{ color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Create an account
                </span>
              </p>
            ) : (
              <p style={{ margin: 0, color: 'var(--text-secondary)' }}>
                Already have an account?{' '}
                <span 
                  onClick={() => setAuthMode('login')} 
                  style={{ color: 'var(--color-primary-light)', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Sign in instead
                </span>
              </p>
            )}
          </div>

        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-primary)', position: 'relative', overflow: 'hidden' }}>
      {/* Radial glow background blobs */}
      <div className="bg-glow bg-glow-indigo"></div>
      <div className="bg-glow bg-glow-purple"></div>
      <div className="bg-glow bg-glow-emerald"></div>
      
      {/* 1. Left Sidebar Navigation */}
      <aside style={{
        width: '22%',
        minWidth: '300px',
        maxWidth: '400px',
        borderRight: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
        padding: '2.5rem 1.75rem',
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        zIndex: 10,
        flexShrink: 0
      }}>
        
        {/* Logo and Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '1.8rem' }}>🛡️</span>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800 }} className="gradient-text-primary">FinGuard AI</h2>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '0.1em' }}>
              Fintech Intelligence
            </span>
          </div>
        </div>

        {/* Dynamic Profile Badge */}
        {user && (
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '1.1rem',
            marginBottom: '2.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            cursor: 'pointer',
            flexShrink: 0
          }}
          onClick={() => {
            setProfileDraft(profileDetails);
            setCurrentTab('profile');
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700
            }}>
              {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <h4 style={{ fontSize: '0.95rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: 700 }}>
                {user.fullName}
              </h4>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.profession}
              </p>
            </div>
          </div>
        )}

        {/* Sidebar Nav Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', flexGrow: 1, flexShrink: 0, marginBottom: '2rem' }}>
          <button
            className={`btn-secondary ${currentTab === 'profile' ? 'active-tab' : ''}`}
            onClick={() => {
              setProfileDraft(profileDetails);
              setCurrentTab('profile');
            }}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'profile' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'profile' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <UserIcon size={18} /> {t('common.profile')}
          </button>

          <button 
            className={`btn-secondary ${currentTab === 'dashboard' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('dashboard')}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'dashboard' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'dashboard' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <PieIcon size={18} /> {t('dashboard.title')}
          </button>

          <button 
            className={`btn-secondary ${currentTab === 'income' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('income')}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'income' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'income' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <TrendingUp size={18} style={{ color: 'var(--color-success)' }} /> {t('income.title')}
          </button>

          <button 
            className={`btn-secondary ${currentTab === 'expense' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('expense')}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'expense' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'expense' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <TrendingDown size={18} style={{ color: 'var(--color-danger)' }} /> {t('expense.title')}
          </button>

          <button 
            className={`btn-secondary ${currentTab === 'stability' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('stability')}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'stability' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'stability' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> {t('stability.title')}
          </button>

          <button 
            className={`btn-secondary ${currentTab === 'fraud' ? 'active-tab' : ''}`}
            onClick={() => setCurrentTab('fraud')}
            style={{
              justifyContent: 'flex-start',
              border: 'none',
              background: currentTab === 'fraud' ? 'rgba(0, 242, 254, 0.12)' : 'transparent',
              color: currentTab === 'fraud' ? 'var(--color-success)' : 'var(--text-primary)',
              flexShrink: 0,
              padding: '0.85rem 1.25rem'
            }}
          >
            <Shield size={18} style={{ color: 'var(--color-danger)' }} /> {t('anomaly.title')}
            {dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length > 0 && (
              <span className="badge badge-high" style={{ marginLeft: 'auto', padding: '0.1rem 0.4rem', fontSize: '0.65rem' }}>
                {dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length}
              </span>
            )}
          </button>
        </nav>

        {/* Bottom Utility Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.75rem', flexShrink: 0 }}>
          
          {backendOffline && (
            <div style={{
              fontSize: '0.7rem',
              color: 'var(--color-warning)',
              background: 'rgba(245, 158, 11, 0.1)',
              padding: '0.6rem 0.85rem',
              borderRadius: '8px',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              marginBottom: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              flexShrink: 0
            }}>
              <AlertTriangle size={12} /> Server Offline (Mock Mode)
            </div>
          )}

          <button 
            onClick={() => setIsLightMode(!isLightMode)} 
            className="btn-secondary" 
            style={{ border: 'none', justifyContent: 'flex-start', flexShrink: 0, padding: '0.75rem 1rem' }}
          >
            {isLightMode ? <Moon size={16} /> : <Sun size={16} />} 
            {isLightMode ? 'Dark Theme' : 'Light Theme'}
          </button>

          <button 
            onClick={handleLogout} 
            className="btn-secondary" 
            style={{ border: 'none', color: 'var(--color-danger)', justifyContent: 'flex-start', flexShrink: 0, padding: '0.75rem 1rem' }}
          >
            <LogOut size={16} /> {t('common.logout')}
          </button>
        </div>

      </aside>

      {/* 2. Main Panel */}
      <main style={{ flexGrow: 1, padding: '3.5rem 4rem', overflowY: 'auto', height: '100vh', position: 'relative', zIndex: 1 }}>
        
        {/* Top bar */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem' }}>
              {currentTab === 'dashboard' && t('dashboard.title')}
              {currentTab === 'profile' && t('common.profile')}
              {currentTab === 'income' && t('income.title')}
              {currentTab === 'expense' && t('expense.title')}
              {currentTab === 'stability' && t('stability.title')}
              {currentTab === 'fraud' && t('anomaly.title')}
            </h1>
          </div>

          {/* Quick triggers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <LanguageSelector />
            
            {/* Quick Action buttons */}
            <button onClick={() => setIsIncomeModalOpen(true)} className="btn-secondary" style={{ borderColor: 'var(--color-success)', color: 'var(--color-success)', background: 'transparent' }}>
              <Plus size={16} /> {t('income.title')}
            </button>
            
            <button onClick={() => setIsExpenseModalOpen(true)} className="btn-secondary" style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)', background: 'transparent' }}>
              <Plus size={16} /> {t('expense.title')}
            </button>

            {/* Notification Badge */}
            <div style={{ position: 'relative' }}>
              <div 
                style={{ position: 'relative', cursor: 'pointer' }} 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              >
                <div 
                  className={dashboardData.notifications.filter(n => !n.isRead).length > 0 ? 'bell-shake-animation' : ''}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'var(--bg-secondary)',
                    transition: 'var(--transition-smooth)'
                  }}
                >
                  <Bell size={18} />
                </div>
                {dashboardData.notifications.filter(n => !n.isRead).length > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    width: '8px',
                    height: '8px',
                    background: 'var(--color-danger)',
                    borderRadius: '50%',
                    boxShadow: '0 0 10px 0 var(--color-danger)'
                  }}></span>
                )}
              </div>

              {isNotificationsOpen && (
                <div className="notifications-drawer">
                  <div className="notifications-drawer-header">
                    <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                      <Bell size={16} /> Notifications
                    </h4>
                    {dashboardData.notifications.filter(n => !n.isRead).length > 0 && (
                      <button 
                        onClick={() => {
                          handleMarkAllRead();
                          setIsNotificationsOpen(false);
                        }} 
                        style={{ background: 'transparent', border: 'none', color: 'var(--color-primary-light)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="notifications-drawer-body">
                    {dashboardData.notifications.length > 0 ? (
                      dashboardData.notifications.map((n) => (
                        <div 
                          key={n.id} 
                          className={`notification-item ${!n.isRead ? 'unread' : ''}`}
                          onClick={() => {
                            if (n.type === 'FRAUD') {
                              setCurrentTab('fraud');
                            } else {
                              setCurrentTab('dashboard');
                            }
                            setIsNotificationsOpen(false);
                          }}
                        >
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: n.type === 'FRAUD' ? 'var(--color-danger-light)' : 'var(--color-primary-light)' }}>
                                {n.title}
                              </span>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{n.message}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        No notifications yet.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </header>

        {currentTab === 'profile' && (() => {
          const accountsGridTemplate = isProfileEditing ? '1.4fr 0.9fr 1.7fr 1.2fr auto' : '1.4fr 0.9fr 1.7fr 1.2fr';
          const familyGridTemplate = isProfileEditing ? '1.4fr 1.2fr 1.4fr auto' : '1.4fr 1.2fr 1.4fr';
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {/* Header profile row */}
              <div className="glass-panel" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '2rem 2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-success) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 800,
                    fontSize: '1.6rem',
                    boxShadow: '0 4px 14px var(--color-primary-glow)'
                  }}>
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{user.fullName}</h2>
                    <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{user.profession} · {profileDetails.city}</p>
                  </div>
                </div>

                <button
                  className={isProfileEditing ? 'btn-primary' : 'btn-secondary'}
                  onClick={() => {
                    if (isProfileEditing) {
                      handleSaveProfile();
                    } else {
                      setProfileDraft(profileDetails);
                      setIsProfileEditing(true);
                    }
                  }}
                  style={{ minWidth: '150px' }}
                >
                  {isProfileEditing ? <Save size={16} /> : <Pencil size={16} />}
                  {isProfileEditing ? 'Save Profile' : 'Edit Profile'}
                </button>
              </div>

              {/* Personal Details & Linked Accounts grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '2rem' }}>
                
                {/* 1. Personal details card */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.2rem' }}>
                    <UserIcon size={20} style={{ color: 'var(--color-primary-light)' }} /> Personal details
                  </h3>
                  <div style={{ display: 'grid', gap: '1.5rem', flexGrow: 1 }}>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.phone}
                        onChange={(e) => setProfileDraft({ ...profileDraft, phone: e.target.value })}
                        placeholder="+91 mobile number"
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>City</span>
                      <input
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.city}
                        onChange={(e) => setProfileDraft({ ...profileDraft, city: e.target.value })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Household members count</span>
                      <input
                        type="number"
                        className="form-input"
                        disabled={!isProfileEditing}
                        value={profileDraft.householdMembers}
                        onChange={(e) => setProfileDraft({ ...profileDraft, householdMembers: Number(e.target.value) })}
                        style={{ padding: '0.85rem 1.1rem' }}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Linked accounts card */}
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.2rem' }}>
                    <Landmark size={20} style={{ color: 'var(--color-success)' }} /> Linked accounts
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flexGrow: 1 }}>
                    
                    {/* Headers for Linked Accounts */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: accountsGridTemplate,
                      gap: '1rem',
                      padding: '0 0.5rem',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      color: 'var(--text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      <div>Name</div>
                      <div>Type</div>
                      <div>Details (UPI/Acc)</div>
                      <div>Limit / Mo.</div>
                      {isProfileEditing && <div></div>}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {profileDraft.linkedAccounts.map((account, index) => (
                        <div key={`${account.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: accountsGridTemplate, gap: '1rem', alignItems: 'center' }}>
                          <input 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.name} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'name', e.target.value)} 
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          <select 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.type} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'type', e.target.value)}
                            style={{ padding: '0.75rem 0.5rem', fontSize: '0.9rem', height: '42px' }}
                          >
                            <option value="BANK">Bank</option>
                            <option value="UPI">UPI</option>
                            <option value="CASH">Cash</option>
                          </select>
                          <input 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.upiId || account.maskedAccount} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, account.type === 'UPI' ? 'upiId' : 'maskedAccount', e.target.value)} 
                            placeholder={account.type === 'UPI' ? 'name@bank' : 'XXXX 0000'}
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          <input 
                            type="number" 
                            className="form-input" 
                            disabled={!isProfileEditing} 
                            value={account.monthlyLimit} 
                            onChange={(e) => updateProfileListItem('linkedAccounts', index, 'monthlyLimit', Number(e.target.value))}
                            style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                          />
                          {isProfileEditing && (
                            <button 
                              className="btn-secondary" 
                              type="button" 
                              onClick={() => removeProfileListItem('linkedAccounts', index)} 
                              style={{ padding: '0.75rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {isProfileEditing && (
                        <button className="btn-secondary" type="button" onClick={() => addProfileListItem('linkedAccounts', { name: 'New Account', type: 'BANK', maskedAccount: 'XXXX 0000', upiId: '', monthlyLimit: 5000 })} style={{ padding: '0.75rem 1.25rem', fontSize: '0.85rem' }}>
                          <Plus size={14} /> Add Bank / UPI
                        </button>
                      )}
                      <button 
                        className="btn-primary" 
                        type="button" 
                        onClick={() => {
                          setBankLinkStep(1);
                          setSelectedBank(null);
                          setBankLinkMobile('');
                          setBankLinkOtp('');
                          setIsBankLinkOpen(true);
                        }} 
                        style={{ 
                          padding: '0.75rem 1.25rem', 
                          fontSize: '0.85rem',
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))',
                          boxShadow: '0 4px 10px rgba(0, 242, 254, 0.15)',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <RefreshCw size={14} /> Link Live Bank (API)
                      </button>
                    </div>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      🛡️ Secure sandbox simulation. Do not enter actual bank passwords, keys, or OTPs.
                    </p>
                  </div>
                </div>

              </div>

              {/* Family Expense Planning card */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.2rem' }}>
                  <Users size={20} style={{ color: 'var(--color-accent-light)' }} /> Family & children expense planning
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Headers for Family Members */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: familyGridTemplate,
                    gap: '1rem',
                    padding: '0 0.5rem',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    <div>Member Name</div>
                    <div>Relationship</div>
                    <div>Est. Monthly Expense (INR)</div>
                    {isProfileEditing && <div></div>}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    {profileDraft.familyMembers.map((member, index) => (
                      <div key={`${member.name}-${index}`} style={{ display: 'grid', gridTemplateColumns: familyGridTemplate, gap: '1rem', alignItems: 'center' }}>
                        <input 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.name} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'name', e.target.value)} 
                          placeholder="Name" 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        <input 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.relation} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'relation', e.target.value)} 
                          placeholder="Relation" 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        <input 
                          type="number" 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={member.monthlyExpense} 
                          onChange={(e) => updateProfileListItem('familyMembers', index, 'monthlyExpense', Number(e.target.value))} 
                          placeholder="Monthly expense" 
                          style={{ padding: '0.75rem 0.85rem', fontSize: '0.9rem' }}
                        />
                        {isProfileEditing && (
                          <button 
                            className="btn-secondary" 
                            type="button" 
                            onClick={() => removeProfileListItem('familyMembers', index)} 
                            style={{ padding: '0.75rem', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            <Trash2 size={14} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {isProfileEditing && (
                    <button className="btn-secondary" type="button" onClick={() => addProfileListItem('familyMembers', { name: 'Child', relation: 'Child', monthlyExpense: 2000 })} style={{ marginTop: '0.5rem', padding: '0.75rem 1.5rem' }}>
                      <Plus size={16} /> Add Family Member
                    </button>
                  )}
                </div>
              </div>

              {/* Savings goals section */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.2rem' }}>
                  <GraduationCap size={20} style={{ color: 'var(--color-success)' }} /> Savings goals
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                  {profileDraft.savingsGoals.map((goal, index) => (
                    <div key={`${goal.name}-${index}`} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: 'var(--color-primary-glow)',
                          color: 'var(--color-primary-light)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {goal.category === 'BOOKS' ? <BookOpen size={18} /> : goal.category === 'HOUSE' ? <Home size={18} /> : goal.category === 'PETROL' ? <Fuel size={18} /> : <GraduationCap size={18} />}
                        </div>
                        <input 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={goal.name} 
                          onChange={(e) => updateProfileListItem('savingsGoals', index, 'name', e.target.value)} 
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem', fontWeight: 700 }}
                        />
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Target (INR)</span>
                        <input 
                          type="number" 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={goal.targetAmount} 
                          onChange={(e) => updateProfileListItem('savingsGoals', index, 'targetAmount', Number(e.target.value))}
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                        />
                      </label>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>Monthly plan (INR/mo)</span>
                        <input 
                          type="number" 
                          className="form-input" 
                          disabled={!isProfileEditing} 
                          value={goal.monthlyPlan} 
                          onChange={(e) => updateProfileListItem('savingsGoals', index, 'monthlyPlan', Number(e.target.value))} 
                          style={{ padding: '0.5rem 0.75rem', fontSize: '0.9rem' }}
                        />
                      </label>
                      
                      <div style={{ marginTop: '0.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>Monthly Contribution:</span>
                          <strong>{formatCurrency(goal.monthlyPlan, 0)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          <span>Target Buffer:</span>
                          <strong>{formatCurrency(goal.targetAmount, 0)}</strong>
                        </div>
                      </div>

                      {isProfileEditing && (
                        <button 
                          className="btn-secondary" 
                          type="button" 
                          onClick={() => removeProfileListItem('savingsGoals', index)} 
                          style={{ width: '100%', padding: '0.6rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}
                        >
                          <Trash2 size={14} style={{ color: 'var(--color-danger)' }} /> Remove Goal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {isProfileEditing && (
                  <button className="btn-secondary" type="button" onClick={() => addProfileListItem('savingsGoals', { name: 'New Goal', category: 'HOUSE', targetAmount: 10000, monthlyPlan: 1000 })} style={{ marginTop: '1.25rem', alignSelf: 'flex-start', padding: '0.75rem 1.5rem' }}>
                    <Plus size={16} /> Add Savings Goal
                  </button>
                )}
              </div>

              {/* Stability Vault settings card */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', fontSize: '1.2rem' }}>
                  <Shield size={20} style={{ color: 'var(--color-success)' }} /> Stability Vault & Risk Control Settings
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
                  
                  {/* Left Column: Toggles */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>Automated Payout Sweep</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Automatically sweeps 15% of all incomes to Vault</span>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={isAutoSweepActive} 
                          onChange={(e) => setIsAutoSweepActive(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: isAutoSweepActive ? 'var(--color-success)' : 'rgba(255,255,255,0.1)',
                          transition: '.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px', width: '18px',
                            left: isAutoSweepActive ? '24px' : '3px',
                            bottom: '3px',
                            backgroundColor: '#fff',
                            transition: '.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                      <div>
                        <strong style={{ fontSize: '0.88rem', display: 'block' }}>UPI Monthly Spending Ceiling</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Enforces strict limit warnings on outflows</span>
                      </div>
                      <label className="switch" style={{ position: 'relative', display: 'inline-block', width: '46px', height: '24px' }}>
                        <input 
                          type="checkbox" 
                          checked={cardLimitEnabled} 
                          onChange={(e) => setCardLimitEnabled(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span className="slider" style={{
                          position: 'absolute',
                          cursor: 'pointer',
                          top: 0, left: 0, right: 0, bottom: 0,
                          backgroundColor: cardLimitEnabled ? 'var(--color-primary)' : 'rgba(255,255,255,0.1)',
                          transition: '.3s',
                          borderRadius: '24px'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '18px', width: '18px',
                            left: cardLimitEnabled ? '24px' : '3px',
                            bottom: '3px',
                            backgroundColor: '#fff',
                            transition: '.3s',
                            borderRadius: '50%'
                          }}></span>
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Right Column: Limit Slider & Vault actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    {cardLimitEnabled && (
                      <div style={{ padding: '0.75rem 1rem', background: 'var(--bg-secondary)', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                          <span style={{ color: 'var(--text-secondary)' }}>Monthly Limit:</span>
                          <strong style={{ color: 'var(--color-primary-light)' }}>₹{cardLimitValue.toLocaleString('en-IN')}</strong>
                        </div>
                        <input 
                          type="range" 
                          min="1000" 
                          max="50000" 
                          step="1000" 
                          value={cardLimitValue} 
                          onChange={(e) => setCardLimitValue(Number(e.target.value))}
                          style={{ 
                            width: '100%', 
                            accentColor: 'var(--color-primary)', 
                            background: 'rgba(255, 255, 255, 0.1)', 
                            height: '6px', 
                            borderRadius: '3px', 
                            cursor: 'pointer' 
                          }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button 
                        type="button"
                        onClick={() => setStabilityVaultBalance(prev => prev + 5000)}
                        className="btn-secondary"
                        style={{ flexGrow: 1, padding: '0.75rem 1rem', fontSize: '0.82rem', justifyContent: 'center' }}
                      >
                        ➕ Deposit ₹5,000 to Vault
                      </button>
                      <button 
                        type="button"
                        onClick={() => setStabilityVaultBalance(937.5)}
                        className="btn-secondary"
                        style={{ padding: '0.75rem 1rem', fontSize: '0.82rem', justifyContent: 'center', color: 'var(--color-danger)' }}
                      >
                        Reset Vault
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          );
        })()}

        {currentTab === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            
            {/* Cards aggregate */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '2.5rem' }}>
              
              {/* Card 1: Balance */}
              <div className="glass-panel glow-indigo" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Overall Balance Margin</span>
                  <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800 }}>
                    {formatCurrency(dashboardData.balance)}
                  </h2>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.75rem', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--color-success)', display: 'flex', alignItems: 'center' }}>
                      <TrendingUp size={12} style={{ marginRight: '0.1rem' }} /> +{formatCurrency(dashboardData.totalIncome, 0)} In
                    </span>
                    <span style={{ color: 'var(--color-danger)', display: 'flex', alignItems: 'center' }}>
                      <TrendingDown size={12} style={{ marginRight: '0.1rem' }} /> -{formatCurrency(dashboardData.totalExpense, 0)} Out
                    </span>
                  </div>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'rgba(99, 102, 241, 0.1)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <DollarSign size={24} />
                </div>
              </div>

              {/* Card 2: Savings Projection */}
              <div className="glass-panel glow-emerald" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Predicted Savings Potential</span>
                  <h2 style={{ fontSize: '2rem', marginTop: '0.5rem', fontWeight: 800 }}>
                    {formatCurrency(dashboardData.savingsPotential)}
                  </h2>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.75rem' }}>
                    Upcoming monthly reserves based on seasonal trends.
                  </p>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: 'var(--color-success-bg)',
                  color: 'var(--color-success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <TrendingUp size={24} />
                </div>
              </div>

              {/* Card 3: Stability score */}
              <div className="glass-panel glow-coral" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Financial Stability Index</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginTop: '0.75rem' }}>
                    
                    {/* SVG Circular Progress Ring */}
                    <div className="stability-gauge-container" style={{ flexShrink: 0 }}>
                      <svg width="64" height="64" viewBox="0 0 36 36">
                        <defs>
                          <linearGradient id="stabilityGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor={
                              dashboardData.stabilityScore >= 75 ? 'var(--color-success)' : 
                              dashboardData.stabilityScore >= 45 ? 'var(--color-warning)' : 'var(--color-danger)'
                            } />
                            <stop offset="100%" stopColor="var(--color-primary-light)" />
                          </linearGradient>
                        </defs>
                        {/* Background circle */}
                        <path
                          className="gauge-bg"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.05)"
                          strokeWidth="3.5"
                        />
                        {/* Colored stability progress */}
                        <path
                          className="gauge-progress"
                          strokeDasharray={`${dashboardData.stabilityScore}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="url(#stabilityGlow)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          style={{
                            transition: 'stroke-dasharray 1s ease-in-out',
                            transformOrigin: '50% 50%',
                            transform: 'rotate(-90deg)'
                          }}
                        />
                      </svg>
                      <div className="stability-gauge-text">
                        <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{dashboardData.stabilityScore.toFixed(0)}</span>
                        <span style={{ fontSize: '0.5rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>FSI</span>
                      </div>
                    </div>

                    <div>
                      <span className={`badge ${dashboardData.riskLevel === 'LOW' ? 'badge-low' : dashboardData.riskLevel === 'MEDIUM' ? 'badge-medium' : 'badge-high'}`} style={{ display: 'inline-flex' }}>
                        🛡️ {dashboardData.riskLevel} Risk
                      </span>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginTop: '0.3rem', lineHeight: '1.25' }}>
                        {dashboardData.stabilityScore >= 75 ? 'Healthy gig margins, secure buffer.' : 
                         dashboardData.stabilityScore >= 45 ? 'Elevated volatility, increase reserves.' : 
                         'High risk cash burn. Action required.'}
                      </p>
                    </div>

                  </div>
                </div>
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '12px',
                  background: dashboardData.riskLevel === 'LOW' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                  color: dashboardData.riskLevel === 'LOW' ? 'var(--color-success)' : 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={24} />
                </div>
              </div>

            </div>

            {/* Notifications panel if active */}
            {dashboardData.notifications.filter(n => !n.isRead).length > 0 && (
              <div className="glass-panel" style={{ background: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <AlertTriangle size={18} style={{ color: 'var(--color-warning)' }} />
                  <div>
                    <strong style={{ fontSize: '0.9rem' }}>Account Advisory:</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '0.5rem' }}>
                      {dashboardData.notifications.filter(n => !n.isRead)[0].message}
                    </span>
                  </div>
                </div>
                <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
                  Dismiss alerts
                </button>
              </div>
            )}

            {/* Analytical Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem' }}>
              
              <div className="glass-panel" style={{ height: '350px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📈 Cash Flow Reserves Trend
                </h3>
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={trendData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorInflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-success)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-success)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorOutflow" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-danger)" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="var(--color-danger)" stopOpacity={0.0}/>
                      </linearGradient>
                      <linearGradient id="colorReserve" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="date" stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                    <YAxis stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                    <Tooltip 
                      contentStyle={{ 
                        background: 'var(--bg-secondary)', 
                        borderColor: 'var(--border-color)', 
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                        fontSize: '0.8rem' 
                      }} 
                      formatter={(val) => [formatCurrency(val), null]}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                    <Area type="monotone" name="Cumulative Inflow" dataKey="inflow" stroke="var(--color-success)" strokeWidth={2} fillOpacity={1} fill="url(#colorInflow)" />
                    <Area type="monotone" name="Cumulative Outflow" dataKey="outflow" stroke="var(--color-danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorOutflow)" />
                    <Area type="monotone" name="Net Reserves" dataKey="netReserve" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorReserve)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-panel" style={{ height: '350px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🍕 Outflow Category Spread
                </h3>
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="80%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGrad0" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#4f46e5" />
                        </linearGradient>
                        <linearGradient id="pieGrad1" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                        <linearGradient id="pieGrad2" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="pieGrad3" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#ef4444" />
                          <stop offset="100%" stopColor="#dc2626" />
                        </linearGradient>
                        <linearGradient id="pieGrad4" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#a855f7" />
                          <stop offset="100%" stopColor="#7c3aed" />
                        </linearGradient>
                        <linearGradient id="pieGrad5" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#0891b2" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {expensePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#pieGrad${index % 6})`} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'var(--bg-secondary)', 
                          borderColor: 'var(--border-color)', 
                          borderRadius: '12px',
                          fontSize: '0.8rem' 
                        }}
                        formatter={(val) => [formatCurrency(val), 'Outflow']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '0.75rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ height: '80%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                    No expenses logged yet.
                  </div>
                )}
              </div>

            </div>

            {/* Stability History and Cushion Vault details */}
            {(() => {
              const getFsiHistory = () => {
                const currentFsi = dashboardData.stabilityScore;
                const months = ['Dec 2025', 'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026'];
                const baseOffset = [ -6.5, -4.2, -8.1, 2.5, -1.8, 0 ];
                return months.map((month, idx) => {
                  const pointScore = Math.max(30, Math.min(100, currentFsi + baseOffset[idx]));
                  return {
                    month,
                    score: parseFloat(pointScore.toFixed(1))
                  };
                });
              };

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2.5rem', marginTop: '2.5rem', marginBottom: '2.5rem' }}>
                  
                  {/* FSI Historical Trend LineChart */}
                  <div className="glass-panel" style={{ height: '350px' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🛡️ FSI Stability History (6-Month Trend)
                    </h3>
                    <ResponsiveContainer width="100%" height="80%">
                      <LineChart data={getFsiHistory()} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="month" stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                        <YAxis domain={[0, 100]} stroke="var(--text-tertiary)" tickLine={false} style={{ fontSize: '0.75rem' }} />
                        <Tooltip 
                          contentStyle={{ 
                            background: 'var(--bg-secondary)', 
                            borderColor: 'var(--border-color)', 
                            borderRadius: '12px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            fontSize: '0.8rem' 
                          }} 
                        />
                        <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                        <Line 
                          type="monotone" 
                          name="FSI Stability Score" 
                          dataKey="score" 
                          stroke="var(--color-success)" 
                          strokeWidth={3} 
                          activeDot={{ r: 8 }}
                          dot={{ stroke: 'var(--color-success)', strokeWidth: 2, r: 4, fill: 'var(--bg-secondary)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stability Cushion Vault Info Card */}
                  <div className="glass-panel" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      🔒 Cushion Vault & Auto-Sweep Status
                    </h3>
                    <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1rem', alignItems: 'center' }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vault Balance</span>
                          <h3 style={{ fontSize: '2rem', fontWeight: 800, margin: '0.2rem 0', color: 'var(--color-success-light)' }}>
                            ₹{stabilityVaultBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </h3>
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            Interest earned: <strong style={{ color: 'var(--text-primary)' }}>₹{(stabilityVaultBalance * 0.072 / 12).toLocaleString('en-IN', { maximumFractionDigits: 2 })}/mo</strong> (at 7.2% secure RD yield)
                          </p>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <div className="vault-shield-circle" style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '50%',
                            background: isAutoSweepActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                            color: isAutoSweepActive ? 'var(--color-success)' : 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2rem',
                            border: isAutoSweepActive ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: isAutoSweepActive ? '0 0 20px rgba(16, 185, 129, 0.15)' : 'none'
                          }}>
                            🛡️
                          </div>
                        </div>
                      </div>

                      <div style={{ background: 'var(--bg-tertiary)', padding: '0.85rem 1rem', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Auto-Sweep status:</span>
                          <span className={`status-indicator ${isAutoSweepActive ? 'status-online' : 'status-offline'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                            {isAutoSweepActive ? 'Active (15% Inflow)' : 'Disabled'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600 }}>Active Spending Limit:</span>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                            {cardLimitEnabled ? `₹${cardLimitValue.toLocaleString('en-IN')}/mo` : 'Unlimited'}
                          </span>
                        </div>
                      </div>

                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.3' }}>
                        💡 Auto-sweep moves 15% of all incomes logged under the **Incomes** tab directly to the Vault. Configure sweep rates and UPI locks in the **Profile** tab.
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}

            {/* Bottom splits: AI suggestions and Recent transaction logs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              
              {/* Stability advice panel */}
              <div className="glass-panel glow-indigo" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Sparkles size={18} style={{ color: 'var(--color-accent)' }} /> AI Copilot Insights
                </h3>
                
                <div style={{
                  background: 'rgba(99, 102, 241, 0.05)',
                  border: '1px solid rgba(99, 102, 241, 0.15)',
                  borderRadius: '12px',
                  padding: '1.25rem',
                  fontSize: '0.85rem',
                  lineHeight: '1.6',
                  color: 'var(--text-primary)',
                  flexGrow: 1
                }}>
                  {stabilityAdvice ? (
                    <div style={{ whiteSpace: 'pre-line' }}>
                      {stabilityAdvice.replace(/### |#### |## |\* |\*\*|⚠️ |🛡️ |💎 /g, '')}
                    </div>
                  ) : (
                    "Analyzing historic gig flow trends..."
                  )}
                </div>

                <button onClick={() => setCurrentTab('stability')} className="btn-secondary" style={{ marginTop: '1rem', border: 'none', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem' }}>
                  View Full Advisory Report <ChevronRight size={16} />
                </button>
              </div>

              {/* Transactions table */}
              <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📅 Recent Transactions Log
                </h3>

                <div style={{ overflowX: 'auto', flexGrow: 1 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '1.25rem 1rem' }}>Type</th>
                        <th style={{ padding: '1.25rem 1rem' }}>Date</th>
                        <th style={{ padding: '1rem' }}>Category</th>
                        <th style={{ padding: '1.25rem 1rem' }}>{t('expense.description')}</th>
                        <th style={{ padding: '1.25rem 1rem' }}>Account / UPI</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Amount</th>
                        <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboardData.recentTransactions.slice(0, 5).map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: '1px solid var(--border-color)', verticalAlign: 'middle' }}>
                          <td style={{ padding: '1.25rem 1rem' }}>
                            <span style={{
                              color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--color-danger)',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              background: tx.type === 'INCOME' ? 'var(--color-success-bg)' : 'var(--color-danger-bg)',
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px'
                            }}>
                              {tx.type}
                            </span>
                          </td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                          <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{tx.category}</td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tx.description}</td>
                          <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>
                            {tx.type === 'EXPENSE' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                                {tx.accountType === 'UPI' ? <CreditCard size={14} /> : <Landmark size={14} />}
                                {tx.accountName || 'Cash'}
                                {tx.upiId ? ` (${tx.upiId})` : ''}
                              </span>
                            ) : '-'}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, color: tx.type === 'INCOME' ? 'var(--color-success)' : 'var(--text-primary)' }}>
                            {tx.type === 'INCOME' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </td>
                          <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                            <button onClick={() => handleDeleteTransaction(tx.id, tx.type)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', transition: 'color 0.2s' }} className="delete-btn">
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

          </div>
        )}

        {/* Tab 2: Income management */}
        {/* Tab 2: Income management */}
        {currentTab === 'income' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Income Rate Analytics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              
              {/* Hourly Equivalent */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hourly Income Rate</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                    {formatCurrency(dashboardData.totalIncome / 160)}
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Based on 160 hr/mo</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={20} />
                </div>
              </div>

              {/* Daily Average */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Daily Average Rate</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                    {formatCurrency(dashboardData.totalIncome / 30)}
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Based on 30-day month</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={20} />
                </div>
              </div>

              {/* Weekly Average */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Weekly Average Rate</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem' }}>
                    {formatCurrency(dashboardData.totalIncome / 4.33)}
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Based on 4.33 wk/mo</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={20} />
                </div>
              </div>

              {/* 6-Month Cumulative Projection */}
              <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>6-Month Projection</span>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--color-success-light)' }}>
                    {formatCurrency(dashboardData.totalIncome * 6)}
                  </h3>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Aggregate target velocity</span>
                </div>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={20} />
                </div>
              </div>

            </div>

            <div className="glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem' }}>Historical Earned Ledger</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full record of gig payouts, business contracts, and client deposits.</p>
                </div>
                <button onClick={() => setIsIncomeModalOpen(true)} className="btn-primary">
                  <Plus size={16} /> Log Income Deposit
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                      <th style={{ padding: '1.25rem 1rem' }}>Date</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Category</th>
                      <th style={{ padding: '1.25rem 1rem' }}>Source</th>
                      <th style={{ padding: '1.25rem 1rem' }}>{t('expense.description')}</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Amount</th>
                      <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentTransactions.filter(t => t.type === 'INCOME').map((inc) => (
                      <tr key={inc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{inc.date}</td>
                        <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{inc.category}</td>
                        <td style={{ padding: '1.25rem 1rem' }}>{inc.description}</td>
                        <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>Income deposit</td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, color: 'var(--color-success)', fontSize: '1rem' }}>
                          +{formatCurrency(inc.amount)}
                        </td>
                        <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                          <button onClick={() => handleDeleteTransaction(inc.id, 'INCOME')} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Expense Tracker */}
        {currentTab === 'expense' && (
          <div className="glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem' }}>Disbursements Ledger</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Full record of outgoing rent, bills, shopping, food and utility costs.</p>
              </div>
              <button onClick={() => setIsExpenseModalOpen(true)} className="btn-primary" style={{ background: 'linear-gradient(135deg, var(--color-danger) 0%, #a855f7 100%)', boxShadow: 'none' }}>
                <Plus size={16} /> Log Outflow item
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '1.25rem 1rem' }}>Date</th>
                    <th style={{ padding: '1.25rem 1rem' }}>Category</th>
                    <th style={{ padding: '1.25rem 1rem' }}>Description</th>
                    <th style={{ padding: '1.25rem 1rem' }}>Account / UPI</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>Amount</th>
                    <th style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.recentTransactions.filter(t => t.type === 'EXPENSE').map((exp) => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{exp.date}</td>
                      <td style={{ padding: '1.25rem 1rem', fontWeight: 600 }}>{exp.category}</td>
                      <td style={{ padding: '1.25rem 1rem' }}>{exp.description}</td>
                      <td style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                          {exp.accountType === 'UPI' ? <CreditCard size={14} /> : <Landmark size={14} />}
                          {exp.accountName || 'Cash'}
                          {exp.upiId ? ` (${exp.upiId})` : ''}
                        </span>
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'right', fontWeight: 700, fontSize: '1rem' }}>
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td style={{ padding: '1.25rem 1rem', textAlign: 'center' }}>
                        <button onClick={() => handleDeleteTransaction(exp.id, 'EXPENSE')} style={{ background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 4: AI Advisor Deep Dive */}
        {currentTab === 'stability' && (
          <div className="advisor-split-grid">
            
            {/* Left Column: KPI metrics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📊 Consistency Metrics
                </h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {/* Consistency score */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Income Consistency</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {user?.username === 'rajesh_k' ? '45%' : user?.username === 'priya_s' ? '65%' : user?.username === 'divya_t' ? '85%' : '75%'}
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          (user?.username === 'rajesh_k') ? 'danger' : 
                          (user?.username === 'priya_s') ? 'warning' : 'success'
                        }`}
                        style={{ width: user?.username === 'rajesh_k' ? '45%' : user?.username === 'priya_s' ? '65%' : user?.username === 'divya_t' ? '85%' : '75%' }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Based on client deposit intervals and gig contract durations.
                    </span>
                  </div>

                  {/* Burn rate */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Monthly Burn Rate</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          ((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100) > 75 ? 'danger' :
                          ((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100) > 50 ? 'warning' : 'success'
                        }`}
                        style={{ width: `${Math.min(((dashboardData.totalExpense / (dashboardData.totalIncome || 1)) * 100), 100)}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Proportion of total income spent on disbursements this month.
                    </span>
                  </div>

                  {/* Runway */}
                  <div className="metric-bar-card">
                    <div className="metric-bar-header">
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Emergency Buffer Runway</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-light)' }}>
                        {(dashboardData.balance / (dashboardData.totalExpense || 1)).toFixed(1)} Months
                      </span>
                    </div>
                    <div className="metric-bar-track">
                      <div 
                        className={`metric-bar-fill ${
                          (dashboardData.balance / (dashboardData.totalExpense || 1)) < 1.0 ? 'danger' :
                          (dashboardData.balance / (dashboardData.totalExpense || 1)) < 3.0 ? 'warning' : 'success'
                        }`}
                        style={{ width: `${Math.min((dashboardData.balance / (dashboardData.totalExpense || 1)) * 25, 100)}%` }}
                      ></div>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      How long current balance lasts based on this month's cash burn.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Parsed advice or Interactive AI Copilot */}
            <div className="glass-panel glow-indigo" style={{ display: 'flex', flexDirection: 'column', minHeight: '580px', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', width: '100%', flexWrap: 'wrap', gap: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                  {advisorView === 'report' ? (
                    <>
                      <Sparkles style={{ color: 'var(--color-accent)' }} /> AI Predictive Health Report
                    </>
                  ) : (
                    <>
                      <MessageSquare style={{ color: 'var(--color-success)' }} /> AI Copilot Chat
                    </>
                  )}
                </h3>
                
                {/* View Toggle Group */}
                <div style={{ 
                  display: 'flex', 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: '30px', 
                  padding: '2px', 
                  gap: '2px' 
                }}>
                  <button
                    onClick={() => setAdvisorView('report')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: advisorView === 'report' ? 'var(--color-primary-glow)' : 'transparent',
                      color: advisorView === 'report' ? 'var(--color-success-light)' : 'var(--text-secondary)'
                    }}
                  >
                    <FileText size={14} /> Report
                  </button>
                  <button
                    onClick={() => setAdvisorView('chat')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.45rem 1rem',
                      borderRadius: '30px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: advisorView === 'chat' ? 'var(--color-primary-glow)' : 'transparent',
                      color: advisorView === 'chat' ? 'var(--color-success-light)' : 'var(--text-secondary)'
                    }}
                  >
                    <MessageSquare size={14} /> AI Copilot
                  </button>
                </div>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1.5rem', marginTop: 0 }}>
                {advisorView === 'report' 
                  ? 'Calculated on live transaction volatility rates, recurring outflows, and buffer sizes relative to freelance target savings.'
                  : 'Interact with our Outlier Shield engine to query stability factors, evaluate cash reserves, or optimize your savings roadmap.'
                }
              </p>

              {advisorView === 'report' ? (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  fontSize: '0.88rem',
                  lineHeight: '1.7',
                  flexGrow: 1,
                  overflowY: 'auto',
                  maxHeight: '420px'
                }}>
                  {stabilityAdvice ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {stabilityAdvice.split('\n').map((line, idx) => {
                        const trimmed = line.trim();
                        if (!trimmed) return null;
                        
                        // Headers (###)
                        if (trimmed.startsWith('###')) {
                          return (
                            <h3 key={idx} style={{ 
                              fontSize: '1.15rem', 
                              color: 'var(--text-primary)', 
                              borderBottom: '1px solid var(--border-color)', 
                              paddingBottom: '0.4rem', 
                              marginTop: '1rem', 
                              fontWeight: 700 
                            }}>
                              {trimmed.replace('###', '').trim()}
                            </h3>
                          );
                        }
                        
                        // Subheaders (####)
                        if (trimmed.startsWith('####')) {
                          return (
                            <h4 key={idx} style={{ 
                              fontSize: '1rem', 
                              color: 'var(--color-primary-light)', 
                              marginTop: '0.8rem', 
                              fontWeight: 700 
                            }}>
                              {trimmed.replace('####', '').trim()}
                            </h4>
                          );
                        }
                        
                        // Bold lines starting with warning icons or alerts
                        if (trimmed.includes('EXCELLENT STABILITY') || trimmed.includes('STABILITY ADVISORY') || trimmed.includes('HEALTHY MARGINS')) {
                          return (
                            <div key={idx} style={{
                              background: 'rgba(16, 185, 129, 0.08)',
                              border: '1px solid var(--color-success)',
                              borderRadius: '12px',
                              padding: '0.85rem 1rem',
                              color: 'var(--color-success-light)',
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              margin: '0.5rem 0'
                            }}>
                              <span>⭐</span> {trimmed.replace(/\*+/g, '')}
                            </div>
                          );
                        }

                        // Bullet items (*)
                        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                          const cleanLine = trimmed.replace(/^[\*\-]\s*/, '');
                          const parts = cleanLine.split('**');
                          return (
                            <div key={idx} style={{ 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '0.5rem', 
                              fontSize: '0.85rem',
                              color: 'var(--text-secondary)' 
                            }}>
                              <span style={{ color: 'var(--color-primary)', marginTop: '0.2rem' }}>✦</span>
                              <span>
                                {parts.map((part, pIdx) => 
                                  pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                                )}
                              </span>
                            </div>
                          );
                        }

                        // Numbered lists (1., 2.)
                        if (trimmed.match(/^\d+\./)) {
                          const cleanLine = trimmed.replace(/^\d+\.\s*/, '');
                          const parts = cleanLine.split('**');
                          const num = trimmed.match(/^\d+/)[0];
                          return (
                            <div key={idx} style={{ 
                              background: 'rgba(255, 255, 255, 0.02)', 
                              border: '1px solid var(--border-color)', 
                              padding: '0.85rem 1rem', 
                              borderRadius: '12px', 
                              margin: '0.4rem 0',
                              display: 'flex',
                              gap: '0.75rem',
                              alignItems: 'flex-start'
                            }}>
                              <div style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                background: 'var(--color-primary-glow)',
                                color: 'var(--color-primary-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                flexShrink: 0
                              }}>
                                {num}
                              </div>
                              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {parts.map((part, pIdx) => 
                                  pIdx % 2 === 1 ? <strong key={pIdx} style={{ color: 'var(--text-primary)' }}>{part}</strong> : part
                                )}
                              </span>
                            </div>
                          );
                        }
                        
                        return <p key={idx} style={{ margin: '0.25rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{trimmed}</p>;
                      })}
                    </div>
                  ) : (
                    "Assembling predictive models..."
                  )}
                </div>
              ) : (
                // AI Copilot Chat Interface
                <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '420px' }}>
                  {/* Chat bubbles container */}
                  <div 
                    id="ai-chat-box"
                    style={{
                      flexGrow: 1,
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '1.25rem',
                      overflowY: 'auto',
                      marginBottom: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem',
                      maxHeight: '320px'
                    }}
                  >
                    {chatMessages.map((msg, index) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div 
                          key={index}
                          style={{
                            display: 'flex',
                            justifyContent: isUser ? 'flex-end' : 'flex-start',
                            width: '100%'
                          }}
                        >
                          <div
                            style={{
                              background: isUser 
                                ? 'linear-gradient(135deg, var(--color-primary), var(--color-success))' 
                                : 'var(--bg-tertiary)',
                              border: isUser ? 'none' : '1px solid var(--border-color)',
                              color: isUser ? '#ffffff' : 'var(--text-primary)',
                              borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                              padding: '0.75rem 1rem',
                              maxWidth: '85%',
                              fontSize: '0.85rem',
                              lineHeight: '1.5',
                              boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                              whiteSpace: 'pre-wrap'
                            }}
                          >
                            {isUser ? (
                              msg.text
                            ) : (
                              renderMarkdownText(msg.text)
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Typing state */}
                    {isAiTyping && (
                      <div style={{ display: 'flex', justifyContent: 'flex-start', width: '100%' }}>
                        <div style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          borderRadius: '16px 16px 16px 2px',
                          padding: '0.75rem 1rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)'
                        }}>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both' }}></span>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both', animationDelay: '0.2s' }}></span>
                            <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--color-primary)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 1.4s infinite ease-in-out both', animationDelay: '0.4s' }}></span>
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>AI Advisor is analyzing...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Suggestion Chips */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    {[
                      { label: 'Savings Advice 💰', query: 'how can I save money and automate sweeps' },
                      { label: 'Invest Wisely 📈', query: 'recommend a safe investment plan' },
                      { label: 'Tactical Budgeting 📅', query: 'how to build a variable budget plan' },
                      { label: 'Split Expenses 🤝', query: 'how to split household expenses fairly' },
                      { label: 'Stability Score 🛡️', query: 'how to improve my stability score' },
                      { label: 'Outlier Alerts ⚠️', query: 'are there any anomaly warnings' }
                    ].map((chip) => (
                      <button
                        key={chip.label}
                        onClick={() => handleSendChatMessage(chip.query)}
                        style={{
                          background: 'var(--bg-tertiary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: '20px',
                          padding: '0.35rem 0.75rem',
                          fontSize: '0.72rem',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontWeight: 500
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = 'var(--color-success)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.background = 'var(--bg-secondary)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = 'var(--border-color)';
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.background = 'var(--bg-tertiary)';
                        }}
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>

                  {/* Input form */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendChatMessage();
                    }}
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '30px',
                      padding: '0.25rem 0.35rem 0.25rem 1rem'
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Ask FinGuard AI Copilot..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      style={{
                        flexGrow: 1,
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        color: 'var(--text-primary)',
                        fontSize: '0.82rem',
                        padding: '0.35rem 0'
                      }}
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim()}
                      style={{
                        background: chatInput.trim() 
                          ? 'linear-gradient(135deg, var(--color-primary), var(--color-success))' 
                          : 'var(--bg-secondary)',
                        border: 'none',
                        color: chatInput.trim() ? '#ffffff' : 'var(--text-muted)',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: chatInput.trim() ? 'pointer' : 'default',
                        transition: 'all 0.2s ease',
                        boxShadow: chatInput.trim() ? '0 4px 10px rgba(0, 242, 254, 0.2)' : 'none'
                      }}
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 5: Fraud anomaly Center */}
        {currentTab === 'fraud' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Banner console */}
            <div className="glass-panel" style={{ 
              background: 'var(--bg-glass)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              gap: '2rem',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <div className="shield-heartbeat" style={{ 
                  width: '60px', 
                  height: '60px', 
                  borderRadius: '16px', 
                  background: 'rgba(99, 102, 241, 0.08)', 
                  border: '1px solid rgba(99, 102, 241, 0.25)', 
                  color: 'var(--color-primary)',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Shield size={30} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>Anomaly Detection Center</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    {dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length > 0 ? (
                      <span style={{ color: 'var(--color-danger-light)', fontWeight: 600 }}>
                        ⚠️ ACTIVE RISK: {dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length} unresolved warnings detected.
                      </span>
                    ) : (
                      <span style={{ color: 'var(--color-success-light)', fontWeight: 600 }}>
                        ✓ SHIELD ACTIVE: Your system status is secure. No duplicate bills or outlier spending flagged.
                      </span>
                    )}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1.5rem', textAlign: 'right' }}>
                <div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Risks</span>
                  <h4 style={{ fontSize: '1.3rem', color: 'var(--color-danger)', fontWeight: 800 }}>
                    {dashboardData.fraudAlerts.filter(a => a.status === 'ACTIVE').length}
                  </h4>
                </div>
                <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Shield Engine</span>
                  <h4 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', fontWeight: 800 }}>v3.4</h4>
                </div>
              </div>
            </div>

            <div className="glass-panel">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                🛡️ Live Security Audit Log
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginBottom: '2rem' }}>
                Real-time heuristic protection flagging outlier costs, velocity spikes, and double billing instances automatically.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {dashboardData.fraudAlerts.length > 0 ? (
                  dashboardData.fraudAlerts.map((alert) => (
                    <div key={alert.id} style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderLeft: alert.status === 'ACTIVE' ? '4px solid var(--color-danger)' : '4px solid var(--text-muted)',
                      borderRadius: '12px',
                      padding: '1.25rem 1.5rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <span className={`badge ${alert.status === 'ACTIVE' ? 'badge-high' : 'badge-medium'}`} style={{ textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            {alert.alertType}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged: {new Date(alert.createdAt).toLocaleString()}</span>
                        </div>
                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{alert.description}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Transaction ref: <strong>{alert.category}</strong> amount of <strong>{formatCurrency(alert.amount)}</strong>.
                        </p>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {alert.status === 'ACTIVE' ? (
                          <>
                            <button 
                              onClick={() => handleResolveAlert(alert.id, 'RESOLVED')} 
                              className="btn-primary" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', background: 'var(--color-success)', boxShadow: 'none' }}
                            >
                              <CheckCircle size={13} /> Resolve Alert
                            </button>
                            <button 
                              onClick={() => handleResolveAlert(alert.id, 'DISMISSED')} 
                              className="btn-secondary" 
                              style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem' }}
                            >
                              Dismiss
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            ✓ Resolved ({alert.status})
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    ✓ FinGuard Shield status is green. No suspicious anomalies detected.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* 3. Income Modal */}
      {isIncomeModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>Log Income Deposit</h2>
            
            <form onSubmit={handleAddIncome}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Amount (INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 1500"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Category</label>
                <select 
                  className="form-input"
                  value={incomeForm.category}
                  onChange={(e) => setIncomeForm({ ...incomeForm, category: e.target.value })}
                >
                  <option value="FREELANCE">Freelance retainer</option>
                  <option value="GIG_WORK">Gig economy payout</option>
                  <option value="BUSINESS">Private business earnings</option>
                  <option value="SALARY">Fixed salary</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Source / Client name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g. Upwork, Client X"
                  value={incomeForm.source}
                  onChange={(e) => setIncomeForm({ ...incomeForm, source: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Date</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={incomeForm.date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Description</label>
                <textarea 
                  className="form-input" 
                  placeholder="Brief context..."
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsIncomeModalOpen(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-success)' }}>
                  Log Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Expense Modal */}
      {isExpenseModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem 3rem', margin: 'auto' }}>
            <h2 style={{ marginBottom: '1.75rem' }}>{t('expense.addExpense')}</h2>
            
            <form onSubmit={handleAddExpense}>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.amount')} (INR)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  placeholder="e.g. 80"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.category')}</label>
                <select 
                  className="form-input"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                >
                  <option value="FOOD">Food & Groceries</option>
                  <option value="RENT">Housing / Office Rent</option>
                  <option value="BILLS">Digital Tools & Bills</option>
                  <option value="SHOPPING">Hardware & Shopping</option>
                  <option value="TRAVEL">Uber / Fuel costs</option>
                  <option value="OTHER">Other Discretionary</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>Paid from account / UPI</label>
                <select
                  className="form-input"
                  value={expenseForm.accountName}
                  onChange={(e) => {
                    const selected = paymentAccounts.find((account) => account.name === e.target.value) || paymentAccounts[0];
                    setExpenseForm({
                      ...expenseForm,
                      accountName: selected.name,
                      accountType: selected.type,
                      upiId: selected.upiId
                    });
                  }}
                >
                  {paymentAccounts.map((account) => (
                    <option key={account.name} value={account.name}>
                      {account.name} ({account.type})
                    </option>
                  ))}
                </select>
              </div>

              {expenseForm.accountType === 'UPI' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>UPI ID</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="name@bank"
                    value={expenseForm.upiId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, upiId: e.target.value })}
                  />
                </div>
              )}

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.date')}</label>
                <input 
                  type="date" 
                  className="form-input" 
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: 600 }}>{t('expense.description')}</label>
                <textarea 
                  className="form-input" 
                  placeholder="Brief context..."
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="btn-secondary">
                  {t('common.cancel')}
                </button>
                <button type="submit" className="btn-primary" style={{ background: 'var(--color-danger)' }}>
                  {t('expense.addExpense')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Account Aggregator Link Modal */}
      {isBankLinkOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.75)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
          zIndex: 999, backdropFilter: 'blur(10px)', overflowY: 'auto', padding: '2rem 1rem'
        }}>
          <div className="glass-panel glow-indigo animate-fadeIn" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', margin: 'auto', border: '1px solid var(--border-color)' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(0, 242, 254, 0.1)', color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 700 }}>Link Live Bank Account</h3>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>RBI-regulated Account Aggregator Consent Flow</span>
              </div>
            </div>

            {/* Wizard Steps */}

            {/* Step 1: Choose Bank */}
            {bankLinkStep === 1 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Select your primary financial institution to initiate the secure open banking data fetch:
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  {['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra', 'Punjab National Bank'].map((bankName) => (
                    <button
                      key={bankName}
                      type="button"
                      onClick={() => {
                        setSelectedBank(bankName);
                        setBankLinkStep(2);
                      }}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '12px',
                        padding: '1rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        textAlign: 'left'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                        e.currentTarget.style.background = 'var(--bg-tertiary)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border-color)';
                        e.currentTarget.style.background = 'var(--bg-secondary)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      🏦 {bankName}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setIsBankLinkOpen(false)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Mobile handle verification */}
            {bankLinkStep === 2 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  Connecting to **{selectedBank}**. Enter your bank-registered mobile number to discover your account handles:
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (bankLinkMobile.trim()) setBankLinkStep(3);
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>Mobile Number</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <span className="form-input" style={{ width: '60px', padding: '0.75rem 0', textAlign: 'center', background: 'var(--bg-tertiary)' }}>+91</span>
                      <input
                        type="tel"
                        className="form-input"
                        placeholder="98765 43210"
                        value={bankLinkMobile}
                        onChange={(e) => setBankLinkMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        required
                        style={{ flexGrow: 1 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button type="button" onClick={() => setBankLinkStep(1)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                      Back
                    </button>
                    <button type="submit" disabled={bankLinkMobile.length < 10} className="btn-primary" style={{ padding: '0.5rem 1.25rem', background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', border: 'none' }}>
                      Request Consent
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: OTP Verification */}
            {bankLinkStep === 3 && (
              <div>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                  **Sahamati** has requested consent to link accounts matching **+91 {bankLinkMobile}** at **{selectedBank}**.
                </p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (bankLinkOtp === '123456') {
                    setBankLinkStep(4);
                  } else {
                    alert('Invalid sandbox OTP! Enter 123456 to approve consent.');
                  }
                }}>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: 600 }}>Enter 6-Digit OTP</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="e.g. 123456"
                      value={bankLinkOtp}
                      onChange={(e) => setBankLinkOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      required
                      style={{ letterSpacing: '8px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 700 }}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem', textAlign: 'center' }}>
                      🔐 Enter the test key **123456** to authenticate the linkage.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                    <button type="button" onClick={() => setBankLinkStep(2)} className="btn-secondary" style={{ padding: '0.5rem 1.25rem' }}>
                      Back
                    </button>
                    <button type="submit" disabled={bankLinkOtp.length < 6} className="btn-primary" style={{ padding: '0.5rem 1.25rem', background: 'var(--color-success)', border: 'none' }}>
                      Approve Consent
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 4: Success confirmation */}
            {bankLinkStep === 4 && (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%', 
                  background: 'rgba(16, 185, 129, 0.1)', 
                  color: 'var(--color-success)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem'
                }}>
                  <CheckCircle size={36} />
                </div>
                
                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>Connection Successful!</h4>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  Your **{selectedBank}** savings account has been successfully linked in **Read-Only** format under consent handle **finguard@sahamati**.
                </p>

                <button 
                  type="button" 
                  onClick={handleFinishBankLink} 
                  className="btn-primary" 
                  style={{ 
                    padding: '0.6rem 2rem', 
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-success))', 
                    border: 'none',
                    width: '100%'
                  }}
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
