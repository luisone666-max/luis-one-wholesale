import type { TranslationKey } from "@/lib/admin-i18n";

export const dashboardStats = [
  { key: "totalProducts" as TranslationKey, value: "128" },
  { key: "activeProducts" as TranslationKey, value: "116" },
  { key: "pendingOrders" as TranslationKey, value: "24" },
  { key: "waitingDepositOrders" as TranslationKey, value: "9" },
  { key: "depositPaidOrders" as TranslationKey, value: "11" },
  { key: "completedOrders" as TranslationKey, value: "372" },
  { key: "monthlySales" as TranslationKey, value: "$48,920" },
];

export type AdminProduct = {
  sku: string;
  name: string;
  category: string;
  subcategory: string;
  childCategory: string;
  brand: string;
  model: string;
  moq: number;
  stockStatusKey: TranslationKey;
  leadTime: string;
  image: string;
  description: string;
  active: boolean;
  priceRange: string;
  tiers: {
    price1: string;
    price6: string;
    price12: string;
    price50: string;
  };
  supplierNotes: string;
  internalCostNotes: string;
  adminNotes: string;
};

export const adminProducts: AdminProduct[] = [
  {
    sku: "WH-MP-1001",
    name: "Flat Seat Click 125 / 150 / 160",
    category: "Motorcycle Parts",
    subcategory: "Honda Click",
    childCategory: "Seat",
    brand: "OEM Style",
    model: "Click 125/150/160",
    moq: 1,
    stockStatusKey: "readyStock",
    leadTime: "1-2 days",
    image: "/products/flat-seat-click.svg",
    description: "Replacement flat scooter seat with reinforced base.",
    active: true,
    priceRange: "$17.78 - $22.50",
    tiers: { price1: "22.50", price6: "21.15", price12: "19.80", price50: "17.78" },
    supplierNotes: "Supplier A: black cover only this week.",
    internalCostNotes: "Target margin checked manually. Do not auto-price.",
    adminNotes: "Top seller for repair shops.",
  },
  {
    sku: "WH-MP-1002",
    name: "Ignition Keyset Mio / Click",
    category: "Motorcycle Parts",
    subcategory: "Honda Click",
    childCategory: "Ignition / Keyset",
    brand: "MotoKey",
    model: "Mio / Click",
    moq: 1,
    stockStatusKey: "readyStock",
    leadTime: "1-2 days",
    image: "/products/ignition-keyset.svg",
    description: "Ignition keyset with two keys for common scooter models.",
    active: true,
    priceRange: "$6.48 - $8.20",
    tiers: { price1: "8.20", price6: "7.71", price12: "7.22", price50: "6.48" },
    supplierNotes: "Check key blank batch before large order.",
    internalCostNotes: "Cost changes often; verify manually.",
    adminNotes: "Good for bundle promotions.",
  },
  {
    sku: "WH-MP-1003",
    name: "Topbox Bracket NMAX / Aerox",
    category: "Motorcycle Parts",
    subcategory: "NMAX",
    childCategory: "Bracket",
    brand: "RideMount",
    model: "NMAX / Aerox",
    moq: 1,
    stockStatusKey: "lowStock",
    leadTime: "3-5 days",
    image: "/products/topbox-bracket.svg",
    description: "Powder-coated rear topbox bracket.",
    active: true,
    priceRange: "$11.77 - $14.90",
    tiers: { price1: "14.90", price6: "14.01", price12: "13.11", price50: "11.77" },
    supplierNotes: "低库存，建议先确认仓库数量。",
    internalCostNotes: "Bulky carton affects handling cost.",
    adminNotes: "Show low stock badge.",
  },
  {
    sku: "WH-AC-1004",
    name: "Contact Cleaner Spray 450ml",
    category: "Daily Essentials",
    subcategory: "Cleaning Supplies",
    childCategory: "Aerosol",
    brand: "CleanPro",
    model: "450ml",
    moq: 1,
    stockStatusKey: "readyStock",
    leadTime: "Same day",
    image: "/products/contact-cleaner.svg",
    description: "Fast-drying contact cleaner spray for workshops.",
    active: true,
    priceRange: "$3.00 - $3.80",
    tiers: { price1: "3.80", price6: "3.57", price12: "3.34", price50: "3.00" },
    supplierNotes: "Aerosol cartons must be handled separately.",
    internalCostNotes: "Manual pricing due to hazmat handling.",
    adminNotes: "Consumable repeat item.",
  },
  {
    sku: "WH-MP-1005",
    name: "Brake Lever with Lock",
    category: "Motorcycle Parts",
    subcategory: "Honda Click",
    childCategory: "Brake Lever",
    brand: "SafeRide",
    model: "Universal Scooter",
    moq: 2,
    stockStatusKey: "forOrder",
    leadTime: "7-10 days",
    image: "/products/topbox-bracket-alt.svg",
    description: "Brake lever with integrated lock for scooter resale.",
    active: true,
    priceRange: "$4.35 - $5.50",
    tiers: { price1: "5.50", price6: "5.17", price12: "4.84", price50: "4.35" },
    supplierNotes: "For order only; supplier confirms every Friday.",
    internalCostNotes: "No automatic price update.",
    adminNotes: "Add real product image later.",
  },
  {
    sku: "WH-AC-1006",
    name: "Koby De Rust",
    category: "Daily Essentials",
    subcategory: "Cleaning Supplies",
    childCategory: "Rust Remover",
    brand: "Koby",
    model: "De Rust",
    moq: 6,
    stockStatusKey: "readyStock",
    leadTime: "2-3 days",
    image: "/products/contact-cleaner-alt.svg",
    description: "Rust remover for workshop and household use.",
    active: true,
    priceRange: "$2.29 - $2.90",
    tiers: { price1: "2.90", price6: "2.73", price12: "2.55", price50: "2.29" },
    supplierNotes: "中文备注：箱规 24 支。",
    internalCostNotes: "Check leakage allowance manually.",
    adminNotes: "Candidate for bulk upload test.",
  },
  {
    sku: "WH-AC-1007",
    name: "MKT Coolant 500ml",
    category: "Motorcycle Parts",
    subcategory: "NMAX",
    childCategory: "Coolant",
    brand: "MKT",
    model: "500ml",
    moq: 12,
    stockStatusKey: "lowStock",
    leadTime: "3-5 days",
    image: "/products/contact-cleaner.svg",
    description: "Motorcycle coolant bottle for service shops.",
    active: false,
    priceRange: "$1.74 - $2.20",
    tiers: { price1: "2.20", price6: "2.07", price12: "1.94", price50: "1.74" },
    supplierNotes: "Temporarily hidden until new stock arrives.",
    internalCostNotes: "Hidden product must not show on customer frontend.",
    adminNotes: "Review packaging image.",
  },
  {
    sku: "WH-FS-1008",
    name: "Chili Powder 100g",
    category: "Food & Spices",
    subcategory: "Chili",
    childCategory: "Powder",
    brand: "KitchenMart",
    model: "100g pouch",
    moq: 24,
    stockStatusKey: "readyStock",
    leadTime: "Same day",
    image: "/products/chili-powder.svg",
    description: "Retail-ready 100g chili powder pouch.",
    active: true,
    priceRange: "$1.26 - $1.60",
    tiers: { price1: "1.60", price6: "1.50", price12: "1.41", price50: "1.26" },
    supplierNotes: "Keep away from moisture.",
    internalCostNotes: "Manual promo pricing only.",
    adminNotes: "Food category demo item.",
  },
  {
    sku: "WH-EL-1009",
    name: "Phone Charger Cable",
    category: "Electronics",
    subcategory: "Phone Accessories",
    childCategory: "Cables",
    brand: "VoltLine",
    model: "USB-C 1m",
    moq: 10,
    stockStatusKey: "unavailable",
    leadTime: "Pending supplier",
    image: "/products/phone-accessories.svg",
    description: "USB-C charging cable for counter resale.",
    active: false,
    priceRange: "$0.79 - $1.00",
    tiers: { price1: "1.00", price6: "0.94", price12: "0.88", price50: "0.79" },
    supplierNotes: "Do not publish until cable certification is confirmed.",
    internalCostNotes: "Cost pending.",
    adminNotes: "Use as hidden product example.",
  },
];

export type AdminCategoryNode = {
  id: string;
  name: string;
  nameEn: string;
  nameZh: string;
  iconUrl: string;
  description: string;
  productCount: number;
  sortOrder: number;
  active: boolean;
  homepage: boolean;
  navigation: boolean;
  children?: AdminCategoryNode[];
};

export const adminCategories: AdminCategoryNode[] = [
  {
    id: "motorcycle-parts",
    name: "Motorcycle Parts",
    nameEn: "Motorcycle Parts",
    nameZh: "摩托车配件",
    iconUrl: "/products/topbox-bracket.svg",
    description: "Scooter and motorcycle replacement parts.",
    productCount: 84,
    sortOrder: 1,
    active: true,
    homepage: true,
    navigation: true,
    children: [
      {
        id: "honda-click",
        name: "Honda Click",
        nameEn: "Honda Click",
        nameZh: "本田 Click",
        iconUrl: "/products/flat-seat-click.svg",
        description: "Parts for Honda Click models.",
        productCount: 38,
        sortOrder: 1,
        active: true,
        homepage: true,
        navigation: true,
        children: [
          { id: "honda-click-seat", name: "Seat", nameEn: "Seat", nameZh: "坐垫", iconUrl: "/products/flat-seat-click.svg", description: "Seat products.", productCount: 12, sortOrder: 1, active: true, homepage: true, navigation: true },
          { id: "honda-click-ignition-keyset", name: "Ignition / Keyset", nameEn: "Ignition / Keyset", nameZh: "点火锁 / 钥匙套", iconUrl: "/products/ignition-keyset.svg", description: "Ignition and keyset replacements.", productCount: 9, sortOrder: 2, active: true, homepage: false, navigation: true },
          { id: "honda-click-bracket", name: "Bracket", nameEn: "Bracket", nameZh: "支架", iconUrl: "/products/topbox-bracket.svg", description: "Mounting and support brackets.", productCount: 17, sortOrder: 3, active: true, homepage: false, navigation: true },
          { id: "honda-click-shock-absorber", name: "Shock Absorber", nameEn: "Shock Absorber", nameZh: "减震器", iconUrl: "/products/topbox-bracket-alt.svg", description: "Suspension and shock absorber items.", productCount: 0, sortOrder: 4, active: true, homepage: false, navigation: true },
        ],
      },
      {
        id: "yamaha-mio",
        name: "Yamaha Mio",
        nameEn: "Yamaha Mio",
        nameZh: "雅马哈 Mio",
        iconUrl: "/products/ignition-keyset-alt.svg",
        description: "Parts for Yamaha Mio models.",
        productCount: 18,
        sortOrder: 2,
        active: true,
        homepage: false,
        navigation: true,
        children: [
          { id: "yamaha-mio-seat", name: "Seat", nameEn: "Seat", nameZh: "坐垫", iconUrl: "/products/flat-seat-click-alt.svg", description: "Yamaha Mio seats.", productCount: 8, sortOrder: 1, active: true, homepage: false, navigation: true },
          { id: "yamaha-mio-electrical", name: "Electrical", nameEn: "Electrical", nameZh: "电器件", iconUrl: "/products/ignition-keyset.svg", description: "Electrical replacement parts.", productCount: 10, sortOrder: 2, active: true, homepage: false, navigation: true },
        ],
      },
      { id: "nmax", name: "NMAX", nameEn: "NMAX", nameZh: "NMAX", iconUrl: "/products/topbox-bracket.svg", description: "NMAX parts and accessories.", productCount: 16, sortOrder: 3, active: true, homepage: true, navigation: true },
      { id: "aerox", name: "Aerox", nameEn: "Aerox", nameZh: "Aerox", iconUrl: "/products/topbox-bracket-alt.svg", description: "Aerox parts and accessories.", productCount: 12, sortOrder: 4, active: true, homepage: false, navigation: true },
    ],
  },
  {
    id: "daily-essentials",
    name: "Daily Essentials",
    nameEn: "Daily Essentials",
    nameZh: "日用品",
    iconUrl: "/products/contact-cleaner.svg",
    description: "Everyday wholesale supplies.",
    productCount: 26,
    sortOrder: 2,
    active: true,
    homepage: true,
    navigation: true,
    children: [
      { id: "tissue", name: "Tissue", nameEn: "Tissue", nameZh: "纸巾", iconUrl: "/products/contact-cleaner-alt.svg", description: "Tissue and paper goods.", productCount: 11, sortOrder: 1, active: true, homepage: true, navigation: true },
      { id: "cleaning-supplies", name: "Cleaning Supplies", nameEn: "Cleaning Supplies", nameZh: "清洁用品", iconUrl: "/products/contact-cleaner.svg", description: "Cleaning supplies and consumables.", productCount: 15, sortOrder: 2, active: true, homepage: true, navigation: true },
    ],
  },
  {
    id: "electronics",
    name: "Electronics",
    nameEn: "Electronics",
    nameZh: "电子产品",
    iconUrl: "/products/phone-accessories.svg",
    description: "Phone accessories and electronics.",
    productCount: 34,
    sortOrder: 3,
    active: true,
    homepage: true,
    navigation: true,
    children: [
      {
        id: "phone-accessories",
        name: "Phone Accessories",
        nameEn: "Phone Accessories",
        nameZh: "手机配件",
        iconUrl: "/products/phone-accessories.svg",
        description: "Phone accessory wholesale items.",
        productCount: 34,
        sortOrder: 1,
        active: true,
        homepage: true,
        navigation: true,
        children: [
          { id: "chargers", name: "Chargers", nameEn: "Chargers", nameZh: "充电器", iconUrl: "/products/phone-accessories-alt.svg", description: "Wall chargers and adapters.", productCount: 17, sortOrder: 1, active: true, homepage: true, navigation: true },
          { id: "cables", name: "Cables", nameEn: "Cables", nameZh: "数据线", iconUrl: "/products/phone-accessories.svg", description: "Charging and data cables.", productCount: 17, sortOrder: 2, active: true, homepage: false, navigation: true },
        ],
      },
    ],
  },
  {
    id: "food-spices",
    name: "Food & Spices",
    nameEn: "Food & Spices",
    nameZh: "食品与香料",
    iconUrl: "/products/chili-powder.svg",
    description: "Food and spice wholesale products.",
    productCount: 21,
    sortOrder: 4,
    active: true,
    homepage: true,
    navigation: true,
    children: [
      { id: "chili", name: "Chili", nameEn: "Chili", nameZh: "辣椒", iconUrl: "/products/chili-powder.svg", description: "Chili products.", productCount: 7, sortOrder: 1, active: true, homepage: true, navigation: true },
      { id: "pepper", name: "Pepper", nameEn: "Pepper", nameZh: "胡椒", iconUrl: "/products/chili-powder-alt.svg", description: "Pepper products.", productCount: 6, sortOrder: 2, active: true, homepage: false, navigation: true },
      { id: "seasoning", name: "Seasoning", nameEn: "Seasoning", nameZh: "调味料", iconUrl: "/products/chili-powder.svg", description: "Seasoning products.", productCount: 8, sortOrder: 3, active: true, homepage: false, navigation: true },
    ],
  },
];

export type AdminOrderItem = {
  image: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  stockStatusKey: TranslationKey;
  supplierNotesSnapshot: string;
};

export type AdminPaymentRecord = {
  method: string;
  amount: string;
  referenceNo: string;
  statusKey: TranslationKey;
  date: string;
};

export type AdminOrder = {
  orderNo: string;
  createdDate: string;
  customerName: string;
  customerPhone: string;
  facebookMessenger: string;
  location: string;
  businessType: string;
  receiverName: string;
  receiverPhone: string;
  receivingMethodKey: TranslationKey;
  completeAddress: string;
  shippingFeePaymentKey: TranslationKey;
  shippingFeeAmount: string;
  orderNotes: string;
  productTotal: string;
  amountToConfirm: string;
  orderStatusKey: TranslationKey;
  paymentStatusKey: TranslationKey;
  date: string;
  items: AdminOrderItem[];
  payments: AdminPaymentRecord[];
  adminNotes: string;
};

export const adminOrders: AdminOrder[] = [
  {
    orderNo: "LO-2026-000001",
    createdDate: "2026-05-03",
    customerName: "Juan Dela Cruz",
    customerPhone: "+63 917 111 0001",
    facebookMessenger: "m.me/juandelacruz",
    location: "Quezon City",
    businessType: "Motorcycle parts reseller",
    receiverName: "Juan Dela Cruz",
    receiverPhone: "+63 917 111 0001",
    receivingMethodKey: "courierShipping",
    completeAddress: "Banawe Street, Quezon City, Metro Manila",
    shippingFeePaymentKey: "freightCollect",
    shippingFeeAmount: "Freight collect",
    orderNotes: "Customer prefers courier branch pickup if cheaper.",
    productTotal: "₱3,500",
    amountToConfirm: "₱3,500",
    orderStatusKey: "waitingDeposit",
    paymentStatusKey: "noPayment",
    date: "2026-05-03",
    items: [
      {
        image: "/products/flat-seat-click.svg",
        sku: "WH-MP-1001",
        name: "Flat Seat Click 125 / 150 / 160",
        quantity: 10,
        unitPrice: "₱250",
        subtotal: "₱2,500",
        stockStatusKey: "readyStock",
        supplierNotesSnapshot: "Supplier A: black cover only this week.",
      },
      {
        image: "/products/ignition-keyset.svg",
        sku: "WH-MP-1002",
        name: "Ignition Keyset Mio / Click",
        quantity: 10,
        unitPrice: "₱100",
        subtotal: "₱1,000",
        stockStatusKey: "readyStock",
        supplierNotesSnapshot: "Check key blank batch before large order.",
      },
    ],
    payments: [],
    adminNotes: "No shipping fee added because receiver will pay freight collect.",
  },
  {
    orderNo: "LO-2026-000002",
    createdDate: "2026-05-02",
    customerName: "Mark Santos",
    customerPhone: "+63 918 222 0002",
    facebookMessenger: "fb.com/marksantos.shop",
    location: "Pasig",
    businessType: "Retail counter",
    receiverName: "Mark Santos",
    receiverPhone: "+63 918 222 0002",
    receivingMethodKey: "pickUpAtStore",
    completeAddress: "Pick up at warehouse counter",
    shippingFeePaymentKey: "pickupNoShippingFee",
    shippingFeeAmount: "₱0",
    orderNotes: "Pickup by rider after deposit verification.",
    productTotal: "₱1,734",
    amountToConfirm: "₱1,734",
    orderStatusKey: "depositPaid",
    paymentStatusKey: "depositVerified",
    date: "2026-05-02",
    items: [
      {
        image: "/products/contact-cleaner.svg",
        sku: "WH-AC-1004",
        name: "Contact Cleaner Spray 450ml",
        quantity: 12,
        unitPrice: "₱95",
        subtotal: "₱1,140",
        stockStatusKey: "readyStock",
        supplierNotesSnapshot: "Aerosol cartons must be handled separately.",
      },
      {
        image: "/products/chili-powder.svg",
        sku: "WH-FS-1008",
        name: "Chili Powder 100g",
        quantity: 18,
        unitPrice: "₱33",
        subtotal: "₱594",
        stockStatusKey: "readyStock",
        supplierNotesSnapshot: "Keep away from moisture.",
      },
    ],
    payments: [
      { method: "GCash", amount: "₱500", referenceNo: "GC-771203", statusKey: "depositVerified", date: "2026-05-02" },
    ],
    adminNotes: "Pickup order. Do not add shipping fee.",
  },
  {
    orderNo: "LO-2026-000003",
    createdDate: "2026-05-01",
    customerName: "Ana Reyes",
    customerPhone: "+63 919 333 0003",
    facebookMessenger: "m.me/anareyes.store",
    location: "Makati",
    businessType: "Wholesale buyer",
    receiverName: "Ana Reyes",
    receiverPhone: "+63 919 333 0003",
    receivingMethodKey: "localDelivery",
    completeAddress: "Poblacion, Makati City",
    shippingFeePaymentKey: "toBeConfirmed",
    shippingFeeAmount: "To be Confirmed",
    orderNotes: "Lalamove quote needed after items are packed.",
    productTotal: "₱5,880",
    amountToConfirm: "₱5,880 + shipping to be confirmed",
    orderStatusKey: "sourcingItems",
    paymentStatusKey: "depositSubmitted",
    date: "2026-05-01",
    items: [
      {
        image: "/products/topbox-bracket.svg",
        sku: "WH-MP-1003",
        name: "Topbox Bracket NMAX / Aerox",
        quantity: 20,
        unitPrice: "₱210",
        subtotal: "₱4,200",
        stockStatusKey: "lowStock",
        supplierNotesSnapshot: "Low stock, confirm warehouse quantity first.",
      },
      {
        image: "/products/phone-accessories.svg",
        sku: "WH-EL-1009",
        name: "Phone Charger Cable",
        quantity: 60,
        unitPrice: "₱28",
        subtotal: "₱1,680",
        stockStatusKey: "unavailable",
        supplierNotesSnapshot: "Do not publish until cable certification is confirmed.",
      },
    ],
    payments: [
      { method: "Bank Transfer", amount: "₱1,500", referenceNo: "BPI-552019", statusKey: "depositSubmitted", date: "2026-05-01" },
    ],
    adminNotes: "Confirm cable availability before finalizing.",
  },
];

export const adminCustomers = [
  {
    name: "Metro Auto Parts",
    phone: "+63 917 120 8801",
    social: "fb.com/metroauto",
    location: "Quezon City",
    businessType: "Motorcycle parts shop",
    orderCount: 42,
    totalSpend: "$18,420",
    status: "Active",
  },
  {
    name: "North Road Supplies",
    phone: "+63 918 402 3312",
    social: "m.me/northroad",
    location: "Caloocan",
    businessType: "Wholesale reseller",
    orderCount: 27,
    totalSpend: "$12,305",
    status: "Active",
  },
  {
    name: "Ace Retail Counter",
    phone: "+63 920 551 0914",
    social: "fb.com/aceretail",
    location: "Makati",
    businessType: "Convenience store",
    orderCount: 13,
    totalSpend: "$5,780",
    status: "Active",
  },
  {
    name: "City Corner Store",
    phone: "+63 915 338 9902",
    social: "m.me/citycorner",
    location: "Pasig",
    businessType: "Grocery",
    orderCount: 5,
    totalSpend: "$1,125",
    status: "Review",
  },
];

export const paymentRecords = [
  { orderNo: "B2B-20260502-014", method: "Bank Transfer", amount: "$250.00", referenceNo: "BDO-902184", status: "Verified", date: "2026-05-02" },
  { orderNo: "B2B-20260501-022", method: "GCash", amount: "$640.00", referenceNo: "GC-448210", status: "Pending Review", date: "2026-05-01" },
  { orderNo: "B2B-20260430-011", method: "Cash Deposit", amount: "$130.00", referenceNo: "CD-771992", status: "Verified", date: "2026-04-30" },
  { orderNo: "B2B-20260428-008", method: "Bank Transfer", amount: "$988.00", referenceNo: "BPI-218004", status: "Completed", date: "2026-04-28" },
];
