import React, { useMemo, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

const COPY = {
  en: {
    headerTitle: "Business Finance Help",
    headerSubtitle:
      "A practical guide to quote requests, estimates, invoices, work orders, field reports, reviews, inventory, and reports.",
    closeAria: "Close Business Finance help",
    tabs: ["Workflow", "Real-Life Scenarios"],
    introTitle: "What is Business Finance?",
    introBody: [
      "Business Finance helps you manage custom-price job requests, customer pricing, work orders, materials, employee field reports, expenses, and accountant-ready reports in one place.",
      "It is designed for operational workflow first. It is not a replacement for formal accounting or tax filing.",
      "If you already know enough to price the job, skip Quote Request and create the Estimate directly.",
      "Use Quote Request only when you still need details before pricing, such as scope, photos, measurements, site-visit notes, or follow-up.",
    ],
    workflowTitle: "Workflow",
    whereTitle: "Where should I go?",
    rulesTitle: "Important rules",
    rules: [
      "Employees report what happened. Managers approve what becomes official.",
      "Inventory is not deducted from employee field reports alone.",
      "Invoice extras are manager-controlled through review approval.",
      "Manual accepted or rejected status is an administrative fallback, not the same as a client portal response.",
      "Reports support review and export. They do not replace official accounting or tax filing.",
    ],
    notAutomaticTitle: "What is not automatic yet?",
    notAutomatic: [
      "WhatsApp and SMS sending are still manual unless later automation is added.",
      "Receipt file upload is metadata or link based for now.",
      "Tax Summary is estimated and should be reviewed with an accountant.",
      "Purchase void does not automatically reverse linked expenses.",
      "Reports and exports are available, but they are not a full replacement for external accounting review.",
    ],
    rememberTitle: "One sentence to remember",
    rememberBody:
      "The estimate gets client approval, the invoice collects payment, the work order runs the job, the employee reports what happened, and the manager approves what becomes official.",
    shortTitle: "Very short version",
    scenariosTitle: "Real-Life Scenarios",
    scenariosIntro:
      "Use these examples when you are deciding whether to send an estimate, create an invoice, create a work order, or reopen a job for changes.",
    checklistTitle: "Manager checklist",
    closeButton: "Close Help",
    chips: ["Quote Request", "Estimate", "Invoice", "Work Order", "Field Report", "Review"],
    shortItems: [
      "Quote Request = intake before pricing is ready",
      "Estimate = customer-facing proposed price when you are ready to price the job",
      "Invoice = payment record",
      "Work Order = job plan",
      "Field Report = employee reports what happened",
      "Review = manager approves what becomes official",
    ],
    workflowSections: [
      {
        title: "1. Start with a Quote Request only if pricing is not ready",
        body: [
          "Use a Quote Request when the customer needs custom pricing and you have not prepared the estimate yet.",
          "If you already understand the job well enough to price it now, skip Quote Request and create the Estimate directly.",
          "Examples: kitchen leak repair, cabinet repair, custom installation, or any job where the price depends on scope.",
          "Do not use this flow for a simple known-price appointment. If the service, price, employee, and time are already known, use the normal Booking flow instead.",
        ],
        bullets: ["Title", "Source", "Contact person", "Client record", "Service address", "Preferred timeline", "Description", "Visible notes", "Internal notes"],
        footer: "A Quote Request is the starting record. It is not the estimate, invoice, or work order.",
      },
      {
        title: "2. Select or create the Client record",
        body: [
          "Contact person is who asked for the work or quote.",
          "Client record is the official customer profile used for estimates, invoices, and work orders.",
          "You can now search for an existing client or create a new client inline from the Quote Request, Estimate, and Work Order dialogs.",
        ],
        footer: "The estimate, invoice, payment link, and work order should all connect to the same official client record.",
      },
      {
        title: "3. Direct estimate when you already know the price",
        body: [
          "If the client walks in, calls, or messages you and you already know enough to price the work, go straight to Estimates.",
          "Create the Estimate, review the line items, notes, terms, tax, and expiry date, then send it to the client for approval.",
          "This is often the simplest path for plumbing, electrical, repair, or repeat-service jobs where the manager can price the work immediately.",
        ],
        footer: "You do not need a Quote Request for every job. Quote Request is optional when pricing is already clear.",
      },
      {
        title: "4. Create the Estimate",
        body: [
          "Create the Estimate when you are ready to prepare the customer-facing price.",
          "Review the client, estimate title, issue date, expiry date, notes, terms, tax, and line items before sharing it.",
          "If the quote already created an estimate, open the existing estimate instead of creating another one.",
        ],
        bullets: ["Estimate title", "Issue date", "Expiry date", "Visible notes", "Terms", "Line items", "Tax and discount"],
        footer: "The estimate is the proposed price for the job.",
      },
      {
        title: "5. Share the Estimate",
        body: [
          "The best action is Send Estimate. That sends the public estimate link to the client.",
          "You can also use Create / Copy Link, Open Link, Print / PDF, or Copy Summary when you need a manual share method.",
          "WhatsApp, SMS, and personal email are still manual unless automation is added later.",
        ],
        footer: "Mark Sent Manually is only an internal status shortcut. It is not proof that the client received or accepted the estimate.",
      },
      {
        title: "6. Client reviews the public estimate page",
        body: [
          "The public estimate page shows the company name, estimate number, title, line items, totals, notes, and terms.",
          "The page does not show internal notes, profitability, labor cost, vendor cost, audit logs, or accounting-only data.",
          "The client can accept or reject the estimate on the public page.",
        ],
        footer: "If the client accepts, the estimate becomes approved. If the client rejects, the estimate becomes rejected.",
      },
      {
        title: "7. Understand the estimate states",
        body: [
          "Draft means the estimate is being prepared.",
          "Sent means it was shared or emailed.",
          "Viewed means the client opened the public link.",
          "Approved means the client accepted it or a manager marked it accepted manually as an administrative fallback.",
          "Rejected means the client rejected it or a manager marked it rejected manually as an administrative fallback.",
        ],
        footer: "Manual manager accepted or rejected statuses are only fallback states. They are not the same as a real client response through the public link.",
      },
      {
        title: "8. If the client accepts",
        body: [
          "After approval, the manager decides what happens next.",
          "Convert to Invoice creates the bill and payment record.",
          "Create Work Order creates the operational job record.",
          "These actions should stay separate because estimate approval, payment collection, and job execution are different business steps.",
        ],
        bullets: ["Convert to Invoice", "Create / Copy Payment Link", "Open Payment Link", "Create Work Order", "Assign team"],
        footer: "Normal path: client accepts -> invoice and payment link -> work order -> assignment -> field report -> manager review.",
      },
      {
        title: "9. If the client rejects or does not respond",
        body: [
          "If the client rejects, review the note, revise the estimate, and use Revise and Resend when appropriate.",
          "If the client does not respond, follow up. Silence should never be treated as approval.",
          "If the estimate was already converted to an invoice, do not reopen it. Handle changes through the invoice or create a new revised estimate.",
        ],
        footer: "Viewed but no response means follow up. Expired means decide whether to extend and resend.",
      },
      {
        title: "10. Invoice, payment, and work order",
        body: [
          "Convert to Invoice when the customer needs to pay.",
          "Use Create / Copy Payment Link or Open Payment Link when you want the client to pay online.",
          "Create Work Order when the job is ready to be planned and executed.",
          "The work order is the job plan. It is not the same thing as the estimate or invoice.",
        ],
        bullets: ["Work dates", "Location", "Instructions", "Planned materials", "Assigned team members"],
        footer: "Planned materials do not deduct inventory yet.",
      },
      {
        title: "11. Employee field work and manager approval",
        body: [
          "Employees see assigned work orders and submit field reports.",
          "A field report records what happened in the field. It does not update inventory or invoice records by itself.",
          "The manager reviews the field report and decides what becomes official.",
          "Inventory changes only after manager review approval.",
        ],
        bullets: [
          "Employee submits field report",
          "Manager opens Field Reports",
          "Manager creates Review",
          "Manager approves material and billing decisions",
          "Work order closes when the approved review finishes the job",
        ],
        footer: "The employee reports what happened. The manager approves what becomes official.",
      },
      {
        title: "12. Reporting and month-end",
        body: [
          "Use Profitability to review revenue, labor, approved material cost, linked expenses, and estimated margin.",
          "Use Tax Summary for accountant review only. It is an estimate, not official tax filing.",
          "Use Month-End and Reports when checking missing items and preparing accountant-ready exports.",
        ],
        footer: "Reports support review and export. They do not replace formal accounting or tax filing.",
      },
    ],
    workflowLocations: [
      {
        title: "Daily Operations",
        items: [
          { label: "Clients", text: "Manage the official customer records used across quotes, estimates, invoices, and work orders." },
          { label: "Quotes", text: "Capture custom-price customer requests." },
          { label: "Estimates", text: "Prepare and share customer pricing." },
          { label: "Work Orders", text: "Plan and manage the job once the estimate is accepted." },
          { label: "Field Reports", text: "See what employees submitted from the field." },
          { label: "Reviews", text: "Approve what becomes official for billing, inventory, and job close-out." },
          { label: "Invoices", text: "Bill approved work and manage payment follow-up." },
        ],
      },
      {
        title: "Operations Support",
        items: [
          { label: "Materials & Supplies", text: "Track stock items and material availability." },
          { label: "Expenses", text: "Record overhead or job-linked business costs." },
          { label: "Purchases", text: "Record stock purchases and supplier-side spend." },
          { label: "Vendors", text: "Keep supplier details in one place." },
        ],
      },
      {
        title: "Accounting & Reporting",
        items: [
          { label: "Profitability", text: "Review job performance before month-end." },
          { label: "Reports", text: "Export invoices, expenses, and summaries." },
          { label: "Tax Summary", text: "Review estimated tax for accountant follow-up." },
          { label: "Month-End", text: "Review missing items and prepare exports." },
        ],
      },
    ],
    scenarios: [
      {
        title: "Scenario 1: Custom repair job",
        summary: "Use this when the customer needs a custom price before work can be scheduled.",
        steps: [
          "Customer asks for a price for a kitchen leak repair.",
          "Manager opens Clients only if the official customer record still needs to be created or cleaned up.",
          "Manager creates a Quote Request in Quotes.",
          "Manager selects an existing client or creates a new client record inline.",
          "Manager creates the Estimate and checks the public estimate page.",
          "Manager sends the estimate link.",
          "Client accepts the estimate.",
          "Manager converts to invoice, creates a payment link if needed, and creates the work order.",
          "Employee submits a field report after the job.",
          "Manager approves the review and the work order closes.",
        ],
      },
      {
        title: "Scenario 1B: Walk-in or phone call where you already know the price",
        summary: "Use this when you can price the job immediately and do not need a separate intake record first.",
        steps: [
          "Customer asks for a plumbing, repair, or service price and the manager already understands the scope.",
          "Manager creates the Estimate directly in Estimates.",
          "Manager sends the estimate link to the client.",
          "Client accepts the estimate.",
          "Manager converts to invoice, creates a payment link if needed, and creates the work order when the job is ready.",
        ],
      },
      {
        title: "Scenario 2: Urgent job before payment",
        summary: "Use this when the customer approves quickly and the team needs to move fast.",
        steps: [
          "Customer approves the estimate right away.",
          "Manager creates the work order immediately so the team can be assigned.",
          "Manager converts to invoice and sends the payment link either before or after scheduling based on company policy.",
          "Employee completes the work and submits a field report.",
          "Manager approves the review to finalize inventory and billing decisions.",
        ],
      },
      {
        title: "Scenario 3: Client rejects and needs a revision",
        summary: "Use this when the scope, price, or terms need to change.",
        steps: [
          "Client rejects the estimate and leaves a note.",
          "Manager reviews the rejection reason.",
          "Manager updates line items, scope, notes, or terms.",
          "Manager uses Revise and Resend to clear the old response and reshare the estimate.",
          "Client reviews the updated estimate and responds again.",
        ],
      },
      {
        title: "Scenario 4: Sent but no response",
        summary: "Use this when the client has not accepted or rejected the estimate yet.",
        steps: [
          "If the estimate was sent but not viewed, verify the email address and resend the link.",
          "If the estimate was viewed but not answered, follow up and ask whether changes are needed.",
          "If the estimate expired, decide whether to extend the expiry and resend it.",
          "Do not assume approval when the client stays silent.",
        ],
      },
      {
        title: "Scenario 5: Phone approval or WhatsApp approval",
        summary: "Use manual accepted status only when the client clearly approved outside the portal.",
        steps: [
          "Confirm the scope, total, tax, and terms with the client.",
          "Record proof in internal notes.",
          "Mark the estimate accepted manually only as an administrative fallback.",
          "Send a confirmation note back to the client when possible.",
          "If possible, guide the client to accept the public estimate link instead. That creates the cleanest response record.",
        ],
      },
      {
        title: "Scenario 6: Deposit required before scheduling",
        summary: "Use this when payment is required before the work is booked.",
        steps: [
          "Client accepts the estimate.",
          "Manager converts the estimate to an invoice.",
          "Manager creates or copies the hosted payment link.",
          "Manager sends the payment link.",
          "Manager creates the work order after the payment or deposit rule is satisfied.",
        ],
      },
    ],
    checklist: [
      "Create Quote Request and capture the request contact.",
      "Link or create the official Client record.",
      "Create and review the Estimate.",
      "Send the estimate link or copy the link manually.",
      "Wait for client approval or rejection, or follow up if there is no response.",
      "Convert to Invoice when payment is needed.",
      "Create the Work Order when the job is ready to be scheduled.",
      "Assign the employee or team.",
      "Employee submits the Field Report.",
      "Manager approves the Review before inventory and billing changes become official.",
    ],
  },
  fa: {
    headerTitle: "راهنمای مالی کسب‌وکار",
    headerSubtitle: "راهنمای عملی برای درخواست قیمت، برآورد، فاکتور، دستور کار، گزارش میدانی، بازبینی، موجودی و گزارش‌ها.",
    closeAria: "بستن راهنمای مالی کسب‌وکار",
    tabs: ["جریان کار", "سناریوهای واقعی"],
    introTitle: "مالی کسب‌وکار چیست؟",
    introBody: [
      "مالی کسب‌وکار به شما کمک می‌کند درخواست‌های کار با قیمت سفارشی، قیمت‌گذاری مشتری، دستورهای کار، مواد، گزارش‌های میدانی کارکنان، هزینه‌ها و گزارش‌های آماده برای حسابدار را در یکجا مدیریت کنید.",
      "این بخش اول برای جریان کار عملیاتی طراحی شده است. جایگزین حسابداری رسمی یا ثبت مالیات نیست.",
      "اگر همین حالا اطلاعات کافی برای قیمت‌گذاری دارید، از درخواست قیمت رد شوید و مستقیماً برآورد بسازید.",
      "فقط وقتی از درخواست قیمت استفاده کنید که هنوز قبل از قیمت‌گذاری به جزئیات بیشتری مثل دامنه کار، عکس‌ها، اندازه‌ها، یادداشت بازدید یا پیگیری نیاز دارید.",
    ],
    workflowTitle: "جریان کار",
    whereTitle: "به کجا باید بروم؟",
    rulesTitle: "قواعد مهم",
    rules: [
      "کارکنان گزارش می‌دهند چه اتفاقی افتاده است. مدیران تأیید می‌کنند چه چیزی رسمی می‌شود.",
      "موجودی فقط بر اساس گزارش میدانی کارمند کسر نمی‌شود.",
      "اقلام اضافه فاکتور فقط از طریق تأیید بازبینی توسط مدیر کنترل می‌شود.",
      "وضعیت تأیید یا رد دستی فقط یک حالت اداری جایگزین است و معادل پاسخ واقعی در پورتال مشتری نیست.",
      "گزارش‌ها برای بازبینی و خروجی گرفتن هستند. جایگزین حسابداری رسمی یا ثبت مالیات نیستند.",
    ],
    notAutomaticTitle: "چه چیزهایی هنوز خودکار نیستند؟",
    notAutomatic: [
      "ارسال از طریق واتساپ و پیامک هنوز دستی است مگر این‌که بعداً خودکارسازی اضافه شود.",
      "بارگذاری فایل رسید فعلاً بر پایه متادیتا یا لینک است.",
      "خلاصه مالیات برآوردی است و باید با حسابدار بازبینی شود.",
      "باطل کردن خرید، هزینه‌های مرتبط را به‌صورت خودکار برنمی‌گرداند.",
      "گزارش‌ها و خروجی‌ها موجودند، اما جایگزین کامل بازبینی حسابداری بیرونی نیستند.",
    ],
    rememberTitle: "یک جمله برای به خاطر سپردن",
    rememberBody: "برآورد تأیید مشتری را می‌گیرد، فاکتور پرداخت را جمع می‌کند، دستور کار کار را اجرا می‌کند، کارمند گزارش می‌دهد چه اتفاقی افتاده است و مدیر تأیید می‌کند چه چیزی رسمی می‌شود.",
    shortTitle: "نسخه خیلی کوتاه",
    scenariosTitle: "سناریوهای واقعی",
    scenariosIntro: "وقتی می‌خواهید تصمیم بگیرید برآورد را ارسال کنید، فاکتور بسازید، دستور کار ایجاد کنید یا برای تغییرات دوباره سراغ کار بروید، از این مثال‌ها استفاده کنید.",
    checklistTitle: "چک‌لیست مدیر",
    closeButton: "بستن راهنما",
    chips: ["درخواست قیمت", "برآورد", "فاکتور", "دستور کار", "گزارش میدانی", "بازبینی"],
    shortItems: [
      "درخواست قیمت = ثبت اولیه قبل از آماده شدن قیمت",
      "برآورد = قیمت پیشنهادی برای مشتری وقتی آماده قیمت‌گذاری هستید",
      "فاکتور = سابقه پرداخت",
      "دستور کار = برنامه انجام کار",
      "گزارش میدانی = کارمند گزارش می‌دهد چه شده است",
      "بازبینی = مدیر تأیید می‌کند چه چیزی رسمی می‌شود",
    ],
    workflowSections: [],
    workflowLocations: [],
    scenarios: [],
    checklist: [
      "درخواست قیمت را ایجاد کنید و اطلاعات تماس درخواست‌کننده را ثبت کنید.",
      "رکورد رسمی مشتری را لینک کنید یا بسازید.",
      "برآورد را ایجاد و بازبینی کنید.",
      "لینک برآورد را ارسال کنید یا دستی کپی کنید.",
      "برای تأیید یا رد مشتری صبر کنید یا اگر پاسخی نیست پیگیری کنید.",
      "وقتی پرداخت لازم است به فاکتور تبدیل کنید.",
      "وقتی کار آماده زمان‌بندی است دستور کار را ایجاد کنید.",
      "کارمند یا تیم را تخصیص دهید.",
      "کارمند گزارش میدانی را ثبت می‌کند.",
      "قبل از رسمی شدن تغییرات موجودی و صورتحساب، مدیر بازبینی را تأیید می‌کند.",
    ],
  },
  ru: {
    headerTitle: "Справка Business Finance",
    headerSubtitle: "Практическое руководство по запросам на смету, сметам, счетам, нарядам, полевым отчетам, проверкам, складу и отчетам.",
    closeAria: "Закрыть справку Business Finance",
    tabs: ["Процесс", "Реальные сценарии"],
    introTitle: "Что такое Business Finance?",
    introBody: [
      "Business Finance помогает вести запросы на работы с индивидуальной ценой, клиентские сметы, наряды, материалы, полевые отчеты сотрудников, расходы и отчеты для передачи бухгалтеру в одном месте.",
      "Система в первую очередь предназначена для операционного процесса. Она не заменяет формальный учет или налоговую отчетность.",
      "Если вы уже знаете цену работы, пропустите запрос и создайте смету сразу.",
      "Используйте запрос только тогда, когда перед расчетом цены вам еще нужны детали: объем работ, фото, замеры, заметки с выезда или дополнительное уточнение.",
    ],
    workflowTitle: "Процесс",
    whereTitle: "Куда мне идти?",
    rulesTitle: "Важные правила",
    rules: [
      "Сотрудники сообщают, что произошло. Менеджеры утверждают, что становится официальным.",
      "Запасы не списываются только по полевому отчету сотрудника.",
      "Дополнительные суммы по счету контролируются менеджером через утверждение проверки.",
      "Ручной статус одобрения или отклонения — это административный резервный вариант, а не ответ через клиентский портал.",
      "Отчеты нужны для проверки и экспорта. Они не заменяют официальный учет или налоговую отчетность.",
    ],
    notAutomaticTitle: "Что пока не автоматизировано?",
    notAutomatic: [
      "Отправка через WhatsApp и SMS пока остается ручной, если позже не будет добавлена автоматизация.",
      "Загрузка файлов чеков пока основана на метаданных или ссылках.",
      "Налоговая сводка является оценочной и должна проверяться вместе с бухгалтером.",
      "Аннулирование закупки не отменяет автоматически связанные расходы.",
      "Отчеты и выгрузки доступны, но это не полная замена внешней бухгалтерской проверки.",
    ],
    rememberTitle: "Одна фраза, которую стоит запомнить",
    rememberBody: "Смета получает одобрение клиента, счет собирает оплату, наряд запускает работу, сотрудник сообщает, что произошло, а менеджер утверждает, что становится официальным.",
    shortTitle: "Очень кратко",
    scenariosTitle: "Реальные сценарии",
    scenariosIntro: "Используйте эти примеры, когда решаете, отправлять ли смету, создавать счет, создавать наряд или открывать работу заново для изменений.",
    checklistTitle: "Чек-лист менеджера",
    closeButton: "Закрыть справку",
    chips: ["Запрос", "Смета", "Счет", "Наряд", "Полевой отчет", "Проверка"],
    shortItems: [
      "Запрос = первичный прием до готовности цены",
      "Смета = предложение цены для клиента, когда вы готовы оценить работу",
      "Счет = запись об оплате",
      "Наряд = план выполнения работы",
      "Полевой отчет = сотрудник сообщает, что произошло",
      "Проверка = менеджер утверждает, что становится официальным",
    ],
    workflowSections: [],
    workflowLocations: [],
    scenarios: [],
    checklist: [
      "Создайте запрос и сохраните контакт запросившего.",
      "Привяжите или создайте официальный профиль клиента.",
      "Создайте и проверьте смету.",
      "Отправьте ссылку на смету или скопируйте ее вручную.",
      "Дождитесь одобрения или отклонения клиента либо сделайте напоминание, если ответа нет.",
      "Создайте счет, когда требуется оплата.",
      "Создайте наряд, когда работа готова к планированию.",
      "Назначьте сотрудника или команду.",
      "Сотрудник отправляет полевой отчет.",
      "Менеджер утверждает проверку до того, как изменения по складу и выставлению счетов станут официальными.",
    ],
  },
  zh: {
    headerTitle: "业务财务帮助",
    headerSubtitle: "关于报价请求、报价单、发票、工单、现场报告、审核、库存和报表的实用指南。",
    closeAria: "关闭业务财务帮助",
    tabs: ["工作流程", "真实场景"],
    introTitle: "什么是业务财务？",
    introBody: [
      "业务财务帮助你在一个地方管理定制报价请求、客户报价、工单、材料、员工现场报告、费用以及可交给会计的报表。",
      "它首先是为运营流程设计的，不是正式会计或税务申报的替代品。",
      "如果你已经知道足够的信息来定价，就跳过报价请求，直接创建报价单。",
      "只有在你定价前仍需要范围、照片、测量、上门记录或进一步跟进时，才使用报价请求。",
    ],
    workflowTitle: "工作流程",
    whereTitle: "我该去哪里？",
    rulesTitle: "重要规则",
    rules: [
      "员工报告实际发生的情况，经理批准哪些内容成为正式记录。",
      "库存不会仅根据员工现场报告自动扣减。",
      "发票附加项由经理通过审核批准来控制。",
      "手动批准或拒绝状态只是管理补救手段，不等同于客户门户中的正式回应。",
      "报表用于复核和导出，不替代正式会计或税务申报。",
    ],
    notAutomaticTitle: "目前哪些还不是自动的？",
    notAutomatic: [
      "WhatsApp 和短信发送目前仍是手动，除非以后增加自动化。",
      "收据文件上传目前仍以元数据或链接为主。",
      "税务汇总是估算值，应与会计一起复核。",
      "作废采购不会自动冲回关联费用。",
      "虽然已经提供报表和导出，但它们还不能完全替代外部会计复核。",
    ],
    rememberTitle: "一句话记住",
    rememberBody: "报价单获得客户批准，发票负责收款，工单负责执行工作，员工报告实际情况，经理批准哪些内容成为正式记录。",
    shortTitle: "超短版",
    scenariosTitle: "真实场景",
    scenariosIntro: "当你在判断是发送报价单、创建发票、创建工单，还是为了修改重新打开工作时，请参考这些例子。",
    checklistTitle: "经理检查清单",
    closeButton: "关闭帮助",
    chips: ["报价请求", "报价单", "发票", "工单", "现场报告", "审核"],
    shortItems: [
      "报价请求 = 定价前的前期收集",
      "报价单 = 你已经可以定价时给客户的价格方案",
      "发票 = 付款记录",
      "工单 = 工作计划",
      "现场报告 = 员工汇报现场情况",
      "审核 = 经理批准哪些内容成为正式记录",
    ],
    workflowSections: [],
    workflowLocations: [],
    scenarios: [],
    checklist: [
      "创建报价请求并记录请求联系人。",
      "关联或创建正式客户档案。",
      "创建并复核报价单。",
      "发送报价链接或手动复制链接。",
      "等待客户批准或拒绝；如果没有回应则跟进。",
      "需要收款时转为发票。",
      "工作准备排期时创建工单。",
      "分配员工或团队。",
      "员工提交现场报告。",
      "在库存和计费变更成为正式记录前，经理先批准审核。",
    ],
  },
};

COPY.fa.workflowSections = COPY.en.workflowSections.map((entry, index) => {
  const translations = [
    {
      title: "۱. فقط وقتی قیمت‌گذاری آماده نیست با درخواست قیمت شروع کنید",
      body: [
        "وقتی مشتری به قیمت‌گذاری سفارشی نیاز دارد و هنوز برآورد آماده نشده است، از درخواست قیمت استفاده کنید.",
        "اگر همین حالا اطلاعات کافی برای قیمت‌گذاری دارید، از درخواست قیمت رد شوید و مستقیماً برآورد را ایجاد کنید.",
        "مثال‌ها: تعمیر نشتی آشپزخانه، تعمیر کابینت، نصب سفارشی یا هر کاری که قیمت آن به دامنه کار بستگی دارد.",
        "از این جریان برای یک نوبت ساده با قیمت مشخص استفاده نکنید. اگر خدمت، قیمت، کارمند و زمان از قبل مشخص است، به‌جای آن از جریان عادی Booking استفاده کنید.",
      ],
      bullets: ["عنوان", "منبع", "اطلاعات تماس درخواست‌کننده", "آدرس خدمت", "بازه زمانی ترجیحی", "توضیحات", "یادداشت‌های قابل‌نمایش", "یادداشت‌های داخلی"],
      footer: "درخواست قیمت رکورد شروع است. خودش برآورد، فاکتور یا دستور کار نیست.",
    },
    {
      title: "۲. مشتری را لینک کنید یا بسازید",
      body: [
        "اطلاعات تماس درخواست‌کننده همان شخصی است که قیمت را خواسته است.",
        "مشتری لینک‌شده رکورد رسمی مشتری است که برای برآوردها، فاکتورها و دستورهای کار استفاده می‌شود.",
        "قبل از ایجاد برآورد، درخواست را به مشتری درست لینک کنید یا از همان اطلاعات تماس مشتری جدید بسازید.",
      ],
      footer: "برآورد، فاکتور، لینک پرداخت و دستور کار باید همگی به رکورد رسمی مشتری وصل باشند.",
    },
    {
      title: "۳. وقتی قیمت را می‌دانید مستقیم برآورد بسازید",
      body: [
        "اگر مشتری حضوری، تلفنی یا پیامکی درخواست داده و شما همین حالا می‌توانید کار را قیمت‌گذاری کنید، مستقیم به بخش برآوردها بروید.",
        "برآورد را ایجاد کنید، آیتم‌های خطی، یادداشت‌ها، شرایط، مالیات و تاریخ انقضا را بازبینی کنید و آن را برای تأیید مشتری بفرستید.",
        "این مسیر معمولاً برای کارهای لوله‌کشی، برق، تعمیرات یا خدمات تکراری که مدیر می‌تواند فوراً قیمت بدهد ساده‌ترین راه است.",
      ],
      footer: "برای هر کاری به درخواست قیمت نیاز ندارید. وقتی قیمت‌گذاری روشن است، درخواست قیمت اختیاری است.",
    },
    {
      title: "۴. برآورد را ایجاد کنید",
      body: [
        "وقتی آماده تهیه قیمت برای مشتری هستید، برآورد را ایجاد کنید.",
        "قبل از اشتراک‌گذاری، مشتری، عنوان برآورد، تاریخ صدور، تاریخ انقضا، یادداشت‌ها، شرایط، مالیات و آیتم‌های خطی را بازبینی کنید.",
        "اگر درخواست قبلاً برآورد ساخته است، به‌جای ساختن مورد جدید همان برآورد موجود را باز کنید.",
      ],
      bullets: ["عنوان برآورد", "تاریخ صدور", "تاریخ انقضا", "یادداشت‌های قابل‌نمایش", "شرایط", "آیتم‌های خطی", "مالیات و تخفیف"],
      footer: "برآورد همان قیمت پیشنهادی برای کار است.",
    },
    {
      title: "۵. برآورد را به اشتراک بگذارید",
      body: [
        "بهترین اقدام ارسال برآورد است. این کار لینک عمومی برآورد را برای مشتری می‌فرستد.",
        "وقتی به روش اشتراک‌گذاری دستی نیاز دارید، می‌توانید از ایجاد/کپی لینک، باز کردن لینک، چاپ/PDF یا کپی خلاصه استفاده کنید.",
        "واتساپ، پیامک و ایمیل شخصی هنوز دستی هستند مگر این‌که بعداً خودکارسازی اضافه شود.",
      ],
      footer: "علامت‌گذاری ارسال دستی فقط یک میانبر وضعیت داخلی است. این کار اثبات نمی‌کند مشتری برآورد را دریافت یا تأیید کرده است.",
    },
    {
      title: "۶. مشتری صفحه عمومی برآورد را بررسی می‌کند",
      body: [
        "صفحه عمومی برآورد نام شرکت، شماره برآورد، عنوان، آیتم‌های خطی، جمع‌ها، یادداشت‌ها و شرایط را نشان می‌دهد.",
        "این صفحه یادداشت‌های داخلی، سودآوری، هزینه نیروی کار، هزینه فروشنده، لاگ‌های ممیزی یا داده‌های فقط حسابداری را نشان نمی‌دهد.",
        "مشتری می‌تواند برآورد را در صفحه عمومی تأیید یا رد کند.",
      ],
      footer: "اگر مشتری تأیید کند، برآورد approved می‌شود. اگر رد کند، برآورد rejected می‌شود.",
    },
    {
      title: "۷. وضعیت‌های برآورد را بشناسید",
      body: [
        "Draft یعنی برآورد در حال آماده‌سازی است.",
        "Sent یعنی برآورد به اشتراک گذاشته شده یا ایمیل شده است.",
        "Viewed یعنی مشتری لینک عمومی را باز کرده است.",
        "Approved یعنی مشتری آن را پذیرفته یا مدیر به‌عنوان حالت اداری جایگزین آن را دستی تأیید کرده است.",
        "Rejected یعنی مشتری آن را رد کرده یا مدیر به‌عنوان حالت اداری جایگزین آن را دستی رد کرده است.",
      ],
      footer: "وضعیت‌های دستی تأیید یا رد فقط حالت جایگزین هستند. آن‌ها معادل پاسخ واقعی مشتری از طریق لینک عمومی نیستند.",
    },
    {
      title: "۸. اگر مشتری تأیید کند",
      body: [
        "بعد از تأیید، مدیر تصمیم می‌گیرد مرحله بعد چیست.",
        "تبدیل به فاکتور، رکورد صورتحساب و پرداخت را ایجاد می‌کند.",
        "ایجاد دستور کار، رکورد عملیاتی کار را ایجاد می‌کند.",
        "این اقدامات باید جدا بمانند چون تأیید برآورد، وصول پرداخت و اجرای کار سه مرحله متفاوت کسب‌وکار هستند.",
      ],
      bullets: ["تبدیل به فاکتور", "ایجاد / کپی لینک پرداخت", "باز کردن لینک پرداخت", "ایجاد دستور کار", "تخصیص تیم"],
      footer: "مسیر عادی: تأیید مشتری -> فاکتور و لینک پرداخت -> دستور کار -> تخصیص -> گزارش میدانی -> بازبینی مدیر.",
    },
    {
      title: "۹. اگر مشتری رد کند یا پاسخ ندهد",
      body: [
        "اگر مشتری رد کرد، یادداشت را بازبینی کنید، برآورد را اصلاح کنید و در صورت لزوم از Revise and Resend استفاده کنید.",
        "اگر مشتری پاسخ نداد، پیگیری کنید. سکوت هرگز نباید به‌عنوان تأیید تلقی شود.",
        "اگر برآورد قبلاً به فاکتور تبدیل شده است، آن را دوباره باز نکنید. تغییرات را از طریق فاکتور مدیریت کنید یا یک برآورد اصلاح‌شده جدید بسازید.",
      ],
      footer: "Viewed بدون پاسخ یعنی پیگیری لازم است. Expired یعنی باید درباره تمدید و ارسال دوباره تصمیم بگیرید.",
    },
    {
      title: "۱۰. فاکتور، پرداخت و دستور کار",
      body: [
        "وقتی مشتری باید پرداخت کند، آن را به فاکتور تبدیل کنید.",
        "وقتی می‌خواهید مشتری آنلاین پرداخت کند از ایجاد/کپی لینک پرداخت یا باز کردن لینک پرداخت استفاده کنید.",
        "وقتی کار آماده برنامه‌ریزی و اجرا است، دستور کار ایجاد کنید.",
        "دستور کار برنامه اجرای کار است. همان برآورد یا فاکتور نیست.",
      ],
      bullets: ["تاریخ‌های کار", "مکان", "دستورالعمل‌ها", "مواد برنامه‌ریزی‌شده", "اعضای تیم تخصیص‌یافته"],
      footer: "مواد برنامه‌ریزی‌شده هنوز موجودی را کم نمی‌کنند.",
    },
    {
      title: "۱۱. کار میدانی کارمند و تأیید مدیر",
      body: [
        "کارکنان دستورهای کار تخصیص‌یافته را می‌بینند و گزارش‌های میدانی ثبت می‌کنند.",
        "گزارش میدانی آنچه در محل رخ داده را ثبت می‌کند. این گزارش به‌تنهایی موجودی یا رکوردهای فاکتور را به‌روزرسانی نمی‌کند.",
        "مدیر گزارش میدانی را بازبینی می‌کند و تصمیم می‌گیرد چه چیزی رسمی شود.",
        "تغییرات موجودی فقط بعد از تأیید بازبینی مدیر اعمال می‌شود.",
      ],
      bullets: ["کارمند گزارش میدانی ثبت می‌کند", "مدیر Field Reports را باز می‌کند", "مدیر Review ایجاد می‌کند", "مدیر تصمیم‌های مواد و صورتحساب را تأیید می‌کند", "دستور کار وقتی بازبینی تأییدشده کار را تمام کند بسته می‌شود"],
      footer: "کارمند گزارش می‌دهد چه اتفاقی افتاده است. مدیر تأیید می‌کند چه چیزی رسمی می‌شود.",
    },
    {
      title: "۱۲. گزارش‌گیری و پایان ماه",
      body: [
        "برای بررسی درآمد، دستمزد، هزینه مواد تأییدشده، هزینه‌های مرتبط و حاشیه برآوردی از Profitability استفاده کنید.",
        "از Tax Summary فقط برای بازبینی حسابدار استفاده کنید. این یک برآورد است، نه ثبت رسمی مالیات.",
        "وقتی در حال بررسی اقلام ناقص و آماده‌سازی خروجی برای حسابدار هستید از Month-End و Reports استفاده کنید.",
      ],
      footer: "گزارش‌ها برای بازبینی و خروجی گرفتن هستند. جایگزین حسابداری رسمی یا ثبت مالیات نیستند.",
    },
  ];
  return translations[index] || entry;
});

COPY.ru.workflowSections = COPY.en.workflowSections.map((entry, index) => {
  const translations = [
    { title: "1. Начинайте с запроса только если цена еще не готова", body: ["Используйте запрос на смету, когда клиенту нужна индивидуальная цена и смета еще не подготовлена.", "Если вы уже понимаете работу достаточно хорошо, чтобы назвать цену сейчас, пропустите запрос и сразу создайте смету.", "Примеры: ремонт протечки на кухне, ремонт шкафа, нестандартная установка или любая работа, где цена зависит от объема.", "Не используйте этот процесс для простой записи с известной ценой. Если услуга, цена, сотрудник и время уже известны, используйте обычный Booking."], bullets: ["Заголовок", "Источник", "Контакт запроса", "Адрес услуги", "Желаемые сроки", "Описание", "Видимые заметки", "Внутренние заметки"], footer: "Запрос на смету — это стартовая запись. Это не смета, не счет и не наряд." },
    { title: "2. Привяжите или создайте клиента", body: ["Контакт запроса — это человек, который попросил цену.", "Связанный клиент — это официальный профиль клиента для смет, счетов и нарядов.", "Перед созданием сметы привяжите запрос к правильному клиенту или создайте нового клиента из контакта запроса."], footer: "Смета, счет, ссылка на оплату и наряд должны быть связаны с официальным профилем клиента." },
    { title: "3. Сразу создайте смету, если цена уже понятна", body: ["Если клиент пришел лично, позвонил или написал, и вы уже понимаете объем работ, переходите сразу в Estimates.", "Создайте смету, проверьте позиции, заметки, условия, налог и срок действия, затем отправьте ее клиенту на одобрение.", "Это часто самый простой путь для сантехники, электрики, ремонта или повторяющихся сервисных работ, где менеджер может сразу назвать цену."], footer: "Запрос на смету нужен не для каждого заказа. Когда цена уже понятна, запрос можно пропустить." },
    { title: "4. Создайте смету", body: ["Создавайте смету, когда готовы подготовить цену для клиента.", "Перед отправкой проверьте клиента, название сметы, дату выпуска, срок действия, заметки, условия, налог и позиции.", "Если по запросу уже создана смета, откройте существующую вместо создания новой."], bullets: ["Название сметы", "Дата выпуска", "Срок действия", "Видимые заметки", "Условия", "Позиции", "Налог и скидка"], footer: "Смета — это предлагаемая цена за работу." },
    { title: "5. Поделитесь сметой", body: ["Лучшее действие — Отправить смету. Оно отправляет клиенту публичную ссылку на смету.", "Также можно использовать Создать / Копировать ссылку, Открыть ссылку, Печать / PDF или Копировать сводку, если нужен ручной способ отправки.", "WhatsApp, SMS и личная почта пока остаются ручными, если позже не будет добавлена автоматизация."], footer: "Отметить как отправленную вручную — это только внутренний ярлык статуса. Он не доказывает, что клиент получил или одобрил смету." },
    { title: "6. Клиент просматривает публичную страницу сметы", body: ["Публичная страница сметы показывает название компании, номер сметы, заголовок, позиции, итоги, заметки и условия.", "Она не показывает внутренние заметки, прибыльность, затраты на труд, затраты поставщика, журналы аудита или данные только для учета.", "Клиент может принять или отклонить смету на публичной странице."], footer: "Если клиент принимает, смета становится approved. Если отклоняет — rejected." },
    { title: "7. Поймите статусы сметы", body: ["Draft означает, что смета готовится.", "Sent означает, что она была отправлена или поделена.", "Viewed означает, что клиент открыл публичную ссылку.", "Approved означает, что клиент ее принял или менеджер отметил принятой вручную как административный запасной вариант.", "Rejected означает, что клиент отклонил ее или менеджер отметил отклоненной вручную как административный запасной вариант."], footer: "Ручные статусы принятия или отклонения — это только запасной вариант. Они не равны реальному ответу клиента через публичную ссылку." },
    { title: "8. Если клиент принял", body: ["После одобрения менеджер решает, что будет дальше.", "Преобразование в счет создает запись оплаты и биллинга.", "Создание наряда создает операционную запись работы.", "Эти действия должны оставаться отдельными, потому что одобрение сметы, сбор оплаты и выполнение работы — это разные шаги бизнеса."], bullets: ["Преобразовать в счет", "Создать / Копировать ссылку на оплату", "Открыть ссылку на оплату", "Создать наряд", "Назначить команду"], footer: "Обычный путь: клиент принимает -> счет и ссылка на оплату -> наряд -> назначение -> полевой отчет -> проверка менеджера." },
    { title: "9. Если клиент отклоняет или не отвечает", body: ["Если клиент отклонил, изучите заметку, исправьте смету и используйте Revise and Resend при необходимости.", "Если клиент не отвечает, сделайте напоминание. Молчание не должно считаться согласием.", "Если смета уже преобразована в счет, не открывайте ее заново. Вносите изменения через счет или создайте новую пересмотренную смету."], footer: "Viewed без ответа означает, что нужно напомнить. Expired означает, что нужно решить, продлевать ли срок и отправлять заново." },
    { title: "10. Счет, оплата и наряд", body: ["Преобразуйте в счет, когда клиенту нужно оплатить.", "Используйте Создать / Копировать ссылку на оплату или Открыть ссылку на оплату, когда хотите, чтобы клиент оплатил онлайн.", "Создайте наряд, когда работа готова к планированию и выполнению.", "Наряд — это план работы. Это не то же самое, что смета или счет."], bullets: ["Даты работ", "Локация", "Инструкции", "Плановые материалы", "Назначенные участники команды"], footer: "Плановые материалы пока не уменьшают складские остатки." },
    { title: "11. Полевые работы сотрудников и утверждение менеджера", body: ["Сотрудники видят назначенные наряды и отправляют полевые отчеты.", "Полевой отчет фиксирует, что произошло на месте. Сам по себе он не обновляет склад или счета.", "Менеджер проверяет полевой отчет и решает, что становится официальным.", "Изменения по складу происходят только после утверждения проверки менеджером."], bullets: ["Сотрудник отправляет полевой отчет", "Менеджер открывает Field Reports", "Менеджер создает Review", "Менеджер утверждает решения по материалам и биллингу", "Наряд закрывается, когда утвержденная проверка завершает работу"], footer: "Сотрудник сообщает, что произошло. Менеджер утверждает, что становится официальным." },
    { title: "12. Отчеты и конец месяца", body: ["Используйте Profitability для просмотра выручки, труда, утвержденной стоимости материалов, связанных расходов и оценочной маржи.", "Используйте Tax Summary только для проверки бухгалтером. Это оценка, а не официальная налоговая отчетность.", "Используйте Month-End и Reports, когда проверяете недостающие элементы и готовите выгрузки для бухгалтера."], footer: "Отчеты нужны для проверки и экспорта. Они не заменяют формальный учет или налоговую отчетность." },
  ];
  return translations[index] || entry;
});

COPY.zh.workflowSections = COPY.en.workflowSections.map((entry, index) => {
  const translations = [
    { title: "1. 只有在价格还没准备好时才从报价请求开始", body: ["当客户需要定制定价且你还没有准备报价单时，请使用报价请求。", "如果你现在已经足够了解这项工作并能立即定价，就跳过报价请求，直接创建报价单。", "例如：厨房漏水维修、柜体维修、定制安装，或任何价格取决于工作范围的项目。", "不要把这个流程用于已知价格的简单预约。如果服务、价格、员工和时间都已明确，请改用普通 Booking 流程。"], bullets: ["标题", "来源", "请求联系人", "服务地址", "期望时间", "描述", "可见备注", "内部备注"], footer: "报价请求是起始记录，不是报价单、发票或工单。" },
    { title: "2. 关联或创建客户", body: ["请求联系人是提出报价需求的人。", "关联客户是用于报价单、发票和工单的正式客户档案。", "在创建报价单前，请先把报价请求关联到正确客户，或根据请求联系人创建新客户。"], footer: "报价单、发票、付款链接和工单都应连接到正式客户档案。" },
    { title: "3. 当你已经知道价格时直接创建报价单", body: ["如果客户是到店、来电或发消息，而你已经足够了解范围并能马上定价，就直接进入 Estimates。", "创建报价单，检查明细项、备注、条款、税额和到期日，然后发送给客户批准。", "这通常是管道、电工、维修或重复性服务工作中最简单的路径，因为经理可以立即给出价格。"], footer: "不是每个工作都需要报价请求。当价格已经明确时，报价请求是可选的。" },
    { title: "4. 创建报价单", body: ["当你准备好面向客户的价格方案时，创建报价单。", "分享前请检查客户、报价标题、签发日期、到期日期、备注、条款、税额和明细项。", "如果该请求已经生成报价单，请打开现有报价单，而不是再建一个。"], bullets: ["报价标题", "签发日期", "到期日期", "可见备注", "条款", "明细项", "税额和折扣"], footer: "报价单就是这项工作的对客报价。" },
    { title: "5. 分享报价单", body: ["最佳操作是发送报价单。这样会把公开报价链接发送给客户。", "如果需要手动分享，也可以使用创建/复制链接、打开链接、打印/PDF 或复制摘要。", "WhatsApp、短信和个人邮箱目前仍是手动方式，除非以后增加自动化。"], footer: "手动标记为已发送只是内部状态捷径，不能证明客户已收到或已批准报价单。" },
    { title: "6. 客户查看公开报价页面", body: ["公开报价页面会显示公司名称、报价编号、标题、明细项、总额、备注和条款。", "它不会显示内部备注、盈利能力、人工成本、供应商成本、审计日志或仅供财务使用的数据。", "客户可以在公开页面上批准或拒绝报价。"], footer: "如果客户批准，报价单会变成 approved；如果拒绝，则变成 rejected。" },
    { title: "7. 理解报价状态", body: ["Draft 表示报价单仍在准备中。", "Sent 表示报价单已经分享或已通过邮件发送。", "Viewed 表示客户打开了公开链接。", "Approved 表示客户已接受，或经理作为管理补救手段手动标记为已接受。", "Rejected 表示客户已拒绝，或经理作为管理补救手段手动标记为已拒绝。"], footer: "经理手动批准或拒绝只是补救状态，不等同于客户通过公开链接给出的真实回应。" },
    { title: "8. 如果客户接受", body: ["批准后，由经理决定下一步。", "转为发票会创建计费和收款记录。", "创建工单会生成运营执行记录。", "这些动作应保持分开，因为报价批准、收款和工作执行是不同的业务步骤。"], bullets: ["转为发票", "创建 / 复制付款链接", "打开付款链接", "创建工单", "分配团队"], footer: "常见路径：客户批准 -> 发票和付款链接 -> 工单 -> 分配 -> 现场报告 -> 经理审核。" },
    { title: "9. 如果客户拒绝或未回复", body: ["如果客户拒绝，请查看备注，修改报价，并在合适时使用 Revise and Resend。", "如果客户没有回应，请跟进。沉默绝不能视为批准。", "如果报价单已经转为发票，不要重新打开它。应通过发票处理变更，或创建新的修订报价单。"], footer: "Viewed 但无回应表示需要跟进。Expired 表示要决定是否延长并重新发送。" },
    { title: "10. 发票、付款和工单", body: ["当客户需要付款时，转为发票。", "如果希望客户在线支付，请使用创建/复制付款链接或打开付款链接。", "当工作准备好排期和执行时，创建工单。", "工单是工作执行计划，并不等同于报价单或发票。"], bullets: ["工作日期", "地点", "说明", "计划材料", "已分配团队成员"], footer: "计划材料暂时不会扣减库存。" },
    { title: "11. 员工现场工作和经理批准", body: ["员工可以看到已分配的工单并提交现场报告。", "现场报告记录现场发生了什么，但不会单独更新库存或发票记录。", "经理复核现场报告，并决定哪些内容成为正式记录。", "只有经理审核批准后，库存才会发生变化。"], bullets: ["员工提交现场报告", "经理打开 Field Reports", "经理创建 Review", "经理批准材料和计费决定", "当已批准的审核完成工作时，工单关闭"], footer: "员工报告实际情况，经理批准哪些内容成为正式记录。" },
    { title: "12. 报表和月末", body: ["使用 Profitability 查看收入、人工、已批准材料成本、关联费用和预计利润。", "Tax Summary 只供会计复核使用。它是估算值，不是正式报税。", "在检查缺失项并准备导出给会计时，使用 Month-End 和 Reports。"], footer: "报表用于复核和导出，不替代正式会计或税务申报。" },
  ];
  return translations[index] || entry;
});

COPY.fa.workflowLocations = [
  { title: "عملیات روزانه", items: [{ label: "نقل‌قول‌ها", text: "درخواست‌های مشتری برای قیمت سفارشی را ثبت کنید." }, { label: "برآوردها", text: "قیمت مشتری را آماده و به اشتراک بگذارید." }, { label: "دستور کارها", text: "کار را برنامه‌ریزی و مدیریت کنید." }, { label: "هزینه‌ها", text: "هزینه‌های روزمره کسب‌وکار را ثبت کنید." }] },
  { title: "اجرای میدانی", items: [{ label: "مواد و ملزومات", text: "اقلام موجودی و در دسترس بودن مواد را پیگیری کنید." }, { label: "خریدها", text: "خرید موجودی و هزینه‌های مرتبط را ثبت کنید." }, { label: "گزارش‌های میدانی", text: "آنچه کارکنان از میدان ثبت کرده‌اند را بازبینی کنید." }, { label: "بازبینی‌ها", text: "تأیید کنید چه چیزی برای موجودی و صورتحساب رسمی می‌شود." }] },
  { title: "گزارش‌گیری", items: [{ label: "سودآوری", text: "عملکرد کار را قبل از پایان ماه بررسی کنید." }, { label: "خلاصه مالیات", text: "مالیات برآوردی را برای پیگیری حسابدار بررسی کنید." }, { label: "گزارش‌ها", text: "فاکتورها، هزینه‌ها و خلاصه‌ها را خروجی بگیرید." }, { label: "پایان ماه", text: "اقلام ناقص را بررسی و خروجی‌ها را آماده کنید." }] },
  { title: "راه‌اندازی", items: [{ label: "تأمین‌کنندگان", text: "اطلاعات تأمین‌کننده را یکجا نگه دارید." }, { label: "دسته‌بندی مواد", text: "اقلام موجودی را بدون مخلوط کردن با دسته‌بندی هزینه‌ها سازمان‌دهی کنید." }] },
];
COPY.ru.workflowLocations = [
  { title: "Ежедневные операции", items: [{ label: "Запросы", text: "Фиксируйте запросы клиентов на индивидуальную цену." }, { label: "Сметы", text: "Готовьте и отправляйте цены клиентам." }, { label: "Наряды", text: "Планируйте и ведите работу." }, { label: "Расходы", text: "Записывайте повседневные бизнес-расходы." }] },
  { title: "Выездное выполнение", items: [{ label: "Материалы и запасы", text: "Следите за складскими позициями и доступностью материалов." }, { label: "Закупки", text: "Фиксируйте закупки запасов и связанные расходы." }, { label: "Полевые отчеты", text: "Проверяйте, что сотрудники отправили с выезда." }, { label: "Проверки", text: "Утверждайте, что становится официальным для склада и биллинга." }] },
  { title: "Отчетность", items: [{ label: "Прибыльность", text: "Проверяйте результативность работ до конца месяца." }, { label: "Сводка по налогам", text: "Проверяйте оценочный налог для бухгалтера." }, { label: "Отчеты", text: "Экспортируйте счета, расходы и сводки." }, { label: "Конец месяца", text: "Проверяйте недостающие элементы и готовьте выгрузки." }] },
  { title: "Настройка", items: [{ label: "Поставщики", text: "Храните данные поставщиков в одном месте." }, { label: "Категории материалов", text: "Организуйте складские позиции отдельно от категорий расходов." }] },
];
COPY.zh.workflowLocations = [
  { title: "日常运营", items: [{ label: "报价", text: "记录客户的定制定价请求。" }, { label: "报价单", text: "准备并分享客户报价。" }, { label: "工单", text: "规划并管理工作。" }, { label: "支出", text: "记录日常业务成本。" }] },
  { title: "现场执行", items: [{ label: "材料与耗材", text: "跟踪库存项目和材料可用性。" }, { label: "采购", text: "记录库存采购及相关费用。" }, { label: "现场报告", text: "复核员工从现场提交的内容。" }, { label: "审核", text: "批准哪些内容会正式影响库存和计费。" }] },
  { title: "报表", items: [{ label: "盈利能力", text: "在月末前查看工作表现。" }, { label: "税务汇总", text: "查看供会计跟进的税务估算。" }, { label: "报表", text: "导出发票、费用和汇总。" }, { label: "月末", text: "查看缺失项并准备导出。" }] },
  { title: "设置", items: [{ label: "供应商", text: "把供应商资料集中保存在一处。" }, { label: "材料分类", text: "整理库存项目，不要与费用分类混在一起。" }] },
];

COPY.fa.scenarios = [
  { title: "سناریو ۱: کار تعمیر سفارشی", summary: "وقتی مشتری قبل از زمان‌بندی کار به قیمت سفارشی نیاز دارد از این مسیر استفاده کنید.", steps: ["مشتری برای تعمیر نشتی آشپزخانه قیمت می‌خواهد.", "مدیر در Quotes یک درخواست قیمت ایجاد می‌کند.", "مدیر رکورد مشتری را لینک می‌کند یا می‌سازد.", "مدیر برآورد را ایجاد می‌کند و صفحه عمومی برآورد را بررسی می‌کند.", "مدیر لینک برآورد را ارسال می‌کند.", "مشتری برآورد را تأیید می‌کند.", "مدیر در صورت نیاز به فاکتور تبدیل می‌کند، لینک پرداخت می‌سازد و دستور کار ایجاد می‌کند.", "بعد از کار، کارمند گزارش میدانی ثبت می‌کند.", "مدیر بازبینی را تأیید می‌کند و دستور کار بسته می‌شود."] },
  { title: "سناریو ۲: کار فوری قبل از پرداخت", summary: "وقتی مشتری سریع تأیید می‌کند و تیم باید سریع حرکت کند از این مسیر استفاده کنید.", steps: ["مشتری بلافاصله برآورد را تأیید می‌کند.", "مدیر بلافاصله دستور کار را ایجاد می‌کند تا تیم تخصیص یابد.", "مدیر بسته به سیاست شرکت، قبل یا بعد از زمان‌بندی فاکتور ایجاد کرده و لینک پرداخت را می‌فرستد.", "کارمند کار را انجام می‌دهد و گزارش میدانی ثبت می‌کند.", "مدیر بازبینی را تأیید می‌کند تا تصمیم‌های موجودی و صورتحساب نهایی شوند."] },
  { title: "سناریو ۳: مشتری رد می‌کند و نیاز به اصلاح است", summary: "وقتی دامنه، قیمت یا شرایط باید تغییر کند از این مسیر استفاده کنید.", steps: ["مشتری برآورد را رد می‌کند و یادداشت می‌گذارد.", "مدیر دلیل رد را بررسی می‌کند.", "مدیر آیتم‌ها، دامنه، یادداشت‌ها یا شرایط را به‌روزرسانی می‌کند.", "مدیر از Revise and Resend استفاده می‌کند تا پاسخ قبلی پاک شود و برآورد دوباره ارسال شود.", "مشتری برآورد به‌روزشده را می‌بیند و دوباره پاسخ می‌دهد."] },
  { title: "سناریو ۴: ارسال شده ولی پاسخی نیست", summary: "وقتی مشتری هنوز برآورد را تأیید یا رد نکرده است از این مسیر استفاده کنید.", steps: ["اگر برآورد ارسال شده ولی دیده نشده، آدرس ایمیل را بررسی و لینک را دوباره بفرستید.", "اگر برآورد دیده شده ولی پاسخی نیست، پیگیری کنید و بپرسید آیا تغییری لازم است یا نه.", "اگر برآورد منقضی شده، تصمیم بگیرید انقضا تمدید شود و دوباره ارسال شود یا نه.", "وقتی مشتری ساکت است هرگز آن را تأیید تلقی نکنید."] },
  { title: "سناریو ۵: تأیید تلفنی یا واتساپی", summary: "از وضعیت تأیید دستی فقط زمانی استفاده کنید که مشتری به‌وضوح خارج از پورتال تأیید کرده باشد.", steps: ["دامنه، جمع، مالیات و شرایط را با مشتری تأیید کنید.", "مدرک را در یادداشت‌های داخلی ثبت کنید.", "برآورد را فقط به‌عنوان راه‌حل اداری جایگزین، دستی accepted کنید.", "در صورت امکان برای مشتری یادداشت تأیید بفرستید.", "اگر ممکن است، مشتری را راهنمایی کنید تا از لینک عمومی برآورد تأیید کند. این بهترین سابقه پاسخ را ایجاد می‌کند."] },
  { title: "سناریو ۶: قبل از زمان‌بندی، پیش‌پرداخت لازم است", summary: "وقتی قبل از رزرو کار پرداخت لازم است از این مسیر استفاده کنید.", steps: ["مشتری برآورد را تأیید می‌کند.", "مدیر برآورد را به فاکتور تبدیل می‌کند.", "مدیر لینک پرداخت می‌سازد یا کپی می‌کند.", "مدیر لینک پرداخت را ارسال می‌کند.", "مدیر بعد از تحقق شرط پرداخت یا پیش‌پرداخت، دستور کار را ایجاد می‌کند."] },
];
COPY.ru.scenarios = [
  { title: "Сценарий 1: индивидуальный ремонт", summary: "Используйте это, когда клиенту нужна индивидуальная цена до назначения работы.", steps: ["Клиент просит цену на ремонт протечки на кухне.", "Менеджер создает запрос в разделе Quotes.", "Менеджер привязывает или создает профиль клиента.", "Менеджер создает смету и проверяет публичную страницу сметы.", "Менеджер отправляет ссылку на смету.", "Клиент принимает смету.", "Менеджер преобразует ее в счет, при необходимости создает ссылку на оплату и создает наряд.", "После работы сотрудник отправляет полевой отчет.", "Менеджер утверждает проверку, и наряд закрывается."] },
  { title: "Сценарий 2: срочная работа до оплаты", summary: "Используйте это, когда клиент быстро одобряет и команде нужно действовать быстро.", steps: ["Клиент сразу одобряет смету.", "Менеджер сразу создает наряд, чтобы можно было назначить команду.", "Менеджер преобразует в счет и отправляет ссылку на оплату до или после планирования — по политике компании.", "Сотрудник выполняет работу и отправляет полевой отчет.", "Менеджер утверждает проверку, чтобы финализировать решения по складу и биллингу."] },
  { title: "Сценарий 3: клиент отклоняет и нужна правка", summary: "Используйте это, когда нужно изменить объем, цену или условия.", steps: ["Клиент отклоняет смету и оставляет заметку.", "Менеджер изучает причину отклонения.", "Менеджер обновляет позиции, объем, заметки или условия.", "Менеджер использует Revise and Resend, чтобы сбросить старый ответ и отправить смету заново.", "Клиент просматривает обновленную смету и отвечает снова."] },
  { title: "Сценарий 4: отправлено, но нет ответа", summary: "Используйте это, когда клиент еще не принял и не отклонил смету.", steps: ["Если смета отправлена, но не просмотрена, проверьте адрес почты и отправьте ссылку заново.", "Если смета просмотрена, но ответа нет, свяжитесь и уточните, нужны ли изменения.", "Если смета истекла, решите, нужно ли продлить срок и отправить заново.", "Никогда не считайте молчание согласием."] },
  { title: "Сценарий 5: одобрение по телефону или WhatsApp", summary: "Используйте ручной статус принятия только если клиент явно одобрил вне портала.", steps: ["Подтвердите объем, итог, налог и условия с клиентом.", "Зафиксируйте подтверждение во внутренних заметках.", "Отметьте смету как принятую вручную только как административный запасной вариант.", "По возможности отправьте клиенту подтверждающее сообщение.", "Если возможно, направьте клиента принять смету через публичную ссылку. Это создает самый чистый след ответа."] },
  { title: "Сценарий 6: требуется депозит до планирования", summary: "Используйте это, когда оплата нужна до бронирования работы.", steps: ["Клиент принимает смету.", "Менеджер преобразует смету в счет.", "Менеджер создает или копирует ссылку на оплату.", "Менеджер отправляет ссылку на оплату.", "Менеджер создает наряд после выполнения правила оплаты или депозита."] },
];
COPY.zh.scenarios = [
  { title: "场景 1：定制维修工作", summary: "当客户需要先拿到定制价格后才能安排工作时，使用这个流程。", steps: ["客户咨询厨房漏水维修价格。", "经理在 Quotes 中创建报价请求。", "经理关联或创建客户档案。", "经理创建报价单并检查公开报价页面。", "经理发送报价链接。", "客户批准报价单。", "经理转为发票，按需创建付款链接，并创建工单。", "工作完成后，员工提交现场报告。", "经理批准审核，工单关闭。"] },
  { title: "场景 2：付款前的紧急工作", summary: "当客户很快批准而团队需要立刻推进时，使用这个流程。", steps: ["客户立即批准报价单。", "经理马上创建工单，以便分配团队。", "经理根据公司政策，在排期前或排期后转为发票并发送付款链接。", "员工完成工作并提交现场报告。", "经理批准审核，以最终确定库存和计费决定。"] },
  { title: "场景 3：客户拒绝并需要修订", summary: "当范围、价格或条款需要变更时，使用这个流程。", steps: ["客户拒绝报价单并留下备注。", "经理查看拒绝原因。", "经理更新明细项、范围、备注或条款。", "经理使用 Revise and Resend 清除旧回应并重新分享报价单。", "客户查看更新后的报价单并再次回应。"] },
  { title: "场景 4：已发送但无回应", summary: "当客户尚未批准或拒绝报价单时，使用这个流程。", steps: ["如果报价单已发送但未被查看，请确认邮箱地址并重新发送链接。", "如果报价单已被查看但没有回应，请跟进并确认是否需要修改。", "如果报价单已过期，请决定是否延长有效期并重新发送。", "不要把客户沉默视为批准。"] },
  { title: "场景 5：电话或 WhatsApp 批准", summary: "只有当客户明确在门户外批准时，才使用手动批准状态。", steps: ["与客户确认范围、总额、税额和条款。", "把证明记录在内部备注中。", "仅作为管理补救手段手动将报价标记为已接受。", "如有可能，给客户回发确认说明。", "如果可以，请引导客户通过公开报价链接进行接受，这样会留下最清晰的回应记录。"] },
  { title: "场景 6：排期前需要定金", summary: "当工作预约前必须先付款时，使用这个流程。", steps: ["客户批准报价单。", "经理将报价单转为发票。", "经理创建或复制托管付款链接。", "经理发送付款链接。", "在满足付款或定金规则后，经理创建工单。"] },
];

function BodyCopy({ children }) {
  return (
    <Typography variant="body2" color="text.secondary">
      {children}
    </Typography>
  );
}

function SectionList({ items }) {
  return (
    <List dense disablePadding>
      {items.map((item) => (
        <ListItem key={item} disableGutters sx={{ py: 0.125 }}>
          <ListItemText
            primary={`- ${item}`}
            primaryTypographyProps={{ variant: "body2", color: "text.secondary" }}
          />
        </ListItem>
      ))}
    </List>
  );
}

export default function BusinessFinanceHelpDrawer({ open, onClose }) {
  const theme = useTheme();
  const { i18n } = useTranslation();
  const [tab, setTab] = useState(0);
  const locale = (i18n.resolvedLanguage || i18n.language || "en").split("-")[0];
  const copy = COPY[locale] || COPY.en;

  const summaryChipLabels = useMemo(() => copy.chips, [copy]);

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 620 },
          maxWidth: "100%",
          backgroundColor: theme.palette.background.paper,
        },
      }}
    >
      <Stack sx={{ height: "100%" }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ p: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}
        >
          <Box>
            <Typography variant="h6" fontWeight={900}>{copy.headerTitle}</Typography>
            <Typography variant="body2" color="text.secondary">
              {copy.headerSubtitle}
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label={copy.closeAria}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Tabs
          value={tab}
          onChange={(_, next) => setTab(next)}
          variant="fullWidth"
          sx={{ px: 2.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}
        >
          <Tab label={copy.tabs[0]} />
          <Tab label={copy.tabs[1]} />
        </Tabs>

        <Stack spacing={2} sx={{ p: 2.5, overflowY: "auto" }}>
          {tab === 0 ? (
            <>
              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.introTitle}</Typography>
                <Stack spacing={1}>
                  {copy.introBody.map((line) => <BodyCopy key={line}>{line}</BodyCopy>)}
                </Stack>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.workflowTitle}</Typography>
                <Stack spacing={1}>
                  {copy.workflowSections.map((entry, index) => (
                    <Accordion
                      key={entry.title}
                      disableGutters
                      defaultExpanded={index === 0}
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, "&:before": { display: "none" } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="subtitle2" fontWeight={800}>{entry.title}</Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Stack spacing={1.25}>
                          {entry.body.map((line) => <BodyCopy key={line}>{line}</BodyCopy>)}
                          {entry.bullets?.length ? <SectionList items={entry.bullets} /> : null}
                          {entry.footer ? (
                            <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 1, backgroundColor: theme.palette.background.default }}>
                              <Typography variant="body2" fontWeight={700}>{entry.footer}</Typography>
                            </Paper>
                          ) : null}
                        </Stack>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.whereTitle}</Typography>
                <Grid container spacing={1.5}>
                  {copy.workflowLocations.map((group) => (
                    <Grid item xs={12} sm={6} key={group.title}>
                      <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25, height: "100%" }}>
                        <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.75 }}>{group.title}</Typography>
                        <Stack spacing={0.75}>
                          {group.items.map((item) => (
                            <Box key={item.label}>
                              <Typography variant="body2" fontWeight={700}>{item.label}</Typography>
                              <Typography variant="body2" color="text.secondary">{item.text}</Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.rulesTitle}</Typography>
                <SectionList items={copy.rules} />
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.notAutomaticTitle}</Typography>
                <SectionList items={copy.notAutomatic} />
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.rememberTitle}</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <Typography variant="body2" fontWeight={700}>{copy.rememberBody}</Typography>
                </Paper>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.shortTitle}</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
                    {summaryChipLabels.map((label) => (
                      <Chip key={label} label={label} size="small" variant="outlined" />
                    ))}
                  </Stack>
                  <SectionList items={copy.shortItems} />
                </Paper>
              </section>
            </>
          ) : (
            <>
              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.scenariosTitle}</Typography>
                <Stack spacing={1}>
                  <BodyCopy>{copy.scenariosIntro}</BodyCopy>
                </Stack>
              </section>

              <Divider />

              <section>
                <Stack spacing={1}>
                  {copy.scenarios.map((scenario, index) => (
                    <Accordion
                      key={scenario.title}
                      disableGutters
                      defaultExpanded={index === 0}
                      elevation={0}
                      sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 1, "&:before": { display: "none" } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Stack spacing={0.25}>
                          <Typography variant="subtitle2" fontWeight={800}>{scenario.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{scenario.summary}</Typography>
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <SectionList items={scenario.steps} />
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Stack>
              </section>

              <Divider />

              <section>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>{copy.checklistTitle}</Typography>
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 1.25 }}>
                  <SectionList items={copy.checklist} />
                </Paper>
              </section>
            </>
          )}
        </Stack>

        <Box sx={{ p: 2.5, borderTop: `1px solid ${alpha(theme.palette.divider, 0.8)}` }}>
          <Button fullWidth variant="contained" onClick={onClose}>{copy.closeButton}</Button>
        </Box>
      </Stack>
    </Drawer>
  );
}
