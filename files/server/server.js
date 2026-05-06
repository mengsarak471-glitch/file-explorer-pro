const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const multer     = require('multer');
const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ── MongoDB ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/fileexplorer', { family: 4 })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB error:', err.message); process.exit(1); });

// ── Cloudinary ──────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Schema ──────────────────────────────────────────────────────────
const itemSchema = new mongoose.Schema({
  _id:        { type: String },
  name:       { type: String, required: true },
  type:       { type: String, enum: ['folder', 'file'], required: true },
  parentId:   { type: String, default: null },
  extension:  { type: String },
  size:       { type: Number, default: 0 },
  cloudUrl:   { type: String },   // Cloudinary secure URL
  publicId:   { type: String },   // Cloudinary public_id for delete
  mimeType:   { type: String },
  modifiedAt: { type: Date, default: Date.now },
}, { timestamps: true, _id: false });

itemSchema.index({ parentId: 1 });
const Item = mongoose.model('Item', itemSchema);

// ── Multer (memory) ─────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// ── Helper: Upload buffer to Cloudinary ────────────────────────────
function uploadToCloudinary(buffer, filename, mimetype) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        public_id: `file-explorer/${Date.now()}-${filename}`,
        use_filename: true,
        unique_filename: false,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    Readable.from(buffer).pipe(uploadStream);
  });
}

// ════════════════════════════════════════════════════════════════════
//  ROUTES
// ════════════════════════════════════════════════════════════════════

// GET /api/folders/:id
app.get('/api/folders/:id', async (req, res) => {
  try {
    const items = await Item.find({ parentId: req.params.id }).sort({ type: -1, name: 1 });
    res.json({ success: true, data: items });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/folders
app.post('/api/folders', async (req, res) => {
  try {
    const { name, parentId } = req.body;
    if (!name || !parentId) return res.status(400).json({ success: false, error: 'name and parentId required' });
    const folder = await Item.create({ _id: 'folder_' + Date.now(), name, type: 'folder', parentId });
    res.status(201).json({ success: true, data: folder });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/files/upload → Cloudinary
app.post('/api/files/upload', upload.single('file'), async (req, res) => {
  try {
    const { parentId } = req.body;
    if (!req.file || !parentId) return res.status(400).json({ success: false, error: 'file and parentId required' });

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname, req.file.mimetype);

    const ext = req.file.originalname.split('.').pop().toLowerCase();
    const file = await Item.create({
      _id:       'file_' + Date.now(),
      name:      req.file.originalname,
      type:      'file',
      parentId,
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

// GET /api/files/:id/download → redirect to Cloudinary URL
app.get('/api/files/:id/download', async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item || !item.cloudUrl) return res.status(404).json({ success: false, error: 'File not found' });
    res.json({ success: true, url: item.cloudUrl });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// PATCH /api/items/:id
app.patch('/api/items/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, error: 'name required' });
    const item = await Item.findByIdAndUpdate(req.params.id, { name, modifiedAt: new Date() }, { new: true });
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// DELETE /api/items/:id (recursive + Cloudinary cleanup)
app.delete('/api/items/:id', async (req, res) => {
  try {
    const collectIds = async (id) => {
      const children = await Item.find({ parentId: id });
      const sub = await Promise.all(children.map(c => collectIds(c._id)));
      return [id, ...sub.flat()];
    };
    const allIds = await collectIds(req.params.id);

    // Delete Cloudinary assets
    const files = await Item.find({ _id: { $in: allIds }, publicId: { $exists: true, $ne: null } });
    await Promise.all(files.map(f =>
      cloudinary.uploader.destroy(f.publicId, { resource_type: 'auto' }).catch(() => {})
    ));

    const result = await Item.deleteMany({ _id: { $in: allIds } });
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// POST /api/seed
app.post('/api/seed', async (req, res) => {
  try {
    await Item.deleteMany({});
    const seed = [
      { _id:'root',                name:'Home',                 type:'folder', parentId:null          },
      { _id:'desktop',             name:'Desktop',              type:'folder', parentId:'root'         },
      { _id:'documents',           name:'Documents',            type:'folder', parentId:'root'         },
      { _id:'downloads',           name:'Downloads',            type:'folder', parentId:'root'         },
      { _id:'pictures',            name:'Pictures',             type:'folder', parentId:'root'         },
      { _id:'c_drive',             name:'Local Disk (C:)',      type:'folder', parentId:'root'         },
      { _id:'d_drive',             name:'Data (D:)',            type:'folder', parentId:'root'         },
      { _id:'projects',            name:'Projects',             type:'folder', parentId:'documents'    },
      { _id:'node_modules_parent', name:'mern-app',            type:'folder', parentId:'projects'     },
      { _id:'f-resume',            name:'Resume.pdf',           type:'file',   parentId:'desktop',    extension:'pdf'  },
      { _id:'f-notes',             name:'Notes.txt',            type:'file',   parentId:'desktop',    extension:'txt'  },
      { _id:'f-win11',             name:'wallpaper.jpg',        type:'file',   parentId:'desktop',    extension:'jpg'  },
      { _id:'f-report',            name:'Q3 Report.docx',       type:'file',   parentId:'documents',  extension:'docx' },
      { _id:'f-budget',            name:'Budget.xlsx',          type:'file',   parentId:'documents',  extension:'xlsx' },
      { _id:'f-installer',         name:'NodeJS-installer.exe', type:'file',   parentId:'downloads',  extension:'exe'  },
      { _id:'f-mongo',             name:'mongodb-6.0.zip',      type:'file',   parentId:'downloads',  extension:'zip'  },
      { _id:'f-vacation',          name:'vacation.jpg',         type:'file',   parentId:'pictures',   extension:'jpg'  },
      { _id:'f-profile',           name:'profile.png',          type:'file',   parentId:'pictures',   extension:'png'  },
      { _id:'mern-todo',           name:'mern-todo',            type:'folder', parentId:'projects'     },
      { _id:'mern-blog',           name:'mern-blog',            type:'folder', parentId:'projects'     },
      { _id:'src',                 name:'src',                  type:'folder', parentId:'node_modules_parent' },
      { _id:'node_modules',        name:'node_modules',         type:'folder', parentId:'node_modules_parent' },
      { _id:'f-package',           name:'package.json',         type:'file',   parentId:'node_modules_parent', extension:'json' },
      { _id:'f-readme',            name:'README.md',            type:'file',   parentId:'node_modules_parent', extension:'md'   },
      { _id:'f-server',            name:'server.js',            type:'file',   parentId:'node_modules_parent', extension:'js'   },
      { _id:'f-app',               name:'App.jsx',              type:'file',   parentId:'src',        extension:'jsx'  },
      { _id:'components',          name:'components',           type:'folder', parentId:'src'          },
      { _id:'models',              name:'models',               type:'folder', parentId:'src'          },
      { _id:'routes',              name:'routes',               type:'folder', parentId:'src'          },
      { _id:'windows',             name:'Windows',              type:'folder', parentId:'c_drive'      },
      { _id:'program_files',       name:'Program Files',        type:'folder', parentId:'c_drive'      },
      { _id:'backups',             name:'Backups',              type:'folder', parentId:'d_drive'      },
      { _id:'f-backup1',           name:'backup_2024.tar.gz',   type:'file',   parentId:'d_drive',    extension:'gz'   },
    ];
    await Item.insertMany(seed);
    res.json({ success: true, message: `Seeded ${seed.length} items` });
  } catch (err) { res.status(500).json({ success: false, error: err.message }); }
});

// GET /api/health
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mongo: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));