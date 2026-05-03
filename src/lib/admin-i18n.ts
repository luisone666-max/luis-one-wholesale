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
  | "bulkEdit"
  | "exportCsv"
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
  | "filterActive"
  | "hideProductsFirst"
  | "iconImageUrl"
  | "image"
  | "productImage"
  | "imageUrl"
  | "language"
  | "location"
  | "logout"
  | "mainCategory"
  | "manualPayments"
  | "mergeCategory"
  | "mergeConfirmation"
  | "mergeInto"
  | "messengerUrl"
  | "monthlySales"
  | "moq"
  | "model"
  | "brand"
  | "leadTime"
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
  | "price1"
  | "price6"
  | "price12"
  | "price50"
  | "productCount"
  | "productManagement"
  | "productName"
  | "productEditor"
  | "productTotal"
  | "products"
  | "readyForPickup"
  | "receivingMethod"
  | "referenceNo"
  | "reorder"
  | "reports"
  | "save"
  | "searchProducts"
  | "view"
  | "duplicate"
  | "hide"
  | "unhide"
  | "hidden"
  | "activeHiddenStatus"
  | "supplierNotesIndicator"
  | "supplierNotes"
  | "internalCostNotes"
  | "adminNotes"
  | "supplierNotesAdminOnly"
  | "supplierInternalFields"
  | "basicInfo"
  | "categoryTab"
  | "wholesalePricesTab"
  | "imagesTab"
  | "supplierNotesTab"
  | "adminNotesTab"
  | "readyStock"
  | "forOrder"
  | "lowStock"
  | "unavailable"
  | "noAutomaticPricing"
  | "bulkUploadTitle"
  | "downloadCsvTemplate"
  | "uploadCsvArea"
  | "previewImport"
  | "validationResult"
  | "csvColumns"
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
  | "addDeliveryFee"
  | "addPaymentRecord"
  | "amountToConfirm"
  | "cancelOrder"
  | "customerName"
  | "customerPhone"
  | "customerAccountInfo"
  | "completeAddress"
  | "createdDate"
  | "depositSubmitted"
  | "depositVerified"
  | "markFreightCollect"
  | "orderNotes"
  | "orderSummary"
  | "paymentRecords"
  | "pickUpAtStore"
  | "pickupNoShippingFee"
  | "printOrder"
  | "proofImage"
  | "quantity"
  | "productItems"
  | "receiverInfo"
  | "receiverName"
  | "receiverPhone"
  | "shippingFeeAmount"
  | "shippingFeeSeparate"
  | "freightCollect"
  | "prepaidShipping"
  | "toBeConfirmed"
  | "localDelivery"
  | "courierShipping"
  | "noPayment"
  | "fullyPaid"
  | "rejected"
  | "unavailableRefund"
  | "updateOrderStatus"
  | "updatePaymentStatus"
  | "unitPriceSnapshot"
  | "subtotal"
  | "supplierNotesSnapshot"
  | "saveNote"
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
    bulkEdit: "Bulk Edit",
    exportCsv: "Export CSV",
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
    filterActive: "Filter by active/hidden status",
    hideProductsFirst: "Move or hide products first.",
    iconImageUrl: "Icon / Image URL",
    image: "Image",
    productImage: "Product Image",
    imageUrl: "Image URL",
    language: "Language",
    location: "Location",
    logout: "Logout",
    mainCategory: "Main Category",
    manualPayments: "Manual Payment Records",
    mergeCategory: "Merge Category",
    mergeConfirmation: "Products under this category will be moved to the target category.",
    mergeInto: "Merge into",
    messengerUrl: "Messenger URL",
    monthlySales: "Monthly Sales",
    moq: "MOQ",
    model: "Model",
    brand: "Brand",
    leadTime: "Lead Time",
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
    price1: "1-5 pcs price",
    price6: "6-11 pcs price",
    price12: "12-49 pcs price",
    price50: "50+ pcs price",
    productCount: "Product Count",
    productManagement: "Product Management",
    productName: "Product Name",
    productEditor: "Product Editor",
    productTotal: "Product Total",
    products: "Products",
    readyForPickup: "Ready for Pickup",
    receivingMethod: "Receiving Method",
    referenceNo: "Reference No",
    reorder: "Reorder",
    reports: "Reports",
    save: "Save",
    searchProducts: "Search by SKU or product name",
    view: "View",
    duplicate: "Duplicate",
    hide: "Hide",
    unhide: "Unhide",
    hidden: "Hidden",
    activeHiddenStatus: "Active / Hidden",
    supplierNotesIndicator: "Supplier Notes",
    supplierNotes: "Supplier Notes",
    internalCostNotes: "Internal Cost Notes",
    adminNotes: "Admin Notes",
    supplierNotesAdminOnly: "Supplier notes are admin-only and never appear on the customer frontend.",
    supplierInternalFields: "Supplier / Internal Fields",
    basicInfo: "Basic Info",
    categoryTab: "Category",
    wholesalePricesTab: "Wholesale Prices",
    imagesTab: "Images",
    supplierNotesTab: "Supplier Notes",
    adminNotesTab: "Admin Notes",
    readyStock: "Ready Stock",
    forOrder: "For Order",
    lowStock: "Low Stock",
    unavailable: "Unavailable",
    noAutomaticPricing: "Customer prices are manually set by tier. No automatic cost-based pricing.",
    bulkUploadTitle: "Bulk Upload Mockup",
    downloadCsvTemplate: "Download CSV Template",
    uploadCsvArea: "Upload CSV area",
    previewImport: "Preview Import",
    validationResult: "Validation result area",
    csvColumns: "CSV Columns",
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
    addDeliveryFee: "Add Delivery Fee",
    addPaymentRecord: "Add Payment Record",
    amountToConfirm: "Amount to Confirm",
    cancelOrder: "Cancel Order",
    customerName: "Customer Name",
    customerPhone: "Customer Phone",
    customerAccountInfo: "Customer Account Info",
    completeAddress: "Complete Address",
    createdDate: "Created Date",
    depositSubmitted: "Deposit Submitted",
    depositVerified: "Deposit Verified",
    markFreightCollect: "Mark Shipping Fee as Freight Collect",
    orderNotes: "Order Notes",
    orderSummary: "Order Summary",
    paymentRecords: "Payment Records",
    pickUpAtStore: "Pick up at store",
    pickupNoShippingFee: "Pick-up / No Shipping Fee",
    printOrder: "Print Order",
    proofImage: "Proof Image",
    quantity: "Quantity",
    productItems: "Product Items",
    receiverInfo: "Receiver Info",
    receiverName: "Receiver Name",
    receiverPhone: "Receiver Phone",
    shippingFeeAmount: "Shipping Fee Amount",
    shippingFeeSeparate: "Product Total and Shipping Fee are displayed separately.",
    freightCollect: "Freight Collect / Paid by Receiver",
    prepaidShipping: "Prepaid Shipping",
    toBeConfirmed: "To be Confirmed",
    localDelivery: "Local delivery / Lalamove",
    courierShipping: "Courier shipping",
    noPayment: "No Payment",
    fullyPaid: "Fully Paid",
    rejected: "Rejected",
    unavailableRefund: "Unavailable / Refund",
    updateOrderStatus: "Update Order Status",
    updatePaymentStatus: "Update Payment Status",
    unitPriceSnapshot: "Unit Price Snapshot",
    subtotal: "Subtotal",
    supplierNotesSnapshot: "Supplier Notes Snapshot",
    saveNote: "Save Note",
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
    bulkEdit: "批量编辑",
    exportCsv: "导出 CSV",
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
    filterActive: "按上架/隐藏状态筛选",
    hideProductsFirst: "请先移动或隐藏商品。",
    iconImageUrl: "图标 / 图片 URL",
    image: "图片",
    productImage: "商品图片",
    imageUrl: "图片 URL",
    language: "语言",
    location: "地区",
    logout: "退出登录",
    mainCategory: "主分类",
    manualPayments: "人工付款记录",
    mergeCategory: "合并分类",
    mergeConfirmation: "该分类下的商品将移动到目标分类。",
    mergeInto: "合并到",
    messengerUrl: "Messenger URL",
    monthlySales: "月销售额",
    moq: "起订量",
    model: "型号",
    brand: "品牌",
    leadTime: "交期",
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
    price1: "1-5 件价格",
    price6: "6-11 件价格",
    price12: "12-49 件价格",
    price50: "50+ 件价格",
    productCount: "商品数量",
    productManagement: "商品管理",
    productName: "商品名称",
    productEditor: "商品编辑器",
    productTotal: "商品总额",
    products: "商品",
    readyForPickup: "待取货",
    receivingMethod: "收货方式",
    referenceNo: "参考号",
    reorder: "排序",
    reports: "报表",
    save: "保存",
    searchProducts: "按 SKU 或商品名称搜索",
    view: "查看",
    duplicate: "复制",
    hide: "隐藏",
    unhide: "取消隐藏",
    hidden: "隐藏",
    activeHiddenStatus: "上架 / 隐藏",
    supplierNotesIndicator: "供应商备注",
    supplierNotes: "供应商备注",
    internalCostNotes: "内部成本备注",
    adminNotes: "管理员备注",
    supplierNotesAdminOnly: "供应商备注仅后台可见，绝不会显示在客户前台。",
    supplierInternalFields: "供应商 / 内部字段",
    basicInfo: "基础信息",
    categoryTab: "分类",
    wholesalePricesTab: "批发价格",
    imagesTab: "图片",
    supplierNotesTab: "供应商备注",
    adminNotesTab: "管理员备注",
    readyStock: "现货",
    forOrder: "预订",
    lowStock: "低库存",
    unavailable: "不可用",
    noAutomaticPricing: "客户价格由批发阶梯手动设置，不做自动成本加价。",
    bulkUploadTitle: "批量上传 Mockup",
    downloadCsvTemplate: "下载 CSV 模板",
    uploadCsvArea: "上传 CSV 区域",
    previewImport: "预览导入",
    validationResult: "校验结果区域",
    csvColumns: "CSV 字段",
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
    addDeliveryFee: "添加运费",
    addPaymentRecord: "添加付款记录",
    amountToConfirm: "待确认金额",
    cancelOrder: "取消订单",
    customerName: "客户姓名",
    customerPhone: "客户电话",
    customerAccountInfo: "客户账户信息",
    completeAddress: "完整地址",
    createdDate: "创建日期",
    depositSubmitted: "订金已提交",
    depositVerified: "订金已核实",
    markFreightCollect: "标记运费到付",
    orderNotes: "订单备注",
    orderSummary: "订单摘要",
    paymentRecords: "付款记录",
    pickUpAtStore: "到店自提",
    pickupNoShippingFee: "自提 / 无运费",
    printOrder: "打印订单",
    proofImage: "凭证图片",
    quantity: "数量",
    productItems: "商品明细",
    receiverInfo: "收货信息",
    receiverName: "收货人",
    receiverPhone: "收货电话",
    shippingFeeAmount: "运费金额",
    shippingFeeSeparate: "商品总额和运费分开显示。",
    freightCollect: "运费到付 / 收货人支付",
    prepaidShipping: "运费预付",
    toBeConfirmed: "待确认",
    localDelivery: "本地配送 / Lalamove",
    courierShipping: "快递运输",
    noPayment: "未付款",
    fullyPaid: "已全额付款",
    rejected: "已拒绝",
    unavailableRefund: "缺货 / 退款",
    updateOrderStatus: "更新订单状态",
    updatePaymentStatus: "更新付款状态",
    unitPriceSnapshot: "单价快照",
    subtotal: "小计",
    supplierNotesSnapshot: "供应商备注快照",
    saveNote: "保存备注",
    wholesalePrices: "批发价格",
  },
};

export function translate(language: AdminLanguage, key: TranslationKey) {
  return adminDictionaries[language][key];
}
