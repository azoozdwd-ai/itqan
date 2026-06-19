/**
 * نظام تقييمات إتقان ويب — Google Apps Script
 *
 * خطوات النشر:
 * 1. افتح sheets.new وأنشئ جدول جديد
 * 2. سمّ الأعمدة بالترتيب: IP | التوكن | التاريخ | الاسم | التقييم | التعليق | الموقع | الحالة
 * 3. افتح Extensions → Apps Script
 * 4. احذف الكود الموجود والصق هذا الكود
 * 5. اضغط Deploy → New Web App
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. انسخ الرابط (Web App URL) وضعه في ملف index.html
 *    بدلاً من 'YOUR_WEB_APP_URL'
 *
 * الإشعارات:
 * - عند إضافة تقييم جديد يرسل إيميل لإشعارك
 * - افتح الشيت → غيّر الخانة "الحالة" من "pending" إلى "approved"
 *   ليظهر التقييم على الموقع
 * - إذا لم يصلك إيميل، تأكد من وضع بريدك في NOTIFY_EMAIL أدناه
 */

const SHEET_NAME = 'Sheet1';
// NOTIFY_EMAIL: اتركه فارغاً عشان يستخدم بريد حسابك اللي ناشر فيه.
// لو ما وصلك إشعار، ضع بريدك هنا صراحةً: 'example@gmail.com'
const NOTIFY_EMAIL = 'abdulazizdawod96@gmail.com';

// ---- GET: جلب التقييمات المعتمدة أو إضافة تقييم جديد (عبر data parameter) ----
function doGet(e) {
  // إذا كان req فيه data parameter فهذا طلب إضافة تقييم
  if (e.parameter && e.parameter.data) {
    return processReviewData(e.parameter.data);
  }
  
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const rows = data.slice(1);
    const approved = [];

    rows.forEach(function(row) {
      // col 7 = الحالة
      if (row[7] && row[7].toString().toLowerCase() === 'approved') {
        approved.push({
          name: row[3] || '',       // col 3 = الاسم
          rating: row[4] || 0,       // col 4 = التقييم
          comment: row[5] || '',     // col 5 = التعليق
          site: row[6] || '',        // col 6 = الموقع
          date: row[2] || ''         // col 2 = التاريخ
        });
      }
    });

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', reviews: approved }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ---- معالجة بيانات التقييم الجديد ----
function processReviewData(jsonStr) {
  try {
    const data = JSON.parse(jsonStr);

    // 1. Honeypot
    if (data.hp && data.hp !== '') {
      return error('تم رفض الطلب (spam)');
    }

    // 2. المحتوى
    if (!data.name || data.name.trim().length < 2 || data.name.length > 30) {
      return error('الاسم يجب أن يكون بين 2 و 30 حرفاً');
    }
    if (!data.rating || data.rating < 1 || data.rating > 5) {
      return error('التقييم يجب أن يكون بين 1 و 5');
    }
    if (data.comment && data.comment.length > 500) {
      return error('التعليق لا يزيد عن 500 حرف');
    }
    if (data.comment && /https?:\/\//i.test(data.comment)) {
      return error('التعليق لا يجب أن يحتوي على روابط');
    }
    if (data.site && data.site.length > 200) {
      return error('رابط الموقع طويل جداً');
    }

    // 4. Rate limit (100/IP/ساعة — مرتفع مؤقتاً للاختبار)
    var ip = data.ip || 'unknown';
    var cache = CacheService.getScriptCache();
    var cacheKey = 'rl_' + ip.replace(/[^a-f0-9.:]/g, '');
    var count = parseInt(cache.get(cacheKey)) || 0;
    if (count >= 100) {
      return error('لقد تجاوزت الحد المسموح من التقييمات، حاول لاحقاً');
    }
    cache.put(cacheKey, (count + 1).toString(), 3600);

    // 5. إضافة للشيت بحالة pending
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    var now = new Date();
    var dateStr = Utilities.formatDate(now, 'Asia/Kuwait', 'yyyy-MM-dd HH:mm');
    var token = Utilities.getUuid();

    sheet.appendRow([
      ip,                  // col A: IP
      token,               // col B: التوكن
      dateStr,             // col C: التاريخ
      data.name.trim(),    // col D: الاسم
      parseInt(data.rating), // col E: التقييم
      data.comment ? data.comment.trim() : '', // col F: التعليق
      data.site ? data.site.trim() : '',       // col G: الموقع
      'pending'            // col H: الحالة
    ]);

    // 6. إشعار إيميل
    sendNotification(data, dateStr, sheet.getParent().getUrl());

    return ok({ message: 'تم استلام تقييمك، سيظهر بعد المراجعة', token: token });
  } catch (err) {
    return error(err.toString());
  }
}

// ---- POST: إضافة تقييم جديد (يدعم JSON body أو form-data) ----
function doPost(e) {
  try {
    var rawData = e.postData && e.postData.contents ? e.postData.contents : (e.parameter && e.parameter.data ? e.parameter.data : null);
    if (!rawData) {
      return error('لا توجد بيانات');
    }
    return processReviewData(rawData);
  } catch (err) {
    return error(err.toString());
  }
}

// ---- إرسال إشعار للمالك ----
function sendNotification(data, dateStr, sheetUrl) {
  try {
    // Session.getScriptUser().getEmail() هو الأكثر ثباتاً لمشرف السكريبت
    var toEmail = NOTIFY_EMAIL || Session.getScriptUser().getEmail();

    if (!toEmail) {
      console.error('لا يوجد بريد للإشعار');
      return;
    }

    var stars = '';
    for (var i = 0; i < 5; i++) {
      stars += i < parseInt(data.rating) ? '⭐' : '☆';
    }

    var commentText = data.comment ? data.comment.trim() : '(بدون تعليق)';
    var siteText = data.site ? data.site.trim() : '(بدون رابط)';

    var subject = '🔔 تقييم جديد في إتقان ويب — ' + data.name.trim() + ' (' + data.rating + '/5)';

    var body =
      '📋 تقييم جديد بانتظار المراجعة\n' +
      '──────────────────────────\n\n' +
      '👤 الاسم: ' + data.name.trim() + '\n' +
      '⭐ التقييم: ' + data.rating + '/5 ' + stars + '\n' +
      '💬 التعليق: ' + commentText + '\n' +
      '🔗 الموقع: ' + siteText + '\n' +
      '📅 التاريخ: ' + dateStr + '\n' +
      '🌐 IP: ' + (data.ip || 'غير معروف') + '\n\n' +
      'للموافقة على التقييم:\n' +
      '1. افتح الشيت: ' + sheetUrl + '\n' +
      '2. غيّر الخانة "الحالة" من "pending" إلى "approved"\n' +
      '3. سيظهر التقييم على الموقع تلقائياً\n\n' +
      '——————————————\n' +
      'إتقان ويب — نظام التقييمات';

    MailApp.sendEmail(toEmail, subject, body);
  } catch (err) {
    console.error('فشل إرسال الإيميل: ' + err.toString());
  }
}

// ---- دوال مساعدة ----
function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify(Object.assign({ status: 'ok' }, data)))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
