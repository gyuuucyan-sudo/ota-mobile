const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const clearBtn = document.getElementById("clearBtn");

const internalReply = document.getElementById("internalReply");
const jaReply = document.getElementById("jaReply");
const enReply = document.getElementById("enReply");
const zhReply = document.getElementById("zhReply");

let allRules = [];

function initRules() {
    allRules = [];

    if (!window.propertyReplyRules) {
        searchResults.innerHTML = `
            <div class="empty">
                没有读取到 replyRules.js
            </div>
        `;
        return;
    }

    Object.keys(window.propertyReplyRules).forEach(propertyKey => {
        const propertyData = window.propertyReplyRules[propertyKey];

        if (
            propertyData &&
            Array.isArray(propertyData.rules)
        ) {
            propertyData.rules.forEach(rule => {
                allRules.push({
                    ...rule,
                    propertyName:
                        propertyData.name ||
                        propertyKey
                });
            });
        }
    });

    if (allRules.length === 0) {
        searchResults.innerHTML = `
            <div class="empty">
                replyRules.js 里没有找到 rules
            </div>
        `;
    }
}

function searchRules() {
    const keyword = searchInput.value
        .trim()
        .toLowerCase();

    searchResults.innerHTML = "";

    if (!keyword) {
        clearContent();
        return;
    }

    const matchedRules = allRules.filter(rule => {
        const text = [
            rule.propertyName || "",
            rule.name || "",
            rule.employeeNoteCN || "",
            ...(rule.keywords || []),
            rule.reply?.ja || "",
            rule.reply?.en || "",
            rule.reply?.zh || ""
        ]
            .join(" ")
            .toLowerCase();

        return text.includes(keyword);
    });

    if (matchedRules.length === 0) {
        searchResults.innerHTML = `
            <div class="empty">
                没有找到匹配内容
            </div>
        `;
        return;
    }

    matchedRules.forEach(rule => {
        const btn = document.createElement("button");
        btn.className = "result-btn";

        btn.innerHTML = `
            <strong>${rule.name || "未命名规则"}</strong>
            <span>${rule.propertyName || ""}</span>
            <span>${(rule.keywords || []).slice(0, 8).join(" / ")}</span>
        `;

        btn.onclick = () => {
            showRule(rule);

            searchInput.value = "";
            searchResults.innerHTML = "";
        };

        searchResults.appendChild(btn);
    });
}

function showRule(rule) {
    let note = "";

    if (rule.employeeNoteCN) {
        note += rule.employeeNoteCN;
    }

    if (rule.internalNote) {
        if (Array.isArray(rule.internalNote)) {
            note += note ? "\n" : "";
            note += rule.internalNote.join("\n");
        } else {
            note += note ? "\n" : "";
            note += rule.internalNote;
        }
    }

    internalReply.innerText =
        note || "无内部备注";

    jaReply.innerText =
        rule.reply?.ja || "暂无日语回复";

    enReply.innerText =
        rule.reply?.en || "暂无英语回复";

    zhReply.innerText =
        rule.reply?.zh || "暂无中文回复";
}

function clearContent() {
    internalReply.innerText = "请搜索内容";
    jaReply.innerText = "";
    enReply.innerText = "";
    zhReply.innerText = "";
}

clearBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchResults.innerHTML = "";
    clearContent();
});

searchInput.addEventListener("input", searchRules);

document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-copy");
        const target = document.getElementById(targetId);

        if (!target || !target.innerText.trim()) {
            return;
        }

        navigator.clipboard.writeText(target.innerText);

        btn.innerText = "已复制";

        setTimeout(() => {
            btn.innerText = "复制";
        }, 1000);
    });
});

initRules();
clearContent();