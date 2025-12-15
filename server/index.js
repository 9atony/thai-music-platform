// server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); 

const app = express();

// ✅ FIX 1: อัปเดต CORS เพื่อรองรับ Domain จริงของ Netlify
// เมื่อ Deploy Frontend บน Netlify จะใช้ '*' ได้ หรือระบุ Netlify Domain ที่แน่นอน
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'] 
}));
app.use(express.json());

// Test Route
app.get('/', (req, res) => {
    res.send("Server is running correctly 🚀");
});

// --- เชื่อมต่อ MongoDB ---
// 💡 FIX 2: เปลี่ยนมาใช้ Environment Variable เพื่อความปลอดภัยในการ Deploy
const MONGODB_URI = process.env.MONGODB_URI; 

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ เชื่อมต่อ MongoDB สำเร็จ!"))
  .catch(err => console.error("❌ เชื่อมต่อไม่ติด:", err));

// ==========================================
// 1. SCHEMAS (โครงสร้างข้อมูล)
// ... (โค้ดส่วน Schemas และ Model เหมือนเดิม) ...
const UserSchema = new mongoose.Schema({
    uid: String,
    email: String,
    displayName: String,
    photoURL: String,
    role: { type: String, default: 'user' }, 
    createdAt: { type: Date, default: Date.now },
});
const UserModel = mongoose.model('User', UserSchema);

const ProjectSchema = new mongoose.Schema({
    ownerUid: String,
    title: { type: String, default: 'Untitled' },
    meta: Object, 
    data: Array,
    rowTypes: Array,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});
const ProjectModel = mongoose.model('Project', ProjectSchema);
// ==========================================
// 2. API ROUTES
// ==========================================

// A. บันทึกข้อมูล User (เมื่อ Login/Register)
app.post('/api/save-user', async (req, res) => {
    const { uid, email, displayName, photoURL } = req.body;
    try {
        await UserModel.findOneAndUpdate(
            { uid: uid },
            { 
                email: email, 
                displayName: displayName, 
                photoURL: photoURL 
            },
            { upsert: true, new: true } 
        );
        res.status(200).send('User saved successfully');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B. สร้างเพลงใหม่
app.post('/api/projects', async (req, res) => {
    try {
        const newProject = await ProjectModel.create(req.body);
        res.json(newProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B1. ดึงข้อมูลเพลงทั้งหมดของ User
app.get('/api/projects/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const projects = await ProjectModel.find({ ownerUid: uid }).sort({ updatedAt: -1 });
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// B2. ดึงข้อมูล User ทั้งหมด (ใช้ใน Dashboard เพื่อดึงชื่อตัวเอง)
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await UserModel.find({});
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// C. ดึงข้อมูลเพลงรายตัว (Editor)
app.get('/api/project/:id', async (req, res) => {
    try {
        const project = await ProjectModel.findById(req.params.id);
        if (!project) return res.status(404).json({ error: "Project not found" });
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// D. บันทึกแก้ไขเพลง (Save)
app.put('/api/project/:id', async (req, res) => {
    try {
        const { title, meta, data, rowTypes } = req.body;
        const updated = await ProjectModel.findByIdAndUpdate(
            req.params.id, 
            { 
                title, 
                meta, 
                data, 
                rowTypes, 
                updatedAt: Date.now() 
            }, 
            { new: true }
        );
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// E. ลบ Project
app.delete('/api/project/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedProject = await ProjectModel.findByIdAndDelete(id);

        if (!deletedProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`💻 Server รันที่ Port ${PORT}`));