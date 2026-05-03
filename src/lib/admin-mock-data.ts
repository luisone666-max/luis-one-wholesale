import { products } from "@/lib/mock-data";
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

export const adminProducts = products.map((product, index) => ({
  image: product.image,
  sku: `WH-${String(index + 1001).padStart(4, "0")}`,
  name: product.name,
  category: product.category,
  moq: product.moq,
  priceRange: `$${product.tiers[3].price.toFixed(2)} - $${product.tiers[0].price.toFixed(2)}`,
  stockStatus: product.stockStatus,
  active: index !== 5,
}));

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

export const adminOrders = [
  {
    orderNo: "B2B-20260503-001",
    customer: "Metro Auto Parts",
    phone: "+63 917 120 8801",
    productTotal: "$1,246.50",
    orderStatusKey: "pendingConfirmation" as TranslationKey,
    paymentStatusKey: "waitingDeposit" as TranslationKey,
    receivingMethod: "Pickup",
    shippingFeePayment: "Customer pays",
    date: "2026-05-03",
  },
  {
    orderNo: "B2B-20260502-014",
    customer: "North Road Supplies",
    phone: "+63 918 402 3312",
    productTotal: "$840.00",
    orderStatusKey: "depositPaid" as TranslationKey,
    paymentStatusKey: "depositPaid" as TranslationKey,
    receivingMethod: "Delivery",
    shippingFeePayment: "Collect on delivery",
    date: "2026-05-02",
  },
  {
    orderNo: "B2B-20260501-022",
    customer: "Ace Retail Counter",
    phone: "+63 920 551 0914",
    productTotal: "$2,120.80",
    orderStatusKey: "sourcingItems" as TranslationKey,
    paymentStatusKey: "depositPaid" as TranslationKey,
    receivingMethod: "Delivery",
    shippingFeePayment: "Quoted separately",
    date: "2026-05-01",
  },
  {
    orderNo: "B2B-20260430-011",
    customer: "MNL Scooter Works",
    phone: "+63 919 761 4420",
    productTotal: "$435.20",
    orderStatusKey: "readyForPickup" as TranslationKey,
    paymentStatusKey: "depositPaid" as TranslationKey,
    receivingMethod: "Pickup",
    shippingFeePayment: "N/A",
    date: "2026-04-30",
  },
  {
    orderNo: "B2B-20260428-008",
    customer: "Luzon Wholesale Mart",
    phone: "+63 916 771 2088",
    productTotal: "$988.00",
    orderStatusKey: "completed" as TranslationKey,
    paymentStatusKey: "completed" as TranslationKey,
    receivingMethod: "Delivery",
    shippingFeePayment: "Paid",
    date: "2026-04-28",
  },
  {
    orderNo: "B2B-20260427-003",
    customer: "City Corner Store",
    phone: "+63 915 338 9902",
    productTotal: "$160.00",
    orderStatusKey: "cancelled" as TranslationKey,
    paymentStatusKey: "cancelled" as TranslationKey,
    receivingMethod: "Pickup",
    shippingFeePayment: "N/A",
    date: "2026-04-27",
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
