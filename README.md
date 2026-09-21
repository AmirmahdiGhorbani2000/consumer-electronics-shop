# ConsumerElectronics Shop

فروشگاه اینترنتی لوازم الکترونیکی مصرفی. یک پروژه فول‌استک با تمرکز بر معماری تمیز، امنیت و مقیاس‌پذیری.

## نمای کلی

پلتفرم فروشگاهی برای دسته‌بندی محصولات الکترونیکی شامل موبایل، لپ‌تاپ، تلویزیون، تجهیزات صوتی، دوربین و کنسول بازی. سیستم شامل احراز هویت مبتنی بر JWT، مدیریت محصولات، سبد خرید، پردازش سفارش و اتصال به درگاه پرداخت زرین‌پال است.

## معماری

پروژه از معماری تک‌مخزنی (Monorepo) با تفکیک واضح میان کلاینت و سرور استفاده می‌کند.

```

server/
  index.js          مسیر اصلی، روترها، میان‌افزارها
  db.js             اتصال و مدیریت MongoDB
  zarinpal.js       لایه ارتباط با درگاه پرداخت
client/
  index.html        نقطه ورود SPA
  src/
    app.jsx       کامپوننت‌های اصلی
    api.jsx       لایه ارتباط با API
    style.css     استایل‌های سراسری
.env                  متغیرهای محیطی
package.json          وابستگی‌ها و اسکریپت‌ها
README.md              مستندات
LICENSE                لایسنس 
```

## پشته فنی

### بک‌اند
- Node.js 18+ و Express 4
- MongoDB 8 با Mongoose
- JWT برای احراز هویت
- Bcrypt برای هش رمز عبور
- Helmet و rate-limit برای امنیت
- Axios برای ارتباط با درگاه پرداخت

### فرانت‌اند
- React 18
- React DOM Client (Concurrent Mode)
- Fetch API
- CSS Variables و Grid

## قابلیت‌ها

- احراز هویت با نقش‌های user و admin
- مدیریت محصولات (CRUD)
- جستجو و فیلتر بر اساس دسته‌بندی
- سبد خرید سمت کلاینت با persistence در حافظه
- ایجاد سفارش و پرداخت آنلاین با زرین‌پال
- پنل ادمین برای افزودن و حذف محصولات
- طراحی واکنش‌گرا (موبایل، تبلت، دسکتاپ)
- راست‌به‌چپ با پشتیبانی فارسی
- سئو پایه شامل meta tags و Open Graph
- محافظت از مسیرها با میان‌افزار auth و adminOnly
- مدیریت خطا با redirect به صفحات failure

## نصب و راه‌اندازی

### پیش‌نیازها
- Node.js نسخه 18 یا بالاتر
- MongoDB در حال اجرا روی localhost:27017
- حساب کاربری زرین‌پال برای حالت واقعی پرداخت

### مراحل

```bash
git clone https://github.com/AmirmahdiGhorbani2000/consumer-electronics-shop.git
cd consumer-electronics-shop
npm install
cp .env.example .env
npm run dev
```

سرور روی پورت 3000 قابل دسترسی خواهد بود. کلاینت از مسیر ریشه سرو می‌شود.

### اجرای محیط توسعه

```bash
npm run dev          اجرای سرور با nodemon
npm run client       اجرای کلاینت React در حالت توسعه
npm run test         اجرای تست‌ها با پوشش
npm run lint         بررسی کیفیت کد
npm run seed         پر کردن دیتابیس با داده اولیه
```

## احراز هویت

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

## محصولات

- GET /api/products
- GET /api/products/:id
- POST /api/products (admin)
- PUT /api/products/:id (admin)
- DELETE /api/products/:id (admin)

## سفارشات

- POST /api/orders
- GET /api/orders/my
- GET /api/orders (admin)

## پرداخت

- POST /api/payment/request/:orderId
- GET /api/payment/verify

**عمومی**

- GET /api/health

## امنیت

- هش رمز عبور با bcrypt و 10 دور نمک
- توکن JWT با انقضا محدود
- محافظت از هدرها با Helmet
- محدودسازی نرخ درخواست (120 درخواست در دقیقه)
- اعتبارسنجی ورودی‌ها در سطح مدل
- جداسازی نقش‌ها با میان‌افزار adminOnly

## بهینه‌سازی

- ایندکس خودکار MongoDB
- اتصال Pool با اندازه پیکربندی‌شده
- استفاده از useMemo و useCallback در React
- تمیزکاری setTimeout در کامپوننت‌ها
- بازگشت خودکار پس از قطع اتصال دیتابیس

## تست

پروژه از Jest برای تست استفاده می‌کند. پوشش هدف 95 درصد برای مسیرهای حیاتی.

```bash
npm run test
```

## ساختار دیتابیس

### User

- name, email, password, role, cart

### Product

- title, brand, category, price, stock, image, description, rating

### Order

- userId, items, total, status, authority, refId

## لایسنس
GNU General Public License v3.0 

## حمایت
اگر این پروژه رو دوست داشتید لطفا ستاره بدید!





