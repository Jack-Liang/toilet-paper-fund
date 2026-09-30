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
  let totalIn = 0, totalOut = 0, rollsBought = 0, donationCount = 0;
  for (const e of L.entries) {
    if (e.kind === "in") {
      totalIn += e.amount;
      donationCount += 1;
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
  $("#stat-donors").textContent = fmtInt.format(donationCount) + " 笔";
  $("#stat-stock").textContent = fmtInt.format(L.stockRolls || 0) + " 卷";
  $("#stat-days").textContent = daysLeft === null ? "—" : "约 " + daysLeft + " 天";

  // ——— 账本流水（新纪录在上） ———
  const ledgerEl = $("#ledger-rows");
  const rows = [...L.entries].reverse().map((e) => {
    const li = document.createElement("li");
    if (e.kind === "in") {
      const who = e.public ? e.name : "一位同事";
      li.innerHTML =
        '<span class="date">' + e.date + "</span>" +
        '<span class="what"><strong>' + who + "请全办公室吃纸</strong>" +
        '<span class="meta"><span>' + (e.note || "爱心不分大小") + "</span></span></span>" +
        '<span class="amt amt--in">+' + money(e.amount) + "</span>";
    } else {
      const shopName = e.shop || "";
      const link = e.link
        ? '<a href="' + e.link + '" target="_blank" rel="noopener">查看订单 →</a>'
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

  // ——— 感谢榜（排行榜：按单笔捐款金额排名；默认匿名）———
  const wall = $("#wall-list");
  const donations = L.entries
    .filter((e) => e.kind === "in")
    .map((e) => ({ amount: e.amount, who: e.public ? e.name : "一位同事", date: e.date }))
    .sort((a, b) => b.amount - a.amount || (a.date < b.date ? -1 : 1));
  if (!donations.length) {
    wall.outerHTML =
      '<p class="wall-empty">榜上还空着。<br>第一位捐纸的人会被永远记住（至少到这卷纸用完）。<br><a href="#donate">去捐个纸 →</a></p>';
  } else {
    wall.innerHTML = donations
      .map((d, i) =>
        '<li><span class="rank' + (i < 3 ? " rank--top" : "") + '">No.' + (i + 1) + "</span>" +
        '<span class="who">' + d.who + '</span>' +
        '<span class="howmuch">' + money(d.amount) + "</span></li>"
      )
      .join("");
  }

  // ——— 演示模式提示 ———
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
