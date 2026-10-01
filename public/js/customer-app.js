const {
  useState,
  useEffect,
  useMemo,
  useRef
} = React;
function App() {
  // Application State
  const [restaurant, setRestaurant] = useState(window.__RESTAURANT__ || {});
  const [categories, setCategories] = useState([]);
  const [featuredItems, setFeaturedItems] = useState([]);
  const [popularItems, setPopularItems] = useState([]);
  const [hours, setHours] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Auth State
  const [auth, setAuth] = useState(window.__INITIAL_AUTH__ || {
    authenticated: false,
    user: null
  });
  const [showAuthModal, setShowAuthModal] = useState(() => {
    return typeof window !== 'undefined' && window.location.search.includes('auth=login');
  });
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: ''
  });
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Profile & Order History State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);

  // Menu Filters & Search
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [selectedSpice, setSelectedSpice] = useState('all');

  // Customization Modal State
  const [customizingItem, setCustomizingItem] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [customItemQuantity, setCustomItemQuantity] = useState(1);
  const [customItemNotes, setCustomItemNotes] = useState('');

  // Cart & Order Ahead State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('sh_cart_items');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Order Ahead Arrival Scheduling
  const todayStr = useMemo(() => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }, []);
  const [arrivalDate, setArrivalDate] = useState(todayStr);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [diningOption, setDiningOption] = useState('dine_in'); // 'dine_in' or 'takeaway'
  const [slotCheckResult, setSlotCheckResult] = useState(null);
  const [slotChecking, setSlotChecking] = useState(false);

  // Pricing & Summary from server
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponMessage, setCouponMessage] = useState(null);
  const [orderSummary, setOrderSummary] = useState(null);
  const [calculatingSummary, setCalculatingSummary] = useState(false);

  // Customer Checkout Info
  const [customerName, setCustomerName] = useState(auth.user?.name || '');
  const [customerEmail, setCustomerEmail] = useState(auth.user?.email || '');
  const [customerPhone, setCustomerPhone] = useState(auth.user?.phone || '');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'pay_at_restaurant'
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Success Modal
  const [completedOrder, setCompletedOrder] = useState(null);

  // Toast Alert
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'info') => {
    setToast({
      message,
      type
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Mobile Offcanvas Menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Legal / Policy Modal
  const [legalModal, setLegalModal] = useState(null); // 'privacy', 'terms', 'refund'

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('sh_cart_items', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);

  // Update customer fields when auth changes
  useEffect(() => {
    if (auth.user) {
      setCustomerName(auth.user.name || '');
      setCustomerEmail(auth.user.email || '');
      setCustomerPhone(auth.user.phone || '');
    }
  }, [auth]);

  // Load Initial Public Data from API
  useEffect(() => {
    fetch('/api/restaurant/data').then(res => res.json()).then(data => {
      if (data.restaurant) setRestaurant(data.restaurant);
      if (data.categories) setCategories(data.categories);
      if (data.featured_items) setFeaturedItems(data.featured_items);
      if (data.popular_items) setPopularItems(data.popular_items);
      if (data.hours) setHours(data.hours);
      if (data.time_slots) {
        setTimeSlots(data.time_slots);
        if (data.time_slots.length > 0 && !selectedSlotId) {
          setSelectedSlotId(data.time_slots[0].id);
        }
      }
      if (data.reviews) setReviews(data.reviews);
    }).catch(err => console.error("Error fetching menu data:", err));
  }, []);

  // Check slot availability whenever date or slot changes
  useEffect(() => {
    if (!arrivalDate || !selectedSlotId) return;
    setSlotChecking(true);
    fetch('/api/restaurant/check-slot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        date: arrivalDate,
        time_slot_id: selectedSlotId
      })
    }).then(res => res.json().then(data => ({
      status: res.status,
      body: data
    }))).then(({
      status,
      body
    }) => {
      setSlotChecking(false);
      if (status === 200 && body.available) {
        setSlotCheckResult({
          available: true,
          message: body.message,
          remaining: body.remaining_capacity
        });
      } else {
        setSlotCheckResult({
          available: false,
          message: body.message || 'Slot unavailable'
        });
      }
    }).catch(err => {
      setSlotChecking(false);
      setSlotCheckResult({
        available: true,
        message: 'Slot verified'
      });
    });
  }, [arrivalDate, selectedSlotId]);

  // Recalculate server order summary whenever cart, dining option, or applied coupon changes
  useEffect(() => {
    if (cart.length === 0) {
      setOrderSummary(null);
      return;
    }
    setCalculatingSummary(true);
    const payload = {
      items: cart.map(item => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        option_ids: item.option_ids || [],
        notes: item.notes || null
      })),
      dining_option: diningOption,
      coupon_code: appliedCoupon || null
    };
    fetch('/api/orders/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    }).then(res => res.json()).then(data => {
      setCalculatingSummary(false);
      if (data.success) {
        setOrderSummary(data);
      }
    }).catch(err => {
      setCalculatingSummary(false);
      console.error("Error calculating summary:", err);
    });
  }, [cart, diningOption, appliedCoupon]);

  // Trigger icon re-rendering
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  });

  // Handle Quick Demo Login
  const handleQuickLogin = role => {
    fetch('/api/auth/quick-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        role
      })
    }).then(res => res.json()).then(data => {
      if (data.success) {
        setAuth({
          authenticated: true,
          user: data.user
        });
        showToast(`Logged in as ${data.user.name} (${data.user.role})`, 'success');
        const searchParams = new URLSearchParams(window.location.search);
        const intended = searchParams.get('intended');
        if (intended) {
          window.location.href = intended;
        } else if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (data.user.role === 'kitchen_staff') {
          window.location.href = '/kitchen';
        }
      } else {
        showToast(data.message, 'error');
      }
    });
  };

  // Handle Regular Auth
  const handleAuthSubmit = e => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(authForm)
    }).then(res => res.json().then(data => ({
      status: res.status,
      body: data
    }))).then(({
      status,
      body
    }) => {
      setAuthLoading(false);
      if (body.success) {
        setAuth({
          authenticated: true,
          user: body.user
        });
        setShowAuthModal(false);
        showToast(body.message, 'success');
        const searchParams = new URLSearchParams(window.location.search);
        const intended = searchParams.get('intended');
        if (intended) {
          window.location.href = intended;
        } else if (body.user.role === 'admin') {
          window.location.href = '/admin';
        } else if (body.user.role === 'kitchen_staff') {
          window.location.href = '/kitchen';
        }
      } else {
        setAuthError(body.message || 'Authentication failed. Please check your inputs.');
      }
    }).catch(err => {
      setAuthLoading(false);
      setAuthError('Connection error. Please try again.');
    });
  };
  const handleLogout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: {
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      }
    }).then(() => {
      setAuth({
        authenticated: false,
        user: null
      });
      showToast('Logged out successfully', 'info');
    });
  };

  // Load Customer Orders
  const loadMyOrders = () => {
    if (!auth.authenticated) return;
    setLoadingMyOrders(true);
    fetch('/api/orders/my-orders', {
      headers: {
        'Accept': 'application/json'
      }
    }).then(res => res.json()).then(data => {
      setLoadingMyOrders(false);
      if (data.success) {
        setMyOrders(data.orders);
      }
    }).catch(() => setLoadingMyOrders(false));
  };

  // Customization Modal Opening
  const openCustomizer = item => {
    setCustomizingItem(item);
    setCustomItemQuantity(1);
    setCustomItemNotes('');

    // Pre-select defaults for required groups
    const initialSelected = {};
    if (item.customization_groups) {
      item.customization_groups.forEach(group => {
        if (group.required && group.options && group.options.length > 0) {
          initialSelected[group.id] = [group.options[0].id];
        } else {
          initialSelected[group.id] = [];
        }
      });
    }
    setSelectedOptions(initialSelected);
  };

  // Toggle customization option selection
  const toggleOption = (group, option) => {
    setSelectedOptions(prev => {
      const currentSelected = prev[group.id] || [];
      if (group.max_selection === 1) {
        return {
          ...prev,
          [group.id]: [option.id]
        };
      } else {
        if (currentSelected.includes(option.id)) {
          return {
            ...prev,
            [group.id]: currentSelected.filter(id => id !== option.id)
          };
        } else {
          if (currentSelected.length < group.max_selection) {
            return {
              ...prev,
              [group.id]: [...currentSelected, option.id]
            };
          }
          return prev;
        }
      }
    });
  };

  // Add Customized Item to Cart
  const addCustomizedItemToCart = () => {
    if (!customizingItem) return;

    // Gather all selected option IDs
    const allOptionIds = [];
    const chosenOptionsDisplay = [];
    if (customizingItem.customization_groups) {
      customizingItem.customization_groups.forEach(group => {
        const groupSelected = selectedOptions[group.id] || [];
        group.options.forEach(opt => {
          if (groupSelected.includes(opt.id)) {
            allOptionIds.push(opt.id);
            chosenOptionsDisplay.push({
              group: group.name,
              option: opt.name,
              price: opt.additional_price
            });
          }
        });
      });
    }
    const cartItem = {
      id: 'cart_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      menu_item_id: customizingItem.id,
      name: customizingItem.name,
      base_price: customizingItem.discounted_price || customizingItem.price,
      image: customizingItem.image,
      vegetarian: customizingItem.vegetarian,
      quantity: customItemQuantity,
      option_ids: allOptionIds,
      customizations: chosenOptionsDisplay,
      notes: customItemNotes
    };
    setCart(prev => [...prev, cartItem]);
    setCustomizingItem(null);
    showToast(`Added ${customizingItem.name} to your pre-order!`, 'success');
    setIsCartOpen(true);
  };

  // Adjust Cart Item Quantity
  const updateCartQuantity = (cartItemId, newQty) => {
    if (newQty <= 0) {
      setCart(prev => prev.filter(i => i.id !== cartItemId));
    } else {
      setCart(prev => prev.map(i => i.id === cartItemId ? {
        ...i,
        quantity: newQty
      } : i));
    }
  };

  // Apply Coupon
  const handleApplyCoupon = e => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    const subtotal = orderSummary ? orderSummary.subtotal : 500;
    fetch('/api/restaurant/validate-coupon', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        code: couponCode,
        subtotal
      })
    }).then(res => res.json().then(data => ({
      status: res.status,
      body: data
    }))).then(({
      status,
      body
    }) => {
      if (status === 200 && body.valid) {
        setAppliedCoupon(body.code);
        setCouponMessage({
          type: 'success',
          text: body.message
        });
      } else {
        setCouponMessage({
          type: 'error',
          text: body.message || 'Invalid coupon'
        });
      }
    }).catch(() => setCouponMessage({
      type: 'error',
      text: 'Error applying coupon'
    }));
  };

  // Submit Pre-Order
  const handleCheckoutSubmit = e => {
    e.preventDefault();
    setCheckoutError('');
    if (cart.length === 0) {
      setCheckoutError('Your cart is empty. Please select food items from the menu.');
      return;
    }
    if (!customerName || !customerPhone || !customerEmail) {
      setCheckoutError('Please provide your name, phone number, and email.');
      return;
    }
    if (slotCheckResult && !slotCheckResult.available) {
      setCheckoutError(slotCheckResult.message || 'Selected time slot is unavailable. Please pick another slot.');
      return;
    }
    setIsSubmittingOrder(true);
    const orderPayload = {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      arrival_date: arrivalDate,
      time_slot_id: selectedSlotId,
      dining_option: diningOption,
      payment_method: paymentMethod,
      customer_notes: customerNotes,
      coupon_code: appliedCoupon || null,
      items: cart.map(i => ({
        menu_item_id: i.menu_item_id,
        quantity: i.quantity,
        option_ids: i.option_ids || [],
        notes: i.notes || null
      }))
    };
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
        'Accept': 'application/json'
      },
      body: JSON.stringify(orderPayload)
    }).then(res => res.json().then(data => ({
      status: res.status,
      body: data
    }))).then(({
      status,
      body
    }) => {
      if (status === 200 && body.success) {
        const createdOrder = body.order;

        // If payment is online, trigger simulated payment verification
        if (paymentMethod === 'online') {
          fetch('/api/payments/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-TOKEN': window.__CSRF_TOKEN__,
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              order_id: createdOrder.id,
              payment_id: 'pay_rzp_mock_' + Math.random().toString(36).substr(2, 9),
              payment_method_type: 'upi'
            })
          }).then(pRes => pRes.json()).then(pData => {
            finalizeOrderPlacement(pData.order || createdOrder);
          });
        } else {
          finalizeOrderPlacement(createdOrder);
        }
      } else {
        setIsSubmittingOrder(false);
        setCheckoutError(body.message || 'Could not place order. Please review your details.');
      }
    }).catch(err => {
      setIsSubmittingOrder(false);
      setCheckoutError('Network error. Please try again.');
    });
  };
  const finalizeOrderPlacement = order => {
    setIsSubmittingOrder(false);
    setCart([]);
    localStorage.removeItem('sh_cart_items');
    setIsCartOpen(false);
    setCompletedOrder(order);
    showToast(`Order ${order.order_number} confirmed! Our kitchen has scheduled your meal.`, 'success');
  };

  // Filter Dishes
  const filteredDishes = useMemo(() => {
    let allDishes = [];
    categories.forEach(cat => {
      if (activeCategory === 'all' || cat.slug === activeCategory) {
        if (cat.menu_items) {
          allDishes = [...allDishes, ...cat.menu_items.map(m => ({
            ...m,
            category_name: cat.name
          }))];
        }
      }
    });
    return allDishes.filter(dish => {
      if (vegOnly && !dish.vegetarian) return false;
      if (selectedSpice !== 'all' && dish.spice_level !== parseInt(selectedSpice)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = dish.name.toLowerCase().includes(q);
        const matchDesc = dish.description && dish.description.toLowerCase().includes(q);
        const matchCat = dish.category_name && dish.category_name.toLowerCase().includes(q);
        if (!matchName && !matchDesc && !matchCat) return false;
      }
      return true;
    });
  }, [categories, activeCategory, vegOnly, selectedSpice, searchQuery]);

  // Available Advance Booking Dates (today + max_advance_days)
  const availableDates = useMemo(() => {
    const dates = [];
    const maxDays = restaurant.max_advance_days || 7;
    const now = new Date();
    for (let i = 0; i <= maxDays; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
      dates.push({
        iso,
        label
      });
    }
    return dates;
  }, [restaurant]);
  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen flex flex-col bg-stone-50"
  }, /*#__PURE__*/React.createElement("header", {
    className: "sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 transition-all shadow-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("a", {
    href: "/",
    className: "flex items-center gap-3 group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-xl overflow-hidden bg-orange-100 flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform"
  }, /*#__PURE__*/React.createElement("img", {
    src: restaurant.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
    alt: "Logo",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-xl font-serif font-bold text-stone-900 tracking-tight block leading-tight"
  }, restaurant.name || 'Spice & Hearth Bistro'), /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-orange-600 font-medium tracking-wide flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-3 h-3"
  }), " Pre-Order & Dine Without Wait"))), /*#__PURE__*/React.createElement("nav", {
    className: "hidden md:flex items-center gap-6 text-sm font-medium text-stone-700"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#order-ahead",
    className: "hover:text-orange-600 transition flex items-center gap-1.5 text-orange-600 font-semibold"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-clock",
    className: "w-4 h-4"
  }), " Order Ahead"), /*#__PURE__*/React.createElement("a", {
    href: "#menu",
    className: "hover:text-orange-600 transition"
  }, "Food Menu"), /*#__PURE__*/React.createElement("a", {
    href: "#story",
    className: "hover:text-orange-600 transition"
  }, "Our Craft"), /*#__PURE__*/React.createElement("a", {
    href: "#reviews",
    className: "hover:text-orange-600 transition"
  }, "Reviews"), /*#__PURE__*/React.createElement("a", {
    href: "/track",
    className: "hover:text-orange-600 transition flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "compass",
    className: "w-3.5 h-3.5"
  }), " Track Order"), auth.authenticated && (auth.user.role === 'admin' || auth.user.role === 'kitchen_staff') && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("a", {
    href: "/kitchen",
    className: "hover:text-amber-700 transition flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 text-amber-800 rounded-lg border border-amber-200 font-medium"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chef-hat",
    className: "w-3.5 h-3.5"
  }), " Kitchen KDS"), auth.user.role === 'admin' && /*#__PURE__*/React.createElement("a", {
    href: "/admin",
    className: "hover:text-orange-700 transition flex items-center gap-1 text-xs px-2.5 py-1 bg-orange-50 text-orange-800 rounded-lg border border-orange-200 font-medium"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shield",
    className: "w-3.5 h-3.5"
  }), " Admin Portal"))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, auth.authenticated ? /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      loadMyOrders();
      setShowProfileModal(true);
    },
    className: "flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 px-3.5 py-2 rounded-full text-sm font-medium transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "user",
    className: "w-4 h-4 text-orange-600"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, auth.user.name.split(' ')[0])) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setAuthMode('login');
      setShowAuthModal(true);
    },
    className: "hidden sm:inline-flex text-sm font-medium text-stone-700 hover:text-orange-600 px-3 py-2"
  }, "Sign In"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsCartOpen(true),
    className: "relative bg-orange-600 hover:bg-orange-700 text-white px-4 py-2.5 rounded-full font-medium text-sm flex items-center gap-2 shadow-md hover:shadow-lg transition transform active:scale-95"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shopping-bag",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", {
    className: "hidden sm:inline"
  }, "Your Tray"), totalCartItemsCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
  }, totalCartItemsCount)), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsMobileMenuOpen(true),
    className: "md:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition active:scale-95",
    "aria-label": "Open navigation menu"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "w-5 h-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M4 6h16M4 12h16M4 18h16"
  })))))), isMobileMenuOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 md:hidden"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 bg-stone-900/60 backdrop-blur-sm",
    onClick: () => setIsMobileMenuOpen(false),
    style: {
      animation: 'fadeIn 0.2s ease-out'
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-0 right-0 h-full w-[85%] max-w-sm bg-white/95 backdrop-blur-xl shadow-2xl flex flex-col",
    style: {
      animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-5 border-b border-stone-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-xl overflow-hidden bg-orange-100 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("img", {
    src: restaurant.logo || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=200&q=80",
    alt: "Logo",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-base font-serif font-bold text-stone-900 block leading-tight"
  }, restaurant.name || 'Spice & Hearth Bistro'), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-orange-600 font-medium tracking-wide"
  }, "Pre-Order & Dine"))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsMobileMenuOpen(false),
    className: "w-9 h-9 rounded-xl bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 transition",
    "aria-label": "Close menu"
  }, /*#__PURE__*/React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    className: "w-5 h-5",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: "2"
  }, /*#__PURE__*/React.createElement("path", {
    strokeLinecap: "round",
    strokeLinejoin: "round",
    d: "M6 18L18 6M6 6l12 12"
  })))), /*#__PURE__*/React.createElement("div", {
    className: "px-5 pt-4"
  }, auth.authenticated ? /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-orange-600 flex items-center justify-center text-white font-bold text-sm"
  }, auth.user.name.charAt(0).toUpperCase()), /*#__PURE__*/React.createElement("div", {
    className: "flex-1 min-w-0"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-semibold text-stone-900 truncate"
  }, auth.user.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500 truncate"
  }, auth.user.email))) : /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIsMobileMenuOpen(false);
      setAuthMode('login');
      setShowAuthModal(true);
    },
    className: "w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 hover:border-orange-200 transition"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "user-plus",
    className: "w-5 h-5"
  })), /*#__PURE__*/React.createElement("div", {
    className: "text-left"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-sm font-semibold text-stone-900"
  }, "Sign In / Register"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Track orders & earn rewards")))), /*#__PURE__*/React.createElement("nav", {
    className: "flex-1 overflow-y-auto px-5 pt-5 pb-4 space-y-1"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] font-bold uppercase tracking-widest text-stone-400 px-3 pb-2"
  }, "Navigate"), /*#__PURE__*/React.createElement("a", {
    href: "#order-ahead",
    onClick: () => setIsMobileMenuOpen(false),
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-orange-600 bg-orange-50 font-semibold text-sm transition hover:bg-orange-100"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-clock",
    className: "w-5 h-5"
  }), /*#__PURE__*/React.createElement("span", null, "Order Ahead"), /*#__PURE__*/React.createElement("span", {
    className: "ml-auto bg-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full"
  }, "NEW")), /*#__PURE__*/React.createElement("a", {
    href: "#menu",
    onClick: () => setIsMobileMenuOpen(false),
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-50 text-sm transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "utensils-crossed",
    className: "w-5 h-5 text-stone-400"
  }), /*#__PURE__*/React.createElement("span", null, "Food Menu")), /*#__PURE__*/React.createElement("a", {
    href: "#story",
    onClick: () => setIsMobileMenuOpen(false),
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-50 text-sm transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "book-open",
    className: "w-5 h-5 text-stone-400"
  }), /*#__PURE__*/React.createElement("span", null, "Our Craft")), /*#__PURE__*/React.createElement("a", {
    href: "#reviews",
    onClick: () => setIsMobileMenuOpen(false),
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-50 text-sm transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "star",
    className: "w-5 h-5 text-stone-400"
  }), /*#__PURE__*/React.createElement("span", null, "Reviews")), /*#__PURE__*/React.createElement("a", {
    href: "/track",
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-stone-700 hover:bg-stone-50 text-sm transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "compass",
    className: "w-5 h-5 text-stone-400"
  }), /*#__PURE__*/React.createElement("span", null, "Track Order")), auth.authenticated && (auth.user.role === 'admin' || auth.user.role === 'kitchen_staff') && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "pt-4 pb-2"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] font-bold uppercase tracking-widest text-stone-400 px-3 pb-2"
  }, "Staff Access")), /*#__PURE__*/React.createElement("a", {
    href: "/kitchen",
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-amber-800 bg-amber-50/60 hover:bg-amber-50 text-sm transition border border-amber-100/60"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chef-hat",
    className: "w-5 h-5"
  }), /*#__PURE__*/React.createElement("span", null, "Kitchen KDS")), auth.user.role === 'admin' && /*#__PURE__*/React.createElement("a", {
    href: "/admin",
    className: "flex items-center gap-3 px-3 py-3 rounded-xl text-orange-800 bg-orange-50/60 hover:bg-orange-50 text-sm transition border border-orange-100/60"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shield",
    className: "w-5 h-5"
  }), /*#__PURE__*/React.createElement("span", null, "Admin Portal")))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-t border-stone-100 space-y-3 bg-stone-50/80"
  }, auth.authenticated && /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIsMobileMenuOpen(false);
      loadMyOrders();
      setShowProfileModal(true);
    },
    className: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-medium text-stone-700 hover:bg-stone-50 transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "user",
    className: "w-4 h-4"
  }), " Profile"), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIsMobileMenuOpen(false);
      handleLogout();
    },
    className: "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white border border-stone-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "log-out",
    className: "w-4 h-4"
  }), " Log Out")), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setIsMobileMenuOpen(false);
      setIsCartOpen(true);
    },
    className: "w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold text-sm shadow-lg shadow-orange-600/20 transition active:scale-[0.98]"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shopping-bag",
    className: "w-4 h-4"
  }), "View Your Tray", totalCartItemsCount > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-white text-orange-600 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ml-1"
  }, totalCartItemsCount))))), /*#__PURE__*/React.createElement("section", {
    className: "relative bg-gradient-to-b from-stone-900 via-stone-900 to-stone-950 text-white overflow-hidden py-20 lg:py-28"
  }, /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-0 opacity-25 mix-blend-overlay"
  }, /*#__PURE__*/React.createElement("img", {
    src: restaurant.cover_image || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    alt: "Background",
    className: "w-full h-full object-cover"
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-1/4 -left-20 w-80 h-80 bg-orange-600/30 rounded-full blur-3xl pointer-events-none"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-10 right-0 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"
  }), /*#__PURE__*/React.createElement("div", {
    className: "relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-12 gap-12 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-7 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-300 text-xs font-semibold uppercase tracking-wider"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "sparkles",
    className: "w-3.5 h-3.5"
  }), " The Zero-Wait Culinary Revolution"), /*#__PURE__*/React.createElement("h1", {
    className: "text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight leading-[1.15]"
  }, "Order Ahead.", /*#__PURE__*/React.createElement("br", null), "Arrive to a ", /*#__PURE__*/React.createElement("span", {
    className: "text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500"
  }, "Piping Hot Feast"), "."), /*#__PURE__*/React.createElement("p", {
    className: "text-lg text-stone-300 max-w-xl leading-relaxed"
  }, "Don't waste 45 minutes waiting for fresh tandoor roasting or slow-dum biryani preparation. Select your arrival slot, customize your dishes, and our chefs ensure your table is served the moment you arrive."), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-4 pt-2"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#order-ahead",
    className: "bg-orange-600 hover:bg-orange-500 text-white px-7 py-3.5 rounded-xl font-semibold text-base shadow-lg shadow-orange-600/30 hover:shadow-orange-500/50 transition transform hover:-translate-y-0.5 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar-clock",
    className: "w-5 h-5"
  }), " Order Ahead for Arrival"), /*#__PURE__*/React.createElement("a", {
    href: "#menu",
    className: "bg-stone-800/80 hover:bg-stone-700/80 text-stone-200 border border-stone-700 px-7 py-3.5 rounded-xl font-semibold text-base transition backdrop-blur-sm flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "utensils-crossed",
    className: "w-5 h-5"
  }), " View Full Menu")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 gap-4 pt-6 border-t border-stone-800 text-stone-400 text-xs sm:text-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-800/50 flex items-center justify-center text-orange-400"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flame",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", null, "Cooked Fresh to Slot")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-800/50 flex items-center justify-center text-orange-400"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "utensils",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", null, "Dine-In or Takeaway")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-8 h-8 rounded-lg bg-orange-950/60 border border-orange-800/50 flex items-center justify-center text-orange-400"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shield-check",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("span", null, "Zero Food Waste")))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-5 relative"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-stone-800/70 border border-stone-700/80 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-700 pb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-10 h-10 rounded-full bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400 font-bold"
  }, "7:30"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "text-white font-medium text-sm"
  }, "Target Arrival Schedule"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400"
  }, "Today \u2022 Table Ready @ 7:30 PM"))), /*#__PURE__*/React.createElement("span", {
    className: "bg-emerald-500/20 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/30 font-medium"
  }, "Kitchen Synced")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=100&q=80",
    className: "w-10 h-10 rounded-lg object-cover"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-medium text-white"
  }, "Royal Nizami Dum Biryani"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-400"
  }, "Clay handi sealed \u2022 Medium Spice"))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-orange-400"
  }, "\u20B9440")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between p-3 rounded-xl bg-stone-900/60 border border-stone-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=100&q=80",
    className: "w-10 h-10 rounded-lg object-cover"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-medium text-white"
  }, "Burrata Margherita Pizza"), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-400"
  }, "Sourdough 72h \u2022 Stuffed Crust"))), /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-semibold text-orange-400"
  }, "\u20B9540"))), /*#__PURE__*/React.createElement("div", {
    className: "p-3.5 bg-orange-600/10 border border-orange-500/20 rounded-2xl flex items-center justify-between text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-orange-300"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chef-hat",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Chef prep starts at 7:10 PM")), /*#__PURE__*/React.createElement("span", {
    className: "text-stone-300 font-semibold"
  }, "Ready upon entry"))))))), /*#__PURE__*/React.createElement("section", {
    id: "order-ahead",
    className: "relative -mt-10 max-w-6xl mx-auto px-4 sm:px-6 w-full z-20"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-2xl shadow-xl border border-stone-200/80 p-6 md:p-8 backdrop-blur-lg"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-stone-100"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "w-3 h-3 rounded-full bg-orange-500 animate-pulse"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-xl font-bold text-stone-900 font-serif"
  }, "1. Select Your Arrival Window")), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-stone-500"
  }, "Pick when you plan to arrive so our chefs can time preparation to the minute.")), /*#__PURE__*/React.createElement("div", {
    className: "inline-flex p-1 bg-stone-100 rounded-xl"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setDiningOption('dine_in'),
    className: `px-4 py-2 rounded-lg text-sm font-semibold transition ${diningOption === 'dine_in' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "utensils",
    className: "w-4 h-4 inline-block mr-1.5"
  }), " Dine-In (Table Held)"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setDiningOption('takeaway'),
    className: `px-4 py-2 rounded-lg text-sm font-semibold transition ${diningOption === 'takeaway' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600 hover:text-stone-900'}`
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "package",
    className: "w-4 h-4 inline-block mr-1.5"
  }), " Express Takeaway"))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-12 gap-6 pt-6 items-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-4 space-y-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold uppercase tracking-wider text-stone-500"
  }, "Target Date"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 sm:grid-cols-3 gap-2"
  }, availableDates.slice(0, 6).map(d => /*#__PURE__*/React.createElement("button", {
    key: d.iso,
    type: "button",
    onClick: () => setArrivalDate(d.iso),
    className: `p-2.5 rounded-xl border text-center transition ${arrivalDate === d.iso ? 'border-orange-500 bg-orange-50/70 text-orange-700 font-semibold' : 'border-stone-200 hover:border-stone-300 text-stone-700'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: "block text-xs"
  }, d.label), /*#__PURE__*/React.createElement("span", {
    className: "block text-[11px] text-stone-400"
  }, d.iso.slice(5)))))), /*#__PURE__*/React.createElement("div", {
    className: "md:col-span-8 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-semibold uppercase tracking-wider text-stone-500"
  }, "Arrival Time Slot (30-min preparation intervals)"), slotChecking && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-orange-600 flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"
  }), " Checking capacity...")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
  }, timeSlots.map(slot => {
    const isSelected = selectedSlotId === slot.id;
    const timeDisplay = slot.start_time.slice(0, 5);
    return /*#__PURE__*/React.createElement("button", {
      key: slot.id,
      type: "button",
      onClick: () => setSelectedSlotId(slot.id),
      className: `p-2 rounded-xl border text-center transition ${isSelected ? 'border-orange-600 bg-orange-600 text-white font-bold shadow-md' : 'border-stone-200 bg-white hover:border-orange-300 text-stone-800'}`
    }, /*#__PURE__*/React.createElement("span", {
      className: "block text-sm"
    }, timeDisplay), /*#__PURE__*/React.createElement("span", {
      className: `block text-[10px] ${isSelected ? 'text-orange-100' : 'text-stone-400'}`
    }, "Max ", slot.maximum_orders));
  })), slotCheckResult && /*#__PURE__*/React.createElement("div", {
    className: `p-3 rounded-xl text-xs flex items-center gap-2 mt-3 ${slotCheckResult.available ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": slotCheckResult.available ? "check-circle-2" : "alert-circle",
    className: "w-4 h-4 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, slotCheckResult.message)))))), popularItems.length > 0 && /*#__PURE__*/React.createElement("section", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 text-xs font-bold uppercase tracking-widest block mb-1"
  }, "Chef Recommends"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-serif font-bold text-stone-900"
  }, "Most Loved Pre-Orders")), /*#__PURE__*/React.createElement("a", {
    href: "#menu",
    className: "text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
  }, "Browse full menu ", /*#__PURE__*/React.createElement("i", {
    "data-lucide": "arrow-right",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
  }, popularItems.slice(0, 3).map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-48 overflow-hidden bg-stone-100"
  }, /*#__PURE__*/React.createElement("img", {
    src: item.image,
    alt: item.name,
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded flex items-center justify-center bg-white shadow-sm border ${item.vegetarian ? 'border-emerald-600' : 'border-rose-600'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${item.vegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`
  })), /*#__PURE__*/React.createElement("span", {
    className: "bg-orange-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm"
  }, "Popular")), /*#__PURE__*/React.createElement("span", {
    className: "absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white text-[11px] px-2.5 py-1 rounded-full font-medium flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-3 h-3"
  }), " ", item.preparation_time, "m prep")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 flex-1 flex flex-col justify-between space-y-4"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 text-base leading-snug group-hover:text-orange-600 transition"
  }, item.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500 mt-1 line-clamp-2"
  }, item.description)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-3 border-t border-stone-100"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-lg font-bold text-stone-900"
  }, "\u20B9", item.discounted_price || item.price), item.discounted_price && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-stone-400 line-through ml-2"
  }, "\u20B9", item.price)), /*#__PURE__*/React.createElement("button", {
    onClick: () => openCustomizer(item),
    className: "bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold transition border border-orange-200 hover:border-transparent flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-3.5 h-3.5"
  }), " Customize"))))))), /*#__PURE__*/React.createElement("section", {
    id: "menu",
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center max-w-2xl mx-auto mb-10 space-y-2"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 text-xs font-bold uppercase tracking-widest"
  }, "Handcrafted Menu"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl sm:text-4xl font-serif font-bold text-stone-900"
  }, "Explore Our Food Menu"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-stone-500"
  }, "Every item is prepared from scratch upon pre-order so that it arrives freshly cooked at your chosen time.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-white p-4 rounded-2xl shadow-sm border border-stone-200 mb-8 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row md:items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative flex-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search",
    className: "w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400"
  }), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Search dishes by name, ingredients, or spices...",
    value: searchQuery,
    onChange: e => setSearchQuery(e.target.value),
    className: "w-full pl-10 pr-4 py-2.5 bg-stone-50 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-orange-500 focus:bg-white transition"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-wrap items-center gap-2.5 text-xs"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setVegOnly(!vegOnly),
    className: `px-3 py-2 rounded-xl font-medium border transition flex items-center gap-1.5 ${vegOnly ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-emerald-300'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${vegOnly ? 'bg-white' : 'bg-emerald-600'}`
  }), "Vegetarian Only"), /*#__PURE__*/React.createElement("select", {
    value: selectedSpice,
    onChange: e => setSelectedSpice(e.target.value),
    className: "px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs font-medium focus:outline-none focus:border-orange-500"
  }, /*#__PURE__*/React.createElement("option", {
    value: "all"
  }, "All Spice Levels"), /*#__PURE__*/React.createElement("option", {
    value: "0"
  }, "Mild / No Spice"), /*#__PURE__*/React.createElement("option", {
    value: "1"
  }, "Mildly Spiced (Level 1)"), /*#__PURE__*/React.createElement("option", {
    value: "2"
  }, "Medium Spicy (Level 2)"), /*#__PURE__*/React.createElement("option", {
    value: "3"
  }, "Fiery Hot (Level 3)")))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-t border-stone-100 pt-3"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setActiveCategory('all'),
    className: `px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${activeCategory === 'all' ? 'bg-stone-900 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`
  }, "All Categories (", categories.reduce((acc, c) => acc + (c.menu_items?.length || 0), 0), ")"), categories.map(cat => /*#__PURE__*/React.createElement("button", {
    key: cat.id,
    onClick: () => setActiveCategory(cat.slug),
    className: `px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${activeCategory === cat.slug ? 'bg-orange-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`
  }, cat.name, " (", cat.menu_items?.length || 0, ")")))), filteredDishes.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "text-center py-16 bg-white rounded-2xl border border-dashed border-stone-300"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "search-x",
    className: "w-12 h-12 text-stone-300 mx-auto mb-3"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "text-base font-semibold text-stone-700"
  }, "No dishes match your filter"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400 mt-1"
  }, "Try resetting the vegetarian filter or search query."), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      setActiveCategory('all');
      setSearchQuery('');
      setVegOnly(false);
      setSelectedSpice('all');
    },
    className: "mt-4 px-4 py-2 bg-stone-100 text-stone-700 rounded-xl text-xs font-medium hover:bg-stone-200"
  }, "Clear all filters")) : /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, filteredDishes.map(dish => /*#__PURE__*/React.createElement("div", {
    key: dish.id,
    className: "bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-md transition flex flex-col group"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-48 overflow-hidden bg-stone-100"
  }, /*#__PURE__*/React.createElement("img", {
    src: dish.image,
    alt: dish.name,
    className: "w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute top-3 left-3 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-5 h-5 rounded flex items-center justify-center bg-white shadow border ${dish.vegetarian ? 'border-emerald-600' : 'border-rose-600'}`
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2.5 h-2.5 rounded-full ${dish.vegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`
  })), dish.featured && /*#__PURE__*/React.createElement("span", {
    className: "bg-amber-500 text-stone-900 text-[10px] font-bold px-2 py-0.5 rounded-full"
  }, "Featured")), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 right-3 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "bg-black/75 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-3 h-3 text-orange-400"
  }), " ", dish.preparation_time, "m prep"), dish.spice_level > 0 && /*#__PURE__*/React.createElement("span", {
    className: "bg-black/75 backdrop-blur-sm text-orange-400 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "flame",
    className: "w-3 h-3"
  }), " ", dish.spice_level === 1 ? 'Mild' : dish.spice_level === 2 ? 'Med' : 'Hot'))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 flex-1 flex flex-col justify-between space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-1.5"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start justify-between gap-2"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 text-base leading-snug group-hover:text-orange-600 transition"
  }, dish.name)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500 line-clamp-2 leading-relaxed"
  }, dish.description), dish.allergens && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block"
  }, "Allergens: ", dish.allergens)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-3 border-t border-stone-100"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-lg font-bold text-stone-900"
  }, "\u20B9", dish.discounted_price || dish.price), dish.discounted_price && /*#__PURE__*/React.createElement("span", {
    className: "text-xs text-stone-400 line-through ml-1.5"
  }, "\u20B9", dish.price)), /*#__PURE__*/React.createElement("button", {
    onClick: () => openCustomizer(dish),
    className: "bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm hover:shadow active:scale-95 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-3.5 h-3.5"
  }), /*#__PURE__*/React.createElement("span", null, "Customize & Add")))))))), /*#__PURE__*/React.createElement("section", {
    id: "story",
    className: "bg-stone-900 text-stone-200 py-20 border-t border-stone-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-12 gap-12 items-center"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-6 space-y-5"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-500 text-xs font-bold uppercase tracking-widest"
  }, "Our Culinary Philosophy"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl sm:text-4xl font-serif font-bold text-white leading-tight"
  }, "Slow-Cooked Artistry,", /*#__PURE__*/React.createElement("br", null), "Paced to Your Schedule."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-stone-300 leading-relaxed"
  }, "At Spice & Hearth Bistro, we reject the notion that exceptional dining requires an agonizing wait, or that pre-prepared food must sit under stale heat lamps."), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-stone-400 leading-relaxed"
  }, "Our bespoke Kitchen Display System reverse-engineers our preparation: whether it's a 72-hour cold fermented sourdough crust that requires 18 minutes in an oak-fired hearth, or a sealed clay handi biryani cooked over charcoal dum, our chefs start firing dishes strictly according to your selected arrival window."), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-4 pt-4 border-t border-stone-800 text-xs"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "font-semibold text-white"
  }, "Live Embers & Tandoor"), /*#__PURE__*/React.createElement("p", {
    className: "text-stone-400 mt-0.5"
  }, "Cooked with authentic oak lumpwood charcoal.")), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h4", {
    className: "font-semibold text-white"
  }, "Zero Heat-Lamp Warming"), /*#__PURE__*/React.createElement("p", {
    className: "text-stone-400 mt-0.5"
  }, "Plated directly from flame to your table.")))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-6 grid grid-cols-2 gap-4"
  }, /*#__PURE__*/React.createElement("img", {
    src: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80",
    className: "rounded-2xl object-cover h-64 w-full shadow-lg",
    alt: "Kitchen Prep"
  }), /*#__PURE__*/React.createElement("img", {
    src: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80",
    className: "rounded-2xl object-cover h-64 w-full shadow-lg mt-8",
    alt: "Woodfired Pizza"
  }))))), /*#__PURE__*/React.createElement("section", {
    id: "reviews",
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "text-center max-w-xl mx-auto mb-10 space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 text-xs font-bold uppercase tracking-widest"
  }, "Real Customer Experiences"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-serif font-bold text-stone-900"
  }, "What Diners Are Saying")), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  }, reviews.map(rev => /*#__PURE__*/React.createElement("div", {
    key: rev.id,
    className: "bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-3 flex flex-col justify-between"
  }, /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1 text-amber-500"
  }, [...Array(rev.rating || 5)].map((_, i) => /*#__PURE__*/React.createElement("i", {
    key: i,
    "data-lucide": "star",
    className: "w-4 h-4 fill-amber-400 text-amber-400"
  }))), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-600 italic leading-relaxed"
  }, "\"", rev.comment, "\"")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-3 border-t border-stone-100 text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-stone-900"
  }, rev.customer_name), rev.dish_name && /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 bg-orange-50 px-2 py-0.5 rounded text-[11px] font-medium"
  }, rev.dish_name)))))), /*#__PURE__*/React.createElement("section", {
    className: "bg-white border-t border-stone-200 py-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "grid lg:grid-cols-12 gap-8 items-start"
  }, /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-5 space-y-6"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 text-xs font-bold uppercase tracking-widest"
  }, "Visit Spice & Hearth"), /*#__PURE__*/React.createElement("h2", {
    className: "text-3xl font-serif font-bold text-stone-900 mt-1"
  }, "Location & Timings"), /*#__PURE__*/React.createElement("p", {
    className: "text-sm text-stone-500 mt-2"
  }, "Located centrally in Indiranagar, Bengaluru with valet parking and indoor/outdoor hearth seating.")), /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 text-sm text-stone-700"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-start gap-3"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "map-pin",
    className: "w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5"
  }), /*#__PURE__*/React.createElement("span", null, restaurant.address || "452 Indiranagar 100ft Road, Bengaluru, Karnataka 560038")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "phone",
    className: "w-5 h-5 text-orange-600 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, restaurant.phone || "+91 98765 43210")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "mail",
    className: "w-5 h-5 text-orange-600 flex-shrink-0"
  }), /*#__PURE__*/React.createElement("span", null, restaurant.email || "concierge@spiceandhearth.com"))), /*#__PURE__*/React.createElement("div", {
    className: "border border-stone-200 rounded-xl overflow-hidden text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-stone-50 px-4 py-2 font-semibold text-stone-700 border-b border-stone-200 flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Day"), /*#__PURE__*/React.createElement("span", null, "Operating Hours")), /*#__PURE__*/React.createElement("div", {
    className: "divide-y divide-stone-100"
  }, hours.map(h => /*#__PURE__*/React.createElement("div", {
    key: h.id,
    className: "px-4 py-2 flex justify-between items-center text-stone-600"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-medium text-stone-800"
  }, h.day), /*#__PURE__*/React.createElement("span", null, h.is_closed ? /*#__PURE__*/React.createElement("span", {
    className: "text-rose-600 font-medium"
  }, "Closed") : `${h.opening_time.slice(0, 5)} - ${h.closing_time.slice(0, 5)}`)))))), /*#__PURE__*/React.createElement("div", {
    className: "lg:col-span-7 h-96 rounded-2xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100"
  }, /*#__PURE__*/React.createElement("iframe", {
    src: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.985472851221!2d77.6406987!3d12.9727508!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae16a7eb2b851b%3A0x6b6459d8c8230538!2sIndiranagar%2C%20Bengaluru!5e0!3m2!1sen!2sin!4v1700000000000",
    width: "100%",
    height: "100%",
    style: {
      border: 0
    },
    allowFullScreen: "",
    loading: "lazy",
    referrerPolicy: "no-referrer-when-downgrade"
  }))))), /*#__PURE__*/React.createElement("footer", {
    className: "bg-stone-950 text-stone-400 text-xs py-12 border-t border-stone-800"
  }, /*#__PURE__*/React.createElement("div", {
    className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col md:flex-row items-center justify-between gap-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-9 h-9 rounded-lg bg-orange-600 flex items-center justify-center text-white font-serif font-bold text-lg"
  }, "S"), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "font-serif font-bold text-white text-base block"
  }, restaurant.name || "Spice & Hearth Bistro"), /*#__PURE__*/React.createElement("span", null, "Authentic Flavors, Pre-Cooked for Your Exact Arrival."))), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-6"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModal('privacy'),
    className: "hover:text-white transition"
  }, "Privacy Policy"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModal('terms'),
    className: "hover:text-white transition"
  }, "Terms & Conditions"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModal('refund'),
    className: "hover:text-white transition"
  }, "Refund & Cancellation"), auth.authenticated && (auth.user.role === 'admin' || auth.user.role === 'kitchen_staff') && /*#__PURE__*/React.createElement("a", {
    href: auth.user.role === 'admin' ? '/admin' : '/kitchen',
    className: "text-orange-500 hover:text-orange-400 font-semibold transition"
  }, "Staff & Admin Portal"))), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-stone-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500"
  }, /*#__PURE__*/React.createElement("p", null, "\xA9 ", new Date().getFullYear(), " Spice & Hearth Bistro. All rights reserved. Zero-wait food pre-ordering."), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-4 text-stone-400"
  }, /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "hover:text-white"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "instagram",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "hover:text-white"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "facebook",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("a", {
    href: "#",
    className: "hover:text-white"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "twitter",
    className: "w-4 h-4"
  })))))), customizingItem && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "relative h-44 bg-stone-100"
  }, /*#__PURE__*/React.createElement("img", {
    src: customizingItem.image,
    alt: customizingItem.name,
    className: "w-full h-full object-cover"
  }), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomizingItem(null),
    className: "absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "absolute bottom-3 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-stone-900 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-2 h-2 rounded-full ${customizingItem.vegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`
  }), customizingItem.name)), /*#__PURE__*/React.createElement("div", {
    className: "p-6 max-h-[60vh] overflow-y-auto space-y-6"
  }, /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-600 leading-relaxed"
  }, customizingItem.description), customizingItem.customization_groups && customizingItem.customization_groups.map(group => {
    const groupSelected = selectedOptions[group.id] || [];
    return /*#__PURE__*/React.createElement("div", {
      key: group.id,
      className: "space-y-2 border-t border-stone-100 pt-4"
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("h4", {
      className: "text-xs font-bold text-stone-900 uppercase tracking-wide"
    }, group.name, " ", group.required && /*#__PURE__*/React.createElement("span", {
      className: "text-orange-600 font-bold"
    }, "*")), /*#__PURE__*/React.createElement("span", {
      className: "text-[11px] text-stone-400"
    }, group.max_selection === 1 ? 'Select 1' : `Choose up to ${group.max_selection}`)), /*#__PURE__*/React.createElement("div", {
      className: "space-y-1.5"
    }, group.options && group.options.map(option => {
      const isChecked = groupSelected.includes(option.id);
      return /*#__PURE__*/React.createElement("label", {
        key: option.id,
        onClick: () => toggleOption(group, option),
        className: `flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer transition ${isChecked ? 'border-orange-500 bg-orange-50/70 text-orange-950 font-semibold' : 'border-stone-200 hover:border-stone-300 text-stone-700'}`
      }, /*#__PURE__*/React.createElement("div", {
        className: "flex items-center gap-2.5"
      }, /*#__PURE__*/React.createElement("div", {
        className: `w-4 h-4 rounded-full border flex items-center justify-center ${isChecked ? 'border-orange-600 bg-orange-600' : 'border-stone-300'}`
      }, isChecked && /*#__PURE__*/React.createElement("div", {
        className: "w-1.5 h-1.5 bg-white rounded-full"
      })), /*#__PURE__*/React.createElement("span", null, option.name)), /*#__PURE__*/React.createElement("span", {
        className: "text-xs text-stone-500"
      }, option.additional_price > 0 ? `+₹${option.additional_price}` : 'Included'));
    })));
  }), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-stone-100 pt-4 space-y-1.5"
  }, /*#__PURE__*/React.createElement("label", {
    className: "block text-xs font-bold text-stone-900 uppercase tracking-wide"
  }, "Special Kitchen Request (Optional)"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "e.g. Less oil, sauce on side, extra crispy...",
    value: customItemNotes,
    onChange: e => setCustomItemNotes(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center border border-stone-200 rounded-xl bg-white p-1"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomItemQuantity(Math.max(1, customItemQuantity - 1)),
    className: "w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "minus",
    className: "w-3.5 h-3.5"
  })), /*#__PURE__*/React.createElement("span", {
    className: "w-8 text-center text-xs font-bold text-stone-900"
  }, customItemQuantity), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCustomItemQuantity(customItemQuantity + 1),
    className: "w-8 h-8 rounded-lg flex items-center justify-center text-stone-600 hover:bg-stone-100"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "plus",
    className: "w-3.5 h-3.5"
  }))), /*#__PURE__*/React.createElement("button", {
    onClick: addCustomizedItemToCart,
    className: "flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-bold transition shadow-md flex items-center justify-center gap-2"
  }, /*#__PURE__*/React.createElement("span", null, "Add to Pre-Order Tray"), /*#__PURE__*/React.createElement("span", null, "\u2022"), /*#__PURE__*/React.createElement("span", null, "\u20B9", (() => {
    let base = customizingItem.discounted_price || customizingItem.price;
    let add = 0;
    if (customizingItem.customization_groups) {
      customizingItem.customization_groups.forEach(g => {
        const sel = selectedOptions[g.id] || [];
        g.options.forEach(o => {
          if (sel.includes(o.id)) add += o.additional_price;
        });
      });
    }
    return (base + add) * customItemQuantity;
  })()))))), isCartOpen && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-hidden"
  }, /*#__PURE__*/React.createElement("div", {
    onClick: () => setIsCartOpen(false),
    className: "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
  }), /*#__PURE__*/React.createElement("div", {
    className: "absolute inset-y-0 right-0 max-w-full flex pl-10"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-screen max-w-md bg-white shadow-2xl flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "shopping-bag",
    className: "w-5 h-5 text-orange-600"
  }), /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 font-serif text-lg"
  }, "Your Pre-Order Tray")), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsCartOpen(false),
    className: "w-8 h-8 rounded-full bg-stone-200 hover:bg-stone-300 text-stone-700 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), cart.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "utensils",
    className: "w-8 h-8"
  })), /*#__PURE__*/React.createElement("h4", {
    className: "font-bold text-stone-800 text-base"
  }, "Your Tray is Empty"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400 max-w-xs"
  }, "Browse the menu and pick your dishes. Our kitchen will prepare them fresh for your planned arrival."), /*#__PURE__*/React.createElement("button", {
    onClick: () => setIsCartOpen(false),
    className: "mt-2 bg-orange-600 text-white px-5 py-2.5 rounded-xl text-xs font-semibold"
  }, "Explore Dishes")) : /*#__PURE__*/React.createElement("form", {
    onSubmit: handleCheckoutSubmit,
    className: "flex-1 overflow-y-auto flex flex-col"
  }, /*#__PURE__*/React.createElement("div", {
    className: "p-5 divide-y divide-stone-100 flex-1 space-y-3"
  }, cart.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "pt-3 first:pt-0 flex items-start justify-between gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex-1 space-y-1"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("span", {
    className: `w-3 h-3 rounded-full flex-shrink-0 ${item.vegetarian ? 'bg-emerald-600' : 'bg-rose-600'}`
  }), /*#__PURE__*/React.createElement("h5", {
    className: "text-xs font-bold text-stone-900"
  }, item.name)), item.customizations && item.customizations.length > 0 && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, item.customizations.map(c => c.option).join(', ')), item.notes && /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-orange-700 italic"
  }, "\"", item.notes, "\""), /*#__PURE__*/React.createElement("p", {
    className: "text-xs font-semibold text-stone-800 pt-1"
  }, "\u20B9", item.base_price + (item.customizations?.reduce((s, c) => s + c.price, 0) || 0), " each")), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center border border-stone-200 rounded-lg p-0.5 text-xs"
  }, /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateCartQuantity(item.id, item.quantity - 1),
    className: "w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
  }, "-"), /*#__PURE__*/React.createElement("span", {
    className: "w-6 text-center font-bold text-stone-900"
  }, item.quantity), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateCartQuantity(item.id, item.quantity + 1),
    className: "w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-100 rounded"
  }, "+")), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: () => updateCartQuantity(item.id, 0),
    className: "text-stone-400 hover:text-rose-600 p-1"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "trash-2",
    className: "w-4 h-4"
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 bg-orange-50/60 border-t border-b border-orange-100 space-y-2 text-xs"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-orange-950 flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "calendar",
    className: "w-3.5 h-3.5 text-orange-600"
  }), " Arrival Schedule"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-orange-700 uppercase"
  }, diningOption === 'dine_in' ? 'Dine-In' : 'Takeaway')), /*#__PURE__*/React.createElement("p", {
    className: "text-stone-600"
  }, "Date: ", /*#__PURE__*/React.createElement("strong", null, arrivalDate), " \u2022 Slot: ", /*#__PURE__*/React.createElement("strong", null, timeSlots.find(s => s.id === selectedSlotId)?.start_time.slice(0, 5) || '7:30 PM')), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-orange-700"
  }, "Chef will prepare dishes before this exact arrival time.")), /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-stone-100 space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Promo Code (e.g. WELCOME20)",
    value: couponCode,
    onChange: e => setCouponCode(e.target.value.toUpperCase()),
    className: "flex-1 px-3 py-2 text-xs border border-stone-200 rounded-xl uppercase tracking-wider focus:outline-none focus:border-orange-500"
  }), /*#__PURE__*/React.createElement("button", {
    type: "button",
    onClick: handleApplyCoupon,
    className: "bg-stone-800 hover:bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-semibold"
  }, "Apply")), couponMessage && /*#__PURE__*/React.createElement("p", {
    className: `text-[11px] ${couponMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`
  }, couponMessage.text)), /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-stone-100 space-y-3"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-xs font-bold text-stone-900 uppercase tracking-wide"
  }, "Customer Information"), /*#__PURE__*/React.createElement("div", {
    className: "space-y-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    placeholder: "Your Full Name *",
    value: customerName,
    onChange: e => setCustomerName(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
  }), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("input", {
    type: "tel",
    required: true,
    placeholder: "Phone Number *",
    value: customerPhone,
    onChange: e => setCustomerPhone(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
  }), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    placeholder: "Email Address *",
    value: customerEmail,
    onChange: e => setCustomerEmail(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
  })), /*#__PURE__*/React.createElement("input", {
    type: "text",
    placeholder: "Notes for the team (e.g. Birthday celebration)...",
    value: customerNotes,
    onChange: e => setCustomerNotes(e.target.value),
    className: "w-full px-3 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 border-b border-stone-100 space-y-2"
  }, /*#__PURE__*/React.createElement("h5", {
    className: "text-xs font-bold text-stone-900 uppercase tracking-wide"
  }, "Payment Method"), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-2 gap-2"
  }, /*#__PURE__*/React.createElement("label", {
    className: `p-3 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition ${paymentMethod === 'online' ? 'border-orange-500 bg-orange-50/70 font-semibold text-orange-950' : 'border-stone-200 text-stone-600'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "paymentMethod",
    checked: paymentMethod === 'online',
    onChange: () => setPaymentMethod('online'),
    className: "text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Pay Online")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-stone-400"
  }, "UPI, Cards, Netbanking")), /*#__PURE__*/React.createElement("label", {
    className: `p-3 rounded-xl border text-xs cursor-pointer flex flex-col gap-1 transition ${paymentMethod === 'pay_at_restaurant' ? 'border-orange-500 bg-orange-50/70 font-semibold text-orange-950' : 'border-stone-200 text-stone-600'}`
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-1.5"
  }, /*#__PURE__*/React.createElement("input", {
    type: "radio",
    name: "paymentMethod",
    checked: paymentMethod === 'pay_at_restaurant',
    onChange: () => setPaymentMethod('pay_at_restaurant'),
    className: "text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Pay at Restaurant")), /*#__PURE__*/React.createElement("span", {
    className: "text-[10px] text-stone-400"
  }, "Pay when arriving")))), /*#__PURE__*/React.createElement("div", {
    className: "p-5 bg-stone-50 space-y-2 text-xs text-stone-600"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Subtotal"), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold text-stone-800"
  }, "\u20B9", orderSummary?.subtotal || 0)), orderSummary?.discount > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-emerald-600"
  }, /*#__PURE__*/React.createElement("span", null, "Coupon Discount (", orderSummary.coupon_code, ")"), /*#__PURE__*/React.createElement("span", null, "-\u20B9", orderSummary.discount)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "GST Tax (", orderSummary?.tax_rate || 5, "%)"), /*#__PURE__*/React.createElement("span", null, "\u20B9", orderSummary?.tax || 0)), orderSummary?.service_charge > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Service Charge (", orderSummary.service_charge_rate, "%)"), /*#__PURE__*/React.createElement("span", null, "\u20B9", orderSummary.service_charge)), orderSummary?.packaging_charge > 0 && /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, "Packaging Charge (Takeaway)"), /*#__PURE__*/React.createElement("span", null, "\u20B9", orderSummary.packaging_charge)), /*#__PURE__*/React.createElement("div", {
    className: "flex justify-between text-sm font-bold text-stone-900 border-t border-stone-200 pt-2"
  }, /*#__PURE__*/React.createElement("span", null, "Final Total"), /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600 text-base"
  }, "\u20B9", orderSummary?.final_total || 0))), checkoutError && /*#__PURE__*/React.createElement("div", {
    className: "p-4 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs"
  }, checkoutError), /*#__PURE__*/React.createElement("div", {
    className: "p-5 bg-white border-t border-stone-200"
  }, /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: isSubmittingOrder,
    className: "w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm shadow-lg hover:shadow-orange-600/30 transition flex items-center justify-center gap-2"
  }, isSubmittingOrder ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"
  }), /*#__PURE__*/React.createElement("span", null, "Scheduling Pre-Order...")) : /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check",
    className: "w-4 h-4"
  }), /*#__PURE__*/React.createElement("span", null, "Confirm & Schedule Pre-Order (\u20B9", orderSummary?.final_total || 0, ")"))), /*#__PURE__*/React.createElement("p", {
    className: "text-[10px] text-center text-stone-400 mt-2"
  }, "Guaranteed prepared fresh for your arrival slot. Free cancellation up to 45 mins prior.")))))), completedOrder && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-stone-200 text-center space-y-6 animate-in zoom-in-95 duration-200"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "check-circle",
    className: "w-10 h-10"
  })), /*#__PURE__*/React.createElement("div", {
    className: "space-y-1"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-xs font-bold text-orange-600 uppercase tracking-widest"
  }, "Order Confirmed"), /*#__PURE__*/React.createElement("h2", {
    className: "text-2xl font-serif font-bold text-stone-900"
  }, "Your Food Will Be Ready!"), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-500"
  }, "Pre-order ", /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-800"
  }, completedOrder.order_number), " has been received by our kitchen.")), /*#__PURE__*/React.createElement("div", {
    className: "bg-orange-50 border border-orange-200 rounded-2xl p-4 text-xs text-left space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-2 text-orange-800 font-bold"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "clock",
    className: "w-4 h-4 text-orange-600"
  }), /*#__PURE__*/React.createElement("span", null, "Arrival Window: ", completedOrder.arrival_date, " @ ", completedOrder.arrival_time)), /*#__PURE__*/React.createElement("p", {
    className: "text-stone-700 leading-relaxed font-medium"
  }, "\"Your food will be prepared before your selected arrival time.\""), /*#__PURE__*/React.createElement("p", {
    className: "text-[11px] text-stone-500"
  }, "Location: ", restaurant.address || "452 Indiranagar 100ft Road, Bengaluru")), /*#__PURE__*/React.createElement("div", {
    className: "border border-stone-200 rounded-xl p-3 text-xs text-left divide-y divide-stone-100 max-h-40 overflow-y-auto"
  }, completedOrder.items && completedOrder.items.map(item => /*#__PURE__*/React.createElement("div", {
    key: item.id,
    className: "py-1.5 flex justify-between"
  }, /*#__PURE__*/React.createElement("span", null, item.quantity, " \xD7 ", item.item_name), /*#__PURE__*/React.createElement("span", {
    className: "font-semibold"
  }, "\u20B9", item.total_price))), /*#__PURE__*/React.createElement("div", {
    className: "pt-2 flex justify-between font-bold text-stone-900"
  }, /*#__PURE__*/React.createElement("span", null, "Total Amount"), /*#__PURE__*/React.createElement("span", {
    className: "text-orange-600"
  }, "\u20B9", completedOrder.final_total, " (", completedOrder.payment_status.toUpperCase(), ")"))), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col sm:flex-row gap-3"
  }, /*#__PURE__*/React.createElement("a", {
    href: `/track/${completedOrder.order_number}`,
    className: "flex-1 bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "compass",
    className: "w-4 h-4"
  }), " Track Live Status"), /*#__PURE__*/React.createElement("button", {
    onClick: () => setCompletedOrder(null),
    className: "px-5 py-3 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-semibold text-stone-700"
  }, "Close & Back to Menu")))), showProfileModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center gap-3"
  }, /*#__PURE__*/React.createElement("div", {
    className: "w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg font-serif"
  }, auth.user?.name ? auth.user.name[0] : 'U'), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    className: "font-bold text-stone-900 text-base"
  }, auth.user?.name), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-400"
  }, auth.user?.email, " \u2022 ", auth.user?.phone))), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowProfileModal(false),
    className: "w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "space-y-4"
  }, /*#__PURE__*/React.createElement("h4", {
    className: "text-xs font-bold uppercase tracking-wider text-stone-500"
  }, "Your Pre-Order History"), loadingMyOrders ? /*#__PURE__*/React.createElement("div", {
    className: "py-8 text-center text-xs text-stone-400"
  }, "Loading your orders...") : myOrders.length === 0 ? /*#__PURE__*/React.createElement("div", {
    className: "py-8 text-center text-xs text-stone-400 bg-stone-50 rounded-xl border border-dashed border-stone-200"
  }, "No past orders yet. Place your first pre-order today!") : /*#__PURE__*/React.createElement("div", {
    className: "space-y-3 max-h-64 overflow-y-auto pr-1"
  }, myOrders.map(ord => /*#__PURE__*/React.createElement("div", {
    key: ord.id,
    className: "p-3.5 rounded-xl border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition space-y-2"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "font-bold text-stone-900 text-xs"
  }, ord.order_number), /*#__PURE__*/React.createElement("span", {
    className: `text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ord.order_status === 'completed' ? 'bg-stone-200 text-stone-800' : ord.order_status === 'preparing' ? 'bg-amber-100 text-amber-800' : ord.order_status === 'ready' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'}`
  }, ord.order_status)), /*#__PURE__*/React.createElement("p", {
    className: "text-xs text-stone-600"
  }, "Arrival: ", ord.arrival_date, " at ", ord.arrival_time, " \u2022 Total: \u20B9", ord.final_total, " (", ord.payment_status, ")"), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between pt-1 border-t border-stone-200/60 text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-stone-400 text-[11px]"
  }, ord.items?.length || 0, " items"), /*#__PURE__*/React.createElement("a", {
    href: `/track/${ord.order_number}`,
    className: "text-orange-600 font-semibold hover:underline flex items-center gap-1"
  }, "Track Status ", /*#__PURE__*/React.createElement("i", {
    "data-lucide": "chevron-right",
    className: "w-3.5 h-3.5"
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-stone-100 pt-4 flex justify-between items-center text-xs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "text-stone-400"
  }, "Spice & Hearth Loyalty Diner"), /*#__PURE__*/React.createElement("button", {
    onClick: handleLogout,
    className: "text-rose-600 hover:underline font-semibold"
  }, "Log Out")))), showAuthModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl border border-stone-200 space-y-6"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-xl"
  }, authMode === 'login' ? 'Customer Sign In' : 'Create Customer Account'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setShowAuthModal(false),
    className: "w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), authError && /*#__PURE__*/React.createElement("div", {
    className: "p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200"
  }, authError), /*#__PURE__*/React.createElement("form", {
    onSubmit: handleAuthSubmit,
    className: "space-y-4 text-xs"
  }, authMode === 'register' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-medium text-stone-700 mb-1"
  }, "Full Name"), /*#__PURE__*/React.createElement("input", {
    type: "text",
    required: true,
    value: authForm.name,
    onChange: e => setAuthForm({
      ...authForm,
      name: e.target.value
    }),
    className: "w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500",
    placeholder: "Priya Sharma"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-medium text-stone-700 mb-1"
  }, "Email Address"), /*#__PURE__*/React.createElement("input", {
    type: "email",
    required: true,
    value: authForm.email,
    onChange: e => setAuthForm({
      ...authForm,
      email: e.target.value
    }),
    className: "w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500",
    placeholder: "your.email@example.com"
  })), authMode === 'register' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-medium text-stone-700 mb-1"
  }, "Phone Number"), /*#__PURE__*/React.createElement("input", {
    type: "tel",
    required: true,
    value: authForm.phone,
    onChange: e => setAuthForm({
      ...authForm,
      phone: e.target.value
    }),
    className: "w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500",
    placeholder: "+91 98765 43210"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-medium text-stone-700 mb-1"
  }, "Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: authForm.password,
    onChange: e => setAuthForm({
      ...authForm,
      password: e.target.value
    }),
    className: "w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), authMode === 'register' && /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {
    className: "block font-medium text-stone-700 mb-1"
  }, "Confirm Password"), /*#__PURE__*/React.createElement("input", {
    type: "password",
    required: true,
    value: authForm.password_confirmation,
    onChange: e => setAuthForm({
      ...authForm,
      password_confirmation: e.target.value
    }),
    className: "w-full px-3 py-2 border border-stone-200 rounded-xl focus:outline-none focus:border-orange-500",
    placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
  })), /*#__PURE__*/React.createElement("button", {
    type: "submit",
    disabled: authLoading,
    className: "w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-xl font-bold transition shadow disabled:opacity-50"
  }, authLoading ? 'Authenticating...' : authMode === 'login' ? 'Sign In' : 'Register Account')), /*#__PURE__*/React.createElement("div", {
    className: "text-center text-xs text-stone-500 border-t border-stone-100 pt-3"
  }, authMode === 'login' ? /*#__PURE__*/React.createElement("span", null, "Don't have an account?", ' ', /*#__PURE__*/React.createElement("button", {
    onClick: () => setAuthMode('register'),
    className: "text-orange-600 font-semibold hover:underline"
  }, "Sign up here")) : /*#__PURE__*/React.createElement("span", null, "Already have an account?", ' ', /*#__PURE__*/React.createElement("button", {
    onClick: () => setAuthMode('login'),
    className: "text-orange-600 font-semibold hover:underline"
  }, "Log in"))))), legalModal && /*#__PURE__*/React.createElement("div", {
    className: "fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-stone-200 space-y-4"
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between border-b border-stone-100 pb-3"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "font-serif font-bold text-stone-900 text-lg capitalize"
  }, legalModal === 'privacy' ? 'Privacy Policy' : legalModal === 'terms' ? 'Terms & Conditions' : 'Refund & Cancellation Policy'), /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModal(null),
    className: "w-8 h-8 rounded-full bg-stone-100 text-stone-600 flex items-center justify-center"
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": "x",
    className: "w-4 h-4"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "text-xs text-stone-600 leading-relaxed max-h-72 overflow-y-auto space-y-3"
  }, legalModal === 'privacy' && /*#__PURE__*/React.createElement("p", null, restaurant.privacy_policy || "We value customer privacy and maintain high standards of security for profile, reservation and order information."), legalModal === 'terms' && /*#__PURE__*/React.createElement("p", null, restaurant.terms_policy || "All food orders require advance notification to enable chef preparation. Tables are held for 25 minutes from the arrival slot."), legalModal === 'refund' && /*#__PURE__*/React.createElement("p", null, restaurant.refund_policy || "Refunds are processed within 3-5 business days upon cancellation made prior to kitchen preparation kickoff.")), /*#__PURE__*/React.createElement("div", {
    className: "border-t border-stone-100 pt-3 text-right"
  }, /*#__PURE__*/React.createElement("button", {
    onClick: () => setLegalModal(null),
    className: "px-4 py-2 bg-stone-100 rounded-xl text-xs font-semibold text-stone-700"
  }, "Close")))), toast && /*#__PURE__*/React.createElement("div", {
    className: `fixed bottom-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-xl border text-xs font-medium flex items-center gap-2 animate-in slide-in-from-bottom-5 duration-300 ${toast.type === 'success' ? 'bg-stone-900 text-white border-orange-500' : 'bg-rose-900 text-white border-rose-500'}`
  }, /*#__PURE__*/React.createElement("i", {
    "data-lucide": toast.type === 'success' ? 'check-circle' : 'alert-circle',
    className: `w-4 h-4 ${toast.type === 'success' ? 'text-orange-400' : 'text-rose-300'}`
  }), /*#__PURE__*/React.createElement("span", null, toast.message)));
}
(function() {
    function init() {
        const el = document.getElementById('root');
        if (!el) return;
        try {
            el.innerHTML = '';
            if (typeof ReactDOM !== 'undefined' && ReactDOM.createRoot) {
                ReactDOM.createRoot(el).render(React.createElement(App, null));
            } else if (typeof ReactDOM !== 'undefined' && ReactDOM.render) {
                ReactDOM.render(React.createElement(App, null), el);
            } else {
                console.error("ReactDOM is not available");
            }
        } catch (err) {
            console.error("Error mounting App:", err);
            el.innerHTML = '<div style="min-height:50vh;display:flex;align-items:center;justify-content:center;padding:2rem;text-align:center;font-family:sans-serif;"><div style="background:#fff;padding:2rem;border-radius:1rem;box-shadow:0 10px 25px rgba(0,0,0,0.1);max-width:450px;"><h3 style="color:#dc2626;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Initialization Error</h3><p style="color:#6b7280;font-size:0.875rem;margin-bottom:1rem;">' + (err.message || 'Unknown error') + '</p><button onclick="location.reload()" style="padding:0.6rem 1.2rem;background:#ea580c;color:white;border:none;border-radius:0.5rem;font-weight:600;cursor:pointer;">Reload Application</button></div></div>';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
