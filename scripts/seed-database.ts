/**
 * Script to seed the database with Indian market data
 * Suitable for Electronics, Wholesale shops, and Traders
 * Run with: npm run seed
 */

import dbConnect from "../lib/mongodb";
import { SuperCategory, SubCategory } from "../models/Category";
import { Product } from "../models/Product";
import { Customer, Supplier } from "../models/People";
import { Counter } from "../models/Counter";

async function seedDatabase() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await dbConnect();
    console.log("✅ Connected to MongoDB");

    // Clear existing data
    console.log("🧹 Clearing existing data...");
    await Promise.all([
      SuperCategory.deleteMany({}),
      SubCategory.deleteMany({}),
      Product.deleteMany({}),
      Customer.deleteMany({}),
      Supplier.deleteMany({}),
      Counter.deleteMany({}),
    ]);
    console.log("✅ Cleared existing data");

    // Create Super Categories for Indian Markets
    console.log("📦 Creating super categories...");
    const electronics = await SuperCategory.create({
      name: "Electronics",
      nameMr: "इलेक्ट्रॉनिक्स",
      icon: "📱",
    });
    const groceries = await SuperCategory.create({
      name: "Groceries & Food Items",
      nameMr: "किराणा आणि अन्नपदार्थ",
      icon: "🛒",
    });
    const textiles = await SuperCategory.create({
      name: "Textiles & Clothing",
      nameMr: "टेक्सटाईल आणि कपडे",
      icon: "👕",
    });
    const hardware = await SuperCategory.create({
      name: "Hardware & Tools",
      nameMr: "हार्डवेअर आणि टूल्स",
      icon: "🔧",
    });
    const stationery = await SuperCategory.create({
      name: "Stationery & Office Supplies",
      nameMr: "स्टेशनरी आणि ऑफिस सप्लाय",
      icon: "📝",
    });
    const homeAppliances = await SuperCategory.create({
      name: "Home Appliances",
      nameMr: "घरगुती उपकरणे",
      icon: "🏠",
    });
    console.log("✅ Created super categories");

    // Create Sub Categories - Electronics
    console.log("📦 Creating sub categories...");
    const mobilePhones = await SubCategory.create({
      name: "Mobile Phones",
      nameMr: "मोबाईल फोन",
      icon: "📱",
      superCategoryId: electronics._id,
    });
    const laptops = await SubCategory.create({
      name: "Laptops & Computers",
      nameMr: "लॅपटॉप आणि संगणक",
      icon: "💻",
      superCategoryId: electronics._id,
    });
    const accessories = await SubCategory.create({
      name: "Accessories",
      nameMr: "अॅक्सेसरीज",
      icon: "🎧",
      superCategoryId: electronics._id,
    });
    const tv = await SubCategory.create({
      name: "TV & Audio",
      nameMr: "टीव्ही आणि ऑडिओ",
      icon: "📺",
      superCategoryId: electronics._id,
    });

    // Groceries
    const pulses = await SubCategory.create({
      name: "Pulses & Grains",
      nameMr: "डाळी आणि कडधान्ये",
      icon: "🌾",
      superCategoryId: groceries._id,
    });
    const spices = await SubCategory.create({
      name: "Spices & Masalas",
      nameMr: "मसाले",
      icon: "🌶️",
      superCategoryId: groceries._id,
    });
    const oil = await SubCategory.create({
      name: "Oil & Ghee",
      nameMr: "तेल आणि तूप",
      icon: "🫒",
      superCategoryId: groceries._id,
    });
    const snacks = await SubCategory.create({
      name: "Snacks & Namkeen",
      nameMr: "स्नॅक्स आणि नमकीन",
      icon: "🍿",
      superCategoryId: groceries._id,
    });

    // Textiles
    const fabric = await SubCategory.create({
      name: "Fabric & Cloth",
      nameMr: "कापड",
      icon: "🧵",
      superCategoryId: textiles._id,
    });
    const readyMade = await SubCategory.create({
      name: "Ready Made Garments",
      nameMr: "तयार कपडे",
      icon: "👔",
      superCategoryId: textiles._id,
    });

    // Hardware
    const tools = await SubCategory.create({
      name: "Tools & Equipment",
      nameMr: "साधने आणि उपकरणे",
      icon: "🔨",
      superCategoryId: hardware._id,
    });
    const electrical = await SubCategory.create({
      name: "Electrical Items",
      nameMr: "इलेक्ट्रिक वस्तू",
      icon: "⚡",
      superCategoryId: hardware._id,
    });

    // Stationery
    const books = await SubCategory.create({
      name: "Books & Notebooks",
      nameMr: "पुस्तके आणि वह्या",
      icon: "📚",
      superCategoryId: stationery._id,
    });
    const office = await SubCategory.create({
      name: "Office Supplies",
      nameMr: "ऑफिस साहित्य",
      icon: "📋",
      superCategoryId: stationery._id,
    });

    // Home Appliances
    const kitchen = await SubCategory.create({
      name: "Kitchen Appliances",
      nameMr: "स्वयंपाकघर उपकरणे",
      icon: "🍳",
      superCategoryId: homeAppliances._id,
    });
    const cleaning = await SubCategory.create({
      name: "Cleaning & Hygiene",
      nameMr: "स्वच्छता आणि हायजीन",
      icon: "🧹",
      superCategoryId: homeAppliances._id,
    });
    console.log("✅ Created sub categories");

    // Create Products - Electronics
    console.log("📦 Creating products...");

    // Mobile Phones
    await Product.create({
      name: "Samsung Galaxy A54",
      nameMr: "सॅमसंग गॅलेक्सी A54",
      price: 28999,
      stock: 25,
      unit: "piece",
      subCategoryId: mobilePhones._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Redmi Note 12",
      nameMr: "रेडमी नोट 12",
      price: 14999,
      stock: 40,
      unit: "piece",
      subCategoryId: mobilePhones._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "OnePlus Nord CE 3",
      nameMr: "वनप्लस नॉर्ड CE 3",
      price: 22999,
      stock: 30,
      unit: "piece",
      subCategoryId: mobilePhones._id,
      hamaliValue: 0,
    });

    // Laptops
    await Product.create({
      name: "HP Pavilion 15",
      nameMr: "एचपी पॅव्हेलियन 15",
      price: 45999,
      stock: 15,
      unit: "piece",
      subCategoryId: laptops._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Lenovo IdeaPad 3",
      nameMr: "लेनोव्हो आयडियापॅड 3",
      price: 34999,
      stock: 20,
      unit: "piece",
      subCategoryId: laptops._id,
      hamaliValue: 0,
    });

    // Accessories
    await Product.create({
      name: "Mobile Phone Case",
      nameMr: "मोबाईल फोन केस",
      price: 299,
      stock: 100,
      unit: "piece",
      subCategoryId: accessories._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "USB Cable Type-C",
      nameMr: "युएसबी केबल टाईप-सी",
      price: 199,
      stock: 150,
      unit: "piece",
      subCategoryId: accessories._id,
      hamaliValue: 0,
    });

    // TV
    await Product.create({
      name: "Samsung 43 inch Smart TV",
      nameMr: "सॅमसंग ४३ इंच स्मार्ट टीव्ही",
      price: 32999,
      stock: 12,
      unit: "piece",
      subCategoryId: tv._id,
      hamaliValue: 0,
    });

    // Pulses & Grains
    await Product.create({
      name: "Toor Dal (Arhar)",
      nameMr: "तूर डाळ (अरहर)",
      price: 140,
      stock: 500,
      unit: "kg",
      subCategoryId: pulses._id,
      hamaliValue: 2,
    });
    await Product.create({
      name: "Moong Dal",
      nameMr: "मूग डाळ",
      price: 120,
      stock: 400,
      unit: "kg",
      subCategoryId: pulses._id,
      hamaliValue: 2,
    });
    await Product.create({
      name: "Basmati Rice",
      nameMr: "बासमती तांदूळ",
      price: 85,
      stock: 1000,
      unit: "kg",
      subCategoryId: pulses._id,
      hamaliValue: 3,
    });
    await Product.create({
      name: "Wheat Flour (Atta)",
      nameMr: "गहू पीठ (आटा)",
      price: 35,
      stock: 800,
      unit: "kg",
      subCategoryId: pulses._id,
      hamaliValue: 2,
    });

    // Spices
    await Product.create({
      name: "Turmeric Powder (Haldi)",
      nameMr: "हळद पावडर (हळदी)",
      price: 180,
      stock: 200,
      unit: "kg",
      subCategoryId: spices._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Red Chili Powder",
      nameMr: "लाल तिखट",
      price: 220,
      stock: 150,
      unit: "kg",
      subCategoryId: spices._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Garam Masala",
      nameMr: "गरम मसाला",
      price: 350,
      stock: 100,
      unit: "kg",
      subCategoryId: spices._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Cumin Seeds (Jeera)",
      nameMr: "जिरे (जीरा)",
      price: 450,
      stock: 80,
      unit: "kg",
      subCategoryId: spices._id,
      hamaliValue: 1,
    });

    // Oil & Ghee
    await Product.create({
      name: "Sunflower Oil (1L)",
      nameMr: "सूर्यफूल तेल (१ लीटर)",
      price: 145,
      stock: 300,
      unit: "piece",
      subCategoryId: oil._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Mustard Oil (1L)",
      nameMr: "मोहरीचे तेल (१ लीटर)",
      price: 165,
      stock: 250,
      unit: "piece",
      subCategoryId: oil._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Desi Ghee (1kg)",
      nameMr: "देशी तूप (१ किलो)",
      price: 550,
      stock: 100,
      unit: "piece",
      subCategoryId: oil._id,
      hamaliValue: 2,
    });

    // Snacks
    await Product.create({
      name: "Kurkure (50g)",
      nameMr: "कुरकुरे (५० ग्रॅम)",
      price: 10,
      stock: 500,
      unit: "piece",
      subCategoryId: snacks._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Haldiram Namkeen (200g)",
      nameMr: "हल्दीराम नमकीन (२०० ग्रॅम)",
      price: 45,
      stock: 400,
      unit: "piece",
      subCategoryId: snacks._id,
      hamaliValue: 0,
    });

    // Fabric
    await Product.create({
      name: "Cotton Fabric (Meter)",
      nameMr: "सुती कापड (मीटर)",
      price: 120,
      stock: 1000,
      unit: "meter",
      subCategoryId: fabric._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Silk Fabric (Meter)",
      nameMr: "रेशमी कापड (मीटर)",
      price: 850,
      stock: 200,
      unit: "meter",
      subCategoryId: fabric._id,
      hamaliValue: 2,
    });

    // Ready Made
    await Product.create({
      name: "Men's Shirt",
      nameMr: "पुरुषांचा शर्ट",
      price: 599,
      stock: 150,
      unit: "piece",
      subCategoryId: readyMade._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Ladies Kurta",
      nameMr: "महिलांचा कुर्ता",
      price: 799,
      stock: 120,
      unit: "piece",
      subCategoryId: readyMade._id,
      hamaliValue: 0,
    });

    // Tools
    await Product.create({
      name: "Hammer",
      nameMr: "हातोडी",
      price: 250,
      stock: 80,
      unit: "piece",
      subCategoryId: tools._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Screwdriver Set",
      nameMr: "स्क्रू ड्रायव्हर सेट",
      price: 450,
      stock: 60,
      unit: "piece",
      subCategoryId: tools._id,
      hamaliValue: 0,
    });

    // Electrical
    await Product.create({
      name: "LED Bulb 9W",
      nameMr: "एलईडी बल्ब ९ वॉट",
      price: 85,
      stock: 200,
      unit: "piece",
      subCategoryId: electrical._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "Switch Board",
      nameMr: "स्वीच बोर्ड",
      price: 120,
      stock: 150,
      unit: "piece",
      subCategoryId: electrical._id,
      hamaliValue: 0,
    });

    // Books
    await Product.create({
      name: "Class 10 NCERT Books Set",
      nameMr: "इयत्ता १० वी एनसीईआरटी पुस्तक संच",
      price: 850,
      stock: 50,
      unit: "set",
      subCategoryId: books._id,
      hamaliValue: 2,
    });
    await Product.create({
      name: "A4 Notebook (200 pages)",
      nameMr: "A4 वही (२०० पाने)",
      price: 45,
      stock: 300,
      unit: "piece",
      subCategoryId: books._id,
      hamaliValue: 0,
    });

    // Office Supplies
    await Product.create({
      name: "Blue Ink Pen (Pack of 10)",
      nameMr: "निळी शाई पेन (१० चा पॅक)",
      price: 35,
      stock: 500,
      unit: "pack",
      subCategoryId: office._id,
      hamaliValue: 0,
    });
    await Product.create({
      name: "A4 Paper Ream",
      nameMr: "A4 पेपर रिम",
      price: 280,
      stock: 100,
      unit: "ream",
      subCategoryId: office._id,
      hamaliValue: 1,
    });

    // Kitchen Appliances
    await Product.create({
      name: "Pressure Cooker 5L",
      nameMr: "प्रेशर कुकर ५ लीटर",
      price: 1299,
      stock: 40,
      unit: "piece",
      subCategoryId: kitchen._id,
      hamaliValue: 2,
    });
    await Product.create({
      name: "Mixer Grinder",
      nameMr: "मिक्सर ग्राइंडर",
      price: 2499,
      stock: 25,
      unit: "piece",
      subCategoryId: kitchen._id,
      hamaliValue: 3,
    });

    // Cleaning
    await Product.create({
      name: "Detergent Powder (1kg)",
      nameMr: "वॉशिंग पावडर (१ किलो)",
      price: 95,
      stock: 400,
      unit: "piece",
      subCategoryId: cleaning._id,
      hamaliValue: 1,
    });
    await Product.create({
      name: "Toilet Cleaner (500ml)",
      nameMr: "टॉयलेट क्लिनर (५०० मिली)",
      price: 65,
      stock: 300,
      unit: "piece",
      subCategoryId: cleaning._id,
      hamaliValue: 0,
    });

    console.log("✅ Created products");

    // Create Customers - Indian Names
    console.log("📦 Creating customers...");
    await Customer.create({
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "9876543210",
      address: "Shop No. 45, Market Street, Solapur, Maharashtra",
    });
    await Customer.create({
      name: "Priya Sharma",
      email: "priya.sharma@email.com",
      phone: "9876543211",
      address: "G-12, Commercial Complex, Pune, Maharashtra",
    });
    await Customer.create({
      name: "Amit Patel",
      email: "amit.patel@email.com",
      phone: "9876543212",
      address: "Wholesale Market, Surat, Gujarat",
    });
    await Customer.create({
      name: "Sunita Devi",
      email: "sunita.devi@email.com",
      phone: "9876543213",
      address: "Main Bazaar, Delhi",
    });
    await Customer.create({
      name: "Vikram Singh",
      email: "vikram.singh@email.com",
      phone: "9876543214",
      address: "Trade Center, Mumbai, Maharashtra",
    });
    await Customer.create({
      name: "Anjali Reddy",
      email: "anjali.reddy@email.com",
      phone: "9876543215",
      address: "Business Hub, Hyderabad, Telangana",
    });
    console.log("✅ Created customers");

    // Create Suppliers - Indian Names
    console.log("📦 Creating suppliers...");
    await Supplier.create({
      name: "Electro Trade India",
      email: "contact@electrotrade.in",
      phone: "9123456789",
      address: "Electronics Market, Nehru Place, New Delhi",
    });
    await Supplier.create({
      name: "Shree Grocery Wholesale",
      email: "info@shreegrocery.in",
      phone: "9123456790",
      address: "Wholesale Market, APMC, Navi Mumbai",
    });
    await Supplier.create({
      name: "Textile Traders Pvt Ltd",
      email: "sales@textiletraders.in",
      phone: "9123456791",
      address: "Textile Market, Surat, Gujarat",
    });
    await Supplier.create({
      name: "Hardware Solutions",
      email: "order@hardwaresolutions.in",
      phone: "9123456792",
      address: "Hardware Market, Chandni Chowk, Delhi",
    });
    await Supplier.create({
      name: "Stationery Mart",
      email: "info@stationerymart.in",
      phone: "9123456793",
      address: "Stationery Market, Daryaganj, Delhi",
    });
    await Supplier.create({
      name: "Home Appliances Distributors",
      email: "sales@homeappliances.in",
      phone: "9123456794",
      address: "Appliance Market, Lamington Road, Mumbai",
    });
    console.log("✅ Created suppliers");

    // Create Counters
    console.log("📦 Creating counters...");
    await Counter.create({
      name: "estimateCounter",
      seq: 1,
    });
    await Counter.create({
      name: "poCounter",
      seq: 1,
    });
    console.log("✅ Created counters");

    // Get final counts
    const counts = {
      superCategories: await SuperCategory.countDocuments(),
      subCategories: await SubCategory.countDocuments(),
      products: await Product.countDocuments(),
      customers: await Customer.countDocuments(),
      suppliers: await Supplier.countDocuments(),
    };

    console.log("\n🎉 Database seeded successfully with Indian market data!");
    console.log("📊 Final counts:", counts);
    console.log("\n✨ Created:");
    console.log(`   - ${counts.superCategories} Super Categories (Electronics, Groceries, Textiles, Hardware, Stationery, Home Appliances)`);
    console.log(`   - ${counts.subCategories} Sub Categories`);
    console.log(`   - ${counts.products} Products (with Indian pricing in ₹)`);
    console.log(`   - ${counts.customers} Customers (with Indian names and addresses)`);
    console.log(`   - ${counts.suppliers} Suppliers (wholesale traders)`);
    process.exit(0);
  } catch (error: any) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
