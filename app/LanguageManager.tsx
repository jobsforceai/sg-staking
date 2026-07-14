"use client";

import { useEffect, useLayoutEffect, useState } from "react";

type Language = "ar" | "en";

const ar: Record<string, string> = {
  "How it works": "كيف يعمل",
  "Why SGC": "لماذا SGC",
  "Safety": "الأمان",
  "Sign in": "تسجيل الدخول",
  "Dashboard": "لوحة التحكم",
  "SGCHAIN · SGCOIN": "SGCHAIN · SGCOIN",
  "Three paths.": "ثلاثة مسارات.",
  "One clear journey.": "رحلة واحدة واضحة.",
  "Choose the route that matches where your funds are today—from Sagenex, through an assisted offline deposit, or directly on SGChain.": "اختر المسار الذي يناسب موقع أموالك اليوم — من Sagenex، أو عبر إيداع بمساعدة فريقنا، أو مباشرة على SGChain.",
  "Create staking account": "إنشاء حساب التخزين",
  "Go directly to SGChain": "الانتقال مباشرة إلى SGChain",
  "Sagenex transfer": "تحويل Sagenex",
  "Offline assisted": "بمساعدة فريقنا",
  "SGChain direct": "مباشرة عبر SGChain",
  "Account": "الحساب",
  "Verified": "موثّق",
  "Order status": "حالة الطلب",
  "Confirmed": "مؤكد",
  "SGC coin price": "سعر عملة SGC",
  "Fetched from SGChain": "مباشر من SGChain",
  "Ready": "جاهز",
  "Loading": "جارٍ التحميل",
  "Syncing": "جارٍ التحديث",
  "LIVE": "مباشر",
  "AFTER YOU JOIN": "بعد الانضمام",
  "One position.": "رصيد واحد.",
  "Every step visible.": "كل خطوة واضحة.",
  "From activation through an eligible interest withdrawal, your Sagenex Staking account keeps the full journey in one clear timeline.": "من التفعيل وحتى سحب العوائد المؤهلة، يعرض حساب Sagenex Staking رحلتك كاملة ضمن مسار زمني واضح.",
  "Activate": "تفعيل",
  "Redeem a valid coupon or submit a supported crypto deposit.": "استخدم قسيمة صالحة أو قدّم إيداعاً بالعملات الرقمية المدعومة.",
  "Verify": "تحقق",
  "Coupon stakes activate directly; deposit proofs enter administrator review.": "تتفعّل القسائم مباشرة، بينما تخضع إثباتات الإيداع لمراجعة الإدارة.",
  "Accrue": "تراكم",
  "Your dashboard tracks interest through each 30-day cycle.": "تتابع لوحة التحكم العوائد خلال كل دورة مدتها 30 يوماً.",
  "Request": "طلب",
  "Choose an eligible cash or USDT interest-withdrawal route.": "اختر سحب العوائد المؤهلة نقداً أو عبر USDT.",
  "Review": "مراجعة",
  "Follow the request from pending review to its final status.": "تابع الطلب من مرحلة المراجعة وحتى القرار النهائي.",
  "CHOOSE YOUR ENTRY POINT": "اختر نقطة البداية",
  "Pick the route that fits.": "اختر المسار الأنسب لك.",
  "Start with where your funds are today. Each route follows four clear actions from entry to confirmation.": "ابدأ من مكان أموالك اليوم. يتكون كل مسار من أربع خطوات واضحة حتى التأكيد.",
  "FROM YOUR SAGENEX BALANCE": "من رصيد SAGENEX",
  "Move available Sagenex wallet value into SGChain with a short-lived transfer code.": "حوّل الرصيد المتاح في محفظة Sagenex إلى SGChain باستخدام رمز تحويل مؤقت.",
  "Temporarily paused": "متوقف مؤقتاً",
  "Open Wallet": "افتح المحفظة",
  "Sign in to Sagenex and check your available balance.": "سجّل الدخول إلى Sagenex وتحقق من رصيدك المتاح.",
  "Enter amount": "أدخل المبلغ",
  "Choose Transfer to SGChain and enter an amount within your balance.": "اختر التحويل إلى SGChain وأدخل مبلغاً ضمن رصيدك.",
  "Get a code": "احصل على الرمز",
  "Sagenex creates a secure transfer code valid for five minutes.": "ينشئ Sagenex رمز تحويل آمناً صالحاً لمدة خمس دقائق.",
  "Redeem on SGChain": "استخدمه على SGChain",
  "Paste the code in SGChain; redemption debits Sagenex and posts the transfer.": "ألصق الرمز في SGChain لإتمام الخصم وتسجيل التحويل.",
  "SGChain redeems transfer code": "استخدام رمز التحويل على SGChain",
  "COLLECTOR + SUPER ADMIN": "المحصّل + الإدارة العليا",
  "Pay through an authorized collector and let the operations team record and verify your deposit.": "ادفع عبر محصّل معتمد ليقوم فريق العمليات بتسجيل الإيداع والتحقق منه.",
  "Manual review": "مراجعة يدوية",
  "Share User ID": "شارك معرّف المستخدم",
  "Give the collector the Sagenex user ID that should receive the activation.": "زوّد المحصّل بمعرّف مستخدم Sagenex المراد تفعيله.",
  "Pay offline": "ادفع خارج المنصة",
  "Use cash, UPI, or bank transfer and retain the reference or payment proof.": "استخدم النقد أو التحويل البنكي واحتفظ بمرجع الدفع أو الإثبات.",
  "Collector records": "تسجيل المحصّل",
  "The collector submits INR amount, method, reference, proof, and plan data.": "يسجّل المحصّل المبلغ وطريقة الدفع والمرجع والإثبات وبيانات الخطة.",
  "Admin verifies": "تحقق الإدارة",
  "A super admin reviews the pending record, selects the ROI plan, and approves or rejects it.": "تراجع الإدارة العليا السجل وتختار الخطة ثم توافق عليه أو ترفضه.",
  "Package activation posted": "تم تسجيل تفعيل الباقة",
  "BUY ON THE OFFICIAL PLATFORM": "الشراء من المنصة الرسمية",
  "Direct on SGChain": "مباشرة على SGChain",
  "Create or access your SGChain account and complete the coin order directly on the platform.": "أنشئ حساب SGChain أو افتحه وأكمل طلب العملة مباشرة على المنصة.",
  "Direct route": "مسار مباشر",
  "Create account": "إنشاء حساب",
  "Register or sign in at the official SGChain website.": "سجّل أو ادخل عبر موقع SGChain الرسمي.",
  "Verify account": "توثيق الحساب",
  "Complete any identity or security checks shown for your account.": "أكمل متطلبات الهوية أو الأمان الظاهرة في حسابك.",
  "Choose Buy SGC": "اختر شراء SGC",
  "Enter the amount and use a funding option available in your region.": "أدخل المبلغ واختر وسيلة التمويل المتاحة في منطقتك.",
  "Review & confirm": "راجع وأكد",
  "Check the quote, fees, and final amount before confirming the order.": "راجع السعر والرسوم والمبلغ النهائي قبل تأكيد الطلب.",
  "SGC visible in SGChain wallet": "ظهور SGC في محفظة SGChain",
  "FASTEST ACTIVE COIN ROUTE": "أسرع مسار متاح",
  "Buy directly on the official SGChain platform.": "اشترِ مباشرة من منصة SGChain الرسمية.",
  "Create an account or sign in, review the live options available to you, and confirm there.": "أنشئ حساباً أو سجّل الدخول، راجع الخيارات المتاحة، ثم أكد العملية.",
  "Open SGChain": "فتح SGChain",
  "YOUR MEMBER DASHBOARD": "لوحة تحكم العضو",
  "Clarity after every activation.": "وضوح كامل بعد كل تفعيل.",
  "See your staked value, SGC position, accrued interest, eligible withdrawal balance, and review history without switching between systems.": "شاهد قيمة التخزين ورصيد SGC والعوائد المتراكمة والرصيد المؤهل للسحب وسجل المراجعات في مكان واحد.",
  "Live totals returned by your authenticated account": "إجماليات مباشرة من حسابك الموثّق",
  "Cash and USDT availability shown separately": "عرض النقد وUSDT بشكل منفصل",
  "Stake and withdrawal status history": "سجل حالات التخزين والسحب",
  "Create an account": "إنشاء حساب",
  "Portfolio overview": "نظرة عامة على المحفظة",
  "LIVE ACCOUNT DATA": "بيانات الحساب المباشرة",
  "TOTAL STAKED": "إجمالي التخزين",
  "Principal locked": "رأس المال مقفل",
  "INTEREST ACCRUED": "العوائد المتراكمة",
  "Updated by cycle": "يُحدّث حسب الدورة",
  "WITHDRAWABLE": "متاح للسحب",
  "Eligible interest only": "العوائد المؤهلة فقط",
  "Recent activity": "النشاط الأخير",
  "ILLUSTRATIVE STATUS PREVIEW": "معاينة توضيحية للحالات",
  "Coupon stake": "تخزين بالقسيمة",
  "Stake activation": "تفعيل التخزين",
  "Active": "نشط",
  "Crypto deposit": "إيداع رقمي",
  "Proof submitted": "تم تقديم الإثبات",
  "Pending review": "قيد المراجعة",
  "Interest withdrawal": "سحب العوائد",
  "Administrator review": "مراجعة الإدارة",
  "Approved": "مقبول",
  "INTEREST POLICY": "سياسة العوائد",
  "every": "كل",
  "30 days.": "30 يوماً.",
  "Simple policy visibility inside your dashboard. Actual account values and eligibility are returned by the staking backend.": "سياسة واضحة داخل لوحة التحكم. تُعرض قيم الحساب والأهلية الفعلية من نظام التخزين.",
  "Principal stays locked": "يبقى رأس المال مقفلاً",
  "Your original staked principal is not available for withdrawal.": "رأس المال المخزّن الأصلي غير متاح للسحب.",
  "Interest is tracked separately": "تُتابع العوائد بشكل منفصل",
  "Accrued, locked, and currently withdrawable interest appear as separate totals.": "تظهر العوائد المتراكمة والمقفلة والمتاحة للسحب كإجماليات منفصلة.",
  "Eligibility comes first": "الأهلية أولاً",
  "Available methods depend on the source of the stake and current account eligibility.": "تعتمد الطرق المتاحة على مصدر التخزين وأهلية الحساب الحالية.",
  "Every payout is reviewed": "تتم مراجعة كل دفعة",
  "Withdrawal requests remain pending until the administrator completes the review.": "تبقى طلبات السحب معلّقة حتى إكمال مراجعة الإدارة.",
  "ELIGIBLE INTEREST WITHDRAWALS": "سحب العوائد المؤهلة",
  "Two routes.": "مساران.",
  "One review trail.": "سجل مراجعة واحد.",
  "The dashboard calculates what is available for each method. Users can never request more than their eligible interest balance.": "تحسب لوحة التحكم المبلغ المتاح لكل طريقة، ولا يمكن طلب أكثر من رصيد العوائد المؤهل.",
  "OFFLINE ROUTE": "المسار النقدي",
  "Cash withdrawal": "سحب نقدي",
  "Request eligible interest as cash. This is the only route available to offline or cash-origin stakes.": "اطلب العوائد المؤهلة نقداً. هذا هو المسار المتاح للتخزين ذي المصدر النقدي.",
  "Submit amount": "أدخل المبلغ",
  "Admin review": "مراجعة الإدارة",
  "Status update": "تحديث الحالة",
  "ONLINE ROUTE": "المسار الرقمي",
  "USDT withdrawal": "سحب USDT",
  "Eligible online or crypto-derived interest may be requested to a supplied USDT wallet address.": "يمكن طلب العوائد الرقمية المؤهلة إلى عنوان محفظة USDT.",
  "Add wallet": "أضف المحفظة",
  "BUILT AROUND VERIFICATION": "مصمم حول التحقق",
  "Nothing important disappears into a black box.": "كل خطوة مهمة تبقى واضحة.",
  "Authenticated account": "حساب موثّق",
  "Your staking activity belongs to your signed-in profile.": "ترتبط جميع أنشطة التخزين بحسابك المسجّل.",
  "Proof verification": "التحقق من الإثبات",
  "Crypto payment files are checked before activation.": "تُفحص ملفات الدفع الرقمي قبل التفعيل.",
  "Recorded activation": "تفعيل مسجّل",
  "Every approved position appears in stake history.": "يظهر كل تخزين معتمد في سجل التخزين.",
  "Withdrawal review": "مراجعة السحب",
  "Every request keeps a visible status and decision trail.": "يحتفظ كل طلب بحالة واضحة وسجل للقرار.",
  "BUILT FOR UTILITY": "مصمم للاستخدام",
  "One coin.": "عملة واحدة.",
  "A growing ecosystem.": "منظومة تنمو باستمرار.",
  "SGC is the native digital asset used across SGChain’s wallet and financial products.": "SGC هي الأصل الرقمي الأساسي المستخدم في محفظة SGChain ومنتجاتها المالية.",
  "Wallet-native": "مدمجة مع المحفظة",
  "Buy, hold, and view your balance from one SGChain account.": "اشترِ واحتفظ بالرصيد واعرضه من حساب SGChain واحد.",
  "Designed for utility": "مصممة للاستخدام",
  "Built to move across SGChain products as the ecosystem expands.": "مصممة للعمل عبر منتجات SGChain مع توسع المنظومة.",
  "Clear ownership": "ملكية واضحة",
  "Your confirmed SGC balance is shown directly inside your wallet.": "يظهر رصيد SGC المؤكد مباشرة داخل محفظتك.",
  "Simple entry": "بداية سهلة",
  "A guided order journey makes buying approachable for new users.": "خطوات شراء موجهة وسهلة للمستخدمين الجدد.",
  "Your SGCOIN position,": "رصيد SGCOIN الخاص بك،",
  "clearly tracked.": "متابعة واضحة.",
  "Create your member account to activate stakes, monitor cycles, and manage eligible interest withdrawals.": "أنشئ حسابك لتفعيل التخزين ومتابعة الدورات وإدارة سحب العوائد المؤهلة.",
  "Sign in to dashboard": "الدخول إلى لوحة التحكم",
  "BEFORE YOU BUY": "قبل الشراء",
  "A 30-second safety check.": "فحص أمان خلال 30 ثانية.",
  "Use the official website.": "استخدم الموقع الرسمي.",
  "Review the full quote.": "راجع العرض بالكامل.",
  "Never share credentials.": "لا تشارك بيانات الدخول.",
  "Welcome back.": "مرحباً بعودتك.",
  "Start your staking journey.": "ابدأ رحلة التخزين.",
  "Access your dashboard": "الدخول إلى لوحة التحكم",
  "Join Sagenex Staking": "انضم إلى Sagenex Staking",
  "Email address": "البريد الإلكتروني",
  "Password": "كلمة المرور",
  "Full name": "الاسم الكامل",
  "Phone number": "رقم الهاتف",
  "Log out": "تسجيل الخروج",
  "MEMBER DASHBOARD": "لوحة تحكم العضو",
  "Good to see you,": "مرحباً بك،",
  "Your live staking position, interest, and requests—all in one place.": "رصيد التخزين والعوائد والطلبات المباشرة — كلها في مكان واحد.",
  "INTEREST WITHDRAWAL": "سحب العوائد",
  "Request a payout": "طلب دفعة",
  "COUPON STAKING": "التخزين بالقسيمة",
  "Activate a stake": "تفعيل التخزين",
  "CRYPTO STAKING": "التخزين الرقمي",
  "Fund with ETH or USDT": "الإيداع عبر ETH أو USDT",
  "Stake history": "سجل التخزين",
  "Withdrawal requests": "طلبات السحب",
  "Important legal information": "معلومات قانونية مهمة",
};

const originals = new WeakMap<Text, string>();
const originalPlaceholders = new WeakMap<HTMLInputElement, string>();
const placeholderAr: Record<string, string> = {
  "Your full name": "الاسم الكامل",
  "At least 8 characters": "8 أحرف على الأقل",
  "Enter your coupon code": "أدخل رمز القسيمة",
  "Amount in USDT": "المبلغ بعملة USDT",
  "Amount in ETH": "المبلغ بعملة ETH",
};

function translateTree(language: Language) {
  const root = document.body;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode() as Text | null;
  while (node) {
    const parent = node.parentElement;
    if (parent && !parent.closest("script,style,code,[data-no-translate]")) {
      const current = node.nodeValue || "";
      const trimmed = current.trim();
      if (trimmed) {
        if (!originals.has(node)) originals.set(node, trimmed);
        const source = originals.get(node) || trimmed;
        const target = language === "ar" ? ar[source] || source : source;
        if (trimmed !== target) node.nodeValue = current.replace(trimmed, target);
      }
    }
    node = walker.nextNode() as Text | null;
  }
  document.querySelectorAll<HTMLInputElement>("input[placeholder]").forEach((input) => {
    if (!originalPlaceholders.has(input)) originalPlaceholders.set(input, input.placeholder);
    const source = originalPlaceholders.get(input) || input.placeholder;
    input.placeholder = language === "ar" ? placeholderAr[source] || source : source;
  });
}

export function LanguageManager() {
  const [language, setLanguage] = useState<Language>("ar");

  useLayoutEffect(() => {
    document.documentElement.lang = language === "ar" ? "ar-AE" : "en";
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    translateTree(language);
  }, [language]);

  useEffect(() => {
    const saved = localStorage.getItem("sagenex_language");
    if (saved === "en") window.setTimeout(() => setLanguage("en"), 0);
    const observer = new MutationObserver(() => translateTree(language));
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  function choose(next: Language) {
    localStorage.setItem("sagenex_language", next);
    setLanguage(next);
  }

  return (
    <div className="language-switcher" data-no-translate aria-label="Language selector">
      <button className={language === "ar" ? "active" : ""} onClick={() => choose("ar")} type="button">العربية</button>
      <button className={language === "en" ? "active" : ""} onClick={() => choose("en")} type="button">English</button>
    </div>
  );
}
