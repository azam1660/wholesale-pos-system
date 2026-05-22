# MongoDB Setup Guide

The application is now configured to use MongoDB instead of localStorage. You need to set up MongoDB before the application can work.

## Option 1: MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas is a free cloud-hosted MongoDB service. This is the easiest option.

### Steps:

1. **Create a MongoDB Atlas account** (if you don't have one):
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up for a free account

2. **Create a new cluster**:
   - After logging in, click "Build a Database"
   - Choose the FREE tier (M0)
   - Select a cloud provider and region
   - Click "Create"

3. **Set up database access**:
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and password (save these!)
   - Set user privileges to "Atlas admin" or "Read and write to any database"
   - Click "Add User"

4. **Set up network access**:
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (for development) or add your IP
   - Click "Confirm"

5. **Get your connection string**:
   - Go to "Database" in the left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (it looks like: `mongodb+srv://username:password@cluster.mongodb.net/`)
   - Replace `<password>` with your actual password
   - Add the database name at the end: `mongodb+srv://username:password@cluster.mongodb.net/wholesale_pos`

6. **Set the environment variable**:
   - Create a `.env.local` file in the root of your project (if it doesn't exist)
   - Add this line:
     ```
     MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/wholesale_pos
     ```
   - Replace `username`, `password`, and `cluster` with your actual values

7. **Restart your Next.js server**:
   ```bash
   # Stop the server (Ctrl+C) and restart
   npm run dev
   ```

## Option 2: Local MongoDB Installation

If you prefer to run MongoDB locally on your machine:

### macOS (using Homebrew):

```bash
# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb-community

# Verify it's running
brew services list
```

### Linux (Ubuntu/Debian):

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

### Windows:

1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Run the installer
3. MongoDB will start automatically as a service

### Set the environment variable:

Create a `.env.local` file in the root of your project:

```
MONGODB_URI=mongodb://localhost:27017/wholesale_pos
```

## Verify Connection

After setting up MongoDB:

1. Restart your Next.js development server
2. Check the terminal - you should see: `✅ MongoDB connected successfully`
3. Navigate to http://localhost:3000/seed to migrate your localStorage data
4. The API endpoints should now work without 500 errors

## Troubleshooting

### Error: "MongoDB connection failed"

- **Check if MongoDB is running**:
  - For local: `brew services list` (macOS) or `sudo systemctl status mongod` (Linux)
  - For Atlas: Check your cluster status in the Atlas dashboard

- **Check your connection string**:
  - Make sure `.env.local` exists in the project root
  - Verify the MONGODB_URI is correct
  - For Atlas: Ensure password is URL-encoded (special characters need encoding)

- **Check network access**:
  - For Atlas: Make sure your IP is whitelisted
  - For local: Ensure MongoDB is listening on `localhost:27017`

### Error: "Authentication failed"

- Verify your username and password are correct
- For Atlas: Make sure you replaced `<password>` in the connection string
- Check that the database user has proper permissions

### Still having issues?

Check the server terminal logs for detailed error messages. The improved error handling will show you exactly what's wrong.
