export type AdminLanguage = "en" | "zh";

export type TranslationKey =
  | "actions"
  | "activeProducts"
  | "activeStatus"
  | "activeToggle"
  | "addChild"
  | "addMainCategory"
  | "addProduct"
  | "adminName"
  | "amount"
  | "bulkUpload"
  | "businessType"
  | "cancelled"
  | "categories"
  | "category"
  | "categoryNameEn"
  | "categoryNameZh"
  | "categoryName"
  | "categoryRules"
  | "categoryTreeHint"
  | "childCategory"
  | "completed"
  | "completedOrders"
  | "createCategory"
  | "customers"
  | "dashboard"
  | "date"
  | "delete"
  | "deleteBlocked"
  | "deleteChildWarning"
  | "deleteProductWarning"
  | "description"
  | "depositPaid"
  | "depositPaidOrders"
  | "disable"
  | "disabledHidden"
  | "edit"
  | "enable"
  | "facebookMessenger"
  | "facebookPageUrl"
  | "filterCategory"
  | "filterStock"
  | "hideProductsFirst"
  | "iconImageUrl"
  | "image"
  | "language"
  | "location"
  | "mainCategory"
  | "manualPayments"
  | "mergeCategory"
  | "mergeConfirmation"
  | "mergeInto"
  | "messengerUrl"
  | "monthlySales"
  | "moq"
  | "move"
  | "moveCategory"
  | "moveProducts"
  | "moveProductsTo"
  | "maxDepthWarning"
  | "name"
  | "newCategoryName"
  | "noParent"
  | "notifications"
  | "orderCount"
  | "orderNo"
  | "orderStatus"
  | "orders"
  | "pageSize"
  | "parentCategory"
  | "paymentMethod"
  | "paymentStatus"
  | "payments"
  | "pendingConfirmation"
  | "pendingOrders"
  | "phone"
  | "phoneNumber"
  | "priceRange"
  | "productCount"
  | "productManagement"
  | "productName"
  | "productTotal"
  | "products"
  | "readyForPickup"
  | "receivingMethod"
  | "referenceNo"
  | "reorder"
  | "reports"
  | "save"
  | "searchProducts"
  | "settings"
  | "shippingFeePayment"
  | "showHomepage"
  | "showNavigation"
  | "showingResults"
  | "sku"
  | "sortOrder"
  | "sourceCategory"
  | "sourcingItems"
  | "status"
  | "stockStatus"
  | "storeAddress"
  | "storeName"
  | "subcategory"
  | "targetCategory"
  | "tier"
  | "toolApplied"
  | "totalProducts"
  | "totalSpend"
  | "waitingDeposit"
  | "waitingDepositOrders"
  | "warning"
  | "wholesalePrices";

export const adminDictionaries: Record<AdminLanguage, Record<TranslationKey, string>> = {
  en: {
    actions: "Actions",
    activeProducts: "Active Products",
    activeStatus: "Active Status",
    activeToggle: "Active",
    addChild: "Add Child",
    addMainCategory: "Add Main Category",
    addProduct: "Add Product",
    adminName: "Admin Luis",
    amount: "Amount",
    bulkUpload: "Bulk Upload",
    businessType: "Business Type",
    cancelled: "Cancelled",
    categories: "Categories",
    category: "Category",
    categoryNameEn: "Category Name English",
    categoryNameZh: "Category Name Chinese",
    categoryName: "Category Name",
    categoryRules: "Disabled categories and their products are hidden from the customer frontend mockup.",
    categoryTreeHint: "Max depth 3: Main Category > Subcategory > Child Category",
    childCategory: "Child Category",
    completed: "Completed",
    completedOrders: "Completed Orders",
    createCategory: "Create Category",
    customers: "Customers",
    dashboard: "Dashboard",
    date: "Date",
    delete: "Delete",
    deleteBlocked: "Delete blocked: category must have no products and no child categories.",
    deleteChildWarning: "This category has child categories. Please move or delete child categories first.",
    deleteProductWarning: "This category has products. Please move or hide products before deleting.",
    description: "Description",
    depositPaid: "Deposit Paid",
    depositPaidOrders: "Deposit Paid Orders",
    disable: "Disable",
    disabledHidden: "Disabled categories stay in admin, but are hidden from customer navigation and listings.",
    edit: "Edit",
    enable: "Enable",
    facebookMessenger: "Facebook / Messenger",
    facebookPageUrl: "Facebook Page URL",
    filterCategory: "Filter by category",
    filterStock: "Filter by stock status",
    hideProductsFirst: "Move or hide products first.",
    iconImageUrl: "Icon / Image URL",
    image: "Image",
    language: "Language",
    location: "Location",
    mainCategory: "Main Category",
    manualPayments: "Manual Payment Records",
    mergeCategory: "Merge Category",
    mergeConfirmation: "Products under this category will be moved to the target category.",
    mergeInto: "Merge into",
    messengerUrl: "Messenger URL",
    monthlySales: "Monthly Sales",
    moq: "MOQ",
    move: "Move",
    moveCategory: "Move Category",
    moveProducts: "Move Products",
    moveProductsTo: "Move products to another category",
    maxDepthWarning: "Move blocked: category depth cannot exceed 3 levels.",
    name: "Name",
    newCategoryName: "New category name",
    noParent: "No parent",
    notifications: "Notifications",
    orderCount: "Order Count",
    orderNo: "Order No",
    orderStatus: "Order Status",
    orders: "Orders",
    pageSize: "Page size",
    parentCategory: "Parent Category",
    paymentMethod: "Payment Method",
    paymentStatus: "Payment Status",
    payments: "Payments",
    pendingConfirmation: "Pending Confirmation",
    pendingOrders: "Pending Orders",
    phone: "Phone",
    phoneNumber: "Phone Number",
    priceRange: "Price Range",
    productCount: "Product Count",
    productManagement: "Product Management",
    productName: "Product Name",
    productTotal: "Product Total",
    products: "Products",
    readyForPickup: "Ready for Pickup",
    receivingMethod: "Receiving Method",
    referenceNo: "Reference No",
    reorder: "Reorder",
    reports: "Reports",
    save: "Save",
    searchProducts: "Search by SKU or product name",
    settings: "Settings",
    shippingFeePayment: "Shipping Fee Payment",
    showHomepage: "Show on Homepage",
    showNavigation: "Show in Navigation",
    showingResults: "Showing 1-20 of 3,482 products",
    sku: "SKU",
    sortOrder: "Sort Order",
    sourceCategory: "Source Category",
    sourcingItems: "Sourcing Items",
    status: "Status",
    stockStatus: "Stock Status",
    storeAddress: "Store Address",
    storeName: "Store Name",
    subcategory: "Subcategory",
    targetCategory: "Target Category",
    tier: "Tier",
    toolApplied: "Tool applied in mock data.",
    totalProducts: "Total Products",
    totalSpend: "Total Spend",
    waitingDeposit: "Waiting for Deposit",
    waitingDepositOrders: "Waiting Deposit Orders",
    warning: "Warning",
    wholesalePrices: "Wholesale Prices",
  },
  zh: {
    actions: "操作",
    activeProducts: "上架商品",
    activeStatus: "上架状态",
    activeToggle: "启用",
    addChild: "添加子分类",
    addMainCategory: "添加主分类",
    addProduct: "新增商品",
    adminName: "管理员 Luis",
    amount: "金额",
    bulkUpload: "批量上传",
    businessType: "业务类型",
    cancelled: "已取消",
    categories: "分类",
    category: "分类",
    categoryNameEn: "分类英文名",
    categoryNameZh: "分类中文名",
    categoryName: "分类名称",
    categoryRules: "禁用分类及其商品会从客户前台 mockup 隐藏。",
    categoryTreeHint: "最多 3 层：主分类 > 子分类 > 子级分类",
    childCategory: "子级分类",
    completed: "已完成",
    completedOrders: "已完成订单",
    createCategory: "创建分类",
    customers: "客户",
    dashboard: "仪表盘",
    date: "日期",
    delete: "删除",
    deleteBlocked: "无法删除：分类必须没有商品且没有子分类。",
    deleteChildWarning: "该分类有子分类。请先移动或删除子分类。",
    deleteProductWarning: "该分类有商品。请先移动或隐藏商品再删除。",
    description: "描述",
    depositPaid: "订金已付",
    depositPaidOrders: "订金已付订单",
    disable: "禁用",
    disabledHidden: "禁用分类保留在后台，但会从客户导航和列表隐藏。",
    edit: "编辑",
    enable: "启用",
    facebookMessenger: "Facebook / Messenger",
    facebookPageUrl: "Facebook 主页 URL",
    filterCategory: "按分类筛选",
    filterStock: "按库存状态筛选",
    hideProductsFirst: "请先移动或隐藏商品。",
    iconImageUrl: "图标 / 图片 URL",
    image: "图片",
    language: "语言",
    location: "地区",
    mainCategory: "主分类",
    manualPayments: "人工付款记录",
    mergeCategory: "合并分类",
    mergeConfirmation: "该分类下的商品将移动到目标分类。",
    mergeInto: "合并到",
    messengerUrl: "Messenger URL",
    monthlySales: "月销售额",
    moq: "起订量",
    move: "移动",
    moveCategory: "移动分类",
    moveProducts: "移动商品",
    moveProductsTo: "将商品移动到其他分类",
    maxDepthWarning: "无法移动：分类深度不能超过 3 层。",
    name: "姓名",
    newCategoryName: "新分类名称",
    noParent: "无上级",
    notifications: "通知",
    orderCount: "订单数",
    orderNo: "订单号",
    orderStatus: "订单状态",
    orders: "订单",
    pageSize: "每页数量",
    parentCategory: "上级分类",
    paymentMethod: "付款方式",
    paymentStatus: "付款状态",
    payments: "付款",
    pendingConfirmation: "待确认",
    pendingOrders: "待处理订单",
    phone: "电话",
    phoneNumber: "电话号码",
    priceRange: "价格范围",
    productCount: "商品数量",
    productManagement: "商品管理",
    productName: "商品名称",
    productTotal: "商品总额",
    products: "商品",
    readyForPickup: "待取货",
    receivingMethod: "收货方式",
    referenceNo: "参考号",
    reorder: "排序",
    reports: "报表",
    save: "保存",
    searchProducts: "按 SKU 或商品名称搜索",
    settings: "设置",
    shippingFeePayment: "运费到付/付款",
    showHomepage: "首页显示",
    showNavigation: "导航显示",
    showingResults: "显示第 1-20 条，共 3,482 个商品",
    sku: "SKU",
    sortOrder: "排序",
    sourceCategory: "来源分类",
    sourcingItems: "采购中",
    status: "状态",
    stockStatus: "库存状态",
    storeAddress: "店铺地址",
    storeName: "店铺名称",
    subcategory: "子分类",
    targetCategory: "目标分类",
    tier: "阶梯",
    toolApplied: "已在 mock 数据中应用。",
    totalProducts: "商品总数",
    totalSpend: "总消费",
    waitingDeposit: "待付订金",
    waitingDepositOrders: "待付订金订单",
    warning: "警告",
    wholesalePrices: "批发价格",
  },
};

export function translate(language: AdminLanguage, key: TranslationKey) {
  return adminDictionaries[language][key];
}
