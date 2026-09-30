const { useState, useEffect, useRef } = React;

function AdminApp() {
    // Current Active Tab
    const [currentTab, setCurrentTab] = useState('dashboard'); // dashboard, orders, menu, categories, groups, coupons, customers, analytics, audit, settings
    const [restaurant, setRestaurant] = useState(window.__RESTAURANT__ || {});

    // Notification toast
    const [toast, setToast] = useState(null);
    const notify = (msg, type = 'success') => {
        setToast({ msg, type });
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
        customization_group_ids: [],
    });

    // Categories State
    const [categories, setCategories] = useState([]);
    const [categoryModal, setCategoryModal] = useState(null); // 'create' or object
    const [categoryForm, setCategoryForm] = useState({ name: '', description: '', image: '', display_order: 0, active: true });

    // Customization Groups State
    const [customGroups, setCustomGroups] = useState([]);
    const [groupModal, setGroupModal] = useState(null);
    const [groupForm, setGroupForm] = useState({ name: '', description: '', required: false, min_selection: 0, max_selection: 1, options: [{ name: '', additional_price: 0 }] });

    // Coupons State
    const [coupons, setCoupons] = useState([]);
    const [couponModal, setCouponModal] = useState(null);
    const [couponForm, setCouponForm] = useState({ code: '', discount_type: 'percentage', discount_value: 20, minimum_order: 300, maximum_discount: 150, start_date: '', expiry_date: '', usage_limit: 500, active: true });

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
        if (currentTab === 'menu') { loadMenuItems(); loadCategories(); loadCustomGroups(); }
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
        fetch('/api/admin/dashboard')
            .then(res => res.json())
            .then(data => {
                setLoadingDashboard(false);
                if (data.success) setDashboardData(data);
            });
    };

    const loadOrders = () => {
        setOrdersLoading(true);
        let url = `/api/admin/orders?date_filter=${orderDateFilter}&status=${orderStatusFilter}&payment_status=${orderPaymentFilter}`;
        if (orderSearch) url += `&search=${encodeURIComponent(orderSearch)}`;

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setOrdersLoading(false);
                if (data.success) setOrders(data.orders.data || []);
            });
    };

    useEffect(() => {
        if (currentTab === 'orders') loadOrders();
    }, [orderDateFilter, orderStatusFilter, orderPaymentFilter]);

    const loadMenuItems = () => {
        setMenuLoading(true);
        fetch('/api/admin/menu-items')
            .then(res => res.json())
            .then(data => {
                setMenuLoading(false);
                if (data.success) setMenuItems(data.menu_items || []);
            });
    };

    const loadCategories = () => {
        fetch('/api/admin/categories')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCategories(data.categories || []);
            });
    };

    const loadCustomGroups = () => {
        fetch('/api/admin/customization-groups')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCustomGroups(data.groups || []);
            });
    };

    const loadCoupons = () => {
        fetch('/api/admin/coupons')
            .then(res => res.json())
            .then(data => {
                if (data.success) setCoupons(data.coupons || []);
            });
    };

    const loadCustomers = () => {
        setCustomersLoading(true);
        fetch('/api/admin/customers')
            .then(res => res.json())
            .then(data => {
                setCustomersLoading(false);
                if (data.success) setCustomers(data.customers.data || []);
            });
    };

    const loadAnalytics = () => {
        fetch('/api/admin/analytics')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setAnalyticsData(data);
                    renderChart(data);
                }
            });
    };

    const renderChart = (data) => {
        setTimeout(() => {
            const ctx = document.getElementById('analyticsChart');
            if (!ctx) return;
            if (chartRef.current) chartRef.current.destroy();

            chartRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.charts.labels,
                    datasets: [
                        {
                            label: 'Daily Sales (₹)',
                            data: data.charts.sales_trend,
                            borderColor: '#ea580c',
                            backgroundColor: 'rgba(234, 88, 12, 0.1)',
                            fill: true,
                            tension: 0.3,
                        },
                        {
                            label: 'Orders Count',
                            data: data.charts.orders_trend,
                            borderColor: '#3b82f6',
                            borderDash: [5, 5],
                            tension: 0.3,
                            yAxisID: 'y1',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    interaction: { mode: 'index', intersect: false },
                    scales: {
                        y: { type: 'linear', display: true, position: 'left', title: { display: true, text: 'Revenue (₹)' } },
                        y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: { display: true, text: 'Orders' } }
                    }
                }
            });
        }, 100);
    };

    const loadAuditLogs = () => {
        fetch('/api/admin/audit-logs')
            .then(res => res.json())
            .then(data => {
                if (data.success) setAuditLogs(data.logs.data || []);
            });
    };

    const loadSettings = () => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setSettingsForm({
                        ...data.restaurant,
                        hours: data.hours,
                        time_slots: data.time_slots,
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
                'Accept': 'application/json',
            },
            body: JSON.stringify({ status: newStatus })
        })
        .then(res => res.json())
        .then(data => {
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
    const handleDishSubmit = (e) => {
        e.preventDefault();
        const isEdit = dishModal && typeof dishModal === 'object';
        const url = isEdit ? `/api/admin/menu-items/${dishModal.id}` : '/api/admin/menu-items';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            },
            body: JSON.stringify(dishForm)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                notify(data.message);
                setDishModal(null);
                loadMenuItems();
            } else {
                alert(data.message || 'Error saving dish');
            }
        });
    };

    const handleDeleteDish = (id) => {
        if (!confirm('Are you sure you want to delete this menu item?')) return;
        fetch(`/api/admin/menu-items/${id}`, {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            }
        })
        .then(res => res.json())
        .then(data => {
            notify(data.message);
            loadMenuItems();
        });
    };

    // Category Submit
    const handleCategorySubmit = (e) => {
        e.preventDefault();
        const isEdit = categoryModal && typeof categoryModal === 'object';
        const url = isEdit ? `/api/admin/categories/${categoryModal.id}` : '/api/admin/categories';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            },
            body: JSON.stringify(categoryForm)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                notify(data.message);
                setCategoryModal(null);
                loadCategories();
            }
        });
    };

    // Custom Group Submit
    const handleGroupSubmit = (e) => {
        e.preventDefault();
        const isEdit = groupModal && typeof groupModal === 'object';
        const url = isEdit ? `/api/admin/customization-groups/${groupModal.id}` : '/api/admin/customization-groups';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            },
            body: JSON.stringify(groupForm)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                notify(data.message);
                setGroupModal(null);
                loadCustomGroups();
            }
        });
    };

    // Coupon Submit
    const handleCouponSubmit = (e) => {
        e.preventDefault();
        const isEdit = couponModal && typeof couponModal === 'object';
        const url = isEdit ? `/api/admin/coupons/${couponModal.id}` : '/api/admin/coupons';
        const method = isEdit ? 'PUT' : 'POST';

        fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            },
            body: JSON.stringify(couponForm)
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                notify(data.message);
                setCouponModal(null);
                loadCoupons();
            }
        });
    };

    // Settings Submit
    const handleSettingsSubmit = (e) => {
        e.preventDefault();
        setSettingsSaving(true);
        fetch('/api/admin/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            },
            body: JSON.stringify(settingsForm)
        })
        .then(res => res.json())
        .then(data => {
            setSettingsSaving(false);
            if (data.success) {
                notify('Settings and operating hours updated successfully.');
                setRestaurant(data.restaurant);
            } else {
                alert(data.message || 'Error saving settings');
            }
        });
    };

    return (
        <div className="min-h-screen bg-stone-100 flex flex-col md:flex-row font-sans">
            {/* Admin Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-stone-900 text-stone-300 flex-shrink-0 flex flex-col justify-between border-r border-stone-800">
                <div>
                    {/* Header */}
                    <div className="p-5 border-b border-stone-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-white text-base">
                                S
                            </div>
                            <div>
                                <h2 className="text-sm font-bold text-white tracking-wide">ADMIN CONSOLE</h2>
                                <p className="text-[11px] text-stone-400">Spice & Hearth Operations</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Menu */}
                    <nav className="p-3 space-y-1 text-xs font-semibold">
                        {[
                            { key: 'dashboard', label: 'Executive Overview', icon: 'layout-dashboard' },
                            { key: 'orders', label: 'Order Management', icon: 'clipboard-list' },
                            { key: 'menu', label: 'Menu & Dishes', icon: 'utensils' },
                            { key: 'categories', label: 'Food Categories', icon: 'folder-tree' },
                            { key: 'groups', label: 'Customization Groups', icon: 'sliders' },
                            { key: 'coupons', label: 'Coupons & Promos', icon: 'tag' },
                            { key: 'customers', label: 'Customer Directory', icon: 'users' },
                            { key: 'analytics', label: 'Sales & Analytics', icon: 'trending-up' },
                            { key: 'audit', label: 'Security Audit Log', icon: 'shield-alert' },
                            { key: 'settings', label: 'Restaurant Settings', icon: 'settings' },
                        ].map(item => (
                            <button
                                key={item.key}
                                onClick={() => setCurrentTab(item.key)}
                                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition ${currentTab === item.key ? 'bg-orange-600 text-white shadow-md' : 'text-stone-400 hover:text-white hover:bg-stone-800/80'}`}
                            >
                                <i data-lucide={item.icon} className="w-4 h-4 flex-shrink-0"></i>
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Quick Links */}
                <div className="p-4 border-t border-stone-800 space-y-2 text-xs">
                    <a href="/kitchen" className="flex items-center justify-between p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold transition border border-stone-700">
                        <span className="flex items-center gap-2">
                            <i data-lucide="tv" className="w-4 h-4"></i> Kitchen Display
                        </span>
                        <i data-lucide="external-link" className="w-3.5 h-3.5"></i>
                    </a>
                    <a href="/" className="flex items-center justify-between p-2 text-stone-400 hover:text-white transition">
                        <span>Customer Website</span>
                        <i data-lucide="arrow-up-right" className="w-3.5 h-3.5"></i>
                    </a>
                </div>
            </aside>

            {/* Main Admin Content Stage */}
            <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
                {/* 1. DASHBOARD OVERVIEW */}
                {currentTab === 'dashboard' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Today's Kitchen Overview</h1>
                                <p className="text-xs text-stone-500">Live operational snapshot for {new Date().toLocaleDateString()}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={loadDashboard} className="px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5">
                                    <i data-lucide="refresh-cw" className="w-3.5 h-3.5"></i> Refresh
                                </button>
                                <a href="/kitchen" className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5">
                                    <i data-lucide="flame" className="w-3.5 h-3.5"></i> Open Kitchen KDS
                                </a>
                            </div>
                        </div>

                        {/* Top KPI Cards */}
                        {dashboardData && (
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Today's Revenue</span>
                                    <h3 className="text-2xl font-bold text-stone-900">₹{dashboardData.metrics.today_revenue}</h3>
                                    <p className="text-[11px] text-emerald-600 font-medium">{dashboardData.metrics.today_orders_count} orders today</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Currently In Prep</span>
                                    <h3 className="text-2xl font-bold text-amber-600">{dashboardData.metrics.preparing_count}</h3>
                                    <p className="text-[11px] text-stone-500">Actively on embers/hearth</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Ready for Arrival</span>
                                    <h3 className="text-2xl font-bold text-emerald-600">{dashboardData.metrics.ready_count}</h3>
                                    <p className="text-[11px] text-stone-500">Plated & waiting for customer</p>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase tracking-wider">Upcoming Bookings</span>
                                    <h3 className="text-2xl font-bold text-orange-600">{dashboardData.metrics.upcoming_count}</h3>
                                    <p className="text-[11px] text-stone-500">Reserved for future slots</p>
                                </div>
                            </div>
                        )}

                        {/* Orders By Time Slot & Popular Dishes */}
                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* Time Slot Schedule */}
                            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                                    <i data-lucide="clock" className="w-4 h-4 text-orange-600"></i> Today's Schedule by Arrival Slot
                                </h3>
                                {dashboardData?.orders_by_time_slot.length === 0 ? (
                                    <p className="text-xs text-stone-400 py-6 text-center">No orders scheduled for today yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {dashboardData?.orders_by_time_slot.map(slot => (
                                            <div key={slot.arrival_time} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono font-bold text-orange-600 text-sm">{slot.arrival_time}</span>
                                                    <span className="text-stone-600">Peak dining window</span>
                                                </div>
                                                <span className="font-bold text-stone-900 bg-white px-3 py-1 rounded-lg border border-stone-200 shadow-sm">
                                                    {slot.count} {slot.count === 1 ? 'Order' : 'Orders'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Popular Food Items */}
                            <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                                    <i data-lucide="flame" className="w-4 h-4 text-orange-600"></i> Most Ordered Dishes
                                </h3>
                                <div className="divide-y divide-stone-100 text-xs">
                                    {dashboardData?.popular_dishes.map((dish, i) => (
                                        <div key={i} className="py-2.5 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 font-bold flex items-center justify-center text-[10px]">
                                                    {i + 1}
                                                </span>
                                                <span className="font-medium text-stone-800">{dish.item_name}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="font-bold text-stone-900">{dish.total_sold} sold</span>
                                                <span className="block text-[10px] text-stone-400">₹{dish.total_revenue}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. ORDER MANAGEMENT (SECTION 14) */}
                {currentTab === 'orders' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Pre-Order Operations</h1>
                                <p className="text-xs text-stone-500">Monitor, filter, and transition dining orders</p>
                            </div>
                        </div>

                        {/* Filters Bar */}
                        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                            <div className="flex flex-wrap items-center gap-3">
                                {/* Search */}
                                <div className="relative flex-1 min-w-[200px]">
                                    <i data-lucide="search" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"></i>
                                    <input
                                        type="text"
                                        placeholder="Search order #, customer name, phone..."
                                        value={orderSearch}
                                        onChange={(e) => setOrderSearch(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && loadOrders()}
                                        className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
                                    />
                                </div>

                                {/* Date Filter */}
                                <select
                                    value={orderDateFilter}
                                    onChange={(e) => setOrderDateFilter(e.target.value)}
                                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
                                >
                                    <option value="today">Today's Orders</option>
                                    <option value="tomorrow">Tomorrow's Orders</option>
                                    <option value="upcoming">All Upcoming</option>
                                    <option value="past">Past Orders</option>
                                    <option value="all">All Dates</option>
                                </select>

                                {/* Status Filter */}
                                <select
                                    value={orderStatusFilter}
                                    onChange={(e) => setOrderStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
                                >
                                    <option value="all">All Statuses</option>
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="preparing">Preparing</option>
                                    <option value="ready">Ready</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>

                                {/* Payment Status */}
                                <select
                                    value={orderPaymentFilter}
                                    onChange={(e) => setOrderPaymentFilter(e.target.value)}
                                    className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium focus:outline-none"
                                >
                                    <option value="all">All Payments</option>
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid (Counter)</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                            </div>
                        </div>

                        {/* Orders Table */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Order #</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Arrival Schedule</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Total</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4">Payment</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-stone-700">
                                        {ordersLoading ? (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-stone-400">Loading orders...</td>
                                            </tr>
                                        ) : orders.length === 0 ? (
                                            <tr>
                                                <td colSpan="8" className="p-8 text-center text-stone-400">No orders found for this filter.</td>
                                            </tr>
                                        ) : (
                                            orders.map(order => (
                                                <tr key={order.id} className="hover:bg-stone-50/70 transition">
                                                    <td className="p-4 font-mono font-bold text-stone-900">
                                                        <a href={`/track/${order.order_number}`} target="_blank" className="hover:text-orange-600 underline">
                                                            {order.order_number}
                                                        </a>
                                                        <span className="block text-[10px] text-stone-400 uppercase font-sans font-semibold">
                                                            {order.dining_option === 'dine_in' ? 'Dine-In' : 'Takeaway'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <strong className="text-stone-900 block">{order.customer_name}</strong>
                                                        <span className="text-stone-400 text-[11px]">{order.customer_phone}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-bold text-orange-600 block">{order.arrival_time}</span>
                                                        <span className="text-[11px] text-stone-400">{order.arrival_date}</span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="font-semibold">{order.items?.length || 0} dishes</span>
                                                        <span className="block text-[11px] text-stone-400 truncate max-w-[150px]">
                                                            {order.items?.map(i => i.item_name).join(', ')}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 font-bold text-stone-900">
                                                        ₹{order.final_total}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${order.order_status === 'completed' ? 'bg-stone-200 text-stone-800' : order.order_status === 'ready' ? 'bg-emerald-100 text-emerald-800' : order.order_status === 'preparing' ? 'bg-amber-100 text-amber-800' : order.order_status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-orange-100 text-orange-800'}`}>
                                                            {order.order_status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.payment_status === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                                            {order.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-right space-x-1">
                                                        <button onClick={() => setSelectedOrder(order)} className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold">
                                                            Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Order Details Drawer / Modal */}
                        {selectedOrder && (
                            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in zoom-in-95">
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                        <div>
                                            <h3 className="font-serif font-bold text-stone-900 text-lg">
                                                Order Details: {selectedOrder.order_number}
                                            </h3>
                                            <p className="text-xs text-stone-400">Placed on {new Date(selectedOrder.created_at).toLocaleString()}</p>
                                        </div>
                                        <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                                            <i data-lucide="x" className="w-4 h-4"></i>
                                        </button>
                                    </div>

                                    {/* Arrival Schedule Highlight */}
                                    <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex justify-between items-center text-xs">
                                        <div>
                                            <span className="font-bold text-orange-950 block">Arrival: {selectedOrder.arrival_date} @ {selectedOrder.arrival_time}</span>
                                            <span className="text-stone-600 uppercase font-semibold">Dining: {selectedOrder.dining_option}</span>
                                        </div>
                                        <span className="text-orange-700 font-bold bg-white px-3 py-1 rounded-xl shadow-sm">
                                            Status: {selectedOrder.order_status.toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Items */}
                                    <div className="space-y-2 border-t border-stone-100 pt-3 text-xs">
                                        <h4 className="font-bold text-stone-900 uppercase">Ordered Dishes</h4>
                                        <div className="divide-y divide-stone-100 max-h-48 overflow-y-auto">
                                            {selectedOrder.items?.map(it => (
                                                <div key={it.id} className="py-2 flex justify-between">
                                                    <div>
                                                        <span className="font-bold text-stone-800">{it.quantity} × {it.item_name}</span>
                                                        {it.customization_data && it.customization_data.length > 0 && (
                                                            <p className="text-[11px] text-stone-400">
                                                                {it.customization_data.map(c => c.option).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <span className="font-semibold text-stone-800">₹{it.total_price}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Customer & Notes */}
                                    <div className="text-xs space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                                        <p><strong>Customer:</strong> {selectedOrder.customer_name} ({selectedOrder.customer_phone})</p>
                                        <p><strong>Email:</strong> {selectedOrder.customer_email}</p>
                                        {selectedOrder.customer_notes && (
                                            <p className="text-amber-800 font-medium"><strong>Notes:</strong> {selectedOrder.customer_notes}</p>
                                        )}
                                    </div>

                                    {/* Transition Status Buttons */}
                                    <div className="space-y-2 pt-2 border-t border-stone-100 text-xs">
                                        <label className="font-bold text-stone-900 block uppercase">Change Order Status</label>
                                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                                            {['confirmed', 'preparing', 'ready', 'completed', 'cancelled'].map(st => (
                                                <button
                                                    key={st}
                                                    onClick={() => handleUpdateOrderStatus(selectedOrder.id, st)}
                                                    className={`py-2 px-1 rounded-xl font-bold uppercase text-[10px] transition ${selectedOrder.order_status === st ? 'bg-orange-600 text-white shadow' : 'bg-stone-100 hover:bg-stone-200 text-stone-700'}`}
                                                >
                                                    {st}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. MENU MANAGEMENT (SECTION 13) */}
                {currentTab === 'menu' && (
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Menu & Dish Management</h1>
                                <p className="text-xs text-stone-500">Add, edit prices, descriptions, and dietary properties of dishes</p>
                            </div>
                            <button
                                onClick={() => {
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
                                        customization_group_ids: [],
                                    });
                                    setDishModal('create');
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5"
                            >
                                <i data-lucide="plus" className="w-4 h-4"></i> Add New Dish
                            </button>
                        </div>

                        {/* Menu Table */}
                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4">Dish</th>
                                            <th className="p-4">Category</th>
                                            <th className="p-4">Price</th>
                                            <th className="p-4">Dietary</th>
                                            <th className="p-4">Prep Time</th>
                                            <th className="p-4">Status</th>
                                            <th className="p-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-stone-100 text-stone-700">
                                        {menuItems.map(item => (
                                            <tr key={item.id} className="hover:bg-stone-50/70 transition">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-stone-100 flex-shrink-0" />
                                                        <div>
                                                            <strong className="text-stone-900 block font-bold">{item.name}</strong>
                                                            <span className="text-[11px] text-stone-400 line-clamp-1">{item.description}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4 font-semibold text-stone-600">{item.category?.name || 'Unassigned'}</td>
                                                <td className="p-4">
                                                    <span className="font-bold text-stone-900">₹{item.price}</span>
                                                    {item.discounted_price && (
                                                        <span className="block text-[10px] text-emerald-600 font-semibold">
                                                            Discount: ₹{item.discounted_price}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.vegetarian ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                        {item.vegetarian ? 'Veg' : 'Non-Veg'}
                                                    </span>
                                                </td>
                                                <td className="p-4">{item.preparation_time} mins</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${item.available ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                        {item.available ? 'Available' : 'Sold Out'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right space-x-1.5">
                                                    <button
                                                        onClick={() => {
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
                                                                customization_group_ids: item.customization_groups?.map(g => g.id) || [],
                                                            });
                                                            setDishModal(item);
                                                        }}
                                                        className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteDish(item.id)}
                                                        className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-semibold"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Dish Create/Edit Modal */}
                        {dishModal && (
                            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                                        <h3 className="font-serif font-bold text-stone-900 text-lg">
                                            {typeof dishModal === 'object' ? `Edit Dish: ${dishModal.name}` : 'Create New Menu Item'}
                                        </h3>
                                        <button onClick={() => setDishModal(null)} className="w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center">
                                            <i data-lucide="x" className="w-4 h-4"></i>
                                        </button>
                                    </div>

                                    <form onSubmit={handleDishSubmit} className="space-y-4 text-xs">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Dish Name *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    value={dishForm.name}
                                                    onChange={(e) => setDishForm({ ...dishForm, name: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Category *</label>
                                                <select
                                                    value={dishForm.category_id}
                                                    onChange={(e) => setDishForm({ ...dishForm, category_id: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                >
                                                    {categories.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Description</label>
                                            <textarea
                                                rows="2"
                                                value={dishForm.description}
                                                onChange={(e) => setDishForm({ ...dishForm, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-xl"
                                            ></textarea>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3">
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Regular Price (₹) *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    required
                                                    value={dishForm.price}
                                                    onChange={(e) => setDishForm({ ...dishForm, price: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Discounted Price (₹)</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={dishForm.discounted_price}
                                                    onChange={(e) => setDishForm({ ...dishForm, discounted_price: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Prep Time (mins) *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={dishForm.preparation_time}
                                                    onChange={(e) => setDishForm({ ...dishForm, preparation_time: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Dish Image URL</label>
                                            <input
                                                type="url"
                                                value={dishForm.image}
                                                onChange={(e) => setDishForm({ ...dishForm, image: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-xl"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Dietary Flag</label>
                                                <select
                                                    value={dishForm.vegetarian ? '1' : '0'}
                                                    onChange={(e) => setDishForm({ ...dishForm, vegetarian: e.target.value === '1' })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                >
                                                    <option value="1">Vegetarian</option>
                                                    <option value="0">Non-Vegetarian</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Spice Level</label>
                                                <select
                                                    value={dishForm.spice_level}
                                                    onChange={(e) => setDishForm({ ...dishForm, spice_level: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                >
                                                    <option value="0">0 - None / Mild</option>
                                                    <option value="1">1 - Mildly Spiced</option>
                                                    <option value="2">2 - Medium Spicy</option>
                                                    <option value="3">3 - Fiery Hot</option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* Customization Groups Assigner (Section 4) */}
                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">
                                                Assign Customization Groups (Sizes, Add-ons, Crusts)
                                            </label>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-stone-50 border rounded-xl max-h-32 overflow-y-auto">
                                                {customGroups.map(grp => (
                                                    <label key={grp.id} className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={dishForm.customization_group_ids.includes(grp.id)}
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    const cur = dishForm.customization_group_ids;
                                                                    const updated = cur.includes(grp.id) ? cur.filter(id => id !== grp.id) : [...cur, grp.id];
                                                                    setDishForm({ ...dishForm, customization_group_ids: updated });
                                                                }
                                                            }}
                                                            className="rounded text-orange-600"
                                                        />
                                                        <span>{grp.name}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex gap-4 pt-2">
                                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={dishForm.available}
                                                    onChange={(e) => setDishForm({ ...dishForm, available: e.target.checked })}
                                                    className="rounded text-orange-600"
                                                />
                                                <span>Available</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={dishForm.popular}
                                                    onChange={(e) => setDishForm({ ...dishForm, popular: e.target.checked })}
                                                    className="rounded text-orange-600"
                                                />
                                                <span>Popular Badge</span>
                                            </label>
                                            <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={dishForm.featured}
                                                    onChange={(e) => setDishForm({ ...dishForm, featured: e.target.checked })}
                                                    className="rounded text-orange-600"
                                                />
                                                <span>Featured</span>
                                            </label>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t">
                                            <button type="button" onClick={() => setDishModal(null)} className="px-4 py-2 border rounded-xl font-semibold">
                                                Cancel
                                            </button>
                                            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                                                Save Dish
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 4. FOOD CATEGORIES (SECTION 3 & 13) */}
                {currentTab === 'categories' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Menu Categories</h1>
                                <p className="text-xs text-stone-500">Create, rename, reorder, and manage food categories</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCategoryForm({ name: '', description: '', image: '', display_order: categories.length + 1, active: true });
                                    setCategoryModal('create');
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <i data-lucide="plus" className="w-4 h-4"></i> Add Category
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {categories.map(cat => (
                                <div key={cat.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-stone-900 text-base">{cat.name}</h3>
                                            <span className="text-xs text-stone-400 font-semibold">{cat.menu_items_count || 0} items</span>
                                        </div>
                                        <p className="text-xs text-stone-500 leading-relaxed">{cat.description || 'No description provided.'}</p>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-3 border-t border-stone-100 text-xs">
                                        <button
                                            onClick={() => {
                                                setCategoryForm({ name: cat.name, description: cat.description || '', image: cat.image || '', display_order: cat.display_order, active: cat.active });
                                                setCategoryModal(cat);
                                            }}
                                            className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-semibold"
                                        >
                                            Edit
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Category Modal */}
                        {categoryModal && (
                            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                                    <h3 className="font-serif font-bold text-stone-900 text-lg">
                                        {typeof categoryModal === 'object' ? 'Edit Category' : 'Create Category'}
                                    </h3>
                                    <form onSubmit={handleCategorySubmit} className="space-y-3 text-xs">
                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Category Name *</label>
                                            <input
                                                type="text"
                                                required
                                                value={categoryForm.name}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-xl"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={categoryForm.description}
                                                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-xl"
                                            />
                                        </div>
                                        <div className="flex justify-end gap-2 pt-3 border-t">
                                            <button type="button" onClick={() => setCategoryModal(null)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                                            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Save Category</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 5. CUSTOMIZATION GROUPS (SECTION 4) */}
                {currentTab === 'groups' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Customization Groups & Options</h1>
                                <p className="text-xs text-stone-500">Configure add-ons, portion sizes, crust types, and toppings</p>
                            </div>
                            <button
                                onClick={() => {
                                    setGroupForm({ name: '', description: '', required: false, min_selection: 0, max_selection: 1, options: [{ name: '', additional_price: 0 }] });
                                    setGroupModal('create');
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <i data-lucide="plus" className="w-4 h-4"></i> Add Group
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {customGroups.map(grp => (
                                <div key={grp.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between border-b border-stone-100 pb-2">
                                        <div>
                                            <h3 className="font-bold text-stone-900 text-base">{grp.name}</h3>
                                            <p className="text-xs text-stone-400">{grp.required ? 'Mandatory choice' : 'Optional add-on'}</p>
                                        </div>
                                        <span className="text-xs bg-stone-100 px-2 py-0.5 rounded font-mono">Max {grp.max_selection}</span>
                                    </div>

                                    <div className="space-y-1.5 text-xs">
                                        <strong className="text-stone-500 uppercase text-[10px]">Options:</strong>
                                        {grp.options && grp.options.map(opt => (
                                            <div key={opt.id} className="flex justify-between p-2 rounded-lg bg-stone-50 border border-stone-100">
                                                <span>{opt.name}</span>
                                                <span className="font-semibold">{opt.additional_price > 0 ? `+₹${opt.additional_price}` : 'Free'}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Group Modal */}
                        {groupModal && (
                            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                                    <h3 className="font-serif font-bold text-stone-900 text-lg">Create Customization Group</h3>
                                    <form onSubmit={handleGroupSubmit} className="space-y-3 text-xs">
                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Group Name *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Cheese Selection, Size, Extra Dips"
                                                value={groupForm.name}
                                                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border rounded-xl"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <label className="flex items-center gap-2 font-bold cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={groupForm.required}
                                                    onChange={(e) => setGroupForm({ ...groupForm, required: e.target.checked })}
                                                    className="rounded text-orange-600"
                                                />
                                                <span>Selection Required</span>
                                            </label>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Max Options Selectable</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={groupForm.max_selection}
                                                    onChange={(e) => setGroupForm({ ...groupForm, max_selection: parseInt(e.target.value) })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        {/* Options Editor */}
                                        <div className="space-y-2 border-t pt-2">
                                            <div className="flex justify-between items-center">
                                                <label className="font-bold text-stone-700">Options</label>
                                                <button
                                                    type="button"
                                                    onClick={() => setGroupForm({ ...groupForm, options: [...groupForm.options, { name: '', additional_price: 0 }] })}
                                                    className="text-orange-600 hover:underline font-bold"
                                                >
                                                    + Add Option
                                                </button>
                                            </div>
                                            {groupForm.options.map((opt, oi) => (
                                                <div key={oi} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        required
                                                        placeholder="Option name"
                                                        value={opt.name}
                                                        onChange={(e) => {
                                                            const copy = [...groupForm.options];
                                                            copy[oi].name = e.target.value;
                                                            setGroupForm({ ...groupForm, options: copy });
                                                        }}
                                                        className="flex-1 px-3 py-1.5 border rounded-xl"
                                                    />
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        placeholder="Price (+₹)"
                                                        value={opt.additional_price}
                                                        onChange={(e) => {
                                                            const copy = [...groupForm.options];
                                                            copy[oi].additional_price = parseFloat(e.target.value) || 0;
                                                            setGroupForm({ ...groupForm, options: copy });
                                                        }}
                                                        className="w-24 px-3 py-1.5 border rounded-xl"
                                                    />
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t">
                                            <button type="button" onClick={() => setGroupModal(null)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                                            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Save Group</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 6. COUPONS & DISCOUNTS (SECTION 18) */}
                {currentTab === 'coupons' && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-stone-900">Coupons & Promo Codes</h1>
                                <p className="text-xs text-stone-500">Create discount codes for pre-orders with minimum cart thresholds</p>
                            </div>
                            <button
                                onClick={() => {
                                    setCouponForm({ code: '', discount_type: 'percentage', discount_value: 20, minimum_order: 300, maximum_discount: 150, start_date: '', expiry_date: '', usage_limit: 500, active: true });
                                    setCouponModal('create');
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                            >
                                <i data-lucide="plus" className="w-4 h-4"></i> Create Coupon
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {coupons.map(cpn => (
                                <div key={cpn.id} className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-mono font-bold text-orange-600 text-base">{cpn.code}</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${cpn.active ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-stone-600'}`}>
                                            {cpn.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-700 font-semibold">
                                        {cpn.discount_type === 'percentage' ? `${cpn.discount_value}% OFF` : `₹${cpn.discount_value} FLAT OFF`}
                                    </p>
                                    <div className="text-[11px] text-stone-500 space-y-0.5">
                                        <p>Min Order: ₹{cpn.minimum_order}</p>
                                        {cpn.maximum_discount && <p>Max Discount: ₹{cpn.maximum_discount}</p>}
                                        <p>Used: {cpn.times_used} {cpn.usage_limit ? `/ ${cpn.usage_limit}` : ''}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Coupon Modal */}
                        {couponModal && (
                            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
                                    <h3 className="font-serif font-bold text-stone-900 text-lg">Create Promotional Coupon</h3>
                                    <form onSubmit={handleCouponSubmit} className="space-y-3 text-xs">
                                        <div>
                                            <label className="block font-bold text-stone-700 mb-1">Coupon Code *</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. FESTIVE30"
                                                value={couponForm.code}
                                                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                                                className="w-full px-3 py-2 border rounded-xl font-mono uppercase"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Discount Type</label>
                                                <select
                                                    value={couponForm.discount_type}
                                                    onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                >
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (₹)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Discount Value *</label>
                                                <input
                                                    type="number"
                                                    required
                                                    value={couponForm.discount_value}
                                                    onChange={(e) => setCouponForm({ ...couponForm, discount_value: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Min Order Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    value={couponForm.minimum_order}
                                                    onChange={(e) => setCouponForm({ ...couponForm, minimum_order: parseFloat(e.target.value) })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                            <div>
                                                <label className="block font-bold text-stone-700 mb-1">Max Cap (₹)</label>
                                                <input
                                                    type="number"
                                                    value={couponForm.maximum_discount || ''}
                                                    onChange={(e) => setCouponForm({ ...couponForm, maximum_discount: parseFloat(e.target.value) || null })}
                                                    className="w-full px-3 py-2 border rounded-xl"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-2 pt-3 border-t">
                                            <button type="button" onClick={() => setCouponModal(null)} className="px-4 py-2 border rounded-xl font-semibold">Cancel</button>
                                            <button type="submit" className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">Save Coupon</button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* 7. CUSTOMER DIRECTORY (SECTION 19) */}
                {currentTab === 'customers' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Customer Management</h1>
                            <p className="text-xs text-stone-500">Registered diners, order history, and lifetime spending</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Customer Name</th>
                                        <th className="p-4">Email</th>
                                        <th className="p-4">Phone</th>
                                        <th className="p-4">Total Orders</th>
                                        <th className="p-4">Total Spending</th>
                                        <th className="p-4">Member Since</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 text-stone-700">
                                    {customers.map(cust => (
                                        <tr key={cust.id} className="hover:bg-stone-50/70 transition">
                                            <td className="p-4 font-bold text-stone-900">{cust.name}</td>
                                            <td className="p-4 text-stone-600">{cust.email}</td>
                                            <td className="p-4 text-stone-600">{cust.phone || 'N/A'}</td>
                                            <td className="p-4 font-semibold">{cust.orders_count || 0} orders</td>
                                            <td className="p-4 font-bold text-orange-600">₹{cust.orders_sum_final_total || 0}</td>
                                            <td className="p-4 text-stone-400">{new Date(cust.created_at).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 8. ANALYTICS & CHARTS (SECTION 20) */}
                {currentTab === 'analytics' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Sales & Pre-Order Analytics</h1>
                            <p className="text-xs text-stone-500">Performance metrics over the last 14 days</p>
                        </div>

                        {analyticsData && (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase">Average Order Value</span>
                                    <h3 className="text-2xl font-bold text-stone-900">₹{analyticsData.average_order_value}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase">First-Time Diners</span>
                                    <h3 className="text-2xl font-bold text-orange-600">{analyticsData.retention.first_time}</h3>
                                </div>
                                <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm space-y-1">
                                    <span className="text-xs font-bold text-stone-400 uppercase">Repeat Loyal Diners</span>
                                    <h3 className="text-2xl font-bold text-emerald-600">{analyticsData.retention.repeat}</h3>
                                </div>
                            </div>
                        )}

                        {/* Interactive Line Chart Canvas */}
                        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3">
                            <h3 className="text-sm font-bold text-stone-900 uppercase">14-Day Sales Trend & Volume</h3>
                            <div className="h-80 w-full">
                                <canvas id="analyticsChart"></canvas>
                            </div>
                        </div>
                    </div>
                )}

                {/* 9. SECURITY AUDIT LOGS (SECTION 30) */}
                {currentTab === 'audit' && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Admin Audit Logs</h1>
                            <p className="text-xs text-stone-500">Audit trail recording dish modifications, order status shifts, and policy alterations</p>
                        </div>

                        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="p-4">Timestamp</th>
                                        <th className="p-4">User</th>
                                        <th className="p-4">Action</th>
                                        <th className="p-4">Entity</th>
                                        <th className="p-4">Details</th>
                                        <th className="p-4">IP Address</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-stone-100 text-stone-700">
                                    {auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-stone-50/70 transition">
                                            <td className="p-4 font-mono text-[11px] text-stone-400">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="p-4 font-bold text-stone-900">{log.user_name || 'System'}</td>
                                            <td className="p-4">
                                                <span className="font-mono bg-stone-100 px-2 py-0.5 rounded text-[11px] font-semibold">
                                                    {log.action}
                                                </span>
                                            </td>
                                            <td className="p-4 text-stone-600">{log.entity_type}</td>
                                            <td className="p-4 text-stone-600 max-w-xs">{log.details}</td>
                                            <td className="p-4 text-stone-400 font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 10. RESTAURANT SETTINGS (SECTION 16 & 17) */}
                {currentTab === 'settings' && settingsForm && (
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-serif font-bold text-stone-900">Restaurant Settings & Policies</h1>
                            <p className="text-xs text-stone-500">Configure operating hours, time slot limits, lead times, and taxes</p>
                        </div>

                        <form onSubmit={handleSettingsSubmit} className="space-y-6 text-xs">
                            {/* General Info */}
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-stone-900 uppercase">General Details</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Restaurant Name</label>
                                        <input
                                            type="text"
                                            value={settingsForm.name}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Contact Phone</label>
                                        <input
                                            type="text"
                                            value={settingsForm.phone}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Contact Email</label>
                                        <input
                                            type="email"
                                            value={settingsForm.email}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, email: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Physical Address</label>
                                        <input
                                            type="text"
                                            value={settingsForm.address}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, address: e.target.value })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Pre-Order Rules & Taxes */}
                            <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-stone-900 uppercase">Pre-Order Rules & Taxes</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Min Lead Notice (Mins)</label>
                                        <input
                                            type="number"
                                            value={settingsForm.min_advance_minutes}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, min_advance_minutes: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Max Advance Booking (Days)</label>
                                        <input
                                            type="number"
                                            value={settingsForm.max_advance_days}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, max_advance_days: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">GST Tax Rate (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settingsForm.tax_percentage}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, tax_percentage: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-bold text-stone-700 mb-1">Service Charge (%)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={settingsForm.service_charge_percentage}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, service_charge_percentage: parseFloat(e.target.value) })}
                                            className="w-full px-3 py-2 border rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.online_payment_enabled}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, online_payment_enabled: e.target.checked })}
                                            className="rounded text-orange-600"
                                        />
                                        <span>Online Payments Enabled (Razorpay)</span>
                                    </label>
                                    <label className="flex items-center gap-2 font-bold cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settingsForm.pay_at_restaurant_enabled}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, pay_at_restaurant_enabled: e.target.checked })}
                                            className="rounded text-orange-600"
                                        />
                                        <span>Pay at Restaurant Allowed</span>
                                    </label>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={settingsSaving}
                                    className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-xl font-bold transition shadow"
                                >
                                    {settingsSaving ? 'Saving...' : 'Save All Settings'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </main>

            {/* Notification Toast */}
            {toast && (
                <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-2xl border border-orange-500 shadow-xl text-xs font-semibold flex items-center gap-2">
                    <i data-lucide="check-circle" className="w-4 h-4 text-orange-400"></i>
                    <span>{toast.msg}</span>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<AdminApp />, document.getElementById('admin-root'));