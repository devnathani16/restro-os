const { useState, useEffect, useMemo } = React;

function KitchenDisplay() {
    const todayStr = useMemo(() => {
        const d = new Date();
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }, []);
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [activeSlots, setActiveSlots] = useState([]);
    const [rawOrders, setRawOrders] = useState([]);
    const [restaurant, setRestaurant] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'confirmed', 'preparing', 'ready'

    // Update digital clock every second
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Fetch kitchen active orders
    const fetchKitchenOrders = () => {
        fetch(`/api/kitchen/active-orders?date=${selectedDate}`, {
            headers: { 'Accept': 'application/json' }
        })
        .then(res => res.json())
        .then(data => {
            setLoading(false);
            if (data.success) {
                setActiveSlots(data.grouped_slots || []);
                setRawOrders(data.raw_orders || []);
                if (data.restaurant) setRestaurant(data.restaurant);
            }
        })
        .catch(err => {
            setLoading(false);
            console.error("Error loading kitchen orders:", err);
        });
    };

    // Initial load + Polling every 8 seconds
    useEffect(() => {
        setLoading(true);
        fetchKitchenOrders();
        const poll = setInterval(fetchKitchenOrders, 8000);
        return () => clearInterval(poll);
    }, [selectedDate]);

    // Handle status actions with large tactile response
    const handleStatusTransition = (orderId, action) => {
        setActionLoadingId(orderId);
        const endpoint = `/api/kitchen/orders/${orderId}/${action}`;

        fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
                'Accept': 'application/json',
            }
        })
        .then(res => res.json())
        .then(data => {
            setActionLoadingId(null);
            if (data.success) {
                fetchKitchenOrders();
                // Play audio beep if enabled
                if (audioEnabled) {
                    try {
                        const ctx = new (window.AudioContext || window.webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        osc.frequency.setValueAtTime(action === 'ready' ? 880 : 440, ctx.currentTime);
                        osc.connect(ctx.destination);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.15);
                    } catch(e) {}
                }
            } else {
                alert(data.message || 'Error updating order status');
            }
        })
        .catch(() => {
            setActionLoadingId(null);
            alert('Failed to connect to kitchen API');
        });
    };

    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    const totalActiveOrders = rawOrders.length;
    const preparingCount = rawOrders.filter(o => o.order_status === 'preparing').length;
    const readyCount = rawOrders.filter(o => o.order_status === 'ready').length;
    const waitingStartCount = rawOrders.filter(o => o.order_status === 'confirmed').length;

    return (
        <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col">
            {/* Top Bar for Kitchen Tablet */}
            <header className="bg-stone-900 border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {restaurant && restaurant.logo ? (
                            <img src={restaurant.logo} alt="Logo" className="w-10 h-10 rounded-xl object-cover" />
                        ) : (
                            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-lg text-white">
                                <i data-lucide="chef-hat" className="w-6 h-6"></i>
                            </div>
                        )}
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-wide">{restaurant ? restaurant.name.toUpperCase() : 'KITCHEN DISPLAY'}</h1>
                            <p className="text-xs text-orange-400 font-mono">Bistro Line Ops • Pre-Order Queue</p>
                        </div>
                    </div>

                    {/* Clock */}
                    <div className="hidden sm:flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800 font-mono text-xl font-bold text-amber-400">
                        <i data-lucide="clock" className="w-5 h-5 text-stone-400"></i>
                        <span>{currentTime}</span>
                    </div>
                </div>

                {/* Status KPI Chips */}
                <div className="flex items-center gap-2 text-xs">
                    <button onClick={() => setFilterStatus('all')} className={`px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'all' ? 'bg-stone-800 border-stone-600 text-white' : 'border-stone-850 text-stone-400'}`}>
                        All Active ({totalActiveOrders})
                    </button>
                    <button onClick={() => setFilterStatus('confirmed')} className={`px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'confirmed' ? 'bg-orange-950/80 border-orange-500 text-orange-300' : 'border-stone-850 text-stone-400'}`}>
                        Needs Prep ({waitingStartCount})
                    </button>
                    <button onClick={() => setFilterStatus('preparing')} className={`px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'preparing' ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'border-stone-850 text-stone-400'}`}>
                        In Ovens ({preparingCount})
                    </button>
                    <button onClick={() => setFilterStatus('ready')} className={`px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'ready' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'border-stone-850 text-stone-400'}`}>
                        Ready ({readyCount})
                    </button>
                </div>

                {/* Date Switcher & Links */}
                <div className="flex items-center gap-2">
                    <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-stone-950 border border-stone-800 text-stone-300 px-3 py-2 rounded-xl text-sm font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button onClick={() => setAudioEnabled(!audioEnabled)} className={`p-2.5 rounded-xl border transition ${audioEnabled ? 'border-amber-500/60 bg-amber-500/20 text-amber-400' : 'border-stone-800 bg-stone-900 text-stone-500'}`} title="Toggle Audio Chime">
                        <i data-lucide={audioEnabled ? "volume-2" : "volume-x"} className="w-4 h-4"></i>
                    </button>
                    <button onClick={fetchKitchenOrders} className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700" title="Refresh">
                        <i data-lucide="refresh-cw" className="w-4 h-4"></i>
                    </button>
                    <a href="/admin" className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700">
                        Admin Portal
                    </a>
                </div>
            </header>

            {/* Main Stage: Orders Grouped by Arrival Time (Section 15) */}
            <main className="flex-1 p-6 overflow-y-auto space-y-8">
                {loading ? (
                    <div className="py-20 text-center text-stone-400">Loading kitchen tickets...</div>
                ) : activeSlots.length === 0 ? (
                    <div className="py-24 text-center space-y-4">
                        <div className="w-20 h-20 rounded-full bg-stone-900 text-stone-600 flex items-center justify-center mx-auto border border-stone-800">
                            <i data-lucide="check" className="w-10 h-10 text-emerald-500"></i>
                        </div>
                        <h2 className="text-2xl font-bold text-stone-300">All Pre-Orders Cleared!</h2>
                        <p className="text-stone-500 text-sm max-w-sm mx-auto">
                            No pending tickets for {selectedDate}. Any customer pre-order will appear here automatically.
                        </p>
                    </div>
                ) : (
                    activeSlots.map(slotGroup => {
                        const filteredGroupOrders = slotGroup.orders.filter(ord => {
                            if (filterStatus === 'all') return true;
                            return ord.order_status === filterStatus;
                        });

                        if (filteredGroupOrders.length === 0) return null;

                        return (
                            <section key={slotGroup.arrival_time} className="space-y-4">
                                {/* Time Group Header */}
                                <div className="flex items-center gap-3 border-b border-stone-800 pb-2">
                                    <div className="bg-orange-600 text-white font-mono font-bold text-xl px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                                        <i data-lucide="clock" className="w-5 h-5"></i>
                                        <span>ARRIVAL: {slotGroup.arrival_time}</span>
                                    </div>
                                    <span className="text-stone-400 text-sm font-semibold">
                                        {filteredGroupOrders.length} {filteredGroupOrders.length === 1 ? 'Order' : 'Orders'} • {slotGroup.total_items_count} Total Items
                                    </span>
                                </div>

                                {/* Order Cards Grid for this Time Slot */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {filteredGroupOrders.map(order => {
                                        const isActionLoading = actionLoadingId === order.id;

                                        return (
                                            <div
                                                key={order.id}
                                                className={`rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition ${order.order_status === 'ready' ? 'bg-stone-900 border-emerald-500/80 ring-2 ring-emerald-500/30' : order.order_status === 'preparing' ? 'bg-stone-900 border-amber-500/80 ring-2 ring-amber-500/30' : 'bg-stone-900 border-stone-800'}`}
                                            >
                                                {/* Ticket Header */}
                                                <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-base font-mono font-bold text-white tracking-wider">
                                                                {order.order_number}
                                                            </span>
                                                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${order.dining_option === 'dine_in' ? 'bg-stone-800 text-stone-300' : 'bg-blue-950 text-blue-300 border border-blue-800'}`}>
                                                                {order.dining_option === 'dine_in' ? 'DINE-IN' : 'TAKEAWAY'}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-stone-400 mt-0.5">
                                                            Customer: <strong className="text-stone-200">{order.customer_name}</strong>
                                                        </p>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span className={`text-xs font-bold uppercase px-3 py-1 rounded-xl tracking-wider ${order.order_status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : order.order_status === 'preparing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'}`}>
                                                        {order.order_status}
                                                    </span>
                                                </div>

                                                {/* Customer Special Notes */}
                                                {order.customer_notes && (
                                                    <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-900/50 text-amber-200 text-xs flex items-center gap-2">
                                                        <i data-lucide="alert-triangle" className="w-3.5 h-3.5 text-amber-400 flex-shrink-0"></i>
                                                        <span className="font-semibold">Note: {order.customer_notes}</span>
                                                    </div>
                                                )}

                                                {/* Items Checklist for Chefs */}
                                                <div className="p-4 flex-1 space-y-3 divide-y divide-stone-800/60 text-sm">
                                                    {order.items && order.items.map(item => (
                                                        <div key={item.id} className="pt-2 first:pt-0 space-y-1">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-7 h-7 rounded-lg bg-stone-800 text-orange-400 font-bold flex items-center justify-center text-sm border border-stone-700">
                                                                        {item.quantity}×
                                                                    </span>
                                                                    <span className="font-bold text-white text-base">
                                                                        {item.item_name}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Customizations / Options */}
                                                            {item.customization_data && item.customization_data.length > 0 && (
                                                                <div className="pl-9 flex flex-wrap gap-1">
                                                                    {item.customization_data.map((c, ci) => (
                                                                        <span key={ci} className="bg-stone-800/90 text-amber-300 text-xs px-2 py-0.5 rounded font-mono">
                                                                            • {c.option}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Item-level notes */}
                                                            {item.notes && (
                                                                <p className="pl-9 text-xs text-orange-400 italic font-mono">
                                                                    Req: "{item.notes}"
                                                                </p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Large Tactile Buttons for Kitchen Tablets (Section 15) */}
                                                <div className="p-4 bg-stone-950 border-t border-stone-800 flex items-center gap-3">
                                                    {order.order_status === 'confirmed' && (
                                                        <button
                                                            onClick={() => handleStatusTransition(order.id, 'prepare')}
                                                            disabled={isActionLoading}
                                                            className="w-full bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <i data-lucide="flame" className="w-5 h-5"></i>
                                                            <span>START PREPARING</span>
                                                        </button>
                                                    )}

                                                    {order.order_status === 'preparing' && (
                                                        <button
                                                            onClick={() => handleStatusTransition(order.id, 'ready')}
                                                            disabled={isActionLoading}
                                                            className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <i data-lucide="bell-ring" className="w-5 h-5"></i>
                                                            <span>MARK READY FOR ARRIVAL</span>
                                                        </button>
                                                    )}

                                                    {order.order_status === 'ready' && (
                                                        <button
                                                            onClick={() => handleStatusTransition(order.id, 'complete')}
                                                            disabled={isActionLoading}
                                                            className="w-full bg-stone-700 hover:bg-stone-600 active:scale-95 text-white font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
                                                        >
                                                            <i data-lucide="check-circle" className="w-5 h-5"></i>
                                                            <span>HANDOVER / COMPLETE</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })
                )}
            </main>
        </div>
    );
}

ReactDOM.render(<KitchenDisplay />, document.getElementById('kitchen-root'));