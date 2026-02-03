# 🔐 شرح تفصيلي لنظام Authentication في Meetza Backend

---

## 📋 **جدول المحتويات**

1. [نظرة عامة على النظام](#نظرة-عامة)
2. [تسجيل المستخدمين (Registration)](#1-تسجيل-المستخدمين-registration)
3. [تسجيل الدخول (Login)](#2-تسجيل-الدخول-login)
4. [التحقق من البريد الإلكتروني (Email Verification)](#3-التحقق-من-البريد-الإلكتروني)
5. [استعادة كلمة المرور (Password Reset)](#4-استعادة-كلمة-المرور)
6. [المصادقة الاجتماعية (Social Authentication)](#5-المصادقة-الاجتماعية)
7. [JWT Tokens](#6-jwt-tokens)
8. [Middleware - التحقق من الـ Token](#7-middleware-verifytoken)

---

## 🎯 **نظرة عامة على النظام**

نظام Authentication في Meetza يستخدم:
- **bcrypt** لتشفير كلمات المرور
- **JWT** للمصادقة بدون State
- **Passport.js** للمصادقة الاجتماعية (Google OAuth)
- **Nodemailer** لإرسال Emails للتحقق
- **Email Verification** بنظام 4-digit codes

---

## 1️⃣ **تسجيل المستخدمين (Registration)**

### **الخطوات التفصيلية:**

#### **أ) التحقق من البيانات المدخلة (Validation)**
```javascript
const { name, email, password, role } = req.body;

// التحقق من وجود جميع الحقول المطلوبة
if (!name || !password || !role || !email) {
  return res.status(400).json({
    success: false,
    message: "One or more fields are required"
  });
}
```
**الهدف**: التأكد من وجود جميع البيانات المطلوبة قبل المعالجة

---

#### **ب) التحقق من عدم وجود Email مكرر**
```javascript
const [rows] = await db.promise().query(
  "SELECT email FROM user WHERE email = ?", 
  [email]
);

if (rows.length > 0) {
  return res.status(400).json({
    success: false,
    message: "Email already exists"
  });
}
```
**الهدف**: منع إنشاء حسابات مكررة بنفس البريد الإلكتروني

---

#### **ج) توليد كود التحقق (Verification Code)**
```javascript
const verificationCode = Math.floor(1000 + Math.random() * 9000);
```
**الآلية**:
- توليد رقم عشوائي من 4 أرقام (1000-9999)
- يتم حفظه في Database مع المستخدم

---

#### **د) إنشاء المستخدم في Database**
```javascript
await userController.createUser({
  body: {
    name, email, password, role,
    verification_code: verificationCode,
    email_verification: false  // غير مفعّل حتى يتم التحقق
  }
});
```
**الآلية**:
- يتم Hash كلمة المرور باستخدام bcrypt (10 rounds)
- `email_verification: false` - الحساب غير مفعّل
- `verification_code` - الكود محفوظ للتحقق

---

#### **هـ) إرسال Email التحقق**
```javascript
sendVerificationEmail(email, verificationCode, message)
  .then(() => {
    // نجح الإرسال - إرجاع success response
  })
  .catch(async (emailError) => {
    // فشل الإرسال - حذف المستخدم من Database
    await db.promise().query("DELETE FROM user WHERE email = ?", [email]);
  });
```
**آلية الأمان**:
- إذا فشل إرسال Email، يتم حذف المستخدم
- يمنع إنشاء حسابات بدون إمكانية التحقق

---

## 2️⃣ **تسجيل الدخول (Login)**

### **الخطوات التفصيلية:**

#### **أ) التحقق من البيانات والـ reCAPTCHA**
```javascript
const { email, password, remember_me, role, from, captchaToken } = req.body;

// التحقق من الحقول المطلوبة
if (!email || !password || !role) {
  return res.status(400).json({
    success: false,
    message: "Email, password, and role are required"
  });
}
```
**الهدف**: التحقق من البيانات الأساسية

---

#### **ب) التحقق من reCAPTCHA (اختياري)**
```javascript
if (captchaToken) {
  const response = await axios.post(
    "https://www.google.com/recaptcha/api/siteverify",
    null,
    {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: captchaToken
      }
    }
  );

  const { success, score } = response.data;

  if (!success || (score !== undefined && score < 0.5)) {
    return res.status(400).json({
      success: false,
      message: "CAPTCHA verification failed"
    });
  }
}
```
**الهدف**: منع Bot attacks و Spam
**reCAPTCHA v3**: يعطي score من 0-1 (كلما كان أقرب لـ 1 = إنسان أكثر)

---

#### **ج) البحث عن المستخدم**
```javascript
const [rows] = await db.promise().query(
  "SELECT * FROM user WHERE email = ?", 
  [email]
);

if (rows.length === 0) {
  return res.status(401).json({
    success: false,
    message: "Invalid email or password"  // لا تكشف إن Email موجود أو لا
  });
}
```
**أمان**: الرسالة عامة - لا تكشف إن Email موجود أم لا

---

#### **د) التحقق من Role**
```javascript
if (user.role !== role) {
  return res.status(401).json({
    success: false,
    message: "Invalid role for this user"
  });
}
```
**الهدف**: التأكد من أن المستخدم يحاول الدخول بالـ Role الصحيح

---

#### **هـ) التحقق من Email Verification**
```javascript
if (!user.email_verification) {
  return res.status(403).json({
    success: false,
    message: "Please verify your email before logging in"
  });
}
```
**الأمان**: منع الوصول قبل التحقق من البريد الإلكتروني

---

#### **و) التحقق من Dashboard Access**
```javascript
if (from === "dashboard" && 
    user.role !== "Administrator" && 
    user.role !== "Super_Admin") {
  return res.status(403).json({
    success: false,
    message: "Access denied. Administrators only."
  });
}
```
**الهدف**: حماية Dashboard - فقط Admins يقدروا يدخلوا

---

#### **ز) التحقق من كلمة المرور**
```javascript
const validPassword = await bcrypt.compare(password, user.password);

if (!validPassword) {
  return res.status(401).json({
    success: false,
    message: "Invalid email or password"
  });
}
```
**الآلية**:
- `bcrypt.compare()` يقارن كلمة المرور المدخلة مع الـ Hash المحفوظ
- الـ Hash لا يمكن عكسه - فقط المقارنة ممكنة

---

#### **ح) إنشاء JWT Token**
```javascript
const token = jwt.sign(
  {
    id: user.id,
    email: user.email,
  },
  process.env.JWT_SECRET,
  { expiresIn: remember_me === "true" ? "4d" : "24h" }
);
```
**المكونات**:
- **Payload**: `id` و `email` - البيانات المحفوظة في الـ Token
- **Secret**: `JWT_SECRET` - للتوقيع (يجب أن يكون سري)
- **ExpiresIn**: 
  - `remember_me = true` → Token صالح لمدة 4 أيام
  - `remember_me = false` → Token صالح لمدة 24 ساعة

---

## 3️⃣ **التحقق من البريد الإلكتروني (Email Verification)**

### **الخطوات:**

#### **أ) التحقق من البيانات**
```javascript
const { code, email } = req.body;

if (!code || !email) {
  return res.status(400).json({
    success: false,
    message: "Verification code & Email is required"
  });
}
```

---

#### **ب) البحث عن المستخدم بالكود**
```javascript
const [rows] = await db.promise().query(
  "SELECT * FROM user WHERE verification_code = ? AND email_verification = false AND email = ?",
  [code, email]
);

if (rows.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid or expired verification code"
  });
}
```
**الشروط**:
- الكود صحيح
- Email غير مفعّل (`email_verification = false`)
- Email يطابق

---

#### **ج) تفعيل الحساب**
```javascript
await db.promise().query(
  "UPDATE user SET email_verification = true, verification_code = NULL WHERE email = ?",
  [user.email]
);
```
**الإجراءات**:
- `email_verification = true` - تفعيل الحساب
- `verification_code = NULL` - حذف الكود بعد الاستخدام

---

## 4️⃣ **استعادة كلمة المرور (Password Reset)**

### **المراحل الثلاث:**

### **المرحلة 1: طلب إعادة التعيين (Forgot Password)**
```javascript
// 1. التحقق من وجود Email
const [rows] = await db.promise().query(
  "SELECT * FROM user WHERE email = ?", 
  [email]
);

// 2. توليد Reset Code
const resetCode = Math.floor(1000 + Math.random() * 9000);

// 3. حفظ الكود في Database
await db.promise().query(
  "UPDATE user SET verification_code = ? WHERE email = ?",
  [resetCode, email]
);

// 4. إرسال Email بالكود
await sendVerificationEmail(email, resetCode, message);
```

---

### **المرحلة 2: التحقق من الكود (Verify Code)**
```javascript
// التحقق من الكود والـ Email
const [rows] = await db.promise().query(
  "SELECT * FROM user WHERE verification_code = ? AND email = ?",
  [code, email]
);

if (rows.length === 0) {
  return res.status(400).json({
    success: false,
    message: "Invalid or expired verification code"
  });
}

// حذف الكود بعد التحقق
await db.promise().query(
  "UPDATE user SET verification_code = NULL WHERE email = ?",
  [user.email]
);
```
**الهدف**: التأكد من أن المستخدم لديه وصول للبريد الإلكتروني

---

### **المرحلة 3: تغيير كلمة المرور (Reset Password)**
```javascript
const { is_verifyed, email, new_password } = req.body;

if (is_verifyed === "true") {
  // 1. البحث عن المستخدم
  const [rows] = await db.promise().query(
    "SELECT * FROM user WHERE email = ?", 
    [email]
  );

  // 2. Hash كلمة المرور الجديدة
  const hashedPassword = await bcrypt.hash(new_password, 10);

  // 3. تحديث كلمة المرور
  await db.promise().query(
    "UPDATE user SET password = ? WHERE email = ?",
    [hashedPassword, user.email]
  );
}
```
**الأمان**:
- التحقق من `is_verifyed` - يجب أن يكون تم التحقق أولاً
- Hash كلمة المرور الجديدة قبل الحفظ

---

## 5️⃣ **المصادقة الاجتماعية (Social Authentication)**

### **المكونات:**

#### **أ) Passport Configuration** (`config/passport.js`)
```javascript
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.CALLBACK_URL,
      passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
      return done(null, profile);  // يرجع Profile للـ Callback
    }
  )
);
```
**الآلية**: Passport يتعامل مع OAuth Flow ويرجع Profile

---

#### **ب) بدء عملية OAuth** (`socialAuth`)
```javascript
exports.socialAuth = (req, res, next) => {
  const role = req.query.role || "Member";
  const redirect = req.query.redirect || "http://localhost:3000/home";
  const type = req.query.type || "signin";

  // التحقق من Role
  if (!["Member", "Administrator", "Super_Admin"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role specified"
    });
  }

  // التحقق من Type
  if (!["signin", "signup"].includes(type)) {
    return res.status(400).json({
      success: false,
      message: "Invalid type specified"
    });
  }

  // التحقق من Redirect URL
  try {
    new URL(redirect);
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid redirect URL format"
    });
  }

  // حفظ البيانات في State (يتم تمريرها عبر OAuth)
  const state = JSON.stringify({ role, redirect, type });

  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
    state
  })(req, res, next);
};
```

**الآلية**:
- `state` - يتم تمريره عبر OAuth Flow للاحتفاظ بالبيانات
- `scope: ["email", "profile"]` - نطلب Email و Profile من Google
- `session: false` - لا نستخدم Sessions (JWT بدلاً منها)

---

#### **ج) OAuth Callback** (`socialAuthCallback`)

**الخطوات:**

**1. Parse State**
```javascript
let stateObj = {};
if (req.query.state) {
  stateObj = JSON.parse(req.query.state);
  redirectUrl = stateObj.redirect || "http://localhost:3000/home";
  type = stateObj.type || "signin";
  role = stateObj.role || "Member";
}
```

**2. استخراج البيانات من Google Profile**
```javascript
const email = profile._json?.email || profile.emails?.[0]?.value;
const providerId = profile.id;
const name = profile.displayName || profile._json?.name || 
             (profile.name?.givenName && profile.name?.familyName 
              ? `${profile.name.givenName} ${profile.name.familyName}` 
              : null);
```

**3. Signin Flow** (إذا كان `type === "signin"`)
```javascript
// أ) البحث عن Social Auth Link
const [linked] = await db.promise().query(
  "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ?",
  ["google", providerId]
);

if (linked.length === 0) {
  // Link غير موجود - البحث عن User بالـ Email
  const [existing] = await db.promise().query(
    "SELECT * FROM user WHERE email = ?", 
    [email]
  );
  
  if (existing.length === 0) {
    // User غير موجود - يطلب Signup
    return redirectWithError("user_not_found", ...);
  }

  // User موجود - إنشاء Link جديد
  await social_authController.createSocialAuth({
    user_id: dbUser.id,
    provider: "google",
    provider_id: providerId
  });

  // تفعيل Email (Google emails موثوقة)
  await db.promise().query(
    "UPDATE user SET email_verification = true, verification_code = NULL WHERE id = ?",
    [dbUser.id]
  );
} else {
  // Link موجود - جلب User
  const [users] = await db.promise().query(
    "SELECT * FROM user WHERE id = ?", 
    [linked[0].user_id]
  );
  dbUser = users[0];
}

// التحقق من Role Match
if (dbUser.role !== role) {
  return redirectWithError("role_mismatch", ...);
}
```

**4. Signup Flow** (إذا كان `type === "signup"`)
```javascript
// أ) التحقق من عدم وجود Link
const [linked] = await db.promise().query(
  "SELECT * FROM social_auth WHERE provider = ? AND provider_id = ?",
  ["google", providerId]
);

if (linked.length > 0) {
  return redirectWithError("already_linked", ...);
}

// ب) التحقق من عدم وجود Email
const [existing] = await db.promise().query(
  "SELECT * FROM user WHERE email = ?", 
  [email]
);

if (existing.length > 0) {
  return redirectWithError("email_exists", ...);
}

// ج) إنشاء User جديد
const newId = uuidv4();
const randomPassword = uuidv4();  // كلمة مرور عشوائية
const hashedPassword = await bcrypt.hash(randomPassword, 10);

await db.promise().query(
  `INSERT INTO user (id, name, email, password, role, email_verification, verification_code) 
   VALUES (?, ?, ?, ?, ?, true, NULL)`,
  [newId, name, email, hashedPassword, role]
);

// د) إنشاء Role-specific record
if (role === "Administrator" || role === "Super_Admin") {
  await db.promise().query(
    "INSERT INTO administrator (user_id, role) VALUES (?, ?)", 
    [newId, role]
  );
} else if (role === "Member") {
  await db.promise().query(
    "INSERT INTO member (user_id) VALUES (?)", 
    [newId]
  );
}

// هـ) إنشاء Social Auth Link
await social_authController.createSocialAuth({
  user_id: newId,
  provider: "google",
  provider_id: providerId
});
```

**5. معالجة الأخطاء** (`redirectWithError`)
```javascript
function redirectWithError(errorCode, errorMessage, res, type = "signin", redirect) {
  const baseUrl = redirect.includes("https://meetza-front-end.vercel.app") 
    ? "https://meetza-front-end.vercel.app" 
    : "https://meetza-front-end-admin.vercel.app";
  
  const redirectPath = type == "signin" ? "/login" : "/signup";
  const separator = redirect.includes("?") ? "&" : "?";
  
  return res.redirect(
    `${baseUrl}${redirectPath}${separator}error=${errorCode}&error_message=${encodeURIComponent(errorMessage)}&redirect_url=${redirect}&type=${type}`
  );
}
```
**الآلية**:
- جميع الأخطاء تروح لصفحة Login/Signup
- Error code و message في URL parameters
- Frontend يقرأها ويعرضها للمستخدم

---

#### **د) نجاح Authentication** (`proceedWithUser`)
```javascript
function proceedWithUser(user, redirectUrl, res) {
  // 1. إنشاء Safe User Object (بدون password)
  const safeUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    email_verification: user.email_verification,
    user_photo: user.user_photo,
    created_at: user.created_at,
    updated_at: user.updated_at
  };

  // 2. إنشاء JWT Token
  const tokenPayload = { id: user.id, email: user.email, role: user.role };
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "24h" });

  // 3. التحقق من Allowed Origins
  const allowedOrigins = [
    "https://meetza-front-end.vercel.app",
    "https://meetza-front-end-admin.vercel.app",
    "http://localhost:3000"
  ];

  // 4. إضافة Token و User للـ URL
  const url = new URL(redirectUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("user", encodeURIComponent(JSON.stringify(safeUser)));

  // 5. Redirect للـ Frontend
  return res.redirect(url.toString());
}
```

---

## 6️⃣ **JWT Tokens**

### **البنية:**

#### **Token Structure**
```
Header.Payload.Signature
```

**1. Header:**
```json
{
  "alg": "HS256",
  "typ": "JWT"
}
```

**2. Payload:**
```json
{
  "id": "user-uuid",
  "email": "user@example.com",
  "role": "Member",
  "iat": 1234567890,  // Issued At
  "exp": 1234654290   // Expiration
}
```

**3. Signature:**
```
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

---

### **مزايا JWT:**
- ✅ **Stateless** - لا يحتاج Server-side Sessions
- ✅ **Scalable** - يمكن استخدامه مع Multiple Servers
- ✅ **Self-contained** - يحمل البيانات في نفسه
- ✅ **Secure** - موقّع ولا يمكن التلاعب به

---

## 7️⃣ **Middleware - التحقق من الـ Token** (`verifyToken`)

### **الآلية:**

```javascript
exports.verifyToken = (req, res, next) => {
  try {
    // 1. استخراج Token من Header
    const token = req.headers.authorization?.split(" ")[1];
    // Format: "Bearer <token>"

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided"
      });
    }

    // 2. التحقق من صحة Token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // إذا كان Token غير صالح أو منتهي → throw error

    // 3. جلب بيانات المستخدم من Database
    db.query("SELECT * FROM user WHERE id = ?", [decoded.id], (err, rows) => {
      if (err) return res.status(400).json({ error: err });
      
      // 4. إضافة User للـ Request
      req.user = rows[0];
      next();  // الانتقال للـ Next Middleware/Controller
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid token",
      error: error.message
    });
  }
};
```

### **الاستخدام:**
```javascript
router.get('/protected-route', verifyToken, controller.getData);
```

**الآلية**:
- إذا كان Token صالح → `req.user` يحتوي على بيانات المستخدم
- إذا كان Token غير صالح/منتهي → 401 Unauthorized

---

## 🔒 **آليات الأمان المستخدمة**

### **1. Password Hashing (bcrypt)**
- **10 Salt Rounds** - يعمل 2^10 = 1024 iterations
- **One-way** - لا يمكن عكس Hash
- **Salt** - كل Hash له Salt فريد

### **2. Email Verification**
- **4-digit Codes** - أسهل للمستخدمين من Long URLs
- **One-time Use** - الكود يتم حذفه بعد الاستخدام
- **Time-based** - يمكن إضافة Expiration (24 hours)

### **3. JWT Security**
- **Secret Key** - محفوظ في Environment Variables
- **Expiration** - Tokens منتهية تلقائياً
- **Signature Verification** - لا يمكن التلاعب بالـ Token

### **4. reCAPTCHA**
- **v3** - Invisible verification
- **Score-based** - يقيّم احتمالية أن يكون المستخدم Bot
- **Rate Limiting** - يقلل Brute Force attacks

### **5. Input Validation**
- **SQL Injection Protection** - Prepared Statements
- **XSS Protection** - Sanitization
- **Role-based Access Control** - التحقق من الصلاحيات

---

## 📊 **Flow Charts**

### **Registration Flow:**
```
User → Frontend → Backend (Register)
  → Check Email Exists
  → Generate Verification Code
  → Hash Password
  → Create User (email_verification = false)
  → Send Email
  → Success Response
```

### **Login Flow:**
```
User → Frontend → Backend (Login)
  → Validate reCAPTCHA (optional)
  → Check User Exists
  → Check Role Match
  → Check Email Verified
  → Check Dashboard Access (if from=dashboard)
  → Verify Password (bcrypt.compare)
  → Generate JWT Token
  → Return Token + User
```

### **OAuth Flow:**
```
User → Frontend → Backend (socialAuth)
  → Redirect to Google
  → User Authorizes
  → Google Redirects to Callback
  → Backend (socialAuthCallback)
    → Parse State
    → Extract Profile Data
    → Check Signin/Signup Flow
    → Create/Link User
    → Generate JWT
    → Redirect with Token
```

---

## 🎯 **نقاط مهمة للعرض**

1. **Multi-layer Security**: bcrypt + JWT + Email Verification + reCAPTCHA
2. **Social Auth Integration**: Seamless Google OAuth
3. **Password Reset Flow**: 3-step secure process
4. **Error Handling**: Comprehensive error messages
5. **Stateless Authentication**: JWT-based (scalable)

---

**آخر تحديث**: 2025
