# How to Seed the Database

There are two ways to seed your MongoDB database:

## Option 1: Seed from localStorage (Recommended if you have existing data)

If you have data stored in localStorage from before the migration:

1. **Make sure MongoDB is running and connected**
   - Check your terminal for: `✅ MongoDB connected successfully`
   - If you see connection errors, see `MONGODB_SETUP.md`

2. **Open the seed page in your browser**:
   - Navigate to: `http://localhost:3000/seed`
   - Or visit `/seed` in your application

3. **Review the data**:
   - The page will show what data is found in localStorage
   - You'll see a list of all data types and their counts

4. **Click "Migrate to MongoDB"**:
   - The migration will start
   - Wait for the success message
   - You'll see the final database counts

5. **Verify the migration**:
   - Go back to your main application
   - All your data should now be loaded from MongoDB
   - The application will work normally

## Option 2: Seed with Sample Data (If localStorage is empty)

If you don't have localStorage data and want to start with sample data:

### Using the Seed Script:

1. **Run the seed script** (no additional dependencies needed):
   ```bash
   npm run seed
   ```

   Or directly:
   ```bash
   node scripts/seed-database.js
   ```

   **Note**: Make sure your `.env.local` file has `MONGODB_URI` set, or set it as an environment variable:
   ```bash
   MONGODB_URI=mongodb://localhost:27017/wholesale_pos node scripts/seed-database.js
   ```

3. **The script will**:
   - Connect to MongoDB
   - Clear existing data (optional)
   - Create sample:
     - 2 Super Categories (Electronics, Groceries)
     - 3 Sub Categories (Laptops, Phones, Fruits)
     - 3 Products (MacBook Pro, iPhone 15, Apple)
     - 2 Customers
     - 1 Supplier
     - Counters for estimates and purchase orders

## Option 3: Use the API directly

You can also seed the database by calling the API endpoint directly:

```bash
curl -X POST http://localhost:3000/api/seed \
  -H "Content-Type: application/json" \
  -d '{
    "superCategories": [...],
    "subCategories": [...],
    "products": [...],
    "customers": [...],
    "suppliers": [...],
    "estimateCounter": 1,
    "poCounter": 1
  }'
```

## Troubleshooting

### "No data found in localStorage"
- This means your browser's localStorage doesn't have the old data
- Use Option 2 to seed with sample data instead

### "MongoDB connection failed"
- Make sure MongoDB is running (see `MONGODB_SETUP.md`)
- Check your `.env.local` file has the correct `MONGODB_URI`

### "Failed to migrate data"
- Check the browser console for detailed error messages
- Verify MongoDB is accessible
- Check that all required fields are present in your data

## After Seeding

Once seeded, your application will:
- ✅ Load all data from MongoDB
- ✅ Save new data to MongoDB
- ✅ No longer use localStorage for data storage
- ✅ Work across multiple browser tabs/devices

You can verify by:
1. Adding a new product/customer
2. Refreshing the page
3. The data should persist (loaded from MongoDB)
