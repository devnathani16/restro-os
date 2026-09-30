const {
  useState,
  useEffect
} = React;
function OrderTracker() {
  const pathParts = window.location.pathname.split('/');
  const urlOrderNum = pathParts[pathParts.length - 1] && pathParts[pathParts.length - 1] !== 'track' ? pathParts[pathParts.length - 1] : '';
  const [orderNumberInput, setOrderNumberInput] = useState(urlOrderNum);
  const [searchedOrderNumber, setSearchedOrderNumber] = useState(urlOrderNum || 'ORD-');
  const [order, setOrder] = useState(null);
  const [progress, setProgress] = useState(0);
  const [restaurant, setRestaurant] = useState(window.__RESTAURANT__ || {});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const fetchOrder = num => {
    if (!num || num === 'ORD-') return;
    setLoading(true);
    setError('');
    fetch(`/api/orders/${num}/track`).then(res => res.json()).then(data => {
      setLoading(false);
      if (data.success && data.order) {
        setOrder(data.order);
        setProgress(data.progress);
        if (data.restaurant) setRestaurant(data.restaurant);
      } else {
        setError(data.message || 'Order not found. Please verify your order number.');
        setOrder(null);
      }
    }).catch(() => {
      setLoading(false);
      setError('Failed to load order. Please try again.');
    });
  };
  useEffect(() => {
    if (urlOrderNum) {
      fetchOrder(urlOrderNum);
    }
  }, [urlOrderNum]);

  // Live polling every 8 seconds for real-time status updates!
  useEffect(() => {
    if (!order || order.order_status === 'completed' || order.order_status === 'cancelled') return;
    const interval = setInterval(() => {
      fetch(`/api/orders/${order.order_number}/track`).then(res => res.json()).then(data => {
        if (data.success && data.order) {
          setOrder(data.order);
          setProgress(data.progress);
        }
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [order]);
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });
  const handleSearch = e => {
    e.preventDefault();
    if (orderNumberInput.trim()) {
      setSearchedOrderNumber(orderNumberInput.trim());
      fetchOrder(orderNumberInput.trim());
    }
  };
  const handleCancelOrder = () => {
    if (!order) return;
    setCancelling(true);
    fetch(`/api/orders/${order.order_number}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        reason: cancelReason || 'Cancelled by customer before cooking'
      })
    }).then(res => res.json().then(d => ({
      status: res.status,
      body: d
    }))).then(({
      status,
      body
    }) => {
      setCancelling(false);
      setCancelModal(false);
      if (body.success) {
        setOrder(body.order);
        alert('Order cancelled successfully.');
      } else {
        alert(body.message || 'Could not cancel order.');
      }
    }).catch(() => {
      setCancelling(false);
      alert('Error cancelling order.');
    });
  };
  const statusSteps = [{
    key: 'pending',
    label: 'Order Received',
    desc: 'Pre-order recorded in kitchen queue'
  }, {
    key: 'confirmed',
    label: 'Confirmed & Scheduled',
    desc: 'Preparation slot reserved with head chef'
  }, {
    key: 'preparing',
    label: 'Cooking in Progress',
    desc: 'Embers & woodfired hearth fired for your arrival'
  }, {
    key: 'ready',
    label: 'Hot & Plated',
    desc: 'Ready and waiting at Spice & Hearth'
  }, {
    key: 'completed',
    label: 'Completed',
    desc: 'Feast enjoyed! Thank you for dining'
  }];
  const currentStepIndex = order ? statusSteps.findIndex(s => s.key === order.order_status) : -1;
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen bg-stone-100 flex flex-col"
  }, /*#__PURE__*/React.createElement("header", {
    className: "bg-white border-b border-stone-200 py-4 px-6 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    className: "flex items-center gap-2 text-stone-900 font-serif font-bold text-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold"
  }, "S"), /*#__PURE__*/React.createElement("span", null, restaurant.name || "Spice & Hearth Bistro")), /*#__PURE__*/React.createElement("a", {
    href: "/",
    className: "text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-left",
    className: "w-3.5 h-3.5"
  }), " Back to Menu")), /*#__PURE__*/React.createElement("main", {
    className: "max-w-3xl mx-auto w-full px-4 py-8 flex-1 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-6 rounded-3xl border border-stone-200/90 shadow-sm space-y-3"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "text-xl font-serif font-bold text-stone-900"
  }, "Track Your Pre-Order"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Enter your order confirmation number to monitor live cooking status."), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleSearch,
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "e.g. ORD-2026-X8F9Q",
    value: orderNumberInput,
    onChange: e => setOrderNumberInput(e.target.value.toUpperCase()),
    className: "flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs uppercase font-mono tracking-wider focus:outline-none focus:border-orange-500 focus:bg-white"
  }), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: loading,
    className: "bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm"
  }, loading ? 'Searching...' : 'Track')), error && /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200"
  }, error)), order && /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl border border-stone-200/90 shadow-md overflow-hidden space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-[11px] font-bold uppercase tracking-wider text-orange-200"
  }, "Scheduled Arrival Window"), /*#__PURE__*/React.createElement("h3", {
    className: "text-2xl font-serif font-bold"
  }, order.arrival_date, " \u2022 ", order.arrival_time), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-orange-100 mt-0.5"
  }, "Dining Mode: ", /*#__PURE__*/React.createElement("strong", {
    className: "uppercase"
  }, order.dining_option === 'dine_in' ? 'Dine-In (Table Held)' : 'Express Takeaway'))), /*#__PURE__*/React.createElement("div", {
    className: "bg-black/20 backdrop-blur-md px-4 py-2.5 rounded-2xl text-center border border-white/20"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-orange-200 block uppercase"
  }, "Order Number"), /*#__PURE__*/React.createElement("span", {
    className: "text-sm font-mono font-bold tracking-wider"
  }, order.order_number))), /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chef-hat",
    className: "w-6 h-6 text-amber-600 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-amber-900"
  }, "\"Your food will be prepared before your selected arrival time.\""), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-amber-700"
  }, "Our kitchen reverse-schedules your cooking so each dish hits peak temperature when you arrive.")))), /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 space-y-6"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold uppercase tracking-wider text-stone-500"
  }, "Preparation Progress"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, statusSteps.map((step, idx) => {
    const isDone = currentStepIndex > idx || order.order_status === 'completed';
    const isCurrent = order.order_status === step.key;
    const isPending = currentStepIndex < idx && order.order_status !== 'completed';
    return /*#__PURE__*/React.createElement("div", {
      key: step.key,
      className: "flex items-start gap-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex flex-col items-center"
    }, /*#__PURE__*/React.createElement("div", {
      className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition shadow-sm ${isCurrent ? 'bg-orange-600 text-white ring-4 ring-orange-100 animate-pulse' : isDone ? 'bg-emerald-600 text-white' : 'bg-stone-200 text-stone-500'}`
    }, isDone ? /*#__PURE__*/React.createElement("i", {
      "data-lucide": "check",
      className: "w-4 h-4"
    }) : /*#__PURE__*/React.createElement("span", null, idx + 1)), idx < statusSteps.length - 1 && /*#__PURE__*/React.createElement("div", {
      className: `w-0.5 h-10 ${isDone ? 'bg-emerald-500' : 'bg-stone-200'}`
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex-1 pt-1"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center gap-2"
    }, /*#__PURE__*/React.createElement("h5", {
      className: `text-sm font-bold ${isCurrent ? 'text-orange-600' : isDone ? 'text-stone-900' : 'text-stone-400'}`
    }, step.label), isCurrent && /*#__PURE__*/React.createElement("span", {
      className: "bg-orange-100 text-orange-800 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse"
    }, "Active Stage")), /*#__PURE__*/React.createElement("p", {
      className: "text-xs text-stone-500 mt-0.5"
    }, step.desc)));
  }))), /*#__PURE__*/React.createElement("div", {
    className: "px-6 py-4 bg-stone-50 border-t border-stone-100 space-y-3 text-xs"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "font-bold text-stone-900 uppercase tracking-wide"
  }, "Ordered Items"), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-stone-200/80"
  }, order.items && order.items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "py-2.5 flex justify-between items-start"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "font-bold text-stone-800"
  }, item.quantity, " \xD7 ", item.item_name), item.customization_data && item.customization_data.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, item.customization_data.map(c => c.option).join(', '))), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-stone-800"
  }, "\u20B9", item.total_price)))), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-stone-200 pt-3 space-y-1 text-stone-600"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Subtotal"), /*#__PURE__*/React.createElement("span", null, "\u20B9", order.subtotal)), order.discount > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-emerald-600"
  }, /*#__PURE__*/React.createElement("span", null, "Discount"), /*#__PURE__*/React.createElement("span", null, "-\u20B9", order.discount)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Taxes & Fees"), /*#__PURE__*/React.createElement("span", null, "\u20B9", (parseFloat(order.tax) + parseFloat(order.service_charge) + parseFloat(order.packaging_charge)).toFixed(2))), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2"
  }, /*#__PURE__*/React.createElement("span", null, "Total Paid (", order.payment_status.toUpperCase(), ")"), /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600"
  }, "\u20B9", order.final_total)))), /*#__PURE__*/React.createElement("div", {
    className: "p-6 bg-white border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("a", {
    href: "tel:+919876543210",
    className: "px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "phone",
    className: "w-3.5 h-3.5 text-orange-600"
  }), " Contact Restaurant"), /*#__PURE__*/React.createElement("a", {
    href: "https://maps.google.com/?q=Indiranagar+Bangalore",
    target: "_blank",
    className: "px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-xl flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin",
    className: "w-3.5 h-3.5 text-orange-600"
  }), " Get Directions")), ['pending', 'confirmed'].includes(order.order_status) && /*#__PURE__*/React.createElement("button", {
    onClick: () => setCancelModal(true),
    className: "text-rose-600 hover:text-rose-700 font-semibold hover:underline"
  }, "Cancel Order"))), cancelModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg"
  }, "Cancel Pre-Order"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500 leading-relaxed"
  }, "Are you sure you wish to cancel order ", /*#__PURE__*/React.createElement("strong", null, order?.order_number), "? Since the kitchen has not begun cooking yet, your payment will be fully refunded."), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Optional cancellation reason...",
    value: cancelReason,
    onChange: e => setCancelReason(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl"
  }), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-end gap-2 pt-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCancelModal(false),
    className: "px-4 py-2 border rounded-xl text-xs font-semibold text-stone-700"
  }, "Keep Order"), /*#__PURE__*/React.createElement("button", {
    onClick: handleCancelOrder,
    disabled: cancelling,
    className: "px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
  }, cancelling ? 'Cancelling...' : 'Confirm Cancellation'))))));
}
(function() {
    const el = document.getElementById('track-root');
    if (el) {
        if (ReactDOM.createRoot) {
            ReactDOM.createRoot(el).render(React.createElement(OrderTracker, null));
        } else {
            ReactDOM.render(React.createElement(OrderTracker, null), el);
        }
    }
})();
