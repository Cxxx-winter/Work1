console.log('Happy developing ✨')
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 创建 Express 应用
const app = express();
const db = new sqlite3.Database('./database.db');  // 连接数据库

// 设置静态文件夹
app.use(express.static(path.join(__dirname, 'public')));

// 配置body-parser来处理POST请求的数据
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 配置会话管理
app.use(session({
    secret: 'secret_key',
    resave: false,
    saveUninitialized: true
}));

// 创建数据库表
db.serialize(() => {
    db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, username TEXT, password TEXT, email TEXT, phone TEXT, emergency_contact TEXT)");
});

// 路由：首页（登录页面）
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

// 路由：注册页面
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// 路由：个人资料页面
app.get('/profile', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/');
    }
    db.get("SELECT * FROM users WHERE id = ?", [req.session.userId], (err, row) => {
        if (err) {
            return res.send("Error retrieving user data.");
        }
        res.sendFile(path.join(__dirname, 'views', 'profile.html'));
    });
});

// 注册用户
app.post('/register', (req, res) => {
    const { username, password, confirmPassword, email, phone, emergencyContact } = req.body;

    if (password !== confirmPassword) {
        return res.send("Passwords do not match.");
    }

    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run("INSERT INTO users (username, password, email, phone, emergency_contact) VALUES (?, ?, ?, ?, ?)",
        [username, hashedPassword, email, phone, emergencyContact], (err) => {
            if (err) {
                return res.send("Error registering user.");
            }
            res.redirect('/');
        });
});

// 登录用户
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
        if (err || !row) {
            return res.send("User not found.");
        }

        if (bcrypt.compareSync(password, row.password)) {
            req.session.userId = row.id;  // 设置会话
            res.redirect('/profile');
        } else {
            res.send("Incorrect password.");
        }
    });
});

// 退出登录
app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.send("Error logging out.");
        }
        res.redirect('/');
    });
});

// 启动应用
app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
