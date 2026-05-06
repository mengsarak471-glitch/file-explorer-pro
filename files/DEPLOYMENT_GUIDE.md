# File Explorer Pro - Deployment Guide

## 🚀 Deploying to Render

### Step 1: Prepare Your Repository
1. Push your code to GitHub
2. Make sure `.env` is in `.gitignore` (it should be by default)

### Step 2: Create MongoDB Atlas Database
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create a database user with username/password
4. Whitelist IP: `0.0.0.0/0` (allows all IPs)
5. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/fileexplorer?retryWrites=true&w=majority
   ```

### Step 3: Deploy to Render
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: file-explorer-pro
   - **Region**: Singapore (or closest to you)
   - **Branch**: main
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

### Step 4: Set Environment Variables in Render
Add these environment variables in Render Dashboard:

| Variable | Value | Description |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Production mode |
| `PORT` | `5000` | Server port |
| `MONGO_URI` | Your MongoDB connection string | From MongoDB Atlas |
| `CLIENT_URL` | Your Render URL (e.g., `https://file-explorer-pro.onrender.com`) | Your production domain |
| `CLOUDINARY_CLOUD_NAME` | `debxadxsr` | Your Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | `786599253482319` | Your Cloudinary API key |
| `CLOUDINARY_API_SECRET` | `4ZDG7pboBDuMvQ53SOYkBuJ36cI` | Your Cloudinary API secret |
| `JWT_SECRET` | Generate a random string | Secret for JWT tokens |

### Step 5: Deploy
1. Click "Create Web Service"
2. Wait for deployment to complete (2-3 minutes)
3. Your app will be live at: `https://file-explorer-pro.onrender.com`

---

## 🌐 Deploying to Vercel

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Deploy
```bash
cd files
vercel
```

### Step 3: Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add the same variables as above.

---

## 🔧 Environment Variables Reference

### Required Variables:
- `MONGO_URI` - MongoDB connection string
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `JWT_SECRET` - Secret for JWT token signing

### Optional Variables:
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CLIENT_URL` - Frontend URL for CORS

---

## ✅ Post-Deployment Checklist

1. **Test the live URL** - Ensure the app loads correctly
2. **Test login** - Create a test user and verify authentication
3. **Test file upload** - Upload a file to verify Cloudinary integration
4. **Test file operations** - Create folders, rename, delete items
5. **Check CORS** - Verify no CORS errors in browser console
6. **Monitor logs** - Check Render/Vercel logs for any errors

---

## 🐛 Common Issues & Solutions

### Issue: MongoDB Connection Failed
**Solution**: 
- Verify MONGO_URI is correct
- Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Ensure database user has correct permissions

### Issue: CORS Errors
**Solution**:
- Set CLIENT_URL to your production domain
- Ensure it matches exactly (no trailing slashes)
- Check browser console for specific CORS errors

### Issue: File Upload Fails
**Solution**:
- Verify Cloudinary credentials are correct
- Check Cloudinary account has upload permissions
- Ensure file size is under 50MB limit

### Issue: 500 Internal Server Error
**Solution**:
- Check Render/Vercel logs
- Verify all environment variables are set
- Ensure MongoDB is accessible from the server

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
