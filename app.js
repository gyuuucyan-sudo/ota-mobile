const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const clearBtn = document.getElementById("clearBtn");

const internalReply = document.getElementById("internalReply");
const jaReply = document.getElementById("jaReply");
const enReply = document.getElementById("enReply");
const zhReply = document.getElementById("zhReply");

let allRules = [];
let allRooms = [];

function initRules() {
    allRules = [];
    allRooms = [];

    if (window.propertyReplyRules) {
        Object.keys(window.propertyReplyRules).forEach(propertyKey => {
            const propertyData = window.propertyReplyRules[propertyKey];

            if (propertyData && Array.isArray(propertyData.rules)) {
                propertyData.rules.forEach(rule => {
                    allRules.push({
                        ...rule,
                        propertyName: propertyData.name || propertyKey
                    });
                });
            }
        });
    }

    if (window.roomDatabase) {
        Object.keys(window.roomDatabase).forEach(roomKey => {
            allRooms.push(window.roomDatabase[roomKey]);
        });
    }
}

function searchAll() {
    const keyword = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";

    if (!keyword) {
        clearContent();
        return;
    }

    const matchedRooms = allRooms.filter(room => {
        const text = [
            room.displayName || "",
            ...(room.aliases || []),
            room.area || "",
            room.floor || "",
            room.bedding || "",
            room.maxGuests || "",
            room.wifi?.id24 || "",
            room.wifi?.id5 || "",
            room.wifi?.password || "",
            room.kitchen || ""
        ].join(" ").toLowerCase();

        return text.includes(keyword);
    });

    const matchedRules = allRules.filter(rule => {
        const text = [
            rule.propertyName || "",
            rule.name || "",
            rule.employeeNoteCN || "",
            ...(rule.keywords || []),
            rule.reply?.ja || "",
            rule.reply?.en || "",
            rule.reply?.zh || ""
        ].join(" ").toLowerCase();

        return text.includes(keyword);
    });

    if (matchedRooms.length === 0 && matchedRules.length === 0) {
        searchResults.innerHTML = `<div class="empty">没有找到匹配内容</div>`;
        return;
    }

    matchedRooms.forEach(room => {
        const btn = document.createElement("button");
        btn.className = "result-btn";

        btn.innerHTML = `
            <strong>🏠 ${room.displayName}</strong>
            <span>${room.floor} / ${room.area} / ${room.maxGuests}</span>
        `;

        btn.onclick = () => {
            showRoom(room);
            searchInput.value = "";
            searchResults.innerHTML = "";
        };

        searchResults.appendChild(btn);
    });

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

function showRoom(room) {
    internalReply.innerText =
`房间资料
房间：${room.displayName}
楼层：${room.floor}
面积：${room.area}
可入住人数：${room.maxGuests}

寝具：
${room.bedding}

Wi-Fi：
2.4G：${room.wifi?.id24 || ""}
5G：${room.wifi?.id5 || ""}
密码：${room.wifi?.password || ""}

厨房用品：
${room.kitchen}`;

    jaReply.innerText =
`お部屋情報でございます。
お部屋：${room.displayName}
階数：${room.floor}
面積：${room.area}
最大宿泊人数：${room.maxGuests}

寝具：${room.bedding}

Wi-Fi：
2.4G：${room.wifi?.id24 || ""}
5G：${room.wifi?.id5 || ""}
パスワード：${room.wifi?.password || ""}`;

    enReply.innerText =
`Room information:
Room: ${room.displayName}
Floor: ${room.floor}
Area: ${room.area}
Maximum guests: ${room.maxGuests}

Bedding: ${room.bedding}

Wi-Fi:
2.4G: ${room.wifi?.id24 || ""}
5G: ${room.wifi?.id5 || ""}
Password: ${room.wifi?.password || ""}`;

    zhReply.innerText =
`房间信息如下：
房间：${room.displayName}
楼层：${room.floor}
面积：${room.area}
可入住人数：${room.maxGuests}

床品：${room.bedding}

Wi-Fi：
2.4G：${room.wifi?.id24 || ""}
5G：${room.wifi?.id5 || ""}
密码：${room.wifi?.password || ""}`;
}

function showRule(rule) {
    let note = "";

    if (rule.employeeNoteCN) note += rule.employeeNoteCN;

    if (rule.internalNote) {
        if (Array.isArray(rule.internalNote)) {
            note += note ? "\n" : "";
            note += rule.internalNote.join("\n");
        } else {
            note += note ? "\n" : "";
            note += rule.internalNote;
        }
    }

    internalReply.innerText = note || "无内部备注";
    jaReply.innerText = rule.reply?.ja || "暂无日语回复";
    enReply.innerText = rule.reply?.en || "暂无英语回复";
    zhReply.innerText = rule.reply?.zh || "暂无中文回复";
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

searchInput.addEventListener("input", searchAll);

document.querySelectorAll(".copy-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const targetId = btn.getAttribute("data-copy");
        const target = document.getElementById(targetId);

        if (!target || !target.innerText.trim()) return;

        navigator.clipboard.writeText(target.innerText);

        btn.innerText = "已复制";
        setTimeout(() => {
            btn.innerText = "复制";
        }, 1000);
    });
});

initRules();
clearContent();