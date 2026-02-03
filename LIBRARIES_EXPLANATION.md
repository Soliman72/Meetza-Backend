# 📚 شرح أهم المكاتب المستخدمة في Meetza Backend

---

## 🔐 **Authentication & Security**

### 1. **Passport** (`passport`)
**الاستخدام**: Authentication middleware لـ Node.js
**الغرض**: تسهيل عملية المصادقة مع مزودين متعددين (Google, Facebook, LinkedIn)
**مثال الاستخدام**:
```javascript
passport.authenticate("google", { session: false })
```
**الفائدة**: يدعم OAuth 2.0 و Social Authentication بسهولة

---

### 2. **Passport Google OAuth** (`passport-google-oauth20`)
**الاستخدام**: استراتيجية Passport للمصادقة عبر Google
**الغرض**: تمكين تسجيل الدخول باستخدام حساب Google
**الفائدة**: تقليل تعقيد OAuth يدوياً

---

### 3. **bcrypt** (`bcrypt`)
**الاستخدام**: تشفير كلمات المرور
**الغرض**: Hash كلمات المرور قبل حفظها في Database
**مثال الاستخدام**:
```javascript
const hashedPassword = await bcrypt.hash(password, 10);
const isValid = await bcrypt.compare(password, hashedPassword);
```
**الأمان**: Hash one-way مع Salt، صعب عكسها

---

### 4. **JWT (JSON Web Token)** (`jsonwebtoken`)
**الاستخدام**: إنشاء وتوقيع Tokens للمصادقة
**الغرض**: استبدال Session-based authentication بـ Token-based
**مثال الاستخدام**:
```javascript
const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "24h" });
const decoded = jwt.verify(token, JWT_SECRET);
```
**الفائدة**: Stateless authentication، أسهل للـ Scalability

#### **🔍 الأسئلة المتوقعة في المناقشة:**

**1. إيه الفرق بين JWT و Sessions؟**
- **JWT**: Stateless - البيانات محفوظة في الـ Token نفسه، لا يحتاج Server-side storage
- **Sessions**: Stateful - البيانات محفوظة في Database/Memory على الـ Server
- **الفائدة**: JWT أسهل للـ Scalability لأن أي Server يقدر يتحقق من الـ Token بدون الوصول لـ Database

**2. إيه اللي محفوظ في JWT Token؟**
- **Payload**: بيانات المستخدم (id, email, role)
- **Header**: نوع الـ Algorithm (HS256)
- **Signature**: للتأكد من أن الـ Token لم يتم التلاعب به

**3. إزاي بنضمن أمان JWT؟**
- **Signature**: الـ Token موقّع بـ Secret Key - لو تم التلاعب بالـ Token، الـ Signature مش هتطابق
- **Expiration**: Token له صلاحية محددة (24h أو 4d حسب remember_me)
- **Secret Key**: محفوظ في Environment Variables، مش في الكود

**4. ليه استخدمت JWT مش Sessions؟**
- **Scalability**: لو عندي Multiple Servers، JWT يعمل بدون Shared Session Store
- **Performance**: كل Request لا يحتاج Database Query للتحقق من Session
- **Mobile-friendly**: JWT مناسب أكثر للـ Mobile Apps
- **Stateless**: الـ Server لا يحتفظ بحالة - أسهل للـ Horizontal Scaling

**5. إيه مشاكل JWT وازاي حلتها؟**
- **Problem**: الـ Token كبير في الحجم (أكبر من Session ID)
  - **Solution**: احفظ فقط البيانات الضرورية (id, email, role)
- **Problem**: صعب Revoke Token قبل انتهاء صلاحيته
  - **Solution**: استخدام Expiration قصير (24h)، و Refresh Token لو محتاجين
- **Problem**: لو Secret Key اتعرض، كل الـ Tokens تبقى غير آمنة
  - **Solution**: Secret Key في Environment Variables، استخدام HTTPS

**6. إزاي بنحفظ JWT في Frontend؟**
- **localStorage**: سهل لكن عرضة لـ XSS attacks
- **httpOnly Cookies**: أكثر أماناً لكن معقدة في Implementation
- **في مشروعنا**: Frontend بيستخدم localStorage أو memory storage

**7. إيه الـ Expiration Time اللي استخدمتها؟**
- **Normal Login**: 24 hours
- **Remember Me**: 4 days
- **السبب**: توازن بين الأمان والراحة - لو Token سرق، صلاحيته محدودة

**8. إيه لو الـ Token انتهت صلاحيته؟**
- المستخدم محتاج يسجل دخول مرة تانية
- ممكن نعمل Refresh Token mechanism (لكن مش مطبق في المشروع الحالي)

**9. إزاي بنتحقق من JWT في كل Request؟**
- **Middleware** (`verifyToken`): 
  - يقرأ Token من `Authorization` header
  - يتحقق من Signature باستخدام `JWT_SECRET`
  - يجلب بيانات User من Database
  - يضيف `req.user` للـ Request

**10. ليه احتفظت بـ `id` و `email` في Token وليس كل البيانات؟**
- **Security**: أقل بيانات = أقل مخاطرة لو Token اتعرض
- **Size**: Token أصغر = أسرع في Network
- **Database**: لازم نجيب بيانات User من Database عشان نتأكد من أحدث حالة

**11. إيه الفرق بين `jwt.sign()` و `jwt.verify()`؟**
- **`jwt.sign()`**: ينشئ Token جديد - يأخذ Payload و Secret و Options
- **`jwt.verify()`**: يتحقق من Token موجود - يفحص Signature و Expiration

**12. ليه استخدمت HS256 مش RS256؟**
- **HS256**: Symmetric - نفس الـ Secret للتوقيع والتحقق (أسهل)
- **RS256**: Asymmetric - Private Key للتوقيع، Public Key للتحقق (أكثر أماناً)
- **في المشروع**: HS256 كافي لأنه Server-to-Server فقط

**13. إيه اللي حصل لو مستخدم غيّر البيانات في JWT؟**
- **الـ Signature مش هتطابق** - `jwt.verify()` هيرمي error
- **الـ Token هيبقى invalid** - Request هيفشل مع 401 Unauthorized

**14. إزاي بتتعامل مع Token في Production؟**
- **JWT_SECRET**: محفوظ في Environment Variables
- **HTTPS**: كل الـ Requests عبر HTTPS لحماية Token من Interception
- **Allowed Origins**: CORS محدود لـ Frontend domains معينة

---

## 🌐 **Server & HTTP**

### 5. **Express** (`express`)
**الاستخدام**: Web framework لـ Node.js
**الغرض**: بناء RESTful APIs و Routing
**مثال الاستخدام**:
```javascript
const app = express();
app.get('/api/users', userController.getAllUsers);
app.post('/api/login', authController.login);
```
**الفائدة**: سريع وخفيف، دعم Middleware قوي

---

### 6. **CORS** (`cors`)
**الاستخدام**: Cross-Origin Resource Sharing middleware
**الغرض**: السماح لـ Frontend من domains مختلفة بالوصول للـ API
**مثال الاستخدام**:
```javascript
app.use(cors({
  origin: ['https://meetza-front-end.vercel.app'],
  credentials: true
}));
```
**الفائدة**: حل مشاكل CORS بين Frontend و Backend

---

### 7. **Axios** (`axios`)
**الاستخدام**: HTTP client لـ API calls
**الغرض**: إرسال Requests للـ External APIs
**مثال الاستخدام**:
```javascript
const response = await axios.get('https://api.example.com/data');
```
**الفائدة**: Promise-based، دعم Request/Response Interceptors

---

## 💾 **Database**

### 8. **MySQL2** (`mysql2`)
**الاستخدام**: MySQL driver لـ Node.js
**الغرض**: الاتصال بـ MySQL Database وتنفيذ Queries
**مثال الاستخدام**:
```javascript
const [rows] = await db.promise().query("SELECT * FROM user WHERE id = ?", [userId]);
```
**الفائدة**: دعم Async/Await و Prepared Statements للحماية من SQL Injection

---

## 📧 **Email & Notifications**

### 9. **Nodemailer** (`nodemailer`)
**الاستخدام**: إرسال Emails من Node.js
**الغرض**: إرسال Emails للتحقق والتذكيرات
**مثال الاستخدام**:
```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});
await transporter.sendMail({ to, subject, text });
```
**الفائدة**: دعم SMTP و Gmail OAuth

---

## 🔄 **Real-Time Communication**

### 10. **Socket.IO** (`socket.io`)
**الاستخدام**: Real-time bidirectional communication
**الغرض**: Chat في الوقت الفعلي و Notifications
**مثال الاستخدام**:
```javascript
io.on('connection', (socket) => {
  socket.on('send_message', (data) => {
    io.emit('new_message', data);
  });
});
```
**الفائدة**: WebSocket fallback تلقائي، دعم Rooms و Namespaces

---

## 📁 **File Upload & Storage**

### 11. **Multer** (`multer`)
**الاستخدام**: Middleware لمعالجة multipart/form-data
**الغرض**: رفع الملفات (صور، فيديوهات، مستندات)
**مثال الاستخدام**:
```javascript
const upload = multer({ dest: 'uploads/' });
app.post('/upload', upload.single('file'), controller.uploadFile);
```
**الفائدة**: Stream handling، دعم Memory و Disk storage

---

### 12. **Cloudinary** (`cloudinary`)
**الاستخدام**: Cloud service للـ Media management
**الغرض**: تخزين وتحسين الصور والفيديوهات
**مثال الاستخدام**:
```javascript
const result = await cloudinary.uploader.upload(filePath, {
  folder: "videos",
  resource_type: "video"
});
```
**الفائدة**: Image/Video transformations، CDN تلقائي، Optimization

---

## 🆔 **Utilities**

### 13. **UUID** (`uuid`)
**الاستخدام**: توليد Unique Identifiers
**الغرض**: إنشاء IDs فريدة للمستخدمين والموارد
**مثال الاستخدام**:
```javascript
const id = uuidv4(); // "550e8400-e29b-41d4-a716-446655440000"
```
**الفائدة**: ضمان عدم التكرار بدون Database checks

---

### 14. **Validator** (`validator`)
**الاستخدام**: Validating و Sanitizing strings
**الغرض**: التحقق من صحة Emails، URLs، وغيرها
**مثال الاستخدام**:
```javascript
if (!validator.isEmail(email)) {
  return res.status(400).json({ error: "Invalid email" });
}
```
**الفائدة**: تقليل الأخطاء في البيانات المدخلة

---

### 15. **Dotenv** (`dotenv`)
**الاستخدام**: إدارة Environment Variables
**الغرض**: تخزين Configuration الحساسة (API Keys, Secrets)
**مثال الاستخدام**:
```javascript
require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET;
```
**الأمان**: إبقاء Secrets خارج الكود

---

## 🔧 **Development Tools**

### 16. **Nodemon** (`nodemon`)
**الاستخدام**: Development tool لـ Auto-restart
**الغرض**: إعادة تشغيل الـ Server تلقائياً عند تغيير الكود
**الفائدة**: توفير الوقت في Development

---

## 📋 **ملخص الاستخدامات الرئيسية**

| المكتبة | الاستخدام الرئيسي | الملفات المستخدمة فيها |
|---------|-------------------|----------------------|
| **Express** | Web Server و API Routing | `server.js`, جميع الـ Routers |
| **Passport** | Social Authentication | `authController.js`, `config/passport.js` |
| **Socket.IO** | Real-time Chat | `sockets/chatSocket.js`, `server.js` |
| **MySQL2** | Database Operations | جميع الـ Controllers |
| **JWT** | Token Authentication | `authController.js`, Middleware |
| **bcrypt** | Password Hashing | `authController.js` |
| **Multer** | File Uploads | `utils/uploadFile.js` |
| **Cloudinary** | Media Storage | `utils/uploadFile.js`, `videoController.js` |
| **Nodemailer** | Email Sending | `authController.js`, `utils/sendEmail.js` |

---

## 🎯 **التكامل بين المكاتب**

### مثال: عملية Login كاملة
1. **bcrypt** → التحقق من كلمة المرور
2. **JWT** → إنشاء Token
3. **MySQL2** → جلب بيانات المستخدم
4. **Express** → إرجاع Response

### مثال: رفع فيديو
1. **Multer** → استقبال الملف
2. **Cloudinary** → رفع وتخزين الفيديو
3. **MySQL2** → حفظ الرابط في Database
4. **Socket.IO** → إرسال Notification للمستخدمين

---

## ⚠️ **ملاحظات أمان مهمة**

- **bcrypt**: استخدم `salt rounds >= 10` لكلمات المرور
- **JWT**: احفظ `JWT_SECRET` في Environment Variables
- **MySQL2**: استخدم Prepared Statements دائماً (منع SQL Injection)
- **Multer**: حدد أنواع الملفات المسموحة
- **CORS**: حدد Origins المسموحة في Production

---

## 📚 **مصادر التعلم**

- [Express.js Documentation](https://expressjs.com/)
- [Passport.js Documentation](http://www.passportjs.org/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [JWT.io](https://jwt.io/) - لفهم JSON Web Tokens
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

**آخر تحديث**: 2025
