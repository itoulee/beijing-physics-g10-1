/**
 * 北京高一物理上册 · 交互学习站
 */
(function () {
  const STORAGE_KEY = "bj-phy-g10-progress-v1";
  const THEME_KEY = "bj-phy-g10-theme";

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

  const state = {
    page: "home",
    progress: loadProgress(),
  };

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function isDone(id) {
    const v = state.progress[id];
    return v === true || (v && v.done);
  }

  function saveProgress() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.progress));
    updateProgressUI();
  }

  function markDone(id) {
    const prev = state.progress[id];
    if (prev && typeof prev === "object") {
      prev.done = true;
    } else {
      state.progress[id] = true;
    }
    saveProgress();
  }

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- 导航 ---------- */
  function buildNav() {
    const nav = $("#nav");
    nav.innerHTML = "";
    let sectionMark = null;
    const mainIds = new Set(["ch1", "ch2", "ch3", "ch4"]);
    const expandIds = new Set(["ch5", "ch6"]);

    CHAPTERS.forEach((ch) => {
      if (mainIds.has(ch.id) && sectionMark !== "main") {
        const s = document.createElement("div");
        s.className = "nav-section";
        s.textContent = "主线精讲";
        nav.appendChild(s);
        sectionMark = "main";
      }
      if (expandIds.has(ch.id) && sectionMark !== "expand") {
        const s = document.createElement("div");
        s.className = "nav-section";
        s.textContent = "扩充学习";
        nav.appendChild(s);
        sectionMark = "expand";
      }
      if (ch.type === "exam" && sectionMark !== "exam") {
        const s = document.createElement("div");
        s.className = "nav-section";
        s.textContent = "检测";
        nav.appendChild(s);
        sectionMark = "exam";
      }

      const btn = document.createElement("button");
      btn.className = "nav-item" + (isDone(ch.id) ? " done" : "");
      btn.dataset.id = ch.id;
      btn.innerHTML = `<span class="dot"></span><span>${ch.icon} ${ch.title}</span>`;
      btn.addEventListener("click", () => {
        navigate(ch.id);
        $("#sidebar").classList.remove("open");
      });
      nav.appendChild(btn);
    });
  }

  function updateProgressUI() {
    const learnable = CHAPTERS.filter((c) => c.type === "chapter" || c.type === "exam");
    const done = learnable.filter((c) => isDone(c.id)).length;
    const pct = learnable.length ? Math.round((done / learnable.length) * 100) : 0;
    $("#progressText").textContent = pct + "%";
    $("#progressFill").style.width = pct + "%";

    $$(".nav-item").forEach((el) => {
      el.classList.toggle("done", isDone(el.dataset.id));
      el.classList.toggle("active", el.dataset.id === state.page);
    });

    const scores = Object.values(state.progress)
      .filter((v) => typeof v === "object" && v && v.score != null)
      .map((v) => v.score);
    if (scores.length) {
      const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      $("#scoreBadge").textContent = `测验均分 ${avg}%`;
    } else {
      $("#scoreBadge").textContent = "测验得分 —";
    }
  }

  function navigate(id) {
    state.page = id;
    const ch = CHAPTERS.find((c) => c.id === id);
    $("#crumb").textContent = ch ? ch.title : "首页";
    render();
    updateProgressUI();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ---------- 渲染 ---------- */
  function render() {
    const ch = CHAPTERS.find((c) => c.id === state.page);
    const content = $("#content");
    if (!ch) return;

    if (ch.type === "home") {
      content.innerHTML = renderHome();
      bindHomeCards();
      return;
    }
    if (ch.type === "exam") {
      content.innerHTML = renderExam(ch);
      bindQuiz("exam", EXAM_QUIZ);
      return;
    }

    content.innerHTML = renderChapter(ch);
    bindLabs();
    bindExamples();
    if (ch.quiz) bindQuiz(ch.id, ch.quiz);
    bindChapterNav(ch);
  }

  function renderHome() {
    const cards = CHAPTERS.filter((c) => c.type !== "home")
      .map((c) => {
        const done = isDone(c.id);
        return `
          <button class="home-card ${done ? "done" : ""}" data-id="${c.id}">
            <div class="ico">${c.icon}</div>
            <h3>${c.title}</h3>
            <p>${c.summary || ""}</p>
            <div class="status">${done ? "✓ 已学完" : "点击开始学习"}</div>
          </button>`;
      })
      .join("");

    return `
      <div class="hero">
        <h2>北京高一物理上册<br>精华交互 · 力学起步</h2>
        <p>覆盖人教版必修第一册：运动描述、匀变速、相互作用、牛顿定律；配合仿真实验、例题分步与综合自测。</p>
        <div class="hero-meta">
          <span class="chip">人教版 · 必修第一册</span>
          <span class="chip">本地进度自动保存</span>
          <span class="chip">仿真实验 · 闪卡 · 章测</span>
        </div>
      </div>
      <div class="card coverage-card">
        <h3>内容完整度说明</h3>
        <p style="font-size:14px;margin-top:6px">这是<strong>考点精华与扩充学习站</strong>，不是教材逐页原文。</p>
        <ul style="margin-top:10px;font-size:14px">
          <li><strong>已覆盖：</strong>上册主干力学、5 类仿真实验、章测 + 综合测、典型例题、易错闪卡</li>
          <li><strong>非目标：</strong>课后习题全解、实验报告模板、各版本页码对齐</li>
          <li><strong>建议用法：</strong>预习抓概念 → 拖滑块做实验 → 章测查漏 → 考前刷例题与闪卡</li>
        </ul>
      </div>
      <div class="section-title"><span class="num">★</span>选择章节</div>
      <div class="home-grid">${cards}</div>
      <div class="card" style="margin-top:24px">
        <h3>怎么用？</h3>
        <ol class="steps">
          <li>按顺序学完主线四章，每章做仿真与测验</li>
          <li>再做典型例题分步与易错闪卡</li>
          <li>最后挑战综合自测，均分目标 ≥ 80%</li>
          <li>进度保存在本机浏览器，可随时继续</li>
        </ol>
      </div>
    `;
  }

  function bindHomeCards() {
    $$(".home-card").forEach((btn) => {
      btn.addEventListener("click", () => navigate(btn.dataset.id));
    });
  }

  function renderChapter(ch) {
    const tags = (ch.tags || []).map((t) => `<span class="tag">${t}</span>`).join("");
    let html = `
      <div class="hero">
        <h2>${ch.icon} ${ch.title}</h2>
        <p>${ch.summary || ""}</p>
        <div class="hero-meta tag-row">${tags}</div>
      </div>
    `;

    ch.sections.forEach((sec, i) => {
      html += `
        <div class="section-title"><span class="num">${i + 1}</span>${sec.title}</div>
        <div class="card">${sec.body}</div>
      `;
      if (sec.lab) html += renderLab(sec.lab);
    });

    if (ch.quiz && ch.quiz.length) {
      html += `
        <div class="section-title"><span class="num">测</span>章节测验</div>
        <div id="quizArea">${renderQuizHTML(ch.quiz)}</div>
        <div id="quizResult"></div>
      `;
    }

    const idx = CHAPTERS.findIndex((c) => c.id === ch.id);
    const prev = CHAPTERS[idx - 1];
    const next = CHAPTERS[idx + 1];
    html += `
      <div class="chapter-nav">
        <button class="btn btn-secondary" id="btnPrev" ${prev ? "" : "disabled"}>
          ← ${prev ? prev.title : "没有了"}
        </button>
        <button class="btn btn-primary" id="btnMark">标记本章已学 ✓</button>
        <button class="btn btn-secondary" id="btnNext" ${next ? "" : "disabled"}>
          ${next ? next.title : "没有了"} →
        </button>
      </div>
    `;
    return html;
  }

  function bindChapterNav(ch) {
    const idx = CHAPTERS.findIndex((c) => c.id === ch.id);
    $("#btnPrev")?.addEventListener("click", () => {
      if (CHAPTERS[idx - 1]) navigate(CHAPTERS[idx - 1].id);
    });
    $("#btnNext")?.addEventListener("click", () => {
      if (CHAPTERS[idx + 1]) navigate(CHAPTERS[idx + 1].id);
    });
    $("#btnMark")?.addEventListener("click", () => {
      markDone(ch.id);
      toast("已标记「" + ch.title + "」为学完");
    });
  }

  function renderExam(ch) {
    return `
      <div class="hero">
        <h2>${ch.icon} ${ch.title}</h2>
        <p>${ch.summary} 共 ${EXAM_QUIZ.length} 题，覆盖各章核心考点。</p>
      </div>
      <div id="quizArea">${renderQuizHTML(EXAM_QUIZ)}</div>
      <div id="quizResult"></div>
      <div class="chapter-nav">
        <button class="btn btn-secondary" id="btnPrev">← 返回首页</button>
        <button class="btn btn-primary" id="btnRetake">重新作答</button>
      </div>
    `;
  }

  /* ---------- 测验 ---------- */
  function renderQuizHTML(quiz) {
    return quiz
      .map(
        (item, i) => `
      <div class="quiz-card" data-qi="${i}">
        <div class="quiz-q">${i + 1}. ${item.q}</div>
        <div class="quiz-opts">
          ${item.opts
            .map(
              (o, j) => `
            <button class="quiz-opt" data-qi="${i}" data-oi="${j}">
              <span class="key">${String.fromCharCode(65 + j)}</span>
              <span>${o}</span>
            </button>`
            )
            .join("")}
        </div>
        <div class="quiz-explain" id="exp-${i}"></div>
      </div>`
      )
      .join("");
  }

  function bindQuiz(chapterId, quiz) {
    const answered = {};
    $$(".quiz-opt").forEach((btn) => {
      btn.addEventListener("click", () => {
        const qi = +btn.dataset.qi;
        const oi = +btn.dataset.oi;
        if (answered[qi] != null) return;

        answered[qi] = oi;
        const item = quiz[qi];
        const correct = oi === item.ans;
        const card = btn.closest(".quiz-card");
        $$(".quiz-opt", card).forEach((b) => {
          b.disabled = true;
          const j = +b.dataset.oi;
          if (j === item.ans) b.classList.add("correct");
          else if (j === oi && !correct) b.classList.add("wrong");
        });

        const exp = $(`#exp-${qi}`);
        exp.innerHTML = (correct ? "✅ 正确！" : "❌ 不对。") + " " + item.exp;
        exp.classList.add("show");

        if (Object.keys(answered).length === quiz.length) {
          const right = quiz.filter((q, i) => answered[i] === q.ans).length;
          const score = Math.round((right / quiz.length) * 100);
          state.progress[chapterId] = { done: true, score };
          saveProgress();
          buildNav();
          $("#quizResult").innerHTML = `
            <div class="quiz-result">
              <div class="big">${score}%</div>
              <p style="margin:10px 0 16px;color:var(--muted)">答对 ${right} / ${quiz.length} 题</p>
              <p>${score >= 80 ? "掌握不错，继续保持！" : score >= 60 ? "基本过关，错题建议回看精讲。" : "建议重学本章后再测一次。"}</p>
            </div>
          `;
          toast(`测验完成：${score}%`);
        }
      });
    });

    $("#btnPrev")?.addEventListener("click", () => navigate("home"));
    $("#btnRetake")?.addEventListener("click", () => navigate("exam"));
  }

  /* ---------- Labs HTML ---------- */
  function renderLab(type) {
    const labs = {
      "vt-lab": `
        <div class="lab" data-lab="vt-lab">
          <div class="lab-head"><h3>⚗ v-t 图线实验室</h3><span class="lab-readout" id="vtEq">v = v₀ + at</span></div>
          <div class="lab-controls">
            <div class="control"><label>v₀</label><input type="range" id="vtV0" min="-8" max="12" step="0.5" value="2" /><span class="val" id="vtV0V">2</span></div>
            <div class="control"><label>a</label><input type="range" id="vtA" min="-4" max="4" step="0.2" value="1" /><span class="val" id="vtAV">1</span></div>
            <div class="control"><label>t</label><input type="range" id="vtT" min="1" max="10" step="0.5" value="6" /><span class="val" id="vtTV">6</span></div>
          </div>
          <canvas class="graph" id="vtCanvas" width="640" height="320"></canvas>
          <div class="lab-readout" id="vtInfo">斜率 = a；阴影面积 ≈ 位移</div>
        </div>`,
      freefall: `
        <div class="lab" data-lab="freefall">
          <div class="lab-head"><h3>⚗ 自由落体仿真</h3><span class="lab-readout" id="ffEq">h = ½gt²</span></div>
          <div class="lab-controls">
            <div class="control"><label>高度 h</label><input type="range" id="ffH" min="5" max="80" step="1" value="45" /><span class="val" id="ffHV">45</span></div>
            <div class="control"><label>g</label><input type="range" id="ffG" min="1" max="15" step="0.1" value="9.8" /><span class="val" id="ffGV">9.8</span></div>
            <button class="pill" id="ffPlay" type="button">▶ 下落</button>
            <button class="pill" id="ffReset" type="button">重置</button>
          </div>
          <canvas class="graph" id="ffCanvas" width="640" height="360"></canvas>
          <div class="lab-readout" id="ffInfo">点击下落，观察时间与落地速度</div>
        </div>`,
      "force-compose": `
        <div class="lab" data-lab="force-compose">
          <div class="lab-head"><h3>⚗ 力的合成（平行四边形）</h3><span class="lab-readout" id="fcEq">F = ?</span></div>
          <div class="lab-controls">
            <div class="control"><label>F₁</label><input type="range" id="f1" min="10" max="120" step="1" value="80" /><span class="val" id="f1V">80</span></div>
            <div class="control"><label>F₂</label><input type="range" id="f2" min="10" max="120" step="1" value="60" /><span class="val" id="f2V">60</span></div>
            <div class="control"><label>夹角°</label><input type="range" id="fAng" min="0" max="180" step="1" value="60" /><span class="val" id="fAngV">60</span></div>
          </div>
          <canvas class="graph" id="forceCanvas" width="640" height="360"></canvas>
          <div class="lab-readout" id="forceInfo">拖动滑块观察合力大小与方向</div>
        </div>`,
      "friction-slope": `
        <div class="lab" data-lab="friction-slope">
          <div class="lab-head"><h3>⚗ 斜面摩擦力</h3><span class="lab-readout" id="slEq">a = ?</span></div>
          <div class="lab-controls">
            <div class="control"><label>θ°</label><input type="range" id="slTh" min="0" max="60" step="1" value="30" /><span class="val" id="slThV">30</span></div>
            <div class="control"><label>μ</label><input type="range" id="slMu" min="0" max="1" step="0.02" value="0.3" /><span class="val" id="slMuV">0.3</span></div>
            <div class="control"><label>m</label><input type="range" id="slM" min="0.5" max="5" step="0.1" value="2" /><span class="val" id="slMV">2</span></div>
          </div>
          <canvas class="graph" id="slopeCanvas" width="640" height="320"></canvas>
          <div class="lab-readout" id="slopeInfo">比较 mg sinθ 与 μ mg cosθ 判断是否滑动</div>
        </div>`,
      "newton-fma": `
        <div class="lab" data-lab="newton-fma">
          <div class="lab-head"><h3>⚗ 牛顿第二定律 F = ma</h3><span class="lab-readout" id="nmEq">a = F/m</span></div>
          <div class="lab-controls">
            <div class="control"><label>F</label><input type="range" id="nmF" min="0" max="20" step="0.5" value="6" /><span class="val" id="nmFV">6</span></div>
            <div class="control"><label>m</label><input type="range" id="nmM" min="0.5" max="10" step="0.5" value="2" /><span class="val" id="nmMV">2</span></div>
            <button class="pill" id="nmPlay" type="button">▶ 运动</button>
            <button class="pill" id="nmReset" type="button">重置</button>
          </div>
          <canvas class="graph" id="nmCanvas" width="640" height="280"></canvas>
          <div class="lab-readout" id="nmInfo">水平光滑面：合力 = F，a = F/m</div>
        </div>`,
      flashcard: `
        <div class="lab" data-lab="flashcard">
          <div class="lab-head"><h3>⚗ 知识点闪卡</h3><span class="lab-readout" id="fcProgress">1 / N</span></div>
          <div class="flashcard" id="flashcard" tabindex="0">
            <div class="fc-inner">
              <div class="fc-face fc-front" id="fcFront"></div>
              <div class="fc-face fc-back" id="fcBack"></div>
            </div>
          </div>
          <div class="set-btns" style="margin-top:14px;justify-content:center">
            <button class="pill" id="fcFlip" type="button">翻转</button>
            <button class="pill" id="fcPrev" type="button">上一张</button>
            <button class="pill" id="fcNext" type="button">下一张</button>
            <button class="pill" id="fcShuffle" type="button">打乱</button>
          </div>
          <div class="lab-readout" style="text-align:center;margin-top:8px">点击卡片或按「翻转」查看答案</div>
        </div>`,
    };
    return labs[type] || "";
  }

  function bindLabs() {
    if ($("#vtCanvas")) bindVtLab();
    if ($("#ffCanvas")) bindFreefall();
    if ($("#forceCanvas")) bindForceCompose();
    if ($("#slopeCanvas")) bindFrictionSlope();
    if ($("#nmCanvas")) bindNewton();
    if ($("#flashcard")) bindFlashcard();
  }

  function bindExamples() {
    $$(".example-steps").forEach((el) => {
      const idx = +el.dataset.example;
      const data = typeof EXAMPLES !== "undefined" ? EXAMPLES[idx] : null;
      if (!data) {
        el.innerHTML = "<p style='color:var(--muted)'>暂无步骤数据</p>";
        return;
      }
      let step = 0;
      const renderEx = () => {
        const shown = data.steps
          .slice(0, step)
          .map((s) => `<li>${s}</li>`)
          .join("");
        el.innerHTML = `
          <ol class="steps">${shown}</ol>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary btn-ex-next" type="button">${step >= data.steps.length ? "已全部展开 ✓" : "显示下一步 (" + (step + 1) + "/" + data.steps.length + ")"}</button>
            <button class="btn btn-secondary btn-ex-all" type="button">一次展开全部</button>
            <button class="btn btn-secondary btn-ex-reset" type="button">收起</button>
          </div>
        `;
        el.querySelector(".btn-ex-next").disabled = step >= data.steps.length;
        el.querySelector(".btn-ex-next").addEventListener("click", () => {
          if (step < data.steps.length) {
            step++;
            renderEx();
          }
        });
        el.querySelector(".btn-ex-all").addEventListener("click", () => {
          step = data.steps.length;
          renderEx();
        });
        el.querySelector(".btn-ex-reset").addEventListener("click", () => {
          step = 0;
          renderEx();
        });
      };
      renderEx();
    });
  }

  /* ---------- Canvas helpers ---------- */
  function canvasSetup(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.width;
    const h = canvas.height;
    if (canvas._cssW !== w) {
      /* keep internal resolution from attributes */
    }
    const ctx = canvas.getContext("2d");
    return { ctx, w, h, dpr };
  }

  function clearCanvas(ctx, w, h) {
    const styles = getComputedStyle(document.documentElement);
    const bg = styles.getPropertyValue("--bg").trim() || "#0f1419";
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
  }

  function themeColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      text: s.getPropertyValue("--text").trim() || "#e8eef6",
      muted: s.getPropertyValue("--muted").trim() || "#8b9cb3",
      accent: s.getPropertyValue("--accent2").trim() || "#60a5fa",
      cyan: s.getPropertyValue("--cyan").trim() || "#22d3ee",
      ok: s.getPropertyValue("--ok").trim() || "#22c55e",
      warn: s.getPropertyValue("--warn").trim() || "#f59e0b",
      purple: s.getPropertyValue("--purple").trim() || "#a78bfa",
      border: s.getPropertyValue("--border").trim() || "#2d3f56",
    };
  }

  /* v-t lab */
  function bindVtLab() {
    const canvas = $("#vtCanvas");
    const draw = () => {
      const v0 = +$("#vtV0").value;
      const a = +$("#vtA").value;
      const T = +$("#vtT").value;
      $("#vtV0V").textContent = v0;
      $("#vtAV").textContent = a;
      $("#vtTV").textContent = T;
      const vT = v0 + a * T;
      const x = v0 * T + 0.5 * a * T * T;
      $("#vtEq").textContent = `v=${v0}+${a}t → v(${T})=${vT.toFixed(1)}`;
      $("#vtInfo").textContent = `末速度 v=${vT.toFixed(2)} m/s；位移 x=${x.toFixed(2)} m（图中阴影面积）`;

      const { ctx, w, h } = canvasSetup(canvas);
      clearCanvas(ctx, w, h);
      const c = themeColors();
      const pad = 48;
      const maxT = Math.max(T, 1);
      const maxV = Math.max(Math.abs(v0), Math.abs(vT), 4) * 1.3;

      // axes
      const x0 = pad;
      const y0 = h / 2;
      const xScale = (w - pad * 2) / maxT;
      const yScale = (h / 2 - 20) / maxV;

      ctx.strokeStyle = c.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, y0);
      ctx.lineTo(w - pad / 2, y0);
      ctx.moveTo(pad, 16);
      ctx.lineTo(pad, h - 16);
      ctx.stroke();

      ctx.fillStyle = c.muted;
      ctx.font = "12px sans-serif";
      ctx.fillText("t", w - 28, y0 - 8);
      ctx.fillText("v", pad + 6, 20);

      // area fill
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x0, y0 - v0 * yScale);
      ctx.lineTo(x0 + T * xScale, y0 - vT * yScale);
      ctx.lineTo(x0 + T * xScale, y0);
      ctx.closePath();
      ctx.fillStyle = "rgba(34, 211, 238, 0.18)";
      ctx.fill();

      // line
      ctx.strokeStyle = c.cyan;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0 - v0 * yScale);
      ctx.lineTo(x0 + T * xScale, y0 - vT * yScale);
      ctx.stroke();

      // endpoints
      ctx.fillStyle = c.accent;
      ctx.beginPath();
      ctx.arc(x0, y0 - v0 * yScale, 4, 0, Math.PI * 2);
      ctx.arc(x0 + T * xScale, y0 - vT * yScale, 4, 0, Math.PI * 2);
      ctx.fill();
    };
    ["vtV0", "vtA", "vtT"].forEach((id) => $(`#${id}`).addEventListener("input", draw));
    draw();
  }

  /* freefall */
  function bindFreefall() {
    const canvas = $("#ffCanvas");
    let anim = null;
    let t = 0;
    let running = false;

    const draw = (yFrac) => {
      const H = +$("#ffH").value;
      const g = +$("#ffG").value;
      $("#ffHV").textContent = H;
      $("#ffGV").textContent = g;
      const tLand = Math.sqrt((2 * H) / g);
      const vLand = g * tLand;
      $("#ffEq").textContent = `t=√(2h/g)≈${tLand.toFixed(2)}s`;

      const { ctx, w, h } = canvasSetup(canvas);
      clearCanvas(ctx, w, h);
      const c = themeColors();
      const groundY = h - 40;
      const topY = 40;
      const trackH = groundY - topY;

      // tower
      ctx.fillStyle = c.border;
      ctx.fillRect(w * 0.35, topY, 8, trackH);
      ctx.fillStyle = c.muted;
      ctx.fillRect(w * 0.25, groundY, w * 0.5, 8);

      const ballY = topY + yFrac * trackH;
      ctx.beginPath();
      ctx.arc(w * 0.35 + 4, ballY, 12, 0, Math.PI * 2);
      ctx.fillStyle = c.warn;
      ctx.fill();

      // trail
      ctx.strokeStyle = "rgba(245,158,11,0.35)";
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(w * 0.35 + 4, topY);
      ctx.lineTo(w * 0.35 + 4, ballY);
      ctx.stroke();
      ctx.setLineDash([]);

      const curT = yFrac * tLand;
      const curV = g * curT;
      const curH = H * (1 - yFrac);
      $("#ffInfo").textContent =
        yFrac >= 1
          ? `落地！t=${tLand.toFixed(2)} s，v=${vLand.toFixed(2)} m/s，h=${H} m`
          : `t≈${curT.toFixed(2)} s　v≈${curV.toFixed(2)} m/s　剩余高度≈${curH.toFixed(1)} m`;
    };

    const tick = (ts) => {
      if (!running) return;
      if (!tick.t0) tick.t0 = ts;
      const H = +$("#ffH").value;
      const g = +$("#ffG").value;
      const tLand = Math.sqrt((2 * H) / g);
      t = (ts - tick.t0) / 1000;
      let yFrac = (0.5 * g * t * t) / H;
      if (yFrac >= 1) {
        yFrac = 1;
        running = false;
        draw(1);
        return;
      }
      draw(yFrac);
      anim = requestAnimationFrame(tick);
    };

    const reset = () => {
      running = false;
      tick.t0 = null;
      if (anim) cancelAnimationFrame(anim);
      draw(0);
    };

    $("#ffPlay").addEventListener("click", () => {
      reset();
      running = true;
      anim = requestAnimationFrame(tick);
    });
    $("#ffReset").addEventListener("click", reset);
    ["ffH", "ffG"].forEach((id) =>
      $(`#${id}`).addEventListener("input", () => {
        if (!running) draw(0);
      })
    );
    draw(0);
  }

  /* force compose */
  function bindForceCompose() {
    const canvas = $("#forceCanvas");
    const draw = () => {
      const F1 = +$("#f1").value;
      const F2 = +$("#f2").value;
      const ang = (+$("#fAng").value * Math.PI) / 180;
      $("#f1V").textContent = F1;
      $("#f2V").textContent = F2;
      $("#fAngV").textContent = $("#fAng").value;

      const F = Math.sqrt(F1 * F1 + F2 * F2 + 2 * F1 * F2 * Math.cos(ang));
      let phi = 0;
      if (F > 1e-6) {
        phi = Math.atan2(F2 * Math.sin(ang), F1 + F2 * Math.cos(ang));
      }
      $("#fcEq").textContent = `F合=${F.toFixed(1)} N`;
      $("#forceInfo").textContent = `合力 F=${F.toFixed(2)} N；相对 F₁ 夹角 ${(
        (phi * 180) /
        Math.PI
      ).toFixed(1)}°`;

      const { ctx, w, h } = canvasSetup(canvas);
      clearCanvas(ctx, w, h);
      const c = themeColors();
      const ox = w * 0.28;
      const oy = h * 0.55;
      const scale = 1.6;

      const drawArrow = (x1, y1, x2, y2, color, label) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        const angA = Math.atan2(y2 - y1, x2 - x1);
        ctx.beginPath();
        ctx.moveTo(x2, y2);
        ctx.lineTo(x2 - 10 * Math.cos(angA - 0.4), y2 - 10 * Math.sin(angA - 0.4));
        ctx.lineTo(x2 - 10 * Math.cos(angA + 0.4), y2 - 10 * Math.sin(angA + 0.4));
        ctx.closePath();
        ctx.fill();
        if (label) {
          ctx.font = "13px sans-serif";
          ctx.fillText(label, x2 + 6, y2 - 6);
        }
      };

      const x1 = ox + F1 * scale;
      const y1 = oy;
      const x2 = ox + F2 * scale * Math.cos(ang);
      const y2 = oy - F2 * scale * Math.sin(ang);
      const xr = ox + F * scale * Math.cos(phi);
      const yr = oy - F * scale * Math.sin(phi);

      // parallelogram ghost
      ctx.strokeStyle = c.border;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x1 + (x2 - ox), y1 + (y2 - oy));
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.setLineDash([]);

      drawArrow(ox, oy, x1, y1, c.accent, "F₁");
      drawArrow(ox, oy, x2, y2, c.purple, "F₂");
      drawArrow(ox, oy, xr, yr, c.ok, "F合");

      ctx.fillStyle = c.muted;
      ctx.beginPath();
      ctx.arc(ox, oy, 4, 0, Math.PI * 2);
      ctx.fill();
    };
    ["f1", "f2", "fAng"].forEach((id) => $(`#${id}`).addEventListener("input", draw));
    draw();
  }

  /* friction slope */
  function bindFrictionSlope() {
    const canvas = $("#slopeCanvas");
    const draw = () => {
      const thDeg = +$("#slTh").value;
      const mu = +$("#slMu").value;
      const m = +$("#slM").value;
      const g = 9.8;
      $("#slThV").textContent = thDeg;
      $("#slMuV").textContent = mu;
      $("#slMV").textContent = m;
      const th = (thDeg * Math.PI) / 180;
      const down = m * g * Math.sin(th);
      const N = m * g * Math.cos(th);
      const fMax = mu * N;
      let a = 0;
      let status = "";
      if (down > fMax + 1e-9) {
        a = (down - fMax) / m;
        status = "滑动 · 有加速度";
      } else {
        a = 0;
        status = thDeg === 0 ? "水平静止" : "静止（静摩擦平衡）";
      }
      $("#slEq").textContent = `a=${a.toFixed(2)} m/s²`;
      $("#slopeInfo").textContent = `${status}　mg sinθ=${down.toFixed(1)} N　fmax=${fMax.toFixed(1)} N　临界角 arctan μ≈${(
        (Math.atan(mu) * 180) /
        Math.PI
      ).toFixed(1)}°`;

      const { ctx, w, h } = canvasSetup(canvas);
      clearCanvas(ctx, w, h);
      const c = themeColors();
      const baseY = h - 36;
      const len = 280;
      const x0 = 80;
      const x1 = x0 + len * Math.cos(th);
      const y1 = baseY - len * Math.sin(th);

      ctx.strokeStyle = c.border;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x0, baseY);
      ctx.lineTo(x0 + 360, baseY);
      ctx.moveTo(x0, baseY);
      ctx.lineTo(x1, y1);
      ctx.stroke();

      // block center on slope
      const mid = 0.45;
      const bx = x0 + len * mid * Math.cos(th);
      const by = baseY - len * mid * Math.sin(th);
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(-th);
      ctx.fillStyle = c.cyan;
      ctx.fillRect(-18, -28, 36, 28);
      ctx.restore();

      // force arrows sketch
      const scale = 2.2;
      const drawF = (dx, dy, color, lab) => {
        ctx.strokeStyle = color;
        ctx.fillStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bx, by - 14);
        ctx.lineTo(bx + dx, by - 14 + dy);
        ctx.stroke();
        ctx.font = "11px sans-serif";
        ctx.fillText(lab, bx + dx + 4, by - 14 + dy);
      };
      drawF(0, 40, c.warn, "G");
      drawF(-Math.sin(th) * fMax * scale * 0.15, -Math.cos(th) * fMax * scale * 0.15, c.purple, "f");
      drawF(Math.sin(th) * 18, -Math.cos(th) * 18, c.ok, "N");
    };
    ["slTh", "slMu", "slM"].forEach((id) => $(`#${id}`).addEventListener("input", draw));
    draw();
  }

  /* newton F=ma */
  function bindNewton() {
    const canvas = $("#nmCanvas");
    let anim = null;
    let running = false;
    let x = 40;
    let v = 0;
    let last = 0;

    const draw = () => {
      const F = +$("#nmF").value;
      const m = +$("#nmM").value;
      $("#nmFV").textContent = F;
      $("#nmMV").textContent = m;
      const a = m > 0 ? F / m : 0;
      $("#nmEq").textContent = `a=${a.toFixed(2)} m/s²`;
      $("#nmInfo").textContent = `F=${F} N，m=${m} kg → a=F/m=${a.toFixed(2)} m/s²；位置 x≈${x.toFixed(1)}（像素演示）`;

      const { ctx, w, h } = canvasSetup(canvas);
      clearCanvas(ctx, w, h);
      const c = themeColors();
      const ground = h - 50;
      ctx.strokeStyle = c.border;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(20, ground);
      ctx.lineTo(w - 20, ground);
      ctx.stroke();

      const bw = 50;
      const bh = 36;
      const bx = Math.min(Math.max(x, 20), w - bw - 20);
      ctx.fillStyle = c.accent;
      ctx.fillRect(bx, ground - bh, bw, bh);
      ctx.fillStyle = c.muted;
      ctx.font = "12px sans-serif";
      ctx.fillText("m", bx + 18, ground - bh - 8);

      // force arrow
      if (F > 0) {
        ctx.strokeStyle = c.ok;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(bx + bw, ground - bh / 2);
        ctx.lineTo(bx + bw + 20 + F * 3, ground - bh / 2);
        ctx.stroke();
        ctx.fillStyle = c.ok;
        ctx.fillText("F", bx + bw + 24 + F * 3, ground - bh / 2 - 6);
      }
    };

    const step = (ts) => {
      if (!running) return;
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      const F = +$("#nmF").value;
      const m = +$("#nmM").value;
      const a = m > 0 ? F / m : 0;
      // map a to pixels: 1 m/s² ~ 40 px/s²
      v += a * 40 * dt;
      x += v * dt;
      if (x > canvas.width - 80) {
        x = canvas.width - 80;
        v = 0;
        running = false;
      }
      draw();
      if (running) anim = requestAnimationFrame(step);
    };

    const reset = () => {
      running = false;
      last = 0;
      x = 40;
      v = 0;
      if (anim) cancelAnimationFrame(anim);
      draw();
    };

    $("#nmPlay").addEventListener("click", () => {
      if (running) return;
      running = true;
      last = 0;
      anim = requestAnimationFrame(step);
    });
    $("#nmReset").addEventListener("click", reset);
    ["nmF", "nmM"].forEach((id) =>
      $(`#${id}`).addEventListener("input", () => {
        if (!running) draw();
        else draw();
      })
    );
    draw();
  }

  /* flashcards */
  function bindFlashcard() {
    let cards = FLASHCARDS.slice();
    let idx = 0;
    let flipped = false;

    const show = () => {
      $("#fcFront").textContent = cards[idx].front;
      $("#fcBack").textContent = cards[idx].back;
      $("#fcProgress").textContent = `${idx + 1} / ${cards.length}`;
      $("#flashcard").classList.toggle("flipped", flipped);
    };

    $("#flashcard").addEventListener("click", () => {
      flipped = !flipped;
      show();
    });
    $("#fcFlip").addEventListener("click", () => {
      flipped = !flipped;
      show();
    });
    $("#fcPrev").addEventListener("click", () => {
      idx = (idx - 1 + cards.length) % cards.length;
      flipped = false;
      show();
    });
    $("#fcNext").addEventListener("click", () => {
      idx = (idx + 1) % cards.length;
      flipped = false;
      show();
    });
    $("#fcShuffle").addEventListener("click", () => {
      for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cards[i], cards[j]] = [cards[j], cards[i]];
      }
      idx = 0;
      flipped = false;
      show();
      toast("已打乱闪卡顺序");
    });
    show();
  }

  /* ---------- 主题 / 初始化 ---------- */
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) document.documentElement.setAttribute("data-theme", saved);
  }

  function init() {
    initTheme();
    buildNav();
    navigate("home");
    updateProgressUI();

    $("#menuBtn")?.addEventListener("click", () => {
      $("#sidebar").classList.toggle("open");
    });
    $("#btnDark")?.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme");
      const next = cur === "light" ? "dark" : "light";
      if (next === "dark") document.documentElement.removeAttribute("data-theme");
      else document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem(THEME_KEY, next === "dark" ? "" : next);
      // re-render labs if visible
      if (state.page !== "home" && state.page !== "exam") {
        const ch = CHAPTERS.find((c) => c.id === state.page);
        if (ch) {
          render();
        }
      }
      toast(next === "light" ? "已切换浅色主题" : "已切换深色主题");
    });
    $("#btnReset")?.addEventListener("click", () => {
      if (confirm("确定重置全部学习进度与测验成绩？")) {
        state.progress = {};
        saveProgress();
        buildNav();
        navigate(state.page);
        toast("进度已重置");
      }
    });
  }

  init();
})();
