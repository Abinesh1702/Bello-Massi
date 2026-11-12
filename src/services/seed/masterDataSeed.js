/**
 * Phase 2 master data + inventory seed.
 * IDs of the Phase 1 records (c-001…c-010, p-01…p-15, hub-che…) are preserved so
 * existing orders keep their relations. Pure builders — no storage access.
 */
import dayjs from 'dayjs'
import { seededRandom } from '../../utils/helpers'
import { MOVEMENT_TYPES as MT, TRANSFER_STATUS as TS } from '../../config/masterData'

/* ------------------------------------------------------------------ */
/* Hubs                                                                */
/* ------------------------------------------------------------------ */

const HUB_ROWS = [
  ['hub-che', 'CHE', 'Chennai Central Hub', 'Main Hub', 'Ramesh Iyer', '+91 44 2625 1100', 'chennai.hub@bellomassi.demo', 'Plot 18, SIDCO Industrial Estate', 'Ambattur', 'Chennai', 'Tamil Nadu', '600098', 'Active', 'Mon–Sat 05:00–22:00', 900, 4],
  ['hub-cbe', 'CBE', 'Coimbatore Hub', 'Regional Hub', 'Lakshmi Prabhu', '+91 422 257 3300', 'coimbatore.hub@bellomassi.demo', '41 Avinashi Road', 'Peelamedu', 'Coimbatore', 'Tamil Nadu', '641004', 'Active', 'Mon–Sat 06:00–21:00', 450, 2],
  ['hub-blr', 'BLR', 'Bangalore Hub', 'Regional Hub', 'Naveen Gowda', '+91 80 2839 4400', 'bangalore.hub@bellomassi.demo', '7th Cross, Peenya Industrial Area Phase II', null, 'Bengaluru', 'Karnataka', '560058', 'Active', 'Mon–Sun 05:00–23:00', 700, 3],
  ['hub-mdu', 'MDU', 'Madurai Hub', 'Branch Hub', 'Senthil Murugan', '+91 452 248 5500', 'madurai.hub@bellomassi.demo', 'B-12 Kappalur Industrial Estate', null, 'Madurai', 'Tamil Nadu', '625008', 'Active', 'Mon–Sat 06:00–20:00', 350, 2],
  ['hub-hyd', 'HYD', 'Hyderabad Hub', 'Distribution Hub', 'Farhan Ali', '+91 40 2726 6600', 'hyderabad.hub@bellomassi.demo', 'Phase III, IDA Cherlapally', null, 'Hyderabad', 'Telangana', '500051', 'Active', 'Mon–Sat 05:30–22:00', 600, 3],
  ['hub-try', 'TRY', 'Trichy Branch Hub', 'Warehouse', 'Karthikeyan S', '+91 431 240 7700', 'trichy.hub@bellomassi.demo', 'SIDCO Thuvakudi', null, 'Tiruchirappalli', 'Tamil Nadu', '620015', 'Inactive', 'Closed for refurbishment', 200, 1],
]

const buildHubs = (now) =>
  HUB_ROWS.map(([id, code, name, hubType, managerName, contactNumber, email, addressLine1, addressLine2, city, state, pincode, status, operatingHours, capacityPallets, coldRooms], i) => ({
    id, code, name, hubType, managerName, contactNumber, email, addressLine1, addressLine2: addressLine2 || '', city, state, pincode,
    country: 'India', status, operatingHours, capacityPallets, coldRooms,
    notes: id === 'hub-try' ? 'Cold rooms being re-insulated. Not used for dispatch until reopening.' : `${coldRooms} cold rooms · ${capacityPallets} pallet positions.`,
    createdAt: now.subtract(400 - i * 20, 'day').toISOString(),
    updatedAt: now.subtract(10 + i, 'day').toISOString(),
  }))

/* ------------------------------------------------------------------ */
/* Customers                                                           */
/* ------------------------------------------------------------------ */

const STATE_CODE = { 'Tamil Nadu': '33', Karnataka: '29', Telangana: '36', Kerala: '32', Puducherry: '34' }

const makePan = (name, index, entity = 'C') => {
  const letters = name.replace(/[^A-Z]/gi, '').toUpperCase().padEnd(3, 'X')
  return `${letters.slice(0, 3)}${entity}${letters[0]}${String(4100 + index * 37).slice(-4)}${'ABCDEFGHJK'[index % 10]}`
}
const makeGst = (state, pan, index) => `${STATE_CODE[state] || '33'}${pan}1Z${'0123456789ABCDEFGH'[index % 18]}`

// [id, code, name, businessName, type, category, contact, mobile, email, addr1, addr2, city, state, pincode, hubId, zoneId, salesRepId,
//  status, sinceDaysAgo, creditEnabled, limit, balance, creditDays, vip]
const CUSTOMER_ROWS = [
  ['c-001', 'CUS-001', 'ABC Enterprises', 'ABC Enterprises Pvt Ltd', 'Wholesale', 'General Trade', 'Rajesh Kannan', '+91 98410 22301', 'orders@abcenterprises.demo', '14 Anna Salai', 'Teynampet', 'Chennai', 'Tamil Nadu', '600018', 'hub-che', 'z-che-b', 'u-salesman', 'Active', 1460, true, 500000, 212000, 30, { pass: true, expiryDays: 240, no: 'VIP-2026-0012' }],
  ['c-002', 'CUS-002', 'Chennai Industrial Supplies', 'Chennai Industrial Supplies LLP', 'Corporate', 'Institutional', 'Bala Subramanian', '+91 98410 22302', 'purchase@cis.demo', '22 Industrial Estate', 'Guindy', 'Chennai', 'Tamil Nadu', '600032', 'hub-che', 'z-che-c', 'u-salesman', 'Active', 1100, true, 750000, 698500, 45, null],
  ['c-003', 'CUS-003', 'Sri Lakshmi Traders', 'Sri Lakshmi Traders', 'Retail', 'General Trade', 'Lakshmi Narayanan', '+91 98430 22303', 'srilakshmi@traders.demo', '8 West Masi Street', null, 'Madurai', 'Tamil Nadu', '625001', 'hub-mdu', 'z-mdu-a', 'sr-vignesh', 'Active', 900, true, 200000, 64000, 21, null],
  ['c-004', 'CUS-004', 'Metro Wholesale', 'Metro Wholesale Trading Pvt Ltd', 'Wholesale', 'Cash & Carry', 'Kiran Shetty', '+91 98450 22304', 'buying@metrowholesale.demo', 'Tumkur Road', 'Yeshwanthpur', 'Bengaluru', 'Karnataka', '560022', 'hub-blr', 'z-blr-a', 'sr-meena', 'Active', 1300, true, 1200000, 1268000, 30, { pass: true, expiryDays: -20, no: 'VIP-2025-0007' }],
  ['c-005', 'CUS-005', 'Global Distributors', 'Global Food Distributors', 'Distributor', 'General Trade', 'Imran Qureshi', '+91 98490 22305', 'ops@globaldist.demo', 'Plot 41, Uppal Industrial Area', null, 'Hyderabad', 'Telangana', '500039', 'hub-hyd', 'z-hyd-a', 'sr-meena', 'Active', 800, true, 900000, 355000, 45, null],
  ['c-006', 'CUS-006', 'Kovai Fresh Foods', 'Kovai Fresh Foods', 'Retail', 'Modern Trade', 'Gowtham Ravi', '+91 98420 22306', 'kovaifresh@foods.demo', '112 DB Road', 'RS Puram', 'Coimbatore', 'Tamil Nadu', '641002', 'hub-cbe', 'z-cbe-a', 'sr-vignesh', 'Active', 620, true, 250000, 91000, 21, null],
  ['c-007', 'CUS-007', 'Annapoorna Caterers', 'Annapoorna Catering Services', 'Corporate', 'Catering', 'Saraswathi Mohan', '+91 98420 22307', 'kitchen@annapoorna.demo', '5 Race Course Road', null, 'Coimbatore', 'Tamil Nadu', '641018', 'hub-cbe', 'z-cbe-a', 'sr-vignesh', 'Active', 540, true, 300000, 120500, 30, null],
  ['c-008', 'CUS-008', 'Green Leaf Restaurants', 'Green Leaf Hospitality Pvt Ltd', 'Corporate', 'HoReCa', 'Ananya Hegde', '+91 98450 22308', 'supply@greenleaf.demo', '80 Feet Road', 'Koramangala', 'Bengaluru', 'Karnataka', '560034', 'hub-blr', 'z-blr-b', 'sr-meena', 'Active', 700, true, 400000, 158000, 30, { pass: false }],
  ['c-009', 'CUS-009', 'Deccan Retail Mart', 'Deccan Retail Mart', 'Retail', 'Modern Trade', 'Srinivas Reddy', '+91 98490 22309', 'deccanmart@retail.demo', 'Road No. 12', 'Banjara Hills', 'Hyderabad', 'Telangana', '500034', 'hub-hyd', 'z-hyd-a', 'sr-meena', 'Inactive', 450, true, 350000, 40000, 21, null],
  ['c-010', 'CUS-010', 'Marina Hotels & Caterers', 'Marina Hotels Pvt Ltd', 'Corporate', 'HoReCa', 'Joseph Daniel', '+91 98410 22310', 'fnb@marinahotels.demo', '3 Kamarajar Salai', 'Mylapore', 'Chennai', 'Tamil Nadu', '600004', 'hub-che', 'z-che-a', 'u-salesman', 'Active', 1800, true, 600000, 287000, 30, { pass: true, expiryDays: 410, no: 'VIP-2026-0021' }],
  ['c-011', 'CUS-011', 'Kaveri Supermarket', 'Kaveri Retail Ventures', 'Retail', 'Modern Trade', 'Prabhu Shankar', '+91 98425 31011', 'store@kaverisuper.demo', '17 Omalur Main Road', null, 'Salem', 'Tamil Nadu', '636004', 'hub-cbe', 'z-cbe-a', 'sr-vignesh', 'Active', 300, true, 220000, 48000, 21, null],
  ['c-012', 'CUS-012', 'Spice Route Restaurants', 'Spice Route Foods Pvt Ltd', 'Corporate', 'HoReCa', 'Rohan Menon', '+91 98450 31012', 'purchase@spiceroute.demo', '12 Church Street', null, 'Bengaluru', 'Karnataka', '560001', 'hub-blr', 'z-blr-b', 'sr-meena', 'Active', 260, true, 450000, 132000, 30, { pass: true, expiryDays: 150, no: 'VIP-2026-0034' }],
  ['c-013', 'CUS-013', 'Royal Feast Banquets', 'Royal Feast Events', 'Corporate', 'Catering', 'Mohammed Riyaz', '+91 98410 31013', 'events@royalfeast.demo', '44 GST Road', 'Pallavaram', 'Chennai', 'Tamil Nadu', '600043', 'hub-che', 'z-che-a', 'u-salesman', 'Active', 210, true, 350000, 120000, 30, null],
  ['c-014', 'CUS-014', 'Nilgiri Fresh Mart', 'Nilgiri Fresh Mart', 'Retail', 'General Trade', 'Devika Raman', '+91 98422 31014', 'nilgirimart@shop.demo', '9 Commercial Road', null, 'Ooty', 'Tamil Nadu', '643001', 'hub-cbe', 'z-cbe-a', 'sr-vignesh', 'Active', 180, false, 0, 0, 0, null],
  ['c-015', 'CUS-015', 'Charminar Foods', 'Charminar Foods & Agencies', 'Distributor', 'Cash & Carry', 'Syed Aslam', '+91 98490 31015', 'charminarfoods@agency.demo', 'Shop 4, Begum Bazaar', null, 'Hyderabad', 'Telangana', '500012', 'hub-hyd', 'z-hyd-a', 'sr-meena', 'Active', 520, true, 600000, 210000, 30, null],
  ['c-016', 'CUS-016', 'Coastal Seafood Traders', 'Coastal Seafood Traders', 'Dealer', 'General Trade', 'Arul Prakash', '+91 98431 31016', 'coastal@seafood.demo', '21 Beach Road', null, 'Puducherry', 'Puducherry', '605001', 'hub-che', 'z-che-c', 'u-salesman', 'Active', 400, true, 280000, 96000, 21, null],
  ['c-017', 'CUS-017', 'Kochi Hotel Supplies', 'Kochi Hotel Supplies Co', 'Distributor', 'HoReCa', 'Thomas Varghese', '+91 98470 31017', 'orders@kochihotel.demo', 'Willingdon Island', null, 'Kochi', 'Kerala', '682003', 'hub-cbe', 'z-cbe-a', 'sr-vignesh', 'Active', 150, true, 500000, 175000, 45, null],
  ['c-018', 'CUS-018', 'Temple City Caterers', 'Temple City Caterers', 'Corporate', 'Catering', 'Muthu Kumar', '+91 98430 31018', 'templecity@caterers.demo', '62 North Veli Street', null, 'Madurai', 'Tamil Nadu', '625001', 'hub-mdu', 'z-mdu-a', 'sr-vignesh', 'Active', 330, true, 180000, 52000, 21, null],
  ['c-019', 'CUS-019', 'TechPark Cafeterias', 'TechPark Cafeterias Pvt Ltd', 'Corporate', 'Institutional', 'Sneha Kulkarni', '+91 98450 31019', 'procurement@techparkcafe.demo', 'Outer Ring Road', 'Marathahalli', 'Bengaluru', 'Karnataka', '560037', 'hub-blr', 'z-blr-a', 'sr-meena', 'Active', 90, true, 400000, 342000, 30, null],
  ['c-020', 'CUS-020', 'Sai Balaji Provisions', 'Sai Balaji Provisions', 'Retail', 'General Trade', 'Venkatesh Rao', '+91 98490 31020', 'saibalaji@provisions.demo', '3-5-112 Narayanguda', null, 'Hyderabad', 'Telangana', '500029', 'hub-hyd', 'z-hyd-a', 'sr-meena', 'Blocked', 700, true, 150000, 171000, 21, null],
]

const CUSTOMER_NOTES = {
  'c-002': 'Monthly PO cycle. Requires delivery before 10:00.',
  'c-004': 'High-volume buyer. Credit review scheduled with Finance.',
  'c-014': 'Cash on delivery only — credit not offered.',
  'c-020': 'Blocked: outstanding over limit for more than 60 days.',
}

const buildCustomers = (now) =>
  CUSTOMER_ROWS.map((r, i) => {
    const [id, code, name, businessName, type, category, contactPerson, mobile, email, addressLine1, addressLine2, city, state, pincode, hubId, zoneId, salesRepId, status, sinceDays, creditEnabled, creditLimit, creditBalance, creditDays, vip] = r
    const pan = makePan(businessName, i, /Pvt|LLP|Co$/.test(businessName) ? 'C' : 'F')
    return {
      id, code, name, businessName, type, category, contactPerson, mobile,
      altMobile: i % 3 === 0 ? `+91 9${String(7000000000 + i * 1234567).slice(1, 5)} ${String(10000 + i * 731).slice(-5)}` : '',
      email, gstNumber: makeGst(state, pan, i), panNumber: pan,
      addressLine1, addressLine2: addressLine2 || '', city, state, pincode, country: 'India',
      status, customerSince: now.subtract(sinceDays, 'day').format('YYYY-MM-DD'),
      salesRepId, hubId, zoneId, notes: CUSTOMER_NOTES[id] || '',
      creditEnabled, creditLimit, creditBalance, creditDays,
      isVip: Boolean(vip),
      vipPassEnabled: Boolean(vip?.pass),
      vipPassNumber: vip?.no || '',
      vipPassExpiry: vip?.pass ? now.add(vip.expiryDays, 'day').format('YYYY-MM-DD') : '',
      createdAt: now.subtract(sinceDays, 'day').toISOString(),
      updatedAt: now.subtract(Math.min(sinceDays, 5 + i), 'day').toISOString(),
    }
  })

/* ------------------------------------------------------------------ */
/* Products                                                            */
/* ------------------------------------------------------------------ */

// [id, sku, name, category, brand, packSize, unit, price, tax, storage, status, type, track, minL, reorder, maxL, allowNeg, desc]
const PRODUCT_ROWS = [
  ['p-01', 'BM-PLT-001', 'Whole Chicken (Frozen)', 'Frozen Food', 'Bellomassi Select', '10 × 1.2 kg', 'CTN', 2850, 12, 'Frozen', 'Active', 'Stockable', true, 20, 40, 400, false, 'Grade A whole broiler chicken, blast frozen.'],
  ['p-02', 'BM-PLT-002', 'Chicken Breast Boneless', 'Frozen Food', 'Bellomassi Select', '6 × 2 kg', 'CTN', 3960, 12, 'Frozen', 'Active', 'Stockable', true, 15, 30, 300, false, 'Skinless boneless breast fillets, IQF.'],
  ['p-03', 'BM-PLT-003', 'Chicken Nuggets', 'Frozen Food', 'FrostField', '10 × 1 kg', 'CTN', 3200, 12, 'Frozen', 'Active', 'Stockable', true, 20, 40, 350, false, 'Breaded chicken nuggets, ready to fry.'],
  ['p-04', 'BM-PLT-004', 'Chicken Seekh Kebab', 'Frozen Food', 'FrostField', '12 × 500 g', 'CTN', 2760, 12, 'Frozen', 'Active', 'Stockable', true, 10, 25, 250, false, 'Spiced minced chicken kebabs, par-cooked.'],
  ['p-05', 'BM-PTO-001', 'French Fries 9 mm', 'Frozen Food', 'FrostField', '4 × 2.5 kg', 'CTN', 1680, 5, 'Frozen', 'Active', 'Stockable', true, 30, 60, 500, false, 'Straight-cut 9 mm fries, pre-fried.'],
  ['p-06', 'BM-PTO-002', 'Potato Wedges Seasoned', 'Frozen Food', 'FrostField', '4 × 2.5 kg', 'CTN', 1840, 5, 'Frozen', 'Active', 'Stockable', true, 15, 30, 300, false, 'Skin-on wedges with herb seasoning.'],
  ['p-07', 'BM-VEG-001', 'Green Peas', 'Frozen Food', 'Pure Pastures', '10 × 1 kg', 'CTN', 1150, 5, 'Frozen', 'Active', 'Stockable', true, 20, 40, 400, false, 'IQF garden peas.'],
  ['p-08', 'BM-VEG-002', 'Sweet Corn Kernels', 'Frozen Food', 'Pure Pastures', '10 × 1 kg', 'CTN', 1240, 5, 'Frozen', 'Active', 'Stockable', true, 20, 40, 400, false, 'IQF sweet corn kernels.'],
  ['p-09', 'BM-VEG-003', 'Mixed Vegetables', 'Frozen Food', 'Pure Pastures', '10 × 1 kg', 'CTN', 1190, 5, 'Frozen', 'Active', 'Stockable', true, 20, 40, 400, false, 'Carrot, beans, peas and corn mix.'],
  ['p-10', 'BM-DRY-001', 'Paneer Block', 'Chilled Food', 'Pure Pastures', '10 × 1 kg', 'CTN', 3450, 5, 'Chilled', 'Active', 'Stockable', true, 10, 25, 200, false, 'Fresh malai paneer, vacuum packed.'],
  ['p-11', 'BM-DRY-002', 'Mozzarella Cheese', 'Chilled Food', 'Pure Pastures', '6 × 2 kg', 'CTN', 5280, 12, 'Chilled', 'Active', 'Stockable', true, 10, 20, 180, false, 'Low-moisture pizza mozzarella blocks.'],
  ['p-12', 'BM-DRY-003', 'Table Butter Salted', 'Chilled Food', 'Pure Pastures', '20 × 500 g', 'CTN', 4900, 12, 'Chilled', 'Active', 'Stockable', true, 10, 20, 180, false, 'Salted table butter.'],
  ['p-13', 'BM-SEA-001', 'Basa Fish Fillet', 'Frozen Food', 'OceanCrest', '10 × 1 kg', 'CTN', 3350, 5, 'Frozen', 'Active', 'Stockable', true, 10, 25, 250, false, 'Skinless basa fillets, glazed.'],
  ['p-14', 'BM-SEA-002', 'Prawns 26/30 Peeled', 'Frozen Food', 'OceanCrest', '10 × 1 kg', 'CTN', 6900, 5, 'Frozen', 'Active', 'Stockable', true, 8, 20, 150, false, 'Peeled and deveined white prawns, 26/30 count.'],
  ['p-15', 'BM-SNK-001', 'Veg Spring Rolls', 'Frozen Food', 'FrostField', '12 × 600 g', 'CTN', 2340, 12, 'Frozen', 'Active', 'Stockable', true, 10, 25, 250, false, 'Vegetable spring rolls, ready to fry.'],
  ['p-16', 'BM-MTN-001', 'Mutton Keema', 'Frozen Food', 'Bellomassi Select', 'Bulk', 'KG', 720, 12, 'Frozen', 'Active', 'Stockable', true, 50, 100, 1200, false, 'Fresh-frozen goat mince, sold per kg.'],
  ['p-17', 'BM-PLT-005', 'Chicken Wings', 'Frozen Food', 'Bellomassi Select', '6 × 2 kg', 'CTN', 2980, 12, 'Frozen', 'Active', 'Stockable', true, 10, 25, 250, false, 'Mid-joint and drumette wings.'],
  ['p-18', 'BM-SEA-003', 'Fish Fingers', 'Frozen Food', 'OceanCrest', '10 × 1 kg', 'CTN', 2650, 12, 'Frozen', 'Active', 'Stockable', true, 10, 20, 200, false, 'Breaded fish fingers.'],
  ['p-19', 'BM-SNK-002', 'Aloo Tikki', 'Frozen Food', 'FrostField', '12 × 800 g', 'CTN', 1980, 12, 'Frozen', 'Active', 'Stockable', true, 10, 20, 220, false, 'Spiced potato patties.'],
  ['p-20', 'BM-BKY-001', 'Malabar Parotta', 'Frozen Food', 'FrostField', '20 × 5 pcs', 'CTN', 2100, 5, 'Frozen', 'Active', 'Stockable', true, 15, 30, 300, false, 'Layered flaky parotta, heat and serve.'],
  ['p-21', 'BM-DRY-004', 'Fresh Cream 25%', 'Chilled Food', 'Pure Pastures', '12 × 1 L', 'CTN', 2280, 5, 'Chilled', 'Active', 'Stockable', true, 10, 20, 160, false, 'UHT cooking cream, 25% fat.'],
  ['p-22', 'BM-DRY-005', 'Cheddar Cheese Slices', 'Chilled Food', 'Pure Pastures', '10 × 750 g', 'CTN', 4650, 12, 'Chilled', 'Inactive', 'Stockable', true, 5, 10, 100, false, 'Processed cheddar slices. Paused pending new supplier.'],
  ['p-23', 'BM-CNS-001', 'Thermal Insulated Box 50 L', 'Consumables', 'ColdKeep', '1 box', 'PCS', 1450, 18, 'Ambient', 'Active', 'Consumable', true, 20, 40, 300, false, 'EPS insulated delivery box with lid.'],
  ['p-24', 'BM-CNS-002', 'Gel Ice Pack 500 g', 'Consumables', 'ColdKeep', '24 packs', 'PACK', 640, 18, 'Frozen', 'Active', 'Consumable', true, 30, 60, 600, true, 'Reusable gel packs for last-mile cold chain.'],
  ['p-25', 'BM-CNS-003', 'Food-Grade Nitrile Gloves', 'Consumables', 'SafeHands', '100 gloves', 'BOX', 520, 12, 'Ambient', 'Active', 'Consumable', true, 20, 40, 400, false, 'Powder-free blue nitrile gloves, size M/L.'],
  ['p-26', 'BM-SRV-001', 'Doorstep Handling Charge', 'General', 'Bellomassi', 'Per delivery', 'PCS', 150, 18, 'Ambient', 'Active', 'Service', false, 0, 0, 0, false, 'Service line for upper-floor or after-hours handling. Not stocked.'],
  ['p-27', 'BM-SPR-001', 'Reefer Door Gasket', 'Spare Parts', 'ThermoSeal', '1 piece', 'PCS', 3800, 18, 'Ambient', 'Active', 'Stockable', true, 2, 4, 30, false, 'Replacement door seal for reefer truck bodies.'],
  ['p-28', 'BM-ELC-001', 'Temperature Data Logger', 'Electrical', 'TempTrace', '1 unit', 'PCS', 2650, 18, 'Ambient', 'Active', 'Stockable', true, 3, 6, 40, false, 'USB data logger, −40 °C to +70 °C, 32k readings.'],
  ['p-29', 'BM-MEC-001', 'Pallet Jack Wheel Kit', 'Mechanical', 'LiftPro', '4 wheels + bearings', 'SET', 5400, 18, 'Ambient', 'Discontinued', 'Stockable', true, 1, 2, 20, false, 'Polyurethane wheel set for 2.5 T pallet jacks.'],
  ['p-30', 'BM-GEN-001', 'Refined Sunflower Oil', 'General', 'GoldenDrop', '15 L tin', 'LTR', 165, 5, 'Ambient', 'Active', 'Stockable', true, 150, 300, 3000, false, 'Refined sunflower oil for kitchens, priced per litre.'],
]

/** EAN-13 with India GS1 prefix and a valid check digit. */
const ean13 = (n) => {
  const base = `890${String(5501000 + n * 173).padStart(7, '0')}${String(n).padStart(2, '0')}`.slice(0, 12)
  const sum = base.split('').reduce((s, d, i) => s + Number(d) * (i % 2 ? 3 : 1), 0)
  return base + ((10 - (sum % 10)) % 10)
}

const buildProducts = (now) =>
  PRODUCT_ROWS.map((r, i) => {
    const [id, sku, name, category, brand, packSize, unit, sellingPrice, taxPercent, storageCondition, status, productType, trackInventory, minStockLevel, reorderLevel, maxStockLevel, allowNegativeStock, description] = r
    return {
      id, code: `PRD-${String(i + 1).padStart(4, '0')}`, sku, barcode: productType === 'Service' ? '' : ean13(i + 1),
      name, category, brand, description, status, unit, packSize, productType, storageCondition,
      sellingPrice, purchasePrice: Math.round(sellingPrice * 0.78), taxPercent,
      discountAllowed: i % 4 !== 3, maxDiscountPercent: i % 4 !== 3 ? 5 + (i % 3) * 2.5 : 0,
      trackInventory, minStockLevel, reorderLevel, maxStockLevel, allowNegativeStock,
      image: null, notes: '',
      createdAt: now.subtract(300 - i * 6, 'day').toISOString(),
      updatedAt: now.subtract(3 + (i % 20), 'day').toISOString(),
    }
  })

/* ------------------------------------------------------------------ */
/* Inventory + documents + movements                                   */
/* ------------------------------------------------------------------ */

const OPEN_ORDER_STATUSES = ['APPROVED', 'WITH_CS', 'READY_FOR_DISPATCH', 'PLANNED']
const HUB_SCALE = { 'hub-che': 1.6, 'hub-cbe': 0.8, 'hub-blr': 1.3, 'hub-mdu': 0.6, 'hub-hyd': 1 }

const SUPPLIER_BY_BRAND = {
  FrostField: 'FrostField Foods, Hosur plant',
  'Pure Pastures': 'Pure Pastures Dairy, Erode',
  OceanCrest: 'OceanCrest Exports, Tuticorin',
  'Bellomassi Select': 'Bellomassi Select processing unit, Namakkal',
  ColdKeep: 'ColdKeep Packaging, Sriperumbudur',
  GoldenDrop: 'GoldenDrop Oils, Kakinada',
}

/**
 * Builds stock records, receipts, transfers, adjustments and the movement ledger so that
 * replaying every movement from the opening balance reproduces the current stock exactly.
 */
const buildInventory = (now, products, hubs, orders) => {
  const rand = seededRandom(2026)
  const activeHubs = hubs.filter((h) => h.status === 'Active')
  const stocked = products.filter((p) => p.trackInventory)

  // Reservations from open orders (approved but not yet out for delivery)
  const reserved = {}
  orders.filter((o) => OPEN_ORDER_STATUSES.includes(o.status)).forEach((o) => {
    o.items.forEach((it) => {
      const k = `${it.productId}|${o.hubId}`
      reserved[k] = (reserved[k] || 0) + it.quantity
    })
  })

  // 1. Target current stock per product × hub
  const records = []
  let n = 0
  activeHubs.forEach((hub, hi) => {
    stocked.forEach((p, pi) => {
      if (pi >= 15 && (hi + pi) % 7 === 3) return // not every hub carries every line
      if (['p-27', 'p-28', 'p-29'].includes(p.id) && ['hub-mdu', 'hub-hyd'].includes(hub.id)) return
      n += 1
      const key = `${p.id}|${hub.id}`
      const res = reserved[key] || 0
      const damaged = n % 11 === 0 ? 2 + (n % 4) : 0
      const reorder = Math.max(1, Math.round(p.reorderLevel * HUB_SCALE[hub.id]))
      const max = Math.max(reorder * 3, Math.round(p.maxStockLevel * HUB_SCALE[hub.id]))
      let available
      if (n % 23 === 5) available = 0 // out of stock
      else if (n % 9 === 4) available = Math.max(1, Math.round(reorder * (0.3 + rand() * 0.6))) // low
      else if (n % 29 === 7) available = max + 20 + Math.round(rand() * 60) - res - damaged // overstock
      else available = Math.round(reorder * (1.6 + rand() * 4))
      records.push({
        id: `stk-${hub.code}-${p.code}`,
        productId: p.id,
        hubId: hub.id,
        totalQuantity: available + res + damaged,
        reservedQuantity: res,
        damagedQuantity: damaged,
        minimumStock: Math.max(0, Math.round(p.minStockLevel * HUB_SCALE[hub.id])),
        reorderLevel: reorder,
        maximumStock: max,
        lastUpdated: now.subtract(1 + Math.round(rand() * 25), 'day').toISOString(),
      })
    })
  })
  const byKey = Object.fromEntries(records.map((r) => [`${r.productId}|${r.hubId}`, r]))
  const healthy = records.filter((r) => r.totalQuantity - r.reservedQuantity - r.damagedQuantity > r.reorderLevel * 2)
  const pick = (arr) => arr[Math.floor(rand() * arr.length)]
  const at = (daysAgo, hour) => now.subtract(daysAgo, 'day').hour(hour).minute(Math.floor(rand() * 60)).second(0)

  // 2. Documents (chronological)
  const receipts = []
  for (let i = 0; i < 28; i += 1) {
    // Receipts and transfers-in go to healthy lines so the seeded low/out-of-stock lines keep their status
    const rec = pick(healthy)
    const product = products.find((p) => p.id === rec.productId)
    const date = at(30 - i, 7 + (i % 9))
    receipts.push({
      id: `rcp-${String(i + 1).padStart(3, '0')}`,
      receiptNumber: `GRN-2026-${String(201 + i).padStart(4, '0')}`,
      receiptDate: date.format('YYYY-MM-DD'),
      hubId: rec.hubId,
      productId: rec.productId,
      quantity: Math.max(5, Math.round(rec.reorderLevel * (0.8 + rand() * 1.5))),
      referenceNumber: `PO-45${String(10230 + i * 7)}`,
      notes: `Received from ${SUPPLIER_BY_BRAND[product.brand] || 'approved vendor'}`,
      status: 'Completed',
      createdBy: 'u-admin',
      createdAt: date.toISOString(),
    })
  }

  const transfers = []
  const TRANSFER_PLAN = [TS.COMPLETED, TS.COMPLETED, TS.COMPLETED, TS.CANCELLED, TS.COMPLETED, TS.COMPLETED, TS.COMPLETED, TS.COMPLETED, TS.DRAFT]
  TRANSFER_PLAN.forEach((status, i) => {
    let src
    let dest
    for (let tries = 0; tries < 40 && !dest; tries += 1) {
      src = pick(healthy)
      const options = activeHubs.filter((h) => h.id !== src.hubId && healthy.includes(byKey[`${src.productId}|${h.id}`]))
      if (options.length) dest = pick(options)
    }
    const date = at(26 - i * 3, 10 + (i % 6))
    transfers.push({
      id: `trf-${String(i + 1).padStart(3, '0')}`,
      transferNumber: `TRF-2026-${String(41 + i).padStart(4, '0')}`,
      transferDate: date.format('YYYY-MM-DD'),
      sourceHubId: src.hubId,
      destinationHubId: dest.id,
      productId: src.productId,
      quantity: Math.max(4, Math.round(src.reorderLevel * (0.4 + rand() * 0.5))),
      status,
      notes: status === TS.CANCELLED ? 'Cancelled — destination hub received a direct supplier delivery.' : status === TS.DRAFT ? 'Awaiting truck availability.' : 'Rebalancing stock ahead of weekend demand.',
      createdBy: 'u-admin',
      createdAt: date.toISOString(),
      completedAt: status === TS.COMPLETED ? date.add(3, 'hour').toISOString() : null,
      cancelledAt: status === TS.CANCELLED ? date.add(1, 'day').toISOString() : null,
    })
  })

  const ADJ_PLAN = [
    ['Damaged', 'Damaged Stock', 'Cartons crushed during unloading.'],
    ['Increase', 'Physical Stock Correction', 'Cycle count found additional cartons in cold room 2.'],
    ['Lost', 'Lost Stock', 'Short-shipped on inter-hub transfer, not traceable.'],
    ['Decrease', 'Expired Stock', 'Batch past best-before date, removed from saleable stock.'],
    ['Correction', 'Data Correction', 'Receipt keyed with wrong pack count.'],
    ['Damaged', 'Damaged Stock', 'Temperature excursion during power outage.'],
    ['Decrease', 'Physical Stock Correction', 'Monthly stock count variance.'],
    ['Increase', 'Data Correction', 'Return from customer not booked earlier.'],
    ['Lost', 'Other', 'Pilferage reported by hub security.'],
    ['Correction', 'Physical Stock Correction', 'Quarterly audit adjustment.'],
  ]
  const adjustments = ADJ_PLAN.map(([type, reason, notes], i) => {
    const rec = pick(healthy)
    const date = at(28 - i * 3, 15 + (i % 4))
    return {
      id: `adj-${String(i + 1).padStart(3, '0')}`,
      adjustmentNumber: `ADJ-2026-${String(61 + i).padStart(4, '0')}`,
      adjustmentDate: date.format('YYYY-MM-DD'),
      hubId: rec.hubId,
      productId: rec.productId,
      type,
      direction: type === 'Correction' ? (i % 2 ? 'increase' : 'decrease') : null,
      quantity: 1 + Math.round(rand() * Math.max(2, rec.reorderLevel * 0.25)),
      reason,
      notes,
      createdBy: i % 3 === 0 ? 'u-dispatcher' : 'u-admin',
      createdAt: date.toISOString(),
    }
  })

  // 3. Ledger events → effects on (total, damaged) per record
  const events = []
  receipts.forEach((r) => events.push({ at: r.createdAt, ref: r.receiptNumber, by: r.createdBy, notes: r.notes, effects: [{ key: `${r.productId}|${r.hubId}`, type: MT.RECEIPT, dTotal: r.quantity, dDamaged: 0, qty: r.quantity }] }))
  transfers.filter((t) => t.status === TS.COMPLETED).forEach((t) => events.push({
    at: t.completedAt, ref: t.transferNumber, by: t.createdBy, notes: t.notes,
    effects: [
      { key: `${t.productId}|${t.sourceHubId}`, type: MT.TRANSFER_OUT, dTotal: -t.quantity, dDamaged: 0, qty: t.quantity },
      { key: `${t.productId}|${t.destinationHubId}`, type: MT.TRANSFER_IN, dTotal: t.quantity, dDamaged: 0, qty: t.quantity },
    ],
  }))
  adjustments.forEach((a) => {
    const key = `${a.productId}|${a.hubId}`
    const map = {
      Increase: [MT.ADJ_INCREASE, a.quantity, 0],
      Decrease: [MT.ADJ_DECREASE, -a.quantity, 0],
      Lost: [MT.LOST, -a.quantity, 0],
      Damaged: [MT.DAMAGE, 0, a.quantity],
      Correction: a.direction === 'increase' ? [MT.ADJ_INCREASE, a.quantity, 0] : [MT.ADJ_DECREASE, -a.quantity, 0],
    }
    const [type, dTotal, dDamaged] = map[a.type]
    events.push({ at: a.createdAt, ref: a.adjustmentNumber, by: a.createdBy, notes: `${a.reason} — ${a.notes}`, effects: [{ key, type, dTotal, dDamaged, qty: a.quantity }] })
  })
  events.sort((a, b) => (a.at < b.at ? -1 : 1))

  // Opening balances = current − net effect; then guarantee no negative available at any step.
  const opening = {}
  records.forEach((r) => {
    const k = `${r.productId}|${r.hubId}`
    let dT = 0
    let dD = 0
    events.forEach((e) => e.effects.forEach((f) => { if (f.key === k) { dT += f.dTotal; dD += f.dDamaged } }))
    if (r.damagedQuantity < dD) { r.totalQuantity += dD - r.damagedQuantity; r.damagedQuantity = dD }
    opening[k] = { total: r.totalQuantity - dT, damaged: r.damagedQuantity - dD, reserved: r.reservedQuantity }
  })
  const simulate = () => {
    const state = Object.fromEntries(Object.entries(opening).map(([k, v]) => [k, { ...v }]))
    const minAvail = {}
    Object.entries(state).forEach(([k, s]) => { minAvail[k] = s.total - s.reserved - s.damaged })
    events.forEach((e) => e.effects.forEach((f) => {
      const s = state[f.key]
      s.total += f.dTotal
      s.damaged += f.dDamaged
      minAvail[f.key] = Math.min(minAvail[f.key], s.total - s.reserved - s.damaged)
    }))
    return minAvail
  }
  const minAvail = simulate()
  Object.entries(minAvail).forEach(([k, m]) => {
    if (m < 0) {
      opening[k].total += -m
      byKey[k].totalQuantity += -m
    }
  })

  // 4. Replay to produce the movement ledger
  const state = Object.fromEntries(Object.entries(opening).map(([k, v]) => [k, { ...v }]))
  const movements = []
  events.forEach((e) => e.effects.forEach((f) => {
    const s = state[f.key]
    const [productId, hubId] = f.key.split('|')
    const prevTotal = s.total
    const prevAvail = s.total - s.reserved - s.damaged
    s.total += f.dTotal
    s.damaged += f.dDamaged
    movements.push({
      id: `mov-${String(movements.length + 1).padStart(4, '0')}`,
      movementNumber: `MOV-2026-${String(movements.length + 1001).padStart(5, '0')}`,
      date: e.at,
      productId,
      hubId,
      movementType: f.type,
      quantity: f.qty,
      previousQuantity: prevTotal,
      newQuantity: s.total,
      previousAvailable: prevAvail,
      newAvailable: s.total - s.reserved - s.damaged,
      referenceNumber: e.ref,
      createdBy: e.by,
      notes: e.notes,
    })
    byKey[f.key].lastUpdated = e.at
  }))

  return { inventory: records, receipts, transfers, adjustments, movements: movements.reverse() }
}

/* ------------------------------------------------------------------ */

export const PHASE1_PRODUCT_IDS = PRODUCT_ROWS.slice(0, 15).map((r) => r[0])

export const buildCatalogue = (now = dayjs()) => ({
  hubs: buildHubs(now),
  customers: buildCustomers(now),
  products: buildProducts(now),
})

/** Full master-data set. Orders are needed to seed reserved quantities. */
export const buildMasterData = (now, orders, catalogue = buildCatalogue(now)) => ({
  ...catalogue,
  ...buildInventory(now, catalogue.products, catalogue.hubs, orders),
})
