/* 周公子纸巾基金会 · 页面渲染与微交互 */
(function () {
  "use strict";
  const L = window.PAPER_LEDGER || { entries: [], demo: false };
  const $ = (sel) => document.querySelector(sel);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmtMoney = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtInt = new Intl.NumberFormat("zh-CN");

  const money = (n) => "¥" + fmtMoney.format(n);

  // ——— 汇总 ———
  let totalIn = 0, totalOut = 0, rollsBought = 0, donors = new Map();
  for (const e of L.entries) {
    if (e.kind === "in") {
      totalIn += e.amount;
      donors.set(e.name, (donors.get(e.name) || 0) + e.amount);
    } else {
      totalOut += e.amount;
      rollsBought += e.rolls || 0;
    }
  }
  const balance = totalIn - totalOut;
  const daysLeft = L.burnRatePerDay > 0 ? Math.floor((L.stockRolls || 0) / L.burnRatePerDay) : null;

  // ——— 英雄区数字 ———
  $("#stat-rolls").textContent = fmtInt.format(rollsBought);
  $("#stat-in").textContent = money(totalIn);
  $("#stat-donors").textContent = fmtInt.format(donors.size) + " 笔";
  $("#stat-stock").textContent = fmtInt.format(L.stockRolls || 0) + " 卷";
  $("#stat-days").textContent = daysLeft === null ? "—" : "约 " + daysLeft + " 天";

  // ——— 账本流水（新纪录在上） ———
  const ledgerEl = $("#ledger-rows");
  const rows = [...L.entries].reverse().map((e) => {
    const li = document.createElement("li");
    if (e.kind === "in") {
      li.innerHTML =
        '<span class="date">' + e.date + "</span>" +
        '<span class="what"><strong>' + e.name + " 捐了纸钱</strong>" +
        '<span class="meta"><span>' + (e.note || "爱心不分大小") + "</span></span></span>" +
        '<span class="amt amt--in">+' + money(e.amount) + "</span>";
    } else {
      const shopName = e.shop || "";
      const linkText = shopName.includes("京东") ? "去京东看单"
        : /淘宝|天猫/.test(shopName) ? "去淘宝看单"
        : shopName.includes("拼多多") ? "去拼多多看单"
        : "查看链接";
      const link = e.link
        ? '<a href="' + e.link + '" target="_blank" rel="noopener">' + linkText + " →</a>"
        : "";
      const proof = e.proof
        ? '<a href="' + e.proof + '" target="_blank" rel="noopener">订单截图</a>'
        : "<span>截图待上传</span>";
      li.innerHTML =
        '<span class="date">' + e.date + "</span>" +
        '<span class="what"><strong>' + e.title + "</strong>" +
        '<span class="meta">' + link + "<span>" + e.shop + "</span>" + (e.order ? "<span>" + e.order + "</span>" : "") +
        (e.rolls ? "<span>" + e.rolls + " 卷</span>" : "") + proof + "</span></span>" +
        '<span class="amt amt--out">−' + money(e.amount) + "</span>";
    }
    return li;
  });
  if (!rows.length) {
    const li = document.createElement("li");
    li.innerHTML = '<span class="what"><strong>账本是空的</strong><span class="meta"><span>第一笔账，等你来写。</span></span></span>';
    ledgerEl.appendChild(li);
  } else {
    rows.forEach((r) => ledgerEl.appendChild(r));
  }
  $("#sum-in").textContent = money(totalIn);
  $("#sum-out").textContent = money(totalOut);
  $("#sum-balance").textContent = money(balance);
  $("#ledger-updated").textContent = "更新于 " + (L.updatedAt || "—") + " · 结余以实付为准";

  // ——— 收款码（支付宝小荷包）———
  if (L.donate) {
    $("#qr-xiaohebao").src = L.donate.xiaohebao;
  }

  // ——— 感谢榜 ———
  const wall = $("#wall-list");
  const ranked = [...donors.entries()].sort((a, b) => b[1] - a[1]);
  if (!ranked.length) {
    wall.outerHTML =
      '<p class="wall-empty">榜上还空着。<br>第一位捐纸的人会被永远记住（至少到这卷纸用完）。<br><a href="#donate">去捐个纸 →</a></p>';
  } else {
    wall.innerHTML = ranked
      .map(([name, amt]) => '<li><span class="who">' + name + "</span><span class=\"howmuch\">累计 " + money(amt) + "</span></li>")
      .join("");
  }

  // ——— 演示模式提示 ———
  document.querySelectorAll(".qr-card__cap").forEach((el) => {
    if (L.demo) {
      el.classList.add("is-demo"); // 保持「示意码」文案与珊瑚色警示
    } else {
      el.textContent = el.dataset.real || ""; // 正式模式：换成真实使用指引
    }
  });
  if (L.demo) {
    document.body.classList.add("is-demo");
    $("#demo-banner").hidden = false;
  }

  // ——— 大数字滚动（Hum 签名动作） ———
  const figure = $("#stat-rolls");
  const target = rollsBought;
  const tickUp = () => {
    if (reduced || target === 0) { figure.textContent = fmtInt.format(target); return; }
    let done = false;
    const finalize = () => {
      if (done) return;
      done = true;
      figure.textContent = fmtInt.format(target);
      figure.animate(
        [{ transform: "scale(1)" }, { transform: "scale(1.06)" }, { transform: "scale(1)" }],
        { duration: 320, easing: "ease-out" }
      );
    };
    const t0 = performance.now(), dur = 1200;
    const step = (now) => {
      if (done) return;
      const p = Math.min((now - t0) / dur, 1);
      const eased = 1 - Math.pow(2, -10 * p); /* easeOutExpo */
      figure.textContent = fmtInt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else finalize();
    };
    requestAnimationFrame(step);
    setTimeout(finalize, dur + 400); /* 保险：rAF 被节流也保证落到真数 */
  };
  if ("IntersectionObserver" in window) {
    const seen = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { tickUp(); seen.disconnect(); } });
    }, { threshold: 0.4 });
    seen.observe(figure);
  } else { tickUp(); }

  // ——— 节标题一次性浮现 ———
  const heads = document.querySelectorAll(".reveal");
  if (reduced || !("IntersectionObserver" in window)) {
    heads.forEach((h) => h.classList.add("in-view"));
  } else {
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in-view"); io.unobserve(en.target); } });
    }, { threshold: 0.3 });
    heads.forEach((h) => io.observe(h));
  }

  // ——— 主按钮星星爆裂（珊瑚色，一次） ———
  document.querySelectorAll("[data-burst]").forEach((btn) => {
    btn.addEventListener("click", (ev) => {
      if (reduced) return;
      const s = document.createElement("span");
      s.className = "star-burst";
      s.style.left = ev.clientX - 12 + "px";
      s.style.top = ev.clientY - 12 + "px";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 450);
    });
  });
})();
