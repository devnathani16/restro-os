const {
  useState,
  useEffect,
  useMemo
} = React;
function KitchenDisplay() {
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [activeSlots, setActiveSlots] = useState([]);
  const [rawOrders, setRawOrders] = useState([]);
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
      headers: {
        'Accept': 'application/json'
      }
    }).then(res => res.json()).then(data => {
      setLoading(false);
      if (data.success) {
        setActiveSlots(data.grouped_slots || []);
        setRawOrders(data.raw_orders || []);
      }
    }).catch(err => {
      setLoading(false);
      console.error("Error loading kitchen orders:", err);
    });
  };

  // Initial load + Polling every 8 seconds
  useEffect(() => {
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
        'Accept': 'application/json'
      }
    }).then(res => res.json()).then(data => {
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
          } catch (e) {}
        }
      } else {
        alert(data.message || 'Error updating order status');
      }
    }).catch(() => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-stone-950 text-stone-100 flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-stone-900 border-b border-stone-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-lg text-white"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chef-hat",
    className: "w-6 h-6"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    className: "text-lg font-bold text-white tracking-wide"
  }, "KITCHEN PREP DISPLAY"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-orange-400 font-mono"
  }, "Bistro Line Ops \u2022 Pre-Order Queue"))), /*#__PURE__*/React.createElement("div", {
    className: "hidden sm:flex items-center gap-2 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800 font-mono text-xl font-bold text-amber-400"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-5 h-5 text-stone-400"
  }), /*#__PURE__*/React.createElement("span", null, currentTime))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-xs"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilterStatus('all'),
    className: `px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'all' ? 'bg-stone-800 border-stone-600 text-white' : 'border-stone-850 text-stone-400'}`
  }, "All Active (", totalActiveOrders, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilterStatus('confirmed'),
    className: `px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'confirmed' ? 'bg-orange-950/80 border-orange-500 text-orange-300' : 'border-stone-850 text-stone-400'}`
  }, "Needs Prep (", waitingStartCount, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilterStatus('preparing'),
    className: `px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'preparing' ? 'bg-amber-950/80 border-amber-500 text-amber-300' : 'border-stone-850 text-stone-400'}`
  }, "In Ovens (", preparingCount, ")"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setFilterStatus('ready'),
    className: `px-3 py-2 rounded-xl font-bold border transition ${filterStatus === 'ready' ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300' : 'border-stone-850 text-stone-400'}`
  }, "Ready (", readyCount, ")")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setAudioEnabled(!audioEnabled),
    className: `p-2.5 rounded-xl border transition ${audioEnabled ? 'border-amber-500/60 bg-amber-500/20 text-amber-400' : 'border-stone-800 bg-stone-900 text-stone-500'}`,
    title: "Toggle Audio Chime"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": audioEnabled ? "volume-2" : "volume-x",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("button", {
    onClick: fetchKitchenOrders,
    className: "p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700",
    title: "Refresh"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "refresh-cw",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("a", {
    href: "/admin",
    className: "px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold border border-stone-700"
  }, "Admin Portal"))), /*#__PURE__*/React.createElement("main", {
    className: "flex-1 p-6 overflow-y-auto space-y-8"
  }, loading ? /*#__PURE__*/React.createElement("div", {
    className: "py-20 text-center text-stone-400"
  }, "Loading kitchen tickets...") : activeSlots.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "py-24 text-center space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-20 h-20 rounded-full bg-stone-900 text-stone-600 flex items-center justify-center mx-auto border border-stone-800"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check",
    className: "w-10 h-10 text-emerald-500"
  })), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-bold text-stone-300"
  }, "All Pre-Orders Cleared!"), /*#__PURE__*/React.createElement("p", {
    className: "text-stone-500 text-sm max-w-sm mx-auto"
  }, "No pending tickets for ", selectedDate, ". Any customer pre-order will appear here automatically.")) : activeSlots.map(slotGroup => {
    const filteredGroupOrders = slotGroup.orders.filter(ord => {
      if (filterStatus === 'all') return true;
      return ord.order_status === filterStatus;
    });
    if (filteredGroupOrders.length === 0) return null;
    return /*#__PURE__*/React.createElement("section", {
      key: slotGroup.arrival_time,
      className: "space-y-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-3 border-b border-stone-800 pb-2"
    }, /*#__PURE__*/React.createElement("div", {
      className: "bg-orange-600 text-white font-mono font-bold text-xl px-4 py-1.5 rounded-xl shadow-lg flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("i", {
      "data-lucide": "clock",
      className: "w-5 h-5"
    }), /*#__PURE__*/React.createElement("span", null, "ARRIVAL: ", slotGroup.arrival_time)), /*#__PURE__*/React.createElement("span", {
      className: "text-stone-400 text-sm font-semibold"
    }, filteredGroupOrders.length, " ", filteredGroupOrders.length === 1 ? 'Order' : 'Orders', " \u2022 ", slotGroup.total_items_count, " Total Items")), /*#__PURE__*/React.createElement("div", {
      className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
    }, filteredGroupOrders.map(order => {
      const isActionLoading = actionLoadingId === order.id;
      return /*#__PURE__*/React.createElement("div", {
        key: order.id,
        className: `rounded-2xl border flex flex-col justify-between overflow-hidden shadow-xl transition ${order.order_status === 'ready' ? 'bg-stone-900 border-emerald-500/80 ring-2 ring-emerald-500/30' : order.order_status === 'preparing' ? 'bg-stone-900 border-amber-500/80 ring-2 ring-amber-500/30' : 'bg-stone-900 border-stone-800'}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60"
      }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "text-base font-mono font-bold text-white tracking-wider"
      }, order.order_number), /*#__PURE__*/React.createElement("span", {
        className: `text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${order.dining_option === 'dine_in' ? 'bg-stone-800 text-stone-300' : 'bg-blue-950 text-blue-300 border border-blue-800'}`
      }, order.dining_option === 'dine_in' ? 'DINE-IN' : 'TAKEAWAY')), /*#__PURE__*/React.createElement("p", {
        className: "text-xs text-stone-400 mt-0.5"
      }, "Customer: ", /*#__PURE__*/React.createElement("strong", {
        className: "text-stone-200"
      }, order.customer_name))), /*#__PURE__*/React.createElement("span", {
        className: `text-xs font-bold uppercase px-3 py-1 rounded-xl tracking-wider ${order.order_status === 'ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : order.order_status === 'preparing' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse' : 'bg-orange-500/20 text-orange-400 border border-orange-500/40'}`
      }, order.order_status)), order.customer_notes && /*#__PURE__*/React.createElement("div", {
        className: "px-4 py-2 bg-amber-950/40 border-b border-amber-900/50 text-amber-200 text-xs flex items-center gap-2"
      }, /*#__PURE__*/React.createElement("i", {
        "data-lucide": "alert-triangle",
        className: "w-3.5 h-3.5 text-amber-400 flex-shrink-0"
      }), /*#__PURE__*/React.createElement("span", {
        className: "font-semibold"
      }, "Note: ", order.customer_notes)), /*#__PURE__*/React.createElement("div", {
        className: "p-4 flex-1 space-y-3 divide-y divide-stone-800/60 text-sm"
      }, order.items && order.items.map(item => /*#__PURE__*/React.createElement("div", {
        key: item.id,
        className: "pt-2 first:pt-0 space-y-1"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-start justify-between gap-2"
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2"
      }, /*#__PURE__*/React.createElement("span", {
        className: "w-7 h-7 rounded-lg bg-stone-800 text-orange-400 font-bold flex items-center justify-center text-sm border border-stone-700"
      }, item.quantity, "\xD7"), /*#__PURE__*/React.createElement("span", {
        className: "font-bold text-white text-base"
      }, item.item_name))), item.customization_data && item.customization_data.length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "pl-9 flex flex-wrap gap-1"
      }, item.customization_data.map((c, ci) => /*#__PURE__*/React.createElement("span", {
        key: ci,
        className: "bg-stone-800/90 text-amber-300 text-xs px-2 py-0.5 rounded font-mono"
      }, "\u2022 ", c.option))), item.notes && /*#__PURE__*/React.createElement("p", {
        className: "pl-9 text-xs text-orange-400 italic font-mono"
      }, "Req: \"", item.notes, "\"")))), /*#__PURE__*/React.createElement("div", {
        className: "p-4 bg-stone-950 border-t border-stone-800 flex items-center gap-3"
      }, order.order_status === 'confirmed' && /*#__PURE__*/React.createElement("button", {
        onClick: () => handleStatusTransition(order.id, 'prepare'),
        disabled: isActionLoading,
        className: "w-full bg-amber-600 hover:bg-amber-500 active:scale-95 text-stone-950 font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
      }, /*#__PURE__*/React.createElement("i", {
        "data-lucide": "flame",
        className: "w-5 h-5"
      }), /*#__PURE__*/React.createElement("span", null, "START PREPARING")), order.order_status === 'preparing' && /*#__PURE__*/React.createElement("button", {
        onClick: () => handleStatusTransition(order.id, 'ready'),
        disabled: isActionLoading,
        className: "w-full bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
      }, /*#__PURE__*/React.createElement("i", {
        "data-lucide": "bell-ring",
        className: "w-5 h-5"
      }), /*#__PURE__*/React.createElement("span", null, "MARK READY FOR ARRIVAL")), order.order_status === 'ready' && /*#__PURE__*/React.createElement("button", {
        onClick: () => handleStatusTransition(order.id, 'complete'),
        disabled: isActionLoading,
        className: "w-full bg-stone-700 hover:bg-stone-600 active:scale-95 text-white font-extrabold py-4 rounded-xl text-base tracking-wide transition shadow-lg flex items-center justify-center gap-2"
      }, /*#__PURE__*/React.createElement("i", {
        "data-lucide": "check-circle",
        className: "w-5 h-5"
      }), /*#__PURE__*/React.createElement("span", null, "HANDOVER / COMPLETE"))));
    })));
  })));
}
(function() {
    const el = document.getElementById('kitchen-root');
    if (el) {
        if (ReactDOM.createRoot) {
            ReactDOM.createRoot(el).render(React.createElement(KitchenDisplay, null));
        } else {
            ReactDOM.render(React.createElement(KitchenDisplay, null), el);
        }
    }
})();
