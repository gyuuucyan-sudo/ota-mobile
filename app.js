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
            allRooms.push({
                ...window.roomDatabase[roomKey],
                roomKey
            });
        });
    }
}

function normalize(text) {
    return String(text || "").replace(/\s+/g, "").toLowerCase();
}

function extractRoomNumber(text) {
    const match = String(text || "").match(/([1-9][0-9]{2,3})/);
    return match ? match[1] : "";
}

function removeRoomNumber(text) {
    return String(text || "").replace(/([1-9][0-9]{2,3})/g, "").trim();
}

function hasAny(text, words) {
    const t = normalize(text);
    return words.some(w => t.includes(normalize(w)));
}

function getRoomNumber(room) {
    const text = [
        room.roomKey || "",
        room.displayName || "",
        ...(room.aliases || [])
    ].join(" ");

    const match = text.match(/([1-9][0-9]{2,3})/);
    return match ? match[1] : "";
}

function getFloorNumber(room) {
    const roomNumber = getRoomNumber(room);
    if (roomNumber) return roomNumber.charAt(0);

    const floor = String(room.floor || "");
    const match = floor.match(/\d+/);
    return match ? match[0] : "";
}

function floorZh(room) {
    const n = getFloorNumber(room);
    return n ? `${n}楼` : "未登记";
}

function floorJa(room) {
    const n = getFloorNumber(room);
    return n ? `${n}階` : "未登録";
}

function floorEn(room) {
    const n = getFloorNumber(room);
    if (!n) return "Not registered";

    if (n === "1") return "1st floor";
    if (n === "2") return "2nd floor";
    if (n === "3") return "3rd floor";
    return `${n}th floor`;
}

function formatGuestsZh(value) {
    const n = String(value || "").match(/\d+/);
    return n ? `${n[0]}人` : (value || "未登记");
}

function formatGuestsJa(value) {
    const n = String(value || "").match(/\d+/);
    return n ? `${n[0]}名様` : (value || "未登録");
}

function formatGuestsEn(value) {
    const n = String(value || "").match(/\d+/);
    return n ? `${n[0]} guests` : (value || "Not registered");
}

function extractNumber(text, patterns) {
    const source = String(text || "");
    for (const p of patterns) {
        const m = source.match(p);
        if (m && m[1]) return m[1];
    }
    return "";
}

function getDoubleBedCount(room) {
    if (room.doubleBed || room.doubleBeds || room.doubleBedCount || room["双人床"] || room["双人床数量"]) {
        return room.doubleBed || room.doubleBeds || room.doubleBedCount || room["双人床"] || room["双人床数量"];
    }

    const bedding = String(room.bedding || "");
    return extractNumber(bedding, [
        /双人床\s*[x×*]?\s*(\d+)/i,
        /ダブルベッド\s*[x×*]?\s*(\d+)/i,
        /double\s*bed[s]?\s*[x×*]?\s*(\d+)/i,
        /(\d+)\s*张?\s*双人床/i,
        /(\d+)\s*台?\s*ダブルベッド/i,
        /(\d+)\s*double\s*bed[s]?/i
    ]);
}

function getSingleBedCount(room) {
    if (room.singleBed || room.singleBeds || room.singleBedCount || room["单人床"] || room["单人床数量"]) {
        return room.singleBed || room.singleBeds || room.singleBedCount || room["单人床"] || room["单人床数量"];
    }

    const bedding = String(room.bedding || "");
    return extractNumber(bedding, [
        /单人床\s*[x×*]?\s*(\d+)/i,
        /シングルベッド\s*[x×*]?\s*(\d+)/i,
        /single\s*bed[s]?\s*[x×*]?\s*(\d+)/i,
        /(\d+)\s*张?\s*单人床/i,
        /(\d+)\s*台?\s*シングルベッド/i,
        /(\d+)\s*single\s*bed[s]?/i
    ]);
}

function getPillowCount(room) {
    if (room.pillow || room.pillows || room.pillowCount || room["枕头"] || room["枕头数量"]) {
        return room.pillow || room.pillows || room.pillowCount || room["枕头"] || room["枕头数量"];
    }

    const bedding = String(room.bedding || "");
    return extractNumber(bedding, [
        /枕头\s*[x×*]?\s*(\d+)/i,
        /枕\s*[x×*]?\s*(\d+)/i,
        /pillow[s]?\s*[x×*]?\s*(\d+)/i,
        /(\d+)\s*个?\s*枕头/i,
        /(\d+)\s*個?\s*枕/i,
        /(\d+)\s*pillow[s]?/i
    ]);
}

function countZh(value, unit) {
    const n = String(value || "").match(/\d+/);
    if (!n || Number(n[0]) === 0) return "";
    return `${n[0]}${unit}`;
}

function countJa(value, unit) {
    const n = String(value || "").match(/\d+/);
    if (!n || Number(n[0]) === 0) return "";
    return `${n[0]}${unit}`;
}

function countEn(value, singular, plural) {
    const n = String(value || "").match(/\d+/);
    if (!n || Number(n[0]) === 0) return "";
    return `${n[0]} ${Number(n[0]) === 1 ? singular : plural}`;
}

function lineIf(label, value) {
    return value ? `${label}${value}\n` : "";
}

function getSearchType(keyword) {
    if (hasAny(keyword, ["wifi", "wi-fi", "网", "网络", "ネット", "ワイファイ"])) return "wifi";
    if (hasAny(keyword, ["楼", "楼层", "几楼", "階", "floor"])) return "floor";
    if (hasAny(keyword, ["面积", "面積", "広さ", "area"])) return "area";
    if (hasAny(keyword, ["人数", "几人", "可住", "guest", "capacity", "収容人数"])) return "guests";
    if (hasAny(keyword, ["双人床", "double"])) return "doubleBed";
    if (hasAny(keyword, ["单人床", "single", "シングル"])) return "singleBed";
    if (hasAny(keyword, ["枕头", "枕", "pillow"])) return "pillow";
    if (hasAny(keyword, ["床", "寝具", "bed"])) return "bedding";
    if (hasAny(keyword, ["厨房", "キッチン", "kitchen"])) return "kitchen";
    return "summary";
}

function findRooms(keyword) {
    const roomNumber = extractRoomNumber(keyword);
    const pureKeyword = normalize(keyword);

    return allRooms.filter(room => {
        const text = normalize([
            room.roomKey || "",
            room.displayName || "",
            ...(room.aliases || [])
        ].join(" "));

        if (roomNumber) return text.includes(roomNumber);
        return text.includes(pureKeyword);
    });
}

function buildRoomReply(room, originalKeyword) {
    const keywordWithoutRoom = removeRoomNumber(originalKeyword);
    const type = getSearchType(keywordWithoutRoom || originalKeyword);

    const roomName = room.displayName || getRoomNumber(room) || "该房间";

    const doubleZh = countZh(getDoubleBedCount(room), "张");
    const singleZh = countZh(getSingleBedCount(room), "张");
    const pillowZh = countZh(getPillowCount(room), "个");

    const doubleJa = countJa(getDoubleBedCount(room), "台");
    const singleJa = countJa(getSingleBedCount(room), "台");
    const pillowJa = countJa(getPillowCount(room), "個");

    const doubleEn = countEn(getDoubleBedCount(room), "double bed", "double beds");
    const singleEn = countEn(getSingleBedCount(room), "single bed", "single beds");
    const pillowEn = countEn(getPillowCount(room), "pillow", "pillows");

    let title = "房间资料";
    let zh = "";
    let ja = "";
    let en = "";

    if (type === "wifi") {
        title = "Wi-Fi";

        zh =
`您好，感谢咨询。

${roomName} 的 Wi-Fi 信息如下：
Wi-Fi 名称：${room.wifi?.id24 || ""}
Wi-Fi 密码：${room.wifi?.password || ""}`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} のWi-Fi情報は以下の通りでございます。
Wi-Fi名：${room.wifi?.id24 || ""}
パスワード：${room.wifi?.password || ""}`;

        en =
`Hello, thank you for your inquiry.

The Wi-Fi information for ${roomName} is as follows:
Wi-Fi name: ${room.wifi?.id24 || ""}
Password: ${room.wifi?.password || ""}`;
    }

    else if (type === "floor") {
        title = "楼层";

        zh =
`您好，感谢咨询。

${roomName} 位于 ${floorZh(room)}。`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} は ${floorJa(room)} にございます。`;

        en =
`Hello, thank you for your inquiry.

${roomName} is located on the ${floorEn(room)}.`;
    }

    else if (type === "area") {
        title = "面积";

        zh =
`您好，感谢咨询。

${roomName} 的房间面积约为 ${room.area || "未登记"}。`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} のお部屋の広さは約 ${room.area || "未登録"} でございます。`;

        en =
`Hello, thank you for your inquiry.

The room size of ${roomName} is approximately ${room.area || "not registered"}.`;
    }

    else if (type === "guests") {
        title = "可入住人数";

        zh =
`您好，感谢咨询。

${roomName} 最多可入住 ${formatGuestsZh(room.maxGuests)}。`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} の最大宿泊人数は ${formatGuestsJa(room.maxGuests)} でございます。`;

        en =
`Hello, thank you for your inquiry.

The maximum occupancy of ${roomName} is ${formatGuestsEn(room.maxGuests)}.`;
    }

    else if (type === "doubleBed") {
        title = "双人床数量";

        zh =
`您好，感谢咨询。

${roomName} 配有双人床 ${doubleZh || "未登记"}。`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} にはダブルベッドが ${doubleJa || "未登録"} ございます。`;

        en =
`Hello, thank you for your inquiry.

${roomName} has ${doubleEn || "not registered"}.`;
    }

    else if (type === "singleBed") {
        title = "单人床数量";

        if (!singleZh) {
            zh = `您好，感谢咨询。\n\n${roomName} 没有单人床。`;
            ja = `お問い合わせいただき、誠にありがとうございます。\n\n${roomName} にはシングルベッドはございません。`;
            en = `Hello, thank you for your inquiry.\n\n${roomName} does not have single beds.`;
        } else {
            zh = `您好，感谢咨询。\n\n${roomName} 配有单人床 ${singleZh}。`;
            ja = `お問い合わせいただき、誠にありがとうございます。\n\n${roomName} にはシングルベッドが ${singleJa} ございます。`;
            en = `Hello, thank you for your inquiry.\n\n${roomName} has ${singleEn}.`;
        }
    }

    else if (type === "pillow") {
        title = "枕头数量";

        zh =
`您好，感谢咨询。

${roomName} 配有枕头 ${pillowZh || "未登记"}。`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} には枕が ${pillowJa || "未登録"} ございます。`;

        en =
`Hello, thank you for your inquiry.

${roomName} has ${pillowEn || "not registered"}.`;
    }

    else if (type === "bedding") {
        title = "寝具";

        zh =
`您好，感谢咨询。

${roomName} 的床品信息如下：
${lineIf("双人床：", doubleZh)}${lineIf("单人床：", singleZh)}${lineIf("枕头：", pillowZh)}`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} の寝具情報は以下の通りでございます。
${lineIf("ダブルベッド：", doubleJa)}${lineIf("シングルベッド：", singleJa)}${lineIf("枕：", pillowJa)}`;

        en =
`Hello, thank you for your inquiry.

The bedding information for ${roomName} is as follows:
${lineIf("Double beds: ", doubleEn)}${lineIf("Single beds: ", singleEn)}${lineIf("Pillows: ", pillowEn)}`;
    }

    else {
        title = "房间资料";

        zh =
`您好，感谢咨询。

${roomName} 的房间资料如下：
楼层：${floorZh(room)}
面积：${room.area || "未登记"}
可入住人数：${formatGuestsZh(room.maxGuests)}
${lineIf("双人床：", doubleZh)}${lineIf("单人床：", singleZh)}${lineIf("枕头：", pillowZh)}`;

        ja =
`お問い合わせいただき、誠にありがとうございます。

${roomName} のお部屋情報は以下の通りでございます。
階数：${floorJa(room)}
面積：${room.area || "未登録"}
最大宿泊人数：${formatGuestsJa(room.maxGuests)}
${lineIf("ダブルベッド：", doubleJa)}${lineIf("シングルベッド：", singleJa)}${lineIf("枕：", pillowJa)}`;

        en =
`Hello, thank you for your inquiry.

The room information for ${roomName} is as follows:
Floor: ${floorEn(room)}
Area: ${room.area || "not registered"}
Maximum guests: ${formatGuestsEn(room.maxGuests)}
${lineIf("Double beds: ", doubleEn)}${lineIf("Single beds: ", singleEn)}${lineIf("Pillows: ", pillowEn)}`;
    }

    return { title, zh, ja, en };
}

function searchAll() {
    const keyword = searchInput.value.trim();
    searchResults.innerHTML = "";

    if (!keyword) {
        clearContent();
        return;
    }

    const matchedRooms = findRooms(keyword);

    const keywordForRule = removeRoomNumber(keyword).toLowerCase() || keyword.toLowerCase();

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

        return text.includes(keywordForRule);
    });

    if (matchedRooms.length === 0 && matchedRules.length === 0) {
        searchResults.innerHTML = `<div class="empty">没有找到匹配内容</div>`;
        return;
    }

    matchedRooms.forEach(room => {
        const reply = buildRoomReply(room, keyword);

        const btn = document.createElement("button");
        btn.className = "result-btn";

        btn.innerHTML = `
            <strong>🏠 ${room.displayName || getRoomNumber(room)} - ${reply.title}</strong>
            <span>${floorZh(room)} / ${room.area || ""} / ${formatGuestsZh(room.maxGuests)}</span>
        `;

        btn.onclick = () => {
            showRoomReply(room, keyword);
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

function showRoomReply(room, keyword) {
    const reply = buildRoomReply(room, keyword);

    internalReply.innerText =
`房间资料
房间：${room.displayName || getRoomNumber(room)}
当前查询：${reply.title}`;

    jaReply.innerText = reply.ja;
    enReply.innerText = reply.en;
    zhReply.innerText = reply.zh;
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
