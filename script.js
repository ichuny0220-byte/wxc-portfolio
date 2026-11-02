const header = document.querySelector(".site-header");
const contactModal = document.querySelector("#contact-modal");
const contactTriggers = document.querySelectorAll(".contact-trigger");
const contactCloseTargets = document.querySelectorAll("[data-contact-close]");
const revealSections = document.querySelectorAll(
  ".hero, .profile-screen, .catalog-screen, .contact-screen, .project-screen"
);
const quickNavLinks = document.querySelectorAll(".quick-nav a[data-section]");
const navSections = Array.from(
  document.querySelectorAll(".hero, .profile-screen, .catalog-screen, .contact-screen")
).filter(Boolean);
const projectTocLinks = document.querySelectorAll(".project-toc a[href^='#']");
const projectPanels = Array.from(projectTocLinks)
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

document.body.classList.add("reveal-ready");

/* ---------- 联系弹窗 ---------- */
const openContactModal = () => {
  if (!contactModal) return;
  contactModal.classList.add("is-open");
  contactModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("is-modal-open");
};

const closeContactModal = () => {
  if (!contactModal) return;
  contactModal.classList.remove("is-open");
  contactModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
};

contactTriggers.forEach((trigger) => {
  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    openContactModal();
  });
});

contactCloseTargets.forEach((target) => {
  target.addEventListener("click", closeContactModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && contactModal?.classList.contains("is-open")) {
    closeContactModal();
  }
});

/* ---------- 顶部导航背景与高亮 ---------- */
const isProjectPage = Boolean(document.querySelector(".project-screen"));

const syncHeader = () => {
  header.classList.toggle("is-scrolled", isProjectPage || window.scrollY > 24);

  const activeSection = navSections.find((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= window.innerHeight * 0.4 && rect.bottom >= window.innerHeight * 0.4;
  });
  const activeId = activeSection?.id || "home";

  quickNavLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.section === activeId);
  });
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

/* ---------- 滚动淡入 ---------- */
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    // threshold 必须为 0：长页面（如案例页）高度远大于视口，
    // 若用 0.08 这类比例阈值，露出比例永远达不到，整段会一直停在 opacity:0。
    { threshold: 0, rootMargin: "0px 0px -40px 0px" }
  );

  revealSections.forEach((section) => revealObserver.observe(section));
} else {
  revealSections.forEach((section) => section.classList.add("is-revealed"));
}

/* ---------- 项目页目录高亮 ---------- */
const setProjectTocCurrent = (id) => {
  projectTocLinks.forEach((link) => {
    link.classList.toggle("is-current", link.getAttribute("href") === `#${id}`);
  });
};

if ("IntersectionObserver" in window && projectPanels.length && !document.querySelector(".figma-case")) {
  const panelObserver = new IntersectionObserver(
    (entries) => {
      const visiblePanel = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => Math.abs(a.boundingClientRect.top) - Math.abs(b.boundingClientRect.top))[0];

      if (visiblePanel) {
        setProjectTocCurrent(visiblePanel.target.id);
      }
    },
    { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
  );

  projectPanels.forEach((panel) => panelObserver.observe(panel));
}

/* 整图式案例页（.figma-case）：panel 是整屏大图，IntersectionObserver 比例判定不稳，
   改用滚动位置同步目录高亮（35% 视口线为当前章节，页尾锁定最后一节）。 */
if (document.querySelector(".figma-case")) {
  const syncCaseToc = () => {
    const cutoff = window.innerHeight * 0.35;
    const atPageEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    const current = atPageEnd ? projectPanels[projectPanels.length - 1] : projectPanels
      .filter((panel) => panel.getBoundingClientRect().top <= cutoff)
      .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top)[0];
    if (current) setProjectTocCurrent(current.id);
  };
  window.addEventListener("scroll", syncCaseToc, { passive: true });
  window.addEventListener("resize", syncCaseToc);
  syncCaseToc();
}

/* ---------- 指针光效 ---------- */
let pointerFrame = null;

window.addEventListener(
  "pointermove",
  (event) => {
    if (event.pointerType === "touch") return;

    if (pointerFrame) {
      window.cancelAnimationFrame(pointerFrame);
    }

    pointerFrame = window.requestAnimationFrame(() => {
      document.body.classList.add("has-pointer");
      document.documentElement.style.setProperty("--pointer-x", `${event.clientX}px`);
      document.documentElement.style.setProperty("--pointer-y", `${event.clientY}px`);
    });
  },
  { passive: true }
);

window.addEventListener("pointerleave", () => {
  document.body.classList.remove("has-pointer");
});

/* ---------- 作品目录卡片边缘光效 (BorderGlow) ---------- */
const initBorderGlow = () => {
  const cards = document.querySelectorAll(".catalog-card");
  if (!cards.length) return;

  const edgeSensitivity = 30;

  cards.forEach((card) => {
    card.style.setProperty("--bglow-opacity", "0");
    card.style.setProperty("--bglow-x", "50%");
    card.style.setProperty("--bglow-y", "50%");

    const updateGlow = (x, y) => {
      const rect = card.getBoundingClientRect();
      const localX = x - rect.left;
      const localY = y - rect.top;
      const distToLeft = localX;
      const distToRight = rect.width - localX;
      const distToTop = localY;
      const distToBottom = rect.height - localY;
      const minDist = Math.max(0, Math.min(distToLeft, distToRight, distToTop, distToBottom));
      const opacity = minDist < edgeSensitivity ? 1 - minDist / edgeSensitivity : 0;

      card.style.setProperty("--bglow-x", `${localX}px`);
      card.style.setProperty("--bglow-y", `${localY}px`);
      card.style.setProperty("--bglow-opacity", `${opacity.toFixed(3)}`);
    };

    card.addEventListener("mousemove", (event) => {
      updateGlow(event.clientX, event.clientY);
    });

    card.addEventListener("mouseleave", () => {
      card.style.setProperty("--bglow-opacity", "0");
    });
  });
};

initBorderGlow();

/* ---------- 链接与交互自查 ---------- */
(function runLinkAudit() {
  const issues = [];

  // 1. 检查所有锚点链接是否有对应目标
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    const target = document.querySelector(href);
    if (!target) {
      issues.push(`[链接失效] ${link.textContent.trim()} -> ${href}`);
    }
  });

  // 2. 检查所有页面跳转链接是否存在
  document.querySelectorAll('a[href$=".html"], a[href*=".html#"]').forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    const [path] = href.split("#");
    if (path && !document.querySelector(`link[href="${path}"], script[src="${path}"]`)) {
      // 本地环境无法直接验证文件存在，仅输出提示
      console.info(`[页面跳转] ${link.textContent.trim()} -> ${href}`);
    }
  });

  // 3. 检查按钮/卡片是否有点击反馈
  document.querySelectorAll(".catalog-card, .btn-primary, .btn-secondary, .contact-card").forEach((el) => {
    const hasListener = el.onclick || el.getAttribute("href") || el.tagName === "A";
    if (!hasListener) {
      issues.push(`[缺少交互] ${el.className} 没有链接或点击事件`);
    }
  });

  // 4. 检查视频背景是否可播放
  const video = document.querySelector(".hero-bg-video");
  if (video) {
    video.addEventListener("error", () => {
      issues.push("[视频加载失败] hero-bg.mp4 无法播放");
    });
    if (video.readyState < 2) {
      console.warn("[视频提示] hero-bg.mp4 尚未加载完成");
    }
  }

  if (issues.length) {
    console.warn("【作品集自查发现的问题】");
    issues.forEach((issue) => console.warn(issue));
  } else {
    console.log("【作品集自查通过】所有链接与交互检查正常");
  }
})();

/* ---------- 案例整图放大查看（移动端点按看大图） ---------- */
const lbOverlay = document.createElement("div");
lbOverlay.className = "lb-overlay";
lbOverlay.setAttribute("aria-hidden", "true");
lbOverlay.innerHTML =
  '<button aria-label="关闭大图" class="lb-close" type="button">×</button>' +
  '<div class="lb-inner"><img alt="查看大图"></div>';
document.body.appendChild(lbOverlay);
const lbImg = lbOverlay.querySelector("img");
const closeLb = () => {
  lbOverlay.classList.remove("is-open");
  lbOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("is-modal-open");
};
document.querySelectorAll(".figma-figure img").forEach((img) => {
  img.addEventListener("click", () => {
    lbImg.src = img.currentSrc || img.src;
    lbOverlay.classList.add("is-open");
    lbOverlay.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-modal-open");
  });
});
lbOverlay.addEventListener("click", closeLb);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeLb();
});

/* 手机端移除视频背景：部分国产浏览器会按 <video> 注入“网盘/播放器”浮层，遮挡首屏文案 */
(function () {
  const heroVideo = document.querySelector(".hero-bg-video");
  if (heroVideo && window.matchMedia("(max-width: 900px)").matches) {
    heroVideo.remove();
  }
})();

/* 作品集链接一键复制（含不支持 Clipboard API 时的降级） */
(function () {
  const btn = document.querySelector(".site-copy");
  if (!btn) return;
  const tip = btn.querySelector(".site-copy-tip");
  const TIP_OK = "已复制";
  const TIP_FAIL = "复制未成功 · 请长按链接复制";
  let timer = null;
  const done = () => {
    if (tip) tip.textContent = TIP_OK;
    btn.classList.remove("is-fail");
    btn.classList.add("is-copied");
    clearTimeout(timer);
    timer = setTimeout(() => btn.classList.remove("is-copied"), 1600);
  };
  // 同步 execCommand 复制：必须在用户手势调用栈内执行（微信/夸克等内置浏览器最兼容）
  const copySync = (text) => {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(ta);
    const sel = window.getSelection();
    const saved = sel.rangeCount ? sel.getRangeAt(0) : null;
    ta.select();
    ta.setSelectionRange(0, text.length);
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err) {
      ok = false;
    }
    ta.remove();
    if (saved) {
      sel.removeAllRanges();
      sel.addRange(saved);
    }
    return ok;
  };

  const fail = () => {
    // 复制失败：选中链接文本方便长按拷贝，如实提示，不再谎报「已复制」
    const range = document.createRange();
    range.selectNodeContents(btn.querySelector(".site-url"));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    btn.classList.add("is-fail");
    if (tip) tip.textContent = TIP_FAIL;
    clearTimeout(timer);
    timer = setTimeout(() => btn.classList.remove("is-fail"), 2600);
  };

  btn.addEventListener("click", () => {
    const text = btn.dataset.copy || btn.querySelector(".site-url")?.textContent.trim() || "";
    // 1) 同步 execCommand（手势上下文内，兼容性最好）
    if (copySync(text)) {
      done();
      return;
    }
    // 2) Clipboard API 兜底（需安全上下文）
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fail);
      return;
    }
    fail();
  });
})();
