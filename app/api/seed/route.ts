import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import { SuperCategory, SubCategory } from "@/models/Category";
import { Product } from "@/models/Product";
import { Customer, Supplier } from "@/models/People";
import { Sale } from "@/models/Sale";
import { PurchaseOrder } from "@/models/PurchaseOrder";
import { InventoryItem, StockTransaction, TransactionBatch } from "@/models/Inventory";
import { Counter } from "@/models/Counter";
import { User } from "@/models/User";
import { hashPassword } from "@/lib/auth-utils";

/**
 * Seed endpoint that migrates localStorage data to MongoDB
 * This endpoint reads data from the request body (which should contain localStorage data)
 * and migrates it to MongoDB, similar to the /api/migrate endpoint
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    await dbConnect();

    // Mapping old IDs to new MongoDB ObjectIds to maintain relationships
    const idMap: Record<string, any> = {};

    // Clear existing data if requested
    if (data.clearExisting) {
      await Promise.all([
        SuperCategory.deleteMany({}),
        SubCategory.deleteMany({}),
        Product.deleteMany({}),
        Customer.deleteMany({}),
        Supplier.deleteMany({}),
        Sale.deleteMany({}),
        PurchaseOrder.deleteMany({}),
        InventoryItem.deleteMany({}),
        StockTransaction.deleteMany({}),
        TransactionBatch.deleteMany({}),
        Counter.deleteMany({}),
        User.deleteMany({}),
      ]);
    }

    if (data.superCategories && Array.isArray(data.superCategories)) {
      for (const cat of data.superCategories) {
        // Skip if already exists (by name)
        const existing = await SuperCategory.findOne({ name: cat.name });
        if (!existing) {
          const newCat = await SuperCategory.create({
            name: cat.name,
            nameMr: cat.nameMr,
            icon: cat.icon,
            image: cat.image,
          });
          idMap[cat.id] = newCat._id;
        } else {
          idMap[cat.id] = existing._id;
        }
      }
    }

    if (data.subCategories && Array.isArray(data.subCategories)) {
      for (const sub of data.subCategories) {
        const existing = await SubCategory.findOne({ name: sub.name, superCategoryId: idMap[sub.superCategoryId] });
        if (!existing) {
          const newSub = await SubCategory.create({
            name: sub.name,
            nameMr: sub.nameMr,
            icon: sub.icon,
            image: sub.image,
            superCategoryId: idMap[sub.superCategoryId],
          });
          idMap[sub.id] = newSub._id;
        } else {
          idMap[sub.id] = existing._id;
        }
      }
    }

    if (data.products && Array.isArray(data.products)) {
      for (const prod of data.products) {
        const existing = await Product.findOne({ name: prod.name, subCategoryId: idMap[prod.subCategoryId] });
        if (!existing) {
          const newProd = await Product.create({
            name: prod.name,
            nameMr: prod.nameMr,
            price: prod.price,
            stock: prod.stock,
            unit: prod.unit,
            image: prod.image,
            subCategoryId: idMap[prod.subCategoryId],
            hamaliValue: prod.hamaliValue || 0,
          });
          idMap[prod.id] = newProd._id;
        } else {
          idMap[prod.id] = existing._id;
        }
      }
    }

    if (data.customers && Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        const existing = await Customer.findOne({ phone: cust.phone });
        if (!existing) {
          const newCust = await Customer.create({
            name: cust.name,
            email: cust.email,
            phone: cust.phone,
            address: cust.address,
          });
          idMap[cust.id] = newCust._id;
        } else {
          idMap[cust.id] = existing._id;
        }
      }
    }

    if (data.suppliers && Array.isArray(data.suppliers)) {
      for (const supp of data.suppliers) {
        const existing = await Supplier.findOne({ phone: supp.phone });
        if (!existing) {
          const newSupp = await Supplier.create({
            name: supp.name,
            email: supp.email,
            phone: supp.phone,
            address: supp.address,
          });
          idMap[supp.id] = newSupp._id;
        } else {
          idMap[supp.id] = existing._id;
        }
      }
    }

    // Sales and Purchase Orders might need more complex mapping for items
    if (data.sales && Array.isArray(data.sales)) {
      for (const sale of data.sales) {
        // Check if sale already exists by estimateNumber
        const existing = await Sale.findOne({ estimateNumber: sale.estimateNumber });
        if (!existing) {
          const items = sale.items.map((item: any) => ({
            productId: idMap[item.productId] || item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
            unit: item.unit,
            subCategoryId: idMap[item.subCategoryId],
            subCategoryName: item.subCategoryName,
            superCategoryId: idMap[item.superCategoryId],
            superCategoryName: item.superCategoryName,
          }));

          await Sale.create({
            estimateNumber: sale.estimateNumber,
            date: sale.date,
            timestamp: sale.timestamp,
            customerId: idMap[sale.customerId],
            customerName: sale.customerName,
            customerPhone: sale.customerPhone,
            isCashSale: sale.isCashSale,
            items,
            subtotal: sale.subtotal,
            hamaliCharges: sale.hamaliCharges || 0,
            total: sale.total,
            paymentMethod: sale.paymentMethod || "cash",
            reference: sale.reference,
          });
        }
      }
    }

    if (data.purchaseOrders && Array.isArray(data.purchaseOrders)) {
      for (const po of data.purchaseOrders) {
        const existing = await PurchaseOrder.findOne({ orderNumber: po.orderNumber });
        if (!existing) {
          const items = po.items.map((item: any) => ({
            productId: idMap[item.id] || idMap[item.productId] || item.productId,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          }));

          await PurchaseOrder.create({
            orderNumber: po.orderNumber,
            date: po.date,
            supplierId: idMap[po.supplierId],
            supplierName: po.supplierName,
            supplierPhone: po.supplierPhone,
            isCashPurchase: po.isCashPurchase,
            items,
            subtotal: po.subtotal,
            total: po.total,
            status: po.status || "pending",
            reference: po.reference,
            notes: po.notes,
          });
        }
      }
    }

    if (data.inventory_items && Array.isArray(data.inventory_items)) {
      for (const item of data.inventory_items) {
        const productId = idMap[item.productId] || item.productId;
        const existing = await InventoryItem.findOne({ productId });
        if (!existing) {
          await InventoryItem.create({
            productId,
            productName: item.productName,
            category: item.category,
            unit: item.unit,
            openingStock: item.openingStock || 0,
            purchases: item.purchases || 0,
            sales: item.sales || 0,
            adjustments: item.adjustments || 0,
            closingStock: item.closingStock || 0,
            reorderLevel: item.reorderLevel || 10,
            notes: item.notes,
          });
        }
      }
    }

    if (data.stock_transactions && Array.isArray(data.stock_transactions)) {
      for (const t of data.stock_transactions) {
        const existing = await StockTransaction.findOne({ transactionNumber: t.transactionNumber });
        if (!existing) {
          await StockTransaction.create({
            transactionNumber: t.transactionNumber,
            productId: idMap[t.productId] || t.productId,
            productName: t.productName,
            type: t.type,
            quantity: t.quantity,
            date: t.date,
            reference: t.reference,
            notes: t.notes,
            batchId: idMap[t.batchId] || t.batchId,
          });
        }
      }
    }

    if (data.transaction_batches && Array.isArray(data.transaction_batches)) {
      for (const b of data.transaction_batches) {
        const existing = await TransactionBatch.findOne({ batchNumber: b.batchNumber });
        if (!existing) {
          const items = b.items.map((item: any) => ({
            productId: idMap[item.productId] || item.productId,
            productName: item.productName,
            quantity: item.quantity,
            unit: item.unit,
          }));

          const newBatch = await TransactionBatch.create({
            batchNumber: b.batchNumber,
            type: b.type,
            date: b.date,
            reference: b.reference,
            items,
            totalItems: b.totalItems,
            totalQuantity: b.totalQuantity,
            notes: b.notes,
          });
          idMap[b.id] = newBatch._id;
        }
      }
    }

    // Handle counters
    if (data.estimateCounter !== undefined) {
      await Counter.findOneAndUpdate(
        { name: "estimateCounter" },
        { seq: data.estimateCounter },
        { upsert: true }
      );
    }

    if (data.poCounter !== undefined) {
      await Counter.findOneAndUpdate(
        { name: "poCounter" },
        { seq: data.poCounter },
        { upsert: true }
      );
    }

    // Ensure default user accounts exist
    const adminUser = await User.findOne({ username: "admin" });
    if (!adminUser) {
      await User.create({
        username: "admin",
        passwordHash: hashPassword("admin"),
        role: "admin",
      });
    }

    const posUser = await User.findOne({ username: "pos" });
    if (!posUser) {
      await User.create({
        username: "pos",
        passwordHash: hashPassword("pos"),
        role: "pos",
      });
    }

    return NextResponse.json({
      success: true,
      message: "Data seeded successfully",
      counts: {
        superCategories: await SuperCategory.countDocuments(),
        subCategories: await SubCategory.countDocuments(),
        products: await Product.countDocuments(),
        customers: await Customer.countDocuments(),
        suppliers: await Supplier.countDocuments(),
        sales: await Sale.countDocuments(),
        purchaseOrders: await PurchaseOrder.countDocuments(),
        inventoryItems: await InventoryItem.countDocuments(),
        stockTransactions: await StockTransaction.countDocuments(),
        transactionBatches: await TransactionBatch.countDocuments(),
        users: await User.countDocuments(),
      }
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
