const {
  useState,
  useEffect,
  useRef
} = React;
function AdminApp() {
  // Current Active Tab
  const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, orders, menu, categories, groups, coupons, customers, analytics, audit, settings
  const [restaurant, setRestaurant] = useState(window.__RESTAURANT__ || {});

  // Notification toast
  const [toast, setToast] = useState(null);
  const notify = (msg, type = 'success') => {
    setToast({
      msg,
      type
    });
    setTimeout(() => setToast(null), 3500);
  };

  // Dashboard State
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderDateFilter, setOrderDateFilter] = useState('today'); // today, tomorrow, upcoming, all
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Menu State
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [dishModal, setDishModal] = useState(null); // 'create' or dish object
  const [dishForm, setDishForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    discounted_price: '',
    image: '',
    preparation_time: 15,
    vegetarian: true,
    ingredients: '',
    allergens: '',
    spice_level: 1,
    available: true,
    featured: false,
    popular: false,
    customization_group_ids: []
  });

  // Categories State
  const [categories, setCategories] = useState([]);
  const [categoryModal, setCategoryModal] = useState(null); // 'create' or object
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    description: '',
    image: '',
    display_order: 0,
    active: true
  });

  // Customization Groups State
  const [customGroups, setCustomGroups] = useState([]);
  const [groupModal, setGroupModal] = useState(null);
  const [groupForm, setGroupForm] = useState({
    name: '',
    description: '',
    required: false,
    min_selection: 0,
    max_selection: 1,
    options: [{
      name: '',
      additional_price: 0
    }]
  });

  // Coupons State
  const [coupons, setCoupons] = useState([]);
  const [couponModal, setCouponModal] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 20,
    minimum_order: 300,
    maximum_discount: 150,
    start_date: '',
    expiry_date: '',
    usage_limit: 500,
    active: true
  });

  // Customers State
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const chartRef = useRef(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);

  // Settings State
  const [settingsForm, setSettingsForm] = useState(null);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Load Tab Data
  useEffect(() => {
    if (currentTab === 'dashboard') loadDashboard();
    if (currentTab === 'orders') loadOrders();
    if (currentTab === 'menu') {
      loadMenuItems();
      loadCategories();
      loadCustomGroups();
    }
    if (currentTab === 'categories') loadCategories();
    if (currentTab === 'groups') loadCustomGroups();
    if (currentTab === 'coupons') loadCoupons();
    if (currentTab === 'customers') loadCustomers();
    if (currentTab === 'analytics') loadAnalytics();
    if (currentTab === 'audit') loadAuditLogs();
    if (currentTab === 'settings') loadSettings();
  }, [currentTab]);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // API Loaders
  const loadDashboard = () => {
    setLoadingDashboard(true);
    fetch('/api/admin/dashboard').then(res => res.json()).then(data => {
      setLoadingDashboard(false);
      if (data.success) setDashboardData(data);
    });
  };
  const loadOrders = () => {
    setOrdersLoading(true);
    let url = `/api/admin/orders?date_filter=${orderDateFilter}&status=${orderStatusFilter}&payment_status=${orderPaymentFilter}`;
    if (orderSearch) url += `&search=${encodeURIComponent(orderSearch)}`;
    fetch(url).then(res => res.json()).then(data => {
      setOrdersLoading(false);
      if (data.success) setOrders(data.orders.data || []);
    });
  };
  useEffect(() => {
    if (currentTab === 'orders') loadOrders();
  }, [orderDateFilter, orderStatusFilter, orderPaymentFilter]);
  const loadMenuItems = () => {
    setMenuLoading(true);
    fetch('/api/admin/menu-items').then(res => res.json()).then(data => {
      setMenuLoading(false);
      if (data.success) setMenuItems(data.menu_items || []);
    });
  };
  const loadCategories = () => {
    fetch('/api/admin/categories').then(res => res.json()).then(data => {
      if (data.success) setCategories(data.categories || []);
    });
  };
  const loadCustomGroups = () => {
    fetch('/api/admin/customization-groups').then(res => res.json()).then(data => {
      if (data.success) setCustomGroups(data.groups || []);
    });
  };
  const loadCoupons = () => {
    fetch('/api/admin/coupons').then(res => res.json()).then(data => {
      if (data.success) setCoupons(data.coupons || []);
    });
  };
  const loadCustomers = () => {
    setCustomersLoading(true);
    fetch('/api/admin/customers').then(res => res.json()).then(data => {
      setCustomersLoading(false);
      if (data.success) setCustomers(data.customers.data || []);
    });
  };
  const loadAnalytics = () => {
    fetch('/api/admin/analytics').then(res => res.json()).then(data => {
      if (data.success) {
        setAnalyticsData(data);
        renderChart(data);
      }
    });
  };
  const renderChart = data => {
    setTimeout(() => {
      const ctx = document.getElementById('analyticsChart');
      if (!ctx) return;
      if (chartRef.current) chartRef.current.destroy();
      chartRef.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.charts.labels,
          datasets: [{
            label: 'Daily Sales (₹)',
            data: data.charts.sales_trend,
            borderColor: '#ea580c',
            backgroundColor: 'rgba(234, 88, 12, 0.1)',
            fill: true,
            tension: 0.3
          }, {
            label: 'Orders Count',
            data: data.charts.orders_trend,
            borderColor: '#3b82f6',
            borderDash: [5, 5],
            tension: 0.3,
            yAxisID: 'y1'
          }]
        },
        options: {
          responsive: true,
          interaction: {
            mode: 'index',
            intersect: false
          },
          scales: {
            y: {
              type: 'linear',
              display: true,
              position: 'left',
              title: {
                display: true,
                text: 'Revenue (₹)'
              }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Orders'
              }
            }
          }
        }
      });
    }, 100);
  };
  const loadAuditLogs = () => {
    fetch('/api/admin/audit-logs').then(res => res.json()).then(data => {
      if (data.success) setAuditLogs(data.logs.data || []);
    });
  };
  const loadSettings = () => {
    fetch('/api/admin/settings').then(res => res.json()).then(data => {
      if (data.success) {
        setSettingsForm({
          ...data.restaurant,
          hours: data.hours,
          time_slots: data.time_slots
        });
      }
    });
  };

  // Status Update Action
  const handleUpdateOrderStatus = (orderId, newStatus) => {
    fetch(`/api/admin/orders/${orderId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        status: newStatus
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        notify(`Order updated to ${newStatus}`);
        loadOrders();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.order);
        }
      } else {
        alert(data.message || 'Error updating order');
      }
    });
  };

  // Dish Form Submit
  const handleDishSubmit = e => {
    e.preventDefault();
    const isEdit = dishModal && typeof dishModal === 'object';
    const url = isEdit ? `/api/admin/menu-items/${dishModal.id}` : '/api/admin/menu-items';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(dishForm)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        notify(data.message);
        setDishModal(null);
        loadMenuItems();
      } else {
        alert(data.message || 'Error saving dish');
      }
    });
  };
  const handleDeleteDish = id => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    fetch(`/api/admin/menu-items/${id}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      }
    }).then(res => res.json()).then(data => {
      notify(data.message);
      loadMenuItems();
    });
  };

  // Category Submit
  const handleCategorySubmit = e => {
    e.preventDefault();
    const isEdit = categoryModal && typeof categoryModal === 'object';
    const url = isEdit ? `/api/admin/categories/${categoryModal.id}` : '/api/admin/categories';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(categoryForm)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        notify(data.message);
        setCategoryModal(null);
        loadCategories();
      }
    });
  };

  // Custom Group Submit
  const handleGroupSubmit = e => {
    e.preventDefault();
    const isEdit = groupModal && typeof groupModal === 'object';
    const url = isEdit ? `/api/admin/customization-groups/${groupModal.id}` : '/api/admin/customization-groups';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(groupForm)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        notify(data.message);
        setGroupModal(null);
        loadCustomGroups();
      }
    });
  };

  // Coupon Submit
  const handleCouponSubmit = e => {
    e.preventDefault();
    const isEdit = couponModal && typeof couponModal === 'object';
    const url = isEdit ? `/api/admin/coupons/${couponModal.id}` : '/api/admin/coupons';
    const method = isEdit ? 'PUT' : 'POST';
    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(couponForm)
    }).then(res => res.json()).then(data => {
      if (data.success) {
        notify(data.message);
        setCouponModal(null);
        loadCoupons();
      }
    });
  };

  // Settings Submit
  const handleSettingsSubmit = e => {
    e.preventDefault();
    setSettingsSaving(true);
    fetch('/api/admin/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(settingsForm)
    }).then(res => res.json()).then(data => {
      setSettingsSaving(false);
      if (data.success) {
        notify('Settings and operating hours updated successfully.');
        setRestaurant(data.restaurant);
      } else {
        alert(data.message || 'Error saving settings');
      }
    });
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-stone-100 flex flex-col md:flex-row font-sans"
  }, /*#__PURE__*/React.createElement("aside", {
    className: "w-full md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-stone-800 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white text-base"
  }, "S"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h2", {
    className: "text-sm font-bold text-white tracking-wide"
  }, "ADMIN CONSOLE"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-400"
  }, "Spice & Hearth Operations")))), /*#__PURE__*/React.createElement("nav", {
    className: "p-3 space-y-1 text-xs font-semibold"
  }, [{
    key: 'dashboard',
    label: 'Executive Overview',
    icon: 'layout-dashboard'
  }, {
    key: 'orders',
    label: 'Order Management',
    icon: 'clipboard-list'
  }, {
    key: 'menu',
    label: 'Menu & Dishes',
    icon: 'utensils'
  }, {
    key: 'categories',
    label: 'Food Categories',
    icon: 'folder-tree'
  }, {
    key: 'groups',
    label: 'Customization Groups',
    icon: 'sliders'
  }, {
    key: 'coupons',
    label: 'Coupons & Promos',
    icon: 'tag'
  }, {
    key: 'customers',
    label: 'Customer Directory',
    icon: 'users'
  }, {
    key: 'analytics',
    label: 'Sales & Analytics',
    icon: 'trending-up'
  }, {
    key: 'audit',
    label: 'Security Audit Log',
    icon: 'shield-alert'
  }, {
    key: 'settings',
    label: 'Restaurant Settings',
    icon: 'settings'
  }].map(item => /*#__PURE__*/React.createElement("button", {
    key: item.key,
    onClick: () => setCurrentTab(item.key),
    className: `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${currentTab === item.key ? 'bg-orange-600 text-white shadow-md' : 'text-stone-400 hover:text-white hover:bg-stone-800/80'}`
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": item.icon,
    className: "w-4 h-4 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, item.label))))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 border-t border-stone-800 space-y-2 text-xs"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/kitchen",
    className: "flex items-center justify-between p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold transition border border-stone-700"
  }, /*#__PURE__*/React.createElement("span", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "tv",
    className: "w-4 h-4"
  }), " Kitchen Display"), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "external-link",
    className: "w-3.5 h-3.5"
  })), /*#__PURE__*/React.createElement("a", {
    href: "/",
    className: "flex items-center justify-between p-2 text-stone-400 hover:text-white transition"
  }, /*#__PURE__*/React.createElement("span", null, "Customer Website"), /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-up-right",
    className: "w-3.5 h-3.5"
  })))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 p-6 lg:p-8 overflow-y-auto"
  }, currentTab === 'dashboard' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Today's Kitchen Overview"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Live operational snapshot for ", new Date().toLocaleDateString())), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: loadDashboard,
    className: "px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "refresh-cw",
    className: "w-3.5 h-3.5"
  }), " Refresh"), /*#__PURE__*/React.createElement("a", {
    href: "/kitchen",
    className: "px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flame",
    className: "w-3.5 h-3.5"
  }), " Open Kitchen KDS"))), dashboardData && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 lg:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase tracking-wider"
  }, "Today's Revenue"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-stone-900"
  }, "\u20B9", dashboardData.metrics.today_revenue), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-emerald-600 font-medium"
  }, dashboardData.metrics.today_orders_count, " orders today")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase tracking-wider"
  }, "Currently In Prep"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-amber-600"
  }, dashboardData.metrics.preparing_count), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, "Actively on embers/hearth")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase tracking-wider"
  }, "Ready for Arrival"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-emerald-600"
  }, dashboardData.metrics.ready_count), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, "Plated & waiting for customer")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase tracking-wider"
  }, "Upcoming Bookings"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-orange-600"
  }, dashboardData.metrics.upcoming_count), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, "Reserved for future slots"))), /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-12 gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-4 h-4 text-orange-600"
  }), " Today's Schedule by Arrival Slot"), dashboardData?.orders_by_time_slot.length === 0 ? /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400 py-6 text-center"
  }, "No orders scheduled for today yet.") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, dashboardData?.orders_by_time_slot.map(slot => /*#__PURE__*/React.createElement("div", {
    key: slot.arrival_time,
    className: "flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-orange-600 text-sm"
  }, slot.arrival_time), /*#__PURE__*/React.createElement("span", {
    className: "text-stone-600"
  }, "Peak dining window")), /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-900 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-sm"
  }, slot.count, " ", slot.count === 1 ? 'Order' : 'Orders'))))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flame",
    className: "w-4 h-4 text-orange-600"
  }), " Most Ordered Dishes"), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-stone-100 text-xs"
  }, dashboardData?.popular_dishes.map((dish, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "py-2.5 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px]"
  }, i + 1), /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-stone-800"
  }, dish.item_name)), /*#__PURE__*/React.createElement("div", {
    className: "text-right"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-900"
  }, dish.total_sold, " sold"), /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-stone-400"
  }, "\u20B9", dish.total_revenue)))))))), currentTab === 'orders' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Pre-Order Operations"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Monitor, filter, and transition dining orders"))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative flex-1 min-w-[200px]"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search",
    className: "w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search order #, customer name, phone...",
    value: orderSearch,
    onChange: e => setOrderSearch(e.target.value),
    onKeyDown: e => e.key === 'Enter' && loadOrders(),
    className: "w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
  })), /*#__PURE__*/React.createElement("select", {
    value: orderDateFilter,
    onChange: e => setOrderDateFilter(e.target.value),
    className: "px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "today"
  }, "Today's Orders"), /*#__PURE__*/React.createElement("option", {
    value: "tomorrow"
  }, "Tomorrow's Orders"), /*#__PURE__*/React.createElement("option", {
    value: "upcoming"
  }, "All Upcoming"), /*#__PURE__*/React.createElement("option", {
    value: "past"
  }, "Past Orders"), /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All Dates")), /*#__PURE__*/React.createElement("select", {
    value: orderStatusFilter,
    onChange: e => setOrderStatusFilter(e.target.value),
    className: "px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All Statuses"), /*#__PURE__*/React.createElement("option", {
    value: "pending"
  }, "Pending"), /*#__PURE__*/React.createElement("option", {
    value: "confirmed"
  }, "Confirmed"), /*#__PURE__*/React.createElement("option", {
    value: "preparing"
  }, "Preparing"), /*#__PURE__*/React.createElement("option", {
    value: "ready"
  }, "Ready"), /*#__PURE__*/React.createElement("option", {
    value: "completed"
  }, "Completed"), /*#__PURE__*/React.createElement("option", {
    value: "cancelled"
  }, "Cancelled")), /*#__PURE__*/React.createElement("select", {
    value: orderPaymentFilter,
    onChange: e => setOrderPaymentFilter(e.target.value),
    className: "px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All Payments"), /*#__PURE__*/React.createElement("option", {
    value: "paid"
  }, "Paid"), /*#__PURE__*/React.createElement("option", {
    value: "unpaid"
  }, "Unpaid (Counter)"), /*#__PURE__*/React.createElement("option", {
    value: "refunded"
  }, "Refunded")))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Order #"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Customer"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Arrival Schedule"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Items"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Total"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Payment"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-stone-100 text-stone-700"
  }, ordersLoading ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "p-8 text-center text-stone-400"
  }, "Loading orders...")) : orders.length === 0 ? /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("td", {
    colSpan: "8",
    className: "p-8 text-center text-stone-400"
  }, "No orders found for this filter.")) : orders.map(order => /*#__PURE__*/React.createElement("tr", {
    key: order.id,
    className: "hover:bg-stone-50/70 transition"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-mono font-bold text-stone-900"
  }, /*#__PURE__*/React.createElement("a", {
    href: `/track/${order.order_number}`,
    target: "_blank",
    className: "hover:text-orange-600 underline"
  }, order.order_number), /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-stone-400 uppercase font-sans font-semibold"
  }, order.dining_option === 'dine_in' ? 'Dine-In' : 'Takeaway')), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "text-stone-900 block"
  }, order.customer_name), /*#__PURE__*/React.createElement("span", {
    className: "text-stone-400 text-[11px]"
  }, order.customer_phone)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-orange-600 block"
  }, order.arrival_time), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-stone-400"
  }, order.arrival_date)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, order.items?.length || 0, " dishes"), /*#__PURE__*/React.createElement("span", {
    className: "block text-[11px] text-stone-400 truncate max-w-[150px]"
  }, order.items?.map(i => i.item_name).join(', '))), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-bold text-stone-900"
  }, "\u20B9", order.final_total), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'completed' ? 'bg-stone-200 text-stone-800' : order.order_status === 'ready' ? 'bg-emerald-100 text-emerald-800' : order.order_status === 'preparing' ? 'bg-amber-100 text-amber-800' : order.order_status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'}`
  }, order.order_status)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`
  }, order.payment_status)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right space-x-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedOrder(order),
    className: "px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
  }, "Details")))))))), selectedOrder && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, "Order Details: ", selectedOrder.order_number), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400"
  }, "Placed on ", new Date(selectedOrder.created_at).toLocaleString())), /*#__PURE__*/React.createElement("button", {
    onClick: () => setSelectedOrder(null),
    className: "w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 rounded-2xl bg-orange-50 border border-orange-200 flex justify-between items-center text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-orange-950 block"
  }, "Arrival: ", selectedOrder.arrival_date, " @ ", selectedOrder.arrival_time), /*#__PURE__*/React.createElement("span", {
    className: "text-stone-600 uppercase font-semibold"
  }, "Dining: ", selectedOrder.dining_option)), /*#__PURE__*/React.createElement("span", {
    className: "text-orange-700 font-bold bg-white px-3 py-1 rounded-xl shadow-sm"
  }, "Status: ", selectedOrder.order_status.toUpperCase())), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 border-t border-stone-100 pt-3 text-xs"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-bold text-stone-900 uppercase"
  }, "Ordered Dishes"), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-stone-100 max-h-48 overflow-y-auto"
  }, selectedOrder.items?.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    className: "py-2 flex justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-800"
  }, it.quantity, " \xD7 ", it.item_name), it.customization_data && it.customization_data.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-400"
  }, it.customization_data.map(c => c.option).join(', '))), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-stone-800"
  }, "\u20B9", it.total_price))))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200"
  }, /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Customer:"), " ", selectedOrder.customer_name, " (", selectedOrder.customer_phone, ")"), /*#__PURE__*/React.createElement("p", null, /*#__PURE__*/React.createElement("strong", null, "Email:"), " ", selectedOrder.customer_email), selectedOrder.customer_notes && /*#__PURE__*/React.createElement("p", {
    className: "text-amber-800 font-medium"
  }, /*#__PURE__*/React.createElement("strong", null, "Notes:"), " ", selectedOrder.customer_notes)), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 pt-2 border-t border-stone-100 text-xs"
  }, /*#__PURE__*/React.createElement("label", {
    className: "font-bold text-stone-900 block uppercase"
  }, "Change Order Status"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 sm:grid-cols-5 gap-1.5"
  }, ['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(st => /*#__PURE__*/React.createElement("button", {
    key: st,
    onClick: () => handleUpdateOrderStatus(selectedOrder.id, st),
    className: `py-2 px-1 rounded-xl font-bold uppercase text-[10px] transition ${selectedOrder.order_status === st ? 'bg-orange-600 text-white shadow' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`
  }, st))))))), currentTab === 'menu' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Menu & Dish Management"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Add, edit prices, descriptions, and dietary properties of dishes")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setDishForm({
        category_id: categories[0]?.id || '',
        name: '',
        description: '',
        price: '',
        discounted_price: '',
        image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=600&q=80',
        preparation_time: 15,
        vegetarian: true,
        ingredients: '',
        allergens: '',
        spice_level: 1,
        available: true,
        featured: false,
        popular: false,
        customization_group_ids: []
      });
      setDishModal('create');
    },
    className: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-4 h-4"
  }), " Add New Dish")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "overflow-x-auto"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Dish"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Category"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Price"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Dietary"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Prep Time"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Status"), /*#__PURE__*/React.createElement("th", {
    className: "p-4 text-right"
  }, "Actions"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-stone-100 text-stone-700"
  }, menuItems.map(item => /*#__PURE__*/React.createElement("tr", {
    key: item.id,
    className: "hover:bg-stone-50/70 transition"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: item.image,
    alt: item.name,
    className: "w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("strong", {
    className: "text-stone-900 block font-bold"
  }, item.name), /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] text-stone-400 line-clamp-1"
  }, item.description)))), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-semibold text-stone-600"
  }, item.category?.name || 'Unassigned'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-900"
  }, "\u20B9", item.price), item.discounted_price && /*#__PURE__*/React.createElement("span", {
    className: "block text-[10px] text-emerald-600 font-semibold"
  }, "Discount: \u20B9", item.discounted_price)), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-0.5 rounded text-[10px] font-bold ${item.vegetarian ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`
  }, item.vegetarian ? 'Veg' : 'Non-Veg')), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, item.preparation_time, " mins"), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-0.5 rounded text-[10px] font-bold ${item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`
  }, item.available ? 'Available' : 'Sold Out')), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-right space-x-1.5"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setDishForm({
        category_id: item.category_id,
        name: item.name,
        description: item.description || '',
        price: item.price,
        discounted_price: item.discounted_price || '',
        image: item.image || '',
        preparation_time: item.preparation_time,
        vegetarian: item.vegetarian,
        ingredients: item.ingredients || '',
        allergens: item.allergens || '',
        spice_level: item.spice_level,
        available: item.available,
        featured: item.featured,
        popular: item.popular,
        customization_group_ids: item.customization_groups?.map(g => g.id) || []
      });
      setDishModal(item);
    },
    className: "px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
  }, "Edit"), /*#__PURE__*/React.createElement("button", {
    onClick: () => handleDeleteDish(item.id),
    className: "px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold"
  }, "Delete")))))))), dishModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, typeof dishModal === 'object' ? `Edit Dish: ${dishModal.name}` : 'Create New Menu Item'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDishModal(null),
    className: "w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleDishSubmit,
    className: "space-y-4 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Dish Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: dishForm.name,
    onChange: e => setDishForm({
      ...dishForm,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Category *"), /*#__PURE__*/React.createElement("select", {
    value: dishForm.category_id,
    onChange: e => setDishForm({
      ...dishForm,
      category_id: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }, categories.map(c => /*#__PURE__*/React.createElement("option", {
    key: c.id,
    value: c.id
  }, c.name))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Description"), /*#__PURE__*/React.createElement("textarea", {
    rows: "2",
    value: dishForm.description,
    onChange: e => setDishForm({
      ...dishForm,
      description: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Regular Price (\u20B9) *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    required: true,
    value: dishForm.price,
    onChange: e => setDishForm({
      ...dishForm,
      price: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Discounted Price (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    value: dishForm.discounted_price,
    onChange: e => setDishForm({
      ...dishForm,
      discounted_price: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Prep Time (mins) *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    required: true,
    value: dishForm.preparation_time,
    onChange: e => setDishForm({
      ...dishForm,
      preparation_time: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Dish Image URL"), /*#__PURE__*/React.createElement("input", {
    type: "url",
    value: dishForm.image,
    onChange: e => setDishForm({
      ...dishForm,
      image: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Dietary Flag"), /*#__PURE__*/React.createElement("select", {
    value: dishForm.vegetarian ? '1' : '0',
    onChange: e => setDishForm({
      ...dishForm,
      vegetarian: e.target.value === '1'
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }, /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "Vegetarian"), /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "Non-Vegetarian"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Spice Level"), /*#__PURE__*/React.createElement("select", {
    value: dishForm.spice_level,
    onChange: e => setDishForm({
      ...dishForm,
      spice_level: parseInt(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }, /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "0 - None / Mild"), /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "1 - Mildly Spiced"), /*#__PURE__*/React.createElement("option", {
    value: "2"
  }, "2 - Medium Spicy"), /*#__PURE__*/React.createElement("option", {
    value: "3"
  }, "3 - Fiery Hot")))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Assign Customization Groups (Sizes, Add-ons, Crusts)"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-stone-50 border rounded-xl max-h-32 overflow-y-auto"
  }, customGroups.map(grp => /*#__PURE__*/React.createElement("label", {
    key: grp.id,
    className: "flex items-center gap-2 cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: dishForm.customization_group_ids.includes(grp.id),
    onChange: e => {
      if (e.target.value) {
        const cur = dishForm.customization_group_ids;
        const updated = cur.includes(grp.id) ? cur.filter(id => id !== grp.id) : [...cur, grp.id];
        setDishForm({
          ...dishForm,
          customization_group_ids: updated
        });
      }
    },
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, grp.name))))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4 pt-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1.5 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: dishForm.available,
    onChange: e => setDishForm({
      ...dishForm,
      available: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Available")), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1.5 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: dishForm.popular,
    onChange: e => setDishForm({
      ...dishForm,
      popular: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Popular Badge")), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-1.5 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: dishForm.featured,
    onChange: e => setDishForm({
      ...dishForm,
      featured: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Featured"))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-3 border-t"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setDishModal(null),
    className: "px-4 py-2 border rounded-xl font-semibold"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
  }, "Save Dish")))))), currentTab === 'categories' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Menu Categories"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Create, rename, reorder, and manage food categories")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCategoryForm({
        name: '',
        description: '',
        image: '',
        display_order: categories.length + 1,
        active: true
      });
      setCategoryModal('create');
    },
    className: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-4 h-4"
  }), " Add Category")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, categories.map(cat => /*#__PURE__*/React.createElement("div", {
    key: cat.id,
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 text-base"
  }, cat.name), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-stone-400 font-semibold"
  }, cat.menu_items_count || 0, " items")), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500 leading-relaxed"
  }, cat.description || 'No description provided.')), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-3 border-t border-stone-100 text-xs"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCategoryForm({
        name: cat.name,
        description: cat.description || '',
        image: cat.image || '',
        display_order: cat.display_order,
        active: cat.active
      });
      setCategoryModal(cat);
    },
    className: "px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold"
  }, "Edit"))))), categoryModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, typeof categoryModal === 'object' ? 'Edit Category' : 'Create Category'), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCategorySubmit,
    className: "space-y-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Category Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: categoryForm.name,
    onChange: e => setCategoryForm({
      ...categoryForm,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Description"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: categoryForm.description,
    onChange: e => setCategoryForm({
      ...categoryForm,
      description: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-3 border-t"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCategoryModal(null),
    className: "px-4 py-2 border rounded-xl font-semibold"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
  }, "Save Category")))))), currentTab === 'groups' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Customization Groups & Options"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Configure add-ons, portion sizes, crust types, and toppings")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setGroupForm({
        name: '',
        description: '',
        required: false,
        min_selection: 0,
        max_selection: 1,
        options: [{
          name: '',
          additional_price: 0
        }]
      });
      setGroupModal('create');
    },
    className: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-4 h-4"
  }), " Add Group")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 gap-4"
  }, customGroups.map(grp => /*#__PURE__*/React.createElement("div", {
    key: grp.id,
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 text-base"
  }, grp.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400"
  }, grp.required ? 'Mandatory choice' : 'Optional add-on')), /*#__PURE__*/React.createElement("span", {
    className: "text-xs bg-stone-100 px-2 py-0.5 rounded font-mono"
  }, "Max ", grp.max_selection)), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5 text-xs"
  }, /*#__PURE__*/React.createElement("strong", {
    className: "text-stone-500 uppercase text-[10px]"
  }, "Options:"), grp.options && grp.options.map(opt => /*#__PURE__*/React.createElement("div", {
    key: opt.id,
    className: "flex justify-between p-2 rounded-lg bg-stone-50 border border-stone-100"
  }, /*#__PURE__*/React.createElement("span", null, opt.name), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, opt.additional_price > 0 ? `+₹${opt.additional_price}` : 'Free'))))))), groupModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, "Create Customization Group"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleGroupSubmit,
    className: "space-y-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Group Name *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "e.g. Cheese Selection, Size, Extra Dips",
    value: groupForm.name,
    onChange: e => setGroupForm({
      ...groupForm,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: groupForm.required,
    onChange: e => setGroupForm({
      ...groupForm,
      required: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Selection Required")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Max Options Selectable"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    min: "1",
    value: groupForm.max_selection,
    onChange: e => setGroupForm({
      ...groupForm,
      max_selection: parseInt(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2 border-t pt-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between items-center"
  }, /*#__PURE__*/React.createElement("label", {
    className: "font-bold text-stone-700"
  }, "Options"), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setGroupForm({
      ...groupForm,
      options: [...groupForm.options, {
        name: '',
        additional_price: 0
      }]
    }),
    className: "text-orange-600 hover:underline font-bold"
  }, "+ Add Option")), groupForm.options.map((opt, oi) => /*#__PURE__*/React.createElement("div", {
    key: oi,
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "Option name",
    value: opt.name,
    onChange: e => {
      const copy = [...groupForm.options];
      copy[oi].name = e.target.value;
      setGroupForm({
        ...groupForm,
        options: copy
      });
    },
    className: "flex-1 px-3 py-1.5 border rounded-xl"
  }), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.01",
    placeholder: "Price (+\u20B9)",
    value: opt.additional_price,
    onChange: e => {
      const copy = [...groupForm.options];
      copy[oi].additional_price = parseFloat(e.target.value) || 0;
      setGroupForm({
        ...groupForm,
        options: copy
      });
    },
    className: "w-24 px-3 py-1.5 border rounded-xl"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-3 border-t"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setGroupModal(null),
    className: "px-4 py-2 border rounded-xl font-semibold"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
  }, "Save Group")))))), currentTab === 'coupons' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Coupons & Promo Codes"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Create discount codes for pre-orders with minimum cart thresholds")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 20,
        minimum_order: 300,
        maximum_discount: 150,
        start_date: '',
        expiry_date: '',
        usage_limit: 500,
        active: true
      });
      setCouponModal('create');
    },
    className: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-4 h-4"
  }), " Create Coupon")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  }, coupons.map(cpn => /*#__PURE__*/React.createElement("div", {
    key: cpn.id,
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono font-bold text-orange-600 text-base"
  }, cpn.code), /*#__PURE__*/React.createElement("span", {
    className: `px-2 py-0.5 rounded text-[10px] font-bold ${cpn.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`
  }, cpn.active ? 'Active' : 'Inactive')), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-700 font-semibold"
  }, cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} FLAT OFF`), /*#__PURE__*/React.createElement("div", {
    className: "text-[11px] text-stone-500 space-y-0.5"
  }, /*#__PURE__*/React.createElement("p", null, "Min Order: \u20B9", cpn.minimum_order), cpn.maximum_discount && /*#__PURE__*/React.createElement("p", null, "Max Discount: \u20B9", cpn.maximum_discount), /*#__PURE__*/React.createElement("p", null, "Used: ", cpn.times_used, " ", cpn.usage_limit ? `/ ${cpn.usage_limit}` : ''))))), couponModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, "Create Promotional Coupon"), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCouponSubmit,
    className: "space-y-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Coupon Code *"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "e.g. FESTIVE30",
    value: couponForm.code,
    onChange: e => setCouponForm({
      ...couponForm,
      code: e.target.value.toUpperCase()
    }),
    className: "w-full px-3 py-2 border rounded-xl font-mono uppercase"
  })), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Discount Type"), /*#__PURE__*/React.createElement("select", {
    value: couponForm.discount_type,
    onChange: e => setCouponForm({
      ...couponForm,
      discount_type: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }, /*#__PURE__*/React.createElement("option", {
    value: "percentage"
  }, "Percentage (%)"), /*#__PURE__*/React.createElement("option", {
    value: "fixed"
  }, "Fixed Amount (\u20B9)"))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Discount Value *"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    required: true,
    value: couponForm.discount_value,
    onChange: e => setCouponForm({
      ...couponForm,
      discount_value: parseFloat(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-3"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Min Order Amount (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: couponForm.minimum_order,
    onChange: e => setCouponForm({
      ...couponForm,
      minimum_order: parseFloat(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Max Cap (\u20B9)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: couponForm.maximum_discount || '',
    onChange: e => setCouponForm({
      ...couponForm,
      maximum_discount: parseFloat(e.target.value) || null
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-3 border-t"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => setCouponModal(null),
    className: "px-4 py-2 border rounded-xl font-semibold"
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    className: "px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold"
  }, "Save Coupon")))))), currentTab === 'customers' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Customer Management"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Registered diners, order history, and lifetime spending")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Customer Name"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Email"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Phone"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Total Orders"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Total Spending"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Member Since"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-stone-100 text-stone-700"
  }, customers.map(cust => /*#__PURE__*/React.createElement("tr", {
    key: cust.id,
    className: "hover:bg-stone-50/70 transition"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-bold text-stone-900"
  }, cust.name), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-600"
  }, cust.email), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-600"
  }, cust.phone || 'N/A'), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-semibold"
  }, cust.orders_count || 0, " orders"), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-bold text-orange-600"
  }, "\u20B9", cust.orders_sum_final_total || 0), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-400"
  }, new Date(cust.created_at).toLocaleDateString()))))))), currentTab === 'analytics' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Sales & Pre-Order Analytics"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Performance metrics over the last 14 days")), analyticsData && /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-3 gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase"
  }, "Average Order Value"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-stone-900"
  }, "\u20B9", analyticsData.average_order_value)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase"
  }, "First-Time Diners"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-orange-600"
  }, analyticsData.retention.first_time)), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-stone-400 uppercase"
  }, "Repeat Loyal Diners"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-bold text-emerald-600"
  }, analyticsData.retention.repeat))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-stone-900 uppercase"
  }, "14-Day Sales Trend & Volume"), /*#__PURE__*/React.createElement("div", {
    className: "h-80 w-full"
  }, /*#__PURE__*/React.createElement("canvas", {
    id: "analyticsChart"
  })))), currentTab === 'audit' && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Admin Audit Logs"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Audit trail recording dish modifications, order status shifts, and policy alterations")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden"
  }, /*#__PURE__*/React.createElement("table", {
    className: "w-full text-left text-xs"
  }, /*#__PURE__*/React.createElement("thead", {
    className: "bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Timestamp"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "User"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Action"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Entity"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "Details"), /*#__PURE__*/React.createElement("th", {
    className: "p-4"
  }, "IP Address"))), /*#__PURE__*/React.createElement("tbody", {
    className: "divide-y divide-stone-100 text-stone-700"
  }, auditLogs.map(log => /*#__PURE__*/React.createElement("tr", {
    key: log.id,
    className: "hover:bg-stone-50/70 transition"
  }, /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-mono text-[11px] text-stone-400"
  }, new Date(log.created_at).toLocaleString()), /*#__PURE__*/React.createElement("td", {
    className: "p-4 font-bold text-stone-900"
  }, log.user_name || 'System'), /*#__PURE__*/React.createElement("td", {
    className: "p-4"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-mono bg-stone-100 px-2 py-0.5 rounded text-[11px] font-semibold"
  }, log.action)), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-600"
  }, log.entity_type), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-600 max-w-xs"
  }, log.details), /*#__PURE__*/React.createElement("td", {
    className: "p-4 text-stone-400 font-mono text-[11px]"
  }, log.ip_address || '127.0.0.1'))))))), currentTab === 'settings' && settingsForm && /*#__PURE__*/React.createElement("div", {
    className: "space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Restaurant Settings & Policies"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Configure operating hours, time slot limits, lead times, and taxes")), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSettingsSubmit,
    className: "space-y-6 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-stone-900 uppercase"
  }, "General Details"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Restaurant Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: settingsForm.name,
    onChange: e => setSettingsForm({
      ...settingsForm,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Contact Phone"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: settingsForm.phone,
    onChange: e => setSettingsForm({
      ...settingsForm,
      phone: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Contact Email"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    value: settingsForm.email,
    onChange: e => setSettingsForm({
      ...settingsForm,
      email: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Physical Address"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    value: settingsForm.address,
    onChange: e => setSettingsForm({
      ...settingsForm,
      address: e.target.value
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "text-sm font-bold text-stone-900 uppercase"
  }, "Pre-Order Rules & Taxes"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-4 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Min Lead Notice (Mins)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settingsForm.min_advance_minutes,
    onChange: e => setSettingsForm({
      ...settingsForm,
      min_advance_minutes: parseInt(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Max Advance Booking (Days)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    value: settingsForm.max_advance_days,
    onChange: e => setSettingsForm({
      ...settingsForm,
      max_advance_days: parseInt(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "GST Tax Rate (%)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: settingsForm.tax_percentage,
    onChange: e => setSettingsForm({
      ...settingsForm,
      tax_percentage: parseFloat(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-bold text-stone-700 mb-1"
  }, "Service Charge (%)"), /*#__PURE__*/React.createElement("input", {
    type: "number",
    step: "0.1",
    value: settingsForm.service_charge_percentage,
    onChange: e => setSettingsForm({
      ...settingsForm,
      service_charge_percentage: parseFloat(e.target.value)
    }),
    className: "w-full px-3 py-2 border rounded-xl"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "flex gap-4 pt-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: settingsForm.online_payment_enabled,
    onChange: e => setSettingsForm({
      ...settingsForm,
      online_payment_enabled: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Online Payments Enabled (Razorpay)")), /*#__PURE__*/React.createElement("label", {
    className: "flex items-center gap-2 font-bold cursor-pointer"
  }, /*#__PURE__*/React.createElement("input", {
    type: "checkbox",
    checked: settingsForm.pay_at_restaurant_enabled,
    onChange: e => setSettingsForm({
      ...settingsForm,
      pay_at_restaurant_enabled: e.target.checked
    }),
    className: "rounded text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Pay at Restaurant Allowed")))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: settingsSaving,
    className: "bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition shadow"
  }, settingsSaving ? 'Saving...' : 'Save All Settings'))))), toast && /*#__PURE__*/React.createElement("div", {
    className: "fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl border border-orange-500 shadow-xl text-xs font-semibold flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check-circle",
    className: "w-4 h-4 text-orange-400"
  }), /*#__PURE__*/React.createElement("span", null, toast.msg)));
}
(function() {
    const el = document.getElementById('admin-root');
    if (el) {
        if (ReactDOM.createRoot) {
            ReactDOM.createRoot(el).render(React.createElement(AdminApp, null));
        } else {
            ReactDOM.render(React.createElement(AdminApp, null), el);
        }
    }
})();
