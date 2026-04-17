import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import multer from 'multer';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// 数据库连接
let db;

// 初始化数据库
async function initDatabase() {
  try {
    db = await open({
      filename: './ai_agent.db',
      driver: sqlite3.Database
    });

    // 创建用户表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        balance INTEGER DEFAULT 1000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建剧本表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS scripts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        cover TEXT,
        aiModel TEXT DEFAULT 'free',
        endings TEXT,
        creatorId TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP
      );
    `);

    // 创建对话历史表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS chat_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        script_id TEXT,
        messages TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建充值记录表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS recharge_records (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        package_id TEXT,
        package_name TEXT,
        tokens INTEGER,
        price INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 创建游戏历史表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS game_history (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        script_id TEXT,
        script_name TEXT,
        script_description TEXT,
        script_cover TEXT,
        first_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total_messages INTEGER DEFAULT 0
      );
    `);

    // 创建存档表
    await db.exec(`
      CREATE TABLE IF NOT EXISTS save_points (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT,
        timestamp INTEGER,
        messages TEXT,
        script_id TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('数据库初始化成功');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
}

// 请求频率限制管理
const rateLimitMap = new Map();
const MAX_REQUESTS_PER_MINUTE = 60; // 每分钟最大请求数
const WINDOW_SIZE_MS = 60 * 1000; // 时间窗口大小（毫秒）

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const upload = multer({ storage: storage });

// 中间件
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// 数据库操作函数

// 读取用户数据
async function readUsers() {
  try {
    return await db.all('SELECT * FROM users');
  } catch (error) {
    console.error('读取用户数据失败:', error);
    return [];
  }
}

// 写入用户数据
async function writeUsers(users) {
  // 这个函数不再需要，因为我们会使用单独的数据库操作来更新用户数据
}

// 读取剧本数据
async function readScripts() {
  try {
    return await db.all('SELECT * FROM scripts');
  } catch (error) {
    console.error('读取剧本数据失败:', error);
    return [];
  }
}

// 写入剧本数据
async function writeScripts(scripts) {
  // 这个函数不再需要，因为我们会使用单独的数据库操作来更新剧本数据
}

// 读取对话历史
async function readChatHistory() {
  try {
    const rows = await db.all('SELECT user_id, script_id, messages FROM chat_history');
    const chatHistory = {};
    rows.forEach(row => {
      const key = `${row.user_id}_${row.script_id}`;
      chatHistory[key] = JSON.parse(row.messages);
    });
    return chatHistory;
  } catch (error) {
    console.error('读取对话历史失败:', error);
    return {};
  }
}

// 写入对话历史
async function writeChatHistory(chatHistory) {
  try {
    for (const [key, messages] of Object.entries(chatHistory)) {
      const [userId, scriptId] = key.split('_');
      const existing = await db.get('SELECT * FROM chat_history WHERE user_id = ? AND script_id = ?', [userId, scriptId]);
      if (existing) {
        await db.run('UPDATE chat_history SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND script_id = ?', [JSON.stringify(messages), userId, scriptId]);
      } else {
        await db.run('INSERT INTO chat_history (id, user_id, script_id, messages) VALUES (?, ?, ?, ?)', [Date.now().toString(), userId, scriptId, JSON.stringify(messages)]);
      }
    }
  } catch (error) {
    console.error('写入对话历史失败:', error);
  }
}

// 读取充值记录
async function readRechargeRecords() {
  try {
    return await db.all('SELECT * FROM recharge_records');
  } catch (error) {
    console.error('读取充值记录失败:', error);
    return [];
  }
}

// 写入充值记录
async function writeRechargeRecords(records) {
  // 这个函数不再需要，因为我们会使用单独的数据库操作来插入充值记录
}

// 读取游戏历史记录
async function readGameHistory() {
  try {
    const rows = await db.all('SELECT * FROM game_history');
    const gameHistory = {};
    rows.forEach(row => {
      if (!gameHistory[row.user_id]) {
        gameHistory[row.user_id] = [];
      }
      gameHistory[row.user_id].push({
        scriptId: row.script_id,
        scriptName: row.script_name,
        scriptDescription: row.script_description,
        scriptCover: row.script_cover,
        firstPlayedAt: row.first_played_at,
        lastPlayedAt: row.last_played_at,
        totalMessages: row.total_messages
      });
    });
    return gameHistory;
  } catch (error) {
    console.error('读取游戏历史记录失败:', error);
    return {};
  }
}

// 写入游戏历史记录
async function writeGameHistory(gameHistory) {
  // 这个函数不再需要，因为我们会使用单独的数据库操作来更新游戏历史记录
}

// 读取存档数据
async function readSavePoints() {
  try {
    const rows = await db.all('SELECT * FROM save_points');
    const savePoints = {};
    rows.forEach(row => {
      if (!savePoints[row.user_id]) {
        savePoints[row.user_id] = [];
      }
      savePoints[row.user_id].push({
        id: row.id,
        name: row.name,
        timestamp: row.timestamp,
        messages: JSON.parse(row.messages),
        scriptId: row.script_id
      });
    });
    return savePoints;
  } catch (error) {
    console.error('读取存档数据失败:', error);
    return {};
  }
}

// 写入存档数据
async function writeSavePoints(savePoints) {
  // 这个函数不再需要，因为我们会使用单独的数据库操作来更新存档数据
}

// Token充值套餐配置
const TOKEN_PACKAGES = [
  { id: 'basic', name: '基础包', tokens: 1000, price: 10, description: '1000 Token - 适合轻度使用' },
  { id: 'standard', name: '标准包', tokens: 5000, price: 45, description: '5000 Token - 性价比之选 (9折优惠)' },
  { id: 'premium', name: '高级包', tokens: 12000, price: 100, description: '12000 Token - 重度用户首选 (8.3折优惠)' },
  { id: 'ultimate', name: '至尊包', tokens: 30000, price: 240, description: '30000 Token - 最超值 (8折优惠)' }
];

// 每日互动奖励Token数量
const DAILY_INTERACTION_REWARD = 50;
// 每次互动奖励Token数量
const PER_INTERACTION_REWARD = 5;



// 生成JWT token
function generateToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, 'secret_key', { expiresIn: '1h' });
}

// 检查请求频率限制
function checkRateLimit(userId) {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // 过滤掉时间窗口外的请求
  const recentRequests = userRequests.filter(timestamp => now - timestamp < WINDOW_SIZE_MS);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return false; // 超过限制
  }
  
  // 添加当前请求时间戳
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true; // 未超过限制
}

// 注册接口
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    // 检查用户名是否已存在
    const existingUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }
    
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 创建新用户
    const newUser = {
      id: Date.now().toString(),
      username,
      password: hashedPassword,
      balance: 1000 // 初始Token余额
    };
    
    // 插入用户数据
    await db.run('INSERT INTO users (id, username, password, balance) VALUES (?, ?, ?, ?)', 
      [newUser.id, newUser.username, newUser.password, newUser.balance]);
    
    // 生成token
    const token = generateToken(newUser);
    
    res.status(201).json({ message: '注册成功', user: { id: newUser.id, username: newUser.username }, token });
  } catch (error) {
    res.status(500).json({ message: '注册失败', error: error.message });
  }
});

// 登录接口
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }
    
    // 查找用户
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    
    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }
    
    // 生成token
    const token = generateToken(user);
    
    res.status(200).json({ message: '登录成功', user: { id: user.id, username: user.username, balance: user.balance || 0 }, token });
  } catch (error) {
    res.status(500).json({ message: '登录失败', error: error.message });
  }
});

// 验证token中间件
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未授权' });
  }
  
  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'token无效' });
    }
    req.user = user;
    next();
  });
}

// 测试认证接口
app.get('/api/protected', authenticateToken, (req, res) => {
  res.json({ message: '访问成功', user: req.user });
});

// 获取Token充值套餐
app.get('/api/token-packages', (req, res) => {
  res.json({ packages: TOKEN_PACKAGES });
});

// 充值Token
app.post('/api/recharge', authenticateToken, async (req, res) => {
  try {
    const { packageId } = req.body;
    
    // 查找套餐
    const pkg = TOKEN_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ message: '无效的套餐ID' });
    }
    
    // 读取用户数据
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 增加用户余额
    const newBalance = (user.balance || 0) + pkg.tokens;
    await db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);
    
    // 记录充值
    const recordId = Date.now().toString();
    await db.run('INSERT INTO recharge_records (id, user_id, package_id, package_name, tokens, price) VALUES (?, ?, ?, ?, ?, ?)', 
      [recordId, req.user.id, pkg.id, pkg.name, pkg.tokens, pkg.price]);
    
    res.json({ 
      message: `成功充值 ${pkg.tokens} Token`, 
      balance: newBalance 
    });
  } catch (error) {
    res.status(500).json({ message: '充值失败', error: error.message });
  }
});

// 获取用户充值记录
app.get('/api/recharge-records', authenticateToken, async (req, res) => {
  try {
    const records = await db.all('SELECT * FROM recharge_records WHERE user_id = ?', [req.user.id]);
    res.json({ records: records });
  } catch (error) {
    res.status(500).json({ message: '获取充值记录失败', error: error.message });
  }
});

// 获取用户游戏历史记录
app.get('/api/game-history', authenticateToken, async (req, res) => {
  try {
    const records = await db.all('SELECT * FROM game_history WHERE user_id = ?', [req.user.id]);
    const userGameHistory = records.map(record => ({
      scriptId: record.script_id,
      scriptName: record.script_name,
      scriptDescription: record.script_description,
      scriptCover: record.script_cover,
      firstPlayedAt: record.first_played_at,
      lastPlayedAt: record.last_played_at,
      totalMessages: record.total_messages
    }));
    res.json({ history: userGameHistory });
  } catch (error) {
    res.status(500).json({ message: '获取游戏历史记录失败', error: error.message });
  }
});

// 创建存档
app.post('/api/save-points', authenticateToken, async (req, res) => {
  try {
    const { name, messages, scriptId } = req.body;
    
    if (!name || !messages || !scriptId) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    const userId = req.user.id;
    const newSavePoint = {
      id: Date.now().toString(),
      name,
      timestamp: Date.now(),
      messages,
      scriptId
    };
    
    // 插入存档数据
    await db.run('INSERT INTO save_points (id, user_id, name, timestamp, messages, script_id) VALUES (?, ?, ?, ?, ?, ?)', 
      [newSavePoint.id, userId, newSavePoint.name, newSavePoint.timestamp, JSON.stringify(newSavePoint.messages), newSavePoint.scriptId]);
    
    res.status(201).json({ message: '存档创建成功', savePoint: newSavePoint });
  } catch (error) {
    res.status(500).json({ message: '创建存档失败', error: error.message });
  }
});

// 获取用户存档列表
app.get('/api/save-points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const records = await db.all('SELECT * FROM save_points WHERE user_id = ?', [userId]);
    const userSavePoints = records.map(record => ({
      id: record.id,
      name: record.name,
      timestamp: record.timestamp,
      messages: JSON.parse(record.messages),
      scriptId: record.script_id
    }));
    
    res.json({ savePoints: userSavePoints });
  } catch (error) {
    res.status(500).json({ message: '获取存档列表失败', error: error.message });
  }
});

// 删除存档
app.delete('/api/save-points/:id', authenticateToken, async (req, res) => {
  try {
    const savePointId = req.params.id;
    const userId = req.user.id;
    
    // 检查存档是否存在且属于该用户
    const result = await db.run('DELETE FROM save_points WHERE id = ? AND user_id = ?', [savePointId, userId]);
    
    if (result.changes > 0) {
      res.json({ message: '存档删除成功' });
    } else {
      res.status(404).json({ message: '存档不存在' });
    }
  } catch (error) {
    res.status(500).json({ message: '删除存档失败', error: error.message });
  }
});

// 图片上传接口
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '请选择要上传的图片' });
    }
    
    // 生成图片URL
    const imageUrl = `http://localhost:3001/uploads/${req.file.filename}`;
    
    res.json({ message: '图片上传成功', url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: '图片上传失败', error: error.message });
  }
});

// 剧本相关接口

// 获取所有剧本
app.get('/api/scripts', async (req, res) => {
  try {
    const scripts = await db.all('SELECT * FROM scripts');
    res.json({ scripts });
  } catch (error) {
    res.status(500).json({ message: '获取剧本失败', error: error.message });
  }
});

// 获取单个剧本
app.get('/api/scripts/:id', async (req, res) => {
  try {
    const script = await db.get('SELECT * FROM scripts WHERE id = ?', [req.params.id]);
    
    if (!script) {
      return res.status(404).json({ message: '剧本不存在' });
    }
    
    res.json({ script });
  } catch (error) {
    res.status(500).json({ message: '获取剧本失败', error: error.message });
  }
});

// 创建剧本
app.post('/api/scripts', authenticateToken, async (req, res) => {
  try {
    const { name, description, cover, aiModel, endings } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({ message: '剧本名称和描述不能为空' });
    }
    
    // 创建新剧本
    const newScript = {
      id: Date.now().toString(),
      name,
      description,
      cover: cover || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=script%20killer%20cover&image_size=landscape_16_9',
      aiModel: aiModel || 'free',
      endings: endings || '多种结局取决于你的选择',
      creatorId: req.user.id,
      createdAt: new Date().toISOString()
    };
    
    // 插入剧本数据
    await db.run('INSERT INTO scripts (id, name, description, cover, aiModel, endings, creatorId, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [newScript.id, newScript.name, newScript.description, newScript.cover, newScript.aiModel, newScript.endings, newScript.creatorId, newScript.createdAt]);
    
    res.status(201).json({ message: '剧本创建成功', script: newScript });
  } catch (error) {
    res.status(500).json({ message: '创建剧本失败', error: error.message });
  }
});

// 更新剧本
app.put('/api/scripts/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, cover, aiModel, endings } = req.body;
    
    // 查找剧本
    const script = await db.get('SELECT * FROM scripts WHERE id = ?', [req.params.id]);
    
    if (!script) {
      return res.status(404).json({ message: '剧本不存在' });
    }
    
    // 检查是否是剧本创建者
    if (script.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权限修改此剧本' });
    }
    
    // 更新剧本
    const updatedScript = {
      ...script,
      name: name || script.name,
      description: description || script.description,
      cover: cover || script.cover,
      aiModel: aiModel || script.aiModel,
      endings: endings || script.endings,
      updatedAt: new Date().toISOString()
    };
    
    // 执行更新
    await db.run('UPDATE scripts SET name = ?, description = ?, cover = ?, aiModel = ?, endings = ?, updated_at = ? WHERE id = ?', 
      [updatedScript.name, updatedScript.description, updatedScript.cover, updatedScript.aiModel, updatedScript.endings, updatedScript.updatedAt, req.params.id]);
    
    res.json({ message: '剧本更新成功', script: updatedScript });
  } catch (error) {
    res.status(500).json({ message: '更新剧本失败', error: error.message });
  }
});

// 删除剧本
app.delete('/api/scripts/:id', authenticateToken, async (req, res) => {
  try {
    // 查找剧本
    const script = await db.get('SELECT * FROM scripts WHERE id = ?', [req.params.id]);
    
    if (!script) {
      return res.status(404).json({ message: '剧本不存在' });
    }
    
    // 检查是否是剧本创建者
    if (script.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权限删除此剧本' });
    }
    
    // 执行删除
    await db.run('DELETE FROM scripts WHERE id = ?', [req.params.id]);
    
    res.json({ message: '剧本删除成功' });
  } catch (error) {
    res.status(500).json({ message: '删除剧本失败', error: error.message });
  }
});

// AI对话代理接口
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { model, messages, temperature = 0.7, scriptId } = req.body;
    
    if (!messages || !messages.length || !scriptId) {
      return res.status(400).json({ message: '缺少必要参数' });
    }
    
    // 检查请求频率限制
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({ message: '请求过于频繁，请稍后再试' });
    }
    
    // 读取剧本信息
    const script = await db.get('SELECT * FROM scripts WHERE id = ?', [scriptId]);
    
    if (!script) {
      return res.status(404).json({ message: '剧本不存在' });
    }
    
    // 读取用户数据
    const user = await db.get('SELECT * FROM users WHERE id = ?', [req.user.id]);
    
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }
    
    // 计算Token消耗
    const tokenCost = script.aiModel === 'premium' ? 10 : 1; // 付费模型消耗10Token，免费模型消耗1Token
    
    // 检查余额
    if (!user.balance || user.balance < tokenCost) {
      return res.status(400).json({ message: 'Token余额不足' });
    }
    
    // 读取对话历史
    const historyKey = `${req.user.id}_${scriptId}`;
    const existingChat = await db.get('SELECT messages FROM chat_history WHERE user_id = ? AND script_id = ?', [req.user.id, scriptId]);
    
    // 获取历史对话
    let historyMessages = [];
    if (existingChat) {
      historyMessages = JSON.parse(existingChat.messages);
    }
    
    // 构建完整的对话历史，添加剧本简介作为系统提示
    const systemPrompt = {
      role: 'system',
      content: `你是剧本杀游戏的AI角色。以下是剧本信息：\n\n剧本名称：${script.name}\n剧本描述：${script.description}\n\n请根据剧本背景进行对话，保持角色一致性，不要偏离剧本设定。`
    };
    
    const fullMessages = [systemPrompt, ...historyMessages, ...messages];
    
    // 使用智谱AI API
    // 智谱AI API配置
    const API_KEY = '74f7a6e747ed429e9c77439ec3e2773e.qsXh5H8ZtrW292j8';
    const MODEL = 'glm-4.7-flash';
    const apiUrl = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';
    
    // 构建消息数组
    const apiMessages = fullMessages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    console.log('Sending request to Zhipu AI API...');
    console.log('API Key (first 10 chars):', API_KEY.substring(0, 10) + '...');
    console.log('Model:', MODEL);
    console.log('Messages:', JSON.stringify(apiMessages, null, 2));
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: apiMessages,
        temperature: temperature,
        max_tokens: 1000
      })
    });
    
    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.choices && data.choices[0] && data.choices[0].message) {
      // 提取AI回复
      const aiResponse = {
        role: 'assistant',
        content: data.choices[0].message.content
      };
      
      // 保存对话历史
      const updatedHistory = [...fullMessages, aiResponse];
      
      // 限制历史对话长度，避免API调用超过token限制
      const maxHistoryLength = 20; // 保留最近20条消息
      if (updatedHistory.length > maxHistoryLength) {
        updatedHistory.splice(0, updatedHistory.length - maxHistoryLength);
      }
      
      // 保存对话历史到数据库
      if (existingChat) {
        await db.run('UPDATE chat_history SET messages = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND script_id = ?', 
          [JSON.stringify(updatedHistory), req.user.id, scriptId]);
      } else {
        await db.run('INSERT INTO chat_history (id, user_id, script_id, messages) VALUES (?, ?, ?, ?)', 
          [Date.now().toString(), req.user.id, scriptId, JSON.stringify(updatedHistory)]);
      }
      
      // 扣减Token余额并添加互动奖励
      const newBalance = user.balance - tokenCost + PER_INTERACTION_REWARD;
      await db.run('UPDATE users SET balance = ? WHERE id = ?', [newBalance, req.user.id]);
      
      const rewardMessage = ` (互动奖励 +${PER_INTERACTION_REWARD} Token)`;
      
      // 更新游戏历史记录
      const existingGameHistory = await db.get('SELECT * FROM game_history WHERE user_id = ? AND script_id = ?', [req.user.id, scriptId]);
      
      if (existingGameHistory) {
        // 更新现有记录
        await db.run('UPDATE game_history SET last_played_at = CURRENT_TIMESTAMP, total_messages = total_messages + 1 WHERE id = ?', [existingGameHistory.id]);
      } else {
        // 创建新记录
        await db.run('INSERT INTO game_history (id, user_id, script_id, script_name, script_description, script_cover, first_played_at, last_played_at, total_messages) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1)', 
          [Date.now().toString(), req.user.id, scriptId, script.name, script.description, script.cover]);
      }
      
      // 转换为OpenAI格式的响应
      const openaiFormatResponse = {
        choices: [{
          message: aiResponse
        }],
        balance: newBalance, // 返回更新后的余额
        reward: PER_INTERACTION_REWARD,
        cost: tokenCost,
        message: `消耗 ${tokenCost} Token${rewardMessage}`
      };
      
      res.json(openaiFormatResponse);
    } else {
      console.error('API Error:', data);
      res.status(response.status || 500).json({ 
        message: 'AI API调用失败', 
        error: data.error || data.message || '未知错误',
        details: data 
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'AI对话失败', error: error.message });
  }
});

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
  }
}

// 启动服务器
startServer();