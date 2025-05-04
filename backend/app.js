require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const crypto = require('crypto');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/frontend', express.static(path.join(__dirname, '../frontend')));
app.use('/scripts', express.static(path.join(__dirname, '../scripts')));

app.use((req, res, next) => {
  const requestedPath = req.path.toLowerCase();
  const forbiddenPatterns = [
    '/package.json',
    '/package-lock.json',
    '/backend/',
    '/.env',
    '/scripts/tasks.js'
  ];
  const custom403PagePath = path.join(__dirname, '../frontend/403.html');

  if (forbiddenPatterns.some(pattern => requestedPath.startsWith(pattern))) {
    console.log(`Blocked access attempt to sensitive path: ${req.path}`);
    return res.status(403).sendFile(custom403PagePath);
  }

  if (requestedPath === '/backend/app.js') {
    console.log(`Blocked access attempt to backend/app.js`);
    return res.status(403).sendFile(custom403PagePath);
  }

  next();
});

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/todoapp')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  }
});

const User = mongoose.model('User', userSchema);

const taskSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  dueDate: {
    type: Date,
    required: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completed: {
    type: Boolean,
    default: false
  },
  file: {
    filename: {
      type: String,
      required: false
    },
    originalName: {
      type: String,
      required: false
    },
    mimetype: {
      type: String,
      required: false
    },
    size: {
      type: Number,
      required: false
    }
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  }
});

const Task = mongoose.model('Task', taskSchema);

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

const authenticateToken = (req, res, next) => {
  const token = req.cookies.jwt;
  const indexPath = '/frontend/index.html';

  if (!token) {
    console.log('No token found, redirecting to index.');
    return res.redirect(indexPath);
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Invalid token, clearing cookie and redirecting to index.');
      res.clearCookie('jwt');
      return res.redirect(indexPath);
    }
    req.user = user;
    next();
  });
};

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const randomName = crypto.randomBytes(16).toString('hex');
    const fileExt = path.extname(file.originalname);
    cb(null, `${randomName}${fileExt}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, DOCX, and image files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter: fileFilter
});

function getLogTime() {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${dd}.${mm} ${hh}:${min}:${ss}`;
}

app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (/[\u0400-\u04FF]/.test(password)) {
      return res.status(400).json({ message: 'Password must not contain Cyrillic (Russian/Ukrainian) letters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email is already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email,
      password: hashedPassword
    });

    await user.save();

    console.log(`[${getLogTime()}] User: ${email} | Action: SIGN_UP`);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'User with this email does not exist' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    console.log(`[${getLogTime()}] User: ${email} | Action: LOGIN`);

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

    res.cookie('jwt', token, { httpOnly: true, maxAge: 3600000 });

    res.status(200).json({ message: 'Login successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/user', authenticateToken, (req, res) => {
  if (!req.user || !req.user.email) {
    return res.status(401).json({ message: 'Authentication error' });
  }
  res.json({ email: req.user.email });
});

app.post('/api/logout', (req, res) => {
  res.clearCookie('jwt');
  res.status(200).json({ message: 'Logout successful' });
});

app.get('/api/auth-check', (req, res) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(200).json({ isAuthenticated: false });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(200).json({ isAuthenticated: false });
    }
    return res.status(200).json({ isAuthenticated: true, email: user.email });
  });
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id }).sort({ dueDate: 1 });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error while fetching tasks' });
  }
});

app.post('/api/tasks', authenticateToken, upload.single('taskFile'), async (req, res) => {
  try {
    const { name, description, dueDate, priority } = req.body;
    const userId = req.user.id;

    if (!name) {
      return res.status(400).json({ message: 'Task name is required' });
    }

    const taskData = {
      userId,
      name,
      description,
      createdAt: new Date(),
      priority: priority || 'medium'
    };

    if (dueDate) {
      taskData.dueDate = new Date(dueDate);
    }

    if (req.file) {
      taskData.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    const newTask = new Task(taskData);
    await newTask.save();

    console.log(`[${getLogTime()}] User: ${req.user.email} | Action: CREATE_TASK | Task: "${newTask.name}"`);

    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }

    res.status(500).json({ message: 'Server error while creating task' });
  }
});

app.put('/api/tasks/:taskId', authenticateToken, upload.single('taskFile'), async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;
    const { name, description, dueDate, priority } = req.body;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    task.name = name;
    task.description = description;
    task.priority = priority || 'medium';

    if (dueDate) {
      task.dueDate = new Date(dueDate);
    } else {
      task.dueDate = null;
    }

    if (req.file) {
      if (task.file && task.file.filename) {
        const oldFilePath = path.join(uploadsDir, task.file.filename);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      task.file = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      };
    }

    await task.save();

    console.log(`[${getLogTime()}] User: ${req.user.email} | Action: EDIT_TASK | Task: "${task.name}"`);

    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);

    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 10MB.' });
    }

    res.status(500).json({ message: 'Server error while updating task' });
  }
});

app.delete('/api/tasks/:taskId', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    if (task.file && task.file.filename) {
      const filePath = path.join(uploadsDir, task.file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Task.findByIdAndDelete(taskId);

    console.log(`[${getLogTime()}] User: ${req.user.email} | Action: DELETE_TASK | Task ID: ${taskId}`);

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: 'Server error while deleting task' });
  }
});

app.get('/api/tasks/:taskId/file', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or not authorized' });
    }

    if (!task.file || !task.file.filename) {
      return res.status(404).json({ message: 'No file attached to this task' });
    }

    const filePath = path.join(uploadsDir, task.file.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(task.file.originalName)}"`);

    res.sendFile(filePath);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ message: 'Server error while downloading file' });
  }
});

app.patch('/api/tasks/:taskId/toggle-completed', authenticateToken, async (req, res) => {
  try {
    const taskId = req.params.taskId;
    const userId = req.user.id;

    const task = await Task.findOne({ _id: taskId, userId });

    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    task.completed = !task.completed;

    await task.save();

    console.log(`[${getLogTime()}] User: ${req.user.email} | Action: TOGGLE_COMPLETED | Task: "${task.name}" | Completed: ${task.completed}`);

    res.json(task);
  } catch (error) {
    console.error('Error task completion:', error);
    res.status(500).json({ message: 'Server error while toggling task completion' });
  }
});

app.get(['/', '/frontend', '/frontend/'], (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/frontend/tasks.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/tasks.html'));
});

app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
