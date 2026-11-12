/** Mobile App Preview — device sizes (CSS pixels, portrait) and frame styles. */
export const DEVICE_SIZES = [
  { id: 'small', label: 'Small Mobile', width: 360, height: 640 },
  { id: 'standard', label: 'Standard Mobile', width: 375, height: 812 },
  { id: 'modern', label: 'Modern Mobile', width: 390, height: 844 },
  { id: 'large', label: 'Large Mobile', width: 430, height: 932 },
]

/**
 * statusBar / navBar: heights of the system bars drawn by the frame; the app gets the space in between.
 * cutout: 'punch-hole' (Android camera) or 'island' (iPhone-style pill).
 */
export const DEVICE_PLATFORMS = {
  android: { id: 'android', label: 'Android', bezel: 10, radius: 42, screenRadius: 32, statusBar: 30, navBar: 22, landscapeStatusBar: 24, landscapeNavBar: 18, cutout: 'punch-hole' },
  iphone: { id: 'iphone', label: 'iPhone', bezel: 13, radius: 56, screenRadius: 44, statusBar: 50, navBar: 30, landscapeStatusBar: 26, landscapeNavBar: 20, cutout: 'island' },
}

export const ZOOM_STEPS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5]

/** App entry points inside the device frame and the screens offered as quick links. */
export const PREVIEW_APPS = {
  driver: {
    id: 'driver', label: 'Driver App', login: '/driver/login', home: '/driver/dashboard', scope: 'DRIVER',
    demo: { identifier: 'driver', password: 'Driver@123', label: 'Murugan Selvam — demo driver' },
    screens: [
      { id: 'login', label: 'Driver Login', path: '/driver/login', signedOut: true },
      { id: 'home', label: 'Driver Dashboard', path: '/driver/dashboard' },
      { id: 'deliveries', label: 'My Deliveries', path: '/driver/deliveries' },
      { id: 'delivery', label: 'Delivery Details', dynamic: 'activeDelivery' },
      { id: 'route', label: 'Delivery Tracking (route)', path: '/driver/route' },
      { id: 'confirm', label: 'OTP Verification & Proof of Delivery', dynamic: 'confirmDelivery' },
      { id: 'history', label: 'Delivery History', path: '/driver/completed' },
      { id: 'notes', label: 'Delivery Notes', path: '/driver/delivery-notes' },
      { id: 'profile', label: 'Profile', path: '/driver/profile' },
      { id: 'notifications', label: 'Notifications', path: '/notifications' },
    ],
  },
  customer: {
    id: 'customer', label: 'Customer App', login: '/customer/login', home: '/customer/dashboard', scope: 'CUSTOMER',
    demo: { identifier: 'customer', password: 'Customer@123', label: 'Joseph Daniel — Marina Hotels & Caterers' },
    screens: [
      { id: 'login', label: 'Customer Login', path: '/customer/login', signedOut: true },
      { id: 'home', label: 'Customer Dashboard', path: '/customer/dashboard' },
      { id: 'catalog', label: 'Product Catalog (tap a product for details)', path: '/customer/catalog' },
      { id: 'cart', label: 'Cart', path: '/customer/cart' },
      { id: 'orders', label: 'Orders', path: '/customer/orders' },
      { id: 'order', label: 'Order Details', dynamic: 'latestOrder' },
      { id: 'tracking', label: 'Order Tracking', path: '/customer/tracking' },
      { id: 'notes', label: 'Delivery Proof / Delivery Notes', path: '/customer/delivery-notes' },
      { id: 'invoices', label: 'Invoices', path: '/customer/invoices' },
      { id: 'profile', label: 'Profile', path: '/customer/profile' },
      { id: 'notifications', label: 'Notifications', path: '/notifications' },
    ],
  },
}
