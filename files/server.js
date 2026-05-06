const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const bcrypt     = require('bcryptjs');
const jwt        = require('jsonwebtoken');
const { Readable } = require('stream');
require('dotenv').config();

const app = express();

// ════════════════════════════════════════════════════════════════════
//  CORS
//  🔧 FIX: បន្ថែម VSCode Live Server (5500) និង origin ច្បាស់លាស់
// ════════════════════════════════════════════════════════════════════
app.use(cors({
  origin: (origin, cb) => {
    // Allow Postman / curl (no origin) and all localhost ports
    if (
      !origin ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin.startsWith('file://')
    ) return cb(null, true);

    // Production domains from .env  e.g. CLIENT_URL=https://myapp.com,https://myapp.onrender.com
    const allowed = (process.env.CLIENT_URL || '')
      .split(',').map(s => s.trim()).filter(Boolean);
    if (allowed.includes(origin)) return cb(null, true);

    // In production, allow same-origin requests
    if (process.env.NODE_ENV === 'production' && origin === process.env.CLIENT_URL) {
      return cb(null, true);
    }

    cb(new Error(`CORS: origin "${origin}" not allowed`), false);
  },
  credentials: true,
}));

app.use(express.json());

// ════════════════════════════════════════════════════════════════════
//  CONFIG
// ════════════════════════════════════════════════════════════════════
const JWT_SECRET = process.env.JWT_SECRET || 'file-explorer-secret-key-2024';

// ── MongoDB ──────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fileexplorer', { family: 4 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ════════════════════════════════════════════════════════════════════
//  SCHEMAS
// ════════════════════════════════════════════════════════════════════

// ── User Schema ──────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username:     { type: String, required: true, unique: true, trim: true },
  password:     { type: String, required: true, select: false },
  displayName:  { type: String, default: '' },
  role:         { type: String, enum: ['admin', 'user'], default: 'user' },
  language:     { type: String, enum: ['en', 'kh'], default: 'en' },
  theme:        { type: String, enum: ['dark', 'light'], default: 'dark' },
  avatar:       { type: String, default: '' },
  avatarColor:  { type: String, default: '#1f6feb' },
  isActive:     { type: Boolean, default: true },
  rootFolderId: { type: String },
  lastLoginAt:  { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.matchPassword = function (pw) {
  return bcrypt.compare(pw, this.password);
};

const User = mongoose.model('User', userSchema);

// ── Edit Request Schema ──────────────────────────────────────────────
const editRequestSchema = new mongoose.Schema({
  fromUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requestType: { type: String, enum: ['change_username', 'change_password', 'change_displayname'], required: true },
  newValue:    { type: String, required: true },
  reason:      { type: String, default: '' },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  reviewedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewNote:  { type: String, default: '' },
  reviewedAt:  { type: Date },
}, { timestamps: true });

const EditRequest = mongoose.model('EditRequest', editRequestSchema);

// ── Item Schema ──────────────────────────────────────────────────────
const itemSchema = new mongoose.Schema({
  _id:        { type: String },
  name:       { type: String, required: true, trim: true },
  type:       { type: String, enum: ['folder', 'file'], required: true },
  parentId:   { type: String, default: null },
  ownerId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  extension:  { type: String },
  size:       { type: Number, default: 0 },
  cloudUrl:   { type: String },
  publicId:   { type: String },
  mimeType:   { type: String },
  modifiedAt: { type: Date, default: Date.now },
}, { timestamps: true, _id: false });

itemSchema.index({ parentId: 1, ownerId: 1 });
const Item = mongoose.model('Item', itemSchema);

// ════════════════════════════════════════════════════════════════════
//  MIDDLEWARE
// ════════════════════════════════════════════════════════════════════
const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive)
      return res.status(401).json({ success: false, error: 'User not found or deactivated' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin')
    return res.status(403).json({ success: false, error: 'Admin access required' });
  next();
};

// ════════════════════════════════════════════════════════════════════
//  HELPER: upload buffer → Cloudinary
// ════════════════════════════════════════════════════════════════════
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },   // 50 MB
});

function uploadToCloudinary(buffer, filename) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `file-explorer/${Date.now()}-${filename}`,
        use_filename: true,
        unique_filename: false,
      },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    Readable.from(buffer).pipe(stream);
  });
}

// ════════════════════════════════════════════════════════════════════
//  HELPER: create user + root folder (used by register & seed)
//  🔧 FIX: បង្កើត User ជាមុន ហើយទើបប្រើ user._id ជា ownerId ត្រឹមត្រូវ
// ════════════════════════════════════════════════════════════════════
async function createUserWithDrive(userData, defaultFolders = ['Desktop', 'Documents', 'Downloads', 'Pictures']) {
  const { username, password, displayName, role, avatarColor } = userData;

  // 1. Create user first so we have a real _id
  const user = await User.create({
    username,
    password,
    displayName: displayName || username,
    role: role || 'user',
    ...(avatarColor ? { avatarColor } : {}),
    rootFolderId: `root_${username}_${Date.now()}`,  // set now so it's in the doc
  });

  // 2. Create root folder with correct ownerId
  await Item.create({
    _id: user.rootFolderId,
    name: `${user.displayName}'s Drive`,
    type: 'folder',
    parentId: null,
    ownerId: user._id,
  });

  // 3. Create default sub-folders
  const folderMap = {};
  for (const name of defaultFolders) {
    const f = await Item.create({
      _id: `${username}_${name.toLowerCase()}_${Date.now()}`,
      name,
      type: 'folder',
      parentId: user.rootFolderId,
      ownerId: user._id,
    });
    folderMap[name] = f._id;
  }

  return { user, folderMap };
}

// ════════════════════════════════════════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════════════════════════════════════════

// POST /api/auth/register  (admin only)
app.post('/api/auth/register', protect, adminOnly, async (req, res) => {
  try {
    const { username, password, displayName, role } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'username and password required' });

    const { user } = await createUserWithDrive({ username, password, displayName, role });

    res.status(201).json({
      success: true,
      data: { _id: user._id, username: user.username, role: user.role },
    });
  } catch (err) {
    if (err.code === 11000)
      return res.status(400).json({ success: false, error: 'Username already taken' });
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ success: false, error: 'username and password required' });

    const user = await User.findOne({ username }).select('+password');
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.isActive)
      return res.status(401).json({ success: false, error: 'Account deactivated' });

    user.lastLoginAt = new Date();
    await user.save({ validateBeforeSave: false });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      data: {
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        language: user.language,
        theme: user.theme,
        avatar: user.avatar,
        avatarColor: user.avatarColor,
        rootFolderId: user.rootFolderId,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', protect, async (req, res) => {
  res.json({ success: true, data: req.user });
});

// PATCH /api/auth/preferences
app.patch('/api/auth/preferences', protect, async (req, res) => {
  try {
    const { language, theme, displayName, avatar, avatarColor } = req.body;
    const updates = {};
    if (language !== undefined)    updates.language    = language;
    if (theme !== undefined)       updates.theme       = theme;
    if (displayName !== undefined) updates.displayName = displayName;
    if (avatar !== undefined)      updates.avatar      = avatar;
    if (avatarColor !== undefined) updates.avatarColor = avatarColor;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password');
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  EDIT REQUEST ROUTES
//  🔧 FIX: /requests/my ត្រូវដាក់ BEFORE /requests/:id
// ════════════════════════════════════════════════════════════════════

// POST /api/requests  — user submits a request
app.post('/api/requests', protect, async (req, res) => {
  try {
    const { requestType, newValue, reason } = req.body;
    if (!requestType || !newValue)
      return res.status(400).json({ success: false, error: 'requestType and newValue required' });

    // Hash password before storing
    const storedValue = requestType === 'change_password'
      ? await bcrypt.hash(newValue, 12)
      : newValue;

    const request = await EditRequest.create({
      fromUser: req.user._id,
      requestType,
      newValue: storedValue,
      reason: reason || '',
    });

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/requests/my  — user sees own requests  ← MUST be before /:id
app.get('/api/requests/my', protect, async (req, res) => {
  try {
    const reqs = await EditRequest.find({ fromUser: req.user._id }).sort('-createdAt');
    res.json({ success: true, data: reqs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/requests  — admin sees all pending
app.get('/api/requests', protect, adminOnly, async (req, res) => {
  try {
    const reqs = await EditRequest.find({ status: 'pending' })
      .populate('fromUser', 'username displayName')
      .sort('-createdAt');
    res.json({ success: true, data: reqs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/requests/:id  — admin approves/rejects
app.patch('/api/requests/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, error: 'status must be approved or rejected' });

    const request = await EditRequest.findById(req.params.id).populate('fromUser');
    if (!request) return res.status(404).json({ success: false, error: 'Request not found' });
    if (request.status !== 'pending')
      return res.status(400).json({ success: false, error: 'Request already reviewed' });

    request.status     = status;
    request.reviewedBy = req.user._id;
    request.reviewNote = reviewNote || '';
    request.reviewedAt = new Date();
    await request.save();

    // Apply changes if approved
    if (status === 'approved') {
      const updateFields = {};
      if (request.requestType === 'change_username')    updateFields.username    = request.newValue;
      if (request.requestType === 'change_password')    updateFields.password    = request.newValue; // already hashed
      if (request.requestType === 'change_displayname') updateFields.displayName = request.newValue;
      await User.findByIdAndUpdate(request.fromUser._id, updateFields);
    }

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  USER MANAGEMENT (Admin)
// ════════════════════════════════════════════════════════════════════

// GET /api/users
app.get('/api/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort('username');
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/users/:id
app.patch('/api/users/:id', protect, adminOnly, async (req, res) => {
  try {
    const { username, displayName, role, isActive, password } = req.body;
    const updates = {};
    if (username    !== undefined) updates.username    = username;
    if (displayName !== undefined) updates.displayName = displayName;
    if (role        !== undefined) updates.role        = role;
    if (isActive    !== undefined) updates.isActive    = isActive;
    if (password) updates.password = await bcrypt.hash(password, 12);

    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/users/:id  — deactivate (not hard delete)
app.delete('/api/users/:id', protect, adminOnly, async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user._id))
      return res.status(400).json({ success: false, error: 'Cannot deactivate yourself' });
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });
    res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  FILE / FOLDER ROUTES
// ════════════════════════════════════════════════════════════════════

// GET /api/files/root
app.get('/api/files/root', protect, async (req, res) => {
  try {
    const query = { parentId: req.user.rootFolderId || null };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;
    const items = await Item.find(query).sort({ type: -1, name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/folders/root
app.get('/api/folders/root', protect, async (req, res) => {
  try {
    const query = { parentId: req.user.rootFolderId || null };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;
    const items = await Item.find(query).sort({ type: -1, name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/folders/:id
app.get('/api/folders/:id', protect, async (req, res) => {
  try {
    const query = { parentId: req.params.id };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;
    const items = await Item.find(query).sort({ type: -1, name: 1 });
    res.json({ success: true, data: items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/folders
app.post('/api/folders', protect, async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !parentId)
      return res.status(400).json({ success: false, error: 'name and parentId required' });

    const folder = await Item.create({
      _id: 'folder_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      name: name.trim(),
      type: 'folder',
      parentId,
      ownerId: req.user._id,
    });
    res.status(201).json({ success: true, data: folder });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/upload
app.post('/api/files/upload', protect, upload.single('file'), async (req, res) => {
  try {
    const { parentId } = req.body;
    if (!req.file || !parentId)
      return res.status(400).json({ success: false, error: 'file and parentId required' });

    let result;
    try {
      result = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } catch (cloudErr) {
      console.error('Cloudinary upload error:', cloudErr);
      return res.status(500).json({
        success: false,
        error: 'Cloudinary upload failed. Please check your API credentials in .env file.',
        details: cloudErr.message
      });
    }

    const ext    = req.file.originalname.includes('.')
      ? req.file.originalname.split('.').pop().toLowerCase()
      : '';

    const file = await Item.create({
      _id:       'file_' + Date.now() + '_' + Math.random().toString(36).slice(2),
      name:      req.file.originalname,
      type:      'file',
      parentId,
      ownerId:   req.user._id,
      extension: ext,
      size:      req.file.size,
      mimeType:  req.file.mimetype,
      cloudUrl:  result.secure_url,
      publicId:  result.public_id,
    });
    res.status(201).json({ success: true, data: file });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/:id/download
app.get('/api/files/:id/download', protect, async (req, res) => {
  try {
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;
    const item = await Item.findOne(query);
    if (!item || !item.cloudUrl)
      return res.status(404).json({ success: false, error: 'File not found' });
    res.json({ success: true, url: item.cloudUrl });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/items/:id  — rename
app.patch('/api/items/:id', protect, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name required' });
    const query = { _id: req.params.id };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;
    const item = await Item.findOneAndUpdate(
      query,
      { name: name.trim(), modifiedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/items/:id  — recursive delete
app.delete('/api/items/:id', protect, async (req, res) => {
  try {
    // Collect this item + all children recursively
    const collectIds = async (id) => {
      const children = await Item.find({ parentId: id }).select('_id');
      const sub = await Promise.all(children.map(c => collectIds(c._id)));
      return [id, ...sub.flat()];
    };
    const allIds = await collectIds(req.params.id);
    const query  = { _id: { $in: allIds } };
    if (req.user.role !== 'admin') query.ownerId = req.user._id;

    // Delete from Cloudinary first
    const files = await Item.find({ ...query, type: 'file', publicId: { $exists: true, $ne: null } });
    await Promise.all(
      files.map(f => cloudinary.uploader.destroy(f.publicId, { resource_type: 'auto' }).catch(() => {}))
    );

    const result = await Item.deleteMany(query);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/items/:id  — single item lookup (go-up breadcrumb)
app.get('/api/items/:id', protect, async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Item not found' });
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  SEED
//  🔒 SECURITY FIX: ចំណាំ seed ប្រើបានតែ 1 ដង (admin user មិនទាន់មាន)
//                   + block នៅ production
// ════════════════════════════════════════════════════════════════════
app.post('/api/seed', async (req, res) => {
  try {
    // Block in production
    if (process.env.NODE_ENV === 'production')
      return res.status(403).json({ success: false, error: 'Seed disabled in production' });

    const existing = await User.findOne({ username: 'admin' });
    if (existing) return res.json({ success: true, message: 'Already seeded' });

    // Create admin
    const { user: admin } = await createUserWithDrive({
      username: 'admin', password: 'admin123',
      displayName: 'Administrator', role: 'admin',
      avatarColor: '#f85149',
    }, ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Projects']);

    // Create demo user
    const { folderMap } = await createUserWithDrive({
      username: 'demo', password: 'demo123',
      displayName: 'Demo User', role: 'user',
      avatarColor: '#3fb950',
    });

    // Sample files for demo
    const sampleFiles = [
      { name: 'Resume.pdf',     ext: 'pdf',  parentKey: 'Desktop',   size: 245000  },
      { name: 'Notes.txt',      ext: 'txt',  parentKey: 'Desktop',   size: 1200    },
      { name: 'Q3 Report.docx', ext: 'docx', parentKey: 'Documents', size: 892000  },
      { name: 'Budget.xlsx',    ext: 'xlsx', parentKey: 'Documents', size: 340000  },
      { name: 'photo.jpg',      ext: 'jpg',  parentKey: 'Pictures',  size: 2100000 },
    ];

    const demo = await User.findOne({ username: 'demo' });
    for (const f of sampleFiles) {
      await Item.create({
        _id: `demo_file_${f.name.replace(/\W/g, '')}_${Date.now()}`,
        name: f.name, type: 'file',
        parentId: folderMap[f.parentKey],
        ownerId: demo._id,
        extension: f.ext,
        size: f.size,
      });
    }

    res.json({ success: true, message: 'Seeded: admin/admin123 and demo/demo123' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ════════════════════════════════════════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    env: process.env.NODE_ENV || 'development',
  });
});

// ════════════════════════════════════════════════════════════════════
//  STATIC FILES (served after API routes)
// ════════════════════════════════════════════════════════════════════
app.use(express.static('.'));   // serve index.html from same folder

// ════════════════════════════════════════════════════════════════════
//  START
// ════════════════════════════════════════════════════════════════════
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running → http://localhost:${PORT}`);
  console.log(`📁 Open app    → http://localhost:${PORT}/index.html`);
});