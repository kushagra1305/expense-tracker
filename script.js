// ================= GLOBAL STATE =================
let transactions = [];
const token = localStorage.getItem("token");

// 🔗 Backend URL (CHANGE after deployment)
const API = "http://localhost:5000";

// ================= LOAD TRANSACTIONS =================
async function loadTransactions() {
  try {
    const res = await fetch(`${API}/api/transactions`, {
      headers: { Authorization: "Bearer " + token }
    });

    // अगर token गलत है → वापस login
    if (!res.ok) {
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    transactions = await res.json();
    updateUI();
    updateMonthlySummary();
  } catch (err) {
    alert("⚠️ Server not reachable");
  }
}

// ================= DOM ELEMENTS =================
const incomeFormSection = document.getElementById("income-form");
const expenseFormSection = document.getElementById("expense-form");

const balanceEl = document.getElementById("balance");
const incomeEl = document.getElementById("total-income");
const expenseEl = document.getElementById("total-expense");
const listEl = document.getElementById("transaction-list");

const monthFilter = document.getElementById("month-filter");
const monthlyIncomeEl = document.getElementById("monthly-income");
const monthlyExpenseEl = document.getElementById("monthly-expense");

// ================= TOGGLE FORMS =================
document.getElementById("show-income").onclick = () => {
  incomeFormSection.classList.remove("hidden");
  expenseFormSection.classList.add("hidden");
};

document.getElementById("show-expense").onclick = () => {
  expenseFormSection.classList.remove("hidden");
  incomeFormSection.classList.add("hidden");
};

// ================= AUTO DATE =================
document.querySelectorAll('input[type="date"]').forEach(input => {
  input.valueAsDate = new Date();
});

// ================= COLORS =================
const CATEGORY_COLORS = {
  Food: "#FF6384",
  Rent: "#36A2EB",
  Travel: "#FFCE56",
  Shopping: "#9966FF",
  Bills: "#4BC0C0",
  Other: "#C9CBCF"
};

let incomeExpenseChart;
let categoryChart;

const formatINR = num => new Intl.NumberFormat("en-IN").format(num);

// ================= CHARTS =================
function renderIncomeExpenseChart(income, expense) {
  const ctx = document.getElementById("incomeExpenseChart");
  if (incomeExpenseChart) incomeExpenseChart.destroy();

  incomeExpenseChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: ["Income", "Expense"],
      datasets: [{ data: [income, expense] }]
    }
  });
}

function renderCategoryChart() {
  const categoryTotals = {};

  transactions.forEach(t => {
    if (t.type === "expense") {
      categoryTotals[t.category] =
        (categoryTotals[t.category] || 0) + t.amount;
    }
  });

  const labels = Object.keys(categoryTotals);
  const data = Object.values(categoryTotals);

  if (!labels.length) {
    if (categoryChart) categoryChart.destroy();
    return;
  }

  const colors = labels.map(cat => CATEGORY_COLORS[cat] || "#999");
  const ctx = document.getElementById("categoryExpenseChart");

  if (categoryChart) categoryChart.destroy();

  categoryChart = new Chart(ctx, {
    type: "doughnut",
    data: { labels, datasets: [{ data, backgroundColor: colors }] }
  });
}

// ================= DELETE =================
async function deleteTransaction(id) {
  await fetch(`${API}/api/transactions/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token }
  });

  loadTransactions();
}

// ================= UPDATE UI =================
function updateUI() {
  listEl.innerHTML = "";

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

  transactions.forEach(t => {
    const li = document.createElement("li");

    const left = document.createElement("span");
    left.innerHTML = `${t.title} (${t.category})<br><small>${t.date}</small>`;

    const right = document.createElement("span");
    right.className =
      t.type === "income" ? "amount-income" : "amount-expense";
    right.innerHTML = `${
      t.type === "income" ? "+" : "-"
    }₹${formatINR(t.amount)}`;

    const delBtn = document.createElement("button");
    delBtn.textContent = "❌";
    delBtn.onclick = () => deleteTransaction(t._id);

    right.appendChild(delBtn);
    li.appendChild(left);
    li.appendChild(right);
    listEl.appendChild(li);

    if (t.type === "income") totalIncome += t.amount;
    else totalExpense += t.amount;
  });

  balanceEl.innerText = formatINR(totalIncome - totalExpense);
  incomeEl.innerText = formatINR(totalIncome);
  expenseEl.innerText = formatINR(totalExpense);

  renderIncomeExpenseChart(totalIncome, totalExpense);
  renderCategoryChart();
  populateMonthFilter();
}

// ================= MONTH FILTER =================
function populateMonthFilter() {
  const selected = monthFilter.value;
  const months = [...new Set(transactions.map(t => t.month))];

  monthFilter.innerHTML = `<option value="">Select Month</option>`;

  months.forEach(m => {
    const option = document.createElement("option");
    option.value = m;
    option.textContent = m;
    if (m === selected) option.selected = true;
    monthFilter.appendChild(option);
  });
}

monthFilter.addEventListener("change", updateMonthlySummary);

// ================= MONTH SUMMARY =================
function updateMonthlySummary() {
  const selectedMonth = monthFilter.value;

  let income = 0;
  let expense = 0;

  transactions
    .filter(t => t.month === selectedMonth)
    .forEach(t => {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    });

  monthlyIncomeEl.innerText = formatINR(income);
  monthlyExpenseEl.innerText = formatINR(expense);
}

// ================= ADD INCOME =================
document.getElementById("add-income-form").addEventListener("submit", async e => {
  e.preventDefault();

  const type = document.getElementById("income-type").value;
  const amount = Number(document.getElementById("income-amount").value);
  const date = document.getElementById("income-date").value;

  await fetch(`${API}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      title: `${type} Income`,
      amount,
      type: "income",
      category: type,
      date,
      month: date.slice(0, 7)
    })
  });

  e.target.reset();
  loadTransactions();
});

// ================= ADD EXPENSE =================
document.getElementById("add-expense-form").addEventListener("submit", async e => {
  e.preventDefault();

  const category = document.getElementById("expense-category").value;
  const amount = Number(document.getElementById("expense-amount").value);
  const note = document.getElementById("expense-note").value;
  const date = document.getElementById("expense-date").value;

  await fetch(`${API}/api/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    },
    body: JSON.stringify({
      title: note || category,
      amount,
      type: "expense",
      category,
      date,
      month: date.slice(0, 7)
    })
  });

  e.target.reset();
  loadTransactions();
});

// ================= RESET ALL =================
document.getElementById("reset-data").addEventListener("click", async () => {
  const confirmReset = confirm("Delete ALL transactions?");
  if (!confirmReset) return;

  const res = await fetch(`${API}/api/transactions`, {
    headers: { Authorization: "Bearer " + token }
  });

  const all = await res.json();

  for (const tx of all) {
    await fetch(`${API}/api/transactions/${tx._id}`, {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token }
    });
  }

  loadTransactions();
});

// ================= INITIAL LOAD =================
loadTransactions();
