
/* =========================================
   PUBLIC LIBRARY MANAGEMENT SYSTEM
   ========================================= */

const $ = id => document.getElementById(id);

const STORAGE = "library_system_v2";
const FINE_PER_DAY = 5;

let language = localStorage.getItem("library_language") || "en";
let bookType = "physical";
let data;
let currentUser = null;
let activePage = "dashboard";

/* =========================================
   TRANSLATIONS
   ========================================= */

const translations = {
    en: {
        dashboard: "Dashboard",
        books: "Books",
        members: "Members",
        loans: "Loans",
        reservations: "Reservations",
        fines: "Fines",
        welcome: "Welcome to the Library Management System",
        welcomeDesc: "Manage books, members and library operations.",
        totalBooks: "Total Books",
        physicalBooks: "Physical Books",
        digitalBooks: "Digital Books",
        activeLoans: "Active Loans",
        recentLoans: "Recent Loans",
        bookManagement: "Book Management",
        bookDesc: "Manage physical and digital books.",
        addBook: "Add Book",
        physical: "Physical Books",
        digital: "Digital Books",
        image: "Image",
        title: "Title",
        author: "Author",
        category: "Category",
        isbn: "ISBN",
        availability: "Availability",
        actions: "Actions",
        memberManagement: "Member Management",
        memberDesc: "Manage registered library members.",
        addMember: "Add Member",
        memberId: "Member ID",
        name: "Name",
        email: "Email",
        phone: "Phone",
        joined: "Joined",
        loanManagement: "Loan Management",
        loanDesc: "Borrow and return physical and digital books.",
        newLoan: "New Loan",
        member: "Member",
        book: "Book",
        borrowDate: "Borrow Date",
        dueDate: "Due Date",
        status: "Status",
        reservationDesc: "Manage book reservations.",
        newReservation: "New Reservation",
        date: "Date",
        fineDesc: "Manage overdue book payments.",
        loanId: "Loan ID",
        amount: "Amount",
        totalCopies: "Total Copies",
        borrowed: "Borrowed",
        available: "Available",
        bookType: "Book Type",
        themeLight: "Light Mode",
        themeDark: "Dark Mode"
    },

    ar: {
        dashboard: "لوحة التحكم",
        books: "الكتب",
        members: "الأعضاء",
        loans: "الإعارات",
        reservations: "الحجوزات",
        fines: "الغرامات",
        welcome: "مرحباً بك في نظام إدارة المكتبة",
        welcomeDesc: "إدارة الكتب والأعضاء وعمليات المكتبة.",
        totalBooks: "إجمالي الكتب",
        physicalBooks: "الكتب الورقية",
        digitalBooks: "الكتب الرقمية",
        activeLoans: "الإعارات النشطة",
        recentLoans: "أحدث الإعارات",
        bookManagement: "إدارة الكتب",
        bookDesc: "إدارة الكتب الورقية والرقمية.",
        addBook: "إضافة كتاب",
        physical: "الكتب الورقية",
        digital: "الكتب الرقمية",
        image: "الصورة",
        title: "العنوان",
        author: "المؤلف",
        category: "التصنيف",
        isbn: "ISBN",
        availability: "التوفر",
        actions: "الإجراءات",
        memberManagement: "إدارة الأعضاء",
        memberDesc: "إدارة أعضاء المكتبة المسجلين.",
        addMember: "إضافة عضو",
        memberId: "رقم العضوية",
        name: "الاسم",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        joined: "تاريخ التسجيل",
        loanManagement: "إدارة الإعارات",
        loanDesc: "استعارة وإرجاع الكتب الورقية والرقمية.",
        newLoan: "استعارة جديدة",
        member: "العضو",
        book: "الكتاب",
        borrowDate: "تاريخ الاستعارة",
        dueDate: "موعد الإرجاع",
        status: "الحالة",
        reservationDesc: "إدارة حجوزات الكتب.",
        newReservation: "حجز جديد",
        date: "التاريخ",
        fineDesc: "إدارة غرامات التأخير.",
        loanId: "رقم الإعارة",
        amount: "المبلغ",
        totalCopies: "إجمالي النسخ",
        borrowed: "المستعار",
        available: "المتاح",
        bookType: "نوع الكتاب",
        themeLight: "الوضع الفاتح",
        themeDark: "الوضع الداكن"
    }
};

function t(key) {
    return translations[language][key] || key;
}

/* =========================================
   BASIC HELPERS
   ========================================= */

function today() {
    const d = new Date();

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function addDays(date, days) {
    const d = new Date(date + "T12:00:00");
    d.setDate(d.getDate() + days);

    return [
        d.getFullYear(),
        String(d.getMonth() + 1).padStart(2, "0"),
        String(d.getDate()).padStart(2, "0")
    ].join("-");
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

function money(value) {
    return Number(value || 0).toFixed(2) + " EGP";
}

function toast(message) {
    $("toast").textContent = message;
    $("toast").classList.add("show");

    clearTimeout(toast.timer);

    toast.timer = setTimeout(() => {
        $("toast").classList.remove("show");
    }, 2500);
}

function emptyRow(columns) {
    return `<tr><td colspan="${columns}" class="empty">
        ${language === "en" ? "No records found" : "لا توجد بيانات"}
    </td></tr>`;
}

function cloneData(value) {
    return JSON.parse(JSON.stringify(value));
}

function newId(type) {
    data.next[type]++;
    return data.next[type] - 1;
}

function bookById(id) {
    return data.books.find(b => b.id === Number(id));
}

function memberById(id) {
    return data.members.find(m => m.id === Number(id));
}

function dateDifference(a, b) {
    return Math.max(0, Math.floor(
        (new Date(a + "T12:00:00") -
         new Date(b + "T12:00:00")) / 86400000
    ));
}

function loanStatus(loan) {
    if (loan.returned) return "returned";

    return today() > loan.dueDate ? "overdue" : "active";
}

function badge(status) {
    const labels = {
        active: ["Active", "green"],
        returned: ["Returned", "gray"],
        overdue: ["Overdue", "red"],
        pending: ["Pending", "orange"],
        cancelled: ["Cancelled", "gray"],
        fulfilled: ["Fulfilled", "green"],
        paid: ["Paid", "green"],
        unpaid: ["Unpaid", "red"]
    };

    const ar = {
        active: "نشطة",
        returned: "تم الإرجاع",
        overdue: "متأخرة",
        pending: "قيد الانتظار",
        cancelled: "ملغاة",
        fulfilled: "تم التنفيذ",
        paid: "مدفوعة",
        unpaid: "غير مدفوعة"
    };

    const [en, color] = labels[status] || [status, "gray"];

    return `<span class="badge ${color}">
        ${language === "ar" ? (ar[status] || en) : en}
    </span>`;
}

/* =========================================
   INITIAL DATABASE
   ========================================= */

const initialData = {
    users: [],

    books: [
        {
            id: 101,
            title: "Introduction to Computer Science",
            author: "John Smith",
            category: "Computer Science",
            isbn: "978100000001",
            type: "physical",
            total: 5,
            available: 3,
            image: ""
        },
        {
            id: 102,
            title: "Database Systems",
            author: "Thomas Connolly",
            category: "Computer Science",
            isbn: "978100000002",
            type: "physical",
            total: 4,
            available: 4,
            image: ""
        },
        {
            id: 103,
            title: "Clean Code",
            author: "Robert C. Martin",
            category: "Programming",
            isbn: "978100000003",
            type: "physical",
            total: 3,
            available: 2,
            image: ""
        },
        {
            id: 104,
            title: "Computer Networks",
            author: "Andrew Tanenbaum",
            category: "Networking",
            isbn: "978100000004",
            type: "physical",
            total: 6,
            available: 6,
            image: ""
        },
        {
            id: 201,
            title: "Python Programming Guide",
            author: "Mark Lutz",
            category: "Programming",
            isbn: "978200000001",
            type: "digital",
            total: 10,
            available: 10,
            link: "https://www.python.org/about/gettingstarted/",
            image: ""
        },
        {
            id: 202,
            title: "Cybersecurity Fundamentals",
            author: "Charles Brooks",
            category: "Cybersecurity",
            isbn: "978200000002",
            type: "digital",
            total: 5,
            available: 5,
            link: "https://www.cisa.gov/",
            image: ""
        }
    ],

    members: [
        {
            id: 1001,
            name: "Ahmed Mohamed",
            email: "ahmed@example.com",
            phone: "01000000000",
            joined: today()
        },
        {
            id: 1002,
            name: "Mona Ali",
            email: "mona@example.com",
            phone: "01100000000",
            joined: today()
        },
        {
            id: 1003,
            name: "Omar Hassan",
            email: "omar@example.com",
            phone: "01200000000",
            joined: today()
        }
    ],

    loans: [
        {
            id: 1,
            memberId: 1001,
            bookId: 101,
            borrowDate: addDays(today(), -5),
            dueDate: addDays(today(), 9),
            returned: false,
            returnDate: null
        },
        {
            id: 2,
            memberId: 1002,
            bookId: 103,
            borrowDate: addDays(today(), -20),
            dueDate: addDays(today(), -6),
            returned: false,
            returnDate: null
        }
    ],

    reservations: [],
    fines: [],

    next: {
        user: 1,
        book: 203,
        member: 1004,
        loan: 3,
        reservation: 1,
        fine: 1
    }
};

/* =========================================
   DATA STORAGE AND MIGRATION
   ========================================= */

function loadData() {
    try {
        const saved = localStorage.getItem(STORAGE);

        data = saved
            ? JSON.parse(saved)
            : cloneData(initialData);

    } catch (error) {
        data = cloneData(initialData);
    }

    data.next ||= cloneData(initialData.next);

    data.users ||= [];
    data.books ||= [];
    data.members ||= [];
    data.loans ||= [];
    data.reservations ||= [];
    data.fines ||= [];

    // Make sure older digital books have copy/license counts.
    data.books.forEach(book => {
        if (book.type === "digital") {
            const activeLoans = data.loans.filter(
                loan => loan.bookId === book.id && !loan.returned
            ).length;

            if (!Number.isInteger(book.total) || book.total < 1) {
                book.total = Math.max(10, activeLoans);
            }

            if (!Number.isInteger(book.available)) {
                book.available = Math.max(0, book.total - activeLoans);
            }

            book.available = Math.max(
                0,
                Math.min(book.available, book.total)
            );
        }
    });

    // Ensure counters are higher than existing IDs.
    const maxId = (items, key = "id") =>
        items.reduce((max, item) => Math.max(max, Number(item[key]) || 0), 0);

    data.next.user = Math.max(data.next.user || 1, maxId(data.users) + 1);
    data.next.book = Math.max(data.next.book || 1, maxId(data.books) + 1);
    data.next.member = Math.max(data.next.member || 1, maxId(data.members) + 1);
    data.next.loan = Math.max(data.next.loan || 1, maxId(data.loans) + 1);
    data.next.reservation = Math.max(data.next.reservation || 1, maxId(data.reservations) + 1);
    data.next.fine = Math.max(data.next.fine || 1, maxId(data.fines) + 1);

    saveData();
}

function saveData() {
    localStorage.setItem(STORAGE, JSON.stringify(data));
}

/* =========================================
   LANGUAGE
   ========================================= */

function applyLanguage() {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach(el => {
        el.textContent = t(el.dataset.i18n);
    });

    $("languageBtn").textContent =
        language === "en" ? "AR العربية" : "EN English";

    $("pageTitle").textContent = t(activePage);

    $("bookSearch").placeholder = language === "en"
        ? "Search by title, author, ISBN or ID..."
        : "ابحث بالعنوان أو المؤلف أو ISBN أو الرقم...";

    $("memberSearch").placeholder = language === "en"
        ? "Search by Member ID, name, email or phone..."
        : "ابحث برقم العضوية أو الاسم أو البريد أو الهاتف...";

    $("loanSearch").placeholder = language === "en"
        ? "Search by loan ID, member or book..."
        : "ابحث برقم الإعارة أو العضو أو الكتاب...";

    updateThemeButton();
    renderAll();
}

$("languageBtn").addEventListener("click", () => {
    language = language === "en" ? "ar" : "en";

    localStorage.setItem("library_language", language);

    applyLanguage();
});

/* =========================================
   DARK MODE
   ========================================= */

function updateThemeButton() {
    const isDark = document.body.classList.contains("dark-mode");

    if ($("themeBtn")) {
        $("themeBtn").textContent = isDark
            ? (language === "en" ? "☀ Light Mode" : "☀ الوضع الفاتح")
            : (language === "en" ? "🌙 Dark Mode" : "🌙 الوضع الداكن");
    }
}

function applyTheme() {
    const savedTheme = localStorage.getItem("library_theme") || "light";

    document.body.classList.toggle(
        "dark-mode",
        savedTheme === "dark"
    );

    updateThemeButton();
}

if ($("themeBtn")) {
    $("themeBtn").addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");

        localStorage.setItem(
            "library_theme",
            isDark ? "dark" : "light"
        );

        updateThemeButton();
    });
}

/* =========================================
   SIGN IN & SIGN UP
   ========================================= */

function switchAuth(mode) {
    $("loginForm").hidden = mode !== "login";
    $("signupForm").hidden = mode !== "signup";

    document.querySelectorAll(".auth-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.auth === mode);
    });

    $("authMessage").textContent = "";
    $("authMessage").style.color = "";
}

document.querySelectorAll(".auth-tab").forEach(button => {
    button.addEventListener("click", () => {
        switchAuth(button.dataset.auth);
    });
});

$("signupForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = new FormData(event.target);

    const name = String(form.get("name") || "").trim();
    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");
    const confirm = String(form.get("confirm") || "");

    if (name.length < 2) {
        $("authMessage").textContent = "Please enter a valid name.";
        return;
    }

    if (password.length < 6) {
        $("authMessage").textContent = "Password must be at least 6 characters.";
        return;
    }

    if (password !== confirm) {
        $("authMessage").textContent = "Passwords do not match.";
        return;
    }

    if (data.users.some(u => u.email.toLowerCase() === email)) {
        $("authMessage").textContent = "Email already registered.";
        return;
    }

    data.users.push({
        id: newId("user"),
        name,
        email,
        password,
        role: "Librarian"
    });

    saveData();

    $("authMessage").style.color = "green";
    $("authMessage").textContent = "Account created. Please sign in.";

    event.target.reset();

    setTimeout(() => {
        switchAuth("login");
    }, 1000);
});

$("loginForm").addEventListener("submit", event => {
    event.preventDefault();

    const form = new FormData(event.target);

    const email = String(form.get("email") || "").trim().toLowerCase();
    const password = String(form.get("password") || "");

    const user = data.users.find(u =>
        u.email.toLowerCase() === email &&
        u.password === password
    );

    if (!user) {
        $("authMessage").textContent = "Incorrect email or password.";
        return;
    }

    currentUser = user;

    localStorage.setItem("library_session", String(user.id));

    openApplication();
});

function openApplication() {
    $("authScreen").hidden = true;
    $("app").hidden = false;

    $("currentUser").textContent = currentUser.name;
    $("currentRole").textContent = currentUser.role;
    $("userAvatar").textContent =
        currentUser.name.charAt(0).toUpperCase();

    $("today").textContent = new Intl.DateTimeFormat(
        language === "ar" ? "ar-EG" : "en-US",
        { dateStyle: "medium" }
    ).format(new Date());

    applyTheme();
    applyLanguage();
    renderAll();
}

function logout() {
    currentUser = null;

    localStorage.removeItem("library_session");

    $("app").hidden = true;
    $("authScreen").hidden = false;

    $("loginForm").reset();

    switchAuth("login");
}

$("logoutBtn").addEventListener("click", logout);

/* =========================================
   NAVIGATION
   ========================================= */

function showPage(page) {
    activePage = page;

    document.querySelectorAll(".page").forEach(el => {
        el.classList.remove("active");
    });

    const target = $(page + "Page");

    if (target) {
        target.classList.add("active");
    }

    document.querySelectorAll(".nav-link").forEach(el => {
        el.classList.toggle("active", el.dataset.page === page);
    });

    $("pageTitle").textContent = t(page);
}

$("navigation").addEventListener("click", event => {
    const button = event.target.closest("[data-page]");

    if (button) {
        showPage(button.dataset.page);
    }
});

document.addEventListener("click", event => {
    const button = event.target.closest("[data-go]");

    if (button) {
        showPage(button.dataset.go);
    }
});

/* =========================================
   BOOK TYPE TABS
   ========================================= */

document.querySelectorAll(".book-tab").forEach(button => {
    button.addEventListener("click", () => {
        bookType = button.dataset.type;

        document.querySelectorAll(".book-tab").forEach(tab => {
            tab.classList.toggle("active", tab === button);
        });

        renderBooks();
    });
});

/* =========================================
   INVENTORY CALCULATIONS
   ========================================= */

function getInventory(type) {
    const books = data.books.filter(book => book.type === type);

    const total = books.reduce(
        (sum, book) => sum + Number(book.total || 0), 0
    );

    const available = books.reduce(
        (sum, book) => sum + Number(book.available || 0), 0
    );

    return {
        total,
        available,
        borrowed: total - available
    };
}

function renderInventorySummary() {
    const physical = getInventory("physical");
    const digital = getInventory("digital");

    const rows = [
        {
            name: language === "en" ? "Physical Books" : "الكتب الورقية",
            ...physical
        },
        {
            name: language === "en" ? "Digital Books" : "الكتب الرقمية",
            ...digital
        }
    ];

    $("inventorySummary").innerHTML = rows.map(item => `
        <tr>
            <td>${item.name}</td>
            <td>${item.total}</td>
            <td>${item.borrowed}</td>
            <td>${item.available}</td>
        </tr>
    `).join("");
}

/* =========================================
   RENDER DASHBOARD
   ========================================= */

function renderDashboard() {
    $("statBooks").textContent = data.books.length;

    $("statPhysical").textContent =
        data.books.filter(b => b.type === "physical").length;

    $("statDigital").textContent =
        data.books.filter(b => b.type === "digital").length;

    $("statMembers").textContent = data.members.length;

    $("statLoans").textContent =
        data.loans.filter(l => !l.returned).length;

    renderInventorySummary();

    const recent = [...data.loans]
        .sort((a, b) => b.id - a.id)
        .slice(0, 5);

    $("recentLoans").innerHTML = recent.length
        ? recent.map(l => `
            <tr>
                <td>#${l.id}</td>
                <td>${escapeHTML(memberById(l.memberId)?.name || "—")}</td>
                <td>${escapeHTML(bookById(l.bookId)?.title || "—")}</td>
                <td>${l.dueDate}</td>
                <td>${badge(loanStatus(l))}</td>
            </tr>
        `).join("")
        : emptyRow(5);
}

/* =========================================
   RENDER BOOKS
   ========================================= */

function renderBooks() {
    const q = $("bookSearch").value.trim().toLowerCase();
    const category = $("bookCategoryFilter").value;

    const categories = [
        ...new Set(
            data.books
                .filter(b => b.type === bookType)
                .map(b => b.category)
        )
    ];

    const previousCategory = category;

    $("bookCategoryFilter").innerHTML =
        `<option value="">${language === "en" ? "All Categories" : "كل التصنيفات"}</option>` +
        categories.map(c => `
            <option value="${escapeHTML(c)}">${escapeHTML(c)}</option>
        `).join("");

    $("bookCategoryFilter").value = categories.includes(previousCategory)
        ? previousCategory
        : "";

    const selectedCategory = $("bookCategoryFilter").value;

    const rows = data.books.filter(b => {
        const searchText = [
            b.id, b.title, b.author, b.category, b.isbn
        ].join(" ").toLowerCase();

        return b.type === bookType &&
            searchText.includes(q) &&
            (!selectedCategory || b.category === selectedCategory);
    });

    $("booksTable").innerHTML = rows.length
        ? rows.map(b => {
            const image = b.image
                ? `<img class="book-cover" src="${b.image}" alt="Book cover">`
                : `<span class="book-cover-placeholder">📖</span>`;

            const borrowed = Number(b.total) - Number(b.available);

            return `
                <tr>
                    <td>${image}</td>
                    <td>#${b.id}</td>
                    <td><b>${escapeHTML(b.title)}</b></td>
                    <td>${escapeHTML(b.author)}</td>
                    <td>${escapeHTML(b.category)}</td>
                    <td>${escapeHTML(b.isbn || "—")}</td>
                    <td>
                        ${b.available} / ${b.total}
                        <br>
                        <small>
                            ${language === "en" ? "Borrowed:" : "المستعار:"}
                            ${borrowed}
                        </small>
                    </td>
                    <td>
                        ${b.type === "digital" && b.link
                            ? `<button class="action-btn"
                                data-action="open-digital"
                                data-id="${b.id}">
                                ${language === "en" ? "Open" : "فتح"}
                               </button>`
                            : ""
                        }

                        <button class="action-btn"
                            data-action="edit-book"
                            data-id="${b.id}">
                            ${language === "en" ? "Edit" : "تعديل"}
                        </button>

                        <button class="action-btn danger"
                            data-action="delete-book"
                            data-id="${b.id}">
                            ${language === "en" ? "Delete" : "حذف"}
                        </button>
                    </td>
                </tr>
            `;
        }).join("")
        : emptyRow(8);
}

/* =========================================
   RENDER MEMBERS
   ========================================= */

function renderMembers() {
    const q = $("memberSearch").value.trim().toLowerCase();

    const rows = data.members.filter(m => {
        return [
            m.id, m.name, m.email, m.phone
        ].join(" ").toLowerCase().includes(q);
    });

    $("membersTable").innerHTML = rows.length
        ? rows.map(m => `
            <tr>
                <td><b>#${m.id}</b></td>
                <td>${escapeHTML(m.name)}</td>
                <td>${escapeHTML(m.email)}</td>
                <td>${escapeHTML(m.phone)}</td>
                <td>${m.joined}</td>
                <td>
                    <button class="action-btn"
                        data-action="edit-member"
                        data-id="${m.id}">
                        ${language === "en" ? "Edit Details" : "تعديل البيانات"}
                    </button>

                    <button class="action-btn danger"
                        data-action="delete-member"
                        data-id="${m.id}">
                        ${language === "en" ? "Delete" : "حذف"}
                    </button>
                </td>
            </tr>
        `).join("")
        : emptyRow(6);
}

/* =========================================
   RENDER LOANS
   ========================================= */

function renderLoans() {
    const q = $("loanSearch").value.trim().toLowerCase();
    const filter = $("loanStatusFilter").value;

    const rows = data.loans.filter(l => {
        const text = [
            l.id,
            l.memberId,
            memberById(l.memberId)?.name,
            bookById(l.bookId)?.title
        ].join(" ").toLowerCase();

        const status = loanStatus(l);

        return text.includes(q) && (!filter || filter === status);
    }).sort((a, b) => b.id - a.id);

    $("loansTable").innerHTML = rows.length
        ? rows.map(l => `
            <tr>
                <td>#${l.id}</td>
                <td>${escapeHTML(memberById(l.memberId)?.name || "—")}</td>
                <td>${escapeHTML(bookById(l.bookId)?.title || "—")}</td>
                <td>${l.borrowDate}</td>
                <td>${l.dueDate}</td>
                <td>${badge(loanStatus(l))}</td>
                <td>
                    ${!l.returned
                        ? `<button class="action-btn"
                            data-action="return-loan"
                            data-id="${l.id}">
                            ${language === "en" ? "Return Book" : "إرجاع الكتاب"}
                           </button>`
                        : "—"
                    }
                </td>
            </tr>
        `).join("")
        : emptyRow(7);
}

/* =========================================
   RENDER RESERVATIONS
   ========================================= */

function renderReservations() {
    $("reservationsTable").innerHTML = data.reservations.length
        ? [...data.reservations].reverse().map(r => `
            <tr>
                <td>#${r.id}</td>
                <td>${escapeHTML(memberById(r.memberId)?.name || "—")}</td>
                <td>${escapeHTML(bookById(r.bookId)?.title || "—")}</td>
                <td>${r.date}</td>
                <td>${badge(r.status)}</td>
                <td>
                    ${r.status === "pending"
                        ? `<button class="action-btn danger"
                            data-action="cancel-reservation"
                            data-id="${r.id}">
                            ${language === "en" ? "Cancel" : "إلغاء"}
                           </button>`
                        : "—"
                    }
                </td>
            </tr>
        `).join("")
        : emptyRow(6);
}

/* =========================================
   RENDER FINES
   ========================================= */

function renderFines() {
    $("finesTable").innerHTML = data.fines.length
        ? [...data.fines].reverse().map(f => {
            const loan = data.loans.find(l => l.id === f.loanId);

            return `
                <tr>
                    <td>#${f.id}</td>
                    <td>#${f.loanId}</td>
                    <td>${escapeHTML(memberById(loan?.memberId)?.name || "—")}</td>
                    <td>${money(f.amount)}</td>
                    <td>${badge(f.paid ? "paid" : "unpaid")}</td>
                    <td>${f.paidDate || "—"}</td>
                    <td>
                        ${!f.paid
                            ? `<button class="action-btn"
                                data-action="pay-fine"
                                data-id="${f.id}">
                                ${language === "en" ? "Pay" : "سداد"}
                               </button>`
                            : "—"
                        }
                    </td>
                </tr>
            `;
        }).join("")
        : emptyRow(7);
}

function renderAll() {
    renderDashboard();
    renderBooks();
    renderMembers();
    renderLoans();
    renderReservations();
    renderFines();
}

/* =========================================
   DYNAMIC FORM BUILDER
   ========================================= */

const dialog = $("appDialog");

function fieldHTML(f) {
    let control;

    if (f.type === "select") {
        control = `
            <select name="${f.name}" ${f.required === false ? "" : "required"}>
                ${f.options.map(o => `
                    <option value="${escapeHTML(o.value)}"
                        ${String(o.value) === String(f.value ?? "") ? "selected" : ""}>
                        ${escapeHTML(o.label)}
                    </option>
                `).join("")}
            </select>
        `;
    } else if (f.type === "file") {
        control = `
            <input name="${f.name}" type="file"
                accept="image/*" ${f.required ? "required" : ""}>
        `;
    } else {
        control = `
            <input
                name="${f.name}"
                type="${f.type || "text"}"
                value="${escapeHTML(f.value ?? "")}"
                placeholder="${escapeHTML(f.placeholder || "")}"
                ${f.min !== undefined ? `min="${f.min}"` : ""}
                ${f.required === false ? "" : "required"}>
        `;
    }

    return `
        <div class="field ${f.full ? "full" : ""}">
            <label>${escapeHTML(f.label)}</label>
            ${control}
        </div>
    `;
}

function openForm(title, schema, callback) {
    $("dialogTitle").textContent = title;
    $("dialogFields").innerHTML = schema.map(fieldHTML).join("");

    dialog.showModal();

    $("dialogForm").onsubmit = async event => {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);
        const values = Object.fromEntries(formData.entries());

        const imageFile = formData.get("image");

        if (imageFile instanceof File && imageFile.size > 0) {
            if (!imageFile.type.startsWith("image/")) {
                toast("Please select a valid image.");
                return;
            }

            if (imageFile.size > 1024 * 1024) {
                toast("Image must be 1 MB or smaller.");
                return;
            }

            try {
                values.image = await readImage(imageFile);
            } catch {
                toast("Could not read the image.");
                return;
            }
        }

        const result = callback(values);

        if (result !== false) {
            dialog.close();
            saveData();
            renderAll();
        }
    };
}

function readImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

$("closeDialog").onclick = () => dialog.close();
$("cancelDialog").onclick = () => dialog.close();

/* =========================================
   ADD / EDIT BOOK
   ========================================= */

function addBook(book = null) {
    const type = book?.type || bookType;

    const schema = [
        {
            name: "title",
            label: language === "en" ? "Book Title" : "عنوان الكتاب",
            value: book?.title,
            full: true
        },
        {
            name: "author",
            label: t("author"),
            value: book?.author
        },
        {
            name: "category",
            label: t("category"),
            value: book?.category
        },
        {
            name: "isbn",
            label: "ISBN",
            value: book?.isbn,
            required: false
        },
        {
            name: "image",
            label: language === "en" ? "Book Cover Image" : "صورة غلاف الكتاب",
            type: "file",
            required: false,
            full: true
        },
        {
            name: "total",
            label: language === "en"
                ? (type === "digital" ? "Total Licenses" : "Total Copies")
                : (type === "digital" ? "إجمالي التراخيص" : "إجمالي النسخ"),
            type: "number",
            min: 1,
            value: book?.total ?? (type === "digital" ? 10 : 1)
        }
    ];

    if (type === "digital") {
        schema.push({
            name: "link",
            label: language === "en" ? "Digital Book URL" : "رابط الكتاب الرقمي",
            type: "url",
            value: book?.link,
            required: false,
            full: true
        });
    }

    openForm(
        book
            ? (language === "en" ? "Edit Book" : "تعديل الكتاب")
            : (language === "en" ? "Add New Book" : "إضافة كتاب جديد"),

        schema,

        v => {
            if (
                !v.title.trim() ||
                !v.author.trim() ||
                !v.category.trim()
            ) {
                toast("Please complete the required fields.");
                return false;
            }

            const total = Number(v.total);

            if (!Number.isInteger(total) || total < 1) {
                toast("Enter a valid number of copies or licenses.");
                return false;
            }

            if (type === "digital" && v.link) {
                try {
                    const url = new URL(v.link);

                    if (!["http:", "https:"].includes(url.protocol)) {
                        toast("Invalid digital book URL.");
                        return false;
                    }
                } catch {
                    toast("Invalid digital book URL.");
                    return false;
                }
            }

            if (book) {
                const oldImage = book.image;
                const borrowed = book.total - book.available;

                if (total < borrowed) {
                    toast("Total copies cannot be less than borrowed copies.");
                    return false;
                }

                Object.assign(book, {
                    title: v.title.trim(),
                    author: v.author.trim(),
                    category: v.category.trim(),
                    isbn: v.isbn.trim(),
                    total,
                    available: total - borrowed
                });

                if (type === "digital") {
                    book.link = v.link || "";
                }

                book.image = v.image || oldImage;

            } else {
                const newBook = {
                    id: newId("book"),
                    title: v.title.trim(),
                    author: v.author.trim(),
                    category: v.category.trim(),
                    isbn: v.isbn.trim(),
                    type,
                    total,
                    available: total,
                    image: v.image || ""
                };

                if (type === "digital") {
                    newBook.link = v.link || "";
                }

                data.books.push(newBook);
            }

            toast(language === "en"
                ? "Book saved successfully."
                : "تم حفظ الكتاب بنجاح.");
        }
    );
}

$("addBookBtn").onclick = () => addBook();

/* =========================================
   ADD / EDIT MEMBER
   ========================================= */

function addMember(member = null) {
    openForm(
        member
            ? (language === "en" ? "Edit Member Details" : "تعديل بيانات العضو")
            : (language === "en" ? "Register New Member" : "تسجيل عضو جديد"),

        [
            {
                name: "name",
                label: t("name"),
                value: member?.name,
                full: true
            },
            {
                name: "email",
                label: t("email"),
                type: "email",
                value: member?.email,
                required: false
            },
            {
                name: "phone",
                label: t("phone"),
                value: member?.phone
            }
        ],

        v => {
            if (!v.name.trim() || !v.phone.trim()) {
                toast("Name and phone are required.");
                return false;
            }

            const email = v.email.trim().toLowerCase();

            const duplicateEmail = data.members.some(m =>
                m.email.toLowerCase() === email &&
                m.id !== member?.id
            );

            if (email && duplicateEmail) {
                toast("This email is already used by another member.");
                return false;
            }

            if (member) {
                Object.assign(member, {
                    name: v.name.trim(),
                    email,
                    phone: v.phone.trim()
                });
            } else {
                data.members.push({
                    id: newId("member"),
                    name: v.name.trim(),
                    email,
                    phone: v.phone.trim(),
                    joined: today()
                });
            }

            toast(language === "en"
                ? "Member saved successfully."
                : "تم حفظ بيانات العضو.");
        }
    );
}

$("addMemberBtn").onclick = () => addMember();

/* =========================================
   SELECT OPTIONS
   ========================================= */

function options(items, label, empty) {
    return [
        {
            value: "",
            label: empty
        },
        ...items.map(item => ({
            value: item.id,
            label: label(item)
        }))
    ];
}

/* =========================================
   NEW LOAN
   ========================================= */

function addLoan(memberId = null, bookId = null) {
    const availableBooks = data.books.filter(b =>
        Number(b.available) > 0
    );

    if (!data.members.length || !availableBooks.length) {
        toast(language === "en"
            ? "No members or available books."
            : "لا يوجد أعضاء أو كتب متاحة للاستعارة.");
        return;
    }

    openForm(
        language === "en" ? "Create New Loan" : "تسجيل استعارة جديدة",

        [
            {
                name: "memberId",
                label: t("member"),
                type: "select",
                options: options(
                    data.members,
                    m => `#${m.id} - ${m.name}`,
                    "Select Member"
                ),
                value: memberId || ""
            },
            {
                name: "bookId",
                label: t("book"),
                type: "select",
                options: options(
                    availableBooks,
                    b => `${b.title} (${b.available} ${language === "en" ? "available" : "متاح"}) - ${b.type}`,
                    "Select Book"
                ),
                value: bookId || ""
            },
            {
                name: "borrowDate",
                label: t("borrowDate"),
                type: "date",
                value: today()
            },
            {
                name: "dueDate",
                label: t("dueDate"),
                type: "date",
                value: addDays(today(), 14)
            }
        ],

        v => {
            const member = memberById(v.memberId);
            const book = bookById(v.bookId);

            if (
                !member ||
                !book ||
                book.available < 1 ||
                v.dueDate < v.borrowDate
            ) {
                toast("Invalid loan information.");
                return false;
            }

            // Only the selected book loses one available copy/license.
            book.available--;

            data.loans.push({
                id: newId("loan"),
                memberId: member.id,
                bookId: book.id,
                borrowDate: v.borrowDate,
                dueDate: v.dueDate,
                returned: false,
                returnDate: null
            });

            toast(language === "en"
                ? "Loan created successfully."
                : "تم تسجيل الاستعارة بنجاح.");
        }
    );
}

$("addLoanBtn").onclick = () => addLoan();

/* =========================================
   NEW RESERVATION
   ========================================= */

function addReservation() {
    if (!data.members.length || !data.books.length) {
        toast("Add a member and a book first.");
        return;
    }

    openForm(
        language === "en" ? "New Reservation" : "حجز كتاب",

        [
            {
                name: "memberId",
                label: t("member"),
                type: "select",
                options: options(
                    data.members,
                    m => m.name,
                    "Select Member"
                )
            },
            {
                name: "bookId",
                label: t("book"),
                type: "select",
                options: options(
                    data.books,
                    b => `${b.title} (${b.type})`,
                    "Select Book"
                )
            },
            {
                name: "date",
                label: t("date"),
                type: "date",
                value: today()
            }
        ],

        v => {
            const member = memberById(v.memberId);
            const book = bookById(v.bookId);

            if (!member || !book) {
                toast("Select a valid member and book.");
                return false;
            }

            data.reservations.push({
                id: newId("reservation"),
                memberId: member.id,
                bookId: book.id,
                date: v.date,
                status: "pending"
            });

            toast(language === "en"
                ? "Reservation created."
                : "تم إنشاء الحجز.");
        }
    );
}

$("addReservationBtn").onclick = addReservation;

/* =========================================
   RETURN BOOK & FINES
   ========================================= */

function returnLoan(id) {
    const loan = data.loans.find(l => l.id === Number(id));

    if (!loan || loan.returned) return;

    const book = bookById(loan.bookId);

    if (!book) {
        toast("Book record not found.");
        return;
    }

    loan.returned = true;
    loan.returnDate = today();

    // Restore exactly one copy/license for the returned book.
    book.available = Math.min(
        Number(book.total),
        Number(book.available) + 1
    );

    const lateDays = dateDifference(loan.returnDate, loan.dueDate);

    if (lateDays > 0) {
        const existing = data.fines.find(f => f.loanId === loan.id);

        if (!existing) {
            data.fines.push({
                id: newId("fine"),
                loanId: loan.id,
                amount: lateDays * FINE_PER_DAY,
                paid: false,
                paidDate: null
            });
        }

        toast(`Returned with a fine of ${money(lateDays * FINE_PER_DAY)}`);
    } else {
        toast(language === "en"
            ? "Book returned successfully."
            : "تم إرجاع الكتاب بنجاح.");
    }

    saveData();
    renderAll();
}

/* =========================================
   ACTION HANDLER
   ========================================= */

function handleAction(action, id) {
    const n = Number(id);

    if (action === "edit-book") {
        const book = bookById(n);

        if (book) {
            bookType = book.type;

            document.querySelectorAll(".book-tab").forEach(tab => {
                tab.classList.toggle(
                    "active",
                    tab.dataset.type === bookType
                );
            });

            addBook(book);
        }
    }

    if (action === "delete-book") {
        const book = bookById(n);

        if (!book) return;

        const hasActiveLoan = data.loans.some(l =>
            l.bookId === n && !l.returned
        );

        if (hasActiveLoan) {
            toast(language === "en"
                ? "Cannot delete a book with an active loan."
                : "لا يمكن حذف كتاب له إعارة نشطة.");
            return;
        }

        if (confirm(language === "en"
            ? "Delete this book?"
            : "هل تريد حذف هذا الكتاب؟")) {

            data.books = data.books.filter(b => b.id !== n);

            saveData();
            renderAll();

            toast(language === "en" ? "Book deleted." : "تم حذف الكتاب.");
        }
    }

    if (action === "open-digital") {
        const book = bookById(n);

        if (!book?.link) {
            toast("No digital access link is available.");
            return;
        }

        try {
            const url = new URL(book.link);

            if (!["https:", "http:"].includes(url.protocol)) {
                toast("Invalid digital link.");
                return;
            }

            window.open(url.href, "_blank", "noopener,noreferrer");

        } catch {
            toast("Invalid digital link.");
        }
    }

    if (action === "edit-member") {
        const member = memberById(n);

        if (member) addMember(member);
    }

    if (action === "delete-member") {
        const active = data.loans.some(l =>
            l.memberId === n && !l.returned
        );

        if (active) {
            toast(language === "en"
                ? "Member has an active loan."
                : "لا يمكن حذف عضو لديه إعارة نشطة.");
            return;
        }

        if (confirm(language === "en"
            ? "Delete this member?"
            : "هل تريد حذف هذا العضو؟")) {

            data.members = data.members.filter(m => m.id !== n);

            saveData();
            renderAll();

            toast(language === "en" ? "Member deleted." : "تم حذف العضو.");
        }
    }

    if (action === "return-loan") {
        returnLoan(n);
    }

    if (action === "pay-fine") {
        const fine = data.fines.find(f => f.id === n);

        if (fine && !fine.paid) {
            fine.paid = true;
            fine.paidDate = today();

            saveData();
            renderAll();

            toast(language === "en"
                ? "Payment registered."
                : "تم تسجيل السداد.");
        }
    }

    if (action === "cancel-reservation") {
        const reservation = data.reservations.find(r => r.id === n);

        if (reservation && reservation.status === "pending") {
            reservation.status = "cancelled";

            saveData();
            renderAll();

            toast(language === "en"
                ? "Reservation cancelled."
                : "تم إلغاء الحجز.");
        }
    }
}

/* =========================================
   EVENTS
   ========================================= */

document.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");

    if (button) {
        handleAction(button.dataset.action, button.dataset.id);
    }
});

$("bookSearch").addEventListener("input", renderBooks);
$("bookCategoryFilter").addEventListener("change", renderBooks);
$("memberSearch").addEventListener("input", renderMembers);
$("loanSearch").addEventListener("input", renderLoans);
$("loanStatusFilter").addEventListener("change", renderLoans);

/* =========================================
   START APPLICATION
   ========================================= */

loadData();
applyTheme();

function initialize() {
    const sessionId = Number(localStorage.getItem("library_session"));

    currentUser = data.users.find(u => u.id === sessionId) || null;

    if (currentUser) {
        openApplication();
    } else {
        $("authScreen").hidden = false;
        $("app").hidden = true;

        switchAuth("login");
        applyLanguage();
    }
}

initialize();
