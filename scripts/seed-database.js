/**
 * JavaScript version of seed script (no TypeScript compilation needed)
 * Run with: node scripts/seed-database.js
 * Make sure to set MONGODB_URI in .env.local or environment
 *
 * To load .env.local, you can use: node -r dotenv/config scripts/seed-database.js
 * Or set MONGODB_URI as environment variable: MONGODB_URI=... node scripts/seed-database.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Try to load .env or .env.local manually
let MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  try {
    // Try .env first, then .env.local
    const envFiles = ['.env', '.env.local'];
    for (const envFile of envFiles) {
      const envPath = path.join(process.cwd(), envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        // Match MONGODB_URI=value (handles quoted and unquoted values)
        const match = envContent.match(/MONGODB_URI\s*=\s*(.+?)(?:\s*$|\s*#)/m);
        if (match) {
          let value = match[1].trim();
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) ||
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          MONGODB_URI = value;
          console.log(`📄 Found MONGODB_URI in ${envFile}`);
          break;
        }
      }
    }
  } catch (e) {
    console.error('⚠️  Error reading .env file:', e.message);
  }
}

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not found in environment or .env files, using default');
  MONGODB_URI = 'mongodb://localhost:27017/wholesale_pos';
}

// Define schemas inline
const SuperCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameMr: { type: String },
  icon: { type: String, required: true },
  image: { type: String },
}, { timestamps: true });

const SubCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameMr: { type: String },
  icon: { type: String, required: true },
  image: { type: String },
  superCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SuperCategory', required: true },
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameMr: { type: String },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  unit: { type: String, required: true },
  image: { type: String },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true },
  hamaliValue: { type: Number, required: true, default: 0 },
}, { timestamps: true });

const CustomerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
}, { timestamps: true });

const CounterSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['pos', 'admin'], default: 'pos', required: true },
}, { timestamps: true });

const SuperCategory = mongoose.models.SuperCategory || mongoose.model('SuperCategory', SuperCategorySchema);
const SubCategory = mongoose.models.SubCategory || mongoose.model('SubCategory', SubCategorySchema);
const Product = mongoose.models.Product || mongoose.model('Product', ProductSchema);
const Customer = mongoose.models.Customer || mongoose.model('Customer', CustomerSchema);
const Supplier = mongoose.models.Supplier || mongoose.model('Supplier', SupplierSchema);
const Counter = mongoose.models.Counter || mongoose.model('Counter', CounterSchema);
const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function seedDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/\/\/.*@/, '//***@')); // Hide credentials
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      SuperCategory.deleteMany({}),
      SubCategory.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Counter.deleteMany({}),
      User.deleteMany({}),
    ]);
    console.log('✅ Cleared existing data');

    // Create Super Categories
    console.log('📦 Creating super categories...');
    let electronics, groceries, textiles, hardware, stationery, homeAppliances;
    try {
      electronics = await SuperCategory.create({ name: 'Electronics', nameMr: 'इलेक्ट्रॉनिक्स', icon: '📱' });
      groceries = await SuperCategory.create({ name: 'Groceries & Food Items', nameMr: 'किराणा आणि अन्नपदार्थ', icon: '🛒' });
      textiles = await SuperCategory.create({ name: 'Textiles & Clothing', nameMr: 'टेक्सटाईल आणि कपडे', icon: '👕' });
      hardware = await SuperCategory.create({ name: 'Hardware & Tools', nameMr: 'हार्डवेअर आणि टूल्स', icon: '🔧' });
      stationery = await SuperCategory.create({ name: 'Stationery & Office Supplies', nameMr: 'स्टेशनरी आणि ऑफिस सप्लाय', icon: '📝' });
      homeAppliances = await SuperCategory.create({ name: 'Home Appliances', nameMr: 'घरगुती उपकरणे', icon: '🏠' });
      console.log('✅ Created super categories');
    } catch (error) {
      console.error('❌ Error creating super categories:', error.message);
      throw error;
    }

    // Create Sub Categories
    console.log('📦 Creating sub categories...');
    let mobilePhones, laptops, accessories, tv, pulses, spices, oil, snacks, fabric, readyMade, tools, electrical, books, office, kitchen, cleaning;
    try {
      mobilePhones = await SubCategory.create({ name: 'Mobile Phones', nameMr: 'मोबाईल फोन', icon: '📱', superCategoryId: electronics._id });
      laptops = await SubCategory.create({ name: 'Laptops & Computers', nameMr: 'लॅपटॉप आणि संगणक', icon: '💻', superCategoryId: electronics._id });
      accessories = await SubCategory.create({ name: 'Accessories', nameMr: 'अॅक्सेसरीज', icon: '🎧', superCategoryId: electronics._id });
      tv = await SubCategory.create({ name: 'TV & Audio', nameMr: 'टीव्ही आणि ऑडिオ', icon: '📺', superCategoryId: electronics._id });
      pulses = await SubCategory.create({ name: 'Pulses & Grains', nameMr: 'डाळी आणि कडधान्ये', icon: '🌾', superCategoryId: groceries._id });
      spices = await SubCategory.create({ name: 'Spices & Masalas', nameMr: 'मसाले', icon: '🌶️', superCategoryId: groceries._id });
      oil = await SubCategory.create({ name: 'Oil & Ghee', nameMr: 'तेल आणि तूप', icon: '🫒', superCategoryId: groceries._id });
      snacks = await SubCategory.create({ name: 'Snacks & Namkeen', nameMr: 'स्नॅक्स आणि नमकीन', icon: '🍿', superCategoryId: groceries._id });
      fabric = await SubCategory.create({ name: 'Fabric & Cloth', nameMr: 'कापड', icon: '🧵', superCategoryId: textiles._id });
      readyMade = await SubCategory.create({ name: 'Ready Made Garments', nameMr: 'तयार कपडे', icon: '👔', superCategoryId: textiles._id });
      tools = await SubCategory.create({ name: 'Tools & Equipment', nameMr: 'साधने आणि उपकरणे', icon: '🔨', superCategoryId: hardware._id });
      electrical = await SubCategory.create({ name: 'Electrical Items', nameMr: 'इलेक्ट्रिक वस्तू', icon: '⚡', superCategoryId: hardware._id });
      books = await SubCategory.create({ name: 'Books & Notebooks', nameMr: 'पुस्तके आणि वह्या', icon: '📚', superCategoryId: stationery._id });
      office = await SubCategory.create({ name: 'Office Supplies', nameMr: 'ऑफिस साहित्य', icon: '📋', superCategoryId: stationery._id });
      kitchen = await SubCategory.create({ name: 'Kitchen Appliances', nameMr: 'स्वयंपाकघर उपकरणे', icon: '🍳', superCategoryId: homeAppliances._id });
      cleaning = await SubCategory.create({ name: 'Cleaning & Hygiene', nameMr: 'स्वच्छता आणि हायजीन', icon: '🧹', superCategoryId: homeAppliances._id });
      console.log('✅ Created sub categories');
    } catch (error) {
      console.error('❌ Error creating sub categories:', error.message);
      throw error;
    }

    // Create Products
    console.log('📦 Creating products...');
    try {
      const products = [
        // Electronics - Mobile Phones
        { name: 'Samsung Galaxy A54', nameMr: 'सॅमसंग गॅलेक्सी A54', price: 28999, stock: 25, unit: 'piece', subCategoryId: mobilePhones._id, hamaliValue: 0 },
        { name: 'Redmi Note 12', nameMr: 'रेडमी नोट 12', price: 14999, stock: 40, unit: 'piece', subCategoryId: mobilePhones._id, hamaliValue: 0 },
        { name: 'OnePlus Nord CE 3', nameMr: 'वनप्लस नॉर्ड CE 3', price: 22999, stock: 30, unit: 'piece', subCategoryId: mobilePhones._id, hamaliValue: 0 },
        // Laptops
        { name: 'HP Pavilion 15', nameMr: 'एचपी पॅव्हेलियन 15', price: 45999, stock: 15, unit: 'piece', subCategoryId: laptops._id, hamaliValue: 0 },
        { name: 'Lenovo IdeaPad 3', nameMr: 'लेनोव्हो आयडियापॅड 3', price: 34999, stock: 20, unit: 'piece', subCategoryId: laptops._id, hamaliValue: 0 },
        // Accessories
        { name: 'Mobile Phone Case', nameMr: 'मोबाईल फोन केस', price: 299, stock: 100, unit: 'piece', subCategoryId: accessories._id, hamaliValue: 0 },
        { name: 'USB Cable Type-C', nameMr: 'युएसबी केबल टाईप-सी', price: 199, stock: 150, unit: 'piece', subCategoryId: accessories._id, hamaliValue: 0 },
        // TV
        { name: 'Samsung 43 inch Smart TV', nameMr: 'सॅमसंग ४३ इंच स्मार्ट टीव्ही', price: 32999, stock: 12, unit: 'piece', subCategoryId: tv._id, hamaliValue: 0 },
        // Pulses
        { name: 'Toor Dal (Arhar)', nameMr: 'तूर डाळ (अरहर)', price: 140, stock: 500, unit: 'kg', subCategoryId: pulses._id, hamaliValue: 2 },
        { name: 'Moong Dal', nameMr: 'मूग डाळ', price: 120, stock: 400, unit: 'kg', subCategoryId: pulses._id, hamaliValue: 2 },
        { name: 'Basmati Rice', nameMr: 'बासमती तांदूळ', price: 85, stock: 1000, unit: 'kg', subCategoryId: pulses._id, hamaliValue: 3 },
        { name: 'Wheat Flour (Atta)', nameMr: 'गहू पीठ (आटा)', price: 35, stock: 800, unit: 'kg', subCategoryId: pulses._id, hamaliValue: 2 },
        // Spices
        { name: 'Turmeric Powder (Haldi)', nameMr: 'हळद पावडर (हळदी)', price: 180, stock: 200, unit: 'kg', subCategoryId: spices._id, hamaliValue: 1 },
        { name: 'Red Chili Powder', nameMr: 'लाल तिखट', price: 220, stock: 150, unit: 'kg', subCategoryId: spices._id, hamaliValue: 1 },
        { name: 'Garam Masala', nameMr: 'गरम मसाला', price: 350, stock: 100, unit: 'kg', subCategoryId: spices._id, hamaliValue: 1 },
        { name: 'Cumin Seeds (Jeera)', nameMr: 'जिरे (जीरा)', price: 450, stock: 80, unit: 'kg', subCategoryId: spices._id, hamaliValue: 1 },
        // Oil
        { name: 'Sunflower Oil (1L)', nameMr: 'सूर्यफूल तेल (१ लीटर)', price: 145, stock: 300, unit: 'piece', subCategoryId: oil._id, hamaliValue: 1 },
        { name: 'Mustard Oil (1L)', nameMr: 'मोहरीचे तेल (१ लीटर)', price: 165, stock: 250, unit: 'piece', subCategoryId: oil._id, hamaliValue: 1 },
        { name: 'Desi Ghee (1kg)', nameMr: 'देशी तूप (१ किलो)', price: 550, stock: 100, unit: 'piece', subCategoryId: oil._id, hamaliValue: 2 },
        // Snacks
        { name: 'Kurkure (50g)', nameMr: 'कुरकुरे (५० ग्रॅम)', price: 10, stock: 500, unit: 'piece', subCategoryId: snacks._id, hamaliValue: 0 },
        { name: 'Haldiram Namkeen (200g)', nameMr: 'हल्दीराम नमकीन (२०० ग्रॅम)', price: 45, stock: 400, unit: 'piece', subCategoryId: snacks._id, hamaliValue: 0 },
        // Fabric
        { name: 'Cotton Fabric (Meter)', nameMr: 'सुती कापड (मीटर)', price: 120, stock: 1000, unit: 'meter', subCategoryId: fabric._id, hamaliValue: 1 },
        { name: 'Silk Fabric (Meter)', nameMr: 'रेशमी कापड (मीटर)', price: 850, stock: 200, unit: 'meter', subCategoryId: fabric._id, hamaliValue: 2 },
        // Ready Made
        { name: "Men's Shirt", nameMr: "पुरुषांचा शर्ट", price: 599, stock: 150, unit: 'piece', subCategoryId: readyMade._id, hamaliValue: 0 },
        { name: "Ladies Kurta", nameMr: "महिलांचा कुर्ता", price: 799, stock: 120, unit: 'piece', subCategoryId: readyMade._id, hamaliValue: 0 },
        // Tools
        { name: 'Hammer', nameMr: 'हातोडी', price: 250, stock: 80, unit: 'piece', subCategoryId: tools._id, hamaliValue: 0 },
        { name: 'Screwdriver Set', nameMr: 'स्क्रू ड्रायव्हर सेट', price: 450, stock: 60, unit: 'piece', subCategoryId: tools._id, hamaliValue: 0 },
        // Electrical
        { name: 'LED Bulb 9W', nameMr: 'एलईडी बल्ब ९ वॉट', price: 85, stock: 200, unit: 'piece', subCategoryId: electrical._id, hamaliValue: 0 },
        { name: 'Switch Board', nameMr: 'स्वीच बोर्ड', price: 120, stock: 150, unit: 'piece', subCategoryId: electrical._id, hamaliValue: 0 },
        // Books
        { name: 'Class 10 NCERT Books Set', nameMr: 'इयत्ता १० वी एनसीईआरटी पुस्तक संच', price: 850, stock: 50, unit: 'set', subCategoryId: books._id, hamaliValue: 2 },
        { name: 'A4 Notebook (200 pages)', nameMr: 'A4 वही (२०० पाने)', price: 45, stock: 300, unit: 'piece', subCategoryId: books._id, hamaliValue: 0 },
        // Office
        { name: 'Blue Ink Pen (Pack of 10)', nameMr: 'निळी शाई पेन (१० चा पॅक)', price: 35, stock: 500, unit: 'pack', subCategoryId: office._id, hamaliValue: 0 },
        { name: 'A4 Paper Ream', nameMr: 'A4 पेपर रिम', price: 280, stock: 100, unit: 'ream', subCategoryId: office._id, hamaliValue: 1 },
        // Kitchen
        { name: 'Pressure Cooker 5L', nameMr: 'प्रेशर कुकर ५ लीटर', price: 1299, stock: 40, unit: 'piece', subCategoryId: kitchen._id, hamaliValue: 2 },
        { name: 'Mixer Grinder', nameMr: 'मिक्सर ग्राइंडर', price: 2499, stock: 25, unit: 'piece', subCategoryId: kitchen._id, hamaliValue: 3 },
        // Cleaning
        { name: 'Detergent Powder (1kg)', nameMr: 'वॉशिंग पावडर (१ किलो)', price: 95, stock: 400, unit: 'piece', subCategoryId: cleaning._id, hamaliValue: 1 },
        { name: 'Toilet Cleaner (500ml)', nameMr: 'टॉयलेट क्लिनर (५०० मिली)', price: 65, stock: 300, unit: 'piece', subCategoryId: cleaning._id, hamaliValue: 0 },
      ];
      await Product.insertMany(products);
      console.log(`✅ Created ${products.length} products`);
    } catch (error) {
      console.error('❌ Error creating products:', error.message);
      throw error;
    }

    // Create Customers
    console.log('📦 Creating customers...');
    try {
      const customers = [
      { name: 'Rajesh Kumar', email: 'rajesh.kumar@email.com', phone: '9876543210', address: 'Shop No. 45, Market Street, Solapur, Maharashtra' },
      { name: 'Priya Sharma', email: 'priya.sharma@email.com', phone: '9876543211', address: 'G-12, Commercial Complex, Pune, Maharashtra' },
      { name: 'Amit Patel', email: 'amit.patel@email.com', phone: '9876543212', address: 'Wholesale Market, Surat, Gujarat' },
      { name: 'Sunita Devi', email: 'sunita.devi@email.com', phone: '9876543213', address: 'Main Bazaar, Delhi' },
      { name: 'Vikram Singh', email: 'vikram.singh@email.com', phone: '9876543214', address: 'Trade Center, Mumbai, Maharashtra' },
      { name: 'Anjali Reddy', email: 'anjali.reddy@email.com', phone: '9876543215', address: 'Business Hub, Hyderabad, Telangana' },
    ];
      await Customer.insertMany(customers);
      console.log(`✅ Created ${customers.length} customers`);
    } catch (error) {
      console.error('❌ Error creating customers:', error.message);
      throw error;
    }

    // Create Suppliers
    console.log('📦 Creating suppliers...');
    try {
      const suppliers = [
      { name: 'Electro Trade India', email: 'contact@electrotrade.in', phone: '9123456789', address: 'Electronics Market, Nehru Place, New Delhi' },
      { name: 'Shree Grocery Wholesale', email: 'info@shreegrocery.in', phone: '9123456790', address: 'Wholesale Market, APMC, Navi Mumbai' },
      { name: 'Textile Traders Pvt Ltd', email: 'sales@textiletraders.in', phone: '9123456791', address: 'Textile Market, Surat, Gujarat' },
      { name: 'Hardware Solutions', email: 'order@hardwaresolutions.in', phone: '9123456792', address: 'Hardware Market, Chandni Chowk, Delhi' },
      { name: 'Stationery Mart', email: 'info@stationerymart.in', phone: '9123456793', address: 'Stationery Market, Daryaganj, Delhi' },
      { name: 'Home Appliances Distributors', email: 'sales@homeappliances.in', phone: '9123456794', address: 'Appliance Market, Lamington Road, Mumbai' },
    ];
      await Supplier.insertMany(suppliers);
      console.log(`✅ Created ${suppliers.length} suppliers`);
    } catch (error) {
      console.error('❌ Error creating suppliers:', error.message);
      throw error;
    }

    // Create Counters
    console.log('📦 Creating counters...');
    try {
      await Counter.create({ name: 'estimateCounter', seq: 1 });
      await Counter.create({ name: 'poCounter', seq: 1 });
      console.log('✅ Created counters');
    } catch (error) {
      console.error('❌ Error creating counters:', error.message);
      throw error;
    }

    // Create Users
    console.log('📦 Creating users...');
    try {
      await User.create({
        username: 'admin',
        passwordHash: hashPassword('admin'),
        role: 'admin'
      });
      await User.create({
        username: 'pos',
        passwordHash: hashPassword('pos'),
        role: 'pos'
      });
      console.log('✅ Created default users (admin & pos)');
    } catch (error) {
      console.error('❌ Error creating users:', error.message);
      throw error;
    }

    // Get final counts
    const counts = {
      superCategories: await SuperCategory.countDocuments(),
      subCategories: await SubCategory.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments(),
      suppliers: await Supplier.countDocuments(),
      users: await User.countDocuments(),
    };

    console.log('\n🎉 Database seeded successfully with Indian market data!');
    console.log('📊 Final counts:', counts);
    console.log('\n✨ Created:');
    console.log(`   - ${counts.superCategories} Super Categories`);
    console.log(`   - ${counts.subCategories} Sub Categories`);
    console.log(`   - ${counts.products} Products (with Indian pricing in ₹)`);
    console.log(`   - ${counts.customers} Customers (with Indian names and addresses)`);
    console.log(`   - ${counts.suppliers} Suppliers (wholesale traders)`);
    console.log(`   - ${counts.users} Users (admin and pos)`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedDatabase();
